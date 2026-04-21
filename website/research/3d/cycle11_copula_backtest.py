#!/usr/bin/env python3
"""Chu Kỳ 11 — Copula-based Joint Digit Model Backtest (Path A, 3D).

Pre-registered in RESEARCH_HISTORY.md Chu Kỳ 11.

3 gates per hypothesis (strategy × product):
  1. Full-sample walk-forward vs Random (Bonferroni K=2 new strats, α=0.025)
  2. Split-half replication (time-ordered midpoint, both halves Δ>0 + p<0.05)
  3. Forward_last_100 (directional Δ>0 required; p<0.05 NOT required due to low power)

Strategies:
  - Random (primary baseline)
  - JointDigitBiasStrategy (mechanism anchor — new candidates must also beat this descriptively)
  - FreqWholeHotStrategy (secondary baseline)
  - GaussianCopulaEmpMargins (new #1)
  - EmpiricalCopula (new #2)

Output: cycle11_copula_results.json
"""
from __future__ import annotations

import json
import random
import sys
import time
from collections import defaultdict
from pathlib import Path

import numpy as np

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR))
sys.path.insert(0, str(THIS_DIR.parent))

from advanced_backtest import (  # noqa: E402
    PRODUCTS_3D,
    FreqWholeHotStrategy,
    JointDigitBiasStrategy,
    RandomStrategy,
    evaluate_prediction,
    load_data,
)
from copula_strategies import (  # noqa: E402
    EmpiricalCopula,
    GaussianCopulaEmpMargins,
)
from _significance import build_significance  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle11_copula_results.json"

# Pre-registered params (RESEARCH_HISTORY Chu Kỳ 11)
BONFERRONI_K = 2  # 2 new candidates vs Random
ALPHA_STRICT = 0.05 / BONFERRONI_K  # 0.025
MIN_HISTORY = 50
N_RUNS = 5
N_PREDICTIONS = 2
SEED = 42
FORWARD_WINDOW = 100


NEW_STRATS = ["GaussianCopulaEmpMargins", "EmpiricalCopula"]
ALL_STRATS_ORDER = [
    "Random",
    "JointDigitBias",
    "FreqWholeHot",
    "GaussianCopulaEmpMargins",
    "EmpiricalCopula",
]


def strategy_factory(name: str):
    """Fresh instance with pre-registered params."""
    if name == "Random":
        return RandomStrategy()
    if name == "JointDigitBias":
        return JointDigitBiasStrategy(lookback=300, temperature=1.0, alpha=1.0)
    if name == "FreqWholeHot":
        return FreqWholeHotStrategy(lookback=200)
    if name == "GaussianCopulaEmpMargins":
        return GaussianCopulaEmpMargins(lookback=300, refit_interval=50, alpha=1.0)
    if name == "EmpiricalCopula":
        return EmpiricalCopula(lookback=300, refit_interval=50, alpha=1.0)
    raise ValueError(f"Unknown strategy: {name}")


def walk_forward_segment(draws, strategy, product_cfg, start_idx, end_idx):
    """Walk-forward on draws[start_idx:end_idx] with growing train (draws[:i])."""
    prizes = product_cfg["prizes"]
    ticket_price = product_cfg["ticket_price"]
    exact_counts = []
    revenues = []
    tier_hit_counts = defaultdict(int)
    total_preds = 0
    t0 = time.time()

    for _run in range(N_RUNS):
        for i in range(start_idx, end_idx):
            train = draws[:i]
            if len(train) < 20:
                continue
            try:
                predicted = strategy.predict(train, N_PREDICTIONS)
                if not predicted:
                    continue
            except Exception:
                continue
            ev = evaluate_prediction(predicted, draws[i], prizes)
            exact_counts.append(ev["exact_count"])
            revenues.append(ev["total_prize"] - ticket_price * N_PREDICTIONS)
            total_preds += 1
            for m in ev["matches"]:
                tier_hit_counts[m["tier"]] += 1

    elapsed = time.time() - t0
    exact_total = sum(exact_counts)
    n_trials = total_preds * N_PREDICTIONS
    exact_rate = exact_total / n_trials * 100 if n_trials else 0.0
    total_cost = total_preds * ticket_price * N_PREDICTIONS
    total_revenue = sum(r + ticket_price * N_PREDICTIONS for r in revenues)
    roi_pct = (total_revenue - total_cost) / total_cost * 100 if total_cost else 0.0

    return {
        "start_idx": start_idx,
        "end_idx": end_idx,
        "total_predictions": total_preds,
        "total_trials": n_trials,
        "exact_matches_total": exact_total,
        "exact_match_rate_pct": round(float(exact_rate), 4),
        "tier_hits": dict(tier_hit_counts),
        "roi_pct": round(float(roi_pct), 2),
        "total_cost": int(total_cost),
        "total_revenue": int(total_revenue),
        "net_profit": int(total_revenue - total_cost),
        "elapsed_seconds": round(elapsed, 2),
    }


def run_segment_all_strategies(draws, product_cfg, start_idx, end_idx, tag: str):
    """Run every strategy in ALL_STRATS_ORDER on one segment; return dict name → segment_result."""
    seg_results: dict = {}
    print(f"\n    --- segment [{tag}] draws [{start_idx}, {end_idx}) ---")
    for name in ALL_STRATS_ORDER:
        random.seed(SEED)
        np.random.seed(SEED)
        strat = strategy_factory(name)
        print(f"      ▸ {name}...", end=" ", flush=True)
        r = walk_forward_segment(draws, strat, product_cfg, start_idx, end_idx)
        print(
            f"exact={r['exact_match_rate_pct']:.3f}%  roi={r['roi_pct']:+.1f}%  "
            f"n_trials={r['total_trials']}  T={r['elapsed_seconds']:.1f}s"
        )
        seg_results[name] = r
    return seg_results


def attach_significance(seg_results: dict, baseline_name: str, k: int):
    """Attach significance block to every non-baseline strategy vs baseline."""
    base = seg_results.get(baseline_name)
    if not base:
        return
    base_hits = base["exact_matches_total"]
    base_n = base["total_trials"]
    for name, r in seg_results.items():
        if name == baseline_name:
            continue
        r[f"sig_vs_{baseline_name}"] = build_significance(
            hits_strat=r["exact_matches_total"],
            n_strat=r["total_trials"],
            hits_baseline=base_hits,
            n_baseline=base_n,
            n_strategies_compared=k,
            baseline_name=baseline_name,
            metric_name="exact_match_rate",
        )


def classify_split_half(sig1: dict, sig2: dict) -> dict:
    """Pre-registered split-half decision (same rule as Chu Kỳ 7)."""
    p1, p2 = sig1["p_value_raw"], sig2["p_value_raw"]
    d1, d2 = sig1["delta_pp"], sig2["delta_pp"]
    both_pos = d1 > 0 and d2 > 0
    if not both_pos:
        return {
            "decision": "Reject",
            "reason": f"direction inconsistent: d1={d1:+.3f}pp, d2={d2:+.3f}pp",
        }
    both_strict = p1 < ALPHA_STRICT and p2 < ALPHA_STRICT
    both_nominal = p1 < 0.05 and p2 < 0.05
    one_nominal = (p1 < 0.05) ^ (p2 < 0.05)
    if both_strict:
        return {"decision": "Accept", "reason": f"both halves p<{ALPHA_STRICT} (p1={p1:.4f}, p2={p2:.4f})"}
    if both_nominal:
        return {"decision": "Suggestive", "reason": f"both halves p<0.05 (p1={p1:.4f}, p2={p2:.4f})"}
    if one_nominal:
        return {"decision": "Inconclusive", "reason": f"one half p<0.05 (p1={p1:.4f}, p2={p2:.4f})"}
    return {"decision": "Reject", "reason": f"neither half p<0.05 (p1={p1:.4f}, p2={p2:.4f})"}


def classify_forward(sig: dict) -> dict:
    """Forward gate per pre-reg: directional Δ>0 required; p<0.05 NOT required (low power)."""
    d = sig["delta_pp"]
    p = sig["p_value_raw"]
    if d <= 0:
        return {"decision": "Reject", "reason": f"forward Δ={d:+.3f}pp ≤ 0"}
    if p < 0.05:
        return {"decision": "Pass-strong", "reason": f"forward Δ={d:+.3f}pp, p={p:.4f} (directional + significant)"}
    return {"decision": "Pass-directional", "reason": f"forward Δ={d:+.3f}pp, p={p:.4f} (directional only — low power acknowledged)"}


def classify_overall(full_sig: dict, split_rep: dict, forward_rep: dict) -> dict:
    """Pre-registered overall decision (stacked across 3 gates)."""
    # Gate 1: full-sample
    full_delta = full_sig["delta_pp"]
    full_p = full_sig["p_value_raw"]
    full_passes_bonf = full_sig["passes_bonferroni"]
    full_ci_lo = full_sig["ci95_lo_pp"]

    # Reject if any gate has Δ ≤ 0
    if full_delta <= 0:
        return {"decision": "Reject", "reason": f"full-sample Δ={full_delta:+.3f}pp ≤ 0"}
    if split_rep["decision"] == "Reject" and "direction inconsistent" in split_rep.get("reason", ""):
        return {"decision": "Reject", "reason": f"split-half direction flip ({split_rep['reason']})"}
    if forward_rep["decision"] == "Reject":
        return {"decision": "Reject", "reason": forward_rep["reason"]}

    # Gate 1 proper classification
    full_accept = full_passes_bonf and full_ci_lo > 0
    full_suggestive = full_p < 0.05 and full_ci_lo > 0 and not full_passes_bonf

    # Combine with split + forward
    if full_accept and split_rep["decision"] == "Accept" and forward_rep["decision"] in ("Pass-strong", "Pass-directional"):
        return {"decision": "Accept", "reason": "all 3 gates pass (full Bonferroni + split-half strict + forward directional)"}
    if full_accept and split_rep["decision"] == "Suggestive" and forward_rep["decision"] in ("Pass-strong", "Pass-directional"):
        return {"decision": "Suggestive", "reason": "full Bonferroni + split-half nominal + forward directional"}
    if full_suggestive and split_rep["decision"] in ("Accept", "Suggestive") and forward_rep["decision"] in ("Pass-strong", "Pass-directional"):
        return {"decision": "Suggestive", "reason": "full nominal + split-half pass + forward directional"}
    if full_p < 0.05 and split_rep["decision"] == "Inconclusive" and forward_rep["decision"] in ("Pass-strong", "Pass-directional"):
        return {"decision": "Inconclusive", "reason": "full nominal + split-half directional only + forward directional"}
    # Default: if we got here and no Reject, likely Inconclusive
    return {
        "decision": "Inconclusive",
        "reason": f"full_p={full_p:.4f} bonf={full_passes_bonf}, split={split_rep['decision']}, forward={forward_rep['decision']}",
    }


def run_product(product_key: str, draws: list) -> dict:
    n = len(draws)
    midpoint = n // 2
    forward_start = n - FORWARD_WINDOW
    product_cfg = PRODUCTS_3D[product_key]

    print(f"\n{'=' * 90}")
    print(f"  PRODUCT: {product_key}  (N={n}, midpoint={midpoint}, forward_start={forward_start})")
    print(f"{'=' * 90}")

    # 3 segments: full-sample, half1, half2, forward
    # Full-sample: [MIN_HISTORY, n)
    # Half1: [MIN_HISTORY, midpoint); Half2: [midpoint, n); Forward: [forward_start, n)
    segments_def = {
        "full": (MIN_HISTORY, n),
        "half1": (MIN_HISTORY, midpoint),
        "half2": (midpoint, n),
        "forward": (forward_start, n),
    }

    all_segments = {}
    for tag, (s, e) in segments_def.items():
        all_segments[tag] = run_segment_all_strategies(draws, product_cfg, s, e, tag)
        attach_significance(all_segments[tag], baseline_name="Random", k=BONFERRONI_K)
        attach_significance(all_segments[tag], baseline_name="JointDigitBias", k=BONFERRONI_K)

    # Per-strategy decision stacking (only for 2 new strats)
    per_strategy_decision = {}
    for sname in NEW_STRATS:
        full_sig = all_segments["full"][sname]["sig_vs_Random"]
        h1_sig = all_segments["half1"][sname]["sig_vs_Random"]
        h2_sig = all_segments["half2"][sname]["sig_vs_Random"]
        fwd_sig = all_segments["forward"][sname]["sig_vs_Random"]

        split_rep = classify_split_half(h1_sig, h2_sig)
        fwd_rep = classify_forward(fwd_sig)
        overall = classify_overall(full_sig, split_rep, fwd_rep)

        # Descriptive: vs JointDigitBias
        full_vs_jdb = all_segments["full"][sname]["sig_vs_JointDigitBias"]

        per_strategy_decision[sname] = {
            "full_sample": {
                "delta_pp": full_sig["delta_pp"],
                "p_value_raw": full_sig["p_value_raw"],
                "passes_bonferroni": full_sig["passes_bonferroni"],
                "ci95_lo_pp": full_sig["ci95_lo_pp"],
                "decision": full_sig["decision"],
            },
            "split_half": {
                "half1_delta_pp": h1_sig["delta_pp"],
                "half1_p": h1_sig["p_value_raw"],
                "half2_delta_pp": h2_sig["delta_pp"],
                "half2_p": h2_sig["p_value_raw"],
                **split_rep,
            },
            "forward_last_100": {
                "delta_pp": fwd_sig["delta_pp"],
                "p_value_raw": fwd_sig["p_value_raw"],
                **fwd_rep,
            },
            "vs_JointDigitBias_full": {
                "delta_pp": full_vs_jdb["delta_pp"],
                "p_value_raw": full_vs_jdb["p_value_raw"],
                "note": "descriptive only — not a gate",
            },
            "overall": overall,
        }

        print(f"\n  → {sname} DECISION: {overall['decision']}  ({overall['reason']})")

    return {
        "product": product_key,
        "n_draws": n,
        "midpoint": midpoint,
        "forward_start": forward_start,
        "segments": all_segments,
        "decisions": per_strategy_decision,
    }


def main():
    random.seed(SEED)
    np.random.seed(SEED)
    t0 = time.time()

    results = {
        "meta": {
            "cycle": "Chu Kỳ 11",
            "path": "A — Copula-based joint digit model",
            "methodology": "3-gate stacked (full-sample + split-half + forward_last_100)",
            "bonferroni_k": BONFERRONI_K,
            "alpha_strict": ALPHA_STRICT,
            "min_history": MIN_HISTORY,
            "n_runs": N_RUNS,
            "n_predictions_per_draw": N_PREDICTIONS,
            "seed": SEED,
            "forward_window": FORWARD_WINDOW,
            "strategies": ALL_STRATS_ORDER,
            "new_strategies": NEW_STRATS,
        },
        "products": {},
    }

    for product_key in ("max_3d", "max_3d_pro"):
        draws = load_data(PRODUCTS_3D[product_key]["file"])
        results["products"][product_key] = run_product(product_key, draws)

    results["meta"]["elapsed_seconds_total"] = round(time.time() - t0, 2)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\n\n{'=' * 90}")
    print(f"  ✓ Results saved to {OUTPUT_FILE}")
    print(f"{'=' * 90}")
    print_summary(results)


def print_summary(results):
    print(f"\n{'SUMMARY — Cycle 11 Copula Strategies':^90}")
    print("─" * 100)
    print(
        f"  {'Product':<12} {'Strategy':<28} {'Full Δpp':>10} {'Full p':>9} {'Split':>14} "
        f"{'Fwd Δpp':>9} {'Overall':>16}"
    )
    print("─" * 100)
    for pkey, pres in results["products"].items():
        for sname in NEW_STRATS:
            dec = pres["decisions"][sname]
            full = dec["full_sample"]
            split = dec["split_half"]
            fwd = dec["forward_last_100"]
            overall = dec["overall"]
            print(
                f"  {pkey:<12} {sname:<28} "
                f"{full['delta_pp']:>+10.3f} {full['p_value_raw']:>9.4f} "
                f"{split['decision']:>14} "
                f"{fwd['delta_pp']:>+9.3f} "
                f"{overall['decision']:>16}"
            )
        print("─" * 100)


if __name__ == "__main__":
    main()

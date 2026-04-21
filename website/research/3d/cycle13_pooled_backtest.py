#!/usr/bin/env python3
"""Chu Kỳ 13 — Cross-Product Pooling Backtest (Path B, 3D).

Pre-registered in RESEARCH_HISTORY.md Chu Kỳ 13.

3-gate protocol (full + split-half + forward_last_100).
Strategies:
  - Random (baseline)
  - JointDigitBias (mechanism anchor — individual-product)
  - FreqWholeHot (secondary baseline)
  - PooledDigitBias (NEW, hard pool)
  - HierarchicalBayesDigit (NEW, soft pool w_own=0.5)

Principle #14 (magnitude check): any claimed |Δ_full| > +1.2pp auto-flags pending audit.

Output: cycle13_pooled_results.json
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
from pooled_strategies import (  # noqa: E402
    HierarchicalBayesDigitStrategy,
    PooledDigitBiasStrategy,
)
from _significance import build_significance  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle13_pooled_results.json"

BONFERRONI_K = 2
ALPHA_STRICT = 0.05 / BONFERRONI_K  # 0.025
MIN_HISTORY = 50
N_RUNS = 5
N_PREDICTIONS = 2
SEED = 42
FORWARD_WINDOW = 100
BIAS_CEILING_PP = 0.4  # per Principle #14 (3D digit-bias ceiling)
MAGNITUDE_FLAG_THRESHOLD_PP = 3 * BIAS_CEILING_PP  # 1.2pp

NEW_STRATS = ["PooledDigitBias", "HierarchicalBayesDigit"]
ALL_STRATS_ORDER = [
    "Random",
    "JointDigitBias",
    "FreqWholeHot",
    "PooledDigitBias",
    "HierarchicalBayesDigit",
]


def strategy_factory(name: str, other_draws: list):
    if name == "Random":
        return RandomStrategy()
    if name == "JointDigitBias":
        return JointDigitBiasStrategy(lookback=300, temperature=1.0, alpha=1.0)
    if name == "FreqWholeHot":
        return FreqWholeHotStrategy(lookback=200)
    if name == "PooledDigitBias":
        return PooledDigitBiasStrategy(
            other_draws=other_draws, lookback_per_product=300,
            temperature=1.0, alpha=1.0,
        )
    if name == "HierarchicalBayesDigit":
        return HierarchicalBayesDigitStrategy(
            other_draws=other_draws, lookback_per_product=300,
            w_own=0.5, temperature=1.0, alpha=1.0,
        )
    raise ValueError(f"Unknown: {name}")


def walk_forward_segment(draws, strategy, product_cfg, start_idx, end_idx):
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
            except Exception as e:
                print(f"        !! predict raised: {e}")
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
        "start_idx": start_idx, "end_idx": end_idx,
        "total_predictions": total_preds, "total_trials": n_trials,
        "exact_matches_total": exact_total,
        "exact_match_rate_pct": round(float(exact_rate), 4),
        "tier_hits": dict(tier_hit_counts),
        "roi_pct": round(float(roi_pct), 2),
        "total_cost": int(total_cost),
        "total_revenue": int(total_revenue),
        "net_profit": int(total_revenue - total_cost),
        "elapsed_seconds": round(elapsed, 2),
    }


def run_segment_all_strategies(draws, other_draws, product_cfg, start_idx, end_idx, tag: str):
    seg: dict = {}
    print(f"\n    --- segment [{tag}] draws [{start_idx}, {end_idx}) ---")
    for name in ALL_STRATS_ORDER:
        random.seed(SEED); np.random.seed(SEED)
        strat = strategy_factory(name, other_draws)
        print(f"      ▸ {name}...", end=" ", flush=True)
        r = walk_forward_segment(draws, strat, product_cfg, start_idx, end_idx)
        print(
            f"exact={r['exact_match_rate_pct']:.3f}%  roi={r['roi_pct']:+.1f}%  "
            f"n={r['total_trials']}  T={r['elapsed_seconds']:.1f}s"
        )
        seg[name] = r
    return seg


def attach_significance(seg_results: dict, baseline_name: str, k: int):
    base = seg_results.get(baseline_name)
    if not base:
        return
    base_hits = base["exact_matches_total"]
    base_n = base["total_trials"]
    for name, r in seg_results.items():
        if name == baseline_name:
            continue
        r[f"sig_vs_{baseline_name}"] = build_significance(
            hits_strat=r["exact_matches_total"], n_strat=r["total_trials"],
            hits_baseline=base_hits, n_baseline=base_n,
            n_strategies_compared=k, baseline_name=baseline_name,
            metric_name="exact_match_rate",
        )


def classify_split_half(sig1: dict, sig2: dict) -> dict:
    p1, p2 = sig1["p_value_raw"], sig2["p_value_raw"]
    d1, d2 = sig1["delta_pp"], sig2["delta_pp"]
    if not (d1 > 0 and d2 > 0):
        return {"decision": "Reject",
                "reason": f"direction inconsistent: d1={d1:+.3f}, d2={d2:+.3f}"}
    if p1 < ALPHA_STRICT and p2 < ALPHA_STRICT:
        return {"decision": "Accept", "reason": f"both p<{ALPHA_STRICT} (p1={p1:.4f}, p2={p2:.4f})"}
    if p1 < 0.05 and p2 < 0.05:
        return {"decision": "Suggestive", "reason": f"both p<0.05 (p1={p1:.4f}, p2={p2:.4f})"}
    if (p1 < 0.05) ^ (p2 < 0.05):
        return {"decision": "Inconclusive", "reason": f"one half p<0.05 (p1={p1:.4f}, p2={p2:.4f})"}
    return {"decision": "Reject", "reason": f"neither p<0.05 (p1={p1:.4f}, p2={p2:.4f})"}


def classify_forward(sig: dict) -> dict:
    d = sig["delta_pp"]; p = sig["p_value_raw"]
    if d <= 0:
        return {"decision": "Reject", "reason": f"forward Δ={d:+.3f}pp ≤ 0"}
    if p < 0.05:
        return {"decision": "Pass-strong", "reason": f"Δ={d:+.3f}pp, p={p:.4f}"}
    return {"decision": "Pass-directional", "reason": f"Δ={d:+.3f}pp, p={p:.4f} (low power)"}


def classify_overall(full_sig: dict, split_rep: dict, forward_rep: dict) -> dict:
    full_delta = full_sig["delta_pp"]
    full_p = full_sig["p_value_raw"]
    full_passes_bonf = full_sig["passes_bonferroni"]
    full_ci_lo = full_sig["ci95_lo_pp"]

    if full_delta <= 0:
        return {"decision": "Reject", "reason": f"full Δ={full_delta:+.3f}pp ≤ 0"}
    if split_rep["decision"] == "Reject" and "direction inconsistent" in split_rep.get("reason", ""):
        return {"decision": "Reject", "reason": f"split direction flip ({split_rep['reason']})"}
    if forward_rep["decision"] == "Reject":
        return {"decision": "Reject", "reason": forward_rep["reason"]}

    # Principle #14 magnitude check
    magnitude_flag = abs(full_delta) > MAGNITUDE_FLAG_THRESHOLD_PP

    full_accept = full_passes_bonf and full_ci_lo > 0
    full_suggestive = full_p < 0.05 and full_ci_lo > 0 and not full_passes_bonf

    if full_accept and split_rep["decision"] == "Accept" and forward_rep["decision"] in ("Pass-strong", "Pass-directional"):
        if magnitude_flag:
            return {"decision": "Ship-with-caveats",
                    "reason": f"all gates pass BUT |Δ|={full_delta:.3f}pp > {MAGNITUDE_FLAG_THRESHOLD_PP}pp (3× bias ceiling, Principle #14 flag)"}
        return {"decision": "Accept", "reason": "all 3 gates pass"}
    if full_accept and split_rep["decision"] == "Suggestive" and forward_rep["decision"] in ("Pass-strong", "Pass-directional"):
        if magnitude_flag:
            return {"decision": "Ship-with-caveats",
                    "reason": f"full Bonferroni + split nominal + forward directional BUT magnitude flagged"}
        return {"decision": "Suggestive", "reason": "full Bonferroni + split nominal + forward directional"}
    if full_suggestive and split_rep["decision"] in ("Accept", "Suggestive") and forward_rep["decision"] in ("Pass-strong", "Pass-directional"):
        return {"decision": "Suggestive", "reason": "full nominal + split pass + forward directional"}
    if full_p < 0.05 and split_rep["decision"] == "Inconclusive" and forward_rep["decision"] in ("Pass-strong", "Pass-directional"):
        return {"decision": "Inconclusive", "reason": "full nominal + split directional + forward directional"}
    return {"decision": "Inconclusive",
            "reason": f"full_p={full_p:.4f} bonf={full_passes_bonf}, split={split_rep['decision']}, forward={forward_rep['decision']}"}


def run_product(product_key: str, draws: list, other_draws: list) -> dict:
    n = len(draws)
    midpoint = n // 2
    forward_start = n - FORWARD_WINDOW
    product_cfg = PRODUCTS_3D[product_key]

    print(f"\n{'=' * 90}")
    print(f"  PRODUCT: {product_key}  (N={n}, midpoint={midpoint}, forward=[{forward_start},{n}))")
    print(f"{'=' * 90}")

    segments_def = {
        "full": (MIN_HISTORY, n),
        "half1": (MIN_HISTORY, midpoint),
        "half2": (midpoint, n),
        "forward": (forward_start, n),
    }

    all_segments = {}
    for tag, (s, e) in segments_def.items():
        all_segments[tag] = run_segment_all_strategies(draws, other_draws, product_cfg, s, e, tag)
        attach_significance(all_segments[tag], baseline_name="Random", k=BONFERRONI_K)
        attach_significance(all_segments[tag], baseline_name="JointDigitBias", k=BONFERRONI_K)

    per_strategy_decision = {}
    for sname in NEW_STRATS:
        full_sig = all_segments["full"][sname]["sig_vs_Random"]
        h1_sig = all_segments["half1"][sname]["sig_vs_Random"]
        h2_sig = all_segments["half2"][sname]["sig_vs_Random"]
        fwd_sig = all_segments["forward"][sname]["sig_vs_Random"]

        split_rep = classify_split_half(h1_sig, h2_sig)
        fwd_rep = classify_forward(fwd_sig)
        overall = classify_overall(full_sig, split_rep, fwd_rep)

        full_vs_jdb = all_segments["full"][sname]["sig_vs_JointDigitBias"]

        per_strategy_decision[sname] = {
            "full_sample": {
                "delta_pp": full_sig["delta_pp"],
                "p_value_raw": full_sig["p_value_raw"],
                "passes_bonferroni": full_sig["passes_bonferroni"],
                "ci95_lo_pp": full_sig["ci95_lo_pp"],
                "decision": full_sig["decision"],
                "magnitude_flag": abs(full_sig["delta_pp"]) > MAGNITUDE_FLAG_THRESHOLD_PP,
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
                "note": "descriptive only (mechanism anchor comparison)",
            },
            "overall": overall,
        }

        print(f"\n  → {sname} DECISION: {overall['decision']}  ({overall['reason']})")

    return {
        "product": product_key, "n_draws": n,
        "midpoint": midpoint, "forward_start": forward_start,
        "segments": all_segments, "decisions": per_strategy_decision,
    }


def main():
    random.seed(SEED); np.random.seed(SEED)
    t0 = time.time()

    # Load both products
    draws_max3d = load_data(PRODUCTS_3D["max_3d"]["file"])
    draws_max3d_pro = load_data(PRODUCTS_3D["max_3d_pro"]["file"])

    results = {
        "meta": {
            "cycle": "Chu Kỳ 13",
            "path": "B — Cross-product pooling",
            "methodology": "3-gate stacked (full + split-half + forward_last_100) + Principle #14 magnitude check",
            "bonferroni_k": BONFERRONI_K,
            "alpha_strict": ALPHA_STRICT,
            "min_history": MIN_HISTORY,
            "n_runs": N_RUNS,
            "n_predictions_per_draw": N_PREDICTIONS,
            "seed": SEED,
            "forward_window": FORWARD_WINDOW,
            "bias_ceiling_pp": BIAS_CEILING_PP,
            "magnitude_flag_threshold_pp": MAGNITUDE_FLAG_THRESHOLD_PP,
            "strategies": ALL_STRATS_ORDER,
            "new_strategies": NEW_STRATS,
            "pool_params": {
                "lookback_per_product": 300,
                "temperature": 1.0,
                "alpha_laplace": 1.0,
                "HierarchicalBayesDigit_w_own": 0.5,
            },
        },
        "products": {},
    }

    # Max 3D — other = Max 3D Pro
    results["products"]["max_3d"] = run_product("max_3d", draws_max3d, draws_max3d_pro)
    # Max 3D Pro — other = Max 3D
    results["products"]["max_3d_pro"] = run_product("max_3d_pro", draws_max3d_pro, draws_max3d)

    results["meta"]["elapsed_seconds_total"] = round(time.time() - t0, 2)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\n\n{'=' * 90}")
    print(f"  ✓ Results saved to {OUTPUT_FILE}")
    print(f"{'=' * 90}")
    print_summary(results)


def print_summary(results):
    print(f"\n{'SUMMARY — Cycle 13 Cross-product pool':^100}")
    print("─" * 110)
    print(f"  {'Product':<12} {'Strategy':<28} {'Full Δpp':>10} {'Full p':>9} {'Split':>14} "
          f"{'Fwd Δpp':>9} {'MagFlag':>8} {'Overall':>18}")
    print("─" * 110)
    for pkey, pres in results["products"].items():
        for sname in NEW_STRATS:
            dec = pres["decisions"][sname]
            full = dec["full_sample"]
            split = dec["split_half"]
            fwd = dec["forward_last_100"]
            overall = dec["overall"]
            mag = "!!FLAG" if full["magnitude_flag"] else "ok"
            print(
                f"  {pkey:<12} {sname:<28} "
                f"{full['delta_pp']:>+10.3f} {full['p_value_raw']:>9.4f} "
                f"{split['decision']:>14} {fwd['delta_pp']:>+9.3f} "
                f"{mag:>8} {overall['decision']:>18}"
            )
        print("─" * 110)


if __name__ == "__main__":
    main()

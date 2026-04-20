#!/usr/bin/env python3
"""
Cycle 7 — Split-Half Replication for 3D Candidates
====================================================

Replicate 2 near-miss strategies from Cycle 6 on held-out halves:
  H1: Max 3D + FreqWholeHot(200)         — full-sample p=0.066
  H2: Max 3D Pro + EVMaximizer(300,100,4) — full-sample p=0.053

Methodology (pre-registered in RESEARCH_HISTORY.md Chu Kỳ 7):
  - Time-ordered split at index N // 2 (no shuffle)
  - Half 1: predict on draws [50, N/2), history = draws[:i]
  - Half 2: predict on draws [N/2, N), history = draws[:i]  (walk-forward, growing train)
  - n_runs=5, n_predictions=2, seed=42
  - Bonferroni K=2, α_strict=0.025
  - Decision per hypothesis: Accept/Suggestive/Inconclusive/Reject by both-half rule

Output: cycle7_replication_results.json
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
    ExpectedValueMaximizer,
    FreqWholeHotStrategy,
    RandomStrategy,
    evaluate_prediction,
    load_data,
)
from _significance import build_significance  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle7_replication_results.json"
BONFERRONI_K = 2
ALPHA_STRICT = 0.05 / BONFERRONI_K  # 0.025

MIN_HISTORY = 50
N_RUNS = 5
N_PREDICTIONS = 2
SEED = 42


def walk_forward_segment(draws, strategy, product_cfg, start_idx, end_idx):
    """Walk-forward on draws[start_idx:end_idx]. History is draws[:i] (growing train)."""
    prizes = product_cfg["prizes"]
    exact_counts = []
    total_preds = 0
    tier_hit_counts = defaultdict(int)
    t0 = time.time()

    for run in range(N_RUNS):
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
            total_preds += 1
            for m in ev["matches"]:
                tier_hit_counts[m["tier"]] += 1

    elapsed = time.time() - t0
    exact_total = sum(exact_counts)
    n_trials = total_preds * N_PREDICTIONS
    exact_rate = exact_total / n_trials * 100 if n_trials else 0.0

    return {
        "start_idx": start_idx,
        "end_idx": end_idx,
        "total_predictions": total_preds,
        "total_trials": n_trials,
        "exact_matches_total": exact_total,
        "exact_match_rate_pct": round(float(exact_rate), 4),
        "tier_hits": dict(tier_hit_counts),
        "elapsed_seconds": round(elapsed, 2),
    }


def run_hypothesis(name, product_key, strategy_factory, draws):
    """Run Random baseline + strategy on half-1 and half-2 separately.

    strategy_factory: callable returning a fresh strategy instance (for seed reset).
    """
    n = len(draws)
    midpoint = n // 2
    product_cfg = PRODUCTS_3D[product_key]

    print(f"\n{'=' * 90}")
    print(f"  {name}: {product_key}  (N={n}, midpoint={midpoint})")
    print(f"{'=' * 90}")

    segments = {
        "half1": (MIN_HISTORY, midpoint),
        "half2": (midpoint, n),
    }

    hypothesis_result = {
        "product": product_key,
        "n_draws": n,
        "midpoint": midpoint,
        "segments": {},
    }

    for seg_name, (s_idx, e_idx) in segments.items():
        print(f"\n  — {seg_name}: draws [{s_idx}, {e_idx})")
        seg_result = {"baseline": None, "strategy": None}

        random.seed(SEED)
        np.random.seed(SEED)
        print(f"    ▸ Random baseline...", end=" ", flush=True)
        seg_result["baseline"] = walk_forward_segment(
            draws, RandomStrategy(), product_cfg, s_idx, e_idx
        )
        r = seg_result["baseline"]
        print(
            f"exact={r['exact_match_rate_pct']:.3f}%  n_trials={r['total_trials']}  "
            f"T={r['elapsed_seconds']:.1f}s"
        )

        random.seed(SEED)
        np.random.seed(SEED)
        strat = strategy_factory()
        print(f"    ▸ {strat.name}...", end=" ", flush=True)
        seg_result["strategy"] = walk_forward_segment(
            draws, strat, product_cfg, s_idx, e_idx
        )
        r = seg_result["strategy"]
        print(
            f"exact={r['exact_match_rate_pct']:.3f}%  n_trials={r['total_trials']}  "
            f"T={r['elapsed_seconds']:.1f}s"
        )

        strat_res = seg_result["strategy"]
        base_res = seg_result["baseline"]
        sig = build_significance(
            hits_strat=strat_res["exact_matches_total"],
            n_strat=strat_res["total_trials"],
            hits_baseline=base_res["exact_matches_total"],
            n_baseline=base_res["total_trials"],
            n_strategies_compared=BONFERRONI_K,
            baseline_name="Random",
            metric_name="exact_match_rate",
        )
        seg_result["significance"] = sig
        print(
            f"      Δ={sig['delta_pp']:+.3f}pp  p_raw={sig['p_value_raw']:.4f}  "
            f"CI=[{sig['ci95_lo_pp']:+.3f}, {sig['ci95_hi_pp']:+.3f}]  decision={sig['decision']}"
        )
        hypothesis_result["segments"][seg_name] = seg_result

    h1 = hypothesis_result["segments"]["half1"]["significance"]
    h2 = hypothesis_result["segments"]["half2"]["significance"]
    hypothesis_result["replication"] = classify_replication(h1, h2)
    print(f"\n  REPLICATION DECISION → {hypothesis_result['replication']['decision']}")
    print(f"  Reason: {hypothesis_result['replication']['reason']}")

    return hypothesis_result


def classify_replication(sig1, sig2):
    """Apply the pre-registered 4-state decision rule for split-half replication.

    Binding rule from RESEARCH_HISTORY Chu Kỳ 7 pre-registration:
      - Accept:       both p < 0.025 AND both delta > 0
      - Suggestive:   both p < 0.05  AND both delta > 0 (but not both < 0.025)
      - Inconclusive: exactly one p < 0.05, both delta > 0
      - Reject:       otherwise (including any delta <= 0)
    """
    p1, p2 = sig1["p_value_raw"], sig2["p_value_raw"]
    d1, d2 = sig1["delta_pp"], sig2["delta_pp"]

    both_pos = d1 > 0 and d2 > 0
    if not both_pos:
        return {
            "decision": "Reject",
            "reason": f"direction inconsistent: delta_half1={d1:+.3f}pp, delta_half2={d2:+.3f}pp",
            "half1": {"p": p1, "delta_pp": d1},
            "half2": {"p": p2, "delta_pp": d2},
        }

    both_strict = p1 < ALPHA_STRICT and p2 < ALPHA_STRICT
    both_nominal = p1 < 0.05 and p2 < 0.05
    one_nominal = (p1 < 0.05) ^ (p2 < 0.05)

    if both_strict:
        decision, reason = "Accept", f"both halves pass Bonferroni α={ALPHA_STRICT} (p1={p1:.4f}, p2={p2:.4f})"
    elif both_nominal:
        decision, reason = "Suggestive", f"both halves p<0.05 but not both <{ALPHA_STRICT} (p1={p1:.4f}, p2={p2:.4f})"
    elif one_nominal:
        decision, reason = "Inconclusive", f"one half p<0.05 only (p1={p1:.4f}, p2={p2:.4f})"
    else:
        decision, reason = "Reject", f"neither half p<0.05 (p1={p1:.4f}, p2={p2:.4f})"

    return {
        "decision": decision,
        "reason": reason,
        "half1": {"p": p1, "delta_pp": d1},
        "half2": {"p": p2, "delta_pp": d2},
        "alpha_strict": ALPHA_STRICT,
    }


def main():
    random.seed(SEED)
    np.random.seed(SEED)

    t0 = time.time()
    results = {
        "meta": {
            "cycle": "Chu Kỳ 7",
            "methodology": "split-half time-ordered replication",
            "bonferroni_k": BONFERRONI_K,
            "alpha_strict": ALPHA_STRICT,
            "n_runs": N_RUNS,
            "n_predictions_per_draw": N_PREDICTIONS,
            "seed": SEED,
        },
        "hypotheses": {},
    }

    draws_max3d = load_data(PRODUCTS_3D["max_3d"]["file"])
    results["hypotheses"]["H1_max3d_FreqWholeHot"] = run_hypothesis(
        name="H1",
        product_key="max_3d",
        strategy_factory=lambda: FreqWholeHotStrategy(200),
        draws=draws_max3d,
    )

    draws_max3d_pro = load_data(PRODUCTS_3D["max_3d_pro"]["file"])
    results["hypotheses"]["H2_max3dpro_EVMaximizer"] = run_hypothesis(
        name="H2",
        product_key="max_3d_pro",
        strategy_factory=lambda: ExpectedValueMaximizer(300, 100, 4),
        draws=draws_max3d_pro,
    )

    results["meta"]["elapsed_seconds_total"] = round(time.time() - t0, 2)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\n\n{'=' * 90}")
    print(f"  ✓ Results saved to {OUTPUT_FILE}")
    print(f"{'=' * 90}")
    print_summary(results)


def print_summary(results):
    print(f"\n{'SUMMARY — Cycle 7 Replication':^90}")
    print("─" * 90)
    print(
        f"  {'Hypothesis':<30} {'Half':<6} {'Strategy%':>10} {'Random%':>9} {'Δpp':>7} "
        f"{'p_raw':>8} {'CI_lo':>7} {'Decision':>13}"
    )
    print("─" * 90)
    for hkey, hres in results["hypotheses"].items():
        for seg in ("half1", "half2"):
            s = hres["segments"][seg]
            sig = s["significance"]
            print(
                f"  {hkey[:30]:<30} {seg:<6} "
                f"{s['strategy']['exact_match_rate_pct']:>10.3f} "
                f"{s['baseline']['exact_match_rate_pct']:>9.3f} "
                f"{sig['delta_pp']:>+7.3f} "
                f"{sig['p_value_raw']:>8.4f} "
                f"{sig['ci95_lo_pp']:>+7.3f} "
                f"{sig['decision']:>13}"
            )
        rep = hres["replication"]
        print(f"  → REPLICATION: {rep['decision']}  ({rep['reason']})")
        print("─" * 90)


if __name__ == "__main__":
    main()

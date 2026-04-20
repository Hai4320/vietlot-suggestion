#!/usr/bin/env python3
"""
Chu Kỳ 9 — Split-Half Replication: Mega 6/45 + ExpDecay_Cold
============================================================

Replicate the strongest remaining Suggestive candidate from Chu kỳ 6 on
held-out halves of Mega 6/45:

  H1: Mega 6/45 + ExpDecay_Cold(half_life=90)  — full-sample p=0.0044

Methodology (pre-registered in RESEARCH_HISTORY.md Chu Kỳ 9):
  - Time-ordered split at index N // 2 (no shuffle; preserve walk-forward)
  - Half 1: predict on draws [MIN_HISTORY, N/2), history = draws[:i]
  - Half 2: predict on draws [N/2, N),         history = draws[:i]  (growing train)
  - Metric: win_rate_ge3 (proportion of predictions matching >= 3 of 6 drawn numbers)
  - Baseline: Random (fresh per half, same seed reset as strategy)
  - n_runs=7 (power analysis: ≥80% power at observed Δ=1.02pp, p_s=2.91% / p_b=1.89%)
  - Bonferroni K=1 (single hypothesis); cross-half Accept threshold α_strict=0.025

Output: cycle9_replication_results.json
"""
from __future__ import annotations

import json
import random
import sys
import time
from pathlib import Path

import numpy as np

THIS_DIR = Path(__file__).resolve().parent
MATRIX_DIR = THIS_DIR.parent
RESEARCH_DIR = MATRIX_DIR.parent

sys.path.insert(0, str(MATRIX_DIR))
sys.path.insert(0, str(RESEARCH_DIR))

from backtest import (  # noqa: E402
    MATRIX_PRODUCTS,
    ExpDecayColdStrategy,
    RandomStrategy,
    load_matrix_data,
)
from _significance import build_significance  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle9_replication_results.json"

# Decision-rule thresholds (pre-registered, binding)
BONFERRONI_K = 1                     # single hypothesis
ALPHA_STRICT_CROSSHALF = 0.025       # per-half threshold for "Accept" (both halves must pass)
ALPHA_NOMINAL = 0.05                 # per-half threshold for "Suggestive"

PRODUCT_KEY = "power_645"
MIN_HISTORY = 100
N_RUNS = 7
SEED = 42


def walk_forward_segment(df, strategy, product_cfg, start_idx, end_idx):
    """Walk-forward evaluation on df.iloc[start_idx:end_idx]. History is df.iloc[:i].

    Iterate per-row (Chu kỳ 6 bug fix: dates.unique() drops multi-draw-per-date products).
    Mega 6/45 has 1 draw/day so equivalent here, but keep consistent with matrix/backtest.py.
    """
    min_val = product_cfg["min_val"]
    max_val = product_cfg["max_val"]
    num_count = product_cfg["num_count"]

    all_matches = []
    t0 = time.time()

    for _run in range(N_RUNS):
        for i in range(start_idx, end_idx):
            target_row = df.iloc[i]
            target_date = target_row["date"]
            train_df = df.iloc[:i]
            if len(train_df) < 30:
                continue
            try:
                predicted = strategy.predict(
                    train_df, target_date, min_val, max_val, num_count
                )
                if not predicted:
                    continue
            except Exception:
                continue
            actual = list(target_row["result"][:num_count])
            m = len(set(predicted) & set(actual))
            all_matches.append(m)

    elapsed = time.time() - t0
    n = len(all_matches)
    wins_ge3 = sum(1 for m in all_matches if m >= 3)
    avg_m = float(np.mean(all_matches)) if all_matches else 0.0
    win_rate_pct = wins_ge3 / n * 100 if n else 0.0

    return {
        "start_idx": int(start_idx),
        "end_idx": int(end_idx),
        "n_draws_segment": int(end_idx - start_idx),
        "total_predictions": int(n),
        "avg_matches": round(avg_m, 4),
        "wins_ge3": int(wins_ge3),
        "win_rate_pct": round(float(win_rate_pct), 4),
        "elapsed_seconds": round(elapsed, 2),
    }


def classify_replication(sig1, sig2):
    """Pre-registered 4-state decision rule (Chu kỳ 9):
      - Accept:       both p < 0.025  AND both delta > 0
      - Suggestive:   both p < 0.05   AND both delta > 0 (but not both < 0.025)
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
            "alpha_strict_crosshalf": ALPHA_STRICT_CROSSHALF,
        }

    both_strict = p1 < ALPHA_STRICT_CROSSHALF and p2 < ALPHA_STRICT_CROSSHALF
    both_nominal = p1 < ALPHA_NOMINAL and p2 < ALPHA_NOMINAL
    one_nominal = (p1 < ALPHA_NOMINAL) ^ (p2 < ALPHA_NOMINAL)

    if both_strict:
        decision = "Accept"
        reason = (
            f"both halves pass cross-half α={ALPHA_STRICT_CROSSHALF} "
            f"(p1={p1:.4f}, p2={p2:.4f})"
        )
    elif both_nominal:
        decision = "Suggestive"
        reason = (
            f"both halves p<0.05 but not both <{ALPHA_STRICT_CROSSHALF} "
            f"(p1={p1:.4f}, p2={p2:.4f})"
        )
    elif one_nominal:
        decision = "Inconclusive"
        reason = f"only one half p<0.05 (p1={p1:.4f}, p2={p2:.4f})"
    else:
        decision = "Reject"
        reason = f"neither half p<0.05 (p1={p1:.4f}, p2={p2:.4f})"

    return {
        "decision": decision,
        "reason": reason,
        "half1": {"p": p1, "delta_pp": d1},
        "half2": {"p": p2, "delta_pp": d2},
        "alpha_strict_crosshalf": ALPHA_STRICT_CROSSHALF,
    }


def run_hypothesis(df, product_cfg):
    n = len(df)
    midpoint = n // 2

    print(f"\n{'=' * 90}")
    print(f"  H1: {PRODUCT_KEY}  (N={n} draws, midpoint={midpoint})")
    print(f"      Strategy: ExpDecay_Cold(half_life=90)")
    print(f"      Baseline: Random")
    print(f"      n_runs={N_RUNS}, min_history={MIN_HISTORY}, seed={SEED}")
    print(f"{'=' * 90}")

    segments = {
        "half1": (MIN_HISTORY, midpoint),
        "half2": (midpoint, n),
    }

    hypothesis_result = {
        "product": PRODUCT_KEY,
        "strategy": "ExpDecay_Cold",
        "strategy_params": {"half_life": 90},
        "baseline": "Random",
        "n_draws": int(n),
        "midpoint": int(midpoint),
        "min_history": int(MIN_HISTORY),
        "n_runs": int(N_RUNS),
        "seed": int(SEED),
        "segments": {},
    }

    for seg_name, (s_idx, e_idx) in segments.items():
        print(f"\n  — {seg_name}: draws [{s_idx}, {e_idx})  ({e_idx - s_idx} draws)")
        seg_result = {}

        random.seed(SEED)
        np.random.seed(SEED)
        print(f"    ▸ Random baseline ...", end=" ", flush=True)
        seg_result["baseline"] = walk_forward_segment(
            df, RandomStrategy(), product_cfg, s_idx, e_idx
        )
        br = seg_result["baseline"]
        print(
            f"win_rate={br['win_rate_pct']:.4f}%  wins={br['wins_ge3']}/{br['total_predictions']}  "
            f"T={br['elapsed_seconds']:.1f}s"
        )

        random.seed(SEED)
        np.random.seed(SEED)
        print(f"    ▸ ExpDecay_Cold(90) ...", end=" ", flush=True)
        seg_result["strategy"] = walk_forward_segment(
            df, ExpDecayColdStrategy(half_life=90), product_cfg, s_idx, e_idx
        )
        sr = seg_result["strategy"]
        print(
            f"win_rate={sr['win_rate_pct']:.4f}%  wins={sr['wins_ge3']}/{sr['total_predictions']}  "
            f"T={sr['elapsed_seconds']:.1f}s"
        )

        sig = build_significance(
            hits_strat=sr["wins_ge3"],
            n_strat=sr["total_predictions"],
            hits_baseline=br["wins_ge3"],
            n_baseline=br["total_predictions"],
            n_strategies_compared=BONFERRONI_K,
            baseline_name="Random",
            metric_name="win_rate_ge3",
        )
        seg_result["significance"] = sig
        print(
            f"      Δ={sig['delta_pp']:+.4f}pp  p_raw={sig['p_value_raw']:.4f}  "
            f"CI=[{sig['ci95_lo_pp']:+.4f}, {sig['ci95_hi_pp']:+.4f}]  "
            f"within-half decision={sig['decision']}"
        )
        hypothesis_result["segments"][seg_name] = seg_result

    h1 = hypothesis_result["segments"]["half1"]["significance"]
    h2 = hypothesis_result["segments"]["half2"]["significance"]
    hypothesis_result["replication"] = classify_replication(h1, h2)
    print(f"\n  REPLICATION DECISION → {hypothesis_result['replication']['decision']}")
    print(f"  Reason: {hypothesis_result['replication']['reason']}")

    return hypothesis_result


def main():
    random.seed(SEED)
    np.random.seed(SEED)
    t0 = time.time()

    df = load_matrix_data(PRODUCT_KEY)
    product_cfg = MATRIX_PRODUCTS[PRODUCT_KEY]

    results = {
        "meta": {
            "cycle": "Chu Kỳ 9",
            "methodology": "split-half time-ordered replication",
            "product": PRODUCT_KEY,
            "bonferroni_k": BONFERRONI_K,
            "alpha_strict_crosshalf": ALPHA_STRICT_CROSSHALF,
            "alpha_nominal": ALPHA_NOMINAL,
            "min_history": MIN_HISTORY,
            "n_runs": N_RUNS,
            "seed": SEED,
            "n_draws_total": int(len(df)),
        },
        "hypotheses": {},
    }

    results["hypotheses"]["H1_mega645_ExpDecayCold90"] = run_hypothesis(df, product_cfg)

    results["meta"]["elapsed_seconds_total"] = round(time.time() - t0, 2)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2, default=str))
    print(f"\n✓ Saved to {OUTPUT_FILE}")
    print(f"Total elapsed: {results['meta']['elapsed_seconds_total']}s")


if __name__ == "__main__":
    main()

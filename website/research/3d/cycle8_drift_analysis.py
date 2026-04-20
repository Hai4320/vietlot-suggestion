#!/usr/bin/env python3
"""
Cycle 8 Phase 1 — Digit Bias Distribution Shift Analysis for Max 3D Pro
=========================================================================

Goal: Test whether digit bias at each position is stable across 3 time windows,
or whether it drifts (which would explain Cycle 7's half-1 p=0.0007 →
half-2 p=0.865 flip for EVMaximizer).

Method (pre-registered in RESEARCH_HISTORY.md Chu Kỳ 8 Phase 1):
  1. Split Max 3D Pro into 3 equal time-ordered windows (~237 draws each).
  2. For each (position, digit) in 3 × 10 = 30 tuples:
     - Count occurrences in each window
     - Chi² homogeneity test across windows (df=2)
  3. Bonferroni K=30, α_strict = 0.00167.
  4. Decision:
     - Shift confirmed: ≥1 tuple p_raw < α_strict
     - Shift not confirmed: none pass Bonferroni

Also reports:
  - Per-window observed frequency vs uniform expected
  - Top 5 tuples by chi² (even if not pass Bonferroni) — indicates direction

Output: cycle8_drift_analysis_results.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from scipy import stats

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR))
sys.path.insert(0, str(THIS_DIR.parent))

from advanced_backtest import PRODUCTS_3D, all_numbers, load_data  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle8_drift_analysis_results.json"
N_WINDOWS = 3
BONFERRONI_K = 30  # 3 positions × 10 digits
ALPHA_STRICT = 0.05 / BONFERRONI_K


def position_digit_counts(draws):
    """Return (3, 10) array of digit counts at each position, plus total_numbers."""
    counts = np.zeros((3, 10), dtype=int)
    total = 0
    for d in draws:
        for num in all_numbers(d):
            for pos in range(3):
                counts[pos, int(num[pos])] += 1
            total += 1
    return counts, total


def analyze_product(product_key):
    cfg = PRODUCTS_3D[product_key]
    draws = load_data(cfg["file"])
    n = len(draws)
    win_size = n // N_WINDOWS
    boundaries = [(i * win_size, (i + 1) * win_size) for i in range(N_WINDOWS - 1)]
    boundaries.append(((N_WINDOWS - 1) * win_size, n))  # last window absorbs remainder

    print(f"\n{'=' * 90}")
    print(f"  {product_key}: N={n} draws, {N_WINDOWS} windows")
    for i, (s, e) in enumerate(boundaries):
        print(f"    W{i + 1}: [{s:4d}, {e:4d})  ({e - s} draws)")
    print(f"{'=' * 90}")

    window_counts = []
    window_totals = []
    for s, e in boundaries:
        counts, total = position_digit_counts(draws[s:e])
        window_counts.append(counts)
        window_totals.append(total)

    per_window_freq = []
    for w, (counts, total) in enumerate(zip(window_counts, window_totals)):
        freq_pct = counts / total * 100
        per_window_freq.append(freq_pct)
        print(f"\n  Window W{w + 1} (n_numbers={total}):")
        print(f"    Position  " + "  ".join(f"d{i}" for i in range(10)))
        for pos in range(3):
            row = "  ".join(f"{freq_pct[pos, d]:4.1f}" for d in range(10))
            print(f"    pos={pos}    " + row)

    per_tuple_results = []
    tuple_fails = []

    for pos in range(3):
        for d in range(10):
            observed = np.array([wc[pos, d] for wc in window_counts])
            totals_arr = np.array(window_totals)
            total_obs = observed.sum()
            total_n = totals_arr.sum()
            p_pooled = total_obs / total_n

            expected = totals_arr * p_pooled
            expected = np.maximum(expected, 1e-9)
            chi2 = float(np.sum((observed - expected) ** 2 / expected))
            df = N_WINDOWS - 1
            p_raw = float(1.0 - stats.chi2.cdf(chi2, df))

            pct_per_win = [observed[i] / totals_arr[i] * 100 for i in range(N_WINDOWS)]
            max_dev_pp = float(max(pct_per_win) - min(pct_per_win))

            tuple_result = {
                "position": pos,
                "digit": d,
                "observed_per_window": [int(x) for x in observed],
                "pct_per_window": [round(x, 4) for x in pct_per_win],
                "pct_pooled": round(p_pooled * 100, 4),
                "max_deviation_pp": round(max_dev_pp, 4),
                "chi2": round(chi2, 4),
                "df": df,
                "p_raw": round(p_raw, 6),
                "passes_bonferroni": p_raw < ALPHA_STRICT,
            }
            per_tuple_results.append(tuple_result)
            if tuple_result["passes_bonferroni"]:
                tuple_fails.append(tuple_result)

    per_tuple_results.sort(key=lambda r: r["chi2"], reverse=True)

    print(f"\n  Top 5 (position, digit) by chi² — homogeneity test across 3 windows:")
    print(f"    {'pos':>3} {'dig':>3}  {'W1%':>6} {'W2%':>6} {'W3%':>6}  {'maxΔ':>6}  "
          f"{'chi²':>8}  {'p_raw':>9}  {'Bonf':>6}")
    for r in per_tuple_results[:5]:
        pct = r["pct_per_window"]
        print(
            f"    {r['position']:>3} {r['digit']:>3}  "
            f"{pct[0]:>6.2f} {pct[1]:>6.2f} {pct[2]:>6.2f}  "
            f"{r['max_deviation_pp']:>6.2f}  "
            f"{r['chi2']:>8.2f}  {r['p_raw']:>9.4f}  "
            f"{'✓' if r['passes_bonferroni'] else '·':>6}"
        )

    shift_confirmed = len(tuple_fails) > 0

    print(f"\n  Bonferroni α_strict = {ALPHA_STRICT:.5f} (K={BONFERRONI_K})")
    print(f"  Tuples passing Bonferroni: {len(tuple_fails)} / {BONFERRONI_K}")
    print(f"  → DECISION: {'SHIFT CONFIRMED' if shift_confirmed else 'SHIFT NOT CONFIRMED (stable)'}")

    if tuple_fails:
        print(f"\n  Tuples with significant drift (p < {ALPHA_STRICT:.5f}):")
        for r in tuple_fails:
            pct = r["pct_per_window"]
            print(
                f"    position={r['position']} digit={r['digit']}: "
                f"W1={pct[0]:.2f}% W2={pct[1]:.2f}% W3={pct[2]:.2f}%  "
                f"(Δmax={r['max_deviation_pp']:.2f}pp, p={r['p_raw']:.5f})"
            )

    return {
        "product": product_key,
        "n_draws": n,
        "n_windows": N_WINDOWS,
        "window_boundaries": boundaries,
        "window_totals": window_totals,
        "bonferroni_k": BONFERRONI_K,
        "alpha_strict": ALPHA_STRICT,
        "shift_confirmed": shift_confirmed,
        "n_tuples_fail_bonferroni": len(tuple_fails),
        "tuples_fail_bonferroni": tuple_fails,
        "top_5_by_chi2": per_tuple_results[:5],
        "all_tuples": per_tuple_results,
        "per_window_freq_pct": [wf.tolist() for wf in per_window_freq],
    }


def main():
    results = {
        "meta": {
            "cycle": "Chu Kỳ 8 Phase 1",
            "methodology": "3-window chi² homogeneity test for digit bias stability",
            "bonferroni_k": BONFERRONI_K,
            "alpha_strict": ALPHA_STRICT,
        },
        "products": {},
    }

    for product_key in ("max_3d_pro", "max_3d"):
        results["products"][product_key] = analyze_product(product_key)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2, ensure_ascii=False, default=float))
    print(f"\n\n{'=' * 90}")
    print(f"  ✓ Results saved to {OUTPUT_FILE}")
    print(f"{'=' * 90}")

    print(f"\n{'PHASE 1 GATE SUMMARY':^90}")
    print("─" * 90)
    for pk, pr in results["products"].items():
        status = "SHIFT CONFIRMED" if pr["shift_confirmed"] else "STABLE (no drift)"
        print(
            f"  {pk:<20}  tuples_fail_Bonf={pr['n_tuples_fail_bonferroni']:>2}/"
            f"{pr['bonferroni_k']}  → {status}"
        )
    print("─" * 90)


if __name__ == "__main__":
    main()

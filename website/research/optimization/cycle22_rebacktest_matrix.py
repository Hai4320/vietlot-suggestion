#!/usr/bin/env python3
"""Chu Kỳ 22 — Re-backtest non-excluded MATRIX strategies with split-half segments.

Pre-reg: proposals/cycle22_optimization_mode.md
Methodology: optimization/MEASUREMENT.md (3 composite profiles + split-half on picks)

Runs 12 non-excluded strategies × 3 products × 4 segments (full/half1/half2/forward).
Output: optimization/cycle22_backtest_matrix.json

Excluded (per MEASUREMENT §4, NOT run here):
  Tier 1: Kelly*, HMM_K2_*, Hybrid_*, HierarchicalEB_Sharp/Lazy, Single_N6
  Tier 2: Adaptive, OnlineBayes λ, Bayesian, Bayes_Sharp, HierarchicalEB(T=1.0)

Inherited params (match cycle14 for reproducibility):
  N_RUNS=5, SEED=42, MIN_HISTORY=100, FORWARD_WINDOW=100
"""
from __future__ import annotations

import json
import random
import sys
import time
from pathlib import Path

import numpy as np

THIS_DIR = Path(__file__).resolve().parent
RESEARCH_DIR = THIS_DIR.parent
MATRIX_DIR = RESEARCH_DIR / "matrix"
sys.path.insert(0, str(MATRIX_DIR))
sys.path.insert(0, str(RESEARCH_DIR))

from backtest import (  # noqa: E402
    MATRIX_PRODUCTS,
    EnsembleBordaStrategy,
    ExpDecayColdStrategy,
    ExpDecayHotStrategy,
    FrequencyColdStrategy,
    FrequencyHotStrategy,
    LongAbsenceStrategy,
    MaxEntropyStrategy,
    MinDistanceStrategy,
    NotRepeatStrategy,
    PairFrequencyStrategy,
    PatternStrategy,
    RandomStrategy,
    load_matrix_data,
)
from _significance import build_significance  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle22_backtest_matrix.json"

N_RUNS = 5
SEED = 42
MIN_HISTORY = 100
FORWARD_WINDOW = 100

PRODUCTS = ["power_655", "power_645", "power_535"]

STRATEGY_ORDER = [
    "Random",
    "Freq_Hot",
    "Freq_Cold",
    "LongAbsence",
    "NotRepeat",
    "Pattern",
    "ExpDecay_Hot",
    "ExpDecay_Cold",
    "PairFreq",
    "MaxEntropy",
    "Ensemble",
    "MinDistance",
]


def make_strategy(name: str):
    if name == "Random":
        return RandomStrategy()
    if name == "Freq_Hot":
        return FrequencyHotStrategy(lookback_days=365, weight=0.8)
    if name == "Freq_Cold":
        return FrequencyColdStrategy(lookback_days=365, weight=0.8)
    if name == "LongAbsence":
        return LongAbsenceStrategy(top_n=15)
    if name == "NotRepeat":
        return NotRepeatStrategy(lookback_days=30, avoid_weight=0.8)
    if name == "Pattern":
        return PatternStrategy(lookback_days=180)
    if name == "ExpDecay_Hot":
        return ExpDecayHotStrategy(half_life=90)
    if name == "ExpDecay_Cold":
        return ExpDecayColdStrategy(half_life=90)
    if name == "PairFreq":
        return PairFrequencyStrategy(lookback_days=365)
    if name == "MaxEntropy":
        return MaxEntropyStrategy(lookback_days=365, prior_strength=1.0)
    if name == "Ensemble":
        return EnsembleBordaStrategy(n_samples=10, randomization=0.1)
    if name == "MinDistance":
        return MinDistanceStrategy(lookback_days=365, n_candidates=50)
    raise ValueError(f"Unknown strategy: {name}")


def walk_forward_segment(df, strategy_name, product_cfg, start_idx, end_idx):
    """Walk-forward on [start_idx, end_idx). Fresh strategy per run."""
    min_val = product_cfg["min_val"]
    max_val = product_cfg["max_val"]
    num_count = product_cfg["num_count"]
    prizes = product_cfg["prizes"]
    ticket_price = product_cfg["ticket_price"]

    all_matches: list[int] = []
    all_revenues: list[float] = []
    t0 = time.time()

    for run in range(N_RUNS):
        strat = make_strategy(strategy_name)
        if hasattr(strat, "_prev"):
            strat._prev = []
        random.seed(SEED + run)
        np.random.seed(SEED + run)
        for i in range(start_idx, end_idx):
            target_row = df.iloc[i]
            target_date = target_row["date"]
            train_df = df.iloc[:i]
            if len(train_df) < 30:
                continue
            try:
                predicted = strat.predict(train_df, target_date, min_val, max_val, num_count)
                if not predicted:
                    continue
            except Exception:
                continue
            actual = list(target_row["result"][:num_count])
            m = len(set(predicted) & set(actual))
            all_matches.append(m)
            all_revenues.append(prizes.get(m, 0) - ticket_price)

    elapsed = time.time() - t0
    if not all_matches:
        return {"error": "No predictions"}

    total_preds = len(all_matches)
    total_cost = total_preds * ticket_price
    total_revenue = sum(prizes.get(m, 0) for m in all_matches)
    wins_ge3 = sum(1 for m in all_matches if m >= 3)
    win_rate_pct = wins_ge3 / total_preds * 100

    profits = np.array(all_revenues, dtype=float)
    sharpe = 0.0
    if len(profits) > 1:
        std = float(np.std(profits, ddof=1))
        if std > 0:
            sharpe = (float(np.mean(profits)) / std) * np.sqrt(52)
    cum = np.cumsum(profits)
    dd = cum - np.maximum.accumulate(cum)

    return {
        "start_idx": start_idx,
        "end_idx": end_idx,
        "total_predictions": total_preds,
        "n_runs": N_RUNS,
        "avg_matches": round(float(np.mean(all_matches)), 4),
        "std_matches": round(float(np.std(all_matches, ddof=1)), 4),
        "win_rate_pct": round(win_rate_pct, 4),
        "wins_ge3": int(wins_ge3),
        "total_cost": int(total_cost),
        "total_revenue": int(total_revenue),
        "net_profit": int(total_revenue - total_cost),
        "roi_pct": round((total_revenue - total_cost) / total_cost * 100, 2) if total_cost else 0.0,
        "sharpe_ratio": round(float(sharpe), 4),
        "max_drawdown": int(abs(float(dd.min()))),
        "elapsed_seconds": round(elapsed, 2),
    }


def attach_significance(seg_results: dict, baseline_name: str, k: int):
    base = seg_results.get(baseline_name)
    if not base or "wins_ge3" not in base:
        return
    base_hits = base["wins_ge3"]
    base_n = base["total_predictions"]
    for name, r in seg_results.items():
        if name == baseline_name or "wins_ge3" not in r:
            continue
        r[f"sig_vs_{baseline_name}"] = build_significance(
            hits_strat=r["wins_ge3"],
            n_strat=r["total_predictions"],
            hits_baseline=base_hits,
            n_baseline=base_n,
            n_strategies_compared=k,
            baseline_name=baseline_name,
            metric_name="win_rate_ge3",
        )


def run_product(product_key: str) -> dict:
    df = load_matrix_data(product_key)
    n = len(df)
    midpoint = n // 2
    forward_start = n - FORWARD_WINDOW
    cfg = MATRIX_PRODUCTS[product_key]

    print(f"\n{'=' * 90}")
    print(f"  MATRIX PRODUCT: {product_key}  (N={n}, midpoint={midpoint}, fwd=[{forward_start},{n}))")
    print(f"{'=' * 90}")

    segments_def = {
        "full": (MIN_HISTORY, n),
        "half1": (MIN_HISTORY, midpoint),
        "half2": (midpoint, n),
        "forward": (forward_start, n),
    }

    segments = {}
    for seg_name, (s, e) in segments_def.items():
        print(f"\n    --- {seg_name}  [{s}, {e}) ---")
        seg: dict = {}
        for strat_name in STRATEGY_ORDER:
            print(f"      ▸ {strat_name:15s}", end=" ", flush=True)
            r = walk_forward_segment(df, strat_name, cfg, s, e)
            if "error" in r:
                print(r["error"])
                seg[strat_name] = r
                continue
            print(
                f"win={r['win_rate_pct']:.3f}%  roi={r['roi_pct']:+.1f}%  "
                f"n={r['total_predictions']}  T={r['elapsed_seconds']:.1f}s"
            )
            seg[strat_name] = r
        # Significance vs Random (k = non-baseline non-excluded strategies = 11)
        attach_significance(seg, "Random", k=len(STRATEGY_ORDER) - 1)
        segments[seg_name] = seg

    return {
        "n_draws": n,
        "midpoint": midpoint,
        "forward_window": FORWARD_WINDOW,
        "segments_def": {k: list(v) for k, v in segments_def.items()},
        "segments": segments,
    }


def main():
    print(f"\n{'#' * 90}")
    print("#  Chu Kỳ 22 — Optimization re-backtest (MATRIX)")
    print(f"#  Strategies: {len(STRATEGY_ORDER)} | Products: {len(PRODUCTS)} | Segments: 4")
    print(f"#  N_RUNS={N_RUNS}, SEED={SEED}, MIN_HISTORY={MIN_HISTORY}, FWD={FORWARD_WINDOW}")
    print(f"{'#' * 90}")

    t_start = time.time()
    results = {
        "cycle": 22,
        "scope": "matrix",
        "mode": "Optimization (non-excluded only, split-half included)",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "pre_reg": "proposals/cycle22_optimization_mode.md",
        "methodology": "optimization/MEASUREMENT.md",
        "constants": {
            "n_runs": N_RUNS,
            "seed": SEED,
            "min_history": MIN_HISTORY,
            "forward_window": FORWARD_WINDOW,
        },
        "strategies": STRATEGY_ORDER,
        "products": {},
    }

    for product_key in PRODUCTS:
        results["products"][product_key] = run_product(product_key)

    results["total_elapsed_seconds"] = round(time.time() - t_start, 2)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2))
    print(f"\n✓ Wrote {OUTPUT_FILE}  (total {results['total_elapsed_seconds']}s)")


if __name__ == "__main__":
    main()

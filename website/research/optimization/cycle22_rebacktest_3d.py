#!/usr/bin/env python3
"""Chu Kỳ 22 — Re-backtest non-excluded 3D strategies with split-half segments.

Pre-reg: proposals/cycle22_optimization_mode.md
Methodology: optimization/MEASUREMENT.md

Runs 17 non-excluded 3D strategies × 2 products × 4 segments.
Output: optimization/cycle22_backtest_3d.json

Excluded (MEASUREMENT §4, NOT run):
  Tier 1: GBMDigitClassifier, HMM_K2_W*
  Tier 2 (3D conservative extension): A3 AdaptBias (×2), C1 BayesJoint (×2)

Inherited params (match advanced_backtest.py for reproducibility):
  N_RUNS=5, SEED=42, MIN_HISTORY=50, N_PREDICTIONS=2, FORWARD_WINDOW=100
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
RESEARCH_DIR = THIS_DIR.parent
THREED_DIR = RESEARCH_DIR / "3d"
sys.path.insert(0, str(THREED_DIR))
sys.path.insert(0, str(RESEARCH_DIR))

from advanced_backtest import (  # noqa: E402
    PRODUCTS_3D,
    ConditionalChainStrategy,
    DigitPairExploiter,
    ExpectedValueMaximizer,
    FreqWholeHotStrategy,
    JointDigitBiasStrategy,
    KLDivergenceMinimizer,
    MinimumCoverageSet,
    MultiSignalEnsemble,
    OptimalTicketPortfolio,
    RandomStrategy,
    StratifiedDigitSampling,
    TierWeightedStrategy,
    UltimateComposite,
    evaluate_prediction,
    load_data,
)
from _significance import build_significance  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle22_backtest_3d.json"

N_RUNS = 5
SEED = 42
MIN_HISTORY = 50
N_PREDICTIONS = 2
FORWARD_WINDOW = 100

# Non-excluded 17 strategies (baseline first for significance):
#   Random (baseline), FreqWholeHot (baseline),
#   A1 JointBias ×2, A2 CondChain ×2,
#   B1 CoverageOpt, B2 TierWeighted, B3 StratifiedDigit,
#   C2 MultiSignal, C3 Portfolio,
#   D1 EVMaximizer, D2 KLMinimizer, D3 PairExploiter ×2,
#   ULTIMATE_v1, ULTIMATE_v2_sharp
STRATEGY_SPECS = [
    ("Random", lambda: RandomStrategy()),
    ("FreqWholeHot", lambda: FreqWholeHotStrategy(200)),
    ("A1: JointBias_T1.0", lambda: JointDigitBiasStrategy(300, 1.0)),
    ("A1: JointBias_T0.7", lambda: JointDigitBiasStrategy(300, 0.7)),
    ("A2: CondChain_T0.8", lambda: ConditionalChainStrategy(300, 0.8)),
    ("A2: CondChain_T0.6", lambda: ConditionalChainStrategy(200, 0.6)),
    ("B1: CoverageOpt", lambda: MinimumCoverageSet(200, 0.5)),
    ("B2: TierWeighted", lambda: TierWeightedStrategy(300, 0.8)),
    ("B3: StratifiedDigit", lambda: StratifiedDigitSampling(200)),
    ("C2: MultiSignal", lambda: MultiSignalEnsemble(300)),
    ("C3: Portfolio", lambda: OptimalTicketPortfolio(300, 0.5)),
    ("D1: EVMaximizer", lambda: ExpectedValueMaximizer(300, 100, 4)),
    ("D2: KLMinimizer", lambda: KLDivergenceMinimizer(200, 0.7)),
    ("D3: PairExploiter_T0.7", lambda: DigitPairExploiter(300, 0.7)),
    ("D3: PairExploiter_T0.5", lambda: DigitPairExploiter(200, 0.5)),
    ("ULTIMATE_v1", lambda: UltimateComposite(300, 100, 0.7, 5)),
    ("ULTIMATE_v2_sharp", lambda: UltimateComposite(200, 80, 0.5, 4)),
]

STRATEGY_ORDER = [name for name, _ in STRATEGY_SPECS]
STRATEGY_FACTORY = {name: factory for name, factory in STRATEGY_SPECS}


def walk_forward_segment(draws, strategy_name, product_cfg, start_idx, end_idx):
    """Walk-forward on [start_idx, end_idx) with fresh strategy per run."""
    prizes = product_cfg["prizes"]
    ticket_price = product_cfg["ticket_price"]

    all_exact_counts: list[int] = []
    all_revenues: list[float] = []
    tier_hits: dict[str, int] = defaultdict(int)
    total_preds = 0
    t0 = time.time()

    for run in range(N_RUNS):
        random.seed(SEED + run)
        np.random.seed(SEED + run)
        strat = STRATEGY_FACTORY[strategy_name]()
        for i in range(start_idx, end_idx):
            train = draws[:i]
            if len(train) < 20:
                continue
            try:
                predicted = strat.predict(train, N_PREDICTIONS)
                if not predicted:
                    continue
            except Exception:
                continue
            ev = evaluate_prediction(predicted, draws[i], prizes)
            all_exact_counts.append(ev["exact_count"])
            rev = ev["total_prize"] - ticket_price * N_PREDICTIONS
            all_revenues.append(rev)
            total_preds += 1
            for m in ev["matches"]:
                tier_hits[m["tier"]] += 1

    elapsed = time.time() - t0
    if total_preds == 0:
        return {"error": "No predictions"}

    total_cost = total_preds * ticket_price * N_PREDICTIONS
    total_revenue = sum(r + ticket_price * N_PREDICTIONS for r in all_revenues)
    exact_total = sum(all_exact_counts)
    total_trials = total_preds * N_PREDICTIONS
    exact_rate = exact_total / total_trials * 100

    profits = np.array(all_revenues, dtype=float)
    sharpe = 0.0
    if len(profits) > 1:
        std = float(np.std(profits, ddof=1))
        if std > 0:
            sharpe = (float(np.mean(profits)) / std) * np.sqrt(52)

    return {
        "start_idx": start_idx,
        "end_idx": end_idx,
        "total_predictions": total_preds,
        "n_runs": N_RUNS,
        "n_predictions_per_draw": N_PREDICTIONS,
        "total_trials": total_trials,
        "exact_match_rate": round(float(exact_rate), 4),
        "exact_matches_total": exact_total,
        "tier_hits": dict(tier_hits),
        "total_cost": int(total_cost),
        "total_revenue": int(total_revenue),
        "net_profit": int(total_revenue - total_cost),
        "roi_pct": round(float((total_revenue - total_cost) / total_cost * 100), 2),
        "sharpe_ratio": round(float(sharpe), 4),
        "elapsed_seconds": round(elapsed, 2),
        "avg_profit_per_draw": round(float(np.mean(all_revenues)), 2),
    }


def attach_significance(seg_results: dict, baseline_name: str, k: int):
    base = seg_results.get(baseline_name)
    if not base or "exact_matches_total" not in base:
        return
    base_hits = base["exact_matches_total"]
    base_n = base["total_trials"]
    for name, r in seg_results.items():
        if name == baseline_name or "exact_matches_total" not in r:
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


def run_product(product_key: str) -> dict:
    cfg = PRODUCTS_3D[product_key]
    draws = load_data(cfg["file"])
    n = len(draws)
    midpoint = n // 2
    forward_start = n - FORWARD_WINDOW

    print(f"\n{'=' * 90}")
    print(f"  3D PRODUCT: {product_key}  (N={n}, midpoint={midpoint}, fwd=[{forward_start},{n}))")
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
            print(f"      ▸ {strat_name:25s}", end=" ", flush=True)
            r = walk_forward_segment(draws, strat_name, cfg, s, e)
            if "error" in r:
                print(r["error"])
                seg[strat_name] = r
                continue
            print(
                f"exact={r['exact_match_rate']:.3f}%  roi={r['roi_pct']:+.1f}%  "
                f"n={r['total_predictions']}  T={r['elapsed_seconds']:.1f}s"
            )
            seg[strat_name] = r
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
    print("#  Chu Kỳ 22 — Optimization re-backtest (3D)")
    print(f"#  Strategies: {len(STRATEGY_ORDER)} | Products: {len(PRODUCTS_3D)} | Segments: 4")
    print(f"#  N_RUNS={N_RUNS}, SEED={SEED}, MIN_HISTORY={MIN_HISTORY}, N_PRED={N_PREDICTIONS}")
    print(f"{'#' * 90}")

    t_start = time.time()
    results = {
        "cycle": 22,
        "scope": "3d",
        "mode": "Optimization (non-excluded only, split-half included)",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "pre_reg": "proposals/cycle22_optimization_mode.md",
        "methodology": "optimization/MEASUREMENT.md",
        "constants": {
            "n_runs": N_RUNS,
            "seed": SEED,
            "min_history": MIN_HISTORY,
            "n_predictions": N_PREDICTIONS,
            "forward_window": FORWARD_WINDOW,
        },
        "strategies": STRATEGY_ORDER,
        "products": {},
    }

    for product_key in ["max_3d", "max_3d_pro"]:
        results["products"][product_key] = run_product(product_key)

    results["total_elapsed_seconds"] = round(time.time() - t_start, 2)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2))
    print(f"\n✓ Wrote {OUTPUT_FILE}  (total {results['total_elapsed_seconds']}s)")


if __name__ == "__main__":
    main()

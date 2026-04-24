#!/usr/bin/env python3
"""Chu Kỳ 22 — 3D Pro CORRECTED re-backtest.

Audit artifact (2026-04-24) per plans/max3d_pro_backtest_audit.md.

Rebacktest max_3d_pro ONLY, with the correct 8-tier + order-sensitive + A=B
doubling evaluator ported to research/3d/p3d_pro_evaluator.py. Everything
else (strategy list, N_RUNS, SEED, segments) is identical to
cycle22_rebacktest_3d.py, so metrics are directly comparable.

N_PREDICTIONS=2 per draw is interpreted as ONE ticket (A, B) matching the
Max 3D Pro semantic (not 2 independent "lottery line" samples). Ticket cost
= 10_000 VND per pair (check_rate/evaluators/base.py: TICKET_COST_VND).

Output: cycle22_backtest_3dpro_corrected.json (separate file; does NOT
overwrite cycle22_backtest_3d.json). Diff to be surfaced in
cycle22_3dpro_audit.md.
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
    load_data,
)
from p3d_pro_evaluator import evaluate_prediction_3dpro  # noqa: E402
from _significance import build_significance  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle22_backtest_3dpro_corrected.json"

N_RUNS = 5
SEED = 42
MIN_HISTORY = 50
N_PREDICTIONS = 2  # paired into 1 ticket (A, B)
FORWARD_WINDOW = 100
TICKET_COST_VND = 10_000  # per (A, B) pair

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


def walk_forward_segment(draws, strategy_name, start_idx, end_idx):
    """Walk-forward on [start_idx, end_idx) with 3D Pro ticket-level evaluator."""
    all_win_counts: list[int] = []
    all_revenues: list[float] = []
    tier_hits: dict[str, int] = defaultdict(int)
    total_tickets = 0
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
                if not predicted or len(predicted) < 2:
                    continue
            except Exception:
                continue
            ev = evaluate_prediction_3dpro(predicted, draws[i])
            n_tickets_this_draw = ev["n_tickets"]
            total_tickets += n_tickets_this_draw
            all_win_counts.append(ev["exact_count"])
            rev = ev["total_prize"] - TICKET_COST_VND * n_tickets_this_draw
            all_revenues.append(rev)
            for m in ev["matches"]:
                tier_hits[m["tier"]] += 1

    elapsed = time.time() - t0
    if total_tickets == 0:
        return {"error": "No tickets"}

    total_cost = total_tickets * TICKET_COST_VND
    # all_revenues entries are net-per-draw (prize − cost); gross = net + total_cost.
    total_gross = sum(all_revenues) + total_cost

    wins_total = sum(all_win_counts)
    win_rate = wins_total / total_tickets * 100  # % of tickets that won ANY tier

    profits = np.array(all_revenues, dtype=float)
    sharpe = 0.0
    if len(profits) > 1:
        std = float(np.std(profits, ddof=1))
        if std > 0:
            sharpe = (float(np.mean(profits)) / std) * np.sqrt(52)

    return {
        "start_idx": start_idx,
        "end_idx": end_idx,
        "total_tickets": total_tickets,
        "n_runs": N_RUNS,
        "n_tickets_per_draw": 1,  # N_PREDICTIONS=2 → 1 pair = 1 ticket
        # Schema kept parallel to cycle22_backtest_3d.json for diffability:
        # - exact_match_rate → ticket_win_rate (% tickets winning ANY tier)
        # - exact_matches_total → wins_total
        # - total_trials → total_tickets
        "ticket_win_rate": round(float(win_rate), 4),
        "exact_match_rate": round(float(win_rate), 4),  # alias for ranking script compat
        "wins_total": wins_total,
        "exact_matches_total": wins_total,
        "total_trials": total_tickets,
        "tier_hits": dict(tier_hits),
        "total_cost": int(total_cost),
        "total_revenue": int(total_gross),
        "net_profit": int(total_gross - total_cost),
        "roi_pct": round(float((total_gross - total_cost) / total_cost * 100), 2),
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
            metric_name="ticket_win_rate",
        )


def run_product(product_key: str) -> dict:
    cfg = PRODUCTS_3D[product_key]
    draws = load_data(cfg["file"])
    n = len(draws)
    midpoint = n // 2
    forward_start = n - FORWARD_WINDOW

    print(f"\n{'=' * 90}")
    print(f"  3D PRO CORRECTED: {product_key}  (N={n}, midpoint={midpoint}, fwd=[{forward_start},{n}))")
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
            print(f"      ▸ {strat_name:28s}", end=" ", flush=True)
            r = walk_forward_segment(draws, strat_name, s, e)
            if "error" in r:
                print(r["error"])
                seg[strat_name] = r
                continue
            print(
                f"win={r['ticket_win_rate']:.3f}%  roi={r['roi_pct']:+.1f}%  "
                f"n={r['total_tickets']}  T={r['elapsed_seconds']:.1f}s"
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
    print("#  Chu Kỳ 22 — 3D Pro CORRECTED re-backtest (audit, plans/max3d_pro_backtest_audit.md)")
    print(f"#  Strategies: {len(STRATEGY_ORDER)} | Product: max_3d_pro | Segments: 4")
    print(f"#  N_RUNS={N_RUNS}, SEED={SEED}, MIN_HISTORY={MIN_HISTORY}, N_PRED={N_PREDICTIONS} (paired)")
    print(f"#  Evaluator: p3d_pro_evaluator.resolve_3d_pro_ticket (8-tier order-sensitive A=B)")
    print(f"{'#' * 90}")

    t_start = time.time()
    results = {
        "cycle": 22,
        "scope": "3d_pro_corrected_audit",
        "mode": "Audit (post-ship correction per plans/max3d_pro_backtest_audit.md)",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "evaluator": "p3d_pro_evaluator.evaluate_prediction_3dpro (8-tier ticket-level)",
        "constants": {
            "n_runs": N_RUNS,
            "seed": SEED,
            "min_history": MIN_HISTORY,
            "n_predictions": N_PREDICTIONS,
            "forward_window": FORWARD_WINDOW,
            "ticket_cost_vnd": TICKET_COST_VND,
        },
        "strategies": STRATEGY_ORDER,
        "products": {},
    }

    results["products"]["max_3d_pro"] = run_product("max_3d_pro")

    results["total_elapsed_seconds"] = round(time.time() - t_start, 2)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2))
    print(f"\n✓ Wrote {OUTPUT_FILE}  (total {results['total_elapsed_seconds']}s)")


if __name__ == "__main__":
    main()

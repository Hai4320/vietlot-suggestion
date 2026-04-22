#!/usr/bin/env python3
"""Chu Kỳ 17 — HMM Regime Detection Backtest (3D products).

Pre-reg: website/research/proposals/executed/cycle17_hmm_regime.md
Principle #16 (Retry Tree): pre-reg §Retry Tree — 6 variants 17.1-17.6.

Strategies:
  - Random (baseline)
  - FreqWholeHot(200) (always-on anchor — HMM must beat this too)
  - HMM_K2_W20(FreqWholeHot/Random) — window=20, signal→FreqWholeHot, noise→Random
  - HMM_K2_W40(FreqWholeHot/Random) — window=40, same mapping

Protocol (cycle13 pattern):
  - Single walk-forward HMM pre-compute per (product, window): regime_lookup[draw_idx] ∈ {0,1,-1}
  - 4 segments via (start_idx, end_idx) on full draws:
      full:       [MIN_HISTORY, N)
      half1:      [MIN_HISTORY, midpoint)
      half2:      [midpoint, N)
      forward:    [N-100, N)
  - Bonferroni K=6 (2 configs × 3 products across cycle) for vs-Random significance
  - vs-FreqWholeHot anchor uses K=1 (relative gate, not project-wide)

Output: cycle17_hmm_results.json + cycle17_hmm_output.log (via tee wrapper)
"""

from __future__ import annotations

import json
import random
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from _significance import build_significance  # noqa: E402
from hmm_regime import (  # noqa: E402
    WalkForwardConfig,
    compute_observation_sequence_3d,
    walk_forward_regime_predict,
)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from advanced_backtest import (  # noqa: E402
    PRODUCTS_3D,
    TIER_ORDER,
    FreqWholeHotStrategy,
    RandomStrategy,
    Strategy3D,
    evaluate_prediction,
    load_data,
)

OUTPUT_DIR = Path(__file__).resolve().parent

MIN_HISTORY = 200
N_RUNS = 5
N_PREDICTIONS = 2
SEED = 42
REFIT_EVERY = 10
HMM_RESTARTS = 10
BONFERRONI_K = 6  # 2 configs × 3 products (project-wide)
WINDOWS = (20, 40)


class HMMRegimeStrategy(Strategy3D):
    """HMM-switched strategy. Driven by external regime_lookup injected pre-loop.

    Not stateless — driver calls set_current_idx(i) before each predict(i).
    """

    def __init__(self, window: int, lookback_freq: int = 200):
        self.window = window
        self.name = f"HMM_K2_W{window}(FreqWholeHot/Random)"
        self.description = (
            f"2-state Gaussian HMM, W={window}, signal→FreqWholeHot({lookback_freq}), noise→Random"
        )
        self.category = "HMM"
        self._freqhot = FreqWholeHotStrategy(lookback_freq)
        self._random = RandomStrategy()
        self._regime_lookup: dict[int, int] | None = None
        self._signal_state_id: int = 1
        self._current_idx: int | None = None

    def set_regime_context(self, regime_lookup: dict[int, int], signal_state_id: int = 1):
        self._regime_lookup = regime_lookup
        self._signal_state_id = signal_state_id

    def set_current_idx(self, idx: int):
        self._current_idx = idx

    def predict(self, train_draws, n_predictions=2):
        if self._regime_lookup is None or self._current_idx is None:
            return self._random.predict(train_draws, n_predictions)
        state = self._regime_lookup.get(self._current_idx, -1)
        if state == self._signal_state_id:
            return self._freqhot.predict(train_draws, n_predictions)
        return self._random.predict(train_draws, n_predictions)


# ---------------------------------------------------------------------------
# Data prep + HMM pre-compute
# ---------------------------------------------------------------------------


def _draws_to_number_lists(draws: list[dict]) -> list[list[int]]:
    out = []
    for d in draws:
        nums = []
        for tier in TIER_ORDER:
            nums.extend(int(n) for n in d["result"].get(tier, []))
        out.append(nums)
    return out


def precompute_hmm_regime(draws: list[dict], window: int) -> tuple[dict[int, int], dict]:
    num_lists = _draws_to_number_lists(draws)
    obs_seq = compute_observation_sequence_3d(num_lists, window=window)
    cfg = WalkForwardConfig(
        window=window,
        min_history=MIN_HISTORY,
        refit_every=REFIT_EVERY,
        n_restart=HMM_RESTARTS,
        seed=SEED,
    )
    wf = walk_forward_regime_predict(obs_seq, cfg)
    states = wf["states_per_draw"]
    signal_flags = wf["signal_states_per_step"]
    min_obs = wf["effective_min_obs"]

    regime_lookup: dict[int, int] = {}
    for step_idx in range(len(states)):
        obs_i = min_obs + step_idx
        draw_idx = obs_i + window
        if states[step_idx] < 0:
            regime_lookup[draw_idx] = -1
        else:
            regime_lookup[draw_idx] = 1 if signal_flags[step_idx] else 0

    return regime_lookup, {
        "concentration": wf["concentration"],
        "n_fits": len(wf["fit_log"]),
        "window": window,
    }


# ---------------------------------------------------------------------------
# Walk-forward segment
# ---------------------------------------------------------------------------


def walk_forward_segment(
    draws: list[dict],
    strategy: Strategy3D,
    product_cfg: dict,
    start_idx: int,
    end_idx: int,
    regime_lookup: dict[int, int] | None = None,
) -> dict:
    """Walk-forward over [start_idx, end_idx) with n_runs repetitions."""
    prizes = product_cfg["prizes"]
    ticket_price = product_cfg["ticket_price"]
    all_exact: list[int] = []
    all_revenues: list[int] = []
    tier_hit_counts: dict[str, int] = defaultdict(int)
    total_preds = 0
    n_signal = 0
    n_noise = 0

    is_hmm = isinstance(strategy, HMMRegimeStrategy)
    if is_hmm and regime_lookup is not None:
        strategy.set_regime_context(regime_lookup, signal_state_id=1)

    t0 = time.time()
    for run in range(N_RUNS):
        rng_seed = SEED + run * 1000
        random.seed(rng_seed)
        np.random.seed(rng_seed)
        for i in range(start_idx, end_idx):
            train = draws[:i]
            if len(train) < 20:
                continue
            if is_hmm:
                strategy.set_current_idx(i)
                if regime_lookup is not None:
                    s = regime_lookup.get(i, -1)
                    if s == 1:
                        n_signal += 1
                    elif s == 0:
                        n_noise += 1
            try:
                pred = strategy.predict(train, N_PREDICTIONS)
            except Exception as e:
                print(f"      error on {strategy.name} at i={i}: {e}")
                continue
            if not pred:
                continue
            ev = evaluate_prediction(pred, draws[i], prizes)
            all_exact.append(ev["exact_count"])
            rev = ev["total_prize"] - ticket_price * N_PREDICTIONS
            all_revenues.append(rev)
            total_preds += 1
            for m in ev["matches"]:
                tier_hit_counts[m["tier"]] += 1

    elapsed = time.time() - t0
    if total_preds == 0:
        return {"error": "No predictions"}

    total_cost = total_preds * ticket_price * N_PREDICTIONS
    total_revenue = sum(r + ticket_price * N_PREDICTIONS for r in all_revenues)
    exact_total = sum(all_exact)
    exact_rate = exact_total / (total_preds * N_PREDICTIONS) * 100
    profits = np.array(all_revenues, dtype=float)
    sharpe = 0.0
    if len(profits) > 1:
        std = float(np.std(profits, ddof=1))
        if std > 0:
            sharpe = float(np.mean(profits) / std) * float(np.sqrt(52))

    out = {
        "total_predictions": total_preds,
        "n_runs": N_RUNS,
        "n_predictions_per_draw": N_PREDICTIONS,
        "total_trials": total_preds * N_PREDICTIONS,
        "exact_match_rate_pct": round(float(exact_rate), 4),
        "exact_matches_total": exact_total,
        "tier_hits": dict(tier_hit_counts),
        "total_cost": int(total_cost),
        "total_revenue": int(total_revenue),
        "net_profit": int(total_revenue - total_cost),
        "roi_pct": round(float((total_revenue - total_cost) / total_cost * 100), 2),
        "sharpe_ratio": round(float(sharpe), 4),
        "elapsed_seconds": round(elapsed, 2),
        "avg_profit_per_draw": round(float(np.mean(all_revenues)), 2),
    }
    if is_hmm:
        tot = n_signal + n_noise
        out["hmm_state_distribution_segment"] = {
            "n_signal": n_signal,
            "n_noise": n_noise,
            "signal_fraction": round(n_signal / tot, 4) if tot > 0 else 0.0,
        }
    return out


def attach_significance(segment_results: dict, baseline_name: str, k: int):
    base = segment_results.get(baseline_name, {})
    if "exact_matches_total" not in base:
        return
    base_hits = base["exact_matches_total"]
    base_n = base["total_trials"]
    for name, r in segment_results.items():
        if name == baseline_name or "exact_matches_total" not in r:
            continue
        key = f"sig_vs_{baseline_name.split(' ')[0]}"
        r[key] = build_significance(
            hits_strat=r["exact_matches_total"],
            n_strat=r["total_trials"],
            hits_baseline=base_hits,
            n_baseline=base_n,
            n_strategies_compared=k,
            baseline_name=baseline_name,
            metric_name="exact_match_rate_pct",
        )


# ---------------------------------------------------------------------------
# Per-product runner
# ---------------------------------------------------------------------------


def strategies_for_product() -> list[Strategy3D]:
    """Build strategy list: Random, FreqWholeHot, HMM per window in WINDOWS."""
    random_s = RandomStrategy()
    random_s.name = "Random"
    freq_s = FreqWholeHotStrategy(200)
    freq_s.name = "FreqWholeHot"
    strategies: list[Strategy3D] = [random_s, freq_s]
    for window in WINDOWS:
        strategies.append(HMMRegimeStrategy(window=window, lookback_freq=200))
    return strategies


def run_product(product_name: str, product_cfg: dict) -> dict:
    print(f"\n▶ Product: {product_name}")
    draws = load_data(product_cfg["file"])
    N = len(draws)
    midpoint = N // 2
    print(f"  N={N}, midpoint={midpoint}, forward=[{N-100}, {N})")

    # Pre-compute HMM regime_lookup per window
    regime_lookups: dict[int, dict[int, int]] = {}
    hmm_meta_per_window: dict[int, dict] = {}
    for window in WINDOWS:
        print(f"  ▶ Pre-computing HMM W={window} ...")
        t_start = time.time()
        lookup, meta = precompute_hmm_regime(draws, window=window)
        elapsed = time.time() - t_start
        n_signal_total = sum(1 for v in lookup.values() if v == 1)
        n_noise_total = sum(1 for v in lookup.values() if v == 0)
        n_unknown = sum(1 for v in lookup.values() if v == -1)
        print(
            f"    elapsed={elapsed:.1f}s, n_fits={meta['n_fits']}, "
            f"signal={n_signal_total}/noise={n_noise_total}/unknown={n_unknown}, "
            f"signal_frac={meta['concentration']['signal_fraction']:.3f}"
        )
        meta["elapsed_seconds"] = round(elapsed, 2)
        meta["n_signal_total"] = n_signal_total
        meta["n_noise_total"] = n_noise_total
        meta["n_unknown"] = n_unknown
        regime_lookups[window] = lookup
        hmm_meta_per_window[window] = meta

    # Segments
    segments_def = {
        "full": (MIN_HISTORY, N),
        "half1": (MIN_HISTORY, midpoint),
        "half2": (midpoint, N),
        "forward_last_100": (N - 100, N),
    }

    strategies = strategies_for_product()
    all_segments: dict[str, dict] = {}

    for seg_tag, (s_idx, e_idx) in segments_def.items():
        print(f"\n  --- segment [{seg_tag}] draws [{s_idx}, {e_idx}) ---")
        seg_results: dict[str, Any] = {}
        for strat in strategies:
            regime_lookup = None
            if isinstance(strat, HMMRegimeStrategy):
                regime_lookup = regime_lookups[strat.window]
            print(f"    ▸ {strat.name}...", end=" ", flush=True)
            r = walk_forward_segment(draws, strat, product_cfg, s_idx, e_idx, regime_lookup=regime_lookup)
            if "error" in r:
                print(f"ERROR: {r['error']}")
                seg_results[strat.name] = r
                continue
            extra = ""
            if isinstance(strat, HMMRegimeStrategy):
                sd = r.get("hmm_state_distribution_segment", {})
                extra = f" sig_frac={sd.get('signal_fraction', 'N/A')}"
            print(
                f"exact={r['exact_match_rate_pct']:.3f}%  roi={r['roi_pct']:+.1f}%  "
                f"n={r['total_trials']}  T={r['elapsed_seconds']:.1f}s{extra}"
            )
            seg_results[strat.name] = r

        attach_significance(seg_results, baseline_name="Random", k=BONFERRONI_K)
        attach_significance(seg_results, baseline_name="FreqWholeHot", k=1)
        all_segments[seg_tag] = seg_results

    return {
        "N": N,
        "midpoint": midpoint,
        "segments_def": {k: list(v) for k, v in segments_def.items()},
        "hmm_meta": hmm_meta_per_window,
        "segments": all_segments,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    print("=" * 72)
    print("Chu Kỳ 17 — HMM Regime Detection Backtest (3D)")
    print("=" * 72)
    print(f"Products: {list(PRODUCTS_3D.keys())}")
    print(f"Windows: {WINDOWS}")
    print(
        f"Params: min_history={MIN_HISTORY}, n_runs={N_RUNS}, n_pred={N_PREDICTIONS}, "
        f"seed={SEED}, refit_every={REFIT_EVERY}, restarts={HMM_RESTARTS}"
    )
    print(f"Bonferroni K={BONFERRONI_K}")

    output: dict[str, Any] = {
        "meta": {
            "cycle": "17",
            "paradigm": "HMM regime detection",
            "pre_reg": "website/research/proposals/executed/cycle17_hmm_regime.md",
            "principle_16": "Retry Tree in pre-reg §Retry Tree (17.1-17.6)",
            "min_history": MIN_HISTORY,
            "n_runs": N_RUNS,
            "n_predictions": N_PREDICTIONS,
            "seed": SEED,
            "refit_every": REFIT_EVERY,
            "hmm_restarts": HMM_RESTARTS,
            "bonferroni_k": BONFERRONI_K,
            "windows": list(WINDOWS),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        },
        "products": {},
    }

    for product_name, product_cfg in PRODUCTS_3D.items():
        output["products"][product_name] = run_product(product_name, product_cfg)

    out_path = OUTPUT_DIR / "cycle17_hmm_results.json"
    out_path.write_text(json.dumps(output, indent=2, default=str))
    print(f"\n✓ Results written to {out_path}")


if __name__ == "__main__":
    main()

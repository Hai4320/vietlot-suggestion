#!/usr/bin/env python3
"""Chu Kỳ 17 — HMM Regime Detection Backtest (Matrix: Power 6/55).

Pre-reg: website/research/proposals/cycle17_hmm_regime.md

Strategies:
  - Random (baseline)
  - Freq_Hot(365, 0.8) (always-on anchor)
  - HMM_K2_W20(FreqHot/Random) — window=20, signal→Freq_Hot, noise→Random
  - HMM_K2_W40(FreqHot/Random) — window=40, same mapping

Protocol (aligns with 3d/cycle17_hmm_backtest.py):
  - Pre-compute walk-forward HMM regime_lookup per (product, window)
  - 4 segments: full / half1 / half2 / forward_last_100
  - Bonferroni K=6 vs-Random (project-wide: 2 configs × 3 products)

Output: cycle17_hmm_results.json + logs/cycle17_hmm_output.log
"""

from __future__ import annotations

import json
import random
import sys
import time
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR))
sys.path.insert(0, str(THIS_DIR.parent))

from _significance import build_significance  # noqa: E402
from backtest import (  # noqa: E402
    MATRIX_PRODUCTS,
    FrequencyHotStrategy,
    RandomStrategy,
    StrategyBase,
    load_matrix_data,
)
from hmm_regime import (  # noqa: E402
    WalkForwardConfig,
    compute_observation_sequence_matrix,
    walk_forward_regime_predict,
)

OUTPUT_FILE = THIS_DIR / "cycle17_hmm_results.json"

# --- Pre-reg constants (immutable) ---
PRODUCTS = ["power_655"]  # pre-reg scope: Power 6/55 only from matrix
WINDOWS = (20, 40)
BONFERRONI_K = 6  # project-wide (2 configs × 3 products 3D+matrix)
MIN_HISTORY = 200
N_RUNS = 5
SEED = 42
FORWARD_WINDOW = 100
REFIT_EVERY = 10
HMM_RESTARTS = 10


class HMMRegimeMatrixStrategy(StrategyBase):
    """HMM-switched strategy for matrix products. Driven by external regime_lookup."""

    def __init__(self, window: int, lookback_days: int = 365, weight: float = 0.8):
        self.window = window
        self.name = f"HMM_K2_W{window}(FreqHot/Random)"
        self.description = (
            f"2-state Gaussian HMM, W={window}, signal→Freq_Hot({lookback_days},{weight}), noise→Random"
        )
        self._freqhot = FrequencyHotStrategy(lookback_days=lookback_days, weight=weight)
        self._random = RandomStrategy()
        self._regime_lookup: dict[int, int] | None = None
        self._signal_state_id: int = 1
        self._current_idx: int | None = None

    def set_regime_context(self, regime_lookup: dict[int, int], signal_state_id: int = 1):
        self._regime_lookup = regime_lookup
        self._signal_state_id = signal_state_id

    def set_current_idx(self, idx: int):
        self._current_idx = idx

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        if self._regime_lookup is None or self._current_idx is None:
            return self._random.predict(train_df, target_date, min_val, max_val, num_count)
        state = self._regime_lookup.get(self._current_idx, -1)
        if state == self._signal_state_id:
            return self._freqhot.predict(train_df, target_date, min_val, max_val, num_count)
        return self._random.predict(train_df, target_date, min_val, max_val, num_count)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def df_to_number_lists(df: pd.DataFrame) -> list[list[int]]:
    return [list(row) for row in df["result"].tolist()]


def precompute_hmm_regime_matrix(
    df: pd.DataFrame, window: int, max_val: int
) -> tuple[dict[int, int], dict]:
    num_lists = df_to_number_lists(df)
    obs_seq = compute_observation_sequence_matrix(num_lists, max_val=max_val, window=window)
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


def walk_forward_segment(
    df: pd.DataFrame,
    strategy: StrategyBase,
    product_cfg: dict,
    start_idx: int,
    end_idx: int,
    regime_lookup: dict[int, int] | None = None,
) -> dict:
    min_val = product_cfg["min_val"]
    max_val = product_cfg["max_val"]
    num_count = product_cfg["num_count"]
    prizes = product_cfg["prizes"]
    ticket_price = product_cfg["ticket_price"]

    all_matches: list[int] = []
    all_revenues: list[float] = []
    n_signal = 0
    n_noise = 0

    is_hmm = isinstance(strategy, HMMRegimeMatrixStrategy)
    if is_hmm and regime_lookup is not None:
        strategy.set_regime_context(regime_lookup, signal_state_id=1)

    t0 = time.time()
    for run in range(N_RUNS):
        random.seed(SEED + run)
        np.random.seed(SEED + run)
        for i in range(start_idx, end_idx):
            target_row = df.iloc[i]
            target_date = target_row["date"]
            train_df = df.iloc[:i]
            if len(train_df) < 30:
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
                predicted = strategy.predict(train_df, target_date, min_val, max_val, num_count)
            except Exception as e:
                print(f"        !! {strategy.name} predict error: {e}")
                continue
            if not predicted:
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
            sharpe = (float(np.mean(profits)) / std) * float(np.sqrt(52))
    cum = np.cumsum(profits)
    dd = cum - np.maximum.accumulate(cum)
    dist = {str(m): all_matches.count(m) for m in range(max(all_matches) + 1)}

    out = {
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
        "matches_distribution": dist,
        "elapsed_seconds": round(elapsed, 2),
    }
    if is_hmm:
        tot = n_signal + n_noise
        out["hmm_state_distribution_segment"] = {
            "n_signal": n_signal,
            "n_noise": n_noise,
            "signal_fraction": round(n_signal / tot, 4) if tot > 0 else 0.0,
        }
    return out


def attach_significance(seg_results: dict, baseline_name: str, k: int):
    base = seg_results.get(baseline_name)
    if not base or "wins_ge3" not in base:
        return
    bh = base["wins_ge3"]
    bn = base["total_predictions"]
    for name, r in seg_results.items():
        if name == baseline_name or "wins_ge3" not in r:
            continue
        r[f"sig_vs_{baseline_name.split(' ')[0].replace('_', '')}"] = build_significance(
            hits_strat=r["wins_ge3"],
            n_strat=r["total_predictions"],
            hits_baseline=bh,
            n_baseline=bn,
            n_strategies_compared=k,
            baseline_name=baseline_name,
            metric_name="win_rate_ge3",
        )


def strategies_for_matrix() -> list[StrategyBase]:
    random_s = RandomStrategy()
    freq_s = FrequencyHotStrategy(lookback_days=365, weight=0.8)
    strategies: list[StrategyBase] = [random_s, freq_s]
    for window in WINDOWS:
        strategies.append(HMMRegimeMatrixStrategy(window=window))
    return strategies


def run_product(product_key: str) -> dict:
    product_cfg = MATRIX_PRODUCTS[product_key]
    print(f"\n▶ Product: {product_key}")
    df = load_matrix_data(product_key)
    N = len(df)
    midpoint = N // 2
    forward_start = max(MIN_HISTORY, N - FORWARD_WINDOW)
    print(f"  N={N}, midpoint={midpoint}, forward=[{forward_start}, {N})")

    regime_lookups: dict[int, dict[int, int]] = {}
    hmm_meta_per_window: dict[int, dict] = {}
    for window in WINDOWS:
        print(f"  ▶ Pre-computing HMM W={window} ...")
        t_start = time.time()
        lookup, meta = precompute_hmm_regime_matrix(df, window=window, max_val=product_cfg["max_val"])
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
        regime_lookups[window] = lookup
        hmm_meta_per_window[window] = meta

    segments_def = {
        "full": (MIN_HISTORY, N),
        "half1": (MIN_HISTORY, midpoint),
        "half2": (midpoint, N),
        "forward_last_100": (forward_start, N),
    }

    strategies = strategies_for_matrix()
    all_segments: dict[str, dict] = {}

    for seg_tag, (s_idx, e_idx) in segments_def.items():
        print(f"\n  --- segment [{seg_tag}] draws [{s_idx}, {e_idx}) ---")
        seg_results: dict[str, Any] = {}
        for strat in strategies:
            regime_lookup = None
            if isinstance(strat, HMMRegimeMatrixStrategy):
                regime_lookup = regime_lookups[strat.window]
            print(f"    ▸ {strat.name}...", end=" ", flush=True)
            r = walk_forward_segment(df, strat, product_cfg, s_idx, e_idx, regime_lookup=regime_lookup)
            if "error" in r:
                print(f"ERROR: {r['error']}")
                seg_results[strat.name] = r
                continue
            extra = ""
            if isinstance(strat, HMMRegimeMatrixStrategy):
                sd = r.get("hmm_state_distribution_segment", {})
                extra = f" sig_frac={sd.get('signal_fraction', 'N/A')}"
            print(
                f"win={r['win_rate_pct']:.3f}%  roi={r['roi_pct']:+.1f}%  "
                f"n={r['total_predictions']}  T={r['elapsed_seconds']:.1f}s{extra}"
            )
            seg_results[strat.name] = r

        attach_significance(seg_results, baseline_name="Random", k=BONFERRONI_K)
        attach_significance(seg_results, baseline_name="Freq_Hot", k=1)
        all_segments[seg_tag] = seg_results

    return {
        "N": N,
        "midpoint": midpoint,
        "forward_start": forward_start,
        "segments_def": {k: list(v) for k, v in segments_def.items()},
        "hmm_meta": hmm_meta_per_window,
        "segments": all_segments,
    }


def main():
    print("=" * 72)
    print("Chu Kỳ 17 — HMM Regime Detection Backtest (Matrix)")
    print("=" * 72)
    print(f"Products: {PRODUCTS}")
    print(f"Windows: {WINDOWS}")
    print(
        f"Params: min_history={MIN_HISTORY}, n_runs={N_RUNS}, seed={SEED}, "
        f"refit_every={REFIT_EVERY}, restarts={HMM_RESTARTS}"
    )
    print(f"Bonferroni K={BONFERRONI_K}")

    output: dict[str, Any] = {
        "meta": {
            "cycle": "17",
            "paradigm": "HMM regime detection",
            "pre_reg": "website/research/proposals/cycle17_hmm_regime.md",
            "scope": "matrix (Power 6/55)",
            "min_history": MIN_HISTORY,
            "n_runs": N_RUNS,
            "seed": SEED,
            "refit_every": REFIT_EVERY,
            "hmm_restarts": HMM_RESTARTS,
            "bonferroni_k": BONFERRONI_K,
            "windows": list(WINDOWS),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        },
        "products": {},
    }

    for product_key in PRODUCTS:
        output["products"][product_key] = run_product(product_key)

    OUTPUT_FILE.write_text(json.dumps(output, indent=2, default=str))
    print(f"\n✓ Results written to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()

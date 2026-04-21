"""Cross-product pooled strategies for matrix products (Chu Kỳ 15 — Path #3).

Pre-registered [history/cycle15_cross_product.md](../history/cycle15_cross_product.md).

Hypothesis: 3 matrix products (Power 6/55, Mega 6/45, Lotto 5/35) operated by cùng
vendor Vietlott may share physical RNG infrastructure → shared number-level bias on
overlap [1, 35]. Pool evidence across products → tighter P(number_i) estimate.

Strategies:
  - `PooledMatrixBiasStrategy` — hard pool (sum counts across products)
  - `HierarchicalBayesMatrixStrategy` — soft pool (w_own=0.5 mix)

Strict walk-forward: at step i of target product P, other products filtered to
`date < draws_P[i-1].date` (no look-ahead across products).
"""

from __future__ import annotations

import sys
from collections import Counter
from datetime import timedelta
from pathlib import Path

import numpy as np
import pandas as pd

# Reuse StrategyBase from matrix backtest module
sys.path.insert(0, str(Path(__file__).resolve().parent))
from backtest import StrategyBase  # noqa: E402

OVERLAP_MAX = 35  # range all 3 matrix products cover (Lotto 5/35 is smallest)


def _pool_freq_from_others(
    other_product_dfs: dict,
    cutoff_date,
    target_date,
    overlap_max: int = OVERLAP_MAX,
) -> Counter:
    """Count occurrences of each number in [1, overlap_max] across other products.

    Strict walk-forward filter: other_df rows with date in [cutoff, target_date).
    """
    pooled = Counter()
    for _, other_df in other_product_dfs.items():
        mask = (other_df["date"] >= cutoff_date) & (other_df["date"] < target_date)
        for nums in other_df.loc[mask, "result"].tolist():
            for n in nums:
                if 1 <= n <= overlap_max:
                    pooled[n] += 1
    return pooled


def _sample_dirichlet_without_replacement(
    alpha: np.ndarray,
    numbers: list[int],
    num_count: int,
    temperature: float,
) -> list[int]:
    """Shared Dirichlet sampling logic matching BayesianDirichletStrategy convention.

    Temperature applied to counts (alpha) not probs: matches batch Bayesian.
    """
    alpha = np.maximum(alpha, 1e-6)
    if temperature != 1.0:
        alpha = (alpha - 1.0) / temperature + 1.0
        alpha = np.maximum(alpha, 0.01)
    theta = np.random.dirichlet(alpha)
    selected: list[int] = []
    probs = theta.copy()
    for _ in range(num_count):
        if probs.sum() > 0:
            p = probs / probs.sum()
        else:
            p = np.ones_like(probs) / len(probs)
        idx = np.random.choice(len(numbers), p=p)
        selected.append(numbers[idx])
        probs[idx] = 0.0
    return sorted(selected)


class PooledMatrixBiasStrategy(StrategyBase):
    """Hard-pool bias estimate on overlap [1, 35].

    For target product P with range [1, N_P]:
      - For i ∈ [1, 35]:        alpha[i] = prior + own_freq[i] + pooled_freq[i]
      - For i ∈ [36, N_P]:      alpha[i] = prior + own_freq[i]
    """

    name = "PooledMatrixBias"

    def __init__(
        self,
        other_product_dfs: dict,
        lookback_days: int = 365,
        prior_strength: float = 1.0,
        temperature: float = 1.0,
    ) -> None:
        self.other_product_dfs = other_product_dfs
        self.lookback_days = lookback_days
        self.prior_strength = prior_strength
        self.temperature = temperature

    def predict(
        self,
        train_df: pd.DataFrame,
        target_date,
        min_val: int,
        max_val: int,
        num_count: int,
    ) -> list:
        cutoff = target_date - timedelta(days=self.lookback_days)

        # Own product frequency (uniform weight within lookback)
        own_recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        own_freq = Counter(n for nums in own_recent for n in nums)

        # Pooled frequency from other products on overlap [min_val, OVERLAP_MAX]
        pooled_freq = _pool_freq_from_others(self.other_product_dfs, cutoff, target_date)

        alpha = np.full(max_val - min_val + 1, self.prior_strength, dtype=float)
        for i in range(min_val, max_val + 1):
            idx = i - min_val
            alpha[idx] += own_freq.get(i, 0)
            if i <= OVERLAP_MAX:
                alpha[idx] += pooled_freq.get(i, 0)

        numbers = list(range(min_val, max_val + 1))
        return _sample_dirichlet_without_replacement(alpha, numbers, num_count, self.temperature)


class HierarchicalBayesMatrixStrategy(StrategyBase):
    """Soft-pool: alpha = (1-w_own)·alpha_pool + w_own·alpha_own on overlap [1, 35].

    Non-overlap region [36, N_P] uses alpha_own only (no pool available there).

    Note: alpha_pool includes own_freq by design (double-counts own in pool) — per
    Chu Kỳ 13 Path B precedent for consistency with prior hierarchical tests.
    """

    name = "HierarchicalBayesMatrix"

    def __init__(
        self,
        other_product_dfs: dict,
        w_own: float = 0.5,
        lookback_days: int = 365,
        prior_strength: float = 1.0,
        temperature: float = 1.0,
    ) -> None:
        if not (0.0 <= w_own <= 1.0):
            raise ValueError(f"w_own must be in [0, 1], got {w_own}")
        self.other_product_dfs = other_product_dfs
        self.w_own = w_own
        self.lookback_days = lookback_days
        self.prior_strength = prior_strength
        self.temperature = temperature
        self.name = f"HierarchicalBayesMatrix_w{w_own:.2f}"

    def predict(
        self,
        train_df: pd.DataFrame,
        target_date,
        min_val: int,
        max_val: int,
        num_count: int,
    ) -> list:
        cutoff = target_date - timedelta(days=self.lookback_days)
        own_recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        own_freq = Counter(n for nums in own_recent for n in nums)
        pooled_freq = _pool_freq_from_others(self.other_product_dfs, cutoff, target_date)

        alpha_own = np.full(max_val - min_val + 1, self.prior_strength, dtype=float)
        alpha_pool = np.full(max_val - min_val + 1, self.prior_strength, dtype=float)
        for i in range(min_val, max_val + 1):
            idx = i - min_val
            alpha_own[idx] += own_freq.get(i, 0)
            alpha_pool[idx] += own_freq.get(i, 0)  # double-count own into pool
            if i <= OVERLAP_MAX:
                alpha_pool[idx] += pooled_freq.get(i, 0)

        alpha_combined = np.empty_like(alpha_own)
        for i in range(min_val, max_val + 1):
            idx = i - min_val
            if i <= OVERLAP_MAX:
                alpha_combined[idx] = (1 - self.w_own) * alpha_pool[idx] + self.w_own * alpha_own[idx]
            else:
                alpha_combined[idx] = alpha_own[idx]

        numbers = list(range(min_val, max_val + 1))
        return _sample_dirichlet_without_replacement(
            alpha_combined, numbers, num_count, self.temperature
        )


if __name__ == "__main__":
    # Smoke test on real matrix data
    import random
    import time

    from backtest import MATRIX_PRODUCTS, load_matrix_data

    random.seed(42)
    np.random.seed(42)

    print("Loading 3 matrix products...")
    dfs = {k: load_matrix_data(k) for k in ("power_655", "power_645", "power_535")}
    for k, df in dfs.items():
        print(f"  {k}: N={len(df)}, date range {df['date'].min()} → {df['date'].max()}")

    print("\n--- Target: Mega 6/45, pool from Power 6/55 + Lotto 5/35 ---")
    target_key = "power_645"
    target_cfg = MATRIX_PRODUCTS[target_key]
    target_df = dfs[target_key]
    other_dfs = {k: v for k, v in dfs.items() if k != target_key}

    for strat_class, kwargs in [
        (PooledMatrixBiasStrategy, {}),
        (HierarchicalBayesMatrixStrategy, {"w_own": 0.5}),
    ]:
        strat = strat_class(other_product_dfs=other_dfs, **kwargs)
        t0 = time.time()
        for i in range(100, 105):
            train = target_df.iloc[:i]
            target_date = target_df.iloc[i]["date"]
            pred = strat.predict(
                train,
                target_date,
                target_cfg["min_val"],
                target_cfg["max_val"],
                target_cfg["num_count"],
            )
            print(f"  {strat.name}  step {i}: pred={pred}")
        print(f"    5 steps in {time.time() - t0:.3f}s")

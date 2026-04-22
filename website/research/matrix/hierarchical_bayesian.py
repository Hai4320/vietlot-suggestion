"""Hierarchical Bayesian strategies for matrix products (Chu kỳ 21).

Implements empirical-Bayes pooled Dirichlet prior. Unlike BayesianDirichletStrategy
(Chu kỳ 2, flat per-product prior), this pre-computes empirical frequency mean
across all products OFFLINE and uses it as informed prior. Posterior computation
remains per-product.

Distinction from eliminated families (Principle #17 check):
- NOT Adaptive/drift (Chu kỳ 14 Online Kalman eliminated) — prior is fixed after
  offline empirical Bayes step; no online forgetting factor.
- NOT Cross-product pooling (Chu kỳ 13/15 eliminated) — pools at PRIOR level only
  via 1 scalar hyperparameter (global mean frequency). Posterior updates use only
  per-product draws, not cross-product data.

Pre-reg: proposals/executed/cycle21_hierarchical_bayesian.md

Usage:
    from hierarchical_bayesian import (
        HierarchicalEBStrategy,
        compute_global_empirical_prior,
    )

    # Offline: compute global empirical frequency once
    global_prior = compute_global_empirical_prior(all_products_draws)

    # Per-product strategy
    strat = HierarchicalEBStrategy(
        global_prior=global_prior,
        lookback_days=365,
        prior_strength=1.0,
        temperature=1.0,
    )
    strat.predict(train_df, target_date, min_val, max_val, num_count)
"""

from __future__ import annotations

from collections import Counter
from datetime import timedelta
from typing import Mapping, Sequence

import numpy as np


# ---------------------------------------------------------------------------
# Offline empirical Bayes pre-computation
# ---------------------------------------------------------------------------


def compute_global_empirical_prior(
    products_draws: Mapping[str, Sequence[Sequence[int]]],
    products_max_val: Mapping[str, int],
) -> dict[int, float]:
    """Compute global mean frequency per drawn number across all products.

    Algorithm (matches pre-reg §Methodology §Mechanism spec):
      1. For each product, compute empirical frequency per number (normalized).
      2. For each number i, compute mean over products where i is in range.
      3. Falls back to uniform if i not in any product's range.

    Returns:
        dict mapping number → global-mean-frequency (float in [0, 1])

    The output dict is used as `global_prior` argument to HierarchicalEBStrategy.
    """
    per_product_freq: dict[str, dict[int, float]] = {}

    for pname, draws in products_draws.items():
        max_val = products_max_val[pname]
        counts = Counter()
        total = 0
        for draw in draws:
            for n in draw:
                if 1 <= int(n) <= max_val:
                    counts[int(n)] += 1
                    total += 1
        if total == 0:
            continue
        per_product_freq[pname] = {i: counts.get(i, 0) / total for i in range(1, max_val + 1)}

    # Aggregate: for each number, mean over products where it exists
    all_numbers = set()
    for pname, freq in per_product_freq.items():
        all_numbers.update(freq.keys())

    global_freq: dict[int, float] = {}
    for i in sorted(all_numbers):
        values = [freq[i] for freq in per_product_freq.values() if i in freq]
        if values:
            global_freq[i] = float(np.mean(values))

    return global_freq


# ---------------------------------------------------------------------------
# Hierarchical EB strategy (matches BayesianDirichletStrategy interface)
# ---------------------------------------------------------------------------


class HierarchicalEBStrategy:
    """Hierarchical empirical-Bayes Dirichlet strategy for matrix products.

    Interface matches backtest.StrategyBase (lacks explicit inheritance to avoid
    import cycles; duck-typed via predict() signature).

    Args:
        global_prior: dict from compute_global_empirical_prior(). Maps number →
            global-mean-frequency. Used as informed prior.
        lookback_days: days of history for per-product posterior update (matches
            BayesianDirichletStrategy default).
        prior_strength: multiplier on global_prior. Higher = more prior weight vs
            empirical observations.
        temperature: sampling sharpness. T<1 sharpens; T>1 flattens.
        refit_every_k_draws: 1 = refit per draw; 7 = weekly (Lazy variant).
    """

    name = "HierarchicalEB"

    def __init__(
        self,
        global_prior: dict[int, float],
        lookback_days: int = 365,
        prior_strength: float = 1.0,
        temperature: float = 1.0,
        refit_every_k_draws: int = 1,
    ):
        self.global_prior = global_prior
        self.lookback_days = lookback_days
        self.prior_strength = prior_strength
        self.temperature = temperature
        self.refit_every_k_draws = max(1, int(refit_every_k_draws))
        self._cached_posterior: np.ndarray | None = None
        self._last_refit_n: int = -1

    def _build_prior(self, min_val: int, max_val: int) -> np.ndarray:
        """Build informed prior α_0 from global empirical frequency."""
        K = max_val - min_val + 1
        global_mean = np.array(
            [self.global_prior.get(i, 1.0 / K) for i in range(min_val, max_val + 1)],
            dtype=float,
        )
        # Normalize to sum to 1 (safety, should already sum ~1)
        global_mean /= global_mean.sum()
        # Scale to prior_strength × K (sum = prior_strength × K)
        alpha_0 = self.prior_strength * K * global_mean
        return alpha_0

    def predict(self, train_df, target_date, min_val: int, max_val: int, num_count: int):
        """Predict num_count distinct numbers for target_date.

        Matches StrategyBase interface from matrix/backtest.py.
        """
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        n_train = len(recent)

        # Refit posterior every k draws
        need_refit = (
            self._cached_posterior is None
            or (n_train - self._last_refit_n) >= self.refit_every_k_draws
        )

        if need_refit:
            freq = Counter(n for nums in recent for n in nums)
            alpha_0 = self._build_prior(min_val, max_val)
            posterior = alpha_0 + np.array(
                [freq.get(i, 0) for i in range(min_val, max_val + 1)], dtype=float
            )
            # Temperature: sharpen/flatten posterior before sampling
            if self.temperature != 1.0:
                posterior = np.maximum(posterior, 0.01) ** (1.0 / self.temperature)
            self._cached_posterior = posterior
            self._last_refit_n = n_train

        posterior = self._cached_posterior
        theta = np.random.dirichlet(posterior)
        numbers = list(range(min_val, max_val + 1))
        selected: list[int] = []
        probs = theta.copy()
        for _ in range(num_count):
            s = probs.sum()
            if s <= 0:
                # Degenerate posterior: fall back to uniform choice on remaining
                remaining = [n for n in numbers if n not in selected]
                if not remaining:
                    break
                idx_pick = np.random.choice(len(remaining))
                selected.append(remaining[idx_pick])
                continue
            p = probs / s
            idx = np.random.choice(len(numbers), p=p)
            selected.append(numbers[idx])
            probs[idx] = 0
        return sorted(selected)

    def reset_cache(self):
        """Reset cached posterior. Call between runs for clean state."""
        self._cached_posterior = None
        self._last_refit_n = -1


class HierarchicalEBSharpStrategy(HierarchicalEBStrategy):
    """Sharp variant — temperature=0.5 default."""

    name = "HierarchicalEB_Sharp"

    def __init__(
        self,
        global_prior: dict[int, float],
        lookback_days: int = 365,
        prior_strength: float = 1.0,
        temperature: float = 0.5,
        refit_every_k_draws: int = 1,
    ):
        super().__init__(
            global_prior=global_prior,
            lookback_days=lookback_days,
            prior_strength=prior_strength,
            temperature=temperature,
            refit_every_k_draws=refit_every_k_draws,
        )


class HierarchicalEBLazyStrategy(HierarchicalEBStrategy):
    """Lazy variant — refit posterior every 7 draws (weekly)."""

    name = "HierarchicalEB_Lazy"

    def __init__(
        self,
        global_prior: dict[int, float],
        lookback_days: int = 365,
        prior_strength: float = 1.0,
        temperature: float = 1.0,
        refit_every_k_draws: int = 7,
    ):
        super().__init__(
            global_prior=global_prior,
            lookback_days=lookback_days,
            prior_strength=prior_strength,
            temperature=temperature,
            refit_every_k_draws=refit_every_k_draws,
        )

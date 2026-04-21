"""Online Bayesian Dirichlet strategy with Kalman-style exponential forgetting.

Chu Kỳ 14 — Path #1 Breakthrough Roadmap.

Mechanism (pre-registered [history/cycle14_online_bayesian.md](../history/cycle14_online_bayesian.md)):

    α_0 = prior_strength · 1_N
    For each historical draw d (chronological):
        α_t = (1 − λ) · α_{t−1} + one_hot(d)
    θ ~ Dirichlet(α_T)
    Select num_count without replacement, probs ∝ θ^(1/T)

Vs batch `BayesianDirichletStrategy(365,1,1)` ([backtest.py:263](backtest.py#L263)):
- Batch uses uniform-weighted lookback window (365 days); online uses ALL history with
  exponential weight (1−λ)^age. Equivalent when λ→0 and all history ≤ 365d.
- Online maintains state across calls within a run for efficiency.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

# Reuse StrategyBase from matrix backtest module
sys.path.insert(0, str(Path(__file__).resolve().parent))
from backtest import StrategyBase  # noqa: E402


class OnlineBayesianStrategy(StrategyBase):
    """Dirichlet posterior with exponential forgetting factor λ.

    State `_alpha` accumulates across predict() calls within a run. Call
    `reset()` at start of each run (Principle R3: reproducibility).
    """

    name = "OnlineBayes"

    def __init__(
        self,
        forgetting_rate: float = 0.03,
        prior_strength: float = 1.0,
        temperature: float = 1.0,
    ) -> None:
        if not (0.0 < forgetting_rate <= 1.0):
            raise ValueError(f"forgetting_rate must be in (0, 1], got {forgetting_rate}")
        self.forgetting_rate = forgetting_rate
        self.prior_strength = prior_strength
        self.temperature = temperature
        self.name = f"OnlineBayes_λ{forgetting_rate:.2f}"
        self._alpha: Optional[np.ndarray] = None
        self._min_val: Optional[int] = None
        self._max_val: Optional[int] = None
        self._seen_ids: set = set()

    def reset(self) -> None:
        """Reset accumulated state. Call at start of each run."""
        self._alpha = None
        self._seen_ids = set()

    def _initialize(self, min_val: int, max_val: int) -> None:
        n = max_val - min_val + 1
        self._alpha = np.full(n, self.prior_strength, dtype=float)
        self._min_val = min_val
        self._max_val = max_val

    def _apply_draws(self, train_df: pd.DataFrame) -> None:
        """Incrementally fold new draws (id not seen) into alpha.

        Assumes train_df is chronologically sorted. Identifies new draws by `id`
        column (unique per Vietlott record) to handle walk-forward calls where
        train_df grows by 1 row per step.
        """
        if self._alpha is None:
            raise RuntimeError("Must call _initialize before _apply_draws")
        if "id" not in train_df.columns:
            # Fallback: use index; less safe across cycles but workable for single-run
            new_rows = [row for idx, row in train_df.iterrows() if idx not in self._seen_ids]
            id_getter = lambda i, r: i
        else:
            id_getter = lambda i, r: r["id"]
            new_rows = [
                (idx, row) for idx, row in train_df.iterrows() if row["id"] not in self._seen_ids
            ]
        new_rows = sorted(new_rows, key=lambda t: (t[1].get("date"), id_getter(*t)))
        for idx, row in new_rows:
            nums = row["result"]
            one_hot = np.zeros_like(self._alpha)
            for n in nums:
                i = n - self._min_val
                if 0 <= i < len(one_hot):
                    one_hot[i] = 1.0
            # Exponential forgetting: α_t = (1-λ)·α_{t-1} + obs
            self._alpha = (1.0 - self.forgetting_rate) * self._alpha + one_hot
            self._seen_ids.add(id_getter(idx, row))

    def predict(
        self,
        train_df: pd.DataFrame,
        target_date,
        min_val: int,
        max_val: int,
        num_count: int,
    ) -> list:
        if self._alpha is None:
            self._initialize(min_val, max_val)
        elif self._min_val != min_val or self._max_val != max_val:
            # Product changed mid-run — reset state
            self._initialize(min_val, max_val)

        self._apply_draws(train_df)

        # Sample from posterior with temperature
        alpha = self._alpha.copy()
        alpha = np.maximum(alpha, 1e-6)  # guard against zero from aggressive λ
        if self.temperature != 1.0:
            # Apply temperature to counts (not probs) matching batch Bayesian convention
            alpha = (alpha - 1.0) / self.temperature + 1.0
            alpha = np.maximum(alpha, 0.01)

        theta = np.random.dirichlet(alpha)
        numbers = list(range(min_val, max_val + 1))
        selected: list[int] = []
        probs = theta.copy()
        for _ in range(num_count):
            p = probs / probs.sum() if probs.sum() > 0 else np.ones_like(probs) / len(probs)
            idx = np.random.choice(len(numbers), p=p)
            selected.append(numbers[idx])
            probs[idx] = 0.0
        return sorted(selected)


if __name__ == "__main__":
    # Smoke test — sanity check mechanism without full backtest
    import random

    random.seed(42)
    np.random.seed(42)

    # Fake train data: 100 Mega 6/45 draws
    fake_draws = []
    for i in range(100):
        nums = sorted(random.sample(range(1, 46), 6))
        fake_draws.append({"date": pd.Timestamp("2024-01-01") + pd.Timedelta(days=i),
                           "id": f"fake_{i}", "result": nums})
    df = pd.DataFrame(fake_draws)

    for lam in [0.01, 0.03, 0.10]:
        strat = OnlineBayesianStrategy(forgetting_rate=lam)
        pred = strat.predict(df, df["date"].iloc[-1] + pd.Timedelta(days=1), 1, 45, 6)
        print(f"λ={lam}: prediction={pred}, alpha_sum={strat._alpha.sum():.2f}, "
              f"alpha_max={strat._alpha.max():.4f}")

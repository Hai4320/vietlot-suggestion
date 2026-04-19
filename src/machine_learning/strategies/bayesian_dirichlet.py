"""
Bayesian Dirichlet-Multinomial lottery number prediction strategy.

Uses a Dirichlet prior over number probabilities and samples from the
posterior to generate predictions.  This properly quantifies uncertainty
and avoids overfitting to small frequency differences.

Mathematical basis
------------------
    θ ~ Dir(α₁, …, αᵥ)          — prior (uniform: all αᵢ = 1)
    data: cᵢ counts for each number in recent draws
    θ|data ~ Dir(α₁+c₁, …, αᵥ+cᵥ)  — posterior

Each prediction samples θ from the posterior, then selects numbers
weighted by the sampled θ.
"""

import random
from collections import Counter
from datetime import date, timedelta
from typing import List

import numpy as np
import pandas as pd

from machine_learning.strategies.base import PredictModel


class BayesianDirichletStrategy(PredictModel):
    """
    Bayesian Dirichlet-Multinomial number prediction.

    Samples from the posterior Dirichlet distribution over number
    probabilities, then selects numbers weighted by the sampled θ.

    Parameters
    ----------
    df : pd.DataFrame
        Historical draw data with ``date`` and ``result`` columns.
    lookback_days : int
        How many days of history to use for counting.
    prior_strength : float
        Dirichlet concentration hyperparameter.  Higher values make the
        prior more informative (closer to uniform).  Default 1.0
        (equivalent to add-1 Laplace smoothing).
    temperature : float
        Sampling temperature.  Values > 1 flatten the distribution
        (more random), values < 1 sharpen it (more deterministic).
    """

    def __init__(
        self,
        df: pd.DataFrame,
        time_predict: int = 1,
        min_val: int = PredictModel.POWER_655_MIN_VAL,
        max_val: int = PredictModel.POWER_655_MAX_VAL,
        lookback_days: int = 365,
        prior_strength: float = 1.0,
        temperature: float = 1.0,
    ):
        super().__init__(df, time_predict, min_val, max_val)
        self.lookback_days = lookback_days
        self.prior_strength = prior_strength
        self.temperature = temperature

    def predict(self, target_date: date) -> List[int]:
        """Sample from posterior Dirichlet and select numbers."""
        cutoff = target_date - timedelta(days=self.lookback_days)
        mask = (self.df["date"] >= cutoff) & (self.df["date"] < target_date)
        recent = self.df.loc[mask, "result"].tolist()

        # Count occurrences
        freq = Counter(n for nums in recent for n in nums)

        # Dirichlet posterior parameters
        n_nums = self.max_val - self.min_val + 1
        alpha = np.array(
            [self.prior_strength + freq.get(i, 0) for i in range(self.min_val, self.max_val + 1)],
            dtype=float,
        )

        # Apply temperature
        if self.temperature != 1.0:
            alpha = (alpha - 1) / self.temperature + 1
            alpha = np.maximum(alpha, 0.01)

        # Sample from posterior
        theta = np.random.dirichlet(alpha)

        # Select numbers without replacement, weighted by theta
        numbers = list(range(self.min_val, self.max_val + 1))
        selected = []
        remaining_probs = theta.copy()

        for _ in range(self.number_predict):
            remaining_probs_norm = remaining_probs / remaining_probs.sum()
            idx = np.random.choice(len(numbers), p=remaining_probs_norm)
            selected.append(numbers[idx])
            remaining_probs[idx] = 0  # no replacement

        return sorted(selected)

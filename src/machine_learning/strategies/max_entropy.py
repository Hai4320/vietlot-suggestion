"""
Maximum-entropy lottery number selection strategy.

Divides the number range into equal bands and selects exactly one number
per band (stratified sampling), ensuring structural diversity.  Within
each band, selection is weighted by Bayesian posterior (Dirichlet) over
historical frequencies.

This guarantees that tickets have numbers spread across the entire range,
which is the maximum-entropy configuration subject to the stratification
constraint.
"""

import random
from collections import Counter
from datetime import date, timedelta
from typing import List

import numpy as np
import pandas as pd

from machine_learning.strategies.base import PredictModel


class MaxEntropyStrategy(PredictModel):
    """
    Maximum-entropy stratified sampling strategy.

    Parameters
    ----------
    df : pd.DataFrame
        Historical draw data.
    lookback_days : int
        Lookback window for frequency estimation.
    prior_strength : float
        Dirichlet prior concentration parameter.
    """

    def __init__(
        self,
        df: pd.DataFrame,
        time_predict: int = 1,
        min_val: int = PredictModel.POWER_655_MIN_VAL,
        max_val: int = PredictModel.POWER_655_MAX_VAL,
        lookback_days: int = 365,
        prior_strength: float = 1.0,
    ):
        super().__init__(df, time_predict, min_val, max_val)
        self.lookback_days = lookback_days
        self.prior_strength = prior_strength

    def predict(self, target_date: date) -> List[int]:
        """Generate prediction using stratified max-entropy sampling."""
        cutoff = target_date - timedelta(days=self.lookback_days)
        mask = (self.df["date"] >= cutoff) & (self.df["date"] < target_date)
        recent = self.df.loc[mask, "result"].tolist()

        # Count frequencies
        freq = Counter(n for nums in recent for n in nums)

        # Divide range into num_predict equal bands
        total_range = self.max_val - self.min_val + 1
        band_size = total_range / self.number_predict

        selected = []
        for band_idx in range(self.number_predict):
            band_start = int(self.min_val + band_idx * band_size)
            band_end = int(self.min_val + (band_idx + 1) * band_size) - 1
            if band_idx == self.number_predict - 1:
                band_end = self.max_val  # Last band includes remainder

            # Numbers in this band
            band_nums = list(range(band_start, band_end + 1))

            # Dirichlet posterior weights for this band
            alpha = np.array(
                [self.prior_strength + freq.get(n, 0) for n in band_nums],
                dtype=float,
            )

            # Sample from Dirichlet for this band
            theta = np.random.dirichlet(alpha)

            # Exclude already selected
            available_mask = np.array([n not in selected for n in band_nums])
            if not available_mask.any():
                continue

            theta_masked = theta * available_mask
            if theta_masked.sum() == 0:
                continue

            theta_norm = theta_masked / theta_masked.sum()
            chosen_idx = np.random.choice(len(band_nums), p=theta_norm)
            selected.append(band_nums[chosen_idx])

        # Fill if stratification didn't produce enough
        all_nums = list(range(self.min_val, self.max_val + 1))
        while len(selected) < self.number_predict:
            remaining = [n for n in all_nums if n not in selected]
            if not remaining:
                break
            selected.append(random.choice(remaining))

        return sorted(selected[:self.number_predict])

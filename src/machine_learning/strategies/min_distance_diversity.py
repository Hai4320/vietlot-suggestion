"""
Minimum-distance diversity strategy for lottery ticket set generation.

Generates a set of N tickets that maximizes the minimum pairwise Jaccard
distance between any two tickets.  This ensures the ticket portfolio
covers as much of the number space as possible with minimal redundancy.

For a single ticket, falls back to Bayesian sampling.  The main value
is when generating multiple tickets (time_predict > 1 or called
multiple times).
"""

import random
from collections import Counter
from datetime import date, timedelta
from typing import List, Set

import numpy as np
import pandas as pd

from machine_learning.strategies.base import PredictModel


class MinDistanceDiversityStrategy(PredictModel):
    """
    Generate diverse tickets maximizing minimum pairwise Jaccard distance.

    Parameters
    ----------
    df : pd.DataFrame
        Historical draw data.
    lookback_days : int
        Lookback window for base frequency weighting.
    n_candidates : int
        Number of candidate tickets sampled per selection step.
    """

    def __init__(
        self,
        df: pd.DataFrame,
        time_predict: int = 1,
        min_val: int = PredictModel.POWER_655_MIN_VAL,
        max_val: int = PredictModel.POWER_655_MAX_VAL,
        lookback_days: int = 365,
        n_candidates: int = 100,
    ):
        super().__init__(df, time_predict, min_val, max_val)
        self.lookback_days = lookback_days
        self.n_candidates = n_candidates
        self._existing_tickets: List[Set[int]] = []

    @staticmethod
    def jaccard_distance(a: set, b: set) -> float:
        """Compute Jaccard distance between two sets."""
        if not a or not b:
            return 1.0
        return 1.0 - len(a & b) / len(a | b)

    def _get_weights(self, target_date: date) -> np.ndarray:
        """Get Bayesian-weighted probabilities for number selection."""
        cutoff = target_date - timedelta(days=self.lookback_days)
        mask = (self.df["date"] >= cutoff) & (self.df["date"] < target_date)
        recent = self.df.loc[mask, "result"].tolist()

        freq = Counter(n for nums in recent for n in nums)
        alpha = np.array(
            [1.0 + freq.get(i, 0) for i in range(self.min_val, self.max_val + 1)],
            dtype=float,
        )
        return np.random.dirichlet(alpha)

    def _generate_candidate(self, weights: np.ndarray) -> List[int]:
        """Generate a single candidate ticket using weighted sampling."""
        numbers = list(range(self.min_val, self.max_val + 1))
        w = weights.copy()
        selected = []
        for _ in range(self.number_predict):
            w_norm = w / w.sum()
            idx = np.random.choice(len(numbers), p=w_norm)
            selected.append(numbers[idx])
            w[idx] = 0  # No replacement
        return sorted(selected)

    def predict(self, target_date: date) -> List[int]:
        """
        Generate a ticket maximizing minimum distance to existing tickets.

        If this is the first ticket, uses Bayesian weighted sampling.
        For subsequent tickets, generates candidates and picks the one
        most different from all existing tickets.
        """
        weights = self._get_weights(target_date)

        if not self._existing_tickets:
            # First ticket — just sample from posterior
            ticket = self._generate_candidate(weights)
            self._existing_tickets.append(set(ticket))
            return ticket

        # Generate candidates and pick most diverse
        best_ticket = None
        best_min_dist = -1

        for _ in range(self.n_candidates):
            candidate = self._generate_candidate(weights)
            candidate_set = set(candidate)

            # Minimum distance to all existing tickets
            min_dist = min(
                self.jaccard_distance(candidate_set, existing)
                for existing in self._existing_tickets
            )

            if min_dist > best_min_dist:
                best_min_dist = min_dist
                best_ticket = candidate

        if best_ticket is None:
            best_ticket = self._generate_candidate(weights)

        self._existing_tickets.append(set(best_ticket))
        return best_ticket

    def reset(self):
        """Clear existing tickets for a new generation session."""
        self._existing_tickets = []

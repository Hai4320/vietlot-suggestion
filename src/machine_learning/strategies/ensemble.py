"""
Ensemble lottery prediction via Borda-count rank aggregation.

Runs multiple base strategies, collects their number rankings, and
aggregates via Borda count (the number ranked 1st by a strategy gets
v points, 2nd gets v-1, etc.).  The ensemble then selects the top-k
numbers from the aggregated ranking.

This is robust because it combines diverse signals and avoids
over-reliance on any single strategy's quirks.
"""

import random
from collections import Counter, defaultdict
from datetime import date, timedelta
from typing import Dict, List, Optional, Type

import numpy as np
import pandas as pd

from machine_learning.strategies.base import PredictModel


class EnsembleStrategy(PredictModel):
    """
    Ensemble strategy using Borda-count rank aggregation.

    Parameters
    ----------
    df : pd.DataFrame
        Historical draw data.
    base_strategies : list[tuple[type, dict]]
        List of (StrategyClass, params_dict) pairs for the base strategies
        to combine.  If None, uses a default set.
    randomization : float
        Probability of replacing each selected number with a random one,
        to add diversity.  Default 0.1.
    """

    def __init__(
        self,
        df: pd.DataFrame,
        time_predict: int = 1,
        min_val: int = PredictModel.POWER_655_MIN_VAL,
        max_val: int = PredictModel.POWER_655_MAX_VAL,
        base_strategies: Optional[list] = None,
        randomization: float = 0.1,
    ):
        super().__init__(df, time_predict, min_val, max_val)
        self.base_strategies = base_strategies
        self.randomization = randomization

    def _get_default_strategies(self):
        """Return default base strategies when none specified."""
        from machine_learning.strategies.exponential_decay import ExponentialDecayStrategy
        from machine_learning.strategies.frequency import FrequencyStrategy
        from machine_learning.strategies.long_absence import LongAbsenceStrategy
        from machine_learning.strategies.pattern import PatternStrategy

        return [
            (FrequencyStrategy, {"strategy_type": "hot", "lookback_days": 365}),
            (FrequencyStrategy, {"strategy_type": "cold", "lookback_days": 365}),
            (LongAbsenceStrategy, {"lookback_days": 365, "top_n": 15}),
            (PatternStrategy, {"lookback_days": 180}),
            (ExponentialDecayStrategy, {"half_life": 90, "hot": True}),
        ]

    def _get_strategy_ranking(self, strategy_class: type, params: dict, target_date: date) -> List[int]:
        """Get a ranking of all numbers from a base strategy."""
        # Run the strategy multiple times to estimate its preference
        model = strategy_class(
            df=self.df,
            min_val=self.min_val,
            max_val=self.max_val,
            **params,
        )
        model.number_predict = self.number_predict

        # Sample predictions and count how often each number appears
        vote_counts: Dict[int, int] = defaultdict(int)
        n_samples = 50

        for _ in range(n_samples):
            try:
                pred = model.predict(target_date)
                if pred:
                    for n in pred:
                        vote_counts[n] += 1
            except Exception:
                continue

        # Rank numbers by vote count (higher is better)
        all_nums = list(range(self.min_val, self.max_val + 1))
        ranked = sorted(all_nums, key=lambda n: vote_counts.get(n, 0), reverse=True)
        return ranked

    def predict(self, target_date: date) -> List[int]:
        """Predict using Borda-count aggregation of base strategies."""
        strategies = self.base_strategies or self._get_default_strategies()

        v = self.max_val - self.min_val + 1  # total numbers
        all_nums = list(range(self.min_val, self.max_val + 1))

        # Collect Borda scores
        borda_scores: Dict[int, float] = defaultdict(float)

        for cls, params in strategies:
            try:
                ranking = self._get_strategy_ranking(cls, params, target_date)
                for rank_pos, num in enumerate(ranking):
                    borda_scores[num] += v - rank_pos  # Higher score for better rank
            except Exception:
                continue

        # Sort by Borda score
        ranked = sorted(all_nums, key=lambda n: borda_scores.get(n, 0), reverse=True)

        # Select top numbers with randomization
        selected = []
        for i in range(self.number_predict):
            if random.random() < self.randomization:
                # Random replacement for diversity
                available = [n for n in all_nums if n not in selected]
                if available:
                    selected.append(random.choice(available))
            else:
                # Take from ranked list
                for n in ranked:
                    if n not in selected:
                        selected.append(n)
                        break

        return sorted(selected[: self.number_predict])

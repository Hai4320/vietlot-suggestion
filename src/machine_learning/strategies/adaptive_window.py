"""
Adaptive window strategy with self-tuning lookback period.

Instead of a fixed lookback window, this strategy automatically selects
the optimal window by performing a mini-backtest on the most recent draws.
It tests multiple window sizes and picks the one that would have performed
best in recent predictions.

This adapts to changing lottery dynamics — if recent draws show patterns
that favor short lookbacks, the strategy shortens its window, and vice
versa.
"""

import random
from collections import Counter
from datetime import date, timedelta
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

from machine_learning.strategies.base import PredictModel


class AdaptiveWindowStrategy(PredictModel):
    """
    Adaptive-window frequency strategy with self-tuning.

    Parameters
    ----------
    df : pd.DataFrame
        Historical draw data.
    candidate_windows : list[int]
        Window sizes (in days) to evaluate.  Default: [30, 60, 90, 180, 365].
    eval_draws : int
        Number of recent draws to use for window evaluation.
    strategy_type : str
        Base strategy type: 'hot', 'cold', or 'balanced'.
    """

    def __init__(
        self,
        df: pd.DataFrame,
        time_predict: int = 1,
        min_val: int = PredictModel.POWER_655_MIN_VAL,
        max_val: int = PredictModel.POWER_655_MAX_VAL,
        candidate_windows: List[int] = None,
        eval_draws: int = 30,
        strategy_type: str = "hot",
    ):
        super().__init__(df, time_predict, min_val, max_val)
        self.candidate_windows = candidate_windows or [30, 60, 90, 180, 365]
        self.eval_draws = eval_draws
        self.strategy_type = strategy_type
        self._window_cache: Dict[date, int] = {}

    def _evaluate_window(self, window_days: int, target_date: date, recent_draws: pd.DataFrame) -> float:
        """
        Evaluate a window size by counting matches on recent draws.

        Returns average match count — higher is better.
        """
        matches = []
        all_nums = list(range(self.min_val, self.max_val + 1))

        for _, row in recent_draws.iterrows():
            draw_date = row["date"]
            actual = set(row["result"][:self.number_predict])

            # Get frequency data for this window
            cutoff = draw_date - timedelta(days=window_days)
            mask = (self.df["date"] >= cutoff) & (self.df["date"] < draw_date)
            recent = self.df.loc[mask, "result"].tolist()

            if len(recent) < 5:
                continue

            freq = Counter(n for nums in recent for n in nums)

            # Predict using this frequency
            if self.strategy_type == "hot":
                sorted_nums = sorted(all_nums, key=lambda x: freq.get(x, 0), reverse=True)
            elif self.strategy_type == "cold":
                sorted_nums = sorted(all_nums, key=lambda x: freq.get(x, 0))
            else:  # balanced
                hot = sorted(all_nums, key=lambda x: freq.get(x, 0), reverse=True)[:self.number_predict]
                cold = sorted(all_nums, key=lambda x: freq.get(x, 0))[:self.number_predict]
                sorted_nums = list(set(hot + cold))

            predicted = set(sorted_nums[:self.number_predict])
            matches.append(len(predicted & actual))

        return np.mean(matches) if matches else 0.0

    def _select_best_window(self, target_date: date) -> int:
        """Select the best window size based on recent performance."""
        if target_date in self._window_cache:
            return self._window_cache[target_date]

        # Get recent draws for evaluation
        all_dates = sorted(self.df["date"].unique())
        target_idx = None
        for i, d in enumerate(all_dates):
            if d >= target_date:
                target_idx = i
                break

        if target_idx is None or target_idx < self.eval_draws:
            # Not enough history — default to 180 days
            return 180

        eval_dates = all_dates[max(0, target_idx - self.eval_draws):target_idx]
        recent_draws = self.df[self.df["date"].isin(eval_dates)]

        # Evaluate each window
        best_window = self.candidate_windows[0]
        best_score = -1

        for window in self.candidate_windows:
            score = self._evaluate_window(window, target_date, recent_draws)
            if score > best_score:
                best_score = score
                best_window = window

        self._window_cache[target_date] = best_window
        return best_window

    def predict(self, target_date: date) -> List[int]:
        """Predict using the best window discovered by mini-backtest."""
        window_days = self._select_best_window(target_date)

        cutoff = target_date - timedelta(days=window_days)
        mask = (self.df["date"] >= cutoff) & (self.df["date"] < target_date)
        recent = self.df.loc[mask, "result"].tolist()

        freq = Counter(n for nums in recent for n in nums)
        all_nums = list(range(self.min_val, self.max_val + 1))

        if self.strategy_type == "hot":
            sorted_nums = sorted(all_nums, key=lambda x: freq.get(x, 0), reverse=True)
        elif self.strategy_type == "cold":
            sorted_nums = sorted(all_nums, key=lambda x: freq.get(x, 0))
        else:
            hot = sorted(all_nums, key=lambda x: freq.get(x, 0), reverse=True)
            cold = sorted(all_nums, key=lambda x: freq.get(x, 0))
            # Take top hot and cold, mix
            hot_pick = self.number_predict // 2
            cold_pick = self.number_predict - hot_pick
            sorted_nums = hot[:hot_pick] + cold[:cold_pick]

        # Add randomization to top picks
        top_pool = sorted_nums[:self.number_predict * 2]
        selected = []

        for n in top_pool:
            if len(selected) >= self.number_predict:
                break
            if n not in selected:
                # 80% chance to keep, 20% to replace with random from pool
                if random.random() < 0.8 or len(selected) < self.number_predict // 2:
                    selected.append(n)
                else:
                    available = [x for x in all_nums if x not in selected]
                    if available:
                        selected.append(random.choice(available))

        # Fill remaining
        while len(selected) < self.number_predict:
            available = [x for x in all_nums if x not in selected]
            if available:
                selected.append(random.choice(available))
            else:
                break

        return sorted(selected[:self.number_predict])

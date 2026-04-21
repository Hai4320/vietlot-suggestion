"""GBM-based discriminative classifier for 3D (Chu Kỳ 12 — Path E).

Paradigm shift from 23 failed probabilistic strategies. Treats each of 1000
candidate numbers (000-999) as binary classification target: "will this number
appear in the next draw?". HistGradientBoostingClassifier (sklearn) fits on
rich hand-crafted features.

Pre-registered params per RESEARCH_HISTORY Chu Kỳ 12:
  HistGradientBoostingClassifier(max_iter=100, max_depth=4, learning_rate=0.05,
      l2_regularization=0.1, min_samples_leaf=20, random_state=42)
  refit_interval=100, lookback_windows=(30, 100, 300), downsample_neg_ratio=3

Features (13, fixed pre-reg):
  1-3. Recent freq in windows 30/100/300
  4.   Time-since-last-seen (capped at 500)
  5-7. Marginal digit P(d_i @ pos_i) in window 300
  8-10. Pair P(d_i, d_j) in window 300
  11.  Sum of digits
  12.  Sum parity
  13.  N distinct digits
"""
from __future__ import annotations

from collections import Counter
from typing import Dict, List, Optional, Tuple

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier

TIER_ORDER = ["Giải Đặc biệt", "Giải Nhất", "Giải Nhì", "Giải ba"]
N_FEATURES = 13
ALL_NUMBERS = np.arange(1000)  # 000..999


def _all_numbers(draw: Dict) -> List[str]:
    nums = []
    for tier in TIER_ORDER:
        nums.extend(draw["result"].get(tier, []))
    return nums


def _draw_to_int_set(draw: Dict) -> set[int]:
    out = set()
    for tier in TIER_ORDER:
        for n in draw["result"].get(tier, []):
            out.add(int(n))
    return out


def _build_history_stats(draws: List[Dict], end_idx: int):
    """Precompute aggregated stats from draws[:end_idx] for feature extraction.

    Returns dict with:
      - counts_by_window: {window_size: np.array(1000)} freq of each number in last `window_size` draws
      - last_seen: np.array(1000) — draw index (0-based from end_idx=0) of last occurrence, -1 if never
      - marg_pos: np.array(3, 10) — P(digit k at position p) from window 300
      - pair_pos: np.array(3, 10, 10) — P(d_i, d_j) from window 300 (flattened pairs)
    """
    stats = {"counts_by_window": {}, "last_seen": np.full(1000, -1, dtype=int)}

    # Counts by window (30, 100, 300)
    for window in (30, 100, 300):
        start = max(0, end_idx - window)
        cnt = np.zeros(1000, dtype=float)
        for i in range(start, end_idx):
            for n in _draw_to_int_set(draws[i]):
                cnt[n] += 1
        stats["counts_by_window"][window] = cnt

    # Last seen: scan backwards
    for i in range(end_idx - 1, -1, -1):
        for n in _draw_to_int_set(draws[i]):
            if stats["last_seen"][n] == -1:
                stats["last_seen"][n] = end_idx - 1 - i
        # Early exit if all filled (rare for small end_idx)

    # Marginals + pairs in window 300
    marg = np.ones((3, 10), dtype=float)  # Laplace smoothing with +1
    pair = np.ones((3, 10, 10), dtype=float)
    window = 300
    start = max(0, end_idx - window)
    total = 0
    for i in range(start, end_idx):
        for n in _draw_to_int_set(draws[i]):
            s = f"{n:03d}"
            d = [int(s[0]), int(s[1]), int(s[2])]
            for p in range(3):
                marg[p, d[p]] += 1
            pair[0, d[0], d[1]] += 1  # pos 0-1
            pair[1, d[0], d[2]] += 1  # pos 0-2
            pair[2, d[1], d[2]] += 1  # pos 1-2
            total += 1
    # Normalize per position
    marg = marg / marg.sum(axis=1, keepdims=True)
    pair[0] /= pair[0].sum()
    pair[1] /= pair[1].sum()
    pair[2] /= pair[2].sum()
    stats["marg_pos"] = marg
    stats["pair_pos"] = pair
    return stats


def _features_for_all_numbers(stats: dict) -> np.ndarray:
    """Compute (1000, N_FEATURES) feature matrix using precomputed stats.

    Vectorized across all 1000 candidate numbers.
    """
    n = 1000
    X = np.zeros((n, N_FEATURES), dtype=float)
    digits = np.zeros((n, 3), dtype=int)
    digits[:, 0] = ALL_NUMBERS // 100
    digits[:, 1] = (ALL_NUMBERS // 10) % 10
    digits[:, 2] = ALL_NUMBERS % 10

    # F1-3: recent freq
    X[:, 0] = stats["counts_by_window"][30]
    X[:, 1] = stats["counts_by_window"][100]
    X[:, 2] = stats["counts_by_window"][300]

    # F4: time-since-last-seen (cap at 500; -1 → 500 sentinel)
    last_seen = stats["last_seen"].astype(float)
    ts = np.where(last_seen < 0, 500.0, np.minimum(last_seen, 500.0))
    X[:, 3] = ts

    # F5-7: marginals at pos
    marg = stats["marg_pos"]
    X[:, 4] = marg[0, digits[:, 0]]
    X[:, 5] = marg[1, digits[:, 1]]
    X[:, 6] = marg[2, digits[:, 2]]

    # F8-10: pairs
    pair = stats["pair_pos"]
    X[:, 7] = pair[0, digits[:, 0], digits[:, 1]]  # pos 0-1
    X[:, 8] = pair[1, digits[:, 0], digits[:, 2]]  # pos 0-2
    X[:, 9] = pair[2, digits[:, 1], digits[:, 2]]  # pos 1-2

    # F11: sum
    X[:, 10] = digits.sum(axis=1)

    # F12: sum parity
    X[:, 11] = X[:, 10] % 2

    # F13: n distinct digits
    # Count unique per row
    n_dist = np.where(
        (digits[:, 0] != digits[:, 1])
        & (digits[:, 0] != digits[:, 2])
        & (digits[:, 1] != digits[:, 2]),
        3,
        np.where(
            (digits[:, 0] == digits[:, 1]) & (digits[:, 0] == digits[:, 2]),
            1,
            2,
        ),
    )
    X[:, 12] = n_dist

    return X


class Strategy3D:
    """Match interface (duck-typed)."""
    name: str = "base"
    description: str = ""
    category: str = ""

    def predict(self, train_draws: List[Dict], n_predictions: int = 2) -> List[str]:
        raise NotImplementedError


class GBMDigitClassifier(Strategy3D):
    """HistGradientBoosting per-number binary classifier.

    Training: for each past draw t in [min_t_start, current), build features from
    draws[:t], label = 1 if candidate number in draws[t], else 0. Train one model
    across all (t, candidate) rows with downsample of negatives.

    Prediction: score all 1000 candidates → top-N by predict_proba.
    """
    name = "GBMDigitClassifier"
    description = "HistGradientBoosting per-candidate binary classifier with hand-crafted features"
    category = "E: Tree-based Discriminative"

    def __init__(
        self,
        refit_interval: int = 100,
        min_t_start: int = 50,
        downsample_neg_ratio: float = 3.0,
        random_state: int = 42,
    ):
        self.refit_interval = refit_interval
        self.min_t_start = min_t_start
        self.downsample_neg_ratio = downsample_neg_ratio
        self.random_state = random_state
        self._model: Optional[HistGradientBoostingClassifier] = None
        self._last_fit_n: int = -10**9
        self._rng = np.random.default_rng(random_state)
        # Cache: per-timestep (X_t, y_t) already built; only build new t on refit
        self._X_cache: List[np.ndarray] = []
        self._y_cache: List[np.ndarray] = []
        self._next_t_to_build: int = -1

    def _build_training_set(self, train_draws: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Build (X, y) incrementally — only add NEW timesteps since last call.

        Cache persists across refits within one strategy instance (one backtest run).
        Downsampling applied once at return time over the full cached rows.
        """
        n = len(train_draws)
        if n <= self.min_t_start + 1:
            return np.zeros((0, N_FEATURES)), np.zeros(0, dtype=int)

        if self._next_t_to_build < 0:
            self._next_t_to_build = self.min_t_start

        for t in range(self._next_t_to_build, n):
            stats = _build_history_stats(train_draws, t)
            X_t = _features_for_all_numbers(stats)
            in_draw = _draw_to_int_set(train_draws[t])
            y_t = np.zeros(1000, dtype=int)
            for num in in_draw:
                y_t[num] = 1
            self._X_cache.append(X_t)
            self._y_cache.append(y_t)
        self._next_t_to_build = n

        X = np.vstack(self._X_cache)
        y = np.concatenate(self._y_cache)

        pos_idx = np.where(y == 1)[0]
        neg_idx = np.where(y == 0)[0]
        target_neg_n = int(len(pos_idx) * self.downsample_neg_ratio)
        if target_neg_n < len(neg_idx):
            neg_sample = self._rng.choice(neg_idx, size=target_neg_n, replace=False)
            keep = np.concatenate([pos_idx, neg_sample])
            X = X[keep]
            y = y[keep]
        return X, y

    def _maybe_refit(self, train_draws: List[Dict]) -> None:
        n = len(train_draws)
        if self._model is not None and (n - self._last_fit_n) < self.refit_interval:
            return
        X, y = self._build_training_set(train_draws)
        if len(y) < 100 or y.sum() < 10 or y.sum() == len(y):
            # Not enough data or degenerate; fallback handled in predict
            self._model = None
            self._last_fit_n = n
            return
        model = HistGradientBoostingClassifier(
            max_iter=100,
            max_depth=4,
            learning_rate=0.05,
            l2_regularization=0.1,
            min_samples_leaf=20,
            random_state=self.random_state,
            early_stopping=False,
        )
        model.fit(X, y)
        self._model = model
        self._last_fit_n = n

    def predict(self, train_draws: List[Dict], n_predictions: int = 2) -> List[str]:
        self._maybe_refit(train_draws)
        n = len(train_draws)
        if self._model is None:
            # Fallback uniform random (rare — only when training data insufficient)
            import random
            out = []
            seen = set()
            while len(out) < n_predictions:
                num = f"{random.randint(0, 999):03d}"
                if num not in seen:
                    seen.add(num)
                    out.append(num)
            return out

        stats = _build_history_stats(train_draws, n)
        X = _features_for_all_numbers(stats)
        # predict_proba class order [0, 1]; take P(class=1)
        probs = self._model.predict_proba(X)[:, 1]
        # Sort descending, pick top-N
        top_idx = np.argsort(probs)[::-1][:n_predictions]
        return [f"{int(i):03d}" for i in top_idx]


if __name__ == "__main__":
    # Smoke test
    import json
    import random
    import time
    from pathlib import Path
    data_dir = Path(__file__).resolve().parents[3] / "data"
    draws = [json.loads(line) for line in (data_dir / "3d.jsonl").read_text().strip().split("\n")[:300]]
    np.random.seed(42)
    random.seed(42)
    s = GBMDigitClassifier(refit_interval=100, min_t_start=50)
    t0 = time.time()
    preds = s.predict(draws, n_predictions=2)
    t1 = time.time()
    print(f"{s.name}: {preds}  (fit+predict time: {t1-t0:.1f}s)")

"""Cross-product pooling strategies for 3D (Chu Kỳ 13 — Path B).

Hypothesis: Max 3D and Max 3D Pro share RNG infrastructure; pooling data
across products yields tighter bias estimates → better predictions.

Two strategies:
  - PooledDigitBias: fit 1000-cell joint histogram from pooled data (hard pool)
  - HierarchicalBayesDigit: weighted mix of pooled prior + own-product posterior (soft pool)

Walk-forward semantics (strict): when predicting own-product at date D,
other-product contribution is filtered by date ≤ D (uses bisect on sorted
dates). No look-ahead.

Pre-registered params per RESEARCH_HISTORY Chu Kỳ 13:
  lookback_per_product=300, temperature=1.0, alpha=1.0
  HierarchicalBayesDigit: w_own=0.5
"""
from __future__ import annotations

import bisect
import random
from typing import Dict, List

import numpy as np

TIER_ORDER = ["Giải Đặc biệt", "Giải Nhất", "Giải Nhì", "Giải ba"]


def _all_numbers(draw: Dict) -> List[str]:
    nums = []
    for tier in TIER_ORDER:
        nums.extend(draw["result"].get(tier, []))
    return nums


def _count_joint(draws: List[Dict], alpha: float = 1.0) -> np.ndarray:
    """Return 1000-cell count array with Laplace smoothing (α per cell)."""
    joint = np.full(1000, alpha, dtype=float)
    for d in draws:
        for num in _all_numbers(d):
            joint[int(num)] += 1
    return joint


class Strategy3D:
    name: str = "base"
    description: str = ""
    category: str = ""

    def predict(self, train_draws: List[Dict], n_predictions: int = 2) -> List[str]:
        raise NotImplementedError


class _DateFilteredOther:
    """Helper: pre-sorted other-product draws, binary-search filter by date cutoff."""
    def __init__(self, other_draws: List[Dict]):
        # Sort by date ascending; dates are ISO strings → lexicographic order valid
        self.sorted = sorted(other_draws, key=lambda d: d["date"])
        self.dates = [d["date"] for d in self.sorted]

    def up_to(self, cutoff_date: str) -> List[Dict]:
        """Return other_draws với date ≤ cutoff (inclusive)."""
        idx = bisect.bisect_right(self.dates, cutoff_date)
        return self.sorted[:idx]


class PooledDigitBiasStrategy(Strategy3D):
    """Hard pool: treat own + date-filtered other as single population.

    Same sampling mechanism as JointDigitBiasStrategy (1000-cell histogram
    + Laplace smoothing + temperature sampling) but fit on POOLED data.
    """
    name = "PooledDigitBias"
    description = "Hard-pool joint digit histogram from own + other product (date-filtered)"
    category = "Cross-product pool"

    def __init__(
        self,
        other_draws: List[Dict],
        lookback_per_product: int = 300,
        temperature: float = 1.0,
        alpha: float = 1.0,
    ):
        self.other = _DateFilteredOther(other_draws)
        self.lookback_per_product = lookback_per_product
        self.temperature = temperature
        self.alpha = alpha

    def predict(self, train_draws: List[Dict], n_predictions: int = 2) -> List[str]:
        # Get own product's recent window
        own_recent = train_draws[-self.lookback_per_product :] if train_draws else []

        # Filter other-product by date ≤ last own train date
        if own_recent:
            cutoff = own_recent[-1]["date"]
            other_filtered = self.other.up_to(cutoff)
            other_recent = other_filtered[-self.lookback_per_product :]
        else:
            other_recent = []

        pooled = own_recent + other_recent

        joint = _count_joint(pooled, alpha=self.alpha)

        # Temperature scaling
        log_joint = np.log(joint)
        log_joint /= self.temperature
        joint = np.exp(log_joint - np.max(log_joint))
        joint /= joint.sum()

        indices = np.random.choice(1000, size=n_predictions, replace=False, p=joint)
        return [f"{i:03d}" for i in indices]


class HierarchicalBayesDigitStrategy(Strategy3D):
    """Soft pool: α_combined = (1−w) × α_pooled + w × α_own.

    With w=0.5 (pre-registered), equal weight to pooled prior and own
    posterior. Temperature sampling as before.
    """
    name = "HierarchicalBayesDigit"
    description = "Soft pool: weighted mix of pooled + own product joint histogram"
    category = "Cross-product pool"

    def __init__(
        self,
        other_draws: List[Dict],
        lookback_per_product: int = 300,
        w_own: float = 0.5,
        temperature: float = 1.0,
        alpha: float = 1.0,
    ):
        self.other = _DateFilteredOther(other_draws)
        self.lookback_per_product = lookback_per_product
        self.w_own = w_own
        self.temperature = temperature
        self.alpha = alpha

    def predict(self, train_draws: List[Dict], n_predictions: int = 2) -> List[str]:
        own_recent = train_draws[-self.lookback_per_product :] if train_draws else []
        if own_recent:
            cutoff = own_recent[-1]["date"]
            other_filtered = self.other.up_to(cutoff)
            other_recent = other_filtered[-self.lookback_per_product :]
        else:
            other_recent = []

        # Separate counts
        own_counts = _count_joint(own_recent, alpha=self.alpha)
        # "Pooled" prior = own + other combined (treat symmetrically as aggregate)
        pooled_counts = _count_joint(own_recent + other_recent, alpha=self.alpha)

        # Normalize to probabilities
        p_own = own_counts / own_counts.sum()
        p_pooled = pooled_counts / pooled_counts.sum()

        # Weighted combination
        p_combined = self.w_own * p_own + (1.0 - self.w_own) * p_pooled

        # Temperature scaling
        log_p = np.log(p_combined + 1e-12)
        log_p /= self.temperature
        p = np.exp(log_p - np.max(log_p))
        p /= p.sum()

        indices = np.random.choice(1000, size=n_predictions, replace=False, p=p)
        return [f"{i:03d}" for i in indices]


if __name__ == "__main__":
    # Smoke test: load both products, run each strategy on Max 3D, print predictions
    import json
    from pathlib import Path
    data_dir = Path(__file__).resolve().parents[3] / "data"
    max_3d = [json.loads(l) for l in (data_dir / "3d.jsonl").read_text().strip().split("\n")]
    max_3d_pro = [json.loads(l) for l in (data_dir / "3d_pro.jsonl").read_text().strip().split("\n")]
    max_3d.sort(key=lambda d: d["date"])
    max_3d_pro.sort(key=lambda d: d["date"])

    np.random.seed(42); random.seed(42)
    for strat_cls in (PooledDigitBiasStrategy, HierarchicalBayesDigitStrategy):
        s = strat_cls(other_draws=max_3d_pro, lookback_per_product=300)
        preds = s.predict(max_3d[:500], n_predictions=2)
        print(f"{s.name}: {preds}")

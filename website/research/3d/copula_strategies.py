"""Copula-based joint digit strategies for 3D (Chu Kỳ 11 — Path A).

Two strategies modeling joint digit distribution P(d0, d1, d2) via copula
decomposition (separate marginals × dependency structure):

  - GaussianCopulaEmpMargins: empirical CDF per position → Gaussian copula on ranks
  - EmpiricalCopula: pure non-parametric rank-rank resampling

Mechanism contrast vs existing `JointDigitBiasStrategy` (advanced_backtest.py):
  JointDigitBias treats joint as flat 1000-cell histogram with Laplace smoothing +
  temperature sampling. It entangles marginals with dependency and cannot separate
  bias sources. Copula decomposition models them independently:
    F_joint(d0, d1, d2) = C(F_0(d0), F_1(d1), F_2(d2))
  where C is the copula function and F_i are marginals.

Usage (same interface as Strategy3D):
    strat = GaussianCopulaEmpMargins(lookback=300, refit_interval=50, alpha=1.0)
    preds = strat.predict(train_draws, n_predictions=2)

Pre-registered params per RESEARCH_HISTORY Chu Kỳ 11:
    lookback=300, refit_interval=50, alpha=1.0 (Laplace smoothing).
    Seed handled by caller (numpy global RNG).
"""
from __future__ import annotations

import random
from typing import Any, Dict, List, Optional

import numpy as np
from scipy import stats

TIER_ORDER = ["Giải Đặc biệt", "Giải Nhất", "Giải Nhì", "Giải ba"]


def _all_numbers(draw: Dict) -> List[str]:
    nums = []
    for tier in TIER_ORDER:
        nums.extend(draw["result"].get(tier, []))
    return nums


def _digits_from_draws(draws: List[Dict]) -> np.ndarray:
    """Extract (N, 3) array of digit positions from draws (all tiers flattened)."""
    rows = []
    for d in draws:
        for num in _all_numbers(d):
            s = str(num).zfill(3)
            rows.append([int(s[0]), int(s[1]), int(s[2])])
    if not rows:
        return np.zeros((0, 3), dtype=int)
    return np.asarray(rows, dtype=int)


def _empirical_cdf_per_position(samples: np.ndarray, alpha: float = 1.0) -> np.ndarray:
    """Compute smoothed empirical CDF per position.

    Returns (3, 10) array where cdf[pos, k] = P(digit <= k at position pos),
    with Laplace smoothing (add `alpha` to each bin count).
    """
    n = samples.shape[0]
    cdf = np.zeros((3, 10))
    for pos in range(3):
        counts = np.bincount(samples[:, pos], minlength=10).astype(float)
        counts += alpha  # Laplace smoothing
        probs = counts / counts.sum()
        cdf[pos] = np.cumsum(probs)
    return cdf


def _cdf_to_uniform(samples: np.ndarray, cdf: np.ndarray) -> np.ndarray:
    """Convert digit samples → (0, 1) uniforms via midpoint of CDF step.

    For digit k at position pos, we return midpoint of [cdf(k-1), cdf(k)] which
    gives approximate rank. Add small random jitter within the bin to avoid ties.
    """
    n = samples.shape[0]
    u = np.zeros((n, 3))
    for pos in range(3):
        for i in range(n):
            k = samples[i, pos]
            lo = cdf[pos, k - 1] if k > 0 else 0.0
            hi = cdf[pos, k]
            u[i, pos] = np.random.uniform(lo, hi)
    # Clip to (eps, 1-eps) for stable inverse-normal
    eps = 1e-6
    return np.clip(u, eps, 1.0 - eps)


def _uniform_to_digit(u: np.ndarray, cdf: np.ndarray) -> np.ndarray:
    """Invert: (0,1) uniform → digit via smoothed CDF per position.

    u: shape (n, 3) in (0, 1). Returns (n, 3) int digits 0..9.
    """
    n = u.shape[0]
    out = np.zeros((n, 3), dtype=int)
    for pos in range(3):
        # For each uniform sample, find smallest k s.t. cdf[pos, k] >= u
        out[:, pos] = np.searchsorted(cdf[pos], u[:, pos], side="left")
        out[:, pos] = np.clip(out[:, pos], 0, 9)
    return out


class Strategy3D:
    """Match interface in advanced_backtest.py (duck-typed, not imported to avoid cycle)."""
    name: str = "base"
    description: str = ""
    category: str = ""

    def predict(self, train_draws: List[Dict], n_predictions: int = 2) -> List[str]:
        raise NotImplementedError


class GaussianCopulaEmpMargins(Strategy3D):
    """Gaussian copula with empirical marginals for joint digit distribution.

    Algorithm:
      1. Extract digits (N, 3) from lookback window of training draws.
      2. Build empirical CDF F_i(d) per position (with Laplace smoothing α).
      3. Transform observations to uniforms u_i = F_i(d_i) (midpoint-of-bin + jitter).
      4. Transform uniforms to standard normal z = Φ^-1(u).
      5. Estimate 3×3 correlation matrix R from (z_0, z_1, z_2).
      6. Sample: z' ~ MVN(0, R), u' = Φ(z'), d' = F_i^-1(u') (via searchsorted).

    Refit interval: recomputes R every `refit_interval` draws (cached until then).
    """
    name = "GaussianCopulaEmpMargins"
    description = "Gaussian copula with empirical CDF per position; joint digit sampling"
    category = "A: Bias-Exploiting (Copula)"

    def __init__(self, lookback: int = 300, refit_interval: int = 50, alpha: float = 1.0):
        self.lookback = lookback
        self.refit_interval = refit_interval
        self.alpha = alpha
        self._cdf: Optional[np.ndarray] = None
        self._corr: Optional[np.ndarray] = None
        self._last_fit_n: int = -10**9  # force fit on first call

    def _maybe_refit(self, train_draws: List[Dict]) -> None:
        n = len(train_draws)
        if self._cdf is not None and (n - self._last_fit_n) < self.refit_interval:
            return
        recent = train_draws[-self.lookback :] if self.lookback else train_draws
        samples = _digits_from_draws(recent)
        if samples.shape[0] < 30:
            # Not enough data — fall back to uniform marginals, identity corr
            self._cdf = np.tile(np.linspace(0.1, 1.0, 10), (3, 1))
            self._corr = np.eye(3)
            self._last_fit_n = n
            return
        self._cdf = _empirical_cdf_per_position(samples, alpha=self.alpha)
        u = _cdf_to_uniform(samples, self._cdf)
        z = stats.norm.ppf(u)
        # Correlation matrix (handle edge case of constant column → identity)
        try:
            corr = np.corrcoef(z, rowvar=False)
            if np.any(np.isnan(corr)) or np.any(np.isinf(corr)):
                corr = np.eye(3)
            else:
                # Ensure positive definite: mix with eye if needed
                eigvals = np.linalg.eigvalsh(corr)
                if eigvals.min() < 1e-6:
                    corr = 0.99 * corr + 0.01 * np.eye(3)
        except Exception:
            corr = np.eye(3)
        self._corr = corr
        self._last_fit_n = n

    def predict(self, train_draws: List[Dict], n_predictions: int = 2) -> List[str]:
        self._maybe_refit(train_draws)
        assert self._cdf is not None and self._corr is not None

        results: List[str] = []
        seen: set[str] = set()
        # Sample generously, dedupe, fallback to random if needed
        mean = np.zeros(3)
        cov = self._corr
        for _ in range(n_predictions * 10):
            if len(results) >= n_predictions:
                break
            z = np.random.multivariate_normal(mean, cov, size=1)
            u = stats.norm.cdf(z)
            d = _uniform_to_digit(u, self._cdf)[0]
            num = f"{d[0]}{d[1]}{d[2]}"
            if num not in seen:
                seen.add(num)
                results.append(num)

        while len(results) < n_predictions:
            num = f"{random.randint(0, 999):03d}"
            if num not in seen:
                seen.add(num)
                results.append(num)
        return results


class EmpiricalCopula(Strategy3D):
    """Pure non-parametric empirical copula via rank-rank resampling.

    Algorithm:
      1. Extract digits (N, 3) from lookback window.
      2. For each observed triple, compute pseudo-observations (rank/(N+1)) per position.
      3. To sample: pick a random observed triple → get its rank triple (u_0, u_1, u_2).
      4. Jitter each u_i uniformly within its rank bin (width 1/(N+1)).
      5. Invert to digit via empirical CDF (same as Gaussian version, for consistency).

    This preserves the full empirical joint rank structure without parametric
    assumption. Differs from `JointDigitBias` which samples directly from the
    1000-cell histogram — here we decouple marginals from dependency.
    """
    name = "EmpiricalCopula"
    description = "Pure non-parametric empirical copula via rank-rank resampling"
    category = "A: Bias-Exploiting (Copula)"

    def __init__(self, lookback: int = 300, refit_interval: int = 50, alpha: float = 1.0):
        self.lookback = lookback
        self.refit_interval = refit_interval
        self.alpha = alpha
        self._cdf: Optional[np.ndarray] = None
        self._ranks: Optional[np.ndarray] = None  # (N_eff, 3) pseudo-obs in (0,1)
        self._last_fit_n: int = -10**9

    def _maybe_refit(self, train_draws: List[Dict]) -> None:
        n = len(train_draws)
        if self._ranks is not None and (n - self._last_fit_n) < self.refit_interval:
            return
        recent = train_draws[-self.lookback :] if self.lookback else train_draws
        samples = _digits_from_draws(recent)
        if samples.shape[0] < 30:
            self._cdf = np.tile(np.linspace(0.1, 1.0, 10), (3, 1))
            self._ranks = None
            self._last_fit_n = n
            return
        self._cdf = _empirical_cdf_per_position(samples, alpha=self.alpha)
        # Pseudo-observations: rank/(N+1) per column
        n_eff = samples.shape[0]
        ranks = np.zeros_like(samples, dtype=float)
        for pos in range(3):
            # argsort gives rank when inverted; use rankdata for ties
            r = stats.rankdata(samples[:, pos], method="average")
            ranks[:, pos] = r / (n_eff + 1.0)
        self._ranks = ranks
        self._last_fit_n = n

    def predict(self, train_draws: List[Dict], n_predictions: int = 2) -> List[str]:
        self._maybe_refit(train_draws)
        assert self._cdf is not None

        if self._ranks is None or self._ranks.shape[0] == 0:
            # Fallback to random
            out = []
            while len(out) < n_predictions:
                num = f"{random.randint(0, 999):03d}"
                if num not in out:
                    out.append(num)
            return out

        results: List[str] = []
        seen: set[str] = set()
        n_eff = self._ranks.shape[0]
        jitter = 1.0 / (n_eff + 1.0)
        for _ in range(n_predictions * 10):
            if len(results) >= n_predictions:
                break
            idx = np.random.randint(0, n_eff)
            base = self._ranks[idx]
            # Jitter within rank bin to avoid collapse to observed digits only
            u = np.clip(
                base + np.random.uniform(-jitter / 2, jitter / 2, size=3),
                1e-6, 1.0 - 1e-6,
            )
            d = _uniform_to_digit(u.reshape(1, 3), self._cdf)[0]
            num = f"{d[0]}{d[1]}{d[2]}"
            if num not in seen:
                seen.add(num)
                results.append(num)

        while len(results) < n_predictions:
            num = f"{random.randint(0, 999):03d}"
            if num not in seen:
                seen.add(num)
                results.append(num)
        return results


if __name__ == "__main__":
    # Smoke test
    import json
    from pathlib import Path
    data_dir = Path(__file__).resolve().parents[3] / "data"
    draws = []
    for line in (data_dir / "3d.jsonl").read_text().strip().split("\n")[:200]:
        draws.append(json.loads(line))
    for strat_cls in (GaussianCopulaEmpMargins, EmpiricalCopula):
        np.random.seed(42)
        random.seed(42)
        s = strat_cls(lookback=100, refit_interval=50)
        preds = s.predict(draws, n_predictions=2)
        print(f"{s.name}: {preds}")

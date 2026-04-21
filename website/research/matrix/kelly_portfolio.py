"""Kelly-proxy multi-ticket portfolio strategies for matrix products (Chu Kỳ 16 — Path #2).

Pre-registered [history/cycle16_kelly_portfolio.md](../history/cycle16_kelly_portfolio.md).

Paradigm shift: multi-ticket (N tickets per draw), ROI-axis primary, `p_any_hit_ge3`
gate.

Mechanism (Kelly-proxy, not full MC Kelly):
  1. θ = Bayesian posterior mean from lookback_days
  2. candidates = all C(top_M, K) combinations of top_M hot (or cold for AntiHot) numbers
  3. score(t) = Σ θ[i] for i ∈ t   (hot) OR  Σ (1 − θ[i])  (anti-hot)
  4. Select N tickets greedily by score, optionally subject to Hamming ≥ diversity_min

Future-feature note (user 2026-04-21): this cycle fixes N=20. Post-Accept, extend
to user-facing "budget-aware optimal-N" selection by replacing step 4 with
Kelly-fraction-based cutoff. Code structures score/select as independent steps
for that extension.
"""

from __future__ import annotations

import sys
from collections import Counter
from datetime import timedelta
from itertools import combinations
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
# StrategyBase is single-ticket; multi-ticket uses bespoke MultiTicketBase below.
from backtest import StrategyBase  # noqa: E402, F401  (re-exported)


class MultiTicketBase:
    """Base class for multi-ticket strategies.

    API: predict_n(train_df, target_date, min_val, max_val, num_count, n_tickets)
    returns list[list[int]] of n_tickets tickets.
    """

    name = "multi_ticket_base"

    def predict_n(
        self,
        train_df: pd.DataFrame,
        target_date,
        min_val: int,
        max_val: int,
        num_count: int,
        n_tickets: int,
    ) -> list[list[int]]:
        raise NotImplementedError


class RandomNStrategy(MultiTicketBase):
    """Mandatory baseline: N independent uniform-random tickets."""

    name = "RandomN"

    def predict_n(self, train_df, target_date, min_val, max_val, num_count, n_tickets):
        import random

        return [
            sorted(random.sample(range(min_val, max_val + 1), num_count))
            for _ in range(n_tickets)
        ]


class HotNStrategy(MultiTicketBase):
    """Simple ref: N independent tickets each drawn from top-hot with noise.

    Per-ticket: sample K numbers weighted by frequency count (Dirichlet posterior).
    Isolates "just pick hot" vs Kelly-structured candidate+select.
    """

    name = "HotN"

    def __init__(self, lookback_days: int = 365, prior_strength: float = 1.0) -> None:
        self.lookback_days = lookback_days
        self.prior_strength = prior_strength

    def predict_n(self, train_df, target_date, min_val, max_val, num_count, n_tickets):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        freq = Counter(n for nums in recent for n in nums)
        alpha = np.array(
            [self.prior_strength + freq.get(i, 0) for i in range(min_val, max_val + 1)],
            dtype=float,
        )
        numbers = list(range(min_val, max_val + 1))
        tickets = []
        for _ in range(n_tickets):
            theta = np.random.dirichlet(alpha)
            selected: list[int] = []
            probs = theta.copy()
            for _ in range(num_count):
                if probs.sum() > 0:
                    p = probs / probs.sum()
                else:
                    p = np.ones_like(probs) / len(probs)
                idx = np.random.choice(len(numbers), p=p)
                selected.append(numbers[idx])
                probs[idx] = 0.0
            tickets.append(sorted(selected))
        return tickets


class PatternNStrategy(MultiTicketBase):
    """N independent Pattern tickets (range-stratified single-ticket × N).

    Delegates to existing PatternStrategy per ticket.
    """

    name = "PatternN"

    def __init__(self, lookback_days: int = 180) -> None:
        from backtest import PatternStrategy

        self.lookback_days = lookback_days
        self._inner = PatternStrategy(lookback_days=lookback_days)

    def predict_n(self, train_df, target_date, min_val, max_val, num_count, n_tickets):
        return [
            self._inner.predict(train_df, target_date, min_val, max_val, num_count)
            for _ in range(n_tickets)
        ]


def _posterior_mean(
    train_df: pd.DataFrame,
    target_date,
    min_val: int,
    max_val: int,
    lookback_days: int,
    prior_strength: float,
) -> np.ndarray:
    """Bayesian posterior mean θ[i] = alpha[i] / sum(alpha) with Dirichlet prior."""
    cutoff = target_date - timedelta(days=lookback_days)
    recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
    freq = Counter(n for nums in recent for n in nums)
    alpha = np.array(
        [prior_strength + freq.get(i, 0) for i in range(min_val, max_val + 1)],
        dtype=float,
    )
    return alpha / alpha.sum()


def _hamming_distance(t1: list[int], t2: list[int]) -> int:
    """Number of positions differing (equivalently: K - |intersection|).

    For lottery tickets of equal length K: Hamming = K - intersection_size.
    """
    return len(t1) - len(set(t1) & set(t2))


def _select_kelly_greedy(
    candidates: list[list[int]],
    scores: list[float],
    n_tickets: int,
    diversity_min: int,
) -> list[list[int]]:
    """Sort candidates by score desc, greedy select N subject to Hamming ≥ diversity_min.

    If diversity_min=0, no diversity constraint (pure top-N).
    """
    order = sorted(range(len(candidates)), key=lambda i: -scores[i])
    selected: list[list[int]] = []
    for idx in order:
        cand = candidates[idx]
        if diversity_min <= 0 or all(
            _hamming_distance(cand, s) >= diversity_min for s in selected
        ):
            selected.append(cand)
            if len(selected) >= n_tickets:
                break
    # Fallback: if diversity too strict to fill budget, relax to pure top-N
    if len(selected) < n_tickets:
        taken = {tuple(t) for t in selected}
        for idx in order:
            cand = candidates[idx]
            if tuple(cand) in taken:
                continue
            selected.append(cand)
            taken.add(tuple(cand))
            if len(selected) >= n_tickets:
                break
    return selected


class KellyPortfolioStrategy(MultiTicketBase):
    """Kelly-proxy multi-ticket portfolio.

    Direction:
      - direction='hot' → score(t) = Σ θ[i]   (bet on biased-toward numbers)
      - direction='anti_hot' → score(t) = Σ (1 − θ[i])  (sanity check: cold)

    Candidate pool: all C(top_M, K) combinations of top_M numbers (by θ for hot,
    by (1-θ) for anti_hot).

    Selection: greedy top score subject to Hamming ≥ diversity_min (0 = no div).
    """

    def __init__(
        self,
        direction: str = "hot",
        top_m: int = 15,
        diversity_min: int = 3,
        lookback_days: int = 365,
        prior_strength: float = 1.0,
    ) -> None:
        if direction not in ("hot", "anti_hot"):
            raise ValueError(f"direction must be 'hot' or 'anti_hot', got {direction}")
        self.direction = direction
        self.top_m = top_m
        self.diversity_min = diversity_min
        self.lookback_days = lookback_days
        self.prior_strength = prior_strength
        div_tag = f"_H{diversity_min}" if diversity_min > 0 else "_Plain"
        dir_tag = "Hot" if direction == "hot" else "AntiHot"
        self.name = f"KellyPortfolio_{dir_tag}{div_tag}"

    def predict_n(self, train_df, target_date, min_val, max_val, num_count, n_tickets):
        theta = _posterior_mean(
            train_df,
            target_date,
            min_val,
            max_val,
            self.lookback_days,
            self.prior_strength,
        )
        numbers = list(range(min_val, max_val + 1))

        # Score per number (direction-dependent)
        if self.direction == "hot":
            number_scores = theta
        else:  # anti_hot
            number_scores = 1.0 - theta

        # Pick top-M numbers by direction-specific score
        top_m_actual = min(self.top_m, len(numbers))
        top_indices = np.argsort(-number_scores)[:top_m_actual]
        top_numbers = sorted(numbers[i] for i in top_indices)

        # Enumerate all C(top_M, K) candidates
        candidates: list[list[int]] = [
            sorted(combo) for combo in combinations(top_numbers, num_count)
        ]

        # Score each candidate ticket by summing per-number scores
        cand_scores: list[float] = []
        for cand in candidates:
            s = 0.0
            for n in cand:
                idx = n - min_val
                s += float(number_scores[idx])
            cand_scores.append(s)

        return _select_kelly_greedy(candidates, cand_scores, n_tickets, self.diversity_min)


if __name__ == "__main__":
    import random
    import time

    from backtest import MATRIX_PRODUCTS, load_matrix_data

    random.seed(42)
    np.random.seed(42)

    print("Loading Mega 6/45...")
    df = load_matrix_data("power_645")
    cfg = MATRIX_PRODUCTS["power_645"]

    for strat in [
        RandomNStrategy(),
        HotNStrategy(lookback_days=365),
        KellyPortfolioStrategy(direction="hot", top_m=15, diversity_min=3),
        KellyPortfolioStrategy(direction="hot", top_m=15, diversity_min=0),
        KellyPortfolioStrategy(direction="anti_hot", top_m=15, diversity_min=3),
    ]:
        t0 = time.time()
        tickets = strat.predict_n(
            df.iloc[:200],
            df.iloc[200]["date"],
            cfg["min_val"],
            cfg["max_val"],
            cfg["num_count"],
            n_tickets=20,
        )
        elapsed = time.time() - t0
        uniq = len({tuple(t) for t in tickets})
        # Intersection w/ top-15 by posterior
        theta = _posterior_mean(df.iloc[:200], df.iloc[200]["date"], 1, 45, 365, 1.0)
        top15 = set(np.argsort(-theta)[:15] + 1)
        in_top15 = sum(1 for t in tickets for n in t if n in top15) / (20 * 6)
        print(
            f"  {strat.name:40s}  n_tickets={len(tickets)}  unique={uniq}  "
            f"top15_share={in_top15:.2%}  T={elapsed*1000:.1f}ms"
        )
        print(f"     sample ticket[0]={tickets[0]}, ticket[5]={tickets[5]}")

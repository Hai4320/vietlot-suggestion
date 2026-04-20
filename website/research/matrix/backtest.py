#!/usr/bin/env python3
"""
Phase 4: Evaluate NEW algorithms vs existing ones.
Standalone backtest with all 16 strategies (10 existing + 6 new).
"""

import json
import math
import random
import sys
import time
from collections import Counter, defaultdict
from datetime import date, timedelta
from itertools import combinations
from math import comb, ceil
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
import pandas as pd

# Import shared significance utilities (EVALUATION.md §3)
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from _significance import build_significance  # noqa: E402

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"

MATRIX_PRODUCTS = {
    "power_655": {
        "file": "power655.jsonl",
        "min_val": 1, "max_val": 55, "num_count": 6,
        "prizes": {6: 30_000_000_000, 5: 10_000_000, 4: 300_000, 3: 30_000},
        "ticket_price": 10_000,
    },
    "power_645": {
        "file": "power645.jsonl",
        "min_val": 1, "max_val": 45, "num_count": 6,
        "prizes": {6: 12_000_000_000, 5: 10_000_000, 4: 300_000, 3: 30_000},
        "ticket_price": 10_000,
    },
    "power_535": {
        "file": "power535.jsonl",
        "min_val": 1, "max_val": 35, "num_count": 5,
        "prizes": {5: 6_000_000_000, 4: 500_000, 3: 50_000},
        "ticket_price": 10_000,
    },
}


def load_matrix_data(product_key: str) -> pd.DataFrame:
    cfg = MATRIX_PRODUCTS[product_key]
    path = DATA_DIR / cfg["file"]
    rows = []
    for line in path.read_text().strip().split("\n"):
        rec = json.loads(line)
        result = rec["result"]
        if isinstance(result, list):
            rows.append({"date": rec["date"], "id": rec["id"],
                         "result": [int(x) for x in result[:cfg["num_count"]]]})
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"]).dt.date
    return df.sort_values("date").reset_index(drop=True)


# ═══════════════════════════════════════════════════════════════
# ALL STRATEGIES (existing + new)
# ═══════════════════════════════════════════════════════════════

class StrategyBase:
    name: str = "base"
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        raise NotImplementedError

# --- EXISTING ---

class RandomStrategy(StrategyBase):
    name = "Random"
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        return sorted(random.sample(range(min_val, max_val + 1), num_count))

class FrequencyHotStrategy(StrategyBase):
    name = "Freq_Hot"
    def __init__(self, lookback_days=365, weight=0.8):
        self.lookback_days = lookback_days; self.weight = weight
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        freq = Counter(n for nums in recent for n in nums)
        all_nums = list(range(min_val, max_val + 1))
        freq_count = int(num_count * self.weight); rand_count = num_count - freq_count
        pool = []
        for n in all_nums: pool.extend([n] * max(1, freq.get(n, 0)))
        selected = []
        while len(selected) < freq_count and pool:
            c = random.choice(pool)
            if c not in selected: selected.append(c)
            pool = [x for x in pool if x != c]
        available = [n for n in all_nums if n not in selected]
        if rand_count > 0 and available: selected.extend(random.sample(available, min(rand_count, len(available))))
        return sorted(selected[:num_count])

class FrequencyColdStrategy(StrategyBase):
    name = "Freq_Cold"
    def __init__(self, lookback_days=365, weight=0.8):
        self.lookback_days = lookback_days; self.weight = weight
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        freq = Counter(n for nums in recent for n in nums)
        all_nums = list(range(min_val, max_val + 1))
        max_freq = max(freq.values()) if freq else 1
        freq_count = int(num_count * self.weight); rand_count = num_count - freq_count
        pool = []
        for n in all_nums: pool.extend([n] * max(1, max_freq - freq.get(n, 0) + 1))
        selected = []
        while len(selected) < freq_count and pool:
            c = random.choice(pool)
            if c not in selected: selected.append(c)
            pool = [x for x in pool if x != c]
        available = [n for n in all_nums if n not in selected]
        if rand_count > 0 and available: selected.extend(random.sample(available, min(rand_count, len(available))))
        return sorted(selected[:num_count])

class LongAbsenceStrategy(StrategyBase):
    name = "LongAbsence"
    def __init__(self, top_n=15):
        self.top_n = top_n
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        all_nums = set(range(min_val, max_val + 1))
        last_seen = {}
        for _, row in train_df.iterrows():
            for n in row["result"]:
                if n in all_nums: last_seen[n] = row["date"]
        absence = {n: (target_date - last_seen[n]).days if n in last_seen else 99999 for n in all_nums}
        pool = sorted(all_nums, key=lambda x: absence[x], reverse=True)[:self.top_n]
        if len(pool) >= num_count: return sorted(random.sample(pool, num_count))
        remaining = [n for n in all_nums if n not in pool]
        pool.extend(random.sample(remaining, num_count - len(pool)))
        return sorted(pool[:num_count])

class NotRepeatStrategy(StrategyBase):
    name = "NotRepeat"
    def __init__(self, lookback_days=30, avoid_weight=0.8):
        self.lookback_days = lookback_days; self.avoid_weight = avoid_weight
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent_nums = set(n for nums in train_df.loc[train_df["date"] >= cutoff, "result"].tolist() for n in nums)
        all_nums = list(range(min_val, max_val + 1))
        available = [n for n in all_nums if n not in recent_nums]
        avoid_count = int(num_count * self.avoid_weight); rand_count = num_count - avoid_count
        selected = random.sample(available, min(avoid_count, len(available))) if available else []
        remaining = [n for n in all_nums if n not in selected]
        if rand_count > 0 and remaining: selected.extend(random.sample(remaining, min(rand_count, len(remaining))))
        while len(selected) < num_count:
            r = [n for n in all_nums if n not in selected]
            if r: selected.append(random.choice(r))
            else: break
        return sorted(selected[:num_count])

class PatternStrategy(StrategyBase):
    name = "Pattern"
    def __init__(self, lookback_days=180):
        self.lookback_days = lookback_days
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff]
        spacings = []
        for _, row in recent.iterrows():
            nums = sorted(row["result"][:num_count])
            for i in range(1, len(nums)): spacings.append(nums[i] - nums[i-1])
        avg_spacing = np.mean(spacings) if spacings else (max_val - min_val) / num_count
        range_size = (max_val - min_val + 1) / 5
        range_counts = [0]*5; total = 0
        for _, row in recent.iterrows():
            for n in row["result"][:num_count]:
                idx = min(4, int((n - min_val) / range_size)); range_counts[idx] += 1; total += 1
        range_probs = [c/total if total > 0 else 0.2 for c in range_counts]
        selected = []; attempts = 0
        while len(selected) < num_count and attempts < 1000:
            attempts += 1
            r_idx = random.choices(range(5), weights=range_probs, k=1)[0]
            r_start = int(min_val + r_idx * range_size); r_end = int(min(max_val, min_val + (r_idx + 1) * range_size - 1))
            candidate = random.randint(r_start, r_end)
            if candidate not in selected and min_val <= candidate <= max_val:
                if selected:
                    min_space = min(abs(candidate - s) for s in selected)
                    if min_space >= max(1, int(avg_spacing * 0.5)): selected.append(candidate)
                else: selected.append(candidate)
        all_nums = list(range(min_val, max_val + 1))
        while len(selected) < num_count:
            r = [n for n in all_nums if n not in selected]
            if r: selected.append(random.choice(r))
            else: break
        return sorted(selected[:num_count])

class ExpDecayHotStrategy(StrategyBase):
    name = "ExpDecay_Hot"
    def __init__(self, half_life=90):
        self.decay = math.log(2) / half_life
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        all_nums = list(range(min_val, max_val + 1))
        weights = {n: 0.0 for n in all_nums}
        for _, row in train_df.iterrows():
            w = math.exp(-self.decay * (target_date - row["date"]).days)
            for n in row["result"]:
                if n in weights: weights[n] += w
        selected = []
        while len(selected) < num_count:
            avail = [(n, max(weights[n], 1e-10)) for n in all_nums if n not in selected]
            if not avail: break
            nums, wts = zip(*avail)
            selected.append(random.choices(nums, weights=wts, k=1)[0])
        return sorted(selected[:num_count])

class ExpDecayColdStrategy(StrategyBase):
    name = "ExpDecay_Cold"
    def __init__(self, half_life=90):
        self.decay = math.log(2) / half_life
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        all_nums = list(range(min_val, max_val + 1))
        weights = {n: 0.0 for n in all_nums}
        for _, row in train_df.iterrows():
            w = math.exp(-self.decay * (target_date - row["date"]).days)
            for n in row["result"]:
                if n in weights: weights[n] += w
        max_w = max(weights.values()) if weights else 1.0
        selected = []
        while len(selected) < num_count:
            avail = [(n, max(max_w - weights[n] + 0.01, 0.01)) for n in all_nums if n not in selected]
            if not avail: break
            nums, wts = zip(*avail)
            selected.append(random.choices(nums, weights=wts, k=1)[0])
        return sorted(selected[:num_count])

class PairFrequencyStrategy(StrategyBase):
    name = "PairFreq"
    def __init__(self, lookback_days=365):
        self.lookback_days = lookback_days
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        n_nums = max_val - min_val + 1
        cooc = np.ones((n_nums, n_nums), dtype=float)
        for nums in recent:
            indices = [n - min_val for n in nums if min_val <= n <= max_val]
            for i in range(len(indices)):
                for j in range(i+1, len(indices)):
                    cooc[indices[i], indices[j]] += 1; cooc[indices[j], indices[i]] += 1
        totals = cooc.sum(axis=1)
        selected_indices = [int(np.argmax(totals))]
        while len(selected_indices) < num_count:
            best_score, best_idx = -1, -1
            for i in range(n_nums):
                if i in selected_indices: continue
                score = sum(cooc[i, j] for j in selected_indices)
                if score > best_score: best_score = score; best_idx = i
            if best_idx >= 0: selected_indices.append(best_idx)
            else: break
        return sorted([idx + min_val for idx in selected_indices])

# --- NEW ALGORITHMS ---

class BayesianDirichletStrategy(StrategyBase):
    name = "Bayesian"
    def __init__(self, lookback_days=365, prior_strength=1.0, temperature=1.0):
        self.lookback_days = lookback_days
        self.prior_strength = prior_strength
        self.temperature = temperature
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        freq = Counter(n for nums in recent for n in nums)
        alpha = np.array([self.prior_strength + freq.get(i, 0) for i in range(min_val, max_val + 1)], dtype=float)
        if self.temperature != 1.0:
            alpha = (alpha - 1) / self.temperature + 1
            alpha = np.maximum(alpha, 0.01)
        theta = np.random.dirichlet(alpha)
        numbers = list(range(min_val, max_val + 1))
        selected = []; probs = theta.copy()
        for _ in range(num_count):
            p = probs / probs.sum()
            idx = np.random.choice(len(numbers), p=p)
            selected.append(numbers[idx])
            probs[idx] = 0
        return sorted(selected)

class MaxEntropyStrategy(StrategyBase):
    name = "MaxEntropy"
    def __init__(self, lookback_days=365, prior_strength=1.0):
        self.lookback_days = lookback_days; self.prior_strength = prior_strength
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        freq = Counter(n for nums in recent for n in nums)
        total_range = max_val - min_val + 1
        band_size = total_range / num_count
        selected = []
        for b in range(num_count):
            b_start = int(min_val + b * band_size)
            b_end = int(min_val + (b + 1) * band_size) - 1
            if b == num_count - 1: b_end = max_val
            band_nums = list(range(b_start, b_end + 1))
            alpha = np.array([self.prior_strength + freq.get(n, 0) for n in band_nums], dtype=float)
            theta = np.random.dirichlet(alpha)
            avail = np.array([n not in selected for n in band_nums], dtype=float)
            t = theta * avail
            if t.sum() == 0: continue
            t /= t.sum()
            selected.append(band_nums[np.random.choice(len(band_nums), p=t)])
        all_nums = list(range(min_val, max_val + 1))
        while len(selected) < num_count:
            r = [n for n in all_nums if n not in selected]
            if r: selected.append(random.choice(r))
            else: break
        return sorted(selected[:num_count])

class EnsembleBordaStrategy(StrategyBase):
    name = "Ensemble"
    def __init__(self, n_samples=10, randomization=0.1):
        self.n_samples = n_samples; self.randomization = randomization
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        all_nums = list(range(min_val, max_val + 1))
        v = len(all_nums)
        borda = defaultdict(float)
        # Sub-strategies to combine
        subs = [
            FrequencyHotStrategy(365, 0.8),
            FrequencyColdStrategy(365, 0.8),
            PatternStrategy(180),
            BayesianDirichletStrategy(365, 1.0, 1.0),
            MaxEntropyStrategy(365, 1.0),
        ]
        for sub in subs:
            votes = defaultdict(int)
            for _ in range(self.n_samples):
                try:
                    pred = sub.predict(train_df, target_date, min_val, max_val, num_count)
                    for n in pred: votes[n] += 1
                except: pass
            ranked = sorted(all_nums, key=lambda n: votes.get(n, 0), reverse=True)
            for rank_pos, num in enumerate(ranked): borda[num] += (v - rank_pos)
        ranked = sorted(all_nums, key=lambda n: borda.get(n, 0), reverse=True)
        selected = []
        for n in ranked:
            if len(selected) >= num_count: break
            if random.random() < self.randomization:
                avail = [x for x in all_nums if x not in selected]
                if avail: selected.append(random.choice(avail))
            else:
                if n not in selected: selected.append(n)
        while len(selected) < num_count:
            avail = [x for x in all_nums if x not in selected]
            if avail: selected.append(random.choice(avail))
            else: break
        return sorted(selected[:num_count])

class MinDistanceStrategy(StrategyBase):
    name = "MinDistance"
    def __init__(self, lookback_days=365, n_candidates=50):
        self.lookback_days = lookback_days; self.n_candidates = n_candidates
        self._prev: List[set] = []
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        freq = Counter(n for nums in recent for n in nums)
        alpha = np.array([1.0 + freq.get(i, 0) for i in range(min_val, max_val + 1)], dtype=float)
        def gen():
            theta = np.random.dirichlet(alpha)
            nums = list(range(min_val, max_val + 1)); sel = []; p = theta.copy()
            for _ in range(num_count):
                pn = p / p.sum(); idx = np.random.choice(len(nums), p=pn)
                sel.append(nums[idx]); p[idx] = 0
            return sorted(sel)
        if not self._prev:
            t = gen(); self._prev.append(set(t)); return t
        best, best_d = None, -1
        for _ in range(self.n_candidates):
            c = gen(); cs = set(c)
            md = min(1 - len(cs & p) / len(cs | p) for p in self._prev)
            if md > best_d: best_d = md; best = c
        if best is None: best = gen()
        self._prev.append(set(best))
        # Reset after each draw date changes
        return best

class AdaptiveWindowStrategy(StrategyBase):
    name = "Adaptive"
    def __init__(self, candidate_windows=None, eval_draws=20, strategy_type="hot"):
        self.candidate_windows = candidate_windows or [30, 60, 90, 180, 365]
        self.eval_draws = eval_draws; self.strategy_type = strategy_type
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        all_nums = list(range(min_val, max_val + 1))
        dates = sorted(train_df["date"].unique())
        eval_dates = dates[-self.eval_draws:] if len(dates) > self.eval_draws else dates
        best_w, best_s = 180, 0
        for w in self.candidate_windows:
            matches = []
            for d in eval_dates:
                cutoff = d - timedelta(days=w)
                recent = train_df.loc[(train_df["date"] >= cutoff) & (train_df["date"] < d), "result"].tolist()
                if len(recent) < 3: continue
                freq = Counter(n for nums in recent for n in nums)
                if self.strategy_type == "hot":
                    top = sorted(all_nums, key=lambda x: freq.get(x, 0), reverse=True)[:num_count]
                else:
                    top = sorted(all_nums, key=lambda x: freq.get(x, 0))[:num_count]
                actual = set(train_df.loc[train_df["date"] == d, "result"].iloc[0][:num_count])
                matches.append(len(set(top) & actual))
            avg = np.mean(matches) if matches else 0
            if avg > best_s: best_s = avg; best_w = w
        # Use best window
        cutoff = target_date - timedelta(days=best_w)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        freq = Counter(n for nums in recent for n in nums)
        if self.strategy_type == "hot":
            pool = sorted(all_nums, key=lambda x: freq.get(x, 0), reverse=True)
        else:
            pool = sorted(all_nums, key=lambda x: freq.get(x, 0))
        top = pool[:num_count * 2]
        selected = []
        for n in top:
            if len(selected) >= num_count: break
            if random.random() < 0.8 or len(selected) < num_count // 2:
                if n not in selected: selected.append(n)
            else:
                avail = [x for x in all_nums if x not in selected]
                if avail: selected.append(random.choice(avail))
        while len(selected) < num_count:
            avail = [x for x in all_nums if x not in selected]
            if avail: selected.append(random.choice(avail))
            else: break
        return sorted(selected[:num_count])


# ═══════════════════════════════════════════════════════════════
# BACKTEST
# ═══════════════════════════════════════════════════════════════

def walk_forward_backtest(df, strategy, product_cfg, min_history=100, n_runs=3):
    # Iterate per-row so products with multiple draws per date (Power 5/35: 2/day)
    # are fully evaluated. Previous version used dates.unique() and lost ~50% of data.
    n = len(df); start_idx = min(min_history, n // 2)
    min_val, max_val, num_count = product_cfg["min_val"], product_cfg["max_val"], product_cfg["num_count"]
    prizes, ticket_price = product_cfg["prizes"], product_cfg["ticket_price"]
    all_matches, all_revenues = [], []
    t0 = time.time()
    for run in range(n_runs):
        if hasattr(strategy, '_prev'): strategy._prev = []  # reset MinDistance
        for i in range(start_idx, n):
            target_row = df.iloc[i]
            target_date = target_row["date"]
            train_df = df.iloc[:i]
            if len(train_df) < 30: continue
            try:
                predicted = strategy.predict(train_df, target_date, min_val, max_val, num_count)
                if not predicted: continue
            except: continue
            actual = list(target_row["result"][:num_count])
            m = len(set(predicted) & set(actual))
            all_matches.append(m); all_revenues.append(prizes.get(m, 0) - ticket_price)
    elapsed = time.time() - t0
    if not all_matches: return {"error": "No predictions"}
    total_preds = len(all_matches); total_cost = total_preds * ticket_price
    total_revenue = sum(prizes.get(m, 0) for m in all_matches)
    dist = {str(m): all_matches.count(m) for m in range(max(all_matches) + 1)}
    avg_m = float(np.mean(all_matches))
    wins_ge3 = sum(1 for m in all_matches if m >= 3)
    win_r = wins_ge3 / total_preds
    profits = np.array(all_revenues, dtype=float)
    sharpe = 0.0
    if len(profits) > 1:
        std = np.std(profits, ddof=1)
        if std > 0: sharpe = (np.mean(profits) / std) * np.sqrt(52)
    cum = np.cumsum(profits); dd = cum - np.maximum.accumulate(cum)
    return {
        "total_predictions": total_preds, "n_runs": n_runs,
        "avg_matches": round(avg_m, 4), "std_matches": round(float(np.std(all_matches, ddof=1)), 4),
        "win_rate_pct": round(float(win_r * 100), 4),
        "wins_ge3": int(wins_ge3),                 # for significance test
        "total_cost": int(total_cost), "total_revenue": int(total_revenue),
        "net_profit": int(total_revenue - total_cost),
        "roi_pct": round(float((total_revenue - total_cost) / total_cost * 100), 2),
        "sharpe_ratio": round(float(sharpe), 4),
        "max_drawdown": int(abs(float(dd.min()))),
        "best_match": max(all_matches), "matches_distribution": dist,
        "elapsed_seconds": round(elapsed, 2),
    }


def attach_significance(product_results: dict, baseline_name: str = "Random") -> None:
    """Add significance block to each strategy by comparing win_rate_pct vs Random.
    Mutates product_results in place. EVALUATION.md §3-4."""
    strategies = product_results.get("strategies", {})
    base = strategies.get(baseline_name, {})
    if "wins_ge3" not in base:
        return
    base_hits = base["wins_ge3"]
    base_n = base["total_predictions"]
    non_baseline = [n for n in strategies if n != baseline_name and "wins_ge3" in strategies[n]]
    k = len(non_baseline)
    for name in non_baseline:
        r = strategies[name]
        r["significance"] = build_significance(
            hits_strat=r["wins_ge3"], n_strat=r["total_predictions"],
            hits_baseline=base_hits, n_baseline=base_n,
            n_strategies_compared=k, baseline_name=baseline_name,
            metric_name="win_rate_ge3",
        )

def theoretical_baseline(num_count, max_val, min_val=1):
    N = max_val - min_val + 1; K = num_count; n = num_count
    E = n * K / N
    wp = sum(comb(K, k) * comb(N-K, n-k) / comb(N, n) for k in range(3, min(K, n) + 1))
    return {"E": round(E, 4), "win_pct": round(wp * 100, 6)}

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

ALL_STRATEGIES = [
    # Existing (10)
    RandomStrategy(),
    FrequencyHotStrategy(365, 0.8),
    FrequencyColdStrategy(365, 0.8),
    LongAbsenceStrategy(15),
    NotRepeatStrategy(30, 0.8),
    PatternStrategy(180),
    ExpDecayHotStrategy(90),
    ExpDecayColdStrategy(90),
    PairFrequencyStrategy(365),
    # New (6)
    BayesianDirichletStrategy(365, 1.0, 1.0),
    MaxEntropyStrategy(365, 1.0),
    EnsembleBordaStrategy(10, 0.1),
    MinDistanceStrategy(365, 30),
    AdaptiveWindowStrategy([30, 90, 180, 365], 10, "hot"),
    # Extra variants
    BayesianDirichletStrategy(180, 1.0, 0.5),  # Sharper Bayesian
]

STRATEGY_NAMES = [
    "Random", "Freq_Hot", "Freq_Cold", "LongAbsence", "NotRepeat",
    "Pattern", "ExpDecay_Hot", "ExpDecay_Cold", "PairFreq",
    "★Bayesian", "★MaxEntropy", "★Ensemble", "★MinDistance", "★Adaptive",
    "★Bayes_Sharp",
]

def main():
    random.seed(42); np.random.seed(42)
    output_dir = Path(__file__).resolve().parent
    results = {}

    for product_key, cfg in MATRIX_PRODUCTS.items():
        print(f"\n{'='*80}")
        print(f"  {product_key}  ({cfg['num_count']} from {cfg['min_val']}-{cfg['max_val']})")
        print(f"{'='*80}")
        df = load_matrix_data(product_key)
        bl = theoretical_baseline(cfg["num_count"], cfg["max_val"], cfg["min_val"])
        print(f"  {len(df)} draws | E[matches]={bl['E']} | P(win≥3)={bl['win_pct']}%")
        product_results = {"baseline": bl, "strategies": {}}

        for strategy, name in zip(ALL_STRATEGIES, STRATEGY_NAMES):
            print(f"  ▸ {name:20s}", end=" ", flush=True)
            try:
                r = walk_forward_backtest(df, strategy, cfg, min_history=100, n_runs=3)
                product_results["strategies"][name] = r
                if "error" not in r:
                    delta = r["avg_matches"] - bl["E"]
                    m = "▲" if delta > 0.005 else "▼" if delta < -0.005 else "="
                    print(f"avg={r['avg_matches']:.4f} ({m}{abs(delta):.4f}) win={r['win_rate_pct']:.3f}% roi={r['roi_pct']:.1f}% best={r['best_match']} T={r['elapsed_seconds']:.1f}s")
                else: print(f"ERROR: {r['error']}")
            except Exception as e:
                print(f"FAILED: {e}"); product_results["strategies"][name] = {"error": str(e)}

        attach_significance(product_results, baseline_name="Random")
        results[product_key] = product_results

    # Save
    out = output_dir / "backtest_results.json"
    with open(out, "w") as f: json.dump(results, f, indent=2, default=str)
    print(f"\n✓ Saved to {out}")

    # Summary
    print("\n\n" + "=" * 120)
    print("  PHASE 4: NEW vs EXISTING STRATEGY COMPARISON")
    print("=" * 120)

    for pk, pr in results.items():
        bl = pr["baseline"]
        print(f"\n{'─'*120}")
        print(f"  {pk} | E[matches]={bl['E']} | P(win≥3)={bl['win_pct']}%")
        print(f"{'─'*120}")
        print(f"  {'Strategy':20s} {'AvgMatch':>9} {'Δ':>8} {'Win%':>7} {'ROI%':>9} {'Sharpe':>8} {'p(Δwin)':>9} {'Decision':>12}")
        print(f"  {'─'*20} {'─'*9} {'─'*8} {'─'*7} {'─'*9} {'─'*8} {'─'*9} {'─'*12}")

        rows = []
        for name, r in pr["strategies"].items():
            if "avg_matches" not in r: continue
            delta = r["avg_matches"] - bl["E"]
            sig = r.get("significance", {})
            rows.append((name, r["avg_matches"], delta, r["win_rate_pct"],
                         r["roi_pct"], r["sharpe_ratio"],
                         sig.get("p_value_raw"), sig.get("decision", "-")))
        rows.sort(key=lambda x: x[1], reverse=True)

        for name, am, d, wr, roi, sh, pv, dec in rows:
            mk = "+" if d > 0 else ""
            pv_str = f"{pv:.4f}" if pv is not None else "    —"
            print(f"  {name:20s} {am:>9.4f} {mk}{d:>7.4f} {wr:>7.3f} {roi:>9.1f} {sh:>8.4f} {pv_str:>9} {dec:>12}")

    # Key findings
    print("\n\n" + "=" * 120)
    print("  KEY FINDINGS")
    print("=" * 120)
    for pk, pr in results.items():
        bl_e = pr["baseline"]["E"]
        strats = pr["strategies"]
        new_strats = {n: r for n, r in strats.items() if n.startswith("★") and "avg_matches" in r}
        old_strats = {n: r for n, r in strats.items() if not n.startswith("★") and "avg_matches" in r}
        best_new = max(new_strats.items(), key=lambda x: x[1]["avg_matches"]) if new_strats else None
        best_old = max(old_strats.items(), key=lambda x: x[1]["avg_matches"]) if old_strats else None
        print(f"\n  {pk}:")
        if best_old: print(f"    Best OLD: {best_old[0]:20s} avg={best_old[1]['avg_matches']:.4f} (Δ={best_old[1]['avg_matches']-bl_e:+.4f})")
        if best_new: print(f"    Best NEW: {best_new[0]:20s} avg={best_new[1]['avg_matches']:.4f} (Δ={best_new[1]['avg_matches']-bl_e:+.4f})")
        if best_new and best_old:
            diff = best_new[1]["avg_matches"] - best_old[1]["avg_matches"]
            if diff > 0:
                print(f"    → NEW beats OLD by {diff:+.4f} avg matches")
            else:
                print(f"    → OLD beats NEW by {-diff:+.4f} avg matches")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Phase 1: Comprehensive Backtest of ALL current strategies on ALL products.
Standalone script — no project dependencies needed.
Uses only stdlib + numpy + pandas.

Saves results to website/research/phase1_backtest_results.json
"""

import json
import math
import random
import time
from collections import Counter
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

# ─── Data ──────────────────────────────────────────────────────

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

MATRIX_PRODUCTS = {
    "power_655": {
        "file": "power655.jsonl",
        "min_val": 1,
        "max_val": 55,
        "num_count": 6,
        "prizes": {6: 30_000_000_000, 5: 10_000_000, 4: 300_000, 3: 30_000},
        "ticket_price": 10_000,
    },
    "power_645": {
        "file": "power645.jsonl",
        "min_val": 1,
        "max_val": 45,
        "num_count": 6,
        "prizes": {6: 12_000_000_000, 5: 10_000_000, 4: 300_000, 3: 30_000},
        "ticket_price": 10_000,
    },
    "power_535": {
        "file": "power535.jsonl",
        "min_val": 1,
        "max_val": 35,
        "num_count": 5,
        "prizes": {5: 6_000_000_000, 4: 500_000, 3: 50_000},
        "ticket_price": 10_000,
    },
}


def load_matrix_data(product_key: str) -> pd.DataFrame:
    """Load matrix product data into DataFrame."""
    cfg = MATRIX_PRODUCTS[product_key]
    path = DATA_DIR / cfg["file"]

    rows = []
    for line in path.read_text().strip().split("\n"):
        rec = json.loads(line)
        result = rec["result"]
        if isinstance(result, list):
            rows.append(
                {
                    "date": rec["date"],
                    "id": rec["id"],
                    "result": [int(x) for x in result[: cfg["num_count"]]],
                }
            )
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"]).dt.date
    df = df.sort_values("date").reset_index(drop=True)
    return df


# ═══════════════════════════════════════════════════════════════
# STRATEGIES (self-contained reimplementations for backtesting)
# ═══════════════════════════════════════════════════════════════


class StrategyBase:
    """Base strategy class."""

    name: str = "base"

    def predict(
        self,
        train_df: pd.DataFrame,
        target_date: date,
        min_val: int,
        max_val: int,
        num_count: int,
    ) -> List[int]:
        raise NotImplementedError


class RandomStrategy(StrategyBase):
    name = "Random"

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        return sorted(random.sample(range(min_val, max_val + 1), num_count))


class FrequencyHotStrategy(StrategyBase):
    """Pick numbers weighted by how frequently they appeared (last N days)."""

    name = "Frequency_Hot"

    def __init__(self, lookback_days: int = 365, weight: float = 0.8):
        self.lookback_days = lookback_days
        self.weight = weight

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        mask = train_df["date"] >= cutoff
        recent = train_df.loc[mask, "result"].tolist()

        freq = Counter(n for nums in recent for n in nums)
        # All numbers in range
        all_nums = list(range(min_val, max_val + 1))

        # Weighted by frequency
        freq_count = int(num_count * self.weight)
        rand_count = num_count - freq_count

        # Sort by frequency descending
        sorted_nums = sorted(all_nums, key=lambda x: freq.get(x, 0), reverse=True)

        selected = []
        # Weighted random from hot nums
        pool = []
        for n in sorted_nums:
            w = max(1, freq.get(n, 0))
            pool.extend([n] * w)

        while len(selected) < freq_count and pool:
            chosen = random.choice(pool)
            if chosen not in selected:
                selected.append(chosen)
            pool = [n for n in pool if n != chosen]

        # Random fill
        available = [n for n in all_nums if n not in selected]
        if rand_count > 0 and available:
            selected.extend(random.sample(available, min(rand_count, len(available))))

        return sorted(selected[:num_count])


class FrequencyColdStrategy(StrategyBase):
    """Pick numbers weighted by inverse frequency (cold numbers)."""

    name = "Frequency_Cold"

    def __init__(self, lookback_days: int = 365, weight: float = 0.8):
        self.lookback_days = lookback_days
        self.weight = weight

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        mask = train_df["date"] >= cutoff
        recent = train_df.loc[mask, "result"].tolist()

        freq = Counter(n for nums in recent for n in nums)
        all_nums = list(range(min_val, max_val + 1))
        max_freq = max(freq.values()) if freq else 1

        freq_count = int(num_count * self.weight)
        rand_count = num_count - freq_count

        # Weighted by inverse frequency
        pool = []
        for n in all_nums:
            w = max(1, max_freq - freq.get(n, 0) + 1)
            pool.extend([n] * w)

        selected = []
        while len(selected) < freq_count and pool:
            chosen = random.choice(pool)
            if chosen not in selected:
                selected.append(chosen)
            pool = [n for n in pool if n != chosen]

        available = [n for n in all_nums if n not in selected]
        if rand_count > 0 and available:
            selected.extend(random.sample(available, min(rand_count, len(available))))

        return sorted(selected[:num_count])


class FrequencyBalancedStrategy(StrategyBase):
    """Mix of hot and cold numbers."""

    name = "Frequency_Balanced"

    def __init__(self, lookback_days: int = 365):
        self.lookback_days = lookback_days

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        mask = train_df["date"] >= cutoff
        recent = train_df.loc[mask, "result"].tolist()

        freq = Counter(n for nums in recent for n in nums)
        all_nums = list(range(min_val, max_val + 1))

        sorted_by_freq = sorted(all_nums, key=lambda x: freq.get(x, 0), reverse=True)

        # Half hot, half cold
        hot_count = num_count // 2
        cold_count = num_count - hot_count

        hot_pool = sorted_by_freq[:15]
        cold_pool = sorted_by_freq[-15:]

        selected = random.sample(hot_pool, min(hot_count, len(hot_pool)))
        cold_available = [n for n in cold_pool if n not in selected]
        selected.extend(random.sample(cold_available, min(cold_count, len(cold_available))))

        # Fill if needed
        while len(selected) < num_count:
            remaining = [n for n in all_nums if n not in selected]
            if remaining:
                selected.append(random.choice(remaining))
            else:
                break

        return sorted(selected[:num_count])


class LongAbsenceStrategy(StrategyBase):
    """Pick numbers absent the longest from recent draws."""

    name = "LongAbsence"

    def __init__(self, top_n: int = 15):
        self.top_n = top_n

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        all_nums = set(range(min_val, max_val + 1))

        # Find last seen date for each number
        last_seen = {}
        for _, row in train_df.iterrows():
            for n in row["result"]:
                if n in all_nums:
                    last_seen[n] = row["date"]

        # Numbers never seen get max absence
        absence = {}
        for n in all_nums:
            if n in last_seen:
                absence[n] = (target_date - last_seen[n]).days
            else:
                absence[n] = 99999

        sorted_by_absence = sorted(all_nums, key=lambda x: absence[x], reverse=True)
        pool = sorted_by_absence[: self.top_n]

        if len(pool) >= num_count:
            return sorted(random.sample(pool, num_count))
        else:
            remaining = [n for n in all_nums if n not in pool]
            pool.extend(random.sample(remaining, num_count - len(pool)))
            return sorted(pool[:num_count])


class NotRepeatStrategy(StrategyBase):
    """Avoid numbers from recent draws."""

    name = "NotRepeat"

    def __init__(self, lookback_days: int = 30, avoid_weight: float = 0.8):
        self.lookback_days = lookback_days
        self.avoid_weight = avoid_weight

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()
        recent_nums = set(n for nums in recent for n in nums)

        all_nums = list(range(min_val, max_val + 1))
        available = [n for n in all_nums if n not in recent_nums]

        avoid_count = int(num_count * self.avoid_weight)
        rand_count = num_count - avoid_count

        selected = []
        if available and avoid_count > 0:
            selected = random.sample(available, min(avoid_count, len(available)))

        remaining = [n for n in all_nums if n not in selected]
        if rand_count > 0 and remaining:
            selected.extend(random.sample(remaining, min(rand_count, len(remaining))))

        while len(selected) < num_count:
            remaining = [n for n in all_nums if n not in selected]
            if remaining:
                selected.append(random.choice(remaining))
            else:
                break

        return sorted(selected[:num_count])


class PatternStrategy(StrategyBase):
    """Analyze spacing and range distribution patterns."""

    name = "Pattern"

    def __init__(self, lookback_days: int = 180):
        self.lookback_days = lookback_days

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff]

        # Analyze spacing patterns
        spacings = []
        for _, row in recent.iterrows():
            nums = sorted(row["result"][:num_count])
            for i in range(1, len(nums)):
                spacings.append(nums[i] - nums[i - 1])

        avg_spacing = np.mean(spacings) if spacings else (max_val - min_val) / num_count

        # Analyze range distribution (divide into 5 ranges)
        range_size = (max_val - min_val + 1) / 5
        range_counts = [0] * 5
        total = 0
        for _, row in recent.iterrows():
            for n in row["result"][:num_count]:
                idx = min(4, int((n - min_val) / range_size))
                range_counts[idx] += 1
                total += 1

        range_probs = [c / total if total > 0 else 0.2 for c in range_counts]

        # Generate numbers with target spacing and range distribution
        selected = []
        attempts = 0
        while len(selected) < num_count and attempts < 1000:
            attempts += 1
            # Pick range based on distribution
            r_idx = random.choices(range(5), weights=range_probs, k=1)[0]
            r_start = int(min_val + r_idx * range_size)
            r_end = int(min(max_val, min_val + (r_idx + 1) * range_size - 1))

            candidate = random.randint(r_start, r_end)
            if candidate not in selected and min_val <= candidate <= max_val:
                # Check spacing
                if selected:
                    min_space = min(abs(candidate - s) for s in selected)
                    if min_space >= max(1, int(avg_spacing * 0.5)):
                        selected.append(candidate)
                else:
                    selected.append(candidate)

        # Fill if needed
        all_nums = list(range(min_val, max_val + 1))
        while len(selected) < num_count:
            remaining = [n for n in all_nums if n not in selected]
            if remaining:
                selected.append(random.choice(remaining))
            else:
                break

        return sorted(selected[:num_count])


class ExponentialDecayHotStrategy(StrategyBase):
    """Weight numbers by exponentially decaying recency (hot mode)."""

    name = "ExpDecay_Hot"

    def __init__(self, half_life: float = 90):
        self.half_life = half_life
        self.decay = math.log(2) / half_life

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        all_nums = list(range(min_val, max_val + 1))
        weights = {n: 0.0 for n in all_nums}

        for _, row in train_df.iterrows():
            days_ago = (target_date - row["date"]).days
            w = math.exp(-self.decay * days_ago)
            for n in row["result"]:
                if n in weights:
                    weights[n] += w

        # Weighted random selection
        pool_nums = all_nums
        pool_weights = [max(weights[n], 1e-10) for n in pool_nums]

        selected = []
        while len(selected) < num_count:
            available = [(n, w) for n, w in zip(pool_nums, pool_weights) if n not in selected]
            if not available:
                break
            nums, wts = zip(*available)
            chosen = random.choices(nums, weights=wts, k=1)[0]
            selected.append(chosen)

        return sorted(selected[:num_count])


class ExponentialDecayColdStrategy(StrategyBase):
    """Weight numbers by inverse of exponentially decaying recency (cold mode)."""

    name = "ExpDecay_Cold"

    def __init__(self, half_life: float = 90):
        self.half_life = half_life
        self.decay = math.log(2) / half_life

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        all_nums = list(range(min_val, max_val + 1))
        weights = {n: 0.0 for n in all_nums}

        for _, row in train_df.iterrows():
            days_ago = (target_date - row["date"]).days
            w = math.exp(-self.decay * days_ago)
            for n in row["result"]:
                if n in weights:
                    weights[n] += w

        max_w = max(weights.values()) if weights else 1.0

        # Inverse: cold numbers get high weight
        pool_weights = [max(max_w - weights[n] + 0.01, 0.01) for n in all_nums]

        selected = []
        while len(selected) < num_count:
            available = [(n, w) for n, w in zip(all_nums, pool_weights) if n not in selected]
            if not available:
                break
            nums, wts = zip(*available)
            chosen = random.choices(nums, weights=wts, k=1)[0]
            selected.append(chosen)

        return sorted(selected[:num_count])


class PairFrequencyStrategy(StrategyBase):
    """Build co-occurrence matrix and greedily select high-co-occurring numbers."""

    name = "PairFrequency"

    def __init__(self, lookback_days: int = 365):
        self.lookback_days = lookback_days

    def predict(self, train_df, target_date, min_val, max_val, num_count):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff, "result"].tolist()

        n_nums = max_val - min_val + 1
        # Co-occurrence matrix with Laplace smoothing
        cooc = np.ones((n_nums, n_nums), dtype=float)

        for nums in recent:
            indices = [n - min_val for n in nums if min_val <= n <= max_val]
            for i in range(len(indices)):
                for j in range(i + 1, len(indices)):
                    cooc[indices[i], indices[j]] += 1
                    cooc[indices[j], indices[i]] += 1

        # Greedy selection
        # Start with the number that has highest total co-occurrence
        totals = cooc.sum(axis=1)
        first_idx = np.argmax(totals)
        selected_indices = [int(first_idx)]

        while len(selected_indices) < num_count:
            best_score = -1
            best_idx = -1
            for i in range(n_nums):
                if i in selected_indices:
                    continue
                score = sum(cooc[i, j] for j in selected_indices)
                if score > best_score:
                    best_score = score
                    best_idx = i
            if best_idx >= 0:
                selected_indices.append(best_idx)
            else:
                break

        return sorted([idx + min_val for idx in selected_indices])


# ═══════════════════════════════════════════════════════════════
# BACKTEST ENGINE
# ═══════════════════════════════════════════════════════════════


def walk_forward_backtest(
    df: pd.DataFrame,
    strategy: StrategyBase,
    product_cfg: dict,
    min_history: int = 100,
    n_runs: int = 3,
) -> dict:
    """
    Walk-forward backtest with multiple runs to average out randomness.
    For each draw t, train on [0..t-1], predict for t.
    """
    dates = sorted(df["date"].unique())
    n = len(dates)
    start_idx = min(min_history, n // 2)

    min_val = product_cfg["min_val"]
    max_val = product_cfg["max_val"]
    num_count = product_cfg["num_count"]
    prizes = product_cfg["prizes"]
    ticket_price = product_cfg["ticket_price"]

    all_matches = []
    all_revenues = []

    t0 = time.time()

    for run in range(n_runs):
        for i in range(start_idx, n):
            target_date = dates[i]
            train_df = df[df["date"] < target_date]

            if len(train_df) < 30:
                continue

            try:
                predicted = strategy.predict(train_df, target_date, min_val, max_val, num_count)
                if predicted is None or len(predicted) == 0:
                    continue
            except Exception:
                continue

            actual_rows = df[df["date"] == target_date]
            if actual_rows.empty:
                continue
            actual = list(actual_rows.iloc[0]["result"][:num_count])

            m = len(set(predicted) & set(actual))
            rev = prizes.get(m, 0) - ticket_price

            all_matches.append(m)
            all_revenues.append(rev)

    elapsed = time.time() - t0

    if not all_matches:
        return {"error": "No predictions generated"}

    total_preds = len(all_matches)
    total_cost = total_preds * ticket_price
    total_revenue = sum(prizes.get(m, 0) for m in all_matches)
    net_profit = total_revenue - total_cost

    # Match distribution
    dist = {}
    for m in range(max(all_matches) + 1):
        dist[str(m)] = all_matches.count(m)

    avg_matches = float(np.mean(all_matches))
    std_matches = float(np.std(all_matches, ddof=1)) if len(all_matches) > 1 else 0
    win_rate = sum(1 for m in all_matches if m >= 3) / total_preds

    # Sharpe ratio (annualized)
    profits = np.array(all_revenues, dtype=float)
    sharpe = 0.0
    if len(profits) > 1:
        std = np.std(profits, ddof=1)
        if std > 0:
            sharpe = (np.mean(profits) / std) * np.sqrt(52)

    # Max drawdown
    cum = np.cumsum(profits)
    running_max = np.maximum.accumulate(cum)
    dd = cum - running_max
    max_dd = abs(float(dd.min())) if len(dd) > 0 else 0

    # Consistency (rolling window win rate)
    window = min(50, total_preds // 4)
    if window > 0:
        rolling_wr = []
        for i in range(0, total_preds - window + 1, window):
            chunk = all_matches[i : i + window]
            wr = sum(1 for m in chunk if m >= 3) / len(chunk)
            rolling_wr.append(wr)
        consistency = float(np.std(rolling_wr)) if len(rolling_wr) > 1 else 0
    else:
        consistency = 0

    return {
        "total_predictions": total_preds,
        "n_runs": n_runs,
        "avg_matches": round(avg_matches, 4),
        "std_matches": round(std_matches, 4),
        "win_rate": round(float(win_rate), 6),
        "win_rate_pct": round(float(win_rate * 100), 4),
        "total_cost": int(total_cost),
        "total_revenue": int(total_revenue),
        "net_profit": int(net_profit),
        "roi_pct": round(float(net_profit / total_cost * 100), 2) if total_cost > 0 else 0,
        "sharpe_ratio": round(float(sharpe), 4),
        "max_drawdown": int(max_dd),
        "consistency_std": round(consistency, 6),
        "best_match": max(all_matches),
        "matches_distribution": dist,
        "elapsed_seconds": round(elapsed, 2),
    }


def compute_theoretical_baseline(num_count: int, max_val: int, min_val: int = 1) -> dict:
    """Compute expected matches via hypergeometric distribution."""
    from math import comb

    N = max_val - min_val + 1  # total numbers
    K = num_count  # drawn numbers
    n = num_count  # numbers on ticket

    # E[matches] = n*K/N
    expected = n * K / N

    # P(X=k) = C(K,k) * C(N-K, n-k) / C(N, n)
    dist = {}
    for k in range(min(K, n) + 1):
        if n - k > N - K:
            p = 0
        else:
            p = comb(K, k) * comb(N - K, n - k) / comb(N, n)
        dist[str(k)] = round(p, 8)

    win_prob = sum(float(dist.get(str(k), 0)) for k in range(3, min(K, n) + 1))

    return {
        "expected_matches": round(expected, 4),
        "win_probability_pct": round(win_prob * 100, 6),
        "match_probabilities": dist,
    }


# ═══════════════════════════════════════════════════════════════
# STRATEGY REGISTRY
# ═══════════════════════════════════════════════════════════════

STRATEGIES = [
    RandomStrategy(),
    FrequencyHotStrategy(lookback_days=365, weight=0.8),
    FrequencyColdStrategy(lookback_days=365, weight=0.8),
    FrequencyBalancedStrategy(lookback_days=365),
    LongAbsenceStrategy(top_n=15),
    NotRepeatStrategy(lookback_days=30, avoid_weight=0.8),
    PatternStrategy(lookback_days=180),
    ExponentialDecayHotStrategy(half_life=90),
    ExponentialDecayColdStrategy(half_life=90),
    PairFrequencyStrategy(lookback_days=365),
]


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════


def main():
    random.seed(42)
    np.random.seed(42)

    output_dir = Path(__file__).resolve().parent
    output_dir.mkdir(parents=True, exist_ok=True)

    results = {}

    for product_key, cfg in MATRIX_PRODUCTS.items():
        print(f"\n{'='*70}")
        print(f"  Product: {product_key}  (max_val={cfg['max_val']}, num_count={cfg['num_count']})")
        print(f"{'='*70}")

        df = load_matrix_data(product_key)
        print(f"  Loaded {len(df)} draws ({df['date'].min()} → {df['date'].max()})")

        # Theoretical baseline
        baseline = compute_theoretical_baseline(cfg["num_count"], cfg["max_val"], cfg["min_val"])
        print(f"  Theoretical random: E[matches]={baseline['expected_matches']}, win_prob={baseline['win_probability_pct']}%")
        print(f"  Match probabilities: {baseline['match_probabilities']}")

        product_results = {
            "data_info": {
                "total_draws": len(df),
                "date_range": f"{df['date'].min()} to {df['date'].max()}",
                "num_count": cfg["num_count"],
                "max_val": cfg["max_val"],
                "min_val": cfg["min_val"],
            },
            "theoretical_baseline": baseline,
            "strategies": {},
        }

        for strategy in STRATEGIES:
            name = strategy.name
            print(f"\n  ▸ {name}...", end=" ", flush=True)
            try:
                result = walk_forward_backtest(df, strategy, cfg, min_history=100, n_runs=3)
                product_results["strategies"][name] = result

                if "error" not in result:
                    # Compare to theoretical baseline
                    delta = result["avg_matches"] - baseline["expected_matches"]
                    marker = "▲" if delta > 0 else "▼" if delta < 0 else "="
                    print(
                        f"avg={result['avg_matches']:.4f} ({marker}{abs(delta):.4f}), "
                        f"win={result['win_rate_pct']:.4f}%, "
                        f"roi={result['roi_pct']:.2f}%, "
                        f"best={result['best_match']}, "
                        f"N={result['total_predictions']}, "
                        f"T={result['elapsed_seconds']:.1f}s"
                    )
                else:
                    print(f"ERROR: {result['error']}")
            except Exception as e:
                print(f"FAILED: {e}")
                product_results["strategies"][name] = {"error": str(e)}

        results[product_key] = product_results

    # Save JSON
    output_file = output_dir / "phase1_backtest_results.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n\n✓ Results saved to {output_file}")

    # ─── Summary Table ─────────────────────────────────────────
    print("\n\n" + "=" * 110)
    print("  PHASE 1 COMPREHENSIVE BACKTEST SUMMARY")
    print("=" * 110)

    for product_key, prod_res in results.items():
        bl = prod_res["theoretical_baseline"]
        info = prod_res["data_info"]
        print(f"\n{'─'*110}")
        print(f"  {product_key} | {info['total_draws']} draws | {info['num_count']} from {info['min_val']}-{info['max_val']}")
        print(f"  Theoretical E[matches]={bl['expected_matches']}, P(win≥3)={bl['win_probability_pct']}%")
        print(f"{'─'*110}")
        print(
            f"  {'Strategy':<22} {'AvgMatch':>9} {'Δ':>7} {'WinRate%':>9} {'ROI%':>10} "
            f"{'Sharpe':>8} {'Best':>5} {'Consist':>8} {'N':>7}"
        )
        print(f"  {'─'*22} {'─'*9} {'─'*7} {'─'*9} {'─'*10} {'─'*8} {'─'*5} {'─'*8} {'─'*7}")

        strats = prod_res.get("strategies", {})
        rows = []
        for name, r in strats.items():
            if "error" in r and "avg_matches" not in r:
                continue
            delta = r.get("avg_matches", 0) - bl["expected_matches"]
            rows.append(
                (
                    name,
                    r.get("avg_matches", 0),
                    delta,
                    r.get("win_rate_pct", 0),
                    r.get("roi_pct", 0),
                    r.get("sharpe_ratio", 0),
                    r.get("best_match", 0),
                    r.get("consistency_std", 0),
                    r.get("total_predictions", 0),
                )
            )

        # Sort by avg_matches descending
        rows.sort(key=lambda x: x[1], reverse=True)

        for name, am, delta, wr, roi, sh, bm, con, n in rows:
            marker = "+" if delta > 0 else "" if delta < 0 else " "
            print(
                f"  {name:<22} {am:>9.4f} {marker}{delta:>6.4f} {wr:>9.4f} {roi:>10.2f} "
                f"{sh:>8.4f} {bm:>5} {con:>8.6f} {n:>7}"
            )

    # ─── Key Findings ──────────────────────────────────────────
    print("\n\n" + "=" * 110)
    print("  KEY FINDINGS")
    print("=" * 110)

    for product_key, prod_res in results.items():
        bl = prod_res["theoretical_baseline"]
        strats = prod_res.get("strategies", {})

        beat_random = []
        for name, r in strats.items():
            if "avg_matches" in r:
                delta = r["avg_matches"] - bl["expected_matches"]
                if delta > 0.01:
                    beat_random.append((name, delta))

        print(f"\n  {product_key}:")
        if beat_random:
            beat_random.sort(key=lambda x: x[1], reverse=True)
            for name, delta in beat_random:
                print(f"    ✓ {name}: +{delta:.4f} above theoretical baseline")
        else:
            print("    ✗ NO strategy significantly beat the theoretical random baseline")

        # Best strategy
        best_name = max(strats.items(), key=lambda x: x[1].get("avg_matches", 0))
        if "avg_matches" in best_name[1]:
            print(f"    Best: {best_name[0]} (avg_matches={best_name[1]['avg_matches']:.4f})")


if __name__ == "__main__":
    main()

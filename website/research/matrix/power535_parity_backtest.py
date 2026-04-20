"""Phase 2-3 for Power 5/35: EmpiricalParityMatch strategy + walk-forward backtest.

Derived from T11 Parity finding (p=0.0012 < Bonferroni 0.00357):
  Observed odd-count distribution {0:3.5%, 1:13.9%, 2:27.5%, 3:38.6%, 4:12.8%, 5:3.7%}
  Deviates from hypergeometric {0:1.9%, 1:13.2%, 2:32.0%, 3:34.2%, 4:16.0%, 5:2.6%}.

Compares 3 new parity strategies vs Random + Pattern (current #1).

Output: power535_parity_backtest_results.json
"""

from __future__ import annotations

import json
import math
import random
import time
from collections import Counter
from datetime import date, timedelta
from math import comb
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

DATA_PATH = Path(__file__).resolve().parents[3] / "data" / "power535.jsonl"
OUTPUT_PATH = Path(__file__).resolve().parent / "power535_parity_backtest_results.json"

MIN_VAL, MAX_VAL, NUM_COUNT = 1, 35, 5
PRIZES = {5: 6_000_000_000, 4: 500_000, 3: 50_000}
TICKET_PRICE = 10_000
ODD_POOL = [n for n in range(MIN_VAL, MAX_VAL + 1) if n % 2 == 1]  # 18 numbers
EVEN_POOL = [n for n in range(MIN_VAL, MAX_VAL + 1) if n % 2 == 0]  # 17 numbers


def load_data() -> pd.DataFrame:
    rows = []
    for line in DATA_PATH.read_text().strip().split("\n"):
        rec = json.loads(line)
        rows.append({"date": rec["date"], "id": rec["id"],
                     "result": [int(x) for x in rec["result"][:NUM_COUNT]]})
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"]).dt.date
    return df.sort_values(["date", "id"]).reset_index(drop=True)


# ---------- STRATEGIES ----------

class StrategyBase:
    name = "base"
    def predict(self, train_df, target_date): raise NotImplementedError


class RandomStrategy(StrategyBase):
    name = "Random"
    def predict(self, train_df, target_date):
        return sorted(random.sample(range(MIN_VAL, MAX_VAL + 1), NUM_COUNT))


class PatternStrategy(StrategyBase):
    """Current #1 — replicates website/research/matrix/backtest.py PatternStrategy."""
    name = "Pattern"
    def __init__(self, lookback_days=180):
        self.lookback_days = lookback_days

    def predict(self, train_df, target_date):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff]
        spacings = []
        for _, row in recent.iterrows():
            nums = sorted(row["result"])
            for i in range(1, len(nums)):
                spacings.append(nums[i] - nums[i - 1])
        avg_spacing = np.mean(spacings) if spacings else (MAX_VAL - MIN_VAL) / NUM_COUNT
        range_size = (MAX_VAL - MIN_VAL + 1) / 5
        range_counts = [0] * 5
        total = 0
        for _, row in recent.iterrows():
            for n in row["result"]:
                idx = min(4, int((n - MIN_VAL) / range_size))
                range_counts[idx] += 1
                total += 1
        range_probs = [c / total if total > 0 else 0.2 for c in range_counts]
        selected: list[int] = []
        attempts = 0
        while len(selected) < NUM_COUNT and attempts < 1000:
            attempts += 1
            r_idx = random.choices(range(5), weights=range_probs, k=1)[0]
            r_start = int(MIN_VAL + r_idx * range_size)
            r_end = int(min(MAX_VAL, MIN_VAL + (r_idx + 1) * range_size - 1))
            candidate = random.randint(r_start, r_end)
            if candidate not in selected and MIN_VAL <= candidate <= MAX_VAL:
                if selected:
                    min_space = min(abs(candidate - s) for s in selected)
                    if min_space >= max(1, int(avg_spacing * 0.5)):
                        selected.append(candidate)
                else:
                    selected.append(candidate)
        all_nums = list(range(MIN_VAL, MAX_VAL + 1))
        while len(selected) < NUM_COUNT:
            r = [n for n in all_nums if n not in selected]
            if r:
                selected.append(random.choice(r))
            else:
                break
        return sorted(selected[:NUM_COUNT])


class EmpiricalParityMatch(StrategyBase):
    """V1: Sample k (number of odds) from empirical distribution,
    then pick k odds + (5-k) evens uniformly."""
    name = "EmpParity_v1"

    def predict(self, train_df, target_date):
        # Build empirical distribution of odd-counts from training data
        odd_counts = [sum(1 for n in row for n in [n] if n % 2 == 1) for row in train_df["result"]]
        # Clean compute:
        odd_counts = []
        for row in train_df["result"]:
            odd_counts.append(sum(1 for n in row if n % 2 == 1))
        counter = Counter(odd_counts)
        # Dirichlet-Multinomial smoothing with alpha=1 (anti-overfit)
        alpha = 1.0
        total = len(odd_counts) + (NUM_COUNT + 1) * alpha
        probs = np.array([(counter.get(k, 0) + alpha) / total for k in range(NUM_COUNT + 1)])
        probs = probs / probs.sum()
        k = int(np.random.choice(NUM_COUNT + 1, p=probs))
        k = max(0, min(k, len(ODD_POOL), NUM_COUNT))
        k = max(k, NUM_COUNT - len(EVEN_POOL))  # feasibility
        odds = random.sample(ODD_POOL, k)
        evens = random.sample(EVEN_POOL, NUM_COUNT - k)
        return sorted(odds + evens)


class EmpiricalParityFreq(StrategyBase):
    """V2: Empirical parity distribution + frequency-weighted number selection within each pool."""
    name = "EmpParity_v2_freq"

    def __init__(self, lookback_days=365, temperature=1.0):
        self.lookback_days = lookback_days
        self.temperature = temperature

    def predict(self, train_df, target_date):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff]
        # Empirical parity distribution (smoothed)
        odd_counts = [sum(1 for n in row if n % 2 == 1) for row in recent["result"]]
        counter = Counter(odd_counts)
        alpha = 1.0
        total = len(odd_counts) + (NUM_COUNT + 1) * alpha
        probs = np.array([(counter.get(k, 0) + alpha) / total for k in range(NUM_COUNT + 1)])
        probs = probs / probs.sum()
        k = int(np.random.choice(NUM_COUNT + 1, p=probs))
        k = max(0, min(k, len(ODD_POOL), NUM_COUNT))
        k = max(k, NUM_COUNT - len(EVEN_POOL))
        # Freq-weighted within each pool
        freq = Counter(n for row in recent["result"] for n in row)

        def weighted_sample(pool: list[int], k_: int) -> list[int]:
            if k_ == 0:
                return []
            weights = np.array([freq.get(n, 0) + alpha for n in pool], dtype=float)
            weights = weights ** (1.0 / self.temperature)
            selected: list[int] = []
            available = list(pool)
            avail_w = weights.copy()
            for _ in range(k_):
                p = avail_w / avail_w.sum()
                idx = int(np.random.choice(len(available), p=p))
                selected.append(available.pop(idx))
                avail_w = np.delete(avail_w, idx)
            return selected

        odds = weighted_sample(ODD_POOL, k)
        evens = weighted_sample(EVEN_POOL, NUM_COUNT - k)
        return sorted(odds + evens)


class EmpiricalParityCold(StrategyBase):
    """V3: Empirical parity distribution + COLD (inverse frequency) within each pool.
    Rationale: Playbook says Freq_Cold was #3 on 5/35 (+0.0135)."""
    name = "EmpParity_v3_cold"

    def __init__(self, lookback_days=365):
        self.lookback_days = lookback_days

    def predict(self, train_df, target_date):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff]
        odd_counts = [sum(1 for n in row if n % 2 == 1) for row in recent["result"]]
        counter = Counter(odd_counts)
        alpha = 1.0
        total = len(odd_counts) + (NUM_COUNT + 1) * alpha
        probs = np.array([(counter.get(k, 0) + alpha) / total for k in range(NUM_COUNT + 1)])
        probs = probs / probs.sum()
        k = int(np.random.choice(NUM_COUNT + 1, p=probs))
        k = max(0, min(k, len(ODD_POOL), NUM_COUNT))
        k = max(k, NUM_COUNT - len(EVEN_POOL))
        freq = Counter(n for row in recent["result"] for n in row)
        max_f = max(freq.values()) if freq else 1

        def weighted_sample(pool: list[int], k_: int) -> list[int]:
            if k_ == 0:
                return []
            weights = np.array([max_f - freq.get(n, 0) + alpha for n in pool], dtype=float)
            selected: list[int] = []
            available = list(pool)
            avail_w = weights.copy()
            for _ in range(k_):
                p = avail_w / avail_w.sum()
                idx = int(np.random.choice(len(available), p=p))
                selected.append(available.pop(idx))
                avail_w = np.delete(avail_w, idx)
            return selected

        odds = weighted_sample(ODD_POOL, k)
        evens = weighted_sample(EVEN_POOL, NUM_COUNT - k)
        return sorted(odds + evens)


# ---------- BACKTEST ----------

def walk_forward(df: pd.DataFrame, strategy: StrategyBase, min_history: int = 100, n_runs: int = 5) -> dict[str, Any]:
    dates = sorted(df["date"].unique())
    n = len(dates)
    start_idx = min(min_history, n // 2)
    all_matches: list[int] = []
    all_revenues: list[int] = []
    t0 = time.time()
    for run in range(n_runs):
        for i in range(start_idx, n):
            target_date = dates[i]
            train_df = df[df["date"] < target_date]
            if len(train_df) < 30:
                continue
            try:
                predicted = strategy.predict(train_df, target_date)
            except Exception:
                continue
            if not predicted:
                continue
            actual_rows = df[df["date"] == target_date]
            if actual_rows.empty:
                continue
            actual = list(actual_rows.iloc[0]["result"])
            m = len(set(predicted) & set(actual))
            all_matches.append(m)
            all_revenues.append(PRIZES.get(m, 0) - TICKET_PRICE)
    elapsed = time.time() - t0
    if not all_matches:
        return {"error": "no predictions"}
    total_preds = len(all_matches)
    total_cost = total_preds * TICKET_PRICE
    total_revenue = sum(PRIZES.get(m, 0) for m in all_matches)
    dist = {str(m): all_matches.count(m) for m in range(max(all_matches) + 1)}
    avg_m = float(np.mean(all_matches))
    win_r = sum(1 for m in all_matches if m >= 3) / total_preds
    profits = np.array(all_revenues, dtype=float)
    sharpe = 0.0
    if len(profits) > 1 and profits.std(ddof=1) > 0:
        sharpe = (profits.mean() / profits.std(ddof=1)) * math.sqrt(52)
    return {
        "total_predictions": total_preds,
        "n_runs": n_runs,
        "avg_matches": round(avg_m, 4),
        "std_matches": round(float(np.std(all_matches, ddof=1)), 4),
        "win_rate_pct": round(win_r * 100, 4),
        "total_cost": int(total_cost),
        "total_revenue": int(total_revenue),
        "net_profit": int(total_revenue - total_cost),
        "roi_pct": round((total_revenue - total_cost) / total_cost * 100, 2),
        "sharpe_ratio": round(float(sharpe), 4),
        "best_match": max(all_matches),
        "matches_distribution": dist,
        "elapsed_seconds": round(elapsed, 2),
    }


def theoretical_E():
    return round(NUM_COUNT * NUM_COUNT / MAX_VAL, 4)


def main():
    print(f"Loading {DATA_PATH}")
    df = load_data()
    print(f"{len(df)} draws | {df['date'].iloc[0]} → {df['date'].iloc[-1]}")
    E = theoretical_E()
    print(f"Baseline E[matches] = {E}")
    print(f"Odd pool: {len(ODD_POOL)} nums | Even pool: {len(EVEN_POOL)} nums\n")

    strategies = [
        RandomStrategy(),
        PatternStrategy(180),
        EmpiricalParityMatch(),
        EmpiricalParityFreq(365, 1.0),
        EmpiricalParityFreq(180, 0.7),
        EmpiricalParityCold(365),
    ]
    strategy_names = [
        "Random",
        "Pattern(current #1)",
        "★EmpParity_v1_uniform",
        "★EmpParity_v2_freq_T1",
        "★EmpParity_v2_freq_T0.7",
        "★EmpParity_v3_cold",
    ]
    results: dict[str, Any] = {
        "meta": {
            "product": "power_535",
            "total_draws": len(df),
            "E": E,
            "min_history": 100,
            "n_runs": 5,
            "seed": 42,
        },
        "strategies": {},
    }

    for strat, name in zip(strategies, strategy_names):
        random.seed(42)
        np.random.seed(42)
        print(f"▸ {name:30s}", end=" ", flush=True)
        r = walk_forward(df, strat, min_history=100, n_runs=5)
        results["strategies"][name] = r
        if "error" not in r:
            delta = r["avg_matches"] - E
            marker = "▲" if delta > 0.005 else "▼" if delta < -0.005 else "="
            print(f"avg={r['avg_matches']:.4f} ({marker}{abs(delta):.4f}) win={r['win_rate_pct']:.3f}% "
                  f"roi={r['roi_pct']:.1f}% best={r['best_match']} T={r['elapsed_seconds']:.1f}s")
        else:
            print(f"ERROR: {r['error']}")

    # Ranking
    print("\n" + "=" * 90)
    print(f"  {'Strategy':30s} {'AvgMatch':>9} {'Δ vs E':>8} {'Win%':>7} {'ROI%':>8} {'Best':>5}")
    print("=" * 90)
    rows = []
    for name, r in results["strategies"].items():
        if "avg_matches" not in r:
            continue
        rows.append((name, r["avg_matches"], r["avg_matches"] - E, r["win_rate_pct"], r["roi_pct"], r["best_match"]))
    rows.sort(key=lambda x: -x[1])
    for name, am, d, wr, roi, bm in rows:
        print(f"  {name:30s} {am:>9.4f} {d:>+8.4f} {wr:>7.3f} {roi:>8.1f} {bm:>5}")

    OUTPUT_PATH.write_text(json.dumps(results, indent=2, ensure_ascii=False, default=str))
    print(f"\n✓ Saved: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

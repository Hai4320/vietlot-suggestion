"""Phase 2-3 Wheeling/Covering Design for Power 5/35.

Multi-ticket strategies exploiting the T11 parity bias + literature wheeling.
Evaluates: P(any ticket hits >=3), pooled ROI across N-ticket sets.

Baselines: RandomN, PatternN (current #1 duplicated).
Candidates:
  - ParityStratifiedWheel: allocate N tickets per empirical parity dist
  - MinDistanceWheel: maximize min Hamming distance (diversity)
  - GreedyCover3if3: covering design on top-12 hot numbers
  - HybridParityDiversity: parity-stratified + max-min distance

Output: power535_wheeling_backtest_results.json
"""

from __future__ import annotations

import json
import math
import random
import sys
import time
from collections import Counter
from datetime import timedelta
from itertools import combinations
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from _significance import build_significance  # noqa: E402

DATA_PATH = Path(__file__).resolve().parents[3] / "data" / "power535.jsonl"
OUTPUT_PATH = Path(__file__).resolve().parent / "power535_wheeling_backtest_results.json"

MIN_VAL, MAX_VAL, NUM_COUNT = 1, 35, 5
PRIZES = {5: 6_000_000_000, 4: 500_000, 3: 50_000}
TICKET_PRICE = 10_000
ODD_POOL = [n for n in range(MIN_VAL, MAX_VAL + 1) if n % 2 == 1]   # 18
EVEN_POOL = [n for n in range(MIN_VAL, MAX_VAL + 1) if n % 2 == 0]  # 17


def load_data() -> pd.DataFrame:
    rows = []
    for line in DATA_PATH.read_text().strip().split("\n"):
        rec = json.loads(line)
        rows.append({"date": rec["date"], "id": rec["id"],
                     "result": [int(x) for x in rec["result"][:NUM_COUNT]]})
    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"]).dt.date
    return df.sort_values(["date", "id"]).reset_index(drop=True)


# ---------- MULTI-TICKET STRATEGIES ----------

class MultiTicketStrategy:
    name = "base"
    def predict_n(self, train_df: pd.DataFrame, target_date, n: int) -> list[list[int]]:
        raise NotImplementedError


class RandomN(MultiTicketStrategy):
    name = "RandomN"
    def predict_n(self, train_df, target_date, n):
        return [sorted(random.sample(range(MIN_VAL, MAX_VAL + 1), NUM_COUNT)) for _ in range(n)]


class PatternN(MultiTicketStrategy):
    """N independent Pattern tickets (current single-ticket #1)."""
    name = "PatternN"

    def __init__(self, lookback_days: int = 180):
        self.lookback_days = lookback_days

    def _one(self, recent_df):
        spacings = []
        for _, row in recent_df.iterrows():
            nums = sorted(row["result"])
            for i in range(1, len(nums)):
                spacings.append(nums[i] - nums[i - 1])
        avg_spacing = np.mean(spacings) if spacings else (MAX_VAL - MIN_VAL) / NUM_COUNT
        range_size = (MAX_VAL - MIN_VAL + 1) / 5
        range_counts = [0] * 5
        total = 0
        for _, row in recent_df.iterrows():
            for v in row["result"]:
                idx = min(4, int((v - MIN_VAL) / range_size))
                range_counts[idx] += 1
                total += 1
        range_probs = [c / total if total else 0.2 for c in range_counts]
        selected: list[int] = []
        attempts = 0
        while len(selected) < NUM_COUNT and attempts < 1000:
            attempts += 1
            r_idx = random.choices(range(5), weights=range_probs, k=1)[0]
            r_start = int(MIN_VAL + r_idx * range_size)
            r_end = int(min(MAX_VAL, MIN_VAL + (r_idx + 1) * range_size - 1))
            cand = random.randint(r_start, r_end)
            if cand in selected:
                continue
            if selected:
                if min(abs(cand - s) for s in selected) >= max(1, int(avg_spacing * 0.5)):
                    selected.append(cand)
            else:
                selected.append(cand)
        while len(selected) < NUM_COUNT:
            r = [x for x in range(MIN_VAL, MAX_VAL + 1) if x not in selected]
            if r:
                selected.append(random.choice(r))
            else:
                break
        return sorted(selected[:NUM_COUNT])

    def predict_n(self, train_df, target_date, n):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff]
        return [self._one(recent) for _ in range(n)]


class ParityStratifiedWheel(MultiTicketStrategy):
    """Allocate N tickets to parity bins proportional to empirical distribution.
    Within each bin, numbers sampled freq-weighted (T=1.0, α=1 smoothing)."""
    name = "ParityStratifiedWheel"

    def __init__(self, lookback_days: int = 365, alpha: float = 1.0):
        self.lookback_days = lookback_days
        self.alpha = alpha

    def predict_n(self, train_df, target_date, n):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff]
        odd_counts = [sum(1 for v in row if v % 2 == 1) for row in recent["result"]]
        cnt = Counter(odd_counts)
        # Feasible k: need k <= 18, 5-k <= 17 => k in [0, 5]
        probs = np.array([(cnt.get(k, 0) + self.alpha) for k in range(NUM_COUNT + 1)], dtype=float)
        probs /= probs.sum()
        # Allocate N tickets: largest remainder method
        expected_counts = probs * n
        base = np.floor(expected_counts).astype(int)
        remainder = expected_counts - base
        leftover = n - base.sum()
        for idx in np.argsort(-remainder)[:leftover]:
            base[idx] += 1
        # Per-pool frequencies (Dirichlet smoothed)
        freq = Counter(v for row in recent["result"] for v in row)
        odd_w = np.array([freq.get(x, 0) + self.alpha for x in ODD_POOL], dtype=float)
        even_w = np.array([freq.get(x, 0) + self.alpha for x in EVEN_POOL], dtype=float)

        def sample_from(pool, weights, k):
            if k == 0:
                return []
            idxs = list(range(len(pool)))
            w = weights.copy()
            out = []
            for _ in range(k):
                p = w / w.sum()
                choice = int(np.random.choice(len(idxs), p=p))
                out.append(pool[idxs[choice]])
                idxs.pop(choice)
                w = np.delete(w, choice)
            return out

        tickets: list[list[int]] = []
        for k, count in enumerate(base):
            for _ in range(count):
                odds = sample_from(ODD_POOL, odd_w, k)
                evens = sample_from(EVEN_POOL, even_w, NUM_COUNT - k)
                tickets.append(sorted(odds + evens))
        random.shuffle(tickets)
        return tickets


class MinDistanceWheel(MultiTicketStrategy):
    """Max-min Hamming distance wheel: greedy tickets with max-min set-distance."""
    name = "MinDistanceWheel"

    def __init__(self, lookback_days: int = 365, candidate_pool: int = 50, alpha: float = 1.0):
        self.lookback_days = lookback_days
        self.candidate_pool = candidate_pool
        self.alpha = alpha

    def predict_n(self, train_df, target_date, n):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff]
        freq = Counter(v for row in recent["result"] for v in row)
        all_nums = list(range(MIN_VAL, MAX_VAL + 1))
        weights = np.array([freq.get(x, 0) + self.alpha for x in all_nums], dtype=float)

        def sample_ticket() -> list[int]:
            idxs = list(range(len(all_nums)))
            w = weights.copy()
            sel = []
            for _ in range(NUM_COUNT):
                p = w / w.sum()
                c = int(np.random.choice(len(idxs), p=p))
                sel.append(all_nums[idxs[c]])
                idxs.pop(c)
                w = np.delete(w, c)
            return sorted(sel)

        chosen: list[set[int]] = []
        tickets: list[list[int]] = []
        for _ in range(n):
            if not chosen:
                t = sample_ticket()
                tickets.append(t)
                chosen.append(set(t))
                continue
            best_t = None
            best_d = -1
            for _ in range(self.candidate_pool):
                cand = sample_ticket()
                cand_s = set(cand)
                d = min(NUM_COUNT - len(cand_s & c) for c in chosen)
                if d > best_d:
                    best_d = d
                    best_t = cand
                    if best_d == NUM_COUNT:
                        break
            tickets.append(best_t)
            chosen.append(set(best_t))
        return tickets


class GreedyCover3if3(MultiTicketStrategy):
    """Greedy covering design: guarantee 3-if-3 on top-v hot numbers.
    Takes top-v=12 hot numbers as 'favorite pool'; generates N tickets that maximize
    coverage of C(v, 3) triples. Ordered by greedy coverage gain."""
    name = "GreedyCover3if3"

    def __init__(self, lookback_days: int = 365, pool_size: int = 12, parity_weighted: bool = False):
        self.lookback_days = lookback_days
        self.pool_size = pool_size
        self.parity_weighted = parity_weighted

    def _get_pool(self, train_df, target_date) -> list[int]:
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff]
        freq = Counter(v for row in recent["result"] for v in row)
        ranked = sorted(range(MIN_VAL, MAX_VAL + 1), key=lambda x: -freq.get(x, 0))
        if self.parity_weighted:
            # Bias pool toward matching observed parity ratio (odds/evens ~18/17 * parity_bias)
            odds_taken = [x for x in ranked if x % 2 == 1][: self.pool_size // 2 + 1]
            evens_taken = [x for x in ranked if x % 2 == 0][: self.pool_size // 2]
            pool = (odds_taken + evens_taken)[: self.pool_size]
        else:
            pool = ranked[: self.pool_size]
        return sorted(pool)

    def predict_n(self, train_df, target_date, n):
        pool = self._get_pool(train_df, target_date)
        v = len(pool)
        # All 3-subsets to cover
        all_triples = set(combinations(pool, 3))
        # Candidate tickets: all C(v, 5) — tractable for v<=15 (C(12,5)=792)
        all_tickets = list(combinations(pool, NUM_COUNT))
        covered: set[tuple[int, ...]] = set()
        tickets: list[list[int]] = []
        for _ in range(n):
            best_gain = -1
            best_t = None
            random.shuffle(all_tickets)
            for t in all_tickets:
                triples_in_t = set(combinations(t, 3))
                gain = len(triples_in_t - covered)
                if gain > best_gain:
                    best_gain = gain
                    best_t = t
                    if gain == math.comb(NUM_COUNT, 3):  # max possible
                        pass
            tickets.append(sorted(best_t))
            covered.update(combinations(best_t, 3))
            if covered == all_triples:
                # Saturated — start a new cycle to fill remaining N
                covered = set()
        return tickets


class HybridParityDiversity(MultiTicketStrategy):
    """Parity-stratified allocation + max-min Hamming distance within each parity bin."""
    name = "HybridParityDiversity"

    def __init__(self, lookback_days: int = 365, candidate_pool: int = 30, alpha: float = 1.0):
        self.lookback_days = lookback_days
        self.candidate_pool = candidate_pool
        self.alpha = alpha

    def predict_n(self, train_df, target_date, n):
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = train_df.loc[train_df["date"] >= cutoff]
        odd_counts = [sum(1 for v in row if v % 2 == 1) for row in recent["result"]]
        cnt = Counter(odd_counts)
        probs = np.array([cnt.get(k, 0) + self.alpha for k in range(NUM_COUNT + 1)], dtype=float)
        probs /= probs.sum()
        expected = probs * n
        base = np.floor(expected).astype(int)
        rem = expected - base
        leftover = n - base.sum()
        for idx in np.argsort(-rem)[:leftover]:
            base[idx] += 1
        freq = Counter(v for row in recent["result"] for v in row)
        odd_w = np.array([freq.get(x, 0) + self.alpha for x in ODD_POOL], dtype=float)
        even_w = np.array([freq.get(x, 0) + self.alpha for x in EVEN_POOL], dtype=float)

        def sample(pool, w, k):
            if k == 0:
                return []
            idxs = list(range(len(pool)))
            ww = w.copy()
            out = []
            for _ in range(k):
                p = ww / ww.sum()
                c = int(np.random.choice(len(idxs), p=p))
                out.append(pool[idxs[c]])
                idxs.pop(c)
                ww = np.delete(ww, c)
            return out

        chosen: list[set[int]] = []
        tickets: list[list[int]] = []
        for k, count in enumerate(base):
            for _ in range(count):
                if not chosen:
                    t = sorted(sample(ODD_POOL, odd_w, k) + sample(EVEN_POOL, even_w, NUM_COUNT - k))
                    tickets.append(t)
                    chosen.append(set(t))
                    continue
                best_t = None
                best_d = -1
                for _ in range(self.candidate_pool):
                    cand = sorted(sample(ODD_POOL, odd_w, k) + sample(EVEN_POOL, even_w, NUM_COUNT - k))
                    cs = set(cand)
                    d = min(NUM_COUNT - len(cs & c) for c in chosen)
                    if d > best_d:
                        best_d = d
                        best_t = cand
                        if best_d == NUM_COUNT:
                            break
                tickets.append(best_t)
                chosen.append(set(best_t))
        random.shuffle(tickets)
        return tickets


# ---------- BACKTEST ----------

def walk_forward_multi(df, strategy: MultiTicketStrategy, n_tickets: int,
                        min_history: int = 100, n_runs: int = 5) -> dict[str, Any]:
    # Iterate over each draw (row) so multi-draw-per-day products (Power 5/35 has 2/day)
    # are fully evaluated. Previous version iterated over dates.unique() and dropped ~50% of data.
    n_total = len(df)
    start_idx = min(min_history, n_total // 2)
    draws_n = 0
    any_hit3_plus = 0
    total_matches_per_draw: list[int] = []
    best_match_per_draw: list[int] = []
    pooled_revenue = 0
    pooled_cost = 0
    tier_hits = Counter()
    t0 = time.time()
    for run in range(n_runs):
        for i in range(start_idx, n_total):
            target_row = df.iloc[i]
            target_date = target_row["date"]
            train_df = df.iloc[:i]
            if len(train_df) < 30:
                continue
            actual = set(target_row["result"])
            try:
                tickets = strategy.predict_n(train_df, target_date, n_tickets)
            except Exception:
                continue
            draws_n += 1
            draw_revenue = 0
            best = 0
            for t in tickets:
                m = len(set(t) & actual)
                tier_hits[m] += 1
                draw_revenue += PRIZES.get(m, 0)
                best = max(best, m)
            best_match_per_draw.append(best)
            total_matches_per_draw.append(sum(len(set(t) & actual) for t in tickets))
            pooled_revenue += draw_revenue
            pooled_cost += n_tickets * TICKET_PRICE
            if best >= 3:
                any_hit3_plus += 1
    elapsed = time.time() - t0
    if draws_n == 0:
        return {"error": "no draws"}
    return {
        "n_tickets_per_draw": n_tickets,
        "n_draws_evaluated": draws_n,
        "n_runs": n_runs,
        "p_any_hit_ge3_pct": round(any_hit3_plus / draws_n * 100, 4),
        "any_hit_ge3_count": int(any_hit3_plus),          # for significance test
        "mean_best_match": round(float(np.mean(best_match_per_draw)), 4),
        "mean_total_match": round(float(np.mean(total_matches_per_draw)), 4),
        "mean_match_per_ticket": round(float(np.mean(total_matches_per_draw)) / n_tickets, 4),
        "pooled_cost": pooled_cost,
        "pooled_revenue": pooled_revenue,
        "pooled_roi_pct": round((pooled_revenue - pooled_cost) / pooled_cost * 100, 2),
        "tier_hits": {str(k): int(v) for k, v in sorted(tier_hits.items())},
        "elapsed_seconds": round(elapsed, 2),
    }


def attach_significance_wheel(results_for_n: dict, baseline_name: str = "RandomN") -> None:
    """Add significance block to each strategy (at one N) vs RandomN. Mutates in place."""
    base = results_for_n.get(baseline_name, {})
    if "any_hit_ge3_count" not in base:
        return
    base_hits = base["any_hit_ge3_count"]
    base_n = base["n_draws_evaluated"]
    non_baseline = [n for n in results_for_n if n != baseline_name and "any_hit_ge3_count" in results_for_n[n]]
    k = len(non_baseline)
    for name in non_baseline:
        r = results_for_n[name]
        r["significance"] = build_significance(
            hits_strat=r["any_hit_ge3_count"], n_strat=r["n_draws_evaluated"],
            hits_baseline=base_hits, n_baseline=base_n,
            n_strategies_compared=k, baseline_name=baseline_name,
            metric_name="p_any_hit_ge3",
        )


def main():
    print(f"Loading {DATA_PATH}")
    df = load_data()
    print(f"{len(df)} draws | {df['date'].iloc[0]} → {df['date'].iloc[-1]}")

    strategies = [
        ("RandomN", RandomN()),
        ("PatternN", PatternN(180)),
        ("★ParityStratWheel", ParityStratifiedWheel(365, 1.0)),
        ("★MinDistanceWheel", MinDistanceWheel(365, 50, 1.0)),
        ("★GreedyCover3if3_v12", GreedyCover3if3(365, 12, False)),
        ("★GreedyCover3if3_parity", GreedyCover3if3(365, 12, True)),
        ("★HybridParityDiv", HybridParityDiversity(365, 30, 1.0)),
    ]
    n_list = [5, 10, 20]
    results: dict[str, Any] = {
        "meta": {
            "product": "power_535",
            "total_draws": len(df),
            "n_list": n_list,
            "min_history": 100,
            "n_runs": 3,  # reduce for wheeling (greedy is slow)
            "seed": 42,
        },
        "results": {},
    }
    for n in n_list:
        print(f"\n{'=' * 110}\n  N={n} tickets/draw\n{'=' * 110}")
        print(f"  {'Strategy':26s} {'P(any≥3)%':>10} {'MeanBest':>9} {'ROI%':>8} {'p_raw':>8} {'Decision':>12}")
        results["results"][str(n)] = {}
        for name, strat in strategies:
            random.seed(42)
            np.random.seed(42)
            r = walk_forward_multi(df, strat, n, min_history=100, n_runs=3)
            results["results"][str(n)][name] = r
        attach_significance_wheel(results["results"][str(n)], baseline_name="RandomN")
        for name, _ in strategies:
            r = results["results"][str(n)][name]
            if "error" in r: continue
            sig = r.get("significance", {})
            pv = sig.get("p_value_raw")
            pv_str = f"{pv:.4f}" if pv is not None else "    —"
            print(f"  {name:26s} {r['p_any_hit_ge3_pct']:>10.3f} {r['mean_best_match']:>9.3f} "
                  f"{r['pooled_roi_pct']:>8.2f} {pv_str:>8} {sig.get('decision', '-'):>12}")
    OUTPUT_PATH.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\n✓ {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

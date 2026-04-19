#!/usr/bin/env python3
"""
3D Product Backtest — Max 3D & Max 3D Pro
==========================================

Backtest 10 strategies on 3-digit lottery products.

Data format per draw:
  - "Giải Đặc biệt": 2 numbers (3-digit strings)
  - "Giải Nhất":      4 numbers
  - "Giải Nhì":       6 numbers
  - "Giải ba":        8 numbers
  Total: 20 numbers per draw, range 000–999

Evaluation metrics:
  1. Exact match rate: predicted number appears in draw result (any tier)
  2. Tier-weighted match: higher tier match = higher score
  3. Digit-level accuracy: per-position digit match rate
  4. ROI: based on official prize structure

Prize structure (Max 3D, per 10,000 VND ticket, 1 number):
  - Đặc biệt: 1,000,000 VND
  - Nhất:        350,000 VND
  - Nhì:         210,000 VND
  - Ba:           100,000 VND
"""

import json
import math
import random
import time
from collections import Counter, defaultdict
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"

PRODUCTS_3D = {
    "max_3d": {
        "file": "3d.jsonl",
        "ticket_price": 10_000,
        "prizes": {
            "Giải Đặc biệt": 1_000_000,
            "Giải Nhất": 350_000,
            "Giải Nhì": 210_000,
            "Giải ba": 100_000,
        },
        "tier_counts": {
            "Giải Đặc biệt": 2,
            "Giải Nhất": 4,
            "Giải Nhì": 6,
            "Giải ba": 8,
        },
    },
    "max_3d_pro": {
        "file": "3d_pro.jsonl",
        "ticket_price": 10_000,
        "prizes": {
            "Giải Đặc biệt": 1_000_000,
            "Giải Nhất": 350_000,
            "Giải Nhì": 210_000,
            "Giải ba": 100_000,
        },
        "tier_counts": {
            "Giải Đặc biệt": 2,
            "Giải Nhất": 4,
            "Giải Nhì": 6,
            "Giải ba": 8,
        },
    },
}

TIER_ORDER = ["Giải Đặc biệt", "Giải Nhất", "Giải Nhì", "Giải ba"]
TIER_WEIGHTS = {"Giải Đặc biệt": 4, "Giải Nhất": 3, "Giải Nhì": 2, "Giải ba": 1}


def load_3d_data(product_key: str) -> List[Dict]:
    cfg = PRODUCTS_3D[product_key]
    path = DATA_DIR / cfg["file"]
    rows = []
    for line in path.read_text().strip().split("\n"):
        rec = json.loads(line)
        # Normalize: pad all numbers to 3 digits
        result = {}
        for tier in TIER_ORDER:
            nums = rec["result"].get(tier, [])
            result[tier] = [str(n).zfill(3) for n in nums]
        rows.append({
            "date": rec["date"],
            "id": rec["id"],
            "result": result,
        })
    # Sort by date ascending
    rows.sort(key=lambda x: x["date"])
    return rows


def all_numbers_in_draw(draw: Dict) -> List[str]:
    """Flatten all 20 numbers from a draw."""
    nums = []
    for tier in TIER_ORDER:
        nums.extend(draw["result"].get(tier, []))
    return nums


def get_digit_freq(draws: List[Dict]) -> List[List[int]]:
    """Compute digit frequency per position (0,1,2) from all numbers in draws."""
    freq = [[0] * 10 for _ in range(3)]
    for draw in draws:
        for num in all_numbers_in_draw(draw):
            for pos in range(3):
                freq[pos][int(num[pos])] += 1
    return freq


def get_number_freq(draws: List[Dict]) -> Counter:
    """Count frequency of each 3-digit number across all draws."""
    c = Counter()
    for draw in draws:
        for num in all_numbers_in_draw(draw):
            c[num] += 1
    return c


# ═══════════════════════════════════════════════════════════════
# STRATEGIES — each returns a list of N predicted 3-digit strings
# ═══════════════════════════════════════════════════════════════

class Strategy3D:
    name: str = "base"
    def predict(self, train_draws: List[Dict], n_predictions: int = 2) -> List[str]:
        raise NotImplementedError


class RandomStrategy(Strategy3D):
    name = "Random"
    def predict(self, train_draws, n_predictions=2):
        return [f"{random.randint(0, 999):03d}" for _ in range(n_predictions)]


class FrequencyWholeStrategy(Strategy3D):
    """Pick from most frequent whole 3-digit numbers."""
    name = "Freq_Whole"
    def __init__(self, lookback=200):
        self.lookback = lookback

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        freq = get_number_freq(recent)
        if not freq:
            return [f"{random.randint(0, 999):03d}" for _ in range(n_predictions)]
        # Weighted random from top 50
        top = freq.most_common(50)
        nums, counts = zip(*top) if top else ([], [])
        weights = np.array(counts, dtype=float)
        weights /= weights.sum()
        chosen = set()
        result = []
        for _ in range(n_predictions * 10):
            if len(result) >= n_predictions:
                break
            idx = np.random.choice(len(nums), p=weights)
            if nums[idx] not in chosen:
                chosen.add(nums[idx])
                result.append(nums[idx])
        while len(result) < n_predictions:
            result.append(f"{random.randint(0, 999):03d}")
        return result


class FrequencyColdWholeStrategy(Strategy3D):
    """Pick whole numbers NOT seen recently."""
    name = "Freq_Cold_Whole"
    def __init__(self, lookback=200):
        self.lookback = lookback

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        seen = set()
        for d in recent:
            for num in all_numbers_in_draw(d):
                seen.add(num)
        all_nums = [f"{i:03d}" for i in range(1000)]
        unseen = [n for n in all_nums if n not in seen]
        if len(unseen) >= n_predictions:
            return random.sample(unseen, n_predictions)
        return [f"{random.randint(0, 999):03d}" for _ in range(n_predictions)]


class DigitFrequencyStrategy(Strategy3D):
    """Compose digit-by-digit using positional frequency (hot digits)."""
    name = "Digit_Hot"
    def __init__(self, lookback=200):
        self.lookback = lookback

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        freq = get_digit_freq(recent)
        result = []
        for _ in range(n_predictions):
            num = ""
            for pos in range(3):
                weights = np.array(freq[pos], dtype=float)
                total = weights.sum()
                if total <= 0:
                    num += str(random.randint(0, 9))
                else:
                    weights /= total
                    num += str(np.random.choice(10, p=weights))
            result.append(num)
        return result


class DigitColdStrategy(Strategy3D):
    """Compose digit-by-digit using positional frequency (cold digits)."""
    name = "Digit_Cold"
    def __init__(self, lookback=200):
        self.lookback = lookback

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        freq = get_digit_freq(recent)
        result = []
        for _ in range(n_predictions):
            num = ""
            for pos in range(3):
                # Invert: low freq = high weight
                counts = np.array(freq[pos], dtype=float) + 1
                weights = 1.0 / counts
                weights /= weights.sum()
                num += str(np.random.choice(10, p=weights))
            result.append(num)
        return result


class BayesianDigitStrategy(Strategy3D):
    """Dirichlet posterior sampling on digit positions."""
    name = "★Bayesian_Digit"
    def __init__(self, lookback=300, temperature=1.0):
        self.lookback = lookback
        self.temperature = temperature

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        freq = get_digit_freq(recent)
        result = []
        for _ in range(n_predictions):
            num = ""
            for pos in range(3):
                alpha = np.array([1.0 + freq[pos][d] for d in range(10)])
                theta = np.random.dirichlet(alpha)
                # Temperature
                tempered = np.power(theta, 1.0 / self.temperature)
                tempered /= tempered.sum()
                num += str(np.random.choice(10, p=tempered))
            result.append(num)
        return result


class MaxEntropyDigitStrategy(Strategy3D):
    """Stratified digit sampling: low band / high band alternating."""
    name = "★MaxEntropy_Digit"
    def __init__(self, lookback=300):
        self.lookback = lookback

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        freq = get_digit_freq(recent)
        result = []
        for n in range(n_predictions):
            num = ""
            for pos in range(3):
                use_low = (pos + n) % 2 == 0
                band = list(range(0, 5)) if use_low else list(range(5, 10))
                alpha = np.array([1.0 + freq[pos][d] for d in band])
                theta = np.random.dirichlet(alpha)
                digit = band[np.random.choice(len(band), p=theta)]
                num += str(digit)
            result.append(num)
        return result


class AdaptiveWindowDigitStrategy(Strategy3D):
    """Self-tuning lookback window + digit frequency composition."""
    name = "★Adaptive_Digit"
    def __init__(self, windows=None, eval_draws=10):
        self.windows = windows or [50, 100, 200, 400]
        self.eval_draws = eval_draws

    def predict(self, train_draws, n_predictions=2):
        n = len(train_draws)
        eval_count = min(self.eval_draws, n // 3)
        best_w, best_score = 200, -1

        for w in self.windows:
            total_matches = 0
            valid = 0
            for e in range(eval_count):
                idx = n - 1 - e
                if idx < 20:
                    break
                # Compute digit freq in window ending before idx
                window_draws = train_draws[max(0, idx - w):idx]
                if len(window_draws) < 10:
                    continue
                freq = get_digit_freq(window_draws)
                # Predict: top digit per position
                predicted = ""
                for pos in range(3):
                    predicted += str(np.argmax(freq[pos]))
                # Check against actual draw
                actual_nums = all_numbers_in_draw(train_draws[idx])
                # Count digit-level matches across all 20 numbers
                for actual in actual_nums:
                    matches = sum(1 for p in range(3) if actual[p] == predicted[p])
                    total_matches += matches
                valid += len(actual_nums)
            avg = total_matches / valid if valid > 0 else 0
            if avg > best_score:
                best_score = avg
                best_w = w

        # Use best window
        window_draws = train_draws[-best_w:]
        freq = get_digit_freq(window_draws)
        result = []
        for _ in range(n_predictions):
            num = ""
            for pos in range(3):
                weights = np.array(freq[pos], dtype=float)
                total = weights.sum()
                if total <= 0:
                    num += str(random.randint(0, 9))
                else:
                    # 80% weighted, 20% random
                    if random.random() < 0.8:
                        weights /= total
                        num += str(np.random.choice(10, p=weights))
                    else:
                        num += str(random.randint(0, 9))
            result.append(num)
        return result


class PatternStrategy(Strategy3D):
    """Analyze recent patterns: sum, range, odd/even ratio of drawn numbers."""
    name = "Pattern_3D"
    def __init__(self, lookback=100):
        self.lookback = lookback

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        # Analyze digit sum distribution
        sums = []
        for d in recent:
            for num in all_numbers_in_draw(d):
                sums.append(sum(int(c) for c in num))
        if not sums:
            return [f"{random.randint(0, 999):03d}" for _ in range(n_predictions)]
        mean_sum = np.mean(sums)
        std_sum = max(np.std(sums), 1)
        result = []
        for _ in range(n_predictions * 20):
            if len(result) >= n_predictions:
                break
            n = f"{random.randint(0, 999):03d}"
            s = sum(int(c) for c in n)
            # Accept if within 1 std of mean
            if abs(s - mean_sum) <= std_sum:
                result.append(n)
        while len(result) < n_predictions:
            result.append(f"{random.randint(0, 999):03d}")
        return result[:n_predictions]


class TierFocusStrategy(Strategy3D):
    """Focus on specific tier frequency (e.g., Đặc biệt only)."""
    name = "Tier_Focus"
    def __init__(self, tier="Giải Đặc biệt", lookback=200):
        self.tier = tier
        self.lookback = lookback

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        freq = Counter()
        for d in recent:
            for num in d["result"].get(self.tier, []):
                freq[str(num).zfill(3)] += 1
        if not freq:
            return [f"{random.randint(0, 999):03d}" for _ in range(n_predictions)]
        top = freq.most_common(30)
        nums, counts = zip(*top)
        weights = np.array(counts, dtype=float)
        weights /= weights.sum()
        chosen = set()
        result = []
        for _ in range(n_predictions * 10):
            if len(result) >= n_predictions:
                break
            idx = np.random.choice(len(nums), p=weights)
            if nums[idx] not in chosen:
                chosen.add(nums[idx])
                result.append(nums[idx])
        while len(result) < n_predictions:
            result.append(f"{random.randint(0, 999):03d}")
        return result


class BayesianWholeStrategy(Strategy3D):
    """Bayesian on whole number frequency (not digit-level)."""
    name = "★Bayesian_Whole"
    def __init__(self, lookback=300, temperature=1.5):
        self.lookback = lookback
        self.temperature = temperature

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        freq = get_number_freq(recent)
        # Build full distribution over 1000 numbers
        alpha = np.array([1.0 + freq.get(f"{i:03d}", 0) for i in range(1000)])
        theta = np.random.dirichlet(alpha)
        tempered = np.power(theta, 1.0 / self.temperature)
        tempered /= tempered.sum()
        indices = np.random.choice(1000, size=n_predictions, replace=False, p=tempered)
        return [f"{i:03d}" for i in indices]


# ═══════════════════════════════════════════════════════════════
# BACKTEST ENGINE
# ═══════════════════════════════════════════════════════════════

def evaluate_prediction(predicted: List[str], draw: Dict, prize_map: Dict) -> Dict:
    """Evaluate predictions against a draw result."""
    exact_matches = []
    best_tier = None
    best_prize = 0
    total_prize = 0

    for pred in predicted:
        for tier in TIER_ORDER:
            if pred in draw["result"].get(tier, []):
                exact_matches.append({"number": pred, "tier": tier})
                prize = prize_map.get(tier, 0)
                total_prize += prize
                if best_tier is None or TIER_ORDER.index(tier) < TIER_ORDER.index(best_tier):
                    best_tier = tier
                    best_prize = prize
                break  # count only highest tier match per number

    # Digit-level accuracy (per predicted number, average over all actual numbers)
    digit_matches_total = 0
    digit_comparisons = 0
    for pred in predicted:
        for tier in TIER_ORDER:
            for actual in draw["result"].get(tier, []):
                for pos in range(3):
                    if pred[pos] == actual[pos]:
                        digit_matches_total += 1
                digit_comparisons += 3

    digit_accuracy = digit_matches_total / digit_comparisons if digit_comparisons > 0 else 0

    return {
        "exact_count": len(exact_matches),
        "matches": exact_matches,
        "best_tier": best_tier,
        "total_prize": total_prize,
        "digit_accuracy": digit_accuracy,
    }


def walk_forward_backtest_3d(draws, strategy, product_cfg, min_history=50, n_runs=3, n_predictions=2):
    """Walk-forward backtest for 3D strategies."""
    n = len(draws)
    start_idx = min(min_history, n // 2)
    prizes = product_cfg["prizes"]
    ticket_price = product_cfg["ticket_price"]

    all_exact_counts = []
    all_digit_acc = []
    all_revenues = []
    tier_hit_counts = defaultdict(int)
    total_preds = 0

    t0 = time.time()
    for run in range(n_runs):
        for i in range(start_idx, n):
            train = draws[:i]
            if len(train) < 20:
                continue
            try:
                predicted = strategy.predict(train, n_predictions)
                if not predicted:
                    continue
            except Exception:
                continue

            ev = evaluate_prediction(predicted, draws[i], prizes)
            all_exact_counts.append(ev["exact_count"])
            all_digit_acc.append(ev["digit_accuracy"])

            # Revenue per prediction set
            rev = ev["total_prize"] - ticket_price * n_predictions
            all_revenues.append(rev)
            total_preds += 1

            for m in ev["matches"]:
                tier_hit_counts[m["tier"]] += 1

    elapsed = time.time() - t0

    if total_preds == 0:
        return {"error": "No predictions"}

    total_cost = total_preds * ticket_price * n_predictions
    total_revenue = sum(r + ticket_price * n_predictions for r in all_revenues)
    exact_matches_total = sum(all_exact_counts)
    exact_rate = exact_matches_total / (total_preds * n_predictions)

    profits = np.array(all_revenues, dtype=float)
    sharpe = 0.0
    if len(profits) > 1:
        std = np.std(profits, ddof=1)
        if std > 0:
            sharpe = (np.mean(profits) / std) * np.sqrt(52)

    return {
        "total_predictions": total_preds,
        "n_runs": n_runs,
        "n_predictions_per_draw": n_predictions,
        "exact_match_rate": round(float(exact_rate * 100), 4),
        "exact_matches_total": exact_matches_total,
        "avg_digit_accuracy": round(float(np.mean(all_digit_acc) * 100), 4),
        "tier_hits": dict(tier_hit_counts),
        "total_cost": int(total_cost),
        "total_revenue": int(total_revenue),
        "net_profit": int(total_revenue - total_cost),
        "roi_pct": round(float((total_revenue - total_cost) / total_cost * 100), 2),
        "sharpe_ratio": round(float(sharpe), 4),
        "elapsed_seconds": round(elapsed, 2),
    }


def theoretical_baseline_3d(n_predictions=2, total_numbers_per_draw=20):
    """
    Baseline: probability of at least 1 exact match among n_predictions
    from pool of 1000, when draw contains total_numbers_per_draw.
    P(match per number) = total_numbers_per_draw / 1000
    P(>=1 match in n_predictions) = 1 - (1 - p)^n
    """
    p = total_numbers_per_draw / 1000
    p_any = 1 - (1 - p) ** n_predictions
    expected_matches = n_predictions * p
    return {
        "p_per_number": round(p * 100, 4),
        "p_any_match": round(p_any * 100, 4),
        "expected_matches": round(expected_matches, 4),
        "digit_accuracy_baseline": round(10.0, 4),  # 1/10 per digit = 10%
    }


# ═══════════════════════════════════════════════════════════════
# NEW STRATEGIES FROM INTERNET RESEARCH
# ═══════════════════════════════════════════════════════════════

class MarkovDigitTransitionStrategy(Strategy3D):
    """
    Markov Chain on digit transitions (from cpeoples/powerpredict approach).
    Build a 10x10 transition matrix per position:
      P(digit_next | digit_current) using mode digit of previous draw.
    Use last draw's mode digits as seed, sample from transition row.
    """
    name = "Markov_Digit"
    def __init__(self, lookback=100, temperature=1.2):
        self.lookback = lookback
        self.temperature = temperature

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        if len(recent) < 3:
            return [f"{random.randint(0, 999):03d}" for _ in range(n_predictions)]

        # Build transition matrix per position using draw-level mode digits
        trans = [np.ones((10, 10)) for _ in range(3)]  # Laplace smoothing
        for i in range(len(recent) - 1):
            prev_nums = all_numbers_in_draw(recent[i])
            curr_nums = all_numbers_in_draw(recent[i + 1])
            for pos in range(3):
                prev_mode = Counter(int(n[pos]) for n in prev_nums).most_common(1)[0][0]
                for n in curr_nums:
                    trans[pos][prev_mode][int(n[pos])] += 1

        # Normalize rows
        for pos in range(3):
            for d in range(10):
                row_sum = trans[pos][d].sum()
                if row_sum > 0:
                    trans[pos][d] /= row_sum

        # Use last draw's mode digits as seed
        last_nums = all_numbers_in_draw(recent[-1])
        seed = [Counter(int(n[p]) for n in last_nums).most_common(1)[0][0] for p in range(3)]

        results = []
        for _ in range(n_predictions):
            num = ""
            for pos in range(3):
                probs = trans[pos][seed[pos]].copy()
                probs = np.power(probs, 1.0 / self.temperature)
                probs /= probs.sum()
                digit = np.random.choice(10, p=probs)
                num += str(digit)
            results.append(num)
        return results


class SumRangeFilterStrategy(Strategy3D):
    """
    Pattern matching with structural constraints (from cpeoples/powerpredict).
    1. Compute digit-sum distribution from recent data
    2. Find optimal digit-sum range (mode ± 1 std)
    3. Generate numbers using digit frequency, filtered by sum range
    Optimized: pre-build digit weights once, sample efficiently.
    """
    name = "SumRange_Filter"
    def __init__(self, lookback=100):
        self.lookback = lookback

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        if len(recent) < 10:
            return [f"{random.randint(0, 999):03d}" for _ in range(n_predictions)]

        # Compute digit-sum stats + digit weights in one pass
        digit_freq = [[0] * 10 for _ in range(3)]
        digit_sums = []
        for draw in recent:
            for num in all_numbers_in_draw(draw):
                ds = 0
                for pos in range(3):
                    d = int(num[pos])
                    digit_freq[pos][d] += 1
                    ds += d
                digit_sums.append(ds)

        mean_sum = np.mean(digit_sums)
        std_sum = max(np.std(digit_sums), 1.0)
        lo = max(0, mean_sum - std_sum)
        hi = min(27, mean_sum + std_sum)

        # Precompute digit weights
        dw = []
        for pos in range(3):
            total = sum(digit_freq[pos])
            if total > 0:
                w = np.array(digit_freq[pos], dtype=float)
                w /= total
            else:
                w = np.ones(10) / 10
            dw.append(w)

        results = []
        for _ in range(n_predictions):
            best = None
            for _ in range(30):
                d0 = np.random.choice(10, p=dw[0])
                d1 = np.random.choice(10, p=dw[1])
                d2 = np.random.choice(10, p=dw[2])
                ds = d0 + d1 + d2
                if lo <= ds <= hi:
                    num = f"{d0}{d1}{d2}"
                    if num not in results:
                        best = num
                        break
            if best is None:
                d0 = np.random.choice(10, p=dw[0])
                d1 = np.random.choice(10, p=dw[1])
                d2 = np.random.choice(10, p=dw[2])
                best = f"{d0}{d1}{d2}"
            results.append(best)
        return results


class CompositeScoreStrategy(Strategy3D):
    """
    Multi-signal composite scoring (inspired by cpeoples/powerpredict + 278156715man).
    Combines: frequency + gap + recency. Samples from top scored numbers.
    """
    name = "Composite_Score"
    def __init__(self, lookback=200, recency_window=20):
        self.lookback = lookback
        self.recency_window = recency_window

    def predict(self, train_draws, n_predictions=2):
        recent = train_draws[-self.lookback:]
        if len(recent) < 20:
            return [f"{random.randint(0, 999):03d}" for _ in range(n_predictions)]

        # One pass: freq + last_seen + recency
        freq = Counter()
        last_seen = {}
        recency_start = max(0, len(recent) - self.recency_window)
        recent_freq = Counter()

        for i, draw in enumerate(recent):
            for num in all_numbers_in_draw(draw):
                freq[num] += 1
                last_seen[num] = i
                if i >= recency_start:
                    recent_freq[num] += 1

        if not freq:
            return [f"{random.randint(0, 999):03d}" for _ in range(n_predictions)]

        max_freq = max(freq.values())
        n_recent = len(recent)

        # Score top 200 most frequent (avoid scoring all 1000)
        top_nums = [n for n, _ in freq.most_common(200)]
        scored = []
        for num in top_nums:
            f_score = freq[num] / max_freq
            gap = n_recent - last_seen.get(num, 0)
            gap_score = 1.0 / (1.0 + gap / 10.0)
            rec_score = recent_freq.get(num, 0) / max(self.recency_window, 1)
            composite = 0.45 * f_score + 0.30 * gap_score + 0.25 * rec_score
            scored.append((num, composite))

        scored.sort(key=lambda x: -x[1])
        top = scored[:80]
        nums, weights = zip(*top)
        weights = np.array(weights, dtype=float)
        weights /= weights.sum()

        chosen = set()
        results = []
        for _ in range(n_predictions * 10):
            if len(results) >= n_predictions:
                break
            idx = np.random.choice(len(nums), p=weights)
            if nums[idx] not in chosen:
                chosen.add(nums[idx])
                results.append(nums[idx])
        while len(results) < n_predictions:
            results.append(f"{random.randint(0, 999):03d}")
        return results


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

ALL_STRATEGIES = [
    RandomStrategy(),
    FrequencyWholeStrategy(200),
    FrequencyColdWholeStrategy(200),
    DigitFrequencyStrategy(200),
    DigitColdStrategy(200),
    PatternStrategy(100),
    TierFocusStrategy("Giải Đặc biệt", 200),
    BayesianDigitStrategy(300, 1.0),
    BayesianDigitStrategy(200, 0.5),
    BayesianWholeStrategy(300, 1.5),
    MaxEntropyDigitStrategy(300),
    AdaptiveWindowDigitStrategy([50, 100, 200, 400], 10),
    MarkovDigitTransitionStrategy(200, 1.2),
    SumRangeFilterStrategy(200),
    CompositeScoreStrategy(200, 20),
]

STRATEGY_NAMES = [
    "Random",
    "Freq_Whole_Hot",
    "Freq_Whole_Cold",
    "Digit_Hot",
    "Digit_Cold",
    "Pattern_3D",
    "Tier_Focus_DB",
    "★Bayesian_Digit",
    "★Bayes_Sharp",
    "★Bayesian_Whole",
    "★MaxEntropy",
    "★Adaptive",
    "★★Markov_Digit",
    "★★SumRange_Filter",
    "★★Composite_Score",
]


def main():
    random.seed(42)
    np.random.seed(42)
    output_dir = Path(__file__).resolve().parent
    results = {}

    for product_key, cfg in PRODUCTS_3D.items():
        print(f"\n{'='*80}")
        print(f"  {product_key}")
        print(f"{'='*80}")
        draws = load_3d_data(product_key)
        bl = theoretical_baseline_3d(n_predictions=2)
        print(f"  {len(draws)} draws | P(match)={bl['p_per_number']}% | P(any)={bl['p_any_match']}% | E[matches]={bl['expected_matches']}")
        print(f"  Digit accuracy baseline = {bl['digit_accuracy_baseline']}%")

        product_results = {"baseline": bl, "total_draws": len(draws), "strategies": {}}

        for strategy, name in zip(ALL_STRATEGIES, STRATEGY_NAMES):
            print(f"  ▸ {name:22s}", end=" ", flush=True)
            try:
                r = walk_forward_backtest_3d(draws, strategy, cfg, min_history=50, n_runs=3, n_predictions=2)
                product_results["strategies"][name] = r
                if "error" not in r:
                    print(f"exact={r['exact_match_rate']:.3f}% "
                          f"digit={r['avg_digit_accuracy']:.2f}% "
                          f"roi={r['roi_pct']:.1f}% "
                          f"hits={r['exact_matches_total']} "
                          f"T={r['elapsed_seconds']:.1f}s")
                else:
                    print(f"ERROR: {r['error']}")
            except Exception as e:
                print(f"FAILED: {e}")
                product_results["strategies"][name] = {"error": str(e)}

        results[product_key] = product_results

    # Save
    out = output_dir / "backtest_results.json"
    with open(out, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n✓ Saved to {out}")

    # Summary
    print("\n\n" + "=" * 100)
    print("  3D BACKTEST SUMMARY")
    print("=" * 100)

    for pk, pr in results.items():
        bl = pr["baseline"]
        print(f"\n{'─'*100}")
        print(f"  {pk} | {pr['total_draws']} draws | P(match)={bl['p_per_number']}% | digit_baseline={bl['digit_accuracy_baseline']}%")
        print(f"{'─'*100}")
        print(f"  {'Strategy':22s} {'Exact%':>8} {'Digit%':>8} {'ROI%':>8} {'Hits':>6} {'Tiers':>30}")
        print(f"  {'─'*22} {'─'*8} {'─'*8} {'─'*8} {'─'*6} {'─'*30}")

        rows = []
        for name, r in pr["strategies"].items():
            if "exact_match_rate" not in r:
                continue
            tier_str = ", ".join(f"{t.split()[-1]}:{c}" for t, c in sorted(r["tier_hits"].items())) if r["tier_hits"] else "none"
            rows.append((name, r["exact_match_rate"], r["avg_digit_accuracy"], r["roi_pct"], r["exact_matches_total"], tier_str))
        rows.sort(key=lambda x: x[1], reverse=True)

        for name, exact, digit, roi, hits, tiers in rows:
            is_new = name.startswith("★")
            marker = "★" if is_new else " "
            print(f"  {marker}{name:21s} {exact:>8.3f} {digit:>8.2f} {roi:>8.1f} {hits:>6} {tiers:>30}")

    # Key findings
    print("\n\n" + "=" * 100)
    print("  KEY FINDINGS")
    print("=" * 100)
    for pk, pr in results.items():
        strats = pr["strategies"]
        new_strats = {n: r for n, r in strats.items() if n.startswith("★") and "exact_match_rate" in r}
        old_strats = {n: r for n, r in strats.items() if not n.startswith("★") and "exact_match_rate" in r}
        best_new = max(new_strats.items(), key=lambda x: x[1]["exact_match_rate"]) if new_strats else None
        best_old = max(old_strats.items(), key=lambda x: x[1]["exact_match_rate"]) if old_strats else None
        print(f"\n  {pk}:")
        if best_old:
            print(f"    Best OLD: {best_old[0]:22s} exact={best_old[1]['exact_match_rate']:.3f}% digit={best_old[1]['avg_digit_accuracy']:.2f}%")
        if best_new:
            print(f"    Best NEW: {best_new[0]:22s} exact={best_new[1]['exact_match_rate']:.3f}% digit={best_new[1]['avg_digit_accuracy']:.2f}%")
        if best_new and best_old:
            diff = best_new[1]["exact_match_rate"] - best_old[1]["exact_match_rate"]
            if diff > 0:
                print(f"    → NEW beats OLD by +{diff:.3f}% exact match rate")
            else:
                print(f"    → OLD beats NEW by +{-diff:.3f}% exact match rate")


if __name__ == "__main__":
    main()

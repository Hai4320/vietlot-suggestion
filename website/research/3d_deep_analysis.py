#!/usr/bin/env python3
"""
Deep Statistical Analysis of Vietlott Max 3D & 3D Pro
======================================================

Phase 1: Understand the data deeply before designing algorithms.

Goals:
1. Test RNG quality (chi-squared, runs test, serial correlation)
2. Digit-level independence test
3. Positional distribution analysis
4. Temporal patterns (autocorrelation, periodicity)
5. Digit-sum distribution analysis
6. Pair/triple digit co-occurrence
7. Conditional probability analysis
8. Tier-specific behavior

Output: Comprehensive statistical report + JSON data for algorithm design.

Author: Research Agent
Date: 2026-04-19
"""

import json
import math
import random
import warnings
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
from scipy import stats as scipy_stats

warnings.filterwarnings("ignore")

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
OUTPUT_DIR = Path(__file__).resolve().parent

TIER_ORDER = ["Giải Đặc biệt", "Giải Nhất", "Giải Nhì", "Giải ba"]
TIER_COUNTS = {"Giải Đặc biệt": 2, "Giải Nhất": 4, "Giải Nhì": 6, "Giải ba": 8}


def load_data(filename: str) -> List[Dict]:
    """Load JSONL data."""
    path = DATA_DIR / filename
    rows = []
    for line in path.read_text().strip().split("\n"):
        rec = json.loads(line)
        result = {}
        for tier in TIER_ORDER:
            nums = rec["result"].get(tier, [])
            result[tier] = [str(n).zfill(3) for n in nums]
        rows.append({"date": rec["date"], "id": rec["id"], "result": result})
    rows.sort(key=lambda x: x["date"])
    return rows


def all_numbers(draw: Dict) -> List[str]:
    """Flatten all numbers from a draw."""
    nums = []
    for tier in TIER_ORDER:
        nums.extend(draw["result"].get(tier, []))
    return nums


# ═══════════════════════════════════════════════════════════════
# TEST 1: Chi-Squared Uniformity Test
# ═══════════════════════════════════════════════════════════════

def chi_squared_whole_number(draws: List[Dict]) -> Dict:
    """Test if whole numbers (000-999) follow uniform distribution."""
    freq = Counter()
    total = 0
    for d in draws:
        for num in all_numbers(d):
            freq[num] += 1
            total += 1
    
    expected = total / 1000.0
    chi2 = 0
    for i in range(1000):
        num = f"{i:03d}"
        observed = freq.get(num, 0)
        chi2 += (observed - expected) ** 2 / expected
    
    df = 999
    p_value = 1 - scipy_stats.chi2.cdf(chi2, df)
    
    # Find over/under-represented numbers
    top_over = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:20]
    all_nums = [(f"{i:03d}", freq.get(f"{i:03d}", 0)) for i in range(1000)]
    top_under = sorted(all_nums, key=lambda x: x[1])[:20]
    
    return {
        "test": "Chi-Squared Whole Number Uniformity",
        "total_numbers": total,
        "total_draws": len(draws),
        "expected_per_number": round(expected, 4),
        "chi2_statistic": round(chi2, 4),
        "degrees_of_freedom": df,
        "p_value": round(p_value, 6),
        "is_uniform": p_value > 0.05,
        "interpretation": "UNIFORM (p > 0.05) — RNG appears fair" if p_value > 0.05 else "NON-UNIFORM (p ≤ 0.05) — Potential bias detected!",
        "top_overrepresented": [(n, c, round(c / expected, 3)) for n, c in top_over],
        "top_underrepresented": [(n, c, round(c / expected, 3)) for n, c in top_under],
    }


def chi_squared_digit_position(draws: List[Dict]) -> Dict:
    """Test if each digit position (0-9) is uniform for each position."""
    results = {}
    for pos in range(3):
        freq = Counter()
        total = 0
        for d in draws:
            for num in all_numbers(d):
                freq[int(num[pos])] += 1
                total += 1
        
        expected = total / 10.0
        chi2 = 0
        for digit in range(10):
            observed = freq.get(digit, 0)
            chi2 += (observed - expected) ** 2 / expected
        
        p_value = 1 - scipy_stats.chi2.cdf(chi2, 9)
        results[f"position_{pos}"] = {
            "total": total,
            "expected": round(expected, 2),
            "chi2": round(chi2, 4),
            "p_value": round(p_value, 6),
            "is_uniform": p_value > 0.05,
            "digit_counts": {str(d): freq.get(d, 0) for d in range(10)},
            "digit_ratios": {str(d): round(freq.get(d, 0) / expected, 4) for d in range(10)},
        }
    return {"test": "Chi-Squared Digit Position Uniformity", "positions": results}


# ═══════════════════════════════════════════════════════════════
# TEST 2: Digit Independence Test
# ═══════════════════════════════════════════════════════════════

def digit_independence_test(draws: List[Dict]) -> Dict:
    """Test if digits across positions are independent."""
    # Build joint distribution of (d0, d1), (d1, d2), (d0, d2)
    pairs_01 = Counter()
    pairs_12 = Counter()
    pairs_02 = Counter()
    total = 0
    
    for d in draws:
        for num in all_numbers(d):
            d0, d1, d2 = int(num[0]), int(num[1]), int(num[2])
            pairs_01[(d0, d1)] += 1
            pairs_12[(d1, d2)] += 1
            pairs_02[(d0, d2)] += 1
            total += 1
    
    results = {}
    for name, pair_counts in [("pos_0_1", pairs_01), ("pos_1_2", pairs_12), ("pos_0_2", pairs_02)]:
        expected = total / 100.0  # 10 × 10 cells
        chi2 = 0
        for i in range(10):
            for j in range(10):
                observed = pair_counts.get((i, j), 0)
                chi2 += (observed - expected) ** 2 / expected
        
        df = 81  # (10-1) × (10-1)
        p_value = 1 - scipy_stats.chi2.cdf(chi2, df)
        results[name] = {
            "chi2": round(chi2, 4),
            "p_value": round(p_value, 6),
            "is_independent": p_value > 0.05,
        }
    
    return {"test": "Digit Independence", "pairs": results}


# ═══════════════════════════════════════════════════════════════
# TEST 3: Serial Correlation (Autocorrelation)
# ═══════════════════════════════════════════════════════════════

def serial_correlation_test(draws: List[Dict], max_lag: int = 20) -> Dict:
    """Test autocorrelation: is each number's appearance correlated with previous draws?"""
    # Build binary presence vectors for top frequent numbers
    freq = Counter()
    for d in draws:
        for num in all_numbers(d):
            freq[num] += 1
    
    top_nums = [n for n, _ in freq.most_common(50)]
    
    autocorr_results = {}
    significant_count = 0
    total_tests = 0
    
    for num in top_nums[:10]:
        # Binary vector: 1 if number appeared in draw, 0 otherwise
        presence = []
        for d in draws:
            nums_in_draw = all_numbers(d)
            presence.append(1 if num in nums_in_draw else 0)
        
        presence = np.array(presence, dtype=float)
        mean_p = presence.mean()
        var_p = presence.var()
        
        if var_p < 1e-10:
            continue
        
        lags = {}
        for lag in range(1, min(max_lag + 1, len(presence) // 4)):
            n = len(presence)
            cov = np.mean((presence[:n-lag] - mean_p) * (presence[lag:] - mean_p))
            acf = cov / var_p
            # Approximate significance threshold
            se = 1.96 / np.sqrt(n)
            lags[str(lag)] = {
                "autocorrelation": round(float(acf), 6),
                "significant": abs(acf) > se,
            }
            total_tests += 1
            if abs(acf) > se:
                significant_count += 1
        
        autocorr_results[num] = lags
    
    return {
        "test": "Serial Correlation (Autocorrelation)",
        "total_tests": total_tests,
        "significant_tests": significant_count,
        "pct_significant": round(significant_count / max(total_tests, 1) * 100, 2),
        "expected_false_positive_pct": 5.0,
        "interpretation": "No exploitable autocorrelation" if significant_count / max(total_tests, 1) < 0.10 
                          else "Some autocorrelation detected — worth investigating!",
        "results": autocorr_results,
    }


# ═══════════════════════════════════════════════════════════════
# TEST 4: Runs Test (randomness of appearance sequences)
# ═══════════════════════════════════════════════════════════════

def runs_test(draws: List[Dict]) -> Dict:
    """Wald-Wolfowitz runs test on number appearances."""
    # Check for runs up/down in digit sums
    digit_sums = []
    for d in draws:
        nums = all_numbers(d)
        avg_sum = np.mean([sum(int(c) for c in n) for n in nums])
        digit_sums.append(avg_sum)
    
    median = np.median(digit_sums)
    binary = [1 if s > median else 0 for s in digit_sums]
    
    # Count runs
    runs = 1
    n1 = sum(binary)
    n0 = len(binary) - n1
    
    for i in range(1, len(binary)):
        if binary[i] != binary[i-1]:
            runs += 1
    
    n = len(binary)
    expected_runs = 1 + (2 * n1 * n0) / n
    var_runs = (2 * n1 * n0 * (2 * n1 * n0 - n)) / (n * n * (n - 1))
    
    if var_runs > 0:
        z = (runs - expected_runs) / np.sqrt(var_runs)
        p_value = 2 * (1 - scipy_stats.norm.cdf(abs(z)))
    else:
        z = 0
        p_value = 1.0
    
    return {
        "test": "Wald-Wolfowitz Runs Test (Digit Sum Sequence)",
        "n_draws": len(draws),
        "n_above_median": n1,
        "n_below_median": n0,
        "observed_runs": runs,
        "expected_runs": round(expected_runs, 2),
        "z_statistic": round(float(z), 4),
        "p_value": round(float(p_value), 6),
        "is_random": p_value > 0.05,
        "interpretation": "Sequence appears random" if p_value > 0.05 else "Non-random pattern detected in digit sum sequence!",
    }


# ═══════════════════════════════════════════════════════════════
# TEST 5: Digit Sum Distribution
# ═══════════════════════════════════════════════════════════════

def digit_sum_analysis(draws: List[Dict]) -> Dict:
    """Analyze digit sum distribution (each 3-digit number sums digits 0-27)."""
    sums_all = Counter()
    sums_by_tier = {tier: Counter() for tier in TIER_ORDER}
    total = 0
    
    for d in draws:
        for tier in TIER_ORDER:
            for num in d["result"].get(tier, []):
                ds = sum(int(c) for c in num)
                sums_all[ds] += 1
                sums_by_tier[tier][ds] += 1
                total += 1
    
    # Theoretical distribution of digit sums for 000-999 uniform
    # Each digit is uniform [0,9], so sum of 3 digits has a triangular-like distribution
    theoretical = Counter()
    for i in range(1000):
        ds = sum(int(c) for c in f"{i:03d}")
        theoretical[ds] += 1
    
    # Normalize theoretical
    theoretical_total = sum(theoretical.values())
    theoretical_prob = {k: v / theoretical_total for k, v in theoretical.items()}
    
    chi2 = 0
    for ds in range(28):
        observed = sums_all.get(ds, 0)
        expected = theoretical_prob.get(ds, 0) * total
        if expected > 0:
            chi2 += (observed - expected) ** 2 / expected
    
    p_value = 1 - scipy_stats.chi2.cdf(chi2, 27)
    
    # Summary stats
    all_sums_list = []
    for ds, count in sums_all.items():
        all_sums_list.extend([ds] * count)
    
    return {
        "test": "Digit Sum Distribution Analysis",
        "mean": round(float(np.mean(all_sums_list)), 4),
        "median": float(np.median(all_sums_list)),
        "std": round(float(np.std(all_sums_list)), 4),
        "theoretical_mean": 13.5,  # E[d0+d1+d2] = 3 × 4.5
        "chi2_vs_theoretical": round(chi2, 4),
        "p_value": round(p_value, 6),
        "matches_theoretical": p_value > 0.05,
        "distribution": {str(k): sums_all.get(k, 0) for k in range(28)},
        "peak_digit_sums": sorted(sums_all.items(), key=lambda x: x[1], reverse=True)[:5],
    }


# ═══════════════════════════════════════════════════════════════
# TEST 6: Tier-Specific Frequency Analysis
# ═══════════════════════════════════════════════════════════════

def tier_analysis(draws: List[Dict]) -> Dict:
    """Analyze if number distribution differs by tier."""
    tier_freqs = {}
    for tier in TIER_ORDER:
        freq = Counter()
        total = 0
        for d in draws:
            for num in d["result"].get(tier, []):
                freq[str(num).zfill(3)] += 1
                total += 1
        tier_freqs[tier] = {"freq": freq, "total": total}
    
    # Compare tier distributions pairwise
    comparisons = {}
    for i, t1 in enumerate(TIER_ORDER):
        for t2 in TIER_ORDER[i+1:]:
            f1 = tier_freqs[t1]["freq"]
            f2 = tier_freqs[t2]["freq"]
            
            # KS test on frequencies
            vals1 = sorted([f1.get(f"{n:03d}", 0) for n in range(1000)])
            vals2 = sorted([f2.get(f"{n:03d}", 0) for n in range(1000)])
            
            ks_stat, ks_p = scipy_stats.ks_2samp(vals1, vals2)
            comparisons[f"{t1} vs {t2}"] = {
                "ks_statistic": round(float(ks_stat), 6),
                "p_value": round(float(ks_p), 6),
                "same_distribution": ks_p > 0.05,
            }
    
    # Top numbers per tier
    top_per_tier = {}
    for tier in TIER_ORDER:
        freq = tier_freqs[tier]["freq"]
        top = freq.most_common(10)
        expected = tier_freqs[tier]["total"] / 1000.0
        top_per_tier[tier] = [
            {"number": n, "count": c, "ratio_vs_expected": round(c / expected, 3)}
            for n, c in top
        ]
    
    return {
        "test": "Tier-Specific Frequency Analysis",
        "tier_totals": {t: d["total"] for t, d in tier_freqs.items()},
        "pairwise_distribution_tests": comparisons,
        "top_per_tier": top_per_tier,
    }


# ═══════════════════════════════════════════════════════════════
# TEST 7: Temporal Window Analysis
# ═══════════════════════════════════════════════════════════════

def temporal_window_analysis(draws: List[Dict], windows: list = [10, 30, 50, 100, 200]) -> Dict:
    """Analyze how number frequency shifts over different time windows."""
    n = len(draws)
    
    results = {}
    for w in windows:
        if w >= n:
            continue
        
        # Compute frequency in first half window vs second half
        mid = n - w
        recent = draws[mid:]
        older = draws[max(0, mid - w):mid]
        
        freq_recent = Counter()
        freq_older = Counter()
        
        for d in recent:
            for num in all_numbers(d):
                freq_recent[num] += 1
        for d in older:
            for num in all_numbers(d):
                freq_older[num] += 1
        
        # Correlation between recent and older frequency
        recent_counts = [freq_recent.get(f"{i:03d}", 0) for i in range(1000)]
        older_counts = [freq_older.get(f"{i:03d}", 0) for i in range(1000)]
        
        corr, corr_p = scipy_stats.pearsonr(recent_counts, older_counts)
        
        # Numbers that changed the most
        changes = []
        for i in range(1000):
            num = f"{i:03d}"
            r = freq_recent.get(num, 0)
            o = freq_older.get(num, 0)
            if r + o > 0:
                changes.append((num, r - o, r, o))
        
        changes.sort(key=lambda x: abs(x[1]), reverse=True)
        
        results[f"window_{w}"] = {
            "correlation": round(float(corr), 6),
            "correlation_p": round(float(corr_p), 6),
            "frequency_stable": corr > 0.5 and corr_p < 0.05,
            "top_rising": [(n, delta, r, o) for n, delta, r, o in changes[:5] if delta > 0],
            "top_falling": [(n, delta, r, o) for n, delta, r, o in changes[:5] if delta < 0],
        }
    
    return {"test": "Temporal Window Analysis", "windows": results}


# ═══════════════════════════════════════════════════════════════
# TEST 8: Gap Analysis (Next Appearance Prediction)
# ═══════════════════════════════════════════════════════════════

def gap_analysis(draws: List[Dict]) -> Dict:
    """Analyze gaps between appearances — key for absence-based strategies."""
    # Track when each number last appeared
    last_seen = {}
    gaps = defaultdict(list)
    
    for i, d in enumerate(draws):
        nums = all_numbers(d)
        for num in nums:
            if num in last_seen:
                gap = i - last_seen[num]
                gaps[num].append(gap)
            last_seen[num] = i
    
    # Aggregate gap statistics
    all_gaps = []
    for num, g_list in gaps.items():
        all_gaps.extend(g_list)
    
    # Distribution of gaps
    gap_counter = Counter(all_gaps)
    
    # Mean gap per number
    avg_gaps = {}
    for num in gaps:
        if len(gaps[num]) >= 3:
            avg_gaps[num] = round(np.mean(gaps[num]), 2)
    
    return {
        "test": "Gap Analysis (Appearance Intervals)",
        "total_gap_observations": len(all_gaps),
        "mean_gap": round(float(np.mean(all_gaps)), 4) if all_gaps else None,
        "median_gap": float(np.median(all_gaps)) if all_gaps else None,
        "std_gap": round(float(np.std(all_gaps)), 4) if all_gaps else None,
        "min_gap": int(min(all_gaps)) if all_gaps else None,
        "max_gap": int(max(all_gaps)) if all_gaps else None,
        "gap_distribution_top": sorted(gap_counter.items(), key=lambda x: x[1], reverse=True)[:15],
        "numbers_with_shortest_avg_gap": sorted(avg_gaps.items(), key=lambda x: x[1])[:10],
        "numbers_with_longest_avg_gap": sorted(avg_gaps.items(), key=lambda x: x[1], reverse=True)[:10],
    }


# ═══════════════════════════════════════════════════════════════
# TEST 9: Conditional Probability Analysis
# ═══════════════════════════════════════════════════════════════

def conditional_probability(draws: List[Dict], top_n: int = 20) -> Dict:
    """P(number X appears | number Y was in previous draw)."""
    freq = Counter()
    for d in draws:
        for num in all_numbers(d):
            freq[num] += 1
    
    top_nums = [n for n, _ in freq.most_common(top_n)]
    
    cond_probs = {}
    for num in top_nums:
        # Draws where num appeared
        appeared_indices = set()
        for i, d in enumerate(draws):
            if num in all_numbers(d):
                appeared_indices.add(i)
        
        # What numbers appear in the NEXT draw after num appeared?
        next_draw_freq = Counter()
        count_next = 0
        for idx in appeared_indices:
            if idx + 1 < len(draws):
                for next_num in all_numbers(draws[idx + 1]):
                    next_draw_freq[next_num] += 1
                count_next += 1
        
        if count_next == 0:
            continue
        
        # Compare next-draw frequency with baseline
        baseline_rate = {n: freq[n] / len(draws) for n in top_nums}
        
        notable = []
        for n2 in top_nums:
            actual_rate = next_draw_freq.get(n2, 0) / max(count_next, 1)
            base_rate = baseline_rate.get(n2, 0)
            if base_rate > 0:
                lift = actual_rate / base_rate
                if abs(lift - 1.0) > 0.2:
                    notable.append((n2, round(actual_rate, 4), round(base_rate, 4), round(lift, 4)))
        
        if notable:
            cond_probs[num] = {
                "n_appearances": len(appeared_indices),
                "notable_followers": notable,
            }
    
    return {
        "test": "Conditional Probability (Next-Draw)",
        "top_n_analyzed": top_n,
        "pairs_with_notable_lift": len(cond_probs),
        "results": cond_probs,
    }


# ═══════════════════════════════════════════════════════════════
# TEST 10: Ending Digit Analysis (key for 3D!)
# ═══════════════════════════════════════════════════════════════

def ending_digit_analysis(draws: List[Dict]) -> Dict:
    """Analyze last-digit (units) patterns, which are especially important for 3D."""
    last_digits = Counter()
    last_two_digits = Counter()
    total = 0
    
    for d in draws:
        for num in all_numbers(d):
            last_digits[int(num[2])] += 1
            last_two_digits[num[1:]] += 1
            total += 1
    
    expected_ld = total / 10.0
    chi2_ld = sum((last_digits.get(d, 0) - expected_ld) ** 2 / expected_ld for d in range(10))
    p_ld = 1 - scipy_stats.chi2.cdf(chi2_ld, 9)
    
    expected_ltd = total / 100.0
    chi2_ltd = sum((last_two_digits.get(f"{i:02d}", 0) - expected_ltd) ** 2 / expected_ltd for i in range(100))
    p_ltd = 1 - scipy_stats.chi2.cdf(chi2_ltd, 99)
    
    return {
        "test": "Ending Digit Analysis",
        "last_digit": {
            "counts": {str(d): last_digits.get(d, 0) for d in range(10)},
            "chi2": round(chi2_ld, 4),
            "p_value": round(p_ld, 6),
            "is_uniform": p_ld > 0.05,
        },
        "last_two_digits": {
            "chi2": round(chi2_ltd, 4),
            "p_value": round(p_ltd, 6),
            "is_uniform": p_ltd > 0.05,
            "top_10": sorted(last_two_digits.items(), key=lambda x: x[1], reverse=True)[:10],
        },
    }


# ═══════════════════════════════════════════════════════════════
# TEST 11: Repeat Analysis (Same number in consecutive draws)
# ═══════════════════════════════════════════════════════════════

def repeat_analysis(draws: List[Dict]) -> Dict:
    """How often does a number from draw N also appear in draw N+1?"""
    repeats_count = []
    total_per_draw = []
    
    for i in range(1, len(draws)):
        prev_nums = set(all_numbers(draws[i-1]))
        curr_nums = set(all_numbers(draws[i]))
        overlap = prev_nums & curr_nums
        repeats_count.append(len(overlap))
        total_per_draw.append(len(curr_nums))
    
    # What's the expected overlap by chance?
    # Each draw has ~20 numbers from 1000. P(any overlap) = hypergeometric
    expected_overlap = 20 * 20 / 1000.0  # = 0.4 per number
    
    return {
        "test": "Consecutive Draw Repeat Analysis",
        "total_consecutive_pairs": len(repeats_count),
        "mean_repeats": round(float(np.mean(repeats_count)), 4),
        "std_repeats": round(float(np.std(repeats_count)), 4),
        "expected_repeats_random": round(expected_overlap, 4),
        "max_repeats": int(max(repeats_count)) if repeats_count else 0,
        "min_repeats": int(min(repeats_count)) if repeats_count else 0,
        "pct_draws_with_zero_repeats": round(sum(1 for r in repeats_count if r == 0) / max(len(repeats_count), 1) * 100, 2),
        "repeat_distribution": dict(Counter(repeats_count)),
    }


# ═══════════════════════════════════════════════════════════════
# TEST 12: Number Sum Pattern (sum of all 20 numbers per draw)
# ═══════════════════════════════════════════════════════════════

def draw_sum_analysis(draws: List[Dict]) -> Dict:
    """Analyze the integer sum of all numbers in each draw."""
    draw_sums = []
    for d in draws:
        nums = all_numbers(d)
        total = sum(int(n) for n in nums)
        draw_sums.append(total)
    
    # Expected sum: 20 numbers from 000-999, E[X] = 499.5, so E[sum] = 20 × 499.5
    expected_sum = 20 * 499.5
    
    return {
        "test": "Draw Total Sum Analysis",
        "mean_sum": round(float(np.mean(draw_sums)), 2),
        "expected_sum": expected_sum,
        "std_sum": round(float(np.std(draw_sums)), 2),
        "median_sum": float(np.median(draw_sums)),
        "min_sum": int(min(draw_sums)),
        "max_sum": int(max(draw_sums)),
        "is_normal": bool(scipy_stats.normaltest(draw_sums).pvalue > 0.05) if len(draw_sums) > 20 else None,
    }


# ═══════════════════════════════════════════════════════════════
# MAIN: Run all analysis
# ═══════════════════════════════════════════════════════════════

def run_full_analysis(product_key: str, filename: str) -> Dict:
    """Run complete analysis suite on one product."""
    print(f"\n{'='*80}")
    print(f"  DEEP ANALYSIS: {product_key}")
    print(f"{'='*80}")
    
    draws = load_data(filename)
    print(f"  Loaded {len(draws)} draws ({draws[0]['date']} → {draws[-1]['date']})")
    
    analysis = {"product": product_key, "total_draws": len(draws), "date_range": [draws[0]["date"], draws[-1]["date"]]}
    
    # Run tests
    tests = [
        ("chi_squared_whole", lambda: chi_squared_whole_number(draws)),
        ("chi_squared_digit", lambda: chi_squared_digit_position(draws)),
        ("digit_independence", lambda: digit_independence_test(draws)),
        ("serial_correlation", lambda: serial_correlation_test(draws)),
        ("runs_test", lambda: runs_test(draws)),
        ("digit_sum", lambda: digit_sum_analysis(draws)),
        ("tier_analysis", lambda: tier_analysis(draws)),
        ("temporal_windows", lambda: temporal_window_analysis(draws)),
        ("gap_analysis", lambda: gap_analysis(draws)),
        ("conditional_prob", lambda: conditional_probability(draws)),
        ("ending_digits", lambda: ending_digit_analysis(draws)),
        ("repeat_analysis", lambda: repeat_analysis(draws)),
        ("draw_sum", lambda: draw_sum_analysis(draws)),
    ]
    
    for name, fn in tests:
        print(f"  ▸ Running {name}...", end=" ", flush=True)
        try:
            result = fn()
            analysis[name] = result
            # Print key result
            if "p_value" in result:
                p = result["p_value"]
                symbol = "✓" if result.get("is_uniform") or result.get("is_random") or result.get("matches_theoretical") else "✗"
                print(f"{symbol} p={p}")
            elif "interpretation" in result:
                print(result["interpretation"])
            else:
                print("done")
        except Exception as e:
            print(f"ERROR: {e}")
            analysis[name] = {"error": str(e)}
    
    return analysis


def print_summary(analysis: Dict) -> None:
    """Print a human-readable summary of findings."""
    print(f"\n\n{'═'*80}")
    print(f"  SUMMARY: {analysis['product']}")
    print(f"{'═'*80}")
    print(f"  Total draws: {analysis['total_draws']}")
    print(f"  Date range: {analysis['date_range'][0]} → {analysis['date_range'][1]}")
    
    print(f"\n  🧪 RNG Quality Tests:")
    
    # Chi-squared whole
    if "chi_squared_whole" in analysis:
        t = analysis["chi_squared_whole"]
        print(f"    • Whole number uniformity: {'PASS ✓' if t.get('is_uniform') else 'FAIL ✗'} (p={t.get('p_value')})")
    
    # Chi-squared digit
    if "chi_squared_digit" in analysis:
        t = analysis["chi_squared_digit"]
        for pos, data in t.get("positions", {}).items():
            print(f"    • {pos} uniformity: {'PASS ✓' if data.get('is_uniform') else 'FAIL ✗'} (p={data.get('p_value')})")
    
    # Independence
    if "digit_independence" in analysis:
        t = analysis["digit_independence"]
        for pair, data in t.get("pairs", {}).items():
            print(f"    • Independence {pair}: {'PASS ✓' if data.get('is_independent') else 'FAIL ✗'} (p={data.get('p_value')})")
    
    # Serial correlation
    if "serial_correlation" in analysis:
        t = analysis["serial_correlation"]
        print(f"    • Serial correlation: {t.get('pct_significant')}% significant (expect ≤5%)")
    
    # Runs test
    if "runs_test" in analysis:
        t = analysis["runs_test"]
        print(f"    • Runs test: {'PASS ✓' if t.get('is_random') else 'FAIL ✗'} (p={t.get('p_value')})")
    
    # Digit sum
    if "digit_sum" in analysis:
        t = analysis["digit_sum"]
        print(f"\n  📊 Digit Sum:")
        print(f"    • Mean: {t.get('mean')} (theoretical: {t.get('theoretical_mean')})")
        print(f"    • Matches theoretical: {'YES ✓' if t.get('matches_theoretical') else 'NO ✗'} (p={t.get('p_value')})")
    
    # Gap analysis
    if "gap_analysis" in analysis:
        t = analysis["gap_analysis"]
        print(f"\n  🔄 Gap Analysis:")
        print(f"    • Mean gap: {t.get('mean_gap')} draws")
        print(f"    • Median gap: {t.get('median_gap')} draws")
    
    # Repeat analysis
    if "repeat_analysis" in analysis:
        t = analysis["repeat_analysis"]
        print(f"\n  🔁 Repeat Analysis:")
        print(f"    • Mean repeats per draw: {t.get('mean_repeats')}")
        print(f"    • Expected by random: {t.get('expected_repeats_random')}")
        diff = t.get('mean_repeats', 0) - t.get('expected_repeats_random', 0)
        if abs(diff) > 0.05:
            direction = "MORE" if diff > 0 else "FEWER"
            print(f"    → Numbers repeat {direction} than expected! ({diff:+.4f})")


def main():
    np.random.seed(42)
    
    all_analysis = {}
    
    for product_key, filename in [("max_3d", "3d.jsonl"), ("max_3d_pro", "3d_pro.jsonl")]:
        analysis = run_full_analysis(product_key, filename)
        all_analysis[product_key] = analysis
        print_summary(analysis)
    
    # Save
    outfile = OUTPUT_DIR / "3d_deep_analysis.json"
    with open(outfile, "w") as f:
        json.dump(all_analysis, f, indent=2, default=str, ensure_ascii=False)
    print(f"\n✓ Saved full analysis to {outfile}")
    
    # Findings for algorithm design
    print(f"\n\n{'═'*80}")
    print("  KEY FINDINGS FOR ALGORITHM DESIGN")
    print(f"{'═'*80}")
    
    for pk, analysis in all_analysis.items():
        print(f"\n  {pk}:")
        
        # Check for any exploitable patterns
        exploitable = []
        
        chi_whole = analysis.get("chi_squared_whole", {})
        if not chi_whole.get("is_uniform", True):
            exploitable.append(f"Whole number distribution NOT uniform (p={chi_whole.get('p_value')})")
        
        chi_digit = analysis.get("chi_squared_digit", {})
        for pos, data in chi_digit.get("positions", {}).items():
            if not data.get("is_uniform", True):
                exploitable.append(f"Digit {pos} NOT uniform (p={data.get('p_value')})")
        
        indep = analysis.get("digit_independence", {})
        for pair, data in indep.get("pairs", {}).items():
            if not data.get("is_independent", True):
                exploitable.append(f"Digits {pair} NOT independent (p={data.get('p_value')})")
        
        serial = analysis.get("serial_correlation", {})
        if serial.get("pct_significant", 0) > 10:
            exploitable.append(f"Serial correlation significant: {serial.get('pct_significant')}%")
        
        runs = analysis.get("runs_test", {})
        if not runs.get("is_random", True):
            exploitable.append(f"Didn't pass runs test (p={runs.get('p_value')})")
        
        repeat = analysis.get("repeat_analysis", {})
        if repeat:
            diff = repeat.get("mean_repeats", 0) - repeat.get("expected_repeats_random", 0)
            if abs(diff) > 0.05:
                exploitable.append(f"Repeat rate differs from expected by {diff:+.4f}")
        
        if exploitable:
            print("    ⚡ EXPLOITABLE PATTERNS:")
            for e in exploitable:
                print(f"      • {e}")
        else:
            print("    ✓ No exploitable patterns found — RNG appears fair")
        
        print("    📋 Design recommendations:")
        print("      • Use digit-level composition (3 independent digit positions)")
        print("      • Weight by position-specific frequency with Bayesian smoothing")
        print("      • Apply digit-sum filtering (mean ± σ) as secondary constraint")
        print("      • Maximize diversity across ticket set (coverage optimization)")
        print("      • Focus on tier-weighted scoring for ROI optimization")


if __name__ == "__main__":
    main()

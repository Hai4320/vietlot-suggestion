"""Phase 1 deep statistical analysis for Power 5/35 (Lotto 5/35).

Follows Random_Analysis_Agent methodology + 13-test playbook, adapted to matrix
product structure (5 mains 1-35 + 1 bonus 1-12).

Output: deep_analysis.json
"""

from __future__ import annotations

import json
import math
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from scipy import stats

DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "power535.jsonl"
OUTPUT_PATH = Path(__file__).resolve().parent / "deep_analysis.json"
MAIN_MAX = 35
MAIN_SIZE = 5
BONUS_MAX = 12
SIGNIFICANCE = 0.05
STRICT_SIGNIFICANCE = 0.05 / 14  # Bonferroni over 14 tests => ~0.00357


def load_draws() -> pd.DataFrame:
    rows = []
    with DATA_PATH.open() as f:
        for line in f:
            rec = json.loads(line)
            result = rec["result"]
            mains = sorted(result[:MAIN_SIZE])
            bonus = result[MAIN_SIZE]
            rows.append(
                {
                    "date": rec["date"],
                    "id": rec["id"],
                    "mains": mains,
                    "bonus": bonus,
                }
            )
    df = pd.DataFrame(rows).sort_values(["date", "id"]).reset_index(drop=True)
    return df


# ---------- TESTS ----------

def test_1_chi2_main_uniform(df: pd.DataFrame) -> dict[str, Any]:
    """Test 1: Chi² uniformity on main pool 1-35."""
    counts = np.zeros(MAIN_MAX, dtype=int)
    for mains in df["mains"]:
        for n in mains:
            counts[n - 1] += 1
    expected = counts.sum() / MAIN_MAX
    chi2, p = stats.chisquare(counts, f_exp=[expected] * MAIN_MAX)
    top = np.argsort(counts)[::-1][:5] + 1
    bot = np.argsort(counts)[:5] + 1
    return {
        "test": "chi2_main_uniform",
        "chi2": float(chi2),
        "dof": MAIN_MAX - 1,
        "p_value": float(p),
        "significant_05": bool(p < SIGNIFICANCE),
        "significant_bonferroni": bool(p < STRICT_SIGNIFICANCE),
        "expected_per_number": float(expected),
        "top5_numbers": top.tolist(),
        "top5_counts": counts[top - 1].tolist(),
        "bot5_numbers": bot.tolist(),
        "bot5_counts": counts[bot - 1].tolist(),
        "max_deviation_pct": float((counts.max() - expected) / expected * 100),
    }


def test_2_chi2_bonus_uniform(df: pd.DataFrame) -> dict[str, Any]:
    """Test 2: Chi² uniformity on bonus 1-12."""
    counts = np.bincount(df["bonus"].to_numpy(), minlength=BONUS_MAX + 1)[1:]
    expected = counts.sum() / BONUS_MAX
    chi2, p = stats.chisquare(counts, f_exp=[expected] * BONUS_MAX)
    return {
        "test": "chi2_bonus_uniform",
        "chi2": float(chi2),
        "dof": BONUS_MAX - 1,
        "p_value": float(p),
        "significant_05": bool(p < SIGNIFICANCE),
        "significant_bonferroni": bool(p < STRICT_SIGNIFICANCE),
        "expected_per_bonus": float(expected),
        "counts": counts.tolist(),
        "max_deviation_pct": float((counts.max() - expected) / expected * 100),
    }


def test_3_pair_cooccurrence(df: pd.DataFrame) -> dict[str, Any]:
    """Test 3: Pair co-occurrence chi² — detects dependencies beyond marginal freq."""
    from itertools import combinations
    pair_counts: Counter[tuple[int, int]] = Counter()
    for mains in df["mains"]:
        for a, b in combinations(sorted(mains), 2):
            pair_counts[(a, b)] += 1
    N = len(df)
    total_pairs = MAIN_MAX * (MAIN_MAX - 1) // 2
    # Expected P(pair both drawn in 5 from 35) = C(33,3)/C(35,5)
    p_pair = math.comb(33, 3) / math.comb(35, 5)
    expected = N * p_pair
    observed = np.array([pair_counts.get((i, j), 0) for i in range(1, MAIN_MAX) for j in range(i + 1, MAIN_MAX + 1)])
    chi2 = float(((observed - expected) ** 2 / expected).sum())
    dof = total_pairs - 1
    p = float(stats.chi2.sf(chi2, dof))
    # Most over/under represented pairs
    deviations = [(i, j, pair_counts.get((i, j), 0), (pair_counts.get((i, j), 0) - expected) / expected * 100)
                  for i in range(1, MAIN_MAX) for j in range(i + 1, MAIN_MAX + 1)]
    deviations.sort(key=lambda x: -x[3])
    top5 = [(i, j, c, f"{d:+.1f}%") for i, j, c, d in deviations[:5]]
    bot5 = [(i, j, c, f"{d:+.1f}%") for i, j, c, d in deviations[-5:]]
    return {
        "test": "pair_cooccurrence_chi2",
        "chi2": chi2,
        "dof": dof,
        "p_value": p,
        "significant_05": bool(p < SIGNIFICANCE),
        "significant_bonferroni": bool(p < STRICT_SIGNIFICANCE),
        "expected_per_pair": float(expected),
        "total_pairs_tested": total_pairs,
        "observed_pairs_nonzero": int((observed > 0).sum()),
        "top5_over_pairs": [[int(i), int(j), int(c), d] for i, j, c, d in top5],
        "top5_under_pairs": [[int(i), int(j), int(c), d] for i, j, c, d in bot5],
    }


def test_4_serial_correlation(df: pd.DataFrame) -> dict[str, Any]:
    """Test 4: Serial autocorrelation of appearance series for each number."""
    N = len(df)
    sig_numbers = []
    # Threshold at 95% for lag-1 correlation: ~1.96/sqrt(N)
    threshold = 1.96 / math.sqrt(N)
    max_abs_acf = 0.0
    for num in range(1, MAIN_MAX + 1):
        series = np.array([1 if num in mains else 0 for mains in df["mains"]], dtype=float)
        series -= series.mean()
        if series.std() == 0:
            continue
        acf1 = float((series[:-1] * series[1:]).sum() / (series * series).sum())
        if abs(acf1) > max_abs_acf:
            max_abs_acf = abs(acf1)
        if abs(acf1) > threshold:
            sig_numbers.append((num, round(acf1, 4)))
    return {
        "test": "serial_correlation_lag1",
        "threshold_95": float(threshold),
        "significant_count": len(sig_numbers),
        "total_tested": MAIN_MAX,
        "max_abs_acf": max_abs_acf,
        "sig_numbers": sig_numbers[:10],
        "note": "Expected ~5% false positives = 1.75 numbers by chance; >4 sig = suspicious",
    }


def test_5_runs_test(df: pd.DataFrame) -> dict[str, Any]:
    """Test 5: Wald-Wolfowitz runs test for each number's appearance sequence."""
    N = len(df)
    low_p_count = 0
    p_values = []
    for num in range(1, MAIN_MAX + 1):
        series = [1 if num in mains else 0 for mains in df["mains"]]
        n1 = sum(series)
        n0 = N - n1
        if n1 < 5 or n0 < 5:
            continue
        runs = 1
        for i in range(1, N):
            if series[i] != series[i - 1]:
                runs += 1
        expected_runs = 2 * n1 * n0 / N + 1
        var_runs = (2 * n1 * n0 * (2 * n1 * n0 - N)) / (N * N * (N - 1))
        if var_runs <= 0:
            continue
        z = (runs - expected_runs) / math.sqrt(var_runs)
        p = 2 * (1 - stats.norm.cdf(abs(z)))
        p_values.append((num, round(p, 4)))
        if p < SIGNIFICANCE:
            low_p_count += 1
    p_values.sort(key=lambda x: x[1])
    return {
        "test": "runs_test_per_number",
        "total_tested": len(p_values),
        "low_p_count": low_p_count,
        "expected_false_positives_05": round(0.05 * len(p_values), 2),
        "lowest_5_p_values": p_values[:5],
    }


def test_6_sum_distribution(df: pd.DataFrame) -> dict[str, Any]:
    """Test 6: Sum of 5 mains per draw — mean and normality."""
    sums = np.array([sum(m) for m in df["mains"]])
    # Theoretical mean of sum of k-of-N without replacement: k*(N+1)/2 = 5*36/2 = 90
    theoretical_mean = MAIN_SIZE * (MAIN_MAX + 1) / 2
    # Theoretical variance: k*(N+1)*(N-k)/12 = 5*36*30/12 = 450
    theoretical_var = MAIN_SIZE * (MAIN_MAX + 1) * (MAIN_MAX - MAIN_SIZE) / 12
    ks_stat, ks_p = stats.kstest(sums, "norm", args=(theoretical_mean, math.sqrt(theoretical_var)))
    # Also test mean with one-sample t-test vs theoretical
    t_stat, t_p = stats.ttest_1samp(sums, theoretical_mean)
    return {
        "test": "sum_distribution",
        "observed_mean": float(sums.mean()),
        "theoretical_mean": theoretical_mean,
        "observed_std": float(sums.std()),
        "theoretical_std": float(math.sqrt(theoretical_var)),
        "t_statistic_mean": float(t_stat),
        "t_p_value": float(t_p),
        "ks_normal_p": float(ks_p),
        "significant_05": bool(t_p < SIGNIFICANCE),
        "min_sum": int(sums.min()),
        "max_sum": int(sums.max()),
    }


def test_7_temporal_window(df: pd.DataFrame) -> dict[str, Any]:
    """Test 7: Split into 3 windows, test frequency stability (KS between adjacent windows)."""
    N = len(df)
    thirds = N // 3
    windows = [df.iloc[:thirds], df.iloc[thirds: 2 * thirds], df.iloc[2 * thirds:]]
    freq_vectors = []
    for w in windows:
        counts = np.zeros(MAIN_MAX, dtype=float)
        for mains in w["mains"]:
            for n in mains:
                counts[n - 1] += 1
        freq_vectors.append(counts / counts.sum())
    # KS test between adjacent windows
    ks_12 = stats.ks_2samp(freq_vectors[0], freq_vectors[1])
    ks_23 = stats.ks_2samp(freq_vectors[1], freq_vectors[2])
    # Correlation between windows
    corr_12 = float(np.corrcoef(freq_vectors[0], freq_vectors[1])[0, 1])
    corr_13 = float(np.corrcoef(freq_vectors[0], freq_vectors[2])[0, 1])
    corr_23 = float(np.corrcoef(freq_vectors[1], freq_vectors[2])[0, 1])
    return {
        "test": "temporal_window_stability",
        "windows_size": thirds,
        "ks_window_1_vs_2_p": float(ks_12.pvalue),
        "ks_window_2_vs_3_p": float(ks_23.pvalue),
        "correlation_1_2": corr_12,
        "correlation_1_3": corr_13,
        "correlation_2_3": corr_23,
        "stable": bool(ks_12.pvalue > SIGNIFICANCE and ks_23.pvalue > SIGNIFICANCE),
        "interpretation": (
            "stable (bias constant)" if ks_12.pvalue > SIGNIFICANCE and ks_23.pvalue > SIGNIFICANCE
            else "unstable (time-varying)"
        ),
    }


def test_8_gap_analysis(df: pd.DataFrame) -> dict[str, Any]:
    """Test 8: Gap between consecutive appearances. Expected geometric(p=5/35)."""
    expected_mean_gap = MAIN_MAX / MAIN_SIZE  # = 7
    all_gaps: list[int] = []
    per_number_mean: list[float] = []
    for num in range(1, MAIN_MAX + 1):
        positions = [i for i, mains in enumerate(df["mains"]) if num in mains]
        if len(positions) < 2:
            continue
        gaps = np.diff(positions)
        all_gaps.extend(gaps.tolist())
        per_number_mean.append(gaps.mean())
    # KS test against geometric
    # P(X=k) = (1-p)^(k-1) * p with p=5/35
    # Convert to CDF for KS
    from scipy.stats import geom
    ks_stat, ks_p = stats.kstest(all_gaps, "geom", args=(MAIN_SIZE / MAIN_MAX,))
    return {
        "test": "gap_analysis",
        "expected_mean_gap": expected_mean_gap,
        "observed_mean_gap": float(np.mean(all_gaps)),
        "observed_std_gap": float(np.std(all_gaps)),
        "ks_vs_geometric_p": float(ks_p),
        "significant_05": bool(ks_p < SIGNIFICANCE),
        "per_number_mean_gap_min": float(min(per_number_mean)),
        "per_number_mean_gap_max": float(max(per_number_mean)),
        "per_number_mean_gap_spread": float(max(per_number_mean) - min(per_number_mean)),
    }


def test_9_conditional_probability(df: pd.DataFrame) -> dict[str, Any]:
    """Test 9: P(X in draw_t | X in draw_{t-1}) — detect repeat bias."""
    baseline_p = MAIN_SIZE / MAIN_MAX  # 5/35
    # Build per-number transition counts
    deviations = []
    for num in range(1, MAIN_MAX + 1):
        appeared = [num in mains for mains in df["mains"]]
        # conditional count
        repeat_count = sum(1 for i in range(1, len(appeared)) if appeared[i - 1] and appeared[i])
        given_prev = sum(1 for i in range(1, len(appeared)) if appeared[i - 1])
        if given_prev < 10:
            continue
        cond_p = repeat_count / given_prev
        lift = cond_p / baseline_p
        deviations.append((num, round(cond_p, 4), round(lift, 3), given_prev))
    # overall test: pooled
    overall_repeat = sum(1 for i in range(1, len(df))
                          for n in df.iloc[i]["mains"] if n in df.iloc[i - 1]["mains"])
    overall_prev_numbers = MAIN_SIZE * (len(df) - 1)  # total "given prev drawn" events
    overall_cond_p = overall_repeat / overall_prev_numbers
    # Binomial test: is overall_cond_p different from baseline_p?
    result = stats.binomtest(overall_repeat, overall_prev_numbers, p=baseline_p)
    deviations.sort(key=lambda x: -abs(x[2] - 1))
    return {
        "test": "conditional_probability_repeat",
        "baseline_p": baseline_p,
        "overall_repeat_p": float(overall_cond_p),
        "overall_lift_vs_baseline": float(overall_cond_p / baseline_p),
        "binomial_p_value": float(result.pvalue),
        "significant_05": bool(result.pvalue < SIGNIFICANCE),
        "top5_deviant_numbers": deviations[:5],
    }


def test_10_repeat_rate(df: pd.DataFrame) -> dict[str, Any]:
    """Test 10: How many mains from draw t-1 also appear in draw t (hypergeometric expected=0.7143)."""
    overlaps = []
    for i in range(1, len(df)):
        prev = set(df.iloc[i - 1]["mains"])
        curr = set(df.iloc[i]["mains"])
        overlaps.append(len(prev & curr))
    overlaps = np.array(overlaps)
    expected = MAIN_SIZE * MAIN_SIZE / MAIN_MAX  # 5*5/35 = 0.7143
    # Hypergeometric: drawing 5 from 35 where 5 are "favorable"
    # Variance: n*K*(N-K)*(N-n) / (N²(N-1))
    n, K, N = MAIN_SIZE, MAIN_SIZE, MAIN_MAX
    var = n * K * (N - K) * (N - n) / (N * N * (N - 1))
    z = (overlaps.mean() - expected) / math.sqrt(var / len(overlaps))
    p = 2 * (1 - stats.norm.cdf(abs(z)))
    # Distribution of overlaps
    dist = Counter(overlaps.tolist())
    expected_dist = {k: float(stats.hypergeom.pmf(k, N, K, n)) * len(overlaps) for k in range(6)}
    return {
        "test": "repeat_rate",
        "observed_mean_overlap": float(overlaps.mean()),
        "expected_mean_overlap": expected,
        "z_score": float(z),
        "p_value": float(p),
        "significant_05": bool(p < SIGNIFICANCE),
        "observed_distribution": {str(k): int(v) for k, v in sorted(dist.items())},
        "expected_distribution": {str(k): round(v, 2) for k, v in expected_dist.items()},
    }


def test_11_parity_highlow(df: pd.DataFrame) -> dict[str, Any]:
    """Test 11: Odd/Even and High/Low pattern distribution."""
    # Odd count per draw (binomial expectation = 5 * 18/35 for odds since 18 odds in 1-35)
    n_odd = sum(1 for i in range(1, MAIN_MAX + 1) if i % 2 == 1)  # 18
    n_even = MAIN_MAX - n_odd  # 17
    odd_counts = np.array([sum(1 for n in m if n % 2 == 1) for m in df["mains"]])
    # Theoretical via hypergeometric
    expected_odd_dist = {k: float(stats.hypergeom.pmf(k, MAIN_MAX, n_odd, MAIN_SIZE)) for k in range(6)}
    observed_odd_dist = Counter(odd_counts.tolist())
    observed = np.array([observed_odd_dist.get(k, 0) for k in range(6)])
    expected = np.array([expected_odd_dist[k] * len(df) for k in range(6)])
    # chi² (only bins with expected >= 5)
    mask = expected >= 5
    chi2_odd = float(((observed[mask] - expected[mask]) ** 2 / expected[mask]).sum())
    p_odd = float(stats.chi2.sf(chi2_odd, mask.sum() - 1))
    # High/low (1-17 low, 18-35 high)
    high_counts = np.array([sum(1 for n in m if n >= 18) for m in df["mains"]])
    n_high = MAIN_MAX - 17  # 18
    expected_high_dist = {k: float(stats.hypergeom.pmf(k, MAIN_MAX, n_high, MAIN_SIZE)) for k in range(6)}
    observed_high_dist = Counter(high_counts.tolist())
    observed_h = np.array([observed_high_dist.get(k, 0) for k in range(6)])
    expected_h = np.array([expected_high_dist[k] * len(df) for k in range(6)])
    mask_h = expected_h >= 5
    chi2_high = float(((observed_h[mask_h] - expected_h[mask_h]) ** 2 / expected_h[mask_h]).sum())
    p_high = float(stats.chi2.sf(chi2_high, mask_h.sum() - 1))
    return {
        "test": "parity_highlow",
        "odd_chi2": chi2_odd,
        "odd_p_value": p_odd,
        "odd_observed_dist": {str(k): int(v) for k, v in sorted(observed_odd_dist.items())},
        "odd_expected_dist": {str(k): round(expected_odd_dist[k] * len(df), 1) for k in range(6)},
        "high_chi2": chi2_high,
        "high_p_value": p_high,
        "high_observed_dist": {str(k): int(v) for k, v in sorted(observed_high_dist.items())},
        "high_expected_dist": {str(k): round(expected_high_dist[k] * len(df), 1) for k in range(6)},
        "significant_05": bool(p_odd < SIGNIFICANCE or p_high < SIGNIFICANCE),
    }


def test_12_bonus_main_correlation(df: pd.DataFrame) -> dict[str, Any]:
    """Test 12: Bonus-main correlation — does bonus value correlate with main sum/structure?"""
    bonus = df["bonus"].to_numpy()
    main_sum = np.array([sum(m) for m in df["mains"]])
    main_min = np.array([min(m) for m in df["mains"]])
    main_max_arr = np.array([max(m) for m in df["mains"]])
    corr_sum = float(np.corrcoef(bonus, main_sum)[0, 1])
    corr_min = float(np.corrcoef(bonus, main_min)[0, 1])
    corr_max = float(np.corrcoef(bonus, main_max_arr)[0, 1])
    # Test: does bonus value appear in mains more/less than chance?
    # P(bonus value in 1-12 appears in 5 mains from 1-35) — only valid for bonus <= 35 (always true)
    appears_in_mains = sum(1 for i, b in enumerate(bonus) if b in df.iloc[i]["mains"])
    expected_appear = len(df) * MAIN_SIZE / MAIN_MAX  # 5/35 chance for each bonus value being in mains
    z = (appears_in_mains - expected_appear) / math.sqrt(expected_appear * (1 - MAIN_SIZE / MAIN_MAX))
    p_bonus_in_mains = 2 * (1 - stats.norm.cdf(abs(z)))
    return {
        "test": "bonus_main_correlation",
        "corr_bonus_vs_sum": corr_sum,
        "corr_bonus_vs_min": corr_min,
        "corr_bonus_vs_max": corr_max,
        "bonus_appears_in_mains_count": appears_in_mains,
        "expected_appears": float(expected_appear),
        "p_value_appears": float(p_bonus_in_mains),
        "significant_05": bool(abs(corr_sum) > 1.96 / math.sqrt(len(df)) or p_bonus_in_mains < SIGNIFICANCE),
    }


def test_13_lattice_scatter(df: pd.DataFrame) -> dict[str, Any]:
    """Test 13: Lattice effect — scatter of consecutive draw sums (PRNG quality signal)."""
    sums = np.array([sum(m) for m in df["mains"]])
    # Correlation X_n vs X_{n+1}
    r = float(np.corrcoef(sums[:-1], sums[1:])[0, 1])
    # Spearman too
    rho, p_rho = stats.spearmanr(sums[:-1], sums[1:])
    # Also test modular structure: sum mod 5, 7, 11
    mods = {}
    for m in (5, 7, 11):
        counts = np.bincount(sums % m, minlength=m)
        expected = counts.sum() / m
        chi2, p = stats.chisquare(counts, f_exp=[expected] * m)
        mods[f"mod_{m}"] = {"chi2": float(chi2), "p_value": float(p)}
    return {
        "test": "lattice_scatter_sums",
        "pearson_lag1": r,
        "spearman_lag1": float(rho),
        "spearman_p_value": float(p_rho),
        "sum_modular_tests": mods,
        "significant_05": bool(p_rho < SIGNIFICANCE or any(v["p_value"] < SIGNIFICANCE for v in mods.values())),
    }


def test_14_draw_sum_acf(df: pd.DataFrame) -> dict[str, Any]:
    """Test 14: Autocorrelation of draw sums up to lag 100 (Random_Analysis_Agent step 2.2)."""
    sums = np.array([sum(m) for m in df["mains"]], dtype=float)
    sums -= sums.mean()
    denom = (sums * sums).sum()
    acfs = []
    threshold = 1.96 / math.sqrt(len(df))
    sig_lags = []
    for lag in range(1, 101):
        if lag >= len(sums):
            break
        acf = float((sums[:-lag] * sums[lag:]).sum() / denom)
        acfs.append(acf)
        if abs(acf) > threshold:
            sig_lags.append((lag, round(acf, 4)))
    return {
        "test": "draw_sum_autocorrelation",
        "threshold_95": float(threshold),
        "n_lags_tested": len(acfs),
        "max_abs_acf": float(max(abs(a) for a in acfs)) if acfs else 0.0,
        "significant_lags_count": len(sig_lags),
        "expected_false_positives_05": round(0.05 * len(acfs), 2),
        "first_5_sig_lags": sig_lags[:5],
    }


# ---------- MAIN ----------

def main():
    print(f"Loading data from {DATA_PATH}")
    df = load_draws()
    print(f"Loaded {len(df)} draws from {df['date'].iloc[0]} to {df['date'].iloc[-1]}")
    print(f"Significance level: {SIGNIFICANCE}; Bonferroni: {STRICT_SIGNIFICANCE:.5f}")

    results = {
        "meta": {
            "product": "power_535",
            "total_draws": len(df),
            "date_start": str(df["date"].iloc[0]),
            "date_end": str(df["date"].iloc[-1]),
            "main_max": MAIN_MAX,
            "main_size": MAIN_SIZE,
            "bonus_max": BONUS_MAX,
            "significance_level": SIGNIFICANCE,
            "bonferroni_threshold": STRICT_SIGNIFICANCE,
            "n_tests": 14,
        },
        "tests": {},
    }

    tests = [
        ("T01_chi2_main_uniform", test_1_chi2_main_uniform),
        ("T02_chi2_bonus_uniform", test_2_chi2_bonus_uniform),
        ("T03_pair_cooccurrence", test_3_pair_cooccurrence),
        ("T04_serial_correlation", test_4_serial_correlation),
        ("T05_runs_test", test_5_runs_test),
        ("T06_sum_distribution", test_6_sum_distribution),
        ("T07_temporal_window", test_7_temporal_window),
        ("T08_gap_analysis", test_8_gap_analysis),
        ("T09_conditional_probability", test_9_conditional_probability),
        ("T10_repeat_rate", test_10_repeat_rate),
        ("T11_parity_highlow", test_11_parity_highlow),
        ("T12_bonus_main_correlation", test_12_bonus_main_correlation),
        ("T13_lattice_scatter", test_13_lattice_scatter),
        ("T14_draw_sum_acf", test_14_draw_sum_acf),
    ]

    for name, fn in tests:
        print(f"Running {name} ...")
        try:
            results["tests"][name] = fn(df)
        except Exception as e:  # noqa: BLE001
            results["tests"][name] = {"error": str(e), "type": type(e).__name__}

    # Summary
    sig_05 = [name for name, r in results["tests"].items() if r.get("significant_05")]
    sig_bonf = [name for name, r in results["tests"].items()
                if r.get("significant_bonferroni") or (r.get("p_value") is not None and r.get("p_value") < STRICT_SIGNIFICANCE)]
    results["summary"] = {
        "total_tests": len(tests),
        "significant_at_05": sig_05,
        "significant_at_bonferroni": sig_bonf,
        "exploitable_bias_detected": len(sig_bonf) > 0,
    }

    # R1 gate verdict per METHODOLOGY.md §1.1 / TESTING.md §7
    if sig_bonf:
        r1_verdict = "PROCEED"
        r1_reason = f"{len(sig_bonf)} test(s) pass Bonferroni α={STRICT_SIGNIFICANCE:.5f}: {sig_bonf}"
        r1_next = "Phase 2 allowed. Remember §1.4 METHODOLOGY (algebra sanity check) before implementing exploit."
    else:
        r1_verdict = "STOP"
        r1_reason = f"No test passes Bonferroni α={STRICT_SIGNIFICANCE:.5f}. White noise conclusion."
        r1_next = "Do NOT proceed to Phase 2. Do NOT extend battery post-hoc. Record in RESEARCH_HISTORY as valid negative result."

    results["r1_gate"] = {
        "verdict": r1_verdict,
        "reason": r1_reason,
        "next_step": r1_next,
        "battery_size": len(tests),
        "bonferroni_alpha": STRICT_SIGNIFICANCE,
    }
    OUTPUT_PATH.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print(f"\n=== SUMMARY ===")
    print(f"Tests significant @ p<0.05:       {len(sig_05)}/{len(tests)} -> {sig_05}")
    print(f"Tests significant @ Bonferroni:   {len(sig_bonf)}/{len(tests)} -> {sig_bonf}")
    print(f"\n{'═' * 70}")
    print(f"  R1 GATE VERDICT: {r1_verdict}")
    print(f"{'═' * 70}")
    print(f"  Reason: {r1_reason}")
    print(f"  Next:   {r1_next}")
    print(f"\nOutput: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

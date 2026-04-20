"""Significance testing utilities for backtest evaluation.

Implements §3 of EVALUATION.md:
  - wilson_ci: Wilson score CI for single proportion
  - newcombe_diff_ci: Newcombe hybrid CI for difference of two proportions
  - two_proportion_z_test: two-sample z-test on proportions (H0: p_a = p_b)
  - decide_state: 4-state decision rule (Accept/Suggestive/Inconclusive/Reject)
  - build_significance: full significance block for JSON output

Usage:
    from _significance import build_significance
    sig = build_significance(
        hits_strat=42, n_strat=1200,
        hits_baseline=28, n_baseline=1200,
        n_strategies_compared=7, baseline_name="Random",
    )
    result_dict["significance"] = sig

All functions are pure (no side effects); safe to call repeatedly.
"""

from __future__ import annotations

import math
from typing import Any

from scipy import stats


def wilson_ci(hits: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """Wilson score 95% CI for a single proportion."""
    if n == 0:
        return (0.0, 1.0)
    phat = hits / n
    denom = 1 + z * z / n
    center = (phat + z * z / (2 * n)) / denom
    half = z * math.sqrt(phat * (1 - phat) / n + z * z / (4 * n * n)) / denom
    return (max(0.0, center - half), min(1.0, center + half))


def newcombe_diff_ci(
    hits_a: int, n_a: int, hits_b: int, n_b: int, z: float = 1.96
) -> tuple[float, float]:
    """Newcombe hybrid-score CI for (p_a - p_b). Returns (lo, hi) as proportions."""
    if n_a == 0 or n_b == 0:
        return (-1.0, 1.0)
    l_a, u_a = wilson_ci(hits_a, n_a, z)
    l_b, u_b = wilson_ci(hits_b, n_b, z)
    p_a = hits_a / n_a
    p_b = hits_b / n_b
    delta = p_a - p_b
    lo = delta - math.sqrt((p_a - l_a) ** 2 + (u_b - p_b) ** 2)
    hi = delta + math.sqrt((u_a - p_a) ** 2 + (p_b - l_b) ** 2)
    return (max(-1.0, lo), min(1.0, hi))


def two_proportion_z_test(
    hits_a: int, n_a: int, hits_b: int, n_b: int
) -> dict[str, float]:
    """Two-proportion z-test. H0: p_a = p_b. Pooled SE for H0."""
    if n_a == 0 or n_b == 0:
        return {"z": 0.0, "p_value": 1.0, "delta_pp": 0.0}
    p_a = hits_a / n_a
    p_b = hits_b / n_b
    delta_pp = (p_a - p_b) * 100
    p_pool = (hits_a + hits_b) / (n_a + n_b)
    se = math.sqrt(p_pool * (1 - p_pool) * (1 / n_a + 1 / n_b))
    if se == 0:
        return {"z": 0.0, "p_value": 1.0, "delta_pp": delta_pp}
    z = (p_a - p_b) / se
    p_value = 2 * (1 - stats.norm.cdf(abs(z)))
    return {"z": float(z), "p_value": float(p_value), "delta_pp": float(delta_pp)}


def decide_state(
    p_value: float,
    passes_bonferroni: bool,
    ci_lo_pp: float,
    delta_pp: float,
) -> str:
    """Decision rule per EVALUATION.md §6.

    Returns one of: 'Accept', 'Suggestive', 'Inconclusive', 'Reject'.
    """
    if delta_pp <= 0 and ci_lo_pp <= 0:
        return "Reject"
    if p_value < 0.05 and passes_bonferroni and ci_lo_pp > 0:
        return "Accept"
    if p_value < 0.05 and ci_lo_pp > 0:
        return "Suggestive"
    if p_value >= 0.05 and ci_lo_pp > 0:
        return "Inconclusive"
    return "Reject"


def build_significance(
    hits_strat: int,
    n_strat: int,
    hits_baseline: int,
    n_baseline: int,
    n_strategies_compared: int,
    baseline_name: str = "Random",
    metric_name: str = "win_rate",
) -> dict[str, Any]:
    """Compute full significance block for a strategy vs baseline.

    Args:
        hits_strat, n_strat: strategy's hits and sample size
        hits_baseline, n_baseline: baseline's hits and sample size
        n_strategies_compared: K for Bonferroni (excluding baseline itself)
        baseline_name: label for output
        metric_name: label for the proportion being tested

    Returns a dict matching EVALUATION.md §4 schema (the `significance` block).
    """
    ztest = two_proportion_z_test(hits_strat, n_strat, hits_baseline, n_baseline)
    ci_lo, ci_hi = newcombe_diff_ci(hits_strat, n_strat, hits_baseline, n_baseline)
    k = max(1, n_strategies_compared)
    bonf_threshold = 0.05 / k
    passes_bonf = ztest["p_value"] < bonf_threshold
    decision = decide_state(
        p_value=ztest["p_value"],
        passes_bonferroni=passes_bonf,
        ci_lo_pp=ci_lo * 100,
        delta_pp=ztest["delta_pp"],
    )
    return {
        "metric": metric_name,
        "baseline_name": baseline_name,
        "strategy_rate_pct": round(hits_strat / n_strat * 100, 4) if n_strat else 0.0,
        "baseline_rate_pct": round(hits_baseline / n_baseline * 100, 4) if n_baseline else 0.0,
        "strategy_hits": int(hits_strat),
        "strategy_n": int(n_strat),
        "baseline_hits": int(hits_baseline),
        "baseline_n": int(n_baseline),
        "delta_pp": round(ztest["delta_pp"], 4),
        "z": round(ztest["z"], 4),
        "p_value_raw": round(ztest["p_value"], 6),
        "p_value_method": "two_proportion_z_pooled",
        "bonferroni_k": k,
        "bonferroni_threshold": round(bonf_threshold, 6),
        "passes_bonferroni": bool(passes_bonf),
        "ci95_lo_pp": round(ci_lo * 100, 4),
        "ci95_hi_pp": round(ci_hi * 100, 4),
        "decision": decision,
    }


if __name__ == "__main__":
    # Smoke test replicating HybridParityDiv finding from Chu kỳ 5
    # P(any ticket >=3) — strategy 27.65% vs RandomN 23.33% on 1320 draws
    hits_strat = round(0.2765 * 1320)
    hits_rand = round(0.2333 * 1320)
    sig = build_significance(
        hits_strat=hits_strat, n_strat=1320,
        hits_baseline=hits_rand, n_baseline=1320,
        n_strategies_compared=7, baseline_name="RandomN",
        metric_name="p_any_hit_ge3",
    )
    import json
    print(json.dumps(sig, indent=2))

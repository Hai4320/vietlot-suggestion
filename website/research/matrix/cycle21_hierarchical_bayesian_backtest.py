#!/usr/bin/env python3
"""Chu Kỳ 21 — Hierarchical Bayesian Backtest (matrix products).

Pre-reg: proposals/executed/cycle21_hierarchical_bayesian.md
Family check (Principle #17): Hierarchical EB is NEW paradigm within Bayesian
family — pools at prior level only (1 scalar hyperparameter), distinct from
eliminated Online Kalman (Chu kỳ 14) and Cross-product pooling (Chu kỳ 13/15).

Phase 0 power gate (Principle #12 BINDING): ALL 3 products exploratory-only
at current N. Best outcome = Inconclusive-UP-positive. No strong Accept
possible.

Strategies (K=3 new variants, Bonferroni α_strict=0.0167):
  - HierarchicalEB (T=1.0, refit per-draw)
  - HierarchicalEB_Sharp (T=0.5)
  - HierarchicalEB_Lazy (refit every 7 draws)

Baselines:
  - Random (mandatory)
  - Freq_Hot(365, 0.8) (composite anchor per Chu kỳ 20)
  - Bayesian(365, 1.0, 1.0) (existing batch, Chu kỳ 2 + cycle14 anchor)

3-gate protocol (composite-binding per Chu kỳ 20):
  - Gate 1 (full): composite rank + Δ flag
  - Gate 2 (split-half, Principle #11): both halves Δ > 0 direction-consistent
  - Gate 3 (forward_last_100, Principle #13): directional Δ > 0

Output: cycle21_hierarchical_bayesian_results.json + logs/cycle21_*.log
"""

from __future__ import annotations

import json
import random
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR))
sys.path.insert(0, str(THIS_DIR.parent))

from _significance import build_significance  # noqa: E402
from backtest import (  # noqa: E402
    MATRIX_PRODUCTS,
    BayesianDirichletStrategy,
    FrequencyHotStrategy,
    RandomStrategy,
    StrategyBase,
    load_matrix_data,
)
from hierarchical_bayesian import (  # noqa: E402
    HierarchicalEBLazyStrategy,
    HierarchicalEBSharpStrategy,
    HierarchicalEBStrategy,
    compute_global_empirical_prior,
)

OUTPUT_FILE = THIS_DIR / "cycle21_hierarchical_bayesian_results.json"

# Pre-reg immutable constants
PRODUCTS = ["power_655", "power_645", "power_535"]
BONFERRONI_K = 3  # 3 new variants
ALPHA_STRICT = 0.05 / BONFERRONI_K  # 0.0167
MIN_HISTORY = 100
N_RUNS = 5
SEED = 42
FORWARD_WINDOW = 100
BIAS_CEILING_PP = 0.3  # matrix ceiling
MAGNITUDE_FLAG_THRESHOLD_PP = 3 * BIAS_CEILING_PP  # 0.9pp


def compute_global_prior() -> dict[int, float]:
    """Offline EB: compute global empirical frequency across all matrix products."""
    print("▶ Computing global empirical Bayes prior across products...")
    draws_per_product = {}
    max_val_per_product = {}
    for p in PRODUCTS:
        df = load_matrix_data(p)
        draws_per_product[p] = df["result"].tolist()
        max_val_per_product[p] = MATRIX_PRODUCTS[p]["max_val"]
        print(f"  {p}: N={len(df)}, max_val={max_val_per_product[p]}")

    global_prior = compute_global_empirical_prior(draws_per_product, max_val_per_product)
    print(f"  Global prior: {len(global_prior)} entries, top-3: {sorted(global_prior.items(), key=lambda x: -x[1])[:3]}")
    return global_prior


def make_strategy(name: str, global_prior: dict[int, float]):
    """Factory: fresh instance per run for reproducibility (R3)."""
    if name == "Random":
        return RandomStrategy()
    if name == "Freq_Hot":
        return FrequencyHotStrategy(lookback_days=365, weight=0.8)
    if name == "Bayesian":
        return BayesianDirichletStrategy(lookback_days=365, prior_strength=1.0, temperature=1.0)
    if name == "HierarchicalEB":
        return HierarchicalEBStrategy(global_prior=global_prior, lookback_days=365, prior_strength=1.0, temperature=1.0)
    if name == "HierarchicalEB_Sharp":
        return HierarchicalEBSharpStrategy(global_prior=global_prior, lookback_days=365, prior_strength=1.0)
    if name == "HierarchicalEB_Lazy":
        return HierarchicalEBLazyStrategy(global_prior=global_prior, lookback_days=365, prior_strength=1.0, temperature=1.0)
    raise ValueError(f"Unknown strategy: {name}")


NEW_STRATS = ["HierarchicalEB", "HierarchicalEB_Sharp", "HierarchicalEB_Lazy"]
ALL_STRATS = ["Random", "Freq_Hot", "Bayesian"] + NEW_STRATS


def walk_forward_segment(df, strategy_name, product_cfg, start_idx, end_idx, global_prior):
    """Walk-forward on [start_idx, end_idx) with n_runs repetitions."""
    min_val = product_cfg["min_val"]
    max_val = product_cfg["max_val"]
    num_count = product_cfg["num_count"]
    prizes = product_cfg["prizes"]
    ticket_price = product_cfg["ticket_price"]

    all_matches: list[int] = []
    all_revenues: list[float] = []
    t0 = time.time()

    for run in range(N_RUNS):
        strat = make_strategy(strategy_name, global_prior)
        if hasattr(strat, "reset_cache"):
            strat.reset_cache()
        random.seed(SEED + run)
        np.random.seed(SEED + run)
        for i in range(start_idx, end_idx):
            target_row = df.iloc[i]
            target_date = target_row["date"]
            train_df = df.iloc[:i]
            if len(train_df) < 30:
                continue
            try:
                predicted = strat.predict(train_df, target_date, min_val, max_val, num_count)
            except Exception as e:
                print(f"        !! {strategy_name} predict error at i={i}: {e}")
                continue
            if not predicted:
                continue
            actual = list(target_row["result"][:num_count])
            m = len(set(predicted) & set(actual))
            all_matches.append(m)
            all_revenues.append(prizes.get(m, 0) - ticket_price)

    elapsed = time.time() - t0
    if not all_matches:
        return {"error": "No predictions"}

    total_preds = len(all_matches)
    total_cost = total_preds * ticket_price
    total_revenue = sum(prizes.get(m, 0) for m in all_matches)
    wins_ge3 = sum(1 for m in all_matches if m >= 3)
    win_rate_pct = wins_ge3 / total_preds * 100
    profits = np.array(all_revenues, dtype=float)
    sharpe = 0.0
    if len(profits) > 1:
        std = float(np.std(profits, ddof=1))
        if std > 0:
            sharpe = (float(np.mean(profits)) / std) * float(np.sqrt(52))
    cum = np.cumsum(profits)
    dd = cum - np.maximum.accumulate(cum)
    dist = {str(m): all_matches.count(m) for m in range(max(all_matches) + 1)}
    return {
        "start_idx": start_idx,
        "end_idx": end_idx,
        "total_predictions": total_preds,
        "n_runs": N_RUNS,
        "avg_matches": round(float(np.mean(all_matches)), 4),
        "std_matches": round(float(np.std(all_matches, ddof=1)), 4),
        "win_rate_pct": round(win_rate_pct, 4),
        "wins_ge3": int(wins_ge3),
        "total_cost": int(total_cost),
        "total_revenue": int(total_revenue),
        "net_profit": int(total_revenue - total_cost),
        "roi_pct": round((total_revenue - total_cost) / total_cost * 100, 2) if total_cost else 0.0,
        "sharpe_ratio": round(float(sharpe), 4),
        "max_drawdown": int(abs(float(dd.min()))),
        "matches_distribution": dist,
        "elapsed_seconds": round(elapsed, 2),
    }


def attach_significance(seg_results: dict, baseline_name: str, k: int):
    base = seg_results.get(baseline_name)
    if not base or "wins_ge3" not in base:
        return
    bh = base["wins_ge3"]
    bn = base["total_predictions"]
    for name, r in seg_results.items():
        if name == baseline_name or "wins_ge3" not in r:
            continue
        key_name = f'sig_vs_{baseline_name.split(" ")[0].replace("_", "")}'
        r[key_name] = build_significance(
            hits_strat=r["wins_ge3"],
            n_strat=r["total_predictions"],
            hits_baseline=bh,
            n_baseline=bn,
            n_strategies_compared=k,
            baseline_name=baseline_name,
            metric_name="win_rate_ge3",
        )


def compute_composite_ranks(seg_results: dict) -> dict:
    """Composite tournament score per Chu kỳ 20 binding rule.

    Score = 0.40*z(win_rate) + 0.30*z(ROI) + 0.15*z(Sharpe) + 0.15*z(-log10 p_raw vs Random)
    Returns dict {strategy_name: {composite_score, rank, per_metric_z}}
    """
    import math

    # Get p-value vs Random per strategy (for -log10 p)
    rows = []
    for name, r in seg_results.items():
        if "win_rate_pct" not in r:
            continue
        sig = r.get("sig_vs_Random", {})
        p_raw = sig.get("p_value_raw", 0.5) if name != "Random" else 0.5
        rows.append({
            "name": name,
            "win_rate": r["win_rate_pct"],
            "roi": r["roi_pct"],
            "sharpe": r["sharpe_ratio"],
            "p_raw": max(p_raw, 1e-20),
        })
    if len(rows) < 2:
        return {}

    def z(arr):
        m = sum(arr) / len(arr)
        v = sum((x - m) ** 2 for x in arr) / (len(arr) - 1) if len(arr) > 1 else 1.0
        sd = math.sqrt(v) if v > 0 else 1.0
        return [(x - m) / sd for x in arr]

    wr_z = z([r["win_rate"] for r in rows])
    roi_z = z([r["roi"] for r in rows])
    sh_z = z([r["sharpe"] for r in rows])
    plog_z = z([-math.log10(r["p_raw"]) for r in rows])

    for i, r in enumerate(rows):
        r["composite"] = 0.40 * wr_z[i] + 0.30 * roi_z[i] + 0.15 * sh_z[i] + 0.15 * plog_z[i]
        r["z_win"] = wr_z[i]
        r["z_roi"] = roi_z[i]
        r["z_sharpe"] = sh_z[i]
        r["z_neglogp"] = plog_z[i]

    ranked = sorted(rows, key=lambda x: -x["composite"])
    out = {}
    for rank, r in enumerate(ranked, 1):
        out[r["name"]] = {
            "composite_score": round(r["composite"], 4),
            "composite_rank": rank,
            "z_win": round(r["z_win"], 4),
            "z_roi": round(r["z_roi"], 4),
            "z_sharpe": round(r["z_sharpe"], 4),
            "z_neglogp": round(r["z_neglogp"], 4),
        }
    return out


def classify_verdict(full_sig, h1_sig, h2_sig, fwd_sig, composite_rank, total_strats):
    """Apply Chu kỳ 21 decision rules (Phase 0 exploratory-only context).

    Returns dict {verdict, reason}.
    """
    full_delta = full_sig.get("delta_pp", 0) if full_sig else 0
    h1_delta = h1_sig.get("delta_pp", 0) if h1_sig else 0
    h2_delta = h2_sig.get("delta_pp", 0) if h2_sig else 0
    fwd_delta = fwd_sig.get("delta_pp", 0) if fwd_sig else 0

    h1_p = h1_sig.get("p_value_raw", 1.0) if h1_sig else 1.0
    h2_p = h2_sig.get("p_value_raw", 1.0) if h2_sig else 1.0

    # Primary filter: Δ ≤ 0 at any gate → Reject
    if full_delta <= 0:
        return {"verdict": "Reject", "reason": f"Full-sample Δ={full_delta:+.3f}pp ≤ 0"}
    if fwd_delta <= 0:
        return {"verdict": "Reject", "reason": f"Forward Δ={fwd_delta:+.3f}pp ≤ 0 (forward veto)"}

    # Split-half direction flip → Reject (power-independent)
    if h1_delta * h2_delta < 0:
        return {"verdict": "Reject", "reason": f"Split-half direction flip: h1={h1_delta:+.3f} h2={h2_delta:+.3f}"}

    # Magnitude sanity (Principle #14)
    if abs(full_delta) > MAGNITUDE_FLAG_THRESHOLD_PP:
        return {"verdict": "Technical-flag-audit", "reason": f"|Δ|={abs(full_delta):.3f}pp > 3× ceiling {MAGNITUDE_FLAG_THRESHOLD_PP}pp"}

    # Composite must be rank #1
    if composite_rank != 1:
        return {"verdict": "Reject", "reason": f"Composite rank {composite_rank}/{total_strats}, not #1 (Chu kỳ 20 binding)"}

    # All gates positive + rank #1 → Inconclusive-underpowered-positive (best achievable at exploratory power)
    return {
        "verdict": "Inconclusive-underpowered-positive",
        "reason": f"Rank #1 composite + Δ_full={full_delta:+.3f}pp + split-half consistent + forward {fwd_delta:+.3f}pp positive. Revisit at N ≥ n_required(80%).",
    }


def run_product(product_key: str, global_prior: dict[int, float]) -> dict:
    product_cfg = MATRIX_PRODUCTS[product_key]
    print(f"\n▶ Product: {product_key}")
    df = load_matrix_data(product_key)
    N = len(df)
    midpoint = N // 2
    forward_start = max(MIN_HISTORY, N - FORWARD_WINDOW)
    print(f"  N={N}, midpoint={midpoint}, forward=[{forward_start}, {N})")

    segments_def = {
        "full": (MIN_HISTORY, N),
        "half1": (MIN_HISTORY, midpoint),
        "half2": (midpoint, N),
        "forward_last_100": (forward_start, N),
    }

    all_segments: dict[str, dict] = {}
    for seg_tag, (s, e) in segments_def.items():
        print(f"\n  --- segment [{seg_tag}] draws [{s}, {e}) ---")
        seg_out: dict[str, Any] = {}
        for name in ALL_STRATS:
            print(f"    ▸ {name}...", end=" ", flush=True)
            r = walk_forward_segment(df, name, product_cfg, s, e, global_prior)
            if "error" in r:
                print(f"ERROR: {r['error']}")
                seg_out[name] = r
                continue
            print(
                f"win={r['win_rate_pct']:.3f}%  roi={r['roi_pct']:+.1f}%  "
                f"n={r['total_predictions']}  T={r['elapsed_seconds']:.1f}s"
            )
            seg_out[name] = r

        # Significance
        attach_significance(seg_out, baseline_name="Random", k=BONFERRONI_K)
        attach_significance(seg_out, baseline_name="Freq_Hot", k=1)
        attach_significance(seg_out, baseline_name="Bayesian", k=1)

        # Composite ranks
        composite = compute_composite_ranks(seg_out)
        for name, score in composite.items():
            if name in seg_out:
                seg_out[name]["composite"] = score

        all_segments[seg_tag] = seg_out

    # Decision rule application (NEW strategies only)
    decisions = {}
    for strat_name in NEW_STRATS:
        full_r = all_segments["full"].get(strat_name, {})
        h1_r = all_segments["half1"].get(strat_name, {})
        h2_r = all_segments["half2"].get(strat_name, {})
        fwd_r = all_segments["forward_last_100"].get(strat_name, {})

        composite_rank = full_r.get("composite", {}).get("composite_rank", 99)
        decision = classify_verdict(
            full_r.get("sig_vs_Random"),
            h1_r.get("sig_vs_Random"),
            h2_r.get("sig_vs_Random"),
            fwd_r.get("sig_vs_Random"),
            composite_rank,
            len(ALL_STRATS),
        )
        decisions[strat_name] = {
            "composite_rank_full": composite_rank,
            "full_delta_pp": full_r.get("sig_vs_Random", {}).get("delta_pp"),
            "half1_delta_pp": h1_r.get("sig_vs_Random", {}).get("delta_pp"),
            "half2_delta_pp": h2_r.get("sig_vs_Random", {}).get("delta_pp"),
            "forward_delta_pp": fwd_r.get("sig_vs_Random", {}).get("delta_pp"),
            **decision,
        }

    return {
        "N": N,
        "midpoint": midpoint,
        "forward_start": forward_start,
        "segments_def": {k: list(v) for k, v in segments_def.items()},
        "segments": all_segments,
        "decisions": decisions,
    }


def main():
    print("=" * 72)
    print("Chu Kỳ 21 — Hierarchical Bayesian Backtest (matrix)")
    print("=" * 72)
    print(f"Products: {PRODUCTS}")
    print(f"New strategies: {NEW_STRATS}")
    print(f"Bonferroni K={BONFERRONI_K}, α_strict={ALPHA_STRICT:.4f}")
    print(f"Phase 0 classification: ALL exploratory-only (N < n_required(50% power))")
    print()

    global_prior = compute_global_prior()

    output: dict[str, Any] = {
        "meta": {
            "cycle": "21",
            "paradigm": "Hierarchical Bayesian (Huong B from META_REVIEW)",
            "pre_reg": "proposals/executed/cycle21_hierarchical_bayesian.md",
            "principle_12_gate": "exploratory-only (all products)",
            "principle_17_family": "NEW paradigm within Bayesian family (distinct from Online Kalman + cross-product pool)",
            "composite_binding": "Chu kỳ 20 EVALUATION §8 binding",
            "n_runs": N_RUNS,
            "seed": SEED,
            "bonferroni_k": BONFERRONI_K,
            "alpha_strict": ALPHA_STRICT,
            "products": PRODUCTS,
            "new_strategies": NEW_STRATS,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        },
        "global_prior": global_prior,
        "products": {},
    }

    for p in PRODUCTS:
        output["products"][p] = run_product(p, global_prior)

    OUTPUT_FILE.write_text(json.dumps(output, indent=2, default=str))
    print(f"\n✓ Results written to {OUTPUT_FILE}")

    # Summary
    print("\n=== DECISION SUMMARY ===")
    for p, pdata in output["products"].items():
        print(f"\n{p}:")
        for strat, d in pdata["decisions"].items():
            print(
                f"  {strat:28s}: {d['verdict']:40s} "
                f"Δ_full={d['full_delta_pp']}, "
                f"rank={d['composite_rank_full']}"
            )


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Chu Kỳ 14 — Online Bayesian Backtest (Path #1, matrix products).

Pre-registered in history/cycle14_online_bayesian.md.

Products:
  - Mega 6/45 (primary, N=1302)
  - Lotto 5/35 (secondary, N=543)

Strategies (10 total, K=3 new variants, Bonferroni α=0.0167):
  Baselines (§8.3 mandatory):
    - Random
    - Freq_Hot(365, 0.8)
    - Pattern(180)
  Mechanism anchors:
    - Bayesian(365, 1.0, 1.0)           ← batch refit baseline
    - Bayes_Sharp(180, 1.0, 0.5)        ← sharp batch variant
  Extra refs:
    - MaxEntropy(365, 1.0)
    - Adaptive([30,90,180,365], 10, "hot")
  New variants:
    - OnlineBayes(λ=0.01, T=1.0, prior=1.0)
    - OnlineBayes(λ=0.03, T=1.0, prior=1.0)
    - OnlineBayes(λ=0.10, T=1.0, prior=1.0)

3 gates: full + split-half + forward_last_100.
Principle #14: |Δ_full| > +0.9pp (3× matrix ceiling) auto-flags pending audit.

Output: cycle14_online_bayesian_results.json
"""
from __future__ import annotations

import json
import random
import sys
import time
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd

THIS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(THIS_DIR))
sys.path.insert(0, str(THIS_DIR.parent))

from backtest import (  # noqa: E402
    MATRIX_PRODUCTS,
    AdaptiveWindowStrategy,
    BayesianDirichletStrategy,
    FrequencyHotStrategy,
    MaxEntropyStrategy,
    PatternStrategy,
    RandomStrategy,
    load_matrix_data,
)
from online_bayesian import OnlineBayesianStrategy  # noqa: E402
from _significance import build_significance  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle14_online_bayesian_results.json"

# --- Pre-registered constants (immutable) ---
BONFERRONI_K = 3  # 3 new OnlineBayes variants
ALPHA_STRICT = 0.05 / BONFERRONI_K  # 0.0167
MIN_HISTORY = 100
N_RUNS = 5
SEED = 42
FORWARD_WINDOW = 100
BIAS_CEILING_PP = 0.3  # matrix number-level ceiling per Principle #14
MAGNITUDE_FLAG_THRESHOLD_PP = 3 * BIAS_CEILING_PP  # 0.9pp

PRODUCTS = ["power_645", "power_535"]

NEW_STRATS = ["OnlineBayes_λ0.01", "OnlineBayes_λ0.03", "OnlineBayes_λ0.10"]
ALL_STRATS_ORDER = [
    "Random",
    "Freq_Hot",
    "Pattern",
    "Bayesian",
    "Bayes_Sharp",
    "MaxEntropy",
    "Adaptive",
    "OnlineBayes_λ0.01",
    "OnlineBayes_λ0.03",
    "OnlineBayes_λ0.10",
]


def make_strategy(name: str):
    """Fresh strategy instance per run (ensures reset state)."""
    if name == "Random":
        return RandomStrategy()
    if name == "Freq_Hot":
        return FrequencyHotStrategy(lookback_days=365, weight=0.8)
    if name == "Pattern":
        return PatternStrategy(lookback_days=180)
    if name == "Bayesian":
        return BayesianDirichletStrategy(lookback_days=365, prior_strength=1.0, temperature=1.0)
    if name == "Bayes_Sharp":
        return BayesianDirichletStrategy(lookback_days=180, prior_strength=1.0, temperature=0.5)
    if name == "MaxEntropy":
        return MaxEntropyStrategy(lookback_days=365, prior_strength=1.0)
    if name == "Adaptive":
        return AdaptiveWindowStrategy(
            candidate_windows=[30, 90, 180, 365], eval_draws=10, strategy_type="hot"
        )
    if name == "OnlineBayes_λ0.01":
        return OnlineBayesianStrategy(forgetting_rate=0.01, prior_strength=1.0, temperature=1.0)
    if name == "OnlineBayes_λ0.03":
        return OnlineBayesianStrategy(forgetting_rate=0.03, prior_strength=1.0, temperature=1.0)
    if name == "OnlineBayes_λ0.10":
        return OnlineBayesianStrategy(forgetting_rate=0.10, prior_strength=1.0, temperature=1.0)
    raise ValueError(f"Unknown: {name}")


def walk_forward_segment(df: pd.DataFrame, strategy, product_cfg, start_idx: int, end_idx: int):
    """Walk-forward on [start_idx, end_idx). n_runs repetitions; fresh strategy per run."""
    min_val = product_cfg["min_val"]
    max_val = product_cfg["max_val"]
    num_count = product_cfg["num_count"]
    prizes = product_cfg["prizes"]
    ticket_price = product_cfg["ticket_price"]

    all_matches: list[int] = []
    all_revenues: list[float] = []
    t0 = time.time()

    for run in range(N_RUNS):
        # Fresh strategy per run (handles OnlineBayes state reset + other stateful strategies)
        strat = make_strategy(strategy)
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
                if not predicted:
                    continue
            except Exception as e:
                print(f"        !! {strategy} predict raised: {e}")
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
        std = np.std(profits, ddof=1)
        if std > 0:
            sharpe = (float(np.mean(profits)) / float(std)) * np.sqrt(52)
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
    """Attach significance block per strategy vs baseline."""
    base = seg_results.get(baseline_name)
    if not base or "wins_ge3" not in base:
        return
    base_hits = base["wins_ge3"]
    base_n = base["total_predictions"]
    for name, r in seg_results.items():
        if name == baseline_name or "wins_ge3" not in r:
            continue
        r[f"sig_vs_{baseline_name}"] = build_significance(
            hits_strat=r["wins_ge3"],
            n_strat=r["total_predictions"],
            hits_baseline=base_hits,
            n_baseline=base_n,
            n_strategies_compared=k,
            baseline_name=baseline_name,
            metric_name="win_rate_ge3",
        )


def classify_split_half(sig1: dict, sig2: dict) -> dict:
    p1, p2 = sig1["p_value_raw"], sig2["p_value_raw"]
    d1, d2 = sig1["delta_pp"], sig2["delta_pp"]
    if not (d1 > 0 and d2 > 0):
        return {
            "decision": "Reject",
            "reason": f"direction inconsistent: d1={d1:+.3f}, d2={d2:+.3f}",
        }
    if p1 < ALPHA_STRICT and p2 < ALPHA_STRICT:
        return {"decision": "Accept", "reason": f"both p<{ALPHA_STRICT:.4f} (p1={p1:.4f}, p2={p2:.4f})"}
    if p1 < 0.05 and p2 < 0.05:
        return {"decision": "Suggestive", "reason": f"both p<0.05 (p1={p1:.4f}, p2={p2:.4f})"}
    if (p1 < 0.05) ^ (p2 < 0.05):
        return {"decision": "Inconclusive", "reason": f"one half p<0.05 (p1={p1:.4f}, p2={p2:.4f})"}
    return {"decision": "Reject", "reason": f"neither p<0.05 (p1={p1:.4f}, p2={p2:.4f})"}


def classify_forward(sig: dict) -> dict:
    d = sig["delta_pp"]
    p = sig["p_value_raw"]
    if d <= 0:
        return {"decision": "Reject", "reason": f"forward Δ={d:+.3f}pp ≤ 0"}
    if p < 0.05:
        return {"decision": "Pass-strong", "reason": f"Δ={d:+.3f}pp, p={p:.4f}"}
    return {"decision": "Pass-directional", "reason": f"Δ={d:+.3f}pp, p={p:.4f} (low power)"}


def classify_overall(full_sig: dict, split_rep: dict, forward_rep: dict) -> dict:
    full_delta = full_sig["delta_pp"]
    full_p = full_sig["p_value_raw"]
    full_passes_bonf = full_sig["passes_bonferroni"]
    full_ci_lo = full_sig["ci95_lo_pp"]

    if full_delta <= 0:
        return {"decision": "Reject", "reason": f"full Δ={full_delta:+.3f}pp ≤ 0"}
    if split_rep["decision"] == "Reject" and "direction inconsistent" in split_rep.get("reason", ""):
        return {"decision": "Reject", "reason": f"split direction flip ({split_rep['reason']})"}
    if forward_rep["decision"] == "Reject":
        return {"decision": "Reject", "reason": forward_rep["reason"]}

    magnitude_flag = abs(full_delta) > MAGNITUDE_FLAG_THRESHOLD_PP

    full_accept = full_passes_bonf and full_ci_lo > 0
    full_suggestive = full_p < 0.05 and full_ci_lo > 0 and not full_passes_bonf
    fwd_pass = forward_rep["decision"] in ("Pass-strong", "Pass-directional")

    if full_accept and split_rep["decision"] == "Accept" and fwd_pass:
        if magnitude_flag:
            return {
                "decision": "Ship-with-caveats",
                "reason": (
                    f"all gates pass BUT |Δ|={full_delta:.3f}pp > "
                    f"{MAGNITUDE_FLAG_THRESHOLD_PP}pp (3× matrix ceiling, Principle #14 flag)"
                ),
            }
        return {"decision": "Accept", "reason": "all 3 gates pass"}
    if full_accept and split_rep["decision"] == "Suggestive" and fwd_pass:
        return {"decision": "Suggestive", "reason": "full Bonferroni + split nominal + forward directional"}
    if full_suggestive and split_rep["decision"] in ("Accept", "Suggestive") and fwd_pass:
        return {"decision": "Suggestive", "reason": "full nominal + split pass + forward directional"}
    if full_p < 0.05 and split_rep["decision"] == "Inconclusive" and fwd_pass:
        return {"decision": "Inconclusive", "reason": "full nominal + split 1-half + forward directional"}
    return {
        "decision": "Inconclusive",
        "reason": (
            f"full_p={full_p:.4f} bonf={full_passes_bonf}, "
            f"split={split_rep['decision']}, forward={forward_rep['decision']}"
        ),
    }


def tournament_composite(seg_results: dict, baseline_name: str = "Random") -> dict:
    """Compute §8.2 tournament composite: 0.40·z(Δ_win) + 0.30·z(Δ_roi) + 0.15·z(sharpe) + 0.15·z(neg_log_p)."""
    base = seg_results.get(baseline_name, {})
    base_roi = base.get("roi_pct", 0.0)
    scores = {}
    metrics = {}
    for name, r in seg_results.items():
        if "wins_ge3" not in r:
            continue
        sig = r.get(f"sig_vs_{baseline_name}", {})
        delta_win = sig.get("delta_pp", 0.0)
        delta_roi = r.get("roi_pct", 0.0) - base_roi
        sharpe = r.get("sharpe_ratio", 0.0)
        p_raw = max(sig.get("p_value_raw", 1.0), 1e-10)
        neg_log_p = -np.log10(p_raw)
        metrics[name] = {
            "delta_win": delta_win,
            "delta_roi": delta_roi,
            "sharpe": sharpe,
            "neg_log_p": float(neg_log_p),
        }
    if not metrics:
        return {}
    # Z-normalize each metric across strategies
    def zscore(vals):
        arr = np.array(vals, dtype=float)
        m, s = arr.mean(), arr.std(ddof=0)
        return (arr - m) / s if s > 1e-12 else np.zeros_like(arr)

    names = list(metrics.keys())
    z_win = zscore([metrics[n]["delta_win"] for n in names])
    z_roi = zscore([metrics[n]["delta_roi"] for n in names])
    z_sharpe = zscore([metrics[n]["sharpe"] for n in names])
    z_p = zscore([metrics[n]["neg_log_p"] for n in names])
    for i, n in enumerate(names):
        scores[n] = {
            "z_delta_win": float(z_win[i]),
            "z_delta_roi": float(z_roi[i]),
            "z_sharpe": float(z_sharpe[i]),
            "z_neg_log_p": float(z_p[i]),
            "composite": float(
                0.40 * z_win[i] + 0.30 * z_roi[i] + 0.15 * z_sharpe[i] + 0.15 * z_p[i]
            ),
            "raw": metrics[n],
        }
    ranked = sorted(scores.items(), key=lambda kv: kv[1]["composite"], reverse=True)
    return {
        "weights": {"delta_win": 0.40, "delta_roi": 0.30, "sharpe": 0.15, "neg_log_p": 0.15},
        "baseline": baseline_name,
        "ranking": [{"rank": i + 1, "strategy": n, **s} for i, (n, s) in enumerate(ranked)],
    }


def run_product(product_key: str, df: pd.DataFrame) -> dict:
    n = len(df)
    midpoint = n // 2
    forward_start = n - FORWARD_WINDOW
    product_cfg = MATRIX_PRODUCTS[product_key]

    print(f"\n{'=' * 90}")
    print(f"  PRODUCT: {product_key}  (N={n}, midpoint={midpoint}, forward=[{forward_start},{n}))")
    print(f"{'=' * 90}")

    segments_def = {
        "full": (MIN_HISTORY, n),
        "half1": (MIN_HISTORY, midpoint),
        "half2": (midpoint, n),
        "forward": (forward_start, n),
    }

    segments = {}
    for seg_name, (s, e) in segments_def.items():
        print(f"\n    --- segment [{seg_name}] draws [{s}, {e}) ---")
        seg: dict = {}
        for strat_name in ALL_STRATS_ORDER:
            print(f"      ▸ {strat_name}...", end=" ", flush=True)
            r = walk_forward_segment(df, strat_name, product_cfg, s, e)
            if "error" in r:
                print(r["error"])
                seg[strat_name] = r
                continue
            print(
                f"win={r['win_rate_pct']:.3f}%  roi={r['roi_pct']:+.1f}%  "
                f"n={r['total_predictions']}  T={r['elapsed_seconds']:.1f}s"
            )
            seg[strat_name] = r
        attach_significance(seg, "Random", k=BONFERRONI_K)
        # Also attach vs mechanism anchor (Bayesian batch) for descriptive comparison
        attach_significance(seg, "Bayesian", k=BONFERRONI_K)
        segments[seg_name] = seg

    # Classify each new strategy
    classifications = {}
    for strat in NEW_STRATS:
        full_sig = segments["full"].get(strat, {}).get("sig_vs_Random", {})
        h1_sig = segments["half1"].get(strat, {}).get("sig_vs_Random", {})
        h2_sig = segments["half2"].get(strat, {}).get("sig_vs_Random", {})
        fwd_sig = segments["forward"].get(strat, {}).get("sig_vs_Random", {})
        if not all([full_sig, h1_sig, h2_sig, fwd_sig]):
            classifications[strat] = {"decision": "Error", "reason": "missing significance block"}
            continue
        split_rep = classify_split_half(h1_sig, h2_sig)
        forward_rep = classify_forward(fwd_sig)
        overall = classify_overall(full_sig, split_rep, forward_rep)
        classifications[strat] = {
            "full": {
                "delta_pp": full_sig["delta_pp"],
                "p_raw": full_sig["p_value_raw"],
                "passes_bonferroni": full_sig["passes_bonferroni"],
                "ci95_lo_pp": full_sig["ci95_lo_pp"],
            },
            "split_half": split_rep,
            "forward": forward_rep,
            "overall": overall,
            "magnitude_flag": abs(full_sig["delta_pp"]) > MAGNITUDE_FLAG_THRESHOLD_PP,
        }

    # Tournament composite on full segment
    tournament = tournament_composite(segments["full"], baseline_name="Random")

    return {
        "n_draws": n,
        "midpoint": midpoint,
        "forward_window": FORWARD_WINDOW,
        "segments": segments,
        "classifications": classifications,
        "tournament_full": tournament,
    }


def main():
    print(f"\n{'#' * 90}")
    print("#  Chu Kỳ 14 — Online Bayesian Backtest (Path #1, matrix)")
    print(f"#  K={BONFERRONI_K}, α_strict={ALPHA_STRICT:.4f}, n_runs={N_RUNS}, seed={SEED}")
    print(f"#  Principle #14 threshold: |Δ| > {MAGNITUDE_FLAG_THRESHOLD_PP}pp")
    print(f"{'#' * 90}")

    t_start = time.time()
    results = {
        "cycle": 14,
        "path": "#1 Online Bayesian Kalman",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "pre_reg": "website/research/history/cycle14_online_bayesian.md",
        "constants": {
            "bonferroni_k": BONFERRONI_K,
            "alpha_strict": ALPHA_STRICT,
            "min_history": MIN_HISTORY,
            "n_runs": N_RUNS,
            "seed": SEED,
            "forward_window": FORWARD_WINDOW,
            "bias_ceiling_pp": BIAS_CEILING_PP,
            "magnitude_flag_threshold_pp": MAGNITUDE_FLAG_THRESHOLD_PP,
        },
        "products": {},
    }

    for product_key in PRODUCTS:
        df = load_matrix_data(product_key)
        results["products"][product_key] = run_product(product_key, df)

    results["total_elapsed_seconds"] = round(time.time() - t_start, 2)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2))
    print(f"\n✓ Wrote {OUTPUT_FILE}  (total {results['total_elapsed_seconds']}s)")

    # Brief summary
    print(f"\n{'=' * 90}")
    print("  SUMMARY")
    print(f"{'=' * 90}")
    for product_key, p_res in results["products"].items():
        print(f"\n  {product_key} (N={p_res['n_draws']}):")
        for strat, cls in p_res["classifications"].items():
            full = cls["full"]
            print(
                f"    {strat:25s}  Δ_full={full['delta_pp']:+.3f}pp (p={full['p_raw']:.4f})  "
                f"split={cls['split_half']['decision']:12s}  "
                f"fwd={cls['forward']['decision']:16s}  "
                f"OVERALL={cls['overall']['decision']}"
            )
        # Tournament top-3
        print("    Tournament top-3 (composite §8.2):")
        for entry in p_res["tournament_full"]["ranking"][:3]:
            print(
                f"      #{entry['rank']} {entry['strategy']:25s} "
                f"composite={entry['composite']:+.3f}  "
                f"(Δ_win={entry['raw']['delta_win']:+.3f}pp, "
                f"Δ_roi={entry['raw']['delta_roi']:+.2f}pp, "
                f"sharpe={entry['raw']['sharpe']:+.3f})"
            )


if __name__ == "__main__":
    main()

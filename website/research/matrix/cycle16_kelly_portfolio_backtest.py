#!/usr/bin/env python3
"""Chu Kỳ 16 — Kelly Portfolio Backtest (Path #2, ROI-axis pivot).

Pre-registered in history/cycle16_kelly_portfolio.md.

Paradigm: multi-ticket (N=20 per draw), ROI-axis primary, `p_any_hit_ge3_pct`
gate. 9 hypothesis cells (K=3 × 3 products), Bonferroni α=0.0167.

Strategies (7 total):
  Baselines: RandomN, PatternN, HotN
  Refs:      MinDistanceWheel-equivalent (via MinDistance single-ticket × N), no
             hybrid-parity (Lotto-specific)
  New:       KellyPortfolio_Hot_H3, KellyPortfolio_Plain, KellyPortfolio_AntiHot_H3

3 gates on p_any_hit_ge3_pct: full + split-half + forward_last_100.
Additional gate (Accept only): ROI > RandomN on full.
Principle #14: |Δ_p_any≥3| > +15pp (3× multi-ticket ceiling) auto-flags.

Output: cycle16_kelly_portfolio_results.json
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

from backtest import MATRIX_PRODUCTS, load_matrix_data  # noqa: E402
from kelly_portfolio import (  # noqa: E402
    HotNStrategy,
    KellyPortfolioStrategy,
    PatternNStrategy,
    RandomNStrategy,
)
from _significance import build_significance  # noqa: E402

OUTPUT_FILE = THIS_DIR / "cycle16_kelly_portfolio_results.json"

# --- Pre-registered constants (immutable) ---
BONFERRONI_K = 3
ALPHA_STRICT = 0.05 / BONFERRONI_K  # 0.0167
MIN_HISTORY = 100
N_RUNS = 5
N_TICKETS = 20
SEED = 42
FORWARD_WINDOW = 100
MT_CEILING_PP = 5.0  # multi-ticket p_any_hit_ge3 ceiling (conservative estimate)
MAGNITUDE_FLAG_THRESHOLD_PP = 3 * MT_CEILING_PP  # 15pp

PRODUCTS = ["power_645", "power_655", "power_535"]

NEW_STRATS = [
    "KellyPortfolio_Hot_H3",
    "KellyPortfolio_Hot_Plain",
    "KellyPortfolio_AntiHot_H3",
]
ALL_STRATS_ORDER = [
    "RandomN",
    "PatternN",
    "HotN",
    "KellyPortfolio_Hot_H3",
    "KellyPortfolio_Hot_Plain",
    "KellyPortfolio_AntiHot_H3",
]


def make_strategy(name: str):
    if name == "RandomN":
        return RandomNStrategy()
    if name == "PatternN":
        return PatternNStrategy(lookback_days=180)
    if name == "HotN":
        return HotNStrategy(lookback_days=365, prior_strength=1.0)
    if name == "KellyPortfolio_Hot_H3":
        return KellyPortfolioStrategy(direction="hot", top_m=15, diversity_min=3)
    if name == "KellyPortfolio_Hot_Plain":
        return KellyPortfolioStrategy(direction="hot", top_m=15, diversity_min=0)
    if name == "KellyPortfolio_AntiHot_H3":
        return KellyPortfolioStrategy(direction="anti_hot", top_m=15, diversity_min=3)
    raise ValueError(f"Unknown: {name}")


def walk_forward_multi_segment(
    df: pd.DataFrame,
    strategy_name: str,
    product_cfg: dict,
    start_idx: int,
    end_idx: int,
):
    min_val = product_cfg["min_val"]
    max_val = product_cfg["max_val"]
    num_count = product_cfg["num_count"]
    prizes = product_cfg["prizes"]
    ticket_price = product_cfg["ticket_price"]

    draws_n = 0
    any_hit3_plus = 0
    best_matches: list[int] = []
    total_matches: list[int] = []
    pooled_revenue = 0
    pooled_cost = 0
    tier_hits = Counter()
    draw_rois: list[float] = []  # per-draw ROI pct for sharpe
    t0 = time.time()

    for run in range(N_RUNS):
        strat = make_strategy(strategy_name)
        random.seed(SEED + run)
        np.random.seed(SEED + run)
        for i in range(start_idx, end_idx):
            target_row = df.iloc[i]
            target_date = target_row["date"]
            train_df = df.iloc[:i]
            if len(train_df) < 30:
                continue
            actual = set(target_row["result"][:num_count])
            try:
                tickets = strat.predict_n(
                    train_df, target_date, min_val, max_val, num_count, N_TICKETS
                )
            except Exception as e:
                print(f"        !! {strategy_name} predict_n raised: {e}")
                continue
            draws_n += 1
            draw_revenue = 0
            best = 0
            total = 0
            for t in tickets:
                m = len(set(t) & actual)
                tier_hits[m] += 1
                draw_revenue += prizes.get(m, 0)
                best = max(best, m)
                total += m
            best_matches.append(best)
            total_matches.append(total)
            draw_cost = N_TICKETS * ticket_price
            pooled_revenue += draw_revenue
            pooled_cost += draw_cost
            if best >= 3:
                any_hit3_plus += 1
            draw_rois.append((draw_revenue - draw_cost) / draw_cost * 100)

    elapsed = time.time() - t0
    if draws_n == 0:
        return {"error": "no draws"}

    rois_arr = np.array(draw_rois, dtype=float)
    sharpe = 0.0
    if len(rois_arr) > 1 and rois_arr.std(ddof=1) > 0:
        sharpe = float(rois_arr.mean() / rois_arr.std(ddof=1)) * np.sqrt(52)

    return {
        "start_idx": start_idx,
        "end_idx": end_idx,
        "n_tickets_per_draw": N_TICKETS,
        "n_draws_evaluated": draws_n,
        "n_runs": N_RUNS,
        "p_any_hit_ge3_pct": round(any_hit3_plus / draws_n * 100, 4),
        "any_hit_ge3_count": int(any_hit3_plus),
        "mean_best_match": round(float(np.mean(best_matches)), 4),
        "mean_total_match": round(float(np.mean(total_matches)), 4),
        "mean_match_per_ticket": round(float(np.mean(total_matches)) / N_TICKETS, 4),
        "pooled_cost": int(pooled_cost),
        "pooled_revenue": int(pooled_revenue),
        "pooled_roi_pct": round((pooled_revenue - pooled_cost) / pooled_cost * 100, 2),
        "sharpe_ratio": round(float(sharpe), 4),
        "tier_hits": {str(k): int(v) for k, v in sorted(tier_hits.items())},
        "elapsed_seconds": round(elapsed, 2),
    }


def attach_significance(seg_results: dict, baseline_name: str, k: int):
    base = seg_results.get(baseline_name)
    if not base or "any_hit_ge3_count" not in base:
        return
    base_hits = base["any_hit_ge3_count"]
    base_n = base["n_draws_evaluated"]
    for name, r in seg_results.items():
        if name == baseline_name or "any_hit_ge3_count" not in r:
            continue
        r[f"sig_vs_{baseline_name}"] = build_significance(
            hits_strat=r["any_hit_ge3_count"],
            n_strat=r["n_draws_evaluated"],
            hits_baseline=base_hits,
            n_baseline=base_n,
            n_strategies_compared=k,
            baseline_name=baseline_name,
            metric_name="p_any_hit_ge3",
        )


def classify_split_half(sig1: dict, sig2: dict) -> dict:
    p1, p2 = sig1["p_value_raw"], sig2["p_value_raw"]
    d1, d2 = sig1["delta_pp"], sig2["delta_pp"]
    if not (d1 > 0 and d2 > 0):
        return {"decision": "Reject", "reason": f"direction inconsistent: d1={d1:+.3f}, d2={d2:+.3f}"}
    if p1 < ALPHA_STRICT and p2 < ALPHA_STRICT:
        return {"decision": "Accept", "reason": f"both p<{ALPHA_STRICT:.4f}"}
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


def classify_overall(full_sig: dict, split_rep: dict, forward_rep: dict,
                     strat_roi: float, baseline_roi: float) -> dict:
    full_delta = full_sig["delta_pp"]
    full_p = full_sig["p_value_raw"]
    full_passes_bonf = full_sig["passes_bonferroni"]
    full_ci_lo = full_sig["ci95_lo_pp"]
    roi_beats_random = strat_roi > baseline_roi

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
        # Accept requires ROI > RandomN (binding per pre-reg)
        if not roi_beats_random:
            return {
                "decision": "Suggestive",
                "reason": (
                    f"all 3 gates pass BUT ROI ({strat_roi:+.2f}%) ≤ RandomN ROI "
                    f"({baseline_roi:+.2f}%) — downgraded to Suggestive (no ROI benefit)"
                ),
            }
        if magnitude_flag:
            return {
                "decision": "Ship-with-caveats",
                "reason": (
                    f"all gates + ROI pass BUT |Δ|={full_delta:.3f}pp > "
                    f"{MAGNITUDE_FLAG_THRESHOLD_PP}pp (3× multi-ticket ceiling, Principle #14)"
                ),
            }
        return {
            "decision": "Accept",
            "reason": f"all 3 gates pass + ROI ({strat_roi:+.2f}% > RandomN {baseline_roi:+.2f}%)",
        }
    if full_accept and split_rep["decision"] == "Suggestive" and fwd_pass:
        return {"decision": "Suggestive", "reason": "full Bonf + split nominal + forward directional"}
    if full_suggestive and split_rep["decision"] in ("Accept", "Suggestive") and fwd_pass:
        return {"decision": "Suggestive", "reason": "full nominal + split pass + forward directional"}
    if full_p < 0.05 and split_rep["decision"] == "Inconclusive" and fwd_pass:
        return {"decision": "Inconclusive", "reason": "full nominal + 1-half split + fwd dir"}
    return {
        "decision": "Inconclusive",
        "reason": (
            f"full_p={full_p:.4f} bonf={full_passes_bonf}, "
            f"split={split_rep['decision']}, forward={forward_rep['decision']}"
        ),
    }


def tournament_composite(seg_results: dict, baseline_name: str = "RandomN") -> dict:
    base = seg_results.get(baseline_name, {})
    base_roi = base.get("pooled_roi_pct", 0.0)
    metrics = {}
    for name, r in seg_results.items():
        if "any_hit_ge3_count" not in r:
            continue
        sig = r.get(f"sig_vs_{baseline_name}", {})
        delta_win = sig.get("delta_pp", 0.0)
        delta_roi = r.get("pooled_roi_pct", 0.0) - base_roi
        sharpe = r.get("sharpe_ratio", 0.0)
        p_raw = max(sig.get("p_value_raw", 1.0), 1e-10)
        neg_log_p = -np.log10(p_raw)
        metrics[name] = {
            "delta_win": delta_win,  # Δ on p_any_hit_ge3 (multi-ticket equivalent)
            "delta_roi": delta_roi,
            "sharpe": sharpe,
            "neg_log_p": float(neg_log_p),
        }
    if not metrics:
        return {}

    def zscore(vals):
        arr = np.array(vals, dtype=float)
        m, s = arr.mean(), arr.std(ddof=0)
        return (arr - m) / s if s > 1e-12 else np.zeros_like(arr)

    names = list(metrics.keys())
    z_win = zscore([metrics[n]["delta_win"] for n in names])
    z_roi = zscore([metrics[n]["delta_roi"] for n in names])
    z_sharpe = zscore([metrics[n]["sharpe"] for n in names])
    z_p = zscore([metrics[n]["neg_log_p"] for n in names])
    scores = {}
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
        "note": "delta_win = Δ on p_any_hit_ge3 (multi-ticket equivalent of win_rate_ge3)",
        "ranking": [{"rank": i + 1, "strategy": n, **s} for i, (n, s) in enumerate(ranked)],
    }


def run_product(product_key: str, df: pd.DataFrame) -> dict:
    n = len(df)
    midpoint = n // 2
    forward_start = n - FORWARD_WINDOW
    product_cfg = MATRIX_PRODUCTS[product_key]

    print(f"\n{'=' * 90}")
    print(f"  TARGET: {product_key}  (N={n}, N_TICKETS={N_TICKETS})")
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
            r = walk_forward_multi_segment(df, strat_name, product_cfg, s, e)
            if "error" in r:
                print(r["error"])
                seg[strat_name] = r
                continue
            print(
                f"p_any≥3={r['p_any_hit_ge3_pct']:.3f}%  ROI={r['pooled_roi_pct']:+.1f}%  "
                f"best̄={r['mean_best_match']:.2f}  n={r['n_draws_evaluated']}  "
                f"T={r['elapsed_seconds']:.1f}s"
            )
            seg[strat_name] = r
        attach_significance(seg, "RandomN", k=BONFERRONI_K)
        segments[seg_name] = seg

    full_random_roi = segments["full"].get("RandomN", {}).get("pooled_roi_pct", 0.0)
    classifications = {}
    for strat in NEW_STRATS:
        full_sig = segments["full"].get(strat, {}).get("sig_vs_RandomN", {})
        h1_sig = segments["half1"].get(strat, {}).get("sig_vs_RandomN", {})
        h2_sig = segments["half2"].get(strat, {}).get("sig_vs_RandomN", {})
        fwd_sig = segments["forward"].get(strat, {}).get("sig_vs_RandomN", {})
        if not all([full_sig, h1_sig, h2_sig, fwd_sig]):
            classifications[strat] = {"decision": "Error", "reason": "missing significance block"}
            continue
        split_rep = classify_split_half(h1_sig, h2_sig)
        forward_rep = classify_forward(fwd_sig)
        strat_roi = segments["full"].get(strat, {}).get("pooled_roi_pct", 0.0)
        overall = classify_overall(full_sig, split_rep, forward_rep, strat_roi, full_random_roi)
        classifications[strat] = {
            "full": {
                "delta_pp": full_sig["delta_pp"],
                "p_raw": full_sig["p_value_raw"],
                "passes_bonferroni": full_sig["passes_bonferroni"],
                "ci95_lo_pp": full_sig["ci95_lo_pp"],
                "strat_roi_pct": strat_roi,
                "baseline_roi_pct": full_random_roi,
                "roi_beats_baseline": strat_roi > full_random_roi,
            },
            "split_half": split_rep,
            "forward": forward_rep,
            "overall": overall,
            "magnitude_flag": abs(full_sig["delta_pp"]) > MAGNITUDE_FLAG_THRESHOLD_PP,
        }

    tournament = tournament_composite(segments["full"], baseline_name="RandomN")

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
    print("#  Chu Kỳ 16 — Kelly Portfolio Backtest (Path #2, ROI-axis pivot)")
    print(f"#  K={BONFERRONI_K}, α_strict={ALPHA_STRICT:.4f}, n_runs={N_RUNS}, "
          f"N_tickets={N_TICKETS}, seed={SEED}")
    print(f"#  Principle #14 threshold: |Δ_p_any≥3| > {MAGNITUDE_FLAG_THRESHOLD_PP}pp")
    print(f"{'#' * 90}")

    t_start = time.time()
    print("\nLoading matrix products...")
    all_dfs = {}
    for pk in PRODUCTS:
        all_dfs[pk] = load_matrix_data(pk)
        print(
            f"  {pk}: N={len(all_dfs[pk])}, "
            f"{all_dfs[pk]['date'].min()} → {all_dfs[pk]['date'].max()}"
        )

    results = {
        "cycle": 16,
        "path": "#2 Kelly-optimal Multi-ticket Portfolio",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "pre_reg": "website/research/history/cycle16_kelly_portfolio.md",
        "constants": {
            "bonferroni_k": BONFERRONI_K,
            "alpha_strict": ALPHA_STRICT,
            "min_history": MIN_HISTORY,
            "n_runs": N_RUNS,
            "n_tickets": N_TICKETS,
            "seed": SEED,
            "forward_window": FORWARD_WINDOW,
            "multi_ticket_ceiling_pp": MT_CEILING_PP,
            "magnitude_flag_threshold_pp": MAGNITUDE_FLAG_THRESHOLD_PP,
        },
        "products": {},
    }

    for product_key in PRODUCTS:
        results["products"][product_key] = run_product(product_key, all_dfs[product_key])

    results["total_elapsed_seconds"] = round(time.time() - t_start, 2)

    OUTPUT_FILE.write_text(json.dumps(results, indent=2))
    print(f"\n✓ Wrote {OUTPUT_FILE}  (total {results['total_elapsed_seconds']}s)")

    print(f"\n{'=' * 90}")
    print("  SUMMARY")
    print(f"{'=' * 90}")
    for product_key, p_res in results["products"].items():
        print(f"\n  {product_key} (N={p_res['n_draws']}):")
        for strat, cls in p_res["classifications"].items():
            full = cls["full"]
            roi_tag = "✓" if full["roi_beats_baseline"] else "✗"
            print(
                f"    {strat:35s}  Δ={full['delta_pp']:+.2f}pp (p={full['p_raw']:.4f})  "
                f"split={cls['split_half']['decision']:12s}  "
                f"fwd={cls['forward']['decision']:16s}  "
                f"ROI{roi_tag}={full['strat_roi_pct']:+.1f}%  "
                f"OVERALL={cls['overall']['decision']}"
            )
        print("    Tournament top-3 (composite §8.2):")
        for entry in p_res["tournament_full"]["ranking"][:3]:
            print(
                f"      #{entry['rank']} {entry['strategy']:35s} "
                f"composite={entry['composite']:+.3f}  "
                f"(Δ_any≥3={entry['raw']['delta_win']:+.2f}pp, "
                f"Δ_ROI={entry['raw']['delta_roi']:+.2f}pp)"
            )


if __name__ == "__main__":
    main()

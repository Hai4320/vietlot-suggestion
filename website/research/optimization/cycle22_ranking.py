#!/usr/bin/env python3
"""Chu Kỳ 22 — Ranking script.

Inputs:
  - optimization/cycle22_backtest_matrix.json (from cycle22_rebacktest_matrix.py)
  - optimization/cycle22_backtest_3d.json (from cycle22_rebacktest_3d.py)

Output: optimization/cycle22_rankings.json (schema: MEASUREMENT.md §5)

Logic (per MEASUREMENT §2-§3):
  1. For each product, compute raw metrics (delta_win, delta_roi, sharpe, neg_log_p) vs Random
  2. Z-normalize within (product, non-excluded)
  3. Compute 3 composite profiles (WinRate / ROI / Balanced)
  4. Rank by each profile
  5. Identify pick candidates (argmax per profile, exclude Random baseline)
  6. Split-half verify on picks (direction consistency); retry ≤ 3 if flip
  7. Apply collapse rules when picks share strategy
  8. Write output + summary
"""
from __future__ import annotations

import json
import math
import time
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
MATRIX_INPUT = THIS_DIR / "cycle22_backtest_matrix.json"
THREED_INPUT = THIS_DIR / "cycle22_backtest_3d.json"
OUTPUT = THIS_DIR / "cycle22_rankings.json"

# MEASUREMENT §2 — 3 composite profiles
PROFILES = {
    "winrate":  {"w_win": 0.60, "w_roi": 0.20, "w_sharpe": 0.10, "w_neg_log_p": 0.10},
    "roi":      {"w_win": 0.20, "w_roi": 0.60, "w_sharpe": 0.10, "w_neg_log_p": 0.10},
    "balanced": {"w_win": 0.40, "w_roi": 0.40, "w_sharpe": 0.10, "w_neg_log_p": 0.10},
}

# MEASUREMENT §3.3 — primary metric per profile for split-half direction check
PROFILE_PRIMARY = {
    "winrate":  "win",    # check win delta
    "roi":      "roi",    # check roi delta
    "balanced": "win",    # check win delta (win = ultimate lottery goal)
}

# Random = null baseline — ranked for diagnostic transparency but not a pick candidate
PICK_EXCLUDE = {"Random"}


# ────────────────────────── Metric helpers ──────────────────────────

def zscore(values: list[float]) -> list[float]:
    n = len(values)
    if n == 0:
        return []
    mean = sum(values) / n
    variance = sum((v - mean) ** 2 for v in values) / n
    std = math.sqrt(variance) if variance > 0 else 1.0
    return [(v - mean) / std for v in values]


def compute_raw_metrics(full_seg: dict, baseline_name: str, primary_key: str) -> dict:
    """Compute delta_win, delta_roi, sharpe, neg_log_p per strategy vs baseline."""
    base = full_seg.get(baseline_name)
    if not base or "error" in base:
        raise ValueError(f"Baseline '{baseline_name}' missing or errored")
    base_roi = base["roi_pct"]
    base_primary = base[primary_key]
    out = {}
    for name, r in full_seg.items():
        if "error" in r:
            continue
        sig = r.get(f"sig_vs_{baseline_name}", {})
        if name == baseline_name:
            delta_primary = 0.0
            p_raw = 1.0
        else:
            delta_primary = sig.get("delta_pp", r[primary_key] - base_primary)
            p_raw = max(sig.get("p_value_raw", 1.0), 1e-10)
        delta_roi = r["roi_pct"] - base_roi
        out[name] = {
            "delta_win_pp": delta_primary,
            "delta_roi_pct": delta_roi,
            "sharpe": r["sharpe_ratio"],
            "p_value_raw": p_raw,
            "neg_log_p": -math.log10(p_raw),
            "raw_primary_pct": r[primary_key],
            "raw_roi_pct": r["roi_pct"],
        }
    return out


def compute_composites(raw_metrics: dict) -> dict:
    """Z-normalize + compute 3 composite scores per strategy."""
    names = list(raw_metrics.keys())
    z_win = zscore([raw_metrics[n]["delta_win_pp"] for n in names])
    z_roi = zscore([raw_metrics[n]["delta_roi_pct"] for n in names])
    z_sharpe = zscore([raw_metrics[n]["sharpe"] for n in names])
    z_p = zscore([raw_metrics[n]["neg_log_p"] for n in names])

    out = {}
    for i, name in enumerate(names):
        scores = {}
        for pname, w in PROFILES.items():
            scores[pname] = (
                w["w_win"] * z_win[i]
                + w["w_roi"] * z_roi[i]
                + w["w_sharpe"] * z_sharpe[i]
                + w["w_neg_log_p"] * z_p[i]
            )
        out[name] = {
            "z": {
                "delta_win": z_win[i],
                "delta_roi": z_roi[i],
                "sharpe": z_sharpe[i],
                "neg_log_p": z_p[i],
            },
            "composite_scores": scores,
            "raw": raw_metrics[name],
        }
    return out


def build_rankings(composites: dict) -> dict:
    """For each profile, sort strategies by composite score descending."""
    rankings = {}
    for pname in PROFILES:
        ranked = sorted(
            composites.items(),
            key=lambda kv: kv[1]["composite_scores"][pname],
            reverse=True,
        )
        rankings[pname] = [
            {
                "rank": i + 1,
                "strategy": name,
                "composite": round(data["composite_scores"][pname], 4),
                "pick_eligible": name not in PICK_EXCLUDE,
                "z": {k: round(v, 3) for k, v in data["z"].items()},
                "raw": {
                    "delta_win_pp": round(data["raw"]["delta_win_pp"], 4),
                    "delta_roi_pct": round(data["raw"]["delta_roi_pct"], 4),
                    "sharpe": round(data["raw"]["sharpe"], 4),
                    "p_value_raw": round(data["raw"]["p_value_raw"], 6),
                    "raw_primary_pct": round(data["raw"]["raw_primary_pct"], 4),
                    "raw_roi_pct": round(data["raw"]["raw_roi_pct"], 4),
                },
            }
            for i, (name, data) in enumerate(ranked)
        ]
    return rankings


# ────────────────────────── Split-half verification ──────────────────────────

def split_half_check(
    strategy_name: str, segments: dict, baseline_name: str, primary_field: str
) -> dict:
    """Check direction consistency of delta_primary across half1 + half2.

    primary_field is either 'win_rate_pct' / 'exact_match_rate' or 'roi_pct' depending on profile.
    """
    h1 = segments.get("half1", {}).get(strategy_name)
    h2 = segments.get("half2", {}).get(strategy_name)
    base_h1 = segments.get("half1", {}).get(baseline_name)
    base_h2 = segments.get("half2", {}).get(baseline_name)
    if not all([h1, h2, base_h1, base_h2]) or any("error" in x for x in [h1, h2, base_h1, base_h2]):
        return {"status": "unavailable", "reason": "missing segment data"}

    h1_delta = h1[primary_field] - base_h1[primary_field]
    h2_delta = h2[primary_field] - base_h2[primary_field]
    s1 = 1 if h1_delta > 0 else (-1 if h1_delta < 0 else 0)
    s2 = 1 if h2_delta > 0 else (-1 if h2_delta < 0 else 0)

    if s1 == 0 or s2 == 0 or s1 != s2:
        return {
            "status": "flipped",
            "half1_delta": round(h1_delta, 4),
            "half2_delta": round(h2_delta, 4),
            "reason": f"direction flip/zero: h1={h1_delta:+.3f}, h2={h2_delta:+.3f}",
        }
    return {
        "status": "verified",
        "half1_delta": round(h1_delta, 4),
        "half2_delta": round(h2_delta, 4),
        "reason": f"consistent: h1={h1_delta:+.3f}, h2={h2_delta:+.3f}",
    }


def select_pick(
    ranking_profile: list,
    segments: dict,
    baseline_name: str,
    primary_field: str,
    max_retries: int = 3,
) -> tuple[dict | None, list]:
    """Pick top eligible; retry ≤ max_retries if split-half flips."""
    attempts = []
    picked = None
    retry_count = 0
    for entry in ranking_profile:
        if not entry["pick_eligible"]:
            continue
        retry_count += 1
        if retry_count > max_retries:
            break
        sh = split_half_check(entry["strategy"], segments, baseline_name, primary_field)
        attempts.append({
            "attempt": retry_count,
            "strategy": entry["strategy"],
            "composite_rank": entry["rank"],
            "split_half_status": sh["status"],
        })
        if sh["status"] == "verified":
            picked = {
                "strategy": entry["strategy"],
                "composite_rank": entry["rank"],
                "composite_score": entry["composite"],
                "split_half": sh,
                "attempt": retry_count,
                "raw": entry["raw"],
            }
            break
    return picked, attempts


def apply_collapse(picks: dict) -> str:
    """Detect strategy overlaps between picks."""
    get = lambda k: picks[k]["strategy"] if picks.get(k) else None
    w, r, b = get("winrate"), get("roi"), get("balanced")
    if w and r and b and w == r == b:
        return "all_three"
    if w and r and w == r and (b is None or w != b):
        return "winrate_roi"
    if w and b and w == b and (r is None or w != r):
        return "winrate_balanced"
    if r and b and r == b and (w is None or r != b):
        return "roi_balanced"
    return "none"


# ────────────────────────── Per-product driver ──────────────────────────

def process_product(
    product_key: str,
    product_data: dict,
    primary_key: str,
    scope_type: str,
    baseline_name: str = "Random",
) -> dict:
    segments = product_data["segments"]
    full_seg = segments["full"]

    raw = compute_raw_metrics(full_seg, baseline_name, primary_key)
    composites = compute_composites(raw)
    rankings = build_rankings(composites)

    picks = {}
    pick_attempts = {}
    for pname in PROFILES:
        primary = PROFILE_PRIMARY[pname]
        primary_field = primary_key if primary == "win" else "roi_pct"
        pick, attempts = select_pick(
            rankings[pname], segments, baseline_name, primary_field, max_retries=3
        )
        picks[pname] = pick
        pick_attempts[pname] = attempts

    collapse = apply_collapse(picks)

    return {
        "scope": scope_type,
        "n_draws": product_data["n_draws"],
        "n_strategies_ranked": len(composites),
        "baseline": baseline_name,
        "primary_metric_field": primary_key,
        "rankings": rankings,
        "picks": picks,
        "pick_attempts": pick_attempts,
        "collapse_applied": collapse,
    }


# ────────────────────────── Main ──────────────────────────

def main():
    matrix_data = json.loads(MATRIX_INPUT.read_text())
    threed_data = json.loads(THREED_INPUT.read_text())

    output = {
        "cycle": 22,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "pre_reg": "proposals/cycle22_optimization_mode.md",
        "methodology": "optimization/MEASUREMENT.md",
        "composite_profiles": PROFILES,
        "profile_primary_for_split_half": PROFILE_PRIMARY,
        "pick_exclude_baselines": sorted(PICK_EXCLUDE),
        "input_files": {
            "matrix": MATRIX_INPUT.name,
            "3d": THREED_INPUT.name,
        },
        "products": {},
    }

    for pk, pdata in matrix_data["products"].items():
        output["products"][pk] = process_product(pk, pdata, "win_rate_pct", "matrix")
    for pk, pdata in threed_data["products"].items():
        output["products"][pk] = process_product(pk, pdata, "exact_match_rate", "3d")

    OUTPUT.write_text(json.dumps(output, indent=2))
    print(f"✓ Wrote {OUTPUT}")

    print("\n" + "=" * 90)
    print("  CHU KỲ 22 — RANKINGS SUMMARY")
    print("=" * 90)
    for pk, pdata in output["products"].items():
        print(
            f"\n  {pk} (scope={pdata['scope']}, N={pdata['n_draws']}, "
            f"ranked={pdata['n_strategies_ranked']})"
        )
        print(f"    collapse: {pdata['collapse_applied']}")
        for pname, pick in pdata["picks"].items():
            if pick:
                raw = pick["raw"]
                sh = pick["split_half"]
                print(
                    f"    picks.{pname:9s}: {pick['strategy']:30s} "
                    f"rank={pick['composite_rank']:2d} "
                    f"Δ_win={raw['delta_win_pp']:+.3f}pp "
                    f"Δ_roi={raw['delta_roi_pct']:+.2f}% "
                    f"split_half={sh['status']} (try #{pick['attempt']})"
                )
            else:
                attempts = pdata["pick_attempts"].get(pname, [])
                statuses = [a["split_half_status"] for a in attempts]
                print(
                    f"    picks.{pname:9s}: null  (3 retries: "
                    f"{', '.join(statuses) if statuses else 'no eligible candidates'})"
                )


if __name__ == "__main__":
    main()

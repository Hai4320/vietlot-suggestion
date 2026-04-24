#!/usr/bin/env python3
"""Chu Kỳ 22 3D Pro audit — diff analyzer.

Compares max_3d_pro rankings between:
  - OLD: cycle22_backtest_3d.json (wrong Max-3D-style 4-tier evaluator)
  - NEW: cycle22_backtest_3dpro_corrected.json (correct 8-tier ticket evaluator)

Recomputes 3 composite profiles (WinRate / ROI / Balanced) for each side using
the same z-normalization + weight formula as cycle22_ranking.py. Emits:
  - diff table (strategy ranking by composite, old vs new)
  - top-1 / top-3 picks per profile, old vs new
  - summary counters (how many rank positions changed)

Output: printed to stdout + JSON to cycle22_3dpro_diff.json.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

THIS_DIR = Path(__file__).resolve().parent
OLD_FILE = THIS_DIR / "cycle22_backtest_3d.json"
NEW_FILE = THIS_DIR / "cycle22_backtest_3dpro_corrected.json"
OUT_FILE = THIS_DIR / "cycle22_3dpro_diff.json"

PROFILES = {
    "WinRate": (0.60, 0.20, 0.10, 0.10),
    "ROI": (0.20, 0.60, 0.10, 0.10),
    "Balanced": (0.40, 0.40, 0.10, 0.10),
}


def zscore(values: list[float]) -> list[float]:
    if not values:
        return []
    m = sum(values) / len(values)
    if len(values) < 2:
        return [0.0] * len(values)
    var = sum((v - m) ** 2 for v in values) / (len(values) - 1)
    sd = math.sqrt(var)
    if sd == 0:
        return [0.0] * len(values)
    return [(v - m) / sd for v in values]


def composite_for_segment(seg: dict, baseline_name: str = "Random") -> list[dict]:
    """Compute 3 composite scores per strategy within a single segment."""
    strategies = [n for n in seg if n != baseline_name and "exact_match_rate" in seg[n]]
    win = [seg[n]["exact_match_rate"] for n in strategies]
    roi = [seg[n]["roi_pct"] for n in strategies]
    sharpe = [seg[n].get("sharpe_ratio", 0.0) for n in strategies]
    # Use sig's −log10(p) if available, else 0
    neg_logp = []
    for n in strategies:
        sig = seg[n].get("sig_vs_Random", {}) or {}
        p = sig.get("p_raw", 1.0)
        neg_logp.append(-math.log10(max(p, 1e-10)))

    zw, zr, zs, zp = zscore(win), zscore(roi), zscore(sharpe), zscore(neg_logp)

    rows = []
    for i, name in enumerate(strategies):
        row = {"strategy": name, "win": win[i], "roi": roi[i], "sharpe": sharpe[i],
               "neg_log_p": neg_logp[i], "z_win": zw[i], "z_roi": zr[i],
               "z_sharpe": zs[i], "z_neg_log_p": zp[i], "scores": {}}
        for profile, (ww, wr, ws, wp) in PROFILES.items():
            row["scores"][profile] = ww * zw[i] + wr * zr[i] + ws * zs[i] + wp * zp[i]
        rows.append(row)
    return rows


def top_ranked(rows: list[dict], profile: str, k: int = 5) -> list[tuple[int, str, float]]:
    sorted_rows = sorted(rows, key=lambda r: r["scores"][profile], reverse=True)
    return [(i + 1, r["strategy"], r["scores"][profile]) for i, r in enumerate(sorted_rows[:k])]


def main():
    if not NEW_FILE.exists():
        print(f"ERROR: {NEW_FILE} not found. Run cycle22_rebacktest_3dpro_corrected.py first.")
        return 1

    old = json.loads(OLD_FILE.read_text())
    new = json.loads(NEW_FILE.read_text())

    old_full = old["products"]["max_3d_pro"]["segments"]["full"]
    new_full = new["products"]["max_3d_pro"]["segments"]["full"]

    old_rows = composite_for_segment(old_full)
    new_rows = composite_for_segment(new_full)

    old_by_name = {r["strategy"]: r for r in old_rows}
    new_by_name = {r["strategy"]: r for r in new_rows}

    print("═" * 90)
    print(f"3D PRO AUDIT DIFF — full segment only (N_draws={new['products']['max_3d_pro']['n_draws']})")
    print("═" * 90)

    summary = {}
    for profile in PROFILES:
        print(f"\n▼ Profile: {profile} (weights {PROFILES[profile]})")
        print("  OLD top-5 (wrong Max-3D 4-tier per-number eval):")
        old_top = top_ranked(old_rows, profile, 5)
        for rank, name, score in old_top:
            print(f"    {rank}. {name:30s}  composite={score:+.3f}")
        print("  NEW top-5 (correct 3D Pro 8-tier ticket-level eval):")
        new_top = top_ranked(new_rows, profile, 5)
        for rank, name, score in new_top:
            print(f"    {rank}. {name:30s}  composite={score:+.3f}")

        old_top1 = old_top[0][1] if old_top else None
        new_top1 = new_top[0][1] if new_top else None
        changed = old_top1 != new_top1
        print(f"  → top-1 changed: {'YES' if changed else 'no'}"
              + (f"  ({old_top1} → {new_top1})" if changed else ""))
        summary[profile] = {
            "old_top1": old_top1,
            "new_top1": new_top1,
            "changed": changed,
            "old_top5": [(r, n, s) for r, n, s in old_top],
            "new_top5": [(r, n, s) for r, n, s in new_top],
        }

    # Rank-position diff table
    print("\n═" * 30)
    print("▼ Rank position changes (WinRate profile, full segment)")
    print("═" * 30)
    old_sorted = sorted(old_rows, key=lambda r: r["scores"]["WinRate"], reverse=True)
    new_sorted = sorted(new_rows, key=lambda r: r["scores"]["WinRate"], reverse=True)
    old_pos = {r["strategy"]: i + 1 for i, r in enumerate(old_sorted)}
    new_pos = {r["strategy"]: i + 1 for i, r in enumerate(new_sorted)}

    diff_rows = []
    for name in old_pos:
        if name not in new_pos:
            continue
        op, np_ = old_pos[name], new_pos[name]
        delta = op - np_  # positive = improved
        diff_rows.append((name, op, np_, delta))
    diff_rows.sort(key=lambda x: -abs(x[3]))

    print(f"  {'Strategy':30s}  {'OLD':>4s}  {'NEW':>4s}  {'Δ':>4s}")
    for name, op, np_, delta in diff_rows:
        marker = ""
        if delta >= 3:
            marker = " ↑↑"
        elif delta <= -3:
            marker = " ↓↓"
        print(f"  {name:30s}  {op:>4d}  {np_:>4d}  {delta:>+4d}{marker}")

    # Metric-level comparison for top interesting strategies
    print("\n═" * 30)
    print("▼ Per-strategy metric diff (full segment)")
    print("═" * 30)
    print(f"  {'Strategy':30s}  {'OLD win%':>9s}  {'NEW win%':>9s}  {'OLD ROI%':>9s}  {'NEW ROI%':>9s}")
    for name in sorted(old_by_name.keys()):
        if name not in new_by_name:
            continue
        o, n = old_by_name[name], new_by_name[name]
        print(f"  {name:30s}  {o['win']:>8.3f}%  {n['win']:>8.3f}%  {o['roi']:>+8.1f}%  {n['roi']:>+8.1f}%")

    OUT_FILE.write_text(json.dumps({
        "profiles": list(PROFILES.keys()),
        "segment": "full",
        "summary": summary,
        "rank_deltas": [(n, o, nn, d) for n, o, nn, d in diff_rows],
        "old_metrics": {r["strategy"]: {"win": r["win"], "roi": r["roi"]} for r in old_rows},
        "new_metrics": {r["strategy"]: {"win": r["win"], "roi": r["roi"]} for r in new_rows},
    }, indent=2))
    print(f"\n✓ Wrote {OUT_FILE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

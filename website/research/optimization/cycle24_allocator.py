#!/usr/bin/env python3
"""Chu Kỳ 24 — Budget-aware ticket portfolio allocator.

Pre-reg: proposals/cycle24_budget_aware.md (APPROVED 2026-04-24).

Single budget B=100_000 VND = 10 tickets @ 10K each. Five products.

For each product:
  1. Resolve ANCHOR strategy set (valid picks or top-composite Balanced fallback)
  2. Enumerate portfolio candidates:
     - Pure(strat)        — 10× strat
     - Mixed(s1, s2, k)   — k× s1 + (10-k)× s2 (only if product has ≥2 distinct anchors)
     - Hedged(strat, k)   — k× strat + (10-k)× Random, k ∈ {7, 8, 9, 10}
     - Wheel(MinDistance) — matrix only; diversity-maximized spread
  3. Simulate walk-forward on last 100 draws × N_RUNS=5
  4. Composite budget score = z-normalized weighted sum of 5 metrics
  5. Rank and emit top-3 per product

Output: optimization/cycle24_portfolios.json
"""
from __future__ import annotations

import json
import math
import random
import sys
import time
from collections import Counter
from datetime import timedelta
from pathlib import Path

import numpy as np

THIS_DIR = Path(__file__).resolve().parent
RESEARCH_DIR = THIS_DIR.parent
MATRIX_DIR = RESEARCH_DIR / "matrix"
THREED_DIR = RESEARCH_DIR / "3d"

# Explicit module loading — matrix/ and 3d/ both define `backtest.py`,
# so we can't rely on sys.path order. Load each with importlib so namespaces
# are isolated.
import importlib.util


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    # Make submodule lookups work (for nested imports inside advanced_backtest)
    sys.modules[name] = mod
    # Ensure the containing directory is on path so relative sibling imports work
    sibling_dir = str(path.parent)
    if sibling_dir not in sys.path:
        sys.path.insert(0, sibling_dir)
    spec.loader.exec_module(mod)
    return mod


matrix_bt = _load_module("_cycle24_matrix_bt", MATRIX_DIR / "backtest.py")
threed_bt = _load_module("_cycle24_3d_bt", THREED_DIR / "advanced_backtest.py")
p3d_pro_eval = _load_module("_cycle24_3dpro_eval", THREED_DIR / "p3d_pro_evaluator.py")

MATRIX_PRODUCTS = matrix_bt.MATRIX_PRODUCTS
MatrixRandom = matrix_bt.RandomStrategy
FrequencyHotStrategy = matrix_bt.FrequencyHotStrategy
MinDistanceStrategy = matrix_bt.MinDistanceStrategy
load_matrix_data = matrix_bt.load_matrix_data

PRODUCTS_3D = threed_bt.PRODUCTS_3D
DigitPairExploiter = threed_bt.DigitPairExploiter
MinimumCoverageSet = threed_bt.MinimumCoverageSet
FreqWholeHotStrategy = threed_bt.FreqWholeHotStrategy
TierWeightedStrategy = threed_bt.TierWeightedStrategy
ThreeDRandom = threed_bt.RandomStrategy
load_3d_data = threed_bt.load_data
evaluate_3d_standard = threed_bt.evaluate_prediction

evaluate_prediction_3dpro = p3d_pro_eval.evaluate_prediction_3dpro

# ═══════════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════════

BUDGET_VND = 100_000
TICKET_PRICE = 10_000
N_TICKETS = BUDGET_VND // TICKET_PRICE  # 10
FORWARD_WINDOW = 100
N_RUNS = 5
SEED = 42

# Composite weights (frozen pre-reg)
W_EXPECTED_PAYOUT = 0.35
W_P_WIN_GE1 = 0.25
W_VARIANCE_PENALTY = 0.15
W_COVERAGE = 0.15
W_BUDGET_EFF = 0.10

OUTPUT_FILE = THIS_DIR / "cycle24_portfolios.json"

# ═══════════════════════════════════════════════════════════════
# Per-product config — anchor strategies + evaluator binding
# ═══════════════════════════════════════════════════════════════
# Strategy factories (called fresh per run to avoid _prev leak for MinDistance)

def _matrix_strats():
    return {
        "Random": lambda: MatrixRandom(),
        "Freq_Hot": lambda: FrequencyHotStrategy(365, 0.8),
        "MinDistance": lambda: MinDistanceStrategy(365, 30),
    }


def _3d_strats():
    return {
        "Random": lambda: ThreeDRandom(),
        "FreqWholeHot": lambda: FreqWholeHotStrategy(200),
        "D3: PairExploiter_T0.5": lambda: DigitPairExploiter(200, 0.5),
        "B1: CoverageOpt": lambda: MinimumCoverageSet(200, 0.5),
        "B2: TierWeighted": lambda: TierWeightedStrategy(300, 0.8),
    }


PRODUCT_CONFIGS = {
    "power_655": {
        "type": "matrix",
        "anchors": ["MinDistance"],      # picks.* all MinDistance (collapse_all_three)
        "strats": _matrix_strats,
        "supports_wheel": True,          # native MinDistance wheel
        "null_pick": False,
    },
    "power_535": {
        "type": "matrix",
        "anchors": ["Freq_Hot"],         # picks.* all Freq_Hot (collapse_all_three)
        "strats": _matrix_strats,
        "supports_wheel": False,         # Freq_Hot doesn't spread; wheel via MinDistance separate
        "null_pick": False,
    },
    "power_645": {
        "type": "matrix",
        "anchors": ["Freq_Hot"],         # NULL pick — top-composite Balanced = Freq_Hot
        "strats": _matrix_strats,
        "supports_wheel": False,
        "null_pick": True,
    },
    "max_3d": {
        "type": "3d",
        # 3-pick diverse: winrate=PairExploiter_T0.5, roi=CoverageOpt, balanced=FreqWholeHot
        "anchors": ["D3: PairExploiter_T0.5", "B1: CoverageOpt", "FreqWholeHot"],
        "strats": _3d_strats,
        "supports_wheel": False,
        "null_pick": False,
    },
    "max_3d_pro": {
        "type": "3d_pro",
        # Chu kỳ 28 Accept (2026-04-24) — C6 A=B exploit quy chế doubling rule.
        # No longer null-pick. Portfolio uses A=B tickets only.
        # See cycle28_meta_analysis.md, cycle27_tier3_compounding_calendar.md.
        "anchors": ["C6: A=B exploit"],
        "strats": _3d_strats,
        "supports_wheel": False,
        "supports_c6_ab": True,  # triggers special portfolio builder
        "null_pick": False,
    },
}


# ═══════════════════════════════════════════════════════════════
# Portfolio builders
# ═══════════════════════════════════════════════════════════════

class PortfolioSpec:
    def __init__(self, kind, params, label):
        self.kind = kind; self.params = params; self.label = label
    def __repr__(self): return f"<Portfolio {self.label}>"


def enumerate_candidates(product_cfg) -> list[PortfolioSpec]:
    """Build list of portfolio specs for this product.

    - Pure: N anchors → N specs
    - Mixed: C(N, 2) unordered pairs × 5 configs (k=5,7,3,6,4) — canonicalize
      by anchor-list order so (A,B,7:3) ≠ (B,A,7:3) (same portfolio, different
      labeling) get collapsed to one.
    - Hedged: N anchors × 3 k-values {9, 8, 7} — k=10 duplicates Pure
    - Wheel: matrix-only, MinDistance wheel (1 spec)
    """
    anchors = product_cfg["anchors"]
    specs: list[PortfolioSpec] = []

    for a in anchors:
        specs.append(PortfolioSpec("pure", {"strat": a}, f"Pure({a})"))

    # Mixed: iterate unordered pairs (i < j)
    for i in range(len(anchors)):
        for j in range(i + 1, len(anchors)):
            a1, a2 = anchors[i], anchors[j]
            for k in [5, 7, 3, 6, 4]:  # k = count of a1
                specs.append(PortfolioSpec(
                    "mixed",
                    {"s1": a1, "s2": a2, "k": k},
                    f"Mixed({a1}+{a2}, {k}:{N_TICKETS - k})"
                ))

    for a in anchors:
        for k in [9, 8, 7]:
            specs.append(PortfolioSpec(
                "hedged",
                {"strat": a, "k": k},
                f"Hedged({a}, {k}+{N_TICKETS - k}R)"
            ))

    if product_cfg.get("supports_wheel"):
        specs.append(PortfolioSpec("wheel_mindistance", {}, "Wheel(MinDistance×10)"))

    if product_cfg.get("supports_c6_ab"):
        # Chu kỳ 28 Accept — A=B exploit for Max 3D Pro. Only viable anchor.
        # Emit single portfolio spec that generates N_TICKETS A=B tickets.
        specs = [PortfolioSpec("c6_ab_portfolio", {"n": N_TICKETS},
                                f"C6(A=B exploit × {N_TICKETS})")]

    return specs


# ═══════════════════════════════════════════════════════════════
# Simulators (product-type-specific)
# ═══════════════════════════════════════════════════════════════

def _build_portfolio_matrix(spec, strats, train_df, target_date, cfg) -> list[list[int]]:
    """Returns 10 tickets (each = list of num_count ints) per spec."""
    min_val, max_val, nc = cfg["min_val"], cfg["max_val"], cfg["num_count"]
    tickets = []
    if spec.kind == "pure":
        s = strats[spec.params["strat"]]()
        for _ in range(N_TICKETS):
            tickets.append(s.predict(train_df, target_date, min_val, max_val, nc))
    elif spec.kind == "mixed":
        s1 = strats[spec.params["s1"]](); s2 = strats[spec.params["s2"]]()
        k = spec.params["k"]
        for _ in range(k):
            tickets.append(s1.predict(train_df, target_date, min_val, max_val, nc))
        for _ in range(N_TICKETS - k):
            tickets.append(s2.predict(train_df, target_date, min_val, max_val, nc))
    elif spec.kind == "hedged":
        s = strats[spec.params["strat"]](); r = strats["Random"]()
        k = spec.params["k"]
        for _ in range(k):
            tickets.append(s.predict(train_df, target_date, min_val, max_val, nc))
        for _ in range(N_TICKETS - k):
            tickets.append(r.predict(train_df, target_date, min_val, max_val, nc))
    elif spec.kind == "wheel_mindistance":
        md = strats["MinDistance"]()  # fresh instance = empty _prev
        for _ in range(N_TICKETS):
            tickets.append(md.predict(train_df, target_date, min_val, max_val, nc))
    else:
        raise ValueError(f"Unknown spec kind: {spec.kind}")
    return tickets


def _build_portfolio_3d(spec, strats, train, product_key) -> list[list[str]]:
    """Returns 10 tickets (each = list of 3-digit str) for 3D products.

    For 3d_pro: each "ticket" = 2 adjacent 3-digit strings (A, B pair). So we
    generate 20 strings → caller pairs them.

    Special case: c6_ab_portfolio (Chu kỳ 28 Accept) emits N tickets with A=B=X.
    """
    # Chu kỳ 28 — C6 A=B exploit for Max 3D Pro
    if spec.kind == "c6_ab_portfolio" and product_key == "max_3d_pro":
        n = spec.params.get("n", N_TICKETS)
        out = []
        for _ in range(n):
            x = f"{random.randint(0, 999):03d}"
            out.append([x, x])
        return out

    per_ticket = 2 if product_key == "max_3d_pro" else 1
    total_needed = N_TICKETS * per_ticket

    tickets_flat = []
    if spec.kind == "pure":
        s = strats[spec.params["strat"]]()
        pred = s.predict(train, total_needed)
        tickets_flat = list(pred) if pred else []
    elif spec.kind == "mixed":
        s1 = strats[spec.params["s1"]](); s2 = strats[spec.params["s2"]]()
        k = spec.params["k"]
        t1 = s1.predict(train, k * per_ticket) or []
        t2 = s2.predict(train, (N_TICKETS - k) * per_ticket) or []
        tickets_flat = list(t1) + list(t2)
    elif spec.kind == "hedged":
        s = strats[spec.params["strat"]](); r = strats["Random"]()
        k = spec.params["k"]
        t1 = s.predict(train, k * per_ticket) or []
        t2 = r.predict(train, (N_TICKETS - k) * per_ticket) or []
        tickets_flat = list(t1) + list(t2)
    else:
        raise ValueError(f"3D spec kind not supported: {spec.kind}")

    # Pad with random if strategy short-returned (rare but guard)
    while len(tickets_flat) < total_needed:
        tickets_flat.append(f"{random.randint(0, 999):03d}")
    tickets_flat = tickets_flat[:total_needed]

    if product_key == "max_3d_pro":
        # Pair into (A, B) tuples
        return [[tickets_flat[2 * i], tickets_flat[2 * i + 1]] for i in range(N_TICKETS)]
    return [[t] for t in tickets_flat]


def _evaluate_portfolio_matrix(tickets, draw_actual, cfg) -> tuple[int, int, set]:
    """Returns (n_wins_ge3, total_prize_vnd, unique_numbers_set) for matrix portfolio."""
    actual = set(draw_actual[:cfg["num_count"]])
    prizes = cfg["prizes"]
    total_prize = 0
    n_wins = 0
    unique_nums: set = set()
    for ticket in tickets:
        unique_nums.update(ticket)
        m = len(set(ticket) & actual)
        if m >= 3:
            n_wins += 1
            total_prize += prizes.get(m, 0)
    return n_wins, total_prize, unique_nums


def _evaluate_portfolio_3d(tickets, draw, product_key) -> tuple[int, int, set]:
    """Returns (n_wins, total_prize, unique_numbers_set) for 3D / 3D Pro portfolio."""
    unique_nums: set = set()
    for ticket in tickets:
        unique_nums.update(ticket)

    if product_key == "max_3d_pro":
        # Flatten pairs and call evaluate_prediction_3dpro (pairs adjacent)
        flat: list[str] = []
        for pair in tickets:
            flat.extend(pair)
        ev = evaluate_prediction_3dpro(flat, draw)
        return ev["exact_count"], ev["total_prize"], unique_nums

    # max_3d: evaluate as flat list against Max-3D 4-tier
    flat = [t[0] for t in tickets]
    cfg = PRODUCTS_3D[product_key]
    ev = evaluate_3d_standard(flat, draw, cfg["prizes"])
    return ev["exact_count"], ev["total_prize"], unique_nums


def simulate(spec, product_key, product_cfg) -> dict:
    """Walk-forward N_RUNS × last FORWARD_WINDOW draws; compute raw metrics."""
    strats = product_cfg["strats"]()
    ptype = product_cfg["type"]

    if ptype == "matrix":
        df = load_matrix_data(product_key)
        matrix_cfg = MATRIX_PRODUCTS[product_key]
        n = len(df); start = max(n - FORWARD_WINDOW, 30)
        per_draw_prize: list[int] = []
        per_draw_win_flag: list[int] = []
        per_draw_coverage: list[float] = []
        for run in range(N_RUNS):
            random.seed(SEED + run); np.random.seed(SEED + run)
            for i in range(start, n):
                row = df.iloc[i]
                try:
                    tickets = _build_portfolio_matrix(spec, strats, df.iloc[:i], row["date"], matrix_cfg)
                except Exception:
                    continue
                nw, prize, unique = _evaluate_portfolio_matrix(tickets, row["result"], matrix_cfg)
                per_draw_prize.append(prize)
                per_draw_win_flag.append(1 if nw >= 1 else 0)
                total_slots = N_TICKETS * matrix_cfg["num_count"]
                per_draw_coverage.append(len(unique) / total_slots)
    else:
        # 3D / 3D Pro
        cfg = PRODUCTS_3D[product_key]
        draws = load_3d_data(cfg["file"])
        n = len(draws); start = max(n - FORWARD_WINDOW, 50)
        per_draw_prize = []; per_draw_win_flag = []; per_draw_coverage = []
        for run in range(N_RUNS):
            random.seed(SEED + run); np.random.seed(SEED + run)
            for i in range(start, n):
                try:
                    tickets = _build_portfolio_3d(spec, strats, draws[:i], product_key)
                except Exception:
                    continue
                nw, prize, unique = _evaluate_portfolio_3d(tickets, draws[i], product_key)
                per_draw_prize.append(prize)
                per_draw_win_flag.append(1 if nw >= 1 else 0)
                # Coverage: unique numbers out of total positions
                per_slot = 2 if product_key == "max_3d_pro" else 1
                total_slots = N_TICKETS * per_slot
                per_draw_coverage.append(len(unique) / total_slots)

    if not per_draw_prize:
        return {"error": "No draws simulated"}

    prizes_arr = np.array(per_draw_prize, dtype=float)
    exp_payout = float(prizes_arr.mean())
    std_payout = float(prizes_arr.std(ddof=1)) if len(prizes_arr) > 1 else 0.0
    p_win_ge1 = float(np.mean(per_draw_win_flag))
    coverage = float(np.mean(per_draw_coverage))
    # Budget efficiency: all candidates use full budget (10 tickets × 10K = 100K)
    budget_eff = 1.0

    total_draws = len(per_draw_prize)
    total_cost = total_draws * BUDGET_VND
    total_revenue = int(prizes_arr.sum())
    roi_pct = (total_revenue - total_cost) / total_cost * 100

    return {
        "label": spec.label,
        "kind": spec.kind,
        "params": spec.params,
        "n_tickets": N_TICKETS,
        "n_draws_simulated": total_draws,
        "expected_payout_vnd": round(exp_payout, 2),
        "p_win_ge1": round(p_win_ge1, 4),
        "std_payout": round(std_payout, 2),
        "coverage": round(coverage, 4),
        "budget_eff": budget_eff,
        "total_cost_vnd": total_cost,
        "total_revenue_vnd": total_revenue,
        "net_profit_vnd": total_revenue - total_cost,
        "roi_pct": round(roi_pct, 2),
    }


# ═══════════════════════════════════════════════════════════════
# Composite scoring (z-normalized within product)
# ═══════════════════════════════════════════════════════════════

def zscore(vals: list[float]) -> list[float]:
    if len(vals) < 2: return [0.0] * len(vals)
    m = sum(vals) / len(vals)
    sd = math.sqrt(sum((v - m) ** 2 for v in vals) / (len(vals) - 1))
    if sd == 0: return [0.0] * len(vals)
    return [(v - m) / sd for v in vals]


def rank_product(results: list[dict]) -> list[dict]:
    """Compute composite_budget + sort. In-place adds fields."""
    good = [r for r in results if "error" not in r]
    if not good: return results

    exp_p = [r["expected_payout_vnd"] for r in good]
    p_win = [r["p_win_ge1"] for r in good]
    # variance penalty = -std (higher std = more penalty = lower z → we negate)
    std_p = [r["std_payout"] for r in good]
    cov = [r["coverage"] for r in good]
    be = [r["budget_eff"] for r in good]

    zEP = zscore(exp_p); zPW = zscore(p_win); zSD = zscore(std_p)
    zCV = zscore(cov); zBE = zscore(be)

    for i, r in enumerate(good):
        r["z"] = {
            "expected_payout": round(zEP[i], 3),
            "p_win_ge1": round(zPW[i], 3),
            "std_payout": round(zSD[i], 3),
            "coverage": round(zCV[i], 3),
            "budget_eff": round(zBE[i], 3),
        }
        r["composite_score"] = round(
            W_EXPECTED_PAYOUT * zEP[i]
            + W_P_WIN_GE1 * zPW[i]
            + W_VARIANCE_PENALTY * (-zSD[i])   # penalize high variance
            + W_COVERAGE * zCV[i]
            + W_BUDGET_EFF * zBE[i],
            3,
        )

    good.sort(key=lambda r: r["composite_score"], reverse=True)
    for i, r in enumerate(good):
        r["rank"] = i + 1
    return good


# ═══════════════════════════════════════════════════════════════
# Main driver
# ═══════════════════════════════════════════════════════════════

def run():
    t_start = time.time()
    output = {
        "cycle": 24,
        "scope": "budget_aware_portfolio",
        "pre_reg": "proposals/cycle24_budget_aware.md",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "budget_vnd": BUDGET_VND,
        "ticket_price_vnd": TICKET_PRICE,
        "n_tickets_per_portfolio": N_TICKETS,
        "forward_window": FORWARD_WINDOW,
        "n_runs": N_RUNS,
        "seed": SEED,
        "composite_weights": {
            "expected_payout": W_EXPECTED_PAYOUT,
            "p_win_ge1": W_P_WIN_GE1,
            "variance_penalty": W_VARIANCE_PENALTY,
            "coverage": W_COVERAGE,
            "budget_eff": W_BUDGET_EFF,
        },
        "products": {},
    }

    for product_key, cfg in PRODUCT_CONFIGS.items():
        print(f"\n{'═' * 80}")
        print(f"  {product_key} (null_pick={cfg['null_pick']}, anchors={cfg['anchors']})")
        print(f"{'═' * 80}")
        specs = enumerate_candidates(cfg)
        print(f"  → {len(specs)} portfolio candidates")

        raw_results = []
        for spec in specs:
            t0 = time.time()
            print(f"    ▸ {spec.label:55s}", end=" ", flush=True)
            r = simulate(spec, product_key, cfg)
            r["elapsed_s"] = round(time.time() - t0, 2)
            if "error" in r:
                print(r["error"])
            else:
                print(f"payout={r['expected_payout_vnd']:>10.0f}  "
                      f"P(win)={r['p_win_ge1']:.2%}  "
                      f"ROI={r['roi_pct']:+.1f}%  T={r['elapsed_s']:.1f}s")
            raw_results.append(r)

        ranked = rank_product(raw_results)
        top3 = ranked[:3]
        print(f"\n  TOP-3 for {product_key}:")
        for r in top3:
            print(f"    #{r['rank']}: {r['label']:50s}  composite={r['composite_score']:+.3f}  ROI={r['roi_pct']:+.1f}%")

        output["products"][product_key] = {
            "null_pick": cfg["null_pick"],
            "anchors": cfg["anchors"],
            "type": cfg["type"],
            "n_candidates": len(specs),
            "rankings": ranked,
            "top_portfolio": top3[0] if top3 else None,
        }

    output["total_elapsed_s"] = round(time.time() - t_start, 2)
    OUTPUT_FILE.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"\n✓ Wrote {OUTPUT_FILE}  (total {output['total_elapsed_s']}s)")


if __name__ == "__main__":
    run()

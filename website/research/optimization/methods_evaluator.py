#!/usr/bin/env python3
"""Methods Evaluator — Chu Kỳ 25 framework.

Pre-reg: proposals/cycle25_method_evaluation_framework.md (APPROVED 2026-04-24).

Generic evaluator for betting methods. A "method" is a 6-dimensional tuple:
  selection × bet_size × time_frequency × duration × stop_condition × compounding

This module:
  1. Loads method-spec JSON files
  2. Simulates walk-forward per spec
  3. Aggregates 12 metrics per (method, product, segment)
  4. Emits cycle25_results.json

Designed to be reused by Chu kỳ 26/27/28 for other method tiers.

Usage:
    python3 methods_evaluator.py  # runs all specs in cycle25_methods/
"""
from __future__ import annotations

import importlib.util
import json
import random
import statistics
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

import numpy as np

THIS_DIR = Path(__file__).resolve().parent
RESEARCH_DIR = THIS_DIR.parent
MATRIX_DIR = RESEARCH_DIR / "matrix"
THREED_DIR = RESEARCH_DIR / "3d"
METHODS_DIR = THIS_DIR / "cycle25_methods"
OUTPUT_FILE = THIS_DIR / "cycle25_results.json"
LOG_DIR = THIS_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Import matrix/3d modules via isolated loader (same pattern as cycle24_allocator)
def _load_mod(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    parent = str(path.parent)
    if parent not in sys.path:
        sys.path.insert(0, parent)
    spec.loader.exec_module(mod)
    return mod


matrix_bt = _load_mod("_c25_matrix_bt", MATRIX_DIR / "backtest.py")
threed_bt = _load_mod("_c25_3d_bt", THREED_DIR / "advanced_backtest.py")
p3d_pro_eval = _load_mod("_c25_3dpro_eval", THREED_DIR / "p3d_pro_evaluator.py")

MATRIX_PRODUCTS = matrix_bt.MATRIX_PRODUCTS
PRODUCTS_3D = threed_bt.PRODUCTS_3D
evaluate_prediction_3dpro = p3d_pro_eval.evaluate_prediction_3dpro
evaluate_3d_standard = threed_bt.evaluate_prediction

# ═══════════════════════════════════════════════════════════════
# Constants (pre-reg frozen)
# ═══════════════════════════════════════════════════════════════

N_RUNS = 20
SEED_BASE = 42
FORWARD_WINDOW = 100
TICKET_PRICE_VND = 10_000  # all products

# Psychology metric parameters
PAIN_STREAK_THRESHOLDS = [5, 10, 20]
RUIN_BUDGETS_VND = [500_000, 1_000_000, 5_000_000]
RUIN_WINDOW_N = 100  # draws within which we check ruin

PRODUCT_KEYS = ["power_655", "power_645", "power_535", "max_3d", "max_3d_pro"]

# Composite weights (pre-reg frozen, §Decision Rule)
COMPOSITE_WEIGHTS = {
    "roi_pct": 0.30,
    "e_payout_per_draw_vnd": 0.15,
    "p_any_hit_per_draw": 0.15,
    "sharpe_ratio": 0.10,
    "neg_ruin_1m": 0.10,       # negated ruin probability at B=1M/N=100
    "neg_pain_ge10": 0.10,     # negated pain streak P(≥10)
    "neg_max_drawdown": 0.10,  # negated max drawdown (normalized)
}


# ═══════════════════════════════════════════════════════════════
# Strategy factory — reuse existing matrix/3d strategy classes
# ═══════════════════════════════════════════════════════════════

def _matrix_strategy(name: str, params: dict):
    """Factory returning a matrix strategy instance."""
    from datetime import timedelta  # noqa: F401 (needed by strategies)

    if name == "Random":
        return matrix_bt.RandomStrategy()
    if name == "Freq_Hot":
        lb = params.get("lookback_days", 365)
        w = params.get("weight", 0.8)
        return matrix_bt.FrequencyHotStrategy(lb, w)
    if name == "Freq_Cold":
        lb = params.get("lookback_days", 365)
        w = params.get("weight", 0.8)
        return matrix_bt.FrequencyColdStrategy(lb, w)
    if name == "LongAbsence":
        return matrix_bt.LongAbsenceStrategy(params.get("lookback_days", 90))
    if name == "MinDistance":
        return matrix_bt.MinDistanceStrategy(
            params.get("lookback_days", 365),
            params.get("n_candidates", 30),
        )
    if name == "Pattern":
        return matrix_bt.PatternStrategy(params.get("lookback_days", 180))
    if name == "MaxEntropy":
        return matrix_bt.MaxEntropyStrategy(
            params.get("lookback_days", 365),
            params.get("weight", 1.0),
        )
    raise ValueError(f"Unknown matrix strategy: {name}")


class _FreqWholeColdInline:
    """Inline cold-number 3D strategy — picks least-frequent 3-digit number.

    Not in advanced_backtest.py, added here for Chu kỳ 25 F1b/F2b tests.
    Mirrors FreqWholeHotStrategy interface (predict(train, n) → list of str).
    """

    def __init__(self, lookback: int = 200):
        self.lookback = lookback

    def predict(self, train_draws, n_predictions: int = 1):
        from collections import Counter
        recent = train_draws[-self.lookback:] if len(train_draws) >= self.lookback else train_draws
        freq: Counter = Counter()
        for draw in recent:
            for values in draw["result"].values():
                for v in values:
                    freq[str(v).zfill(3)] += 1
        # All 1000 3-digit candidates (including never-seen = freq 0 most cold)
        all_nums = [f"{i:03d}" for i in range(1000)]
        ranked = sorted(all_nums, key=lambda x: freq.get(x, 0))
        return ranked[:n_predictions]


def _3d_strategy(name: str, params: dict):
    if name == "Random":
        return threed_bt.RandomStrategy()
    if name == "FreqWholeHot":
        return threed_bt.FreqWholeHotStrategy(params.get("lookback", 200))
    if name == "FreqWholeCold":
        return _FreqWholeColdInline(params.get("lookback", 200))
    if name == "DigitPairExploiter":
        return threed_bt.DigitPairExploiter(
            params.get("lookback", 200),
            params.get("temperature", 0.5),
        )
    if name == "MinimumCoverageSet":
        return threed_bt.MinimumCoverageSet(
            params.get("lookback", 200),
            params.get("diversity", 0.5),
        )
    if name == "TierWeighted":
        return threed_bt.TierWeightedStrategy(
            params.get("lookback", 300),
            params.get("temperature", 0.8),
        )
    if name == "ExpectedValueMaximizer":
        return threed_bt.ExpectedValueMaximizer(
            params.get("lookback", 300),
            params.get("window", 100),
            params.get("top_k", 4),
        )
    raise ValueError(f"Unknown 3D strategy: {name}")


# ═══════════════════════════════════════════════════════════════
# Product adapters — unify ticket generation + evaluation
# ═══════════════════════════════════════════════════════════════

@dataclass
class TicketResult:
    """Outcome of evaluating 1 ticket against 1 draw."""
    hit: bool                 # did ticket win any tier
    tier_name: Optional[str]  # None if no hit
    prize_vnd: int            # 0 if no hit


class ProductAdapter:
    """Base class. Subclasses: MatrixAdapter, ThreeDAdapter, ThreeDProAdapter."""

    product_key: str

    def load_history(self):
        """Returns list/dataframe of draws sorted oldest→newest."""
        raise NotImplementedError

    def history_len(self, history) -> int:
        raise NotImplementedError

    def select_via_strategy(self, strategy_name: str, strategy_params: dict,
                            history, target_idx: int) -> list:
        """Uses strategy to pick 1 ticket. Returns ticket data (domain-specific)."""
        raise NotImplementedError

    def random_ticket(self, history, target_idx: int) -> list:
        raise NotImplementedError

    def evaluate(self, ticket, history, target_idx: int) -> TicketResult:
        raise NotImplementedError

    def ticket_price(self) -> int:
        return TICKET_PRICE_VND

    def jackpot_hit_in(self, history, idx_range) -> bool:
        """Did jackpot tier hit in any draw in range? (used by E4 jackpot-triggered)"""
        raise NotImplementedError


class MatrixAdapter(ProductAdapter):
    def __init__(self, product_key: str):
        self.product_key = product_key
        self.cfg = MATRIX_PRODUCTS[product_key]

    def load_history(self):
        return matrix_bt.load_matrix_data(self.product_key)

    def history_len(self, history) -> int:
        return len(history)

    def select_via_strategy(self, strategy_name, strategy_params, history, target_idx):
        strat = _matrix_strategy(strategy_name, strategy_params)
        row = history.iloc[target_idx]
        train = history.iloc[:target_idx]
        return strat.predict(
            train, row["date"], self.cfg["min_val"], self.cfg["max_val"], self.cfg["num_count"]
        )

    def random_ticket(self, history, target_idx):
        return sorted(random.sample(
            range(self.cfg["min_val"], self.cfg["max_val"] + 1),
            self.cfg["num_count"],
        ))

    def evaluate(self, ticket, history, target_idx):
        row = history.iloc[target_idx]
        actual = list(row["result"][: self.cfg["num_count"]])
        m = len(set(ticket) & set(actual))
        prizes = self.cfg["prizes"]
        if m in prizes and m >= 3:
            return TicketResult(hit=True, tier_name=f"match_{m}", prize_vnd=prizes[m])
        return TicketResult(hit=False, tier_name=None, prize_vnd=0)

    def jackpot_hit_in(self, history, idx_range):
        top_tier = self.cfg["num_count"]  # 6 for 655/645, 5 for 535
        for i in idx_range:
            if i < 0 or i >= len(history):
                continue
            row = history.iloc[i]
            actual = list(row["result"][: self.cfg["num_count"]])
            # Jackpot hit recorded whenever drawing exists (not knowable without bet data)
            # Proxy: treat every draw as "chance of jackpot" — always False
            # Real impl would need Vietlott jackpot flag. For MVP, E4 approximated differently.
            _ = actual
        return False


class ThreeDAdapter(ProductAdapter):
    def __init__(self, product_key: str = "max_3d"):
        self.product_key = product_key
        self.cfg = PRODUCTS_3D[product_key]

    def load_history(self):
        return threed_bt.load_data(self.cfg["file"])

    def history_len(self, history) -> int:
        return len(history)

    def select_via_strategy(self, strategy_name, strategy_params, history, target_idx):
        strat = _3d_strategy(strategy_name, strategy_params)
        train = history[:target_idx]
        preds = strat.predict(train, 1)  # 1 ticket = 1 number
        return preds[0] if preds else f"{random.randint(0, 999):03d}"

    def random_ticket(self, history, target_idx):
        return f"{random.randint(0, 999):03d}"

    def evaluate(self, ticket, history, target_idx):
        draw = history[target_idx]
        ev = evaluate_3d_standard([ticket], draw, self.cfg["prizes"])
        if ev["exact_count"] > 0:
            m = ev["matches"][0]
            return TicketResult(hit=True, tier_name=m["tier"], prize_vnd=ev["total_prize"])
        return TicketResult(hit=False, tier_name=None, prize_vnd=0)

    def jackpot_hit_in(self, history, idx_range):
        return False  # 3D has no rolling jackpot


class ThreeDProAdapter(ProductAdapter):
    def __init__(self):
        self.product_key = "max_3d_pro"
        self.cfg = PRODUCTS_3D["max_3d_pro"]

    def load_history(self):
        return threed_bt.load_data(self.cfg["file"])

    def history_len(self, history) -> int:
        return len(history)

    def select_via_strategy(self, strategy_name, strategy_params, history, target_idx):
        strat = _3d_strategy(strategy_name, strategy_params)
        train = history[:target_idx]
        preds = strat.predict(train, 2)  # 3D Pro ticket = (A, B) pair
        if preds and len(preds) >= 2:
            return [preds[0], preds[1]]
        return [f"{random.randint(0, 999):03d}", f"{random.randint(0, 999):03d}"]

    def random_ticket(self, history, target_idx):
        return [f"{random.randint(0, 999):03d}", f"{random.randint(0, 999):03d}"]

    def evaluate(self, ticket, history, target_idx):
        draw = history[target_idx]
        ev = evaluate_prediction_3dpro(ticket, draw)
        if ev["exact_count"] > 0:
            m = ev["matches"][0]
            return TicketResult(hit=True, tier_name=m["tier"], prize_vnd=ev["total_prize"])
        return TicketResult(hit=False, tier_name=None, prize_vnd=0)

    def jackpot_hit_in(self, history, idx_range):
        return False


def make_adapter(product_key: str) -> ProductAdapter:
    if product_key in MATRIX_PRODUCTS:
        return MatrixAdapter(product_key)
    if product_key == "max_3d":
        return ThreeDAdapter("max_3d")
    if product_key == "max_3d_pro":
        return ThreeDProAdapter()
    raise ValueError(f"Unknown product: {product_key}")


# ═══════════════════════════════════════════════════════════════
# Method-spec interpretation
# ═══════════════════════════════════════════════════════════════

@dataclass
class RunState:
    draws_played: int = 0
    tickets_purchased: int = 0
    total_cost_vnd: int = 0
    total_payout_vnd: int = 0
    hits_this_run: int = 0
    consecutive_misses: int = 0
    draws_since_last_hit: int = 0
    cumulative_losses: list = field(default_factory=list)
    per_draw_payout: list = field(default_factory=list)
    per_draw_hit: list = field(default_factory=list)
    first_hit_draw: Optional[int] = None
    running_streaks: list = field(default_factory=list)  # finalized cold-streak lengths
    current_cold_streak: int = 0
    stopped_early_at: Optional[int] = None  # index where stop fired


def _resolve_ticket(spec_selection: dict, adapter: ProductAdapter,
                     history, target_idx: int,
                     persistent_cache: dict, algo_rotation_idx: int = 0):
    """Returns ticket per selection dimension."""
    sel_type = spec_selection["type"]

    if sel_type == "fixed_persistent":
        # Pick once via algorithm, cache, reuse
        if "ticket" not in persistent_cache:
            algo = spec_selection.get("algorithm", "Random")
            params = spec_selection.get("params", {})
            if algo == "Random":
                persistent_cache["ticket"] = adapter.random_ticket(history, target_idx)
            else:
                persistent_cache["ticket"] = adapter.select_via_strategy(algo, params, history, target_idx)
        return persistent_cache["ticket"]

    if sel_type == "algorithm_persistent":
        # Same as fixed_persistent (explicit variant)
        return _resolve_ticket(
            {**spec_selection, "type": "fixed_persistent"},
            adapter, history, target_idx, persistent_cache,
        )

    if sel_type == "algorithm_fresh":
        algo = spec_selection.get("algorithm", "Random")
        params = spec_selection.get("params", {})
        if algo == "Random":
            return adapter.random_ticket(history, target_idx)
        return adapter.select_via_strategy(algo, params, history, target_idx)

    if sel_type == "random_fresh":
        return adapter.random_ticket(history, target_idx)

    if sel_type == "rotate":
        algos = spec_selection["algorithms"]  # list of {algorithm, params}
        picked = algos[algo_rotation_idx % len(algos)]
        return adapter.select_via_strategy(picked["algorithm"], picked.get("params", {}), history, target_idx)

    raise ValueError(f"Unknown selection type: {sel_type}")


def _should_play_draw(spec_freq: dict, state: RunState, adapter: ProductAdapter,
                      history, target_idx: int) -> bool:
    """Time-frequency filter."""
    ftype = spec_freq.get("type", "every_draw")
    if ftype == "every_draw":
        return True
    if ftype == "alternate":
        return state.draws_played % 2 == 0
    if ftype == "every_k":
        k = spec_freq.get("k", 3)
        return (target_idx % k) == 0
    if ftype == "jackpot_triggered":
        # E4: play only if no jackpot hit in the last K draws
        # For matrix: use "no 6-match in pool of last K draws" as proxy for rollover
        k = spec_freq.get("k", 5)
        # Since we can't observe jackpot directly, trigger always True for this MVP
        # Real implementation needs Vietlott jackpot flag in data
        return True  # TODO: implement proper jackpot-rollover logic when data available
    return True


def _should_stop(spec_stop: dict, state: RunState, spec_duration: dict) -> bool:
    """Stop-condition check."""
    dtype = spec_duration.get("type", "indefinite")
    stype = spec_stop.get("type", "never")

    if dtype == "fixed_n" and state.draws_played >= spec_duration.get("n", 100):
        return True

    if dtype == "indefinite" or dtype == "until_condition":
        if stype == "never":
            return False
        if stype == "any_tier_hit":
            return state.hits_this_run >= 1
        if stype == "n_hits":
            return state.hits_this_run >= spec_stop.get("n", 1)
        if stype == "budget_cap":
            return state.total_cost_vnd >= spec_stop.get("budget_vnd", 1_000_000)
        if stype == "k_draws_escape":
            k = spec_stop.get("k", 50)
            return state.draws_played >= k and state.hits_this_run == 0
        if stype == "combined":
            # Combined stop: stop on any_tier_hit OR budget_cap OR k_draws_escape
            if state.hits_this_run >= 1:
                return True
            if state.total_cost_vnd >= spec_stop.get("budget_vnd", 5_000_000):
                return True
            if state.draws_played >= spec_stop.get("k", 100):
                return True
            return False
    return False


# ═══════════════════════════════════════════════════════════════
# Simulation engine
# ═══════════════════════════════════════════════════════════════

def simulate_run(spec: dict, adapter: ProductAdapter, history, start_idx: int,
                 end_idx: int, seed: int) -> RunState:
    random.seed(seed)
    np.random.seed(seed)

    state = RunState()
    persistent_cache: dict = {}
    rotate_idx = 0

    for i in range(start_idx, end_idx):
        if _should_stop(spec["stop_condition"], state, spec["duration"]):
            state.stopped_early_at = i
            break

        if not _should_play_draw(spec["time_frequency"], state, adapter, history, i):
            continue

        # Generate ticket
        try:
            ticket = _resolve_ticket(
                spec["selection"], adapter, history, i, persistent_cache, rotate_idx,
            )
            if not ticket:
                continue
        except Exception:
            continue

        rotate_idx += 1

        # Bet size (MVP: always 1)
        n_tickets = spec["bet_size"].get("n_tickets", 1)
        cost = n_tickets * adapter.ticket_price()

        # Evaluate
        result = adapter.evaluate(ticket, history, i)

        # Record
        state.draws_played += 1
        state.tickets_purchased += n_tickets
        state.total_cost_vnd += cost
        state.total_payout_vnd += result.prize_vnd
        state.per_draw_payout.append(result.prize_vnd)
        state.per_draw_hit.append(1 if result.hit else 0)
        state.cumulative_losses.append(state.total_cost_vnd - state.total_payout_vnd)

        if result.hit:
            state.hits_this_run += 1
            state.draws_since_last_hit = 0
            if state.first_hit_draw is None:
                state.first_hit_draw = state.draws_played
            if state.current_cold_streak > 0:
                state.running_streaks.append(state.current_cold_streak)
            state.current_cold_streak = 0
        else:
            state.consecutive_misses += 1
            state.draws_since_last_hit += 1
            state.current_cold_streak += 1

    if state.current_cold_streak > 0:
        state.running_streaks.append(state.current_cold_streak)
    return state


def aggregate_metrics(runs: list[RunState]) -> dict:
    all_payouts = [p for r in runs for p in r.per_draw_payout]
    all_hits = [h for r in runs for h in r.per_draw_hit]
    total_cost = sum(r.total_cost_vnd for r in runs)
    total_payout = sum(r.total_payout_vnd for r in runs)
    total_draws = sum(r.draws_played for r in runs)

    if total_draws == 0:
        return {"error": "no draws played"}

    e_payout = float(np.mean(all_payouts)) if all_payouts else 0.0
    p_hit = float(np.mean(all_hits)) if all_hits else 0.0
    roi = ((total_payout - total_cost) / total_cost * 100) if total_cost > 0 else 0.0

    # Sharpe — treat each draw as one "period" and use per-draw profit
    profits = [p - TICKET_PRICE_VND for p in all_payouts]
    sharpe = 0.0
    if len(profits) > 1:
        std = float(np.std(profits, ddof=1))
        if std > 0:
            sharpe = (float(np.mean(profits)) / std) * float(np.sqrt(52))

    # Max drawdown per run → worst across runs
    max_dd = 0
    for r in runs:
        if not r.cumulative_losses:
            continue
        peak = 0
        for cl in r.cumulative_losses:
            peak = max(peak, cl)
            dd = cl - peak + peak  # equivalent: dd = cl - peak → negative, abs
            # actually cumulative_losses is loss (positive going up on losses)
            # drawdown here = difference from minimum (peak of equity from top)
        # Simpler: worst cumulative loss in this run
        max_dd = max(max_dd, max(r.cumulative_losses))

    # Ticks to first hit — distribution across runs
    first_hits = [r.first_hit_draw for r in runs if r.first_hit_draw is not None]
    thf = {}
    if first_hits:
        thf = {
            "p25": int(np.percentile(first_hits, 25)),
            "p50": int(np.percentile(first_hits, 50)),
            "p75": int(np.percentile(first_hits, 75)),
            "never_hit_runs": sum(1 for r in runs if r.first_hit_draw is None),
        }
    else:
        thf = {"p25": None, "p50": None, "p75": None, "never_hit_runs": len(runs)}

    # Ruin probability — for each budget, fraction of runs where cumulative loss > B within N draws
    ruin = {}
    for B in RUIN_BUDGETS_VND:
        ruined = 0
        for r in runs:
            # Find first index where cumulative_losses exceeds B, within RUIN_WINDOW_N draws
            found = False
            for i, cl in enumerate(r.cumulative_losses[:RUIN_WINDOW_N]):
                if cl > B:
                    found = True
                    break
            if found:
                ruined += 1
        ruin[f"B{B}_N{RUIN_WINDOW_N}"] = ruined / len(runs) if runs else 0.0

    # Pain streak — fraction of runs with at least 1 cold streak ≥ K
    pain = {}
    for K in PAIN_STREAK_THRESHOLDS:
        has_streak = sum(1 for r in runs if any(s >= K for s in r.running_streaks))
        pain[f"p_ge{K}"] = has_streak / len(runs) if runs else 0.0

    # Best single hit / cost ratio
    best = 0.0
    for p in all_payouts:
        if p > 0:
            best = max(best, p / TICKET_PRICE_VND)

    variance_norm = (float(np.std(all_payouts, ddof=1)) / e_payout) if e_payout > 0 and len(all_payouts) > 1 else 0.0

    return {
        "n_runs": len(runs),
        "total_draws": total_draws,
        "total_cost_vnd": int(total_cost),
        "total_payout_vnd": int(total_payout),
        "e_payout_per_draw_vnd": round(e_payout, 2),
        "p_any_hit_per_draw": round(p_hit, 4),
        "roi_pct": round(roi, 2),
        "sharpe_ratio": round(sharpe, 4),
        "max_drawdown_vnd": int(max_dd),
        "variance_norm": round(variance_norm, 3),
        "ticks_to_first_hit": thf,
        "ruin_prob": ruin,
        "pain_streak": pain,
        "best_single_hit_ratio": round(best, 2),
    }


# ═══════════════════════════════════════════════════════════════
# Per-method runner
# ═══════════════════════════════════════════════════════════════

def evaluate_method_on_product(spec: dict, product_key: str,
                                seg_config: dict = None) -> dict:
    """Run N_RUNS simulations on 4 segments (full/half1/half2/forward)."""
    adapter = make_adapter(product_key)
    history = adapter.load_history()
    n = adapter.history_len(history)
    min_start = 50  # warmup for strategy fit
    midpoint = n // 2
    forward_start = max(n - FORWARD_WINDOW, min_start)

    segments = seg_config or {
        "full": (min_start, n),
        "half1": (min_start, midpoint),
        "half2": (midpoint, n),
        "forward": (forward_start, n),
    }

    result = {}
    for seg_name, (s, e) in segments.items():
        runs: list[RunState] = []
        for run_idx in range(N_RUNS):
            seed = SEED_BASE + run_idx + hash(spec.get("method_id", "")) % 10_000
            rs = simulate_run(spec, adapter, history, s, e, seed)
            runs.append(rs)
        metrics = aggregate_metrics(runs)
        metrics["segment"] = seg_name
        metrics["start_idx"] = s
        metrics["end_idx"] = e
        result[seg_name] = metrics
    return result


# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════

def load_method_specs() -> list[dict]:
    specs = []
    for f in sorted(METHODS_DIR.glob("*.json")):
        spec = json.loads(f.read_text())
        specs.append(spec)
    return specs


def applicable_products(spec: dict) -> list[str]:
    """Some methods only apply to certain products (e.g., E4 jackpot only for 6/55 + 6/45)."""
    restrict = spec.get("applicable_products")
    if restrict:
        return [p for p in restrict if p in PRODUCT_KEYS]
    return PRODUCT_KEYS


def main():
    if not METHODS_DIR.exists():
        print(f"ERROR: method specs dir not found: {METHODS_DIR}")
        return 1

    specs = load_method_specs()
    print(f"Loaded {len(specs)} method specs from {METHODS_DIR}")

    output = {
        "cycle": 25,
        "pre_reg": "proposals/cycle25_method_evaluation_framework.md",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "constants": {
            "n_runs": N_RUNS,
            "seed_base": SEED_BASE,
            "forward_window": FORWARD_WINDOW,
            "ticket_price_vnd": TICKET_PRICE_VND,
            "pain_streak_thresholds": PAIN_STREAK_THRESHOLDS,
            "ruin_budgets_vnd": RUIN_BUDGETS_VND,
            "ruin_window_n": RUIN_WINDOW_N,
        },
        "composite_weights": COMPOSITE_WEIGHTS,
        "methods": [],
    }

    t_start = time.time()
    for spec in specs:
        mid = spec["method_id"]
        print(f"\n{'═' * 90}")
        print(f"  METHOD: {mid}  —  {spec.get('description', '')}")
        print(f"{'═' * 90}")

        method_entry = {
            "method_id": mid,
            "description": spec.get("description", ""),
            "spec": spec,
            "products": {},
        }

        for product in applicable_products(spec):
            print(f"  ▸ {product}", end=" ", flush=True)
            t0 = time.time()
            try:
                segs = evaluate_method_on_product(spec, product)
                elapsed = time.time() - t0
                full_seg = segs.get("full", {})
                roi = full_seg.get("roi_pct")
                phit = full_seg.get("p_any_hit_per_draw")
                if isinstance(roi, (int, float)) and isinstance(phit, (int, float)):
                    print(f"roi={roi:+.1f}%  P(hit)={phit:.1%}  T={elapsed:.1f}s")
                else:
                    print(f"no-numeric-result  T={elapsed:.1f}s")
                method_entry["products"][product] = segs
            except Exception as ex:
                print(f"ERROR: {ex}")
                method_entry["products"][product] = {"error": str(ex)}

        output["methods"].append(method_entry)

    output["total_elapsed_s"] = round(time.time() - t_start, 2)

    OUTPUT_FILE.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"\n✓ Wrote {OUTPUT_FILE}  (total {output['total_elapsed_s']}s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

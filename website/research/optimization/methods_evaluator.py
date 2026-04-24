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
# Default methods dir; can be overridden via --methods-dir CLI flag
DEFAULT_METHODS_DIR = THIS_DIR / "cycle25_methods"
DEFAULT_OUTPUT_FILE = THIS_DIR / "cycle25_results.json"
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

    def select_via_strategy(self, strategy_name, strategy_params, history, target_idx, num_count_override=None):
        strat = _matrix_strategy(strategy_name, strategy_params)
        row = history.iloc[target_idx]
        train = history.iloc[:target_idx]
        nc = num_count_override if num_count_override is not None else self.cfg["num_count"]
        return strat.predict(
            train, row["date"], self.cfg["min_val"], self.cfg["max_val"], nc
        )

    def random_ticket(self, history, target_idx, num_count_override=None):
        nc = num_count_override if num_count_override is not None else self.cfg["num_count"]
        return sorted(random.sample(
            range(self.cfg["min_val"], self.cfg["max_val"] + 1),
            nc,
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
    per_draw_cost: list = field(default_factory=list)  # supports multi-ticket bundles
    per_draw_hit: list = field(default_factory=list)
    first_hit_draw: Optional[int] = None
    running_streaks: list = field(default_factory=list)  # finalized cold-streak lengths
    current_cold_streak: int = 0
    stopped_early_at: Optional[int] = None  # index where stop fired
    # Chu kỳ 27 — D6 compounding support
    bet_multiplier: int = 1           # current compounding multiplier (×1 base)
    max_multiplier_reached: int = 1   # max observed across run
    cap_hits: int = 0                 # times multiplier hit the cap
    last_was_hit: Optional[bool] = None  # for martingale / anti-martingale decisions
    last_near_miss: bool = False      # for near-miss escalation


# ═══════════════════════════════════════════════════════════════
# Filter helpers (matrix — B5/B6/B10/B11 filter-based selections)
# ═══════════════════════════════════════════════════════════════

def _ticket_passes_filter(ticket: list, filter_spec: dict) -> bool:
    """Returns True if matrix ticket (list of ints) passes the filter."""
    if not filter_spec:
        return True
    ftype = filter_spec.get("type", "none")

    if ftype == "sum_range":
        s = sum(ticket)
        return filter_spec["min"] <= s <= filter_spec["max"]

    if ftype == "parity_balanced":
        # Require count(odd) in [min_odd, max_odd]
        odd = sum(1 for n in ticket if n % 2 == 1)
        return filter_spec.get("min_odd", 0) <= odd <= filter_spec.get("max_odd", len(ticket))

    if ftype == "no_consecutive":
        srt = sorted(ticket)
        for a, b in zip(srt, srt[1:]):
            if b - a == 1:
                return False
        return True

    if ftype == "has_consecutive":
        srt = sorted(ticket)
        for a, b in zip(srt, srt[1:]):
            if b - a == 1:
                return True
        return False

    return True


def _resolve_ticket(spec_selection: dict, adapter: ProductAdapter,
                     history, target_idx: int,
                     persistent_cache: dict, algo_rotation_idx: int = 0):
    """Returns ticket per selection dimension, with optional post-filter retry (matrix)."""
    filter_spec = spec_selection.get("filter")
    max_retries = 50  # give up after too many rejections

    def _one_shot():
        return _resolve_ticket_raw(spec_selection, adapter, history, target_idx, persistent_cache, algo_rotation_idx)

    # Fast path: no filter
    if not filter_spec:
        return _one_shot()

    # Only apply filters to matrix tickets (list of ints)
    if not isinstance(adapter, MatrixAdapter):
        return _one_shot()

    for _ in range(max_retries):
        t = _one_shot()
        if _ticket_passes_filter(t, filter_spec):
            return t
    return t  # return last attempt even if filter violated


def _resolve_ticket_raw(spec_selection: dict, adapter: ProductAdapter,
                         history, target_idx: int,
                         persistent_cache: dict, algo_rotation_idx: int = 0):
    """Internal single-shot ticket resolution (no filter retry)."""
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


# ═══════════════════════════════════════════════════════════════
# Multi-ticket bet generation (Chu kỳ 26 extension)
# ═══════════════════════════════════════════════════════════════

def _select_k_numbers(spec_selection: dict, adapter: MatrixAdapter, history,
                      target_idx: int, k: int, persistent_cache: dict) -> list:
    """For wheeling: return K distinct numbers (not a full ticket).

    Uses algorithm to rank numbers, takes top-K; for random uses random.sample.
    """
    sel_type = spec_selection["type"]

    if sel_type == "random_fresh":
        return sorted(random.sample(
            range(adapter.cfg["min_val"], adapter.cfg["max_val"] + 1), k
        ))

    if sel_type in ("algorithm_fresh", "fixed_persistent", "algorithm_persistent"):
        algo = spec_selection.get("algorithm", "Freq_Hot")
        params = spec_selection.get("params", {})
        return sorted(adapter.select_via_strategy(
            algo, params, history, target_idx, num_count_override=k
        ))

    # Default fallback
    return sorted(random.sample(
        range(adapter.cfg["min_val"], adapter.cfg["max_val"] + 1), k
    ))


def _mirror_3d(num: str) -> str:
    """999-complement mirror for 3-digit number."""
    n = int(num)
    return f"{(999 - n) % 1000:03d}"


def _generate_ticket_bundle(spec: dict, adapter: ProductAdapter, history,
                             target_idx: int, persistent_cache: dict,
                             rotate_idx: int) -> list:
    """Returns list of tickets for this draw per bet_size dimension.

    Each ticket is evaluated independently; bundle cost = N × ticket_price.
    """
    bet = spec.get("bet_size", {})
    btype = bet.get("type", "fixed")

    if btype == "fixed":
        n = bet.get("n_tickets", 1)
        return [_resolve_ticket(spec["selection"], adapter, history, target_idx,
                                persistent_cache, rotate_idx) for _ in range(n)]

    if btype == "full_wheel":
        if not isinstance(adapter, MatrixAdapter):
            raise ValueError("full_wheel only supports matrix products")
        from itertools import combinations
        k = bet.get("k_numbers", 7)
        k_nums = _select_k_numbers(spec["selection"], adapter, history,
                                    target_idx, k, persistent_cache)
        nc = adapter.cfg["num_count"]
        return [sorted(c) for c in combinations(k_nums, nc)]

    if btype == "permutation_all":
        # 3D: pick 1 number via selection, emit all distinct permutations
        from itertools import permutations
        base = _resolve_ticket(spec["selection"], adapter, history, target_idx,
                               persistent_cache, rotate_idx)
        if isinstance(base, list):
            # 3D Pro (A, B) — permute both together
            if len(base) == 2:
                return [list(p) for p in set(permutations(base))]
            return [base]
        # single 3-digit string
        return list(set(["".join(p) for p in permutations(str(base))]))

    if btype == "paired_mirror":
        base = _resolve_ticket(spec["selection"], adapter, history, target_idx,
                               persistent_cache, rotate_idx)
        if isinstance(base, str):
            return [base, _mirror_3d(base)]
        return [base]

    if btype == "forward_reverse_hedge":
        # 3D Pro: pick (A, B), emit [(A, B), (B, A)]
        base = _resolve_ticket(spec["selection"], adapter, history, target_idx,
                               persistent_cache, rotate_idx)
        if isinstance(base, list) and len(base) == 2:
            return [base, [base[1], base[0]]]
        return [base]

    if btype == "a_equal_b":
        # 3D Pro only: pick 1 number, emit ticket = [X, X]
        base = _resolve_ticket(spec["selection"], adapter, history, target_idx,
                               persistent_cache, rotate_idx)
        if isinstance(base, str):
            return [[base, base]]
        if isinstance(base, list) and len(base) >= 1:
            x = base[0]
            return [[x, x]]
        return [base]

    if btype == "key_wheel":
        # Matrix: key_numbers fixed + rotate through others
        if not isinstance(adapter, MatrixAdapter):
            raise ValueError("key_wheel only supports matrix products")
        from itertools import combinations
        key_nums = bet.get("key_numbers", [])
        rotate_pool_size = bet.get("rotate_pool_size", 7)
        nc = adapter.cfg["num_count"]
        needed_from_pool = nc - len(key_nums)
        # Pick rotate pool via selection
        pool = _select_k_numbers(spec["selection"], adapter, history,
                                  target_idx, rotate_pool_size, persistent_cache)
        # Avoid overlap with key_nums
        pool = [p for p in pool if p not in key_nums]
        if len(pool) < needed_from_pool:
            return [sorted(key_nums + pool)]  # can't build wheel, fallback
        return [sorted(list(key_nums) + list(combo))
                for combo in combinations(pool, needed_from_pool)]

    # Default
    return [_resolve_ticket(spec["selection"], adapter, history, target_idx,
                            persistent_cache, rotate_idx)]


def _should_play_draw(spec_freq: dict, state: RunState, adapter: ProductAdapter,
                      history, target_idx: int) -> bool:
    """Time-frequency filter."""
    ftype = spec_freq.get("type", "every_draw")
    if ftype == "every_draw":
        return True
    if ftype == "alternate":
        return target_idx % 2 == 0
    if ftype == "every_k":
        k = spec_freq.get("k", 3)
        return (target_idx % k) == 0
    if ftype == "weekly_calendar":
        # Chu kỳ 27: play only on specific weekdays. Uses draw date if available.
        # Matrix: df.iloc[target_idx]["date"] → date obj; 3D: draws[target_idx]["date"] str
        allowed = set(spec_freq.get("weekdays", [0, 1, 2, 3, 4]))  # 0=Mon, 6=Sun
        try:
            if isinstance(adapter, MatrixAdapter):
                row = history.iloc[target_idx]
                d = row["date"]
                wd = d.weekday() if hasattr(d, "weekday") else 0
            else:
                import datetime as _dt
                dstr = str(history[target_idx]["date"])
                d = _dt.datetime.strptime(dstr[:10], "%Y-%m-%d").date()
                wd = d.weekday()
            return wd in allowed
        except Exception:
            return True
    if ftype == "jackpot_triggered":
        # E4: play only if no jackpot hit in the last K draws (proxy until data available)
        return True  # TODO: implement proper jackpot-rollover logic when Vietlott data extended
    return True


def _compute_bet_multiplier(spec_compound: dict, state: RunState) -> int:
    """Compute current bet multiplier based on compounding type and prior outcome.

    Called BEFORE the current draw's ticket generation.
    """
    ctype = spec_compound.get("type", "flat")
    if ctype == "flat":
        return 1

    max_mult = spec_compound.get("max_multiplier", 32)

    if ctype == "martingale":
        # Double after loss; reset after win
        if state.last_was_hit is None:
            return 1  # first draw
        if state.last_was_hit:
            return 1  # reset
        new_mult = min(state.bet_multiplier * 2, max_mult)
        return new_mult

    if ctype == "anti_martingale":
        # Double after win; reset after loss
        if state.last_was_hit is None:
            return 1
        if state.last_was_hit:
            new_mult = min(state.bet_multiplier * 2, max_mult)
            return new_mult
        return 1  # reset on loss

    if ctype == "near_miss_escalation":
        # Double only after a near-miss; reset otherwise
        if state.last_near_miss:
            new_mult = min(state.bet_multiplier * 2, max_mult)
            return new_mult
        return 1

    return 1


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

        # Generate ticket bundle (1 or more tickets per draw)
        try:
            tickets = _generate_ticket_bundle(
                spec, adapter, history, i, persistent_cache, rotate_idx,
            )
            if not tickets:
                continue
        except Exception:
            continue

        rotate_idx += 1

        # Chu kỳ 27 — compute bet multiplier from D6 compounding BEFORE this draw
        state.bet_multiplier = _compute_bet_multiplier(
            spec.get("compounding", {"type": "flat"}), state
        )
        state.max_multiplier_reached = max(state.max_multiplier_reached, state.bet_multiplier)
        max_mult_cap = spec.get("compounding", {}).get("max_multiplier", 32)
        if state.bet_multiplier >= max_mult_cap and spec.get("compounding", {}).get("type", "flat") != "flat":
            state.cap_hits += 1

        # Evaluate each ticket; aggregate prize + hit-any + near-miss detection
        n_tickets = len(tickets)
        cost = n_tickets * adapter.ticket_price() * state.bet_multiplier
        draw_payout = 0
        any_hit = False
        near_miss_this_draw = False
        for t in tickets:
            try:
                r = adapter.evaluate(t, history, i)
            except Exception:
                continue
            # Scale prize by bet multiplier (wager × payout ratio stays constant)
            draw_payout += r.prize_vnd * state.bet_multiplier
            if r.hit:
                any_hit = True
            # Near-miss detection for matrix: 3-match when 5-need (5/35) or 4-match when 6-need
            if isinstance(adapter, MatrixAdapter) and not r.hit:
                row = history.iloc[i]
                actual = set(row["result"][:adapter.cfg["num_count"]])
                m = len(set(t) & actual)
                # Define near-miss as (main_count - 2) match for matrix
                # e.g., 6/55 near-miss = 4-match; 5/35 near-miss = 3-match
                near_threshold = adapter.cfg["num_count"] - 2
                if m == near_threshold:
                    near_miss_this_draw = True

        # Record
        state.draws_played += 1
        state.tickets_purchased += n_tickets
        state.total_cost_vnd += cost
        state.total_payout_vnd += draw_payout
        state.per_draw_payout.append(draw_payout)
        state.per_draw_cost.append(cost)
        state.per_draw_hit.append(1 if any_hit else 0)
        state.cumulative_losses.append(state.total_cost_vnd - state.total_payout_vnd)
        state.last_was_hit = any_hit
        state.last_near_miss = near_miss_this_draw

        if any_hit:
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

    # Sharpe — per-draw profit = payout - cost (cost may vary across bundle sizes)
    all_costs = [c for r in runs for c in r.per_draw_cost]
    if len(all_costs) == len(all_payouts):
        profits = [p - c for p, c in zip(all_payouts, all_costs)]
    else:
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

    # Chu kỳ 27 — compounding-specific metrics
    max_mults = [r.max_multiplier_reached for r in runs]
    cap_hit_runs = sum(1 for r in runs if r.cap_hits > 0)
    compounding_metrics = {
        "max_multiplier_reached_p50": int(np.percentile(max_mults, 50)) if max_mults else 1,
        "max_multiplier_reached_p95": int(np.percentile(max_mults, 95)) if max_mults else 1,
        "pct_runs_hit_cap": round(cap_hit_runs / len(runs), 4) if runs else 0.0,
    }

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
        "compounding": compounding_metrics,
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

def load_method_specs(methods_dir: Path) -> list[dict]:
    specs = []
    for f in sorted(methods_dir.glob("*.json")):
        spec = json.loads(f.read_text())
        specs.append(spec)
    return specs


def applicable_products(spec: dict) -> list[str]:
    """Some methods only apply to certain products (e.g., E4 jackpot only for 6/55 + 6/45)."""
    restrict = spec.get("applicable_products")
    if restrict:
        return [p for p in restrict if p in PRODUCT_KEYS]
    return PRODUCT_KEYS


def main(methods_dir: Path = None, output_file: Path = None, cycle_num: int = 25, pre_reg: str = "proposals/cycle25_method_evaluation_framework.md"):
    methods_dir = methods_dir or DEFAULT_METHODS_DIR
    output_file = output_file or DEFAULT_OUTPUT_FILE
    if not methods_dir.exists():
        print(f"ERROR: method specs dir not found: {methods_dir}")
        return 1

    specs = load_method_specs(methods_dir)
    print(f"Loaded {len(specs)} method specs from {methods_dir}")

    output = {
        "cycle": cycle_num,
        "pre_reg": pre_reg,
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

    output_file.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"\n✓ Wrote {output_file}  (total {output['total_elapsed_s']}s)")
    return 0


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--methods-dir", type=Path, default=DEFAULT_METHODS_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_FILE)
    parser.add_argument("--cycle", type=int, default=25)
    parser.add_argument("--pre-reg", type=str, default="proposals/cycle25_method_evaluation_framework.md")
    args = parser.parse_args()
    raise SystemExit(main(args.methods_dir, args.output, args.cycle, args.pre_reg))

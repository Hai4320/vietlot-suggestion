"""Max 3D Pro ticket-level evaluator for research backtests.

Ports the canonical 8-tier resolver from
`src/vietlott/check_rate/evaluators/p3d_pro.py` into a self-contained module
usable by `website/research/3d/*` scripts (different package root, different
draw dict shape).

Semantic: a Max 3D Pro ticket = 2 ordered 3-digit numbers (A, B). This module
takes a list of predicted 3-digit strings, pairs **adjacent predictions** into
tickets ((pred[0], pred[1]), (pred[2], pred[3]), ...), and resolves each
ticket's prize via the mutually-exclusive 8-tier hierarchy with A=B doubling.

Drop-in for `advanced_backtest.evaluate_prediction(predicted, draw, prize_map)`
when scoring `max_3d_pro` strategies. Ignores `prize_map` argument (uses
canonical MAX_3D_PRO_TIERS) — kept for signature compatibility.

See plans/max3d_pro_backtest_audit.md for motivation.
"""
from __future__ import annotations

from typing import Dict, List

MAX_3D_PRO_TIERS: Dict[str, int] = {
    "Giải Đặc biệt": 2_000_000_000,
    "Giải Phụ Đặc biệt": 400_000_000,
    "Giải Nhất": 30_000_000,
    "Giải Nhì": 10_000_000,
    "Giải Ba": 4_000_000,
    "Giải Tư": 1_000_000,
    "Giải Năm": 100_000,
    "Giải Sáu": 40_000,
}

MAX_3D_PRO_DB_COMBINED_NAME = "Giải Đặc biệt"  # aligns with canonical check_rate PrizeRule
MAX_3D_PRO_DB_COMBINED_AMOUNT = 2_400_000_000

TIER_ORDER_DISPLAY = [
    "Giải Đặc biệt",
    "Giải Phụ Đặc biệt",
    "Giải Nhất",
    "Giải Nhì",
    "Giải Ba",
    "Giải Tư",
    "Giải Năm",
    "Giải Sáu",
]


def resolve_3d_pro_ticket(
    a: str,
    b: str,
    specials: List[str],
    firsts: List[str],
    seconds: List[str],
    thirds: List[str],
) -> tuple[str | None, int]:
    """Return (tier_name, amount_vnd) or (None, 0). Mirrors check_rate evaluator."""
    same = a == b
    s0 = specials[0] if len(specials) > 0 else None
    s1 = specials[1] if len(specials) > 1 else None
    first_set = set(firsts)
    second_set = set(seconds)
    third_set = set(thirds)
    special_set = set(specials)
    all_20 = special_set | first_set | second_set | third_set

    if s0 is not None and s1 is not None and a == s0 and b == s1:
        if same and s0 == s1:
            return MAX_3D_PRO_DB_COMBINED_NAME, MAX_3D_PRO_DB_COMBINED_AMOUNT
        return "Giải Đặc biệt", MAX_3D_PRO_TIERS["Giải Đặc biệt"]

    if s0 is not None and s1 is not None and a == s1 and b == s0:
        return "Giải Phụ Đặc biệt", MAX_3D_PRO_TIERS["Giải Phụ Đặc biệt"]

    def dbl(name: str) -> tuple[str, int]:
        amt = MAX_3D_PRO_TIERS[name]
        return name, amt * 2 if same else amt

    if a in first_set and b in first_set:
        return dbl("Giải Nhất")
    if a in second_set and b in second_set:
        return dbl("Giải Nhì")
    if a in third_set and b in third_set:
        return dbl("Giải Ba")

    a_in_20 = a in all_20
    b_in_20 = b in all_20
    if a_in_20 and b_in_20:
        return dbl("Giải Tư")

    if same:
        return None, 0

    if a_in_20 and not b_in_20:
        hit = a
    elif b_in_20 and not a_in_20:
        hit = b
    else:
        return None, 0

    if hit in special_set:
        return "Giải Năm", MAX_3D_PRO_TIERS["Giải Năm"]
    return "Giải Sáu", MAX_3D_PRO_TIERS["Giải Sáu"]


def evaluate_prediction_3dpro(predicted: List[str], draw: Dict, prize_map: Dict | None = None) -> Dict:
    """Drop-in replacement for `evaluate_prediction` when scoring Max 3D Pro.

    Pairs predicted[0::2], predicted[1::2] into tickets (A, B). Each ticket
    gets resolved independently; `total_prize` = sum of each ticket's prize.

    Returns same shape as `advanced_backtest.evaluate_prediction`:
        {"exact_count": N_hits, "matches": [...], "total_prize": int}

    `exact_count` here = number of tickets that won ANY tier (0..N_tickets).
    This is the per-ticket win count; divide by N_tickets for win rate.
    """
    del prize_map  # signature compat; we use canonical MAX_3D_PRO_TIERS

    result = draw["result"]
    specials = result.get("Giải Đặc biệt", [])
    firsts = result.get("Giải Nhất", [])
    seconds = result.get("Giải Nhì", [])
    thirds = result.get("Giải ba", [])

    matches: list[dict] = []
    total_prize = 0

    n = len(predicted)
    pair_count = n // 2
    for i in range(pair_count):
        a = predicted[2 * i]
        b = predicted[2 * i + 1]
        tier_name, amount = resolve_3d_pro_ticket(a, b, specials, firsts, seconds, thirds)
        if tier_name is not None:
            matches.append({"number": f"{a}+{b}", "tier": tier_name})
            total_prize += amount

    return {
        "exact_count": len(matches),
        "matches": matches,
        "total_prize": total_prize,
        "n_tickets": pair_count,  # extra metadata for the caller
    }

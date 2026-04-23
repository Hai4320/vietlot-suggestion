"""Vietlott prize tables — source of truth for all check-rate evaluators.

Jackpot amounts use published minimum (not actual rolling value) — for algorithm
comparison purposes ROI is a relative metric.
"""

from __future__ import annotations

import attr

TICKET_COST_VND = 10_000


@attr.define(frozen=True)
class PrizeRule:
    name: str
    amount: int


# ── Power 5/35 ────────────────────────────────────────────────────────────
# key: (match_main, special_match) -> rule; encourage handled by resolver
_POWER_535_RULES: dict[tuple[int, bool], PrizeRule] = {
    (5, True): PrizeRule("Jackpot", 6_000_000_000),
    (5, False): PrizeRule("2nd", 5_000_000),
    (4, True): PrizeRule("3rd", 500_000),
    (4, False): PrizeRule("4th", 100_000),
    (3, True): PrizeRule("5th", 30_000),
}
_POWER_535_ENCOURAGE = PrizeRule("Encourage", 10_000)


def resolve_power_535(match_main: int, special_match: bool) -> PrizeRule | None:
    rule = _POWER_535_RULES.get((match_main, special_match))
    if rule is not None:
        return rule
    # Encourage: 3 main no special, OR 0-2 main + special
    if (match_main == 3 and not special_match) or (match_main in (0, 1, 2) and special_match):
        return _POWER_535_ENCOURAGE
    return None


# ── Power 6/45 (Mega) ──────────────────────────────────────────────────────
_POWER_645_RULES: dict[int, PrizeRule] = {
    6: PrizeRule("Jackpot", 12_000_000_000),
    5: PrizeRule("1st", 10_000_000),
    4: PrizeRule("2nd", 300_000),
    3: PrizeRule("3rd", 30_000),
}


def resolve_power_645(match_main: int) -> PrizeRule | None:
    return _POWER_645_RULES.get(match_main)


# ── Power 6/55 ─────────────────────────────────────────────────────────────
# Bonus ball is drawn from the 49 remaining after the 6 main, so match_main==6
# implies bonus_match is impossible.
def resolve_power_655(match_main: int, bonus_match: bool) -> PrizeRule | None:
    if match_main == 6:
        return PrizeRule("Jackpot 1", 30_000_000_000)
    if match_main == 5 and bonus_match:
        return PrizeRule("Jackpot 2", 3_000_000_000)
    if match_main == 5:
        return PrizeRule("1st", 40_000_000)
    if match_main == 4:
        return PrizeRule("2nd", 500_000)
    if match_main == 3:
        return PrizeRule("3rd", 50_000)
    return None


# ── Max 3D ─────────────────────────────────────────────────────────────────
MAX_3D_TIERS: dict[str, PrizeRule] = {
    "Giải Đặc biệt": PrizeRule("Giải Đặc biệt", 1_000_000),
    "Giải Nhất": PrizeRule("Giải Nhất", 350_000),
    "Giải Nhì": PrizeRule("Giải Nhì", 210_000),
    "Giải ba": PrizeRule("Giải ba", 100_000),
}
MAX_3D_LAST2_PRIZE = PrizeRule("KK 2 số cuối", 100_000)


# ── Max 3D Pro ─────────────────────────────────────────────────────────────
# Placeholder amounts — verify against quy chế Vietlott before Phase 5 merge.
MAX_3D_PRO_TIERS: dict[str, PrizeRule] = {
    "Giải Đặc biệt": PrizeRule("Giải Đặc biệt", 2_000_000),
    "Giải Nhất": PrizeRule("Giải Nhất", 500_000),
    "Giải Nhì": PrizeRule("Giải Nhì", 300_000),
    "Giải ba": PrizeRule("Giải ba", 200_000),
}

"""Max 3D evaluator — tier-based (not subset match).

Semantic difference from Power products:
- Ticket = ONE 3-digit zero-padded number (e.g. "015"), not a set
- Draw = 20 winning 3-digit numbers split across 4 tiers
- Match: ticket ∈ tier list → win that tier's prize
- Multi-tier hit (same number in Đặc biệt + Nhất same draw): cộng dồn
  (per user-confirmed decision 2026-04-23, plan §9 #3)
- KK 2 số cuối: ticket's last 2 digits match last 2 digits of any Đặc biệt
  number, AND ticket is NOT itself that Đặc biệt number
"""

from __future__ import annotations

import re
from collections import Counter

from vietlott.check_rate.evaluators.base import BaseEvaluator, register
from vietlott.check_rate.models import EvalResult, HistoryMatch, PerDrawHit, Ticket
from vietlott.config.prize_tables import (
    MAX_3D_LAST2_PRIZE,
    MAX_3D_TIERS,
    TICKET_COST_VND,
)

GAME = "3d"
NUMBER_REGEX = re.compile(r"^\d{3}$")

# Vietnamese tier names, ordered high → low prize. Used for "best tier per play"
# in match_dist and for iteration consistency across Python/TS.
TIER_ORDER = ["Giải Đặc biệt", "Giải Nhất", "Giải Nhì", "Giải ba"]
KK_TIER_NAME = MAX_3D_LAST2_PRIZE.name  # "KK 2 số cuối"
NO_HIT = "Không trúng"

# build_data.py maps Vietnamese → English for website JSON — normalize back
_EN_TO_VN = {
    "special": "Giải Đặc biệt",
    "first": "Giải Nhất",
    "second": "Giải Nhì",
    "third": "Giải ba",
}


@register(GAME)
class P3dEvaluator(BaseEvaluator):
    def parse_numbers(self, ticket: Ticket) -> str:
        s = ticket.numbers_raw.strip()
        if not NUMBER_REGEX.match(s):
            raise ValueError(f"ticket #{ticket.ticket_no}: 3D number must be exactly 3 digits (got '{s}')")
        if ticket.special is not None:
            raise ValueError(f"ticket #{ticket.ticket_no}: 3D does not take a special number")
        return s

    def evaluate(self, tickets: list[Ticket], draws: list[dict]) -> EvalResult:
        parsed = [(t, self.parse_numbers(t)) for t in tickets]
        match_dist: Counter[str] = Counter()
        prize_counter: Counter[str] = Counter()
        prize_winnings: Counter[str] = Counter()
        per_draw_hits: list[PerDrawHit] = []

        for draw in draws:
            tiers = _extract_tiers(draw)
            for ticket, num in parsed:
                hits = _evaluate_play(num, tiers)  # list of (tier_name, amount)
                play_total = sum(a for _, a in hits)
                best_tier = _best_tier(hits) or NO_HIT
                match_dist[best_tier] += 1

                for tier_name, amt in hits:
                    prize_counter[tier_name] += 1
                    prize_winnings[tier_name] += amt

                per_draw_hits.append(
                    PerDrawHit(
                        date=str(draw["date"]),
                        draw_id=str(draw["id"]),
                        ticket_no=ticket.ticket_no,
                        prize=best_tier if hits else None,
                        amount=play_total,
                        detail={"hits": [t for t, _ in hits]},
                    )
                )

        n_tickets = len(tickets)
        n_draws = len(draws)
        return EvalResult(
            game=GAME,
            algorithm=tickets[0].algorithm if tickets else "",
            n_tickets=n_tickets,
            n_draws=n_draws,
            match_dist=dict(match_dist),
            prize_counter=dict(prize_counter),
            prize_winnings=dict(prize_winnings),
            total_cost=n_tickets * n_draws * TICKET_COST_VND,
            total_winnings=sum(prize_winnings.values()),
            per_draw_hits=per_draw_hits,
        )

    def history_match(self, ticket: Ticket, draws: list[dict]) -> HistoryMatch:
        num = self.parse_numbers(ticket)
        by_tier: dict[str, int] = {t: 0 for t in TIER_ORDER}
        occurrences: list[tuple[str, str, str]] = []
        for draw in draws:
            tiers = _extract_tiers(draw)
            for tier_name in TIER_ORDER:
                count = sum(1 for n in tiers.get(tier_name, []) if n == num)
                if count > 0:
                    by_tier[tier_name] += count
                    for _ in range(count):
                        occurrences.append((str(draw["date"]), str(draw["id"]), tier_name))
        return HistoryMatch(
            ticket_no=ticket.ticket_no,
            numbers_display=num,
            total_hits=sum(by_tier.values()),
            by_tier=by_tier,
            occurrences=occurrences,
        )


def _extract_tiers(draw: dict) -> dict[str, list[str]]:
    """Normalize tier dict across JSONL (Vietnamese keys) and website JSON
    (English keys from build_data.py). Returns Vietnamese keys.
    """
    result = draw["result"]
    if not isinstance(result, dict):
        raise ValueError(f"3D draw {draw.get('id')} result must be a tier dict, got {type(result)}")
    if "Giải Đặc biệt" in result:
        return {k: [str(n) for n in v] for k, v in result.items() if k in TIER_ORDER}
    out: dict[str, list[str]] = {}
    for en, vn in _EN_TO_VN.items():
        if en in result:
            out[vn] = [str(n) for n in result[en]]
    return out


def _evaluate_play(ticket_num: str, tiers: dict[str, list[str]]) -> list[tuple[str, int]]:
    """Return all tier hits for one (ticket, draw) pair. Multi-tier hits
    accumulate (cộng dồn). KK 2 số cuối is mutually exclusive with an exact
    Đặc biệt hit for the same special number.
    """
    hits: list[tuple[str, int]] = []
    for tier_name in TIER_ORDER:
        rule = MAX_3D_TIERS.get(tier_name)
        if rule is None:
            continue
        for n in tiers.get(tier_name, []):
            if n == ticket_num:
                hits.append((tier_name, rule.amount))

    # KK 2 số cuối: per Đặc biệt number that the ticket does NOT fully match
    special_nums = tiers.get("Giải Đặc biệt", [])
    for sp in special_nums:
        if sp != ticket_num and sp[-2:] == ticket_num[-2:]:
            hits.append((KK_TIER_NAME, MAX_3D_LAST2_PRIZE.amount))
    return hits


def _best_tier(hits: list[tuple[str, int]]) -> str | None:
    """Return the highest-prize tier name among hits (for match_dist)."""
    if not hits:
        return None
    order = {t: i for i, t in enumerate(TIER_ORDER)}
    order[KK_TIER_NAME] = len(TIER_ORDER)
    return min((t for t, _ in hits), key=lambda t: order.get(t, 999))

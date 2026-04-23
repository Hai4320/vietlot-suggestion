"""Max 3D Pro evaluator — 2 ordered 3-digit numbers per ticket, 8-tier hierarchy.

Key semantic differences from Max 3D:
- Ticket = (A, B), two ordered 3-digit numbers (CSV `numbers = "015 017"`).
- Đặc biệt requires A=DB[0] AND B=DB[1] (position-sensitive).
- Phụ Đặc biệt = reverse order (A=DB[1] AND B=DB[0]).
- Nhất/Nhì/Ba = both numbers in the same tier list (set membership).
- Tư = both numbers in the 20-number universe, but not qualifying any higher tier.
- Năm / Sáu = exactly one position matches DB / (Nhất ∪ Nhì ∪ Ba), other misses all 20.
- A=B doubling: for A=B, prizes for Nhất–Sáu are doubled; Đặc biệt + Phụ
  Đặc biệt collapse into a single combined amount (2.4B).

See plans/max3d_pro_backtest_audit.md for why existing suggest rankings
on /max-3d-pro may have used the wrong reward model.
"""

from __future__ import annotations

import re
from collections import Counter

from vietlott.check_rate.evaluators.base import BaseEvaluator, register
from vietlott.check_rate.evaluators.p3d import _extract_tiers
from vietlott.check_rate.models import EvalResult, HistoryMatch, PerDrawHit, Ticket
from vietlott.config.prize_tables import (
    MAX_3D_PRO_DB_COMBINED,
    MAX_3D_PRO_TIERS,
    TICKET_COST_VND,
    PrizeRule,
)

GAME = "3d_pro"
NUMBER_REGEX = re.compile(r"^\d{3}$")

TIER_ORDER = [
    "Giải Đặc biệt",
    "Giải Phụ Đặc biệt",
    "Giải Nhất",
    "Giải Nhì",
    "Giải Ba",
    "Giải Tư",
    "Giải Năm",
    "Giải Sáu",
]
NO_HIT = "Không trúng"


@register(GAME)
class P3dProEvaluator(BaseEvaluator):
    def parse_numbers(self, ticket: Ticket) -> tuple[str, str]:
        parts = ticket.numbers_raw.split()
        if len(parts) != 2:
            raise ValueError(
                f"ticket #{ticket.ticket_no}: 3D Pro needs exactly 2 space-separated 3-digit numbers (got {len(parts)})"
            )
        a, b = parts[0], parts[1]
        for n in (a, b):
            if not NUMBER_REGEX.match(n):
                raise ValueError(f"ticket #{ticket.ticket_no}: each number must be exactly 3 digits (got '{n}')")
        if ticket.special is not None:
            raise ValueError(f"ticket #{ticket.ticket_no}: 3D Pro does not take a special number")
        return (a, b)

    def evaluate(self, tickets: list[Ticket], draws: list[dict]) -> EvalResult:
        parsed = [(t, self.parse_numbers(t)) for t in tickets]
        match_dist: Counter[str] = Counter()
        prize_counter: Counter[str] = Counter()
        prize_winnings: Counter[str] = Counter()
        per_draw_hits: list[PerDrawHit] = []

        for draw in draws:
            tiers = _extract_tiers(draw)
            specials = tiers.get("Giải Đặc biệt", [])
            firsts = tiers.get("Giải Nhất", [])
            seconds = tiers.get("Giải Nhì", [])
            thirds = tiers.get("Giải ba", [])  # p3d.py maps "Giải ba" (lowercase)

            for ticket, (a, b) in parsed:
                rule = resolve_3d_pro(a, b, specials, firsts, seconds, thirds)
                tier_name = rule.name if rule else NO_HIT
                match_dist[tier_name] += 1

                per_draw_hits.append(
                    PerDrawHit(
                        date=str(draw["date"]),
                        draw_id=str(draw["id"]),
                        ticket_no=ticket.ticket_no,
                        prize=rule.name if rule else None,
                        amount=rule.amount if rule else 0,
                        detail={"a": a, "b": b, "same": a == b},
                    )
                )
                if rule is not None:
                    prize_counter[rule.name] += 1
                    prize_winnings[rule.name] += rule.amount

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
        a, b = self.parse_numbers(ticket)
        by_tier: dict[str, int] = {t: 0 for t in TIER_ORDER}
        occurrences: list[tuple[str, str, str]] = []
        for draw in draws:
            tiers = _extract_tiers(draw)
            rule = resolve_3d_pro(
                a,
                b,
                tiers.get("Giải Đặc biệt", []),
                tiers.get("Giải Nhất", []),
                tiers.get("Giải Nhì", []),
                tiers.get("Giải ba", []),
            )
            if rule is not None:
                by_tier[rule.name] += 1
                occurrences.append((str(draw["date"]), str(draw["id"]), rule.name))
        display = f"{a} {b}" + (" (A=B)" if a == b else "")
        return HistoryMatch(
            ticket_no=ticket.ticket_no,
            numbers_display=display,
            total_hits=sum(by_tier.values()),
            by_tier=by_tier,
            occurrences=occurrences,
        )


def resolve_3d_pro(
    a: str,
    b: str,
    specials: list[str],
    firsts: list[str],
    seconds: list[str],
    thirds: list[str],
) -> PrizeRule | None:
    """Mutually-exclusive 8-tier resolver. Returns the highest tier rule or None.

    A=B doubling applied for tiers Nhất–Sáu; Đặc biệt ∪ Phụ Đặc biệt collapsed
    into combined (2.4B) when the draw's two specials happen to both equal X.
    """
    same = a == b
    s0 = specials[0] if len(specials) > 0 else None
    s1 = specials[1] if len(specials) > 1 else None
    first_set = set(firsts)
    second_set = set(seconds)
    third_set = set(thirds)
    special_set = set(specials)
    all_20 = special_set | first_set | second_set | third_set

    # Tier 1: Đặc biệt — order-sensitive exact match
    if s0 is not None and s1 is not None and a == s0 and b == s1:
        # A=B=X AND DB=(X,X) collapses Đặc biệt + Phụ Đặc biệt into combined 2.4B.
        # The `a == s0 and b == s1` branch catches this case (s0==s1==X).
        if same and s0 == s1:
            return MAX_3D_PRO_DB_COMBINED
        return MAX_3D_PRO_TIERS["Giải Đặc biệt"]

    # Tier 2: Phụ Đặc biệt — reverse order. For same A=B=X this is identical to
    # Đặc biệt check above; falls through only when A≠B.
    if s0 is not None and s1 is not None and a == s1 and b == s0:
        return MAX_3D_PRO_TIERS["Giải Phụ Đặc biệt"]

    # Tiers 3–5: Nhất / Nhì / Ba — both numbers in same tier list
    if a in first_set and b in first_set:
        return _double_if_same(MAX_3D_PRO_TIERS["Giải Nhất"], same)
    if a in second_set and b in second_set:
        return _double_if_same(MAX_3D_PRO_TIERS["Giải Nhì"], same)
    if a in third_set and b in third_set:
        return _double_if_same(MAX_3D_PRO_TIERS["Giải Ba"], same)

    # Tier 6: Tư — both in 20-number universe, not all in same tier
    a_in_20 = a in all_20
    b_in_20 = b in all_20
    if a_in_20 and b_in_20:
        return _double_if_same(MAX_3D_PRO_TIERS["Giải Tư"], same)

    # Tiers 7–8 only applicable when A ≠ B (A=B case already resolved above
    # since X in 20 ⇒ Tư triggered, X not in 20 ⇒ no prize)
    if same:
        return None

    # Exactly one of (a, b) hits the 20-number universe at this point
    if a_in_20 and not b_in_20:
        hit = a
    elif b_in_20 and not a_in_20:
        hit = b
    else:
        return None

    if hit in special_set:
        return MAX_3D_PRO_TIERS["Giải Năm"]
    return MAX_3D_PRO_TIERS["Giải Sáu"]


def _double_if_same(rule: PrizeRule, same: bool) -> PrizeRule:
    if not same:
        return rule
    return PrizeRule(rule.name, rule.amount * 2)

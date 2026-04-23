"""Power 5/35 evaluator — subset match + special, per-(ticket × draw) aggregation."""

from __future__ import annotations

from collections import Counter

from vietlott.check_rate.evaluators.base import BaseEvaluator, register
from vietlott.check_rate.models import EvalResult, HistoryMatch, PerDrawHit, Ticket
from vietlott.config.prize_tables import TICKET_COST_VND, resolve_power_535

GAME = "power_535"
MAIN_SIZE = 5


@register(GAME)
class Power535Evaluator(BaseEvaluator):
    def parse_numbers(self, ticket: Ticket) -> list[int]:
        nums = [int(x) for x in ticket.numbers_raw.split()]
        if len(nums) != MAIN_SIZE:
            raise ValueError(f"ticket #{ticket.ticket_no}: expected {MAIN_SIZE} numbers, got {len(nums)}")
        if len(set(nums)) != MAIN_SIZE:
            raise ValueError(f"ticket #{ticket.ticket_no}: duplicate numbers in {nums}")
        for n in nums:
            if not 1 <= n <= 35:
                raise ValueError(f"ticket #{ticket.ticket_no}: number {n} out of range 1-35")
        if ticket.special is None:
            raise ValueError(f"ticket #{ticket.ticket_no}: special is required for power_535")
        if not 1 <= ticket.special <= 12:
            raise ValueError(f"ticket #{ticket.ticket_no}: special {ticket.special} out of range 1-12")
        return sorted(nums)

    def evaluate(self, tickets: list[Ticket], draws: list[dict]) -> EvalResult:
        parsed = [(t, frozenset(self.parse_numbers(t))) for t in tickets]
        match_dist: Counter[int] = Counter()
        prize_counter: Counter[str] = Counter()
        prize_winnings: Counter[str] = Counter()
        per_draw_hits: list[PerDrawHit] = []

        for draw in draws:
            draw_main, draw_sp = _extract_draw(draw)
            for ticket, nums in parsed:
                match_main = len(nums & draw_main)
                sp_match = ticket.special == draw_sp
                match_dist[match_main] += 1

                rule = resolve_power_535(match_main, sp_match)
                per_draw_hits.append(
                    PerDrawHit(
                        date=str(draw["date"]),
                        draw_id=str(draw["id"]),
                        ticket_no=ticket.ticket_no,
                        prize=rule.name if rule else None,
                        amount=rule.amount if rule else 0,
                        detail={"match_main": match_main, "special_match": sp_match},
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
        ticket_main = frozenset(self.parse_numbers(ticket))
        occurrences: list[tuple[str, str, str]] = []
        for draw in draws:
            draw_main, _ = _extract_draw(draw)
            if ticket_main == draw_main:
                occurrences.append((str(draw["date"]), str(draw["id"]), "main_exact"))
        display = f"[{' '.join(str(n) for n in sorted(ticket_main))}]"
        if ticket.special is not None:
            display += f" sp={ticket.special}"
        return HistoryMatch(
            ticket_no=ticket.ticket_no,
            numbers_display=display,
            total_hits=len(occurrences),
            by_tier={"main_exact": len(occurrences)},
            occurrences=occurrences,
        )


def _extract_draw(draw: dict) -> tuple[frozenset[int], int | None]:
    """Normalize draw record across JSONL (result=[m,m,m,m,m,sp]) and website
    JSON (result=[m,m,m,m,m], special=sp) shapes.
    """
    result = draw["result"]
    if "special" in draw and draw["special"] is not None:
        return frozenset(result[:MAIN_SIZE]), int(draw["special"])
    if len(result) > MAIN_SIZE:
        return frozenset(result[:MAIN_SIZE]), int(result[MAIN_SIZE])
    return frozenset(result[:MAIN_SIZE]), None

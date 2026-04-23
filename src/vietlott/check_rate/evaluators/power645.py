"""Power 6/45 (Mega) evaluator — subset match only, no special/bonus."""

from __future__ import annotations

from collections import Counter

from vietlott.check_rate.evaluators.base import BaseEvaluator, register
from vietlott.check_rate.models import EvalResult, HistoryMatch, PerDrawHit, Ticket
from vietlott.config.prize_tables import TICKET_COST_VND, resolve_power_645

GAME = "power_645"
MAIN_SIZE = 6
NUM_MIN = 1
NUM_MAX = 45


@register(GAME)
class Power645Evaluator(BaseEvaluator):
    def parse_numbers(self, ticket: Ticket) -> list[int]:
        nums = [int(x) for x in ticket.numbers_raw.split()]
        if len(nums) != MAIN_SIZE:
            raise ValueError(f"ticket #{ticket.ticket_no}: expected {MAIN_SIZE} numbers, got {len(nums)}")
        if len(set(nums)) != MAIN_SIZE:
            raise ValueError(f"ticket #{ticket.ticket_no}: duplicate numbers in {nums}")
        for n in nums:
            if not NUM_MIN <= n <= NUM_MAX:
                raise ValueError(f"ticket #{ticket.ticket_no}: number {n} out of range {NUM_MIN}-{NUM_MAX}")
        if ticket.special is not None:
            raise ValueError(f"ticket #{ticket.ticket_no}: power_645 does not take a special number")
        return sorted(nums)

    def evaluate(self, tickets: list[Ticket], draws: list[dict]) -> EvalResult:
        parsed = [(t, frozenset(self.parse_numbers(t))) for t in tickets]
        match_dist: Counter[int] = Counter()
        prize_counter: Counter[str] = Counter()
        prize_winnings: Counter[str] = Counter()
        per_draw_hits: list[PerDrawHit] = []

        for draw in draws:
            draw_main = _extract_main(draw)
            for ticket, nums in parsed:
                match_main = len(nums & draw_main)
                match_dist[match_main] += 1

                rule = resolve_power_645(match_main)
                per_draw_hits.append(
                    PerDrawHit(
                        date=str(draw["date"]),
                        draw_id=str(draw["id"]),
                        ticket_no=ticket.ticket_no,
                        prize=rule.name if rule else None,
                        amount=rule.amount if rule else 0,
                        detail={"match_main": match_main},
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
            if _extract_main(draw) == ticket_main:
                occurrences.append((str(draw["date"]), str(draw["id"]), "main_exact"))
        display = f"[{' '.join(str(n) for n in sorted(ticket_main))}]"
        return HistoryMatch(
            ticket_no=ticket.ticket_no,
            numbers_display=display,
            total_hits=len(occurrences),
            by_tier={"main_exact": len(occurrences)},
            occurrences=occurrences,
        )


def _extract_main(draw: dict) -> frozenset[int]:
    return frozenset(draw["result"][:MAIN_SIZE])

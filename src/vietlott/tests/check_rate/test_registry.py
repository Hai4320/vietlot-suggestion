"""Phase 0 — evaluator registry."""

from __future__ import annotations

import pytest

from vietlott.check_rate.evaluators import base as evaluator_base
from vietlott.check_rate.evaluators.base import (
    BaseEvaluator,
    get_evaluator,
    register,
    registered_games,
)
from vietlott.check_rate.models import EvalResult, HistoryMatch, Ticket


@pytest.fixture(autouse=True)
def _isolated_registry(monkeypatch):
    """Each test gets a clean registry so Phase 0 tests don't leak state."""
    monkeypatch.setattr(evaluator_base, "_EVALUATORS", {})


def _dummy_cls():
    class Dummy(BaseEvaluator):
        def parse_numbers(self, ticket):
            return ticket.numbers_raw

        def evaluate(self, tickets, draws):
            return EvalResult(
                game=self.game,
                algorithm=tickets[0].algorithm if tickets else "",
                n_tickets=len(tickets),
                n_draws=len(draws),
                match_dist={},
                prize_counter={},
                prize_winnings={},
                total_cost=0,
                total_winnings=0,
                per_draw_hits=[],
            )

        def history_match(self, ticket, draws):
            return HistoryMatch(
                ticket_no=ticket.ticket_no,
                numbers_display=ticket.numbers_raw,
                total_hits=0,
                by_tier={},
                occurrences=[],
            )

    return Dummy


def test_register_and_get():
    cls = register("fake_game")(_dummy_cls())
    inst = get_evaluator("fake_game")
    assert inst is not None
    assert inst.game == "fake_game"
    assert isinstance(inst, cls)


def test_get_unknown_returns_none():
    assert get_evaluator("nonexistent_game") is None


def test_registered_games_sorted():
    register("zeta")(_dummy_cls())
    register("alpha")(_dummy_cls())
    assert registered_games() == ["alpha", "zeta"]


def test_duplicate_registration_rejected():
    register("dupe")(_dummy_cls())
    with pytest.raises(ValueError, match="Duplicate evaluator"):
        register("dupe")(_dummy_cls())


def test_dummy_instance_usable():
    register("dummy")(_dummy_cls())
    ev = get_evaluator("dummy")
    ticket = Ticket("dummy", "test", 1, "1 2 3", None)
    result = ev.evaluate([ticket], [{"date": "2024-01-01", "id": "00001", "result": [1, 2, 3]}])
    assert result.n_tickets == 1
    assert result.n_draws == 1

"""Phase 2 — Power 6/45 evaluator unit tests."""

from __future__ import annotations

import pytest

from vietlott.check_rate.evaluators import power645  # noqa: F401  # ensures registration
from vietlott.check_rate.evaluators.base import get_evaluator
from vietlott.check_rate.models import Ticket


@pytest.fixture
def ev():
    return get_evaluator("power_645")


def _ticket(nums: str, no: int = 1, algo: str = "test") -> Ticket:
    return Ticket(game="power_645", algorithm=algo, ticket_no=no, numbers_raw=nums, special=None)


def _draw(date: str, draw_id: str, main: list[int]) -> dict:
    return {"date": date, "id": draw_id, "result": main}


# ── parse_numbers ─────────────────────────────────────────────────────────


def test_parse_numbers_sorted(ev):
    assert ev.parse_numbers(_ticket("30 1 45 3 4 5")) == [1, 3, 4, 5, 30, 45]


def test_parse_rejects_wrong_count(ev):
    with pytest.raises(ValueError, match="expected 6"):
        ev.parse_numbers(_ticket("1 2 3 4 5"))


def test_parse_rejects_duplicates(ev):
    with pytest.raises(ValueError, match="duplicate"):
        ev.parse_numbers(_ticket("1 2 3 4 5 5"))


def test_parse_rejects_out_of_range(ev):
    with pytest.raises(ValueError, match="out of range"):
        ev.parse_numbers(_ticket("1 2 3 4 5 46"))


def test_parse_rejects_special_present(ev):
    t = Ticket(game="power_645", algorithm="t", ticket_no=1, numbers_raw="1 2 3 4 5 6", special=7)
    with pytest.raises(ValueError, match="does not take a special"):
        ev.parse_numbers(t)


# ── evaluate — each tier hit exactly once ─────────────────────────────────


def test_jackpot_6_match(ev):
    tickets = [_ticket("1 2 3 4 5 6")]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 4, 5, 6])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Jackpot": 1}
    assert r.prize_winnings == {"Jackpot": 12_000_000_000}
    assert r.total_cost == 10_000
    assert r.match_dist == {6: 1}


def test_first_prize_5_match(ev):
    tickets = [_ticket("1 2 3 4 5 6")]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 4, 5, 20])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"1st": 1}
    assert r.prize_winnings == {"1st": 10_000_000}


def test_second_prize_4_match(ev):
    tickets = [_ticket("1 2 3 4 5 6")]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 4, 11, 12])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"2nd": 1}
    assert r.prize_winnings == {"2nd": 300_000}


def test_third_prize_3_match(ev):
    tickets = [_ticket("1 2 3 4 5 6")]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 11, 12, 13])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"3rd": 1}


def test_no_prize_below_3(ev):
    tickets = [_ticket("1 2 3 4 5 6")]
    draws = [
        _draw("2024-01-01", "00001", [1, 2, 11, 12, 13, 14]),  # 2 match
        _draw("2024-01-02", "00002", [11, 12, 13, 14, 15, 16]),  # 0 match
    ]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {}
    assert r.total_winnings == 0
    assert r.match_dist == {2: 1, 0: 1}


# ── multi-ticket aggregation ──────────────────────────────────────────────


def test_per_ticket_per_draw_pairs(ev):
    tickets = [
        _ticket("1 2 3 4 5 6", no=1),
        _ticket("20 30 35 40 42 45", no=2),
    ]
    draws = [
        _draw("2024-01-01", "00001", [1, 2, 3, 4, 5, 6]),  # T1 Jackpot, T2 0
        _draw("2024-01-02", "00002", [20, 30, 35, 40, 42, 45]),  # T1 0, T2 Jackpot
        _draw("2024-01-03", "00003", [1, 2, 3, 11, 12, 13]),  # T1 3rd, T2 0
    ]
    r = ev.evaluate(tickets, draws)
    assert len(r.per_draw_hits) == 6
    assert r.prize_counter["Jackpot"] == 2
    assert r.prize_counter["3rd"] == 1
    assert r.total_cost == 2 * 3 * 10_000


# ── history_match ─────────────────────────────────────────────────────────


def test_history_match_exact_set(ev):
    ticket = _ticket("1 2 3 4 5 6")
    draws = [
        _draw("2024-01-01", "00001", [6, 5, 4, 3, 2, 1]),  # same set, different order
        _draw("2024-01-02", "00002", [1, 2, 3, 4, 5, 7]),  # off by one
    ]
    h = ev.history_match(ticket, draws)
    assert h.total_hits == 1
    assert h.occurrences[0][0] == "2024-01-01"


def test_history_display_no_special(ev):
    ticket = _ticket("6 5 4 3 2 1")
    h = ev.history_match(ticket, [])
    assert h.numbers_display == "[1 2 3 4 5 6]"
    # No "sp=" suffix for power_645
    assert "sp=" not in h.numbers_display

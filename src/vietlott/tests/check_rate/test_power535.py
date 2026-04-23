"""Phase 1 — Power 5/35 evaluator unit tests."""

from __future__ import annotations

import pytest

from vietlott.check_rate.evaluators import power535  # noqa: F401  # ensures registration
from vietlott.check_rate.evaluators.base import get_evaluator
from vietlott.check_rate.models import Ticket


@pytest.fixture
def ev():
    return get_evaluator("power_535")


def _ticket(nums: str, special: int | None = 1, no: int = 1, algo: str = "test") -> Ticket:
    return Ticket(game="power_535", algorithm=algo, ticket_no=no, numbers_raw=nums, special=special)


def _draw(date: str, draw_id: str, main: list[int], sp: int) -> dict:
    return {"date": date, "id": draw_id, "result": [*main, sp]}


# ── parse_numbers ─────────────────────────────────────────────────────────


def test_parse_numbers_sorted(ev):
    assert ev.parse_numbers(_ticket("19 7 10 9 16", 3)) == [7, 9, 10, 16, 19]


def test_parse_rejects_wrong_count(ev):
    with pytest.raises(ValueError, match="expected 5"):
        ev.parse_numbers(_ticket("1 2 3 4", 3))


def test_parse_rejects_duplicates(ev):
    with pytest.raises(ValueError, match="duplicate"):
        ev.parse_numbers(_ticket("1 2 3 4 4", 3))


def test_parse_rejects_out_of_range(ev):
    with pytest.raises(ValueError, match="out of range"):
        ev.parse_numbers(_ticket("1 2 3 4 36", 3))


def test_parse_rejects_missing_special(ev):
    with pytest.raises(ValueError, match="special is required"):
        ev.parse_numbers(_ticket("1 2 3 4 5", None))


def test_parse_rejects_invalid_special(ev):
    with pytest.raises(ValueError, match="out of range 1-12"):
        ev.parse_numbers(_ticket("1 2 3 4 5", 13))


# ── evaluate — each tier hit exactly once ─────────────────────────────────


def test_jackpot_5_main_plus_special(ev):
    tickets = [_ticket("1 2 3 4 5", 3)]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 4, 5], 3)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Jackpot": 1}
    assert r.prize_winnings == {"Jackpot": 6_000_000_000}
    assert r.total_cost == 10_000
    assert r.total_winnings == 6_000_000_000
    assert r.match_dist == {5: 1}


def test_second_prize_5_main_no_special(ev):
    tickets = [_ticket("1 2 3 4 5", 3)]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 4, 5], 7)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"2nd": 1}
    assert r.prize_winnings == {"2nd": 5_000_000}


def test_third_4_main_plus_special(ev):
    tickets = [_ticket("1 2 3 4 5", 3)]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 4, 20], 3)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"3rd": 1}


def test_fourth_4_main_no_special(ev):
    tickets = [_ticket("1 2 3 4 5", 3)]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 4, 20], 7)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"4th": 1}


def test_fifth_3_main_plus_special(ev):
    tickets = [_ticket("1 2 3 4 5", 3)]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 20, 21], 3)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"5th": 1}


def test_encourage_3_main_no_special(ev):
    tickets = [_ticket("1 2 3 4 5", 3)]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 20, 21], 7)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Encourage": 1}
    assert r.prize_winnings == {"Encourage": 10_000}


def test_encourage_2_main_plus_special(ev):
    tickets = [_ticket("1 2 3 4 5", 3)]
    draws = [_draw("2024-01-01", "00001", [1, 2, 20, 21, 22], 3)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Encourage": 1}


def test_no_prize(ev):
    tickets = [_ticket("1 2 3 4 5", 3)]
    draws = [_draw("2024-01-01", "00001", [10, 20, 25, 30, 35], 7)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {}
    assert r.total_winnings == 0
    assert r.match_dist == {0: 1}


# ── multi-ticket, multi-draw aggregation ──────────────────────────────────


def test_per_ticket_per_draw_pairs(ev):
    # 2 tickets × 3 draws → 6 evaluations
    tickets = [
        _ticket("1 2 3 4 5", 3, no=1),
        _ticket("10 20 25 30 35", 5, no=2),
    ]
    draws = [
        _draw("2024-01-01", "00001", [1, 2, 3, 4, 5], 3),  # T1 jackpot, T2 nothing
        _draw("2024-01-02", "00002", [10, 20, 25, 30, 35], 5),  # T1 nothing, T2 jackpot
        _draw("2024-01-03", "00003", [6, 7, 8, 9, 11], 3),  # T1 encourage (sp only), T2 nothing
    ]
    r = ev.evaluate(tickets, draws)
    assert len(r.per_draw_hits) == 6
    assert r.n_tickets == 2
    assert r.n_draws == 3
    assert r.total_cost == 2 * 3 * 10_000
    assert r.prize_counter["Jackpot"] == 2
    assert r.prize_counter["Encourage"] == 1
    assert r.total_winnings == 2 * 6_000_000_000 + 10_000


def test_roi_property(ev):
    tickets = [_ticket("1 2 3 4 5", 3)]
    draws = [_draw("2024-01-01", "00001", [1, 2, 3, 4, 5], 3)]
    r = ev.evaluate(tickets, draws)
    # cost=10_000, winnings=6_000_000_000
    assert r.roi == pytest.approx((6_000_000_000 - 10_000) / 10_000 * 100)


# ── history_match ─────────────────────────────────────────────────────────


def test_history_match_none(ev):
    ticket = _ticket("1 2 3 4 5", 3)
    draws = [_draw("2024-01-01", "00001", [10, 20, 25, 30, 35], 7)]
    h = ev.history_match(ticket, draws)
    assert h.total_hits == 0
    assert h.occurrences == []


def test_history_match_exact_set_ignores_special(ev):
    ticket = _ticket("1 2 3 4 5", 3)
    # Same main numbers, different special — still counts as exact match
    draws = [
        _draw("2024-01-01", "00001", [1, 2, 3, 4, 5], 9),
        _draw("2024-01-02", "00002", [5, 4, 3, 2, 1], 11),
    ]
    h = ev.history_match(ticket, draws)
    assert h.total_hits == 2
    assert {o[0] for o in h.occurrences} == {"2024-01-01", "2024-01-02"}


def test_history_display_includes_special(ev):
    ticket = _ticket("5 4 3 2 1", 9)
    h = ev.history_match(ticket, [])
    assert h.numbers_display == "[1 2 3 4 5] sp=9"


# ── draw shape compatibility (JSONL and website envelope) ─────────────────


def test_evaluate_handles_website_json_shape(ev):
    """Website JSON splits main vs special into separate fields."""
    tickets = [_ticket("1 2 3 4 5", 3)]
    draws = [{"date": "2024-01-01", "id": "00001", "result": [1, 2, 3, 4, 5], "special": 3}]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Jackpot": 1}

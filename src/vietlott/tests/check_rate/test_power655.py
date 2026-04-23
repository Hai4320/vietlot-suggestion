"""Phase 3 — Power 6/55 evaluator unit tests.

Focus: the 2 cases at match_main == 5 must discriminate Jackpot 2 (bonus
in ticket) from 1st prize (bonus not in ticket). This is the highest-risk
semantic difference from Power 5/35 where the user *picks* the special.
"""

from __future__ import annotations

import pytest

from vietlott.check_rate.evaluators import power655  # noqa: F401
from vietlott.check_rate.evaluators.base import get_evaluator
from vietlott.check_rate.models import Ticket


@pytest.fixture
def ev():
    return get_evaluator("power_655")


def _ticket(nums: str, no: int = 1, algo: str = "test") -> Ticket:
    return Ticket(game="power_655", algorithm=algo, ticket_no=no, numbers_raw=nums, special=None)


def _draw_jsonl(date: str, draw_id: str, main: list[int], bonus: int) -> dict:
    """JSONL shape: result = [6 main + bonus]."""
    return {"date": date, "id": draw_id, "result": [*main, bonus]}


def _draw_website(date: str, draw_id: str, main: list[int], bonus: int) -> dict:
    """Website JSON shape: result = [6 main], special = bonus."""
    return {"date": date, "id": draw_id, "result": main, "special": bonus}


# ── parse_numbers ─────────────────────────────────────────────────────────


def test_parse_numbers_sorted(ev):
    assert ev.parse_numbers(_ticket("55 1 30 15 45 20")) == [1, 15, 20, 30, 45, 55]


def test_parse_rejects_wrong_count(ev):
    with pytest.raises(ValueError, match="expected 6"):
        ev.parse_numbers(_ticket("1 2 3 4 5"))


def test_parse_rejects_duplicates(ev):
    with pytest.raises(ValueError, match="duplicate"):
        ev.parse_numbers(_ticket("1 2 3 4 5 5"))


def test_parse_rejects_out_of_range(ev):
    with pytest.raises(ValueError, match="out of range"):
        ev.parse_numbers(_ticket("1 2 3 4 5 56"))


def test_parse_rejects_special_present(ev):
    """User must not set special for power_655 — bonus is drawn, not picked."""
    t = Ticket(game="power_655", algorithm="t", ticket_no=1, numbers_raw="1 2 3 4 5 6", special=7)
    with pytest.raises(ValueError, match="does not take a special"):
        ev.parse_numbers(t)


# ── evaluate — every tier + critical 5-main discrimination ────────────────


def test_jackpot1_6_match(ev):
    tickets = [_ticket("1 2 3 4 5 6")]
    draws = [_draw_jsonl("2024-01-01", "00001", [1, 2, 3, 4, 5, 6], 55)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Jackpot 1": 1}
    assert r.prize_winnings == {"Jackpot 1": 30_000_000_000}
    # When 6 match, bonus ball is from remaining 49 → cannot be in ticket
    assert r.per_draw_hits[0].detail["bonus_match"] is False


def test_jackpot2_5_main_bonus_in_ticket(ev):
    """match_main=5 AND bonus ∈ ticket → Jackpot 2."""
    tickets = [_ticket("1 2 3 4 5 10")]
    # main covers 1..5, user also has 10. Draw's 6th is 20 (not in ticket),
    # bonus = 10 which IS in ticket → Jackpot 2.
    draws = [_draw_jsonl("2024-01-01", "00001", [1, 2, 3, 4, 5, 20], 10)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Jackpot 2": 1}
    assert r.prize_winnings == {"Jackpot 2": 3_000_000_000}
    assert r.per_draw_hits[0].detail["match_main"] == 5
    assert r.per_draw_hits[0].detail["bonus_match"] is True


def test_first_prize_5_main_bonus_not_in_ticket(ev):
    """match_main=5 AND bonus ∉ ticket → 1st prize (not Jackpot 2)."""
    tickets = [_ticket("1 2 3 4 5 6")]
    # main covers 1..5, bonus = 20 which is NOT in ticket → 1st.
    draws = [_draw_jsonl("2024-01-01", "00001", [1, 2, 3, 4, 5, 30], 20)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"1st": 1}
    assert r.prize_winnings == {"1st": 40_000_000}
    assert r.per_draw_hits[0].detail["match_main"] == 5
    assert r.per_draw_hits[0].detail["bonus_match"] is False


def test_second_prize_4_match_bonus_irrelevant(ev):
    """match_main=4: bonus doesn't upgrade the tier."""
    # Case A: bonus NOT in ticket
    tickets = [_ticket("1 2 3 4 5 6")]
    draws = [_draw_jsonl("2024-01-01", "00001", [1, 2, 3, 4, 20, 21], 30)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"2nd": 1}
    # Case B: bonus IS in ticket — same tier, same amount
    draws_b = [_draw_jsonl("2024-01-01", "00001", [1, 2, 3, 4, 20, 21], 6)]
    r_b = ev.evaluate(tickets, draws_b)
    assert r_b.prize_counter == {"2nd": 1}
    assert r_b.prize_winnings == r.prize_winnings


def test_third_prize_3_match(ev):
    tickets = [_ticket("1 2 3 4 5 6")]
    draws = [_draw_jsonl("2024-01-01", "00001", [1, 2, 3, 20, 21, 22], 55)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"3rd": 1}


def test_no_prize_below_3(ev):
    tickets = [_ticket("1 2 3 4 5 6")]
    draws = [_draw_jsonl("2024-01-01", "00001", [10, 20, 30, 40, 50, 55], 7)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {}
    assert r.match_dist == {0: 1}


def test_bonus_match_without_enough_main_is_not_prize(ev):
    """Bonus in ticket but main match too low = no prize."""
    tickets = [_ticket("1 2 3 4 5 10")]
    # main {20..25} — 0 match. bonus = 10 which IS in ticket. Still no prize.
    draws = [_draw_jsonl("2024-01-01", "00001", [20, 21, 22, 23, 24, 25], 10)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {}
    assert r.per_draw_hits[0].detail["match_main"] == 0
    assert r.per_draw_hits[0].detail["bonus_match"] is True


# ── draw-shape compatibility ──────────────────────────────────────────────


def test_evaluate_handles_website_json_shape(ev):
    tickets = [_ticket("1 2 3 4 5 6")]
    draws = [_draw_website("2024-01-01", "00001", [1, 2, 3, 4, 5, 6], 55)]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Jackpot 1": 1}


# ── history_match ─────────────────────────────────────────────────────────


def test_history_match_ignores_bonus(ev):
    ticket = _ticket("1 2 3 4 5 6")
    # Same main, different bonus — still exact match
    draws = [
        _draw_jsonl("2024-01-01", "00001", [1, 2, 3, 4, 5, 6], 55),
        _draw_jsonl("2024-01-02", "00002", [6, 5, 4, 3, 2, 1], 7),
    ]
    h = ev.history_match(ticket, draws)
    assert h.total_hits == 2


def test_history_display_no_special_suffix(ev):
    ticket = _ticket("55 1 30 15 45 20")
    h = ev.history_match(ticket, [])
    assert h.numbers_display == "[1 15 20 30 45 55]"
    assert "sp=" not in h.numbers_display

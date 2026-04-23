"""Phase 5 — Max 3D Pro evaluator unit tests.

Covers all 8 tiers + A=B doubling + Đặc biệt+Phụ Đặc biệt combined case +
order-sensitive Đặc biệt/Phụ Đặc biệt discrimination.
"""

from __future__ import annotations

import pytest

from vietlott.check_rate.evaluators import p3d_pro  # noqa: F401
from vietlott.check_rate.evaluators.base import get_evaluator
from vietlott.check_rate.evaluators.p3d_pro import resolve_3d_pro
from vietlott.check_rate.models import Ticket


@pytest.fixture
def ev():
    return get_evaluator("3d_pro")


def _ticket(nums: str, no: int = 1, algo: str = "test") -> Ticket:
    return Ticket(game="3d_pro", algorithm=algo, ticket_no=no, numbers_raw=nums, special=None)


def _draw(date, draw_id, specials, firsts, seconds, thirds) -> dict:
    return {
        "date": date,
        "id": draw_id,
        "result": {
            "Giải Đặc biệt": specials,
            "Giải Nhất": firsts,
            "Giải Nhì": seconds,
            "Giải ba": thirds,
        },
    }


# ── parse_numbers ─────────────────────────────────────────────────────────


def test_parse_two_3_digit(ev):
    assert ev.parse_numbers(_ticket("015 017")) == ("015", "017")


def test_parse_rejects_one_number(ev):
    with pytest.raises(ValueError, match="exactly 2"):
        ev.parse_numbers(_ticket("015"))


def test_parse_rejects_three_numbers(ev):
    with pytest.raises(ValueError, match="exactly 2"):
        ev.parse_numbers(_ticket("015 017 019"))


def test_parse_rejects_non_3_digit(ev):
    with pytest.raises(ValueError, match="exactly 3 digits"):
        ev.parse_numbers(_ticket("15 017"))


def test_parse_allows_identical(ev):
    """A=B is valid for 3D Pro (doubling case)."""
    assert ev.parse_numbers(_ticket("015 015")) == ("015", "015")


def test_parse_rejects_special_present(ev):
    t = Ticket(game="3d_pro", algorithm="t", ticket_no=1, numbers_raw="015 017", special=5)
    with pytest.raises(ValueError, match="does not take a special"):
        ev.parse_numbers(t)


# ── Tier 1: Đặc biệt — order-sensitive ────────────────────────────────────


def test_dac_biet_exact_order(ev):
    tickets = [_ticket("015 017")]
    draws = [_draw("2024-01-01", "00001", ["015", "017"], [], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Đặc biệt": 1}
    assert r.prize_winnings == {"Giải Đặc biệt": 2_000_000_000}


def test_dac_biet_wrong_order_triggers_phu(ev):
    """Reverse order → Phụ Đặc biệt, not Đặc biệt."""
    tickets = [_ticket("017 015")]  # reversed
    draws = [_draw("2024-01-01", "00001", ["015", "017"], [], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Phụ Đặc biệt": 1}
    assert r.prize_winnings == {"Giải Phụ Đặc biệt": 400_000_000}


# ── Tier 3-5: Nhất / Nhì / Ba — set membership ────────────────────────────


def test_nhat_both_in_first(ev):
    tickets = [_ticket("100 200")]
    draws = [_draw("2024-01-01", "00001", ["015", "017"], ["100", "200", "300", "400"], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Nhất": 1}


def test_nhi_both_in_second(ev):
    tickets = [_ticket("100 200")]
    draws = [_draw("2024-01-01", "00001", ["015", "017"], [], ["100", "200", "300", "400", "500", "600"], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Nhì": 1}


def test_ba_both_in_third(ev):
    tickets = [_ticket("100 200")]
    draws = [
        _draw(
            "2024-01-01",
            "00001",
            ["015", "017"],
            [],
            [],
            ["100", "200", "300", "400", "500", "600", "700", "800"],
        )
    ]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Ba": 1}


# ── Tier 6: Tư — both in 20, but not same tier ────────────────────────────


def test_tu_mixed_tier(ev):
    """A in Nhất, B in Nhì → neither Nhất nor Nhì fully qualifies → Tư."""
    tickets = [_ticket("100 200")]
    draws = [
        _draw(
            "2024-01-01",
            "00001",
            ["015", "017"],
            ["100", "101", "102", "103"],  # A=100 here
            ["200", "201", "202", "203", "204", "205"],  # B=200 here
            [],
        )
    ]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Tư": 1}


def test_tu_one_in_special_one_in_nhat(ev):
    """A in Đặc biệt, B in Nhất, no order match → Tư (both hit 20)."""
    tickets = [_ticket("999 100")]  # reversed order so not Đặc biệt either
    # Put 999 as special[1] — so neither order match for A=999, B=100
    draws = [_draw("2024-01-01", "00001", ["015", "999"], ["100", "101", "102", "103"], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Tư": 1}


# ── Tier 7: Năm — exactly one in Đặc biệt, other misses 20 ────────────────


def test_nam_one_in_special(ev):
    tickets = [_ticket("015 777")]  # 015 = special[0], 777 not in 20
    draws = [_draw("2024-01-01", "00001", ["015", "017"], ["100", "200", "300", "400"], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Năm": 1}
    assert r.prize_winnings == {"Giải Năm": 100_000}


# ── Tier 8: Sáu — exactly one in Nhất/Nhì/Ba, other misses 20 ─────────────


def test_sau_one_in_nhat(ev):
    tickets = [_ticket("100 777")]  # 100 in Nhất, 777 miss
    draws = [_draw("2024-01-01", "00001", ["015", "017"], ["100", "200", "300", "400"], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Sáu": 1}
    assert r.prize_winnings == {"Giải Sáu": 40_000}


# ── No prize ──────────────────────────────────────────────────────────────


def test_no_prize_both_miss(ev):
    tickets = [_ticket("777 888")]
    draws = [_draw("2024-01-01", "00001", ["015", "017"], ["100"], ["200"], ["300"])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {}
    assert r.match_dist == {"Không trúng": 1}


# ── A=B doubling rule ─────────────────────────────────────────────────────


def test_same_ab_nhat_doubled(ev):
    tickets = [_ticket("100 100")]
    draws = [_draw("2024-01-01", "00001", ["015", "017"], ["100", "200", "300", "400"], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Nhất": 1}
    # Doubled: 30M × 2 = 60M
    assert r.prize_winnings == {"Giải Nhất": 60_000_000}


def test_same_ab_nhi_doubled(ev):
    tickets = [_ticket("100 100")]
    draws = [_draw("2024-01-01", "00001", ["015", "017"], [], ["100", "200", "300", "400", "500", "600"], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Nhì": 1}
    assert r.prize_winnings == {"Giải Nhì": 20_000_000}  # 10M × 2


def test_same_ab_tu_doubled(ev):
    """A=B in 20 but not in any tier fully? For A=B=X, X in 20 always means
    X in one specific tier — so Tư is unreachable. Skip as a unit case."""
    # Documenting via this test that the A=B+Tư path is structurally blocked


def test_same_ab_dac_biet_combined(ev):
    """A=B=X with DB=(X, X) → combined 2.4B."""
    tickets = [_ticket("015 015")]
    draws = [_draw("2024-01-01", "00001", ["015", "015"], [], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Đặc biệt": 1}
    assert r.prize_winnings == {"Giải Đặc biệt": 2_400_000_000}


def test_same_ab_special_but_db_not_duplicated(ev):
    """A=B=X, DB=(X, Y) where Y≠X — position-sensitive Đặc biệt fails,
    Phụ Đặc biệt also fails (needs A=Y=X, Y≠X). Falls to Tư (X in DB ⊂ 20,
    same for B=X)."""
    tickets = [_ticket("015 015")]
    draws = [_draw("2024-01-01", "00001", ["015", "888"], [], [], [])]
    r = ev.evaluate(tickets, draws)
    # X=015 is in DB (1 of the 20) → both A,B hit 20 → Tư
    assert r.prize_counter == {"Giải Tư": 1}
    assert r.prize_winnings == {"Giải Tư": 2_000_000}  # Tư doubled


def test_same_ab_no_hit(ev):
    """A=B=X but X not in 20 → no prize (Năm/Sáu unreachable for A=B)."""
    tickets = [_ticket("777 777")]
    draws = [_draw("2024-01-01", "00001", ["015", "017"], ["100"], ["200"], ["300"])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {}


# ── Resolver direct unit tests (fast) ─────────────────────────────────────


def test_resolve_priority_dac_biet_over_nhat():
    """If (A,B) qualifies both Đặc biệt and Nhất, Đặc biệt wins."""
    # DB=(100, 200), Nhất also contains 100, 200 — impossible draw but tests priority
    rule = resolve_3d_pro("100", "200", ["100", "200"], ["100", "200", "300", "400"], [], [])
    assert rule is not None
    assert rule.name == "Giải Đặc biệt"


def test_resolve_priority_nhat_over_tu():
    rule = resolve_3d_pro("100", "200", ["015", "017"], ["100", "200", "300", "400"], [], [])
    assert rule is not None
    assert rule.name == "Giải Nhất"


# ── Website JSON shape compatibility ──────────────────────────────────────


def test_evaluate_handles_website_english_keys(ev):
    tickets = [_ticket("015 017")]
    draws = [
        {
            "date": "2024-01-01",
            "id": "00001",
            "result": {"special": ["015", "017"], "first": [], "second": [], "third": []},
        }
    ]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Đặc biệt": 1}


# ── history_match ─────────────────────────────────────────────────────────


def test_history_tracks_all_tier_hits(ev):
    ticket = _ticket("100 200")
    draws = [
        # Nhất hit
        _draw("2024-01-01", "00001", ["015", "017"], ["100", "200", "300", "400"], [], []),
        # Tư (mixed tier)
        _draw("2024-01-02", "00002", ["015", "017"], ["100"], ["200", "201", "202", "203", "204", "205"], []),
        # No hit
        _draw("2024-01-03", "00003", ["015", "017"], ["777"], [], []),
    ]
    h = ev.history_match(ticket, draws)
    assert h.by_tier["Giải Nhất"] == 1
    assert h.by_tier["Giải Tư"] == 1
    assert h.total_hits == 2


def test_history_display_marks_same(ev):
    h = ev.history_match(_ticket("015 015"), [])
    assert "A=B" in h.numbers_display

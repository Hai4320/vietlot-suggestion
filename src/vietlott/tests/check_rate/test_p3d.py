"""Phase 4 — Max 3D evaluator unit tests.

Focus: tier-based match (not subset), multi-tier cộng dồn, KK 2 số cuối
mutually-exclusive logic, and per-tier history.
"""

from __future__ import annotations

import pytest

from vietlott.check_rate.evaluators import p3d  # noqa: F401
from vietlott.check_rate.evaluators.base import get_evaluator
from vietlott.check_rate.models import Ticket


@pytest.fixture
def ev():
    return get_evaluator("3d")


def _ticket(num: str, no: int = 1, algo: str = "test") -> Ticket:
    return Ticket(game="3d", algorithm=algo, ticket_no=no, numbers_raw=num, special=None)


def _draw_vn(date: str, draw_id: str, special, first, second, third) -> dict:
    """JSONL shape — Vietnamese tier keys."""
    return {
        "date": date,
        "id": draw_id,
        "result": {
            "Giải Đặc biệt": special,
            "Giải Nhất": first,
            "Giải Nhì": second,
            "Giải ba": third,
        },
    }


def _draw_en(date: str, draw_id: str, special, first, second, third) -> dict:
    """Website JSON shape — English tier keys."""
    return {
        "date": date,
        "id": draw_id,
        "result": {"special": special, "first": first, "second": second, "third": third},
    }


# ── parse_numbers ─────────────────────────────────────────────────────────


def test_parse_valid_3_digit(ev):
    assert ev.parse_numbers(_ticket("015")) == "015"
    assert ev.parse_numbers(_ticket("000")) == "000"
    assert ev.parse_numbers(_ticket("999")) == "999"


def test_parse_rejects_wrong_length(ev):
    with pytest.raises(ValueError, match="exactly 3 digits"):
        ev.parse_numbers(_ticket("15"))
    with pytest.raises(ValueError, match="exactly 3 digits"):
        ev.parse_numbers(_ticket("1234"))


def test_parse_rejects_non_digit(ev):
    with pytest.raises(ValueError, match="exactly 3 digits"):
        ev.parse_numbers(_ticket("01a"))


def test_parse_rejects_special_present(ev):
    t = Ticket(game="3d", algorithm="t", ticket_no=1, numbers_raw="015", special=5)
    with pytest.raises(ValueError, match="does not take a special"):
        ev.parse_numbers(t)


# ── single-tier hits ──────────────────────────────────────────────────────


def test_hit_dac_biet(ev):
    tickets = [_ticket("015")]
    draws = [_draw_vn("2024-01-01", "00001", ["015", "999"], ["111"], ["222"], ["333"])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Đặc biệt": 1}
    assert r.prize_winnings == {"Giải Đặc biệt": 1_000_000}
    assert r.match_dist == {"Giải Đặc biệt": 1}


def test_hit_nhat(ev):
    tickets = [_ticket("015")]
    draws = [_draw_vn("2024-01-01", "00001", ["100", "200"], ["015", "111", "222", "333"], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Nhất": 1}


def test_hit_nhi(ev):
    tickets = [_ticket("015")]
    draws = [_draw_vn("2024-01-01", "00001", ["100", "200"], [], ["015"], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Nhì": 1}


def test_hit_ba(ev):
    tickets = [_ticket("015")]
    draws = [_draw_vn("2024-01-01", "00001", ["100", "200"], [], [], ["015"])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải ba": 1}


# ── KK 2 số cuối (đuôi) ───────────────────────────────────────────────────


def test_kk_last2_match_when_not_dac_biet(ev):
    """Ticket '215' shares last 2 digits with '015' but is not itself in Đặc biệt."""
    tickets = [_ticket("215")]
    draws = [_draw_vn("2024-01-01", "00001", ["015", "999"], [], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"KK 2 số cuối": 1}
    assert r.prize_winnings == {"KK 2 số cuối": 100_000}


def test_kk_not_triggered_when_full_dac_biet_match(ev):
    """Full match should NOT double-count as KK (mutually exclusive)."""
    tickets = [_ticket("015")]
    draws = [_draw_vn("2024-01-01", "00001", ["015", "999"], [], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Đặc biệt": 1}
    assert "KK 2 số cuối" not in r.prize_counter


def test_kk_per_special_with_matching_tail(ev):
    """If both Đặc biệt numbers share the ticket's last 2 digits, cộng dồn 2 KK."""
    tickets = [_ticket("215")]
    # Both specials end in "15" but ticket isn't equal to either → 2 KK
    draws = [_draw_vn("2024-01-01", "00001", ["015", "415"], [], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"KK 2 số cuối": 2}
    assert r.prize_winnings == {"KK 2 số cuối": 200_000}


# ── multi-tier cộng dồn ───────────────────────────────────────────────────


def test_cong_don_across_tiers(ev):
    """Same number in Nhất + Nhì in one draw → both prizes accrue (cộng dồn)."""
    tickets = [_ticket("015")]
    draws = [
        _draw_vn(
            "2024-01-01",
            "00001",
            ["100", "200"],
            ["015", "999", "888", "777"],
            ["015", "222", "333", "444", "555", "666"],
            [],
        )
    ]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Nhất": 1, "Giải Nhì": 1}
    assert r.prize_winnings == {"Giải Nhất": 350_000, "Giải Nhì": 210_000}
    # match_dist records only the best tier
    assert r.match_dist == {"Giải Nhất": 1}


def test_cong_don_same_tier_duplicates(ev):
    """Same number appearing twice in the SAME tier in one draw → 2 wins."""
    tickets = [_ticket("015")]
    # "015" appears twice in Nhất (contrived but possible semantically)
    draws = [_draw_vn("2024-01-01", "00001", ["100", "200"], ["015", "015", "999", "888"], [], [])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Nhất": 2}


# ── no prize ──────────────────────────────────────────────────────────────


def test_no_prize(ev):
    tickets = [_ticket("123")]
    draws = [_draw_vn("2024-01-01", "00001", ["015", "999"], ["111"], ["222"], ["333"])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {}
    assert r.match_dist == {"Không trúng": 1}
    assert r.total_winnings == 0


# ── draw-shape compatibility ──────────────────────────────────────────────


def test_evaluate_handles_website_english_keys(ev):
    tickets = [_ticket("015")]
    draws = [_draw_en("2024-01-01", "00001", ["015", "999"], ["111"], ["222"], ["333"])]
    r = ev.evaluate(tickets, draws)
    assert r.prize_counter == {"Giải Đặc biệt": 1}


# ── history_match ─────────────────────────────────────────────────────────


def test_history_counts_per_tier(ev):
    ticket = _ticket("015")
    draws = [
        _draw_vn("2024-01-01", "00001", ["015", "999"], [], [], []),  # Đặc biệt
        _draw_vn("2024-01-02", "00002", ["100", "200"], ["015", "111", "222", "333"], [], []),  # Nhất
        _draw_vn(
            "2024-01-03", "00003", ["100", "200"], [], [], ["015", "888", "777", "666", "555", "444", "333", "222"]
        ),  # Ba
    ]
    h = ev.history_match(ticket, draws)
    assert h.total_hits == 3
    assert h.by_tier == {"Giải Đặc biệt": 1, "Giải Nhất": 1, "Giải Nhì": 0, "Giải ba": 1}
    assert len(h.occurrences) == 3
    assert h.occurrences[0] == ("2024-01-01", "00001", "Giải Đặc biệt")


def test_history_display_is_raw_3_digit(ev):
    ticket = _ticket("015")
    h = ev.history_match(ticket, [])
    assert h.numbers_display == "015"
    assert h.total_hits == 0

"""Phase 1 — golden fixture parity test.

Hand-crafted CSV + draws → hand-crafted expected.json. Python evaluator
output must match exactly. TS mirror runs against the SAME files via
scripts/verify_check_rate_parity.mjs (Node, no unit test framework).
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from vietlott.check_rate.evaluators import power535  # noqa: F401 — ensures registration
from vietlott.check_rate.evaluators.base import get_evaluator
from vietlott.check_rate.io import read_tickets

FIXTURE_DIR = Path(__file__).resolve().parents[4] / "tests" / "fixtures" / "check_rate"


@pytest.fixture
def power_535_fixtures():
    csv_path = FIXTURE_DIR / "power_535_sample.csv"
    draws_path = FIXTURE_DIR / "power_535_draws.json"
    expected_path = FIXTURE_DIR / "power_535_sample.expected.json"
    assert csv_path.exists(), f"Missing fixture: {csv_path}"
    assert draws_path.exists(), f"Missing fixture: {draws_path}"
    assert expected_path.exists(), f"Missing fixture: {expected_path}"

    tickets = read_tickets(csv_path)
    draws = json.loads(draws_path.read_text(encoding="utf-8"))
    expected = json.loads(expected_path.read_text(encoding="utf-8"))
    return tickets, draws, expected


def test_evaluate_matches_expected(power_535_fixtures):
    tickets, draws, expected = power_535_fixtures
    ev = get_evaluator("power_535")
    result = ev.evaluate(tickets, draws)

    exp_group = expected["groups"][0]
    assert result.game == exp_group["game"]
    assert result.algorithm == exp_group["algorithm"]
    assert result.n_tickets == exp_group["n_tickets"]
    assert result.n_draws == exp_group["n_draws"]
    assert result.total_cost == exp_group["total_cost"]
    assert result.total_winnings == exp_group["total_winnings"]
    assert result.prize_counter == exp_group["prize_counter"]
    assert result.prize_winnings == exp_group["prize_winnings"]
    # match_dist is int->int in Python, str->int in JSON
    actual_md = {str(k): v for k, v in result.match_dist.items()}
    assert actual_md == exp_group["match_dist"]


def test_history_match_matches_expected(power_535_fixtures):
    tickets, draws, expected = power_535_fixtures
    ev = get_evaluator("power_535")
    histories = [ev.history_match(t, draws) for t in tickets]

    assert len(histories) == len(expected["history"])
    for hist, exp_hist in zip(histories, expected["history"]):
        assert hist.ticket_no == exp_hist["ticket_no"]
        assert hist.numbers_display == exp_hist["numbers_display"]
        assert hist.total_hits == exp_hist["total_hits"]
        assert hist.by_tier == exp_hist["by_tier"]
        # occurrences are list of tuples in Python, list of lists in JSON
        actual_occ = [list(o) for o in hist.occurrences]
        assert actual_occ == exp_hist["occurrences"]

"""Phase 4 — Max 3D golden fixture parity test."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from vietlott.check_rate.evaluators import p3d  # noqa: F401
from vietlott.check_rate.evaluators.base import get_evaluator
from vietlott.check_rate.io import read_tickets

FIXTURE_DIR = Path(__file__).resolve().parents[4] / "tests" / "fixtures" / "check_rate"


@pytest.fixture
def max_3d_fixtures():
    csv_path = FIXTURE_DIR / "max_3d_sample.csv"
    draws_path = FIXTURE_DIR / "max_3d_draws.json"
    expected_path = FIXTURE_DIR / "max_3d_sample.expected.json"
    for p in (csv_path, draws_path, expected_path):
        assert p.exists(), f"Missing fixture: {p}"

    tickets = read_tickets(csv_path)
    draws = json.loads(draws_path.read_text(encoding="utf-8"))
    expected = json.loads(expected_path.read_text(encoding="utf-8"))
    return tickets, draws, expected


def test_evaluate_matches_expected(max_3d_fixtures):
    tickets, draws, expected = max_3d_fixtures
    ev = get_evaluator("3d")
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
    # For 3D, match_dist keys are already strings — no coercion needed
    assert result.match_dist == exp_group["match_dist"]


def test_history_match_matches_expected(max_3d_fixtures):
    tickets, draws, expected = max_3d_fixtures
    ev = get_evaluator("3d")
    histories = [ev.history_match(t, draws) for t in tickets]

    assert len(histories) == len(expected["history"])
    for hist, exp_hist in zip(histories, expected["history"]):
        assert hist.ticket_no == exp_hist["ticket_no"]
        assert hist.numbers_display == exp_hist["numbers_display"]
        assert hist.total_hits == exp_hist["total_hits"]
        assert hist.by_tier == exp_hist["by_tier"]
        actual_occ = [list(o) for o in hist.occurrences]
        assert actual_occ == exp_hist["occurrences"]

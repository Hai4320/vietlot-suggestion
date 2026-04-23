"""CLI smoke tests: invalid input, product filter, and the graceful
'unsupported' report for games without a registered evaluator.
"""

from __future__ import annotations

from click.testing import CliRunner

from vietlott.cli.check_rate import check_rate


def test_cli_unsupported_game_reports_cleanly(tmp_path):
    """Unregistered game names should not crash — report 'no evaluator' and keep going."""
    csv_path = tmp_path / "tickets.csv"
    # Use a clearly fake game name to exercise the unsupported path now that
    # all 5 Vietlott products have registered evaluators (post-Phase 5).
    csv_path.write_text(
        "game,algorithm,ticket_no,numbers,special\nfake_game,manual,1,1 2 3 4 5,\nfake_game,manual,2,6 7 8 9 10,\n",
        encoding="utf-8",
    )
    runner = CliRunner()
    result = runner.invoke(check_rate, [str(csv_path)])
    assert result.exit_code == 0, result.output
    assert "VIETLOTT CHECK-RATE" in result.output
    assert "2 tickets" in result.output
    assert "no evaluator" in result.output


def test_cli_invalid_csv_exits_nonzero(tmp_path):
    csv_path = tmp_path / "bad.csv"
    csv_path.write_text("foo,bar\n1,2\n", encoding="utf-8")
    runner = CliRunner()
    result = runner.invoke(check_rate, [str(csv_path)])
    assert result.exit_code != 0


def test_cli_product_filter(tmp_path):
    csv_path = tmp_path / "tickets.csv"
    csv_path.write_text(
        "game,algorithm,ticket_no,numbers,special\npower_535,x,1,1 2 3 4 5,3\npower_655,x,1,1 2 3 4 5 6,\n",
        encoding="utf-8",
    )
    runner = CliRunner()
    result = runner.invoke(check_rate, [str(csv_path), "--product", "power_535"])
    assert result.exit_code == 0
    assert "1 tickets" in result.output
    assert "power_535" in result.output

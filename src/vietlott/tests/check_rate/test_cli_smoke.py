"""Phase 0 — CLI smoke test: no evaluators registered → graceful 'unsupported' report."""

from __future__ import annotations

from click.testing import CliRunner

from vietlott.cli.check_rate import check_rate


def test_cli_unsupported_games_reports_cleanly(tmp_path):
    csv_path = tmp_path / "tickets.csv"
    csv_path.write_text(
        "game,algorithm,ticket_no,numbers,special\n"
        "power_535,diversity_v1,1,7 9 10 16 19,3\n"
        "power_535,diversity_v1,2,2 4 11 20 28,8\n"
        "power_655,diversity_v1,1,5 10 14 23 24 38,\n",
        encoding="utf-8",
    )
    runner = CliRunner()
    result = runner.invoke(check_rate, [str(csv_path)])
    assert result.exit_code == 0, result.output
    assert "VIETLOTT CHECK-RATE" in result.output
    assert "3 tickets" in result.output
    assert "2 (game × algorithm) groups" in result.output
    assert "no evaluator" in result.output or "Phase 0" in result.output


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

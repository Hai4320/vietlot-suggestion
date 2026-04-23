"""Phase 0 — CSV parser + structural validation."""

from __future__ import annotations

import pytest

from vietlott.check_rate.io import CsvFormatError, read_tickets, write_tickets
from vietlott.check_rate.models import Ticket


def test_read_valid_csv(tmp_path):
    csv_path = tmp_path / "tickets.csv"
    csv_path.write_text(
        "game,algorithm,ticket_no,numbers,special\n"
        "power_535,diversity_v1,1,7 9 10 16 19,3\n"
        "power_655,diversity_v1,1,5 10 14 23 24 38,\n"
        "3d,manual,1,015,\n",
        encoding="utf-8",
    )
    tickets = read_tickets(csv_path)
    assert len(tickets) == 3
    assert tickets[0] == Ticket("power_535", "diversity_v1", 1, "7 9 10 16 19", 3)
    assert tickets[1] == Ticket("power_655", "diversity_v1", 1, "5 10 14 23 24 38", None)
    assert tickets[2] == Ticket("3d", "manual", 1, "015", None)


def test_missing_column_rejected(tmp_path):
    csv_path = tmp_path / "bad.csv"
    csv_path.write_text("game,algorithm,ticket_no,numbers\npower_535,x,1,1 2 3 4 5\n", encoding="utf-8")
    with pytest.raises(CsvFormatError, match="Missing columns"):
        read_tickets(csv_path)


def test_empty_game_rejected(tmp_path):
    csv_path = tmp_path / "bad.csv"
    csv_path.write_text(
        "game,algorithm,ticket_no,numbers,special\n,diversity,1,1 2 3 4 5,\n",
        encoding="utf-8",
    )
    with pytest.raises(CsvFormatError, match="game is empty"):
        read_tickets(csv_path)


def test_ticket_no_must_be_int(tmp_path):
    csv_path = tmp_path / "bad.csv"
    csv_path.write_text(
        "game,algorithm,ticket_no,numbers,special\npower_535,x,abc,1 2 3 4 5,3\n",
        encoding="utf-8",
    )
    with pytest.raises(CsvFormatError, match="ticket_no must be int"):
        read_tickets(csv_path)


def test_special_must_be_int_or_empty(tmp_path):
    csv_path = tmp_path / "bad.csv"
    csv_path.write_text(
        "game,algorithm,ticket_no,numbers,special\npower_535,x,1,1 2 3 4 5,notanumber\n",
        encoding="utf-8",
    )
    with pytest.raises(CsvFormatError, match="special must be int"):
        read_tickets(csv_path)


def test_empty_numbers_rejected(tmp_path):
    csv_path = tmp_path / "bad.csv"
    csv_path.write_text(
        "game,algorithm,ticket_no,numbers,special\npower_535,x,1,,3\n",
        encoding="utf-8",
    )
    with pytest.raises(CsvFormatError, match="numbers is empty"):
        read_tickets(csv_path)


def test_utf8_bom_tolerated(tmp_path):
    csv_path = tmp_path / "bom.csv"
    csv_path.write_bytes(b"\xef\xbb\xbfgame,algorithm,ticket_no,numbers,special\npower_535,x,1,1 2 3 4 5,3\n")
    tickets = read_tickets(csv_path)
    assert len(tickets) == 1
    assert tickets[0].game == "power_535"


def test_write_then_read_roundtrip(tmp_path):
    csv_path = tmp_path / "out.csv"
    src = [
        Ticket("power_535", "diversity_v1", 1, "7 9 10 16 19", 3),
        Ticket("3d", "manual", 1, "015", None),
    ]
    write_tickets(csv_path, src)
    rt = read_tickets(csv_path)
    assert rt == src


def test_write_append_preserves_header_once(tmp_path):
    csv_path = tmp_path / "out.csv"
    write_tickets(csv_path, [Ticket("power_535", "a", 1, "1 2 3 4 5", 3)])
    write_tickets(csv_path, [Ticket("power_655", "a", 1, "1 2 3 4 5 6", None)], append=True)
    content = csv_path.read_text(encoding="utf-8")
    assert content.count("game,algorithm") == 1
    tickets = read_tickets(csv_path)
    assert len(tickets) == 2

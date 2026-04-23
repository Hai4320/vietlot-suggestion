"""CSV I/O for check-rate tickets."""

from __future__ import annotations

import csv
from pathlib import Path

from vietlott.check_rate.models import Ticket

REQUIRED_COLUMNS = ["game", "algorithm", "ticket_no", "numbers", "special"]


class CsvFormatError(ValueError):
    pass


def read_tickets(path: Path) -> list[Ticket]:
    """Parse a check-rate CSV into Ticket objects. Structural validation only
    — per-product semantic checks (number count, range) are delegated to the
    evaluator.
    """
    if not path.exists():
        raise FileNotFoundError(path)

    tickets: list[Ticket] = []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise CsvFormatError("Empty CSV (no header row)")
        missing = [c for c in REQUIRED_COLUMNS if c not in reader.fieldnames]
        if missing:
            raise CsvFormatError(f"Missing columns: {missing}. Expected: {REQUIRED_COLUMNS}")

        for row_idx, row in enumerate(reader, start=2):  # start=2 because header is row 1
            try:
                tickets.append(_parse_row(row))
            except ValueError as e:
                raise CsvFormatError(f"Row {row_idx}: {e}") from e

    return tickets


def _parse_row(row: dict[str, str]) -> Ticket:
    game = (row.get("game") or "").strip()
    if not game:
        raise ValueError("game is empty")

    algorithm = (row.get("algorithm") or "").strip()
    if not algorithm:
        raise ValueError("algorithm is empty")

    ticket_no_raw = (row.get("ticket_no") or "").strip()
    try:
        ticket_no = int(ticket_no_raw)
    except ValueError as e:
        raise ValueError(f"ticket_no must be int, got {ticket_no_raw!r}") from e

    numbers_raw = (row.get("numbers") or "").strip()
    if not numbers_raw:
        raise ValueError("numbers is empty")

    special_raw = (row.get("special") or "").strip()
    special: int | None
    if special_raw == "":
        special = None
    else:
        try:
            special = int(special_raw)
        except ValueError as e:
            raise ValueError(f"special must be int or empty, got {special_raw!r}") from e

    return Ticket(
        game=game,
        algorithm=algorithm,
        ticket_no=ticket_no,
        numbers_raw=numbers_raw,
        special=special,
    )


def write_tickets(path: Path, tickets: list[Ticket], append: bool = False) -> None:
    """Write tickets to CSV. Creates header if file doesn't exist or overwrite mode."""
    mode = "a" if append and path.exists() else "w"
    write_header = mode == "w"

    with path.open(mode, encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        if write_header:
            writer.writerow(REQUIRED_COLUMNS)
        for t in tickets:
            writer.writerow(
                [
                    t.game,
                    t.algorithm,
                    t.ticket_no,
                    t.numbers_raw,
                    "" if t.special is None else t.special,
                ]
            )

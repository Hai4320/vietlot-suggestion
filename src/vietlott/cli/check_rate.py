"""Check-rate CLI — score user ticket CSVs against Vietlott history.

Usage:
    vietlott-check-rate tickets.csv
    vietlott-check-rate tickets.csv --backtest-draws 100 --latest-n 3
    vietlott-check-rate tickets.csv --product power_535
"""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path

import click
from loguru import logger

from vietlott.check_rate.evaluators import base as evaluator_base
from vietlott.check_rate.io import CsvFormatError, read_tickets
from vietlott.check_rate.loader import load_draws
from vietlott.check_rate.models import Ticket
from vietlott.check_rate.reporter import format_eval, format_history, format_latest


@click.command()
@click.argument("input_csv", type=click.Path(exists=True, dir_okay=False, path_type=Path))
@click.option("--backtest-draws", "-b", default=50, type=int, help="Number of recent draws to score against")
@click.option("--latest-n", "-l", default=1, type=int, help="Highlight the latest N draws per group")
@click.option("--product", "-p", default=None, help="Filter tickets to a single product")
def check_rate(input_csv: Path, backtest_draws: int, latest_n: int, product: str | None) -> None:
    """Score a CSV of tickets and report hit rates per (game × algorithm)."""
    try:
        tickets = read_tickets(input_csv)
    except CsvFormatError as e:
        logger.error(f"Invalid CSV: {e}")
        raise SystemExit(1)

    if product:
        tickets = [t for t in tickets if t.game == product]
        if not tickets:
            logger.warning(f"No tickets match --product {product}")
            return

    groups = _group_tickets(tickets)
    click.echo("")
    click.echo("=" * 72)
    click.echo(f"  VIETLOTT CHECK-RATE — {input_csv.name}")
    click.echo(f"  {len(tickets)} tickets · {len(groups)} (game × algorithm) groups")
    click.echo("=" * 72)

    # Cache draws per game so we don't reload jsonl each group
    draws_cache: dict[str, list[dict]] = {}
    for (game, algo), group_tickets in groups.items():
        evaluator = evaluator_base.get_evaluator(game)
        if evaluator is None:
            _report_unsupported(game, algo, group_tickets)
            continue

        draws = draws_cache.get(game)
        if draws is None:
            try:
                draws = load_draws(game)
            except Exception as e:
                logger.error(f"Failed to load draws for {game}: {e}")
                continue
            draws_cache[game] = draws

        window = draws[-backtest_draws:] if backtest_draws > 0 else draws
        result = evaluator.evaluate(group_tickets, window)
        click.echo("")
        click.echo(format_eval(result))

        if latest_n > 0:
            latest_block = format_latest(result.per_draw_hits, latest_n, game, algo)
            if latest_block:
                click.echo("")
                click.echo(latest_block)

        click.echo("")
        history = [evaluator.history_match(t, draws) for t in group_tickets]
        click.echo(format_history(history, game))
        click.echo("")


def _group_tickets(tickets: list[Ticket]) -> dict[tuple[str, str], list[Ticket]]:
    groups: dict[tuple[str, str], list[Ticket]] = defaultdict(list)
    for t in tickets:
        groups[(t.game, t.algorithm)].append(t)
    return dict(groups)


def _report_unsupported(game: str, algo: str, tickets: list[Ticket]) -> None:
    click.echo("")
    click.echo(f"--- {game} / {algo}  ({len(tickets)} tickets) ---")
    registered = evaluator_base.registered_games()
    if registered:
        click.echo(f"  ⚠  no evaluator registered for game={game!r}; registered: {registered}")
    else:
        click.echo(f"  ⚠  no evaluators registered yet (Phase 0 foundation). game={game!r}")


if __name__ == "__main__":
    check_rate()

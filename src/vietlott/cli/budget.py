"""vietlott-budget — Budget-aware ticket portfolio CLI.

Reads Chu Kỳ 24 top portfolio spec from website/research/optimization/cycle24_portfolios.json
and generates 10 fresh tickets for the user to play.

Usage:
    vietlott-budget --product power_655
    vietlott-budget --product max_3d --budget 100000
    vietlott-budget --product max_3d_pro --csv > tickets.csv  # check-rate compatible CSV

See proposals/executed/cycle24_budget_aware.md for pre-reg.
"""
from __future__ import annotations

import json
import sys
from datetime import date as _date
from importlib import util as _imputil
from pathlib import Path

import click

REPO_ROOT = Path(__file__).resolve().parents[3]
RESEARCH_DIR = REPO_ROOT / "website" / "research"
OPTIMIZATION_DIR = RESEARCH_DIR / "optimization"
PORTFOLIOS_JSON = OPTIMIZATION_DIR / "cycle24_portfolios.json"

PRODUCT_LABELS = {
    "power_655": "Power 6/55",
    "power_645": "Mega 6/45",
    "power_535": "Power 5/35",
    "max_3d": "Max 3D",
    "max_3d_pro": "Max 3D Pro",
}

DEFAULT_BUDGET = 100_000


def _load_allocator_module():
    """Dynamically import the cycle24_allocator module from research layer."""
    path = OPTIMIZATION_DIR / "cycle24_allocator.py"
    spec = _imputil.spec_from_file_location("_cycle24_allocator", path)
    assert spec and spec.loader
    mod = _imputil.module_from_spec(spec)
    sys.modules["_cycle24_allocator"] = mod
    spec.loader.exec_module(mod)
    return mod


def _spec_from_top(top: dict):
    """Rebuild a PortfolioSpec-like object from JSON entry (kind + params + label)."""
    alloc = _load_allocator_module()
    return alloc.PortfolioSpec(top["kind"], top["params"], top["label"])


def _today_tickets(product_key: str, top: dict):
    """Generate 10 fresh tickets for 'today' using the top portfolio spec."""
    alloc = _load_allocator_module()
    product_cfg = alloc.PRODUCT_CONFIGS[product_key]
    strats = product_cfg["strats"]()
    spec = _spec_from_top(top)

    if product_cfg["type"] == "matrix":
        df = alloc.load_matrix_data(product_key)
        matrix_cfg = alloc.MATRIX_PRODUCTS[product_key]
        target_date = _date.today()
        # Use all history as train
        import random as _r
        _r.seed(None)  # fresh seed for user-facing generation
        tickets = alloc._build_portfolio_matrix(spec, strats, df, target_date, matrix_cfg)
        return [sorted(t) for t in tickets]
    else:
        # 3D / 3D Pro — load draws, generate tickets from full history
        cfg = alloc.PRODUCTS_3D[product_key]
        draws = alloc.load_3d_data(cfg["file"])
        tickets = alloc._build_portfolio_3d(spec, strats, draws, product_key)
        return tickets


def _format_ticket_matrix(ticket: list, nums_slug: str) -> str:
    return " ".join(f"{n:>2d}" for n in ticket)


def _format_ticket_3d(ticket, is_pair: bool) -> str:
    if is_pair:
        return f"{ticket[0]} {ticket[1]}"
    return ticket[0]


@click.command()
@click.option("--product", "-p", required=True,
              type=click.Choice(list(PRODUCT_LABELS.keys())),
              help="Product key (power_655, power_645, power_535, max_3d, max_3d_pro)")
@click.option("--budget", "-b", default=DEFAULT_BUDGET, type=int,
              help=f"Budget in VND (default {DEFAULT_BUDGET} = 10 tickets). "
                   "Only {DEFAULT_BUDGET} is pre-registered; other values = experimental.")
@click.option("--csv", is_flag=True, help="Emit check-rate compatible CSV instead of human-readable output")
@click.option("--portfolios-json", type=click.Path(exists=True, dir_okay=False, path_type=Path),
              default=PORTFOLIOS_JSON, help="Override portfolios JSON path (for testing)")
def budget(product: str, budget: int, csv: bool, portfolios_json: Path) -> None:
    """Print top-ranked 10-ticket portfolio for a product at given budget."""
    data = json.loads(portfolios_json.read_text())
    product_data = data["products"].get(product)
    if not product_data:
        click.echo(f"ERROR: product '{product}' not in portfolios JSON", err=True)
        sys.exit(1)

    top = product_data["top_portfolio"]
    if not top:
        click.echo(f"ERROR: no top portfolio for {product}", err=True)
        sys.exit(1)

    canonical_budget = data["budget_vnd"]
    experimental = budget != canonical_budget

    tickets = _today_tickets(product, top)

    if csv:
        _emit_csv(product, top, tickets)
        return

    _emit_human(product, budget, canonical_budget, experimental,
                product_data, top, tickets)


def _emit_human(product: str, budget: int, canonical_budget: int, experimental: bool,
                product_data: dict, top: dict, tickets: list) -> None:
    label = PRODUCT_LABELS[product]
    click.echo(f"\n{'═' * 70}")
    click.echo(f"  💰 Budget Portfolio — {label}")
    click.echo(f"{'═' * 70}")
    click.echo(f"  Budget: {budget:,} VND  ({budget // 10_000} tickets @ 10K)")
    if experimental:
        click.echo(f"  ⚠ EXPERIMENTAL: canonical budget = {canonical_budget:,} VND. "
                   "Numbers below use canonical portfolio spec, NOT re-optimized for your budget.")

    null_pick = product_data.get("null_pick", False)
    if null_pick:
        click.echo("  ⚠ KHÔNG CÓ EDGE XÁC NHẬN — strategy này không vượt split-half + forward verify.")
        click.echo("    Portfolio dưới đây dựa trên top-composite trong null field, chỉ tham khảo.")

    click.echo(f"\n  Portfolio: {top['label']}")
    click.echo(f"  Expected stats (100 forward draws × 5 runs):")
    click.echo(f"    E[payout/draw]  = {top['expected_payout_vnd']:>10,.0f} VND")
    click.echo(f"    P(win ≥ 1)      = {top['p_win_ge1']:.2%}")
    click.echo(f"    Historical ROI  = {top['roi_pct']:+.2f}%")
    click.echo(f"    Composite score = {top['composite_score']:+.3f}")

    click.echo(f"\n  🎫 10 tickets for today ({_date.today()}):")
    for i, t in enumerate(tickets, 1):
        if product in ("power_655", "power_645", "power_535"):
            click.echo(f"    #{i:>2d}: {_format_ticket_matrix(t, product)}")
        elif product == "max_3d":
            click.echo(f"    #{i:>2d}: {_format_ticket_3d(t, False)}")
        else:  # max_3d_pro
            click.echo(f"    #{i:>2d}: {_format_ticket_3d(t, True)}")

    click.echo()
    click.echo("  ⚠ EV luôn âm. Xổ số là may rủi. Không thuật toán nào đảm bảo lợi nhuận.")
    click.echo(f"{'═' * 70}\n")


def _emit_csv(product: str, top: dict, tickets: list) -> None:
    """CSV compatible with check-rate: game, algorithm, ticket_no, numbers, special"""
    algo = top["label"].replace(",", ";")  # comma-escape for CSV safety
    click.echo("game,algorithm,ticket_no,numbers,special")
    for i, t in enumerate(tickets, 1):
        if product == "power_535":
            # Main 5 numbers; no auto-generated special number (user picks)
            nums = " ".join(str(n) for n in t)
            click.echo(f"{product},{algo},{i},{nums},")
        elif product in ("power_645", "power_655"):
            nums = " ".join(str(n) for n in t)
            click.echo(f"{product},{algo},{i},{nums},")
        elif product == "max_3d":
            click.echo(f"3d,{algo},{i},{t[0]},")
        else:  # max_3d_pro
            click.echo(f"3d_pro,{algo},{i},{t[0]} {t[1]},")


if __name__ == "__main__":
    budget()

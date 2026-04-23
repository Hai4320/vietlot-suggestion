"""
Suggest lottery numbers for Vietlott products.

Generates N suggested tickets using a diversity-optimized algorithm,
then evaluates historical winning performance via backtest.

Usage:
    vietlott-suggest power_535 --tickets 10
    vietlott-suggest power_535 --tickets 5 --backtest-draws 100
"""

import math
import random
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from itertools import combinations

import click
import polars as pl
from loguru import logger
from tabulate import tabulate

from vietlott.config.products import ProductConfig, get_config, product_config_map

# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------


def load_data(cfg: ProductConfig) -> pl.DataFrame:
    """Load and normalise the NDJSON data file for a product."""
    df = pl.read_ndjson(cfg.raw_path)
    if "date" not in df.columns:
        raise ValueError("Data file missing 'date' column")

    # Normalise dates
    if df["date"].dtype in (pl.Date, pl.Datetime):
        df = df.with_columns(pl.col("date").cast(pl.Date))
    elif df["date"].dtype in (pl.Int64, pl.Int32, pl.Float64):
        mx = df["date"].max()
        if mx > 1_000_000_000_000:
            df = df.with_columns((pl.col("date").cast(pl.Int64) / 1000).cast(pl.Datetime("ms")).cast(pl.Date))
        else:
            df = df.with_columns(pl.col("date").cast(pl.Int64).cast(pl.Datetime("s")).cast(pl.Date))
    else:
        df = df.with_columns(pl.col("date").str.to_date(strict=False))

    return df.sort(["date", "id"])


def detect_game_shape(cfg: ProductConfig, df: pl.DataFrame):
    """Detect main-number count, main range, and special range from data."""
    specials = [r[5] for r in df["result"].to_list() if len(r) > 5]
    has_special = len(specials) > 0 and max(specials) <= 12

    main_size = cfg.size_output  # e.g. 6 for power655, 5 for power535
    if has_special:
        main_size = min(main_size, 5)
        sp_max = max(specials)
    else:
        sp_max = 0

    return main_size, cfg.min_value, cfg.max_value, 1 if has_special else 0, sp_max


# ---------------------------------------------------------------------------
# Statistics engine
# ---------------------------------------------------------------------------


class Stats:
    """Pre-compute all statistics needed by the generator."""

    def __init__(self, df: pl.DataFrame, main_size: int, num_min: int, num_max: int, sp_max: int):
        self.records = []
        for row in df.iter_rows(named=True):
            self.records.append(row)

        self.main_size = main_size
        self.num_min = num_min
        self.num_max = num_max
        self.num_range = list(range(num_min, num_max + 1))
        self.sp_max = sp_max
        self.n_draws = len(self.records)

        self._compute()

    # -- internals ----------------------------------------------------------

    def _compute(self):
        n = self.main_size
        # All-time frequency
        self.freq_all = Counter()
        for r in self.records:
            for v in r["result"][:n]:
                self.freq_all[v] += 1

        # 30-day frequency
        cutoff_30 = self.records[-1]["date"] - timedelta(days=30)
        recent_30 = [r for r in self.records if r["date"] >= cutoff_30]
        self.freq_30 = Counter()
        for r in recent_30:
            for v in r["result"][:n]:
                self.freq_30[v] += 1

        # 14-day frequency
        cutoff_14 = self.records[-1]["date"] - timedelta(days=14)
        recent_14 = [r for r in self.records if r["date"] >= cutoff_14]
        self.freq_14 = Counter()
        for r in recent_14:
            for v in r["result"][:n]:
                self.freq_14[v] += 1

        # Days since last appearance
        last_seen = {}
        for r in self.records:
            for v in r["result"][:n]:
                last_seen[v] = r["date"]
        latest = self.records[-1]["date"]
        self.days_since = {}
        for v in self.num_range:
            ls = last_seen.get(v)
            self.days_since[v] = (latest - ls).days if ls else 999

        # Composite score
        mf30 = max(self.freq_30.values()) if self.freq_30 else 1
        mf14 = max(self.freq_14.values()) if self.freq_14 else 1
        mds = max(self.days_since.values()) if self.days_since else 1
        mfa = max(self.freq_all.values()) if self.freq_all else 1
        self.scores = {}
        for v in self.num_range:
            self.scores[v] = (
                0.30 * self.freq_30.get(v, 0) / mf30
                + 0.25 * self.freq_14.get(v, 0) / mf14
                + 0.20 * self.days_since[v] / mds
                + 0.15 * self.freq_all.get(v, 0) / mfa
            )

        # Sum statistics
        sums = [sum(r["result"][:n]) for r in self.records]
        self.sum_mean = sum(sums) / len(sums)
        self.sum_std = (sum((s - self.sum_mean) ** 2 for s in sums) / len(sums)) ** 0.5
        self.sum_lo = self.sum_mean - self.sum_std
        self.sum_hi = self.sum_mean + self.sum_std

        # Special-number stats
        if self.sp_max > 0:
            self.sp_freq = Counter(r["result"][n] for r in self.records)
            sp_last = {}
            for r in self.records:
                sp_last[r["result"][n]] = r["date"]
            self.sp_days = {}
            for v in range(1, self.sp_max + 1):
                ls = sp_last.get(v)
                self.sp_days[v] = (latest - ls).days if ls else 999

    def ranked_numbers(self):
        """Numbers sorted by composite score descending."""
        return sorted(self.num_range, key=lambda x: -self.scores[x])

    def ranked_specials(self):
        """Special numbers sorted by composite score descending."""
        if self.sp_max == 0:
            return []
        mfa = max(self.sp_freq.values()) if self.sp_freq else 1
        mds = max(self.sp_days.values()) if self.sp_days else 1
        sp_scores = {}
        for n in range(1, self.sp_max + 1):
            sp_scores[n] = 0.50 * self.sp_freq.get(n, 0) / mfa + 0.50 * self.sp_days.get(n, 0) / mds
        return sorted(range(1, self.sp_max + 1), key=lambda x: -sp_scores[x])


# ---------------------------------------------------------------------------
# Ticket generator  (diversity-first, score-seeded)
# ---------------------------------------------------------------------------


def generate_tickets(stats: Stats, n_tickets: int, seed: int | None = None) -> list[dict]:
    """
    Generate *n_tickets* tickets with maximum coverage.

    Constraints enforced:
      - Each main number appears in at most ceil(n_tickets * main_size / num_count) + 1 tickets
      - Sum within 1-sigma band when possible
      - Special numbers spread across all tickets
    """
    rng = random.Random(seed)
    n = stats.main_size
    nums = stats.num_range
    num_count = len(nums)

    # Maximum times a number may repeat across tickets
    max_repeat = math.ceil(n_tickets * n / num_count) + 1

    ranked = stats.ranked_numbers()

    # --- Phase 1: greedy seed from top-scored, respecting diversity ---
    usage = Counter()
    tickets = []

    # Split numbers into tiers
    tier_size = math.ceil(num_count / 3)
    tier_hot = set(ranked[:tier_size])
    tier_mid = set(ranked[tier_size : 2 * tier_size])
    tier_cold = set(ranked[2 * tier_size :])

    for i in range(n_tickets):
        available = [v for v in nums if usage[v] < max_repeat]
        if len(available) < n:
            available = list(nums)  # fallback

        # Score-weighted sampling: higher score -> higher chance
        weights = [stats.scores.get(v, 0.01) + 0.01 for v in available]

        best, best_q = None, -1
        for _ in range(8000):
            pick = set()
            pool = list(available)
            w = list(weights)
            while len(pick) < n and pool:
                chosen = rng.choices(pool, weights=w, k=1)[0]
                pick.add(chosen)
                idx = pool.index(chosen)
                pool.pop(idx)
                w.pop(idx)

            if len(pick) < n:
                continue

            pick_sorted = tuple(sorted(pick))
            s = sum(pick_sorted)

            # Quality: sum in range +3, tier diversity +2, low reuse +1
            q = 0
            if stats.sum_lo <= s <= stats.sum_hi:
                q += 3
            tiers_hit = bool(pick & tier_hot) + bool(pick & tier_mid) + bool(pick & tier_cold)
            q += tiers_hit
            # Penalise heavy reuse
            reuse = sum(usage[v] for v in pick)
            q -= reuse * 0.3

            if q > best_q:
                best_q = q
                best = pick_sorted

        if best is None:
            best = tuple(sorted(rng.sample(available, n)))

        for v in best:
            usage[v] += 1
        tickets.append(list(best))

    # --- Phase 2: assign special numbers with maximum spread ---
    sp_list = []
    if stats.sp_max > 0:
        sp_ranked = stats.ranked_specials()
        sp_pool = list(sp_ranked)
        # Round-robin through ranked specials
        for i in range(n_tickets):
            sp_list.append(sp_pool[i % len(sp_pool)])
        rng.shuffle(sp_list)
    else:
        sp_list = [0] * n_tickets

    results = []
    for t, sp in zip(tickets, sp_list):
        results.append({"main": t, "special": sp})
    return results


# ---------------------------------------------------------------------------
# Backtest engine
# ---------------------------------------------------------------------------


def backtest_tickets(stats: Stats, tickets: list[dict], n_draws: int) -> dict:
    """
    Simulate the given tickets against the last *n_draws* historical draws.

    For each draw, check the best match across all tickets.
    Returns match distribution, prize counts, and financial summary.
    """
    n = stats.main_size
    test_records = stats.records[-n_draws:]
    if not test_records:
        return {}

    # Prize table for power_535
    # 5 main + sp = Jackpot, 5 main = 2nd, 4+sp = 3rd, 4 = 4th, 3+sp = 5th, else encourage
    prize_table = {
        (5, True): ("Jackpot", 6_000_000_000),
        (5, False): ("2nd", 5_000_000),
        (4, True): ("3rd", 500_000),
        (4, False): ("4th", 100_000),
        (3, True): ("5th", 30_000),
    }
    encourage_conditions = lambda m, sp: ((m == 3 and not sp) or (m == 2 and sp) or (m == 1 and sp) or (m == 0 and sp))

    match_dist = Counter()  # best main match per draw
    prize_counter = Counter()
    total_winnings = 0
    per_draw = []

    for rec in test_records:
        draw_main = set(rec["result"][:n])
        draw_sp = rec["result"][n] if len(rec["result"]) > n else 0

        best_main = 0
        best_sp = False
        best_ticket_idx = 0

        for i, tk in enumerate(tickets):
            m = len(set(tk["main"]) & draw_main)
            sp_match = tk["special"] == draw_sp if stats.sp_max > 0 else False
            if m > best_main or (m == best_main and sp_match and not best_sp):
                best_main = m
                best_sp = sp_match
                best_ticket_idx = i

        match_dist[best_main] += 1

        prize_name = None
        prize_amt = 0
        key = (best_main, best_sp)
        if key in prize_table:
            prize_name, prize_amt = prize_table[key]
        elif encourage_conditions(best_main, best_sp):
            prize_name = "Encourage"
            prize_amt = 10_000

        if prize_name:
            prize_counter[prize_name] += 1
            total_winnings += prize_amt

        per_draw.append(
            {
                "date": str(rec["date"]),
                "id": rec["id"],
                "draw": rec["result"][:n],
                "best_match": best_main,
                "sp_match": best_sp,
                "prize": prize_name,
                "amount": prize_amt,
            }
        )

    n_tickets = len(tickets)
    total_cost = n_draws * n_tickets * 10_000
    roi = (total_winnings - total_cost) / total_cost * 100 if total_cost else 0

    return {
        "n_draws": n_draws,
        "n_tickets": n_tickets,
        "match_dist": dict(sorted(match_dist.items(), reverse=True)),
        "prize_counter": dict(prize_counter),
        "total_cost": total_cost,
        "total_winnings": total_winnings,
        "roi": roi,
        "per_draw": per_draw,
    }


# ---------------------------------------------------------------------------
# Formatters
# ---------------------------------------------------------------------------


def format_tickets_table(tickets: list[dict], stats: Stats) -> str:
    """Render a human-readable table of suggested tickets."""
    rows = []
    n = stats.main_size
    for i, tk in enumerate(tickets, 1):
        nums = tk["main"]
        s = sum(nums)
        odd = sum(1 for v in nums if v % 2 == 1)
        high = sum(1 for v in nums if v > (stats.num_max + stats.num_min) // 2)
        sp_str = str(tk["special"]) if tk["special"] else "-"
        rows.append([i, nums, sp_str, s, f"{odd}/{n - odd}", f"{high}/{n - high}"])

    headers = ["#", "Main Numbers", "Sp", "Sum", "Odd/Even", "High/Low"]
    return tabulate(rows, headers=headers, tablefmt="simple")


def format_coverage(tickets: list[dict], stats: Stats) -> str:
    """Show how well the tickets cover the number space."""
    all_main = Counter()
    all_sp = Counter()
    for tk in tickets:
        for v in tk["main"]:
            all_main[v] += 1
        if tk["special"]:
            all_sp[tk["special"]] += 1

    unique_main = len(all_main)
    total_main = len(stats.num_range)
    unique_sp = len(all_sp) if stats.sp_max else 0
    total_sp = stats.sp_max

    # 3-subset coverage
    three_subs = set()
    for tk in tickets:
        for combo in combinations(tk["main"], 3):
            three_subs.add(combo)
    total_3 = math.comb(total_main, 3)

    lines = [
        f"Main numbers covered: {unique_main}/{total_main} ({unique_main / total_main * 100:.0f}%)",
    ]
    if stats.sp_max:
        lines.append(f"Special numbers covered: {unique_sp}/{total_sp} ({unique_sp / total_sp * 100:.0f}%)")
    lines.append(f"3-number subsets covered: {len(three_subs)}/{total_3} ({len(three_subs) / total_3 * 100:.2f}%)")
    max_repeat = max(all_main.values())
    lines.append(f"Max repeats per number: {max_repeat}")
    return "\n".join(lines)


def format_backtest(bt: dict) -> str:
    """Render the backtest results."""
    if not bt:
        return "No backtest data."

    lines = []
    lines.append(f"Backtest: {bt['n_draws']} draws x {bt['n_tickets']} tickets")
    lines.append(f"Total cost:     {bt['total_cost']:>15,} VND")
    lines.append(f"Total winnings: {bt['total_winnings']:>15,} VND")
    lines.append(f"ROI:            {bt['roi']:>14.1f}%")
    lines.append("")

    # Match distribution
    rows = []
    for k in sorted(bt["match_dist"], reverse=True):
        pct = bt["match_dist"][k] / bt["n_draws"] * 100
        rows.append([f">= {k} main", bt["match_dist"][k], f"{pct:.1f}%"])
    lines.append(tabulate(rows, headers=["Match", "Draws", "%"], tablefmt="simple"))
    lines.append("")

    # Prize breakdown
    if bt["prize_counter"]:
        rows = []
        for prize, cnt in sorted(bt["prize_counter"].items(), key=lambda x: -x[1]):
            rows.append([prize, cnt])
        lines.append(tabulate(rows, headers=["Prize", "Count"], tablefmt="simple"))
    else:
        lines.append("No prizes won in backtest period.")

    # Top wins
    top = [d for d in bt["per_draw"] if d["amount"] > 10_000]
    if top:
        lines.append("")
        lines.append("Notable wins:")
        for d in sorted(top, key=lambda x: -x["amount"])[:10]:
            lines.append(
                f"  {d['date']} #{d['id']}: matched {d['best_match']} main"
                f"{' + special' if d['sp_match'] else ''} -> {d['prize']} ({d['amount']:,} VND)"
            )

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


@click.command()
@click.pass_context
@click.argument("product")
@click.option("--tickets", "-n", default=10, type=int, help="Number of tickets to suggest")
@click.option("--backtest-draws", "-b", default=50, type=int, help="Number of recent draws to backtest against")
@click.option("--seed", "-s", default=None, type=int, help="Random seed for reproducibility")
def suggest(ctx, product, tickets, backtest_draws, seed):
    """
    Suggest lottery numbers and evaluate historical performance.

    PRODUCT is one of: power_535, power_655, power_645, keno, 3d, 3d_pro, bingo18
    """
    if product not in product_config_map:
        logger.error(f"Product must be in: {list(product_config_map.keys())}")
        ctx.exit(1)

    cfg = get_config(product)
    logger.info(f"product={product}, tickets={tickets}, backtest_draws={backtest_draws}")

    # Load data
    df = load_data(cfg)
    logger.info(f"Loaded {len(df)} records from {cfg.raw_path}")

    # Detect game shape
    main_size, num_min, num_max, has_sp, sp_max = detect_game_shape(cfg, df)
    logger.info(f"Game: {main_size} numbers from {num_min}-{num_max}" + (f", special 1-{sp_max}" if has_sp else ""))

    # Build statistics
    stats = Stats(df, main_size, num_min, num_max, sp_max)

    # Generate tickets
    if seed is None:
        seed = int(datetime.now().timestamp())
    ticket_list = generate_tickets(stats, tickets, seed=seed)

    # Backtest
    bt = backtest_tickets(stats, ticket_list, min(backtest_draws, len(stats.records)))

    # ---- Output ----
    click.echo("")
    click.echo(f"{'=' * 60}")
    click.echo(f"  VIETLOTT {product.upper()} — {tickets} SUGGESTED TICKETS")
    click.echo(f"{'=' * 60}")
    click.echo(f"  Data: {len(stats.records)} draws ({stats.records[0]['date']} to {stats.records[-1]['date']})")
    click.echo(
        f"  Game: {main_size} main from {num_min}-{num_max}" + (f", 1 special from 1-{sp_max}" if sp_max else "")
    )
    click.echo(f"  Seed: {seed}")
    click.echo("")

    click.echo("SUGGESTED TICKETS")
    click.echo("-" * 60)
    click.echo(format_tickets_table(ticket_list, stats))
    click.echo("")

    click.echo("COVERAGE")
    click.echo("-" * 60)
    click.echo(format_coverage(ticket_list, stats))
    click.echo("")

    click.echo("BACKTEST PERFORMANCE")
    click.echo("-" * 60)
    click.echo(format_backtest(bt))
    click.echo("")


if __name__ == "__main__":
    suggest()

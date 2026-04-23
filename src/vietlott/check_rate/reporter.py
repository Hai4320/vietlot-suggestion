"""Format EvalResult + HistoryMatch into human-readable tables."""

from __future__ import annotations

from tabulate import tabulate

from vietlott.check_rate.models import EvalResult, HistoryMatch

# Tier display order for 3D match_dist (highest prize first)
_TIER_ORDER = {
    "Giải Đặc biệt": 0,
    "Giải Nhất": 1,
    "Giải Nhì": 2,
    "Giải ba": 3,
    "KK 2 số cuối": 4,
    "Không trúng": 5,
}


def _match_dist_sort_key(k):
    # Power: int match count → descending
    if isinstance(k, int):
        return (0, -k)
    # 3D: tier name → tier order (known tiers first, unknown last)
    return (1, _TIER_ORDER.get(k, 99), k)


def format_eval(result: EvalResult) -> str:
    lines: list[str] = []
    n_plays = result.n_tickets * result.n_draws
    lines.append(
        f"--- {result.game} / {result.algorithm}  "
        f"({result.n_tickets} tickets × {result.n_draws} draws = {n_plays} plays) ---"
    )
    lines.append("")

    # Prize-tier table (% of plays, not draws — each ticket-draw pair is one play)
    if result.prize_counter:
        rows = []
        for prize, count in sorted(result.prize_counter.items(), key=lambda x: -result.prize_winnings.get(x[0], 0)):
            pct = count / n_plays * 100 if n_plays else 0.0
            total = result.prize_winnings.get(prize, 0)
            rows.append([prize, count, f"{pct:.2f}%", f"{total:>15,}"])
        lines.append("Prize tiers:")
        lines.append(tabulate(rows, headers=["Prize", "Count", "% of plays", "Total VND"], tablefmt="simple"))
    else:
        lines.append("Prize tiers: (none)")
    lines.append("")

    # Match distribution — sort key handles both int (Power) and tier-name str (3D)
    if result.match_dist:
        rows = []
        for k in sorted(result.match_dist, key=_match_dist_sort_key):
            v = result.match_dist[k]
            pct = v / n_plays * 100 if n_plays else 0.0
            rows.append([str(k), v, f"{pct:.2f}%"])
        lines.append("Match distribution:")
        lines.append(tabulate(rows, headers=["Match", "Plays", "%"], tablefmt="simple"))
        lines.append("")

    # ROI block
    lines.append(f"Total cost:     {result.total_cost:>15,} VND")
    lines.append(f"Total winnings: {result.total_winnings:>15,} VND")
    lines.append(f"ROI:            {result.roi:>14.2f}%")

    return "\n".join(lines)


def format_history(matches: list[HistoryMatch], game: str) -> str:
    if not matches:
        return "Exact-match history: (no tickets)"
    lines = ["Exact-match history:"]
    for m in matches:
        if m.total_hits == 0:
            lines.append(f"  Ticket #{m.ticket_no}  {m.numbers_display}  →  chưa từng trùng")
        else:
            by_tier_str = ", ".join(f"{k}: {v}" for k, v in m.by_tier.items() if v > 0)
            lines.append(f"  Ticket #{m.ticket_no}  {m.numbers_display}  →  {m.total_hits} lần ({by_tier_str})")
            # Show up to 3 most recent occurrences
            for date, draw_id, tier in m.occurrences[-3:]:
                lines.append(f"      {date}  #{draw_id}  [{tier}]")
    return "\n".join(lines)


def format_latest(
    hits: list,
    latest_n: int,
    game: str,
    algorithm: str,
) -> str:
    """Placeholder for per-draw recent-hits block — filled out in Phase 1+."""
    if latest_n <= 0 or not hits:
        return ""
    lines = [f"Latest {latest_n} draws ({game} / {algorithm}):"]
    recent = sorted({(h.date, h.draw_id) for h in hits})[-latest_n:]
    per_draw_index: dict[tuple[str, str], list] = {}
    for h in hits:
        per_draw_index.setdefault((h.date, h.draw_id), []).append(h)
    for date, draw_id in recent:
        dayhits = [h for h in per_draw_index.get((date, draw_id), []) if h.prize]
        if not dayhits:
            lines.append(f"  {date}  #{draw_id}  →  không trúng giải")
        else:
            for h in dayhits:
                lines.append(f"  {date}  #{draw_id}  ticket #{h.ticket_no}  →  {h.prize}  ({h.amount:,} VND)")
    return "\n".join(lines)

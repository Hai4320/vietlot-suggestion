"""Shared dataclasses for check-rate."""

from __future__ import annotations

import attr


@attr.define
class Ticket:
    game: str
    algorithm: str
    ticket_no: int
    numbers_raw: str  # space-separated ints (Power) or single 3-digit string (3D)
    special: int | None = None


@attr.define
class PerDrawHit:
    date: str
    draw_id: str
    ticket_no: int
    prize: str | None
    amount: int
    detail: dict  # game-specific (e.g. {"match_main": 4, "special_match": True})


@attr.define
class EvalResult:
    game: str
    algorithm: str
    n_tickets: int
    n_draws: int
    match_dist: dict  # game-specific key: int (Power) or str (3D tier)
    prize_counter: dict[str, int]
    prize_winnings: dict[str, int]
    total_cost: int
    total_winnings: int
    per_draw_hits: list[PerDrawHit]

    @property
    def roi(self) -> float:
        if self.total_cost == 0:
            return 0.0
        return (self.total_winnings - self.total_cost) / self.total_cost * 100


@attr.define
class HistoryMatch:
    ticket_no: int
    numbers_display: str
    total_hits: int
    by_tier: dict[str, int]  # tier_name -> count (for Power: "main_exact"; for 3D: per tier)
    occurrences: list[tuple[str, str, str]]  # (date, draw_id, tier)


@attr.define
class GroupKey:
    game: str
    algorithm: str

    def __str__(self) -> str:
        return f"{self.game} / {self.algorithm}"

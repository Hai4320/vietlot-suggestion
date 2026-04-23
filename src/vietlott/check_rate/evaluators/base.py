"""BaseEvaluator + registry for product-specific hit-rate evaluators."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Callable

from vietlott.check_rate.models import EvalResult, HistoryMatch, Ticket

_EVALUATORS: dict[str, BaseEvaluator] = {}


class BaseEvaluator(ABC):
    """One concrete subclass per Vietlott product."""

    game: str  # class attribute; set by subclass

    @abstractmethod
    def parse_numbers(self, ticket: Ticket) -> object:
        """Parse ticket.numbers_raw into a product-specific form (list[int] or str)."""

    @abstractmethod
    def evaluate(
        self,
        tickets: list[Ticket],
        draws: list[dict],
    ) -> EvalResult:
        """Score tickets against draws. draws is ordered oldest → newest."""

    @abstractmethod
    def history_match(
        self,
        ticket: Ticket,
        draws: list[dict],
    ) -> HistoryMatch:
        """Look up how many times this ticket's exact numbers have appeared historically."""


def register(game: str) -> Callable[[type[BaseEvaluator]], type[BaseEvaluator]]:
    def _decorator(cls: type[BaseEvaluator]) -> type[BaseEvaluator]:
        if game in _EVALUATORS:
            raise ValueError(f"Duplicate evaluator registration for game={game}")
        instance = cls()
        instance.game = game
        _EVALUATORS[game] = instance
        return cls

    return _decorator


def get_evaluator(game: str) -> BaseEvaluator | None:
    return _EVALUATORS.get(game)


def registered_games() -> list[str]:
    return sorted(_EVALUATORS)

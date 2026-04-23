// Evaluator registry — mirror of Python BaseEvaluator + @register decorator.

import type { Draw, EvalResult, HistoryMatch, Ticket } from "./types";

export interface Evaluator {
  game: string;
  parseNumbers(ticket: Ticket): number[] | string;
  evaluate(tickets: Ticket[], draws: Draw[]): EvalResult;
  historyMatch(ticket: Ticket, draws: Draw[]): HistoryMatch;
}

const EVALUATORS: Map<string, Evaluator> = new Map();

export function register(evaluator: Evaluator): void {
  if (EVALUATORS.has(evaluator.game)) {
    throw new Error(`Duplicate evaluator registration for game=${evaluator.game}`);
  }
  EVALUATORS.set(evaluator.game, evaluator);
}

export function getEvaluator(game: string): Evaluator | null {
  return EVALUATORS.get(game) ?? null;
}

export function registeredGames(): string[] {
  return Array.from(EVALUATORS.keys()).sort();
}

// Display helpers + parity serializer. Display functions are used by UI
// components; serializeForParity() is used by the Node parity script to
// cross-check TS evaluator output vs Python golden expected.json.

import type { EvalResult, HistoryMatch } from "./types";
import { roi } from "./types";

export function formatVnd(amount: number): string {
  return amount.toLocaleString("en-US") + " VND";
}

export function formatPercent(num: number, denom: number, digits = 2): string {
  if (denom === 0) return "0.00%";
  return ((num / denom) * 100).toFixed(digits) + "%";
}

export function formatRoi(result: EvalResult): string {
  return roi(result).toFixed(2) + "%";
}

/** Serialize EvalResult to the same shape as Python golden expected.json groups[]. */
export function serializeGroupForParity(r: EvalResult) {
  return {
    game: r.game,
    algorithm: r.algorithm,
    n_tickets: r.nTickets,
    n_draws: r.nDraws,
    match_dist: r.matchDist,
    prize_counter: r.prizeCounter,
    prize_winnings: r.prizeWinnings,
    total_cost: r.totalCost,
    total_winnings: r.totalWinnings,
  };
}

/** Serialize HistoryMatch to the same shape as Python golden expected.json history[]. */
export function serializeHistoryForParity(h: HistoryMatch) {
  return {
    ticket_no: h.ticketNo,
    numbers_display: h.numbersDisplay,
    total_hits: h.totalHits,
    by_tier: h.byTier,
    occurrences: h.occurrences.map((o) => [o[0], o[1], o[2]]),
  };
}

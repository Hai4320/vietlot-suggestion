// Mirror of Python vietlott.check_rate.models (camelCase for TS idiom).
// Parity with Python output is verified via scripts/verify_check_rate_parity.mjs
// which serializes camelCase → snake_case for golden JSON comparison.

export interface Ticket {
  game: string;
  algorithm: string;
  ticketNo: number;
  numbersRaw: string;
  special: number | null;
}

export interface Draw {
  date: string;
  id: string;
  result: number[]; // Power: main numbers (JSONL has special appended; website JSON has main only)
  special?: number | null;
}

export interface PerDrawHit {
  date: string;
  drawId: string;
  ticketNo: number;
  prize: string | null;
  amount: number;
  detail: Record<string, unknown>;
}

export interface EvalResult {
  game: string;
  algorithm: string;
  nTickets: number;
  nDraws: number;
  matchDist: Record<string, number>; // keys are stringified for JSON compat
  prizeCounter: Record<string, number>;
  prizeWinnings: Record<string, number>;
  totalCost: number;
  totalWinnings: number;
  perDrawHits: PerDrawHit[];
}

export interface HistoryMatch {
  ticketNo: number;
  numbersDisplay: string;
  totalHits: number;
  byTier: Record<string, number>;
  occurrences: Array<[string, string, string]>; // [date, drawId, tier]
}

export interface GroupKey {
  game: string;
  algorithm: string;
}

export function roi(result: EvalResult): number {
  if (result.totalCost === 0) return 0;
  return ((result.totalWinnings - result.totalCost) / result.totalCost) * 100;
}

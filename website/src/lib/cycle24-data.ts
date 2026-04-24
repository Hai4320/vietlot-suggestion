// Chu kỳ 24 Budget-aware Portfolio — AUTO-SYNCED from research JSON
//
// Source of truth: research/optimization/cycle24_portfolios.json
// This module imports JSON directly — any re-run của cycle24_allocator.py
// sẽ update JSON, và next `npm run build` / dev reload sẽ pick up tự động.
//
// ⚠ Do NOT hand-edit. Run the allocator để update:
//   uv run python website/research/optimization/cycle24_allocator.py

import rawPortfolios from "../../research/optimization/cycle24_portfolios.json";
import type { SuggestionStrategy } from "./types";

// ──────────────────────────── Types ────────────────────────────

export type C24ProductKey =
  | "power_655"
  | "power_645"
  | "power_535"
  | "max_3d"
  | "max_3d_pro";

export type C24PortfolioKind = "pure" | "mixed" | "hedged" | "wheel_mindistance";

export interface C24PortfolioParams {
  strat?: string;
  s1?: string;
  s2?: string;
  k?: number;
}

export interface C24Portfolio {
  rank: number;
  label: string;
  kind: C24PortfolioKind;
  params: C24PortfolioParams;
  n_tickets: number;
  expected_payout_vnd: number;
  p_win_ge1: number;
  roi_pct: number;
  composite_score: number;
  coverage: number;
}

export interface C24Product {
  null_pick: boolean;
  anchors: string[];
  type: "matrix" | "3d" | "3d_pro";
  n_candidates: number;
  top_portfolio: C24Portfolio | null;
  rankings: C24Portfolio[];
}

export interface C24Data {
  cycle: number;
  budget_vnd: number;
  ticket_price_vnd: number;
  n_tickets_per_portfolio: number;
  forward_window: number;
  n_runs: number;
  composite_weights: Record<string, number>;
  products: Record<C24ProductKey, C24Product>;
}

// ─────────────────────── Canonical data (validated at import) ───────────────────────

const data = rawPortfolios as unknown as C24Data;

export const CYCLE24_BUDGET_VND = data.budget_vnd;
export const CYCLE24_N_TICKETS = data.n_tickets_per_portfolio;

/**
 * Map Python strategy anchor name → TS SuggestionStrategy.
 * For strategies without direct TS equivalent, falls back to closest semantic match.
 * Null-pick products may use "B2: TierWeighted" which is approximated by `frequency`
 * (TierWeighted = frequency weighted by tier prize; close approximation for ticket gen).
 */
export function anchorToTSStrategy(anchor: string): SuggestionStrategy {
  // Exact matches first
  if (anchor === "MinDistance") return "mindistance";
  if (anchor === "Freq_Hot") return "frequency";
  if (anchor === "FreqWholeHot") return "frequency";
  if (anchor.includes("PairExploiter")) return "pairexploiter";
  if (anchor.includes("CoverageOpt")) return "coverageopt";
  if (anchor.includes("TierWeighted")) return "frequency"; // approximation; see cycle24-data.ts doc
  // Hedged fallback — "Random" in allocator becomes frequency here
  if (anchor === "Random") return "frequency";
  // Default
  return "frequency";
}

export function getPortfolio(productKey: C24ProductKey): C24Product | null {
  return data.products[productKey] ?? null;
}

export const CYCLE24_DATA = data;

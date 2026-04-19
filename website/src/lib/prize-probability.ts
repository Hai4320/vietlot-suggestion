/**
 * Calculate prize probabilities for a batch of suggested tickets.
 * Uses official Vietlott odds from play-guides.ts.
 */

import { PLAY_GUIDES, type PrizeTier } from "./play-guides";

/** Slug → product key mapping */
const SLUG_TO_KEY: Record<string, string> = {
  "power-655": "power_655",
  "power-645": "power_645",
  "power-535": "power_535",
  "max-3d": "3d",
  "max-3d-pro": "3d_pro",
};

export interface PrizeTierProbability {
  name: string;
  condition: string;
  prize: string;
  /** Per-ticket odds denominator (e.g. 28989675 from "1 : 28.989.675") */
  oddsDenom: number;
  /** Per-ticket probability = 1 / oddsDenom */
  perTicket: number;
  /** Combined probability with N tickets: 1 - (1 - perTicket)^N */
  combined: number;
  /** Whether this is a jackpot/highlight tier */
  highlight: boolean;
}

/**
 * Parse odds string like "1 : 28.989.675" or "1 : 45" into a number.
 * Vietlott uses dots as thousand separators in odds.
 */
function parseOdds(oddsStr: string): number {
  const parts = oddsStr.split(":").map((s) => s.trim());
  if (parts.length !== 2) return Infinity;
  // Remove dots (thousand separators) and parse
  const denom = parseInt(parts[1].replace(/\./g, ""), 10);
  return isNaN(denom) ? Infinity : denom;
}

/**
 * Calculate prize tier probabilities for N tickets.
 */
export function calculatePrizeProbabilities(
  slug: string,
  ticketCount: number,
): PrizeTierProbability[] {
  const key = SLUG_TO_KEY[slug];
  if (!key) return [];

  const guide = PLAY_GUIDES[key];
  if (!guide) return [];

  return guide.prizes.map((tier: PrizeTier) => {
    const oddsDenom = parseOdds(tier.odds);
    const perTicket = oddsDenom === Infinity ? 0 : 1 / oddsDenom;
    // P(win at least once with N tickets) = 1 - (1 - p)^N
    const combined = 1 - Math.pow(1 - perTicket, ticketCount);

    return {
      name: tier.name,
      condition: tier.condition,
      prize: tier.prize,
      oddsDenom,
      perTicket,
      combined,
      highlight: tier.highlight ?? false,
    };
  });
}

/**
 * Format probability in the most readable way.
 * - Very small: "1 : X" format
 * - Medium: "X.XX%" format
 * - Large: "XX.X%" format
 */
export function formatProbability(p: number): string {
  if (p <= 0) return "—";
  if (p >= 1) return "100%";
  if (p < 0.0001) {
    // Use "1 : X" format for very small probabilities
    const inv = Math.round(1 / p);
    return `1 : ${inv.toLocaleString("vi-VN")}`;
  }
  if (p < 0.01) {
    return `${(p * 100).toFixed(3)}%`;
  }
  if (p < 0.1) {
    return `${(p * 100).toFixed(2)}%`;
  }
  return `${(p * 100).toFixed(1)}%`;
}

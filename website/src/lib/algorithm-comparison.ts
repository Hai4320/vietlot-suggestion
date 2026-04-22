// Algorithm-level comparison helpers for the /suggest page.
//
// Bridges cycle22 JSON strategy names ↔ UI SuggestionStrategy keys and exposes
// per-strategy raw metrics (Δ_win, Δ_ROI, win rate, p-value) so the suggestion
// panel can show side-by-side stats instead of a single tooltip.
//
// Source of truth: research/optimization/cycle22_rankings.json (via cycle22-data.ts).

import {
  CYCLE22_PRODUCTS,
  type C22ProductRanking,
  type C22ProfileName,
  type C22RankingEntry,
} from "./cycle22-data";
import type { SuggestionStrategy } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Mapping: JSON strategy name → UI SuggestionStrategy key
//
// Multiple JSON variants can map to one UI key (e.g. Freq_Hot + FreqWholeHot →
// frequency). JSON strategies without UI equivalent (e.g. Ensemble, NotRepeat,
// PairFreq, CondChain, TierWeighted, ULTIMATE_*) are kept in the comparison
// table but NOT clickable.
// ─────────────────────────────────────────────────────────────────────────────

export const JSON_TO_UI: Record<string, SuggestionStrategy> = {
  // Matrix strategies (Power 6/55, 6/45, 5/35)
  MinDistance: "mindistance",
  Freq_Hot: "frequency",
  FreqWholeHot: "frequency",
  Freq_Cold: "absence",
  LongAbsence: "absence",
  MaxEntropy: "maxentropy",
  Pattern: "pattern",
  // 3D strategies
  "A1: JointBias_T0.7": "jointbias",
  "A1: JointBias_T1.0": "jointbias",
  "B1: CoverageOpt": "coverageopt",
  "D1: EVMaximizer": "evmax",
  "D3: PairExploiter_T0.5": "pairexploiter",
  "D3: PairExploiter_T0.7": "pairexploiter",
};

// Pretty human labels for strategies that appear only in JSON.
// Returns the JSON name untouched if no override is needed.
export function prettyJsonName(jsonName: string): string {
  return jsonName.replace(/^[A-D]\d:\s*/, ""); // strip "A1: " prefix
}

/**
 * Human-readable explanation for why a research-only strategy (no UI generator)
 * can't be selected. Used as tooltip text on the "📚 Nghiên cứu" badge.
 *
 * Returns null when the strategy is clickable (has a UI generator) or is the
 * Random baseline.
 */
export function researchOnlyReason(jsonName: string): string | null {
  if (jsonName === "Random") return null;
  if (JSON_TO_UI[jsonName]) return null;

  // Variant of a ported family
  if (jsonName === "ExpDecay_Hot") {
    return "Variant của Tần suất cao với trọng số giảm dần theo thời gian — chỉ đo trong backtest Python, UI dùng bản gốc Freq_Hot (→ chọn 'Tần suất cao').";
  }
  if (jsonName === "ExpDecay_Cold") {
    return "Variant của Số vắng lâu với decay exponential — chỉ đo trong backtest, UI dùng LongAbsence (→ chọn 'Số vắng lâu').";
  }

  // Standalone research matrix
  if (jsonName === "Ensemble") {
    return "Tổ hợp nhiều strategies (Chu kỳ 7 Reject split-half) — giữ trong bảng để tham khảo, không port vì đã bị Reject.";
  }
  if (jsonName === "NotRepeat") {
    return "Tránh trùng với draw gần nhất — research-only, chưa port vào UI generator.";
  }
  if (jsonName === "PairFreq") {
    return "Ưu tiên cặp số có tần suất cao — research-only, chưa port vào UI generator.";
  }

  // Compound experiments
  if (jsonName.startsWith("ULTIMATE_")) {
    return "Combo experimental Chu kỳ 8+ (Reject) — giữ trong bảng để tham khảo, không port vì không verify.";
  }

  // 3D research variants not ported
  if (jsonName.startsWith("A2:")) {
    return "3D conditional-chain — research-only, chưa port vào UI generator.";
  }
  if (jsonName.startsWith("B2:")) {
    return "3D tier-weighted — research-only, chưa port vào UI generator.";
  }
  if (jsonName.startsWith("B3:")) {
    return "3D stratified-digit — research-only, chưa port vào UI generator.";
  }
  if (jsonName.startsWith("C2:")) {
    return "3D multi-signal combo — research-only, chưa port vào UI generator.";
  }
  if (jsonName.startsWith("C3:")) {
    return "3D portfolio combo — research-only, chưa port vào UI generator.";
  }
  if (jsonName.startsWith("D2:")) {
    return "3D KL-divergence minimizer — research-only, chưa port vào UI generator.";
  }

  return "Strategy chỉ có trong Python backtest, chưa có generator TypeScript trong UI — không chọn được để sinh vé.";
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-product strategy row — one entry per JSON strategy, enriched with
// composite ranks across all 3 profiles (winrate / roi / balanced).
// ─────────────────────────────────────────────────────────────────────────────

export interface StrategyRow {
  /** Raw JSON strategy name, e.g. "MinDistance" or "D3: PairExploiter_T0.5" */
  jsonName: string;
  /** Human-readable label (JSON prefix stripped) */
  label: string;
  /** Matching UI SuggestionStrategy key if selectable, else null */
  uiKey: SuggestionStrategy | null;
  /** True for the Random baseline row (not pick-eligible) */
  isBaseline: boolean;
  /** Measured win-rate delta vs Random in percentage points */
  deltaWinPp: number;
  /** Measured ROI delta vs Random in percent */
  deltaRoiPct: number;
  /** Absolute win rate (primary metric) as percentage */
  rawWinPct: number;
  /** Absolute ROI as percentage */
  rawRoiPct: number;
  /** z-test p-value vs Random on primary metric */
  pValue: number;
  /** Sharpe ratio */
  sharpe: number;
  /** Composite score under each profile */
  composite: Record<C22ProfileName, number>;
  /** Rank under each profile (1-based, lower = better) */
  rank: Record<C22ProfileName, number>;
  /** Whether this strategy passed Tier 1/2 exclusion filters */
  pickEligible: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

function findProduct(slug: string): C22ProductRanking | null {
  return CYCLE22_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

/**
 * Build per-strategy comparison rows for a given product.
 *
 * Returns strategies ordered by balanced composite rank (descending). Random
 * baseline is included at the end so users can see the zero-reference.
 */
export function getStrategyRows(slug: string): StrategyRow[] {
  const product = findProduct(slug);
  if (!product) return [];

  // Collect raw metrics from the winrate ranking (raw metrics are identical
  // across profiles — only composite + rank differ).
  const byName = new Map<string, C22RankingEntry>();
  for (const entry of product.rankings.winrate) {
    byName.set(entry.strategy, entry);
  }

  // Build composite + rank lookup across all 3 profiles
  const compositeMap: Record<C22ProfileName, Map<string, { composite: number; rank: number }>> = {
    winrate: new Map(),
    roi: new Map(),
    balanced: new Map(),
  };
  (["winrate", "roi", "balanced"] as C22ProfileName[]).forEach((profile) => {
    product.rankings[profile].forEach((entry) => {
      compositeMap[profile].set(entry.strategy, {
        composite: entry.composite,
        rank: entry.rank,
      });
    });
  });

  const rows: StrategyRow[] = [];
  byName.forEach((entry, name) => {
    rows.push({
      jsonName: name,
      label: prettyJsonName(name),
      uiKey: JSON_TO_UI[name] ?? null,
      isBaseline: name === "Random",
      deltaWinPp: entry.raw.delta_win_pp,
      deltaRoiPct: entry.raw.delta_roi_pct,
      rawWinPct: entry.raw.raw_primary_pct,
      rawRoiPct: entry.raw.raw_roi_pct,
      pValue: entry.raw.p_value_raw,
      sharpe: entry.raw.sharpe,
      composite: {
        winrate: compositeMap.winrate.get(name)?.composite ?? 0,
        roi: compositeMap.roi.get(name)?.composite ?? 0,
        balanced: compositeMap.balanced.get(name)?.composite ?? 0,
      },
      rank: {
        winrate: compositeMap.winrate.get(name)?.rank ?? 99,
        roi: compositeMap.roi.get(name)?.rank ?? 99,
        balanced: compositeMap.balanced.get(name)?.rank ?? 99,
      },
      pickEligible: entry.pick_eligible,
    });
  });

  // Default ordering: balanced rank ascending, baseline last
  rows.sort((a, b) => {
    if (a.isBaseline !== b.isBaseline) return a.isBaseline ? 1 : -1;
    return a.rank.balanced - b.rank.balanced;
  });
  return rows;
}

/**
 * Pick the best JSON strategy representative for a UI strategy key on a given
 * product. Used when the prize table's "lift" column needs to reference one
 * specific measurement (many JSON variants can map to one UI key).
 *
 * Selection rule: highest composite on the `balanced` profile (stable mid-point
 * between winrate and roi weighting).
 */
export function getRepresentativeRow(
  slug: string,
  uiKey: SuggestionStrategy,
): StrategyRow | null {
  const rows = getStrategyRows(slug);
  const matches = rows.filter((r) => r.uiKey === uiKey && !r.isBaseline);
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.composite.balanced - a.composite.balanced);
  return matches[0];
}

/**
 * Random baseline row for a product (win rate + ROI reference point).
 */
export function getRandomBaseline(slug: string): StrategyRow | null {
  const rows = getStrategyRows(slug);
  return rows.find((r) => r.isBaseline) ?? null;
}

/**
 * Probability of winning ≥1 time across N tickets given a per-ticket
 * probability p. Uses the standard 1 − (1 − p)^N formula.
 */
export function combinedWinProbability(perTicketProb: number, ticketCount: number): number {
  if (perTicketProb <= 0 || ticketCount <= 0) return 0;
  return 1 - Math.pow(1 - perTicketProb, ticketCount);
}

/**
 * Apply a historical lift (Δ_win in percentage points, measured on the product's
 * primary_metric_field) to a baseline per-ticket probability.
 *
 * @param baselineWinPct - Random win rate as percentage (e.g. 1.33)
 * @param deltaWinPp - Strategy's Δ_win vs Random in pp (e.g. +0.308)
 * @returns The lift factor (1 + relative improvement). Clamped ≥ 0.
 */
export function liftFactor(baselineWinPct: number, deltaWinPp: number): number {
  if (baselineWinPct <= 0) return 1;
  const factor = 1 + deltaWinPp / baselineWinPct;
  return Math.max(0, factor);
}

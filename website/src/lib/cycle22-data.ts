// Chu kỳ 22 Optimization mode rankings — AUTO-SYNCED from research JSON
//
// Source of truth: research/optimization/cycle22_rankings.json
// This module imports JSON directly — any re-run của research/optimization/cycle22_ranking.py
// sẽ update JSON, và next `npm run build` / dev reload sẽ pick up tự động.
//
// ⚠ Do NOT hand-edit. Run the ranking script để update:
//   cd website/research/optimization && python3 cycle22_ranking.py
//
// Next.js với resolveJsonModule + JSON watch → no sync step needed.

import rawRankings from "../../research/optimization/cycle22_rankings.json";

// ──────────────────────────── Type interfaces ────────────────────────────

export interface C22Metric {
  delta_win_pp: number;
  delta_roi_pct: number;
  sharpe: number;
  p_value_raw: number;
  raw_primary_pct: number;
  raw_roi_pct: number;
}

export interface C22RankingEntry {
  rank: number;
  strategy: string;
  composite: number;
  pick_eligible: boolean;
  raw: C22Metric;
}

export type C22ProfileName = "winrate" | "roi" | "balanced";

export interface C22Pick {
  strategy: string;
  composite_rank: number;
  composite_score: number;
  split_half: {
    status: "verified" | "flipped" | "unavailable";
    half1_delta?: number;
    half2_delta?: number;
    reason: string;
  };
  attempt: number;
}

export interface C22ProductRanking {
  slug: string;
  label: string;
  scope: "matrix" | "3d";
  n_draws: number;
  n_strategies_ranked: number;
  primary_metric_field: string;
  rankings: Record<C22ProfileName, C22RankingEntry[]>;
  picks: Record<C22ProfileName, C22Pick | null>;
  collapse_applied: "none" | "all_three" | "winrate_roi" | "winrate_balanced" | "roi_balanced";
}

// ──────────────────────────── Slug mapping + ordering ────────────────────────

// JSON uses underscore slugs (power_655), UI uses hyphen slugs (power-655).
const SLUG_MAP: Record<string, { slug: string; label: string }> = {
  power_655: { slug: "power-655", label: "Power 6/55" },
  power_645: { slug: "power-645", label: "Mega 6/45" },
  power_535: { slug: "power-535", label: "Power 5/35" },
  max_3d: { slug: "max-3d", label: "Max 3D" },
  max_3d_pro: { slug: "max-3d-pro", label: "Max 3D Pro" },
};

// Consistent UI ordering (3D first, then matrix descending pool size)
const PRODUCT_ORDER = ["max_3d", "max_3d_pro", "power_655", "power_645", "power_535"];

// ──────────────────────────── Transform JSON → typed exports ────────────────

export const CYCLE22_TIMESTAMP: string = rawRankings.timestamp;

export const C22_PROFILES = rawRankings.composite_profiles;

/** 5 products ordered consistently for UI rendering. */
export const CYCLE22_PRODUCTS: C22ProductRanking[] = PRODUCT_ORDER
  .filter((key) => key in rawRankings.products)
  .map((key) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = (rawRankings.products as Record<string, any>)[key];
    const meta = SLUG_MAP[key] ?? { slug: key, label: key };
    return {
      slug: meta.slug,
      label: meta.label,
      scope: p.scope,
      n_draws: p.n_draws,
      n_strategies_ranked: p.n_strategies_ranked,
      primary_metric_field: p.primary_metric_field,
      rankings: p.rankings,
      picks: p.picks,
      collapse_applied: p.collapse_applied,
    } as C22ProductRanking;
  });

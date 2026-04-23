// Max 3D evaluator — mirror of Python
// src/vietlott/check_rate/evaluators/p3d.py.
//
// Tier-based: ticket is ONE 3-digit zero-padded string. Draw is a dict of
// 4 tier lists. Match = ticket ∈ tier list → win that tier's prize. Same
// number in multiple tiers of one draw cộng dồn. KK 2 số cuối is
// mutually-exclusive with a full Đặc biệt match for the same special
// number.

import {
  MAX_3D_LAST2_PRIZE,
  MAX_3D_TIERS,
  TICKET_COST_VND,
} from "../prize_tables";
import { register, type Evaluator } from "../registry";
import type { Draw, EvalResult, HistoryMatch, PerDrawHit, Ticket } from "../types";

const GAME = "3d";
const TIER_ORDER = ["Giải Đặc biệt", "Giải Nhất", "Giải Nhì", "Giải ba"] as const;
const KK_TIER_NAME = MAX_3D_LAST2_PRIZE.name;
const NO_HIT = "Không trúng";

const EN_TO_VN: Record<string, string> = {
  special: "Giải Đặc biệt",
  first: "Giải Nhất",
  second: "Giải Nhì",
  third: "Giải ba",
};

const TIER_RANK: Record<string, number> = {
  "Giải Đặc biệt": 0,
  "Giải Nhất": 1,
  "Giải Nhì": 2,
  "Giải ba": 3,
  [KK_TIER_NAME]: 4,
};

interface TierDict {
  [tier: string]: string[];
}

// 3D draws have `result` as a tier dict, not a number[] — relax the Draw type
interface ThreeDDraw extends Omit<Draw, "result"> {
  result: unknown;
}

function parseNumbers(ticket: Ticket): string {
  const s = ticket.numbersRaw.trim();
  if (!/^\d{3}$/.test(s)) {
    throw new Error(`ticket #${ticket.ticketNo}: 3D number must be exactly 3 digits (got '${s}')`);
  }
  if (ticket.special !== null) {
    throw new Error(`ticket #${ticket.ticketNo}: 3D does not take a special number`);
  }
  return s;
}

function extractTiers(draw: ThreeDDraw): TierDict {
  const result = draw.result;
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error(`3D draw ${draw.id}: result must be a tier dict`);
  }
  const r = result as Record<string, unknown>;
  if ("Giải Đặc biệt" in r) {
    const out: TierDict = {};
    for (const t of TIER_ORDER) {
      const v = r[t];
      if (Array.isArray(v)) out[t] = v.map(String);
    }
    return out;
  }
  const out: TierDict = {};
  for (const [en, vn] of Object.entries(EN_TO_VN)) {
    const v = r[en];
    if (Array.isArray(v)) out[vn] = v.map(String);
  }
  return out;
}

function evaluatePlay(ticketNum: string, tiers: TierDict): Array<[string, number]> {
  const hits: Array<[string, number]> = [];
  for (const tierName of TIER_ORDER) {
    const rule = MAX_3D_TIERS[tierName];
    if (!rule) continue;
    for (const n of tiers[tierName] ?? []) {
      if (n === ticketNum) hits.push([tierName, rule.amount]);
    }
  }
  // KK 2 số cuối (exclusive with exact Đặc biệt match)
  const specials = tiers["Giải Đặc biệt"] ?? [];
  for (const sp of specials) {
    if (sp !== ticketNum && sp.slice(-2) === ticketNum.slice(-2)) {
      hits.push([KK_TIER_NAME, MAX_3D_LAST2_PRIZE.amount]);
    }
  }
  return hits;
}

function bestTier(hits: Array<[string, number]>): string | null {
  if (hits.length === 0) return null;
  return hits.reduce((best, [tier]) => {
    const bestRank = TIER_RANK[best] ?? 999;
    const curRank = TIER_RANK[tier] ?? 999;
    return curRank < bestRank ? tier : best;
  }, hits[0][0]);
}

const p3dEvaluator: Evaluator = {
  game: GAME,

  parseNumbers(ticket: Ticket): string {
    return parseNumbers(ticket);
  },

  evaluate(tickets: Ticket[], draws: Draw[]): EvalResult {
    const parsed = tickets.map((t) => ({ ticket: t, num: parseNumbers(t) }));
    const matchDist: Record<string, number> = {};
    const prizeCounter: Record<string, number> = {};
    const prizeWinnings: Record<string, number> = {};
    const perDrawHits: PerDrawHit[] = [];

    for (const draw of draws as ThreeDDraw[]) {
      const tiers = extractTiers(draw);
      for (const { ticket, num } of parsed) {
        const hits = evaluatePlay(num, tiers);
        const playTotal = hits.reduce((s, [, a]) => s + a, 0);
        const best = bestTier(hits) ?? NO_HIT;
        matchDist[best] = (matchDist[best] ?? 0) + 1;

        for (const [tierName, amt] of hits) {
          prizeCounter[tierName] = (prizeCounter[tierName] ?? 0) + 1;
          prizeWinnings[tierName] = (prizeWinnings[tierName] ?? 0) + amt;
        }
        perDrawHits.push({
          date: String(draw.date),
          drawId: String(draw.id),
          ticketNo: ticket.ticketNo,
          prize: hits.length > 0 ? best : null,
          amount: playTotal,
          detail: { hits: hits.map(([t]) => t) },
        });
      }
    }

    const nTickets = tickets.length;
    const nDraws = draws.length;
    return {
      game: GAME,
      algorithm: tickets[0]?.algorithm ?? "",
      nTickets,
      nDraws,
      matchDist,
      prizeCounter,
      prizeWinnings,
      totalCost: nTickets * nDraws * TICKET_COST_VND,
      totalWinnings: Object.values(prizeWinnings).reduce((a, b) => a + b, 0),
      perDrawHits,
    };
  },

  historyMatch(ticket: Ticket, draws: Draw[]): HistoryMatch {
    const num = parseNumbers(ticket);
    const byTier: Record<string, number> = {};
    for (const t of TIER_ORDER) byTier[t] = 0;
    const occurrences: Array<[string, string, string]> = [];

    for (const draw of draws as ThreeDDraw[]) {
      const tiers = extractTiers(draw);
      for (const tierName of TIER_ORDER) {
        const count = (tiers[tierName] ?? []).filter((n) => n === num).length;
        if (count > 0) {
          byTier[tierName] += count;
          for (let i = 0; i < count; i++) {
            occurrences.push([String(draw.date), String(draw.id), tierName]);
          }
        }
      }
    }
    return {
      ticketNo: ticket.ticketNo,
      numbersDisplay: num,
      totalHits: Object.values(byTier).reduce((a, b) => a + b, 0),
      byTier,
      occurrences,
    };
  },
};

register(p3dEvaluator);

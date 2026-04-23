// Max 3D Pro evaluator — mirror of Python
// src/vietlott/check_rate/evaluators/p3d_pro.py.
//
// 8-tier mutually-exclusive hierarchy with order-sensitive Đặc biệt/Phụ Đặc
// biệt + A=B doubling + combined ĐB when draw's 2 specials are equal.
//
// Ticket = (A, B): space-separated 2 three-digit numbers in `numbers` column.

import {
  MAX_3D_PRO_DB_COMBINED,
  MAX_3D_PRO_TIERS,
  TICKET_COST_VND,
  type PrizeRule,
} from "../prize_tables";
import { register, type Evaluator } from "../registry";
import type { Draw, EvalResult, HistoryMatch, PerDrawHit, Ticket } from "../types";

const GAME = "3d_pro";
const TIER_ORDER = [
  "Giải Đặc biệt",
  "Giải Phụ Đặc biệt",
  "Giải Nhất",
  "Giải Nhì",
  "Giải Ba",
  "Giải Tư",
  "Giải Năm",
  "Giải Sáu",
] as const;
const NO_HIT = "Không trúng";

const EN_TO_VN: Record<string, string> = {
  special: "Giải Đặc biệt",
  first: "Giải Nhất",
  second: "Giải Nhì",
  third: "Giải ba",
};

type ThreeDDrawLike = { date: string; id: string; result: unknown };

interface TierDict {
  [tier: string]: string[];
}

function parseNumbers(ticket: Ticket): [string, string] {
  const parts = ticket.numbersRaw.split(/\s+/).filter((s) => s.length > 0);
  if (parts.length !== 2) {
    throw new Error(
      `ticket #${ticket.ticketNo}: 3D Pro needs exactly 2 space-separated 3-digit numbers (got ${parts.length})`,
    );
  }
  const [a, b] = parts;
  for (const n of [a, b]) {
    if (!/^\d{3}$/.test(n)) {
      throw new Error(`ticket #${ticket.ticketNo}: each number must be exactly 3 digits (got '${n}')`);
    }
  }
  if (ticket.special !== null) {
    throw new Error(`ticket #${ticket.ticketNo}: 3D Pro does not take a special number`);
  }
  return [a, b];
}

function extractTiers(draw: ThreeDDrawLike): TierDict {
  const result = draw.result;
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error(`3D Pro draw ${draw.id}: result must be a tier dict`);
  }
  const r = result as Record<string, unknown>;
  if ("Giải Đặc biệt" in r) {
    const out: TierDict = {};
    for (const t of ["Giải Đặc biệt", "Giải Nhất", "Giải Nhì", "Giải ba"]) {
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

function resolve3dPro(
  a: string,
  b: string,
  specials: string[],
  firsts: string[],
  seconds: string[],
  thirds: string[],
): PrizeRule | null {
  const same = a === b;
  const s0 = specials[0];
  const s1 = specials[1];
  const firstSet = new Set(firsts);
  const secondSet = new Set(seconds);
  const thirdSet = new Set(thirds);
  const specialSet = new Set(specials);
  const all20 = new Set<string>([...specialSet, ...firstSet, ...secondSet, ...thirdSet]);

  if (s0 !== undefined && s1 !== undefined && a === s0 && b === s1) {
    if (same && s0 === s1) return MAX_3D_PRO_DB_COMBINED;
    return MAX_3D_PRO_TIERS["Giải Đặc biệt"];
  }
  if (s0 !== undefined && s1 !== undefined && a === s1 && b === s0) {
    return MAX_3D_PRO_TIERS["Giải Phụ Đặc biệt"];
  }
  if (firstSet.has(a) && firstSet.has(b)) return doubleIfSame(MAX_3D_PRO_TIERS["Giải Nhất"], same);
  if (secondSet.has(a) && secondSet.has(b)) return doubleIfSame(MAX_3D_PRO_TIERS["Giải Nhì"], same);
  if (thirdSet.has(a) && thirdSet.has(b)) return doubleIfSame(MAX_3D_PRO_TIERS["Giải Ba"], same);

  const aIn20 = all20.has(a);
  const bIn20 = all20.has(b);
  if (aIn20 && bIn20) return doubleIfSame(MAX_3D_PRO_TIERS["Giải Tư"], same);
  if (same) return null;

  let hit: string | null = null;
  if (aIn20 && !bIn20) hit = a;
  else if (bIn20 && !aIn20) hit = b;
  else return null;

  if (specialSet.has(hit)) return MAX_3D_PRO_TIERS["Giải Năm"];
  return MAX_3D_PRO_TIERS["Giải Sáu"];
}

function doubleIfSame(rule: PrizeRule, same: boolean): PrizeRule {
  if (!same) return rule;
  return { name: rule.name, amount: rule.amount * 2 };
}

const p3dProEvaluator: Evaluator = {
  game: GAME,

  parseNumbers(ticket: Ticket): string {
    const [a, b] = parseNumbers(ticket);
    return `${a} ${b}`;
  },

  evaluate(tickets: Ticket[], draws: Draw[]): EvalResult {
    const parsed = tickets.map((t) => ({ ticket: t, pair: parseNumbers(t) }));
    const matchDist: Record<string, number> = {};
    const prizeCounter: Record<string, number> = {};
    const prizeWinnings: Record<string, number> = {};
    const perDrawHits: PerDrawHit[] = [];

    for (const draw of draws as unknown as ThreeDDrawLike[]) {
      const tiers = extractTiers(draw);
      const specials = tiers["Giải Đặc biệt"] ?? [];
      const firsts = tiers["Giải Nhất"] ?? [];
      const seconds = tiers["Giải Nhì"] ?? [];
      const thirds = tiers["Giải ba"] ?? [];

      for (const { ticket, pair } of parsed) {
        const [a, b] = pair;
        const rule = resolve3dPro(a, b, specials, firsts, seconds, thirds);
        const tierName = rule ? rule.name : NO_HIT;
        matchDist[tierName] = (matchDist[tierName] ?? 0) + 1;

        perDrawHits.push({
          date: String(draw.date),
          drawId: String(draw.id),
          ticketNo: ticket.ticketNo,
          prize: rule ? rule.name : null,
          amount: rule ? rule.amount : 0,
          detail: { a, b, same: a === b },
        });
        if (rule) {
          prizeCounter[rule.name] = (prizeCounter[rule.name] ?? 0) + 1;
          prizeWinnings[rule.name] = (prizeWinnings[rule.name] ?? 0) + rule.amount;
        }
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
    const [a, b] = parseNumbers(ticket);
    const byTier: Record<string, number> = {};
    for (const t of TIER_ORDER) byTier[t] = 0;
    const occurrences: Array<[string, string, string]> = [];

    for (const draw of draws as unknown as ThreeDDrawLike[]) {
      const tiers = extractTiers(draw);
      const rule = resolve3dPro(
        a,
        b,
        tiers["Giải Đặc biệt"] ?? [],
        tiers["Giải Nhất"] ?? [],
        tiers["Giải Nhì"] ?? [],
        tiers["Giải ba"] ?? [],
      );
      if (rule) {
        byTier[rule.name] += 1;
        occurrences.push([String(draw.date), String(draw.id), rule.name]);
      }
    }

    const display = a === b ? `${a} ${b} (A=B)` : `${a} ${b}`;
    return {
      ticketNo: ticket.ticketNo,
      numbersDisplay: display,
      totalHits: Object.values(byTier).reduce((a, b) => a + b, 0),
      byTier,
      occurrences,
    };
  },
};

register(p3dProEvaluator);

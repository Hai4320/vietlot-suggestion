// Power 6/45 (Mega) evaluator — mirror of Python
// src/vietlott/check_rate/evaluators/power645.py.
//
// Semantic: subset match only — no special, no bonus ball. Prize via
// resolvePower645 (match count ≥ 3 → tier; else no prize).

import { resolvePower645, TICKET_COST_VND } from "../prize_tables";
import { register, type Evaluator } from "../registry";
import type { Draw, EvalResult, HistoryMatch, PerDrawHit, Ticket } from "../types";

const GAME = "power_645";
const MAIN_SIZE = 6;
const NUM_MIN = 1;
const NUM_MAX = 45;

function extractMain(draw: Draw): Set<number> {
  return new Set(draw.result.slice(0, MAIN_SIZE));
}

function parseNumbers(ticket: Ticket): number[] {
  const nums = ticket.numbersRaw
    .split(/\s+/)
    .filter((s) => s.length > 0)
    .map((s) => {
      const n = Number(s);
      if (!Number.isInteger(n)) throw new Error(`ticket #${ticket.ticketNo}: invalid number '${s}'`);
      return n;
    });
  if (nums.length !== MAIN_SIZE) {
    throw new Error(`ticket #${ticket.ticketNo}: expected ${MAIN_SIZE} numbers, got ${nums.length}`);
  }
  if (new Set(nums).size !== MAIN_SIZE) {
    throw new Error(`ticket #${ticket.ticketNo}: duplicate numbers in [${nums.join(", ")}]`);
  }
  for (const n of nums) {
    if (n < NUM_MIN || n > NUM_MAX) {
      throw new Error(`ticket #${ticket.ticketNo}: number ${n} out of range ${NUM_MIN}-${NUM_MAX}`);
    }
  }
  if (ticket.special !== null) {
    throw new Error(`ticket #${ticket.ticketNo}: power_645 does not take a special number`);
  }
  return [...nums].sort((a, b) => a - b);
}

const power645Evaluator: Evaluator = {
  game: GAME,

  parseNumbers,

  evaluate(tickets: Ticket[], draws: Draw[]): EvalResult {
    const parsed = tickets.map((t) => ({ ticket: t, nums: new Set(parseNumbers(t)) }));
    const matchDist: Record<string, number> = {};
    const prizeCounter: Record<string, number> = {};
    const prizeWinnings: Record<string, number> = {};
    const perDrawHits: PerDrawHit[] = [];

    for (const draw of draws) {
      const drawMain = extractMain(draw);
      for (const { ticket, nums } of parsed) {
        let matchMain = 0;
        for (const n of nums) if (drawMain.has(n)) matchMain++;
        matchDist[matchMain] = (matchDist[matchMain] ?? 0) + 1;

        const rule = resolvePower645(matchMain);
        perDrawHits.push({
          date: String(draw.date),
          drawId: String(draw.id),
          ticketNo: ticket.ticketNo,
          prize: rule ? rule.name : null,
          amount: rule ? rule.amount : 0,
          detail: { match_main: matchMain },
        });
        if (rule) {
          prizeCounter[rule.name] = (prizeCounter[rule.name] ?? 0) + 1;
          prizeWinnings[rule.name] = (prizeWinnings[rule.name] ?? 0) + rule.amount;
        }
      }
    }

    const nTickets = tickets.length;
    const nDraws = draws.length;
    const totalWinnings = Object.values(prizeWinnings).reduce((a, b) => a + b, 0);
    return {
      game: GAME,
      algorithm: tickets[0]?.algorithm ?? "",
      nTickets,
      nDraws,
      matchDist,
      prizeCounter,
      prizeWinnings,
      totalCost: nTickets * nDraws * TICKET_COST_VND,
      totalWinnings,
      perDrawHits,
    };
  },

  historyMatch(ticket: Ticket, draws: Draw[]): HistoryMatch {
    const ticketMain = new Set(parseNumbers(ticket));
    const occurrences: Array<[string, string, string]> = [];
    for (const draw of draws) {
      const drawMain = extractMain(draw);
      if (drawMain.size === ticketMain.size && [...ticketMain].every((n) => drawMain.has(n))) {
        occurrences.push([String(draw.date), String(draw.id), "main_exact"]);
      }
    }
    const sortedNums = [...ticketMain].sort((a, b) => a - b);
    return {
      ticketNo: ticket.ticketNo,
      numbersDisplay: `[${sortedNums.join(" ")}]`,
      totalHits: occurrences.length,
      byTier: { main_exact: occurrences.length },
      occurrences,
    };
  },
};

register(power645Evaluator);

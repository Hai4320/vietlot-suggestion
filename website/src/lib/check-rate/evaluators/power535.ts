// Power 5/35 evaluator — mirror of Python
// src/vietlott/check_rate/evaluators/power535.py.
//
// Semantic: per-(ticket × draw) evaluation, prize lookup via resolvePower535,
// history match = exact main-set equality (special/bonus ignored).

import { resolvePower535, TICKET_COST_VND } from "../prize_tables";
import { register, type Evaluator } from "../registry";
import type { Draw, EvalResult, HistoryMatch, PerDrawHit, Ticket } from "../types";

const GAME = "power_535";
const MAIN_SIZE = 5;

function extractDraw(draw: Draw): { main: Set<number>; special: number | null } {
  if (draw.special !== undefined && draw.special !== null) {
    return { main: new Set(draw.result.slice(0, MAIN_SIZE)), special: draw.special };
  }
  if (draw.result.length > MAIN_SIZE) {
    return {
      main: new Set(draw.result.slice(0, MAIN_SIZE)),
      special: draw.result[MAIN_SIZE],
    };
  }
  return { main: new Set(draw.result.slice(0, MAIN_SIZE)), special: null };
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
    if (n < 1 || n > 35) throw new Error(`ticket #${ticket.ticketNo}: number ${n} out of range 1-35`);
  }
  if (ticket.special === null) {
    throw new Error(`ticket #${ticket.ticketNo}: special is required for power_535`);
  }
  if (ticket.special < 1 || ticket.special > 12) {
    throw new Error(`ticket #${ticket.ticketNo}: special ${ticket.special} out of range 1-12`);
  }
  return [...nums].sort((a, b) => a - b);
}

const power535Evaluator: Evaluator = {
  game: GAME,

  parseNumbers,

  evaluate(tickets: Ticket[], draws: Draw[]): EvalResult {
    const parsed = tickets.map((t) => ({ ticket: t, nums: new Set(parseNumbers(t)) }));
    const matchDist: Record<string, number> = {};
    const prizeCounter: Record<string, number> = {};
    const prizeWinnings: Record<string, number> = {};
    const perDrawHits: PerDrawHit[] = [];

    for (const draw of draws) {
      const { main: drawMain, special: drawSp } = extractDraw(draw);
      for (const { ticket, nums } of parsed) {
        let matchMain = 0;
        for (const n of nums) if (drawMain.has(n)) matchMain++;
        const spMatch = ticket.special === drawSp;
        matchDist[matchMain] = (matchDist[matchMain] ?? 0) + 1;

        const rule = resolvePower535(matchMain, spMatch);
        perDrawHits.push({
          date: String(draw.date),
          drawId: String(draw.id),
          ticketNo: ticket.ticketNo,
          prize: rule ? rule.name : null,
          amount: rule ? rule.amount : 0,
          detail: { match_main: matchMain, special_match: spMatch },
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
      const { main: drawMain } = extractDraw(draw);
      if (drawMain.size === ticketMain.size && [...ticketMain].every((n) => drawMain.has(n))) {
        occurrences.push([String(draw.date), String(draw.id), "main_exact"]);
      }
    }
    const sortedNums = [...ticketMain].sort((a, b) => a - b);
    let display = `[${sortedNums.join(" ")}]`;
    if (ticket.special !== null) display += ` sp=${ticket.special}`;
    return {
      ticketNo: ticket.ticketNo,
      numbersDisplay: display,
      totalHits: occurrences.length,
      byTier: { main_exact: occurrences.length },
      occurrences,
    };
  },
};

register(power535Evaluator);

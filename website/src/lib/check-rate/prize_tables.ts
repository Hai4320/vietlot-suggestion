// Mirror of Python vietlott.config.prize_tables.
// Jackpot amounts use published minimum — parity with Python.

export interface PrizeRule {
  name: string;
  amount: number;
}

export const TICKET_COST_VND = 10_000;

// ── Power 5/35 ────────────────────────────────────────────────────────────
const POWER_535_RULES: Record<string, PrizeRule> = {
  "5|true": { name: "Jackpot", amount: 6_000_000_000 },
  "5|false": { name: "2nd", amount: 5_000_000 },
  "4|true": { name: "3rd", amount: 500_000 },
  "4|false": { name: "4th", amount: 100_000 },
  "3|true": { name: "5th", amount: 30_000 },
};

const POWER_535_ENCOURAGE: PrizeRule = { name: "Encourage", amount: 10_000 };

export function resolvePower535(matchMain: number, specialMatch: boolean): PrizeRule | null {
  const rule = POWER_535_RULES[`${matchMain}|${specialMatch}`];
  if (rule) return rule;
  if (
    (matchMain === 3 && !specialMatch) ||
    ([0, 1, 2].includes(matchMain) && specialMatch)
  ) {
    return POWER_535_ENCOURAGE;
  }
  return null;
}

// ── Power 6/45 ────────────────────────────────────────────────────────────
const POWER_645_RULES: Record<number, PrizeRule> = {
  6: { name: "Jackpot", amount: 12_000_000_000 },
  5: { name: "1st", amount: 10_000_000 },
  4: { name: "2nd", amount: 300_000 },
  3: { name: "3rd", amount: 30_000 },
};

export function resolvePower645(matchMain: number): PrizeRule | null {
  return POWER_645_RULES[matchMain] ?? null;
}

// ── Power 6/55 ────────────────────────────────────────────────────────────
export function resolvePower655(matchMain: number, bonusMatch: boolean): PrizeRule | null {
  if (matchMain === 6) return { name: "Jackpot 1", amount: 30_000_000_000 };
  if (matchMain === 5 && bonusMatch) return { name: "Jackpot 2", amount: 3_000_000_000 };
  if (matchMain === 5) return { name: "1st", amount: 40_000_000 };
  if (matchMain === 4) return { name: "2nd", amount: 500_000 };
  if (matchMain === 3) return { name: "3rd", amount: 50_000 };
  return null;
}

// ── Max 3D / 3D Pro tables (placeholder — Phase 4/5) ──────────────────────
export const MAX_3D_TIERS: Record<string, PrizeRule> = {
  "Giải Đặc biệt": { name: "Giải Đặc biệt", amount: 1_000_000 },
  "Giải Nhất": { name: "Giải Nhất", amount: 350_000 },
  "Giải Nhì": { name: "Giải Nhì", amount: 210_000 },
  "Giải ba": { name: "Giải ba", amount: 100_000 },
};

export const MAX_3D_LAST2_PRIZE: PrizeRule = { name: "KK 2 số cuối", amount: 100_000 };

// Max 3D Pro — verified per quy chế Vietlott 2026-04-23. Ticket = (A, B);
// prize resolution = 8-tier mutually-exclusive hierarchy + A=B doubling
// (evaluator responsibility). Standard (A≠B) amounts below.
export const MAX_3D_PRO_TIERS: Record<string, PrizeRule> = {
  "Giải Đặc biệt": { name: "Giải Đặc biệt", amount: 2_000_000_000 },
  "Giải Phụ Đặc biệt": { name: "Giải Phụ Đặc biệt", amount: 400_000_000 },
  "Giải Nhất": { name: "Giải Nhất", amount: 30_000_000 },
  "Giải Nhì": { name: "Giải Nhì", amount: 10_000_000 },
  "Giải Ba": { name: "Giải Ba", amount: 4_000_000 },
  "Giải Tư": { name: "Giải Tư", amount: 1_000_000 },
  "Giải Năm": { name: "Giải Năm", amount: 100_000 },
  "Giải Sáu": { name: "Giải Sáu", amount: 40_000 },
};

// Edge case: A=B=X AND Đặc biệt draw = (X, X) → combined ĐB + Phụ ĐB.
export const MAX_3D_PRO_DB_COMBINED: PrizeRule = {
  name: "Giải Đặc biệt",
  amount: 2_400_000_000,
};

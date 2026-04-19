import type {
  ThreeDDraw,
  ThreeDTier,
  DigitFrequency,
  ThreeDNumberFrequency,
  TimeFilter,
} from "./types";

// ── Helpers ─────────────────────────────────────────────────

function filterByTime(draws: ThreeDDraw[], filter: TimeFilter): ThreeDDraw[] {
  if (filter === "all") return draws;
  const days = filter === "90d" ? 90 : filter === "60d" ? 60 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return draws.filter((d) => d.date >= cutoffStr);
}

function getAllNumbers(draws: ThreeDDraw[], tier: ThreeDTier | "all"): string[] {
  const nums: string[] = [];
  for (const draw of draws) {
    if (tier === "all") {
      for (const values of Object.values(draw.result)) {
        nums.push(...values);
      }
    } else if (draw.result[tier]) {
      nums.push(...draw.result[tier]);
    }
  }
  return nums;
}

// ── Digit Frequency (by position) ───────────────────────────

export function calcDigitFrequency(
  draws: ThreeDDraw[],
  position: 0 | 1 | 2,
  tier: ThreeDTier | "all" = "all",
  filter: TimeFilter = "all"
): DigitFrequency[] {
  const filtered = filterByTime(draws, filter);
  const numbers = getAllNumbers(filtered, tier);
  const counts = new Array(10).fill(0);
  let total = 0;

  for (const num of numbers) {
    const padded = num.padStart(3, "0");
    const digit = parseInt(padded[position], 10);
    if (!isNaN(digit)) {
      counts[digit]++;
      total++;
    }
  }

  return counts.map((count, digit) => ({
    digit,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));
}

// ── Top 3-Digit Numbers ─────────────────────────────────────

export function calcTopNumbers(
  draws: ThreeDDraw[],
  tier: ThreeDTier | "all" = "all",
  filter: TimeFilter = "all",
  topN: number = 30
): ThreeDNumberFrequency[] {
  const filtered = filterByTime(draws, filter);
  const numbers = getAllNumbers(filtered, tier);

  // Count frequency
  const counts = new Map<string, number>();
  for (const num of numbers) {
    const padded = num.padStart(3, "0");
    counts.set(padded, (counts.get(padded) || 0) + 1);
  }

  // Find last appearance date for each number
  const lastSeen = new Map<string, string>();
  for (const draw of filtered) {
    const allNums = tier === "all"
      ? Object.values(draw.result).flat()
      : (draw.result[tier] || []);
    for (const num of allNums) {
      const padded = num.padStart(3, "0");
      const prev = lastSeen.get(padded);
      if (!prev || draw.date > prev) lastSeen.set(padded, draw.date);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const total = numbers.length;

  const result: ThreeDNumberFrequency[] = [];
  counts.forEach((count, number) => {
    const lastDate = lastSeen.get(number) || "";
    const daysSinceLast = lastDate
      ? Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000)
      : 9999;
    result.push({
      number,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      daysSinceLast,
    });
  });

  result.sort((a, b) => b.count - a.count);
  return result.slice(0, topN);
}

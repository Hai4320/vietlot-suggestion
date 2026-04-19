import type {
  MatrixDraw,
  NumberFrequency,
  HotColdNumber,
  NumberPair,
  TrendDataPoint,
  TimeFilter,
} from "./types";

// ── Helpers ─────────────────────────────────────────────────

function filterByTime(draws: MatrixDraw[], filter: TimeFilter): MatrixDraw[] {
  if (filter === "all") return draws;
  const days = filter === "90d" ? 90 : filter === "60d" ? 60 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return draws.filter((d) => d.date >= cutoffStr);
}

// ── Frequency ───────────────────────────────────────────────

export function calcFrequency(
  draws: MatrixDraw[],
  mainCount: number,
  filter: TimeFilter = "all"
): NumberFrequency[] {
  const filtered = filterByTime(draws, filter);
  const counts = new Map<number, number>();

  for (const draw of filtered) {
    for (let i = 0; i < mainCount && i < draw.result.length; i++) {
      const n = draw.result[i];
      counts.set(n, (counts.get(n) || 0) + 1);
    }
  }

  const total = filtered.length;
  const freqs: NumberFrequency[] = [];
  counts.forEach((count, number) => {
    freqs.push({ number, count, percentage: total > 0 ? (count / total) * 100 : 0 });
  });

  freqs.sort((a, b) => a.number - b.number);
  return freqs;
}

// ── Hot / Cold ──────────────────────────────────────────────

export function calcHotCold(
  draws: MatrixDraw[],
  minNumber: number,
  maxNumber: number,
  mainCount: number
): { hot: HotColdNumber[]; cold: HotColdNumber[] } {
  const counts = new Map<number, number>();
  const lastSeen = new Map<number, string>();

  for (const draw of draws) {
    for (let i = 0; i < mainCount && i < draw.result.length; i++) {
      const n = draw.result[i];
      counts.set(n, (counts.get(n) || 0) + 1);
      const prev = lastSeen.get(n);
      if (!prev || draw.date > prev) lastSeen.set(n, draw.date);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const all: HotColdNumber[] = [];

  for (let n = minNumber; n <= maxNumber; n++) {
    const count = counts.get(n) || 0;
    const lastDate = lastSeen.get(n) || "";
    const daysSinceLast = lastDate
      ? Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000)
      : 9999;
    all.push({ number: n, count, daysSinceLast, lastDate });
  }

  const byCount = [...all].sort((a, b) => b.count - a.count);
  const byAbsence = [...all].sort((a, b) => b.daysSinceLast - a.daysSinceLast);

  return { hot: byCount.slice(0, 10), cold: byAbsence.slice(0, 10) };
}

// ── Pair Frequency ──────────────────────────────────────────

export function calcPairFrequency(
  draws: MatrixDraw[],
  mainCount: number,
  topN: number = 20
): NumberPair[] {
  const counts = new Map<string, number>();

  for (const draw of draws) {
    const nums = draw.result.slice(0, mainCount).sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }

  const total = draws.length;
  const pairs: NumberPair[] = [];
  counts.forEach((count, key) => {
    const [a, b] = key.split("-").map(Number);
    pairs.push({ pair: [a, b], count, percentage: total > 0 ? (count / total) * 100 : 0 });
  });

  pairs.sort((a, b) => b.count - a.count);
  return pairs.slice(0, topN);
}

// ── Trend (rolling window) ──────────────────────────────────

export function calcTrend(
  draws: MatrixDraw[],
  selectedNumbers: number[],
  mainCount: number,
  windowDays: number = 30
): TrendDataPoint[] {
  if (draws.length === 0 || selectedNumbers.length === 0) return [];

  // Sort ascending by date
  const sorted = [...draws].sort((a, b) => a.date.localeCompare(b.date));

  // Get unique dates
  const dates = [...new Set(sorted.map((d) => d.date))].sort();
  if (dates.length < 2) return [];

  // For each date, compute rolling window counts
  const points: TrendDataPoint[] = [];

  for (const targetDate of dates) {
    const cutoff = new Date(targetDate);
    cutoff.setDate(cutoff.getDate() - windowDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    const windowDraws = sorted.filter((d) => d.date > cutoffStr && d.date <= targetDate);

    const point: TrendDataPoint = { date: targetDate };
    for (const num of selectedNumbers) {
      let cnt = 0;
      for (const draw of windowDraws) {
        if (draw.result.slice(0, mainCount).includes(num)) cnt++;
      }
      point[`n${num}`] = cnt;
    }
    points.push(point);
  }

  // Return last 90 points max
  return points.slice(-90);
}

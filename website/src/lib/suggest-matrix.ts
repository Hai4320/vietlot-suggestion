import type { MatrixDraw, SuggestionSet, SuggestionStrategy } from "./types";

/**
 * Generate lottery number suggestions for matrix products.
 *
 * Strategies:
 * - frequency: Weight by historical frequency (hot numbers)
 * - absence: Prioritize long-absent numbers
 * - mixed: 50/50 hot + cold blend
 * - bayesian: Dirichlet posterior sampling (best for large pools like 6/55)
 * - maxentropy: Stratified band sampling for structural coverage (high-risk/high-reward)
 * - adaptive: Self-tuning lookback window + frequency-based selection
 * - pattern: Structural pattern analysis — spacing + range distribution (ranked #1 overall)
 */
export function generateSuggestions(
  draws: MatrixDraw[],
  mainCount: number,
  minNumber: number,
  maxNumber: number,
  hasSpecial: boolean,
  specialMax: number,
  strategy: SuggestionStrategy,
  count: number = 5
): SuggestionSet[] {
  const sets: SuggestionSet[] = [];

  // Pre-compute frequency and absence
  const freq = new Map<number, number>();
  const lastSeen = new Map<number, number>();

  for (let i = 0; i < draws.length; i++) {
    const draw = draws[i];
    for (let j = 0; j < mainCount && j < draw.result.length; j++) {
      const n = draw.result[j];
      freq.set(n, (freq.get(n) || 0) + 1);
      if (!lastSeen.has(n)) lastSeen.set(n, i); // index 0 = most recent
    }
  }

  const allNumbers = Array.from({ length: maxNumber - minNumber + 1 }, (_, i) => i + minNumber);

  for (let s = 0; s < count; s++) {
    let pool: number[];

    switch (strategy) {
      case "frequency": {
        // Weight by frequency, sample weighted random
        const weights = allNumbers.map((n) => freq.get(n) || 0);
        pool = weightedSample(allNumbers, weights, mainCount);
        break;
      }
      case "absence": {
        // Prioritize numbers not seen recently
        const scored = allNumbers.map((n) => ({
          number: n,
          score: lastSeen.has(n) ? lastSeen.get(n)! : draws.length,
        }));
        scored.sort((a, b) => b.score - a.score);
        // Take top candidates with some randomness
        const topPool = scored.slice(0, mainCount * 3);
        shuffle(topPool);
        pool = topPool.slice(0, mainCount).map((x) => x.number).sort((a, b) => a - b);
        break;
      }
      case "bayesian": {
        // Dirichlet posterior sampling — best for power_655 (+0.0308)
        // Uses observed frequency as prior, samples from posterior
        const temperature = maxNumber > 50 ? 1.0 : 0.5; // sharper for smaller pools
        const alpha = allNumbers.map((n) => 1.0 + (freq.get(n) || 0));
        const theta = sampleDirichlet(alpha);
        // Apply temperature
        const tempered = theta.map((t) => Math.pow(t, 1.0 / temperature));
        const tempSum = tempered.reduce((s, v) => s + v, 0);
        const probs = tempered.map((t) => t / tempSum);
        pool = weightedSampleFromProbs(allNumbers, probs, mainCount);
        break;
      }
      case "maxentropy": {
        // Max-Entropy Stratified Sampling — divides range into equal bands,
        // picks one from each band using Dirichlet posterior.
        // Achieved 5/6 matches in backtest! Best ROI (-62%)
        const numBands = mainCount;
        const bandSize = Math.ceil(allNumbers.length / numBands);
        const selected: number[] = [];
        for (let b = 0; b < numBands; b++) {
          const bandStart = b * bandSize;
          const bandEnd = Math.min(bandStart + bandSize, allNumbers.length);
          const bandNums = allNumbers.slice(bandStart, bandEnd);
          if (bandNums.length === 0) continue;
          // Dirichlet within band
          const bandAlpha = bandNums.map((n) => 1.0 + (freq.get(n) || 0));
          const bandTheta = sampleDirichlet(bandAlpha);
          // Exclude already selected
          const available = bandTheta.map((t, i) =>
            selected.includes(bandNums[i]) ? 0 : t
          );
          const availSum = available.reduce((s, v) => s + v, 0);
          if (availSum <= 0) continue;
          const probs = available.map((v) => v / availSum);
          let r = Math.random();
          let picked = bandNums[bandNums.length - 1];
          for (let i = 0; i < probs.length; i++) {
            r -= probs[i];
            if (r <= 0) { picked = bandNums[i]; break; }
          }
          selected.push(picked);
        }
        // Fill remaining if needed
        while (selected.length < mainCount) {
          const remaining = allNumbers.filter((n) => !selected.includes(n));
          if (remaining.length === 0) break;
          selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
        }
        pool = selected.sort((a, b) => a - b);
        break;
      }
      case "adaptive": {
        // Adaptive window strategy — finds optimal lookback window by
        // mini-backtesting recent draws, then uses best window for frequency selection
        const windows = [30, 90, 180, 365];
        const evalCount = Math.min(10, Math.floor(draws.length / 3));
        let bestWindow = 180;
        let bestScore = -1;

        for (const w of windows) {
          let totalMatches = 0;
          let valid = 0;
          for (let e = 0; e < evalCount; e++) {
            const evalIdx = draws.length - 1 - e;
            if (evalIdx < 30) break;
            const evalDate = new Date(draws[evalIdx].date);
            const cutoff = new Date(evalDate);
            cutoff.setDate(cutoff.getDate() - w);
            // Count frequency in window
            const wFreq = new Map<number, number>();
            for (let j = evalIdx + 1; j < draws.length; j++) {
              const d = new Date(draws[j].date);
              if (d < cutoff) break;
              for (let k = 0; k < mainCount && k < draws[j].result.length; k++) {
                const n = draws[j].result[k];
                wFreq.set(n, (wFreq.get(n) || 0) + 1);
              }
            }
            // Pick top numbers by window frequency
            const sorted = [...allNumbers].sort(
              (a, b) => (wFreq.get(b) || 0) - (wFreq.get(a) || 0)
            );
            const predicted = new Set(sorted.slice(0, mainCount));
            const actual = new Set(
              draws[evalIdx].result.slice(0, mainCount)
            );
            let m = 0;
            for (const n of predicted) if (actual.has(n)) m++;
            totalMatches += m;
            valid++;
          }
          const avg = valid > 0 ? totalMatches / valid : 0;
          if (avg > bestScore) { bestScore = avg; bestWindow = w; }
        }

        // Use best window for final prediction with 80% top + 20% random
        const cutoff = new Date(draws[0].date);
        cutoff.setDate(cutoff.getDate() - bestWindow);
        const wFreq = new Map<number, number>();
        for (const draw of draws) {
          if (new Date(draw.date) < cutoff) break;
          for (let k = 0; k < mainCount && k < draw.result.length; k++) {
            const n = draw.result[k];
            wFreq.set(n, (wFreq.get(n) || 0) + 1);
          }
        }
        const sorted = [...allNumbers].sort(
          (a, b) => (wFreq.get(b) || 0) - (wFreq.get(a) || 0)
        );
        const topN = Math.ceil(mainCount * 0.8);
        const topCandidates = sorted.slice(0, mainCount * 2);
        shuffle(topCandidates);
        const selected: number[] = topCandidates.slice(0, topN);
        // Fill with random
        const remaining = allNumbers.filter((n) => !selected.includes(n));
        shuffle(remaining);
        while (selected.length < mainCount && remaining.length > 0) {
          selected.push(remaining.pop()!);
        }
        pool = selected.sort((a, b) => a - b);
        break;
      }
      case "pattern": {
        // Pattern strategy — ranked #1 overall across all matrix products in backtest
        // Analyses spacing between consecutive numbers and range distribution across
        // equal sub-bands, then generates tickets matching the most common structural patterns.
        const numBands = mainCount; // e.g., 6 bands for pick-6
        const bandSize = Math.ceil(allNumbers.length / numBands);

        // Analyse recent draws for spacing & band distribution patterns
        const recentCount = Math.min(draws.length, 200);
        const bandCounts: number[][] = Array.from({ length: numBands }, () => new Array(bandSize + 1).fill(0));
        const spacings: number[] = [];

        for (let d = 0; d < recentCount; d++) {
          const result = draws[d].result.slice(0, mainCount).sort((a, b) => a - b);
          // Record which band each number falls into
          for (const n of result) {
            const band = Math.min(Math.floor((n - minNumber) / bandSize), numBands - 1);
            const posInBand = (n - minNumber) - band * bandSize;
            if (posInBand >= 0 && posInBand < bandCounts[band].length) {
              bandCounts[band][posInBand]++;
            }
          }
          // Record spacing between consecutive numbers
          for (let i = 1; i < result.length; i++) {
            spacings.push(result[i] - result[i - 1]);
          }
        }

        // Target spacing: median spacing from history
        const sortedSpacings = [...spacings].sort((a, b) => a - b);
        const medianSpacing = sortedSpacings[Math.floor(sortedSpacings.length / 2)] || Math.floor(allNumbers.length / mainCount);

        // Generate: pick one number per band, weighted by historical band-position frequency
        const selected: number[] = [];
        const bandOrder = Array.from({ length: numBands }, (_, i) => i);
        shuffle(bandOrder);

        for (const band of bandOrder) {
          const bandStart = minNumber + band * bandSize;
          const bandEnd = Math.min(bandStart + bandSize - 1, maxNumber);
          const bandNums: number[] = [];
          const bandWeights: number[] = [];
          for (let n = bandStart; n <= bandEnd; n++) {
            if (!selected.includes(n)) {
              bandNums.push(n);
              const posInBand = n - bandStart;
              // Weight = band frequency + global frequency + small random
              const bw = (bandCounts[band][posInBand] || 0) + 1;
              const gw = (freq.get(n) || 0) + 1;
              bandWeights.push(bw * 0.6 + gw * 0.4 + Math.random() * 0.5);
            }
          }
          if (bandNums.length > 0) {
            // Spacing constraint: prefer numbers that create good spacing
            if (selected.length > 0) {
              const lastSelected = Math.max(...selected);
              for (let i = 0; i < bandWeights.length; i++) {
                const gap = Math.abs(bandNums[i] - lastSelected);
                const spacingBonus = 1.0 / (1.0 + Math.abs(gap - medianSpacing));
                bandWeights[i] *= (1 + spacingBonus);
              }
            }
            const totalW = bandWeights.reduce((s, w) => s + w, 0);
            let r = Math.random() * totalW;
            let picked = bandNums[bandNums.length - 1];
            for (let i = 0; i < bandNums.length; i++) {
              r -= bandWeights[i];
              if (r <= 0) { picked = bandNums[i]; break; }
            }
            selected.push(picked);
          }
        }

        // Fill remaining if needed
        while (selected.length < mainCount) {
          const remaining = allNumbers.filter((n) => !selected.includes(n));
          if (remaining.length === 0) break;
          selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
        }
        pool = selected.sort((a, b) => a - b);
        break;
      }
      case "mixed":
      default: {
        // 50% from hot (high freq), 50% from cold (long absence)
        const byFreq = [...allNumbers].sort((a, b) => (freq.get(b) || 0) - (freq.get(a) || 0));
        const byAbsence = [...allNumbers].sort(
          (a, b) => (lastSeen.get(a) ?? draws.length) - (lastSeen.get(b) ?? draws.length)
        );
        // Reverse absence so longest absence = most priority
        byAbsence.reverse();

        const hotPool = byFreq.slice(0, 15);
        const coldPool = byAbsence.slice(0, 15);
        shuffle(hotPool);
        shuffle(coldPool);

        const half = Math.floor(mainCount / 2);
        const hotPick = hotPool.slice(0, half);
        const remaining = coldPool.filter((n) => !hotPick.includes(n));
        const coldPick = remaining.slice(0, mainCount - half);
        pool = [...hotPick, ...coldPick].sort((a, b) => a - b);
        break;
      }
    }

    const set: SuggestionSet = { numbers: pool, strategy };
    if (hasSpecial) {
      set.special = Math.floor(Math.random() * specialMax) + 1;
    }
    sets.push(set);
  }

  return sets;
}

// ============================================================
// Sampling utilities
// ============================================================

/**
 * Sample from Dirichlet distribution using Gamma samples.
 * Uses the Marsaglia-Tsang method for Gamma(alpha, 1).
 */
function sampleDirichlet(alpha: number[]): number[] {
  const gammas = alpha.map((a) => sampleGamma(a));
  const sum = gammas.reduce((s, g) => s + g, 0) || 1;
  return gammas.map((g) => g / sum);
}

/**
 * Sample from Gamma(alpha, 1) distribution.
 * For alpha >= 1: Marsaglia-Tsang method.
 * For alpha < 1: Boost method.
 */
function sampleGamma(alpha: number): number {
  if (alpha < 1) {
    // Boost: Gamma(alpha+1) * U^(1/alpha)
    return sampleGamma(alpha + 1) * Math.pow(Math.random(), 1.0 / alpha);
  }
  // Marsaglia-Tsang
  const d = alpha - 1.0 / 3.0;
  const c = 1.0 / Math.sqrt(9.0 * d);
  while (true) {
    let x: number;
    let v: number;
    do {
      x = randn();
      v = 1.0 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1.0 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1.0 - v + Math.log(v))) return d * v;
  }
}

/** Standard normal sample (Box-Muller) */
function randn(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Weighted sample without replacement using probability array */
function weightedSampleFromProbs(
  items: number[],
  probs: number[],
  count: number
): number[] {
  const selected = new Set<number>();
  const p = [...probs];

  while (selected.size < count) {
    const total = p.reduce((s, v) => s + v, 0);
    if (total <= 0) break;
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= p[i];
      if (r <= 0) {
        selected.add(items[i]);
        p[i] = 0; // remove from further selection
        break;
      }
    }
  }

  // Fill remaining if needed
  if (selected.size < count) {
    const remaining = items.filter((n) => !selected.has(n));
    shuffle(remaining);
    for (const n of remaining) {
      if (selected.size >= count) break;
      selected.add(n);
    }
  }

  return [...selected].sort((a, b) => a - b);
}

function weightedSample(items: number[], weights: number[], count: number): number[] {
  const totalWeight = weights.reduce((s, w) => s + w, 0) || 1;
  const selected = new Set<number>();

  while (selected.size < count) {
    let r = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        selected.add(items[i]);
        break;
      }
    }
  }

  return [...selected].sort((a, b) => a - b);
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

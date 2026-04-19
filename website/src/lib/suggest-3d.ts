import type { ThreeDDraw, ThreeDSuggestionSet, SuggestionStrategy } from "./types";

/**
 * Generate 3-digit number suggestions for Max 3D / 3D Pro.
 *
 * Strategies:
 * - frequency: Pick from most frequent 3-digit numbers
 * - absence: Pick longest-absent 3-digit numbers
 * - mixed: Compose digit-by-digit using positional frequency
 * - bayesian: Dirichlet posterior sampling on digit positions
 * - maxentropy: Stratified digit sampling ensuring diverse structure
 * - adaptive: Self-tuning lookback window for digit frequency
 */
export function generate3DSuggestions(
  draws: ThreeDDraw[],
  strategy: SuggestionStrategy,
  count: number = 5
): ThreeDSuggestionSet[] {
  const sets: ThreeDSuggestionSet[] = [];

  // Collect all 3-digit numbers from all tiers
  const freq = new Map<string, number>();
  const lastSeen = new Map<string, number>();

  for (let i = 0; i < draws.length; i++) {
    for (const values of Object.values(draws[i].result)) {
      for (const num of values) {
        const padded = num.padStart(3, "0");
        freq.set(padded, (freq.get(padded) || 0) + 1);
        if (!lastSeen.has(padded)) lastSeen.set(padded, i);
      }
    }
  }

  // Digit frequency per position for composition strategy
  const digitFreq: number[][] = [
    new Array(10).fill(0),
    new Array(10).fill(0),
    new Array(10).fill(0),
  ];
  for (const draw of draws) {
    for (const values of Object.values(draw.result)) {
      for (const num of values) {
        const padded = num.padStart(3, "0");
        for (let pos = 0; pos < 3; pos++) {
          digitFreq[pos][parseInt(padded[pos], 10)]++;
        }
      }
    }
  }

  for (let s = 0; s < count; s++) {
    let numbers: string[];

    switch (strategy) {
      case "frequency": {
        // Pick from top frequent numbers with randomness
        const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
        const pool = sorted.slice(0, 50);
        shuffle(pool);
        numbers = pool.slice(0, 2).map(([n]) => n);
        break;
      }
      case "absence": {
        // Pick numbers not seen for longest
        const scored = [...freq.keys()].map((n) => ({
          number: n,
          idx: lastSeen.get(n) ?? draws.length,
        }));
        scored.sort((a, b) => b.idx - a.idx);
        const pool = scored.slice(0, 30);
        shuffle(pool);
        numbers = pool.slice(0, 2).map((x) => x.number);
        break;
      }
      case "bayesian": {
        // Dirichlet posterior sampling on each digit position
        numbers = [];
        for (let n = 0; n < 2; n++) {
          let num = "";
          for (let pos = 0; pos < 3; pos++) {
            const alpha = digitFreq[pos].map((f) => 1.0 + f);
            const theta = sampleDirichlet(alpha);
            // Sample digit from posterior
            let r = Math.random();
            let digit = 0;
            for (let d = 0; d < 10; d++) {
              r -= theta[d];
              if (r <= 0) { digit = d; break; }
            }
            num += digit;
          }
          numbers.push(num.padStart(3, "0"));
        }
        break;
      }
      case "maxentropy": {
        // Stratified: split digits into low (0-4) and high (5-9) bands,
        // ensure each position samples from alternating bands
        numbers = [];
        for (let n = 0; n < 2; n++) {
          let num = "";
          for (let pos = 0; pos < 3; pos++) {
            // Alternate band per position for structural diversity
            const useLow = (pos + n) % 2 === 0;
            const bandDigits = useLow ? [0, 1, 2, 3, 4] : [5, 6, 7, 8, 9];
            const alpha = bandDigits.map((d) => 1.0 + digitFreq[pos][d]);
            const theta = sampleDirichlet(alpha);
            let r = Math.random();
            let digit = bandDigits[bandDigits.length - 1];
            for (let i = 0; i < theta.length; i++) {
              r -= theta[i];
              if (r <= 0) { digit = bandDigits[i]; break; }
            }
            num += digit;
          }
          numbers.push(num.padStart(3, "0"));
        }
        break;
      }
      case "adaptive": {
        // Self-tuning: test different lookback windows on recent draws
        const windows = [50, 100, 200, 500];
        const evalCount = Math.min(10, Math.floor(draws.length / 3));
        let bestWindow = 200;
        let bestScore = -1;

        for (const w of windows) {
          let totalScore = 0;
          let valid = 0;
          for (let e = 0; e < evalCount; e++) {
            const evalIdx = draws.length - 1 - e;
            if (evalIdx < 10) break;
            // Compute digit frequency in window
            const wDigitFreq: number[][] = [
              new Array(10).fill(0), new Array(10).fill(0), new Array(10).fill(0),
            ];
            const end = Math.min(evalIdx + 1 + w, draws.length);
            for (let j = evalIdx + 1; j < end; j++) {
              for (const values of Object.values(draws[j].result)) {
                for (const num of values) {
                  const padded = num.padStart(3, "0");
                  for (let pos = 0; pos < 3; pos++) {
                    wDigitFreq[pos][parseInt(padded[pos], 10)]++;
                  }
                }
              }
            }
            // Predict top digit per position
            let predicted = "";
            for (let pos = 0; pos < 3; pos++) {
              let topD = 0;
              let topF = -1;
              for (let d = 0; d < 10; d++) {
                if (wDigitFreq[pos][d] > topF) { topF = wDigitFreq[pos][d]; topD = d; }
              }
              predicted += topD;
            }
            // Check against actual draw
            for (const values of Object.values(draws[evalIdx].result)) {
              for (const num of values) {
                const padded = num.padStart(3, "0");
                let matches = 0;
                for (let pos = 0; pos < 3; pos++) {
                  if (padded[pos] === predicted[pos]) matches++;
                }
                totalScore += matches;
                valid++;
              }
            }
          }
          const avg = valid > 0 ? totalScore / valid : 0;
          if (avg > bestScore) { bestScore = avg; bestWindow = w; }
        }

        // Use best window for final prediction
        const wDigitFreq: number[][] = [
          new Array(10).fill(0), new Array(10).fill(0), new Array(10).fill(0),
        ];
        const end = Math.min(bestWindow, draws.length);
        for (let j = 0; j < end; j++) {
          for (const values of Object.values(draws[j].result)) {
            for (const num of values) {
              const padded = num.padStart(3, "0");
              for (let pos = 0; pos < 3; pos++) {
                wDigitFreq[pos][parseInt(padded[pos], 10)]++;
              }
            }
          }
        }

        numbers = [];
        for (let n = 0; n < 2; n++) {
          let num = "";
          for (let pos = 0; pos < 3; pos++) {
            const weights = wDigitFreq[pos];
            const total = weights.reduce((s, w) => s + w, 0) || 1;
            let r = Math.random() * total;
            for (let d = 0; d < 10; d++) {
              r -= weights[d];
              if (r <= 0) { num += d; break; }
            }
            if (num.length === pos) num += "0";
          }
          numbers.push(num.padStart(3, "0"));
        }
        break;
      }
      case "mixed":
      default: {
        // Compose digit by digit using weighted random
        numbers = [];
        for (let n = 0; n < 2; n++) {
          let num = "";
          for (let pos = 0; pos < 3; pos++) {
            const weights = digitFreq[pos];
            const total = weights.reduce((s, w) => s + w, 0) || 1;
            let r = Math.random() * total;
            for (let d = 0; d < 10; d++) {
              r -= weights[d];
              if (r <= 0) {
                num += d;
                break;
              }
            }
            if (num.length === pos) num += "0"; // fallback
          }
          numbers.push(num.padStart(3, "0"));
        }
        break;
      }
    }

    sets.push({ numbers, strategy });
  }

  return sets;
}

// ============================================================
// Sampling utilities
// ============================================================

function sampleDirichlet(alpha: number[]): number[] {
  const gammas = alpha.map((a) => sampleGamma(a));
  const sum = gammas.reduce((s, g) => s + g, 0) || 1;
  return gammas.map((g) => g / sum);
}

function sampleGamma(alpha: number): number {
  if (alpha < 1) {
    return sampleGamma(alpha + 1) * Math.pow(Math.random(), 1.0 / alpha);
  }
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

function randn(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

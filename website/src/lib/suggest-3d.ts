import type { ThreeDDraw, ThreeDSuggestionSet, SuggestionStrategy } from "./types";

/**
 * Generate 3-digit number suggestions for Max 3D / 3D Pro.
 *
 * Strategies:
 * - frequency: Pick from most frequent 3-digit numbers
 * - absence: Pick longest-absent 3-digit numbers
 * - mixed: Compose digit-by-digit using positional frequency
 * - bayesian: Dirichlet posterior sampling on digit positions
 * - maxentropy: SumRange filter – digit-sum range filtering + digit frequency weights
 * - adaptive: Self-tuning lookback window for digit frequency
 * - pattern: Structural patterns (odd/even + high/low) + digit-sum range
 */
function padNum(n: number): string {
  return String(n).padStart(3, "0");
}

export function generate3DSuggestions(
  draws: ThreeDDraw[],
  strategy: SuggestionStrategy,
  count: number = 5
): ThreeDSuggestionSet[] {
  const sets: ThreeDSuggestionSet[] = [];

  // ── Windowed lookback (best backtest: 200 draws) ──
  const LOOKBACK = 200;
  const recentDraws = draws.slice(0, Math.min(LOOKBACK, draws.length));

  // Collect whole-number frequency from recent window (for frequency strategy)
  const recentFreq = new Map<string, number>();
  for (const draw of recentDraws) {
    for (const values of Object.values(draw.result)) {
      for (const num of values) {
        const padded = num.padStart(3, "0");
        recentFreq.set(padded, (recentFreq.get(padded) || 0) + 1);
      }
    }
  }

  // All-time frequency + last seen (for absence strategy)
  const allFreq = new Map<string, number>();
  const lastSeen = new Map<string, number>();
  for (let i = 0; i < draws.length; i++) {
    for (const values of Object.values(draws[i].result)) {
      for (const num of values) {
        const padded = num.padStart(3, "0");
        allFreq.set(padded, (allFreq.get(padded) || 0) + 1);
        if (!lastSeen.has(padded)) lastSeen.set(padded, i);
      }
    }
  }

  // Digit frequency per position from recent window
  const digitFreq: number[][] = [
    new Array(10).fill(0),
    new Array(10).fill(0),
    new Array(10).fill(0),
  ];
  for (const draw of recentDraws) {
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
        // Weighted random from top 50 most frequent in recent window
        // This is the best-performing strategy for 3D products (backtest: 2.33-2.35%)
        const sorted = [...recentFreq.entries()].sort((a, b) => b[1] - a[1]);
        const pool = sorted.slice(0, 50);
        if (pool.length === 0) {
          numbers = [padNum(Math.random() * 1000 | 0), padNum(Math.random() * 1000 | 0)];
          break;
        }
        const nums = pool.map(([n]) => n);
        const weights = pool.map(([, c]) => c);
        const totalW = weights.reduce((s, w) => s + w, 0);
        const chosen = new Set<string>();
        const result: string[] = [];
        for (let attempt = 0; attempt < 100 && result.length < 2; attempt++) {
          let r = Math.random() * totalW;
          for (let i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) {
              if (!chosen.has(nums[i])) {
                chosen.add(nums[i]);
                result.push(nums[i]);
              }
              break;
            }
          }
        }
        while (result.length < 2) result.push(padNum(Math.random() * 1000 | 0));
        numbers = result;
        break;
      }
      case "absence": {
        // Pick numbers not seen for longest
        const scored = [...allFreq.keys()].map((n) => ({
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
        // SumRange Filter: generate numbers whose digit-sum falls in the most
        // common historical range (mean ± 1σ). This strategy ranked #2 on
        // Max 3D Pro (2.295%) and #5 on Max 3D (2.055%) in backtests.
        const sums: number[] = [];
        for (const draw of recentDraws) {
          for (const values of Object.values(draw.result)) {
            for (const num of values) {
              const p = num.padStart(3, "0");
              sums.push(+p[0] + +p[1] + +p[2]);
            }
          }
        }
        const meanS = sums.reduce((a, b) => a + b, 0) / (sums.length || 1);
        const stdS = Math.sqrt(sums.reduce((a, b) => a + (b - meanS) ** 2, 0) / (sums.length || 1)) || 1;
        const lo = Math.max(0, meanS - stdS);
        const hi = Math.min(27, meanS + stdS);

        // Digit position weights
        const dw: number[][] = [];
        for (let pos = 0; pos < 3; pos++) {
          const total = digitFreq[pos].reduce((a: number, b: number) => a + b, 0) || 1;
          dw.push(digitFreq[pos].map((f: number) => f / total));
        }

        numbers = [];
        for (let n = 0; n < 2; n++) {
          let found = false;
          for (let att = 0; att < 40 && !found; att++) {
            const d0 = weightedDigit(dw[0]);
            const d1 = weightedDigit(dw[1]);
            const d2 = weightedDigit(dw[2]);
            const ds = d0 + d1 + d2;
            if (ds >= lo && ds <= hi) {
              numbers.push(padNum(d0 * 100 + d1 * 10 + d2));
              found = true;
            }
          }
          if (!found) {
            // Fallback: digit-frequency without filter
            const d0 = weightedDigit(dw[0]);
            const d1 = weightedDigit(dw[1]);
            const d2 = weightedDigit(dw[2]);
            numbers.push(padNum(d0 * 100 + d1 * 10 + d2));
          }
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
      case "pattern": {
        // Pattern 3D strategy — analyses structural patterns in 3-digit numbers:
        // 1. Odd/even pattern per position
        // 2. High/low pattern per position  
        // 3. Digit-sum range filtering (like SumRange but with positional patterns)
        // Backtest: ~2.0% exact match (at baseline, but provides structural diversity)

        // Analyse recent patterns
        const patternFreq = new Map<string, number>(); // e.g., "OEO-HLL" = odd/even + high/low
        const recentN = Math.min(200, draws.length);
        const allSums: number[] = [];

        for (let d = 0; d < recentN; d++) {
          for (const values of Object.values(draws[d].result)) {
            for (const num of values) {
              const p = num.padStart(3, "0");
              const ds = +p[0] + +p[1] + +p[2];
              allSums.push(ds);
              // Pattern: odd/even + high/low for each digit
              const oe = Array.from(p).map(c => +c % 2 === 0 ? "E" : "O").join("");
              const hl = Array.from(p).map(c => +c >= 5 ? "H" : "L").join("");
              const pat = `${oe}-${hl}`;
              patternFreq.set(pat, (patternFreq.get(pat) || 0) + 1);
            }
          }
        }

        // Find top patterns
        const sortedPatterns = [...patternFreq.entries()].sort((a, b) => b[1] - a[1]);
        const topPatterns = sortedPatterns.slice(0, 8).map(([p]) => p);

        // Digit-sum range
        const meanS = allSums.reduce((a, b) => a + b, 0) / (allSums.length || 1);
        const stdS = Math.sqrt(allSums.reduce((a, b) => a + (b - meanS) ** 2, 0) / (allSums.length || 1)) || 1;
        const lo = Math.max(0, meanS - stdS);
        const hi = Math.min(27, meanS + stdS);

        numbers = [];
        for (let n = 0; n < 2; n++) {
          // Pick a random top pattern
          const targetPat = topPatterns[Math.floor(Math.random() * topPatterns.length)];
          const [oePat, hlPat] = targetPat.split("-");

          let found = false;
          for (let att = 0; att < 50 && !found; att++) {
            let num = "";
            for (let pos = 0; pos < 3; pos++) {
              // Filter digits by pattern constraints
              const candidates: number[] = [];
              const candWeights: number[] = [];
              for (let d = 0; d < 10; d++) {
                const isOdd = d % 2 === 1;
                const isHigh = d >= 5;
                const oeOk = (oePat[pos] === "O" && isOdd) || (oePat[pos] === "E" && !isOdd);
                const hlOk = (hlPat[pos] === "H" && isHigh) || (hlPat[pos] === "L" && !isHigh);
                if (oeOk && hlOk) {
                  candidates.push(d);
                  candWeights.push(digitFreq[pos][d] + 1);
                }
              }
              if (candidates.length === 0) {
                // Fallback: use digit frequency
                num += weightedDigit(digitFreq[pos].map((f: number) => f / (digitFreq[pos].reduce((a: number, b: number) => a + b, 0) || 1)));
              } else {
                const total = candWeights.reduce((s, w) => s + w, 0);
                let r = Math.random() * total;
                let picked = candidates[0];
                for (let i = 0; i < candidates.length; i++) {
                  r -= candWeights[i];
                  if (r <= 0) { picked = candidates[i]; break; }
                }
                num += picked;
              }
            }
            const ds = +num[0] + +num[1] + +num[2];
            if (ds >= lo && ds <= hi) {
              numbers.push(num.padStart(3, "0"));
              found = true;
            }
          }
          if (!found) {
            // Fallback
            const d0 = weightedDigit(digitFreq[0].map((f: number) => f / (digitFreq[0].reduce((a: number, b: number) => a + b, 0) || 1)));
            const d1 = weightedDigit(digitFreq[1].map((f: number) => f / (digitFreq[1].reduce((a: number, b: number) => a + b, 0) || 1)));
            const d2 = weightedDigit(digitFreq[2].map((f: number) => f / (digitFreq[2].reduce((a: number, b: number) => a + b, 0) || 1)));
            numbers.push(padNum(d0 * 100 + d1 * 10 + d2));
          }
        }
        break;
      }
      case "evmax": {
        // EVMaximizer — #1 on Max 3D Pro (2.496% exact, ROI -26.5% in backtest)
        // Computes EV per number using tier-weighted prizes & exponential decay,
        // then samples from top EV numbers with diversity constraint.
        const HALF_LIFE = 100;
        const LOOKBACK_EV = Math.min(300, draws.length);
        const tierPrizes: Record<string, number> = {
          special: 1000000, first: 350000, second: 210000, third: 100000,
        };
        const tierKeys = ["special", "first", "second", "third"] as const;

        // Count frequency per number per tier, with exponential decay
        const evMap = new Map<string, number>();
        for (let i = 0; i < LOOKBACK_EV; i++) {
          const weight = Math.exp(-Math.LN2 * i / HALF_LIFE);
          for (const tier of tierKeys) {
            const prize = tierPrizes[tier] || 100000;
            const nums = draws[i]?.result?.[tier];
            if (!nums) continue;
            for (const num of nums) {
              const p = num.padStart(3, "0");
              evMap.set(p, (evMap.get(p) || 0) + weight * prize);
            }
          }
        }

        // Sort by EV, take top candidates
        const evRanked = [...evMap.entries()].sort((a, b) => b[1] - a[1]);
        const evPool = evRanked.slice(0, 80);

        // Sample with diversity constraint (min digit distance = 4)
        numbers = [];
        const MIN_DIGIT_DIST = 4;
        const weights = evPool.map(([, ev]) => ev);
        const totalW = weights.reduce((s, w) => s + w, 0) || 1;

        for (let n = 0; n < 2; n++) {
          for (let att = 0; att < 100; att++) {
            let r = Math.random() * totalW;
            let picked = evPool[0][0];
            for (let i = 0; i < weights.length; i++) {
              r -= weights[i];
              if (r <= 0) { picked = evPool[i][0]; break; }
            }
            // Diversity check against already picked
            if (numbers.length > 0) {
              const dist = Math.abs(
                +picked[0] - +numbers[0][0]
              ) + Math.abs(
                +picked[1] - +numbers[0][1]
              ) + Math.abs(
                +picked[2] - +numbers[0][2]
              );
              if (dist < MIN_DIGIT_DIST) continue;
            }
            numbers.push(picked);
            break;
          }
        }
        while (numbers.length < 2) {
          numbers.push(evPool[Math.floor(Math.random() * evPool.length)][0]);
        }
        break;
      }
      case "jointbias": {
        // JointDigitBias — #2 on Max 3D (2.268%), #3 on 3D Pro (2.375%)
        // Uses joint 3-digit frequency with Laplace smoothing.
        // Exploits the statistical finding that digit positions are NOT independent.
        const LOOKBACK_JB = Math.min(300, draws.length);
        const jointFreq = new Map<string, number>();
        let totalJoint = 0;

        for (let i = 0; i < LOOKBACK_JB; i++) {
          for (const values of Object.values(draws[i].result)) {
            for (const num of values) {
              const p = num.padStart(3, "0");
              jointFreq.set(p, (jointFreq.get(p) || 0) + 1);
              totalJoint++;
            }
          }
        }

        // Laplace smoothing: P(num) = (count + alpha) / (total + 1000 * alpha)
        const ALPHA = 1.0;
        const TEMPERATURE = 1.0;
        const denominator = totalJoint + 1000 * ALPHA;

        // Build probability distribution over all 1000 numbers
        const probs: number[] = [];
        const nums: string[] = [];
        for (let n = 0; n < 1000; n++) {
          const key = padNum(n);
          const count = jointFreq.get(key) || 0;
          const p = (count + ALPHA) / denominator;
          // Temperature scaling: p^(1/T) — T=1.0 keeps distribution, lower T sharpens
          probs.push(Math.pow(p, 1.0 / TEMPERATURE));
          nums.push(key);
        }
        const probSum = probs.reduce((s, p) => s + p, 0) || 1;

        numbers = [];
        const chosen = new Set<string>();
        for (let n = 0; n < 2; n++) {
          for (let att = 0; att < 100; att++) {
            let r = Math.random() * probSum;
            let picked = "000";
            for (let i = 0; i < 1000; i++) {
              r -= probs[i];
              if (r <= 0) { picked = nums[i]; break; }
            }
            if (!chosen.has(picked)) {
              chosen.add(picked);
              numbers.push(picked);
              break;
            }
          }
        }
        while (numbers.length < 2) numbers.push(padNum(Math.floor(Math.random() * 1000)));
        break;
      }
      case "coverageopt": {
        // Port of 3d/advanced_backtest.py MinimumCoverageSet (B1 — Chu kỳ 22 Max 3D ROI pick).
        // Score each 3-digit number by frequency in recent window; pick top-1 by score,
        // then greedy next with (1-w)·normalized_freq + w·normalized_digit_distance.
        const LB = 200;
        const lookbackDraws = draws.slice(0, Math.min(LB, draws.length));
        const freqCoverage = new Map<string, number>();
        for (const draw of lookbackDraws) {
          for (const values of Object.values(draw.result)) {
            for (const num of values) {
              const padded = num.padStart(3, "0");
              freqCoverage.set(padded, (freqCoverage.get(padded) || 0) + 1);
            }
          }
        }
        const candidatePool = [...freqCoverage.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, Math.min(200, freqCoverage.size))
          .map(([n]) => n);

        if (candidatePool.length === 0) {
          numbers = [padNum(Math.floor(Math.random() * 1000)), padNum(Math.floor(Math.random() * 1000))];
          break;
        }

        const maxScore = Math.max(...candidatePool.map((n) => freqCoverage.get(n)!));
        const diversityWeight = 0.5;
        const selected: string[] = [];

        // First pick: highest frequency
        selected.push(candidatePool[0]);

        // Subsequent: combined score
        while (selected.length < 2) {
          let bestNum: string | null = null;
          let bestCombined = -1;
          for (const c of candidatePool) {
            if (selected.includes(c)) continue;
            const freqScore = (freqCoverage.get(c) || 0) / maxScore;
            let minDist = Infinity;
            for (const s of selected) {
              const dist =
                Math.abs(parseInt(c[0], 10) - parseInt(s[0], 10)) +
                Math.abs(parseInt(c[1], 10) - parseInt(s[1], 10)) +
                Math.abs(parseInt(c[2], 10) - parseInt(s[2], 10));
              if (dist < minDist) minDist = dist;
            }
            const diversityScore = minDist / 27.0;
            const combined = (1 - diversityWeight) * freqScore + diversityWeight * diversityScore;
            if (combined > bestCombined) {
              bestCombined = combined;
              bestNum = c;
            }
          }
          if (bestNum) selected.push(bestNum);
          else break;
        }

        while (selected.length < 2) {
          selected.push(padNum(Math.floor(Math.random() * 1000)));
        }
        numbers = selected;
        break;
      }
      case "pairexploiter": {
        // Port of 3d/advanced_backtest.py DigitPairExploiter (D3 — Chu kỳ 22 Max 3D winrate pick).
        // Build 10×10 pair frequency matrices for positions (0,1), (1,2), (0,2) with Laplace smoothing.
        // Compute O/E ratio per pair. Score each 3-digit number by synergy (product of 3 O/E ratios) ×
        // geometric mean of marginal frequencies. Sample with temperature softmax.
        const LB = 300;
        const TEMP = 0.7;
        const lookbackDraws = draws.slice(0, Math.min(LB, draws.length));

        const pair01 = Array.from({ length: 10 }, () => new Array(10).fill(1));
        const pair12 = Array.from({ length: 10 }, () => new Array(10).fill(1));
        const pair02 = Array.from({ length: 10 }, () => new Array(10).fill(1));
        const marg = [new Array(10).fill(1), new Array(10).fill(1), new Array(10).fill(1)];
        let pairSum01 = 0, pairSum12 = 0, pairSum02 = 0;

        for (const draw of lookbackDraws) {
          for (const values of Object.values(draw.result)) {
            for (const num of values) {
              const padded = num.padStart(3, "0");
              const d0 = parseInt(padded[0], 10);
              const d1 = parseInt(padded[1], 10);
              const d2 = parseInt(padded[2], 10);
              pair01[d0][d1]++; pairSum01++;
              pair12[d1][d2]++; pairSum12++;
              pair02[d0][d2]++; pairSum02++;
              marg[0][d0]++;
              marg[1][d1]++;
              marg[2][d2]++;
            }
          }
        }
        // Account for Laplace smoothing base in sums (added 100 per pair matrix)
        pairSum01 += 100; pairSum12 += 100; pairSum02 += 100;
        const mSum = marg.map((m) => m.reduce((a, v) => a + v, 0));

        const oeRatio = (
          pm: number[][],
          margA: number[],
          margB: number[],
          mSumA: number,
          mSumB: number,
          pSum: number,
        ): number[][] => {
          const r = Array.from({ length: 10 }, () => new Array(10).fill(0));
          for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
              const expected = (margA[i] / mSumA) * (margB[j] / mSumB) * pSum;
              r[i][j] = expected > 0 ? pm[i][j] / expected : 0;
            }
          }
          return r;
        };

        const oe01 = oeRatio(pair01, marg[0], marg[1], mSum[0], mSum[1], pairSum01);
        const oe12 = oeRatio(pair12, marg[1], marg[2], mSum[1], mSum[2], pairSum12);
        const oe02 = oeRatio(pair02, marg[0], marg[2], mSum[0], mSum[2], pairSum02);

        const scores = new Array(1000).fill(0);
        for (let i = 0; i < 1000; i++) {
          const d0 = Math.floor(i / 100);
          const d1 = Math.floor((i % 100) / 10);
          const d2 = i % 10;
          const synergy = oe01[d0][d1] * oe12[d1][d2] * oe02[d0][d2];
          const freqPrior = Math.cbrt(marg[0][d0] * marg[1][d1] * marg[2][d2]);
          scores[i] = synergy * freqPrior;
        }

        // Temperature softmax
        const logScores = scores.map((s) => Math.log(s + 1e-10) / TEMP);
        const maxLog = Math.max(...logScores);
        const probs = logScores.map((ls) => Math.exp(ls - maxLog));
        const probSum = probs.reduce((a, v) => a + v, 0);
        const normProbs = probs.map((p) => p / probSum);

        // Sample 2 without replacement
        const picked = new Set<number>();
        const p = [...normProbs];
        while (picked.size < 2) {
          const tot = p.reduce((a, v) => a + v, 0);
          if (tot <= 0) {
            let n = Math.floor(Math.random() * 1000);
            while (picked.has(n)) n = (n + 1) % 1000;
            picked.add(n);
            continue;
          }
          let r = Math.random() * tot;
          let idx = 999;
          for (let i = 0; i < 1000; i++) {
            r -= p[i];
            if (r <= 0) { idx = i; break; }
          }
          picked.add(idx);
          p[idx] = 0;
        }
        numbers = [...picked].map(padNum);
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

/** Sample a single digit 0-9 from a probability weight array. */
function weightedDigit(weights: number[]): number {
  let r = Math.random();
  for (let d = 0; d < weights.length; d++) {
    r -= weights[d];
    if (r <= 0) return d;
  }
  return weights.length - 1;
}

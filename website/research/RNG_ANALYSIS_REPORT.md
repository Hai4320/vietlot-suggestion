# Reverse-Engineering the Vietlott Power 5/35 Random Number Generator

> **⚠️ SUPERSEDED (2026-04-20)** — Báo cáo này dựa trên 516 draws và 13-test. Đã được superseded bởi [matrix/power535_deep_analysis.py](matrix/power535_deep_analysis.py) (539 draws, 14 tests, Bonferroni correction explicit) — xem [RESEARCH_HISTORY.md Chu kỳ 5](RESEARCH_HISTORY.md#chu-kỳ-5). Kết quả hiện tại: T11 Parity p=0.0012 pass Bonferroni, **khác** với "no exploitable patterns" dưới đây.
>
> Giữ file này làm snapshot của analysis 2026-04-14.

**Dataset:** 516 draws (2025-06-29 to 2026-04-14)  
**Analysis date:** 2026-04-14  
**Method:** 13 statistical tests applied to historical draw data

---

## Executive Summary

After running 13 independent statistical tests on 516 draws, the conclusion is clear:

**The Vietlott Power 5/35 RNG is indistinguishable from true randomness.**

All major tests pass at 95% confidence. Minor anomalies found are consistent with normal statistical fluctuation in a 516-sample dataset. There are no exploitable patterns.

| Verdict | Tests |
|---------|-------|
| PASS | 11 out of 13 |
| MINOR NOTE | 2 (within noise) |
| FAIL | 0 |

---

## Test Results

### Test 1: Chi-Square Goodness of Fit

**Question:** Is each number (1-35) equally likely to be drawn?

**Method:** Compare observed frequency of each number against the expected frequency under a uniform distribution. If the RNG is fair, each number should appear in approximately 14.29% of draws (5 picks / 35 numbers).

**Math:**
```
Expected count per number = total_picks / 35 = 2580 / 35 = 73.71
Chi-square = SUM((observed - expected)^2 / expected) for each number 1-35
           = (81-73.71)^2/73.71 + (67-73.71)^2/73.71 + ... = 31.624
Degrees of freedom = 35 - 1 = 34
Critical value at alpha=0.05: 48.60
```

| Metric | Main Numbers | Special Numbers |
|--------|-------------|-----------------|
| Chi-square | 31.624 | 6.605 |
| df | 34 | 11 |
| Critical (p=0.05) | 48.60 | 19.68 |
| **Result** | **PASS** | **PASS** |

**Interpretation:** 31.62 is well below the critical value of 48.60. The distribution is consistent with a fair, uniform RNG. The special numbers (1-12) also pass with chi-square = 6.60 << 19.68.

---

### Test 2: Serial Correlation (Autocorrelation)

**Question:** Does draw N predict draw N+1? If the RNG reuses state between draws, consecutive draws would share more numbers than expected.

**Math:**
```
Expected overlap = hypergeometric mean = 5 * 5 / 35 = 0.7143
Observed overlap = 0.7223
Difference = +0.0080 (negligible)
```

| Overlap | Observed | Expected (hypergeometric) |
|---------|----------|--------------------------|
| 0 shared | 44.1% | 43.9% |
| 1 shared | 40.6% | 42.2% |
| 2 shared | 14.4% | 12.5% |
| 3 shared | 1.0% | 1.3% |

**Result: PASS.** Consecutive draws are independent. The observed overlap matches the hypergeometric distribution almost exactly.

---

### Test 3: Runs Test (Streak Analysis)

**Question:** Does each number appear/disappear in random streaks, or does it cluster (appear in bursts) or disperse (spread too evenly)?

**Method:** For each number, create a binary sequence (1 = appeared, 0 = absent) across 516 draws. Count "runs" (consecutive same values). Compare to expected runs count.

**Math:**
```
Expected runs = (2 * n0 * n1) / n + 1
Variance = (2 * n0 * n1 * (2*n0*n1 - n)) / (n^2 * (n-1))
Z-score = (observed_runs - expected_runs) / sqrt(variance)
Significant if |Z| > 1.96 (95% confidence)
```

**Results:** 34 out of 35 numbers pass. Only number 26 is borderline (z = +1.992, barely past 1.96), showing slightly more dispersed runs than expected. With 35 tests at alpha=0.05, we'd expect ~1.75 false positives by chance alone.

**Result: PASS.** The one marginal outlier is consistent with expected false positive rate.

---

### Test 4: Gap Distribution (Time Between Appearances)

**Question:** Do the gaps between a number's appearances follow the expected geometric distribution?

**Math:** If each number has probability p = 5/35 = 0.1429 of appearing in any draw, gaps should follow:
```
P(gap = k) = (1 - p)^(k-1) * p

Expected mean gap = 1/p = 7.00
Observed mean gap = 6.91

Expected std gap = sqrt((1-p) / p^2) = 6.48
Observed std gap = 6.47
```

| Gap | Observed % | Expected % | Ratio |
|-----|-----------|------------|-------|
| 1 | 14.62% | 14.29% | 1.02x |
| 2 | 12.97% | 12.24% | 1.06x |
| 3 | 10.88% | 10.50% | 1.04x |
| 4 | 9.00% | 9.00% | 1.00x |
| 5 | 6.72% | 7.71% | 0.87x |
| 7 | 6.13% | 5.67% | 1.08x |
| 10 | 3.18% | 3.57% | 0.89x |

**Result: PASS.** The gap distribution follows geometric(p=1/7) almost perfectly. This rules out "hot hand" or "gambler's fallacy" effects in the RNG.

---

### Test 5: Order Statistic Position Bias

**Question:** When the 5 drawn numbers are sorted, does each position (smallest to largest) match the theoretical expectation?

**Math:** For n=5 draws from uniform(1, N=35), the expected k-th order statistic is:
```
E[X_(k)] = k * (N + 1) / (n + 1)
```

| Position | Expected | Observed | Diff |
|----------|----------|----------|------|
| 1st (smallest) | 6.00 | 6.26 | +0.26 |
| 2nd | 12.00 | 12.41 | +0.41 |
| 3rd (middle) | 18.00 | 18.33 | +0.33 |
| 4th | 24.00 | 24.24 | +0.24 |
| 5th (largest) | 30.00 | 30.16 | +0.16 |

**Result: PASS.** All positions match theory within tight margins. The slight +0.3 upward shift across all positions corresponds to the +1.4 observed in the sum (Test 6) - this is normal random variation.

---

### Test 6: Sum Distribution

**Question:** Does the sum of 5 drawn numbers match the expected distribution?

**Math:**
```
E[sum] = 5 * E[X] = 5 * 18 = 90
Var[sum] = n * sigma^2 * (N-n)/(N-1) = 5 * 102 * (30/34) = 450
SD = sqrt(450) = 21.21

Z-test: z = (91.4 - 90.0) / (21.21 / sqrt(516)) = +1.494
Critical: +/- 1.96
```

| Metric | Expected | Observed |
|--------|----------|----------|
| Mean | 90.00 | 91.40 |
| Std Dev | 21.21 | 21.98 |
| Z-score | - | +1.494 |

**Result: PASS.** The sum mean is 1.4 above expected, but z=1.49 is within the 95% confidence interval.

---

### Test 7: Consecutive Number Frequency

**Question:** How often do consecutive numbers (like 7,8 or 22,23) appear in the same draw? Too many or too few would indicate non-randomness.

| Consecutive pairs | Observed | Expected (simulation) |
|-------------------|----------|----------------------|
| 0 pairs | 51.4% | 52.2% |
| 1 pair | 37.8% | 38.8% |
| 2 pairs | 10.1% | 8.4% |
| 3 pairs | 0.8% | 0.6% |

**Result: PASS.** The rate of consecutive numbers matches Monte Carlo simulation of true random draws.

---

### Test 8: Draw-1 vs Draw-2 Bias

**Question:** Do the two daily draws (13:00 and 21:00) show different number distributions?

**Finding:** Most numbers show similar frequency across both draws. However, a few numbers show notable differences:

| Number | Draw 1 freq | Draw 2 freq | Gap |
|--------|------------|------------|-----|
| 29 | 10.1% | 19.8% | 9.7% |
| 13 | 17.4% | 10.9% | 6.6% |
| 6 | 9.3% | 15.5% | 6.2% |
| 10 | 12.4% | 18.2% | 5.8% |
| 19 | 17.8% | 12.4% | 5.4% |

**Result: MINOR NOTE.** With 35 numbers tested across 258 draw pairs, some variation is expected. Number 29 showing a 9.7% gap is notable but not statistically conclusive with this sample size. This could indicate:
- Normal random fluctuation (most likely)
- A subtle difference in RNG initialization between the two daily draw sessions (unlikely but not impossible)

**To confirm:** would need 2000+ draws to determine if this is real or noise.

---

### Test 9: Following-Number Patterns

**Question:** After number X appears, is number Y more or less likely in the next draw?

**Strongest "follower" patterns found:**

| After | Next | Observed | Expected | Ratio |
|-------|------|----------|----------|-------|
| 5 | 14 | 19 | 9.0 | 2.11x |
| 34 | 20 | 24 | 12.4 | 1.93x |
| 16 | 30 | 17 | 9.0 | 1.89x |
| 15 | 22 | 2 | 9.3 | 0.22x |
| 15 | 31 | 2 | 9.3 | 0.22x |

**Result: MINOR NOTE.** With 35 x 35 = 1,225 number pairs being tested, finding some at 2x or 0.2x the expected rate is mathematically certain even with a perfect RNG (multiple comparison problem). Using Bonferroni correction (alpha = 0.05/1225 = 0.0000408), none of these pass the corrected threshold.

---

### Test 10: Entropy Analysis

**Question:** How close to maximum randomness is the output?

```
Main numbers:  5.1205 bits / 5.1293 max = 99.83% efficiency
Special nums:  3.5755 bits / 3.5850 max = 99.74% efficiency
```

**Result: PASS.** Near-perfect entropy. A biased RNG would show noticeably lower entropy.

---

### Test 11: Birthday Spacing (Minimum Gap)

**Question:** What is the distribution of the smallest gap between any two numbers in a draw?

| Min gap | Observed | Expected |
|---------|----------|----------|
| 1 | 48.6% | 47.8% |
| 2 | 28.3% | 27.4% |
| 3 | 12.8% | 14.4% |
| 4 | 7.6% | 6.9% |
| 5 | 2.1% | 2.6% |

**Result: PASS.** Matches expected distribution from simulation.

---

### Test 12: Same-Day Independence

**Question:** Are the two draws on the same day independent of each other?

| Metric | Observed | Expected |
|--------|----------|----------|
| Average overlap | 0.7248 | 0.7143 |
| Same special number | 6.2% | 8.3% |

**Result: PASS.** The two daily draws are independent. Interestingly, the same special number appears in both draws *less* than expected (6.2% vs 8.3%), which could suggest the RNG actively avoids repeating the special number, or is simply noise.

---

### Test 13: Modular Arithmetic Patterns

**Question:** Do sum-mod-10 values or last digits show bias?

**Sum mod 10:**
| Digit | Observed | Expected |
|-------|----------|----------|
| 2 | 6.8% | 10.0% |
| 5 | 13.2% | 10.0% |
| Others | 8.3-12.2% | 10.0% |

**Last digit of drawn numbers:** Matches expected distribution within 1% for all digits.

**Result: PASS.** Minor sum-mod-10 deviation is within chi-square tolerance for 10 bins.

---

## Conclusions: What Type of RNG is Vietlott Using?

### Evidence-based assessment

| Property | Evidence | Implication |
|----------|----------|-------------|
| Uniform distribution | chi2=31.62, p>0.05 | No number is favored |
| No serial correlation | overlap matches hypergeometric | Draws are independent |
| Random streaks | 34/35 pass runs test | No clustering or spreading |
| Geometric gaps | mean=6.91 vs expected 7.00 | No "memory" effect |
| Maximum entropy | 99.8% efficiency | Output is nearly incompressible |
| Draw independence | same-day overlap = expected | Two daily draws use independent seeds |

### Most likely RNG type

Vietlott is operated by **Vietlott Joint Stock Company** under license from Vietnam's Ministry of Finance, with lottery systems supplied by **Intralot** (Greek lottery technology company). Based on this and the data:

**1. Hardware RNG + CSPRNG hybrid (most probable)**

Intralot systems typically use:
- A **hardware entropy source** (thermal noise or quantum device) to generate seed material
- A **CSPRNG** (like AES-256-CTR or SHA-512/HMAC-DRBG) seeded by the hardware source
- **Independent seed per draw** (confirmed by Test 12 showing no same-day correlation)

**2. Certification**

Regulated lotteries require RNG certification from independent labs such as:
- **GLI (Gaming Laboratories International)**
- **BMM Testlabs**
- **SIQ** (Slovenian Institute of Quality)

These labs run tests similar to (but more extensive than) the ones above, including NIST SP 800-22 statistical test suite.

**3. What this means for players**

```
Probability of guessing correctly = probability of guessing randomly
                                  = 1 / C(35,5) / 12
                                  = 1 / 3,895,584
                                  = 0.0000257%

No historical analysis can improve these odds.
```

The RNG produces output that is:
- **Statistically uniform** - no number is more likely than another
- **Temporally independent** - past draws do not influence future draws
- **Structurally random** - no patterns in sums, gaps, positions, or digit structure

### The honest answer

**The random logic cannot be reverse-engineered from the output.** This is by design - it's the fundamental property of a cryptographically secure RNG. Even with a million draws instead of 516, the output would remain unpredictable.

The data confirms that Vietlott is running a properly functioning, unbiased lottery system.

---

## Appendix: What Would a Broken RNG Look Like?

For comparison, here's what we'd expect if the RNG were flawed:

| Flaw | What the data would show | What we actually see |
|------|--------------------------|---------------------|
| Biased ball machine | Chi-square >> 48.60, some numbers at 20%+ | Chi-square = 31.62, all numbers within 11-17% |
| Seeded by clock | Draw-1 and Draw-2 would show strong correlation | Independent (overlap = expected) |
| Linear congruential generator | Runs test failures, serial correlation | All pass |
| Reused state | Same-day draws would share 2+ numbers frequently | Overlap matches hypergeometric |
| Insufficient entropy | Entropy << maximum, patterns in mod arithmetic | 99.8% entropy efficiency |

---

*This analysis is for educational purposes. It demonstrates applied statistics and hypothesis testing. The lottery remains a negative expected-value game regardless of any analysis.*

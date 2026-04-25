# Research Review

**Subject:** Vietlott number-suggestion engine (`src/vietlott/cli/suggest.py`, `src/machine_learning/strategies/*`, `src/machine_learning/backtest.py`, `src/vietlott/cli/check_rate.py`).

**Artifacts examined:**
- `test/data-24-04.csv` — 24 saved suggestions (4 algorithms × 6 tickets) for `power_535`, generated 2026-04-24.
- 551 historical `power_535` draws (2025-06-29 → 2026-04-25) in `data/power535.jsonl`.
- All four algorithms used for the saved CSV: `mindistance`, `maxentropy`, `absence`, `bayesian`.

---

## Summary Verdict

**Fundamentally broken as a predictive tool, methodologically misleading as a research artifact.** The `power_535` data is statistically indistinguishable from i.i.d. uniform (chi-square p ≈ 0.70 for main numbers, p ≈ 0.81 for special). The theoretical house edge is ≈ 74%. Every algorithm in the engine is operating on a noise channel and providing no expected-value improvement over a uniformly random ticket. The "backtest performance" tables and the readme leaderboard contain accounting and multiple-testing errors that make their comparisons uninterpretable. The polished UX (slash command, "Save to test/", ROI dashboards) actively increases user confidence in conclusions that the math forbids.

This is fixable as research by reframing the work from "prediction" to "diversification + null testing", but the current product trajectory is unsound.

---

## Strengths

- **Code quality and engineering hygiene are high.** Strategies are well-typed, documented, separated; the backtest framework has retry/error handling, parameter introspection, even a `_check_lookback_bias` heuristic. The check-rate evaluator architecture (per-game registry + prize_tables source-of-truth) is clean.
- **Some mathematics is correct.** The Dirichlet-multinomial conjugacy in `bayesian_dirichlet.py` is correctly implemented (the formula and the sampling). The Jaccard-distance diversity objective in `min_distance_diversity.py` is well-defined.
- **One genuine virtue: ticket-set diversification.** `MinDistanceDiversityStrategy` and `MaxEntropyStrategy`, *if framed honestly*, are useful: they construct a portfolio that maximises *coverage* of the number space. They do not increase expected value — but they reduce the variance of "did any of my N tickets match" relative to N independent uniform draws when the prize structure is convex in match count, which it is here. This is a real, mathematically defensible (small) benefit, distinct from prediction.
- **`readme.md` does include a one-line disclaimer** that ROI is deeply negative at scale and that the experiment is educational. Unfortunately, this is contradicted by the leaderboard immediately above it (see Critical Errors).
- **Data crawler and storage are sound.** Deduplication by `id`, sorted by `[date, id]`, JSONL append. Not the subject of this review but worth noting as a stable foundation.

---

## Critical Errors

These errors invalidate the predictive claims and the headline backtest numbers.

### 1. The data exhibits no statistically detectable non-uniformity — every "edge" is fitted to noise

I ran a Pearson chi-square goodness-of-fit on all 551 `power_535` draws:

| Test                              | n     | χ² statistic | df | p-value | Conclusion                         |
| --------------------------------- | ----- | -----------: | -: | ------: | ---------------------------------- |
| Main numbers (1–35), 5/draw       | 2,755 |        29.26 | 34 |   0.699 | Fail to reject H₀: uniform i.i.d.  |
| Special number (1–12), 1/draw     |   551 |         6.86 | 11 |   0.810 | Fail to reject H₀: uniform i.i.d.  |

Observed min/max main-number frequency: 66 / 96. Expected 78.7. Binomial sampling SD per number is √(551·5·(1/35)·(34/35)) ≈ 8.7. The actual SD across the 35 frequencies is 8.11. **The data is, to the limit of the available sample, exactly the uniform-i.i.d. null.** No "hot", "cold", "due", or "Bayesian-posterior" signal exists in this dataset.

This is not an opinion. Anyone who proposes the contrary owes a test that survives multiple-comparison correction across the implicit search space (you tested at least 8 strategies × ~5 hyperparameters each, so any α=0.05 result needs Bonferroni against ≥40 tests, i.e. p<0.00125).

### 2. The readme's "1806% ROI for random play" is a backtest accounting illusion

`src/machine_learning/readme.md` ranks strategies by ROI on 26,440 power_655 tickets (1322 draws × 20 tickets). It reports:

| Strategy            | Net Profit (VND) | ROI |
| ------------------- | ---------------: | --: |
| Random              |    +4,777,150,000 | +1806.79% |
| Long Absence        |     −215,250,000 |  −81.41% |

This is mathematically inconsistent with reality unless one of two things is true: (a) the lottery is grossly biased and `Random` profits by accident, or (b) the math is wrong. (a) is falsified by §1. So (b).

I reproduced the arithmetic. With reported match distribution of 561×3-match, 27×4-match, 1×5-match, and the prize table in `base.py` (3:50,000; 4:500,000; 5:5,000,000,000):

```
gain = 561·50,000 + 27·500,000 + 1·5,000,000,000 = 5,041,550,000 VND
```

Exactly the reported number. **The entire +1806% "profit" is a single 5-match draw paying 5 billion VND.**

The probability of ≥ 1 such hit in 26,440 random tickets is:
```
P(5-match per ticket) = C(6,5)·C(49,1) / C(55,6) = 1.014e-5
P(≥1 in 26,440 tickets) = 1 − (1 − 1.014e-5)^26440 ≈ 0.235
```

So under truly random play this 1806% headline appears with probability ≈ 23.5% — purely from variance. The 1.5e-billion-percent gap between the "Random" and "Long Absence" rows in the leaderboard is not a comparison of strategies; it is a comparison of "did this random run happen to hit a 5-match? yes vs. no". It carries zero information about strategy quality, and the entire ranking of 8 strategies is on the same footing.

This single bug renders the readme's ranking table evidence-free. **It needs to be removed or replaced with a Monte-Carlo null distribution showing where each strategy falls in the random-play distribution.**

### 3. The `LongAbsenceStrategy` ("absence") is a textbook gambler's fallacy

`strategies/long_absence.py` ranks numbers by days-since-last-appearance and samples from the top-N. The implicit claim is that "overdue" numbers are more likely to appear next. For independent draws this is exactly the gambler's fallacy.

**Refutation:**
Let $X_t \in \{1,…,35\}$ be a draw (treat each ball position as an independent Bernoulli for tractability). Under i.i.d. uniformity, $P(\text{number } v \text{ appears at draw } t \mid \text{history}) = P(\text{number } v \text{ appears at draw } t)$ — by definition of independence. The conditioning set "v has been absent for k days" carries zero information for the Bernoulli generating $X_t$. The waiting time between appearances is geometric; the *memoryless* property of the geometric distribution is precisely the formal statement that "due" is incoherent.

**Quantitative consequence:**
Picking from the top-10 longest-absent numbers does not raise the per-number hit probability above 5/35 = 0.1429. It does *re-shape the distribution of total matches per ticket*, but the mean stays exactly the same, and the variance increases (because you concentrated mass on a 10-element subset while the truth is uniform on 35). Higher variance with the same mean and a convex-in-matches prize structure can in principle improve win probability for jackpot tiers — but the readme shows the *opposite* effect (Long Absence is the worst performer at −81%), because variance also makes you more likely to produce *zero*-match tickets. There is no scenario under i.i.d. uniformity where this strategy outperforms uniform sampling in expectation.

### 4. The `BayesianDirichletStrategy` ("bayesian") posterior is centred at uniform — its sampling produces noise, not signal

`strategies/bayesian_dirichlet.py` builds a Dirichlet posterior $\theta \mid c \sim \text{Dir}(\alpha_0 + c_1, …, \alpha_0 + c_V)$ where $c_i$ are 365-day counts and $\alpha_0 = 1$ by default. With V=35 and a typical $\sum c_i \approx 365 \cdot 5 = 1825$ (drawing 5 main per draw of about 1 draw/day if data were dense — adjust for actual cadence; doesn't change the argument):

- **Posterior mean:** $\hat\theta_i = \frac{\alpha_0 + c_i}{V\alpha_0 + \sum c_j} = \frac{1 + c_i}{35 + 1825} \approx \frac{1+c_i}{1860}$.
- Under i.i.d. uniformity, $E[c_i] = 1825/35 = 52.14$, so $E[\hat\theta_i] = (1+52.14)/1860 ≈ 0.02857 = 1/35$.
- **The posterior mean equals the uniform prior.** Sampling $\theta \sim$ posterior gives draws scattered around 1/35 with concentration $\sum\alpha = 1860$, i.e. SD per coordinate of approximately $\sqrt{(1/35)(34/35)/1861} ≈ 0.0040$ — about 14% of the mean.

This means the strategy systematically picks numbers based on a noise vector whose magnitude is a few percent of the mean and which carries **no** posterior shift away from uniform. **The Bayesian framing is a fig leaf — the model is doing rejection sampling around uniform with extra steps.** The "evidence" $c_i$ would only shift $\hat\theta$ meaningfully away from uniform if non-uniformity were genuinely present, which §1 rules out.

There is also a coding subtlety: the temperature transform `alpha = (alpha - 1)/temperature + 1` is applied *after* Bayesian update, which is non-standard (temperature is normally a likelihood-side construct in softmax-style models, not a Dirichlet hyperparameter). With temperature < 1 this can drive `alpha` toward (clamped) 0.01, producing extreme samples — i.e. a sharpening that has no Bayesian justification and just increases sampling variance. Worth fixing or removing.

### 5. The `suggest.py` in-flight backtest credits only the best ticket per draw while charging cost for all

`backtest_tickets()` (suggest.py:281–352):
```
for rec in test_records:
    ...
    for i, tk in enumerate(tickets):
        m = len(set(tk["main"]) & draw_main)
        ...
        if m > best_main or (m == best_main and sp_match and not best_sp):
            best_main = m
            best_sp = sp_match
            ...
    rule = resolve_power_535(best_main, best_sp) ...
    if prize_name:
        prize_counter[prize_name] += 1
        total_winnings += prize_amt
total_cost = n_draws * n_tickets * 10_000
```

Only one prize (the highest-tier match) is credited per draw, but cost is `n_draws × n_tickets × 10_000`. In real play, every winning ticket pays. With the Power 5/35 "Encourage" tier (10,000 VND for 0–2 main + special) covering a *large* fraction of tickets, this systematically *under*-reports winnings. A small additional concern: when two tickets tie on main match but only one has special, the ordering rule keeps the first seen — fine, but documented nowhere.

This is the *opposite* asymmetry of error #2 (the readme over-reports winnings by counting one massive variance hit, the suggest.py engine under-reports by collapsing per-draw wins to one). Both are wrong.

**Correct accounting:** Sum prize across all tickets each draw, just like real play. The check-rate `Power535Evaluator` (in `evaluators/power535.py`) actually does this correctly — it iterates `for ticket, nums in parsed:` inside the draw loop and accumulates each prize. So the codebase has *both* a correct and an incorrect implementation. The user-facing CLI is using the incorrect one.

### 6. `Stats` is built once on the full dataset, then "backtested" against a tail of the same dataset

In `suggest.py`:
```
stats = Stats(df, main_size, num_min, num_max, sp_max)   # uses ALL draws
ticket_list = generate_tickets(stats, tickets, seed=seed)
bt = backtest_tickets(stats, ticket_list, min(backtest_draws, len(stats.records)))
```

The Stats object's `freq_30`, `freq_14`, `days_since`, `sum_mean/std`, special stats are computed over the entire dataframe — *including the very draws that get scored in the backtest*. Tickets generated using these stats have peeked at the future; "backtest" then asks how those peek-informed tickets did against the same draws.

This is data leakage. It is not catastrophic (the leakage is small relative to the i.i.d. noise floor), but it is theoretically incoherent. A proper backtest must, for each evaluation draw, recompute statistics using only data strictly before that draw — which is what `LongAbsenceStrategy._days_since_last_appearance(target_date)` actually does correctly (note the `< target_date` filter). The CLI evades that pattern by collapsing everything into a single Stats snapshot.

---

## Paradoxes & Fallacies Identified

### Gambler's Fallacy (long_absence, also embedded in `Stats.scores`)
**Evidence:** `LongAbsenceStrategy.predict()` ranks `sorted_by_absence` and samples `top_n`. `suggest.py::Stats` adds `0.20 * days_since[v]/mds` to the composite score.

**Refutation:** Independence ⇒ the conditional distribution given history equals the marginal. Geometric waiting time is memoryless: $P(T = k+m \mid T > k) = P(T = m)$. "Due" is not a property of independent processes.

### Reverse Gambler's Fallacy / Hot-Hand Fallacy (frequency hot, exponential_decay, pair_frequency, and the 0.30 + 0.25 + 0.15 frequency weights in `Stats.scores`)
**Evidence:** Composite score = 0.30·freq_30 + 0.25·freq_14 + 0.15·freq_all, all upweighting recent frequency.

**Refutation:** Same argument inverted. If the lottery is i.i.d. uniform, recent frequency $c_i$ has $E[c_i] = N/V$ and $\text{Var}(c_i) = N\cdot(1/V)(1-1/V)$ — pure sampling noise. Past frequency carries no information about future probability. (A deeper subtlety: even if the lottery had a *fixed* bias toward number $v$, the frequency strategy would help — but §1's chi-square shows that bias is below the detection threshold, and the bias would have to be persistent over time for it to be exploitable.)

### Texas Sharpshooter (the strategy comparison readme + check_rate.py grouping)
**Evidence:** 8 strategies, ranked by ROI, no FWER correction. The "winner" is whichever happened to lottery-hit a high-tier prize during the backtest window.

**Refutation:** With K independent strategies tested at α = 0.05:
- K=4 (the absence/bayesian/maxentropy/mindistance set in `data-24-04.csv`): FWER = 1 − 0.95⁴ ≈ 18.5%.
- K=8 (the readme): FWER = 1 − 0.95⁸ ≈ 33.7%.

But K is actually larger because each strategy has hyperparameters that were chosen (lookback_days ∈ {30, 90, 180, 365}, top_n, prior_strength, temperature, half_life, selection_weight, …). A reasonable estimate of the implicit search space is K ≈ 50, giving FWER ≈ 92%. **Any "winning" strategy at α=0.05 unadjusted is essentially guaranteed to be the best by chance, not by edge.**

### Multiple Comparisons / Look-Elsewhere Effect
Same as above — repeated, because this is the dominant statistical sin in the project.

### Survivorship Bias
**Evidence:** The strategy list is itself a curated set; strategies that performed badly during development are not visible. The published comparison is conditioned on "strategies that survived to publication."

### Reification of Statistical Artifacts
**Evidence:** `MaxEntropyStrategy` divides 1–35 into 5 bands and samples one per band. Its name suggests an information-theoretic guarantee. There is none on the *prediction* side; it just enforces structural diversity. The naming reifies a sampling constraint as an algorithmic property of the data.

### Goodhart's Law (latent)
**Evidence:** Once "ROI on backtest" is a leaderboard target, any strategy will be tuned (consciously or otherwise) to maximize it on the historical window — not to actually predict.

### Conjunction-Adjacent Reasoning
**Evidence:** The composite score in `suggest.py::Stats` is `0.30·freq_30 + 0.25·freq_14 + 0.20·days_since + 0.15·freq_all`, summing to 0.90 (note: not normalized). The weights are unjustified, the components are correlated, and the sum-to-0.90 with a separate "+0.10 implicit zero" is suspicious. This reads as a hand-tuned recipe presented as if it were a principled posterior. Whatever its empirical merit, it is *not* a Bayesian or information-theoretic quantity.

### Berkson's Paradox / Selection Bias (potential, in check_rate UX)
**Evidence:** A user "saves" tickets they like. They then evaluate. The selection of which tickets to save is itself non-random. A formal evaluation needs to fix an evaluation protocol *before* the saved tickets are scored against draws.

---

## Methodological Concerns

These weaken but do not single-handedly invalidate the work; fix them and the engine becomes a more honest research tool.

1. **No reproducibility specification.** The default seed in `suggest.py` is `int(datetime.now().timestamp())` — i.e. fresh every run. Users cannot reproduce a saved CSV. The CSV itself does not record the seed. Add `seed` (and library versions) as required CSV columns.

2. **No baseline comparison, ever.** Every strategy's backtest needs to be reported alongside (a) a uniform-random baseline run with the *same* seed-class and ticket count, and (b) a Monte-Carlo simulated null distribution of the same metric. Without this, individual ROI numbers are unreadable.

3. **No effect-size or confidence intervals.** The match-distribution table gives counts but no uncertainty. With ~50 backtest draws (the suggest.py default), almost any difference between strategies is within ±2σ of zero.

4. **`check_rate.py` does not adjust for multiple algorithm groups.** It iterates `(game × algorithm)` groups and prints a table per group. No aggregate p-value, no corrected comparison.

5. **`backtest.py::_calculate_sharpe_ratio` is conceptually wrong for lottery.** Sharpe assumes a continuously-distributed return series with finite second moment; the lottery profit series is dominated by sub-cent per-ticket EV punctuated by jackpot-scale spikes, so the empirical mean and SD are extremely heavy-tailed and Sharpe is ill-defined (in finite samples it is dominated by whether or not a single jackpot hit occurred). Annualizing by `√52` is also unjustified for a lottery with an effective draw cadence the code does not actually inspect. **Remove Sharpe from the metrics; replace with median match count and the MC-null percentile of the win count.**

6. **The `_check_lookback_bias` heuristic is checking the wrong thing.** It looks for attribute names like `predict_future` or `future_data`. The actual look-ahead bias in this codebase is structural (Stats built on full dataframe in `suggest.py`) — the heuristic does not see it.

7. **Ensemble strategy not reviewed in depth, but flagged.** `strategies/ensemble.py` likely combines other strategies. If it does so by weighting on backtest performance, it is in-sample-optimized and should be tested out-of-sample.

8. **`detect_game_shape` infers `sp_max` from the maximum special drawn.** If the special range is 1–12 but the latest 551 draws happen to top out at 11, the engine will underestimate sp_max and never select 12. Real harm small, but indicative of using data to infer *structure* when structure should come from the prize-table source-of-truth.

---

## Statistical / Mathematical Issues

1. **Independence of "main" balls is not tested.** I tested marginal frequencies. The chi-square cannot detect *pair* dependencies (e.g. "if 7 is drawn, 14 is more likely"). A proper test would compute observed vs. expected pair counts on the C(35,2) = 595 pairs. With 551 draws × C(5,2) = 5510 observed pair-occurrences, expected per pair is 5510/595 ≈ 9.26 — borderline for individual-cell chi-square, fine in aggregate. **Recommend adding this test.** I would predict it also fails to reject. But until tested, claims about pair-frequency strategies (`PairFrequencyStrategy`) are doubly unfounded.

2. **Power analysis is absent.** With 551 draws, what minimum effect size could be detected? For a single-number-bias of ε in the per-draw probability (5/35 + ε), the test has α=0.05 power ≥ 0.8 to detect approximately ε ≈ 0.012 (i.e., a 8% relative bias on a single number). Anything smaller is invisible at this n. So the *honest* statement is "no detectable single-number bias greater than ~8% of uniform probability". The strategies are looking for biases far below that floor.

3. **Special-number conditional independence not tested.** The data structure is `[m1,m2,m3,m4,m5,sp]`. Whether sp is independent of the m's (which one would expect from a separate ball machine) should be tested with a Cramer's V or mutual-information measure on the joint table. Quick eyeball confirms no obvious dependence, but it should be reported.

4. **The Dirichlet temperature transform is mathematically odd.** `alpha = (alpha - 1)/temperature + 1` is a linear shrinkage of $\alpha-1$ around 0; calling it "temperature" suggests softmax-style flattening but the relationship between Dirichlet concentration and predictive entropy is non-trivial and not a simple temperature scaling. This needs either a derivation or removal.

5. **`roi` formula:** `(total_winnings - total_cost) / total_cost * 100` is fine arithmetically but its interpretation in a *winner-takes-all* setting (one jackpot dominates) is wildly misleading. Report median ROI across many simulated runs, not the single observed ROI.

6. **`max_entropy.py` is misnamed.** Maximum entropy on a discrete uniform support is the *uniform* distribution. Stratified sampling is *not* maxent; it is a form of variance reduction by ensuring band coverage. The current implementation is fine as a diversification heuristic but should be renamed `StratifiedSamplingStrategy` to avoid suggesting a probabilistic guarantee it does not deliver.

7. **`LongAbsenceStrategy` uses Python's `random.sample` after the cache** — but `random` is shared global state; if two strategies are run interleaved without seeding, results are non-deterministic. Use a strategy-local `random.Random(seed)` instance.

---

## Benefit & Impact Assessment

### Genuine value
- **Educational, if framed as a counterfactual.** The codebase is an excellent vehicle for teaching: build something that "looks like prediction", run a chi-square that demolishes the premise, then walk through how every strategy's apparent edge collapses under a Monte-Carlo null. That is a high-quality outcome.
- **Diversification, when honestly scoped.** `MinDistanceDiversityStrategy` and `MaxEntropyStrategy` (renamed) can be useful if the user *will* play anyway — they reduce the variance of "did at least one of my N tickets hit any prize", at zero expected-value cost. This is a tiny benefit, but real, and orthogonal to prediction.

### Risk of harm
- **Treating this tool as predictive will cost the user money on average.** Per ticket EV is 2,594 VND vs. 10,000 VND cost. Every 100 tickets played costs an expected 740,000 VND. The polished UX makes this loss feel like progress.
- **The "Save to test/" button + tracking workflow is a gambling-engagement loop in everything but name.** Generate → save → wait for draw → score → repeat. This is the same dopamine cycle that licensed gambling operators design around. The "research" framing is not a legal or moral shield.
- **Misleading framing in published artifacts.** The readme's leaderboard puts random + 1806% next to long-absence − 81% with no caveat that the difference is one variance hit. Anyone forwarding that table to a friend has just spread misinformation.
- **Vulnerable populations.** Lottery players are already over-represented in lower-income demographics. A free, polished, Vietnamese-language tool that "predicts" Vietlott numbers reaches exactly the audience least equipped to evaluate the methodology.

### Cost-benefit
- Engineering effort sunk into the strategy zoo: substantial. Marginal predictive insight produced: zero (by §1).
- Rebudgeting that effort into (a) a single honest "uniform-i.i.d." baseline tool, (b) a Monte-Carlo null visualizer, (c) a per-ticket EV display in the UI, would yield far more research value and approximately zero gambling-risk uplift.

### Ethical recommendations
1. **Remove the ROI leaderboard from `machine_learning/readme.md`.** Replace it with a Monte-Carlo null density of "winnings on N tickets over M draws" and overlay each strategy as a vertical line. The eye-bend will tell the truth.
2. **Add a mandatory pre-action notice to the "Save to test/" button**: "These suggestions have an expected return of −74%. Saving them does not improve your odds." In Vietnamese, prominently.
3. **Add per-ticket EV to every output.** `2,594 VND expected return on 10,000 VND ticket` should appear next to every suggestion.
4. **Reframe the project README from prediction to randomness pedagogy.** "Vietlott data + tools to demonstrate that lottery outcomes are unpredictable."
5. **Strip `LongAbsenceStrategy`, `FrequencyStrategy(hot|cold)`, `ExponentialDecayStrategy`** from the suggestion paths. Keep them only inside an explicit `gamblers_fallacy_demos/` package with refutation comments at the top.

---

## Recommendations (Prioritized)

| # | Priority   | Action                                                                                                      | Reason                                  |
| - | ---------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1 | **MUST**   | Replace the readme ROI leaderboard with a Monte-Carlo null density.                                         | The current table is misinformation.    |
| 2 | **MUST**   | Add −74% house-edge / −EV warnings to the suggest CLI output and to the "Save to test/" UI.                 | User-protection.                        |
| 3 | **MUST**   | Fix `suggest.py::backtest_tickets` to credit *all* winning tickets per draw, not just the best.             | Correctness.                            |
| 4 | **MUST**   | Make `Stats` recompute strictly per-evaluation-date during any backtest. Eliminate the single-Stats leakage.| Look-ahead bias.                        |
| 5 | **HIGH**   | Add a Monte-Carlo null comparison to every backtest output: percentile of observed metric vs. simulated null.| Without this, no result is interpretable.|
| 6 | **HIGH**   | Add Bonferroni / BH correction to the K-strategy comparison table in `check_rate.py`.                       | Family-wise error rate.                 |
| 7 | **HIGH**   | Record and emit `seed` in every saved CSV row.                                                              | Reproducibility.                        |
| 8 | **HIGH**   | Drop `Sharpe ratio` from `BacktestResult` or replace with non-parametric percentile metrics.                | Heavy-tailed return; Sharpe is wrong.   |
| 9 | **MEDIUM** | Test pair-frequency independence in the data; report the result.                                            | Closes the door on pair_frequency edge. |
| 10| **MEDIUM** | Rename `MaxEntropyStrategy` → `StratifiedSamplingStrategy`. Document that it is variance reduction, not prediction. | Honest naming.                          |
| 11| **MEDIUM** | Remove the `temperature` transform from `BayesianDirichletStrategy` or derive it formally.                  | Mathematical hygiene.                   |
| 12| **LOW**    | Move `LongAbsenceStrategy` and `FrequencyStrategy` to a `demos/gamblers_fallacy/` namespace with a refutation in the docstring. | Prevent future re-export as suggestions.|
| 13| **LOW**    | Use strategy-local `random.Random(seed)` instances throughout, not the global `random`.                     | Determinism.                            |

---

## Confidence Level

**High confidence** in:
- The chi-square i.i.d. result on `power_535` (computed directly from `data/power535.jsonl`, 551 draws, p ≈ 0.70 main, p ≈ 0.81 special).
- The −74% theoretical house edge (closed-form EV calculation against `prize_tables.py`).
- The reproduction of the readme's "1806% Random ROI" as a single-jackpot variance event with ~23.5% baseline probability of occurring.
- The backtest accounting bug in `suggest.py::backtest_tickets` (read in source, traced).
- The data leakage in the single-snapshot `Stats` (read in source, traced).
- The mathematical refutation of gambler's fallacy and posterior-converges-to-uniform under i.i.d. (textbook).

**Medium confidence** in:
- The exact magnitude of the FWER inflation across the implicit hyperparameter grid (the K=50 estimate is order-of-magnitude, not exact).
- The empirical claim that `MinDistanceDiversityStrategy` actually reduces variance for the convex prize structure (true under reasonable assumptions, not formally verified for the exact `power_535` prize table here).

**What would change my assessment:**
- A pre-registered, walk-forward backtest where every strategy is compared to a Monte-Carlo null of equal n on shuffled-history data, with corrected FWER, that still produces ROI > random's null distribution at p < 0.001 after K-correction. I would update significantly. Until then, my prior is that no edge exists and every appearance of one is a methodological artifact.
- A mechanical / physical study of the actual Vietlott draw machine showing a calibration problem. Until then, the data evidence is consistent with i.i.d. uniform.
- Reproducibility evidence: re-running the readme's backtest with a different RNG seed and obtaining a similar ranking would shift my assessment toward "there is some signal." I predict the ranking would be unrecognizable.

---

*Reviewer's note to the user:* the code in this repo is good; the science is not. The most valuable thing this project can do for human life is to be honest about the math and to channel its excellent UX into showing users that the lottery cannot be beaten. That is itself a publishable, useful result.

# Vietlott Research — Project Closure Report

**Date**: 2026-04-22
**Status**: Research closed. Active breakthrough attempts exhausted at current data horizon.
**Scope**: 17 cycles, ~66 strategies, 5 products, 3-gate evaluation protocol.
**Verdict**: **0 scientifically robust Accept / 0 Suggestive**. Cumulative evidence consistent with null hypothesis "RNG functionally random at exploitable scale."

> This is the terminal artifact of a ~9-month research program (07/2025 → 04/2026) to find predictive edges in Vietnamese lottery. No edge was found. This document consolidates what was tested, what was learned, and under what conditions future research should reopen.

---

## 1. TL;DR

- **What we did**: Systematic testing of probabilistic, adaptive, discriminative, portfolio, and regime-detection strategies on 5 Vietlott products, with pre-registration and 3-gate statistical validation (full-sample + split-half replication + forward validation).
- **What we found**: Every strategy either fails to beat Random baseline, fails to replicate across data splits, or fails forward validation. No paradigm (Bayesian, copula, GBM, Kelly portfolio, online learning, cross-product pooling, HMM regime) produced a robust edge.
- **Root cause**: Vietlott RNG appears **functionally random at the scale detectable with current data** (~540-2000 draws per product). Real but small bias (±11% digit-level) exists yet doesn't translate to exploitable win-rate or ROI edge after 3-gate validation.
- **Structural blockers**: (1) Set-coverage geometry of lottery prizes (diversity ≥ concentration), (2) Data horizon 30-50× underpowered vs gold standard detection, (3) Black-box RNG (no Vietlott audit access).
- **Recommendation**: Stop active breakthrough research. Ship existing data + UI + methodology documentation. Reopen criteria in §9.

---

## 2. Project context

### 2.1 Scope
Vietlott-data Python project + Next.js website to crawl, analyze, and suggest lottery numbers for 5 Vietnamese lottery products:
- **Matrix** (choose-k from N): Power 6/55, Mega 6/45, Lotto 5/35
- **3D** (exact 3-digit match): Max 3D, Max 3D Pro

### 2.2 Original goals (Chu kỳ 1, 07/2025)
1. Maximize average matches vs random baseline (avg_matches)
2. Increase win rate for prize tiers (win_rate_ge3 for matrix, exact_match_rate for 3D)
3. Diversify recommended number sets (Jaccard > 0.7)
4. Ship client-side TypeScript port (no server required)

### 2.3 Mode evolution
- **Cycles 1-9** (07/2025 – 04/2026): *Discovery mode* — exhaustive strategy search with growing statistical rigor.
- **Chu kỳ 10** (04/2026): *Pivot to Breakthrough mode* — after 25+ strategies and 3/3 Suggestive candidates failing split-half replication, shift from "find bias" to "find mechanism strong enough to beat forward validation."
- **Chu kỳ 10-16** (04/2026): Breakthrough attempts across 7 novel paradigms.
- **Chu kỳ 17** (04/2026-22): Last breakthrough attempt (HMM regime detection) before closure decision.
- **Chu kỳ 18** (this document): Closure.

### 2.4 What "closure" means
Closure ≠ project deletion. It means:
- Stop active mechanism-search cycles.
- Maintain data crawler + website (operational utility for users).
- Document null findings + methodology corpus for replication/reopening.
- Keep Optimization mode (ranking existing strategies by ROI) as optional follow-up (Chu kỳ 19 if resumed).

---

## 3. Research timeline (17 cycles)

Chronological summary. Per-cycle detail: `history/cycleNN_<slug>.md`.

### Era 1: Discovery (Chu kỳ 1-9, 07/2025 – 04/2026)

| # | Mechanism | Product scope | Verdict | Key finding |
|:-:|---|---|:-:|---|
| 1 | 10 baseline algorithms (Freq, Pattern, ExpDecay, etc.) | Matrix | — | Infrastructure bootstrap |
| 2 | Research-backed (Bayesian, MaxEntropy, Adaptive, MinDistance) | Matrix + 3D prep | — | Bayesian #1 Power 6/55 (pre-replication claim) |
| 3 | Per-product consolidation + recommendations | Matrix | — | Strategy catalog consolidation |
| 4 | 3D deep analysis (13-test RNG battery) | Max 3D / 3D Pro | ✓ Bias detected | Digit 6 +11%, positions dependent (p<0.001). **Bias real but magnitude insufficient for single-ticket exploitation.** |
| 5 | Lotto 5/35 parity wheeling (T11 odd-count) | Lotto 5/35 | ✗ Reject | p=0.0012 bias real; single-ticket algebraically null; multi-ticket p=0.301 after sample-size correction |
| 6 | Significance test enforcement project-wide | All | — | Two-proportion z-test wired; 3 near-miss candidates identified |
| 7 | 3D split-half replication | Max 3D / 3D Pro | ✗ 2/2 Reject | Direction flip both candidates; **Principle #11 codified** |
| 8 | Drift verification (temporal chi²) | Max 3D / 3D Pro | ✓ No drift | Bias stable across time windows; **drift hypothesis falsified on 3D** |
| 9 | Mega 6/45 ExpDecay_Cold replication | Mega 6/45 | ✗ Reject | Direction flip half1 (−0.26pp) → half2 (+0.37pp); pooling artifact; **Principle #12 codified** |

**Era 1 conclusion**: Discovery exhausted. 25+ strategies, 3 Suggestive candidates (Bayesian Power, EVMax Max 3D Pro, ExpDecay_Cold Mega 6/45) all failed split-half replication. Pivot mandatory.

### Era 2: Breakthrough (Chu kỳ 10-16, 04/2026)

| # | Mechanism | Product scope | Verdict | Key finding |
|:-:|---|---|:-:|---|
| 10 | **PIVOT — Breakthrough mode** | All | — | Tournament weights 0.40/0.30/0.15/0.15 (win-rate primary); §9 Forward validation gate codified |
| 11 | Copula joint digit (Path A) | Max 3D / 3D Pro | ✗ 3/4 R + 1/4 Inc | Gaussian + Empirical copula undershoots heuristic JointDigitBias; **Principle #13 forward gate 1st validation** |
| 12 | GBM classifier (Path E) | Max 3D / 3D Pro | ✗ Flagged | Full-sample +3pp (7× bias ceiling); forward flip + concentration collapse; **Principles #14/#15 codified** |
| 12.5 | GBM audit (diagnostic) | Max 3D Pro | ✓ Audit | Confirms overfit (67/600 unique preds); deprecated to Reject |
| 13 | Cross-product pool (Path B) | 3D | ✗ 4/4 Reject | Pooling HURTS Max 3D Pro (Δ=−0.677pp p=0.046); **3D research line CLOSED** (28 strategies 0 Accept) |
| 14 | Online Bayesian Kalman (Path #1) | Mega 6/45 / Lotto 5/35 | ✗ 6/6 Reject | λ=0.01 ≈ batch Bayesian; drift hypothesis falsified on matrix; **adaptive family eliminated** |
| 15 | Cross-product joint matrix (Path #3) | Power 6/55 / Mega 6/45 / Lotto 5/35 | ✗ 5/6 R + 1/6 Inc | Shared-RNG hypothesis falsified matrix; **win-rate axis exhausted** |
| 16 | Kelly-optimal portfolio (Path #2 ROI-axis) | Power 6/55 / Mega 6/45 / Lotto 5/35 | ✗ 9/9 Reject Δ −3.57 to −28.05pp | Kelly concentration ⊥ set-coverage lottery; **both axes exhausted** |

**Era 2 conclusion**: Mechanism space for breakthrough largely exhausted. 35 strategies across 7 paradigms. 0 Accept. Meta-review post-Chu kỳ 16 proposed Kịch bản 2 ("1-shot mới + closure").

### Era 3: Final attempt + closure (Chu kỳ 17-18, 04/2026)

| # | Mechanism | Product scope | Verdict | Key finding |
|:-:|---|---|:-:|---|
| 17 | HMM Regime Detection (Hướng C) | Max 3D / 3D Pro / Power 6/55 | ✗ 6/6 Reject | 4/6 Principle #15 collapse (single-state degenerate); 2/6 pass concentration fail split-half + forward; **Principle #16 Retry Tree codified** |
| 18 | **Closure report** (this document) | All | — | Consolidate + publish |

---

## 4. Strategies tested (categorized)

~66 total distinct configurations across 5 products × 3-gate protocol.

### 4.1 Matrix strategies (Power 6/55, Mega 6/45, Lotto 5/35)

| Family | Variants tested | Representative verdict |
|---|---|---|
| Frequency-based | Hot, Cold, ExpDecay, PairFreq | Best single-metric but fail replication |
| Pattern | Rolling pattern, Ensemble patterns | Marginal edges, all fail 3-gate |
| Bayesian | Dirichlet batch (lookback 180/365, T∈{0.5,1.0}), MaxEntropy | Chu kỳ 2 #1 Power 6/55 unreplicated |
| Adaptive | Sliding window, drift-tracking | Chu kỳ 9/14 all reject (drift falsified) |
| Online Bayesian | Kalman-style forgetting (λ∈{0.01,0.03,0.10}) | Chu kỳ 14: 6/6 reject |
| Multi-ticket wheeling | MinDistance, HybridParity, GreedyCover, PatternN | Chu kỳ 5 reject, Chu kỳ 16 Kelly reject |
| Cross-product | Pooled Bayesian, Joint matrix | Chu kỳ 13/15: shared-RNG falsified |
| Portfolio | Kelly top-M, risk-parity | Chu kỳ 16: 9/9 reject Δ up to −28pp |
| HMM regime | K=2 Gaussian (W=20, W=40) | Chu kỳ 17: 6/6 reject |

### 4.2 3D strategies (Max 3D, Max 3D Pro)

28 strategies across 5 mechanism paradigms. All Reject. See [3D_FINAL_REPORT.md](3d/3D_FINAL_REPORT.md).

| Paradigm | Representative strategies | Verdict |
|---|---|---|
| Frequency | FreqWholeHot, FreqDigitHot | Reject (2/2 Chu kỳ 7) |
| Joint-digit | JointDigitBias, ConditionalChain, DigitPairExploiter | Reject (Chu kỳ 4-7) |
| Copula | Gaussian, Empirical, Laplace | Reject 3/4 + 1/4 Inc (Chu kỳ 11) |
| Discriminative ML | GBM classifier (HistGradientBoosting) | Reject (Chu kỳ 12, overfit confirmed 12.5) |
| Cross-product pool | Pooled digit bias (3D + Pro) | Reject 4/4 (Chu kỳ 13) |
| Regime detection | HMM K=2 W∈{20,40} | Reject 4/4 (Chu kỳ 17, 3D subset) |

### 4.3 Strategy families eliminated (DO NOT revisit at current data horizon)

Binding eliminations based on convergent evidence ≥2 cycles:

1. **Adaptive / drift-based** — Chu kỳ 8 (3D no drift) + Chu kỳ 14 (matrix no drift) + Chu kỳ 17 (HMM no regime). No evidence of temporal bias instability detectable with current data.
2. **Cross-product pooling** — Chu kỳ 13 (3D 4/4 reject) + Chu kỳ 15 (matrix 5/6 reject + 1 Inc). Shared-RNG hypothesis falsified for both 3D and matrix.
3. **Kelly-style concentration multi-ticket** — Chu kỳ 16 9/9 reject with dramatic negative Δ (−3.57 to −28.05pp). Set-coverage geometry favors diversity (Random) over concentration.
4. **GBM discriminative ML at current feature dimensionality** — Chu kỳ 12/12.5 confirmed overfit regardless of p-value. Requires either richer features or paradigm-level change (e.g., LLM-based reasoning, not yet viable for lottery scope).
5. **Regime detection via 2-state Gaussian HMM** — Chu kỳ 17 6/6 reject. Observation features don't separate into discrete clusters; EM collapses or labels don't replicate.

---

## 5. Methodology corpus (Principles #11 – #16)

Principles codified during cycles 7-17 as negative-result learnings. Binding for any future cycle.

### Principle #11 — Split-half replication mandatory (origin Chu kỳ 7, 9)
Any strategy upgraded to Suggestive or Accept must survive a time-ordered midpoint split: train/evaluate on half-1, then half-2. Both halves must show directionally positive Δ with p<0.05 (raw, non-Bonferroni for split gate). Direction-flip in any half triggers instant Reject.

**Empirical validation**: Chu kỳ 7 (EVMax + FreqWholeHot direction flip) → Chu kỳ 9 (ExpDecay_Cold h1 −0.26 h2 +0.37) → Chu kỳ 12 (GBM Max 3D Pro) → Chu kỳ 14 (Online Bayes λ=0.03 Lotto) → Chu kỳ 17 (HMM Max 3D W=20 half1 degenerate). 5+ independent confirmations.

### Principle #12 — Variable-baseline power analysis pre-cycle (origin Chu kỳ 8, 9)
Before running backtests, compute required n_trials for desired effect size at 80% power given observed bias ceiling. Acceptable cycles may run underpowered but must disclose power explicitly. Prevents "no-pass" being misinterpreted as falsifying when it's just insufficient sample.

**Empirical state**: most cycles ran at ~30% full-sample power and ~5% forward-gate power. Accepted as project baseline; explicit disclosure in each cycle.

### Principle #13 — Forward gate mandatory (origin Chu kỳ 7, 9, 11, 12, 13, 14)
A third gate beyond full-sample + split-half: walk-forward prediction on last-100 draws must have directionally positive Δ vs Random. p<0.05 bonus not required (relaxed given low power on n=100 trials × 5 runs = 500). Directional fail triggers Reject regardless of other gates.

**Empirical validation**: 6+ cycles. Most gates eliminated here (forward flip).

### Principle #14 — Magnitude sanity check (origin Chu kỳ 12, 12.5)
Define per-product bias ceiling. Auto-flag as Ship-with-caveats pending audit if |Δ_full| > 3 × ceiling. Applies regardless of p-value or split-half pass.

- 3D ceiling: +0.4pp exact-match-rate (3× ceiling flag threshold = 1.2pp)
- Matrix ceiling: +0.3pp win_rate_ge3 (3× ceiling flag = 0.9pp)

**Empirical validation**: Chu kỳ 12 GBM +3pp (7× ceiling) flagged → 12.5 audit confirmed overfit, downgraded to Reject. Prevents false "ship" on implausibly large effects.

### Principle #15 — Prediction concentration check (origin Chu kỳ 12.5)
For ML / discriminative strategies: `n_unique_predictions / total_predictions ≥ 0.30` over forward window. Top-5 concentration < 30%. Violation → auto-Reject.

**Empirical validation**: Chu kỳ 12.5 GBM Max 3D Pro 67/600 unique → Reject. Chu kỳ 17 HMM 4/6 configs single-state degenerate → Reject. Catches "model collapses to few favorites" failure mode that p-values miss.

### Principle #16 — Retry Tree + Optionality Preservation (origin Chu kỳ 17, 2026-04-22)
Every pre-reg must document 2 tiers of alternatives:
- **Tier 1 — Cycle-level** alternatives (paradigm swap on reject): link to META_REVIEW or equivalent cycle planning doc.
- **Tier 2 — Within-paradigm retries** (3-5 variants with explicit trigger conditions).

Execution policy: no auto-retry; each retry is new cycle with fresh pre-reg; cap 3 retries per paradigm before paradigm-level rethink.

**Empirical validation**: Chu kỳ 17 pre-reg had 6 retry variants documented. Post-result analysis triggered 0/6 (reject pattern indicated paradigm falsification, not hyperparameter issue). Escalated to closure report rather than retry loop. Template applied successfully.

### Guardrails (non-negotiable from Chu kỳ 1+)
- Walk-forward (no look-ahead)
- Random baseline mandatory in every tournament
- Pre-registration hypothesis before implementation
- Algebra sanity check before expensive compute
- Cycles 10+: pre-registration binding immutable post-implementation

---

## 6. Fundamental blockers

Four structural constraints identified during meta-review that cannot be overcome at current data horizon regardless of methodology refinement.

### 6.1 Set-coverage geometry (validated Chu kỳ 16)

Lottery prize structure = draw K numbers from N-space, players bet combinations. P(win ≥ tier-3) = P(ticket covers ≥ 3 of drawn K). Optimal coverage maximizes diversity; concentration (Kelly, top-M pool) minimizes coverage.

**Mathematical fact**: For N=55, K=6, single ticket P(≥3) ≈ 1.8%. 20 concentrated tickets near top-M hot numbers P_any(≥3) ≈ 5-10pp below 20 random tickets. Kelly 9/9 reject with Δ up to −28pp empirically confirmed.

**Implication**: Concentration strategies cannot beat Random on set-coverage metric unless bias is MASSIVE (e.g., every draw hits same 15 numbers). Chu kỳ 4+8 confirmed bias is ±11% digit-level, stable, far from massive. **Geometry insurmountable at observed bias scale.**

### 6.2 RNG quality near white-noise at exploitable scale

Chu kỳ 4 13-test RNG battery + Chu kỳ 8 drift analysis: bias exists (digit 6 +11%, digit 5 +8%, positions dependent p<0.001) but:
- Magnitude small (±0.4pp number-level impact on exact match)
- Stable (no drift detectable with 3-window chi²)
- Independent (serial correlation lag-1 null)

**Statistical implication**: required n_trials to detect Δ=0.1pp at 80% power ≈ 150,000. Largest cycles achieve ~6,000-7,000 trials. **Project 25-50× underpowered** relative to gold-standard detection.

**Null-leaning interpretation**: 66 strategies × 3-gate × 0 Accept is strong cumulative evidence for "white noise at exploitable scale." Not formal proof (always possible Δ=0.01pp exists undetected), but actionable conclusion: cannot extract value with current data + methodology.

### 6.3 Data horizon limitation (updated Chu kỳ 20)

Current N per product (2026-04-22) with minimum-N-for-power:

| Product | N | N req for Δ=0.3pp @ 80% | Ratio | N req for Δ=0.1pp @ 80% | Status |
|---|:---:|:---:|:---:|:---:|---|
| Max 3D | 1065 | 62,231 | 0.017 | 534,625 | **Exploratory-only** |
| Max 3D Pro | 711 | 62,231 | **0.011** | 534,625 | **Exploratory-only (worst 3D)** |
| Power 6/55 | 1334 | 48,002 | 0.028 | 406,290 | **Exploratory-only** |
| Power 6/45 | 1302 | 62,231 | 0.021 | 534,625 | **Exploratory-only** |
| Power 5/35 | 543 | 48,002 | **0.011** | 406,290 | **Exploratory-only (smallest N)** |

**Calculations** (Principle #12 binding post Chu kỳ 20): α=0.005 (Bonferroni K=10 projected), baseline rates 1.5-2% per product family. See [post_closure/cycle20_a5_min_n_table.json](post_closure/cycle20_a5_min_n_table.json) for full table with power_50% also computed.

**Updated implication** (Chu kỳ 20 baseline): Project is **data-starved 30-100×** relative to gold-standard power, not 30-50× as previously estimated. Even at N=10,000 per product (achievable ~2035 at current growth), only Δ=1pp effects detectable at 80% power — which is 2.5× the 3D bias ceiling (0.4pp) and 3.3× matrix ceiling (0.3pp). **No real effect at bias-ceiling magnitude is formally detectable with foreseeable data horizon.**

**Updated reopen criteria**: `N ≥ 2000` remains threshold for revisit of Inconclusive-underpowered candidates (§7.1), but **cumulative claim strength** will stay "moderate-power evidence" indefinitely unless RNG audit access opens (§6.4).

Lotto 5/35 newest (N=543) → most power-constrained. Expected to reach N~1000 by mid-2027 (weekly growth ~8-10 draws). Matrix products grow ~150-200 draws/year.

### 6.4 Black-box RNG — no audit access

Vietlott does NOT publish:
- RNG supplier / certification
- Physical vs software implementation details
- Audit reports (if any)
- Per-draw ball machine state
- Per-number betting pool volume (confirmed during Chu kỳ 17 data availability check)

**Implication**: All analysis is blind. Cannot verify "uniform RNG" claim directly. Cannot arbitrage crowd biases (no access to bet distribution). If Vietlott ever publishes audit reports or opens API, this blocker relaxes.

---

## 7. Null findings catalog

What the project definitively ruled out or left unresolved, in one table for future reopening reference.

### 7.1 Falsified hypotheses (convergent evidence ≥2 cycles)

| Hypothesis | Falsifying cycles | Status |
|---|---|---|
| Temporal drift exists + is exploitable | Chu kỳ 8 (3D), 14 (matrix) | **FALSIFIED** |
| Adaptive/online learning captures bias | Chu kỳ 14 (Kalman 6/6 R) | **FALSIFIED** |
| Cross-product shared-RNG bias | Chu kỳ 13 (3D), 15 (matrix) | **FALSIFIED** |
| Kelly portfolio optimal for lottery | Chu kỳ 16 (9/9 R Δ −28pp) | **FALSIFIED** (geometry ⊥) |
| Discrete latent regime structure | Chu kỳ 8, 14, 17 convergent | **FALSIFIED** |
| Copula joint-digit beats heuristic | Chu kỳ 11 (3/4 R + 1 Inc) | **FALSIFIED** |
| GBM discriminative at current features | Chu kỳ 12/12.5 | **FALSIFIED** (overfit) |
| Weekday / month seasonality | Chu kỳ 19d (10/10 tests PASS) | **FALSIFIED** (2026-04-22) |
| Single+Multi ensemble offsets coverage loss | Chu kỳ 19e (Hybrid_1S_5R / _3S_3R Reject split-half) | **FALSIFIED** (same geometry ⊥ as Kelly) |

### 7.1.1 Inconclusive-underpowered candidates (reclassified Chu kỳ 20)

Previously `Reject`, reclassified as `Inconclusive-underpowered` after Principle #12 binding upgrade. Criterion: observed Δ > 0.3pp + power < 50% + direction consistent with hypothesis.

| Cycle | Product | Strategy | Observed Δ pp | Power at bias ceiling | Revisit at N |
|:---:|---|---|:---:|:---:|:---:|
| 16 | Power 5/35 | PatternN | +0.767 | 0.020 | ≥ 48,002 |
| 13 | Max 3D | PooledDigitBias | +0.345 | 0.438 | ≥ 62,231 |
| 11 | Max 3D Pro | JointDigitBias | +0.378 | 0.251 | ≥ 62,231 |
| 12 | Max 3D Pro | JointDigitBias | +0.378 | 0.348 | ≥ 62,231 |
| 13 | Max 3D Pro | JointDigitBias | +0.378 | 0.251 | ≥ 62,231 |
| 14 | Power 6/45 | Bayesian (batch) | +0.333 | 0.090 | ≥ 62,231 |
| 15 | Power 6/45 | Bayesian (batch) | +0.333 | 0.117 | ≥ 62,231 |
| 11 | Max 3D | JointDigitBias | +0.305 | 0.438 | ≥ 62,231 |

**8 candidates**. **Do NOT count** as falsification evidence for family elimination (§7.5, Principle #17). If `N_per_product` reaches listed threshold (~2027+), these candidates may be re-tested with proper 3-gate protocol.

**Note on family classification**: JointDigitBias appears 5× above across 3 cycles × 2 products → convergent pattern suggests "joint-digit exploitation" is close-call-but-not-convergent-reject family. Current data horizon insufficient to close case. Similarly Bayesian-batch 2× Power 6/45 → close call.

**Updated cumulative claim** (post Chu kỳ 20):
> "66 strategies × 5 products × 3-gate = 0 Accept / 0 Suggestive (strong) / 79 Reject (adequate power OR no positive Δ) / **8 Inconclusive-underpowered** (revisit at N ≥ 2000-3000 per product, typically ~2027-2030)."

This is more honest than pre-Chu kỳ 20 claim "0 Accept / 0 Suggestive" which conflated strong falsification với weak-evidence reject.

### 7.2 Confirmed present but not exploitable

| Finding | Origin | Status |
|---|---|---|
| Digit-level bias ±11% on 3D | Chu kỳ 4, 19c | **REAL** but insufficient magnitude (replicated via NIST digit uniformity chi² p<0.0001) |
| T11 parity bias p=0.0012 on Lotto 5/35 | Chu kỳ 5 | **REAL** but algebraically null on single-ticket, wheeling fails after sample-size fix |
| Position dependency 3D (pos_1_2 chi²=157) | Chu kỳ 4 | **REAL** but JointDigitBias fails 3-gate |
| RNG uniformity at number level (all 5 products) | Chu kỳ 19c NIST-style battery | **CONFIRMED NULL** — passes uniformity χ², per-number serial corr, per-number runs |

### 7.3 Untested (potential future paths if reopened)

From META_REVIEW §2b "paradigm shifts chưa try":

| Hypothesis | Why untested | Reopen condition |
|---|---|---|
| Retail betting pool inference (crowd bias) | Data not available (Chu kỳ 17 check) | Vietlott publishes per-number volume |
| Gaussian Process regression | Compute + overfit concerns | N ≥ 2000 / product |
| Switching state-space (Kalman + HMM hybrid) | Chu kỳ 17 retry tree item 17.6 | Meaningful regime structure detected elsewhere first |
| Causal inference (do-calculus) | Requires instrument; none identified | Vietlott operational disclosure |
| Anomaly detection (bet rarely-occurring numbers) | Effectively = "bet cold" variant | Separate paradigm test |
| External correlates (weather, stock market) | Implausible physical mechanism | Evidence of crowd-behavior mediation |

### 7.4 Methodology gaps (acknowledged)

- ~~**Power analysis**: most gates <30% power. "No-pass" = inconclusive not falsifying in strict sense.~~ → **CLOSED Chu kỳ 20**: Principle #12 upgraded to binding, "Inconclusive-underpowered" verdict added (EVALUATION §6), 8 candidates reclassified (§7.1 below). ALL 5 products flagged exploratory-only at current N (§6.3).
- **Cycles 1-6 pre-registration**: not formal; some hyperparameter cherry-picking possible. Cycles 7+ binding pre-reg; issue closed forward.
- ~~**Formal RNG audit battery**: not run~~ → **CLOSED Chu kỳ 19c**: NIST-style battery confirms number-level uniformity for all 5 products; 3D digit bias replicated.
- **Stratified split-half**: only time-ordered tested. Stratified might expose recency-dependent behavior. *(Untested; low priority given convergent null.)*
- ~~**Seasonality test per weekday / lunar calendar**: not formally run~~ → **CLOSED Chu kỳ 19d**: chi² contingency tests 10/10 PASS. Seasonality falsified.
- ~~**Multiple-comparison correction choice (Bonferroni vs FDR)**~~ → **CLOSED Chu kỳ 19a**: BH-FDR re-analysis 0 resurrections. 3-gate stacking is binding filter.
- ~~**Single-metric decision bias** (operational single-metric despite codified composite)~~ → **CLOSED Chu kỳ 20**: Composite-binding rule (EVALUATION §8). 5 historical cycle-product groups had composite ≠ single-metric top but NO verdict reversal.

### 7.5 Eliminated families — binding registry (Principle #17, Chu kỳ 20)

**Rule** (METHODOLOGY §3.11): New cycles Chu kỳ 21+ cannot propose mechanisms in eliminated families without citing + evidencing unbind trigger. Routed through Principle #16 retry tree.

| Family | Origin cycles | Convergent evidence | Mean Δ observed | **Unbind trigger** |
|---|---|---|:---:|---|
| Adaptive / drift-based | 8 (3D no drift), 14 (matrix online Kalman 6/6 R) | 2 cycles + 11 strategies | +0.004pp | Novel non-stationary hypothesis + evidence drift emerged post-observation period |
| **Bayesian broadly (batch + online + hierarchical)** | 2 (batch replication R), 14 (online Kalman 6/6 R), 21 (hierarchical 9/9 R) | 3 cycles + 29 strategies across 3 mechanisms | +0.008pp | N ≥ 2 × current per product (~2028+) AND Hierarchical EB close-call N=62,231 revisit for Power 6/45 Inconclusive-UP Bayesian batch |
| Cross-product pooling | 13 (3D 4/4 R), 15 (matrix 5/6 R + 1 Inc) | 2 cycles + 9 strategies | -0.135pp | Vietlott confirms shared-RNG infrastructure between products |
| Kelly concentration multi-ticket | 16 (9/9 R Δ up to −28pp), 19e (Hybrid reject) | 2 cycles + 12 strategies | -13.694pp (Kelly proper) | Geometric proof of exception to set-coverage ⊥ concentration |
| HMM regime detection | 17 (6/6 R), convergent với 8 (no drift) + 14 (Kalman) | 3 cycles convergent | -0.130pp | Discrete regime structure detected via non-HMM method first |
| GBM discriminative at current features | 12 (+3pp flagged), 12.5 (audit confirms overfit) | 1 cycle + 1 audit | +3.338pp (overfit, not real) | Feature dimensionality increase ≥10× OR novel training paradigm (LLM-based reasoning, etc.) |
| Single+Multi ticket ensemble | 19e (Hybrid_1S_5R / _3S_3R Reject split-half) | 1 cycle + Kelly geometry | Negative on full/halves, isolated +1.2-1.4pp forward (p>0.4 noise) | Kelly unbind condition met (geometric exception to set-coverage) |

**Unbinding procedure**:
1. Pre-reg must cite specific unbind trigger
2. Evidence trigger met (artifact: data, paper, API response, proof)
3. Route through Principle #16 retry tree explicitly
4. User approval required

**Common default unbind trigger for data-bound families**: `N ≥ 2 × current_N_per_product` (per Principle #12 power gate logic).

---

## 8. Artifact inventory

### 8.1 Code

| Path | Purpose | Status |
|---|---|:---:|
| `src/vietlott/` | Python crawler (5 products, cli commands) | **Maintained** |
| `website/` | Next.js 16 UI (client-side strategy port) | **Maintained** |
| `website/research/3d/` | 3D backtest + analysis (Chu kỳ 4, 7, 8, 11, 12, 12.5, 13, 17) | Reference |
| `website/research/matrix/` | Matrix backtest + analysis (Chu kỳ 1-3, 5, 9, 14-17) | Reference |
| `website/research/hmm_regime.py` | Shared HMM module (Chu kỳ 17) | Reference |
| `website/research/_significance.py` | Shared z-test + decision rules (EVALUATION §3) | **Maintained** |

### 8.2 Documentation (canonical)

| File | Purpose |
|---|---|
| [METHODOLOGY.md](METHODOLOGY.md) | 5-phase pipeline + Principles #11-#16 + anti-patterns |
| [EVALUATION.md](EVALUATION.md) | Metrics + significance + forward gate + tournament ranking |
| [TESTING.md](TESTING.md) | 14-test matrix / 13-test digit bias battery |
| [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md) | Templates (discovery + breakthrough + retry tree) |
| [BREAKTHROUGH_ROADMAP.md](BREAKTHROUGH_ROADMAP.md) | 7 novel paths (historical, most falsified by Chu kỳ 16) |
| [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) | 17-cycle index + Principles Corpus |
| [archive/superseded_docs/META_REVIEW_POST_CYCLE16.md](archive/superseded_docs/META_REVIEW_POST_CYCLE16.md) | Pre-Chu kỳ 17 meta-analysis (8 hướng + 3 kịch bản — role superseded by this report) |
| [3d/3D_FINAL_REPORT.md](3d/3D_FINAL_REPORT.md) | 3D line synthesis (28 strategies × 8 cycles) |
| **This file** | Project terminal closure |

### 8.3 Per-cycle records (history/)
17 files `history/cycleNN_<slug>.md` — immutable per-cycle records with pre-reg + results + lessons.

### 8.4 Proposals (PAUSED / future optional)
- [proposals/cycle17a_roi_ranking_3d.md](proposals/cycle17a_roi_ranking_3d.md) — Optimization mode (not breakthrough) for UI `PRODUCT_RANKS.picks.roi` update. Can resume as Chu kỳ 19 if desired.

### 8.5 Archived (superseded)
`archive/superseded_docs/`:
- `RESEARCH_DOCUMENTATION.md` (stale post-Chu kỳ 6, content mostly reflected in cycle records)
- `3d_REPORT_cycle4_snapshot.md` (pre-replication claims, superseded by 3D_FINAL_REPORT)
- `RESEARCH_PLAN.md` + `RNG_ANALYSIS_REPORT.md` + `Random_Analysis_Agent.md` (07/2025 originals)

---

## 9. Reopen criteria

Concrete triggers under which re-investing in breakthrough research becomes justified:

### 9.1 Data-driven triggers
- **N ≥ 2000 per product**: approximately 2028-2030 for Lotto 5/35, earlier for others. Halves power uncertainty. Enables ±0.15pp effect detection.
- **≥3 years more data on Power 5/35**: currently only N=543, too new for reliable bias characterization.

### 9.2 Operational / disclosure triggers
- Vietlott publishes **per-number betting volume** (enables Retail Betting Pool Signal, Hướng A from META_REVIEW — estimated 20-30% pass probability).
- Vietlott publishes **RNG certification / audit report**.
- Vietlott opens **API for operational data** (sales per draw, carryover status, etc.).

### 9.3 Methodological / external triggers
- New academic literature on **low-power bias detection in lottery RNGs** with techniques not tested here.
- Release of **large-scale lottery analytics frameworks** (hypothetical — unlikely given commercial interests).
- **Switching state-space / HSMM / Categorical HMM** implementations mature enough to make Chu kỳ 17 retry tree item 17.6 tractable (probably 1-2 years of tooling evolution).

### 9.4 Null-reversal triggers
If future research (other teams, academic) discovers exploitable structure in Vietnamese lottery specifically:
- Review their findings + methodology
- Replicate with our protocol (3-gate + Principles #11-#16)
- If replicates → reopen with directed hypothesis

### 9.5 Conservative default
**Absent any of 9.1-9.4: no reopen.** Null findings are robust; further effort without new signal = sunk-cost lock-in.

---

## 10. Utility of existing artifacts (what users benefit from now)

Even without a predictive edge, the project produces value:

### 10.1 For lottery players
- **Transparency**: UI disclosure banners explaining "~66 strategies tested, 0 robust edge, EV always negative."
- **ROI-ranked suggestions**: Optimization mode (Chu kỳ 19 resume optional) would provide best-of-null-field strategy per product.
- **Data access**: Full historical draw data as JSONL, updated via automated crawler.
- **Statistical literacy**: Methodology docs serve as template for critical thinking about lottery claims.

### 10.2 For researchers
- **Replication target**: 17 cycles with frozen pre-regs + results + data snapshots. Reproducible.
- **Methodology corpus**: Principles #11-#16 codified with origin cycles + empirical validation count. Usable beyond lottery.
- **Null evidence catalogue**: §7 saves future teams from re-discovering the same walls.

### 10.3 For the codebase
- **Crawler stability**: Production for 7 products, ~2-day draw latency.
- **Website type safety**: Next.js 16 + TypeScript client-side port of strategies.
- **Dev conventions**: CLAUDE.md + AGENTS.md documented, easy onboarding.

---

## 11. Closing remarks

### 11.1 Scientific integrity (updated Chu kỳ 20)

This project ended with a null result. The rigor of that null — 3-gate stacked, pre-registered, convergent across 19 cycles, refined Chu kỳ 20 with Principles #17 (family elimination) and binding #12 (power) — is the contribution. Many popular "lottery strategies" in commercial apps and academic-adjacent papers rely on single-gate full-sample tests; any of them would have produced "promising" Chu kỳ 1-6 results here. 3-gate stacking dissolved all of them. The protocol is the real artifact.

**Known historical biases acknowledged (Chu kỳ 20 self-assessment)**:
1. **Single-metric decision bias**: Composite weights codified Chu kỳ 10 (0.40/0.30/0.15/0.15) but operationally many decisions defaulted to win-rate primary. Chu kỳ 19b + 20 A4 surfaced 5 cycle-product groups where composite-top ≠ single-metric-top. **No verdict reversal** (all strategies in those groups were Reject regardless) but the bias existed. Post Chu kỳ 20: composite-binding rule enforced.
2. **Underpowered reject claims**: 99.2% of 364 significance tests ran at <50% power. "Reject at low power" was treated equivalent to "Reject at adequate power" — incorrect. Post Chu kỳ 20: Principle #12 binding; 8 reject verdicts reclassified to Inconclusive-underpowered (§7.1.1).
3. **Paradigm revisits without family blocker**: Chu kỳ 19e tested Single+Multi ensemble — variant of concentration paradigm falsified Chu kỳ 16. Principle #17 (family elimination binding) now prevents similar wasted cycles.

These biases **did not reverse the 0-Accept conclusion** but did inflate confidence in "falsification" claims for weak-evidence rejects. Post-refinement claim is narrower + defensible:

> "19 cycles × 66 strategies × 3-gate with convergent family-level evidence = 0 strong Accept, 79 strong Reject (6 families eliminated with unbind triggers), 8 Inconclusive-underpowered pending N≥2000 per product."

### 11.2 What not to update

Do **not** update this document with minor findings from follow-on cycles (Chu kỳ 21+ Optimization mode or future reopens). This is the project-level closure; per-cycle records in `history/` handle post-closure activity.

**Exception list** (items requiring this document to update):
- 2026-04-22 Chu kỳ 19: added §7.1 new falsifications (seasonality, ensemble), §7.4 gaps closed
- 2026-04-22 Chu kỳ 20: §6.3 min-N table, §7.1.1 Inconclusive-underpowered reclassification, §7.5 family registry, §11.1 bias acknowledgment
- Future: any Reopen (§9 triggers met) that produces new Accept/Suggestive candidates — MUST update §7.1 status + §11 narrative

Do **not** claim "we proved no edge exists." We demonstrated "no edge we could find with 19 cycles × 66 strategies × current data horizon passes refined 3-gate validation with adequate power." Narrower, honest, scientifically defensible.

### 11.3 Acknowledgments
Methodology principles #11-#17 distilled from failures, not wins. Each principle has an origin cycle where a specific false-positive (or false-certainty) would have slipped through without it. The cycles are the teachers.

### 11.4 Contact + continuation

For users of this codebase:
- **Maintain crawler + website**: continue, low maintenance.
- **Ship UI changes**: use [RESEARCH_TO_UI_PLAYBOOK.md](../RESEARCH_TO_UI_PLAYBOOK.md).
- **Chu kỳ 21 Optimization mode** (optional): resume [proposals/cycle17a_roi_ranking_3d.md](proposals/cycle17a_roi_ranking_3d.md) for ROI-backed UI picks. ~1-2 weeks effort. Not breakthrough-search; ranks existing strategies. Now benefits from Chu kỳ 20 composite-binding rule.
- **Reopen breakthrough research**: only on §9 triggers. New cycles must comply với Principle #17 (family elimination) + binding Principle #12 (power gate).

---

*Document frozen 2026-04-22 (initial Chu kỳ 18). Updated Chu kỳ 19 (post-closure) + Chu kỳ 20 (methodology refinement). See §11.2 exception list for all updates.*

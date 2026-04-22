# Optimization Mode — Active Workspace (Chu Kỳ 22+)

> **Purpose**: Post-closure user-facing deliverable work. Rank existing strategies by ROI + win-rate cho UI `PRODUCT_RANKS.picks` + budget feature. NOT breakthrough research.

**Current focus** (2026-04-22+): Delivering actionable picks to users given null breakthrough findings across 21 cycles.

---

## What is Optimization mode?

### Breakthrough mode (Chu kỳ 1-21, closed)

- **Goal**: Find mechanism with statistical edge vs Random
- **Protocol**: 3-gate (full + split-half + forward) + significance + power gate
- **Verdict**: Accept / Suggestive / Reject / Inconclusive / Inconclusive-underpowered
- **Output**: Research artifact, methodology contribution, potentially ship
- **Result after 21 cycles**: 0 Accept, 7 eliminated families, 8 Inconclusive-underpowered candidates

### Optimization mode (Chu kỳ 22+, active)

- **Goal**: Rank existing strategies by ROI for UI deployment
- **Protocol**: Lighter — composite tournament + replication check (split-half verify)
- **Verdict**: "Best of null field" per product (descriptive, not scientific Accept)
- **Output**: UI `PRODUCT_RANKS.picks.winrate` + `picks.roi` + optional budget feature
- **Constraint**: Inherits Chu kỳ 20 methodology (composite-binding, Phase 0 classification exploratory-only)

### Key distinctions

| Aspect | Breakthrough | Optimization |
|---|---|---|
| New mechanism proposed? | Yes | No (uses existing strategies) |
| Power gate binding? | Yes (Principle #12) | N/A (descriptive-only) |
| Family elimination check? | Yes (Principle #17) | N/A (no new mechanism) |
| Accept verdict possible? | Yes (with adequate power) | No (best = "ship-with-caveats") |
| Primary deliverable | Methodology + history record | UI update + user transparency |
| Honesty burden | Statistical claims | Pick-selection transparency |

---

## Current state

**Chu kỳ 21 closed (2026-04-22)**: Bayesian family broadly eliminated. 7 families total eliminated.

**Existing strategies available for Optimization** (by product):

### Matrix (Power 6/55, Mega 6/45, Lotto 5/35)

From [matrix/backtest.py](../matrix/backtest.py) + cycle-specific modules:

| Strategy | Origin | Notes |
|---|---|---|
| Random | baseline | Mandatory comparison |
| Freq_Hot(365, 0.8) | Chu kỳ 1-2 | Composite anchor per Chu kỳ 20 |
| Pattern(180) | Chu kỳ 1-2 | Pattern-based |
| Bayesian(365, 1.0, 1.0) | Chu kỳ 2 | Batch Dirichlet (eliminated broadly Chu kỳ 21) |
| Bayes_Sharp(180, 1.0, 0.5) | Chu kỳ 2 | Sharp variant (eliminated) |
| MaxEntropy(365, 1.0) | Chu kỳ 2 | Entropy-based |
| Adaptive | Chu kỳ 2 | Sliding window (eliminated Chu kỳ 14) |
| OnlineBayes λ=0.01/0.03/0.10 | Chu kỳ 14 | Kalman (eliminated) |

**Note**: "Eliminated" = breakthrough claim rejected. For Optimization, still usable — we rank all, exclude overfit (Chu kỳ 12 GBM), label honestly.

### 3D (Max 3D, Max 3D Pro)

From [3d/advanced_backtest.py](../3d/advanced_backtest.py):
- Random, FreqWholeHot, JointDigitBias, ConditionalChain, AdaptiveBiasTracker
- MinimumCoverageSet, TierWeightedStrategy, StratifiedDigitSampling
- BayesianJointPosterior, MultiSignalEnsemble, OptimalTicketPortfolio
- ExpectedValueMaximizer, KLDivergenceMinimizer, DigitPairExploiter
- UltimateComposite (2 variants)

21 strategies total (excluding GBM which is overfit-flagged).

---

## Roadmap

### Phase 1: Chu kỳ 22 — Unified Optimization Mode (pending)

**Pre-reg**: [proposals/cycle22_optimization_mode.md](../proposals/cycle22_optimization_mode.md) (replaces cycle17a scope)

**Scope**:
- Rank all 3D strategies by composite score (primary metric = ROI since all rejected on win-rate)
- Rank all matrix strategies similarly
- Apply split-half replication gate to top-2 per product (Principle #11)
- Output per product:
  - `picks.winrate`: best win-rate strategy (directional, honest caveat)
  - `picks.roi`: best ROI strategy (least-negative)
  - If same strategy tops both → single pick

**Effort**: 1-2 tuần

**Deliverable**: UI update `website/src/components/products/SuggestionPanel.tsx` — `PRODUCT_RANKS`

### Phase 2: Chu kỳ 23 — Budget-aware feature (conditional on Phase 1)

**Scope**:
- User specifies budget (VND) → system suggests ticket portfolio maximizing E[payout]
- Based on `picks.roi` (N=1 single-ticket) or `picks.winrate` (N≥20 multi-ticket diversification)
- Coverage-optimized wheeling for large N (not Kelly — falsified Chu kỳ 16)

**Effort**: 1 tuần

**Deliverable**: UI budget widget + backend computation

### Phase 3: Chu kỳ 24 — UI transparency polish (conditional)

**Scope**:
- Disclosure banners updated with Chu kỳ 20 honest claim
- Expand glossary page với Principle #17 family elimination explanation
- Reopen criteria banner (when to expect research restart)

**Effort**: 3-4 ngày

**Deliverable**: Full UX polish for post-research state

---

## Methodology

See [PLAYBOOK.md](PLAYBOOK.md) for Optimization-specific methodology (lighter than [RESEARCH_PLAYBOOK.md](../RESEARCH_PLAYBOOK.md)).

### Key rules (from Chu kỳ 20 refinement)

1. **Composite-binding decision** (EVALUATION §8 BINDING): Tournament composite score is decision output. Not single-metric.
2. **Phase 0 classification**: ALL current products exploratory-only. Optimization cycles explicitly declare "descriptive-only, no Accept/Reject claims."
3. **Family elimination (Principle #17)**: N/A for Optimization (no new mechanism). But strategies from eliminated families (Kelly, HMM, GBM) must NOT be promoted to UI — add exclusion list.
4. **Immutability of past verdicts**: History files immutable. Reclassifications in closure report §7.1.1 only.

### Exclusion list for UI promotion (post Chu kỳ 21)

Do NOT surface as `picks.winrate` or `picks.roi`:

| Strategy | Reason |
|---|---|
| GBM Max 3D / Max 3D Pro (Chu kỳ 12) | Overfit confirmed Chu kỳ 12.5 |
| Kelly variants (Chu kỳ 16) | Δ=-28pp vs Random, set-coverage ⊥ |
| HMM_K2_W* (Chu kỳ 17) | Concentration collapse + 6/6 Reject |
| Hybrid_1S_5R / Hybrid_3S_3R (Chu kỳ 19e) | Split-half direction flip |
| HierarchicalEB_Sharp/Lazy (Chu kỳ 21) | Split-half direction flip Power 6/55 |

---

## Artifacts

- [PLAYBOOK.md](PLAYBOOK.md) — Optimization-specific methodology
- Pre-regs → [../proposals/](../proposals/) (cycle22+ lives there)
- Results + data → (as cycles run, will add `optimization/cycleNN_*` dirs)
- UI updates → [website/src/components/products/SuggestionPanel.tsx](../../src/components/products/SuggestionPanel.tsx) per [RESEARCH_TO_UI_PLAYBOOK.md](../../RESEARCH_TO_UI_PLAYBOOK.md)

## Not in scope

- New mechanism research (would trigger §9 closure reopen criteria, Chu kỳ 25+ only)
- Modifying eliminated families' UI presence (stays excluded)
- Methodology refinement (Chu kỳ 20 is terminal for this project phase)

---

## Navigation

- **Parent**: [research/README.md](../README.md) — full project overview
- **Closure**: [research/PROJECT_CLOSURE_REPORT.md](../PROJECT_CLOSURE_REPORT.md) — research phase terminal artifact
- **History**: [research/RESEARCH_HISTORY.md](../RESEARCH_HISTORY.md) — 21 cycles index
- **Methodology corpus** (research era): [research/METHODOLOGY.md](../METHODOLOGY.md), [research/EVALUATION.md](../EVALUATION.md), [research/TESTING.md](../TESTING.md), [research/RESEARCH_PLAYBOOK.md](../RESEARCH_PLAYBOOK.md)
- **Reopen research**: only on [§9 triggers](../PROJECT_CLOSURE_REPORT.md)

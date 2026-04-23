# Optimization Mode — Active Workspace (Chu Kỳ 22+)

> **Purpose**: Post-closure user-facing deliverable work. Rank existing strategies by ROI + win-rate cho UI `PRODUCT_RANKS.picks` + budget feature. NOT breakthrough research.

**Current focus** (2026-04-23+): Chu kỳ 22 Optimization + Chu kỳ 23 UX Refactor both SHIPPED. Next cycle: Chu kỳ 24 budget-aware feature (pre-reg pending).

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

**Chu kỳ 23 closed (2026-04-22)**: App-wide UX Refactor shipped. `/research/cycle22` route removed (inline merged vào `/research`). Badge taxonomy reset. `/suggest` flow reorder.

**Chu kỳ 22 closed (2026-04-22)**: Optimization Mode Phase O-1 + O-2 shipped. 3 composite profiles × 5 products, UI updated với 3 new TS strategies (mindistance/coverageopt/pairexploiter), `PRODUCT_RANKS` 3-pick structure, glossary C22 section. See [history/cycle22_optimization_mode.md](../history/cycle22_optimization_mode.md) + [cycle22_review.md](cycle22_review.md).

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

### ✅ Phase 1: Chu kỳ 22 — Unified Optimization Mode (SHIPPED 2026-04-22)

**Pre-reg** (executed): [proposals/executed/cycle22_optimization_mode.md](../proposals/executed/cycle22_optimization_mode.md)
**Verdict**: [history/cycle22_optimization_mode.md](../history/cycle22_optimization_mode.md)

**Output**:
- Composite ranking 3 profiles (WinRate / ROI / Balanced) × 5 products
- 3/5 products valid picks (Power 6/55 MinDistance collapse_all_three, Power 5/35 Freq_Hot collapse_all_three, Max 3D 3-pick diverse)
- 2/5 null honest (Mega 6/45 baseline drift, Max 3D Pro regime split)
- UI shipped: 3 new TS strategies (mindistance/coverageopt/pairexploiter), `PRODUCT_RANKS` 3-pick + collapse, glossary C22 section, `/research/cycle22` page (later merged inline Chu kỳ 23)

### ✅ Phase 2: Chu kỳ 23 — App-wide UX Refactor (SHIPPED 2026-04-22)

**Pre-reg** (executed): [proposals/executed/cycle23_app_refactor.md](../proposals/executed/cycle23_app_refactor.md)
**Verdict**: [history/cycle23_app_refactor.md](../history/cycle23_app_refactor.md)

**Note**: Original Phase 2 plan was budget-aware feature. User pivot sau Chu kỳ 22 shipment → UX cleanup ưu tiên hơn. Budget đẩy sang Phase 3.

**Output**:
- 4 phases (23.1-23.4): stale string audit, badge reset, `/research` rewrite 867→250 lines, `/suggest` compact header + Generate up-front
- `/research/cycle22` route deleted, inlined vào `/research` (data module `cycle22-data.ts` retained)
- Badge taxonomy reset: max 3 pick badges (🎯 / 💰 / ⚖), removed #rank/★/🔬/🧪
- Time-to-first-suggestion ~20s → ~8s

### ⏳ Phase 3: Chu kỳ 24 — Budget-aware feature (PENDING pre-reg)

**Scope**:
- User specifies budget (VND) → system suggests ticket portfolio maximizing E[payout]
- Based on `picks.roi` (N=1 single-ticket) or `picks.winrate` (N≥20 multi-ticket diversification)
- Coverage-optimized wheeling for large N (not Kelly — falsified Chu kỳ 16)

**Effort**: ~1 tuần

**Deliverable**: UI budget widget + backend computation

**Blockers**: Pre-reg chưa viết. Wheeling design + exclusion policy (family-eliminated strategies out)

### ⚪ Phase 4: Chu kỳ 25+ — UI transparency polish (optional)

**Scope** (if needed post-Chu kỳ 24):
- Additional glossary / disclosure refinements
- Data refresh cadence review
- Reopen criteria surfacing

**Status**: Phần lớn scope gốc đã subsumed bởi Chu kỳ 23 UX refactor.

---

## Methodology

See [PLAYBOOK.md](PLAYBOOK.md) for Optimization-specific methodology (lighter than [RESEARCH_PLAYBOOK.md](../RESEARCH_PLAYBOOK.md)).

### Key rules (from Chu kỳ 20 refinement)

1. **Composite-binding decision** (EVALUATION §8 BINDING): Tournament composite score is decision output. Not single-metric.
2. **Phase 0 classification**: ALL current products exploratory-only. Optimization cycles explicitly declare "descriptive-only, no Accept/Reject claims."
3. **Family elimination (Principle #17)**: N/A for Optimization (no new mechanism). But strategies from eliminated families (Kelly, HMM, GBM) must NOT be promoted to UI — add exclusion list.
4. **Immutability of past verdicts**: History files immutable. Reclassifications in closure report §7.1.1 only.

### Exclusion list for UI promotion

**Canonical source**: [MEASUREMENT.md §4](MEASUREMENT.md) — unified 2-tier exclusion.

Do NOT surface as `picks.winrate` / `picks.roi` / `picks.balanced`:

**Tier 1 — Hard exclude** (direct evidence):
- GBM Max 3D / Max 3D Pro — overfit (Chu kỳ 12/12.5)
- Kelly variants — Δ=−28pp, set-coverage ⊥ concentration (Chu kỳ 16)
- HMM_K2_W20/W40 — concentration collapse + 6/6 Reject (Chu kỳ 17)
- Hybrid_1S_5R / Hybrid_3S_3R — split-half direction flip (Chu kỳ 19e)
- HierarchicalEB_Sharp / HierarchicalEB_Lazy — split-half flip Power 6/55 (Chu kỳ 21)
- Single_N6 — insignificant at all gates (Chu kỳ 19e)

**Tier 2 — Family eliminated** (Principle #17 binding, Chu kỳ 20):
- Matrix: AdaptiveWindowStrategy, OnlineBayes λ=0.01/0.03/0.10, BayesianDirichlet, Bayes_Sharp, HierarchicalEB T=1.0
- **3D conservative extension** (2026-04-22): C1 BayesJoint_HL100 + HL150_S (Bayesian family), A3 AdaptBias_T0.9 + T0.7 (Adaptive family)
- **KHÔNG exclude**: EnsembleBorda, C2 MultiSignal, UltimateComposite — ensemble family không broadly eliminated, chỉ 2 Hybrid configs bị config-specific binding.

---

## Artifacts

- [MEASUREMENT.md](MEASUREMENT.md) — **canonical** measurement methodology (composite profiles, picks, exclusion) + evaluation checklist
- [PLAYBOOK.md](PLAYBOOK.md) — Optimization-specific process (3-phase pipeline)
- Pre-regs active → [../proposals/](../proposals/); executed → [../proposals/executed/](../proposals/executed/) (cycle22 + cycle23 live there)
- Chu kỳ 22 results → [cycle22_rankings.json](cycle22_rankings.json), [cycle22_backtest_matrix.json](cycle22_backtest_matrix.json), [cycle22_backtest_3d.json](cycle22_backtest_3d.json), [cycle22_review.md](cycle22_review.md), [cycle22_page_archive.md](cycle22_page_archive.md) (archive của route bị xoá Chu kỳ 23)
- UI updates → [website/src/components/products/SuggestionPanel.tsx](../../src/components/products/SuggestionPanel.tsx) per [RESEARCH_TO_UI_PLAYBOOK.md](../../RESEARCH_TO_UI_PLAYBOOK.md)

## Not in scope

- New mechanism research (would trigger §9 closure reopen criteria, Chu kỳ 25+ only)
- Modifying eliminated families' UI presence (stays excluded)
- Methodology refinement (Chu kỳ 20 is terminal for this project phase)

---

## Navigation

- **Parent**: [research/README.md](../README.md) — full project overview
- **Closure**: [research/PROJECT_CLOSURE_REPORT.md](../PROJECT_CLOSURE_REPORT.md) — research phase terminal artifact
- **History**: [research/RESEARCH_HISTORY.md](../RESEARCH_HISTORY.md) — 23 cycles index (21 breakthrough + 2 optimization)
- **Methodology corpus** (research era): [research/METHODOLOGY.md](../METHODOLOGY.md), [research/EVALUATION.md](../EVALUATION.md), [research/TESTING.md](../TESTING.md), [research/RESEARCH_PLAYBOOK.md](../RESEARCH_PLAYBOOK.md)
- **Reopen research**: only on [§9 triggers](../PROJECT_CLOSURE_REPORT.md)

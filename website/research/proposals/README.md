# Proposals — Index + TODO List

**Purpose**: Registry của pre-regs (frozen per Principle #16). `proposals/` root = active/pending/PAUSED. `proposals/executed/` = completed (frozen, cross-linked từ history/).

**Last updated**: 2026-04-22 (post Chu kỳ 21, pivoting to Optimization mode)

**🎯 Current priority**: [optimization/README.md](../optimization/README.md) — Chu kỳ 22 Optimization Mode active pre-reg. Research phase closed.

---

## Active / Pending

| File | Status | Scope | Effort | Notes |
|---|:---:|---|:---:|---|
| [cycle22_optimization_mode.md](cycle22_optimization_mode.md) | 🎯 **ACTIVE** | Optimization mode unified 3D + matrix — UI picks + ranking | 5-6d | Primary forward work. See [optimization/](../optimization/) |
| [cycle17a_roi_ranking_3d.md](cycle17a_roi_ranking_3d.md) | ⚠ Superseded by cycle22 | (Historical reference only) | N/A | Content frozen Principle #16 |

---

## Executed (frozen, see `executed/`)

| File | Cycle | Result | Verdict record |
|---|:---:|---|---|
| [executed/cycle17_hmm_regime.md](executed/cycle17_hmm_regime.md) | 17 | 6/6 Reject — HMM paradigm falsified | [history/cycle17_hmm_regime.md](../history/cycle17_hmm_regime.md) |
| [executed/cycle20_methodology_refinement.md](executed/cycle20_methodology_refinement.md) | 20 | 4 improvements codified | [history/cycle20_methodology_refinement.md](../history/cycle20_methodology_refinement.md) |
| [executed/cycle20_evaluation_checklist.md](executed/cycle20_evaluation_checklist.md) | 20 | Checklist B-F pass | Companion to cycle20 history record |
| [executed/cycle21_hierarchical_bayesian.md](executed/cycle21_hierarchical_bayesian.md) | 21 | 9/9 Reject — Bayesian family broadly eliminated | [history/cycle21_hierarchical_bayesian.md](../history/cycle21_hierarchical_bayesian.md) |

---

## TODO — What hasn't been run

### Tier 1: Active / primary

#### 1. **Chu kỳ 22 Optimization Mode (unified 3D + matrix)** — ACTIVE

- **File**: [cycle22_optimization_mode.md](cycle22_optimization_mode.md)
- **Scope**: Rank all non-excluded strategies across 5 products. Assign `picks.winrate` + `picks.roi`. Ship UI.
- **Effort**: 5-6 ngày
- **Mode**: Optimization (lighter than breakthrough) — see [optimization/README.md](../optimization/README.md)
- **Benefits (post Chu kỳ 20/21)**: 
  - Composite-binding decision (removes hidden single-metric bias)
  - Exclusion list applied (GBM, Kelly, HMM, Hybrid, HierarchicalEB_Sharp/Lazy)
  - Exploratory-only classification → honest UI labels (no Accept claims)
  - Output: UI `PRODUCT_RANKS.picks.winrate` + `picks.roi` update cho 5 products
- **Output artifact**: `history/cycle22_optimization_mode.md` + UI ship
- **NOT breakthrough search** — ranking only

### Tier 2: Untested hướng từ META_REVIEW (archived)

From [archive/superseded_docs/META_REVIEW_POST_CYCLE16.md §5](../archive/superseded_docs/META_REVIEW_POST_CYCLE16.md):

| Hướng | Status | Why not run | Unbind/trigger |
|---|:---:|---|---|
| A Retail Betting Pool | ✗ Infeasible | Vietlott không expose per-number volume (confirmed Chu kỳ 17 data check) | Vietlott publishes bet volume API |
| ~~B Hierarchical Bayesian~~ | ✓ Done (Chu kỳ 21) | 9/9 Reject — Bayesian broad family eliminated. See [history/cycle21](../history/cycle21_hierarchical_bayesian.md) | N ≥ 2×current (~2028+) AND Inconclusive-UP revisit criteria |
| C HMM regime | ✓ Done (Chu kỳ 17) | — | Reject confirmed |
| D NIST battery | ✓ Done (Chu kỳ 19c) | — | All products pass |
| E Seasonality | ✓ Done (Chu kỳ 19d) | — | Falsified |
| **F Anomaly Detection** | ❓ Untested | Low priority, overlaps "cold number" strategies đã reject | N/A — paradigm similarity flag |
| G Closure report | ✓ Done (Chu kỳ 18) | — | — |
| H Optimization | 🎯 ACTIVE (cycle22) | User pivot focus 2026-04-22 | In progress |

### Tier 3: Retry tree items đã triggered nhưng chưa chạy

From Chu kỳ 17 pre-reg §Retry Tree:

| # | Variant | Trigger status | Recommendation |
|:-:|---|:---:|---|
| 17.1 | K=3 states | ✗ Not triggered (K=2 concentration failed) | Skip |
| **17.2** | Alt observations (entropy, top-k) | ✓ **Triggered** (4/6 configs collapsed P#15) | **Not recommended** — paradigm-level falsification (Chu kỳ 8+14+17 convergent) outweighs hyperparameter tweak |
| 17.3 | Alt strategy mapping | ✗ Not triggered | Skip |
| 17.4 | Alt W | ✗ Not triggered | Skip |
| 17.5 | Expand products | ✗ Not triggered | Skip |
| 17.6 | Alt HMM family | Only eligible after 17.1-17.4 all reject | Blocked by Principle #17 (HMM regime family eliminated) |

**17.2 note**: Triggered by data but Chu kỳ 17 verdict record explicitly recommends NOT executing. Sunk-cost avoidance per Principle #17.

### Tier 4: Untested meta-methodology items

From META_REVIEW §2c meta-questions:

| Item | Priority | Notes |
|---|:---:|---|
| Blocked CV (7-day blocks) | Low | Methodology alternative to walk-forward; không test mechanism, chỉ test evaluation protocol |
| Single+Multi ensemble | ✓ Done (Chu kỳ 19e) | Reject |
| Dynamic strategy selection via Bayesian changepoint | Low | Subsumed by HMM paradigm (Chu kỳ 17), falsified |

---

## Decision rules cho next cycle

### Chu kỳ 22+ = Optimization Mode (primary focus)

**User pivot 2026-04-22**: shift from breakthrough research to user-facing Optimization. See [optimization/README.md](../optimization/README.md) roadmap.

**If user says "run Chu kỳ 22"**:
1. Execute [cycle22_optimization_mode.md](cycle22_optimization_mode.md) per [optimization/PLAYBOOK.md](../optimization/PLAYBOOK.md)
2. Apply exclusion list (GBM/Kelly/HMM/Hybrid/HierarchicalEB_Sharp-Lazy)
3. Composite-binding ranking
4. Ship UI

**If user says "run Chu kỳ 23"**:
- Budget-aware feature (roadmap Phase 2 trong [optimization/README.md](../optimization/README.md))
- Conditional on Chu kỳ 22 ship

**If user says "run breakthrough Hướng F Anomaly"**:
- Post-closure breakthrough — would need §9 reopen trigger justification
- Recommend SKIP unless external evidence emerges
- Low priority per META_REVIEW (5-10% pass, overlaps "cold number" eliminated)

### Reopen breakthrough research (§9 closure report triggers)

Any NEW breakthrough cycle MUST:
- Pass Phase 0 power gate (Principle #12 binding) — currently all 5 products exploratory-only
- Pass Principle #17 family check
- Use composite-binding decision (EVALUATION §8)
- Include Principle #16 retry tree

---

## Pre-reg writing checklist (for future cycles)

Copy-paste template:

```markdown
## Chu Kỳ N — Pre-Registration: <Mechanism Name>

**Status**: ACTIVE | PAUSED | EXECUTED

### Phase 0 Power Gate Classification
- Primary metric: <win_rate_ge3 | exact_match_rate>
- Baseline rate per product: <p0>
- Target effect Δ: <bias_ceiling>
- n_required(80% power, α=0.005): <N>
- Current N_available: <N>
- **Classification**: standard | moderate-power | exploratory-only

### Family Check (Principle #17)
- Mechanism family: <name>
- ∈ eliminated registry? <yes/no>
- If yes: unbind trigger = <citation>, evidence = <link>

### Hypothesis (pre-registered)
<standard format>

### Decision Rule
<standard format, composite-binding>

### Retry Tree (Principle #16)
#### Tier 1 (paradigm swap)
<alternatives if mechanism reject>
#### Tier 2 (within-paradigm variants)
<3-5 variants with triggers>
```

---

## Housekeeping rules

- **Pre-regs immutable post-approve** (Principle #16). Content edits → re-register.
- **Path updates OK** (moving to `executed/` = organizational, not content change).
- **Completed → move to `executed/`**. Banner in original file updated on move.
- **PAUSED proposals stay in root** until resumed or explicitly dropped.
- **Cross-linked from `history/cycleNN_*.md`** with `../proposals/` or `../proposals/executed/`.

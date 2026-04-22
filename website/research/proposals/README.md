# Proposals — Index + TODO List

**Purpose**: Registry của pre-regs (frozen per Principle #16). `proposals/` root = active/pending/PAUSED. `proposals/executed/` = completed (frozen, cross-linked từ history/).

**Last updated**: 2026-04-22 (post Chu kỳ 20)

---

## Active / Pending / PAUSED

| File | Status | Scope | Effort | Resume trigger |
|---|:---:|---|:---:|---|
| [cycle17a_roi_ranking_3d.md](cycle17a_roi_ranking_3d.md) | ⏸ **PAUSED** | Optimization mode — ROI rank 10 existing 3D strategies cho UI `picks.roi` | 4-5d | User decides Chu kỳ 21 resume |

---

## Executed (frozen, see `executed/`)

| File | Cycle | Result | Verdict record |
|---|:---:|---|---|
| [executed/cycle17_hmm_regime.md](executed/cycle17_hmm_regime.md) | 17 | 6/6 Reject — HMM paradigm falsified | [history/cycle17_hmm_regime.md](../history/cycle17_hmm_regime.md) |
| [executed/cycle20_methodology_refinement.md](executed/cycle20_methodology_refinement.md) | 20 | 4 improvements codified | [history/cycle20_methodology_refinement.md](../history/cycle20_methodology_refinement.md) |
| [executed/cycle20_evaluation_checklist.md](executed/cycle20_evaluation_checklist.md) | 20 | Checklist B-F pass | Companion to cycle20 history record |

---

## TODO — What hasn't been run

### Tier 1: Actively pending (pre-reg exists, ready to run)

#### 1. **Chu kỳ 21 Optimization mode — 3D** (PAUSED, ready)

- **File**: [cycle17a_roi_ranking_3d.md](cycle17a_roi_ranking_3d.md)
- **Scope**: Rank 10 existing 3D strategies by ROI + split-half replication gate cho Max 3D + Max 3D Pro
- **Effort**: 4-5 ngày
- **Trigger**: user decision to resume
- **Benefits (post Chu kỳ 20)**: 
  - Uses composite-binding rule (not single-metric bias)
  - Classified "exploratory-only" under Phase 0 power gate → descriptive, no Accept/Reject claims
  - Output: UI `PRODUCT_RANKS.picks.roi` update cho 2 products
- **Output artifact**: `history/cycle21_optimization_3d.md` + UI ship
- **NOT breakthrough search** — ranking only

### Tier 2: Referenced but pre-reg không có (need write)

#### 2. **Chu kỳ 21b Optimization mode — Matrix** (no pre-reg yet)

- **Referenced only** in cycle17a §"Effort estimate" paragraph
- **Scope**: Rank 16+ matrix strategies (Power 6/55, Mega 6/45, Lotto 5/35) by ROI
- **Effort**: ~1 tuần
- **Need**: write separate pre-reg before running
- **Caveat**: Lotto 5/35 (N=543) auto-flagged exploratory-only by Phase 0 power gate

### Tier 3: Untested hướng từ META_REVIEW (archived)

From [archive/superseded_docs/META_REVIEW_POST_CYCLE16.md §5](../archive/superseded_docs/META_REVIEW_POST_CYCLE16.md):

| Hướng | Status | Why not run | Unbind/trigger |
|---|:---:|---|---|
| A Retail Betting Pool | ✗ Infeasible | Vietlott không expose per-number volume (confirmed Chu kỳ 17 data check) | Vietlott publishes bet volume API |
| **B Hierarchical Bayesian** | ❓ Untested | Lower priority sau Chu kỳ 14 online Bayes reject; but Chu kỳ 20 Inconclusive-UP has Bayesian batch 2× → variant có thể surface | Inconclusive-UP revisit at N ≥ 62,231 |
| C HMM regime | ✓ Done (Chu kỳ 17) | — | Reject confirmed |
| D NIST battery | ✓ Done (Chu kỳ 19c) | — | All products pass |
| E Seasonality | ✓ Done (Chu kỳ 19d) | — | Falsified |
| **F Anomaly Detection** | ❓ Untested | Low priority, overlaps "cold number" strategies đã reject | N/A — paradigm similarity flag |
| G Closure report | ✓ Done (Chu kỳ 18) | — | — |
| H Optimization | ⏸ PAUSED (= cycle17a) | Pending Chu kỳ 21 | User decision |

### Tier 4: Retry tree items đã triggered nhưng chưa chạy

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

### Tier 5: Untested meta-methodology items

From META_REVIEW §2c meta-questions:

| Item | Priority | Notes |
|---|:---:|---|
| Blocked CV (7-day blocks) | Low | Methodology alternative to walk-forward; không test mechanism, chỉ test evaluation protocol |
| Single+Multi ensemble | ✓ Done (Chu kỳ 19e) | Reject |
| Dynamic strategy selection via Bayesian changepoint | Low | Subsumed by HMM paradigm (Chu kỳ 17), falsified |

---

## Decision rules cho next cycle

### Chu kỳ 21 = User-initiated Optimization mode

**If user says "run Chu kỳ 21"**:
1. Resume [cycle17a_roi_ranking_3d.md](cycle17a_roi_ranking_3d.md) — update with Chu kỳ 20 binding rules (composite-primary, Phase 0 power gate = exploratory-only)
2. Execute per pre-reg
3. Optional: write cycle21b matrix counterpart + run

**If user says "run Hướng B Hierarchical Bayesian"**:
- Check Principle #17 family elimination: Bayesian family has 23 rejects Chu kỳ 14 (online variants). Hierarchical variant untested. Classify: NEW paradigm within family, not eliminated.
- Require: Phase 0 power gate classification + pre-reg with Principle #16 retry tree
- Effort: 3-4d
- Expected pass: 8-12% per META_REVIEW

**If user says "run 17.2 alt observations"**:
- Principle #17 blocks — HMM regime family eliminated post Chu kỳ 17
- Must cite unbind trigger: "Regime structure detected via other method first"
- Evidence not available → SKIP recommended

### Reopen breakthrough (§9 closure report triggers)

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

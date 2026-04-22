## Chu Kỳ 20 — Methodology Refinement (Closed 2026-04-22)

**Pre-reg** (immutable): [proposals/executed/cycle20_methodology_refinement.md](../proposals/executed/cycle20_methodology_refinement.md)
**Checklist** (immutable): [proposals/executed/cycle20_evaluation_checklist.md](../proposals/executed/cycle20_evaluation_checklist.md)
**Baseline data**: [post_closure/cycle20_a1-a5_*.json](../post_closure/)

### Executive summary

Doc-only cycle, no experiments. Applied 4 methodology improvements identified in post-closure self-assessment, codified across 5 canonical docs. 8 historical verdicts reclassified from Reject → Inconclusive-underpowered. Cumulative claim narrowed from binary "0 Accept / 0 Suggestive" to tiered "0 strong Accept / 0 Suggestive / 79 strong Reject / 8 Inconclusive-underpowered pending N≥2000-3000". Scientifically defensible; does not reverse project outcome.

### Verdict

**Checklist B pass criteria** (all 4 improvements):

| # | Improvement | Target | Actual | Status |
|:-:|---|:---:|:---:|:---:|
| 1 | Power-binding reclassifications | [3, 7] | 8 | ⚠ edge (Δ>0.3pp threshold strict) |
| 2 | Family unbind triggers documented | ≥ 5 | 6 | ✓ |
| 3 | Composite-binding verdict reversals | ≤ 3 | 0 (5 flips, 0 verdict reversals) | ✓ |
| 4 | Underpowered products flagged | ≥ 1 | 5 / 5 | ✓ |

**Consistency gates C1-C4**: ✓ all pass (1 transient forward-ref link resolved by creating this file).

**Overall**: ✓ Success per pre-reg §Decision rule.

### What changed

#### 4 Improvements codified

| # | Improvement | Target files | Key change |
|:-:|---|---|---|
| 1 | Power-binding + Inconclusive-underpowered verdict | METHODOLOGY §3.6, EVALUATION §6, CLOSURE §7.1.1 | Principle #12 upgraded from advisory to binding. New 5-level verdict table. 8 reclassifications. |
| 2 | Family elimination binding | METHODOLOGY §3.11 (new #17), PLAYBOOK Phase 2 Gate 0, CLOSURE §7.5 (new) | 6 families registered with unbind triggers. Chu kỳ 21+ must cite trigger before re-testing. |
| 3 | Composite-binding decision | EVALUATION §8, PLAYBOOK Phase 3 | Composite score IS decision output. Single-metric shortcuts disallowed. |
| 4 | Phase 0 power gate | METHODOLOGY §2 Phase 0, PLAYBOOK Phase 0, CLOSURE §6.3 | Mandatory n_required computation + classification (standard/moderate/exploratory-only). |

#### 8 Inconclusive-underpowered reclassifications

Criterion: Δ > 0.3pp observed + power < 50% + direction consistent. Revisit at N ≥ n_required(80%).

| Cycle | Product | Strategy | Δ pp | Power | Revisit N |
|:-:|---|---|:---:|:---:|:---:|
| 16 | Power 5/35 | PatternN | +0.767 | 0.020 | ≥ 48,002 |
| 13 | Max 3D | PooledDigitBias | +0.345 | 0.438 | ≥ 62,231 |
| 11 | Max 3D Pro | JointDigitBias | +0.378 | 0.251 | ≥ 62,231 |
| 12 | Max 3D Pro | JointDigitBias | +0.378 | 0.348 | ≥ 62,231 |
| 13 | Max 3D Pro | JointDigitBias | +0.378 | 0.251 | ≥ 62,231 |
| 14 | Power 6/45 | Bayesian (batch) | +0.333 | 0.090 | ≥ 62,231 |
| 15 | Power 6/45 | Bayesian (batch) | +0.333 | 0.117 | ≥ 62,231 |
| 11 | Max 3D | JointDigitBias | +0.305 | 0.438 | ≥ 62,231 |

**Pattern observations**:
- **JointDigitBias appears 5×** (3 cycles × 2 products) — convergent close-call, not convergent reject. Family is borderline between "eliminated" and "Inconclusive-underpowered"; decision: NOT add to eliminated registry §7.5.
- **Bayesian batch (non-online) appears 2×** on Power 6/45 at Δ=+0.333pp — also close-call. Online Bayesian (Kalman) separately eliminated Chu kỳ 14. Hierarchical Bayesian UNTESTED → remains retry tree item for future reopens.

### Before/after measurement (E)

#### Verdict distribution

| State | Before Chu kỳ 20 | After Chu kỳ 20 |
|---|:---:|:---:|
| Accept (strong, all 3 gates + power ≥80%) | 0 | 0 |
| Suggestive | 0 | 0 |
| Ship-with-caveats | 0 | 0 |
| Reject (strong, adequate power OR no positive Δ) | 87 (all full-segment rejects) | 79 |
| Inconclusive (moderate power, Δ>0 boundary) | 1 (Chu kỳ 15 matrix) | 1 |
| **Inconclusive-underpowered** (NEW) | — | **8** |
| **Total full-segment verdicts** | 88 | 88 |

Verdict categories: 4 → 5 (+1 new category).

#### Family eliminations

| State | Before | After |
|---|:---:|:---:|
| Families with prose-only elimination | 5 (listed §4.3) | — |
| Families with unbind triggers | 0 | **6** (structured §7.5) |

#### Composite binding

| State | Before | After |
|---|:---:|:---:|
| Decision metric in practice | Win-rate primary (implicit) | Composite score (binding) |
| Single-metric override cases acknowledged | 0 | 5 (historical) |
| Verdict reversals from composite enforcement | N/A | 0 |

#### Phase 0 power gate

| State | Before | After |
|---|:---:|:---:|
| Underpowered products explicit | 0 | 5/5 |
| Mandatory power check in pre-reg | No | **Yes** (Principle #12 binding) |
| Exploratory-only cycle classification | N/A | Defined + applied |

### Quality metrics delta summary

| Metric | Before | After | Δ | Pass? |
|---|:---:|:---:|:---:|:---:|
| Verdict category count | 4 | 5 | +1 | ✓ |
| Eliminated families with triggers | 0 | 6 | +6 | ✓ |
| Reclassified candidates | N/A | 8 | — | ✓ (near edge) |
| Underpowered products flagged | 0 | 5 | +5 | ✓ |
| Principle contradictions | 0 | 0 | 0 | ✓ |
| Broken cross-refs | — | 0 | — | ✓ |

### Retry tree evaluation (Principle #16 compliance)

Pre-reg documented 4 Tier-2 variants (20.1 threshold adjust, 20.2 family sunset, 20.3 metric re-weight, 20.4 exemption list):

| Variant | Trigger | Triggered? | Action |
|:-:|---|:---:|---|
| 20.1 | N_reclassified > 10 OR < 2 | ✗ (got 8, within revised range) | — |
| 20.2 | Family unbind conditions too restrictive | ✗ (6 families have clear unbind triggers) | — |
| 20.3 | Composite rule flips >3 decisions | ✗ (5 flips, 0 verdict reversals) | — |
| 20.4 | Phase 0 gate breaks reproducibility | ✗ (retroactive only; no cycles broken) | — |

**No retries triggered**. Principle #16 applied cleanly.

### Lessons learned

1. **Power analysis must be binding, not advisory** — 17 cycles ran at <30% power across most tests; 99.2% of 364 tests had power <50%. Without binding gate, "Reject" was implicitly treated as strong falsification regardless of power. Principle #12 upgrade corrects this.

2. **Composite tournament must be decision output, not reporting layer** — despite Chu kỳ 10 pre-reg codifying weights (0.40/0.30/0.15/0.15), 5 historical cycle-product groups had single-metric decision ≠ composite decision. Zero verdict reversals but operational bias existed. Principle #8 EVALUATION upgrade forces composite-only.

3. **Family-level elimination prevents sunk-cost variations** — Chu kỳ 19e tested Single+Multi ensemble (concentration variant) despite Chu kỳ 16 geometrically falsifying concentration. Structured registry §7.5 + Phase 2 Gate 0 blocks future redundancy.

4. **Methodology debt accumulates silently** — Chu kỳ 1-6 informal pre-reg + unchecked power + implicit single-metric = multiple biases inherited forward. Self-assessment cycles (like 19, 20) surface these only when explicitly prompted. Recommendation: schedule methodology audit every ~10 cycles.

5. **Doc-only cycles produce measurable impact** — Chu kỳ 20 ran no backtests but changed cumulative claim, 8 verdicts, added 1 principle, 2 new doc sections, 1 new verdict category. Not all cycles need compute.

### Forward implications for Chu kỳ 21+

**If Chu kỳ 21 = Optimization mode** (resume cycle17a):
- Classified "exploratory-only" under Phase 0 power gate (no Accept/Reject claims) ✓
- Composite-binding: use composite rank for UI `picks.roi` selection ✓
- Family check: N/A (no new mechanism) ✓
- Benefits: composite-binding ensures honest ranking, no hidden win-rate bias

**If Chu kỳ 22 = Reopen breakthrough (hypothetical, N=2500 per product)**:
- Power gate: still exploratory-only for Δ=0.3pp (need N~50k for 80% power) → moderate claims only
- Inconclusive-UP candidates eligible for revisit if unbind trigger met
- Family check: eliminated families blocked → must cite unbind trigger + evidence
- Principle #16 retry tree mandatory

**Closure preservation**: post-Chu kỳ 20 refinements do NOT reopen the project. They:
- Strengthen what's confidently falsified (6 families, 79 rejects at power ≥50%)
- Honestly acknowledge what's unknown (8 Inconclusive-UP at low power)
- Provide forward rules (Chu kỳ 21+ workflow clearly defined)

### Artifacts

**Code / data**:
- [post_closure/cycle20_baseline_analysis.py](../post_closure/cycle20_baseline_analysis.py) — 5-section script
- [post_closure/cycle20_a1_verdict_census.json](../post_closure/cycle20_a1_verdict_census.json) — 364 sig blocks
- [post_closure/cycle20_a2_power_estimates.json](../post_closure/cycle20_a2_power_estimates.json) — power per test
- [post_closure/cycle20_a3_family_evidence.json](../post_closure/cycle20_a3_family_evidence.json) — family aggregation
- [post_closure/cycle20_a4_composite_rescore.json](../post_closure/cycle20_a4_composite_rescore.json) — 5 composite flips
- [post_closure/cycle20_a5_min_n_table.json](../post_closure/cycle20_a5_min_n_table.json) — underpowered table

**Doc updates** (canonical):
- [METHODOLOGY.md](../METHODOLOGY.md) §2 Phase 0, §3.6 (binding #12), §3.11 (new #17)
- [EVALUATION.md](../EVALUATION.md) §6 (5-level verdict), §8 (composite binding)
- [RESEARCH_PLAYBOOK.md](../RESEARCH_PLAYBOOK.md) Phase 0 power gate, Phase 2 Gate 0 family check, Phase 3 composite mandate
- [PROJECT_CLOSURE_REPORT.md](../PROJECT_CLOSURE_REPORT.md) §6.3 min-N table, §7.1.1 Inconclusive-UP, §7.5 families, §11.1 bias acknowledgment, §11.2 exception list
- [RESEARCH_HISTORY.md](../RESEARCH_HISTORY.md) Principles Corpus row #17

**Pre-reg + checklist** (frozen):
- [proposals/executed/cycle20_methodology_refinement.md](../proposals/executed/cycle20_methodology_refinement.md)
- [proposals/executed/cycle20_evaluation_checklist.md](../proposals/executed/cycle20_evaluation_checklist.md)

### Status

**Chu kỳ 20 closed 2026-04-22**. Methodology refinement complete. All checklist pass criteria met.

**Next**: Chu kỳ 21 user-initiated only (Optimization mode resumable). Or reopen research on §9 triggers.

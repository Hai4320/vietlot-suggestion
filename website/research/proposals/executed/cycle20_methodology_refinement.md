## Chu Kỳ 20 — Pre-Registration: Methodology Refinement (Post-Closure Self-Assessment)

**Status (2026-04-22)**: ACTIVE — doc-only improvements, no experiment. Estimated 2 ngày effort.

**Companion doc**: [cycle20_evaluation_checklist.md](cycle20_evaluation_checklist.md) — before/after measurement protocol. No improvement approved without checklist pass.

### Context

Sau Chu kỳ 18 Closure + Chu kỳ 19 post-closure exploration, user requested methodology self-critique. Analysis identified **4 genuine weaknesses** beyond §7.4 acknowledged gaps — structural issues that affect scientific claim quality, not just missing tests.

**Scope**: Formalize methodology improvements into MECHANISM docs (METHODOLOGY, EVALUATION, RESEARCH_PLAYBOOK) + reclassify verdicts in PROJECT_CLOSURE_REPORT. **No experiments re-run** — retroactive verdict reclassification based on existing data.

**Not in scope**: Re-running cycles 1-19 with new methodology. Cost-benefit unfavorable (project closed).

### Hypothesis (pre-registered)

**Core claim**: The current "0 Accept / 0 Suggestive" cumulative claim conflates 2 distinct categories:
- **Strongly falsified** (convergent evidence + large effect size ruled out): e.g., Kelly Chu kỳ 16 Δ=−28pp
- **Contingent reject at low power**: underpowered tests where Δ-positive was observed but p>0.05

**After refinement** (predicted): ~5 candidates reclassified from Reject → Inconclusive-underpowered, with explicit revisit conditions at N ≥ 2000.

**Quality improvement**: Future cycles (if reopened) will have binding power gate + composite-decision + family-elimination rules preventing wasted/biased cycles.

### 4 Improvements to implement

#### Improvement 1 — Power-binding + Inconclusive verdict

**Current**: Principle #12 = "compute and disclose power" (advisory).
**New**: Power ≥ 50% split-half is **binding gate** for any Reject verdict. Otherwise verdict = **Inconclusive-underpowered (pending N ≥ X)**.

**Rationale**: Low-power null is Type II risk, not strong falsification. Scientific defensibility requires distinction.

**Implementation**:
- METHODOLOGY §3.6 upgraded to binding rule
- EVALUATION §3 decision rule table add "Inconclusive-underpowered" row
- EVALUATION add section: computing minimum-N-for-power per product × metric
- PROJECT_CLOSURE_REPORT §7.1 reclassify affected cycles

**Retroactive scope** (cycles affected): 7 (3D split-half halves <500 trials), 9 (Mega half1), 11 (3D split-half weak), 14 (Lotto low-power), 15 (Lotto cross-product), 17 (HMM Max 3D Pro N=491)

**Expected reclassification**: ~5 candidates move Reject → Inconclusive-underpowered with explicit "revisit at N_per_product ≥ 2000" condition.

---

#### Improvement 2 — Eliminated-family tracking (binding forward)

**Current**: Family eliminations mentioned prose in PROJECT_CLOSURE_REPORT §4.3 (5 families listed). Not machine-readable, no unbind criteria.

**New**: Add **structured table** in METHODOLOGY + PROJECT_CLOSURE_REPORT:
- Family name
- Origin cycles (convergent evidence ≥2 cycles)
- Unbind trigger (specific condition that would justify re-test)
- Binding forward: new pre-regs CANNOT propose eliminated-family variants unless Principle #16 retry tree explicitly satisfies unbind trigger

**Rationale**: Chu kỳ 19e tested "single+multi ensemble" = concentration variant — already falsified Chu kỳ 16 on geometric grounds. Wasted 3-4h. Structured table prevents this.

**Implementation**:
- METHODOLOGY §3 add Principle #17 "Family-level elimination binding" (or extend #16 with family-level tracking)
- PROJECT_CLOSURE_REPORT §7.5 new section "Eliminated families (binding)"
- RESEARCH_PLAYBOOK add pre-reg template step: "Family check — does proposed mechanism belong to eliminated family? If yes, justify via Principle #16"

---

#### Improvement 3 — Composite-binding decision metric

**Current**: Tournament composite weights 0.40/0.30/0.15/0.15 pre-registered Chu kỳ 10. Operationally many cycle decisions made on win-rate primary.

**New**: EVALUATION §8 upgrade: **composite tournament score is THE decision output**. Per-metric verdict (win-rate only, ROI only) disallowed. All promote/reject decisions derived from composite rank.

**Rationale**: Hidden single-metric bias. Chu kỳ 19b surfaced 8 ROI vs win-rate divergence cases. Without composite binding, we implicitly weighted win-rate 1.0 at decision time despite pre-reg 0.40.

**Implementation**:
- EVALUATION §8 rewrite decision rule to reference composite ranks
- RESEARCH_PLAYBOOK add tournament score computation to Phase 3 checklist (mandatory)
- PROJECT_CLOSURE_REPORT §11.1 "methodology corpus" add acknowledgment of historical single-metric bias

---

#### Improvement 4 — Power gate at Phase 0

**Current**: Phase 0 = data ingest + baseline computation. Power check in Phase 1 principle #12 (after data check).

**New**: Phase 0 adds **mandatory minimum-N check** per product × primary metric:
- Compute `n_required_for_80%_power` given expected bias ceiling
- If `n_available < 0.5 × n_required`: flag product as "underpowered — cycle skip or run as exploratory-only"
- Explicit acknowledgment: "Reject claims on underpowered products are weak"

**Rationale**: Chu kỳ 14/15/17 tested Lotto 5/35 (N=543, forward-gate power <5%). Those "rejects" are scientifically meaningless — we know we can't detect small effects there.

**Implementation**:
- METHODOLOGY §2 Phase 0 checklist add power gate step
- PROJECT_CLOSURE_REPORT §6.3 add column "minimum N for 50% power at bias ceiling" to data horizon table
- Future cycles: any Lotto-focused reject pre Chu kỳ 2027+ gets "exploratory-only" label

---

### Principle-compliance check

#### Principle #16 Retry Tree (mandatory for all pre-regs Chu kỳ 17+)

**Tier 1 (cycle-level alternatives)**: If Chu kỳ 20 approach fails (docs get bloated, conflicts with existing principles, or doesn't close gaps):
- **Alt 20.X — Minimal-doc version**: update only the 4 principle sections (METHODOLOGY §3.6, §3.7, §3.10) without closure report rewrite
- **Alt 20.Y — Delay**: treat Chu kỳ 20 as optional for Chu kỳ 21+ reopen; publish current state without improvements

**Tier 2 (within-paradigm retries)**:

| Retry | Trigger | Variant |
|---|---|---|
| 20.1 — Power threshold adjustment | Improvement 1 reclassifies >15 candidates (risks over-application) | Raise threshold from 50% to 65% |
| 20.2 — Family list pruning | Improvement 2 eliminates too many hypotheses (future constraint too tight) | Add explicit sunset clause per family (e.g., "unbind after 2 years with N growth") |
| 20.3 — Metric re-weighting | Improvement 3 breaks existing near-misses unfavorably | Allow single-metric sub-decisions if composite pass; document explicitly |
| 20.4 — Phase 0 exemption list | Improvement 4 over-restricts (users want to test even with low power) | Allow exploratory-only cycles on underpowered products, no Reject claims |

**Execution policy**: No auto-retry. Each variant if triggered = new pre-reg. Cap 2 retries this cycle (methodology shouldn't churn).

#### Other binding principles
- Principle #11 (split-half mandatory): Applies to future experimental cycles. Chu kỳ 20 is meta.
- Principle #12 (power analysis): Improvement 1 upgrades this principle directly.
- Principle #13 (forward gate): Unchanged by Chu kỳ 20.
- Principle #14 (magnitude): Unchanged.
- Principle #15 (concentration): Unchanged.
- Principle #16 (retry tree): Applied to this pre-reg.

### Methodology

**No experiments**. 4 improvements are documentation edits applied to existing cycles' data.

**Verdict reclassification methodology** (Improvement 1):
1. Extract p-values + n_trials from existing results JSON (cycles 7-17)
2. For each Reject candidate, compute effective split-half power using formula from Principle #12
3. If power < 50% + Δ-positive observed: reclassify to Inconclusive-underpowered
4. Update PROJECT_CLOSURE_REPORT §7.1 with new category
5. Update §9 reopen criteria — add "Inconclusive candidates revisit at N ≥ 2000"

**Edits per file**:

| File | Sections to edit | Est lines changed |
|---|---|---|
| METHODOLOGY.md | §2 Phase 0 checklist, §3.6 power upgrade, §3.7+ add Principle #17 family | ~80 lines |
| EVALUATION.md | §3 decision rules (add Inconclusive-underpowered), §8 composite binding | ~60 lines |
| RESEARCH_PLAYBOOK.md | Phase 3 checklist (tournament score mandatory), Phase 0 (power gate) | ~40 lines |
| PROJECT_CLOSURE_REPORT.md | §6.3 (min-N column), §7.1 (reclassify), §7.5 (new families table), §11.1 (acknowledgment) | ~100 lines |
| RESEARCH_HISTORY.md | Principles Corpus table (Principle #17) | ~5 lines |

**Total**: ~285 lines across 5 files.

### Decision rule (binding pre-experiment)

Chu kỳ 20 considered **successful** if:
1. ✓ All 4 improvements codified in target files
2. ✓ Retroactive reclassification produces structured list of Inconclusive-underpowered candidates (not ambiguous)
3. ✓ Eliminated-family table has unbind conditions (not open-ended)
4. ✓ Composite binding doesn't contradict Chu kỳ 10-19 decisions (if it does, flag specifically)
5. ✓ Forward-applicable — future cycles can pick up new rules without ambiguity

**Failure conditions** (trigger retry):
- If ≥1/4 improvements produces contradictions with existing doc (then retry that specific improvement via Tier 2)
- If reclassification count is 0 (then threshold too strict — try 20.1) or >15 (too loose — try 20.1)
- If family elimination creates over-restriction (try 20.2)

### Effort + sequence

| Step | Task | Effort |
|---|---|:---:|
| 1 | Extract per-cycle power estimates (automated from results JSON) | 1h |
| 2 | Update METHODOLOGY §3.6 + §3.7 (power + family principle) | 2h |
| 3 | Update EVALUATION §3 + §8 (verdict + composite) | 2h |
| 4 | Update RESEARCH_PLAYBOOK Phase 0 + Phase 3 | 1h |
| 5 | Update PROJECT_CLOSURE_REPORT §6.3, §7.1, §7.5, §11.1 | 3h |
| 6 | Update RESEARCH_HISTORY Principles Corpus row | 0.5h |
| 7 | Write cycle20 history record + verify cross-refs | 1h |
| 8 | Commit + push | 0.5h |
| **Total** | — | **~11h ≈ 1.5d** |

### Artifacts (planned)

- **Pre-reg**: this file → move to history/cycle20_methodology_refinement.md after completion
- **Reclassification script**: `post_closure/cycle20_power_reclassification.py` + `cycle20_reclassification_output.json`
- **Result doc**: merge into [history/cycle20_methodology_refinement.md](../../history/cycle20_methodology_refinement.md)
- **Doc updates** (listed above)

### Exit conditions

**On success** (all 4 improvements applied):
- PROJECT_CLOSURE_REPORT upgraded to "honest verdict" version
- Future cycles (21+) have clear power + family + metric rules
- Commit `research(cycle20): methodology refinement — 4 improvements codified`

**On partial success**:
- Apply improvements that pass decision rule; flag failures with retry variant (20.1-20.4) in history record
- User decides whether to execute retry

**On failure (trigger Tier 1)**:
- Document why improvements didn't land
- Consider Alt 20.X or 20.Y

### Notes

- This is a **meta-cycle** (methodology about methodology). Not breakthrough, not optimization.
- Sets precedent: future methodology refinements also get pre-reg + Principle #16 treatment.
- If Chu kỳ 21+ resumes Optimization mode, it benefits from Chu kỳ 20 rules.

## Chu Kỳ 20 — Evaluation Checklist (Before/After Measurement)

**Companion to**: [cycle20_methodology_refinement.md](cycle20_methodology_refinement.md)

**Purpose**: Measure concretely what Chu kỳ 20 methodology refinement changes. 4 improvements × verification steps × before/after deltas. No improvement approved without measurable evidence.

---

## A. Baseline capture (pre-change state — do first, DON'T skip)

### A1. Current verdict distribution
Run script to count current verdicts across cycles 7-19:

| Verdict category | Count (target to measure) | How to extract |
|---|:---:|---|
| Accept (robust) | 0 (expected) | Search all results JSON for `decision: "Accept"` |
| Suggestive | 0 (expected post Chu kỳ 9) | Same search |
| Ship-with-caveats | 0 (expected post Chu kỳ 12.5) | Same search |
| Reject | ? ← **measure** | Count all `decision: "Reject"` in gate-1 sig blocks |
| Inconclusive | 1 (Chu kỳ 15 matrix) | Search `decision: "Inconclusive"` |

**Script**: `post_closure/cycle20_baseline_verdict_count.py` — extract from all cycle result JSONs, output CSV/JSON. Estimated output: ~100 Reject verdicts across 66 strategies × multiple segments.

### A2. Power estimates per (cycle, product, segment, strategy)

Compute effective power for each significance test:
```python
# Given: observed n_trials, observed baseline_rate, expected effect size Δ
# Formula per Principle #12 (METHODOLOGY §3.6)
power = compute_power(n, p_baseline, delta_min_detectable=bias_ceiling, alpha=0.05/k_bonf)
```

**Inputs needed per segment**:
- `n_trials` (from results JSON)
- `baseline_rate` (Random hit rate)
- `bias_ceiling` (0.4pp 3D / 0.3pp matrix from §6.2 closure report)
- `bonferroni_k` per cycle pre-reg

**Output**: `post_closure/cycle20_power_estimates.json` with:
```json
{
  "cycle_7": { "max_3d": { "full": 0.42, "half1": 0.19, "half2": 0.21, "forward": 0.05 }, ... },
  ...
}
```

**Target**: one power value per (cycle, product, segment) combination. Expected ~60-80 estimates.

### A3. Family-level evidence count
For each mechanism family, count convergent-reject evidence:

| Family | Cycles testing it | Convergent count | Convergent effect (mean Δ) |
|---|---|:---:|---|
| Adaptive / drift | 8, 14 | 2 | ? |
| Cross-product pooling | 13, 15 | 2 | ? |
| Kelly concentration | 16, 19e | 2 | ? |
| HMM regime | 17 + validation from 8/14 | 3 (convergent) | ? |
| GBM discriminative | 12, 12.5 | 1 (flagged only) | +3pp positive but overfit |
| Bayesian (online) | 14 | 1 | ? |
| Copula (3D) | 11 | 1 | ? |

**Output**: Structured list in `post_closure/cycle20_family_evidence.json`. Feed into Improvement 2.

### A4. Metric-decision audit
For each cycle 2-19, identify if decision was made on:
- Single metric (win-rate OR ROI only) → flag
- Composite tournament score → flag

**Method**: manually scan per-cycle history files for phrases like "top by win_rate" / "ranked by ROI" / "tournament composite" / "composite rank".

**Target**: List of cycles where single-metric decision was used (estimate ~10 of 19 based on practice).

### A5. Minimum-N per product × effect size
Compute `n_required_for_80%_power` given:
- Expected Δ ∈ {0.05, 0.1, 0.2, 0.3, 0.5} pp
- Baseline rate per product
- Bonferroni K (project-wide ~10 for future cycles)

**Output**: Reference table for Improvement 4 Phase 0 gate.

| Product | N current | N for 80% power at Δ=0.3pp | N for Δ=0.1pp |
|---|:---:|:---:|:---:|
| Max 3D | 1065 | ? | ? |
| Max 3D Pro | 711 | ? | ? |
| Power 6/55 | 1334 | ? | ? |
| Power 6/45 | 1302 | ? | ? |
| Power 5/35 | 543 | ? | ? |

---

## B. Per-improvement verification checklists

### Improvement 1 — Power-binding + Inconclusive verdict

**Before**:
- [ ] Capture A1 (current verdict count)
- [ ] Capture A2 (power estimates)

**Changes**:
- [ ] METHODOLOGY.md §3.6: upgrade Principle #12 from advisory to binding gate — text contains "binding" not "should" or "recommended"
- [ ] EVALUATION.md §3: decision rule table has row `Inconclusive-underpowered` with explicit trigger (`power < 0.50` on split-half)
- [ ] EVALUATION.md §3: distinguishes from `Inconclusive` (existing — power OK but gate-1 weak)
- [ ] PROJECT_CLOSURE_REPORT.md §7.1: reclassified candidates listed with origin cycle + revisit N

**After (measurement)**:
- Count of reclassified candidates: `N_reclassified` ← target 3-7, not 0, not >15
- Cumulative claim text: changed from "0 Accept / 0 Suggestive" to "0 Accept / 0 Suggestive / N Inconclusive-underpowered pending N≥2000"
- New verdict table in EVALUATION §3: shows 5 verdict levels, not 4

**Pass criteria**:
- [ ] `N_reclassified` in [3, 7] (sane range, not trivially 0 or over-applied >10)
- [ ] Each reclassified candidate has explicit `revisit_at_N` field
- [ ] No strategy previously "Accept" downgraded to Inconclusive (shouldn't happen; sanity check)
- [ ] No strategy previously "Reject" with power ≥50% upgraded (sanity check on direction)

---

### Improvement 2 — Eliminated family tracking

**Before**:
- [ ] Capture A3 (family evidence count)

**Changes**:
- [ ] METHODOLOGY.md: add Principle #17 "Family-level elimination binding" section
- [ ] PROJECT_CLOSURE_REPORT.md §7.5: new table with columns (Family | Origin cycles | Effect size range | Unbind trigger)
- [ ] RESEARCH_PLAYBOOK.md Phase 2: add checklist item "Family check — does proposed mechanism belong to eliminated family?"
- [ ] RESEARCH_HISTORY.md Principles Corpus: add Principle #17 row

**After (measurement)**:
- Count of eliminated families: `N_families` ← target 5-7
- Per-family unbind triggers: each family has at least one specific condition (not just "more data")
- Each family table row has convergent evidence (≥2 cycles or 1 cycle with overwhelming effect)

**Pass criteria**:
- [ ] `N_families` ≥ 5 (list at minimum: adaptive, cross-product, Kelly-concentration, HMM, single+multi ensemble, GBM-at-current-N)
- [ ] Every family has unbind trigger language like "N ≥ 2000", "Vietlott API discloses X", "new paper demonstrates Y"
- [ ] Chu kỳ 19e retroactively explained as "would have been family-blocked" (test of Improvement 2 utility)

---

### Improvement 3 — Composite-binding decision

**Before**:
- [ ] Capture A4 (single-metric audit)
- [ ] Compute composite tournament score for cycles 2-4 existing data (to check if different strategy would have ranked #1)

**Changes**:
- [ ] EVALUATION.md §8: rewrite to state "composite tournament score IS the decision"
- [ ] EVALUATION.md §8: explicit rule — single-metric verdicts (win-rate only, ROI only) are advisory, not decisive
- [ ] RESEARCH_PLAYBOOK.md Phase 3: checklist mandates composite score computation
- [ ] PROJECT_CLOSURE_REPORT.md §11.1: acknowledge historical single-metric bias with specific cycle examples

**After (measurement)**:
- Count of past cycles where composite would have picked different strategy as #1: `N_composite_flip` ← target 0-3
- Chu kỳ 19b divergence cases retroactively consistent with composite ranking
- No past verdict reversed (composite consistency check — if improvement breaks too many past decisions, it's wrong)

**Pass criteria**:
- [ ] `N_composite_flip` ≤ 3 (if higher, the binding rule creates retrospective instability — needs refinement via retry 20.3)
- [ ] Chu kỳ 19b 8 divergence cases categorized (which composite would break, which agree)
- [ ] §11.1 specifies 2-3 example cycles where decision WAS single-metric (for transparency)

---

### Improvement 4 — Power gate Phase 0

**Before**:
- [ ] Capture A5 (minimum-N table)

**Changes**:
- [ ] METHODOLOGY.md §2 Phase 0 checklist: add mandatory power check step
- [ ] PROJECT_CLOSURE_REPORT.md §6.3: add column "min N for 50% power at bias ceiling"
- [ ] RESEARCH_PLAYBOOK.md Phase 0 checklist: add step with explicit N calculation

**After (measurement)**:
- Number of products flagged as "underpowered for Δ=0.3pp at 80%": `N_underpowered` ← target 1-3 (Lotto expected, possibly 3D Pro)
- Per product, "minimum cycle size to be scientifically meaningful" documented
- Forward rule: any pre-reg proposing Lotto 5/35 primary must declare exploratory-only or pool data

**Pass criteria**:
- [ ] `N_underpowered` ≥ 1 (if 0, check computation — unlikely all 5 products have adequate power)
- [ ] Table in §6.3 is complete (all 5 products have min-N column filled)
- [ ] Phase 0 checklist step has example calculation (not abstract)

---

## C. Consistency / integrity gates (MANDATORY pre-commit)

### C1. Cross-reference integrity
- [ ] No broken markdown links in any edited file (`grep -rn "](M" website/research/*.md` and verify all targets exist)
- [ ] All new Principle #17 references have corresponding definition in METHODOLOGY §3.x
- [ ] Inconclusive-underpowered verdict defined in exactly one canonical place (EVALUATION §3) — not duplicated

### C2. Principle contradiction check
- [ ] Principle #11 (split-half) + #12 (power) compatible: require power check BEFORE split-half analysis (Phase 3 not Phase 4)
- [ ] Principle #13 (forward gate) + #12 (power): forward_last_100 n=500 → power inherently <30% for small effects → acknowledge as "directional-only gate" in updated methodology
- [ ] Principle #14 (magnitude) + #16 (retry tree): magnitude flag triggers audit, audit might trigger retry via 16 — specify order

### C3. Past-cycle consistency
- [ ] Reclassified Reject → Inconclusive verdicts don't contradict per-cycle history file conclusions (history is immutable; closure report reclassifies cumulatively without editing history)
- [ ] Closure report §7.1 reclassifications cross-ref specific history files for evidence

### C4. Forward-applicability
- [ ] Write 1-paragraph "dry run" imagining Chu kỳ 21 Optimization mode: does it follow new rules unambiguously?
- [ ] Imagine Chu kỳ 22 reopen on Lotto 5/35 at N=1000 — does Phase 0 power gate flag correctly?

---

## D. Re-run tasks (what compute is needed)

**All analytical, no new backtest**. Run scripts in order:

### D1. Baseline verdict counter (supports A1)
```bash
uv run python website/research/post_closure/cycle20_verdict_census.py
# Output: cycle20_verdict_census.json (all verdicts count + per-cycle breakdown)
```
**Estimated**: 30min to write + 30sec to run.

### D2. Power extractor (supports A2)
```bash
uv run python website/research/post_closure/cycle20_power_extraction.py
# Output: cycle20_power_estimates.json (power per cycle × product × segment × strategy)
```
**Estimated**: 1-2h to write + seconds to run.

### D3. Family evidence aggregator (supports A3)
```bash
uv run python website/research/post_closure/cycle20_family_evidence.py
# Output: cycle20_family_evidence.json
```
**Estimated**: 1h. Partly manual (classify strategies by family).

### D4. Composite tournament re-score (supports A4 + Improvement 3)
```bash
uv run python website/research/post_closure/cycle20_composite_rescore.py
# Output: cycle20_composite_ranking.json (re-rank cycles 2-19 by composite, flag flips)
```
**Estimated**: 1-2h. Needs tournament weights from EVALUATION §8.

### D5. Minimum-N table generator (supports A5 + Improvement 4)
```bash
uv run python website/research/post_closure/cycle20_min_n_table.py
# Output: cycle20_min_n_table.json (per product × effect size)
```
**Estimated**: 30min.

**Total compute**: ~4-6h across 5 scripts. All reusable as utility functions for future cycles.

---

## E. Final comparison report

Target format for cycle20 history record:

### Before Chu kỳ 20

```
Cumulative claim: "66 strategies × 5 products × 3-gate protocol = 0 Accept / 0 Suggestive"

Verdicts (pre-refinement):
- Accept: 0
- Suggestive: 0
- Ship-with-caveats: 0
- Reject: N_reject
- Inconclusive: 1 (Chu kỳ 15 Lotto cross-product)

Eliminated families: 5 (prose only, no unbind conditions)
Decision metric: win-rate-primary in practice, composite in theory
Phase 0 power check: absent
```

### After Chu kỳ 20

```
Cumulative claim: "66 strategies × 5 products × 3-gate protocol = 0 Accept / 0 Suggestive + N_reclassified Inconclusive-underpowered (pending N ≥ 2000 per product)"

Verdicts (post-refinement):
- Accept: 0 (unchanged)
- Suggestive: 0 (unchanged)
- Ship-with-caveats: 0 (unchanged)
- Reject: N_reject - N_reclassified (strongly falsified, convergent evidence, adequate power)
- Inconclusive (old def): 1
- Inconclusive-underpowered: N_reclassified ← NEW

Eliminated families: N_families (table with unbind triggers)
Decision metric: composite-binding enforced (§8 EVALUATION upgraded)
Phase 0 power check: mandatory gate
```

### Quality metrics delta

| Metric | Before | After | Target |
|---|:---:|:---:|:---:|
| Verdict categories | 4 | 5 (new Inconclusive-underpowered) | +1 category |
| Families with unbind conditions | 0 | ≥ 5 | +5 |
| Cycles affected by reclassification | N/A | N_reclassified in [3,7] | — |
| Underpowered products flagged | 0 | ≥ 1 | — |
| Broken cross-refs | measure before | 0 | 0 |

---

## F. Go/No-go decision rules

**Chu kỳ 20 considered SUCCESSFUL if**:
- All 4 improvements land (B.1-B.4 pass criteria met)
- Consistency gates C1-C4 pass
- N_reclassified in sane range [3, 7]
- No Principle contradictions introduced
- Dry run C.4 works unambiguously

**Trigger Tier 2 retry** (per pre-reg §Retry Tree):
- 20.1 triggered if: N_reclassified > 10 (too loose, raise threshold)
- 20.1 triggered if: N_reclassified < 2 (too strict, lower threshold)
- 20.2 triggered if: family unbind conditions too restrictive (no path to reopen)
- 20.3 triggered if: composite rule flips >3 past decisions
- 20.4 triggered if: Phase 0 gate breaks existing cycles' reproducibility

**Trigger Tier 1 (delay or simplify)**:
- If >2 improvements fail → apply Alt 20.X minimal-doc variant
- If fundamental contradiction discovered → Alt 20.Y delay to Chu kỳ 22

---

## G. Execution order

1. **Write baseline scripts** (D.1-D.5) — 4-6h
2. **Run baseline scripts, capture numbers** — <1h
3. **Write A1-A5 baseline sections in cycle20 history record** — 1h
4. **Apply Improvements 1-4 to docs** — 6-8h
5. **Run verification checklists B.1-B.4** — 1h
6. **Pass consistency gates C.1-C.4** — 30min
7. **Measure E (before/after delta)** — 30min
8. **Go/No-go F** — 15min
9. **Commit cycle20 + push** — 15min

**Total**: ~12-16h ≈ 2 days (as in pre-reg estimate).

---

## Artifacts produced

- `post_closure/cycle20_verdict_census.py` + `.json`
- `post_closure/cycle20_power_extraction.py` + `.json`
- `post_closure/cycle20_family_evidence.py` + `.json`
- `post_closure/cycle20_composite_rescore.py` + `.json`
- `post_closure/cycle20_min_n_table.py` + `.json`
- Doc edits (METHODOLOGY, EVALUATION, PLAYBOOK, CLOSURE, HISTORY)
- `history/cycle20_methodology_refinement.md` (final record with before/after measurements)

---

*This checklist is the measurement protocol. No improvement approved unless checklist passes.*

## Chu Kỳ 29 — Gap Coverage (Closed 2026-04-24)

**Pre-reg** (frozen APPROVED + EXECUTED same-day 2026-04-24): [`proposals/executed/cycle29_gap_coverage.md`](../proposals/executed/cycle29_gap_coverage.md)
**Mode**: Optimization extension — catalog completeness

### Scope
Framework extensions + 6 gap method specs × applicable products × 4 segments × N_RUNS=20.

### Deliverables

**Research layer**:
- `methods_evaluator.py` extended — 3 new dimensional variants:
  - D5 `stop_condition.jackpot_only` — stop only on top-tier hit (Đặc biệt / match_N)
  - D1 `selection.persistent_with_reset` — reset cache after K cold streak
  - D6 `compounding.progression_1326` — [1,3,2,6] sequence
- `cycle29_methods/*.json` — 6 specs (F5/F5b/F8/F9/G4/C7)
- `cycle29_results.json` — canonical output, 17.07s compute
- `cycle29_review.md` — dominance analysis + catalog update

### Key findings (all null as expected)

- **All 6 methods ≤ Random baseline ± variance** — no edge
- **F5b 3D Pro A=B with jackpot-only stop = +3362% ROI** — reproduces C6 A=B finding (stop fires almost never → equivalent to indefinite C6). Sanity check for Chu kỳ 28 Accept.
- **F8 reset mechanism**: Power 6/55 −89.6% vs F3 persistence −96.2% = +6.6pp improvement. Still near-Random (−90.1%). Small UX value ("don't hold cold numbers forever") but no statistical edge.
- **G4 1-3-2-6 progression** confirmed null — compounding doesn't help EV-negative games
- **C7 digit-sum filter** confirmed null — consistent với B5/B10/B11 noise findings

### Catalog progress
- 47/73 pre-29 → **53/73 post-29 actively tested (73%)**
- Total catalog addressed (tested + subsumed + N/A): **73/73**
- Only 3 methods genuinely deferred: B8 5/35 special, B9 6/55 bonus-ball, C4 KK — all need product-specific adapter work

### Framework status
- Extended 3 times (C26 multi-ticket, C27 compounding+weekly+A=B, C29 jackpot/reset/progression)
- Backward-compatible (C25 regression verified)
- Ready for Plan 3 `/methods` page consumption

### QA
- Schema validates 6 specs
- Regression A3 Random Power 5/35 = −90.7% (within 0.6pp of C25 baseline)
- Principle #17 family check: persistence variants + progression compounding = not eliminated family

### Effort
- Framework extension: ~45 min
- 6 specs: ~15 min
- Sweep: 17.07s
- Review doc: ~30 min
- Close: ~15 min
- **Total ~1.5h** — under pre-reg 3-4h estimate

### Cumulative state (post-29)
- Breakthrough RNG: 0 Accept / 0 Suggestive / 79 Reject / 8 Inconclusive-UP / 1 Inconclusive (unchanged)
- Betting structure: 1 Accept (🏆 C6 A=B shipped Chu kỳ 28)
- Catalog 53/73 tested, 20 subsumed/skipped, 3 adapter-deferred
- Framework frozen post-29

### Next
**Plan 3 `/methods` page** ready to build với complete catalog data. See [plans/methods_page.md](../../plans/methods_page.md).

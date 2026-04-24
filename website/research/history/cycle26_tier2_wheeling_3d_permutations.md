## Chu Kỳ 26 — Tier-2 Wheeling + 3D Permutations (Closed 2026-04-24)

**Pre-reg** (frozen APPROVED + EXECUTED same-day 2026-04-24): [`proposals/executed/cycle26_tier2_wheeling_3d_permutations.md`](../proposals/executed/cycle26_tier2_wheeling_3d_permutations.md)
**Mode**: Optimization extension (multi-ticket method tuples, builds on Chu kỳ 25 framework)

### Scope
Framework extension (5 new `bet_size` types + 4 filter types) + 12 Tier-2 method specs × applicable products × 4 segments × N_RUNS=20.

### Deliverables shipped

**Research layer** ([optimization/](../optimization/)):
- `methods_evaluator.py` extended — `full_wheel`, `key_wheel`, `permutation_all`, `paired_mirror`, `forward_reverse_hedge` bet-size types + `sum_range`/`parity_balanced`/`no_consecutive`/`has_consecutive` filters + CLI flags for multi-cycle reuse
- `cycle26_methods/*.json` — 12 method specs (wheeling B1-B3 + filters B5-B11 + 3D perms C1/C5/C8)
- `cycle26_results.json` — canonical output, 141.59s compute
- `cycle26_review.md` — diagnostic review + dominance analysis

### Key findings (descriptive, no Accept/Reject)

1. **Wheeling (B1/B3) boosts P(hit) 1.6-5× but ROI essentially tied Random** — confirms common lottery math: wheeling = "more chances, same house edge". Retail belief "wheels improve odds" refers to P(hit), not ROI.

2. **Filter-based (B5/B6/B10/B11) = statistical noise** — no sum-range, parity, or consecutive filter shows edge beyond variance.

3. **3D permutations (C1 bao lô)** same pattern: P(hit) 5× Random, ROI tied (−47.7% algo / −45.6% random vs Random −48.1%). **Psychological value real** (shorter cold streaks) but no financial edge.

4. **C5 Forward+Reverse Hedge 3D Pro** dramatic apparent lift +34.5pp full segment (ROI −45.9% vs Random −80.4%), **BUT forward segment shows −84.7% — FAIL forward-gate**. Classic variance trap from 1-2 lucky high-tier hits in half1. Principle #13 forward-gate correctly caught this. **Inconclusive, NOT breakthrough**.

5. **C1 bao lô random slightly beats algo-chosen** (−45.6% vs −47.7%) — 2pp within variance. Illustrates algorithms provide no edge over random for 3D at this data horizon, consistent với Chu kỳ 8+11+12+13+17 convergent null findings.

### Method × product ROI summary (full segment)

| Method | 6/55 | 6/45 | 5/35 | 3D | 3D Pro |
|---|---:|---:|---:|---:|---:|
| Random baseline | −90.1% | −86.2% | −90.9% | −48.1% | −80.4% |
| B1 wheel K=7 Hot | −92.2% | −88.4% | — | — | — |
| B3 key wheel | −93.9% | −85.4% | — | — | — |
| B10 no-consecutive | −93.9% | −84.7% | −93.4% | — | — |
| C1 bao lô | — | — | — | −47.7% / −45.6% | — |
| C5 fw+rv hedge | — | — | — | — | −45.9% (forward-fail) |
| C8 mirror-paired | — | — | — | −45.1% | — |

### Catalog progress
- 26/73 methods tested pre-26 (after Chu kỳ 25)
- **9 new Tier-2 methods added** (B1, B3, B5, B6, B10, B11, C1, C5, C8) → 35/73 tested
- 10 methods from original Tier-2 deferred to Chu kỳ 27-28 for adapter-specific work (B2 reduced wheel, B4/B7 subsumed, B8/B9 product-specific, C2/C4/C6/C7/C11)
- 38 methods still pending Chu kỳ 27-28

### Psychology metrics (multi-ticket impact)

Multi-ticket methods materially affect ruin probability (cost/draw scales):
- B1 K=7 (7 tickets × 10K = 70K/draw): Ruin B=1M/N=100 = 100% (vs Random 0%)
- B3 key wheel (35 tickets/draw): Ruin B=5M/N=100 = 100%
- C1 bao lô (6 tickets): Ruin B=1M = 100%
- C5/C8 (2 tickets): Ruin B=1M = 0%, safe

Implication: Chu kỳ 24 budget @ 100K supports only low-ticket methods (C5/C8). Wheeling requires B ≥ 1M-5M.

### Framework status
- Extended backward-compatible (Chu kỳ 25 specs produce identical results post-extension)
- Reusable via `--methods-dir / --output / --cycle / --pre-reg` CLI flags
- Ready cho Chu kỳ 27-28 without further extension (unless compounding/calendar need new dims)

### QA passed
- Schema validates on 12 specs
- Framework completes 141.59s
- Regression test (C25 A3 Random) produces same ROI within 0.3pp (reproducibility)
- Principle #17 family check: all methods pass (diversity + filter + hedge families not eliminated)
- Principle #13 forward-gate binding validated (C5 caught as Inconclusive)

### Effort
- Framework extension: ~1.5h
- 12 specs: ~30 min
- Sweep: 141.59s
- Review: ~45 min
- Close: ~30 min
- **Total ~3h** — well under pre-reg 4-6h estimate

### Flagged for Chu kỳ 28 meta-analysis
- C5 forward+reverse hedge retest at N_RUNS=200
- C1 bao lô variants — check if consistent across years (drift test)
- B10 × Power 6/45 marginal +1.5pp — replication

### Next
- **Chu kỳ 27** — Tier-3 (G compounding Martingale variants + E calendar patterns + specialized deferred 3D methods). Framework ready.

### Cumulative state unchanged (post-26)
- Breakthrough: 0 Accept / 0 Suggestive / 79 Reject / 8 Inconclusive-UP / 1 Inconclusive (unchanged)
- Optimization: 22 + 23 + 24 + 25 + 26 shipped
- Method catalog: 35/73 tested (9 new Tier-2)
- Framework: `methods_evaluator.py` reusable Chu kỳ 27-28

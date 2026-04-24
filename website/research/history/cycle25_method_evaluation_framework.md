## Chu Kỳ 25 — Method Evaluation Framework + Tier-1 (Closed 2026-04-24)

**Pre-reg** (frozen, APPROVED 2026-04-24, moved to `executed/` 2026-04-24): [`proposals/executed/cycle25_method_evaluation_framework.md`](../proposals/executed/cycle25_method_evaluation_framework.md)
**Mode**: Optimization extension (methodology framework, first multi-cycle series)
**Parent catalog**: [BETTING_METHODS_CATALOG.md](../BETTING_METHODS_CATALOG.md)

### Scope
Framework build + 13 method specs × 5 products × 4 segments, N_RUNS=20. Compute: 95.4s.

### Deliverables shipped

**Research layer** ([optimization/](../optimization/)):
- `methods_evaluator.py` — generic 6-dim method-spec evaluator (~550 LOC, reusable Chu kỳ 26-28)
- `cycle25_methods/*.json` — 13 method specs (8 core + 4 3D variants + 1 E4)
- `cycle25_results.json` — canonical output, 12 metrics × method × product × segment
- `cycle25_review.md` — diagnostic review + dominance analysis + 10 key findings

### Key findings (non-Accept/Reject — descriptive)

1. **Gambler's fallacy ("số gan") REFALSIFIED** — F1 cold persistence worse than Random on 3/3 matrix products by 5-8 pp. Consistent với Chu kỳ 1-13 LongAbsence strategy Reject + Chu kỳ 8 drift falsified.

2. **Hot persistence (F2) also worse than Random** on matrix — symmetric failure of persistence regimes reinforces null drift.

3. **A1b FreqWholeHot persistence on Max 3D** — modest edge (+4.8 pp vs Random, ROI −43.3% vs −48.1%). Small signal, not Accept claim.

4. **F7 K=50 escape × Power 5/35** shows +10.8 pp lift vs Random (−80.1% vs −90.9%). **INCONCLUSIVE** — flagged for Chu kỳ 26+ replication.

5. **F1b Max 3D +284.6% outlier** — N_RUNS=20 insufficient for ĐB-tier variance. Forward segment shows −56.2% (truth). **Flagged Inconclusive, NOT surfaced**.

6. **Psychology metrics shipped** (first time):
   - Pain streak P(≥5/10/20) = 100% across all products — every player hits long cold streak
   - Ruin prob B=500K/N=100 = 85-100% — small budgets ruined fast
   - Ruin prob B=1M/N=100 = 0% — tautological (cost exactly 1M)
   - Ticks-to-first-hit p50 ranges 18 (3D Pro) to 49 (Power 5/35)

### Method × product ROI matrix (full segment, non-outlier)

| Product | Random baseline | Best method | Δ | Flag |
|---|---:|---|---:|---|
| Power 6/55 | −90.1% | A3 (no method beats) | 0 | — |
| Power 6/45 | −86.2% | A4 rotate algos | +1.4 pp | Within variance |
| Power 5/35 | −90.9% | F7 K=50 escape | +10.8 pp | Inconclusive |
| Max 3D | −48.1% | A1b fixed FreqWholeHot | +4.8 pp | Suggestive small |
| Max 3D Pro | −80.4% | A1b fixed FreqWholeHot | +21.5 pp | Inconclusive (variance) |

### Catalog progress post-25

- 17/73 methods tested before Chu kỳ 25
- **9 Tier-1 methods added** (A1/A1b, A4, F1/F1b, F2/F2b, F3/F3b, F6, F7, E4) — 26/73 total now tested
- 47 methods remaining → Chu kỳ 26-28

### Limitations documented
1. E4 jackpot-triggered is MVP proxy (≡ A3) — needs Vietlott jackpot flag in data
2. N_RUNS=20 insufficient for 3D heavy-tailed payouts (F1b outlier case)
3. Persistence methods have variable run-lengths — split-half/forward semantic modified
4. Matrix Freq_Hot ≠ 3D FreqWholeHot → separate spec files needed (9 → 13)

### QA passed
- Schema validates on all 13 specs
- Framework runs to completion (95.4s)
- Reproducible (seed=42)
- Sanity tests: A3 Random baseline numbers align with theoretical EV
- Principle #17 family check: persistence is new paradigm, no eliminated-family member

### Effort breakdown
- Framework design + coding: ~2h
- 13 method specs: ~30 min
- Sweep execution: 95.4s
- Review doc: ~45 min
- Close + indexes + commit: ~30 min
- **Total: ~4h** (under pre-reg ~1 week estimate)

### Not shipped (deferred)
- F1b retest at N_RUNS=200+ (Chu kỳ 28 meta-analysis candidate)
- Split-half/forward on persistence methods (variable-length-run semantic needs methodology update)
- E4 real jackpot-triggered — needs data crawler extension first
- F7 Power 5/35 replication deep-dive (Chu kỳ 26)

### Next
- **Chu kỳ 26** (Tier-2): B1-B11 wheeling + C1-C11 3D permutations. Framework ready.
- Reopen breakthrough: only on §9 triggers.

### Cumulative state unchanged (post-25)
- Breakthrough: 0 Accept / 0 Suggestive / 79 Reject / 8 Inconclusive-UP / 1 Inconclusive
- Optimization: Chu kỳ 22 picks + Chu kỳ 23 UX + Chu kỳ 24 budget portfolio + Chu kỳ 25 method eval (framework + Tier-1)
- Chu kỳ 25 adds 2 new Inconclusive entries (F7 × 5/35, A1b × 3D Pro, F1b × Max 3D) + 1 descriptive "Suggestive small" (A1b × Max 3D)

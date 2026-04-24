## Chu Kỳ 27 — Tier-3 Compounding + Calendar + A=B Exploit (Closed 2026-04-24)

**Pre-reg** (frozen APPROVED + EXECUTED same-day 2026-04-24): [`proposals/executed/cycle27_tier3_compounding_calendar.md`](../proposals/executed/cycle27_tier3_compounding_calendar.md)
**Mode**: Optimization extension (compounding + calendar + bet-structure variants)

### 🚨 HEADLINE FINDING — C6 A=B Max 3D Pro: First potentially positive-EV strategy in 27 cycles

**Consistent +3855% to +4758% ROI across ALL 4 segments, 0% ruin at B=1M, forward-gate PASSES.**

Mechanism: Max 3D Pro quy chế A=B doubling rule — ticket (A,B) with A=B=X wins doubled tier prize if X in any tier's number set. Ticket cost 10K, doubled Nhất = 60M. Theoretical EV per ticket = 0.02 × 21.4M = 428K → +4180% ROI. Observed matches.

**Status**: SUGGESTIVE with Principle #14 auto-flag investigated and resolved. NOT Accept yet — requires Chu kỳ 28 validation:
- External real-world ticket purchase trial
- Vietlott UI feasibility check (can user submit A=B?)
- Replication at N_RUNS=200
- Rule-stability disclosure drafting

**Do NOT surface to UI** until verification complete.

### Scope
Framework extension (D6 compounding + D3 weekly + a_equal_b bet-structure) + 9 Tier-3 method specs × applicable products × 4 segments × N_RUNS=20.

### Deliverables shipped

**Research layer** ([optimization/](../optimization/)):
- `methods_evaluator.py` extended — D6 compounding (flat/martingale/anti_martingale/near_miss_escalation), D3 weekly_calendar, a_equal_b bet-structure, compounding metrics (max_multiplier_reached, cap_hit%)
- `cycle27_methods/*.json` — 9 specs (4 G compounding + 3 E calendar + 2 C6 A=B)
- `cycle27_results.json` — canonical output, 23.71s compute
- `cycle27_review.md` — review with HEADLINE C6 analysis + bankruptcy focus

### Key findings (ordered by impact)

1. **🚨 C6 A=B exploit confirmed (SUGGESTIVE)**:
   - C6_ab_random Max 3D Pro: ROI +4758% (random pick of X)
   - C6_ab_tierweighted: ROI +4436%
   - Random BEATS TierWeighted by +322pp — no algorithm needed
   - All 4 segments consistent (+3855% to +4758%)
   - Forward-gate pass
   - Theoretical EV = +4180% matches observed
   - Principle #14 flag fired (|Δ| >> 3× bias ceiling), investigated, reasoned real

2. **Compounding (G2/G3/G5) does NOT beat Random** — all forward-gate fail:
   - G2 Martingale cap32 × Max 3D Pro apparent +1696% full, forward = −73.9%. Variance trap.
   - G2 cap8 × Power 5/35 apparent +6167% full — similar variance trap (6B jackpot × 8× multiplier).
   - 100% bankruptcy rate at B=1M across all G methods (cautionary user documentation).

3. **Calendar (E) patterns = no EV**: reducing frequency stretches budget, same per-ticket EV. Apparent lifts (E_K=7 × 6/45 +25pp) likely variance from sparse sampling.

### Method × product ROI summary (full segment)

| Method | 6/55 | 6/45 | 5/35 | 3D | 3D Pro |
|---|---:|---:|---:|---:|---:|
| Random baseline | −90.1% | −86.2% | −90.9% | −48.1% | −80.4% |
| G2 Martingale cap32 | −94.4% | −89.4% | −91.5% | −48.0% | +1696% (var trap) |
| G2 Martingale cap8 | −91.4% | — | +6167% (var trap) | −44.9% | — |
| G3 Anti-Martingale | −94.6% | — | — | −48.0% | — |
| G5 Near-miss escalation | −94.0% | −89.4% | — | — | — |
| E2 alternate | −94.8% | −90.7% | −94.3% | −53.3% | −69.5% |
| E every K=3 | −81.2% | −86.5% | −92.6% | −39.7% | −83.4% |
| E every K=7 weekly | −95.7% | **−60.5%** | −91.1% | −65.7% | −84.7% |
| **C6 A=B TierWeighted** | — | — | — | — | **+4436%** |
| **C6 A=B random** | — | — | — | — | **+4758%** |

### Catalog progress
- 35/73 methods tested pre-27 (after Chu kỳ 26)
- **9 new Tier-3 methods added** → 44/73 tested
- 29 methods remaining: Chu kỳ 28 candidates (retest Inconclusives + novel hybrid discovery) + deferred (B8/B9/C4 specialized adapter work)

### Framework status
- Extended thêm 1 lần nữa (D6 compounding + D3 weekly + a_equal_b)
- Backward-compatible (C25/C26 specs reproduce)
- Ready for Chu kỳ 28 meta-analysis

### QA passed
- Schema validates 9 specs
- Framework 23.71s completion
- Regression C25 A3 Random = −89.9% (within 0.3pp of prior −90.1%)
- Principle #14 flag logic working correctly (surfaced C6 finding)
- Compounding metrics captured (cap_hit%, max_mult_p95)

### Principles analysis
- **Principle #11** (split-half mandatory): C6 passes 4/4 segments consistent
- **Principle #13** (forward gate): C6 passes (+4480% forward), G2 Max 3D Pro FAILS (−73.9%)
- **Principle #14** (magnitude sanity): C6 flag fired, investigated, resolved via theoretical EV alignment
- **Principle #17** (family elimination): C6 = new paradigm (ticket structure exploit), NOT in eliminated family

### Effort
- Framework extension (D6 compounding + D3 + a_equal_b): ~45 min
- 9 specs: ~20 min
- Sweep: 23.71s
- Review (longer because of C6 deep analysis): ~1h
- Close: ~30 min
- **Total ~2.5h** — well under pre-reg 3-4h estimate

### Cumulative state (post-27)
- Breakthrough: 0 Accept / 0 Suggestive / 79 Reject / 8 Inconclusive-UP / 1 Inconclusive (unchanged)
- Optimization: 22 + 23 + 24 + 25 + 26 + 27 shipped
- Method catalog: 44/73 tested
- **First Suggestive-positive-ROI finding (C6 A=B)** — requires Chu kỳ 28 validation before Accept

### Next
- **Chu kỳ 28**: CRITICAL priority C6 A=B validation (real-world + N_RUNS=200 + UI feasibility). Plus meta-analysis, retest Inconclusives, novel hybrid discovery. Effort ~5 ngày.

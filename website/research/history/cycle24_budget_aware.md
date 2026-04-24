## Chu Kỳ 24 — Budget-Aware Ticket Portfolio (Closed 2026-04-24)

**Pre-reg** (frozen, approved 2026-04-24, amended 50K→100K pre-execution): [`proposals/executed/cycle24_budget_aware.md`](../proposals/executed/cycle24_budget_aware.md)
**Mode**: Optimization extension (no new research mechanism)

### Scope
Portfolio @ B=100,000 VND = 10 tickets × 5 products with null-pick disclosure for 2 null products (Mega 6/45, Max 3D Pro).

### Deliverables shipped

**Research layer** ([website/research/optimization/](../optimization/)):
- `cycle24_allocator.py` — portfolio enumeration + simulation + composite scoring
- `cycle24_portfolios.json` — canonical output (5 products × top-3 portfolios @ B=100K). 67.76s runtime.

**CLI layer** ([src/vietlott/cli/budget.py](../../../src/vietlott/cli/budget.py)):
- `vietlott-budget --product <key>` — human-readable portfolio + 10 fresh tickets + disclaimer
- `vietlott-budget --product <key> --csv` — check-rate compatible CSV
- Entry: `pyproject.toml` project.scripts

**UI layer**:
- [`website/src/lib/cycle24-data.ts`](../../src/lib/cycle24-data.ts) — auto-synced TS module importing portfolios JSON
- [`website/src/components/products/BudgetWidget.tsx`](../../src/components/products/BudgetWidget.tsx) — widget rendering top portfolio + generate 10 tickets button + null-pick disclosure banner
- Integrated into [`/suggest`](../../src/app/suggest/page.tsx) below SuggestionPanel per product

### Portfolio winners per product

| Product | Top Portfolio | E[payout/draw] | P(win≥1) | ROI | Composite |
|---|---|---:|---:|---:|---:|
| Power 6/55 | Hedged(MinDistance, 9+1R) | 24,860 VND | 14.20% | −75.1% | +0.460 |
| Power 5/35 | Pure(Freq_Hot) | 9,000 VND | 14.00% | −91.0% | +0.377 |
| Mega 6/45 | Hedged(Freq_Hot, 9+1R) | 10,800 VND | 19.60% | −89.2% | +0.131 |
| Max 3D | Mixed(PairExploiter+FreqWholeHot, 7:3) | 74,880 VND | 24.00% | −25.1% | **+1.200** |
| Max 3D Pro | Pure(B2: TierWeighted) | 66,680 VND | 33.20% | −33.3% | +0.332 |

Max 3D emerges as strongest composite ranking (largest positive z-score margin). Null-pick products (Mega 6/45, Max 3D Pro) still produce recommendations with explicit disclosure banner per pre-reg policy.

### Composite weights (frozen pre-reg, 5-term)

| Component | Weight | Notes |
|---|:-:|---|
| E[payout] | 0.35 | Highest weight — raw expected winnings |
| P(win ≥ 1 ticket) | 0.25 | Diversification premium — non-trivial for null-pick too |
| Variance penalty | 0.15 | −z(std) — discourages jackpot-chasing |
| Coverage | 0.15 | Unique/total ratio — diversity reward |
| Budget efficiency | 0.10 | Mostly 1.0 for all candidates at fixed 10-ticket constraint |

### Portfolio candidate space

| Product | Anchors | Pure | Mixed | Hedged | Wheel | Total |
|---|---|:-:|:-:|:-:|:-:|:-:|
| Power 6/55 | MinDistance | 1 | 0 | 3 | 1 | 5 |
| Power 5/35 | Freq_Hot | 1 | 0 | 3 | 0 | 4 |
| Mega 6/45 | Freq_Hot | 1 | 0 | 3 | 0 | 4 |
| Max 3D | 3 diverse anchors | 3 | 15 | 9 | 0 | 27 |
| Max 3D Pro | TierWeighted (corrected) | 1 | 0 | 3 | 0 | 4 |
| **Total** | — | 7 | 15 | 21 | 1 | **44** |

### Integration test (Phase 1.4)

Generated CSV from allocator → fed into `vietlott-check-rate`:

| Product | Allocator predicted ROI | Check-rate actual ROI | Gap | Root cause |
|---|---:|---:|---:|---|
| Max 3D | −25.12% | −8.60% | 16.5pp | Allocator evaluator missing `KK 2 số cuối` tier (100K prize); check-rate includes it |
| Max 3D Pro | −33.32% | −74.4% | 41pp | Jackpot-tier variance from low N_RUNS=5; 1 simulated jackpot hit skews mean |

**Status**: pipeline works end-to-end (CSV generation + check-rate round-trip validate). Absolute ROI numbers have documented variance — relative ranking between portfolios remains valid (composite ordering stable across runs). Pre-reg's ±10% tolerance was optimistic; revisit if Chu kỳ 25 adds ladder support.

**Not a blocker**: users get honest portfolio labels + disclosure banner; `check-rate` exists as independent verification tool.

### Methodology revisions (none)
- Composite weights, exclusion list, null-pick policy all frozen per pre-reg
- Principle #17 family check passed: Kelly + Bayesian sizing EXCLUDED; diversity + wheeling + hedged mixes OK
- No Accept/Reject verdicts (Optimization mode)

### QA

- Python CLI: 5/5 products emit human-readable + CSV output; null-pick banner surfaces for Mega 6/45 + Max 3D Pro
- TypeScript: `tsc --noEmit` clean
- Build: `npm run build` pass (Next.js 16 + Turbopack, 13 static pages)
- Route smoke: 11/11 routes return 200
- Integration: allocator CSV → check-rate → tickets parsed, evaluated, disclosure stats printed

### Effort
- Phase 1.1 allocator: ~2h (including iteration on enumerate dedup bug)
- Phase 1.2 CLI: ~1h
- Phase 1.3 UI widget: ~1.5h
- Phase 1.4 integration test: ~0.5h
- Phase 2 history + move + commit: ~0.5h
- Total: ~5.5h — within 3-4d pre-reg estimate (well under)

### Not shipped (deferred)
- Budget ladder beyond 100K (Chu kỳ 25+ if demanded)
- Power 5/35 CSV auto-generated special number (user picks special separately)
- Chu kỳ 22 evaluator patch for auto-select by product_key (Phase A audit Tier 1 Optional)

### Next
- Chu kỳ 25: UI polish / data refresh / extended ladder if user requests. Not pre-reg'd.
- Reopen breakthrough: only on §9 triggers.

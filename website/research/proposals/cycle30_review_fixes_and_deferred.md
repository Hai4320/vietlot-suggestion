## Chu Kỳ 30 — Pre-Registration: Review Fixes + Deferred Catalog Work

**Status**: 📝 **DRAFT — pre-execution** (created 2026-04-25). Frozen on user approval. Move to `executed/` on close per Principle #16.

**Mode**: **Methodology refinement + Catalog completion** (mixed). NOT a breakthrough cycle. Inherits Chu kỳ 20 pattern (codify methodology improvements across canonical docs) + Chu kỳ 29 pattern (catalog gap fill).

**Parent**:
- [test/research-review-2026-04-25-vi.md](../../../test/research-review-2026-04-25-vi.md) — independent rigor review (input)
- [history/cycle29_gap_coverage.md](../../history/cycle29_gap_coverage.md) — B8/B9/C4 adapter deferrals (input)
- [METHODOLOGY.md](../METHODOLOGY.md) §3.7-§3.11 (Principles #13-#17) — gating discipline maintained

**Estimated effort**: ~15h total split across 5 mini-cycles (30a-30e). Mini-cycle granularity allows interrupted execution; each ships independently.

---

### Canonical goal

Address the 6 critical errors + 8 methodological concerns raised by the 2026-04-25 independent rigor review against `src/vietlott/cli/suggest.py`, `src/machine_learning/backtest.py`, and `src/machine_learning/readme.md`. Simultaneously finish the B8/B9/C4 adapter work deferred from Chu kỳ 29 to fully close out the catalog at 56/73 actively-tested.

**Two-track scope**:

1. **Track A (Mini-cycles 30a-30d)** — Engine correctness, honest framing, methodology hardening, cleanup. Driven by review findings.
2. **Track B (Mini-cycle 30e)** — B8/B9/C4 method specs that needed adapter work in Chu kỳ 29.

Track A is **prerequisite** for any future Suggestive → Accept claim coming through `suggest.py` backtest. Current backtest engine has accounting + leakage bugs that would invalidate verdict-class outputs.

**This cycle does NOT introduce new breakthrough hypotheses.** No new family attacked, no new RNG mechanism tested. Optimization-mode + methodology refinement only.

---

### Background — Why this cycle now

The 2026-04-25 review identified 6 critical errors in the suggestion engine and surrounding artifacts:

| # | Error | File | Verified by |
|---|---|---|---|
| C1 | Data ≈ i.i.d. uniform (chi-square p ≈ 0.70 main, 0.81 special) — every "edge" in `Stats.scores` fits noise | `data/power535.jsonl` | Reviewer's chi-square; consistent with closure §7.5 |
| C2 | Readme leaderboard "Random +1806% ROI" = single jackpot variance hit | `src/machine_learning/readme.md:14-23` | Direct EV recompute; verified by us |
| C3 | LongAbsence = gambler's fallacy (memoryless geometric) | `strategies/long_absence.py` | Math standard |
| C4 | Bayesian posterior centered at uniform (no shift from data) | `strategies/bayesian_dirichlet.py` | Math standard |
| C5 | `backtest_tickets` credits only best ticket per draw, charges cost for all | `src/vietlott/cli/suggest.py:281-352` | Verified line 305-325 |
| C6 | `Stats` built once on full df → tickets see test-set draws (look-ahead bias) | `src/vietlott/cli/suggest.py:75-90` | Verified |

**C5 and C6 are correctness bugs that affect every output of `vietlott-suggest`.** They are independent of the predictive question (which we already accept as null per Closure §7.5). Track A fixes them.

**Where we push back on the review** (documented in the rebuttal section of [research-review-2026-04-25-vi.md](../../../test/research-review-2026-04-25-vi.md) followup): 3 review recommendations soften (Berkson framing in check_rate, "strip" of LongAbsence/Frequency, Sharpe full removal). Track A applies the milder formulation in each case.

---

### Scope — Mini-cycle breakdown

#### Mini-cycle 30a — P0 Correctness Fixes (~4.5h)

**Goal**: Fix 4 bugs that produce numerically wrong output. After 30a, anything `vietlott-suggest` prints reflects real arithmetic.

| Task | File | Action |
|---|---|---|
| 30a.1 | [suggest.py:281-352](../../../src/vietlott/cli/suggest.py#L281-L352) | `backtest_tickets` loops every ticket per draw, sums prizes via `resolve_power_535`. Pattern source: `Power535Evaluator` (already correct). |
| 30a.2 | [suggest.py:75-90](../../../src/vietlott/cli/suggest.py#L75-L90) | Refactor `Stats` → expose `Stats.from_history(records_until: date)`. Backtest loop instantiates fresh Stats before each evaluation draw. |
| 30a.3 | [src/machine_learning/readme.md:14-23](../../../src/machine_learning/readme.md#L14-L23) | Replace ROI leaderboard with Monte-Carlo null density: 1000 random-baseline runs per product, render histogram + overlay each strategy as vertical line + percentile rank. |
| 30a.4 | [backtest.py:407-428, 797](../../../src/machine_learning/backtest.py#L407-L428) | Drop `_calculate_sharpe_ratio` from `BacktestResult`. Replace with: median match count + MC-null percentile. Update consumers. |

**Deliverable**: `make run-suggest power_535 --tickets 10` produces backtest where `total_winnings` reflects ALL winning tickets across N draws, computed walk-forward.

**Acceptance criteria** (must pass before 30a closes):
- [ ] Backtest of 10 random tickets × 50 draws produces `total_winnings` consistent with hand calculation on a small fixture (3 draws × 2 tickets, manually summed prizes).
- [ ] Snapshot test: same seed produces same output across two runs.
- [ ] Walk-forward verification: at draw `t`, `Stats` does not contain any record dated `≥ t`.
- [ ] `BacktestResult` no longer exposes `sharpe_ratio` field. Codebase grep returns 0 references outside removal commit.
- [ ] `src/machine_learning/readme.md` no longer contains the +1806% leaderboard. Replacement MC-null density figure renders correctly.

---

#### Mini-cycle 30b — P1 Honest Framing (~2.25h)

**Goal**: User-visible artifacts (CLI output + UI) display the **−74% house edge** plainly. Current artifacts pretend the engine is predictive.

| Task | File | Action |
|---|---|---|
| 30b.1 | [suggest.py CLI output](../../../src/vietlott/cli/suggest.py) | Add per-ticket EV display: compute closed-form EV from [prize_tables.py](../../../src/vietlott/config/prize_tables.py) for power_535 (and other products). Display: `EV/vé: 2,594 VND  •  House edge: −74%  •  Lỗ kỳ vọng/100 vé: 740,000 VND`. |
| 30b.2 | UI "Save to test/" flow ([SuggestionPanel.tsx](../../src/components/products/SuggestionPanel.tsx) + check-rate page) | Pre-action notice (banner above Save button): "Lưu vé này không tăng cơ hội thắng. EV ≈ −7,400 VND/vé. Đây là tracking cho mục đích nghiên cứu, không phải khuyến nghị mua." Tiếng Việt thân thiện theo style commit `1953acf`. |
| 30b.3 | [suggest.py CSV export](../../../src/vietlott/cli/suggest.py) | Add columns: `seed`, `algorithm_version` (git short SHA), `data_snapshot_date` (max date in data file used). Backfill schema in [vietlott/check_rate/io.py](../../../src/vietlott/check_rate/io.py). |

**Acceptance criteria**:
- [ ] CLI output shows EV + house edge for power_535, power_655, power_645, max_3d, max_3d_pro. (Zero for keno/3d if EV calc not implementable; explicit "EV không khả dụng" line.)
- [ ] CSV export from `vietlott-suggest --export-csv` contains `seed`, `algorithm_version`, `data_snapshot_date` columns.
- [ ] UI "Save to test/" shows house-edge banner before allowing save action.
- [ ] No artifact (CLI / UI / readme / docs) makes a positive-EV claim except where backed by an Accept verdict (currently only C6 A=B per Chu kỳ 28).

---

#### Mini-cycle 30c — P2 Methodology Hardening (~5.5h)

**Goal**: Future research outputs become trust-able. After 30c, any backtest run can be paired with a null-distribution percentile.

| Task | File | Action |
|---|---|---|
| 30c.1 | New: `src/machine_learning/null_distribution.py` | Library: `simulate_null(strategy_metric_fn, n_runs=1000, n_tickets, n_draws, product, seed)` → returns null distribution + percentile of observed value. Single canonical implementation, used by both `backtest.py` and `suggest.py` post-30a. |
| 30c.2 | [src/vietlott/cli/check_rate.py](../../../src/vietlott/cli/check_rate.py) | Add Bonferroni + Benjamini-Hochberg correction when comparing K algorithm groups within a game. Display both raw p-value and adjusted p-value. Annotate the family count (K) in output header. |
| 30c.3 | New: `src/machine_learning/tests/test_iid_assumption.py` | Reproduce reviewer's chi-square (marginal main + special) on all 5 products. Add **pair-frequency independence chi-square** on C(35,2) = 595 pairs for power_535 + analogous tests for matrix products. Document results in [docs/iid-tests.md](../iid-tests.md) (new). Expected outcome: all fail to reject — closes pair_frequency family per Principle #17. |

**Acceptance criteria**:
- [ ] `null_distribution.simulate_null(...)` returns `(null_samples, observed_value, percentile, p_value_two_tailed)`. Unit-tested with toy fixture.
- [ ] `check_rate` output for any K ≥ 2 algorithm comparison shows column `p_adj_BH` next to raw `p_value`.
- [ ] `pytest src/machine_learning/tests/test_iid_assumption.py` passes. Output JSON `iid_test_results.json` shipped with all 5 products' p-values for marginal + pair tests.
- [ ] If pair test fails to reject for power_535: pair_frequency family eliminated per Principle #17 (binding). Update [METHODOLOGY.md §3.11](../METHODOLOGY.md#L336) family list.
- [ ] If pair test rejects (unexpected): Inconclusive — defer to Chu kỳ 31 follow-up. Do NOT spin up new pair-based strategy.

---

#### Mini-cycle 30d — P3 Cleanup / Naming (~3h)

**Goal**: Remove misleading names + reduce footguns. Lower stakes than 30a-30c but addresses honest-framing concerns.

| Task | File | Action |
|---|---|---|
| 30d.1 | [strategies/max_entropy.py](../../../src/machine_learning/strategies/max_entropy.py) | Rename `MaxEntropyStrategy` → `StratifiedSamplingStrategy`. Update [config/map_class.py](../../../src/vietlott/config/map_class.py), [machine_learning/readme.md](../../../src/machine_learning/readme.md), `cycle22_data.ts` if referenced. Docstring: "Variance-reduction stratified sampling. Does NOT predict; equal-EV vs uniform." |
| 30d.2 | New: `src/machine_learning/strategies/demos/gamblers_fallacy/__init__.py` | Move `long_absence.py`, `frequency.py` (hot/cold variants), `exponential_decay.py`, `pair_frequency.py`, `pattern.py` into this namespace. Add module-level docstring per file: explicit refutation paragraph + link to [METHODOLOGY.md](../METHODOLOGY.md). Update map_class.py — these strategies stop appearing in `vietlott-suggest` default algorithm list. They remain importable for educational demo. |
| 30d.3 | [bayesian_dirichlet.py:82-85](../../../src/machine_learning/strategies/bayesian_dirichlet.py#L82-L85) | Remove `temperature` transform (no Bayesian justification). If kept: rewrite as `prior_strength` adjustment with derivation in docstring. Default → remove. |
| 30d.4 | [suggest.py:136-141](../../../src/vietlott/cli/suggest.py#L136-L141) | Composite-score weights normalize to 1.0: `0.30+0.25+0.20+0.15 = 0.90` → `(0.333, 0.278, 0.222, 0.167)`. Or rewrite to clearly sum to 1 with a constant. Note: ranking does not change, only the displayed score magnitude. |
| 30d.5 | All strategies | Replace `random.sample(...)` (global state) with `self._rng.sample(...)` where `self._rng = random.Random(seed)` per strategy instance. Determinism. |
| 30d.6 | [backtest.py:645-687](../../../src/machine_learning/backtest.py#L645-L687) | Replace `_check_lookback_bias` (string-match heuristic) with structural check: assert strategy `predict(target_date)` does not access `self.df` rows where `date >= target_date`. Implementation: pass df masked to `< target_date`; raise if strategy queries beyond. |

**Acceptance criteria**:
- [ ] `MaxEntropyStrategy` not referenced anywhere except backwards-compat alias in `__init__.py` (deprecation warning).
- [ ] `vietlott-suggest --algorithm long_absence` raises clear error pointing to demo namespace.
- [ ] `vietlott-suggest --algorithm hot|cold|exp_decay|pair_freq|pattern` similarly redirected.
- [ ] Two consecutive runs of `vietlott-suggest power_535 --seed 42 --tickets 10` produce byte-identical output.
- [ ] `_check_lookback_bias` returns True positive on a synthetic strategy that peeks future; True negative on a clean strategy.

---

#### Mini-cycle 30e — Track B: B8/B9/C4 Catalog Completion (~2-3h)

**Goal**: Finish the 3 method specs deferred from Chu kỳ 29 due to adapter work. After 30e: catalog 56/73 actively-tested (≈77%).

Inherits Chu kỳ 25-29 framework (`methods_evaluator.py`). Methods described in [BETTING_METHODS_CATALOG.md](../BETTING_METHODS_CATALOG.md) (B8 = 5/35 special sub-strategies; B9 = 6/55 bonus-ball targeting; C4 = KK 2-số-cuối focused).

| ID | Method | Product | Adapter need |
|---|---|---|---|
| B8a | Special hot-bias (track 1-12 special separately, hot-pick) | power_535 | Separate special-number generation pipeline alongside main. Modify `methods_evaluator` selection dimension to allow split selection. |
| B8b | Special cold-bias (1-12 special, cold-pick) | power_535 | Same adapter as B8a. |
| B9 | Bonus-ball targeting (predict 6/55 bonus separately) | power_655 | Tier-2-aware scoring: `Power655Evaluator` already handles tier-2; framework needs to expose bonus prediction as separate output. |
| C4 | KK 2-số-cuối focused (Max 3D last-2-digit hit) | max_3d | Tier-aware selection: bias number selection to maximize last-2-digit coverage. Modify generator to optionally optimize secondary tier. |

**Decision rule** (inherits Chu kỳ 25-29):
- N_RUNS=20 baseline; N_RUNS=200 forward-pass for any |Δ_ROI| > +3pp.
- All Reject expected (gambler's fallacy variants + structurally limited edges).
- If any spec produces forward-pass + Δ_ROI > +5pp: route through Principle #16 retry tree explicitly. Do not Accept on a single sub-cycle without external validation (per Chu kỳ 28 precedent).

**Acceptance criteria**:
- [ ] All 4 specs execute end-to-end (`methods_evaluator.py` extended adapters land).
- [ ] Sweep results saved to `cycle30e_results.json`.
- [ ] Catalog row updated: `B8a/B8b/B9/C4` status changed from `deferred` → `tested`.
- [ ] [BETTING_METHODS_CATALOG.md](../BETTING_METHODS_CATALOG.md) post-30 count: **56/73 actively-tested** + 20 subsumed/N/A = 76/73 addressed (3 deferred-permanent if any spec deemed truly impossible).

---

### Decision rule (cycle-wide)

**This is NOT a breakthrough cycle.** No Accept verdicts produced. Verdict outputs limited to:
- 30a-30d: software fixes (binary pass/fail per acceptance criteria above).
- 30c IID test: confirmation null (Reject for pair_frequency family); methodology document update.
- 30e Track B: 4 expected-Reject method specs with N=20 baseline.

**Suggestive trigger** (any sub-cycle): if any 30e spec shows |Δ_ROI| > +5pp forward-pass at N=200 → flag as Suggestive-pending, defer to Chu kỳ 31 split-half + external validation per Principle #11.

**Family elimination triggers** (Principle #17, binding):
- 30c.3 pair-test fail-to-reject → pair_frequency family eliminated.
- No other family eliminations claimed.

---

### Family check (Principle #17)

| Mini-cycle | Family touched | Status |
|---|---|---|
| 30a | none (engine correctness) | ✓ |
| 30b | none (UX/honesty) | ✓ |
| 30c | pair_frequency (potentially eliminated by 30c.3 IID test) | OK — methodology-driven elimination, not Accept claim |
| 30d | gambler's fallacy demos (relocated, not eliminated; already null per closure) | ✓ |
| 30e B8 | special-number selection (Power 5/35 sub-family) — untested previously | New family entry, Reject expected |
| 30e B9 | bonus-ball selection (Power 6/55 sub-family) — untested previously | New family entry, Reject expected |
| 30e C4 | tier-2 optimization (3D sub-family) — untested previously | New family entry, Reject expected |

All pass.

---

### Artifacts

#### Created during cycle (mini-cycle ownership)

| Artifact | Owner | Type |
|---|---|---|
| Pre-reg (this file) | 30 (parent) | Frozen on user approval, moves to `executed/` on close |
| `src/machine_learning/null_distribution.py` | 30c | New library |
| `src/machine_learning/tests/test_iid_assumption.py` | 30c | New test module |
| `iid_test_results.json` | 30c | Reproducible artifact |
| `website/research/iid-tests.md` | 30c | Public documentation |
| `cycle30e_methods/*.json` | 30e | Method specs |
| `cycle30e_results.json` | 30e | Sweep output |
| `history/cycle30_review_fixes_and_deferred.md` | 30 (parent) | Closure record |

#### Modified files (no new symbols, repaired existing)

| File | Mini-cycle | Change |
|---|---|---|
| `src/vietlott/cli/suggest.py` | 30a, 30b, 30d | `backtest_tickets` correct accounting + walk-forward Stats + EV display + composite weights |
| `src/machine_learning/readme.md` | 30a | Leaderboard replaced with MC null |
| `src/machine_learning/backtest.py` | 30a, 30d | Sharpe removed, MC-null integrated, structural lookback check |
| `src/machine_learning/strategies/bayesian_dirichlet.py` | 30d | Temperature removed |
| `src/machine_learning/strategies/{long_absence,frequency,exponential_decay,pair_frequency,pattern}.py` | 30d | Moved to `demos/gamblers_fallacy/` |
| `src/machine_learning/strategies/max_entropy.py` | 30d | Renamed → `stratified_sampling.py` |
| `src/vietlott/cli/check_rate.py` | 30c | Bonferroni / BH correction |
| `src/vietlott/check_rate/io.py` | 30b | CSV schema additions |
| `website/src/components/products/SuggestionPanel.tsx` | 30b | House-edge banner |
| `website/research/METHODOLOGY.md` | 30c (conditional) | Family list update if pair eliminated |
| `website/research/BETTING_METHODS_CATALOG.md` | 30e | B8/B9/C4 status update |
| `website/research/RESEARCH_HISTORY.md` | 30 (close) | Cycle 30 entry |

---

### NOT in scope

- **Track A is NOT** retesting any falsified strategy. The IID test (30c.3) is methodological closure, not a re-Accept attempt.
- **Track B is NOT** introducing new families beyond B8/B9/C4. If B8/B9/C4 produce Suggestive: defer to Chu kỳ 31, do NOT extend in 30e.
- **No UI redesign.** 30b touches one banner; broader UX work belongs to a future Chu kỳ 31+.
- **No new product/data crawling.**
- **No re-run of Chu kỳ 22 rankings.** (Reviewer suggested; defer to Chu kỳ 31 if user demands. Current rankings remain valid because pick selection uses `cycle22_rankings.json` which is computed from `backtest.py` artifacts — those artifacts are NOT regenerated by 30a/30c. If any consumer wants fresh rankings post-30a fixes, that is a separate cycle.)
- **No Accept claim.** Only methodology + correctness work.

---

### Risks + mitigations

| Risk | Mitigation |
|---|---|
| 30a Stats refactor breaks UI consumers (cycle22 rankings recompute differently) | UI uses `cycle22_rankings.json` snapshot, not live `Stats`. Snapshot is immutable artifact. UI unaffected by 30a. Verify by curl smoke before 30a close. |
| 30c.3 pair test rejects (unexpected) | Stop, do not introduce new strategy in same cycle. Open Chu kỳ 31 for follow-up. Document carefully. |
| 30d strategy relocations break user scripts using import paths | Add backwards-compat re-exports with `DeprecationWarning` in old paths, removable in Chu kỳ 32+. |
| 30e adapter work creates regressions in already-tested methods | Run regression on a subset of Chu kỳ 25-29 method specs before closing 30e. Verify identical output. |
| Cycle drags on; 30b honesty work blocks on 30a engine fixes | 30b only depends on prize_tables.py (already correct). Can run in parallel with 30a. |

---

### Execution order recommendation

Suggested ordering, parallelizable where noted:

```
30a  ──┐
       ├── 30c (depends on 30a Stats refactor for null_distribution lib)
30b  ──┘
       
30d ──── (independent, runs last for cleanup)

30e ──── (independent, runs anytime — but easier after 30a so Stats refactor is in-place)
```

Minimum viable path: 30a → 30b → 30c → close cycle. 30d + 30e optional follow-ups within same cycle window or split to Chu kỳ 30.5 if time-boxed.

---

### Expected outcome

Per acceptance criteria across mini-cycles:

1. `vietlott-suggest` engine arithmetic correct (no over/under-counting, no leakage).
2. User-facing artifacts honest about negative EV; no positive-ROI claims except C6 A=B Accept.
3. Methodology hardened: MC null library, FWER correction, IID confirmation tests reproducible.
4. Naming honest (StratifiedSampling, demos/gamblers_fallacy/).
5. Catalog at 56/73 actively-tested (or 53/73 if any of B8/B9/C4 deemed permanently infeasible).
6. Zero new Accept claims (this is methodology cycle, not breakthrough).
7. Cumulative project state: 1 Accept (C6 A=B betting-structure) + 0 RNG-mechanism Accept — unchanged.

**Forward gate** (cycle close): user runs `vietlott-suggest power_535 --tickets 10 --backtest-draws 50` and verifies the output makes arithmetic sense vs. hand calculation. If yes — close cycle. If no — return to 30a for residual bugs.

---

### Approval

Pre-reg frozen on user approval. Mini-cycle 30a may begin immediately after approval. Mini-cycles 30b-30e may execute in any order respecting dependency graph above.

**Signed**: pending user approval.
**Date created**: 2026-04-25.
**Date frozen**: TBD.

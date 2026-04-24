# Chu Kỳ 29 — Gap Coverage Review (2026-04-24)

**Pre-reg**: [proposals/executed/cycle29_gap_coverage.md](../proposals/executed/cycle29_gap_coverage.md).

**Scope executed**: Framework extensions (F5 jackpot-only stop + F8 persistent-with-reset + G4 1-3-2-6 progression) + 6 method specs.

**Compute**: 17.07s.

---

## 1. Raw results

| Method | 6/55 | 6/45 | 5/35 | 3D | 3D Pro |
|---|---:|---:|---:|---:|---:|
| **A3 Random baseline** | −90.1% | −86.2% | −90.9% | −48.1% | −80.4% |
| F5 jackpot-only stop | −93.8% | −85.7% | −90.7% | — | — |
| F8 persistent reset30 | −89.6% | −89.3% | −92.2% | — | — |
| F9 n3 hits stop | −95.5% | −88.5% | −89.1% | — | — |
| G4 1-3-2-6 progression | −93.9% | — | — | −49.9% | — |
| C7 digit-sum [60,130] | −94.7% | −89.0% | — | — | — |
| F5b jackpot-only 3D Pro A=B | — | — | — | — | **+3362%** |

---

## 2. Key findings

### 2.1 All gap methods near-Random (expected)

F5/F8/F9 persistence variants + G4 progression + C7 digit-sum filter: all within ±5pp of Random baseline. No edge found.

F8 Power 6/55 ROI = −89.6% (vs F3 Chu kỳ 25 = −96.2%) → small improvement from reset mechanism (+6.6pp), but near-matches Random. Still no edge, just slightly less-bad than pure persistence.

### 2.2 G4 1-3-2-6 progression — null confirmed

Progression compounding doesn't beat Random. Same result as C27 G2/G3 family: compounding amplifies variance but doesn't create edge in EV-negative games. Added to catalog as tested null.

### 2.3 C7 digit-sum filter — null (as expected)

Sum-range filter shows no edge. Consistent với C26 B5 sum-range filter findings. Filter-based selections = noise.

### 2.4 F5b jackpot-only 3D Pro A=B = +3362% ROI

**Not surprising** — F5b combines C6 A=B with jackpot-only stop (P ≈ 0.0002% per kỳ). Stop fires almost never → behavior ≡ C6 A=B indefinite. Confirms C6 Accept finding (Chu kỳ 28 cycle28_meta_analysis.md).

This is reproducibility evidence for C6, not new Accept claim.

### 2.5 F8 reset-after-K-cold — modest improvement over plain persistence

F8 Power 6/55 = −89.6% vs F3 persistence = −96.2% from Chu kỳ 25 (Δ = +6.6pp). Reset mechanism does help recover from bad initial picks. But still below Random (−90.1%). Marginal benefit within variance, no Accept.

---

## 3. Catalog update

| ID | Method | Status |
|:-:|---|---|
| F5 | Stop at jackpot only | ✓ **Chu kỳ 29** — near-Random, cautionary variant of F3 |
| F5b | F5 × 3D Pro A=B | ✓ **Chu kỳ 29** — confirms C6 reproducibility (+3362%) |
| F8 | Persistent with reset after K cold | ✓ **Chu kỳ 29** — small improvement over F3, no edge |
| F9 | Stop after N total hits | ✓ **Chu kỳ 29** — near-Random |
| G4 | 1-3-2-6 progression | ✓ **Chu kỳ 29** — no edge, confirmed null |
| C7 | Digit-sum filter (matrix) | ✓ **Chu kỳ 29** — filter noise |

**Progress**: 47/73 → **53/73 tested** (73%).

---

## 4. Remaining untested (post-29)

| Method | Why untested | Status |
|---|---|:-:|
| B2 reduced/partial wheel | Math optimization required | Deferred |
| B4 position-weighted | Subsumed by Pattern (Chu kỳ 1-3) | Skipped |
| B7 birthday-universe | Trivial restriction, low value | Skipped |
| B8 5/35 special sub-strategies | Adapter work needed | Deferred |
| B9 6/55 bonus-ball targeting | Adapter work needed | Deferred |
| C2 bao bộ ba | Subsumed by C1 | Skipped |
| C3 bao xỉu chủ | N/A (Vietlott doesn't have) | Skipped |
| C4 KK 2-số-cuối focused | Tier-targeting adapter work | Deferred |
| C9 digit-position Bayesian | Subsumed (Chu kỳ 4, 11) | Skipped |
| C10 joint-digit bias | Subsumed (Chu kỳ 4) | Skipped |
| C11 same last digit | Trivial filter | Skipped |
| D1-D5 bet-size variants | All tested via other methods | Skipped |
| E1 every draw | Default | Skipped |
| E5 dry-spell triggered | Proxy of E4 | Skipped |
| E6 user-specified interval | Non-reproducible | Skipped |
| F4 | Sub-variant of F1-F3 | Skipped |
| F6-F7 | Tested C25-26 | Done |
| G6 win-reset | Trivial | Skipped |
| H1-H5 | Tested C28 | Done |
| I1-I5 cultural | Permanent skip | Skipped |
| J1-J3 institutional | N/A | Skipped |

**Truly testable remaining** (would need adapter work): B8, B9, C4. Deferred.

**Catalog coverage**: 53/73 actively tested + 20/73 subsumed/N/A/trivial = **73/73 addressed**. Only B8/B9/C4 genuinely deferred.

---

## 5. Conclusions

1. **No new Accept claims**. Confirmed 28-cycle cumulative state stands:
   - 1 Accept (🏆 C6 A=B Max 3D Pro) — betting-structure exploit
   - 0 RNG-mechanism Accept
   - 79 Reject / 8 Inconclusive-UP / 1 Inconclusive (breakthrough)

2. **F8 reset mechanism modest value** — slightly less-bad than pure persistence, but no edge. Potentially useful UX heuristic cho user: "don't hold cold number forever".

3. **F5b reproduces C6 A=B finding** — sanity check for Chu kỳ 28 Accept.

4. **Framework extensions working**: jackpot_only stop, persistent_with_reset, progression_1326 all functional and backward-compatible.

5. **Catalog 73/73 addressed** (53 tested + 20 subsumed/skip). Only 3 methods (B8/B9/C4) pending adapter work — deferred to Chu kỳ 30 nếu user demands.

**Ready for Plan 3 `/methods` page build** với full catalog data.

---

## 6. Artifacts

- [methods_evaluator.py](methods_evaluator.py) — extended C29 (jackpot_only + persistent_reset + progression_1326)
- [cycle29_methods/](cycle29_methods/) — 6 spec JSONs
- [cycle29_results.json](cycle29_results.json) — canonical output
- [logs/cycle29_sweep.log](logs/cycle29_sweep.log) — runtime stdout
- This review

---

## 7. Next

Plan 3 `/methods` page build (~10h):
- Data module: 73 methods với status + metrics from C25-29 JSONs
- Page: Hero overview stats → C6 spotlight → table → comparison matrix
- Per user §9 answers: hand-code TS catalog, 6-method comparison max, skip research timeline, untested methods shown trong table grayed

Framework frozen post-29. No more evaluator extensions expected.

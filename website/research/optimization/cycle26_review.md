# Chu Kỳ 26 — Tier-2 Method Review (2026-04-24)

**Pre-reg**: [proposals/cycle26_tier2_wheeling_3d_permutations.md](../proposals/cycle26_tier2_wheeling_3d_permutations.md) (frozen same-day).

**Scope executed**: Framework extension (multi-ticket bet_size + filter selections) + 12 Tier-2 method specs × applicable products × 4 segments × N_RUNS=20.

**Compute**: 141.59s total.

---

## 1. Framework extensions shipped

✅ `methods_evaluator.py` extended to support:
- `bet_size.type = full_wheel` — matrix, generates C(K, main_count) tickets from K selected numbers
- `bet_size.type = key_wheel` — matrix, fixed keys + rotate pool
- `bet_size.type = permutation_all` — 3D, all distinct permutations of picked number
- `bet_size.type = paired_mirror` — 3D, X + 999-X
- `bet_size.type = forward_reverse_hedge` — 3D Pro, (A,B) + (B,A)
- `selection.filter` — post-filter retry (sum_range, parity_balanced, no/has_consecutive)
- `--methods-dir / --output / --cycle / --pre-reg` CLI flags for multi-cycle reuse

Backward-compatible: Chu kỳ 25 specs still produce identical numbers (regression test passed).

---

## 2. Raw results — ROI full segment

| Method | 6/55 | 6/45 | 5/35 | 3D | 3D Pro |
|---|---:|---:|---:|---:|---:|
| **A3 Random baseline (from C25)** | −90.1% | −86.2% | −90.9% | −48.1% | −80.4% |
| B1 wheel K=7 Freq_Hot | −92.2% | −88.4% | — | — | — |
| B1 wheel K=6 Freq_Hot (5/35) | — | — | −91.0% | — | — |
| B1 wheel K=7 MinDistance | −93.8% | −87.8% | — | — | — |
| B3 key wheel K=2+R=7 | −93.9% | **−85.4%** | — | — | — |
| B5 sum-range filter | −94.8% | −88.2% | −90.0% | — | — |
| B6 parity-balanced | −94.9% | −89.7% | −89.1% | — | — |
| B10 no-consecutive | −93.9% | **−84.7%** | −93.4% | — | — |
| B11 has-consecutive | −94.4% | −85.6% | −90.3% | — | — |
| **C1 bao lô 6 perms (algo)** | — | — | — | **−47.7%** (P=9.9%) | — |
| **C1 bao lô 6 perms (random)** | — | — | — | **−45.6%** (P=9.6%) | — |
| **C5 forward+reverse hedge** | — | — | — | — | **−45.9%** (P=4.0%) |
| **C8 mirror-paired** | — | — | — | **−45.1%** (P=3.9%) | — |

**Bold** = notable vs Random.

---

## 3. Key findings

### 3.1 Matrix wheeling (B1/B3) — NO ROI improvement, boost P(hit)

| Method × Product | P(hit) | Random P(hit) | Lift | ROI Δ |
|---|:-:|:-:|:-:|:-:|
| B1 K=7 × 6/55 | 2.2% | 1.4% | **+57%** | −2.1pp ROI |
| B3 key × 6/45 | 7.9% | 2.4% | **+229%** | +0.8pp ROI |

**Interpretation**: Wheel gives ~N× independent tickets at ~fixed cost-per-hit ratio. P(hit) scales linearly with ticket count, but ROI stays near Random because house edge is multiplicative. **Wheeling = "more chances, same house edge"** — doesn't reduce EV. Confirms mathematical expectation, refuting common retail belief rằng wheeling "improves odds" in ROI sense.

### 3.2 Filter-based B5/B6/B10/B11 — all within variance of Random

No filter (sum-range, parity-balanced, consecutive preference/avoidance) shows Δ_ROI > 1.5pp vs Random consistently. **Filter-based methods are noise** — no statistical edge. Consistent với Chu kỳ 1-3 null findings on Pattern/structure strategies.

**Only B10 no_consecutive × Power 6/45 (+1.5pp, −84.7% vs −86.2%)** — technically marginal lift nhưng within variance (p > 0.1). Not Suggestive.

### 3.3 3D permutations C1 + C8 — ROI ≈ Random, P(hit) ↑↑

- **C1 bao lô 6 hoán vị (Max 3D)**: ROI −47.7% (algo) / −45.6% (random picker) vs Random −48.1%
- **C8 mirror-paired (Max 3D)**: ROI −45.1%
- All three within ~3pp of Random — essentially TIED on ROI
- But **P(hit) boosts dramatically** (9.9% vs 1.9% for bao lô = 5.2× lift, 3.9% vs 1.9% for mirror = 2.1×)

**Interpretation**: Like matrix wheeling, 3D permutation bundles multiply ticket count without changing per-ticket EV. Good for users who dislike long cold streaks (C1 gives hits 1-in-10 vs 1-in-50 Random). **No ROI improvement**, but PSYCHOLOGICAL benefit: shorter ticks-to-first-hit + fewer painful streaks.

### 3.4 C5 Forward+Reverse Hedge 3D Pro — PROMISING BUT FALSIFIED ON FORWARD

| Segment | ROI | Notes |
|---|---:|---|
| full | −45.9% | Beats Random by +34.5pp |
| half1 | **−30.0%** | Very strong ← jackpot/high-tier hit stacks |
| half2 | −78.9% | Near-Random |
| forward | **−84.7%** | **FAIL forward gate** (worse than Random) |

**Diagnosis**: half1 benefited from rare Giải Nhất 30M hit (best_ratio=6000 → 60M draw payout = 2 tickets × Nhất each). Single lucky hit in 20-run × half-window sample drove the apparent lift. Forward segment shows true −84.7% (TRIUMPH of Principle #13 forward-gate).

**Verdict**: Inconclusive — consistent với Chu kỳ 17 HMM finding about 3D Pro regime variance. Would need N_RUNS=200 + longer history cho reliable evaluation. Flag for Chu kỳ 28.

### 3.5 C1 bao lô random (−45.6%) beats C1 algo-chosen (−47.7%)

Counter-intuitive: random 3-digit pick slightly beats FreqWholeHot pick on full-sample. Within noise (2pp diff < typical variance) but illustrates **algorithm-chosen bao lô provides no edge over random bao lô** for Max 3D. Consistent với prior 3D research (Chu kỳ 8+11+12+13+17 convergent null findings).

### 3.6 Tier-2 takeaways

| Category | Best method | vs Random | Status |
|---|---|:-:|---|
| Wheeling (B) | B3 key × 6/45 | +0.8pp | Within variance |
| Filters (B5-B11) | B10 × 6/45 | +1.5pp | Within variance |
| 3D permutations (C1/C8) | C1 random | +2.5pp | P(hit) lift real, ROI tied |
| 3D Pro hedge (C5) | C5 | +34.5pp full / −4.3pp forward | **Inconclusive — forward fails** |

**No Accept / Suggestive in Chu kỳ 26**. All apparent lifts either within variance or fail forward gate.

---

## 4. P(hit) ranking (psychological value)

For users prioritizing "trúng thường xuyên" over absolute ROI:

| Method | Product | P(hit/kỳ) |
|---|---|:-:|
| B3 key wheel K=2+R=7 | Power 6/45 | **7.9%** |
| B3 key wheel K=2+R=7 | Power 6/55 | 4.3% |
| B1 wheel K=7 Freq_Hot | Power 6/45 | 3.8% |
| B1 wheel K=7 MinDistance | Power 6/45 | 3.8% |
| **C1 bao lô 6 perms** | **Max 3D** | **9.9%** |
| C1 bao lô random | Max 3D | 9.6% |
| C5 forward+reverse hedge | Max 3D Pro | 4.0% |
| C8 mirror-paired | Max 3D | 3.9% |

**C1 bao lô wins** — 5× lift P(hit) vs Random 1.9% Max 3D. Cost: 6× ticket count. Net cost per hit:
- Random: 1/1.9% = 52 draws to hit, 52 × 10K = 520K
- C1 bao lô: 1/9.9% = 10 draws to hit, 10 × 60K (6 tickets) = 600K

Similar net cost, but distributed differently. **C1 smooths out "cold streaks" significantly**.

---

## 5. Ruin probability (multi-ticket methods now meaningful)

Wheel + permutation methods have higher per-draw cost (7-35 tickets × 10K), so ruin metrics differ from Tier-1:

| Method | Cost/draw | Ruin B=1M/N=100 | Ruin B=5M/N=100 |
|---|---:|:-:|:-:|
| A3 Random (1 ticket) | 10K | 0% | 0% |
| B1 wheel K=7 (7 tickets) | 70K | 100% | 100% |
| B3 key wheel (35 tickets) | 350K | 100% | 100% |
| C1 bao lô (6 tickets) | 60K | 100% | 100% |
| C5 fw+rv (2 tickets) | 20K | 0% | 0% |
| C8 mirror (2 tickets) | 20K | 0% | 0% |

**Practical implication**: Wheeling methods require B ≥ 10× the per-draw cost cho 100 draws safe. B=100K (C24 budget) supports only low-ticket methods.

---

## 6. Catalog updates

| ID | Method | Chu kỳ 26 result |
|:-:|---|---|
| B1 | Full wheel K numbers | ✓ tested — no ROI edge, P(hit) ↑ |
| B3 | Key-number wheel | ✓ tested — within variance |
| B5 | Sum-range filter | ✓ tested — within variance |
| B6 | Parity-balanced | ✓ tested — within variance |
| B10 | Consecutive-avoid | ✓ tested — within variance |
| B11 | Consecutive-prefer | ✓ tested — within variance |
| C1 | Bao lô 6 hoán vị | ✓ tested — P(hit) 5×, ROI tied |
| C5 | Forward+reverse hedge (3D Pro) | ✓ tested — forward-gate FAIL, Inconclusive |
| C8 | Mirror-paired (số đối) | ✓ tested — within variance |

Tier-2 completion: **9 methods** added to tested catalog column. 35/73 total tested post-26.

Deferred to Chu kỳ 27-28 (originally in Tier-2 but need specialized adapter work):
- B2 reduced/partial wheel (mathematical optimization needed)
- B4 position-weighted (subsumed by Pattern strategy Chu kỳ 1-3)
- B7 birthday-universe (trivial restriction, low research value)
- B8 special sub-strategies (5/35 special-only logic)
- B9 bonus-ball targeting (6/55 bonus semantics)
- C2 bao bộ ba (subsumed by C1 with 2-digit-same input)
- C4 KK 2 số cuối focused (tier-targeting adapter work)
- C6 A=B exploit (3D Pro adapter work)
- C7 digit-sum targeting (subsumed by C1-like bundle)
- C11 same last digit (trivial filter, low value)

---

## 7. Method × product dominance analysis

**No method strictly dominates Random on all metrics** (consistent với Chu kỳ 25).

**No method has Δ_ROI > +3pp AND passes forward gate** — all marginal wins fall within variance or fail replication.

**Candidates for Chu kỳ 28 re-evaluation at N_RUNS=200**:
- C5 forward+reverse hedge (full +34.5pp but forward fail)
- C1 bao lô 6 perms variants (P(hit) lift real, ROI borderline)
- B10 × Power 6/45 (marginal +1.5pp)

---

## 8. Conclusions

1. **Wheeling methods do NOT beat Random on ROI** — mathematical expectation (same per-ticket EV, more tickets, same house edge). Confirms common lottery math. Retail belief that "wheels improve odds" refers to P(hit) boost, not ROI.

2. **3D permutation bundles (C1)** provide substantial P(hit) smoothing — valuable for user expectation management even without ROI edge.

3. **Filter-based selections are statistical noise** — no sum-range, parity, or consecutive-preference filter shows edge. Matches convergent finding of Chu kỳ 1-3 + 5 methodological failures.

4. **C5 Forward+Reverse Hedge 3D Pro** demonstrated dramatic full-sample ROI improvement (+34.5pp) but **falsified on forward gate** — classic variance trap. Principle #13 (forward gate binding) correctly caught this. Not a breakthrough.

5. **No Accept / No Suggestive claim** in Chu kỳ 26. Catalog 35/73 methods tested; 38 remaining for Chu kỳ 27-28.

---

## 9. Artifacts

- [methods_evaluator.py](methods_evaluator.py) — extended (~800 LOC now)
- [cycle26_methods/](cycle26_methods/) — 12 spec JSONs
- [cycle26_results.json](cycle26_results.json) — canonical output
- [logs/cycle26_sweep.log](logs/cycle26_sweep.log) — runtime stdout
- This review

---

## 10. Next — Chu kỳ 27

Tier-3 methods per [BETTING_METHODS_CATALOG.md](../BETTING_METHODS_CATALOG.md):
- G compounding (Martingale variants — document bankruptcy rates)
- E calendar patterns (alternate, weekly, every-K)
- Specialized 3D methods deferred from Chu kỳ 26 (C4 KK, C6 A=B, B8 5/35 special)

Effort: ~1 tuần. Framework ready.

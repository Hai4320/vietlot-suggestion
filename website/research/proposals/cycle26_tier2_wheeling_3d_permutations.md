## Chu Kỳ 26 — Pre-Registration: Tier-2 Methods (Wheeling + 3D Permutations)

**Status**: ✅ **APPROVED 2026-04-24** (user "bắt đầu"). Frozen per Principle #16 — content immutable until execution closes.

**Mode**: Optimization extension (multi-ticket method tuples — builds on Chu kỳ 25 framework).

**Parent catalog**: [BETTING_METHODS_CATALOG.md](../BETTING_METHODS_CATALOG.md).

**Estimated effort**: ~4-6h (framework extension ~2h + specs + sweep + review).

---

### Canonical goal

Extend Chu kỳ 25 `methods_evaluator.py` framework để support **multi-ticket bet sizes** (wheeling, permutations, paired mirrors). Execute Tier-2 method sweep.

**Not a scientific hypothesis** — Optimization descriptive comparison.

---

### Scope

#### Phase 26.1 — Framework extension

Extend `methods_evaluator.py` bet_size dimension to support:

| bet_size.type | Params | Output | Products |
|---|---|---|---|
| `fixed` (existing) | `n_tickets` | N independent tickets | all |
| `full_wheel` (new) | `k_numbers` | C(k, main_count) tickets covering all combinations | matrix only |
| `key_wheel` (new) | `key_numbers`, `rotate_pool_size` | key fixed + rotate through pool | matrix only |
| `permutation_all` (new) | (none) | All 6 permutations (or 3 if 2 digits same) | 3D single + 3D Pro |
| `paired_mirror` (new) | (none) | 2 tickets: X + mirror_X (e.g., 123 + 876) | 3D single |
| `forward_reverse_hedge` (new) | (none) | 2 tickets: (A,B) + (B,A) | 3D Pro only |

Cost scales with ticket count per draw.

#### Phase 26.2 — Tier-2 method specs (per [BETTING_METHODS_CATALOG.md](../BETTING_METHODS_CATALOG.md) B+C categories)

**B matrix** (wheeling + selection variants):

| ID | Method | Products |
|:-:|---|---|
| B1-K7 | Full wheel 7 numbers (6/55 + 6/45) | Power 6/55, 6/45 |
| B1-K8 | Full wheel 8 numbers (6/55 + 6/45) | Power 6/55, 6/45 |
| B1-K6 | Full wheel 6 numbers (5/35 — 6 chosen, C(6,5)=6 tickets) | Power 5/35 |
| B3-K2-R7 | Key-2 wheel (2 key + rotate 7 others) | Power 6/55, 6/45 |
| B5-sum | Sum-range filter (reject tickets outside sum[hot, cold]) | all matrix |
| B6-parity | Parity-stratified single ticket (balanced odd/even) | all matrix |
| B10-noconsec | Consecutive-avoid | all matrix |
| B11-consec | Consecutive-prefer (≥1 adjacent pair) | all matrix |

**C 3D**:

| ID | Method | Products |
|:-:|---|---|
| C1-bao6 | Bao lô 6 hoán vị (distinct 3-digit → 6 perms) | Max 3D, Max 3D Pro |
| C2-bao3 | Bao bộ ba 3 hoán vị (2-digit-same → 3 perms) | Max 3D, Max 3D Pro |
| C4-kk | Select number ending với 2-digit match target | Max 3D |
| C5-fr | Forward+reverse hedge (A,B) + (B,A) | Max 3D Pro |
| C6-ab | A=B same-digit exploit | Max 3D Pro |
| C7-sum | Digit-sum targeting (sum ∈ hot range) | Max 3D, Max 3D Pro |
| C8-mirror | Mirror-paired (X + 999-X) | Max 3D |

**Total**: ~18 specs × 5 products (where applicable) → ~45 entries expected.

#### Phase 26.3 — Sweep

Compute budget: ~5-10 min (wheel methods have N=6-28 tickets per draw → heavier than Tier-1).

#### Phase 26.4 — Review + close

`cycle26_review.md` — top-3 per product + cross-method dominance + catalog update.

---

### Methodology

**Inherits Chu kỳ 25**:
- N_RUNS=20 (may bump to 50 for sparse wheeling methods if variance high)
- 4-segment walk-forward (full/half1/half2/forward)
- 12-metric bundle per (method, product, segment)
- Baseline = A3 Random (1 ticket/draw)

**New multi-ticket consideration**:
- Ruin metric recalibrated: cost per draw scales with ticket count. Budget B=1M/N=100 no longer tautologically safe for wheeling methods (6 tickets/draw × 100 × 10K = 6M > 1M). Ruin probability will differ meaningfully across methods.
- P(win ≥ 1) will differ dramatically (more tickets = higher hit rate)
- Fair comparison rule: compare ROI + composite, NOT raw "ever hit" rate

**Composite weights** (same as Chu kỳ 25 pre-reg §Decision Rule):
- ROI 0.30 / E[payout] 0.15 / P(any hit) 0.15 / Sharpe 0.10 / −Ruin_1M 0.10 / −Pain_ge10 0.10 / −Drawdown 0.10

---

### Decision Rule

- Dominated methods (worse than Random on all metrics) → eliminate
- Δ_ROI > +3pp vs Random → flag Suggestive, retest at Chu kỳ 28
- No Accept/Reject claims

---

### Family Check (Principle #17)

- Wheeling (B1/B2/B3): Diversity family, OK — Chu kỳ 5/22 MinDistance validates
- Selection variants (B5-B11): Neutral filter/pattern methods
- 3D permutations (C1-C8): New bet-structure, not eliminated family

All Tier-2 methods pass family check.

### Retry Tree (Principle #16)

**Tier 1 — Paradigm swap**:
- R1: Framework extension fails → scope down to selection-only methods (drop B1-B3 wheeling + C1-C2 permutations)
- R2: If variance too high on wheeling → increase N_RUNS to 50

**Tier 2 — Within-paradigm**:
- V1: Reduce wheel size K (e.g., K=6 instead of K=8)
- V2: Restrict to Power 6/55 only for wheeling

Cap 3 retries.

---

### NOT in scope

- G compounding (Chu kỳ 27)
- E2/E3/E5 calendar (Chu kỳ 27)
- Full reduced-wheel mathematical optimization (B2) — use approximation via random subset of full wheel if exploration
- UI changes (Chu kỳ 28 decides)

---

### Artifacts (final list, frozen)

- Pre-reg (this file) — frozen, moves to `executed/` on ship
- `methods_evaluator.py` extended (re-commit với multi-ticket support)
- `cycle26_methods/*.json` — ~18 spec files
- `cycle26_results.json` — canonical output
- `cycle26_review.md` — review + dominance
- `history/cycle26_*.md` — closure record
- Updated [BETTING_METHODS_CATALOG.md](../../BETTING_METHODS_CATALOG.md) with Tier-2 rows

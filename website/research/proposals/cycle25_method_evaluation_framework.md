## Chu Kỳ 25 — Pre-Registration: Method Evaluation Framework + Tier-1 Methods

**Status**: ✅ **APPROVED 2026-04-24** (user approve). Frozen per Principle #16 — content immutable until execution closes.

**Mode**: Optimization extension (method-evaluation framework — not new mechanism research).

**Supersedes**: none (first framework-level cycle for method dimensionality).

**Estimated effort**: ~1 tuần (framework ~2-3d + Tier-1 methods ~3-4d + review/ship ~1d).

**Parent plan**: [BETTING_METHODS_CATALOG.md](../BETTING_METHODS_CATALOG.md) (73 methods catalogued, 4-cycle split approved).

---

### Canonical goal (pre-registered)

Build a **generic method evaluator** that takes any method-spec tuple (6-dimensional) and returns standardized metrics. Execute **Tier-1 methods** (highest gap value) through this framework. Output ranked method-comparison table + identify dominant methods per product.

**Not a scientific hypothesis** — this is a methodology + descriptive comparison. Inherits Chu kỳ 22 exploratory-only classification.

---

### Context

Post Chu kỳ 24 state:
- 24 cycles closed; 21 breakthrough + 3 optimization (22/23/24)
- 17/73 methods tested across 6 dimensions; **dimensions D3-D6 (time frequency, duration, stop-condition, compounding) essentially untested**
- User request 2026-04-24: evaluate ALL methods systematically, don't skip any, split across 4 sub-cycles

Chu kỳ 25 = first cycle, delivers framework + Tier-1. Chu kỳ 26-28 use the same framework để test other tiers.

---

### Hypothesis / Goal (pre-registered)

For each method M in Tier-1, evaluate via walk-forward simulation trên historical draws:

```
evaluate(M, product, history) → metrics_bundle
```

**Tier-1 method scope (frozen)**:

| # | Method ID | Category | Description | Rationale |
|:-:|---|---|---|---|
| 1 | A1 | Selection | Fixed same bộ số N kỳ | Baseline for persistence methods |
| 2 | A4 | Selection | Rotate algorithms across draws | Time-ensemble gap |
| 3 | F1 | Duration/Stop | Số gan — cold-number persistence until hit | **USER-REQUESTED gambler's fallacy test** |
| 4 | F2 | Duration/Stop | Hot-number persistence until hit | Mirror control for F1 |
| 5 | F3 | Duration/Stop | Algorithm-chosen persistence until hit | Modern variant of F1/F2 |
| 6 | F6 | Duration/Stop | Budget-capped persistence (B=1M, 5M) | Escape valve variant |
| 7 | F7 | Duration/Stop | K-draws escape (K=20, 50, 100) | Escape valve variant |
| 8 | E4 | Time frequency | Jackpot-triggered play (Power 6/55 + 6/45) | Event-based gap |

**Products in scope**: all 5 (power_655, power_645, power_535, max_3d, max_3d_pro).

**Baseline**: A3 pure Random, 1 vé/kỳ, every draw, indefinite — same baseline dùng across methodology.

**Excluded from Chu kỳ 25** (deferred to Chu kỳ 26-27):
- B1-B11 (matrix-specific wheeling) → Chu kỳ 26
- C1-C11 (3D-specific) → Chu kỳ 26
- G2-G5 (compounding: Martingale variants) → Chu kỳ 27
- E2-E5 (other calendar) → Chu kỳ 27
- I1-I5 cultural → document-only, not tested

---

### Scope

#### Phase 25.1 — Framework build

**Artifact**: `research/optimization/methods_evaluator.py`

**Input schema** (method-spec JSON):

```json
{
  "method_id": "F1_so_gan",
  "description": "Cold-number persistence until hit",
  "dimensions": {
    "selection": {
      "type": "algorithm",
      "algorithm": "LongAbsence",
      "params": {"lookback": 90}
    },
    "bet_size": {
      "type": "fixed",
      "n_tickets": 1
    },
    "time_frequency": {
      "type": "every_draw"
    },
    "duration": {
      "type": "until_condition"
    },
    "stop_condition": {
      "type": "any_tier_hit"
    },
    "compounding": {
      "type": "flat"
    }
  }
}
```

**Output schema** (metrics_bundle JSON per method × product × segment):

```json
{
  "method_id": "F1_so_gan",
  "product": "power_655",
  "segment": "forward_100",
  "n_runs": 20,
  "metrics": {
    "e_payout_per_draw_vnd": 5200,
    "p_any_hit_per_draw": 0.14,
    "roi_pct": -91.3,
    "sharpe_ratio": -2.1,
    "max_drawdown_vnd": 1250000,
    "ticks_to_first_hit": {"p25": 6, "p50": 11, "p75": 23},
    "time_to_bankruptcy_B500K": {"p25": 50, "p50": 80, "p75": "never"},
    "variance_payout": 28.3,
    "pain_streak": {"p_ge5": 0.68, "p_ge10": 0.34, "p_ge20": 0.09},
    "ruin_prob": {"B500K_N100": 0.67, "B1M_N100": 0.42, "B5M_N100": 0.08},
    "best_single_hit_ratio": 42.0
  },
  "method_meta": { "/* copy of input method-spec */" }
}
```

**Implementation**:
- Reuse simulation loop từ `cycle24_allocator.py` + extend cho stop conditions
- N_RUNS increased to 20 (from 5) for variance stability — critical cho F-methods với stochastic stop times
- Walk-forward split: `full / half1 / half2 / forward_100` (same as Chu kỳ 22)
- Shared with Chu kỳ 26-28 (framework reused)

#### Phase 25.2 — Method-spec JSON definitions

**Artifact**: `research/optimization/cycle25_methods/*.json` (8 method-spec files)

One JSON per Tier-1 method. Frozen content per Principle #16. Schema validated.

#### Phase 25.3 — Execute Tier-1 sweep

**Artifact**: `research/optimization/cycle25_results.json`

Schema: `{method × product × segment → metrics_bundle}` — 8 methods × 5 products × 4 segments = 160 entries.

**Compute budget estimate**: ~10-15 min (F-methods are shorter-walks avg, offset by N_RUNS=20 increase).

#### Phase 25.4 — Dominance analysis

**Artifact**: `research/optimization/cycle25_review.md`

Per product:
1. Rank methods by 12-metric composite (pre-registered weights below)
2. Identify **dominated methods**: strictly worse than Random on every metric → proposed for elimination list
3. Identify **top-3 methods per product**: promising for Chu kỳ 26+ deeper test hoặc user-facing surface

**Composite weights cho Chu kỳ 25** (frozen pre-reg):

| Metric | Weight |
|---|:-:|
| ROI | 0.30 |
| E[payout] | 0.15 |
| P(any hit / kỳ) | 0.15 |
| Sharpe ratio | 0.10 |
| −Ruin prob (B=1M, N=100) | 0.10 |
| −Pain streak P(≥10) | 0.10 |
| −Max drawdown (normalized) | 0.10 |

Differs từ C22 composite (0.40/0.30/0.15/0.15) vì Chu kỳ 25 tests include stop-condition metrics explicitly.

---

### Methodology

#### Phase 0 — Power gate classification
- All products inherit Chu kỳ 22 exploratory-only classification
- No Accept/Reject claims on method-level superiority
- Output is descriptive ranking + dominated-set elimination

#### Phase 1 — Framework robustness
- Schema-validated method specs (fail-fast if missing dimension)
- Unit test: framework outputs reproducible (seed=42)
- Integration: 3 sanity methods (A3 Random, A1 fixed, F1 so_gan) pass before full sweep
- Baseline comparison: A3 Random must appear trong result với known EV (~−66% ROI typical for 6/55 single-ticket)

#### Phase 2 — Method execution
- N_RUNS=20 cho statistical stability
- Walk-forward last-100 + split-half (full/half1/half2) per segment
- Deterministic seed progression (SEED + run_idx)
- Stop-condition methods: simulate per-run independently (different seed → different stop times)

#### Phase 3 — Null hypothesis
Expected: MOST methods ROI ≤ Random ROI (lottery EV negative). Goal: ranking + dominated elimination, không "winning method" claims. Any method claiming Δ_ROI > +3pp vs Random + split-half replicates → flag for Chu kỳ 26+ deeper replication.

---

### Decision Rule

**Framework acceptance criteria**:
- 3 sanity tests pass
- Schema validates on all 8 method specs
- Full sweep completes without error
- Reproducible (re-run within 1% numeric variance per metric)

**Method-level output**:
- Composite ranking per product
- Dominated methods → added to catalog "eliminated by dominance" list
- Top-3 per product → surface trong cycle25_review.md discussion section (not UI yet)

**No UI changes this cycle** — framework-only. Chu kỳ 28 meta-analysis decides what to surface user-facing.

---

### Family Check (Principle #17)

- A1/A4 (Selection): neutral, not in eliminated family
- F1-F7 (Persistence): **new category**, no family membership — legitimate to test
- E4 (Jackpot-triggered): meta-condition, not mechanism — neutral

None propose eliminated-family mechanism. Pass.

### Retry Tree (Principle #16)

**Tier 1 — Paradigm swap (if framework fails integration)**:
- R1: Drop generic schema, hard-code per-method evaluator (simpler but inflexible)
- R2: Drop N_RUNS=20 to N_RUNS=10 (half compute, wider CIs)

**Tier 2 — Within-paradigm variants (if framework OK but Tier-1 results ambiguous)**:
- V1: Increase N_RUNS to 50 for specific ambiguous methods
- V2: Extend forward window to last-200
- V3: Add stratified bootstrap confidence intervals

Cap **3 retries total** per Principle #16.

---

### Artifacts (final list, frozen)

- Pre-reg (this file) — frozen on approve, moves to `executed/` on ship
- [BETTING_METHODS_CATALOG.md](../../BETTING_METHODS_CATALOG.md) — updated với Tier-1 test results (Đã test? column)
- `research/optimization/methods_evaluator.py` — generic framework (shared across 25-28)
- `research/optimization/cycle25_methods/*.json` — 8 method specs
- `research/optimization/cycle25_results.json` — canonical output
- `research/optimization/cycle25_review.md` — dominance analysis + discussion
- `research/history/cycle25_method_evaluation_framework.md` — closure record
- `research/logs/cycle25_*.log` — run logs

---

### NOT in scope (explicit)

- Testing B/C/G/E categories (deferred to Chu kỳ 26-27)
- Testing I1-I5 cultural (documented-only, permanent skip)
- UI changes (Chu kỳ 28 decides if/what to surface)
- Modifying Chu kỳ 22 picks output (upstream, frozen)
- Budget allocator changes (Chu kỳ 24 frozen artifact)

---

### Approval checklist (for user to confirm before freeze)

- [ ] Framework design (input + output schema) sufficient for Chu kỳ 26-28 reuse?
- [ ] 8 Tier-1 methods scope acceptable? (F1/F2/F3/F6/F7 = "số gan" family, A1/A4, E4)
- [ ] N_RUNS=20 OK? (vs Chu kỳ 22/24 N_RUNS=5; 4× more compute for variance stability)
- [ ] 7-term composite weights OK? (ROI 0.30 / E[payout] 0.15 / P(hit) 0.15 / Sharpe 0.10 / −Ruin 0.10 / −Pain 0.10 / −Drawdown 0.10)
- [ ] Dominance-elimination rule OK? ("strictly worse than Random on every metric" → eliminated)
- [ ] Metric set complete? (base 8 + 4 new psychology = 12 metrics per method)
- [ ] Retry tree satisfactory?
- [ ] NOT-in-scope list complete (B/C/G/E deferred, I document-only)?

---

### Post-ship review gates

Before closing:
- [ ] Framework documented trong methods_evaluator.py với docstrings + examples
- [ ] Tier-1 results trong cycle25_results.json reproducible (seed=42 → same numbers within 1%)
- [ ] cycle25_review.md discusses dominance findings + top-3 per product
- [ ] Catalog `BETTING_METHODS_CATALOG.md` updated với 8 rows "Đã test" column
- [ ] Chu kỳ 26 pre-reg can start referring to methods_evaluator.py API

---

### Provenance
- Origin: User request 2026-04-24 post Chu kỳ 24 closure
- Parent catalog: [BETTING_METHODS_CATALOG.md](../../BETTING_METHODS_CATALOG.md)
- Methodology inheritance: Principles #11-#17 binding, Chu kỳ 20 composite §8, Chu kỳ 22 split-half on picks

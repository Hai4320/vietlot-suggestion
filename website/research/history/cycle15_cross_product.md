## Chu Kỳ 15 — Pre-Registration: Cross-product Joint Matrix (Path #3) — Last Win-rate Mechanism (04/2026)

### Context

Chu kỳ 14 6/6 Reject eliminated Path #1 Online Bayesian + **adaptive/drift-based family** cho matrix (drift hypothesis falsified; bias stable same as 3D Chu kỳ 8). User chose Option A (continue win-rate axis với Path #3) thay vì Option B (pivot ROI axis với Path #2 Kelly).

Rationale for Path #3 over Path #2: exhaust win-rate paths trước pivot. Path #3 là mechanism **không phụ thuộc drift assumption** — chỉ phụ thuộc shared-RNG hypothesis. Nếu Reject Chu kỳ 15, win-rate axis fully exhausted → Chu kỳ 16 pivot Path #2 Kelly với clean conscience.

Chu kỳ 13 đã test Path B (3D variant cross-product pool) trên Max 3D + Max 3D Pro → 4/4 Reject, "2 products có distinct bias patterns" (pool hurts Max 3D Pro). Matrix test này độc lập vì:
1. **Different vendor pipeline** — 3 matrix products (Power/Mega/Lotto) có thể dùng draw machines khác với 2 3D products
2. **Different structure** — set-level (choose k từ N) thay vì positional digit bias
3. **Different data horizon** — Lotto 5/35 recent (chỉ 543 draws), Mega 6/45 mature (1302), Power 6/55 longest (1334)

### Hypothesis (pre-registered)

**Core claim**: 3 matrix products (Power 6/55, Mega 6/45, Lotto 5/35) share physical RNG infrastructure (cùng vendor Vietlott) → shared number-level bias on overlap [1, 35]. Pooling bias estimate across 3 products → tighter P(number_i) for i ∈ [1, 35] vs per-product estimate.

**Null hypothesis (H0 — a priori plausible post-Chu kỳ 13)**:
- 3 products có independent RNG hoặc distinct machine calibrations → shared_bias ≈ 0 → pooling adds zero info (có thể hurts via noise dilution)

**Alternative hypothesis (H1)**:
- Shared bias exists on [1, 35] → pooled estimate beats per-product batch Bayesian → Δ_win_rate_ge3 > 0 vs Random AND directional improvement vs own-product anchor `Bayesian(365,1,1)`

**K=2 new variants, tested on 3 products (K × P = 6 strategy-product cells)**:

| # | Hypothesis | Strategy | Product |
|:-:|-----------|----------|---------|
| H1 | shared bias on [1,35] exists | `PooledMatrixBias` (hard pool) | Mega 6/45 |
| H2 | shared bias on [1,35] exists | `PooledMatrixBias` (hard pool) | Power 6/55 |
| H3 | shared bias on [1,35] exists | `PooledMatrixBias` (hard pool) | Lotto 5/35 |
| H4 | soft pool beats hard pool | `HierarchicalBayesMatrix` (w_own=0.5) | Mega 6/45 |
| H5 | soft pool beats hard pool | `HierarchicalBayesMatrix` (w_own=0.5) | Power 6/55 |
| H6 | soft pool beats hard pool | `HierarchicalBayesMatrix` (w_own=0.5) | Lotto 5/35 |

Bonferroni K=2 per product (2 new strategies) → α_strict = 0.025. (Total 6 cells but Bonferroni per-product same as Chu kỳ 13 pattern.)

### Mechanism spec (fixed, immutable post-implementation)

**Strategy 1 — `PooledMatrixBiasStrategy` (hard pool on overlap)**:

```
OVERLAP = [1, 35]  # range all 3 matrix products cover

For target product P with range [1, N_P] and num_count K_P:
  cutoff = target_date - lookback_days
  own_freq[i] = count of draws of i in P[cutoff, target_date) for i ∈ [1, N_P]
  pooled_freq[i] = sum over other products Q of
                   count of draws of i in Q[cutoff, target_date) for i ∈ [1, 35]

  For i ∈ [1, 35]:        alpha[i] = prior + own_freq[i] + pooled_freq[i]
  For i ∈ [36, N_P]:      alpha[i] = prior + own_freq[i]

  θ ~ Dirichlet(alpha)
  Select K_P numbers without replacement, probs ∝ θ^(1/T)
```

Hard pool adds raw counts from other products' draws for overlap region.

**Strategy 2 — `HierarchicalBayesMatrixStrategy` (soft pool, `w_own=0.5`)**:

```
alpha_own[i] = prior + own_freq[i]                      for i ∈ [1, N_P]
alpha_pool[i] = prior + own_freq[i] + pooled_freq[i]    for i ∈ [1, 35]

For i ∈ [1, 35]:     alpha_combined[i] = (1 - w_own) · alpha_pool[i] + w_own · alpha_own[i]
For i ∈ [36, N_P]:   alpha_combined[i] = alpha_own[i]   # no pool available

θ ~ Dirichlet(alpha_combined)
Select K_P without replacement, probs ∝ θ^(1/T)
```

Soft pool is James-Stein-like shrinkage: mix pooled-across-products with own-only. `w_own=0.5` = equal weight. Note pooled alpha includes own (double-counts by design — per Chu kỳ 13 precedent).

**Strict walk-forward discipline**: at step `i` in product P's backtest, other products' data is filtered to `date < draws_P[i-1].date` (or equivalently date <= target_date - 1 day). No look-ahead across products.

### Strategies to run (10 total per §8.4 tournament)

| Strategy | Role | Parameters (immutable pre-reg) |
|----------|------|--------------------------------|
| `Random` | Mandatory baseline §8.3 | uniform |
| `Freq_Hot(365, 0.8)` | Mandatory baseline §8.3 | — |
| `Pattern(180)` | Mandatory baseline §8.3 | — |
| `Bayesian(365, 1.0, 1.0)` | **Mechanism anchor** — own-product batch | — |
| `Bayes_Sharp(180, 1.0, 0.5)` | Secondary ref | — |
| `MaxEntropy(365, 1.0)` | Extra ref | — |
| `Adaptive([30,90,180,365], 10, "hot")` | Extra ref (family eliminated but retained for tournament baseline) | — |
| `OnlineBayes_λ0.01` | Extra ref (Chu kỳ 14 top-2, for continuity) | forgetting=0.01, prior=1.0, T=1.0 |
| **`PooledMatrixBias`** | **New #1 — hard pool** | lookback_days=365, prior_strength=1.0, T=1.0 |
| **`HierarchicalBayesMatrix`** | **New #2 — soft pool** | w_own=0.5, lookback_days=365, prior_strength=1.0, T=1.0 |

### Products & data splits

| Product | N draws | Midpoint | Forward | Overlap share |
|---------|:-:|:-:|:-:|:-:|
| Power 6/55 | 1334 | 667 | last 100 | numbers 1-35 (35/55 = 64%) |
| Mega 6/45 | 1302 | 651 | last 100 | numbers 1-35 (35/45 = 78%) |
| Lotto 5/35 | 543 | 271 | last 100 | numbers 1-35 (35/35 = 100%) |

All 3 products tested as **target** separately, với other 2 products providing pool evidence.

### Backtest params

- `min_history=100`, `n_runs=5`, `seed=42` (same as Chu kỳ 14)
- Bonferroni K=2 per product → α_strict = 0.025
- 3 gates: full + split-half + forward_last_100 (same stacking)

### Decision rule (binding — set trước khi thấy kết quả)

Same 3-gate rule as Chu kỳ 11/13/14 với α_strict=0.025:

| Full | Split | Forward | Overall |
|:-:|:-:|:-:|:-:|
| p < 0.025 + CI_lo > 0 | both Δ > 0 + both p < 0.025 | Δ > 0 | **Accept** |
| p < 0.025 | both Δ > 0 + both p < 0.05 | Δ > 0 | **Suggestive** |
| p < 0.05 | direction-consistent, 1 half p ≥ 0.05 | Δ > 0 | **Inconclusive** |
| Δ ≤ 0 at any gate | — | — | **Reject** |
| Direction flip split (d1 × d2 ≤ 0) | — | — | **Reject** |

**Principle #14 magnitude sanity (binding)**: matrix ceiling +0.3pp × 3 = **+0.9pp auto-flag threshold**. Nếu `|Δ_full| > 0.9pp` → Ship-with-caveats pending audit.

**Principle #15 concentration check**: không áp dụng (Dirichlet sampling = stochastic).

**Secondary comparison (descriptive, NOT gate)**: compare pooled strategies vs own-product `Bayesian(365,1,1)` (mechanism anchor). Nếu Pool vs Random pass nhưng Pool vs Bayesian fail → pooling adds nothing over own-product batch; signal comes from baseline noise.

### Power analysis (Principle #12)

Same constraints as Chu kỳ 14 (matrix Δ ≈ 0.3pp expected vs baseline 2.4%):
- Full-sample n_required ≈ 57,600 trials @ α=0.025 K=2 + 80% power
- Actual n: Mega ~6,010 (~30% power), Power ~6,170, Lotto ~2,215 (~15% power)
- Split halves: ~18% power each
- Forward_last_100: ~5% power (noise dominates)

**Limitation acknowledged (R2 per §1.1)**: Even with pooling to 3× data on overlap, per-segment n unchanged (target product determines n). Power constraint same as Chu kỳ 14. Failure to reject = weak evidence; positive result still meaningful.

**Advantage over Chu kỳ 14**: mechanism không requires drift → null hypothesis is "products independent RNG" (testable via pool hurts/helps). Signal magnitude could be larger if shared RNG real (3× data → √3 × sqrt(N) tighter estimate ≈ 1.73× SE reduction on bias estimate).

### Artifacts kỳ vọng

- `website/research/matrix/cross_product_strategies.py` — 2 strategy classes
- `website/research/matrix/cycle15_cross_product_backtest.py` — 3-gate harness (reuses `walk_forward_segment` pattern from Chu kỳ 14, extends to 3 products)
- `website/research/matrix/cycle15_cross_product_results.json` — per §4 schema
- Section "Chu Kỳ 15 — Result" append vào file này

### Follow-up (conditional)

- **Accept (6/6 or majority)**: **first project-wide robust Accept**. Ship per [RESEARCH_TO_UI_PLAYBOOK §2 Accept row](../../RESEARCH_TO_UI_PLAYBOOK.md). Cross-product validation built-in (tested across 3 products already).
- **Mixed (some Accept some Reject)**: investigate per-product — maybe shared bias exists for subset. Cần replication on data extension.
- **Suggestive (partial gate)**: `picks.winrate` candidate với "🔬 Directional" badge, no ship.
- **6/6 Reject**: Path #3 eliminated on matrix too (consistent với Chu kỳ 13 3D Reject). **Win-rate mechanism space fully exhausted** across both product families. Chu Kỳ 16 mandatory pivot to **Path #2 Kelly Portfolio** (ROI-axis).

### Guardrails

- K=2 hyperparameter variants pre-fixed (hard pool + soft pool w_own=0.5); NO post-hoc w_own tuning
- NO adding more variants if 6/6 Reject
- Principle #14 binding — large Δ auto-flag
- Pre-reg immutable sau implementation begins
- Mechanism anchor comparison (vs Bayesian batch own-product) descriptive only

---

*Pre-registered: 2026-04-21 — Chu Kỳ 15 Path #3 Cross-product Joint Matrix. User approved, backtest executed cùng ngày.*

### Result — Chu Kỳ 15 (2026-04-21, cùng ngày pre-registration)

**Verdict: 5/6 Reject + 1/6 Inconclusive — Path #3 matrix variant eliminated. Shared-RNG hypothesis FALSIFIED on matrix (consistent Chu kỳ 13 3D). Win-rate mechanism space FULLY EXHAUSTED across both product families.**

Raw results: [`../matrix/cycle15_cross_product_results.json`](../matrix/cycle15_cross_product_results.json). Run log: [`../matrix/cycle15_cross_product_output.log`](../matrix/cycle15_cross_product_output.log). Total runtime 461s (≈7.5 min) on 30,030 predictions across 3 products.

#### Result matrix (per pre-reg 6 cells)

| # | Strategy | Product | Full Δ (p) | Split | Forward Δ (p) | **Overall** |
|:-:|----------|---------|:-:|:-:|:-:|:-:|
| H1 | PooledMatrixBias | Mega 6/45 | **−0.117 (0.67)** | Reject (Δ<0) | +0.200 (0.83) | **Reject** |
| H2 | PooledMatrixBias | Power 6/55 | +0.032 (0.87) | Reject (h1 Δ=−0.106 flip) | **−0.400 (0.52)** | **Reject** |
| H3 | PooledMatrixBias | Lotto 5/35 | **−0.677 (0.046)** | Reject (Δ<0) | **−1.200 (0.39)** | **Reject** (Δ<0 nominal sig) |
| H4 | HierarchicalBayesMatrix w=0.5 | Mega 6/45 | **−0.299 (0.26)** | Reject (Δ<0) | +0.600 (0.55) | **Reject** |
| H5 | HierarchicalBayesMatrix w=0.5 | Power 6/55 | +0.032 (0.87) | Reject (h2 Δ=+0.030 tiny) | +0.200 (0.80) | **Inconclusive** |
| H6 | HierarchicalBayesMatrix w=0.5 | Lotto 5/35 | **−0.677 (0.046)** | Reject (Δ<0) | **−1.200 (0.39)** | **Reject** (Δ<0 nominal sig) |

#### Per-product detail

**Mega 6/45 (N=1302)**:

| Strategy | Full % | H1 % | H2 % | Fwd % | Full Δ (p) | vs Bayes (full) |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|
| Random | 2.363 | 2.033 | 2.704 | 2.000 | — | — |
| Bayesian (anchor) | 2.696 | 2.432 | 2.519 | 1.200 | +0.333 (0.21) | — |
| PooledMatrixBias | 2.246 | 2.105 | 2.704 | 2.200 | −0.117 (0.67) | **−0.450** (worse) |
| HierBayesMatrix w0.5 | 2.063 | 1.887 | 2.396 | 2.600 | −0.299 (0.26) | **−0.633** (worse) |

**Power 6/55 (N=1334)**:

| Strategy | Full % | H1 % | H2 % | Fwd % | Full Δ (p) | vs Bayes (full) |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|
| Random | 1.264 | 1.270 | 0.990 | 1.200 | — | — |
| Bayesian (anchor) | 1.361 | 1.446 | 1.289 | 1.400 | +0.097 (0.66) | — |
| PooledMatrixBias | 1.297 | 1.164 | 1.439 | 0.800 | +0.032 (0.87) | −0.065 |
| HierBayesMatrix w0.5 | 1.297 | 1.305 | 1.020 | 1.400 | +0.032 (0.87) | −0.065 |

**Lotto 5/35 (N=543)** — most telling:

| Strategy | Full % | H1 % | H2 % | Fwd % | Full Δ (p) | vs Bayes (full) |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|
| Random | 1.625 | 1.871 | 1.397 | 2.400 | — | — |
| Bayesian (anchor) | 1.580 | 1.754 | 1.471 | 1.600 | −0.045 (0.90) | — |
| PooledMatrixBias | **0.948** | 1.170 | 1.323 | 1.200 | **−0.677 (0.046)** | **−0.632** (much worse) |
| HierBayesMatrix w0.5 | **0.948** | 0.936 | 1.765 | 1.200 | **−0.677 (0.046)** | **−0.632** (much worse) |

#### Principle #14 magnitude check

All 6 hypotheses: `|Δ_full| ≤ 0.677pp < 0.9pp threshold` → **no auto-flag**. Lotto negative Δ=−0.677pp borderline but within limit. Clean result.

#### Tournament composite (§8.2, full-sample)

- **Mega 6/45**: Freq_Hot #1 (driven by +17pp ROI outlier noise, same as Chu kỳ 14). OnlineBayes_λ0.01 #2, Bayesian #3. Pooled strategies not in top 3.
- **Power 6/55**: Bayesian (own-product) #1, PooledMatrixBias/HierBayes #2-3 (Δ_win=+0.032pp).
- **Lotto 5/35**: OnlineBayes_λ0.01 #1 (same as Chu kỳ 14), Adaptive #2. Pooled strategies in bottom tier.

Pool strategies **never tournament top-1** across 3 products → mechanism không competitive ngay cả với weak baseline z-normalization.

### Bài học Chu Kỳ 15

- 🎯 **Shared-RNG hypothesis FALSIFIED on matrix** — replicates Chu kỳ 13 3D finding (Max 3D Pro pooling hurt −0.64pp vs JointDigitBias). Lotto 5/35 pool hurt **−0.632pp vs own-product Bayesian** — gần identical magnitude với Chu kỳ 13 3D hurt. Cross-product pooling **consistently bad across both product families** khi bias patterns distinct.

- 🎯 **Data horizon artifact trên Lotto**: Lotto has only 543 draws (post-2025-06), nên pool evidence từ Power/Mega **dominates numerically** (Power+Mega contribute ~7900 draws of numbers in [1,35] vs Lotto's ~2000). Pool "drowns" Lotto's own signal với Power/Mega's distinct distribution → measurable harm Δ=−0.68pp. Validates "products have distinct RNG distributions" stronger hơn symmetric case.

- 🎯 **Principle #14 magnitude check held** — all |Δ| ≤ 0.677pp < 0.9pp threshold. No false Accept risk. Lotto borderline nominal sig p=0.046 direction NEGATIVE → "significant evidence that pooling HURTS", not "significant evidence of edge". Correct null-rejection semantics.

- 🎯 **Win-rate axis FULLY EXHAUSTED** cross-product × 2 family × 5 paradigms:
  - 3D frequency/probabilistic/joint/copula/discriminative/pooled — all Reject (Chu kỳ 4-13)
  - Matrix frequency/Bayesian/adaptive/online/pooled — all Reject (Chu kỳ 1-15)
  - Project-wide ~55 strategies × 5 products × 3-gate = **0 robust Accept/Suggestive**
  - Next win-rate path would be Path #4 Neural (highly likely overfit per Chu kỳ 12 lesson) or Path #6 GA (same risk) — BREAKTHROUGH_ROADMAP assigns both low priority
  - **Mandatory pivot Chu kỳ 16 → Path #2 Kelly Portfolio** (ROI-axis, only remaining meaningful mechanism)

- 🎯 **Validation of Chu kỳ 13 generalization**: Chu kỳ 13 finding "distinct bias patterns, pool hurts" predicted Chu kỳ 15 outcome correctly. Methodology corpus strengthened — shared-infrastructure hypotheses need specific evidence, not assumed.

### Follow-up

Per pre-registration 6/6 Reject follow-up: **Chu Kỳ 16 mandatory = Path #2 Kelly-optimal Multi-ticket Portfolio** (ROI-axis pivot).

Project research focus shifts from "win-rate maximization" (confirmed near-null across all tested mechanisms) to "ROI damage minimization via portfolio theory". EV-negative game acknowledged; goal becomes "least negative ROI per dollar bet" không phải "positive ROI".

---

*Result appended: 2026-04-21. Chu Kỳ 15 closed. Next: Chu Kỳ 16 Path #2 Kelly Portfolio (ROI-axis pivot mandatory).*

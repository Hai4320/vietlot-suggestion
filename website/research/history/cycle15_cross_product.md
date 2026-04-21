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

*Pre-registered: 2026-04-21 — Chu Kỳ 15 Path #3 Cross-product Joint Matrix. Implementation pending user approval.*

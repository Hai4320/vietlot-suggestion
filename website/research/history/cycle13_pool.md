## Chu Kỳ 13 — Pre-Registration: Cross-Product Pool (Path B) — Last 3D Mechanism (04/2026)

### Context

Chu kỳ 11+12+12.5 eliminated 2 of 3 remaining 3D paths (Copula Path A, GBM Path E). **Path B (Cross-product pool)** là last meaningful mechanism chưa test trên 3D. Sau Chu kỳ 13, 3D mechanism space fully exhausted → mandatory pivot to matrix products.

User priority: exhaust 3D trước khi shift.

### Hypothesis (pre-registered)

**Core hypothesis**: Max 3D và Max 3D Pro **share RNG infrastructure** (same vendor Vietlott, same 3-digit 0-9 format, overlap time window). Pooling data → tighter bias estimate vs individual-product.

**H1 — PooledDigitBias on Max 3D**:
- Pool Max 3D train + Max 3D Pro (filtered by date ≤ cutoff) → fit 1000-cell joint histogram với Laplace smoothing
- Predicted `exact_match_rate > Random` + `> JointDigitBias` (individual) trên full + split-half + forward
- Expected: Δ ≈ +0.1 to +0.3pp (conservative — compliant với Principle #14 ceiling +0.4pp × 3 = +1.2pp warning threshold)

**H2 — HierarchicalBayesDigit on Max 3D**:
- Mixed prior: `α_combined = (1−w) × α_pooled + w × α_own_product` with `w=0.5`
- Test if soft pooling beat hard pooling và individual

**H3, H4 — Same strategies trên Max 3D Pro**.

### Methodology

**Products & data splits**:
- Max 3D (1065 draws, midpoint 532, forward last 100)
- Max 3D Pro (711 draws, midpoint 355, forward last 100)

**Cross-product date filtering** (strict walk-forward):
At step i trong Max 3D walk-forward, train = `max_3d_draws[:i]`. Pooled adds `max_3d_pro_draws` có `date ≤ max_3d_draws[i-1].date`. Tương tự cho Max 3D Pro walk-forward.

**Strategies** (K=2 new, Bonferroni α=0.025):

| Strategy | Role | Parameters (fixed) |
|----------|------|----------|
| `Random` | Primary baseline | uniform 000-999 |
| `JointDigitBias` | **Mechanism anchor** — individual-product | lookback=300, temperature=1.0, alpha=1.0 |
| `FreqWholeHot` | Secondary baseline | lookback=200 |
| **`PooledDigitBias`** | New #1 — hard pool | pool both products, lookback_per_product=300, temperature=1.0, alpha=1.0 |
| **`HierarchicalBayesDigit`** | New #2 — soft pool | w_own=0.5, lookback=300, temperature=1.0, alpha=1.0 |

**Backtest params**: `min_history=50`, `n_runs=5`, `n_predictions=2`, `seed=42`.

**3 gates**: full + split-half + forward_last_100 (same as Chu kỳ 11/12).

### Decision rule (binding)

Same 3-gate stacked rule như Chu kỳ 11/12 với α_strict=0.025 (K=2):

| Full | Split | Forward | Overall |
|:-:|:-:|:-:|:-:|
| pass Bonferroni + CI_lo > 0 | both Δ > 0 + both p < 0.025 | Δ > 0 | **Accept** |
| pass Bonferroni | both Δ > 0 + both p < 0.05 | Δ > 0 | **Suggestive** |
| pass Bonferroni | 1 half p < 0.05, both Δ > 0 | Δ > 0 | **Inconclusive** |
| Δ ≤ 0 tại bất kỳ gate | — | — | **Reject** |
| Direction flip split-half | — | — | **Reject** |

**Principle #14 magnitude check (binding)**: Nếu `|Δ_full| > +1.2pp` (3× bias ceiling 0.4pp), auto-flag pending audit, không claim Accept dù technical gate pass. Prevent repeat of Chu kỳ 12 "Technical Accept" error.

**Principle #15 concentration check**: không áp dụng cho probabilistic strategies — auto-satisfy since sampling distribution.

### Power analysis

Same sample sizes Chu kỳ 11/12 → same power estimates (~80% on Max 3D full, 70-75% on Max 3D Pro halves, 25% on forward). Limitation acknowledged.

### Artifacts kỳ vọng

- `website/research/3d/pooled_strategies.py` — 2 strategy classes + date-filter helper
- `website/research/3d/cycle13_pooled_backtest.py` — 3-gate harness
- `website/research/3d/cycle13_pooled_results.json`
- Section "Chu Kỳ 13 — Result" append vào file này

### Follow-up (conditional)

- **Accept** (passing Principle #14): first robust 3D Accept after 25 strategies! Audit + replication required before ship.
- **Suggestive/Inconclusive**: Document; 3D mechanism space exhausted; pivot matrix next cycle.
- **Reject/Principle#14 flag**: Confirm 3D fully exhausted (26 strategies × 5 products × pooling). **Chu kỳ 14 mandatory pivot** to matrix products (Path #1 Online Bayesian).

### Guardrails

- No hyperparameter tuning (lookback, w, temperature pre-fixed).
- No strategy variants post-hoc.
- Principle #14 binding — large Δ auto-flag.
- Pre-reg immutable after implementation begins.

---

*Pre-registered: 2026-04-21 — Chu kỳ 13 Path B (Cross-product pool). Implementation pending.*

### Result — Chu Kỳ 13 (2026-04-21, cùng ngày pre-registration)

**Verdict: 4/4 Reject — Path B eliminated. 3D mechanism space fully exhausted (27 strategies tested).**

#### Max 3D (N=1065)

| Strategy | Full % | Half1 % | Half2 % | Fwd % | Full Δ (p) | Split | Fwd Δ (p) | vs JDB (full) | **Overall** |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Random | 1.704 | 1.888 | 1.895 | 2.900 | — | — | — | — | — |
| JointDigitBias | 2.010 | 2.137 | 1.970 | 2.200 | +0.305 (0.11) | — | −0.700 (0.32) | — | — |
| PooledDigitBias | 2.049 | 2.178 | 2.064 | 1.800 | +0.345 (0.07) | Reject | **−1.100** (0.10) | +0.039 | **Reject** (fwd flip) |
| HierarchicalBayesDigit | 2.197 | 1.929 | 2.308 | 1.700 | **+0.493** (0.011) | Reject | **−1.200** (0.07) | +0.187 | **Reject** (fwd flip) |

#### Max 3D Pro (N=711)

| Strategy | Full % | Half1 % | Half2 % | Fwd % | Full Δ (p) | vs JDB (full) | **Overall** |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Random | 1.997 | 1.770 | 2.022 | 1.500 | — | — | — |
| JointDigitBias | 2.375 | 2.033 | 1.854 | 1.600 | +0.378 (0.14) | — | — |
| PooledDigitBias | 1.740 | 2.131 | **1.405** | 2.300 | **−0.257** (0.27) | **−0.635** | **Reject** (full Δ<0) |
| HierarchicalBayesDigit | 1.876 | 2.098 | 1.629 | 1.400 | **−0.121** (0.61) | −0.499 | **Reject** (full Δ<0) |

### Bài học

- 🎯 **"Shared RNG bias" hypothesis NOT supported**: Pooled strategies THUA `JointDigitBias` individual trên Max 3D Pro (−0.64pp và −0.50pp). Nếu 2 products thực sự share bias, pooling phải help; thay vào đó pooling HURTS Max 3D Pro performance. Consistent với Chu kỳ 8 finding digit bias stable nhưng product-specific (Max 3D Pro digit 6 units +1.6pp distinct từ Max 3D pattern).

- 🎯 **Principle #13 forward gate validated lần thứ 5** (Chu kỳ 7 EVMax, 9 ExpDecay, 11 EmpCopula, 12 GBM Max 3D, 13 HierarchicalBayes Max 3D). Max 3D HierarchicalBayes full-sample p=0.011 nominal significant + direction positive, NHƯNG forward Δ=−1.20pp. Bắt được overfit thêm một lần nữa. Principle #13 binding rule vững chắc.

- 🎯 **Principle #14 magnitude check PASSED (ưa chuộng)**: All 4 hypotheses có |Δ_full| < 1.2pp threshold. No false Accept risk. Pre-emptive guard nếu sau này có claim lớn. Chu kỳ 12 GBM sẽ bị auto-flag bởi check này.

- 🎯 **Max 3D Pro POOLED hurts more than helps**: Half2 Max 3D Pro PooledDigitBias Δ=−0.618pp (p=0.045 nominal sig *against*). Hard pool dilutes Max 3D Pro's actual bias (digit 6 at units) với Max 3D's different bias pattern (digit 0 at hundreds per Chu kỳ 4/8). **Confirm 2 products have different RNG seeds/infrastructure — null hypothesis của Path B**.

- 🎯 **27 strategies tested on 3D, 0 Accept/Suggestive** (25 previous + 2 copula Chu kỳ 11 + 2 GBM variants Chu kỳ 12 + 2 pooled Chu kỳ 13 = 27 total — actually re-count: 23 pre-11 + 2 copula + 1 GBM + 2 pooled = 28 strategies, all failed). **Definitive: 3D RNG không exploitable tại current N** với any mechanism paradigm (probabilistic, copula, discriminative, pooled).

### Artifacts

- [3d/pooled_strategies.py](../3d/pooled_strategies.py) — PooledDigitBias + HierarchicalBayesDigit + date-filter helper
- [3d/cycle13_pooled_backtest.py](../3d/cycle13_pooled_backtest.py) — 3-gate harness + Principle #14 check
- [3d/cycle13_pooled_results.json](../3d/cycle13_pooled_results.json) — full results
- [3d/cycle13_pooled_output.log](../3d/cycle13_pooled_output.log) — run log

### Impact

1. **3D research line definitively closed** — 28 strategies × 2 products × 3 paradigms × 5 cycles with 3-gate protocol, 0 robust edges. Accept "no exploitable edge at current data horizon" as final conclusion for 3D.

2. **Chu kỳ 14 mandatory pivot to matrix products** per Chu kỳ 10 roadmap + Chu kỳ 11-13 progression. Path #1 Online Bayesian Kalman (Mega 6/45 primary). Implementation was deferred 3 cycles waiting for 3D exhaustion — now justified to proceed.

3. **Methodology corpus complete for negative-result documentation**:
   - Principle #11 split-half replication (Chu kỳ 7/9) ✓ validated
   - Principle #12 variable-baseline power (Chu kỳ 8/9) ✓ validated
   - Principle #13 forward gate (Chu kỳ 7/9/11/12/13) ✓ validated 5 times
   - Principle #14 magnitude sanity (Chu kỳ 12+12.5) ✓ validated, non-binding on Chu kỳ 13
   - Principle #15 prediction concentration (Chu kỳ 12.5) ✓ codified, applies to ML strategies

4. **Website/production**: Update 3D rankings nếu exist — no strategy beats Random. Consider hiding 3D tab hoặc label "research-only, no confirmed edge".

5. **3D future retry criteria**:
   - Wait for additional >500 draws (~2027)
   - OR discovery of novel bias dimension (e.g., time-of-draw, machine-specific serial, cross-time-of-day)
   - OR fundamental RNG audit (if Vietlott publishes methodology)

---

*Cập nhật lần cuối: 2026-04-21 — Hoàn thành Chu kỳ 13 (Path B Cross-product pool, 4/4 Reject). 3D mechanism space exhausted (28 strategies). Chu kỳ 14 mandatory pivot to matrix products (Path #1 Online Bayesian).*

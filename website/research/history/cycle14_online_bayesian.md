## Chu Kỳ 14 — Pre-Registration: Online Bayesian Kalman-style Posterior (Path #1) — First Matrix Breakthrough (04/2026)

### Context

Chu kỳ 13 formally closed 3D research line (28 strategies × 5 paradigms × 3-gate → 0 Accept/Suggestive). Mandatory pivot to matrix products per [BREAKTHROUGH_ROADMAP §Chu Kỳ 14 Proposal](../BREAKTHROUGH_ROADMAP.md). Path #1 Online Bayesian originally scheduled Chu kỳ 11, deferred 3 cycles chờ 3D exhaust. Nguyên vẹn rationale (win-rate impact ▲▲▲ DIRECT, low effort 1-2 ngày, extends existing Bayesian toolbox).

Mechanism: existing `BayesianDirichletStrategy` ([matrix/backtest.py:263](../matrix/backtest.py#L263)) refits Dirichlet posterior from scratch mỗi prediction từ `lookback_days=365` window. Hypothesis: nếu matrix products có slow bias drift chưa detect (Chu kỳ 8 confirmed no drift trên 3D, nhưng matrix **chưa verify**), online update với exponential forgetting factor `λ` bắt được drift mà batch re-fit averages out.

### Hypothesis (pre-registered)

**Core claim**: `OnlineBayesianStrategy` với forgetting factor `λ` beat batch `BayesianDirichletStrategy(365,1.0,1.0)` trên matrix products với Δ_win_rate_ge3 > 0 (full + split-half + forward).

**H1 — Mega 6/45 + OnlineBayes(λ=0.03)** (primary):
- Predicted `win_rate_ge3 > Random` AND `> BayesianDirichlet` trên full + both halves + forward_last_100
- λ=0.03 ≈ half-life 23 draws (medium memory) — compromise giữa drift responsiveness và noise stability
- Expected Δ vs Random: +0.1 to +0.3pp (conservative, matrix bias ceiling +0.3pp)

**H2 — Mega 6/45 + OnlineBayes(λ=0.01)**:
- Long memory (half-life ~69 draws) — if drift slow, long λ captures better
- Same 3-gate requirements

**H3 — Mega 6/45 + OnlineBayes(λ=0.10)**:
- Short memory (half-life ~7 draws) — if drift fast OR bias regime changes, short λ adapts
- Same 3-gate requirements

**H4, H5, H6 — Same 3 variants trên Lotto 5/35** (secondary product, smaller N → weaker power expected).

### Methodology

**Products & data splits**:
- **Mega 6/45** (primary): N=1302, min_history=100. Midpoint=651 → Half-1 [100, 651), Half-2 [651, 1302). Forward_last_100 = [1202, 1302).
- **Lotto 5/35** (secondary): N=543, min_history=100. Midpoint=271 → Half-1 [100, 271), Half-2 [271, 543). Forward_last_100 = [443, 543).
- Power 6/55 KHÔNG include (tertiary, focus compute on primary + secondary per roadmap).

**Mechanism spec** (fixed, immutable post-implementation):

```
Initialize: α_0 = prior_strength · 1_N       # N = max_val (45 for Mega, 35 for Lotto)
For each historical draw d in train window (chronological):
    obs_d = one-hot vector of drawn numbers   # shape (N,), 1 for each drawn num else 0
    α_t = (1 − λ) · α_{t-1} + obs_d
Sample: θ ~ Dirichlet(α_T)                   # T = step corresponding to target_date
Select num_count numbers without replacement, probs ∝ θ^(1/temperature)
```

**Key difference vs batch `BayesianDirichlet(365,1.0,1.0)`**:
- Batch: uses only draws trong last 365 days, uniform weight, refit per call
- Online: uses ALL historical draws trong train window, exponential weight decay, accumulates state
- Both use same prior, same temperature=1.0, same sampling step → clean mechanism isolation

**Strategies to run** (K=3 new variants → Bonferroni α_strict=0.0167; total tournament 10 strategies per §8.3 canonical baselines):

| Strategy | Role | Parameters (immutable pre-reg) |
|----------|------|--------------------------------|
| `Random` | Mandatory baseline | uniform |
| `Freq_Hot(365, 0.8)` | Mandatory baseline §8.3 | lookback_days=365, weight=0.8 |
| `Pattern(180)` | Mandatory baseline §8.3 | lookback_days=180 |
| `Bayesian(365, 1.0, 1.0)` | **Mechanism anchor** — batch refit | existing `BayesianDirichletStrategy` |
| `Bayes_Sharp(180, 1.0, 0.5)` | Secondary ref — sharp batch | existing Bayesian variant |
| `MaxEntropy(365, 1.0)` | Extra ref (cross-product leader §8) | existing |
| `Adaptive([30,90,180,365], 10, "hot")` | Extra ref | existing |
| **`OnlineBayes(λ=0.01, T=1.0, prior=1.0)`** | **New #1 — long memory** | prior_strength=1.0, temperature=1.0 |
| **`OnlineBayes(λ=0.03, T=1.0, prior=1.0)`** | **New #2 — medium memory (default)** | same |
| **`OnlineBayes(λ=0.10, T=1.0, prior=1.0)`** | **New #3 — short memory** | same |

**Backtest params**: `min_history=100`, `n_runs=5`, `seed=42` (reset state per run per Principle R3 reproducibility).

**3 gates** (same stacking như Chu kỳ 11/13):
1. **Full-sample** walk-forward vs Random. 2-prop z-test + Newcombe CI. Bonferroni K=3 → α_strict=0.0167.
2. **Split-half** (time-ordered midpoint). Both halves Δ > 0 AND both p < 0.05 (non-Bonferroni for split gate per Principle #11).
3. **Forward_last_100** (fit on [0, N−100), predict [N−100, N)). Directional Δ > 0 required; p < 0.05 bonus not required per Chu kỳ 10 forward gate relaxation.

### Decision rule (binding — set trước khi thấy kết quả)

| Full | Split | Forward | Overall |
|:-:|:-:|:-:|:-:|
| p < 0.0167 + CI_lo > 0 | both Δ > 0 + both p < 0.05 | Δ > 0 | **Accept** |
| p < 0.05 (fail Bonf) | both Δ > 0 + both p < 0.05 | Δ > 0 | **Suggestive** |
| p < 0.05 | direction-consistent, 1 half p ≥ 0.05 | Δ > 0 | **Inconclusive** |
| Δ ≤ 0 tại bất kỳ gate | — | — | **Reject** |
| Direction flip split-half (d1 × d2 ≤ 0) | — | — | **Reject** |

**Principle #14 magnitude sanity (binding)**: matrix bias ceiling +0.3pp × 3 = **+0.9pp auto-flag threshold**. Nếu `|Δ_full| > 0.9pp` → **Ship-with-caveats pending audit**, bất kể p-value (prevent Chu kỳ 12 GBM "Technical Accept" repeat).

**Principle #15 concentration check**: KHÔNG áp dụng — OnlineBayes là probabilistic sampling strategy (Dirichlet), not discriminative ML. Auto-satisfy per methodology §3.9.

**Secondary comparison** (descriptive only, NOT gate): compare Online variants vs batch `Bayesian(365,1.0,1.0)` (mechanism anchor). Nếu vs-Random pass nhưng vs-Bayesian fail → online adds nothing over batch; mechanism chưa prove its value.

### Power analysis (Principle #12)

Matrix baseline `win_rate_ge3` ≈ 2.4% (Mega 6/45 hypergeometric P(X≥3) = 2.38%) và ≈ 2.3% (Lotto 5/35 hypergeometric P(X≥3) = 2.35%).

**Formula**: `n_required ≈ (z_α/2 + z_β)² × [p_s(1-p_s) + p_b(1-p_b)] / δ²`

Với Δ=+0.3pp (matrix ceiling, conservative), α=0.0167 Bonf K=3, β=0.20 (80% power):
- `n_required ≈ (2.39 + 0.84)² × (0.027·0.973 + 0.024·0.976) / 0.003²`
- `≈ 10.43 × 0.0497 / 9e-6 ≈ 57,600 trials/gate`

**Sample sizes actual**:
| Gate | Mega 6/45 | Lotto 5/35 |
|------|:-:|:-:|
| Full-sample | 6,010 | 2,215 |
| Half-1 | 2,755 | 855 |
| Half-2 | 3,255 | 1,360 |
| Forward_last_100 | 500 | 500 |

**Power estimates** (back-calculated at actual n):
- Mega full: ~30% power (underpowered ~50%)
- Mega halves: ~18% power each (severely underpowered)
- Forward: <5% power (noise dominates)
- Lotto: ~12-20% power (even weaker)

**⚠️ Limitation acknowledged (R2 per §1.1)**: At expected effect size +0.3pp, study is severely underpowered on splits + forward. Implications:
1. **Failure to reject is weak evidence** — could be no effect OR insufficient power
2. **Positive result still meaningful** — passing despite weak power = larger true effect
3. **Forward directional requirement** (not strict p<0.05) là pragmatic trade-off per Chu kỳ 10 framework
4. **Chu kỳ 8 3D finding relevant**: digit bias on 3D found stable (no drift). Matrix may be similar → online ≈ batch asymptotically → null hypothesis (H0: online == batch) plausible a priori

### Tournament composite score (§8.2)

After running, compute tournament score per product:

```
score(s) = 0.40·z(Δ_win) + 0.30·z(Δ_ROI) + 0.15·z(sharpe) + 0.15·z(−log10(p_raw))
```

Z-normalize across all 10 strategies in tournament. Top-1 per product reported + cross-product average rank for robust winner per §8.4.

### Artifacts kỳ vọng

- [`website/research/matrix/online_bayesian.py`](../matrix/online_bayesian.py) — `OnlineBayesianStrategy` class (K=3 variants via constructor)
- `website/research/matrix/cycle14_online_bayesian_backtest.py` — 3-gate harness (reuses `walk_forward_backtest` + `attach_significance` from [matrix/backtest.py](../matrix/backtest.py))
- `website/research/matrix/cycle14_online_bayesian_results.json` — per §4 schema (accuracy + profitability + significance + split-half + forward + tournament composite)
- Section "Chu Kỳ 14 — Result" append vào file này

### Follow-up (conditional)

- **Accept** (3-gate pass + §14 OK): **first project-wide robust Accept**. Ship to UI per [RESEARCH_TO_UI_PLAYBOOK §2 Accept row](../../RESEARCH_TO_UI_PLAYBOOK.md). Replication mandatory trên Power 6/55 sau đó.
- **Suggestive/Inconclusive** (partial gate): research/algo page only with "🔬 Directional" badge, no `picks` promotion.
- **Ship-with-caveats** (§14 flag, magnitude implausible): research page only, require audit cycle (Chu kỳ 14.5 per Chu kỳ 12.5 precedent).
- **Reject** (Δ ≤ 0 OR direction flip): next cycle = Chu Kỳ 15 Path #3 Cross-product joint matrix (Power/Mega/Lotto overlap [1,35]).

### Guardrails

- K=3 hyperparameter variants pre-fixed; NO post-hoc tuning λ.
- NO adding more variants if H1/H2/H3 all Reject.
- Principle #14 binding — large |Δ| auto-flag.
- Pre-reg immutable sau khi implementation begins.
- Mechanism anchor comparison (vs batch Bayesian) descriptive only, không shift gate.

---

*Pre-registered: 2026-04-21 — Chu Kỳ 14 Path #1 Online Bayesian. Implementation pending approval. Backtest NOT yet run.*

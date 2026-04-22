## Chu Kỳ 21 — Pre-Registration: Hierarchical Bayesian with Empirical Bayes Prior (Hướng B từ META_REVIEW)

**Status (2026-04-22)**: AWAITING user approval. Estimated 3-4 ngày effort.

**Companion docs**:
- [executed/cycle20_methodology_refinement.md](executed/cycle20_methodology_refinement.md) — Principle #12 BINDING + #17 family elimination + composite-binding §8
- [README.md](README.md) — proposals index + Chu kỳ 21 decision rules

### Context

Chu kỳ 20 baseline analysis surfaced **Bayesian batch (non-online)** xuất hiện 2× trong Inconclusive-underpowered list (Power 6/45 Δ=+0.333pp, power 9-12%). Chu kỳ 14 online Kalman Bayesian reject 6/6, nhưng online = adaptive variant; batch/hierarchical variants of Bayesian family **CHƯA structured test** qua 3-gate.

**Hướng B from META_REVIEW §5** proposes:
- Hierarchical per-product Dirichlet prior (pooled via empirical Bayes)
- Marginal-only (drop position independence assumption from Chu kỳ 11 Copula)
- Lazy refit (weekly instead of per-draw)
- Mixture-of-experts (short + long memory blend)

**This pre-reg scopes to**: Hierarchical EB (primary) + Sharp variant + Lazy refit = 3 variants. Not testing Marginal-only (matrix numbers unordered, chain rule less natural) or Mixture-of-experts (too many parameters at current N).

### Hypothesis (pre-registered)

**Core claim**: Hierarchical Bayesian với empirical Bayes prior (pooled across products at prior level, posterior computed per-product) produces less-negative Δ than batch Bayesian (Chu kỳ 2, reject-after-replication) and online Kalman (Chu kỳ 14, eliminated) by leveraging cross-product regularization WITHOUT full data pooling.

**H1 — Power 6/55 + HierarchicalEB** (primary):
- Δ_win_rate_ge3 > Random on full + both halves + forward_last_100
- Δ > 0 vs `Freq_Hot(365, 0.8)` composite anchor
- Expected Δ vs Random: +0.1 to +0.3pp

**H2 — Mega 6/45 + HierarchicalEB** (primary — Chu kỳ 20 close-call evidence):
- Chu kỳ 20 Inconclusive-UP shows Bayesian batch Δ=+0.333pp here
- Hierarchical EB expected to stabilize via empirical Bayes pooling
- Same decision rules

**H3 — Lotto 5/35 + HierarchicalEB** (secondary, exploratory-only):
- Phase 0 power gate: N=543 << n_required(50% power) → classify exploratory
- NO Accept/Reject claims per Principle #12 binding
- Descriptive observations only

**H4 — Sharp variant (temperature=0.5)**:
- Same 3 products, sharper sampling from posterior
- Test if temperature significantly affects Hierarchical EB

**H5 — Lazy refit (weekly)**:
- Same 3 products, refit every 7 draws instead of per-draw
- Test refit frequency sensitivity

### Phase 0 Power Gate Classification (Principle #12 BINDING)

Per Chu kỳ 20 upgrade:

| Product | N current | n_required at α=0.0167 (K=3), 80% power, Δ=0.3pp | Classification |
|---|:---:|:---:|:---:|
| Power 6/55 | 1334 | ~37,441 | **exploratory-only** (ratio 0.036) |
| Mega 6/45 | 1302 | ~49,000 | **exploratory-only** (ratio 0.027) |
| Lotto 5/35 | 543 | ~37,441 | **exploratory-only** (ratio 0.014) |

**ALL 3 products exploratory-only**. Per Principle #12 binding:
- Cannot make strong Accept claims (power <80%)
- Cannot make strong Reject claims (power <50%)
- **Descriptive-only**: observe Δ, report p-values, note if any strategy shows Δ > 0.5pp consistent direction cross segments
- **Inconclusive-underpowered flag**: any Δ > 0.3pp + direction consistent → candidate for revisit at N ≥ 2000

**Rationale for running despite exploratory status**: Chu kỳ 20 surfaced Bayesian batch as close-call (Inconclusive-UP). Hierarchical variant is distinct mechanism within family; worth descriptive test to inform future revisit priority (is Hierarchical strictly better/worse than batch? does it add to Inconclusive-UP pile?).

### Family Check (Principle #17 BINDING)

**Proposed mechanism family**: Bayesian

**Family status in eliminated registry** ([PROJECT_CLOSURE_REPORT.md §7.5](../PROJECT_CLOSURE_REPORT.md)):
- **Adaptive/drift-based** ELIMINATED (Chu kỳ 14 online Kalman 6/6 R) — Hierarchical EB is **NOT adaptive**, uses fixed prior from empirical Bayes pre-computation. ✓ Distinct.
- **Cross-product pooling** ELIMINATED (Chu kỳ 13 + 15) — Hierarchical EB **pools at PRIOR level only**, per-product posterior computation. Subtle but important distinction from cycle13/15 which pool RAW draws. ✓ Classified as distinct.

**Risk**: Hierarchical EB could be re-classified as "Cross-product pooling variant" post-hoc if results look like cycle13/15. Mitigation: explicit design constraint — Hierarchical EB prior uses **global mean frequency** across products (1 scalar hyperparameter) not full draw aggregation.

**Verdict**: NEW paradigm within Bayesian family, distinct from eliminated Online Kalman. Pre-reg declares explicitly.

### Methodology

**Products**:
- Power 6/55 (N=1334, primary)
- Mega 6/45 (N=1302, primary)
- Lotto 5/35 (N=543, secondary exploratory-only per Phase 0)

**Data splits** per product:
| Product | N | min_history | Midpoint | Half-1 | Half-2 | Forward_last_100 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Power 6/55 | 1334 | 100 | 667 | [100, 667) | [667, 1334) | [1234, 1334) |
| Mega 6/45 | 1302 | 100 | 651 | [100, 651) | [651, 1302) | [1202, 1302) |
| Lotto 5/35 | 543 | 100 | 271 | [100, 271) | [271, 543) | [443, 543) |

#### Mechanism spec (immutable post-implementation)

**Hierarchical EB Dirichlet**:
```
Step 1 (offline): Compute empirical mean frequency per product
  For product p ∈ {655, 645, 535}:
    f̄_p[i] = count_of_number_i_in_draws_p / total_draws_p  for i ∈ [1, max_val_p]

Step 2 (offline): Compute global mean frequency (across products, length-normalized)
  f̄_global[i] = mean over products where i ∈ range_p of f̄_p[i]
  (falls back to uniform if i not in any product's range)

Step 3 (per-product fit): Build prior from global frequency
  α_p[i] = prior_strength × max_val_p × f̄_global[i]    # scaled to sum ≈ prior_strength × K
  (prior_strength=1.0 default, temperature=1.0)

Step 4 (per-draw prediction):
  For target draw at time t, use train_window = draws[t-lookback_days:t]
  count_p_window[i] = number of times i drawn in train_window
  posterior_p[i] = α_p[i] + count_p_window[i]
  
Step 5 (sample):
  posterior_p_scaled[i] = posterior_p[i] ** (1/temperature)  # sharpen
  probs = posterior_p_scaled / sum
  numbers = np.random.choice(range, size=num_count, replace=False, p=probs)
```

**Variants (K=3 new strategies — Bonferroni)**:

| # | Name | temperature | refit | Extra |
|:-:|---|:---:|:---:|---|
| 1 | `HierarchicalEB` | 1.0 | per-draw | Default (primary) |
| 2 | `HierarchicalEB_Sharp` | 0.5 | per-draw | Sharp sampling |
| 3 | `HierarchicalEB_Lazy` | 1.0 | every 7 draws | Weekly refit |

**Comparison baselines**:
- `Random` (mandatory, §1.3 METHODOLOGY)
- `Freq_Hot(365, 0.8)` (composite anchor per Chu kỳ 20 upgrade — must beat)
- `Bayesian(365, 1.0, 1.0)` (existing batch, Chu kỳ 2 + cycle14 anchor)

Total strategies in tournament: 6 (3 new + 3 baselines)

**Backtest params**: `n_runs=5`, `seed=42` (fresh strategy instance per run per R3 reproducibility).

#### 3-gate protocol (composite-binding per Chu kỳ 20)

**Decision by COMPOSITE tournament score** (EVALUATION §8 post Chu kỳ 20), not single metric:
- Score = 0.40 × z(Δ_win_rate_ge3) + 0.30 × z(Δ_ROI) + 0.15 × z(Sharpe) + 0.15 × z(−log10 p)

**Gate 1 — Full-sample** (exploratory context):
- Descriptive report composite rank + per-metric rank
- Flag any strategy với composite rank 1 + Δ > 0.3pp as Inconclusive-underpowered candidate (Principle #12 binding)

**Gate 2 — Split-half** (Principle #11):
- Time-ordered midpoint split
- Both halves Δ > 0 AND direction consistent → proceed
- Direction flip → instant Reject (no power dependency — direction-flip = noise, not underpower)

**Gate 3 — Forward_last_100** (Principle #13):
- Fit on [0, N−100), predict [N−100, N)
- Directional Δ > 0 required
- p-value bonus not required (relaxed per Chu kỳ 10 convention)

#### Decision rules (binding — set pre-experiment, adapted per Phase 0 exploratory classification)

| Composite rank | Full Δ | Split-half | Forward | Power | Verdict |
|:-:|:-:|:-:|:-:|:-:|:-:|
| #1 among 6 | > 0 | consistent dir both halves | Δ > 0 | exploratory (<50%) | **Inconclusive-underpowered-positive** (candidate for revisit) |
| #1 | > 0 | direction flip | — | any | Reject (direction flip = noise, power-independent) |
| #1 | > 0 | consistent | Δ ≤ 0 | any | Reject (forward veto) |
| Not #1 | any | any | any | exploratory | Descriptive note only, no individual verdict |
| Any | ≤ 0 | — | — | any | Reject (no positive direction) |

**No Accept verdict possible** under current Phase 0 classification. Best outcome: Inconclusive-UP-positive → candidate for N ≥ 2000 revisit.

### Principle checks

**Principle #14 — Magnitude sanity**:
- Matrix bias ceiling: 0.3pp (per closure report §6.2)
- Auto-flag if |Δ| > 0.9pp (3× ceiling)
- Action: require audit cycle before any verdict upgrade

**Principle #15 — Prediction concentration**:
- `n_unique_predictions / total_predictions ≥ 0.30` forward window
- Hierarchical EB is probabilistic (not discriminative ML) → typically meets
- Document concentration stat in results regardless

### Retry Tree (Principle #16 BINDING)

#### Tier 1 — Cycle-level alternatives (if paradigm fully falsified)

| Alternative | Trigger condition | Path forward |
|---|---|---|
| Hướng F Anomaly Detection | All 3 Hierarchical variants reject on forward gate + direction flip | Switch paradigm, 4-5d |
| Wait for data (Chu kỳ 22+) | All 3 Inconclusive-UP-positive (good signal but can't verify at low power) | Re-run at N ≥ 2000 (~2027) |
| Resume Optimization (cycle17a) | Current cycle doesn't inform optimization | Chu kỳ 22 optional |
| Closure + stop | Results add convergent null evidence, all paths exhausted | Update closure §7.5 family |

#### Tier 2 — Within-paradigm retries

| # | Variant | Trigger |
|:-:|---|---|
| 21.1 | Marginal-only hierarchical (chain rule on digit positions for 3D products) | Primary reject + evidence position-dependency exploitable |
| 21.2 | Mixture-of-experts (short + long memory blend) | Lazy variant pass forward but primary fail |
| 21.3 | Empirical Bayes with product weights (downweight Lotto) | Pooling artifact suspected |
| 21.4 | Hyperprior Gamma(1,1) on prior strength | Prior strength sensitivity issue |

**Execution policy**:
- No auto-retry
- Each retry requires user approval + fresh pre-reg
- Cap 2 within-paradigm retries (Bayesian family already has 23 rejects history)

### Effort + sequence

| Step | Task | Effort |
|---|---|:---:|
| 1 | User approval of this pre-reg | wait |
| 2 | Implement `matrix/hierarchical_bayesian.py` (HierarchicalEBStrategy + 2 variants) | 1d |
| 3 | Unit tests + seed reproducibility + cross-product data loader | 0.5d |
| 4 | Write backtest script `matrix/cycle21_hierarchical_bayesian_backtest.py` | 0.5d |
| 5 | Run backtest (~15-20 min expected) | 0.5d |
| 6 | Analysis + composite ranking + 3-gate application | 0.5d |
| 7 | Write verdict record `history/cycle21_hierarchical_bayesian.md` | 0.5d |
| 8 | UI decision + commit + push | 0.5d |
| **Total** | — | **~4d** |

### Artifacts (planned)

- **Pre-reg** (this file) → move to `proposals/executed/` after completion
- **Shared module**: `website/research/matrix/hierarchical_bayesian.py`
- **Backtest**: `website/research/matrix/cycle21_hierarchical_bayesian_backtest.py` + `_results.json`
- **Logs**: `matrix/logs/cycle21_hierarchical_bayesian_output.log`
- **History record**: `website/research/history/cycle21_hierarchical_bayesian.md`

### Exit conditions

**Best case (~5% probability at exploratory power)**:
- 1 variant composite rank #1 + Δ > 0.3pp full + directional split-half + forward positive
- → Inconclusive-UP-positive candidate added to §7.1.1 (update closure report)
- → User decides: wait for N ≥ 2000 or escalate to audit

**Most likely (~60% probability)**:
- All variants either composite rank <#1 OR fail split-half OR fail forward
- → Reject as new mechanism (still weak evidence per exploratory power)
- → Add to Bayesian family disclosure: batch + hierarchical + online all fail at current data

**Worst case (~5% probability)**:
- All variants direction-flip or negative Δ
- → Strong reject signal (direction-flip is power-independent)
- → Add to Principle #17 family disclosure: Bayesian-broadly eliminated (replacing current "online Kalman only")

### Notes

- This cycle is post-closure. Writing it as breakthrough attempt tests whether Chu kỳ 20 methodology refinement actually enables forward research or merely documents closure.
- Principle #12 binding means realistic expectation: Inconclusive-UP-positive is the best outcome at current power. Accept is impossible.
- If this cycle adds clear close-call evidence, Chu kỳ 22+ reopen priority list gets updated.

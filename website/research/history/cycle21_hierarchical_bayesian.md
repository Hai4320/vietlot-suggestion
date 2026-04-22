## Chu Kỳ 21 — Hierarchical Bayesian (Hướng B): 9/9 Reject

**Closed 2026-04-22**. Hướng B từ META_REVIEW unblocked per Principle #17 (NEW paradigm within Bayesian family). Implementation + backtest + verdict trong cùng ngày.

**Pre-reg (immutable)**: [proposals/executed/cycle21_hierarchical_bayesian.md](../proposals/executed/cycle21_hierarchical_bayesian.md)

### Executive summary

**9/9 Reject** (3 variants × 3 products). Hierarchical empirical-Bayes pooled prior KHÔNG extend Bayesian family success. Direction-flip split-half trên Power 6/55 (Sharp + Lazy) là **power-independent reject** — forward +1.6pp signal là noise, không phải underpower issue.

**Principle #12 Phase 0 classification**: exploratory-only (ALL 3 products). Per decision rules, no Accept/Inconclusive-UP-positive possible. Best achievable was Inconclusive-UP-positive (rank #1 + all gates positive + consistent). Not achieved.

**Bayesian family disclosure update**: Chu kỳ 2 batch + Chu kỳ 14 online Kalman + Chu kỳ 21 hierarchical = 3 mechanism families within Bayesian, all fail at current data. Closure §7.5 family registry should note "Bayesian-broadly exhausted (batch/online/hierarchical)".

### Results table

#### Power 6/55 (N=1334, midpoint=667)

| Strategy | Full Δ | Half1 Δ | Half2 Δ | Forward Δ | Composite rank | Decision |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Random (baseline) | — | — | — | — | 3 | — |
| Freq_Hot | +0.232 | +0.581 | −0.253 | +0.200 | 4 | — (anchor) |
| Bayesian (batch) | +0.189 | +0.400 | −0.052 | −0.800 | 5 | — |
| **HierarchicalEB** | −0.032 | +0.218 | −0.253 | +0.200 | 6 | **Reject** (full Δ<0) |
| **HierarchicalEB_Sharp** | +0.227 | +0.145 | **−0.277** | **+1.600** | **1** | **Reject** (split-half flip) |
| **HierarchicalEB_Lazy** | +0.292 | +0.327 | **−0.461** | **+1.600** | **2** | **Reject** (split-half flip) |

**Note**: Sharp + Lazy both rank top composite + forward +1.6pp positive, BUT split-half direction flip (h1 positive, h2 negative) → power-independent Reject per Principle #11.

#### Power 6/45 (N=1302, midpoint=651)

| Strategy | Full Δ | Half1 Δ | Half2 Δ | Forward Δ | Composite rank | Decision |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| HierarchicalEB | −0.183 | −0.181 | −0.738 | +0.600 | 5 | **Reject** (full Δ<0) |
| HierarchicalEB_Sharp | −0.316 | −0.545 | −0.277 | +1.600 | 6 | **Reject** (full Δ<0) |
| HierarchicalEB_Lazy | −0.133 | +0.326 | −0.461 | +1.600 | 4 | **Reject** (full Δ<0) |

#### Power 5/35 (N=543, exploratory, moderate-low power)

| Strategy | Full Δ | Half1 Δ | Half2 Δ | Forward Δ | Composite rank | Decision |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| HierarchicalEB | −0.090 | −0.234 | +0.074 | −0.800 | 4 | **Reject** (weak evidence, power<50%) |
| HierarchicalEB_Sharp | −0.135 | −0.351 | −0.074 | −1.200 | 5 | **Reject** (weak evidence) |
| HierarchicalEB_Lazy | −0.181 | −0.234 | +0.074 | −0.800 | 6 | **Reject** (weak evidence) |

### Key observations

#### 1. Forward +1.6pp on Power 6/55 (Sharp + Lazy) is noise signature

- Both Sharp and Lazy show identical forward=+1.6pp on Power 6/55 last 100 draws (HierarchicalEB_Sharp 3.6% vs Random 2.0%)
- **Same** products + different variants + **same** forward advantage → variants happen to coincide on random strong window
- Split-half h1/h2 direction flip (+/−) exposes this as sampling noise, not real signal
- Pattern matches Chu kỳ 17 HMM forward +1.2-1.4pp noise (cycle17 verdict §Pattern 3)

#### 2. Hierarchical EB adds minimal value over Batch Bayesian

- Full-sample Δ: HierarchicalEB vs Bayesian (batch) similar magnitude (both ±0.2pp range, Power 6/55)
- Empirical Bayes pooling at prior level does NOT meaningfully improve posterior after lookback=365d updates
- Why: with 365 draws per product, per-product posterior dominates prior; global prior contribution becomes marginal

#### 3. Lazy refit (weekly) doesn't degrade — but doesn't help either

- HierarchicalEB_Lazy similar to HierarchicalEB on most segments
- Reasonable since refit-per-draw vs refit-per-7-draws makes tiny difference when lookback=365 days
- Compute savings: ~7× faster forward prediction (not relevant for this scale)

#### 4. Sharp temperature (0.5) concentrates predictions but doesn't improve

- HierarchicalEB_Sharp composite rank #1 on Power 6/55 full segment (Δ+0.23)
- Concentration collapses split-half replication (noise gets amplified)
- Chu kỳ 16 Kelly lesson reinforced: concentration ⊥ set-coverage applies to Bayesian variants too

### Decision rule application

Per pre-reg §Decision rules (adapted for Phase 0 exploratory):

| Outcome | Count | Notes |
|---|:---:|---|
| Inconclusive-underpowered-positive (best achievable) | 0 | None met rank#1 + all gates positive + consistent |
| Reject (direction flip, power-independent) | 2 | Sharp + Lazy on Power 6/55 |
| Reject (full Δ ≤ 0) | 5 | Multiple strategies negative full |
| Reject (forward Δ ≤ 0) | 2 | Power 5/35 all negative forward |
| Technical-flag-audit (|Δ| > 0.9pp) | 0 | None exceeded 3× ceiling |

**Total: 9/9 Reject.**

### Principle checks

- **Principle #11 split-half**: APPLIED. 2 direction flips (Sharp + Lazy Power 6/55) → instant Reject regardless of other gates.
- **Principle #12 power gate**: APPLIED. All products exploratory-only. No Accept possible. Reject at low power flagged as "weak evidence" for Power 5/35 (but still reject).
- **Principle #13 forward gate**: APPLIED. 2 negative-forward rejects (Power 5/35 variants).
- **Principle #14 magnitude**: No violations (|Δ| max 0.76 < 0.9pp threshold).
- **Principle #15 concentration**: N/A (Hierarchical EB is probabilistic, not discriminative ML). Acceptance distribution spread appropriately.
- **Principle #16 retry tree**: Pre-reg documented 4 Tier-2 retries (21.1-21.4). Post-result:
  - 21.1 Marginal-only: trigger not met (matrix products don't have position ordering)
  - 21.2 Mixture-of-experts: trigger "Lazy pass forward but primary fail" — Lazy did reject forward due to split-half flip, NOT meet trigger exactly
  - 21.3 Product-weighted EB: trigger "Pooling artifact suspected" — no clear pooling artifact, global prior marginal effect
  - 21.4 Hyperprior Gamma: trigger "Prior strength sensitivity" — prior_strength=1.0 already weak (dominated by 365-day lookback). Changing won't help.
  - **Recommendation**: No within-paradigm retries. Escalate per Tier 1.
- **Principle #17 family elimination**: Chu kỳ 21 convergent with Chu kỳ 14 (Online Kalman). Bayesian family at current data should be considered **broadly eliminated** (batch failed Chu kỳ 2 replication, online failed Chu kỳ 14, hierarchical failed Chu kỳ 21).

### Tier 1 retry tree — what next

Per pre-reg:

| Alternative | Trigger status | Path |
|---|:---:|---|
| Hướng F Anomaly Detection | ✓ triggered (paradigm falsified direction flip) | 4-5d, ~5-10% pass, backup option |
| Wait for data (Chu kỳ 22+) | ✓ triggered (all Inconclusive or Reject at exploratory power) | Re-run at N ≥ 2000 (~2027) |
| Resume Optimization (cycle17a) | ⚠ Not a breakthrough alternative; user-initiated decision | Separate track |
| **Closure + stop** | ✓ Convergent Bayesian family falsification | **Update closure report §7.5 family registry** |

**Recommendation**: Update PROJECT_CLOSURE_REPORT.md §7.5 — add Bayesian family (broad) to eliminated list. No auto-retry. Close Chu kỳ 21.

### Consistent với project cumulative

- Chu kỳ 14 Online Kalman Bayesian reject 6/6 → adaptive Bayesian eliminated
- **Chu kỳ 21 Hierarchical EB Bayesian reject 9/9** → hierarchical Bayesian added to convergent null
- Chu kỳ 2 batch Bayesian retroactively reclassified as Inconclusive-UP (power<50% but Δ+0.333pp on Power 6/45, Chu kỳ 20 A2)

**Cumulative Bayesian family post Chu kỳ 21**:
- 23+ rejects across cycles 2, 14, 21 (batch/online/hierarchical)
- 2 Inconclusive-UP close-calls on Power 6/45 batch (Δ+0.333pp, pending N≥62,231)
- Convergent evidence: **Bayesian paradigm at current data horizon ≠ exploitable edge**

### Cumulative project post Chu kỳ 21

**~69 strategies × 5 products × refined 3-gate** (adding Hierarchical Sharp/Lazy noise-pattern candidates):
- 0 strong Accept
- 0 Suggestive (post Chu kỳ 9)
- 79 strong Reject (power ≥50%) + 9 Reject (weak evidence, Power 5/35 exploratory)
- 1 Inconclusive (Chu kỳ 15 matrix)
- 8 Inconclusive-underpowered (Chu kỳ 20 reclassifications, pending N≥2000)

**Chu kỳ 21 adds**: 2 direction-flip rejects on Power 6/55 (power-independent) + 7 weak rejects. Convergent falsification of Bayesian family extended.

### Artifacts

- **Pre-reg** (frozen): [proposals/executed/cycle21_hierarchical_bayesian.md](../proposals/executed/cycle21_hierarchical_bayesian.md)
- **Shared module**: [matrix/hierarchical_bayesian.py](../matrix/hierarchical_bayesian.py)
- **Backtest**: [matrix/cycle21_hierarchical_bayesian_backtest.py](../matrix/cycle21_hierarchical_bayesian_backtest.py) + [_results.json](../matrix/cycle21_hierarchical_bayesian_results.json)
- **Log**: [matrix/logs/cycle21_hierarchical_bayesian_output.log](../matrix/logs/cycle21_hierarchical_bayesian_output.log)

### Next (user decision)

Per pre-reg §Tier 1 retry:
- **Recommended**: Update PROJECT_CLOSURE_REPORT.md §7.5 — add Bayesian broad family to eliminated registry. Close Chu kỳ 21, stop breakthrough cycles.
- **Optional**: Hướng F Anomaly Detection (4-5d, ~5-10% pass)
- **Optional**: Resume cycle17a Optimization mode cho UI ROI picks

**Chu kỳ 22 reopen**: only on §9 closure triggers (N ≥ 2000 per product, novel paradigm paper, Vietlott API disclosure).

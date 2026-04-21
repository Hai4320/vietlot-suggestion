# 3D Research — Final Synthesis Report

**Products**: Max 3D (N=1065, 2019-04-22 → 2026-04-20) & Max 3D Pro (N=711, 2021-09-14 → 2026-04-18)
**Scope**: 8 cycles, 28 strategies, 5 mechanism paradigms
**Status**: **CLOSED** — no scientifically robust Accept/Suggestive
**Last updated**: 2026-04-21

> **Về doc này**: Tổng hợp cuối cùng của toàn bộ 3D research line. Supersede [REPORT.md](REPORT.md) (Chu kỳ 4 era, nhiều claims đã rút lại). Ngữ cảnh chi tiết mỗi cycle: xem [../history/](../history/).

---

## TL;DR

**3D RNG của Vietlott có bias real + stable nhưng KHÔNG exploitable ở data horizon hiện tại.** 28 strategies across 5 mechanism paradigms, 5 cycles với 3-gate protocol (full-sample + split-half + forward_last_100), zero robust edges. Bias ceiling ~+0.4pp number-level vs noise floor ±0.44pp forward SE → signal-to-noise ratio không đủ để distinguish real edge từ training-period overfit.

**Recommendation**: Không ship 3D strategies. Pivot effort sang matrix products (Mega 6/45, Power 6/55, Lotto 5/35). Revisit 3D chỉ khi data horizon mở rộng >500 draws OR novel bias dimension được discover.

---

## 1. Research Timeline (8 cycles)

| # | Cycle | Protocol | Verdict | Link |
|:-:|-------|----------|---------|------|
| 4 | 3D Deep Analysis | Chi² + full-sample backtest | Initial claims (pre-replication) — EVMax, JointBias, FreqWholeHot top | [cycle04](../history/cycle04_3d_deep_analysis.md) |
| 6 | Significance Gating | Z-test vs Random enforced | Chu kỳ 4 claims retracted; 3 candidates near-miss Suggestive | [cycle06](../history/cycle06_significance_gating.md) |
| 7 | Split-half Replication | 2-gate (full + split-half) | 2/2 Reject — 1st forward-flip signature observed | [cycle07](../history/cycle07_3d_replication.md) |
| 8 | Drift Verification | 3-window chi² (R1 gate) | No drift — bias stable. Phase 2 adaptive skipped | [cycle08](../history/cycle08_drift_verification.md) |
| 11 | Copula (Path A) | 3-gate stacked | 3/4 Reject + 1/4 Inconclusive | [cycle11](../history/cycle11_copula.md) |
| 12 | GBM (Path E) | 3-gate stacked | Max 3D Reject + Max 3D Pro Technical Accept flagged | [cycle12](../history/cycle12_gbm.md) |
| 12.5 | GBM Audit | 5-test diagnostic | Overfit confirmed (no leak). Max 3D Pro GBM → Reject | [cycle12_5](../history/cycle12_5_audit.md) |
| 13 | Cross-product Pool (Path B) | 3-gate stacked | **4/4 Reject** — shared-RNG hypothesis falsified | [cycle13](../history/cycle13_pool.md) |

---

## 2. Known Facts về 3D RNG (established)

Từ deep analysis Chu kỳ 4 + drift verification Chu kỳ 8:

### 2.1 Bias tồn tại
- **Max 3D Pro digit 6 at units**: observed 11.45% vs uniform 10.00% → +1.16pp Bonferroni-significant
- **Max 3D digit 0 at hundreds**: over-represented (Chu kỳ 4 chi² per-position pass)
- **Full-sample bias**: real positive bias trên individual digit distributions

### 2.2 Bias là stable (không drift)
- Chu kỳ 8 3-window chi² homogeneity test: 0/30 tuples fail Bonferroni α=0.00167
- Max 3D Pro digit 6 units across windows: W1=11.5%, W2=11.2%, W3=10.8%
- **Kết luận**: bias real, static — không thể exploit bằng adaptive tracking

### 2.3 Digit positions NOT independent
| Pair | χ² | p-value |
|:-:|:-:|:-:|
| pos 1-2 (tens-units) | 157.74 | 1e-06 |
| pos 0-2 (hundreds-units) | 145.47 | 1.5e-05 |
| pos 0-1 (hundreds-tens) | 106.07 | 0.032 |

Positions có **dependence structure** thật — strongest ở tens↔units.

### 2.4 No temporal correlation
Draws memoryless (Chu kỳ 4 autocorrelation tests pass). Không có pattern theo thời gian (ngoài drift đã confirm không tồn tại).

### 2.5 2 products có distinct bias patterns
Chu kỳ 13 pooling test: Max 3D digit 0 hundreds ≠ Max 3D Pro digit 6 units. Pool data → **hurts** Max 3D Pro (−0.64pp vs individual JointDigitBias). **Shared-RNG hypothesis falsified** — 2 products likely có different physical machines hoặc seeds.

---

## 3. 28 Strategies Tested — Consolidated List

### Paradigm 1 — Frequency / Probabilistic (15 strategies) — Chu kỳ 4-7
`Random` (baseline), `FreqWholeHot`, `FreqCold`, `LongAbsence`, `NotRepeat`, `Pattern` (parity+zone), `PairFrequency`, `ExpDecay_Hot`, `ExpDecay_Cold`, `MixedStrategy`, `RecentRepeat`, `LeastFrequent`, `BalancedSample`, `WeightedCombination`, và variants.

### Paradigm 2 — Bias-exploiting (joint digit, 6 strategies) — Chu kỳ 4
`★JointDigitBias` (1000-cell histogram), `★★ConditionalChain` (chain rule), `★★AdaptiveBiasTracker` (auto-tune window), `ExpectedValueMaximizer` (EV + decay + diversity), `ULTIMATE_v2_sharp`, `CoverageOpt`.

### Paradigm 3 — Copula (2 strategies) — Chu kỳ 11 Path A
`GaussianCopulaEmpMargins` (empirical CDF + Gaussian copula), `EmpiricalCopula` (rank-rank non-parametric).

### Paradigm 4 — Discriminative ML (1 strategy) — Chu kỳ 12 Path E
`GBMDigitClassifier` (HistGradientBoosting + 13 hand-crafted features).

### Paradigm 5 — Cross-product pool (2 strategies) — Chu kỳ 13 Path B
`PooledDigitBias` (hard pool), `HierarchicalBayesDigit` (soft pool w_own=0.5).

**Audit cycles** (diagnostic, not new strategies): Chu kỳ 6 (significance gating), Chu kỳ 8 (drift), Chu kỳ 12.5 (GBM audit).

---

## 4. Result Matrix (post-3-gate protocol, Chu kỳ 7+)

### Max 3D (forward = last 100 draws)

| Strategy | Full Δ (p) | Half-1 Δ | Half-2 Δ | Forward Δ (p) | Overall |
|----------|:-:|:-:|:-:|:-:|:-:|
| FreqWholeHot(200) | +0.158 (0.40) | +0.166 | −0.075 | −0.300 (0.68) | Reject (Chu kỳ 7 replication) |
| ExpectedValueMaximizer | — | — | — | — | Reject (Chu kỳ 7 — half flip) |
| JointDigitBias(300,1.0,1.0) | **+0.305** (0.11) | +0.249 | +0.075 | −0.700 (0.32) | Mechanism anchor — directional but gate fail |
| GaussianCopulaEmpMargins | +0.236 (0.21) | +0.311 | +0.206 | +0.600 (0.45) | Inconclusive (Chu kỳ 11) |
| EmpiricalCopula | +0.414 (0.031) | +0.373 | +0.169 | **−0.500** (0.49) | Reject — fwd flip |
| GBMDigitClassifier | **+3.606** (0.000) | +3.320 | +2.702 | **−1.900** (0.002) | Reject — fwd flip, audit confirm overfit |
| PooledDigitBias | +0.345 (0.07) | +0.290 | +0.169 | −1.100 (0.10) | Reject — fwd flip |
| HierarchicalBayesDigit | +0.493 (0.011) | +0.042 | +0.413 | **−1.200** (0.07) | Reject — fwd flip |

### Max 3D Pro (forward = last 100 draws)

| Strategy | Full Δ (p) | Half-1 Δ | Half-2 Δ | Forward Δ (p) | Overall |
|----------|:-:|:-:|:-:|:-:|:-:|
| ExpectedValueMaximizer(300,100,4) | — | h1 p=0.0007 | h2 p=0.865 | — | Reject (Chu kỳ 7 — dramatic half flip) |
| JointDigitBias | **+0.378** (0.14) | +0.262 | −0.169 | +0.100 (0.86) | Mechanism anchor — directional but gate fail |
| GaussianCopulaEmpMargins | 0.000 (1.00) | +0.164 | −0.309 | +0.700 (0.25) | Reject — full Δ=0 + half flip |
| EmpiricalCopula | −0.060 (0.80) | +0.623 | +0.337 | +1.000 (0.11) | Reject — full Δ<0 |
| GBMDigitClassifier | **+3.071** (0.000) | +6.033 | +2.135 | +0.500 (0.39) | Technical Accept → Deprecated Chu kỳ 12.5 audit |
| PooledDigitBias | −0.257 (0.27) | +0.361 | −0.618 | +0.800 (0.19) | Reject — full Δ<0, pool hurts |
| HierarchicalBayesDigit | −0.121 (0.61) | +0.328 | −0.393 | −0.100 (0.85) | Reject — full Δ<0 |

---

## 5. Why Nothing Worked (mechanism-level analysis)

### 5.1 Math synthesis

```
Bias ceiling at digit level:     ~+1.2pp (Max 3D Pro digit 6 units, Chu kỳ 4)
Bias ceiling at number level:    ~+0.4pp (compound 3 digits with probabilistic sampling)
Max effective edge per prediction: ~+0.2-0.3pp on exact_match_rate

Sample sizes (n_trials = n_draws × n_predictions × n_runs):
  Full-sample:         6,610 – 10,150 trials → SE ≈ 0.14pp (detectable but fragile)
  Split-half:          3,050 – 5,330 trials → SE ≈ 0.20pp (marginally underpowered)
  Forward last-100:    1,000 trials → SE ≈ 0.44pp (noise dominates)

Signal-to-noise ratio at forward: 0.3pp / 0.44pp ≈ 0.68
  → Only 70% chance of correct-direction detection if edge real
  → 50% chance of direction-flip observation by pure chance if edge = 0
```

### 5.2 Per-paradigm fail mode

| Paradigm | Why it failed |
|----------|---------------|
| Frequency/Probabilistic (P1) | No edge — uniform sampling nearly optimal when bias weak ~0.3pp |
| Joint digit (P2) | JointDigitBias captures real bias (~+0.3-0.4pp) but insufficient for statistical gate |
| Copula (P3) | Gaussian dependency assumption misaligned với actual 3D joint structure |
| GBM discriminative (P4) | Overfits training-period co-occurrence of known-bias features. Audit (Chu kỳ 12.5) confirmed: 67 unique predictions/600, '380' picked 36% trên Max 3D |
| Cross-product pool (P5) | 2 products có distinct bias patterns (Chu kỳ 13 finding) — pooling dilutes signal |

### 5.3 Principle #13 (forward gate) caught every false positive

5 forward-flip cases validate mandatory 3-gate stacking:

| Cycle | Strategy | Full-sample p | Forward Δ |
|:-:|----------|:-:|:-:|
| 7 | EVMaximizer (Max 3D Pro) | h1 p=0.0007 → h2 p=0.865 | Direction flip split-half |
| 9 | ExpDecay_Cold (Mega 6/45) | p=0.0044 full | h1 Δ=−0.26 → h2 Δ=+0.37 |
| 11 | EmpiricalCopula (Max 3D) | p=0.031 full | Δ=−0.500pp |
| 12 | GBMDigitClassifier (Max 3D) | p=0.000 full (+3.61pp!) | **Δ=−1.900pp (p=0.002 against)** |
| 13 | HierarchicalBayesDigit (Max 3D) | p=0.011 full | Δ=−1.200pp (p=0.07) |

---

## 6. Methodology Corpus Produced

3D research produced substantial methodology artifacts (5 codified Principles):

| # | Principle | Origin | Impact |
|:-:|-----------|--------|--------|
| 11 | Split-half replication mandatory | Chu kỳ 7, 9 | 3/3 Suggestive candidates Reject → gate proven |
| 12 | Variable-baseline power analysis | Chu kỳ 8, 9 | Pre-cycle n_required check binding |
| 13 | Forward gate mandatory (3-gate stacking) | Chu kỳ 7, 9, 11, 12, 13 | 5 forward-flip cases validated |
| 14 | Magnitude sanity check | Chu kỳ 12, 12.5 | Auto-flag if \|Δ\| > 3× bias ceiling |
| 15 | Prediction concentration check | Chu kỳ 12.5 | ML strategies require n_unique/total ≥ 0.30 |

Codified vào [../METHODOLOGY.md §3.5-3.9](../METHODOLOGY.md). **Negative results của 3D research** là input chính cho methodology evolution của toàn project.

---

## 7. Best-in-Class Pick (if forced)

**If forced to pick ONE 3D strategy**: **`JointDigitBiasStrategy`** (Chu kỳ 4 baseline).

**Ranking rationale:**

| Criterion | JointDigitBias | Best alternative |
|-----------|:-:|:-:|
| Mechanism interpretability | ✅ 1000-cell histogram clear | Copula ✅, GBM ❌ black-box |
| Magnitude plausibility | ✅ +0.3pp within ceiling | GBM ❌ (+3pp is 7× ceiling) |
| Overfit signatures | ✅ none visible | GBM extreme, Copula moderate |
| Directional consistency both products | ✅ (+0.3 Max 3D, +0.4 Max 3D Pro) | Most others flip on 1 product |
| Principle #14 magnitude check | ✅ pass (well below 3× ceiling) | GBM ❌ would auto-flag |
| Reusable as mechanism anchor | ✅ (đã dùng Chu kỳ 11/12/13) | — |
| 3-gate protocol pass | ❌ forward fail | ❌ all fail |

**Important caveats:**
- Forward gate still fails (Max 3D forward −0.7pp, Max 3D Pro forward +0.1pp)
- Full-sample p~0.11-0.14 — below significance threshold even at α=0.05
- "Directional hope" not confirmed edge
- **Không đủ để ship** — Principle #13 binding Reject

**Ship recommendation**: NONE. Nếu bắt buộc deploy UI, dùng `Random uniform với no-duplicate-in-last-N constraint` — simpler, no false claim, same EV.

---

## 8. Final Verdict

**3D research line DEFINITIVELY CLOSED** sau Chu kỳ 13.

Lý do cơ bản:
1. **Bias ceiling** (~+0.3pp number-level) quá nhỏ so với **noise floor** (±0.44pp forward SE tại n=1000)
2. **28 strategies × 5 paradigms** — đã exhaust conceivable mechanism space
3. Bias **không drift** (Chu kỳ 8) → loại trừ adaptive exploitation
4. Products có **distinct bias patterns** → pool không giúp
5. **No temporal correlation** → sequence / neural không khai thác được

**Meta stats:** 28 strategies × 2 products × 3-gate protocol = **0 robust Accept/Suggestive** trong lịch sử dự án trên 3D.

---

## 9. Revisit Criteria

Chỉ reopen 3D research khi có **một trong 3 điều kiện**:

### A. Data horizon mở rộng đáng kể
- Max 3D Pro: chờ tới ~1500 draws (cần +800 draws từ 711) → forward n=2000 cho SE ~0.3pp → distinguish edge 0.3pp có thể
- Timeframe ước lượng: **~2027-2028** với tần suất draw ~180/năm (mỗi 2 ngày)

### B. Novel bias dimension discovered
- Time-of-draw patterns (morning vs evening machines?)
- Machine serial number correlations
- Operator/schedule artifacts
- Cross-time-of-day autocorrelation

### C. Vietlott public RNG methodology / audit
- Nếu vendor reveal algorithm → có thể target specific mathematical structure
- Nếu regulator audit public → bias sources formalized

Nếu không có 3 điều kiện trên → **không propose thêm 3D strategies**. Effort tốt hơn cho matrix products.

---

## 10. Artifacts Index

### Cycle files ([../history/](../history/))
- [cycle04_3d_deep_analysis.md](../history/cycle04_3d_deep_analysis.md) — 13-test RNG framework + strategies
- [cycle07_3d_replication.md](../history/cycle07_3d_replication.md) — split-half replication, 2/2 Reject
- [cycle08_drift_verification.md](../history/cycle08_drift_verification.md) — drift test, no drift
- [cycle11_copula.md](../history/cycle11_copula.md) — Path A copula
- [cycle12_gbm.md](../history/cycle12_gbm.md) — Path E GBM
- [cycle12_5_audit.md](../history/cycle12_5_audit.md) — GBM audit diagnostic
- [cycle13_pool.md](../history/cycle13_pool.md) — Path B cross-product pool

### Code ([./](.))
- [deep_analysis.py](deep_analysis.py) + `deep_analysis.json` — Chu kỳ 4 chi² battery
- [backtest.py](backtest.py) — v1 baseline backtest
- [advanced_backtest.py](advanced_backtest.py) — full strategy suite + evaluation harness
- [cycle7_replication.py](cycle7_replication.py) — split-half replication script
- [cycle8_drift_analysis.py](cycle8_drift_analysis.py) — 3-window chi² homogeneity
- [copula_strategies.py](copula_strategies.py) — Chu kỳ 11 strategies
- [cycle11_copula_backtest.py](cycle11_copula_backtest.py) — 3-gate harness template
- [gbm_strategy.py](gbm_strategy.py) — Chu kỳ 12 GBM + 13 features
- [cycle12_gbm_backtest.py](cycle12_gbm_backtest.py)
- [cycle12_5_audit.py](cycle12_5_audit.py) — 5-test diagnostic (reusable)
- [pooled_strategies.py](pooled_strategies.py) — Chu kỳ 13 pool strategies
- [cycle13_pooled_backtest.py](cycle13_pooled_backtest.py)

### Results ([./](.))
- `deep_analysis.json`, `advanced_backtest_results.json`
- `cycle7_replication_results.json`, `cycle8_drift_analysis_results.json`
- `cycle11_copula_results.json`, `cycle12_gbm_results.json`
- `cycle12_5_audit_results.json`, `cycle13_pooled_results.json`

### Methodology outputs
- [../METHODOLOGY.md §3.5-3.9](../METHODOLOGY.md) — Principles #11-#15
- [../RESEARCH_HISTORY.md](../RESEARCH_HISTORY.md) — cycle index
- [../BREAKTHROUGH_ROADMAP.md](../BREAKTHROUGH_ROADMAP.md) — next paths (matrix focus)

### Superseded
- [REPORT.md](REPORT.md) — Chu kỳ 4-era report (pre-replication, claims retracted Chu kỳ 6)

---

*Synthesis compiled 2026-04-21 post-Chu kỳ 13. 3D research closed pending data horizon expansion (~2027) hoặc novel bias discovery.*

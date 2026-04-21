## Chu Kỳ 12 — Pre-Registration: Tree-based GBM Classifier for 3D (Path E) (04/2026)

### Context — Path swap #2

Chu kỳ 11 recommend Chu kỳ 12 = revert roadmap Path #1 Online Bayesian matrix. User direct 2026-04-21 (afternoon) tiếp tục exhaust 3D paths trước khi move sang matrix. Path E chọn vì đây là **paradigm shift** — 23 failed strategies toàn bộ đều theo hướng probabilistic/generative modeling (frequency, Bayesian, Copula, JointDigitBias, etc.). Tree-based discriminative classifier là angle hoàn toàn mới cho 3D.

Nếu E cũng Reject → definitive evidence 3D genuinely non-exploitable tại current N; project pivot dứt khoát sang matrix products (Chu kỳ 13+). Path #1 Online Bayesian matrix defer lần nữa → Chu kỳ 13.

### Mục tiêu

Test hypothesis: **supervised learning với rich hand-crafted features có thể capture joint digit patterns mà generative models miss**, dẫn đến exact_match_rate > Random + > JointDigitBias trên Max 3D và/hoặc Max 3D Pro.

### Hypothesis (pre-registered)

**H1 — Max 3D + GBMDigitClassifier**:
- Predicted `exact_match_rate > Random` và `> JointDigitBias` trên full-sample + cả 2 halves + forward_last_100.
- Mechanism: treat each of 1000 numbers (000-999) as per-candidate binary classification target — "liệu số này xuất hiện trong draw tiếp theo?". Features hand-crafted từ recent history (windowed frequency, pair/joint freq, time-since-seen, sum/parity). `HistGradientBoostingClassifier` fit trên training draws.
- Expected effect: Δ ≥ +0.3pp vs Random trên full-sample (stronger than copula claim vì discriminative nên target match_rate directly thay vì model distribution).

**H2 — Max 3D Pro + GBMDigitClassifier**:
- Cùng hypothesis áp dụng trên Max 3D Pro.
- Max 3D Pro có bias stronger (digit 6 units +1.6pp per Chu kỳ 4/8) → prior signal cao hơn.

### Methodology

**Products & data splits** (same as Chu kỳ 11):
- Max 3D: N=1065, midpoint=532. Half-1 [50, 532), Half-2 [532, 1065). Forward = last 100.
- Max 3D Pro: N=711, midpoint=355. Half-1 [50, 355), Half-2 [355, 711). Forward = last 100.

**Strategies run** (K=1 new, Bonferroni α=0.05):

| Strategy | Role | Parameters (fixed pre-reg) |
|----------|------|----------------------------|
| `Random` | Primary baseline | uniform 000-999 |
| `JointDigitBiasStrategy` | **Mechanism anchor** — new candidate phải beat | lookback=300, temperature=1.0, alpha=1.0 |
| `FreqWholeHotStrategy` | Secondary baseline | lookback=200 |
| **`GBMDigitClassifier`** | New | xem dưới |

**GBM hyperparameters (HistGradientBoostingClassifier, sklearn 1.7.2)**:
- `max_iter=100`, `max_depth=4`, `learning_rate=0.05`, `l2_regularization=0.1`, `min_samples_leaf=20`, `random_state=42`, `early_stopping=False`
- Refit cadence: mỗi 100 draws (cache model giữa refits)
- Training set construction: for each past draw t in [min_history, current), compute features(t) từ draws[:t]; label = 1 nếu candidate number xuất hiện ở draws[t], else 0. Training set size = current_index × 1000 rows (downsample negatives ratio 1:3 để balance và fit trong memory).

**Features per candidate (d0, d1, d2) at time t** (13 features pre-registered, no post-hoc addition):
1. Recent freq trong window=30 draws
2. Recent freq trong window=100 draws
3. Recent freq trong window=300 draws
4. Time-since-last-seen (in draws, capped at 500)
5. P(d0 @ pos0) marginal trong window=300
6. P(d1 @ pos1) marginal trong window=300
7. P(d2 @ pos2) marginal trong window=300
8. P(d0, d1) pair trong window=300
9. P(d0, d2) pair trong window=300
10. P(d1, d2) pair trong window=300
11. Sum of digits (d0+d1+d2, range 0-27)
12. Sum parity (sum mod 2)
13. N distinct digits (1, 2, or 3)

**Prediction**: score all 1000 candidates → pick top-N highest `predict_proba`, dedupe, return.

**Backtest params**: `min_history=50`, `n_runs=5`, `n_predictions=2`, `seed=42`.

**3 gates** (same as Chu kỳ 11): full-sample + split-half + forward_last_100. Decision rules identical.

### Decision rule (binding — set trước khi thấy kết quả)

Same as Chu kỳ 11, với K=1 → α_strict = 0.05:

| Full-sample | Split-half | Forward | Decision |
|:-:|:-:|:-:|:-:|
| p < 0.05 + CI_lo > 0 | both Δ > 0 + both p < 0.05 | Δ > 0 (directional) | **Accept** |
| p < 0.05 + CI_lo > 0 | both Δ > 0 + one p < 0.05 | Δ > 0 | **Suggestive** |
| p < 0.05 | split-half direction-consistent nhưng không đạt nominal | Δ > 0 | **Inconclusive** |
| Δ ≤ 0 tại bất kỳ gate | — | — | **Reject** |
| Direction flip split-half (d1×d2 ≤ 0) | — | — | **Reject** |

**Secondary comparison vs JointDigitBias**: reported descriptive, không gate. Nếu vs-Random pass nhưng vs-JointDigitBias fail → mechanism không beat existing.

### Power analysis (Principle #12)

Same sample sizes as Chu kỳ 11. Với K=1 (α=0.05, bớt stringent hơn Chu kỳ 11 Bonf 0.025) + assumption Δ=+0.3pp, power tính lại:
- Max 3D full-sample: N=10,150 trials → power ≈ 90% (strong)
- Max 3D halves: 4,820 & 5,330 → power ≈ 82-85% (adequate)
- Max 3D Pro full-sample: N=6,610 → power ≈ 80% (borderline)
- Max 3D Pro halves: 3,050 & 3,560 → power ≈ 68-73% (underpowered — **limitation acknowledged**)
- Forward_last_100: 1,000 trials → power ≈ 25% (directional only, same as Chu kỳ 11)

### Artifacts kỳ vọng

- `website/research/3d/gbm_strategy.py` — feature extraction + `GBMDigitClassifier`
- `website/research/3d/cycle12_gbm_backtest.py` — 3-gate harness
- `website/research/3d/cycle12_gbm_results.json`
- Section "Chu Kỳ 12 — Result" append vào file này

### Follow-up (conditional)

- **Accept**: First 3D strategy đạt Accept sau 24 failed. Port TS, update website, deep analysis top features để hiểu cơ chế.
- **Suggestive**: Document + consider variants (different feature set, deeper tree) ở Chu kỳ 12.5.
- **Reject/Inconclusive**: Definitive 3D white-noise conclusion. Chu kỳ 13 = **mandatory pivot sang matrix products** (Path #1 Online Bayesian). 3D research line closed until new data horizon (>500 additional draws, ~2027).

### Guardrails riêng cho Chu kỳ 12

- **No feature engineering post-hoc** — 13 features pre-listed, không thêm sau khi thấy kết quả.
- **No hyperparameter tuning** — GBM params fixed (max_iter=100, max_depth=4, lr=0.05, l2=0.1).
- **No variant strategies** — single `GBMDigitClassifier` tested, K=1. Variants (different features/params) phải là Chu kỳ mới.
- **No metric swap** — primary = exact_match_rate vs Random.

---

*Pre-registered: 2026-04-21 — Chu kỳ 12 Path E (Tree-based GBM classifier) for 3D. Implementation pending.*

### Result — Chu Kỳ 12 (2026-04-21, cùng ngày pre-registration)

**Verdict per pre-registered rule:**
- **Max 3D: Reject** (forward Δ=−1.90pp flip, p=0.002)
- **Max 3D Pro: Accept** per rule (3/3 gates pass) — **but flagged as fragile, see caveats**

**Final practical classification: "Ship-with-caveats — replication pending"** (Chu kỳ 10 state). Không deploy, chờ extended forward validation.

#### Detailed numbers

Max 3D (N=1065, midpoint=532, forward=[965,1065)):

| Strategy | Full % | Half1 % | Half2 % | Fwd % | Full Δ (p) | Split | Fwd Δ (p) | Overall |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Random | 1.704 | 1.888 | 1.895 | 2.900 | — | — | — | — |
| JointDigitBias | 2.010 | 2.137 | 1.970 | 2.200 | +0.305 (0.11) | — | −0.700 (0.32) | — |
| FreqWholeHot | 1.862 | 2.054 | 1.820 | 2.600 | +0.158 (0.40) | — | −0.300 (0.68) | — |
| **GBMDigitClassifier** | **5.310** | **5.207** | **4.597** | **1.000** | **+3.606 (0.000)** | Accept both p<1e-10 | **−1.900 (0.002)** | **Reject** (fwd flip) |

Max 3D Pro (N=711, midpoint=355, forward=[611,711)):

| Strategy | Full % | Half1 % | Half2 % | Fwd % | Full Δ (p) | Split | Fwd Δ (p) | Overall |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Random | 1.997 | 1.770 | 2.022 | 1.500 | — | — | — | — |
| JointDigitBias | 2.375 | 2.033 | 1.854 | 1.600 | +0.378 (0.14) | — | +0.100 (0.86) | — |
| FreqWholeHot | 1.937 | 1.967 | 2.163 | 1.100 | −0.060 (0.80) | — | −0.400 (0.43) | — |
| **GBMDigitClassifier** | **5.068** | **7.803** | **4.157** | **2.000** | **+3.071 (0.000)** | Accept both p<1e-10 | +0.500 (0.39) | **Accept** per rule |

### Bài học (Interpretation + caveats)

#### 🚨 RED FLAGS — tại sao Accept nghi ngờ overfitting

- 🎯 **Magnitude implausible cho 3D**: Baseline digit bias ceiling per Chu kỳ 4 là ~+1.2pp digit-level, compound 3 digits → ~+0.4pp number-level max. GBM claim +3pp là **7× ceiling** — không thể là edge thật dưới giả định Chu kỳ 4 deep analysis đúng.
- 🎯 **Max 3D forward flip dramatic (−1.9pp, p=0.002)** — strong evidence overfitting. Same mechanism trên Max 3D Pro forward nhỏ (n=1000) có thể thiếu power detect cùng flip. Forward gate đã **hoạt động đúng** cho Max 3D, bảo vệ project khỏi false Accept. Nhưng on Max 3D Pro, sample forward quá nhỏ → power ≈ 25% cho Δ=0.3pp detection.
- 🎯 **ROI +157% Max 3D Pro half1** — negative-EV system như lottery không thể có ROI như vậy một cách genuine. Signature classic của overfit.
- 🎯 **Half1 Max 3D Pro (7.80%) >> Half2 (4.16%)** — nếu edge stable, cả 2 halves phải tương đương. Gap 3.6pp giữa halves suggest shrinking effect as training data grows, consistent với overfitting → noise dilution pattern.
- 🎯 **Consistent GBM beats JointDigitBias (+2.7 to +3.3pp)** trên full/halves nhưng NOT trên forward Max 3D (JDB 2.2% vs GBM 1.0%). Pattern nhất quán với "GBM memorizes training-period structure not present in forward".

#### ✅ WINS — methodology caught overfitting

- 🎯 **Principle #13 (forward gate) validated again** — 4/4 cycles bây giờ (Chu kỳ 7 EVMax, 9 ExpDecay, 11 EmpCopula, 12 GBM Max 3D) có forward flip signature. Codification priority HIGH.
- 🎯 **Decision rule correctly rejected Max 3D**, prevented false Accept. Half1/Half2 huge Δ would have been "Accept" pre-Principle #13.
- 🎯 **vs-JointDigitBias descriptive comparison not gate nhưng informative**: GBM beat JDB massively training-side, fail on Max 3D forward. If we'd gate on this (Δ_vs_JDB > 0 on forward), Max 3D Pro would fail too (Δ=+0.4pp not strong).

#### 📌 SCIENTIFIC VERDICT

**Max 3D Pro Accept là technical win nhưng scientifically fragile**. Forward gate pre-registered "directional Δ>0" (loose) — Max 3D Pro forward +0.5pp barely satisfies. Given:
- Magnitude (+3pp full-sample) implausible
- Same mechanism fails strongly on similar product (Max 3D forward −1.9pp)
- Forward sample power insufficient to catch overfit

Per-reg rule satisfied nhưng **real-world replication sẽ fail** với xác suất cao. Mark "Ship-with-caveats — replication required" per Chu kỳ 10 framework.

#### 🔧 METHODOLOGY REFINEMENT

Pre-registered forward gate ("Δ > 0 directional only") **too loose**. Proposed tighten:
- **Forward gate v2**: require Δ > MinEffect AND |Δ| > 0.5 × SE. Này ngăn Accept từ tiny-positive-but-noise forward Δ.
- **OR stricter**: require forward p < 0.20 (one-sided) if effect size > SE. Implicitly requires at least some forward significance.

Sẽ codify Principle #13 + v2 forward gate trong METHODOLOGY.md update sau Chu kỳ 12.

### Artifacts

- [3d/gbm_strategy.py](../3d/gbm_strategy.py) — GBMDigitClassifier + 13-feature extraction
- [3d/cycle12_gbm_backtest.py](../3d/cycle12_gbm_backtest.py) — 3-gate harness
- [3d/cycle12_gbm_results.json](../3d/cycle12_gbm_results.json) — full results
- [3d/cycle12_gbm_output.log](../3d/cycle12_gbm_output.log) — run log

### Impact

1. **First technical Accept trong project history** — GBM Max 3D Pro per pre-reg. BUT classified Ship-with-caveats (scientific rigor) vì overfitting red flags. Không port vào website.

2. **4th forward-flip case confirms Principle #13 core value**. Forward gate saved project từ false-Accept Max 3D.

3. **3D paused status preserved** — 24 strategies tested nay (23 trước + 1 GBM), 0 scientifically robust edges. GBM apparent edge likely overfit.

4. **Pre-reg rule limitation exposed** — forward gate loose enough để let through technical passes dưới overfit. Planned update: Principle #13 v2.

5. **Chu kỳ 13 options**:
   - **A (recommended) — Pivot matrix products** (Path #1 Online Bayesian, original roadmap). Enough 3D exploration; matrix has fresh prior.
   - **B — Chu kỳ 12.5 audit** — analyze GBM feature importances, test stability, run extended forward. Low effort (1 day) but purely diagnostic, no new edge sought.
   - **C — Try Path B (Cross-product pool)** — last remaining 3D path. Low prior after Chu kỳ 11+12.

   Recommend **A**. 3D has exhausted meaningful mechanism space. Matrix products still have Path #1, #3, portfolio options.

6. **GBM Max 3D Pro Accept: defer shipping decision**. If user wants ship, require:
   - Replication on next 100 new draws (wait ~6 months)
   - Feature importance audit for leakage
   - Cross-product validation (does GBM Max 3D Pro model generalize to Max 3D? No — forward says fail)

---

*Cập nhật lần cuối: 2026-04-21 — Hoàn thành Chu kỳ 12 (Path E GBM). Max 3D Reject (fwd flip), Max 3D Pro technical Accept flagged Ship-with-caveats due to overfitting signatures. Principle #13 forward gate validated 4th time. Recommend Chu kỳ 13 = pivot matrix products.*

---

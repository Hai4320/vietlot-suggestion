# Lịch Sử Nghiên Cứu — Vietlott Algorithm R&D

> **Mục đích**: Nhật ký chronological các chu kỳ nghiên cứu — mục tiêu, phương pháp, kết quả, bài học. Khác với [RESEARCH_DOCUMENTATION.md](RESEARCH_DOCUMENTATION.md) (tài liệu kỹ thuật canonical), file này tập trung vào **quá trình** và **ngữ cảnh** của mỗi quyết định.
>
> **Khi nào cập nhật**: Mỗi lần hoàn thành một research cycle — thêm section mới ở cuối, không sửa section cũ.

---

## Tóm Tắt Các Chu Kỳ

| # | Thời gian | Mục tiêu | Kết quả then chốt |
|:-:|-----------|----------|-------------------|
| 1 | 07/2025 | Baseline strategies cho matrix | 10 thuật toán cơ bản (freq, absence, pattern...) |
| 2 | 10/2025 – 01/2026 | Research-backed strategies | Bayesian, MaxEntropy, Adaptive, Ensemble, MinDistance |
| 3 | 02/2026 | Tối ưu matrix + recommendations | Pattern #1 tổng hợp, Bayesian #1 Power 6/55 |
| 4 | 03/2026 – 04/2026 | 3D deep analysis + strategies | 13-test RNG framework, EVMax #1 3D Pro, JointBias #2 |
| 5 | **04/2026** | **Phase-B: Lotto 5/35 deep analysis + wheeling** | Negative result — no wheeling strategy passes significance after fixing sample-size bug (corrected 2026-04-20) |

---

## Chu Kỳ 1 — Baseline Strategies cho Matrix (07/2025)

### Mục tiêu
Xây dựng bộ thuật toán gợi ý số ban đầu cho 3 sản phẩm matrix (Power 6/55, Mega 6/45, Lotto 5/35) và đặt infrastructure backtest.

### Phương pháp
- Walk-forward backtest, n_runs=3, min_history=100
- Implement 10 thuật toán cơ bản từ phân tích thống kê mô tả:
  - `Random`, `Freq_Hot`, `Freq_Cold`, `LongAbsence`, `NotRepeat`
  - `Pattern` (chẵn/lẻ + vùng số), `ExpDecay_Hot/Cold`, `PairFrequency`, `MixedStrategy`
- Metric: Avg matches, Win% (≥3), ROI, Sharpe

### Kết quả
- Pattern và ExpDecay_Cold có Δ tích cực nhẹ trên 5/35
- Freq_Hot ổn định +0.01 đến +0.02 trên 6/55
- Random baseline ~E[X] (xác nhận không có bug)

### Bài học
- Backtest 3 runs là **tối thiểu** — cần ≥5 runs để giảm variance
- Pattern strategy có tiềm năng; cần research thêm để có thuật toán mạnh hơn
- ROI luôn âm (~-80% đến -95%) — lottery là EV âm, không thay đổi được

### Artifacts
- `matrix/backtest.py` (v1) — framework backtest gốc

---

## Chu Kỳ 2 — Research-backed Strategies (10/2025 – 01/2026)

### Mục tiêu
Đưa các thuật toán dựa trên papers/lý thuyết vào hệ thống để vượt trội các baseline.

### Phương pháp
Literature review ([matrix/literature_review.md](matrix/literature_review.md)) — tổng hợp:
- **Dirichlet-Multinomial Bayesian** (Gelman 2013) — posterior sampling cho uncertainty
- **Maximum Entropy** (Jaynes 1957) — stratified band sampling
- **Lottery Wheeling / Covering Design** (Gordon-Kuperberg-Patashnik 1995, Bluskov 2020)
- **Adaptive window** (Pardo 2008) — mini-backtest tự chọn lookback
- **Rank aggregation ensemble** — Borda count

Implement 6 thuật toán mới: `Bayesian`, `Bayes_Sharp`, `MaxEntropy`, `Ensemble`, `MinDistance`, `Adaptive`.

### Kết quả
- **Power 6/55**: Bayesian AI Δ+0.031, Win 1.65% → vượt trội tất cả baseline
- **Mega 6/45**: Bayes_Sharp (T=0.3) Win 3.14%, MaxEntropy đạt 5/6 trùng duy nhất (ROI -62%)
- **Lotto 5/35**: ★Phủ sóng tối đa, ★Bayesian **thua Random** (−0.026, −0.028) — pool nhỏ + prior quá mạnh
- Ensemble, MinDistance không cải thiện — "simple beats complex"

### Bài học
- 🎯 **Dataset size quyết định strategy tốt nhất**:
  - Dataset < 800: EVMaximizer, Bayesian (leverage prior)
  - Dataset > 1000: FreqWholeHot, JointBias (đủ data ước lượng)
- 🎯 **Temperature là master knob** — Bayes_Sharp (T=0.3) beat T=0.5 trên 6/45, nhưng T<0.7 thường tệ hơn random
- 🎯 **Best strategy khác nhau giữa products** — không có "one-size-fits-all"
- 🎯 **Lotto 5/35 là outlier** — pool 35 nhỏ + 538 kỳ → nhiều strategies phức tạp fail. Đây là seed cho Chu kỳ 5.

### Artifacts
- `matrix/backtest.py` (v2) — thêm 6 strategies mới
- `matrix/backtest_results.json`
- `matrix/literature_review.md`
- Port TypeScript: `src/lib/suggest-matrix.ts`

---

## Chu Kỳ 3 — Consolidation & Recommendations (02/2026)

### Mục tiêu
Tổng hợp kết quả, xác định recommendation per-product, triển khai vào website.

### Phương pháp
- Cross-product validation 16 strategies trên 3 products (3 runs × ~300-500 draws)
- Phân loại Origin: `builtin` (cơ bản), `papers` (từ research), `research` (tự nghiên cứu)
- Tạo trang `/algorithms` và `/suggest` với ranking per-product

### Kết quả
| Product | #1 | Δ | Win% |
|---------|----|-|------|
| Power 6/55 | Bayesian | +0.031 | 1.65% |
| Mega 6/45 | Bayes_Sharp | +0.023 | 3.14% |
| Lotto 5/35 | Pattern / Adaptive | +0.025 | 1.78% |

### Bài học
- 🎯 Nguyên tắc **"Simple beats complex"** xác nhận — FreqWholeHot, Pattern thường ngang hoặc thắng các strategies AI phức tạp
- Pattern xếp #1 **tổng hợp** qua 3 matrix products (trung bình Δ+0.015)

### Artifacts
- `website/src/app/algorithms/page.tsx`, `/suggest/page.tsx`
- `website/src/lib/backtest-data.ts`
- `website/src/components/products/SuggestionPanel.tsx`

---

## Chu Kỳ 4 — 3D Deep Analysis & Strategies (03/2026 – 04/2026)

### Mục tiêu
Mở rộng sang Max 3D và Max 3D Pro — structure khác (000-999, 20 số/kỳ, 4 tiers prize). Thiết kế framework phân tích thống kê bài bản (13 tests) và thuật toán khai thác bias digit-level.

### Phương pháp

**Phase 1 — 13-test RNG Deep Analysis** (`3d/deep_analysis.py`):
1. Chi² whole number, 2. Chi² per-digit, 3. Digit independence, 4. Serial correlation,
5. Runs test, 6. Digit sum, 7. Tier analysis, 8. Temporal window, 9. Gap analysis,
10. Conditional probability, 11. Ending digit, 12. Repeat analysis, 13. Draw sum.

**Phase 2 — Bias Exploitation Strategies** (`3d/advanced_backtest.py`):
- `JointDigitBias` — joint P(abc) thay vì P(a)P(b)P(c)
- `ConditionalChain` — P(a,b,c) = P(a)·P(b|a)·P(c|a,b)
- `EVMaximizer` — tối ưu Expected Value theo tier prizes
- `PairExploiter`, `ULTIMATE Composite`, 6 strategies nữa

**Phase 3 — Walk-forward backtest** n_runs=5, predictions=2/draw.

### Kết quả

**Bias phát hiện**:
- Digit 6 over-represented **+10%** ở hàng đơn vị (Chi² p≈0, qua Bonferroni)
- Digit 5 over-represented **+6%** ở hàng chục
- Digit positions **KHÔNG** độc lập (Chi² joint p<0.001)
- Temporal stable (no time-varying bias)

**Top strategies**:
| Product | #1 | Exact% | ROI |
|---------|----|--------|-----|
| Max 3D | FreqWholeHot | 2.35% | -32.8% |
| Max 3D Pro | EVMaximizer | 2.50% | **-26.5%** ★ |
| Max 3D (research) | JointBias | 2.27% | -39.0% |

### Bài học
- 🎯 **Digit-level analysis là critical** — whole-number phân bố PASS nhưng digit-level FAIL
- 🎯 **Joint probability > marginal independence** khi positions dependent
- 🎯 **Bias nhỏ (+10%) nhưng consistent** → edge ~15-25% vs random ở thuật toán khai thác
- ✨ **13-test framework tổng quát hóa được** — trở thành template cho Chu kỳ 5

### Artifacts
- `3d/deep_analysis.py` + `3d/deep_analysis.json` (8,000+ dòng data)
- `3d/advanced_backtest.py` + `3d/advanced_backtest_results.json`
- `3d/REPORT.md`
- `RESEARCH_PLAYBOOK.md` — methodology template rút ra từ chu kỳ này

---

## Chu Kỳ 5 — Phase-B: Lotto 5/35 Deep Analysis & Wheeling (04/2026)

### Mục tiêu
Power 5/35 là outlier từ Chu kỳ 2 — nhiều AI strategies thua Random. Áp dụng framework từ Chu kỳ 4 (deep analysis + bias exploitation) nhưng cho matrix structure thay vì digit. Trigger: file `Random_Analysis_Agent.md` (system prompt Quant Cryptanalysis Agent) thúc đẩy approach nghiêm ngặt hơn với Bonferroni correction.

### Phương pháp

**Nhánh A** (đã chọn, thay vì Nhánh B incremental): tuân thủ nghiêm ngặt 5 bước Quant Agent:

1. **Bước 1 — Data ingestion**: Load 539 kỳ Lotto 5/35 (06/2025 – 04/2026)

2. **Bước 2 — 14-test Statistical Analysis** ([power535_deep_analysis.py](matrix/power535_deep_analysis.py)):
   Thích nghi 13-test framework của 3D sang matrix structure (bỏ digit-level, thêm pair co-occurrence + bonus correlation). Bonferroni α = 0.05/14 = 0.00357.

3. **Bước 3 — Pattern modeling** (chỉ nếu p<0.05 tìm thấy):
   - Phase 2a: Single-ticket strategies mô phỏng empirical parity
   - Phase 2b: Multi-ticket wheeling strategies

4. **Bước 4 — Strict backtesting**: walk-forward, n_runs=3-5, min_history=100, seed=42

5. **Bước 5 — Final report**: markdown theo agent format, tuân thủ Ràng buộc #1 "no confirmation bias"

### Kết quả

**Phase 1 — Deep analysis**:
- **13/14 tests PASS** uniformity (p > 0.05) → data rất gần white noise
- **1 test FAIL** (qua Bonferroni): **T11 Parity odd-count** p=0.0012
  - Mode 0 odd: +84% over expected
  - Mode 3 odd: +13% over expected
  - Mode 5 odd: +41% over expected
  - Mode 2, 4 odd: under-represented -14%, -20%

**Phase 2a — Single-ticket parity (FAIL)**:
3 strategies mô phỏng empirical parity đều **không beat Random**. **Chứng minh toán học**:
```
E[match] = k·j/18 + (5-k)·(5-j)/17
Với k, j indep cùng dist → chỉ phụ thuộc E[k], không phụ thuộc Var[k].
Observed E[k]=2.544 ≈ uniform E[k]=2.571 → không edge.
```

**Phase 2b — Multi-ticket wheeling (INITIAL SUCCESS, LATER CORRECTED)**:

⚠️ **Correction 2026-04-20**: Kết quả "p=0.011" ban đầu tính trên n=510 evaluations (do bug dedup `dates.unique()` trong `walk_forward_multi` bỏ qua 50% data vì Power 5/35 có 2 draws/day). Sau khi fix bug (iterate per-row), kết quả thật:

| Strategy (N=20, n=1317) | P(any≥3)% | Δ vs Random | p_raw | Decision |
|-----------------|----------:|------------:|------:|:--------:|
| ★MinDistanceWheel | 26.80 | +2.66pp | 0.118 | Reject |
| 🔬 HybridParityDiv | 25.89 | +1.75pp | 0.301 | **Reject** |
| ★ParityStratWheel | 25.06 | +0.91pp | 0.587 | Reject |
| RandomN | 24.15 | baseline | — | — |
| GreedyCover3if3_v12 | 19.67 | −4.48pp | 0.005 | Reject (harmful) |
| GreedyCover3if3_parity | 17.31 | −6.83pp | <0.001 | Reject (harmful) |

**Kết luận sau correction**: HybridParityDiv **KHÔNG** có edge thống kê ý nghĩa. Claim "first matrix strategy with p<0.05" rút lại. Negative strategies (Greedy) vẫn significant worse than random — confirming coverage optimization on small hot pool harmful.

**Kết quả ban đầu (giữ lại để tham khảo quy trình) — PRE-CORRECTION**:

| Strategy (N=20, n=510 buggy) | P(any≥3)% | Δ vs Random | p-value (buggy) |
|-----------------|----------:|------------:|--------:|
| 🔬 HybridParityDiv | 27.65 | +4.31pp | 0.011 |
| ★ParityStratWheel | 25.69 | +2.36pp | 0.08 |
| RandomN | 23.33 | baseline | — |
| MinDistanceWheel | 22.16 | −1.17pp | — |
| GreedyCover3if3 | 17.45 | −5.88pp | — |

### Bài học

- 🎯 **Statistical significance ≠ exploitability** — T11 p=0.0012 không đủ single-ticket (đã chứng minh toán học). Multi-ticket cũng không đủ — wheeling strategies đều Reject sau khi fix sample size.

- 🎯 **Sample-size bug khai lộ tầm quan trọng của significance test chuẩn** — kết quả ban đầu "p=0.011" dựa trên n=510 thay vì 1317 thật. Sau correction: p=0.301. Đây là **bài học critical**: mọi claim p-value phải có n minh bạch, verify được. Đã codify vào [EVALUATION.md §4](EVALUATION.md) (yêu cầu schema có `strategy_n`, `baseline_n`).

- 🎯 **Covering Design kém hơn random** — GreedyCover3if3 −4.48 đến −6.83pp (p<0.01, significant). Lý do: pool top-12 hot numbers quá hẹp, khi draw rơi ngoài pool (rất thường) không vé nào win. Đây là negative result **có ý nghĩa thống kê**.

- 🎯 **Ràng buộc #1 Quant Agent (no confirmation bias) có giá trị** — Phase 1 deep analysis đúng: T11 bias tồn tại. Nhưng Phase 3 không khai thác được. Không extend battery post-hoc tìm thêm bias.

- 🎯 **ROI luôn âm (~−91%)** — kể cả nếu edge tồn tại, giá trị giải 3 (50k) quá nhỏ so với cost 200k/20 vé.

### Artifacts

- [matrix/power535_deep_analysis.py](matrix/power535_deep_analysis.py) + [.json](matrix/power535_deep_analysis.json)
- [matrix/power535_parity_backtest.py](matrix/power535_parity_backtest.py) + [.json](matrix/power535_parity_backtest_results.json)
- [matrix/power535_wheeling_backtest.py](matrix/power535_wheeling_backtest.py) + [.json](matrix/power535_wheeling_backtest_results.json)
- Port TypeScript: [`generateHybridParityDiv`](../src/lib/suggest-matrix.ts) trong `src/lib/suggest-matrix.ts`
- Website integration: auto-bump N=20 cho Power 5/35, warning khi N<10, BacktestCard footnote
- Documentation: §6.3.1 trong [RESEARCH_DOCUMENTATION.md](RESEARCH_DOCUMENTATION.md)

### Impact

- **Negative result có giá trị**: không có strategy nào (bao gồm HybridParityDiv) đủ p<0.05 sau khi fix sample size. Confirm Lotto 5/35 là khó khai thác — bias T11 tồn tại nhưng không translate thành edge exploitable.
- Chứng minh framework 14-test của `TESTING.md` generalizable ngoài 3D — vẫn detect được bias thật (T11 p=0.0012).
- **Critical process lesson**: bug data-dedup tồn tại ~1 năm không bị phát hiện vì không có significance test enforce correct n. Đã codify schema bắt buộc trong [EVALUATION.md §4](EVALUATION.md) và wire z-test vào toàn bộ backtest scripts (2026-04-20).
- Điểm tham chiếu: mọi future claim edge phải kèm **z-test + p-value + n minh bạch + decision state** (Accept/Suggestive/Inconclusive/Reject).

---

## Nguyên Tắc Vận Hành

Rút ra từ 5 chu kỳ. **Đã được chuẩn hóa thành canonical methodology** — xem [METHODOLOGY.md §1](METHODOLOGY.md) cho chi tiết và binding rules.

Tóm tắt ngắn:

1. Backtest ≥ 3 runs, preferred 5 → §1 METHODOLOGY
2. Random baseline bắt buộc → §1.3 METHODOLOGY
3. Cross-product validation bắt buộc → §2 Phase 3 METHODOLOGY
4. Significance test trên mọi claim Δ → §3.2 METHODOLOGY + [EVALUATION §3](EVALUATION.md)
5. Bonferroni khi multi-test → [TESTING §1.2](TESTING.md)
6. "Simple beats complex" là prior → §1.5 METHODOLOGY
7. Algebra check trước backtest → §1.4 METHODOLOGY
8. White noise là kết quả hợp lệ (R1 gate) → §1.1 METHODOLOGY

**Các principle mới thêm sau Chu kỳ 5** (không có ở danh sách 8 gốc):

9. **Pre-registration hypothesis** — ghi vào HISTORY *trước* khi implement, chống HARKing → §3.1 METHODOLOGY
10. **Decision rule 4 trạng thái** — Accept / Suggestive / Inconclusive / Reject thay cho binary → [EVALUATION §6](EVALUATION.md)

---

## Định Hướng Tương Lai (chưa ưu tiên)

- **Power 6/55 & Mega 6/45 wheeling**: nếu có bias parity/structural tương tự 5/35 → áp dụng HybridParityDiv tương tự
- **Online learning**: cập nhật posterior real-time khi có draw mới (thay vì full re-fit)
- **Multi-product ensemble**: cross-strategy vote cho diversity ở tier giải cao
- **Risk-adjusted ROI**: Sharpe-optimal ticket sizing thay vì max match rate

---

---

## Chu Kỳ 6 — Significance Test Enforcement & Sample-Size Correction (04/2026)

### Mục tiêu
Implement 5 improvements từ research sau khi chuẩn hóa documentation (xem [METHODOLOGY.md §3](METHODOLOGY.md)):
1. Z-test + Wilson CI + 4-state decision rule trên mọi backtest delta
2. Pre-registration hypothesis template
3. R1 gate enforcement trong deep_analysis scripts
4. Algebra sanity check template (Phase 2 gate)
5. Decision rules Accept/Suggestive/Inconclusive/Reject

### Phương pháp
- Tạo shared module [`_significance.py`](./_significance.py): `wilson_ci`, `newcombe_diff_ci`, `two_proportion_z_test`, `decide_state`, `build_significance`
- Wire vào 3 backtest scripts: [matrix/backtest.py](matrix/backtest.py), [matrix/power535_wheeling_backtest.py](matrix/power535_wheeling_backtest.py), [3d/advanced_backtest.py](3d/advanced_backtest.py)
- Thêm R1 gate verdict vào 2 deep_analysis scripts
- Thêm Phase 2 gates (pre-registration + algebra check templates) vào [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md)

### Phát hiện ngoài dự kiến

**1. Bug `dates.unique()` trong walk-forward backtest** — chỉ lấy `.iloc[0]` của mỗi date, mất 50% data vì Power 5/35 có 2 draws/day. Ảnh hưởng:
- `walk_forward_multi` (wheeling): n=510 thay vì 1317
- `walk_forward_backtest` (single-ticket): ảnh hưởng 5/35 only (6/55 và 6/45 có 1 draw/day)

Sau fix iterate per-row, wheeling results:

| Strategy (N=20) | P(any≥3)% trước | p trước (buggy) | P(any≥3)% sau | p sau | Kết luận |
|-----------------|:---:|:---:|:---:|:---:|---|
| HybridParityDiv | 27.65 | 0.011 | 25.89 | 0.301 | **Reject** (edge biến mất) |
| MinDistanceWheel | 22.16 | - | 26.80 | 0.118 | Reject |
| GreedyCover3if3_v12 | 17.45 | - | 19.67 | 0.005 | Reject (significantly harmful) |

**2. Single-ticket matrix backtest sau z-test (nhiều claim bị rút)**:

| Product | Strategy | Δ (avg) | Win% | p_raw | Decision cũ (Chu kỳ 3) | Decision mới |
|---------|---------|:---:|:---:|:---:|:---:|:---:|
| 6/55 | Bayesian AI | +0.031 | 1.65% | 0.511 | "#1 winner" | **Reject** |
| 6/55 | Freq_Hot | +0.024 | 1.51% | 0.848 | #2 | Reject |
| **6/45** | **ExpDecay_Cold** | **+0.009** | **2.91%** | **0.0044** | không đáng chú ý | **Suggestive** ⚠️ |
| 6/45 | Bayesian / Ensemble | +0.007 | 2.58% | 0.046 | #1 Bayes Sharp | Suggestive |
| 5/35 | Adaptive | +0.038 | 1.90% | 0.157 | - | Reject |

**Finding mới quan trọng nhất**: ExpDecay_Cold trên 6/45 là strategy duy nhất có signal mạnh (p=0.0044, win_rate lift +1.03pp: 2.91% vs 1.89%). Không pass Bonferroni K=14 (α_strict = 0.00357) nhưng gần — cần replicate trên data mới để upgrade sang Accept.

**3. 3D advanced backtest sau z-test — tất cả Reject, nhưng 2 strategies sát ngưỡng**:

| Product | Top Strategy | Exact% | Random% | p_raw | Decision | Ghi chú |
|---------|-------------|:---:|:---:|:---:|:---:|---|
| Max 3D | FreqWholeHot | 2.347 | 1.972 | **0.066** | Reject | Suýt đủ, +200 draws có thể cross |
| Max 3D | JointBias_T1.0 | 2.268 | 1.972 | 0.144 | Reject | - |
| **Max 3D Pro** | **EVMaximizer** | 2.496 | 1.997 | **0.053** | Reject | **Closest to Accept across all products** |
| Max 3D Pro | ULTIMATE_v2_sharp | 2.421 | 1.997 | 0.098 | Reject | - |
| Max 3D Pro | CoverageOpt | 1.437 | 1.997 | 0.013 | Reject (harmful) | Significantly worse than Random |

**Pattern**: ExpDecay_Cold (6/45, p=0.0044), EVMaximizer (3D Pro, p=0.053), FreqWholeHot (Max 3D, p=0.066) là **3 strongest candidates** across all products. Không có Accept, nhưng Suggestive + 2 near-misses → Chu kỳ 7 nên tập trung replicate 3 strategies này.

### Bài học

- 🎯 **Significance test enforcement khai lộ ra bug ẩn** — nếu không có z-test verify n minh bạch, bug sample-size có thể tồn tại vô thời hạn và claim "p<0.05" không reproducible. Đây là lý do EVALUATION.md §4 yêu cầu schema có `strategy_n`, `baseline_n`.

- 🎯 **Honest reporting của negative result** — việc rút claim "HybridParityDiv first significant matrix strategy" là đúng đắn. Ghi chi tiết correction vào HISTORY giúp future researcher không lặp lại mistake.

- 🎯 **4-state decision rule hữu ích hơn binary pass/fail** — các strategies giờ rõ ràng Reject, không còn bị tô hồng thành "suggestive" khi thật ra CI chứa 0.

### Artifacts
- [`_significance.py`](./_significance.py) — shared module với smoke test
- Updates: [matrix/backtest.py](matrix/backtest.py), [matrix/power535_wheeling_backtest.py](matrix/power535_wheeling_backtest.py), [3d/advanced_backtest.py](3d/advanced_backtest.py), [matrix/power535_deep_analysis.py](matrix/power535_deep_analysis.py), [3d/deep_analysis.py](3d/deep_analysis.py)
- Bug fix: walk_forward iterate per-row thay vì per-date
- Doc updates: HISTORY Chu kỳ 5 (correction), PLAYBOOK Phase 2 gates

### Impact

Đây là infrastructure cycle — giá trị chính là methodology, không phải thuật toán. Nhưng cũng có finding đáng chú ý:

1. **Mọi future research cycle sẽ có significance test enforcement** — không thể claim "+Δ edge" mà không có p-value + CI + decision state.
2. **Nhiều claim cũ bị rút** do không pass z-test:
   - Chu kỳ 3 claim "Bayesian #1 trên 6/55 +0.031" → thực chất p=0.51, Reject.
   - Chu kỳ 4 claim "EVMaximizer #1 3D Pro" → Δ còn đúng nhưng p=0.053, Reject (sát ngưỡng).
   - Chu kỳ 5 claim "HybridParityDiv first p<0.05 matrix" → bug sample-size, sau correction p=0.301, Reject.
3. **Finding mới — 3 candidate strategies sát hoặc qua ngưỡng Suggestive**:
   - **Mega 6/45 ExpDecay_Cold**: p=0.0044 ✅ Suggestive (strongest)
   - **Max 3D Pro EVMaximizer**: p=0.053 (near-miss, Reject)
   - **Max 3D FreqWholeHot**: p=0.066 (near-miss, Reject)
4. Framework sẵn sàng cho Chu kỳ 7+ — candidate ưu tiên: replicate 3 strategies trên held-out data mới (>200 draws) để upgrade Suggestive → Accept.

### Website updates (item 4 EVALUATION §7 — DONE)

- [`backtest-data.ts`](../src/lib/backtest-data.ts): thêm `pValue`, `decision` fields, refresh toàn bộ values từ JSON 2026-04-20
- [`BacktestCard.tsx`](../src/components/products/BacktestCard.tsx): thêm columns `p` + `Kết luận` với Decision badges
- [`algorithms/page.tsx`](../src/app/algorithms/page.tsx): refresh data + UI + RECOMMENDATIONS với findings correct
- TypeScript typecheck: pass

---

*Cập nhật lần cuối: 2026-04-20 — Hoàn thành Chu kỳ 6 (significance enforcement + sample-size bug correction).*

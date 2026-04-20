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
| 5 | 04/2026 | Phase-B: Lotto 5/35 deep analysis + wheeling | Negative result — no wheeling strategy passes significance after fixing sample-size bug |
| 6 | 04/2026 | Significance test enforcement + sample-size correction | Z-test wired vào toàn bộ pipeline; 3 candidates Suggestive/near-miss identified |
| 7 | 04/2026 | Split-half replication for 3D candidates | 2/2 Reject — FreqWholeHot noise, EVMaximizer half-split flip |
| 8 | **04/2026** | **Distribution shift verification for 3D (R1 gate)** | No drift — bias stable. Phase 2 skipped. 3D research paused; pivot Mega 6/45 |

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

2. **Bước 2 — 14-test Statistical Analysis** ([power535_deep_analysis.py](matrix/power535/deep_analysis.py)):
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

- [matrix/power535/deep_analysis.py](matrix/power535/deep_analysis.py) + [.json](matrix/power535/deep_analysis.json)
- [matrix/power535/parity_backtest.py](matrix/power535/parity_backtest.py) + [.json](matrix/power535/parity_backtest_results.json)
- [matrix/power535/wheeling_backtest.py](matrix/power535/wheeling_backtest.py) + [.json](matrix/power535/wheeling_backtest_results.json)
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
- Wire vào 3 backtest scripts: [matrix/backtest.py](matrix/backtest.py), [matrix/power535/wheeling_backtest.py](matrix/power535/wheeling_backtest.py), [3d/advanced_backtest.py](3d/advanced_backtest.py)
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
- Updates: [matrix/backtest.py](matrix/backtest.py), [matrix/power535/wheeling_backtest.py](matrix/power535/wheeling_backtest.py), [3d/advanced_backtest.py](3d/advanced_backtest.py), [matrix/power535/deep_analysis.py](matrix/power535/deep_analysis.py), [3d/deep_analysis.py](3d/deep_analysis.py)
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

## Chu Kỳ 7 — Pre-Registration: Split-Half Replication (3D Candidates) (04/2026)

> **Trạng thái**: Pre-registered 2026-04-20, chưa chạy. Section này ghi hypothesis **trước** khi implement/backtest để chống HARKing (§3.1 METHODOLOGY). Kết quả sẽ append vào sau khi có JSON output — **không sửa hypothesis sau đó**.

### Bối cảnh

Chu kỳ 6 xác định 3 candidate sát/qua ngưỡng Suggestive trên full-sample backtest:
1. Mega 6/45 ExpDecay_Cold (p=0.0044, Suggestive)
2. Max 3D Pro EVMaximizer (p=0.053, near-miss Reject)
3. Max 3D FreqWholeHot (p=0.066, near-miss Reject)

Full-sample p-value không đủ — cần **replication trên held-out data** để phân biệt edge thật vs false positive do test battery (chọn 21 strategies × 2 products = 42 comparisons, Bonferroni K=21 nhưng báo cáo p_raw).

Chu kỳ 7 bắt đầu với nhánh 3D (candidate #2 và #3). Mega 6/45 hoãn sang cycle kế tiếp.

### Hypotheses (pre-registered)

**H1 — Max 3D + FreqWholeHot(lookback=200)**:
- Predicted exact_match_rate > Random baseline trên **cả hai** half (first 532 draws, last 532 draws).
- Mechanism giả định: whole-number frequency stable over time (digit 6 bias ở đơn vị → một số 3-digit như X?6 được over-sampled nhất quán).
- Expected effect size ≥ +0.30pp on both halves (giữ direction từ full-sample Δ=+0.375pp).

**H2 — Max 3D Pro + EVMaximizer(lookback=300, half_life=100, min_digit_distance=4)**:
- Predicted exact_match_rate > Random baseline trên cả hai half (first 355 draws, last 356 draws).
- Mechanism giả định: tier-weighted EV optimization khai thác digit bias + tier imbalance.
- Expected effect size ≥ +0.40pp on both halves (giữ direction từ full-sample Δ=+0.499pp).

### Methodology

**Split**: Time-ordered split tại index `N // 2` (không random shuffle — preserve walk-forward semantics).
- Half 1 (discovery-reproduction): predictions on draws `[50, N/2)`, history = `draws[:i]` for each i.
- Half 2 (held-out replication): predictions on draws `[N/2, N)`, history = `draws[:i]` (includes half-1 history as training — standard walk-forward).

**Backtest params**: n_runs=5, n_predictions=2, seed=42 (reset per strategy).

**Strategies run**: Random (baseline) + FreqWholeHot(200) (for H1) + EVMaximizer(300, 100, 4) (for H2). Mỗi half có significance test riêng vs Random của cùng half.

**Bonferroni K**: 2 (chỉ 2 hypotheses được test trong cycle này), α_strict = 0.05/2 = 0.025.

### Decision rule (binding — set trước khi thấy kết quả)

Cho mỗi hypothesis H1, H2:

| Half 1 | Half 2 | Direction | Decision |
|--------|--------|-----------|----------|
| p < 0.025 | p < 0.025 | Δ > 0 cả hai | **Accept** (robust replication) |
| p < 0.05 | p < 0.05 | Δ > 0 cả hai | **Suggestive** (consistent weak signal) |
| p < 0.05 một half, p ≥ 0.05 half kia | — | Δ > 0 cả hai | **Inconclusive** (directional consistency only) |
| Còn lại (bao gồm Δ < 0 ở ít nhất 1 half) | — | — | **Reject** |

### Artifacts kỳ vọng

- `3d/cycle7_replication.py` — script backtest split-half
- `3d/cycle7_replication_results.json` — kết quả với significance per-half
- Section "Chu Kỳ 7 — Result" append vào file này

### Result — Chu Kỳ 7 (2026-04-20, cùng ngày pre-registration)

Backtest chạy xong — **cả H1 và H2 đều Reject theo decision rule pre-registered**.

**H1 — Max 3D + FreqWholeHot(200)**:

| Half | Strategy% | Random% | Δpp | p_raw | CI_lo | Decision |
|------|-----------|---------|-----|-------|-------|----------|
| Half 1 (draws 50–532) | 2.054 | 1.888 | +0.166 | 0.5577 | −0.393 | Reject |
| Half 2 (draws 532–1064) | 2.087 | 1.899 | +0.188 | 0.4878 | −0.346 | Reject |

→ **Replication = Reject** (neither half p<0.05 dù direction consistent)

Bài học: full-sample p=0.066 ở Chu kỳ 6 là kết quả của **n lớn gộp 2 half yếu**, không phải edge thật. Effect size Δ=+0.18pp quá nhỏ so với noise level (CI width ~1.1pp). Nếu edge tồn tại, nó << 0.5pp — không đủ exploit với lottery cost structure.

**H2 — Max 3D Pro + EVMaximizer(300, 100, 4)**:

| Half | Strategy% | Random% | Δpp | p_raw | CI_lo | Decision |
|------|-----------|---------|-----|-------|-------|----------|
| Half 1 (draws 50–355) | 3.115 | 1.770 | **+1.344** | **0.0007** | +0.572 | **Accept** |
| Half 2 (draws 355–711) | 1.966 | 2.022 | −0.056 | 0.8654 | −0.714 | Reject |

→ **Replication = Reject** (direction flip — Δ+1.344pp vs −0.056pp)

**Đây là finding quan trọng nhất của cycle** — EVMaximizer có edge **rất mạnh** trên half đầu (p=0.0007, pass Bonferroni) nhưng **biến mất** trên half sau. Hai khả năng giải thích:

1. **Distribution shift hypothesis**: Bias digit của Max 3D Pro thay đổi theo thời gian. Early period (355 kỳ đầu, ~2018-2022) có bias strong; late period (2022-2026) bias đã giảm/shift. Lý do plausible: RNG vendor tuning, migration, hoặc tự nhiên regression-to-mean sau calibration period.
2. **Selection bias hypothesis**: Chu kỳ 4 đã test 21 strategies × 2 products — EVMaximizer "trông tốt" trên full-sample (p=0.053) chủ yếu vì edge mạnh ở half 1. Full-sample test thực chất là post-hoc selection bias, không replicate được trên held-out.

Cả hai hypothesis đều dẫn đến cùng conclusion: **không nên deploy EVMaximizer cho Max 3D Pro** ở trạng thái hiện tại. Nếu là (1), cần chiến lược adaptive tracking bias theo thời gian (AdaptiveBiasTracker đã có sẵn trong codebase — hyperparameters có thể khác). Nếu là (2), không có edge thật.

### Bài học

- 🎯 **Split-half replication là gate hiệu quả** — cả 2 candidate "near-miss" từ Chu kỳ 6 fail replication. Kết quả này không thể có nếu chỉ report full-sample p. Split-half nên thành standard gate cho mọi strategy claim pass p<0.05 trên full sample (**new principle #11**).

- 🎯 **"Near-miss" full-sample thường là noise** — FreqWholeHot với full-sample p=0.066 chỉ ra Δ+0.37pp nhưng split-half trả về Δ+0.17pp và Δ+0.19pp — consistent nhưng cả hai không significant. Full-sample power = power(half1) + power(half2) nên near-miss full-sample ~= marginal on both halves = noise.

- 🎯 **Distribution shift là real risk cho 3D** — EVMaximizer trên Max 3D Pro là ví dụ hoàn hảo của time-varying bias. Bias digit đã được Chu kỳ 4 verify p≈0 qua Bonferroni, nhưng **phân bố theo thời gian** chưa được check đủ kỹ. Cần thêm test: "split by time, verify bias consistency."

- 🎯 **Post-selection inference cần gate bổ sung** — khi chọn top-K strategies từ backtest sweep (như Chu kỳ 4 chọn EVMaximizer từ 21 strategies), p-value của "winner" cần correction mạnh hơn Bonferroni. Tham khảo Hansen (2005) "Superior Predictive Ability" test hoặc White's Reality Check.

- 🎯 **Negative result có giá trị documenting** — đã rút claim Chu kỳ 4 rằng EVMaximizer là top strategy 3D Pro. Website cần update (BacktestCard, algorithms page, SuggestionPanel rankings).

### Artifacts

- [3d/cycle7_replication.py](3d/cycle7_replication.py) — split-half backtest script
- [3d/cycle7_replication_results.json](3d/cycle7_replication_results.json) — full result với significance per-half + replication decision
- Output log: saved inline trong cycle7_replication_results.json (meta + hypotheses)

### Impact

1. **2/3 candidate từ Chu kỳ 6 chính thức Reject sau replication** — chỉ còn Mega 6/45 ExpDecay_Cold (p=0.0044) chờ replicate trong cycle sau.
2. **Top rankings cần revise**:
   - Max 3D: không có Accept strategy nào nữa. FreqWholeHot không còn là top theo Δ có ý nghĩa thống kê.
   - Max 3D Pro: EVMaximizer không còn claim là #1. Cần chạy lại rankings với chỉ Random baseline + strategies pass replication (hiện tại: không có).
3. **Methodology gain**: split-half replication gate chứng minh giá trị — nên codify thành requirement cho mọi future Suggestive claim (update METHODOLOGY.md §3 trong cycle tiếp).
4. **Định hướng Chu kỳ 8** (candidates):
   - Replicate Mega 6/45 ExpDecay_Cold (strongest remaining signal)
   - Adaptive strategy cho Max 3D Pro nếu hypothesis "distribution shift" đúng (test "time-varying bias" trên 355-kỳ windows)
   - Add split-half gate vào [EVALUATION.md](EVALUATION.md) như requirement cho Suggestive → Accept transition

---

*Cập nhật lần cuối: 2026-04-20 — Hoàn thành Chu kỳ 7 (3D replication, 2/2 Reject).*

---

## Chu Kỳ 8 — Pre-Registration: Distribution Shift Analysis + Adaptive Exploitation for Max 3D Pro (04/2026)

> **Trạng thái**: Pre-registered 2026-04-20. Chu kỳ 2 phases — Phase 1 verify drift (bắt buộc chạy trước), Phase 2 conditional on Phase 1 findings.

### Bối cảnh

Chu kỳ 7 phát hiện **direction flip dramatic** cho EVMaximizer trên Max 3D Pro:
- Half 1 (draws 50–355): Δ=+1.344pp, **p=0.0007** (pass Bonferroni)
- Half 2 (draws 355–711): Δ=−0.056pp, p=0.865

Hai hypothesis giải thích được đặt ra:
- **H_shift**: RNG của Max 3D Pro có time-varying bias — digit bias mạnh ở early period sau đó shift/giảm. Nếu đúng, strategy cần **adaptive window** hoặc **short lookback**.
- **H_select**: Full-sample p=0.053 chỉ là post-hoc selection bias từ 21 strategies × 2 products. Nếu đúng, không có edge thật.

Chu kỳ 8 phân biệt 2 hypothesis bằng cách trực tiếp test drift trên raw digit distribution (không qua strategy), rồi conditional design strategy phù hợp.

### Phase 1 — Drift Analysis (Hypotheses)

**H1.A — Digit bias stability across time windows**:
- Split Max 3D Pro vào 3 windows đều nhau: W1=[0, 237), W2=[237, 474), W3=[474, 711) (~237 kỳ/window × 20 số/kỳ = ~4740 số/window).
- Per-window compute per-position digit frequency (3 positions × 10 digits).
- **Test**: Chi² homogeneity test cho mỗi (position, digit) tuple across 3 windows.
  - H0: P(digit=d | position=p) giống nhau qua 3 windows
  - H1: Khác nhau
- Bonferroni K=30 (3 positions × 10 digits), α_strict = 0.05/30 = 0.00167.

**H1.B — Compare với Chu kỳ 4 findings**:
- Chu kỳ 4 phát hiện: digit 6 ở units +11.6% (p=0.003), digit 5 ở tens +6.5% (p=0.006) — trên **full-sample**.
- Phase 1 verify: những bias này có xuất hiện đều ở cả 3 windows, hay concentrate ở window 1?

**Decision rule Phase 1** (binding):
- **Shift confirmed**: ≥1 (position, digit) fail Bonferroni homogeneity → Phase 2 proceed với adaptive design.
- **Shift not confirmed**: Không tuple nào fail Bonferroni → selection bias explanation likely, Phase 2 skip (R1 METHODOLOGY).

### Phase 2 — Adaptive Exploitation (Conditional on Phase 1 = Shift)

**Candidate strategies** (test trên split-half giống Chu kỳ 7):

1. **AdaptiveBiasTracker** (existing in `advanced_backtest.py`) — auto-select best window from `[30, 60, 100, 200, 400]` by chi² strength.
2. **EVMaximizer_short** — EVMaximizer với lookback=100 (thay vì 300). Nếu drift thật, short window capture recent bias tốt hơn.
3. **EVMaximizer_veryshort** — lookback=50, half_life=25. Extreme recency.

**Methodology**: Split-half replication giống Chu kỳ 7 — same decision rule (Accept/Suggestive/Inconclusive/Reject).

**Bonferroni K**: 3 (3 candidate strategies). α_strict = 0.05/3 = 0.0167.

**Expected outcome (pre-registered)**:
- Nếu H_shift đúng: ít nhất 1 adaptive variant pass Suggestive trên cả 2 halves (bias exists recently, adaptive captures it).
- Nếu H_shift đúng nhưng bias đã disappear hoàn toàn: không variant nào pass half 2 — kết luận "RNG tightened, không còn edge".
- Nếu H_select đúng: không variant nào pass (Phase 1 sẽ block này trước).

### Artifacts kỳ vọng

- `3d/cycle8_drift_analysis.py` + `.json` — Phase 1
- `3d/cycle8_adaptive_backtest.py` + `.json` — Phase 2 (nếu Phase 1 trigger)
- Section "Chu Kỳ 8 — Result" append vào file này

### Result — Chu Kỳ 8 (2026-04-20, cùng ngày pre-registration)

**Phase 1 outcome: SHIFT NOT CONFIRMED** cho cả hai products. **Phase 2 skipped theo R1 METHODOLOGY** — không có drift để exploit bằng adaptive strategy.

**Phase 1 — Digit homogeneity test qua 3 windows (237 kỳ/window cho 3D Pro, 354/window cho 3D)**:

| Product | Tuples pass Bonferroni | Top chi² tuple | Top p_raw | Kết luận |
|---|:-:|---|:-:|---|
| Max 3D Pro | **0 / 30** | pos=2, digit=1 (W1=9.2%, W2=9.6%, W3=10.7%) | 0.0696 | Stable |
| Max 3D | **0 / 30** | pos=0, digit=0 (W1=11.0%, W2=9.3%, W3=10.0%) | 0.0054 | Stable |

Bonferroni α_strict = 0.05/30 = 0.00167. Không tuple nào đạt ngưỡng.

**Critical cross-check với Chu kỳ 4 findings**: Chu kỳ 4 phát hiện digit 6 ở units của Max 3D Pro +11.6% (full-sample, pass Bonferroni). Phase 1 confirm bias này **ổn định**:

| Position | Digit | W1% | W2% | W3% | Pooled% | Status |
|---|:-:|:-:|:-:|:-:|:-:|---|
| units (pos=2) | 6 | 11.5 | 11.2 | 10.8 | 11.2 | **Stable bias** — consistent across all 3 windows |
| tens (pos=1) | 5 | 10.8 | 11.3 | 9.9 | 10.7 | Stable bias, slight drift not significant |

Bias thật sự tồn tại (+1.1–1.2pp trên uniform 10%) và **không drift**. Đây là câu trả lời definitive cho câu hỏi Chu kỳ 7: EVMaximizer's half-1 p=0.0007 → half-2 p=0.865 **KHÔNG** phải do distribution shift.

### Explanation cho EVMaximizer failure (post-analysis)

Với bias ổn định nhưng không replicate được, kết luận: **H_select đúng, H_shift sai**.

Breakdown của noise trên half splits:
- Half 1: Random = 1.770%, EVMax = 3.115% → Δ=+1.344pp, p=0.0007
- Half 2: Random = 2.022%, EVMax = 1.966% → Δ=−0.056pp, p=0.865

Random baseline **không** cố định — half 1 Random happened to be unusually low (1.77% vs expected ~2.00%), half 2 Random happened to be unusually high (2.02%). Combination (low Random + high EVMax) trên half 1 tạo ra z-score spuriously cao. Đây là classic "base rate variance" — khi baseline chính nó flutter ±0.25pp, small strategy effect không detect được.

Lesson: **Significance test với variable baseline cần sample size lớn hơn để stable**. 3050 trials mỗi half không đủ khi intrinsic noise ±0.25pp và effect size ~0.3-0.4pp. Need ≥5000 trials/half để có power 80% detecting +0.4pp edge.

### Bài học

- 🎯 **R1 gate ngăn rabbit-hole**: Phase 1 clearly said "no drift" và Chu kỳ 8 dừng ngay Phase 2. Trước Chu kỳ 6, chu kỳ này sẽ rơi vào bẫy design/test 3-5 adaptive variants rồi báo cáo "best variant has p=0.08 on held-out" — kết quả không có ý nghĩa. R1 tiết kiệm ~2-3 ngày compute + analysis thời gian.

- 🎯 **Stable bias ≠ exploitable edge**: Bias digit tồn tại (+1.2pp consistent) nhưng không strategy nào trong 21 đã test exploit được sau replication. Confirm: **lottery edge threshold cao hơn naive "bias exists → strategy wins"**.

- 🎯 **Variable baseline trong two-proportion test**: Khi cả strategy VÀ baseline đều fluctuate, effect size detection cần n lớn hơn dự đoán từ single-rate power analysis. Suggest formula cho future cycles: `n_required ≈ 2 × (z_α + z_β)² × (p_strat + p_base) × (1 - p_strat + 1 - p_base) / δ²`.

- 🎯 **"Distribution shift" là claim cần bằng chứng trực tiếp**, không suy diễn từ replication failure. Replication fail có ≥2 nguyên nhân; phải test từng cái. Phase 1 trực tiếp (raw digit distribution) khác hoàn toàn Phase 2 gián tiếp (strategy performance).

### Artifacts

- [3d/cycle8_drift_analysis.py](3d/cycle8_drift_analysis.py) — 3-window chi² homogeneity test
- [3d/cycle8_drift_analysis_results.json](3d/cycle8_drift_analysis_results.json) — full per-tuple results (30 tuples × 2 products)
- Phase 2 scripts **NOT created** (R1 gate blocked)

### Impact

1. **Definitive conclusion for 3D research line**:
   - Bias digit stable, existence confirmed multi-cycle
   - Stable bias không đủ exploit bởi current strategy toolbox (21 strategies tested)
   - Không có evidence of drift → adaptive strategies không justified
   - **3D products đạt white noise status for practical purposes** — signal-to-noise ratio quá thấp

2. **Rankings update** (consistent với post-Chu kỳ 7):
   - Max 3D: không có strategy Accept/Suggestive
   - Max 3D Pro: không có strategy Accept/Suggestive
   - Tất cả strategies dùng như diversity generators, **không phải edge providers**

3. **Methodology refinement**:
   - Add "variable baseline power analysis" warning vào EVALUATION.md
   - Add "drift verification before adaptive design" gate vào METHODOLOGY.md §2 Phase 2

4. **Định hướng Chu kỳ 9**:
   - **Pivot to Mega 6/45 ExpDecay_Cold replication** — strongest remaining Suggestive candidate (p=0.0044, Chu kỳ 6)
   - 3D research line **paused** — chờ data mới (>500 draws) hoặc methodology breakthrough (e.g., neural pattern recognition trên joint (date, digit) features) trước khi retry

---

*Cập nhật lần cuối: 2026-04-20 — Hoàn thành Chu kỳ 8 (drift analysis, R1 gate stopped Phase 2; 3D research paused).*

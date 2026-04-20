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
| 5 | **04/2026** | **Phase-B: Lotto 5/35 deep analysis + wheeling** | 🔬 **HybridParityDiv** — p=0.011 ở N=20 (first matrix strategy with statistical significance) |

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

**Phase 2b — Multi-ticket wheeling (SUCCESS)**:

| Strategy (N=20) | P(any≥3)% | Δ vs Random | p-value |
|-----------------|----------:|------------:|--------:|
| 🔬 **HybridParityDiv** | **27.65** | **+4.31pp** | **0.011 ✓** |
| ★ParityStratWheel | 25.69 | +2.36pp | 0.08 |
| RandomN | 23.33 | baseline | — |
| MinDistanceWheel | 22.16 | **−1.17pp** | (harmful) |
| GreedyCover3if3 | 17.45 | **−5.88pp** | (harmful) |

### Bài học

- 🎯 **Statistical significance ≠ exploitability** — T11 p=0.0012 không đủ single-ticket (đã chứng minh toán học). Chỉ khi **cấu trúc ticket portfolio** mới khai thác được.

- 🎯 **Diversity phải có structure** — Forcing max-Hamming distance blindly (MinDistanceWheel) **làm hại** ở N=20, vì đẩy tickets vào parity bins hiếm. Hybrid = parity-stratified + intra-bin diversity mới work.

- 🎯 **Covering Design không phải silver bullet** — GreedyCover3if3 **-5.88pp**. Lý do: pool top-12 hot numbers quá hẹp, khi draw rơi ngoài pool (rất thường) không vé nào win.

- 🎯 **Ràng buộc #1 Quant Agent (no confirmation bias) có giá trị** — nếu skip Phase 1 deep analysis, sẽ design strategy dựa trên intuition và missed điểm quan trọng: single-ticket **không thể** exploit parity bias.

- 🎯 **ROI vẫn âm (-91%)** — edge +4.3pp trên P(any≥3) không đủ bù cost vì giá trị giải 3 nhỏ (50k) so với cost 200k/20 vé.

### Artifacts

- [matrix/power535_deep_analysis.py](matrix/power535_deep_analysis.py) + [.json](matrix/power535_deep_analysis.json)
- [matrix/power535_parity_backtest.py](matrix/power535_parity_backtest.py) + [.json](matrix/power535_parity_backtest_results.json)
- [matrix/power535_wheeling_backtest.py](matrix/power535_wheeling_backtest.py) + [.json](matrix/power535_wheeling_backtest_results.json)
- Port TypeScript: [`generateHybridParityDiv`](../src/lib/suggest-matrix.ts) trong `src/lib/suggest-matrix.ts`
- Website integration: auto-bump N=20 cho Power 5/35, warning khi N<10, BacktestCard footnote
- Documentation: §6.3.1 trong [RESEARCH_DOCUMENTATION.md](RESEARCH_DOCUMENTATION.md)

### Impact

- **Thuật toán đầu tiên có p<0.05** trên matrix products
- Chứng minh framework 14-test của `RESEARCH_PLAYBOOK.md` generalizable ngoài 3D
- Điểm tham chiếu cho future research: mọi strategy claim edge phải kèm **z-test / p-value**

---

## Nguyên Tắc Vận Hành

Rút ra từ 5 chu kỳ:

1. **Backtest ≥ 3 runs, tốt nhất 5** — variance cao với n_runs=1
2. **Bao gồm Random baseline** trong mọi benchmark — sanity check + noise floor
3. **Cross-product validation bắt buộc** — strategy #1 product A có thể #15 product B
4. **Effect size < 2σ = noise** — mọi claim phải kèm significance test
5. **Bonferroni correction** khi chạy nhiều tests (α/n_tests)
6. **Simple beats complex** là default prior — chỉ accept complex strategy khi beat simple ≥ 2σ
7. **Chứng minh toán học trước backtest** khi có thể — tiết kiệm compute và avoid p-hacking
8. **Ghi nhận negative results** — white noise finding vẫn valuable (tránh future waste)

---

## Định Hướng Tương Lai (chưa ưu tiên)

- **Power 6/55 & Mega 6/45 wheeling**: nếu có bias parity/structural tương tự 5/35 → áp dụng HybridParityDiv tương tự
- **Online learning**: cập nhật posterior real-time khi có draw mới (thay vì full re-fit)
- **Multi-product ensemble**: cross-strategy vote cho diversity ở tier giải cao
- **Risk-adjusted ROI**: Sharpe-optimal ticket sizing thay vì max match rate

---

*Cập nhật lần cuối: 2026-04-20 — Hoàn thành Chu kỳ 5 (HybridParityDiv cho Lotto 5/35).*

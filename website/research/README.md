# Research — Vietlott Algorithm R&D

Thư mục chứa toàn bộ nghiên cứu, backtest, và dữ liệu phân tích cho hệ thống gợi ý số Vietlott.

## Cấu trúc thư mục

```
research/
├── README.md                       ← Bạn đang đọc file này
├── _significance.py                ← Shared module: z-test, Wilson CI, decision rules (EVALUATION §3)
│
│   ── Canonical docs (đọc trước khi bắt đầu cycle mới) ──
├── METHODOLOGY.md                  ← Phương pháp research canonical (unified 5-phase pipeline)
├── EVALUATION.md                   ← Metrics + significance test bắt buộc
├── TESTING.md                      ← Bias detection test battery (14 matrix / 13 digit)
├── RESEARCH_PLAYBOOK.md            ← Template + checklist copy-paste cho cycle mới
│
│   ── Context & lịch sử ──
├── RESEARCH_HISTORY.md             ← Nhật ký chu kỳ (mục tiêu, phương pháp, kết quả, bài học)
├── RESEARCH_DOCUMENTATION.md       ← Tổng hợp chi tiết kỹ thuật
│
├── matrix/                         ← Sản phẩm ma trận (Power 6/55, Mega 6/45, Lotto 5/35)
│   ├── backtest.py                 ← Canonical backtest 16 thuật toán (walk-forward, cả 3 products)
│   ├── backtest_results.json       ← Kết quả backtest đầy đủ
│   ├── literature_review.md        ← Tổng quan lý thuyết (wheeling, Bayesian, max-entropy…)
│   ├── power535/                   ← Lotto 5/35-specific (Chu kỳ 5 Phase-B)
│   │   ├── deep_analysis.py        ← 🔬 14-test deep analysis (T11 Parity p=0.0012 ✓)
│   │   ├── deep_analysis.json
│   │   ├── parity_backtest.py      ← Phase 2a: single-ticket empirical parity (thất bại)
│   │   ├── parity_backtest_results.json
│   │   ├── wheeling_backtest.py    ← Phase 2b: multi-ticket wheeling (Reject sau correction)
│   │   └── wheeling_backtest_results.json
│   └── mega645/                    ← Mega 6/45-specific (Chu kỳ 9)
│       ├── cycle9_replication.py   ← Split-half replication ExpDecay_Cold (direction-flip Reject)
│       └── cycle9_replication_results.json
│
├── 3d/                             ← Sản phẩm 3D (Max 3D, Max 3D Pro)
│   ├── REPORT.md                   ← Báo cáo nghiên cứu 3D (13 tests, 21 thuật toán)
│   ├── deep_analysis.py / .json    ← 13-test phân tích thống kê sâu (Chu kỳ 4)
│   ├── backtest.py / _results.json ← 12 thuật toán cơ bản
│   ├── advanced_backtest.py / _results.json ← 21 thuật toán nâng cao
│   ├── cycle7_replication.py / _results.json ← Split-half replication (Reject 2/2)
│   └── cycle8_drift_analysis.py / _results.json ← Drift verification (no drift → 3D paused)
│
└── archive/                        ← File superseded (giữ để tham khảo)
    ├── superseded_docs/            ← Root-level docs đã được thay thế
    │   ├── RESEARCH_PLAN.md        ← 07/2025 5-phase plan → thay bằng METHODOLOGY + EVALUATION + TESTING
    │   ├── RNG_ANALYSIS_REPORT.md  ← Snapshot 516 draws (04/2026-14) → thay bằng matrix/power535/deep_analysis
    │   └── Random_Analysis_Agent.md ← Source system prompt → incorporated vào METHODOLOGY §1.1 R1-R3
    ├── phase1_backtest*.py/.json   ← Phase 1 cũ → dùng matrix/backtest.py
    ├── phase1_analysis_report.md   ← → dùng RESEARCH_DOCUMENTATION.md
    ├── phase4_analysis_report.md   ← → dùng RESEARCH_DOCUMENTATION.md
    ├── 3d_analysis_report.md       ← → dùng 3d/REPORT.md
    ├── run_new_3d.py               ← Script one-off
    └── *.log                       ← Run logs
```

## Tài liệu chính (nên đọc theo thứ tự)

### Canonical references (đọc trước khi bắt đầu cycle mới)

| # | File | Mô tả | Khi nào đọc |
|---|------|--------|-------------|
| 1 | [METHODOLOGY.md](METHODOLOGY.md) | Phương pháp research canonical — pipeline 5 phase hợp nhất | Trước khi khởi động cycle mới |
| 2 | [TESTING.md](TESTING.md) | Bias detection battery — 14 matrix / 13 digit tests, Bonferroni, interpretation flowchart | Phase 1 của mỗi cycle |
| 3 | [EVALUATION.md](EVALUATION.md) | Metrics taxonomy 3 tầng + significance test + output schema | Phase 3 của mỗi cycle |
| 4 | [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md) | Template + checklist copy-paste | Khi đã hiểu pipeline, bắt đầu implement |

### Context & lịch sử

| # | File | Mô tả | Khi nào đọc |
|---|------|--------|-------------|
| 5 | [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) | Nhật ký các chu kỳ nghiên cứu | Hiểu "tại sao" đằng sau quyết định |
| 6 | [RESEARCH_DOCUMENTATION.md](RESEARCH_DOCUMENTATION.md) | Tổng hợp toàn bộ kết quả (1,300+ dòng) | Tham khảo chi tiết kỹ thuật |
| 7 | [3d/REPORT.md](3d/REPORT.md) | Nghiên cứu chuyên sâu 3D | Khi làm việc với Max 3D/3D Pro |
| 8 | [matrix/literature_review.md](matrix/literature_review.md) | Lý thuyết nền tảng (papers, algorithms) | Khi thiết kế thuật toán mới |
| 9 | [archive/superseded_docs/](archive/superseded_docs/) | Historical docs đã thay thế (RESEARCH_PLAN, RNG_ANALYSIS_REPORT, Random_Analysis_Agent) | Historical context only |

## Cách chạy backtest

### Ma trận (Power 6/55, Mega 6/45, Lotto 5/35)

```bash
cd website/research
python3 matrix/backtest.py 2>&1 | tee matrix/output.log
```

**Output**: `matrix/backtest_results.json` — 16 thuật toán × 3 sản phẩm × 3 runs

**Phụ thuộc**: numpy, pandas. Đọc dữ liệu từ `data/power655.jsonl`, `data/power645.jsonl`, `data/power535.jsonl`

### Phase-B: Deep Analysis & Wheeling cho Lotto 5/35 (04/2026)

```bash
# 1. Phase 1 — 14-test statistical analysis (Quant Agent methodology)
.venv/bin/python3 website/research/matrix/power535/deep_analysis.py

# 2. Phase 2a — Single-ticket parity strategies (baseline)
.venv/bin/python3 website/research/matrix/power535/parity_backtest.py

# 3. Phase 2b — Multi-ticket wheeling (HybridParityDiv)
.venv/bin/python3 website/research/matrix/power535/wheeling_backtest.py
```

**Phụ thuộc bổ sung**: `scipy` (cho chi², KS, hypergeometric tests):
```bash
uv pip install scipy numpy pandas
```

**Kết quả then chốt**: HybridParityDiv đạt P(any≥3) = 27.65% ở N=20 vé (+4.31pp vs Random, p=0.011). Xem §6.3.1 trong `RESEARCH_DOCUMENTATION.md`.

### 3D (Max 3D, Max 3D Pro)

```bash
# Phân tích thống kê sâu (chạy trước nếu dữ liệu mới)
python3 3d/deep_analysis.py 2>&1 | tee 3d/deep_analysis_output.log

# Backtest 12 thuật toán cơ bản
python3 3d/backtest.py 2>&1 | tee 3d/backtest_output.log

# Backtest 11 thuật toán nâng cao (cần scipy)
python3 3d/advanced_backtest.py 2>&1 | tee 3d/advanced_backtest_output.log
```

## Hướng dẫn phát triển

### Thêm thuật toán mới cho Ma trận

1. **Đọc** `RESEARCH_PLAYBOOK.md` để nắm phương pháp luận
2. **Thêm class** mới vào `matrix/backtest.py`:
   ```python
   class NewStrategyModel:
       def __init__(self): ...
       def fit(self, data: pd.DataFrame) -> None: ...
       def predict(self, n_numbers: int) -> list[int]: ...
   ```
3. **Đăng ký** trong dict `strategies` cuối file
4. **Chạy** backtest: `python3 matrix/backtest.py`
5. **Cập nhật** kết quả vào website:
   - `website/src/lib/backtest-data.ts` (dữ liệu bảng)
   - `website/src/app/algorithms/page.tsx` (mô tả thuật toán)
   - `website/src/components/products/SuggestionPanel.tsx` (rankings, nếu tốt hơn top 7)

### Thêm thuật toán mới cho 3D

1. **Đọc** `3d/REPORT.md` và `3d/deep_analysis.json` để hiểu dữ liệu
2. **Nếu thuật toán đơn giản**: thêm vào `3d/backtest.py`
3. **Nếu thuật toán nâng cao** (cần scipy): thêm vào `3d/advanced_backtest.py`
4. Cùng quy trình cập nhật website như trên

### Quy tắc backtest (quan trọng!)

- **Walk-forward**: Chỉ dùng dữ liệu quá khứ để dự đoán, KHÔNG nhìn tương lai
- **n_runs ≥ 3**: Trung bình nhiều lần chạy để giảm variance
- **min_history**: Ma trận ≥ 100 draws, 3D ≥ 50 draws
- **seed = 42**: Để kết quả có thể tái tạo
- **So sánh với Random**: Mọi thuật toán phải có baseline Random để so sánh

### Quy trình cập nhật website sau nghiên cứu mới

```
Nghiên cứu xong → Chạy backtest → Cập nhật 3 file website:
  1. backtest-data.ts      (số liệu bảng đánh giá)
  2. algorithms/page.tsx    (mô tả, origin tag)
  3. SuggestionPanel.tsx    (rankings, strategies list — nếu vào top 7)
```

## Danh sách thuật toán hiện tại

### Ma trận (17 thuật toán)

| # | Tên | Loại | Ghi chú |
|---|-----|------|---------|
| 1 | Random | Baseline | Tham chiếu |
| 2 | Freq_Hot | Cơ bản | Chọn số xuất hiện nhiều |
| 3 | Freq_Cold | Cơ bản | Chọn số ít xuất hiện |
| 4 | LongAbsence | Cơ bản | Số vắng lâu nhất |
| 5 | NotRepeat | Cơ bản | Tránh số vừa ra |
| 6 | Pattern | Cơ bản | Cấu trúc chẵn/lẻ/cao/thấp |
| 7 | ExpDecay_Hot | Cơ bản | Exponential decay - hot |
| 8 | ExpDecay_Cold | Cơ bản | Exponential decay - cold |
| 9 | PairFrequency | Cơ bản | Cặp số hay xuất hiện cùng |
| 10 | MixedStrategy | Cơ bản | Kết hợp freq + absence |
| 11 | Bayesian | Mới (AI) | Dirichlet posterior + temperature |
| 12 | Bayes_Sharp | Mới (AI) | Bayesian với temp thấp (sharp) |
| 13 | MaxEntropy | Mới | Tối đa entropy (phủ sóng) |
| 14 | Ensemble | Mới | Kết hợp nhiều model |
| 15 | MinDistance | Mới | Tối đa khoảng cách Hamming |
| 16 | Adaptive | Mới | Tự chọn model tốt nhất gần đây |
| **17** | 🔬 HybridParityDiv | Nghiên cứu (multi-ticket) | 5/35 only, N≥10 — wheeling parity-stratified + max-min Hamming. **Sau Chu kỳ 6 correction: không pass z-test (p=0.301 ở N=20).** Kept as reference implementation; tham khảo [HISTORY §Chu kỳ 5+6](RESEARCH_HISTORY.md) |

### 3D — Cơ bản (12 thuật toán trong `3d/backtest.py`)

| # | Tên | Mô tả |
|---|-----|-------|
| 1 | Random | Baseline |
| 2-3 | Freq_Whole_Hot/Cold | Tần suất toàn bộ số 000-999 |
| 4-5 | Digit_Hot/Cold | Tần suất từng chữ số |
| 6 | Pattern_3D | Mẫu chẵn/lẻ/tổng |
| 7 | Tier_Focus_DB | Tập trung giải đặc biệt |
| 8 | Bayesian_Digit | Bayesian từng chữ số |
| 9 | Bayes_Sharp | Bayesian sharp |
| 10 | Bayesian_Whole | Bayesian toàn bộ 000-999 |
| 11 | MaxEntropy | Tối đa entropy |
| 12 | Adaptive | Tự chọn model + SumRange + Markov |

### 3D — Nâng cao (11 thuật toán trong `3d/advanced_backtest.py`)

| # | Tên | Nguồn gốc |
|---|-----|-----------|
| 1 | JointDigitBias | Nghiên cứu — khai thác phân bố đồng thời |
| 2 | ConditionalChain | Nghiên cứu — xác suất có điều kiện |
| 3 | AdaptiveBiasTracker | Nghiên cứu — theo dõi bias thay đổi |
| 4 | MinimumCoverageSet | Nghiên cứu — phủ sóng tối thiểu |
| 5 | TierWeightedCoverage | Nghiên cứu — phủ theo tier giải |
| 6 | StratifiedDigitSampling | Nghiên cứu — lấy mẫu phân tầng |
| 7 | BayesianJointPosterior | Nghiên cứu — Bayesian joint posterior |
| 8 | MultiSignalEnsemble | Nghiên cứu — ensemble đa tín hiệu |
| 9 | OptimalTicketPortfolio | Nghiên cứu — portfolio tối ưu |
| 10 | ExpectedValueMaximizer | Nghiên cứu — tối đa EV |
| 11 | InformationTheoreticSelector | Nghiên cứu — information theory |

## Kết quả tóm tắt

### Ma trận — Top thuật toán mỗi sản phẩm (updated 2026-04-20, Chu kỳ 9)

| Sản phẩm | Top theo Δ (full-sample) | Δ (avg) | Win% | Full-sample p_raw | Split-half replication | Decision |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Power 6/55 | Bayesian AI | +0.031 | 1.65% | 0.511 | — | **Reject** (không có edge) |
| Mega 6/45 | ExpDecay_Cold | +0.009 | 2.91% | 0.0044 | **half1 Δ=−0.26pp, half2 Δ=+0.37pp → direction flip** | **Reject** (Chu kỳ 9) |
| Mega 6/45 (alt) | Ensemble / Bayesian | +0.007 | 2.58% | 0.046 | not run | Reject (full-sample near-miss) |
| Lotto 5/35 (single) | Adaptive | +0.038 | 1.90% | 0.157 | — | Reject |
| Lotto 5/35 (N=20 wheel) | MinDistanceWheel | +2.66pp | 26.80% | 0.118 | — | Reject |

### 3D — Top thuật toán (Exact Match %, updated 2026-04-20 Chu kỳ 8)

| Sản phẩm | Strategy | Full-sample p | Split-half p1 / p2 | Decision |
|----------|:---:|:---:|:---:|:---:|
| Max 3D | FreqWholeHot | 0.066 (near-miss) | 0.558 / 0.488 | **Reject** (both halves non-sig) |
| Max 3D Pro | EVMaximizer | 0.053 (near-miss) | **0.0007** / 0.865 | **Reject** (base-rate noise, not drift) |

**Tất cả 3D strategies Reject sau replication + drift verification.**

### Project-level status (sau Chu kỳ 9)

**Không còn candidate Accept/Suggestive nào trên bất kỳ sản phẩm nào.** Với 25+ strategies đã test × 5 products × walk-forward backtest + split-half replication, **không có evidence cho exploitable edge**. Vietlott RNG gần white noise ở mức granularity hiện tại. Chi tiết: [RESEARCH_HISTORY Chu Kỳ 9](RESEARCH_HISTORY.md#chu-kỳ-9--pre-registration-mega-645-expdecay_cold-split-half-replication-042026).

**Chu kỳ 8 finding**: Digit bias stable qua 3 time windows (0/30 tuples fail Bonferroni homogeneity). EVMaximizer's half-1 p=0.0007 xuất phát từ **base-rate variance** (Random half-1 = 1.77% vs half-2 = 2.02%), **không** phải distribution shift. Với bias ổn định nhưng không exploitable + không drift để adapt → **3D research paused**. Full details: [RESEARCH_HISTORY Chu Kỳ 8](RESEARCH_HISTORY.md#chu-kỳ-8--pre-registration-distribution-shift-analysis--adaptive-exploitation-for-max-3d-pro-042026).

> **Lưu ý**: Xổ số là hoàn toàn ngẫu nhiên. Không thuật toán nào đảm bảo lợi nhuận. ROI luôn âm.

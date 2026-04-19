# Research — Vietlott Algorithm R&D

Thư mục chứa toàn bộ nghiên cứu, backtest, và dữ liệu phân tích cho hệ thống gợi ý số Vietlott.

## Cấu trúc thư mục

```
research/
├── README.md                       ← Bạn đang đọc file này
├── RESEARCH_PLAN.md                ← Kế hoạch tổng thể 5 phase
├── RESEARCH_DOCUMENTATION.md       ← Tài liệu tổng hợp toàn bộ (canonical)
├── RESEARCH_PLAYBOOK.md            ← Phương pháp luận & template cho nghiên cứu mới
│
├── matrix/                         ← Sản phẩm ma trận (Power 6/55, Mega 6/45, Lotto 5/35)
│   ├── backtest.py                 ← Script backtest 16 thuật toán (walk-forward)
│   ├── backtest_results.json       ← Kết quả backtest đầy đủ
│   └── literature_review.md        ← Tổng quan lý thuyết (wheeling, Bayesian, max-entropy…)
│
├── 3d/                             ← Sản phẩm 3D (Max 3D, Max 3D Pro)
│   ├── REPORT.md                   ← Báo cáo nghiên cứu 3D (13 tests, 21 thuật toán)
│   ├── deep_analysis.py            ← Script phân tích thống kê sâu (13 kiểm định)
│   ├── deep_analysis.json          ← Dữ liệu phân tích thống kê (8,000+ dòng)
│   ├── backtest.py                 ← Backtest 12 thuật toán cơ bản
│   ├── backtest_results.json       ← Kết quả backtest cơ bản
│   ├── advanced_backtest.py        ← Backtest 11 thuật toán nâng cao (từ nghiên cứu)
│   └── advanced_backtest_results.json ← Kết quả backtest nâng cao
│
└── archive/                        ← File cũ (đã bị thay thế, giữ để tham khảo)
    ├── phase1_backtest.py          ← Phase 1 backtest (cần import ML module) → dùng matrix/backtest.py
    ├── phase1_backtest_standalone.py ← Phase 1 standalone → dùng matrix/backtest.py
    ├── phase1_backtest_results.json ← Phase 1 results → dùng matrix/backtest_results.json
    ├── phase1_analysis_report.md   ← Phase 1 report → dùng RESEARCH_DOCUMENTATION.md
    ├── phase4_analysis_report.md   ← Phase 4 report → dùng RESEARCH_DOCUMENTATION.md
    ├── 3d_analysis_report.md       ← 3D report cũ → dùng 3d/REPORT.md
    ├── run_new_3d.py               ← Script chạy nhanh 3 thuật toán (one-off)
    ├── phase4_output.log           ← Log chạy matrix backtest
    └── 3d_backtest_output.log      ← Log chạy 3D backtest
```

## Tài liệu chính (nên đọc theo thứ tự)

| # | File | Mô tả | Khi nào đọc |
|---|------|--------|-------------|
| 1 | [RESEARCH_PLAN.md](RESEARCH_PLAN.md) | Kế hoạch tổng thể 5 phase | Hiểu roadmap và bối cảnh |
| 2 | [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md) | Phương pháp luận, 13 kiểm định, template | Trước khi bắt đầu nghiên cứu mới |
| 3 | [RESEARCH_DOCUMENTATION.md](RESEARCH_DOCUMENTATION.md) | Tổng hợp toàn bộ kết quả (1,200+ dòng) | Tham khảo chi tiết kỹ thuật |
| 4 | [3d/REPORT.md](3d/REPORT.md) | Nghiên cứu chuyên sâu 3D | Khi làm việc với Max 3D/3D Pro |
| 5 | [matrix/literature_review.md](matrix/literature_review.md) | Lý thuyết nền tảng (papers, algorithms) | Khi thiết kế thuật toán mới |

## Cách chạy backtest

### Ma trận (Power 6/55, Mega 6/45, Lotto 5/35)

```bash
cd website/research
python3 matrix/backtest.py 2>&1 | tee matrix/output.log
```

**Output**: `matrix/backtest_results.json` — 16 thuật toán × 3 sản phẩm × 3 runs

**Phụ thuộc**: numpy, pandas. Đọc dữ liệu từ `data/power655.jsonl`, `data/power645.jsonl`, `data/power535.jsonl`

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

### Ma trận (16 thuật toán)

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

### Ma trận — Top thuật toán mỗi sản phẩm

| Sản phẩm | #1 | Δ vs E[X] | Win% |
|----------|----|-----------|------|
| Power 6/55 | Bayesian AI | +0.031 | 1.65% |
| Mega 6/45 | Bayes Sharp | +0.023 | 3.14% |
| Lotto 5/35 | Pattern / Adaptive | +0.025 | 1.78% |

### 3D — Top thuật toán (Exact Match %)

| Sản phẩm | #1 | Exact % | ROI |
|----------|----|---------|-----|
| Max 3D | Freq_Whole_Hot | 2.35% | -32.8% |
| Max 3D Pro | EV Maximizer | 2.50% | -26.5% |

> **Lưu ý**: Xổ số là hoàn toàn ngẫu nhiên. Không thuật toán nào đảm bảo lợi nhuận. ROI luôn âm.

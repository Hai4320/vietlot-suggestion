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

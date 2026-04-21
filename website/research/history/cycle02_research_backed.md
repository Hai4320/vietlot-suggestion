## Chu Kỳ 2 — Research-backed Strategies (10/2025 – 01/2026)

### Mục tiêu
Đưa các thuật toán dựa trên papers/lý thuyết vào hệ thống để vượt trội các baseline.

### Phương pháp
Literature review ([matrix/literature_review.md](../matrix/literature_review.md)) — tổng hợp:
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

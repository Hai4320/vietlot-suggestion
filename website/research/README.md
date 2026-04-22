# Research — Vietlott Algorithm R&D

Thư mục chứa toàn bộ nghiên cứu, backtest, và dữ liệu phân tích cho hệ thống gợi ý số Vietlott.

## 🔎 Trạng thái hiện tại (2026-04-22) — PROJECT CLOSED

**Active breakthrough research ĐÓNG sau Chu kỳ 18**. Terminal artifact: [**PROJECT_CLOSURE_REPORT.md**](PROJECT_CLOSURE_REPORT.md).

**Cumulative**: ~66 strategies × 5 products × 3-gate = **0 Accept / 0 Suggestive**. Win-rate + ROI + regime-detection axes all null at current data horizon.

**Cycles 16-18**:
- Chu kỳ 16: Kelly Portfolio 9/9 Reject (ROI axis exhausted)
- Chu kỳ 17: HMM Regime Detection 6/6 Reject (paradigm falsified; Principle #16 Retry Tree codified)
- Chu kỳ 18: Closure report

**Chu kỳ 19 OPTIONAL**: [proposals/cycle17a_roi_ranking_3d.md](proposals/cycle17a_roi_ranking_3d.md) Optimization mode — rank existing strategies theo ROI cho UI `picks.roi`. NOT breakthrough-search. User-initiated.

**Reopen breakthrough**: chỉ khi đủ triggers — xem [PROJECT_CLOSURE_REPORT.md §9](PROJECT_CLOSURE_REPORT.md).

## Mục tiêu (Chu kỳ 10+ — Breakthrough Mode, refined 2026-04-20)

Sau Chu kỳ 9, project đã exhaust discovery mode (25+ strategies, 3/3 Suggestive candidates fail replication). **Pivot Chu kỳ 10** chuyển sang **breakthrough mode** với priority hierarchy rõ ràng:

### Priority hierarchy

1. **🎯 PRIMARY — Tối đa hoá tỷ lệ trúng giải trong tương lai (future win rate)**
   - Matrix: P(≥3 match) trên forward-validation (rolling-window last-100 draws)
   - 3D: exact match rate trên forward-validation
   - Tournament weight 0.40 (trọng số cao nhất)

2. **📊 SECONDARY — Hiệu suất đầu tư (ROI) balanced meaningful**
   - Δ_ROI vs Random — least-negative ROI (lottery luôn âm)
   - Tournament weight 0.30 (win-rate : ROI = 4:3, ưu tiên win-rate nhưng ROI vẫn drive decision)

3. **🛡️ GUARDS — Risk + significance**
   - Sharpe ratio (weight 0.15) — risk-adjusted check
   - −log₁₀(p-value) (weight 0.15) — chống lucky-noise winner

### Approach

- **Tournament ranking** ([METHODOLOGY §8](METHODOLOGY.md) + [EVALUATION §8](EVALUATION.md)) — 4 metrics, weights `0.40/0.30/0.15/0.15`, pre-registered immutable.
- **Forward validation** ([EVALUATION §9](EVALUATION.md)) — rolling-window last-20/100/300 draws. **Primary deployment signal**, có veto power trong decision gate (§9.5).
- **Novel paradigms** ([BREAKTHROUGH_ROADMAP.md](BREAKTHROUGH_ROADMAP.md)): Online Bayesian (Path #1 — recommended Chu kỳ 14 matrix, defer 3 chu kỳ chờ 3D exhaust), Cross-product joint matrix (Path #3 — Chu kỳ 15 candidate), Copula matrix (Path #5), Kelly portfolio (Path #2 — demoted, ROI-focused, Chu kỳ 16+).

### Guardrails giữ nguyên (non-negotiable)

- Principle #11 — Split-half replication mandatory cho Accept
- Principle #12 — Variable-baseline power analysis bắt buộc
- Pre-registration hypothesis trước implement
- Walk-forward, no look-ahead
- Random baseline mandatory

Breakthrough KHÔNG relax scientific rigor — chỉ expand scope + add forward-validation gate.

> **Lưu ý**: EV âm disclaimer vẫn applies. "Best algorithm" = highest future win rate với least-negative ROI, không phải profitable.

## Cấu trúc thư mục

```
research/
├── README.md                       ← Bạn đang đọc file này
├── _significance.py                ← Shared module: z-test, Wilson CI, decision rules (EVALUATION §3)
│
│   ── Canonical docs (đọc trước khi bắt đầu cycle mới) ──
├── METHODOLOGY.md                  ← Phương pháp research canonical (5-phase + §7 Exploration Mode + §8 Multi-objective)
├── EVALUATION.md                   ← Metrics + significance test + §8 Tournament Ranking
├── TESTING.md                      ← Bias detection test battery (14 matrix / 13 digit)
├── RESEARCH_PLAYBOOK.md            ← Template + checklist copy-paste (discovery + breakthrough)
├── BREAKTHROUGH_ROADMAP.md         ← Novel R&D paths (Chu kỳ 10+): online, Kelly portfolio, cross-product, neural…
│
│   ── Context, trạng thái & lịch sử ──
├── META_REVIEW_POST_CYCLE16.md     ← 🧭 Decision anchor hiện tại (2026-04-22): 8 hướng + 3 kịch bản
├── RESEARCH_HISTORY.md             ← Nhật ký 16 chu kỳ đã đóng (index + corpus)
│
│   ── Proposals (PAUSED / pre-registered chờ quyết định) ──
├── proposals/
│   └── cycle17a_roi_ranking_3d.md  ← Optimization mode pre-reg (PAUSED 2026-04-22)
│
│   ── Code + kết quả ──
├── matrix/                         ← Sản phẩm ma trận (Power 6/55, Mega 6/45, Lotto 5/35)
│   ├── backtest.py / _results.json           ← Canonical 16 thuật toán walk-forward
│   ├── online_bayesian.py                    ← Chu kỳ 14 shared module
│   ├── kelly_portfolio.py                    ← Chu kỳ 16 shared module
│   ├── cross_product_strategies.py           ← Chu kỳ 15 shared module
│   ├── cycle14_online_bayesian_backtest.py + _results.json
│   ├── cycle15_cross_product_backtest.py + _results.json
│   ├── cycle16_kelly_portfolio_backtest.py + _results.json
│   ├── literature_review.md                  ← Lý thuyết (wheeling, Bayesian, max-entropy…)
│   ├── logs/                                 ← Runtime stdout (cycle14/15/16)
│   ├── power535/                             ← Chu kỳ 5 Phase-B (deep_analysis + parity + wheeling)
│   └── mega645/                              ← Chu kỳ 9 (cycle9_replication)
│
├── 3d/                             ← Sản phẩm 3D (Max 3D, Max 3D Pro)
│   ├── 3D_FINAL_REPORT.md                    ← Synthesis 8 cycles × 28 strategies (CLOSED)
│   ├── deep_analysis.py / .json              ← 13-test RNG Chu kỳ 4 (shared)
│   ├── backtest.py / _results.json           ← 12 thuật toán cơ bản (shared)
│   ├── advanced_backtest.py / _results.json  ← 21 thuật toán nâng cao (shared)
│   ├── copula_strategies.py                  ← Chu kỳ 11 shared module
│   ├── gbm_strategy.py                       ← Chu kỳ 12/12.5 shared module
│   ├── pooled_strategies.py                  ← Chu kỳ 13 shared module
│   ├── cycle7_replication.py + _results.json
│   ├── cycle8_drift_analysis.py + _results.json
│   ├── cycle11_copula_backtest.py + _results.json
│   ├── cycle12_gbm_backtest.py + _results.json
│   ├── cycle12_5_audit.py + _results.json
│   ├── cycle13_pooled_backtest.py + _results.json
│   └── logs/                                 ← Runtime stdout (cycle11/12/12.5/13)
│
├── history/                        ← 16 chu kỳ đã đóng (immutable records)
│   └── cycleNN_<slug>.md           ← cycle01 .. cycle16
│
└── archive/                        ← File superseded (giữ để tham khảo)
    ├── superseded_docs/            ← Docs đã được thay thế
    │   ├── RESEARCH_DOCUMENTATION.md       ← Technical monolith stale sau Chu kỳ 6 (moved 2026-04-22)
    │   ├── 3d_REPORT_cycle4_snapshot.md    ← 3D Chu kỳ 4 pre-replication (moved 2026-04-22)
    │   ├── RESEARCH_PLAN.md                ← 07/2025 5-phase plan → thay bằng METHODOLOGY + EVALUATION + TESTING
    │   ├── RNG_ANALYSIS_REPORT.md          ← Snapshot 516 draws → thay bằng matrix/power535/deep_analysis
    │   └── Random_Analysis_Agent.md        ← Source system prompt → incorporated vào METHODOLOGY §1.1
    ├── phase1_backtest*.py/.json           ← Phase 1 cũ → dùng matrix/backtest.py
    ├── phase1_analysis_report.md
    ├── phase4_analysis_report.md
    ├── 3d_analysis_report.md
    └── run_new_3d.py
```

## Tài liệu chính (nên đọc theo thứ tự)

### Canonical references (đọc trước khi bắt đầu cycle mới)

| # | File | Mô tả | Khi nào đọc |
|---|------|--------|-------------|
| 1 | [METHODOLOGY.md](METHODOLOGY.md) | Pipeline 5-phase (discovery) + §7 Exploration Mode + §8 Multi-objective ranking | Trước khi khởi động cycle mới |
| 2 | [TESTING.md](TESTING.md) | Bias detection battery — 14 matrix / 13 digit tests (discovery-mode only) | Phase 1 discovery cycle |
| 3 | [EVALUATION.md](EVALUATION.md) | Metrics taxonomy 3 tầng + significance + §8 Tournament Ranking | Phase 3 của mỗi cycle |
| 4 | [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md) | Template + checklist (discovery + breakthrough variants) | Khi implement |
| 5 | [BREAKTHROUGH_ROADMAP.md](BREAKTHROUGH_ROADMAP.md) | 7 novel R&D paths với hypothesis + effort + priority | Chu kỳ 10+ exploration mode |

### Trạng thái hiện tại & decision anchor

| # | File | Mô tả | Khi nào đọc |
|---|------|--------|-------------|
| 0 | [PROJECT_CLOSURE_REPORT.md](PROJECT_CLOSURE_REPORT.md) | 🏁 **Terminal closure artifact** (2026-04-22) — 17 cycles consolidated, null findings catalog, reopen criteria, utility statement | Đọc ĐẦU TIÊN khi pick up project |
| 0b | [META_REVIEW_POST_CYCLE16.md](META_REVIEW_POST_CYCLE16.md) | Meta-analysis 16 chu kỳ + 8 hướng + 3 kịch bản (superseded by closure report, kept for traceability) | Khi muốn hiểu lý do chọn Kịch bản 2 / Hướng C |

### Context & lịch sử

| # | File | Mô tả | Khi nào đọc |
|---|------|--------|-------------|
| 5 | [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) | Index 16 chu kỳ + principles corpus + project-wide cumulative state | Hiểu "tại sao" đằng sau quyết định |
| 6 | [3d/3D_FINAL_REPORT.md](3d/3D_FINAL_REPORT.md) | Synthesis cuối cùng 3D research (28 strategies × 8 cycles, CLOSED) | Khi làm việc với Max 3D/3D Pro |
| 7 | [matrix/literature_review.md](matrix/literature_review.md) | Lý thuyết nền tảng (papers, algorithms) | Khi thiết kế thuật toán mới |
| 8 | [proposals/](proposals/) | PAUSED pre-regs chờ quyết định (cycle17a Optimization mode) | Khi resume breakthrough mode |
| 9 | [archive/superseded_docs/](archive/superseded_docs/) | Historical docs đã thay thế (RESEARCH_DOCUMENTATION stale sau Chu kỳ 6, 3d/REPORT.md pre-replication, v.v.) | Historical context only |

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

**Kết quả then chốt** (đã bị REJECT sau Chu kỳ 5 correction): HybridParityDiv raw đạt P(any≥3) = 27.65% ở N=20 (+4.31pp vs Random, p=0.011) nhưng sau sample-size fix p=0.301. Xem [history/cycle05_lotto535_wheeling.md](history/cycle05_lotto535_wheeling.md).

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

1. **Đọc** [3d/3D_FINAL_REPORT.md](3d/3D_FINAL_REPORT.md) và `3d/deep_analysis.json` để hiểu dữ liệu
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

### Project-level status (sau Chu kỳ 13, 2026-04-21)

**Discovery mode exhaust + 3D breakthrough exhaust.** Với ~50 strategies đã test × 5 products × 3-gate protocol (full-sample + split-half + forward_last_100), **0 scientifically robust Accept/Suggestive** trong toàn bộ lịch sử dự án. 3D research line CLOSED (28 strategies × 5 paradigms → 0 edge). Matrix research line ACTIVE — Paths #1/#3/#5 chưa test cho matrix.

### Breakthrough status (Chu kỳ 10+)

**Chu kỳ 10 (2026-04-20)**: Pivot decision documented. Project chuyển sang breakthrough mode với tournament ranking + multi-objective (Δ_win, Δ_ROI, Sharpe, p-value).

**Chu kỳ 11/12/12.5/13 (04/2026)**: 3D breakthrough paths. Copula (Path A) Reject, GBM (Path E) Reject + overfit audit, Cross-product pool (Path B) 4/4 Reject. 3D line CLOSED. Xem [3d/3D_FINAL_REPORT.md](3d/3D_FINAL_REPORT.md).

**Chu kỳ 14 (proposed, ready)**: **Path #1 — Online Bayesian với Kalman-style posterior updates** trên Mega 6/45 (primary) + Lotto 5/35 (secondary). Win-rate relevance ▲▲▲ DIRECT (mechanism trực tiếp estimate P(number_i)). Forward validation last-100 làm primary gate. Principle #14 auto-flag threshold |Δ| > +0.9pp (3× matrix ceiling). Xem [BREAKTHROUGH_ROADMAP.md](BREAKTHROUGH_ROADMAP.md) cho detail. Chu kỳ 15 = Path #3 matrix fallback. Kelly (Path #2) defer Chu kỳ 16+.

**Chu kỳ 8 finding**: Digit bias stable qua 3 time windows (0/30 tuples fail Bonferroni homogeneity). EVMaximizer's half-1 p=0.0007 xuất phát từ **base-rate variance** (Random half-1 = 1.77% vs half-2 = 2.02%), **không** phải distribution shift. Với bias ổn định nhưng không exploitable + không drift để adapt → **3D research paused** (formally CLOSED sau Chu kỳ 13). Full details: [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) + [history/cycle08_drift_verification.md](history/cycle08_drift_verification.md).

> **Lưu ý**: Xổ số là hoàn toàn ngẫu nhiên. Không thuật toán nào đảm bảo lợi nhuận. ROI luôn âm.

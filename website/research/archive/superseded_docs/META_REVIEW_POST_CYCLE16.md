# Meta-Review — 16 Chu Kỳ Nghiên Cứu Vietlott

**Ngày**: 2026-04-22
**Scope**: Reflection toàn diện sau Chu kỳ 16 (Kelly Portfolio — 9/9 Reject). Trả lời 3 câu hỏi trước khi mở chu kỳ kế tiếp:
1. Các chu kỳ đã đi đúng hướng chưa? Còn nhánh nào chưa khám phá?
2. Phương pháp đánh giá / kiểm thử có hạn chế gì?
3. Những hướng nào có thể chạy tiếp với xác suất thành công khả thi?

**Trạng thái Chu kỳ 17**: **PAUSED**. Pre-registration [`cycle17a_roi_ranking_3d.md`](proposals/cycle17a_roi_ranking_3d.md) và kế hoạch Optimization mode (ROI ranking 17a + 17b matrix) **tạm hoãn** chờ quyết định sau meta-review này.

---

## 1. Tổng kết 16 chu kỳ

| # | Mechanism | Scope | Verdict | Lý do reject / finding chính |
|:-:|---|---|:-:|---|
| 1 | Baseline algos (Freq / Pattern / ExpDecay) | Matrix | — | Bootstrap infra; chưa có significance test |
| 2 | Research-backed (Bayesian / MaxEntropy / Adaptive) | Matrix + 3D prep | — | Bayesian #1 Power 6/55 ranking, marginal edge |
| 3 | Per-product consolidation | Matrix | — | Consolidate strategies; chưa có significance gate |
| 4 | 3D deep analysis (13-test RNG) | 3D | ✓ bias | Digit 6 +11%, positions dependent p<0.001 — **bias thực nhưng chưa exploit được** |
| 5 | T11 odd-count wheeling | Lotto 5/35 | ✗ | p=0.0012 real, nhưng single-ticket algebraically null; multi-ticket p=0.301 sau fix |
| 6 | Significance enforcement project-wide | All | — | Z-test wired; 3 near-miss candidates identified |
| 7 | 3D split-half replication | 3D | ✗ 2/2 | Direction flip cả 2 → **Principle #11** codified |
| 8 | Drift verification | 3D | ✓ no drift | Bias stable 3-window; **drift hypothesis falsified** |
| 9 | Mega ExpDecay_Cold replication | Mega 6/45 | ✗ | Direction flip half1/half2; pooling artifact → **Principle #12** |
| 10 | **PIVOT Breakthrough mode** | All | — | Forward gate §9; tournament weights 0.40/0.30/0.15/0.15 |
| 11 | Copula joint digit | 3D | ✗ 3/4 + 1 Inc | Gaussian+Empirical copula undershoots heuristic → **Principle #13 forward gate validated** |
| 12 | GBM classifier | 3D | ✗ flagged | Full +3pp (7× bias ceiling); forward flip + concentration → **Principle #14/#15** |
| 12.5 | GBM audit | 3D Pro | ✓ audit | Confirms overfit (67/600 top-5); no data leak |
| 13 | Cross-product pool | 3D | ✗ 4/4 | Pooling HURTS Max 3D Pro (Δ=-0.677pp p=0.046); **3D research line CLOSED** |
| 14 | Online Bayesian Kalman | Matrix | ✗ 6/6 | Drift falsified matrix (λ=0.01 ≈ batch); **adaptive family eliminated** |
| 15 | Cross-product joint matrix | Matrix | ✗ 5/6 + 1 Inc | Shared-RNG falsified matrix; **win-rate axis exhausted** |
| 16 | Kelly Portfolio | Matrix | ✗ 9/9 Δ tới −28pp | Kelly concentration ⊥ set-coverage lottery; **cả 2 axes exhausted** |

**Cumulative**: ~60 strategies × 5 products × 3-gate protocol = **0 Accept / 0 Suggestive / 0 Ship-with-caveats**.

---

## 2. Những nhánh CHƯA khám phá

Chia 3 tầng: (a) family đã reject nhưng có variant chưa test, (b) paradigm hoàn toàn mới, (c) meta-questions.

### 2a. Family đã reject — variants chưa test

| Family | Đã reject trong | Variants chưa test |
|---|---|---|
| **Bayesian** | Chu kỳ 14 (online Kalman) | Hierarchical per-product prior; Marginal-only (drop position-independence); Lazy refit weekly; Mixture-of-experts (short+long memory) |
| **Multi-ticket wheeling** | Chu kỳ 16 (Kelly) | Tier-weighted (max E[payout] thay vì P(any≥3)); Fractional-Kelly f*/3 hoặc f*/4; Jackpot-timing heuristic; Regression-to-mean wheel |
| **Ensemble / voting** | Chưa test formal | Stacking (meta-model trên out-of-fold); CV-weighted voting; Modal ensemble; Adaptive weights |
| **Temporal** | Chu kỳ 4/8/14 (chỉ lag-1) | Higher-order autocorrelation; Day-of-week chi² per weekday; Lunar calendar seasonality (Tết, lễ); Draw-machine state cycles |

### 2b. Paradigm CHƯA BAO GIỜ đi (khoảng trống lớn nhất)

**Signal sources mới (không dựa RNG bias):**

1. **Retail betting pool patterns** — Vietlott track số lượng đặt / số. Hot betting ≠ hot drawing. Arbitrage: bet ngược crowd consensus nếu crowd bias lệch true bias. **Fully new signal, không phụ thuộc RNG.**
2. **Rollover / jackpot dynamics** — Phân tích tách theo {có carryover / không}. RNG testing có thể khắt khe hơn khi pot lớn.
3. **External correlates** — Stock volatility, thời tiết, inflation — không tác động RNG nhưng tác động behavior bettor → ảnh hưởng ROI tier thấp.
4. **Historical winners announced behavior** — Số công bố trên media có ảnh hưởng psychology draw kế tiếp?

**Model classes chưa thử:**

| Model | Ưu điểm | Rủi ro |
|---|---|---|
| Gaussian Process | Posterior + credible intervals per number | O(n³) slow |
| Hidden Markov Model | Infer regime (hot-heavy / cold-heavy / uniform) | Overfit N~1300 |
| Variational Autoencoder | Unsupervised pattern compression | Overfit lớn |
| Causal inference (do-calculus) | Xác minh correlation vs causation | Khó identify instrument |
| **Anomaly detection pivot** | Đảo incentive: bet rare numbers | Paradigm shift |

**Objective functions chưa optimize:**

- *Sharpe ratio* (hiện tournament chỉ weight 0.15, không primary optimization)
- *CVaR* (tail-focused, conservative hơn Sharpe)
- *Minimax regret* (worst-case bound — robust distribution mismatch)
- *Proper Kelly via MC simulation* (không phải proxy Chu kỳ 16)

### 2c. Meta-questions chưa trả lời

1. **RNG whiteness test formal** — Chu kỳ 4/8 consistent với H0 "iid uniform" nhưng chưa có NIST/Diehard battery report. Nên chạy 1 lần cho closure.
2. **Single+Multi-ticket ensemble** — 1 Bayesian + 5 RandomN = 6 vé? Chưa test offset giữa diversification loss và information gain.
3. **Dynamic strategy selection** — Bayesian changepoint detect "exploitable regime" rồi activate strategy trong regime đó.
4. **Blocked CV (7-day blocks)** — hiện chỉ walk-forward thuần. Blocked CV có thể expose within-week bias mà walk-forward không thấy.

---

## 3. Hạn chế của phương pháp đánh giá / kiểm thử

### 3.1 Power analysis (nghiêm trọng nhất)

- Principle #12 có formula, nhưng thực tế: Mega full-sample 6,010 trials **~30% power**; split-half **~18% each**; forward_last_100 **<5% power**.
- Để detect Δ=0.1pp với 80% power cần ~150,000 trials. Hiện có ~6,000. **Underpowered 30-50× so với gold standard.**
- **Hệ quả**: Reject trên underpowered test = *inconclusive*, không phải *falsified*. Chu kỳ 14/15/16 technically chỉ là weak evidence chống lại mechanism.

### 3.2 Multiple comparisons

- Bonferroni K=14 → α_strict=0.00357 **rất tight**. Nếu battery có 20 test thì T11 (Chu kỳ 5 p=0.0012) không pass.
- Chưa dùng **FDR (Benjamini-Hochberg)** — ít conservative hơn.
- Cross-cycle: 60 strategies × 5% FP → P(≥1 FP) ≈ 95%. Không formally corrected nhưng 3-gate stacking empirically kiểm soát: 28 strategies pass gate-1, 0 pass all 3.

### 3.3 Split-half replication

- Time-ordered split đúng cho deployment, nhưng chưa test **stratified split** (balance old/new per fold) — có thể expose recency issue.
- **Correlated halves**: train(half-2) chứa half-1 history → độc lập bị vi phạm (±0.30pp baseline drift quantified Chu kỳ 9).

### 3.4 Forward validation gate

- Window {100, 20, 300} hơi arbitrary (chưa justify vì sao 100 thay vì 80 hay 120).
- **Không detect được future drift** post-evaluation. Cần live monitoring nếu ship.

### 3.5 Hyperparameter cherry-picking (Cycles 1-6)

- Cycles 1-9 chưa có pre-registration formal → có thể có p-hacking nhẹ (tune temperature, lookback post-hoc). Cycles 10+ binding pre-reg đã đóng vấn đề này đi từ nay.

### 3.6 Stationarity

- Chu kỳ 8 chi² 3-window → low power với slow drift.
- Chưa test **sub-group drift** (per weekday, per jackpot-status).

### 3.7 Baselines

- Random uniform ✓ đúng spec.
- FreqWholeHot (strong baseline) — buộc strategy phải beat strong baseline là tốt, nhưng có thể understate giá trị absolute. Mitigation: Project report cả vs-Random và vs-Strong ✓.

### 3.8 Gap giữa 3 gates

- Empirical: 28 strategies pass gate-1, 0 pass all 3 gates. Chu kỳ 1-9 chưa có đủ 3 gates → một số cycle có thể bị overoptimistic retroactively. Bài học đã embed vào methodology cho cycles 10+.

---

## 4. Fundamental blockers (không thể vượt trong data hiện tại)

**A. Set-coverage geometry** (Chu kỳ 16 validated) — P(win≥3) maximized by diversity, concentration → Δ=-28pp. Trừ khi bias MASSIVE — đã bị Chu kỳ 4/8 bác bỏ — geometry này **không vượt được**.

**B. RNG near-white-noise** — Bias real (±11% digit) nhưng stable + nhỏ. Với n~6000 trials không đủ power detect sub-percentage-point edge. 60 strategies thất bại đều khớp với null "RNG functionally random at exploitable scale."

**C. Data horizon** — Lotto 5/35 N=543, Mega/Power N~1300, 3D N~2000. Cần ~150k trials cho Δ=0.1pp detection. **Data-starved 30-50×**. Chờ 2027 may giúp Lotto double, nhưng vẫn thiếu xa.

**D. Black-box RNG** — Chưa access Vietlott audit report, RNG supplier info. Tất cả 1-16 blind analysis.

---

## 5. Hướng khuyến nghị có thể chạy tiếp

Ranked theo expected value / effort ratio. Mỗi hướng có scope cụ thể, pre-reg skeleton, và xác suất kỳ vọng pass 3-gate.

### Hướng A — **Retail Betting Pool Signal** (fully new signal source)

- **Ý tưởng**: Vietlott publish số lượng vé bán theo số / pattern. Hot-betting ≠ hot-drawing. Bet ngược crowd nếu crowd bias lệch true bias.
- **Pre-req data**: Xác nhận Vietlott có expose retail betting data (API hoặc report). Nếu có → scope cyclic.
- **Effort**: 4-6 ngày (1 ngày data ingestion + 2-3 ngày analysis + 1 ngày 3-gate).
- **Kỳ vọng pass**: **20-30%** — đây là signal độc lập với RNG, không bị set-coverage geometry block.
- **Rủi ro**: Nếu không access được data → return zero, revert to B/C.

### Hướng B — **Hierarchical Bayesian per-product** (revisit strong family)

- **Ý tưởng**: Thay vì shared Dirichlet prior, dùng prior riêng per product. Thêm marginal-only variant (drop position independence assumption from Chu kỳ 11). Chu kỳ 2 Bayesian đã từng là #1 Power 6/55 nhưng chưa structured test qua 3-gate.
- **Effort**: 3-4 ngày.
- **Kỳ vọng pass**: **8-12%** — family đã reject dạng online (Chu kỳ 14), hierarchical có thể khác nhưng mechanism similar.
- **Rủi ro**: Tái reject; nhưng low-cost, consume chỉ 3-4 ngày.

### Hướng C — **HMM Regime Detection + Dynamic Strategy Selection**

- **Ý tưởng**: Fit HMM 2-3 regime trên historical draws. Trong regime "exploitable" (if any), activate existing strategies. Trong regime "noise", skip.
- **Effort**: 5-7 ngày.
- **Kỳ vọng pass**: **10-15%** — novel paradigm, chưa ai test. Risk chính: regime phân biệt yếu trên N~1300.
- **Phù hợp**: Nếu user muốn 1 novel paradigm trước closure.

### Hướng D — **Formal RNG Whiteness Battery (NIST/Diehard)**

- **Ý tưởng**: Chạy full NIST STS battery và Diehard trên digit sequence / matrix number sequence của 5 products. Đây KHÔNG phải hướng tìm edge — là **closure evidence** cho null hypothesis.
- **Effort**: 2-3 ngày (mostly tooling integration).
- **Kỳ vọng pass**: 0% "find edge" (by design); 95% "confirm null" (strengthen publishable closure).
- **Giá trị**: Rất cao cho closure report, thấp cho betting edge.

### Hướng E — **Day-of-week + Lunar Seasonality**

- **Ý tưởng**: Test chi² bias per weekday (7 groups) và per-month (12 groups) + Tết/lễ Việt Nam indicator. Nếu có sub-group bias stable → per-weekday strategy.
- **Effort**: 2-3 ngày.
- **Kỳ vọng pass**: **5-10%** — tầng bias này chưa test formal; nhưng Chu kỳ 8 test 3-window không phát hiện drift.

### Hướng F — **Anomaly Detection Pivot** (paradigm shift)

- **Ý tưởng**: Thay vì "predict next draw," detect "số rare bất thường." Bet ngược heuristic hot — bet rare numbers giả định bias ẩn đẩy xa.
- **Effort**: 4-5 ngày.
- **Kỳ vọng pass**: **5-10%** — paradigm chưa test, nhưng giao với "cold number" strategies đã reject.

### Hướng G — **Closure Report + UI Transparency** (deliverable-focused)

- **Ý tưởng**: `PROJECT_CLOSURE_REPORT.md` consolidate 16 chu kỳ + codify Principles #11-15 cho replicability + UI ghi nhận null findings rõ ràng.
- **Effort**: 2-3 ngày.
- **Kỳ vọng pass**: N/A (không test mechanism).
- **Giá trị**: **Cao nhất** theo value/effort — publishable artifact, user-facing transparency.

### Hướng H — **Optimization Mode (Chu kỳ 17a/17b) resume** (plan đã pre-reg)

- **Ý tưởng**: ROI ranking 10 strategies 3D hiện có (17a), sau đó matrix (17b). Optimization mode, không claim mechanism mới.
- **Effort**: 1-2 tuần total (17a + 17b).
- **Kỳ vọng pass**: N/A (không test mechanism, chỉ rank).
- **Giá trị**: UI có `picks.roi` per product + budget feature spec (Chu kỳ 18).

---

## 6. Bảng so sánh hướng — ra quyết định

| Hướng | Effort | Kỳ vọng pass 3-gate | Giá trị deliverable | Ưu tiên |
|---|:---:|:---:|---|:---:|
| A. Retail betting pool | 4-6d | **20-30%** | Rất cao (signal mới) | ⭐⭐⭐ |
| G. Closure report + UI | 2-3d | N/A | Rất cao (publishable) | ⭐⭐⭐ |
| H. Optimization 17a/17b resume | 1-2w | N/A | Trung bình (UI picks.roi) | ⭐⭐ |
| C. HMM regime | 5-7d | 10-15% | Cao nếu pass | ⭐⭐ |
| B. Hierarchical Bayesian | 3-4d | 8-12% | Trung bình | ⭐ |
| D. NIST/Diehard battery | 2-3d | 0% edge (~95% null) | Cao cho closure | ⭐ |
| E. Seasonality | 2-3d | 5-10% | Trung bình | ⭐ |
| F. Anomaly detection | 4-5d | 5-10% | Thấp (giao cold) | — |

---

## 7. Khuyến nghị cuối

**Không làm đơn độc hướng H (Optimization mode) trước khi quyết định có explore nhánh mới không.** Optimization mode chỉ rank existing strategies; nếu sau đó user muốn quay lại breakthrough thì sẽ phải "reopen" không tự nhiên.

**3 kịch bản ghép khả thi** (user chọn):

1. **Kịch bản "Closure nhanh"** — G (closure report, 3d) → H (optimization 17a+17b, 2w) → ship UI. Total ~3 tuần. Accept null hypothesis, deliver best-we-have.
2. **Kịch bản "1 shot mới + closure"** — A (retail betting, 6d) hoặc C (HMM, 7d) → G (closure, 3d) → H optional. Total ~2-3 tuần. Cho 1 cơ hội breakthrough trước khi close.
3. **Kịch bản "Full exhaustion"** — A + B + C + D + G → H. Total ~5-6 tuần. Chỉ nếu user có thời gian & muốn claim "đã thử mọi nhánh khả thi."

**Mặc định đề xuất**: Kịch bản 2 với hướng A (retail betting signal). Lý do:
- A là signal source hoàn toàn mới, không phụ thuộc RNG edge (đã bị block bởi geometry + data horizon).
- Effort trung bình (6 ngày), xác suất pass cao nhất trong nhóm breakthrough (~20-30%).
- Nếu A pass → có 1 Accept thật cho project, hủy need closure "0 Accept."
- Nếu A reject → thêm 1 cycle reject nhưng signal source mới → closure report càng mạnh.
- Sau A: G closure (3d) → H optimization (1-2w).

**Điều kiện tiên quyết A**: Kiểm tra Vietlott có expose retail betting data (API hoặc report công khai) trước khi commit Chu kỳ 17. Nếu không có data → fallback C (HMM) hoặc B (Hierarchical Bayesian).

---

## 8. Trạng thái Chu kỳ 17

- Pre-reg `cycle17a_roi_ranking_3d.md` và kế hoạch 17b **PAUSED**.
- Chờ user quyết định giữa 3 kịch bản trên.
- Sau quyết định: viết pre-reg mới theo nhánh chọn, commit, chạy backtest.

**Eliminated (do NOT revisit)**:
- Kelly concentration multi-ticket (⊥ set-coverage)
- Adaptive/drift-based (drift falsified cả 3D và matrix)
- Cross-product pooling (shared-RNG falsified)
- GBM classifier với 3D dimension hiện tại (overfit confirmed)

**Principles #11-#15 giữ nguyên binding** cho mọi hướng mới.

---

## 9. Liên kết

- [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) — index chu kỳ
- [METHODOLOGY.md](METHODOLOGY.md) — 5-phase + Principles
- [BREAKTHROUGH_ROADMAP.md](BREAKTHROUGH_ROADMAP.md) — Path #1-#5 breakthrough paths
- [EVALUATION.md](EVALUATION.md) — 3-gate decision rules
- [proposals/cycle17a_roi_ranking_3d.md](proposals/cycle17a_roi_ranking_3d.md) — Optimization mode pre-reg (PAUSED)
- [history/cycle16_kelly_portfolio.md](history/cycle16_kelly_portfolio.md) — Chu kỳ gần nhất (ROI-axis reject)

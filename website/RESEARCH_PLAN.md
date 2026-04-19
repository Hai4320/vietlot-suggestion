# Research Plan: Cải thiện Thuật toán Gợi ý Xổ số Vietlott

## Tổng quan

### Mục tiêu
Nghiên cứu, thiết kế và đánh giá các thuật toán gợi ý số xổ số dựa trên phân tích thống kê, nhằm tối ưu hóa **số lượng số trùng trung bình (avg matches)** và **tỷ lệ trúng bất kỳ giải (win rate)** so với baseline ngẫu nhiên.

### Phạm vi
| Sản phẩm | Loại | Dữ liệu | Không gian | Đặc thù |
|---|---|---|---|---|
| Power 6/55 | Matrix | 1.334 kỳ (2017–2026) | C(55,6) = 28.9M tổ hợp | Có số Power riêng |
| Mega 6/45 | Matrix | 1.301 kỳ | C(45,6) = 8.1M tổ hợp | Không có số đặc biệt |
| Lotto 5/35 | Matrix | 538 kỳ | C(35,5)×12 = 3.8M tổ hợp | Có số đặc biệt (1-12) |
| Max 3D | 3-digit | 1.064 kỳ × 20 số/kỳ | 1.000 số (000-999) | Giải theo bậc |
| Max 3D Pro | 3-digit | 711 kỳ × 20 số/kỳ | 1.000² cặp | Dò cả thuận/ngược |

---

## Phase 1: Đánh giá Hiện trạng (2 ngày)

### 1.1 Audit thuật toán hiện tại

**Website (suggest-matrix.ts, suggest-3d.ts)** — 3 chiến lược:
| Chiến lược | Ý tưởng | Vấn đề |
|---|---|---|
| `frequency` | Weighted random theo tần suất lịch sử | Không có decay, lookback window cứng, không xét tương quan |
| `absence` | Ưu tiên số vắng lâu nhất | "Gambler's fallacy" — số vắng lâu không có xác suất cao hơn |
| `mixed` | 50/50 hot + cold | Tỷ lệ cứng, không adaptive, chỉ dùng top-15 pool |

**Python ML module** — 9 chiến lược (đã backtest):
| Chiến lược | Avg Matches | ROI | Nhận xét |
|---|---|---|---|
| RandomModel | 0.88 | -80.77% | Baseline |
| FrequencyStrategy (hot) | 0.69 | -90.38% | **Tệ hơn random** |
| PatternStrategy | 0.77 | -90.38% | Spacing/range patterns |
| NotRepeatStrategy | 0.60 | -100.00% | Không hiệu quả |
| FrequencyStrategy (cold) | 0.73 | -100.00% | Cold numbers tệ hơn |

**Kết luận sơ bộ**: Tất cả chiến lược hiện tại đều **tệ hơn hoặc ngang với random** (0.88 avg matches). Điều này phù hợp với lý thuyết xác suất — xổ số là quá trình ngẫu nhiên. Tuy nhiên, có dư địa cải thiện ở:
- **Coverage optimization** (phủ nhiều tổ hợp hơn trên nhiều vé)
- **Wheel systems** (đảm bảo bắt được k số nếu đoán đúng m số)
- **Statistical pattern mining** (dù weak, vẫn có thể khai thác RNG bias nếu tồn tại)

### 1.2 Backtest toàn diện

```
Hành động:
- Chạy lại backtest trên TOÀN BỘ dữ liệu (không chỉ 52 kỳ)
- Backtest từng product riêng biệt (hiện chỉ test Power 6/55)
- Thêm metrics: Expected Value, coverage ratio, diversity score
- So sánh với theoretical random baseline (không chỉ 1 random run)
```

**Deliverable**: Bảng so sánh chi tiết cho 5 sản phẩm × 9 chiến lược = 45 kết quả

---

## Phase 2: Research Thuật toán (3 ngày)

### 2.1 Lý thuyết nền tảng

**Thực tế quan trọng**: Xổ số sử dụng RNG (Random Number Generator) được kiểm toán, nên **không tồn tại chiến lược đánh bại xổ số về mặt kỳ vọng (Expected Value luôn âm)**. Tuy nhiên, có thể tối ưu:

1. **Conditional coverage** — chọn số sao cho "nếu trúng thì trùng nhiều nhất"
2. **Expected matches** — tăng số lượng trùng trung bình
3. **Variance reduction** — giảm biến động giữa các lần
4. **Ticket diversity** — đảm bảo N vé phủ tối đa không gian

### 2.2 Các phương pháp nghiên cứu

#### Nhóm A: Combinatorial Optimization (cho Matrix products)

| # | Phương pháp | Mô tả | Nguồn |
|---|---|---|---|
| A1 | **Lottery Wheeling Systems** | Đảm bảo nếu đoán đúng m số → ít nhất 1 vé có k số trùng. Ví dụ: Abbreviated Wheel Cover C(55,6,6,3,2) | Covering Designs (Gordon et al.), La Jolla Covering Repository |
| A2 | **Balanced Incomplete Block Design (BIBD)** | Thiết kế tổ hợp tối ưu — mỗi cặp số xuất hiện đều nhau, phủ đều không gian | Combinatorial Design Theory (Colbourn & Dinitz) |
| A3 | **Set Cover / Greedy Coverage** | Greedy chọn vé maximize marginal coverage trên tập "candidate" numbers | Chvátal's Greedy Algorithm |

#### Nhóm B: Statistical Signal Mining (cho cả 2 loại)

| # | Phương pháp | Mô tả | Nguồn |
|---|---|---|---|
| B1 | **Exponential Decay with Bayesian Prior** | Nâng cấp ExponentialDecay: thêm Bayesian prior (uniform) + posterior update, tự chỉnh half-life | Bayesian Statistics (Gelman et al.) |
| B2 | **Markov Chain Transition Matrix** | Xây ma trận chuyển P(số i xuất hiện | kỳ trước có số j), dùng cho dự đoán | Hidden Markov Models (Rabiner 1989) |
| B3 | **Chi-Square RNG Bias Detection** | Test thống kê χ² cho từng số để phát hiện bias (nếu có) trong RNG, chỉ khai thác khi p < 0.05 | Pearson's Chi-Squared Test |
| B4 | **Runs Test + Serial Correlation** | Kiểm tra tính ngẫu nhiên của chuỗi: autocorrelation, runs up/down, gap test | NIST SP 800-22 Randomness Tests |
| B5 | **Sliding Window Adaptive Weights** | Trọng số thay đổi theo window: ngắn hạn (30d) + trung hạn (90d) + dài hạn (all) kết hợp | Ensemble Methods |

#### Nhóm C: Machine Learning Approaches

| # | Phương pháp | Mô tả | Ứng dụng |
|---|---|---|---|
| C1 | **Neural Network Pattern Recognition** | LSTM/Transformer trên chuỗi kết quả | Power 6/55, Mega 6/45 (nhiều data) |
| C2 | **Clustering-Based Selection** | K-means trên feature space (freq, absence, pair) → chọn representative từ mỗi cluster | Tất cả |
| C3 | **Ensemble Voting** | Kết hợp N chiến lược, mỗi chiến lược "vote" cho số, chọn theo đa số | Tất cả |
| C4 | **Genetic Algorithm** | Tối ưu bộ số qua evolution: fitness = backtest avg matches | Power 6/55 |

#### Nhóm D: Đặc thù 3D Products

| # | Phương pháp | Mô tả |
|---|---|---|
| D1 | **Independent Digit Composition** | Tối ưu từng chữ số độc lập: P(hàng trăm=d) × P(hàng chục=d') × P(đơn vị=d'') |
| D2 | **Full Number Frequency + Recency Blend** | Score = α×freq_rank + β×recency_rank, α+β=1, tune trên validation |
| D3 | **Tier-Weighted Scoring** | Giải ĐB có trọng số cao hơn Giải 6 vì giá trị thưởng lớn hơn |
| D4 | **Reverse Order Bonus (3D Pro)** | Đặc biệt cho 3D Pro: tối ưu cặp (A,B) sao cho cả AB và BA đều có coverage |

### 2.3 Đánh giá tính khả thi

```
Tiêu chí lọc:
1. Có thể implement thuần client-side (TypeScript) ✓
2. Chạy < 500ms trên 1000+ draws ✓ 
3. Có cơ sở lý thuyết vững ✓
4. Backtest-able ✓
```

**Ưu tiên cao**: A1, A3, B1, B5, C3, D1, D2, D3
**Ưu tiên trung**: A2, B2, B3, C2, D4
**Ưu tiên thấp** (cần nhiều data/compute): C1, C4, B4

---

## Phase 3: Implement Thuật toán Mới (5 ngày)

### 3.1 Kiến trúc mới

```
SuggestionStrategy (expanded):
├── frequency        → Giữ, nâng cấp thêm decay
├── absence          → Giữ, thêm Bayesian correction  
├── mixed            → Đổi thành "Ensemble Voting"
├── NEW: wheel       → Lottery Wheeling (coverage guarantee)
├── NEW: bayesian    → Bayesian Adaptive (prior + posterior)
├── NEW: markov      → Markov Chain Transition
├── NEW: coverage    → Maximum Coverage Greedy
├── NEW: ensemble    → Weighted Ensemble (kết hợp tất cả)
```

### 3.2 Chi tiết từng thuật toán mới

#### 🎯 Wheel System (Matrix only)
```
Input: candidate_numbers (top-M frequent), guarantee level k
Output: Minimum set of tickets covering all k-subsets

Algorithm:
1. Chọn M = mainCount × 3 candidate numbers (blended scoring)
2. Sử dụng greedy wheel: mỗi vé maximize uncovered k-subsets
3. Trả về N vé (user chọn N), ưu tiên vé cover nhiều nhất

Metric mới: Coverage Guarantee — "Nếu 4/6 số đúng nằm trong candidates → 
chắc chắn có ≥1 vé trùng 3"
```

#### 🧠 Bayesian Adaptive (Matrix + 3D)
```
Input: draws, prior = Uniform(min, max)
Output: posterior weights cho từng số

Algorithm:
1. Prior: P(θ_i) = 1/N cho mỗi số i  
2. Likelihood: Multinomial với exponential decay
3. Posterior ∝ Prior × Likelihood (conjugate Dirichlet)
4. Sample từ posterior distribution
5. Adaptive half-life: cross-validate trên sliding window

Khác biệt vs hiện tại: Tự calibrate, không overfit vào pattern ngắn hạn
```

#### 🔗 Markov Chain (Matrix only)
```
Input: draws (time-ordered)
Output: transition probabilities

Algorithm:
1. Build state = set of numbers drawn in kỳ t
2. Transition: P(number i at t+1 | numbers at t)
3. Laplace smoothing để tránh zero probabilities
4. Sample proportional to transition probabilities
5. Optional: 2nd-order Markov (condition on 2 kỳ gần nhất)
```

#### 📊 Maximum Coverage (cả Matrix và 3D)
```
Input: N tickets to generate, scored candidate pool
Output: N tickets maximizing diversity

Algorithm:  
1. Score mỗi số: w_i = α×freq_score + β×recency_score + γ×pair_score
2. Ticket 1: top-k scored numbers
3. Ticket i (i>1): greedy chọn numbers maximize marginal coverage 
   (penalize numbers đã xuất hiện ở vé trước)
4. Đảm bảo: mọi số score > threshold xuất hiện ít nhất 1 lần trong N vé
```

#### 🏆 Weighted Ensemble (cả Matrix và 3D)  
```
Input: draws, all strategies
Output: tickets from voted results

Algorithm:
1. Chạy K chiến lược (freq, absence, bayesian, markov...)
2. Mỗi chiến lược "vote" cho M numbers
3. Score = Σ(strategy_weight × vote), weights from backtest performance
4. Top numbers by aggregated score → generate tickets
5. Self-tuning: weights update based on rolling backtest window
```

### 3.3 Đặc thù theo sản phẩm

| Product | Chiến lược ưu tiên | Lý do |
|---|---|---|
| **Power 6/55** | Wheel + Ensemble | Không gian lớn (55 số), cần coverage optimization |
| **Mega 6/45** | Bayesian + Coverage | Không gian vừa, đủ data |
| **Lotto 5/35** | Ensemble + Bayesian | Ít data (538 kỳ), cần prior mạnh |
| **Max 3D** | Digit Composition + Tier-Weight | 3 chữ số độc lập, tối ưu theo giải |
| **Max 3D Pro** | Reverse Pair + Digit | Đặc thù dò ngược |

---

## Phase 4: Đánh giá & Validation (3 ngày)

### 4.1 Phương pháp đánh giá

**Walk-forward cross-validation** (tránh look-ahead bias):
```
Cho mỗi kỳ t trong [T_start, T_end]:
  1. Train trên data [0, t-1]
  2. Predict cho kỳ t  
  3. So sánh prediction vs actual result
  4. Ghi nhận metrics
```

### 4.2 Metrics đánh giá

| Metric | Mô tả | Target |
|---|---|---|
| **Avg Matches** | Trung bình số trùng/vé | > 0.88 (beat random) |
| **Win Rate** | % kỳ có ≥ 3 trùng (trúng giải) | > random baseline |
| **Expected Value** | E[prize] - ticket_cost | Maximize (dù < 0) |
| **Coverage Score** | % candidate numbers xuất hiện trong actual result | > 50% |
| **Diversity Score** | Trung bình Jaccard distance giữa các vé | > 0.7 |
| **Consistency** | Std dev of matches across draws | Minimize |
| **ROI** | (Revenue - Cost) / Cost | > -80% (beat random) |
| **Sharpe Ratio** | (Avg Return - Rf) / Std(Return) | > 0 |
| **Max Drawdown** | Chuỗi thua dài nhất | Minimize |

### 4.3 Checklist đánh giá thuật toán

```markdown
## Checklist Đánh giá Chiến lược Gợi ý

### Tính đúng đắn
- [ ] Không có look-ahead bias (chỉ dùng data trước kỳ dự đoán)
- [ ] Kết quả reproducible (seeded random)
- [ ] Handles edge cases (ít data, missing draws, duplicate IDs)
- [ ] Số output nằm trong range hợp lệ
- [ ] Số output không trùng nhau trong 1 vé

### Hiệu suất thống kê
- [ ] Avg Matches > Random Baseline (0.88 cho 6/55)
- [ ] Win Rate > Random Baseline
- [ ] Kết quả ổn định qua multiple runs (std < 5%)
- [ ] Walk-forward validation qua ≥ 100 kỳ
- [ ] Không tệ hơn random trên bất kỳ sub-period nào

### Hiệu suất kỹ thuật
- [ ] Runtime < 500ms cho 1000 draws
- [ ] Memory < 50MB
- [ ] Chạy thuần client-side (TypeScript, browser)
- [ ] Không cần external API/server

### Trải nghiệm người dùng
- [ ] Giải thích được tại sao chọn số này (explainability)
- [ ] Các vé trong cùng batch đa dạng (Jaccard > 0.7)  
- [ ] Hỗ trợ cả Matrix và 3D products
- [ ] Có confidence/quality indicator
```

### 4.4 Báo cáo kết quả

**Format báo cáo cho mỗi thuật toán**:

```
═══════════════════════════════════════
Thuật toán: [Tên]
Sản phẩm: [Product]
Data: [N kỳ] (từ [start] đến [end])
═══════════════════════════════════════

Tham số tối ưu: { ... }

Kết quả Walk-Forward (500 kỳ gần nhất):
┌─────────────────┬──────────┬──────────┐
│ Metric          │ Strategy │ Random   │
├─────────────────┼──────────┼──────────┤
│ Avg Matches     │ X.XX     │ 0.88     │
│ Win Rate        │ X.XX%    │ 0.04%    │
│ Coverage Score  │ X.XX%    │ ~18%     │
│ Diversity Score │ X.XX     │ ~0.85    │
│ ROI             │ -XX.XX%  │ -80.77%  │
│ Sharpe Ratio    │ X.XX     │ X.XX     │
└─────────────────┴──────────┴──────────┘

Phân phối Matches:
  0 trùng: XX.X%
  1 trùng: XX.X%
  2 trùng: XX.X%
  3 trùng: XX.X%  ← giải ba
  4 trùng: XX.X%  ← giải nhì
  5 trùng: XX.X%  ← giải nhất
  6 trùng: XX.X%  ← Jackpot

Kết luận: [PASS/FAIL] — [lý do]
```

---

## Phase 5: Tích hợp Website (2 ngày)

### 5.1 Cập nhật TypeScript implementations
- Port thuật toán mới từ Python → TypeScript
- Thêm strategy options vào UI
- Hiển thị confidence indicator + giải thích cho mỗi bộ số

### 5.2 Cập nhật UI
- Strategy cards cho thuật toán mới
- "Quality score" badge cho mỗi bộ số
- Tooltip giải thích tại sao chọn số này
- Comparison mode: so sánh N thuật toán side-by-side

---

## Timeline tổng

```
Tuần 1: Phase 1 (Audit) + Phase 2 (Research)
  Day 1-2: Backtest toàn bộ, audit thuật toán hiện tại  
  Day 3-5: Research + chọn thuật toán implement

Tuần 2: Phase 3 (Implement) + Phase 4 (Evaluate)
  Day 6-8: Implement 5 thuật toán mới (Python + TypeScript)
  Day 9-10: Walk-forward backtest + validation
  Day 11: Báo cáo kết quả + so sánh

Tuần 3: Phase 5 (Integrate)
  Day 12-13: Tích hợp vào website + UI updates
  Day 14: Final testing + documentation
```

---

## Ghi chú quan trọng

> **Disclaimer**: Xổ số là quá trình ngẫu nhiên. Không có thuật toán nào có thể "đánh bại" xổ số về mặt expected value. Mục tiêu research này là:
> 1. **Tối ưu coverage** — Nếu có trúng thì trùng nhiều số nhất có thể
> 2. **Đảm bảo diversity** — N vé phủ rộng không gian
> 3. **Phát hiện bias** — Nếu RNG có bias (dù nhỏ), khai thác nó
> 4. **Trải nghiệm** — Người dùng cảm thấy gợi ý "thông minh" hơn random

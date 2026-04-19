# Quy Trình Nghiên Cứu Thuật Toán Xổ Số — Playbook

> **Mục đích**: Tài liệu tổng hợp các bước, lưu ý, sai lầm cần tránh, và template khi thực hiện nghiên cứu thuật toán dự đoán cho bất kỳ sản phẩm xổ số nào. Rút ra từ kinh nghiệm nghiên cứu Max 3D (04/2026).

---

## Tổng Quan Pipeline

```
PHASE 0: Hiểu dữ liệu
    ↓
PHASE 1: Phân tích thống kê sâu → Tìm bias
    ↓
PHASE 2: Thiết kế thuật toán khai thác bias
    ↓
PHASE 3: Walk-forward backtest
    ↓
PHASE 4: Iterate (lặp phase 2-3) → Tối ưu
    ↓
PHASE 5: Triển khai (website/code)
```

---

## Phase 0 — Hiểu Dữ Liệu

### Checklist

- [ ] Đọc data format (JSONL structure, tên field)
- [ ] Xác định không gian số (000-999 cho 3D, 1-55 cho 6/55, v.v.)
- [ ] Xác định số lượng số mỗi kỳ quay (20 cho 3D, 7 cho 6/55)
- [ ] Xác định cấu trúc giải thưởng (tier, prize value)
- [ ] Đếm số kỳ quay, date range
- [ ] Kiểm tra duplicate, missing draws, data quality

### Lưu ý quan trọng

1. **Luôn đọc HEAD và TAIL của data file** — xác nhận format nhất quán đầu/cuối
2. **Pad số về đúng format** (ví dụ: `"15"` → `"015"` cho 3D) — lỗi phổ biến nhất
3. **Sort by date ascending** trước khi làm mọi thứ — backtest dựa vào thứ tự thời gian
4. **Xác định P(trúng) lý thuyết** làm baseline:
   - 3D: P = 20/1000 = 2.0% (per number)
   - 6/55: E[match] = 6 × 6/55 = 0.6545
   - 6/45: E[match] = 6 × 6/45 = 0.8000

### Công cụ

```bash
# Đọc data nhanh
head -5 data/<file>.jsonl   # Xem format
tail -5 data/<file>.jsonl   # Xem data mới nhất
wc -l data/<file>.jsonl     # Đếm records
```

---

## Phase 1 — Phân Tích Thống Kê Sâu

### Bộ Test Bắt Buộc (13 tests đã dùng cho 3D)

| # | Test | Mục đích | Công cụ |
|---|------|----------|---------|
| 1 | **Chi² whole number** | Phân bố toàn số có đều? | `scipy.stats.chi2` |
| 2 | **Chi² từng digit/vị trí** | Từng vị trí digit có đều? | `scipy.stats.chi2` |
| 3 | **Digit independence** | Các vị trí có độc lập? | Chi² on joint dist |
| 4 | **Serial correlation** | Số t có tương quan với số t-1? | Autocorrelation |
| 5 | **Runs test** | Chuỗi xuất hiện có ngẫu nhiên? | Wald-Wolfowitz |
| 6 | **Digit sum distribution** | Tổng chữ số có khớp lý thuyết? | Chi² vs theoretical |
| 7 | **Tier analysis** | Phân bố khác nhau giữa các giải? | KS test |
| 8 | **Temporal window** | Tần suất ổn định qua thời gian? | Correlation |
| 9 | **Gap analysis** | Khoảng cách giữa các lần xuất hiện | Descriptive stats |
| 10 | **Conditional probability** | P(X | Y appeared last draw) | Lift analysis |
| 11 | **Ending digit** | Pattern ở chữ số cuối | Chi² |
| 12 | **Repeat analysis** | Tần suất lặp giữa 2 kỳ liên tiếp | Hypergeometric |
| 13 | **Draw sum** | Tổng tất cả số 1 kỳ | Normal test |

### Output mong đợi

Với mỗi test, ghi lại:
```json
{
  "test_name": "...",
  "p_value": 0.033,
  "is_significant": true,
  "interpretation": "Bias detected at position 1",
  "exploitable": true,
  "direction": "Digit 5 over-represented by 6%"
}
```

### ⚡ Phát hiện từ nghiên cứu 3D (để tham khảo)

| Phát hiện | Max 3D | Max 3D Pro | Ý nghĩa |
|-----------|--------|------------|----------|
| Digit 6 vượt trội ở đơn vị | +10% (p≈0) | +11.6% (p=0.003) | Bias mạnh nhất |
| Digit 5 vượt trội ở hàng chục | +6% (p=0.033) | +6.5% (p=0.006) | Consistent |
| Vị trí digit KHÔNG độc lập | ✓ (p<0.001) | ✓ (p<0.001) | P(abc) ≠ P(a)P(b)P(c) |
| Runs test fail | p=0.040 | Pass (p=0.081) | phi ngẫu nhiên ở Max 3D |
| Temporal correlation | ≈0 | ≈0 | Không khai thác được time series |
| Repeat rate | = expected | = expected | Không có pattern lặp |

### Sai lầm cần tránh

1. **ĐỪNG bỏ qua digit-level analysis** — Whole-number distribution có thể PASS nhưng digit-level FAIL (đây là phát hiện lớn nhất)
2. **ĐỪNG chỉ test 1 level** — Test cả: whole number → digit → pair → joint
3. **ĐỪNG kết luận "random" chỉ vì 1 test pass** — Chạy ĐỦ 13 tests
4. **ĐỪNG quên Bonferroni correction** khi chạy nhiều tests — p < 0.05 với 13 tests có thể là false positive (ngưỡng nên = 0.05/13 ≈ 0.004 cho strict)
5. **Temporal window analysis rất quan trọng** — nếu correlation ≈ 0 giữa các window → bias ổn định (tốt); nếu correlation thay đổi → cần adaptive strategy

### Template code

```python
# File: deep_analysis.py
# Xem website/research/3d_deep_analysis.py làm mẫu
# Output: JSON file với kết quả tất cả tests
# Key function signatures:
def chi_squared_whole_number(draws) -> Dict   # Test 1
def chi_squared_digit_position(draws) -> Dict  # Test 2
def digit_independence_test(draws) -> Dict     # Test 3
def serial_correlation_test(draws) -> Dict     # Test 4
def runs_test(draws) -> Dict                   # Test 5
def digit_sum_analysis(draws) -> Dict          # Test 6
def tier_analysis(draws) -> Dict               # Test 7
def temporal_window_analysis(draws) -> Dict    # Test 8
def gap_analysis(draws) -> Dict                # Test 9
def conditional_probability(draws) -> Dict     # Test 10
def ending_digit_analysis(draws) -> Dict       # Test 11
def repeat_analysis(draws) -> Dict             # Test 12
def draw_sum_analysis(draws) -> Dict           # Test 13
```

---

## Phase 2 — Thiết Kế Thuật Toán

### Framework phân loại (4 categories)

| Category | Ý tưởng | Khi nào dùng |
|----------|---------|-------------|
| **A: Bias Exploitation** | Khai thác trực tiếp bias tìm được | Khi phase 1 phát hiện bias đáng kể (p < 0.01) |
| **B: Coverage Optimization** | Phủ rộng không gian số | Khi mua nhiều vé (N > 5) |
| **C: Hybrid / Ensemble** | Kết hợp nhiều tín hiệu | Khi không chắc signal nào mạnh nhất |
| **D: Mathematical Optimization** | Tối ưu hóa trực tiếp EV hoặc metric | Khi có đủ dữ liệu để ước lượng |

### Thuật toán đã chứng minh hiệu quả (sẵn sàng tái sử dụng)

#### 1. JointDigitBias — Cho sản phẩm có digit structure (3D, 4D, etc.)

```
P(abc) = (count(abc) + α) / (total + N_space × α)
P_sample ∝ P^(1/T)      # T = temperature
```

- **Khi nào dùng**: Khi digit independence test FAIL
- **Hyperparams**: lookback=300, temperature=1.0, alpha=1.0
- **Kết quả 3D**: +0.296pp vs random (Max 3D), +0.378pp (3D Pro)

#### 2. ConditionalChain — Chain rule khai thác dependency

```
P(d0,d1,d2) = P(d0) × P(d1|d0) × P(d2|d0,d1)
```

- **Khi nào dùng**: Khi pair independence test FAIL
- **Lưu ý**: Temperature thấp (0.6-0.8) thường tốt hơn T=1.0
- **Kết quả 3D**: +0.106pp (3D Pro)

#### 3. EVMaximizer — Tối ưu Expected Value

```
E[prize(num)] = Σ_tier P(num ∈ tier) × prize(tier)
              + exponential decay weighting
              + diversity constraint (min digit distance)
```

- **Khi nào dùng**: Khi sản phẩm có tier structure (giải thưởng khác nhau)
- **Hyperparams**: lookback=300, half_life=100, min_digit_distance=4
- **Kết quả 3D Pro**: ★★ **BEST** — +0.499pp, ROI -26.5%

#### 4. PairExploiter — Khai thác O/E ratio của digit pairs

```
Synergy(abc) = (O/E[a,b]) × (O/E[b,c]) × (O/E[a,c])
O/E[i,j] = Observed(i,j) / (P(i) × P(j) × N)
```

- **Khi nào dùng**: Khi digit pairs show O/E > 1.1 hoặc < 0.9
- **Kết quả 3D**: +0.276pp (Max 3D)

#### 5. ULTIMATE Composite — Multi-signal ensemble

```
Score = w1×JointFreq + w2×PairSynergy + w3×TierEV + w4×DigitSumLikelihood
```

- **Khi nào dùng**: Khi muốn ổn định, không biết signal nào dominant
- **Lưu ý**: Sharp temperature (0.5) + short half_life (80) cho variant tốt hơn

#### 6. FreqWholeHot — Baseline mạnh nên luôn test

```
Sample from top-50 most frequent with frequency weighting
```

- **Quan trọng**: Đây là baseline **rất mạnh** cho 3D — thường #1 hoặc top-3
- **Luôn include** trong benchmark comparison

### Thuật toán KHÔNG hiệu quả (tránh)

| Thuật toán | Vấn đề | Alternative |
|-----------|--------|-------------|
| AdaptiveBias T=0.7 | Temperature quá thấp → tệ hơn random | Dùng T ≥ 0.9 |
| CondChain T=0.8 (Max 3D) | Tệ hơn random trên Max 3D | Chỉ dùng cho 3D Pro |
| EVMaximizer (Max 3D) | Tệ hơn random ở sản phẩm nhiều data | Chỉ phù hợp khi data < 800 draws |
| CoverageOpt (3D Pro) | Tệ nhất trên 3D Pro | Chỉ phù hợp Max 3D |

### ⚠️ Bài học quan trọng về hyperparameters

1. **Temperature là hyperparameter QUAN TRỌNG NHẤT**:
   - T = 1.0 → giữ nguyên distribution (thường ổn)
   - T = 0.5-0.7 → tập trung vào top (tốt cho 3D Pro do ít data)
   - T > 1.2 → phẳng hóa quá mức → gần random
   - **Luôn test ít nhất 2-3 giá trị T**: [0.6, 0.8, 1.0]

2. **Lookback window phụ thuộc vào dataset size**:
   - Data < 500 draws: lookback = 200-300
   - Data 500-1000: lookback = 200-400
   - Data > 1000: lookback = 200 (đủ) hoặc full

3. **Exponential decay half_life nên ≈ 1/5 dataset size**:
   - 711 draws → half_life ≈ 100-150
   - 1064 draws → half_life ≈ 100-200

4. **Strategy tốt nhất KHÁC NHAU giữa các product** — ĐỪNG assume 1 strategy optimal cho tất cả

---

## Phase 3 — Walk-Forward Backtest

### Thiết kế backtest chống sai lệch

```python
def walk_forward_backtest(draws, strategy, cfg, min_history=50, n_runs=5, n_predictions=2):
    for run in range(n_runs):
        for i in range(min_history, len(draws)):
            train = draws[:i]          # CHỈ data trước thời điểm predict
            predicted = strategy.predict(train, n_predictions)
            evaluate(predicted, draws[i])   # So sánh với thực tế
```

### Checklist backtest

- [ ] **No look-ahead bias**: `train = draws[:i]` — KHÔNG BAO GIỜ dùng draws[i] trong training
- [ ] **Fixed seed**: `random.seed(42); np.random.seed(42)` — reproducible
- [ ] **Reset seed per strategy**: Đảm bảo so sánh fair
- [ ] **Multiple runs** (≥ 3, tốt nhất 5): Giảm variance do randomness
- [ ] **Min history ≥ 50**: Không predict khi chưa đủ data
- [ ] **Cross-product validation**: Test cùng strategy trên nhiều sản phẩm

### Metrics bắt buộc

| Metric | Công thức | Ý nghĩa | Target |
|--------|-----------|----------|--------|
| **Exact Match Rate** | hits / (preds × draws × runs) × 100 | Xác suất trúng per number | > baseline |
| **ROI** | (revenue - cost) / cost × 100 | Return on investment | Minimize negative |
| **Total Hits** | Tổng lần trúng | Volume | Maximize |
| **Sharpe Ratio** | mean(profit) / std(profit) × √52 | Risk-adjusted return | > -0.5 là tốt |
| **Δ vs Random** | strategy_rate - random_rate | Cải thiện so với random | > 0 |

### Output format

```json
{
  "strategy_name": "...",
  "total_predictions": 5070,
  "exact_match_rate": 2.496,
  "roi_pct": -26.5,
  "total_hits": 165,
  "sharpe_ratio": -0.428,
  "tier_hits": {"Giải Đặc biệt": 20, "Giải Nhất": 45, ...},
  "elapsed_seconds": 2.3
}
```

### Sai lầm phổ biến

1. **Chỉ chạy 1 run** → Kết quả bị dominated bởi luck → Cần ≥ 3 runs
2. **Không reset seed giữa strategies** → So sánh không fair
3. **Test quá ít predictions** (n=1) → Variance quá cao → Dùng n=2 minimum
4. **Dùng ROI làm metric chính** → ROI phụ thuộc cả hit tier, không phản ánh match rate → Dùng Exact Match Rate + ROI song song
5. **Không bao gồm baselines** → Luôn include Random + FreqWholeHot

---

## Phase 4 — Iterate & Tối Ưu

### Quy trình lặp

```
1. Chạy backtest với default hyperparams
2. Xếp hạng → Xác định top-5 strategies
3. Với mỗi top strategy: grid search hyperparams
   - Temperature: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
   - Lookback: [100, 200, 300, 400]
   - Half_life (nếu có): [50, 80, 100, 150]
4. Chạy lại backtest với best hyperparams
5. Nếu improvement > 0.05pp → Tiếp tục iterate
6. Nếu không → Kết luận, chuyển phase 5
```

### Khi nào dừng iterate?

- Improvement < 0.05 percentage point giữa 2 iterations
- Top-3 strategy stable (cùng thứ tự 2 lần liên tiếp)
- Đã test ≥ 20 strategy variants

### Bảng so sánh cross-product (template)

| Strategy | Max 3D | Max 3D Pro | Power 6/55 | Mega 6/45 | Lotto 5/35 |
|----------|--------|------------|------------|-----------|------------|
| Strategy A | rank, Δ | rank, Δ | rank, Δ | rank, Δ | rank, Δ |
| ... | ... | ... | ... | ... | ... |

→ Strategy tốt nhất trung bình = robust choice

---

## Phase 5 — Triển Khai

### Checklist triển khai website

- [ ] Tạo page mới: `website/src/app/<route>/page.tsx`
- [ ] Thêm link vào Navbar (mobile + desktop): `components/layout/Navbar.tsx`
- [ ] Thêm link vào Sidebar: `components/layout/Sidebar.tsx`
- [ ] Build test: `npx next build` — phải pass
- [ ] Hardcode data từ backtest results (không fetch runtime)
- [ ] Disclaimer ở cuối page

### Cấu trúc page nghiên cứu (template)

```
1. Header + mô tả ngắn
2. Key Findings (card grid)
3. RNG Quality Tests (table)
4. Bias Visualization (bar charts)
5. Strategy Descriptions (card grid)
6. Backtest Results — Product A (table)
7. Backtest Results — Product B (table)
8. Methodology (card)
9. Recommendations (highlight card)
10. Disclaimer
```

---

## Cấu Trúc File Nghiên Cứu (Convention)

```
website/research/
├── <product>_deep_analysis.py        # Phase 1: Statistical analysis
├── <product>_deep_analysis.json      # Phase 1: Results
├── <product>_advanced_backtest.py    # Phase 2-3: Strategies + Backtest
├── <product>_advanced_backtest_results.json  # Phase 3: Results
├── <PRODUCT>_RESEARCH_REPORT.md      # Summary document
└── RESEARCH_PLAYBOOK.md              # This file (cross-project)
```

---

## Những Gì Đã Học Được (Lessons Learned)

### 1. "Simple beats complex" thường đúng

FreqWholeHot (chọn từ 50 số phổ biến nhất) là #1 trên Max 3D mặc dù đơn giản nhất. Thuật toán phức tạp như ULTIMATE_v1 chỉ ngang/thua. **Luôn bắt đầu từ baseline đơn giản.**

### 2. "Best strategy" phụ thuộc vào dataset size

- **Dataset nhỏ (< 800 draws)**: EVMaximizer, Bayesian → tốt vì leverage prior + decay
- **Dataset lớn (> 1000 draws)**: FreqWholeHot, JointBias → tốt vì đủ data ước lượng

### 3. Bias tồn tại nhưng NHỎ

Bias lớn nhất phát hiện được = +11% cho 1 digit ở 1 vị trí. Đây là edge NHỎ nhưng CONSISTENT. Thuật toán khai thác được edge nhỏ này sẽ cải thiện 15-25% so với random.

### 4. Temperature là "master knob"

Nếu chỉ tune 1 hyperparameter, tune Temperature. Nó quyết định exploration vs exploitation:
- T cao → random-like → waste edge
- T thấp → overfitting → tệ hơn random
- T vừa (0.7-1.0) → sweet spot

### 5. Diversity constraint QUAN TRỌNG khi mua > 1 vé

Nếu mua 2 vé giống nhau → phí 1 vé. Min digit distance = 4-5 đảm bảo 2 vé cover khác region.

### 6. ROI ≠ Match Rate

Strategy có match rate cao chưa chắc ROI tốt (nếu toàn match giải Ba). **Tier-weighted optimization** cải thiện ROI đáng kể.

### 7. Cross-product validation là BẮT BUỘC

Strategy #1 trên product A có thể tệ nhất trên product B. **Luôn test trên ≥ 2 products** trước khi kết luận.

### 8. Dependencies cần install

```bash
uv pip install scipy numpy  # Cho analysis
# scipy.stats: chi2, ks_2samp, normaltest, pearsonr, norm
# numpy: random, array operations
```

### 9. Chạy script với đúng Python environment

```bash
# ĐÚNG — dùng venv python trực tiếp
.venv/bin/python3 script.py

# SAI — source activate không persist qua tool calls
source .venv/bin/activate && python3 script.py

# SAI — system python không có deps
python3 script.py
```

---

## Checklist Tổng Hợp — Copy-paste cho mỗi lần nghiên cứu mới

```markdown
## Nghiên cứu: [TÊN SẢN PHẨM] — [NGÀY]

### Phase 0: Hiểu dữ liệu
- [ ] Đọc data format, đếm records
- [ ] Xác định không gian số, số lượng/kỳ, prize structure
- [ ] Tính P(trúng) lý thuyết
- [ ] Kiểm tra data quality

### Phase 1: Phân tích thống kê (13 tests)
- [ ] Chi² whole number
- [ ] Chi² digit/position
- [ ] Digit independence
- [ ] Serial correlation
- [ ] Runs test
- [ ] Digit sum
- [ ] Tier analysis
- [ ] Temporal window
- [ ] Gap analysis
- [ ] Conditional probability
- [ ] Ending digit/pattern
- [ ] Repeat analysis
- [ ] Draw sum
- [ ] → Tổng hợp: exploitable bias nào?

### Phase 2: Thiết kế thuật toán
- [ ] Chọn category phù hợp (A/B/C/D)
- [ ] Implement ≥ 10 strategies (2+ variants per strategy)
- [ ] Include baselines: Random + FreqWholeHot

### Phase 3: Backtest
- [ ] Walk-forward, no look-ahead
- [ ] Fixed seed (42), ≥ 5 runs
- [ ] Min history 50 draws
- [ ] Record: Exact%, ROI%, Hits, Sharpe, Δ Random
- [ ] Cross-product validation

### Phase 4: Iterate
- [ ] Grid search top-5 hyperparams
- [ ] Improvement > 0.05pp? → Continue
- [ ] Top-3 stable? → Stop

### Phase 5: Triển khai
- [ ] Tạo page `website/src/app/<route>/page.tsx`
- [ ] Thêm nav links (Navbar + Sidebar)
- [ ] Build test pass
- [ ] Commit + push
```

---

*Cập nhật lần cuối: 2026-04-19 — Dựa trên nghiên cứu Max 3D (Phase 1 hoàn thành)*

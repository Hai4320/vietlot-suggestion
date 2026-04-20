# Quy Trình Nghiên Cứu Thuật Toán Xổ Số — Playbook

> **Vai trò sau chuẩn hóa 2026-04-20**: File này là **template copy-paste + catalog strategy cụ thể + lessons learned**. Methodology, test battery, và evaluation đã chuyển sang 3 canonical:
>
> - [METHODOLOGY.md](METHODOLOGY.md) — phương pháp research (5-phase pipeline, anti-patterns, decision tree)
> - [TESTING.md](TESTING.md) — bias detection battery (14 matrix / 13 digit tests, Bonferroni)
> - [EVALUATION.md](EVALUATION.md) — metrics + significance test + output schema
>
> **Khi nào đọc file này**: Sau khi đã nắm pipeline (METHODOLOGY), muốn tham khảo strategy formulae có sẵn (Phase 2), hyperparameter grids đã tune (Phase 4), và lessons learned cụ thể từ cycle trước.

---

## Tổng Quan Pipeline

Xem chi tiết entry/exit criteria, anti-patterns, decision tree trong [METHODOLOGY.md](METHODOLOGY.md).

```
Phase 0: Data ingest → Phase 1: Bias detect → Phase 2: Design → Phase 3: Validate → Phase 4: Ship
```

**Nhắc nhở quan trọng từ METHODOLOGY**:
- **R1 gate**: Phase 1 fail Bonferroni → STOP, không Phase 2. White noise là kết quả hợp lệ.
- **Pre-registration**: Ghi hypothesis vào HISTORY *trước* khi backtest (§3.1 METHODOLOGY).
- **Algebra check**: Chứng minh E[match | strategy] > E[match | random] trước khi spend compute (§1.4 METHODOLOGY).

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

**Đầy đủ chi tiết: [TESTING.md](TESTING.md)**. Dưới đây chỉ là phát hiện đã có từ các cycle trước.

### ⚡ Phát hiện từ nghiên cứu 3D (tham khảo)

| Phát hiện | Max 3D | Max 3D Pro | Ý nghĩa |
|-----------|--------|------------|----------|
| Digit 6 vượt trội ở đơn vị | +10% (p≈0) | +11.6% (p=0.003) | Bias mạnh nhất |
| Digit 5 vượt trội ở hàng chục | +6% (p=0.033) | +6.5% (p=0.006) | Consistent |
| Vị trí digit KHÔNG độc lập | ✓ (p<0.001) | ✓ (p<0.001) | P(abc) ≠ P(a)P(b)P(c) |
| Runs test fail | p=0.040 | Pass (p=0.081) | phi ngẫu nhiên ở Max 3D |
| Temporal correlation | ≈0 | ≈0 | Không khai thác được time series |
| Repeat rate | = expected | = expected | Không có pattern lặp |

### ⚡ Phát hiện từ nghiên cứu Lotto 5/35 (tham khảo)

- 13/14 tests PASS uniformity → data gần white noise ở các cạnh thông thường
- **T11 Parity odd-count** p=0.0012 qua Bonferroni — Mode 0-odd +84%, Mode 3-odd +13%, Mode 5-odd +41%
- **Nhưng**: single-ticket không thể exploit parity variance (chứng minh đại số — xem Chu kỳ 5 HISTORY). Chỉ multi-ticket wheeling mới có edge.

### Template code

Reference implementation:
- Matrix (14 tests): [matrix/power535_deep_analysis.py](matrix/power535_deep_analysis.py)
- Digit (13 tests): [3d/deep_analysis.py](3d/deep_analysis.py)

Output JSON schema và interpretation flowchart: [TESTING.md §2, §7](TESTING.md).

---

## Phase 2 — Thiết Kế Thuật Toán

### ⚡ Bắt buộc trước khi code (Phase 2 gates)

#### Gate 1: Pre-registration hypothesis (METHODOLOGY §3.1)

Copy-paste template này vào `RESEARCH_HISTORY.md` **trước** khi implement. Đây là hypothesis public; sau backtest, so sánh với outcome, không được viết lại.

```markdown
### Pre-registered Hypothesis — Cycle N (YYYY-MM-DD)

**Strategy**: <tên đề xuất>
**Products target**: <power_535 / max_3d / ...>
**Trigger finding** (từ Phase 1): Test <T?> p=<...> qua Bonferroni. Bias: <direction>.

**Mechanism** (why this should work):
<1-2 câu: strategy khai thác bias như thế nào>

**Predicted effect size**:
- Primary metric: <win_rate_ge3 / exact_match_rate / p_any_hit_ge3>
- Expected Δ vs Random: +<X.X> pp
- Direction: strategy > Random

**Success criterion**:
- [ ] p_value_raw < 0.05
- [ ] passes_bonferroni (K=<số strategies>)
- [ ] ci95_lo_pp > 0
- [ ] Decision ∈ {Accept, Suggestive}

**Failure mode** (ghi nhận nếu):
- Kết quả Reject → ghi lý do, đóng hypothesis
- Effect size < predicted / 2 → flag effect overestimate trong methodology
```

#### Gate 2: Algebra sanity check (METHODOLOGY §1.4)

Trước khi implement, viết công thức kỳ vọng trên giấy / trong commit message. Mục tiêu: phát hiện sớm strategy *không thể* beat random (không cần backtest).

**Template**:
```
Given: bias <X> với effect size <ε>
Strategy chọn theo: <rule>

Under strategy S:
  E[hits_i] = <công thức từ bias + rule>

Under Random R:
  E[hits_i] = <công thức baseline>

Δ = E[hits_S] - E[hits_R] = <kết quả>

Kết luận:
  [ ] Δ > 0 (về lý thuyết có thể work) → implement
  [ ] Δ = 0 (bias không exploit được bởi rule này) → đổi rule hoặc multi-ticket
  [ ] Δ < 0 (rule đi ngược bias) → vứt bỏ
```

**Ví dụ đã dùng** (Chu kỳ 5 Phase 2a — đã chứng minh single-ticket parity không work):
```
Bias: parity odd-count distribution lệch so với hypergeometric
Strategy: sample vé với k odd từ dist P_emp(k)
  E[match | k odd drawn, j odd in ticket] = k·j/18 + (5-k)·(5-j)/17
  E[match over tickets] = E_k[E_j[k·j/18 + (5-k)·(5-j)/17]]
                        = E[k]·E[j]/18 + (5-E[k])·(5-E[j])/17   (vì k ⊥ j)
Kết luận: E[match] CHỈ phụ thuộc E[k]. Không phụ thuộc Var[k].
Observed E[k] = 2.544 ≈ uniform E[k] = 2.571 → Δ ≈ 0.
→ Single-ticket KHÔNG work. Chuyển multi-ticket (đã validate Phase 2b).
```

---

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

**Đầy đủ chi tiết: [EVALUATION.md](EVALUATION.md)** — metric taxonomy, significance test (z-test, Wilson CI, permutation), output JSON schema, decision rules.

### Quick checklist

- [ ] Walk-forward: `train = draws[:i]`, không look-ahead
- [ ] Fixed seed: `random.seed(42); np.random.seed(42)`, reset trước mỗi strategy
- [ ] `n_runs ≥ 3` (5 preferred cho stochastic strategies)
- [ ] `min_history` ≥ 100 matrix / 50 digit
- [ ] Include `Random` + simple baseline mạnh nhất của product
- [ ] **Significance test trên Δ vs Random** (z-test proportion hoặc permutation) — bắt buộc, xem [EVALUATION §3](EVALUATION.md)
- [ ] Report: point estimate + p-value + Wilson 95% CI + `passes_bonferroni`
- [ ] Cross-product validation khi applicable

### Common pitfalls

| Pitfall | Fix |
|---------|-----|
| Bare Δ không p-value | Luôn z-test vs Random, report cả p_raw và Bonferroni-adjusted |
| `n_runs=1` → variance dominated by luck | `n_runs ≥ 3` |
| ROI làm metric chính | Report accuracy + ROI song song — ROI âm là chuẩn, Δ accuracy mới tell signal |
| Grid search 50 configs rồi report best | Bonferroni trên K configs hoặc hold-out validation |
| Thiếu baseline mạnh | Include cả Random **và** simple baseline (FreqWholeHot / Pattern) |

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

### Phase 1: Phân tích thống kê
- [ ] Chọn battery phù hợp: matrix (14 tests) hoặc digit (13 tests) — xem [TESTING.md §3-4](TESTING.md)
- [ ] Chạy toàn bộ battery, cố định **trước** khi chạy
- [ ] Bonferroni `α_strict = 0.05/n_tests`
- [ ] R1 gate: nếu không test nào pass Bonferroni → STOP, ghi HISTORY
- [ ] Nếu có pass: replication check + effect size > 5% / Cramér's V > 0.1
- [ ] → Tổng hợp: exploitable bias nào? Single-ticket hay multi-ticket?

### Phase 2: Thiết kế thuật toán
- [ ] **Pre-register hypothesis** vào HISTORY (METHODOLOGY §3.1)
- [ ] **Algebra check** E[match | strategy] trước implement (METHODOLOGY §1.4)
- [ ] Chọn category phù hợp (A/B/C/D)
- [ ] Implement ≥ 10 strategies (2+ variants per strategy)
- [ ] Include baselines: Random + simple baseline mạnh (FreqWholeHot / Pattern)

### Phase 3: Backtest
- [ ] Walk-forward, no look-ahead
- [ ] Fixed seed (42), ≥ 3 runs (5 preferred)
- [ ] Min history 50 draws (matrix: 100)
- [ ] Record: Accuracy, ROI%, Sharpe, **Δ Random + p-value + Wilson CI + passes_bonferroni**
- [ ] Cross-product validation
- [ ] Decision rule (EVALUATION §6): Accept / Suggestive / Inconclusive / Reject

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

*Cập nhật lần cuối: 2026-04-20 — Chuẩn hóa: methodology/testing/evaluation tách sang 3 canonical. File này giữ vai trò template + strategy catalog + lessons.*

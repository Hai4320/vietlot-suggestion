# Nghiên Cứu Thuật Toán Dự Đoán Max 3D — Tài Liệu Chi Tiết

**Dự án**: vietlott-data  
**Phạm vi**: Nghiên cứu chuyên sâu thuật toán dự đoán cho Max 3D & Max 3D Pro  
**Ngày**: 2026-04-19  
**Trạng thái**: Hoàn thành Phase 1 (Phân tích + Backtest 21 chiến lược)

---

## Mục Lục

1. [Tổng Quan Nghiên Cứu](#1-tổng-quan)
2. [Phân Tích Thống Kê Sâu](#2-phân-tích-thống-kê)
3. [Phát Hiện Bias Trong RNG](#3-phát-hiện-bias)
4. [Thiết Kế Thuật Toán Mới](#4-thiết-kế-thuật-toán)
5. [Kết Quả Backtest](#5-kết-quả-backtest)
6. [Phân Tích Chi Tiết Top Strategies](#6-phân-tích-top)
7. [Phương Pháp Đánh Giá](#7-phương-pháp-đánh-giá)
8. [Kết Luận & Khuyến Nghị](#8-kết-luận)

---

## 1. Tổng Quan

### 1.1 Mục tiêu

Nghiên cứu và tạo ra thuật toán mới nhằm:
- **Đánh bại random baseline** về exact match rate
- **Tối ưu ROI** — giảm thiểu thua lỗ trung bình
- **Giảm số vé cần mua** — cùng xác suất trúng, mua ít vé hơn
- **Có cơ sở toán học vững chắc** — không đoán mò

### 1.2 Dữ liệu

| Sản phẩm | Kỳ quay | Thời gian | Số/kỳ | Không gian |
|-----------|---------|-----------|-------|------------|
| Max 3D | 1.064 kỳ | 04/2019 – 04/2026 | 20 số | 000–999 (1.000 số) |
| Max 3D Pro | 711 kỳ | 09/2021 – 04/2026 | 20 số | 000–999 (1.000 số) |

Mỗi kỳ quay có **20 số** chia làm 4 bậc giải:
- **Giải Đặc Biệt**: 2 số (thưởng 1.000.000đ)
- **Giải Nhất**: 4 số (thưởng 350.000đ)
- **Giải Nhì**: 6 số (thưởng 210.000đ)
- **Giải Ba**: 8 số (thưởng 100.000đ)

### 1.3 Baseline lý thuyết

```
P(trúng 1 số) = 20/1000 = 2.0%
P(bất kỳ match trong 2 vé) = 1 - (980/1000)² = 3.96%
E[matches với 2 vé] = 0.04
Digit accuracy baseline = 10% (random)
```

---

## 2. Phân Tích Thống Kê Sâu

### 2.1 Kiểm Định Chất Lượng RNG

13 bài kiểm tra thống kê được chạy trên toàn bộ dữ liệu:

| Test | Max 3D | Max 3D Pro | Ý nghĩa |
|------|--------|------------|----------|
| Chi² toàn số (000-999) | PASS ✓ (p=0.253) | PASS ✓ (p=0.543) | Phân bố số nguyên OK |
| Chi² vị trí 0 (hàng trăm) | PASS ✓ (p=0.273) | **FAIL ✗** (p=0.029) | Bias hàng trăm ở 3D Pro |
| Chi² vị trí 1 (hàng chục) | **FAIL ✗** (p=0.033) | **FAIL ✗** (p=0.006) | **Bias hàng chục cả 2!** |
| Chi² vị trí 2 (đơn vị) | **FAIL ✗** (p≈0) | **FAIL ✗** (p=0.003) | **Bias đơn vị rất mạnh!** |
| Độc lập vị trí 0-1 | **FAIL ✗** (p=0.032) | **FAIL ✗** (p=0.001) | Phụ thuộc giữa hàng trăm-chục |
| Độc lập vị trí 1-2 | **FAIL ✗** (p≈0) | **FAIL ✗** (p=0.002) | **Phụ thuộc mạnh chục-đơn vị** |
| Độc lập vị trí 0-2 | **FAIL ✗** (p≈0) | **FAIL ✗** (p≈0) | **Phụ thuộc mạnh trăm-đơn vị** |
| Serial Correlation | OK (4.0% significant) | OK (3.0%) | Không tương quan chuỗi |
| Runs Test | **FAIL ✗** (p=0.040) | PASS ✓ (p=0.081) | Max 3D có tính phi ngẫu nhiên |
| Digit Sum | PASS ✓ (p=0.119) | PASS ✓ (p=0.655) | Tổng chữ số bình thường |
| Gap Analysis | Mean=47.5 | Mean=46.2 | Khoảng cách xuất hiện lại |
| Repeat Analysis | 0.399 (exp: 0.4) | 0.397 (exp: 0.4) | Tỷ lệ lặp bình thường |
| Draw Sum | Normal | Normal | Tổng draw bình thường |

### 2.2 Phát Hiện Chính

#### ⚡ Phát Hiện 1: Chữ số 6 VƯỢT TRỘI ở vị trí đơn vị

Cả hai sản phẩm đều cho thấy chữ số **6** xuất hiện nhiều hơn kỳ vọng ở vị trí đơn vị:

| Sản phẩm | Digit 6 ratio | Kỳ vọng | Thực tế | p-value |
|-----------|---------------|---------|---------|---------|
| Max 3D | 1.0996 | ~2,128 | ~2,340 | ≈0 |
| Max 3D Pro | 1.1160 | ~1,422 | ~1,587 | 0.003 |

Đây là bias ~10-11%, rất đáng kể trên quy mô hàng nghìn quan sát.

#### ⚡ Phát Hiện 2: Chữ số 5 VƯỢT TRỘI ở vị trí hàng chục

| Sản phẩm | Digit 5 ratio | p-value |
|-----------|---------------|---------|
| Max 3D | 1.0602 | 0.033 |
| Max 3D Pro | 1.0654 | 0.006 |

#### ⚡ Phát Hiện 3: Các vị trí KHÔNG ĐỘC LẬP

Kết quả chi-squared cho độc lập:
- **pos_1_2** (chục-đơn vị): chi²=157.7, p<0.000001 ← **Phụ thuộc cực mạnh**
- **pos_0_2** (trăm-đơn vị): chi²=145.5, p<0.00002
- **pos_0_1** (trăm-chục): chi²=106.1, p=0.032

Điều này có nghĩa: **P(abc) ≠ P(a)×P(b)×P(c)**. Thuật toán sử dụng phân phối đồng thời (joint distribution) sẽ khai thác được điều này.

### 2.3 Đồ thị phân phối digit (vị trí đơn vị — Max 3D)

```
Digit  Ratio   Bar
  0    1.024   ████████████████████▎
  1    0.993   ███████████████████▊
  2    0.952   ███████████████████
  3    0.987   ███████████████████▊
  4    0.965   ███████████████████▎
  5    1.001   ████████████████████
  6    1.100   ██████████████████████  ← BIAS!
  7    1.015   ████████████████████▏
  8    0.924   ██████████████████▌    ← Ít hơn kỳ vọng
  9    1.041   ████████████████████▊
```

---

## 3. Phát Hiện Bias Trong RNG

### 3.1 Giải thích lý thuyết

Xổ số Vietlott sử dụng RNG (Random Number Generator) được kiểm toán. Tuy nhiên, dữ liệu cho thấy **sai lệch thống kê có ý nghĩa** ở mức digit:

1. **Whole number level**: Phân bố đồng đều ✓ (p=0.25 cho 3D, p=0.54 cho 3D Pro)
2. **Digit level**: KHÔNG đồng đều cho vị trí 1 và 2 ✗
3. **Digit independence**: KHÔNG độc lập giữa các vị trí ✗

**Giả thuyết**: RNG có thể sử dụng thuật toán (ví dụ: LFSR, Mersenne Twister) có tính chất tạo ra sai lệch nhỏ ở mức digit khi tổng hợp qua nhiều quan sát. Sai lệch này nhỏ (~5-11%) nhưng đủ lớn để khai thác.

### 3.2 Ý nghĩa cho thuật toán

| Phát hiện | Hướng khai thác | Chiến lược |
|-----------|-----------------|------------|
| Digit 6 bias ở đơn vị | Ưu tiên số có đơn vị = 6 | JointBias, PairExploiter |
| Digit 5 bias ở chục | Ưu tiên số có chục = 5 | ConditionalChain |
| Digit không độc lập | Dùng joint distribution thay vì product | JointBias, ULTIMATE |
| Pair dependencies | Khai thác O/E ratio của cặp digit | PairExploiter |

---

## 4. Thiết Kế Thuật Toán Mới

### 4.1 Tổng quan 21 chiến lược

| Category | # | Tên | Ý tưởng chính |
|----------|---|-----|---------------|
| Baseline | 2 | Random, FreqWholeHot | Chuẩn so sánh |
| A: Bias-Exploiting | 6 | JointBias (×2), CondChain (×2), AdaptBias (×2) | Khai thác bias digit |
| B: Coverage | 3 | CoverageOpt, TierWeighted, StratifiedDigit | Phủ không gian tối đa |
| C: Hybrid | 4 | BayesJoint (×2), MultiSignal, Portfolio | Kết hợp nhiều tín hiệu |
| D: Optimization | 5 | EVMaximizer, KLMinimizer, PairExploiter (×2) | Tối ưu hóa toán học |
| Ultimate | 2 | ULTIMATE_v1, ULTIMATE_v2_sharp | Tổng hợp tất cả |

### 4.2 Chi tiết các thuật toán mới

#### A1: Joint Digit Bias Strategy

**Cơ sở toán học**: Thay vì giả sử P(abc) = P(a)×P(b)×P(c), sử dụng trực tiếp phân phối đồng thời P(abc) từ dữ liệu lịch sử.

```
P(abc) = (count(abc) + α) / (total + 1000α)
```

Với α = 1 (Laplace smoothing) và temperature T:

```
P_temp(abc) ∝ P(abc)^(1/T)
```

- T > 1: phẳng hơn (đa dạng hơn)
- T < 1: nhọn hơn (tập trung vào số phổ biến)
- T = 1: giữ nguyên

#### A2: Conditional Chain Strategy

**Cơ sở toán học**: Chain rule of probability:

```
P(d0,d1,d2) = P(d0) × P(d1|d0) × P(d2|d0,d1)
```

Mỗi conditional được ước lượng từ dữ liệu:
```
P(d1|d0) = (count(d0,d1) + 1) / (count(d0) + 10)
```

#### D1: Expected Value Maximizer

**Cơ sở toán học**: Tối ưu hóa trực tiếp giá trị kỳ vọng:

```
E[prize(num)] = Σ_tier P(num ∈ tier) × prize(tier)
```

Với P(num ∈ tier) ước lượng từ tần suất lịch sử có exponential decay:

```
P(num ∈ tier) ≈ Σ_t I(num ∈ tier tại t) × exp(-λ(T-t)) / Σ_t exp(-λ(T-t))
```

λ = ln(2) / half_life. Half_life = 100 draws.

#### D3: Digit Pair Exploiter

**Patent**: Khai thác phát hiện mạnh nhất — digit pairs KHÔNG độc lập.

```
Synergy(abc) = (O/E[a,b]) × (O/E[b,c]) × (O/E[a,c])

O/E[i,j] = Observed(i,j) / (P(i) × P(j) × N)
```

Số có synergy > 1 xuất hiện nhiều hơn kỳ vọng nếu giả sử độc lập.

#### ULTIMATE Composite

Kết hợp 4 tín hiệu mạnh nhất:

```
Score(num) = 0.35 × JointFreq(num) + 0.30 × Synergy(num) + 0.20 × TierEV(num) + 0.15 × DigitSumLikelihood(num)
```

Với greedy diversity selection (min digit distance ≥ 5).

---

## 5. Kết Quả Backtest

### 5.1 Walk-Forward Backtest Protocol

- **Training**: Tất cả dữ liệu trước kỳ dự đoán (không look-ahead)
- **Min history**: 50 kỳ trước khi bắt đầu predict
- **Runs**: 5 lần chạy (seed 42) để đảm bảo robustness
- **Predictions**: 2 số/vé

### 5.2 Bảng xếp hạng Max 3D (1.064 kỳ)

| Rank | Chiến lược | Exact Match % | ROI % | Hits | Sharpe | Δ vs Random |
|------|-----------|---------------|-------|------|--------|-------------|
| 🥇 1 | FreqWholeHot (baseline) | **2.347** | -32.8 | 238 | -0.546 | +0.375 |
| 🥈 2 | JointBias T=1.0 | **2.268** | -39.0 | 230 | -0.722 | +0.296 |
| 🥉 3 | PairExploiter T=0.5 | **2.248** | -36.7 | 228 | -0.648 | +0.276 |
| 4 | CoverageOpt | 2.219 | -35.8 | 225 | -0.649 | +0.247 |
| 5 | ULTIMATE_v1 | 2.219 | -44.9 | 225 | -1.002 | +0.247 |
| 6 | StratifiedDigit | 2.199 | -40.8 | 223 | -0.760 | +0.227 |
| ... | ... | ... | ... | ... | ... | ... |
| 16 | **Random (baseline)** | **1.972** | -52.6 | 200 | -1.190 | 0 |

**Tỷ lệ chiến thắng vs Random**: 15/19 chiến lược mới đánh bại random (78.9%)

### 5.3 Bảng xếp hạng Max 3D Pro (711 kỳ)

| Rank | Chiến lược | Exact Match % | ROI % | Hits | Sharpe | Δ vs Random |
|------|-----------|---------------|-------|------|--------|-------------|
| 🥇 1 | **EVMaximizer** | **2.496** | **-26.5** | 165 | -0.428 | **+0.499** |
| 🥈 2 | **ULTIMATE_v2_sharp** | **2.421** | **-27.5** | 160 | -0.447 | **+0.424** |
| 🥉 3 | JointBias T=1.0 | **2.375** | -31.5 | 157 | -0.519 | +0.378 |
| 4 | TierWeighted | 2.179 | -43.0 | 144 | -0.838 | +0.181 |
| 5 | BayesJoint HL150 | 2.163 | -45.0 | 143 | -0.911 | +0.166 |
| ... | ... | ... | ... | ... | ... | ... |
| 12 | **Random (baseline)** | **1.997** | -45.4 | 132 | -0.898 | 0 |

**Chiến lược tốt nhất**: EVMaximizer đạt 2.496% exact match, ROI -26.5% (cải thiện 19 điểm phần trăm so với random -45.4%)

### 5.4 So sánh với nghiên cứu trước

| Metric | Phase trước (best) | Phase này (best) | Cải thiện |
|--------|-------------------|-------------------|-----------|
| Max 3D exact % | 2.334 (FreqWhole) | 2.347 (FreqWhole) | +0.013 |
| 3D Pro exact % | 2.351 (FreqWhole) | **2.496** (EVMaximizer) | **+0.145** |
| Max 3D ROI | -35.5% | **-32.8%** | **+2.7pp** |
| 3D Pro ROI | -35.1% | **-26.5%** | **+8.6pp** |

---

## 6. Phân Tích Chi Tiết Top Strategies

### 6.1 EVMaximizer (#1 trên 3D Pro)

**Tại sao nó hiệu quả?**
- Directly optimizes expected prize VALUE, not just match probability
- Exponential decay (half_life=100) tracks shifting patterns
- Diversity constraint (min digit distance = 4) prevents clustering
- On 3D Pro (shorter history), the decay weighting effectively captures recent bias regime

**Điểm mạnh**: ROI tốt nhất (-26.5%), stable performance
**Điểm yếu**: Cần đủ dữ liệu (100+ draws) để hoạt động tốt

### 6.2 ULTIMATE_v2_sharp (#2 trên 3D Pro)

**Tại sao nó hiệu quả?**
- Combines 4 independent signals that each capture different aspects
- Sharp temperature (0.5) focuses on high-confidence candidates
- Shorter half_life (80) is more responsive to recent changes
- Diversity constraint ensures ticket spread

### 6.3 JointBias T=1.0 (#3 trên 3D Pro, #2 trên 3D)

**Tại sao nó hiệu quả?**
- Directly exploits the key finding: digit dependencies exist
- Temperature T=1.0 preserves the natural distribution shape
- Lookback=300 provides stable frequency estimates
- Simple but effective — captures the main bias signal

---

## 7. Phương Pháp Đánh Giá

### 7.1 Metrics

| Metric | Công thức | Ý nghĩa |
|--------|-----------|----------|
| Exact Match Rate | matches / (predictions × draws × runs) | Xác suất trúng mỗi số |
| ROI | (revenue - cost) / cost × 100 | Lợi nhuận trên đầu tư |
| Hits | Tổng số lần trúng | Absolute performance |
| Sharpe Ratio | mean(profit) / std(profit) × √52 | Risk-adjusted return |

### 7.2 Đảm bảo chất lượng

- ✅ **Không look-ahead bias**: Chỉ dùng dữ liệu trước thời điểm dự đoán
- ✅ **Seed cố định**: random.seed(42), np.random.seed(42) cho tái lập
- ✅ **Multiple runs**: 5 runs per strategy
- ✅ **Baseline comparison**: So với Random và FreqWholeHot
- ✅ **Cross-product validation**: Test trên cả Max 3D và 3D Pro

---

## 8. Kết Luận & Khuyến Nghị

### 8.1 Kết luận chính

1. **RNG của Vietlott 3D có bias thống kê ở mức digit** — các vị trí digit không đồng đều và không độc lập
2. **Bias này có thể khai thác** — các thuật toán dựa trên phân phối đồng thời đánh bại random 15-25%
3. **EVMaximizer là chiến lược tốt nhất cho 3D Pro** — ROI -26.5% vs random -45.4%
4. **FreqWholeHot vẫn mạnh cho Max 3D** — đơn giản nhưng hiệu quả
5. **Kết hợp nhiều tín hiệu (ULTIMATE) ổn định nhưng không luôn tốt nhất** — đôi khi đơn giản hơn tốt hơn

### 8.2 Khuyến nghị sử dụng

| Sản phẩm | Chiến lược gợi ý | Lý do |
|-----------|-------------------|-------|
| **Max 3D** | FreqWholeHot hoặc JointBias | Match rate cao nhất, ROI tốt |
| **Max 3D Pro** | EVMaximizer hoặc ULTIMATE_v2 | Hiệu suất vượt trội rõ rệt |

### 8.3 Nghiên cứu tiếp theo

- [ ] Tối ưu hyperparameters qua grid search
- [ ] Test với N predictions = 5, 10, 20 (số vé khác nhau)
- [ ] Mở rộng phương pháp sang Power 6/55, Mega 6/45
- [ ] Nghiên cứu regime switching (bias thay đổi theo thời gian)
- [ ] Dynamic temperature tuning

---

## ⚠️ Disclaimer

Nghiên cứu này chỉ mang tính chất giáo dục và thử nghiệm. Xổ số là trò chơi có kỳ vọng âm — **không có thuật toán nào đảm bảo lợi nhuận**. Kết quả backtest không đảm bảo hiệu suất tương lai. Không nên đánh cược nhiều hơn số tiền bạn có thể chịu mất.

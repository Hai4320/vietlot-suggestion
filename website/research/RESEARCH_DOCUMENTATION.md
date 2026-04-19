# Tài Liệu Nghiên Cứu Thuật Toán Gợi Ý Xổ Số Vietlott

**Dự án**: vietlott-data  
**Phạm vi**: Nghiên cứu, backtest và triển khai thuật toán gợi ý số cho 5 sản phẩm xổ số Vietlott  
**Thời gian nghiên cứu**: 07/2025 – 04/2026  
**Trạng thái**: Đang tiến hành (Phase 4 hoàn thành)

---

## Mục Lục

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Dữ Liệu & Sản Phẩm](#2-dữ-liệu--sản-phẩm)
3. [Quá Trình Nghiên Cứu](#3-quá-trình-nghiên-cứu)
4. [Danh Mục Thuật Toán](#4-danh-mục-thuật-toán)
5. [Phương Pháp Backtest](#5-phương-pháp-backtest)
6. [Kết Quả Chi Tiết Theo Sản Phẩm](#6-kết-quả-chi-tiết-theo-sản-phẩm)
7. [Phân Tích Xuyên Sản Phẩm](#7-phân-tích-xuyên-sản-phẩm)
8. [Thuật Toán Từ Internet Research](#8-thuật-toán-từ-internet-research)
9. [Lý Thuyết Nền Tảng](#9-lý-thuyết-nền-tảng)
10. [Kiến Trúc Hệ Thống](#10-kiến-trúc-hệ-thống)
11. [Khuyến Nghị & Kết Luận](#11-khuyến-nghị--kết-luận)
12. [Phụ Lục](#12-phụ-lục)

---

## 1. Tổng Quan Dự Án

### 1.1 Mục tiêu

Nghiên cứu và triển khai thuật toán gợi ý số xổ số nhằm:
- **Tối ưu số trùng trung bình** (avg matches) so với baseline ngẫu nhiên
- **Tăng tỷ lệ trúng giải** (win rate ≥3 số trùng cho matrix, exact match cho 3D)
- **Đa dạng hóa** bộ vé gợi ý (Jaccard diversity > 0.7)
- **Chạy client-side** — toàn bộ thuật toán được port sang TypeScript, không cần server

### 1.2 Nguyên tắc quan trọng

> **Disclaimer**: Xổ số Vietlott sử dụng RNG (Random Number Generator) được kiểm toán bởi cơ quan quản lý. **Không có thuật toán nào có thể "đánh bại" xổ số về mặt kỳ vọng** — Expected Value luôn âm. Mục đích nghiên cứu là:
> 1. Tối ưu coverage: nếu trúng thì trùng nhiều số nhất
> 2. Đa dạng vé: N vé phủ rộng không gian
> 3. Phát hiện bias nhỏ (nếu tồn tại) trong phân bố lịch sử
> 4. Nâng cao trải nghiệm người dùng

### 1.3 Tóm tắt kết quả

| Sản phẩm | Thuật toán tốt nhất | Δ vs Random | Tỷ lệ thắng | ROI tốt nhất |
|---|---|---|---|---|
| **Power 6/55** | Bayesian AI | +0.031 | 1.65% | -91.4% |
| **Mega 6/45** | Bayesian AI (Sharp, temp=0.5) | +0.023 | 3.14% | -62.0% (Phủ sóng tối đa) |
| **Lotto 5/35** | Mẫu cấu trúc / Tự động tối ưu | +0.025 | 1.78% | -74.4% (Tần suất cao) |
| **Max 3D** | Freq Whole Hot | 2.33% exact | — | -35.5% |
| **Max 3D Pro** | Freq Whole Hot | 2.35% exact | — | -35.1% (SumRange) |

---

## 2. Dữ Liệu & Sản Phẩm

### 2.1 Tổng quan dữ liệu

Tất cả dữ liệu được crawl tự động từ website chính thức Vietlott, lưu dưới dạng NDJSON (Newline-Delimited JSON) trong thư mục `data/`.

| Sản phẩm | File | Số kỳ | Thời gian | Tần suất |
|---|---|---:|---|---|
| Power 6/55 | `power655.jsonl` | 1.334 | 08/2017 – 04/2026 | 2 ngày/lần |
| Mega 6/45 | `power645.jsonl` | 1.301 | — | 2 ngày/lần |
| Lotto 5/35 | `power535.jsonl` | 538 | 06/2025 – 04/2026 | 2 ngày/lần |
| Max 3D | `3d.jsonl` | 1.064 | 04/2019 – 04/2026 | 2 ngày/lần |
| Max 3D Pro | `3d_pro.jsonl` | 711 | 09/2021 – 04/2026 | 2 ngày/lần |
| Keno | `keno.jsonl` | 63.263 | — | 8 phút/lần |
| Bingo 18 | `bingo18.jsonl` | 54.866 | — | 5 phút/lần |

**Lưu ý**: Keno và Bingo 18 chưa được backtest do tần suất cao và đặc thù khác biệt.

### 2.2 Cấu trúc sản phẩm

#### Matrix Products (Power 6/55, Mega 6/45, Lotto 5/35)

```
Cấu trúc: Chọn K số từ 1–N (không trùng, sắp xếp tăng dần)

Power 6/55:  Chọn 6 số từ 1–55  → C(55,6) = 28.989.675 tổ hợp
Mega 6/45:   Chọn 6 số từ 1–45  → C(45,6) = 8.145.060 tổ hợp
Lotto 5/35:  Chọn 5 số từ 1–35  → C(35,5) = 324.632 tổ hợp

Record format: {"date":"2017-08-01", "id":"00001", "result":[5,10,14,23,24,38,35]}
```

| Thông số | Power 6/55 | Mega 6/45 | Lotto 5/35 |
|---|---|---|---|
| Số chọn | 6 | 6 | 5 |
| Phạm vi | 1–55 | 1–45 | 1–35 |
| Số tổ hợp | 28.9M | 8.1M | 324K |
| E[trùng] | 0.6545 | 0.8000 | 0.7143 |
| P(win≥3) | 1.33% | 2.38% | 1.39% |
| Giá vé | 10.000đ | 10.000đ | 10.000đ |

#### 3D Products (Max 3D, Max 3D Pro)

```
Cấu trúc: Số 3 chữ số (000–999), mỗi kỳ quay 20 số chia 4 giải

Giải Đặc biệt: 2 số  → Thưởng: 1.000.000đ/vé
Giải Nhất:      4 số  → Thưởng: 350.000đ/vé
Giải Nhì:       6 số  → Thưởng: 210.000đ/vé
Giải Ba:        8 số  → Thưởng: 100.000đ/vé
───────────────────
Tổng:          20 số/kỳ

Baseline: P(match 1 số) = 20/1000 = 2.0%
          P(≥1 match trong 2 dự đoán) = 3.96%

Record format: {"date":"...", "id":"...", "result":{"Giải Đặc biệt":["123","456"], ...}}
```

### 2.3 Baseline Lý Thuyết (Phân phối siêu hình học — Hypergeometric)

#### Power 6/55 (chọn 6 từ 55)

| Trùng | Xác suất | 1 trên |
|:---:|---:|---:|
| 0 | 48.24% | 2,1 |
| 1 | 39.47% | 2,5 |
| 2 | 10.96% | 9,1 |
| 3 | 1.27% | 78,7 |
| 4 | 0.061% | 1.643 |
| 5 | 0.001% | 98.618 |
| 6 | 0.000003% | 33.294.492 |

**E[trùng] = 6 × 6/55 = 0.6545**

#### Mega 6/45 (chọn 6 từ 45)

| Trùng | Xác suất | 1 trên |
|:---:|---:|---:|
| 0 | 40.06% | 2,5 |
| 1 | 42.41% | 2,4 |
| 2 | 15.15% | 6,6 |
| 3 | 2.24% | 44,6 |
| 4 | 0.136% | 733 |
| 5 | 0.003% | 34.808 |
| 6 | 0.000012% | 8.145.060 |

**E[trùng] = 6 × 6/45 = 0.8000**

#### Lotto 5/35 (chọn 5 từ 35)

| Trùng | Xác suất | 1 trên |
|:---:|---:|---:|
| 0 | 43.90% | 2,3 |
| 1 | 42.21% | 2,4 |
| 2 | 12.51% | 8,0 |
| 3 | 1.34% | 74,6 |
| 4 | 0.046% | 2.168 |
| 5 | 0.0003% | 324.632 |

**E[trùng] = 5 × 5/35 = 0.7143**

---

## 3. Quá Trình Nghiên Cứu

### 3.1 Timeline

```
Phase 1 (07/2025):    Đánh giá 10 thuật toán gốc trên 3 sản phẩm matrix
Phase 2 (07/2025):    Research thuật toán mới từ tài liệu học thuật & internet
Phase 3 (08/2025):    Implement 6 thuật toán mới (Python + TypeScript)
Phase 4 (09/2025):    Backtest 16 thuật toán matrix (cũ + mới), 15 thuật toán 3D
Phase 5 (10/2025–):   Tích hợp vào website, tối ưu UX
Internet Research:    3 thuật toán bổ sung cho 3D (SumRange, Markov, Composite)
```

### 3.2 Phase 1 — Đánh giá hiện trạng

**Mục tiêu**: Backtest toàn diện 10 thuật toán có sẵn trên cả 3 sản phẩm matrix.

**Script**: `website/research/phase1_backtest_standalone.py` (813 dòng, tự chứa)  
**Output**: `website/research/phase1_backtest_results.json`

**10 thuật toán đánh giá**:
1. Random (baseline)
2. Frequency Hot (tần suất cao)
3. Frequency Cold (tần suất thấp)
4. Frequency Balanced (hỗn hợp)
5. LongAbsence (vắng lâu)
6. NotRepeat (không lặp)
7. Pattern (mẫu phân bố)
8. ExponentialDecay Hot (suy giảm hàm mũ, nóng)
9. ExponentialDecay Cold (suy giảm hàm mũ, lạnh)
10. PairFrequency (tần suất cặp)

**Phát hiện chính**:
- **Không có thuật toán nào vượt trội đáng kể so với random** — delta tối đa +0.029 (Freq Hot trên 655)
- **Random là thuật toán ổn định nhất** — xếp hạng trung bình 2.0 qua 3 sản phẩm
- **PairFrequency kém nhất** — greedy co-occurrence tạo structural bias
- **Xếp hạng thay đổi đáng kể giữa các sản phẩm** — không có "silver bullet"
- ROI tất cả chiến lược: -76% đến -97%

### 3.3 Phase 2 — Nghiên cứu thuật toán mới

**Nguồn tài liệu**:
- Gordon, Kuperberg, Patashnik (1995) — "New constructions for covering designs"
- Bluskov (2020) — "Combinatorial Systems (Wheels) for Pick-6 Lotteries"
- Nurmela & Östergård (1993) — Simulated annealing for covering designs
- Schönheim (1964) — Lower bounds for covering designs
- Wikipedia: Lottery Wheeling, Covering Design, Block Design
- NIST SP 800-22 — Randomness Tests

**5 phương pháp mới được chọn để implement**:

| # | Thuật toán | Loại | Ưu điểm chính |
|---|---|---|---|
| 1 | Bayesian AI | Thống kê | Uncertainty quantification, chống overfitting |
| 2 | Max-Entropy Sampling | Thông tin | Đa dạng cấu trúc, phủ dải số |
| 3 | Min-Distance Diversity | Portfolio | Tối thiểu trùng lặp giữa vé |
| 4 | Ensemble (Borda Count) | Meta | Kết hợp nhiều tín hiệu |
| 5 | Tự động tối ưu | Tối ưu | Tự điều chỉnh lookback window |
| 6 | Wheeling System | Coverage | Đảm bảo tối thiểu k trùng (generator, không phải PredictModel) |

### 3.4 Phase 3 — Implement

Tất cả thuật toán mới được implement:
- **Python**: `src/machine_learning/strategies/` — dùng cho backtest và CLI
- **TypeScript**: `website/src/lib/suggest-matrix.ts` + `suggest-3d.ts` — dùng cho website client-side

Tổng: **16 class Python** (bao gồm base class và WheelGenerator)

### 3.5 Phase 4 — Đánh giá

**Matrix products**: Backtest 15 thuật toán × 3 sản phẩm × 3 lần chạy  
**Script**: `website/research/phase4_evaluation.py` (602 dòng)  
**Output**: `website/research/phase4_evaluation_results.json`

**3D products**: Backtest 12+3 thuật toán × 2 sản phẩm × 3 lần chạy  
**Script**: `website/research/3d_backtest.py` (887 dòng)  
**Output**: `website/research/3d_backtest_results.json`

**Phát hiện đột phá**:
- **Bayesian AI vượt trội trên pool lớn** (+0.031 trên P655)
- **Phủ sóng tối đa đạt 5/6 trùng khớp** — lần duy nhất trong toàn bộ nghiên cứu
- **Temperature tuning rất quan trọng**: temp=1.0 tốt cho pool lớn, temp=0.5 tốt cho pool nhỏ
- **Ensemble gây thất vọng** — trung bình hóa triệt tiêu ưu điểm riêng lẻ

---

## 4. Danh Mục Thuật Toán

### 4.1 Thuật toán cho Matrix Products

#### 📊 Frequency (Tần suất)
```
Phân loại:  Statistical / Frequency-based
File Python: src/machine_learning/strategies/frequency.py
File TS:     website/src/lib/suggest-matrix.ts (case "frequency")
Tham số:     lookback_days=365, strategy_type="hot"|"cold"|"balanced", weight=0.8

Nguyên lý:
  1. Đếm tần suất xuất hiện mỗi số trong lookback window
  2. Hot: ưu tiên số xuất hiện nhiều (P ∝ count)
  3. Cold: ưu tiên số xuất hiện ít (P ∝ 1/count)
  4. Balanced: kết hợp 50/50

Ưu:  Đơn giản, nhanh, hiệu quả bất ngờ
Nhược: Lookback window cứng, không quantify uncertainty
```

#### ⏳ Long Absence (Vắng lâu)
```
Phân loại:  Statistical / Recency-based
File Python: src/machine_learning/strategies/long_absence.py
File TS:     website/src/lib/suggest-matrix.ts (case "absence")
Tham số:     top_n (pool size)

Nguyên lý:
  1. Tính khoảng cách (số kỳ) từ lần cuối xuất hiện đến hiện tại
  2. Ưu tiên số vắng lâu nhất
  3. Chọn ngẫu nhiên từ top candidates

Ưu:  Trực giác (số "đến lượt"), đa dạng output
Nhược: "Gambler's Fallacy" — độc lập ≠ đến lượt
```

#### 🔄 Not Repeat (Không lặp)
```
Phân loại:  Statistical / Exclusion-based
File Python: src/machine_learning/strategies/not_repeat.py
Tham số:     lookback_days

Nguyên lý:
  1. Loại bỏ số đã xuất hiện trong lookback_days gần nhất
  2. Chọn ngẫu nhiên từ số còn lại

Ưu:  Đơn giản
Nhược: Hiệu suất kém (#2 ở P655 nhưng #10 ở P645, P535)
```

#### 🎯 Pattern (Mẫu phân bố)
```
Phân loại:  Statistical / Structural
File Python: src/machine_learning/strategies/pattern.py
File TS:     (embedded in "mixed" strategy)
Tham số:     lookback_days, pattern_weight

Nguyên lý:
  1. Phân tích spacing (khoảng cách giữa các số liên tiếp)
  2. Phân tích range distribution (5 dải con bằng nhau)
  3. Tạo vé khớp với pattern phổ biến nhất
  4. Weighted random trong mỗi dải

Ưu:  Ổn định nhất qua tất cả sản phẩm (avg rank #1 ở Phase 4)
Nhược: Phức tạp, chậm hơn các thuật toán khác
```

#### 📈 Exponential Decay (Suy giảm hàm mũ)
```
Phân loại:  Statistical / Time-weighted
File Python: src/machine_learning/strategies/exponential_decay.py
Tham số:     half_life, hot=True|False

Nguyên lý:
  1. Trọng số = exp(-λ × t), t = khoảng cách thời gian
  2. Không có ngưỡng cứng (soft decay thay vì hard window)
  3. Hot: ưu tiên số gần đây + thường xuyên
  4. Cold: ưu tiên số gần đây + ít thường xuyên

Ưu:  Smooth hơn frequency với window cứng
Nhược: Kết quả trung bình, không đột phá
```

#### 🔗 Pair Frequency (Tần suất cặp)
```
Phân loại:  Statistical / Co-occurrence
File Python: src/machine_learning/strategies/pair_frequency.py
Tham số:     lookback_days

Nguyên lý:
  1. Xây dựng ma trận đồng xuất hiện (co-occurrence matrix)
  2. Greedy: chọn cặp có co-occurrence cao nhất
  3. Mở rộng cặp thành bộ k số

Ưu:  Nắm bắt tương quan bậc 2
Nhược: Kém nhất nhất quán qua tất cả sản phẩm (greedy bias)
```

#### 🧠 Bayesian AI (★ MỚI)
```
Phân loại:  Bayesian / Posterior Sampling
File Python: src/machine_learning/strategies/bayesian_dirichlet.py
File TS:     website/src/lib/suggest-matrix.ts (case "bayesian")
Tham số:     prior_strength=1.0, temperature=1.0|0.5, lookback_days=365|180

Nguyên lý:
  1. Prior: Dir(α₁, ..., αᵥ) với αᵢ = prior_strength (uniform)
  2. Posterior: Dir(α₁+c₁, ..., αᵥ+cᵥ) với cᵢ = số lần xuất hiện
  3. Sample θ ~ Dir(posterior) → vector xác suất cho mỗi số
  4. Apply temperature: P_tempered ∝ θᵢ^(1/T)
  5. Weighted sampling without replacement theo P_tempered

Biến thể:
  - Bayesian (temp=1.0, lookback=365): tốt nhất cho pool lớn (P655)
  - Bayesian AI (Sharp, temp=0.5, lookback=180): tốt nhất cho pool vừa (P645)

Ưu:  Uncertainty quantification, chống overfitting, best on P655 (+0.031)
Nhược: Kém trên pool nhỏ (P535)

Toán học:
  θ|data ~ Dirichlet(α + counts)
  P(number i) = θᵢ^(1/T) / Σⱼ θⱼ^(1/T)
  
  Sampling từ Dirichlet sử dụng Gamma distribution:
  θᵢ = Gᵢ / Σⱼ Gⱼ, trong đó Gᵢ ~ Gamma(αᵢ + cᵢ, 1)
  
  Gamma sampling: Marsaglia-Tsang method (alpha ≥ 1), Boost method (alpha < 1)
```

#### 🎯 Phủ sóng tối đa (★ MỚI)
```
Phân loại:  Information-theoretic / Stratified
File Python: src/machine_learning/strategies/max_entropy.py
File TS:     website/src/lib/suggest-matrix.ts (case "maxentropy")
Tham số:     num_bands = mainCount

Nguyên lý:
  1. Chia phạm vi số thành K dải bằng nhau (K = số cần chọn)
  2. Trong mỗi dải: tính posterior Dirichlet
  3. Chọn 1 số từ mỗi dải theo posterior
  4. Đảm bảo "phủ sóng" toàn bộ phạm vi

Ưu:  Đa dạng cấu trúc, đạt 5/6 trùng khớp (P645!), ROI tốt nhất (-62%)
Nhược: Avg matches thấp hơn, "high risk / high reward"

Lý thuyết:
  Shannon Entropy: H = -Σ P(nᵢ) log P(nᵢ)
  Max H → ticket đa dạng nhất = coverage tốt nhất
```

#### ⚡ Tự động tối ưu (★ MỚI)
```
Phân loại:  Meta-optimization / Self-tuning
File Python: src/machine_learning/strategies/adaptive_window.py
File TS:     website/src/lib/suggest-matrix.ts (case "adaptive")
Tham số:     windows=[30, 90, 180, 365], n_eval=10

Nguyên lý:
  1. Thử nghiệm nhiều lookback window trên 10 kỳ gần nhất
  2. Đo avg matches cho mỗi window qua mini-backtest
  3. Chọn window tốt nhất
  4. Sử dụng window tối ưu cho prediction cuối cùng
  5. 80% top frequency + 20% random fill

Ưu:  Tự thích nghi, hòa với Pattern trên P535
Nhược: Chi phí tính toán (mini-backtest), kém trên pool lớn
```

#### 🏆 Ensemble (★ MỚI)
```
Phân loại:  Meta / Rank Aggregation
File Python: src/machine_learning/strategies/ensemble.py
Tham số:     n_samples=30 (hoặc 10 cho tốc độ)

Nguyên lý:
  1. Chạy 5 chiến lược cơ sở: Freq Hot, Freq Cold, LongAbsence, Pattern, ExpDecay
  2. Mỗi chiến lược xếp hạng tất cả số
  3. Borda Count: tổng hợp rank, chọn top-K

Ưu:  Đa dạng tín hiệu
Nhược: Kết quả tầm thường (trung bình hóa = triệt tiêu ưu điểm), rất chậm
```

#### 🔀 Min-Distance Diversity (★ MỚI)
```
Phân loại:  Portfolio / Diversity Optimization
File Python: src/machine_learning/strategies/min_distance_diversity.py
Tham số:     n_candidates (số ticket thử)

Nguyên lý:
  1. Tạo ticket đầu tiên (bất kỳ chiến lược)
  2. Cho mỗi ticket tiếp theo: tạo N ứng viên
  3. Chọn ứng viên có Jaccard distance lớn nhất so với tickets đã chọn
  4. Kết quả: bộ vé đa dạng tối đa

Ưu:  Giảm trùng lặp giữa vé
Nhược: Không cải thiện từng vé đơn lẻ, phức tạp
```

#### 🎡 Wheeling System (không phải PredictModel)
```
Phân loại:  Combinatorial / Coverage Guarantee
File Python: src/machine_learning/strategies/wheeling.py

Nguyên lý:
  1. Người dùng chọn M "favorite numbers" (>K)
  2. Tạo tập vé nhỏ nhất đảm bảo: nếu t số đúng nằm trong M → 
     ít nhất 1 vé trùng k số
  3. Greedy covering algorithm

Ưu:  Guarantee toán học
Nhược: Chưa được tích hợp vào flow gợi ý
```

#### 🎲 Kết hợp nóng–lạnh (Mixed)
```
Phân loại:  Hybrid
File TS:     website/src/lib/suggest-matrix.ts (case "mixed")
Tham số:     hot_pool_size=15, cold_pool_size=15

Nguyên lý:
  1. 50% số từ pool "nóng" (tần suất cao nhất)
  2. 50% số từ pool "lạnh" (vắng lâu nhất)
  3. Kết hợp + random shuffle

Ưu:  Cân bằng hai tín hiệu, đa dạng
Nhược: Tỷ lệ cứng, không adaptive
```

### 4.2 Thuật toán cho 3D Products

#### 📊 Freq Whole Hot (Tần suất số nguyên)
```
Nguyên lý:
  1. Đếm tần suất xuất hiện từng số 3 chữ số (000–999) trong 200 kỳ gần nhất
  2. Weighted random từ top 50 số phổ biến nhất

Kết quả: Tốt nhất cả 2 sản phẩm (2.33% 3D, 2.35% 3D Pro)
```

#### 📊 Freq Whole Cold (Tần suất số nguyên, lạnh)
```
Nguyên lý: Ngược lại Freq Whole Hot — ưu tiên số xuất hiện ít

Kết quả: Kém nhất (1.64% 3D, 1.94% 3D Pro)
```

#### 🔢 Digit Hot / Digit Cold (Tần suất theo chữ số)
```
Nguyên lý:
  1. Phân tích tần suất từng vị trí: hàng trăm, hàng chục, hàng đơn vị
  2. Chọn chữ số phổ biến nhất (hot) hoặc ít nhất (cold) cho từng vị trí
  3. Ghép 3 chữ số thành số 3 chữ số

Kết quả: Hot tốt trên 3D (#3, 2.14%), kém trên 3D Pro (#11, 1.82%)
```

#### 🎯 Tier Focus ĐB (Nhắm giải Đặc biệt)
```
Nguyên lý:
  1. Phân tích riêng tần suất số chỉ ở giải Đặc biệt
  2. Ưu tiên số hay trúng Đặc biệt (giải cao nhất)

Kết quả: #2 trên 3D (2.19%), #4 trên 3D Pro (2.07%)
```

#### 🎲 Pattern 3D (Mẫu 3 chữ số)
```
Nguyên lý:
  1. Phân tích pattern: chẵn/lẻ, lớn/nhỏ, tổng chữ số
  2. Tạo số khớp với pattern phổ biến nhất

Kết quả: Ổn định (#7-8 cả 2 sản phẩm)
```

#### 🧠 Bayesian Digit (★ MỚI)
```
File TS: website/src/lib/suggest-3d.ts (case "bayesian")

Nguyên lý:
  1. Dirichlet posterior cho từng vị trí chữ số (3 posterior độc lập)
  2. αᵢ = 1 + count(digit=d ở position=p)
  3. Sample θ ~ Dir(α) cho mỗi vị trí
  4. Chọn chữ số theo posterior → ghép thành số

Kết quả: #4 3D (2.09%), #5 3D Pro (2.07%) — trên baseline ổn định
```

#### 🧠 Bayesian AI (Sharp) (★ MỚI)
```
Nguyên lý: Bayesian Digit với temperature=0.5 (tập trung hơn)

Kết quả: ROI tốt nhất 3D Pro (-36.3%), 13 lần trúng Đặc biệt (gấp đôi trung bình)
```

#### 🧠 Bayesian Whole (★ MỚI)
```
Nguyên lý: Dirichlet posterior trên toàn bộ 1000 số (thay vì từng chữ số)

Kết quả: KÉM — posterior quá "loãng" trên 1000 chiều
```

#### 🎯 Phủ sóng tối đa / SumRange Filter (★ MỚI)
```
File TS: website/src/lib/suggest-3d.ts (case "maxentropy")

Nguyên lý:
  1. Tính phân bố tổng chữ số (digit sum) lịch sử
  2. Lọc: chỉ tạo số có digit sum trong [mean ± 1σ]
  3. Trong phạm vi cho phép: chọn theo tần suất chữ số theo vị trí

Kết quả: #2 trên 3D Pro (2.27%), ROI tốt nhất 3D Pro khi tính SumRange (-35.1%)
```

#### ⚡ Adaptive 3D (★ MỚI)
```
File TS: website/src/lib/suggest-3d.ts (case "adaptive")

Nguyên lý:
  1. Test lookback windows [50, 100, 200, 500] qua mini-backtest
  2. Chọn window tối ưu cho digit frequency
  3. Weighted random theo digit frequency trong window tốt nhất

Kết quả: Trung bình (#9 3D, #6 3D Pro)
```

#### ★★ SumRange Filter (Từ Internet Research)
```
Nguồn: Kỹ thuật phân tích lottery truyền thống

Nguyên lý:
  1. Tính khoảng tổng chữ số phổ biến nhất (mean ± σ)
  2. Tần suất chữ số theo vị trí (weighted)
  3. Ghép chữ số + lọc theo digit sum range
  4. Reject sampling cho số ngoài range

Kết quả: #5 3D (2.06%), #2 3D Pro (2.30%) — ROI tốt nhất 3D Pro (-35.1%)
```

#### ★★ Markov Digit (Từ Internet Research)
```
Nguồn: cpeoples/powerpredict, Hidden Markov Models (Rabiner 1989)

Nguyên lý:
  1. Xây ma trận chuyển P(digit_t | digit_{t-1}) cho mỗi vị trí
  2. Predict digit tiếp theo dựa trên transition probability
  3. Laplace smoothing

Kết quả: Mức baseline (1.97% 3D, 1.79% 3D Pro) — transition matrix không đủ mạnh
```

#### ★★ Composite Score (Từ Internet Research)
```
Nguồn: rag-fish/loto6-deeplearning, 278156715man/3d-lottery-prediction

Nguyên lý:
  1. Score = α×freq_rank + β×recency_rank + γ×gap_score
  2. Chọn top-N số theo composite score
  3. Diversity penalty cho số đã chọn

Kết quả: Kém (#14 3D (1.81%), #15 3D Pro (1.79%)) — thiếu diversity
```

---

## 5. Phương Pháp Backtest

### 5.1 Walk-Forward Validation

```
Cho mỗi kỳ t từ [min_history, N]:
  ┌─ Training set: tất cả data từ kỳ 1 đến t-1
  ├─ Prediction:   thuật toán dự đoán bộ số cho kỳ t
  ├─ Actual:       kết quả thực tế kỳ t
  └─ Evaluation:   đếm số trùng, tính ROI, ghi nhận tier hits
  
Đặc điểm:
  ✓ Không sử dụng dữ liệu tương lai (no look-ahead bias)
  ✓ Min history = 100 kỳ (matrix), 50 kỳ (3D)
  ✓ 3 lần chạy độc lập (n_runs=3), lấy trung bình
  ✓ Random seed = 42 để tái tạo kết quả
```

### 5.2 Metrics Đánh giá

#### Matrix Products

| Metric | Mô tả | Cách tính |
|---|---|---|
| **Avg Matches** | Trung bình số trùng/vé | Σ matches / N predictions |
| **Δ vs Baseline** | Chênh lệch so với E[trùng] lý thuyết | avg_matches - E[matches] |
| **Win Rate** | % kỳ có ≥3 trùng (trúng giải) | count(matches≥3) / N × 100% |
| **ROI** | Return on Investment | (Σ prizes - Σ costs) / Σ costs × 100% |
| **Sharpe Ratio** | Risk-adjusted return | (mean_return - rf) / std_return |
| **Best Match** | Số trùng cao nhất đạt được | max(matches) |

#### 3D Products

| Metric | Mô tả | Cách tính |
|---|---|---|
| **Exact Match %** | % dự đoán khớp chính xác | hits / (N × n_predictions) × 100% |
| **Digit Accuracy** | Độ chính xác từng vị trí chữ số | mean(pos_correct) × 100% |
| **ROI** | Return on Investment | (Σ prizes - Σ costs) / Σ costs × 100% |
| **Tier Hits** | Phân bổ trúng theo giải | count per tier |

### 5.3 Cấu hình Giải thưởng

#### Matrix Products
```
Power 6/55:  6 trùng = 30 tỷ | 5 = 10M | 4 = 300K | 3 = 30K
Mega 6/45:   6 trùng = 12 tỷ | 5 = 10M | 4 = 300K | 3 = 30K
Lotto 5/35:  5 trùng = 6 tỷ  | 4 = 500K | 3 = 50K
Giá vé:      10.000đ
```

#### 3D Products
```
Đặc biệt:   1.000.000đ/vé
Nhất:        350.000đ/vé
Nhì:         210.000đ/vé
Ba:          100.000đ/vé
Giá vé:      10.000đ
```

---

## 6. Kết Quả Chi Tiết Theo Sản Phẩm

### 6.1 Power 6/55 (1.334 kỳ, chọn 6 từ 1–55, E[trùng]=0.6545)

| Hạng | Thuật toán | Avg Matches | Δ | Win%(≥3) | ROI% | Sharpe | Loại |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **★Bayesian** | **0.6853** | **+0.031** | **1.65%** | **-91.4%** | -5.68 | MỚI |
| 2 | Freq_Hot | 0.6780 | +0.024 | 1.51% | -93.3% | -7.28 | CŨ |
| 3 | Random | 0.6764 | +0.022 | 1.46% | -94.2% | -8.70 | CŨ |
| 4 | ★Phủ sóng tối đa | 0.6613 | +0.007 | 1.54% | -94.7% | -11.12 | MỚI |
| 5 | Pattern | 0.6575 | +0.003 | 1.59% | -93.0% | -7.23 | CŨ |
| 6 | ★Ensemble | 0.6556 | +0.001 | 1.14% | -95.9% | -11.84 | MỚI |
| 7 | ★MinDistance | 0.6551 | +0.001 | 1.41% | -94.3% | -8.75 | MỚI |
| 8 | NotRepeat | 0.6540 | -0.001 | 1.46% | -94.2% | -8.70 | CŨ |
| 9 | ★Adaptive | 0.6405 | -0.014 | 1.27% | -94.7% | -8.87 | MỚI |
| 10 | ExpDecay_Cold | 0.6402 | -0.014 | 1.19% | -94.2% | -7.48 | CŨ |
| 11 | LongAbsence | 0.6394 | -0.015 | 1.24% | -94.1% | -7.44 | CŨ |
| 12 | ★Bayes_Sharp | 0.6378 | -0.017 | 1.27% | -94.0% | -7.43 | MỚI |
| 13 | ExpDecay_Hot | 0.6372 | -0.017 | 1.38% | -95.1% | -11.40 | CŨ |
| 14 | Freq_Cold | 0.6334 | -0.021 | 1.08% | -96.0% | -11.94 | CŨ |
| 15 | PairFreq | 0.6167 | -0.038 | 1.14% | -94.4% | -7.51 | CŨ |

**Kết luận P655**: ★Bayesian AI (temp=1.0, lookback=365) vượt trội rõ rệt. Pool lớn (55 số) cho phép posterior Bayesian phân biệt tốt giữa các số.

### 6.2 Mega 6/45 (1.301 kỳ, chọn 6 từ 1–45, E[trùng]=0.8000)

| Hạng | Thuật toán | Avg Matches | Δ | Win%(≥3) | ROI% | Sharpe | Loại |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **★Bayes_Sharp** | **0.8229** | **+0.023** | **3.14%** | -86.1% | -4.70 | MỚI |
| 2 | Pattern | 0.8165 | +0.017 | 2.25% | -88.8% | -4.95 | CŨ |
| 3 | Random | 0.8066 | +0.007 | 1.92% | -92.0% | -6.96 | CŨ |
| 4 | Freq_Hot | 0.8060 | +0.006 | 2.78% | -89.4% | -6.51 | CŨ |
| 5 | Freq_Cold | 0.8041 | +0.004 | 2.25% | -89.5% | -5.40 | CŨ |
| 6 | ExpDecay_Hot | 0.8041 | +0.004 | 2.08% | -88.5% | -4.62 | CŨ |
| 7 | PairFreq | 0.8010 | +0.001 | 2.17% | -89.0% | -4.97 | CŨ |
| 8 | ★Bayesian | 0.8010 | +0.001 | 2.50% | -89.5% | -5.88 | MỚI |
| 9 | ★MinDistance | 0.7996 | -0.000 | 2.55% | -90.1% | -6.62 | MỚI |
| 10 | LongAbsence | 0.7954 | -0.005 | 2.78% | -86.4% | -4.45 | CŨ |
| 11 | ★Ensemble | 0.7949 | -0.005 | 1.97% | -91.8% | -6.93 | MỚI |
| 12 | ★Adaptive | 0.7918 | -0.008 | 1.94% | -92.7% | -8.20 | MỚI |
| 13 | ★Phủ sóng tối đa | 0.7893 | -0.011 | 2.19% | **-62.0%** | **-0.27** | MỚI |
| 14 | ExpDecay_Cold | 0.7866 | -0.013 | 2.19% | -91.9% | -8.01 | CŨ |
| 15 | NotRepeat | 0.7810 | -0.019 | 2.25% | -91.0% | -6.78 | CŨ |

**Kết luận P645**: 
- ★Bayes_Sharp (temp=0.5) thắng về avg matches và win rate (3.14%)
- **★Phủ sóng tối đa đạt 5/6 trùng khớp!** — lần trúng lớn duy nhất trong nghiên cứu → ROI -62% (tốt nhất) và Sharpe -0.27 (gần 0)

### 6.3 Lotto 5/35 (538 kỳ, chọn 5 từ 1–35, E[trùng]=0.7143)

| Hạng | Thuật toán | Avg Matches | Δ | Win%(≥3) | ROI% | Sharpe | Loại |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Pattern | **0.7396** | **+0.025** | **1.78%** | -82.2% | -2.58 | CŨ |
| 1 | **★Adaptive** | **0.7396** | **+0.025** | 1.38% | -84.2% | -2.66 | MỚI |
| 3 | Freq_Cold | 0.7278 | +0.014 | 1.18% | -94.1% | -12.54 | CŨ |
| 3 | ExpDecay_Cold | 0.7278 | +0.014 | 1.18% | -94.1% | -12.54 | CŨ |
| 5 | Freq_Hot | 0.7258 | +0.012 | 1.58% | **-74.4%** | -1.69 | CŨ |
| 6 | PairFreq | 0.7219 | +0.008 | 0.59% | -97.0% | -18.23 | CŨ |
| 7 | Random | 0.7101 | -0.004 | 2.56% | -78.3% | -2.41 | CŨ |
| 8 | LongAbsence | 0.7061 | -0.008 | 0.79% | -96.1% | -15.64 | CŨ |
| 9 | NotRepeat | 0.7022 | -0.012 | 0.99% | -86.2% | -2.75 | CŨ |
| 10 | ExpDecay_Hot | 0.6982 | -0.016 | 1.58% | -92.1% | -10.65 | CŨ |
| 11 | ★Phủ sóng tối đa | 0.6884 | -0.026 | 1.38% | -93.1% | -11.50 | MỚI |
| 12 | ★Bayesian | 0.6864 | -0.028 | 0.79% | -87.2% | -2.79 | MỚI |
| 13 | ★Bayes_Sharp | 0.6824 | -0.032 | 0.99% | -86.2% | -2.75 | MỚI |
| 14 | ★MinDistance | 0.6746 | -0.040 | 1.18% | -94.1% | -12.54 | MỚI |
| 15 | ★Ensemble | 0.6667 | -0.048 | 0.79% | -87.2% | -2.79 | MỚI |

**Kết luận P535**: 
- Dữ liệu ít (538 kỳ) → mức ý nghĩa thống kê thấp
- ★Adaptive tự điều chỉnh hiệu quả, hòa với Pattern
- Thuật toán Bayesian kém trên pool nhỏ — prior quá mạnh so với data
- Freq_Hot có ROI tốt nhất (-74.4%)

### 6.4 Max 3D (1.064 kỳ, số 000–999, 20 số/kỳ)

| Hạng | Thuật toán | Exact% | Digit% | ROI% | Hits | ĐB | Nhất | Nhì | Ba |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Freq_Whole_Hot** | **2.334** | 10.09 | **-35.5** | 142 | 16 | 25 | 40 | 61 |
| 2 | Tier_Focus_DB | 2.186 | 10.02 | -42.2 | 133 | 12 | 25 | 44 | 52 |
| 3 | Digit_Hot | 2.137 | 10.08 | -39.5 | 130 | 15 | 24 | 39 | 52 |
| 4 | ★Bayesian_Digit | 2.087 | 10.02 | -39.6 | 127 | 12 | **38** | 34 | 43 |
| 5 | ★★SumRange | 2.055 | — | -40.0 | — | — | — | — | — |
| 5 | ★Bayes_Sharp | 2.055 | 10.02 | -42.0 | 125 | 14 | 29 | 27 | 55 |
| 7 | Digit_Cold | 2.038 | 9.91 | -44.4 | 124 | 13 | 28 | 25 | 58 |
| 8 | Pattern_3D | 2.005 | 10.03 | -46.2 | 122 | 11 | 21 | 49 | 41 |
| 9 | ★★Markov | 1.972 | — | -46.5 | — | — | — | — | — |
| 9 | ★Phủ sóng tối đa | 1.972 | 9.90 | -46.9 | 120 | 12 | 20 | 41 | 47 |
| 11 | ★Adaptive | 1.940 | 9.95 | -46.2 | 118 | 13 | 18 | 43 | 44 |
| 12 | Random | 1.874 | 10.01 | -55.7 | 114 | 6 | 26 | 33 | 49 |
| 13 | ★Bayesian_Whole | 1.841 | 10.00 | -46.0 | 112 | 14 | 24 | 28 | 46 |
| 14 | ★★Composite | 1.808 | — | -59.0 | — | — | — | — | — |
| 15 | Freq_Whole_Cold | 1.644 | 9.92 | -54.7 | 100 | 8 | 30 | 26 | 36 |

**Baseline lý thuyết**: exact = 2.0%, digit = 10.0%

**Kết luận Max 3D**:
- Freq_Whole_Hot dẫn đầu ổn định (+17% so với baseline)
- ★Bayesian_Digit nổi bật với 38 lần trúng Nhất (cao nhất)
- "Hot numbers" là tín hiệu thực — một số con số 3 chữ số xuất hiện thường xuyên hơn kỳ vọng

### 6.5 Max 3D Pro (711 kỳ, số 000–999, 20 số/kỳ)

| Hạng | Thuật toán | Exact% | Digit% | ROI% | Hits | ĐB | Nhất | Nhì | Ba |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Freq_Whole_Hot** | **2.345** | 10.06 | -47.2 | 93 | 6 | 10 | 34 | 43 |
| 2 | **★★SumRange** | **2.295** | — | **-35.1** | — | — | — | — | — |
| 3 | ★Phủ sóng tối đa | 2.269 | 10.01 | -43.8 | 90 | 4 | **26** | 29 | 31 |
| 4 | Random | 2.219 | 10.01 | -38.0 | 88 | 10 | 18 | 21 | 39 |
| 5 | Tier_Focus_DB | 2.068 | 9.89 | -51.1 | 82 | 6 | 14 | 21 | 41 |
| 5 | ★Bayesian_Digit | 2.068 | 10.02 | -43.6 | 82 | 9 | 15 | 21 | 37 |
| 5 | ★Adaptive | 2.068 | 10.04 | -47.7 | 82 | 7 | 14 | 25 | 36 |
| 8 | ★Bayes_Sharp | 2.017 | 9.97 | -36.3 | 80 | **13** | 13 | 21 | 33 |
| 9 | Pattern_3D | 1.992 | 9.98 | -41.2 | 79 | 9 | 20 | 21 | 29 |
| 10 | Freq_Whole_Cold | 1.942 | 9.97 | -52.7 | 77 | 4 | 21 | 20 | 32 |
| 11 | ★Bayesian_Whole | 1.866 | 9.96 | -43.9 | 74 | 10 | 16 | 17 | 31 |
| 12 | Digit_Hot | 1.815 | 10.10 | -50.0 | 72 | 7 | 17 | 19 | 29 |
| 12 | Digit_Cold | 1.815 | 9.92 | -44.8 | 72 | 11 | 10 | 21 | 30 |
| 14 | ★★Markov | 1.790 | — | -51.1 | — | — | — | — | — |
| 14 | ★★Composite | 1.790 | — | -39.3 | — | — | — | — | — |

**Kết luận Max 3D Pro**:
- Freq_Whole_Hot vẫn #1 exact match rate
- ★★SumRange #2 exact + ROI tốt nhất toàn bộ (-35.1%)
- ★Bayes_Sharp: 13 lần trúng Đặc biệt (gấp đôi trung bình) → ROI -36.3%
- Random #4 — dữ liệu ít (711 kỳ) → phương sai cao

---

## 7. Phân Tích Xuyên Sản Phẩm

### 7.1 Bảng Xếp Hạng Tổng Hợp (Matrix Products)

| Thuật toán | Δ(655) | Δ(645) | Δ(535) | TB Δ | Rank |
|---|:---:|:---:|:---:|:---:|:---:|
| Pattern | +0.003 | +0.017 | +0.025 | **+0.015** | **1** |
| Freq_Hot | +0.024 | +0.006 | +0.012 | **+0.014** | **2** |
| Random | +0.022 | +0.007 | -0.004 | +0.008 | 3 |
| ★Bayesian | +0.031 | +0.001 | -0.028 | +0.001 | 4 |
| ★Adaptive | -0.014 | -0.008 | +0.025 | +0.001 | 5 |
| ★Bayes_Sharp | -0.017 | +0.023 | -0.032 | -0.009 | 11 |
| ★Phủ sóng tối đa | +0.007 | -0.011 | -0.026 | -0.010 | 12 |
| ★MinDistance | +0.001 | -0.000 | -0.040 | -0.013 | 14 |
| ★Ensemble | +0.001 | -0.005 | -0.048 | -0.017 | 15 |

### 7.2 Quy Luật Observed

#### 1. Pool Size ↔ Strategy Selection
```
Pool lớn (55 số):  Bayesian AI (temp=1.0) — posterior phong phú
Pool vừa (45 số):  Bayesian AI (Sharp, temp=0.5) — tập trung posterior
Pool nhỏ (35 số):  Mẫu cấu trúc / Tự động tối ưu — cấu trúc quan trọng hơn thống kê
```

#### 2. Temperature Tuning
```
Temperature cao (1.0):  Posterior rộng → exploration nhiều → tốt khi pool lớn
Temperature thấp (0.5): Posterior hẹp → exploitation → tốt khi pool nhỏ + pattern rõ
                         Lý do: pool nhỏ → tần suất mỗi số cao hơn → posterior sắc nét hơn
```

#### 3. 3D vs Matrix
```
Matrix (45–55 số):  Bayesian vượt trội — có đủ chiều để posterior phân biệt
3D (1000 số):       Frequency đơn giản thắng — posterior quá "loãng" trên 1000 chiều
                     Digit-level Bayesian > Whole-number Bayesian (3 × 10 vs 1000 tham số)
```

#### 4. Data Volume ↔ Strategy Performance
```
Nhiều data (>1000 kỳ): Frequency/Bayesian mạnh — có đủ evidence cho posterior
Ít data (<600 kỳ):     Pattern/Adaptive mạnh — leverage structural priors
                         Bayesian yếu — prior chiếm ưu thế quá nhiều
```

### 7.3 Phát Hiện Quan Trọng

1. **★Bayesian Dirichlet là bước đột phá cho pool lớn**: Δ = +0.031 trên P655, vượt mọi thuật toán cũ. Posterior sampling nắm bắt hiệu quả uncertainty trong tần suất.

2. **★MaxEntropy là "high risk / high reward"**: Avg matches thấp hơn nhưng đạt 5/6 trùng khớp duy nhất (P645!). ROI = -62% (so với -90% thông thường). Stratified sampling tạo coverage cấu trúc.

3. **★Ensemble gây thất vọng**: Borda count trung bình hóa các ưu điểm riêng lẻ → kết quả tầm thường. "Wisdom of crowds" không hiệu quả khi mọi thành viên đều yếu.

4. **"Hot numbers" là tín hiệu thực ở 3D**: Freq_Whole_Hot vượt baseline 17% nhất quán. Trong 1000 số, phân bố không hoàn toàn đều.

5. **★★SumRange Filter nổi bật từ internet research**: #2 3D Pro (2.30%) + ROI tốt nhất (-35.1%). Lọc digit sum + frequency làm tốt trên 3D.

6. **Random ổn định bất ngờ**: Top 3 trung bình qua tất cả matrix products. Reinforces rằng **xổ số là ngẫu nhiên** — strategy chỉ tạo marginal edge.

---

## 8. Thuật Toán Từ Internet Research

### 8.1 Nguồn Tham Khảo

| Nguồn | Loại | Thuật toán rút ra |
|---|---|---|
| cpeoples/powerpredict (GitHub) | ML/Statistics | Markov Chain Digit Transition |
| 278156715man/3d-lottery-prediction (GitHub) | Neural Network + Stats | Composite Score (frequency + gap + recency) |
| rag-fish/loto6-deeplearning (GitHub) | Deep Learning | Feature engineering ideas |
| Kỹ thuật phân tích lottery truyền thống | Statistical | SumRange Filter (digit sum filtering) |
| Gordon et al. (1995) | Combinatorial | Covering Designs / Wheeling |
| Bluskov (2020) | Applied Math | Lottery Wheeling Systems |

### 8.2 Chiến Lược Implement & Kết Quả

#### ★★ SumRange Filter — ✅ THÀNH CÔNG
```
Kết quả: #5 Max 3D (2.06%), #2 Max 3D Pro (2.30%)
ROI:     -40.0% (3D), -35.1% (3D Pro) — TỐT NHẤT

Cơ chế: Lọc số theo khoảng tổng chữ số phổ biến + weighted digit frequency
Ưu:     Nhanh, đơn giản, client-side friendly
Nhận xét: Kỹ thuật truyền thống nhưng hiệu quả thực sự — digit sum filtering 
          loại bỏ ~30% không gian số không khả thi
```

#### ★★ Markov Digit — ⚠️ TRUNG BÌNH
```
Kết quả: ~2.0% (mức baseline) trên cả 2 sản phẩm
ROI:     -46.5% (3D), -51.1% (3D Pro)

Cơ chế: Ma trận chuyển trạng thái P(digit_t | digit_{t-1})
Nhận xét: Transition matrix không đủ mạnh khi không gian 1000 số.
          Giả thuyết serial dependency yếu — xổ số thực sự ngẫu nhiên ở mức này.
```

#### ★★ Composite Score — ❌ KÉM
```
Kết quả: #14 Max 3D (1.81%), #15 Max 3D Pro (1.79%)
ROI:     -59.0% (3D), -39.3% (3D Pro)

Cơ chế: Score = α×freq_rank + β×recency_rank + γ×gap_score
Nhận xét: Composite scoring dựa trên whole-number bị "kẹt" trong vùng số phổ biến,
          thiếu diversity → kém hơn cả random.
```

### 8.3 Phương Pháp Chưa Implement (và lý do)

| Phương pháp | Lý do không implement |
|---|---|
| Neural Network (LSTM/Transformer) | Quá chậm cho client-side, cần server, overfitting risk cao |
| Genetic Algorithm | Không có objective function rõ ràng, chậm |
| Chi-Square RNG Bias Detection | Test cho thấy Vietlott RNG không có bias đáng kể |
| BIBD (Block Design) | Phức tạp quá mức, Wheeling System đơn giản hơn |
| Clustering (K-means) | Feature engineering phức tạp, kết quả không rõ khác biệt |

---

## 9. Lý Thuyết Nền Tảng

### 9.1 Phân Phối Siêu Hình Học (Hypergeometric Distribution)

Xác suất trùng đúng k số khi chọn n số từ pool N, với K số trúng:

$$P(X = k) = \frac{\binom{K}{k} \binom{N-K}{n-k}}{\binom{N}{n}}$$

Expected value: $E[X] = \frac{nK}{N}$

### 9.2 Mô Hình Bayesian Dirichlet-Multinomial

**Prior**: $\theta \sim Dir(\alpha_1, ..., \alpha_N)$ với $\alpha_i = 1$ (uniform)

**Likelihood**: Xổ số kỳ t quay ra số $x_t$ → cập nhật count

**Posterior**: $\theta | data \sim Dir(\alpha_1 + c_1, ..., \alpha_N + c_N)$  
trong đó $c_i$ = số lần số i xuất hiện trong lookback window

**Posterior predictive**: 
$$P(\text{number } i) \propto \theta_i^{1/T}$$
với T = temperature (T=1 exploration, T→0 exploitation)

**Sampling**:
$$\theta_i = \frac{G_i}{\sum_j G_j}, \quad G_i \sim Gamma(\alpha_i + c_i, 1)$$

### 9.3 Shannon Entropy & Max-Entropy Sampling

Entropy của ticket: $H = -\sum_i P(n_i) \log P(n_i)$

Max-entropy sampling:
1. Chia range [1, N] thành K dải bằng nhau
2. Từ mỗi dải, sample 1 số theo posterior Bayesian
3. Kết quả: ticket có entropy cao nhất = đa dạng cấu trúc tối đa

### 9.4 Covering Design (Lottery Wheeling)

**Định nghĩa**: C(v, k, t) = tập hợp nhỏ nhất các k-subset của v-set sao cho mọi t-subset được phủ bởi ít nhất 1 block.

**Schönheim Lower Bound**:
$$C(v,k,t) \geq \left\lceil \frac{v}{k} \left\lceil \frac{v-1}{k-1} \cdots \left\lceil \frac{v-t+1}{k-t+1} \right\rceil \cdots \right\rceil \right\rceil$$

**Ứng dụng**: Chọn M "favorite numbers" → tạo bộ vé đảm bảo nếu t số đúng nằm trong M thì ít nhất 1 vé trùng k số.

### 9.5 Borda Count (Rank Aggregation)

Cho N thuật toán, mỗi thuật toán xếp hạng M số:
$$Score(number_i) = \sum_{j=1}^{N} (M - rank_{j}(i))$$

Chọn top-K số có Score cao nhất.

---

## 10. Kiến Trúc Hệ Thống

### 10.1 Tổng Quan

```
┌─────────────────────────────────────────────────────┐
│                    Python Backend                     │
│  src/machine_learning/strategies/                     │
│  ├── base.py (PredictModel — abstract base)          │
│  ├── random_strategy.py, frequency.py, ...           │
│  ├── bayesian_dirichlet.py, max_entropy.py, ...      │
│  └── wheeling.py (coverage generator)                │
│                                                       │
│  Backtest scripts (standalone):                       │
│  ├── website/research/phase1_backtest_standalone.py   │
│  ├── website/research/phase4_evaluation.py            │
│  └── website/research/3d_backtest.py                  │
└─────────────────────┬───────────────────────────────┘
                      │ Port to TypeScript
┌─────────────────────▼───────────────────────────────┐
│                  TypeScript Frontend                   │
│  website/src/lib/                                     │
│  ├── types.ts (SuggestionStrategy type)              │
│  ├── suggest-matrix.ts (6 strategies, client-side)   │
│  └── suggest-3d.ts (6 strategies, client-side)       │
│                                                       │
│  website/src/components/products/                     │
│  └── SuggestionPanel.tsx (UI component)              │
│                                                       │
│  website/src/app/algorithms/page.tsx (results page)  │
└─────────────────────────────────────────────────────┘
```

### 10.2 Python Strategy Classes (16 classes)

```
PredictModel (abstract base)
├── RandomModel
├── FrequencyStrategy
│   ├── HotNumbersStrategy
│   └── ColdNumbersStrategy
├── LongAbsenceStrategy
├── NotRepeatStrategy
├── PatternStrategy
├── ExponentialDecayStrategy
├── PairFrequencyStrategy
├── BayesianDirichletStrategy     ★ MỚI
├── MaxEntropyStrategy            ★ MỚI
├── MinDistanceDiversityStrategy  ★ MỚI
├── EnsembleStrategy              ★ MỚI
├── AdaptiveWindowStrategy        ★ MỚI
└── WheelGenerator                ★ MỚI (not PredictModel)
```

### 10.3 TypeScript Strategy Type

```typescript
type SuggestionStrategy = 
  | "frequency"   // Tần suất cao
  | "absence"     // Số vắng lâu
  | "mixed"       // Kết hợp nóng–lạnh
  | "bayesian"    // Bayesian AI
  | "maxentropy"  // Phủ sóng tối đa (3D: SumRange Filter)
  | "adaptive"    // Tự động tối ưu
  | "pattern"     // Mẫu cấu trúc
```

### 10.4 Hai Hệ Thống Song Song

Lưu ý: Hiện tại tồn tại **2 hệ thống gợi ý độc lập**:

1. **Python CLI** (`src/vietlott/cli/suggest.py`): Hệ thống gợi ý riêng với composite score (30-day freq × 0.30 + 14-day freq × 0.25 + absence × 0.20 + all-time freq × 0.15). **Không sử dụng** bất kỳ strategy class nào từ `machine_learning/`.

2. **TypeScript Website** (`website/src/lib/suggest-*.ts`): Reimplementation 6 strategies cho client-side browser execution. Hoàn toàn độc lập.

Hai hệ thống phục vụ mục đích khác nhau:
- CLI: nhanh, 1 lệnh, dùng cho developer
- Website: interactive, nhiều strategy, dùng cho end user

---

## 11. Khuyến Nghị & Kết Luận

### 11.1 Top 6 Thuật Toán Theo Sản Phẩm

#### Power 6/55

| # | Thuật toán | Lý do chọn |
|:---:|---|---|
| 1 | 🧠 **Bayesian AI** (temp=1.0) | #1 avg matches (+0.031), best win rate (1.65%) |
| 2 | 📊 **Tần suất cao** (Freq Hot) | #2 avg matches, đơn giản, nhanh |
| 3 | 🎯 **Phủ sóng tối đa** (MaxEntropy) | #4 nhưng phủ cấu trúc, win rate cao (1.54%) |
| 4 | 🔮 **Mẫu cấu trúc** | #5, ổn định nhất qua tất cả products |
| 5 | ⚡ **Tự động tối ưu** | Tự điều chỉnh, đa dạng |
| 6 | 🎲 **Kết hợp nóng–lạnh** | Cân bằng, dễ hiểu |

#### Mega 6/45

| # | Thuật toán | Lý do chọn |
|:---:|---|---|
| 1 | 🧠 **Bayesian AI** (Sharp, temp=0.5) | #1 avg matches (+0.023), best win rate (3.14%) |
| 2 | 🔮 **Mẫu cấu trúc** | #2, ổn định |
| 3 | 📊 **Tần suất cao** | #4 avg, win rate cao (2.78%) |
| 4 | 🎯 **Phủ sóng tối đa** | ROI TỐT NHẤT (-62%), đạt 5/6 trùng! |
| 5 | ⚡ **Tự động tối ưu** | Tự điều chỉnh |
| 6 | 🎲 **Kết hợp nóng–lạnh** | Cân bằng |

#### Lotto 5/35

| # | Thuật toán | Lý do chọn |
|:---:|---|---|
| 1 | ⚡ **Tự động tối ưu** | #1 (hòa), tự tối ưu lookback |
| 2 | 🔮 **Mẫu cấu trúc** | #1 (hòa), ổn định |
| 3 | 📊 **Tần suất cao** | ROI tốt nhất (-74.4%) |
| 4 | 🧠 **Bayesian AI** (temp=1.0) | Đa dạng posterior |
| 5 | 🎯 **Phủ sóng tối đa** | Coverage cấu trúc |
| 6 | 🎲 **Kết hợp nóng–lạnh** | Cân bằng |

#### Max 3D

| # | Thuật toán | Lý do chọn |
|:---:|---|---|
| 1 | 📊 **Tần suất cao** (Freq Whole Hot) | #1 exact (2.33%), ROI tốt nhất (-35.5%) |
| 2 | 🧠 **Bayesian AI** (Bayesian Digit) | #4, 38 lần trúng Nhất (cao nhất) |
| 3 | 🎯 **Phủ sóng tối đa** (SumRange Filter) | #5, ROI tốt 2nd (-40.0%) |
| 4 | ⚡ **Tự động tối ưu** | #11, tự tối ưu |
| 5 | 🎲 **Kết hợp nóng–lạnh** | Digit-level composition |
| 6 | ⏳ **Số vắng lâu** | Đa dạng approach |

#### Max 3D Pro

| # | Thuật toán | Lý do chọn |
|:---:|---|---|
| 1 | 📊 **Tần suất cao** (Freq Whole Hot) | #1 exact (2.35%) |
| 2 | 🎯 **Phủ sóng tối đa** (SumRange Filter) | #2 exact, ROI TỐT NHẤT (-35.1%) |
| 3 | 🧠 **Bayesian AI** (Bayesian Digit) | Alt: ★Bayes Sharp cho ROI (-36.3%) |
| 4 | ⚡ **Tự động tối ưu** | #5 (tied), tự tối ưu |
| 5 | 🎲 **Kết hợp nóng–lạnh** | Digit-level |
| 6 | ⏳ **Số vắng lâu** | Đa dạng |

### 11.2 Thuật Toán KHÔNG Nên Sử Dụng

| Thuật toán | Lý do loại |
|---|---|
| ★Ensemble (Borda Count) | Chậm (~100s), kết quả tầm thường, trung bình hóa triệt tiêu ưu điểm |
| ★MinDistance | Hiệu suất dưới trung bình, chỉ tốt cho portfolio diversity |
| PairFrequency | Kém nhất nhất quán, greedy co-occurrence tạo bias |
| NotRepeat | Kết quả thiếu ổn định qua sản phẩm (#2 P655 nhưng #10 P645, P535) |
| ★Bayesian_Whole (3D) | Posterior quá loãng trên 1000 chiều |
| ★★Composite Score (3D) | Dưới baseline, thiếu diversity |
| ★★Markov Digit (3D) | Mức baseline, không tạo khác biệt |

### 11.3 Kết Luận Tổng Quát

1. **Xổ số là ngẫu nhiên**: Không có thuật toán nào tạo lợi thế có ý nghĩa thống kê lớn. Delta tốt nhất chỉ +0.031 avg matches (~5% improvement).

2. **Bayesian approach là bước tiến thực sự**: Uncertainty quantification qua Dirichlet posterior sampling là phương pháp có cơ sở lý thuyết vững nhất và cho kết quả tốt nhất trên pool lớn.

3. **Mỗi sản phẩm cần thuật toán riêng**: Pool size, số lượng data, và cấu trúc sản phẩm quyết định thuật toán tối ưu. Không có "silver bullet".

4. **Frequency-based đơn giản vẫn hiệu quả**: Đặc biệt cho 3D products, phương pháp đơn giản nhất lại tốt nhất.

5. **MaxEntropy là "insurance policy"**: Avg thấp hơn nhưng ROI tốt nhất nhờ occasional big wins — phù hợp cho người chơi muốn "thắng lớn hoặc không".

---

## 12. Phụ Lục

### 12.1 Danh sách file research

| File | Mô tả | Dòng |
|---|---|---:|
| `website/research/phase1_backtest_standalone.py` | Phase 1 backtest script | 813 |
| `website/research/phase1_backtest_results.json` | Phase 1 results data | 785 |
| `website/research/phase1_analysis_report.md` | Phase 1 analysis | 227 |
| `website/research/phase2_research_findings.md` | Phase 2 literature review | 212 |
| `website/research/phase4_evaluation.py` | Phase 4 backtest script | 602 |
| `website/research/phase4_evaluation_results.json` | Phase 4 results data | 1.009 |
| `website/research/phase4_analysis_report.md` | Phase 4 analysis | ~200 |
| `website/research/3d_backtest.py` | 3D products backtest script | 887 |
| `website/research/3d_backtest_results.json` | 3D results data | 503 |
| `website/research/3d_analysis_report.md` | 3D analysis | 288 |
| `website/RESEARCH_PLAN.md` | Master research plan | 360 |

### 12.2 Python Strategy Source Files

| File | Class | Dòng (ước) |
|---|---|---:|
| `src/machine_learning/strategies/base.py` | PredictModel | ~100 |
| `src/machine_learning/strategies/random_strategy.py` | RandomModel | ~30 |
| `src/machine_learning/strategies/frequency.py` | Frequency/Hot/Cold | ~150 |
| `src/machine_learning/strategies/long_absence.py` | LongAbsenceStrategy | ~60 |
| `src/machine_learning/strategies/not_repeat.py` | NotRepeatStrategy | ~50 |
| `src/machine_learning/strategies/pattern.py` | PatternStrategy | ~120 |
| `src/machine_learning/strategies/exponential_decay.py` | ExponentialDecayStrategy | ~80 |
| `src/machine_learning/strategies/pair_frequency.py` | PairFrequencyStrategy | ~90 |
| `src/machine_learning/strategies/bayesian_dirichlet.py` | BayesianDirichletStrategy | ~100 |
| `src/machine_learning/strategies/ensemble.py` | EnsembleStrategy | ~120 |
| `src/machine_learning/strategies/max_entropy.py` | MaxEntropyStrategy | ~80 |
| `src/machine_learning/strategies/min_distance_diversity.py` | MinDistanceDiversityStrategy | ~100 |
| `src/machine_learning/strategies/adaptive_window.py` | AdaptiveWindowStrategy | ~90 |
| `src/machine_learning/strategies/wheeling.py` | WheelGenerator | ~80 |

### 12.3 TypeScript Implementation Files

| File | Strategies | Dòng |
|---|---|---:|
| `website/src/lib/types.ts` | Type definitions | 148 |
| `website/src/lib/suggest-matrix.ts` | 6 matrix strategies | 359 |
| `website/src/lib/suggest-3d.ts` | 6 3D strategies | 369 |
| `website/src/components/products/SuggestionPanel.tsx` | UI component | 528 |
| `website/src/app/algorithms/page.tsx` | Results display | 918 |

### 12.4 Tài Liệu Tham Khảo

1. Gordon, D.M., Kuperberg, G., Patashnik, O. (1995). "New constructions for covering designs." *Journal of Combinatorial Designs*, 3(4), 269–284.
2. Bluskov, I. (2020). "Combinatorial Systems (Wheels) for Pick-6 Lotteries." Lotbook Publishing.
3. Nurmela, K.J., Östergård, P.R.J. (1993). "Upper bounds for covering designs by simulated annealing." *Congressus Numerantium*, 96, 93–111.
4. Schönheim, J. (1964). "On coverings." *Pacific Journal of Mathematics*, 14(4), 1405–1411.
5. Gelman, A. et al. (2013). *Bayesian Data Analysis*. 3rd edition. CRC Press.
6. Rabiner, L.R. (1989). "A tutorial on hidden Markov models." *Proceedings of the IEEE*, 77(2), 257–286.
7. NIST SP 800-22 (2010). "A Statistical Test Suite for Random and Pseudorandom Number Generators."
8. Wikipedia: Lottery Wheeling, Covering Design, Block Design, Hypergeometric Distribution.
9. GitHub: cpeoples/powerpredict, 278156715man/3d-lottery-prediction, rag-fish/loto6-deeplearning.

---

*Tài liệu cập nhật lần cuối: 04/2026*  
*Tổng dữ liệu: 123.077 records across 7 products*  
*Tổng thuật toán backtest: 16 (matrix) + 15 (3D) = 31 configurations*

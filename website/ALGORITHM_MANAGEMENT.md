# Quản Lý Thuật Toán — Kiến Trúc & Hướng Dẫn

> Tài liệu tham chiếu chính cho việc quản lý, phân loại, và mở rộng hệ thống thuật toán gợi ý xổ số.

---

## 1. Tổng Quan Hệ Thống

### Có bao nhiêu thuật toán?

| Tầng | Số lượng | Vai trò |
|------|----------|---------|
| **Gợi ý (UI)** | 9 | Chạy trên browser, người dùng chọn trực tiếp |
| **Backtest Python (CLI)** | 14 | Chạy offline, đánh giá strategies |
| **Nghiên cứu Python** | 21+ | Chạy 1 lần để tìm thuật toán tốt nhất |
| **Website hiển thị** | 9 (có sẵn) + 12 (chỉ kết quả) | Trang /algorithms |

### Dòng chảy thuật toán

```
[Nghiên cứu Python]  →  Backtest  →  So sánh  →  Thắng?  →  Triển khai lên UI
         ↓                  ↓                         ↓
  research/*.py       *_results.json              suggest-*.ts
  (chạy 1 lần)       (kết quả lưu trữ)          (code chạy thật)
```

---

## 2. Phân Loại Nguồn Gốc

### 🟦 Có sẵn (Built-in) — 3 thuật toán

Các thuật toán cơ bản, phổ biến trong mọi hệ thống phân tích xổ số.

| ID | Tên | Nguồn gốc | Áp dụng |
|----|-----|-----------|---------|
| `frequency` | Tần suất cao | Frequency analysis — thống kê mô tả cơ bản | Ma trận + 3D |
| `absence` | Số vắng lâu | Gambler's Fallacy / Law of Large Numbers | Ma trận + 3D |
| `mixed` | Kết hợp nóng–lạnh | Ensemble đơn giản (hot + cold) | Ma trận + 3D |

**Đặc điểm**: Không cần nghiên cứu, ai cũng nghĩ tới. Đã có từ phiên bản đầu tiên.

---

### 🟨 Tìm hiểu qua mạng (Internet Research) — 3 thuật toán

Thuật toán dựa trên papers, GitHub repos, và diễn đàn phân tích xổ số.

| ID | Tên | Nguồn gốc cụ thể | Áp dụng |
|----|-----|------------------|---------|
| `bayesian` | Bayesian AI | Dirichlet-Multinomial (thống kê Bayesian), Marsaglia & Tsang 2000 | Ma trận + 3D |
| `maxentropy` | Phủ sóng tối đa | Maximum Entropy Principle (Jaynes 1957) + SumRange filter từ GitHub lottery repos | Ma trận + 3D |
| `adaptive` | Tự động tối ưu | Walk-forward optimization (Pardo 2008), phổ biến trong algorithmic trading | Ma trận + 3D |

**Đặc điểm**: Cơ sở khoa học rõ ràng, có paper tham chiếu. Được implement và tuning cho Vietlott data.

---

### 🟩 App tự nghiên cứu (Original Research) — 3 thuật toán

Thuật toán sinh ra từ quá trình phân tích thống kê sâu (13 bài test RNG) trên dữ liệu Vietlott thực.

| ID | Tên | Phát hiện dẫn tới thuật toán | Áp dụng |
|----|-----|------------------------------|---------|
| `pattern` | Mẫu cấu trúc | Phân tích spacing + band distribution cho thấy cấu trúc bộ số quan trọng hơn tần suất ở pool nhỏ. Kết hợp Covering Designs (Gordon 1995) | Ma trận + 3D |
| `jointbias` | Bias liên hợp | Chi² independence test: P(abc) ≠ P(a)×P(b)×P(c) (p<0.001). Digit 6 over +10% ở đơn vị | Chỉ 3D |
| `evmax` | EV tối đa | Tier analysis: số phân bố không đều giữa các hạng giải. Kết hợp EV optimization + exponential decay | Chỉ 3D |

**Đặc điểm**: Không tìm thấy thuật toán tương tự ở nguồn nào. Sinh ra hoàn toàn từ phân tích data Vietlott.

---

## 3. Ma Trận Thuật Toán × Sản Phẩm

### Trong tab Gợi ý (UI)

✅ = có sẵn và hiển thị, ⬜ = có code nhưng ẩn (rank > MAX_SHOWN), ❌ = không áp dụng

| Thuật toán | Power 6/55 | Mega 6/45 | Lotto 5/35 | Max 3D | Max 3D Pro |
|-----------|-----------|-----------|-----------|--------|-----------|
| 📊 Tần suất cao | ✅ #2 | ✅ #3 | ✅ #3 | ✅ **#1** | ✅ #3 |
| ⏳ Số vắng lâu | ⬜ #7 | ✅ #7 | ⬜ #7 | ⬜ #9 | ⬜ #9 |
| 🎲 Kết hợp | ✅ #6 | ✅ #5 | ✅ #6 | ✅ #7 | ✅ #7 |
| 🧠 Bayesian AI | ✅ **#1** | ✅ **#1** | ✅ #4 | ✅ #3 | ✅ #5 |
| 🔮 Mẫu cấu trúc | ✅ #3 | ✅ #2 | ✅ **#1** | ✅ #5 | ⬜ #8 |
| 🎯 Phủ sóng tối đa | ✅ #4 | ✅ #4 | ✅ #5 | ✅ #4 | ✅ #4 |
| ⚡ Tự động tối ưu | ✅ #5 | ✅ #6 | ✅ #2 | ✅ #6 | ✅ #6 |
| 💰 EV tối đa | ❌ | ❌ | ❌ | ⬜ #8 | ✅ **#1** |
| 🧬 Bias liên hợp | ❌ | ❌ | ❌ | ✅ **#2** | ✅ **#2** |

> **MAX_STRATEGIES_SHOWN = 7** — mỗi sản phẩm hiển thị tối đa 7 thuật toán tốt nhất.

### Hiển thị mặc định khi user mở trang

| Sản phẩm | Thuật toán mặc định (rec1) | Thuật toán phụ (rec2) |
|----------|---------------------------|----------------------|
| Power 6/55 | 🧠 Bayesian AI | 📊 Tần suất cao |
| Mega 6/45 | 🧠 Bayesian AI (T=0.3) | 🔮 Mẫu cấu trúc |
| Lotto 5/35 | 🔮 Mẫu cấu trúc | ⚡ Tự động tối ưu |
| Max 3D | 📊 Tần suất cao | 🧬 Bias liên hợp |
| Max 3D Pro | 💰 EV tối đa | 🧬 Bias liên hợp |

---

## 4. Kiến Trúc Code

### Nơi định nghĩa thuật toán

```
website/src/lib/
├── types.ts                    ← SuggestionStrategy type union (nguồn chân lý)
├── suggest-matrix.ts           ← Implementation cho Power/Mega/Lotto (7 case)
└── suggest-3d.ts               ← Implementation cho Max 3D/3D Pro (9 case)

website/src/components/products/
└── SuggestionPanel.tsx         ← ALL_STRATEGIES (UI metadata) + PRODUCT_RANKS (xếp hạng)

website/src/app/algorithms/
└── page.tsx                    ← Trang hiển thị chi tiết + backtest results

src/machine_learning/strategies/ ← Python strategies (CLI, không liên quan UI)
└── *.py                         ← 14 strategies cho backtest Python
```

### Luồng dữ liệu khi user nhấn "Tạo gợi ý"

```
SuggestionPanel.tsx
  → handleGenerate(strategy, count)
    → ThreeDProductPage.tsx hoặc MatrixProductPage.tsx
      → generate3DSuggestions() hoặc generateSuggestions()
        → switch(strategy) → case "evmax" / "bayesian" / ...
          → return ThreeDSuggestionSet[] hoặc SuggestionSet[]
```

### File cần sửa khi thêm/sửa thuật toán

| Thay đổi | File(s) |
|----------|---------|
| Thêm strategy ID mới | `types.ts` → `SuggestionStrategy` union |
| Implement logic cho Matrix | `suggest-matrix.ts` → thêm `case "xxx"` |
| Implement logic cho 3D | `suggest-3d.ts` → thêm `case "xxx"` |
| UI label, emoji, description | `SuggestionPanel.tsx` → `ALL_STRATEGIES` |
| Xếp hạng & hiển thị | `SuggestionPanel.tsx` → `PRODUCT_RANKS` |
| Trang thuật toán chi tiết | `algorithms/page.tsx` → `STRATEGIES` data |

---

## 5. Quy Trình Thêm Thuật Toán Mới

### Giai đoạn 1: Nghiên cứu (KHÔNG sửa UI)

```
1. Viết script Python:  website/research/<product>_<name>.py
2. Chạy backtest walk-forward (≥ 3 runs, seed=42)
3. Lưu kết quả:          website/research/<product>_<name>_results.json
4. So sánh exact match rate / win rate với:
   a. Random baseline
   b. Thuật toán #1 hiện tại của sản phẩm đó
```

### Giai đoạn 2: Đánh giá — Khi nào được thêm vào Gợi ý?

**Tiêu chí BẮT BUỘC** (cần đạt TẤT CẢ):

| # | Tiêu chí | Lý do |
|---|---------|-------|
| 1 | **Thắng Random baseline** trên ≥ 1 sản phẩm | Nếu thua random thì không có giá trị |
| 2 | **≥ 3 runs** với seed cố định, kết quả ổn định (std < 0.3pp) | Tránh fluky results |
| 3 | **Không look-ahead bias** trong backtest | Đảm bảo kết quả thật |
| 4 | **Giải thích được** tại sao nó hoạt động (cơ sở thống kê/toán) | User cần hiểu |

**Tiêu chí ĐỦ** (cần đạt ≥ 1):

| # | Tiêu chí | Giải thích |
|---|---------|-----------|
| A | **Thắng thuật toán #1 hiện tại** trên ≥ 1 sản phẩm | Directly better |
| B | **ROI tốt hơn đáng kể** (≥ 3pp) dù match rate không #1 | Khác biệt về chiến lược |
| C | **Unique approach** không trùng với 9 thuật toán hiện có | Đa dạng cho user |

### Giai đoạn 3: Triển khai

```
Bước 1: types.ts          → Thêm vào SuggestionStrategy union
Bước 2: suggest-*.ts      → Implement case mới
Bước 3: SuggestionPanel   → Thêm vào ALL_STRATEGIES + PRODUCT_RANKS
Bước 4: algorithms/page   → Thêm mô tả + backtest data
Bước 5: npx next build    → Phải PASS
Bước 6: Git commit + push
```

### Giai đoạn 4: Theo dõi sau triển khai

- Khi có data mới (crawl hàng ngày) → thuật toán tự cập nhật (lookback window)
- Mỗi 3-6 tháng: chạy lại backtest toàn bộ để xác nhận rankings vẫn đúng
- Nếu rankings thay đổi → cập nhật `PRODUCT_RANKS`

---

## 6. Thuật Toán Chỉ Có Trong Backtest (Không Trong UI)

Các thuật toán đã test nhưng **KHÔNG** đưa vào gợi ý:

### Python CLI (`src/machine_learning/strategies/`)

| Strategy | File | Lý do không vào UI |
|----------|------|-------------------|
| FrequencyStrategy (Hot/Cold) | frequency.py | Đã có `frequency` + `absence` |
| ExponentialDecayStrategy | exponential_decay.py | Kết quả trung bình, không vượt trội |
| LongAbsenceStrategy | long_absence.py | Đã có `absence` |
| PairFrequencyStrategy | pair_frequency.py | Thua random trên hầu hết products |
| NotRepeatStrategy | not_repeat.py | Không ổn định |
| WheelingStrategy | wheeling.py | Quá phức tạp, kết quả không tốt |
| EnsembleStrategy | ensemble.py | Thua các strategy đơn lẻ tốt nhất |
| MinDistanceDiversityStrategy | min_distance_diversity.py | Kết quả trung bình |

### Nghiên cứu 3D (`website/research/`)

| Strategy | Kết quả | Lý do không vào UI |
|----------|---------|-------------------|
| ConditionalChain | 3D: 1.95%, 3D Pro: 2.10% | Thua Random trên Max 3D |
| AdaptiveBias T=0.7 | 3D: 1.76% | Tệ hơn random ở cả 2 product |
| KLDivergenceMinimizer | 3D: 2.06%, Pro: 1.97% | Không vượt trội vs đã có |
| MultiSignalEnsemble | 3D: 2.00%, Pro: 2.09% | Ngang random |
| OptimalPortfolio | 3D: 2.02%, Pro: 2.12% | Không đủ improvement |
| ULTIMATE v1 | 3D: 2.22%, Pro: 1.89% | v2 tốt hơn, và ULTIMATE quá complex |
| CoverageOpt | 3D: 2.22%, Pro: 1.44% | Tệ nhất trên 3D Pro |
| BayesJoint variants | Pro: 2.13-2.16% | Không vượt JointBias đơn giản hơn |
| PairExploiter T=0.7 | 3D: 1.77% | Chỉ T=0.5 tốt, và đã có JointBias |

---

## 7. Tóm Tắt Nhanh

```
┌─────────────────────────────────────────────────────────┐
│  9 thuật toán trong UI  =  3 có sẵn + 3 mạng + 3 tự NC │
│                                                          │
│  🟦 Có sẵn:     frequency, absence, mixed               │
│  🟨 Từ mạng:    bayesian, maxentropy, adaptive           │
│  🟩 Tự nghiên cứu: pattern, jointbias, evmax             │
│                                                          │
│  Thêm mới? → Nghiên cứu → Backtest → Thắng? → Triển khai│
│                                                          │
│  Files quan trọng:                                       │
│  • types.ts         (định nghĩa ID)                     │
│  • suggest-*.ts     (logic chạy thật)                    │
│  • SuggestionPanel  (UI + rankings)                      │
│  • algorithms/page  (mô tả chi tiết)                    │
└─────────────────────────────────────────────────────────┘
```

---

*Cập nhật: 2026-04-19 — 9 thuật toán, 5 sản phẩm, 4.948+ kỳ quay backtest*

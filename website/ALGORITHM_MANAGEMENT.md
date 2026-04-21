# Quản Lý Thuật Toán — Kiến Trúc & Hướng Dẫn

> Tài liệu tham chiếu chính cho việc quản lý, phân loại, và mở rộng hệ thống thuật toán gợi ý xổ số.

> ⚠️ **Cập nhật 2026-04-21 post-Chu kỳ 13**: 3D research line CLOSED. 28 chiến lược tested qua 8 cycles, 0 Accept/Suggestive. UI rec1 cho Max 3D + Max 3D Pro updated sang JointDigitBias (directional pick, no confirmed edge). Xem [research/3d/3D_FINAL_REPORT.md](research/3d/3D_FINAL_REPORT.md).

---

## 1. Tổng Quan Hệ Thống

### Có bao nhiêu thuật toán?

| Tầng | Số lượng | Vai trò |
|------|----------|---------|
| **Gợi ý (UI)** | 9 | Chạy trên browser, người dùng chọn trực tiếp |
| **Backtest Python (CLI)** | 14 | Chạy offline, đánh giá strategies |
| **Nghiên cứu Python** | 28+ | Chu kỳ 1-13 combined; 3D paradigms: probabilistic/copula/ML/pool |
| **Website hiển thị** | 9 (có sẵn) + 19 (chỉ kết quả) | Trang /algorithms + /research |

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
| 📊 Tần suất cao | ✅ #2 | ✅ #3 | ✅ #3 | ✅ #2 | ✅ #2 |
| ⏳ Số vắng lâu | ⬜ #7 | ✅ #7 | ⬜ #8 | ⬜ #9 | ⬜ #9 |
| 🎲 Kết hợp | ✅ #6 | ✅ #5 | ✅ #7 | ✅ #7 | ✅ #6 |
| 🧠 Bayesian AI | ✅ **#1** | ✅ **#1** | ✅ #5 | ✅ #3 | ✅ #3 |
| 🔮 Mẫu cấu trúc | ✅ #3 | ✅ #2 | ✅ **#1** | ✅ #5 | ⬜ #7 |
| 🎯 Phủ sóng tối đa | ✅ #4 | ✅ #4 | ✅ #6 | ✅ #4 | ✅ #4 |
| ⚡ Tự động tối ưu | ✅ #5 | ✅ #6 | ✅ #2 | ✅ #6 | ✅ #5 |
| 💰 EV tối đa | ❌ | ❌ | ❌ | ⬜ #8 | ⬜ #8 ⚠️ |
| 🧬 Bias liên hợp | ❌ | ❌ | ❌ | ✅ **#1** 🔬 | ✅ **#1** 🔬 |
| 🎰 Hybrid Parity | ❌ | ❌ | ⬜ #4 ⚠️ | ❌ | ❌ |

> **MAX_STRATEGIES_SHOWN = 7** — mỗi sản phẩm hiển thị tối đa 7 thuật toán tốt nhất.
>
> ⚠️ = Strategy đã bị Reject qua replication (Chu kỳ 5/7/9/11/12/13).
> 🔬 = Research pick (directional only, no confirmed edge).

### Hiển thị mặc định khi user mở trang

| Sản phẩm | Thuật toán mặc định (rec1) | Thuật toán phụ (rec2) | Note |
|----------|---------------------------|----------------------|------|
| Power 6/55 | 🧠 Bayesian AI | 📊 Tần suất cao | Directional +0.031 matches, chưa replication-verified |
| Mega 6/45 | 🧠 Bayesian AI (T=0.3) | 🔮 Mẫu cấu trúc | ExpDecay_Cold đã Rejected Chu kỳ 9 (direction flip) |
| Lotto 5/35 | 🔮 Mẫu cấu trúc | ⚡ Tự động tối ưu | Hybrid Parity Rejected Chu kỳ 5 (sample-size bug fix: p=0.301) |
| Max 3D | 🧬 Bias liên hợp 🔬 | 📊 Tần suất cao | Research line CLOSED Chu kỳ 13; directional only |
| Max 3D Pro | 🧬 Bias liên hợp 🔬 | 📊 Tần suất cao | EV Maximizer Rejected Chu kỳ 7 (half-flip); GBM overfit Chu kỳ 12.5 |

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

> ⚠️ **Cập nhật 2026-04-21**: Các tiêu chí cũ trong §5.2 không còn đủ nghiêm. Post-Chu kỳ 7-13, mọi strategy claim Accept phải pass **3-gate protocol** (full + split-half + forward). Xem [RESEARCH_TO_UI_PLAYBOOK.md](RESEARCH_TO_UI_PLAYBOOK.md) cho full decision matrix + UI update checklist.

### Giai đoạn 1: Nghiên cứu (KHÔNG sửa UI)

```
1. Pre-register hypothesis:  research/history/cycleNN_<slug>.md (trước khi chạy backtest!)
2. Viết script Python:       website/research/<product>/<name>.py
3. Chạy walk-forward + split-half + forward_last_100 (n_runs=5, seed=42)
4. Run _significance.py:     z-test vs Random + Wilson CI + Newcombe diff CI
5. Commit artifacts:         research/<product>/cycleN_*_results.json + .log
```

### Giai đoạn 2: Đánh giá — 3-gate protocol (Principle #13, binding từ Chu kỳ 7)

**TIÊU CHÍ MỚI** (binding từ cycles 7-13, codified METHODOLOGY §3.7):

| # | Gate | Yêu cầu | Principle |
|---|------|---------|-----------|
| 1 | **Full-sample** | p < 0.05 + CI_lo > 0. Bonferroni K dựa vào # strategies tested cùng cycle | METHODOLOGY §3.2 |
| 2 | **Split-half replication** | Both halves Δ > 0 AND both p < 0.05 (time-ordered split) | Principle #11 §3.5 |
| 3 | **Forward_last_100** | Δ > 0 directional (v1) hoặc Δ > 2×SE AND p < 0.15 (v2 proposed) | Principle #13 §3.7 |

**Principle #14 magnitude sanity check** (auto-flag):
- Nếu `|Δ_full| > 3 × bias_ceiling` (3D: 1.2pp, matrix: 0.9pp) → **Ship-with-caveats pending audit**, bất kể p-value.
- Case Chu kỳ 12.5: GBM Δ=+3.07pp Max 3D Pro (7× ceiling) → flagged → audit confirm overfit → Reject.

**Principle #15 prediction concentration check** (ML/discriminative strategies):
- Require `n_unique_predictions / total_predictions ≥ 0.30` + top-5 < 30%.
- Violating → auto-Reject.

### Giai đoạn 3: Decision state → UI action

Xem [RESEARCH_TO_UI_PLAYBOOK.md §2](RESEARCH_TO_UI_PLAYBOOK.md) cho complete decision matrix:

| State | Deploy? | SuggestionPanel rec1 | BacktestCard badge |
|-------|:-:|----------|-----------|
| Accept (3-gate pass + §14 OK) | ✅ Yes | Promote với green "✓ Accept" | `Accept` green |
| Suggestive (partial gate) | 🟡 Ship-with-disclaimer | rec1 với "🔬 Directional" orange | `Suggestive` yellow |
| Ship-with-caveats (§14 flag) | 🟡 Research/algo page only | NOT rec1 | `Suggestive` + caveat |
| Inconclusive | ❌ No | Remove rec1 status | `Inconclusive` gray |
| Reject | ❌ No | Demote + ⚠ note | `Reject` muted |

### Giai đoạn 4: UI triển khai (nếu Accept / Suggestive / Ship-with-caveats)

**Xem [RESEARCH_TO_UI_PLAYBOOK.md §3](RESEARCH_TO_UI_PLAYBOOK.md) cho file-by-file checklist**. Quick list:

```
1. types.ts             → Thêm strategy ID vào SuggestionStrategy union (nếu mới)
2. suggest-*.ts         → Implement case logic
3. SuggestionPanel.tsx  → ALL_STRATEGIES + PRODUCT_RANKS ranks/stats/rec1/rec2
4. backtest-data.ts     → BACKTEST_* rows với decision field
5. research/page.tsx    → Cycles timeline + stats
6. algorithms/page.tsx  → STRATEGIES + RECOMMENDATIONS
7. ALGORITHM_MANAGEMENT.md → Ma trận table + default recs
8. npm run build        → PASS mandatory
9. curl smoke 6 routes  → all 200
10. Git commit + push   → per template in PLAYBOOK §3.G
```

### Giai đoạn 5: Nếu Reject/demote existing strategy

**Critical**: prior Accept/Suggestive claims phải update ngay khi Reject:

```
1. backtest-data.ts     → Change decision field, add ⚠ comment with cycle reference
2. SuggestionPanel      → Demote from rec1/rec2, add ⚠ note to description
3. ALL_STRATEGIES       → Update description with Reject cycle reference
4. algorithms/page.tsx  → Update RECOMMENDATIONS reason text
5. ALGORITHM_MANAGEMENT.md → Add ⚠ marker in Ma trận row
```

**Anti-pattern**: ship stale Suggestive (e.g., Mega 6/45 ExpDecay_Cold shown Suggestive 2 months after Chu kỳ 9 Reject, fixed 2026-04-21). Xem [RESEARCH_TO_UI_PLAYBOOK.md §7](RESEARCH_TO_UI_PLAYBOOK.md) cho anti-patterns.

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

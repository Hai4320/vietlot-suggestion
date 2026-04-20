# Kỹ Thuật Kiểm Thử Thống Kê — Bias Detection Battery

> **Mục đích**: Tài liệu canonical về **test battery** cho Phase 1 (Bias Detection) của [METHODOLOGY.md](METHODOLOGY.md). Mỗi test đi kèm: mục đích, H0/H1, công cụ, ngưỡng, và cách đọc kết quả.
>
> **Đối tượng**: Người chạy `deep_analysis.py` hoặc muốn thêm test mới.
>
> **Áp dụng cho**: Matrix products (6/55, 6/45, 5/35) và digit-based products (3D, 3D Pro).

---

## 1. Nguyên Tắc Thiết Kế Battery

### 1.1 Battery cố định, không post-hoc

Phải **cố định danh sách test trước khi chạy**. Không thêm test sau khi thấy dữ liệu (tránh data dredging).

Matrix: 14 tests (xem §3). 3D/digit: 13 tests (xem §4).

### 1.2 Bonferroni bắt buộc

Với `n_tests` tests, ngưỡng chặt = `α_strict = 0.05 / n_tests`.

Ví dụ: 14 tests → `α_strict = 0.00357`.

Report **cả** `p_raw < 0.05` và `p_raw < α_strict`:
```json
"significant_05": true,           // raw ngưỡng lỏng
"significant_bonferroni": false   // ngưỡng chặt
```

Chỉ "significant_bonferroni=true" mới đủ để khởi động Phase 2.

### 1.3 Effect size + direction

P-value cho biết "có bias" nhưng không nói "bias lớn hay nhỏ, theo hướng nào". Mỗi test phải report thêm:
- `max_deviation_pct`: số lệch lớn nhất (%)
- `direction`: số/digit/position nào lệch, over hay under
- `top/bot rankings`: 3-5 item lệch nhất

Chỉ bias **lớn + consistent** mới đáng exploit. Bias 0.1% p<0.001 trên 10000 draws → significant thống kê, không exploit được thực tế.

### 1.4 Levels of analysis

**Rule bắt buộc** (học từ 3D): Test nhiều levels, không chỉ 1.

| Level | Matrix ví dụ | 3D ví dụ |
|-------|--------------|----------|
| **Whole** | Số 1-35 từng số | Số 000-999 |
| **Marginal** | Tần suất từng số | Digit từng vị trí |
| **Pair** | Cặp số đi chung | Cặp digit (d0,d1) |
| **Joint** | Toàn bộ ticket parity | Joint (d0,d1,d2) |
| **Temporal** | Stability qua windows | Serial correlation |

Whole-level PASS không có nghĩa "data random". Phải test đủ levels.

---

## 2. 5 Category of Tests

Mọi test rơi vào 1 trong 5 category. Khi thiết kế battery cho product mới, pick ≥2 test mỗi category:

| Category | Câu hỏi | Công cụ statistical |
|----------|---------|---------------------|
| **A. Uniformity** | Phân bố có đều không? | Chi² goodness-of-fit |
| **B. Independence** | Các vị trí/số có độc lập? | Chi² joint, Cramér's V |
| **C. Temporal** | Phân bố ổn định theo thời gian? | Chi² across windows, Pearson corr |
| **D. Sequential** | Có tương quan chuỗi không? | Autocorrelation, Runs test, Ljung-Box |
| **E. Structural** | Có pattern ngữ cảnh (parity, sum, gap)? | Chi² on derived features |

---

## 3. Matrix Battery (14 tests) — Áp Dụng Lotto 5/35

Đây là battery đã được validate trong [matrix/power535/deep_analysis.py](matrix/power535/deep_analysis.py). Reuse cho 6/55 và 6/45 với adjustment về pool size.

| # | Test | Category | H0 | Test Statistic | Interpretation pass Bonferroni |
|:-:|------|:--------:|-----|-----------------|-----------------|
| T1 | Chi² main pool uniform | A | Mỗi số xuất hiện đều | `chisquare(counts, expected)` | Có số hot/cold cấp marginal |
| T2 | Chi² bonus pool uniform | A | Bonus đều | `chisquare(counts_bonus)` | Bonus có bias (thường ít data → ít nhạy) |
| T3 | Pair co-occurrence | B | Cặp số độc lập | Chi² on C(N,2) pairs | Có cặp "dính" nhau |
| T4 | Bonus-main correlation | B | Bonus ⊥ main | Chi² joint | Bonus chọn phụ thuộc main |
| T5 | Gap distribution | E | Gap ~ geometric | KS test vs geometric | Số vắng lâu có pattern khác hình học |
| T6 | Sum distribution | E | Sum ~ normal | `normaltest` (D'Agostino) | Tổng ticket skewed |
| T7 | Parity balance | E | Odd/even ~ binomial | Chi² on Odd-count | Skew odd/even bị lệch |
| T8 | Low/high balance | E | Split ~ binomial | Chi² on Low-count | Lệch cao/thấp |
| T9 | Temporal window | C | Phân bố stable | Pearson corr giữa window freqs | Bias theo thời gian → cần adaptive |
| T10 | Serial correlation | D | `X_t ⊥ X_{t-1}` | Pearson corr của (sum_t, sum_{t+1}) | Draw liên tiếp có correlation |
| T11 | Odd-count distribution | E | Multinomial với P từ hypergeometric | Chi² | **★ Finding Chu kỳ 5** |
| T12 | Repeat analysis | D | Số lặp ~ hypergeometric | Test số trùng giữa draws liên tiếp | Số "lặp" nhiều/ít hơn expected |
| T13 | Runs test (sum sequence) | D | Sequence ngẫu nhiên | Wald-Wolfowitz runs | Có streak up/down |
| T14 | Ending digit / Mod-N | E | Mod M ~ uniform | Chi² | Pattern theo mod 5, mod 10 |

**Ví dụ áp dụng** (Lotto 5/35, 539 kỳ):
- 13/14 pass → "gần white noise"
- T11 p=0.0012 < 0.00357 → pass Bonferroni → Phase 2

**Lưu ý T11**: Bonferroni pass nhưng single-ticket không exploit được (chứng minh đại số — xem [RESEARCH_HISTORY.md Chu kỳ 5](RESEARCH_HISTORY.md#chu-kỳ-5)). Đây là lý do cần [EVALUATION.md §2.3](EVALUATION.md).

---

## 4. Digit Battery (13 tests) — Áp Dụng Max 3D / 3D Pro

Battery trong [3d/deep_analysis.py](3d/deep_analysis.py). Reuse cho 3D Pro với bonus cho reverse pairs.

| # | Test | Category | H0 | Notes |
|:-:|------|:--------:|-----|-------|
| D1 | Chi² whole number (000-999) | A | 1000 số đều | Thường PASS vì space lớn |
| D2 | Chi² per-digit (đơn, chục, trăm) | A | Mỗi digit 0-9 đều | **Dễ FAIL** — digit bias rõ nhất ở 3D |
| D3 | Digit independence | B | P(abc)=P(a)P(b)P(c) | **Dễ FAIL** — joint có dependency |
| D4 | Serial correlation | D | Draw liên tiếp ⊥ | — |
| D5 | Runs test | D | Sequence random | — |
| D6 | Digit sum distribution | E | Sum ~ discrete convolution | — |
| D7 | Tier analysis | C | Phân bố same cross-tier | KS test |
| D8 | Temporal window | C | Stable over time | — |
| D9 | Gap analysis | E | Gap ~ geometric | — |
| D10 | Conditional P(X | Y) | B | `P(X_t | Y_{t-1}) = P(X_t)` | Lift analysis |
| D11 | Ending digit | A | Digit cuối đều | Thường redundant với D2 |
| D12 | Repeat analysis | D | Số trùng giữa 2 draws ~ hyper | — |
| D13 | Draw sum | E | Sum of 20 numbers | — |

**Finding Chu kỳ 4** (Max 3D):
- D1 (whole) PASS p=0.12
- D2 (per-digit) **FAIL** p≈0 — digit 6 vượt +10% ở đơn vị
- D3 (joint) **FAIL** p<0.001 — positions dependent

Đây là bài học **quan trọng nhất** về test battery: **đừng dừng ở D1**. Nếu chỉ test whole-level, sẽ kết luận nhầm "white noise".

---

## 5. Tạo Battery Cho Product Mới — Recipe

Khi thêm sản phẩm mới (ví dụ Keno, Bingo):

1. **Determine structure**: matrix-like (chọn k từ N) hay digit-like (mỗi vị trí độc lập) hay hybrid.
2. **Pick ≥2 tests mỗi category** (§2). Tối thiểu 10, tối đa ~15 tests.
3. **Xác định H0 cho mỗi test** bằng công thức đóng (hypergeometric, multinomial, geometric).
4. **Ước lượng power**: với N draws và effect size X%, p_expected là bao nhiêu?
   - Rule of thumb: cần ≥200 samples per cell cho chi² reliable.
5. **Cố định battery trong code** (list), không cho phép thêm runtime.

**Template cho test function**:
```python
def test_X_description(df) -> dict[str, Any]:
    """Test X: [mục đích 1 dòng]. H0: [null]."""
    # ... computation
    chi2, p = stats.chisquare(observed, expected)
    return {
        "test": "identifier_snake_case",
        "category": "A/B/C/D/E",
        "statistic": float(chi2),
        "dof": int(...),
        "p_value": float(p),
        "significant_05": bool(p < 0.05),
        "significant_bonferroni": bool(p < 0.05 / N_TESTS),
        "effect_size": float(...),          # % deviation or Cramér's V
        "max_deviation_pct": float(...),
        "direction": "...",                 # human-readable
        "top_items": [...],                 # 3-5 items lệch nhất
        "interpretation": "..."             # 1 câu
    }
```

---

## 6. Phổ Biến Sai Lầm

### 6.1 Post-hoc extension

"Battery 13 tests PASS hết, thêm test thứ 14 và FAIL" → có thể là false positive. Nếu muốn thêm test, **phải chạy lại Bonferroni với n=14** và có thể test cũ không còn pass.

### 6.2 Dùng raw p = 0.05

Với 14 tests, xác suất ≥1 false positive ở α=0.05 là `1 - 0.95^14 ≈ 54%`. Bonferroni không optional.

### 6.3 Kết luận "bias" từ single test

Nếu T11 pass Bonferroni, vẫn cần:
- Visual check: histogram của odd-count có lệch rõ ràng?
- Replication: split data thành 2 halves, cả 2 có pass không?
- Cross-product: test tương tự trên 6/55 — có consistent không?

Chỉ claim "bias confirmed" khi replicate được.

### 6.4 Không check power

Sample size quá nhỏ → test không detect được bias thật (false negative). Với 538 draws × 5 số/kỳ = 2690 samples phân vào 35 cells → ~77/cell. Đủ cho chi² marginal, không đủ cho pair (35×34/2 = 595 cells → 4.5/cell → chi² unreliable).

**Rule**: ≥5 samples/cell. Nếu không đủ, merge cells hoặc skip test.

### 6.5 Multiple comparisons khi report top-K

"Top 5 số hot" báo cáo ngầm 5 tests. Nếu dùng để design strategy, effectively đã làm 5-way comparison → cần adjust.

---

## 7. Interpretation Flowchart

```
Battery chạy xong
    │
    ▼
Có test nào pass Bonferroni?
    │
    ├── KHÔNG → R1 gate: kết luận "white noise"
    │          → STOP, ghi HISTORY, không Phase 2
    │
    └── CÓ → Effect size có đáng kể không?
             │  (deviation > 5% hoặc Cramér's V > 0.1)
             │
             ├── KHÔNG → Bias tồn tại nhưng quá nhỏ
             │          để exploit → STOP
             │
             └── CÓ → Replication check:
                      split data, test lại
                      │
                      ├── Không replicate → false positive, STOP
                      │
                      └── Replicate → Algebra check (§1.4 METHODOLOGY):
                                      exploit được bằng single-ticket?
                                      │
                                      ├── Có → Phase 2 single-ticket
                                      │
                                      └── Không → Phase 2 multi-ticket
```

---

## 8. File Liên Quan

| File | Vai trò |
|------|---------|
| [matrix/power535/deep_analysis.py](matrix/power535/deep_analysis.py) | Reference impl matrix battery (14 tests) |
| [3d/deep_analysis.py](3d/deep_analysis.py) | Reference impl digit battery (13 tests) |
| [METHODOLOGY.md](METHODOLOGY.md) | Tầng trên: Phase 1 của pipeline |
| [EVALUATION.md](EVALUATION.md) | Tầng dưới: nếu Phase 1 detect bias → Phase 3 đánh giá exploit |

---

*Cập nhật: 2026-04-20 — Categorize 14 matrix tests + 13 digit tests vào 5 category, codify Bonferroni + effect size + replication.*

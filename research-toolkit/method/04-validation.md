# 04 — Giao thức Validation

> Validation tệ tạo ra niềm tin sai — tệ hơn không validation. File này quy định cách kiểm chứng tử tế.

## Nguyên tắc gốc

1. **Tách dữ liệu một lần duy nhất, sớm nhất có thể.** Test set không được "nhìn thấy" trong suốt nghiên cứu — chỉ ở phán quyết cuối cùng.
2. **Counterfactual rõ ràng.** "Tốt hơn cái gì?" Phải có baseline cụ thể, không phải so với "kỳ vọng cảm tính".
3. **Effect size + uncertainty, không chỉ p-value.** "Có ý nghĩa thống kê" không bằng "có giá trị thực hành".
4. **Robustness > Đẹp.** Một kết quả vừa phải nhưng robust đáng tin hơn kết quả ấn tượng nhưng nhạy cảm với mọi điều chỉnh nhỏ.

---

## 1. Tách dữ liệu (Data Split)

### Cho dữ liệu i.i.d. (cross-sectional)

```
Toàn bộ dữ liệu
├── 60% Train      → fit model, thử feature
├── 20% Validation → chọn hyperparameter, so sánh model
└── 20% Test       → chỉ chạy 1 LẦN ở cuối, không quay lại tinh chỉnh
```

### Cho dữ liệu time-series

**Không random shuffle**. Phải tôn trọng thứ tự thời gian:

```
Time →
[─── Train ───][── Val ──][── Test ──]
```

Hoặc walk-forward (tốt hơn cho long horizon):

```
Fold 1: [Train: t1..t100] → [Val: t101..t110]
Fold 2: [Train: t1..t110] → [Val: t111..t120]
Fold 3: [Train: t1..t120] → [Val: t121..t130]
...
```

### Quy tắc cứng

- **Test set chạm 1 lần.** Nếu bạn đã chạy test 2 lần, "test set" thực ra đã là "validation set" — bạn cần test set mới.
- **Preprocessing fit chỉ trên train.** Scaler, imputer, PCA, encoder đều fit trên train, transform trên val/test. Vi phạm là leakage trực tiếp.
- **Feature dùng dữ liệu future = leakage.** Kể cả "chuẩn hóa bằng mean toàn bộ" là leakage — mean toàn bộ chứa thông tin val/test.

---

## 2. Baseline phải có

Một con số đứng một mình không có ý nghĩa. Luôn so với:

| Baseline | Khi nào dùng |
|---|---|
| **Random** | Mọi bài predictive — kết quả phải vượt ngẫu nhiên có ý nghĩa |
| **Naive: dự đoán giá trị phổ biến nhất** | Bài classification/regression có baseline phổ biến |
| **Naive: dự đoán = giá trị kỳ trước** | Time-series — "tomorrow = today" thường khó beat |
| **Mô hình đơn giản** (logistic/linear, mean baseline) | Mọi mô hình phức tạp phải vượt mô hình đơn giản |
| **Status quo / hiện trạng** | Chiến lược thay thế phải vượt cách bạn đang làm |
| **Chuyên gia con người** | Khi áp dụng vào domain có expert |

Nếu chiến lược của bạn không vượt được Random hoặc Naive — bạn không có gì cả.

---

## 3. Multiple-Comparison Correction

Khi test N giả thuyết với α=0.05, kỳ vọng có 0.05×N lần "có ý nghĩa" thuần ngẫu nhiên.

### Bonferroni (bảo thủ, đơn giản)
α_corrected = 0.05 / N

Nếu test 20 chiến lược, mỗi chiến lược cần p < 0.0025 để đạt significance gia đình 0.05.

### Benjamini-Hochberg (FDR control, ít bảo thủ hơn)
Sắp xếp p-value tăng dần: p₁ ≤ p₂ ≤ ... ≤ pₙ. Tìm k lớn nhất sao cho pₖ ≤ (k/N) × α. Reject các giả thuyết 1..k.

### Quy tắc thực hành

- **Đếm trung thực** số test bạn đã chạy, kể cả các test "không công bố".
- Tinh chỉnh hyperparameter trên validation **cũng tính** là test multiple — đó là lý do cần test set tách riêng.
- Subgroup analysis ("hiệu quả với nhóm X") luôn cần correction nếu chưa pre-specify.

---

## 4. Permutation / Shuffle Test

Test mạnh nhất chống lại "mô hình thấy pattern trong noise":

1. Lấy dữ liệu thật, chạy mô hình → có metric M.
2. Shuffle ngẫu nhiên label (hoặc target). Chạy lại mô hình → có metric M'.
3. Lặp 1000 lần. Phân phối M' là phân phối null (mô hình "không nên thấy gì").
4. Nếu M nằm ở đuôi extreme của phân phối M' → tín hiệu thật.
5. Nếu M nằm trong phân phối M' → mô hình đang ăn noise.

Đặc biệt mạnh khi bạn không tin được parametric test (vì assumption không hợp).

---

## 5. Effect Size + Confidence Interval

**P-value đo bạn có chắc có hiệu ứng. Effect size đo hiệu ứng có đáng quan tâm.**

Một thuốc giảm huyết áp 0.1 mmHg với p = 0.001 là vô dụng lâm sàng dù "highly significant".

Luôn báo cáo:
- Effect size (Cohen's d, odds ratio, lift, %, hoặc unit gốc).
- Confidence interval 95% (CI).
- Practical significance threshold (đã định nghĩa ở Pha 1).

### Quy tắc CI

- CI rộng → cần thêm sample.
- CI chứa 0 (cho effect, không phải ratio) hoặc chứa 1 (cho ratio) → không reject null ở mức này.
- Báo cáo CI **luôn**, kể cả khi p < 0.05. CI nói lên độ chính xác, p chỉ nói có/không.

---

## 6. Backtesting (đặc thù chuỗi thời gian / chiến lược)

Áp dụng khi bạn test một chiến lược (đầu tư, recommendation, pricing) trên dữ liệu lịch sử.

### Checklist trước khi tin backtest

- [ ] **Lookahead bias**: mọi quyết định ở t chỉ dùng dữ liệu ≤ t-1 (gồm features, normalization, hyperparams).
- [ ] **Survivorship bias**: dataset có gồm các đối tượng đã "chết" (delisted, churned, removed)? Nếu không, kết quả overstate.
- [ ] **Selection bias**: làm sao bạn chọn universe (cổ phiếu, sản phẩm, user)? Chọn dựa trên đặc tính tương quan với outcome → bias.
- [ ] **Realistic friction**: chi phí giao dịch, slippage, market impact, tax, latency. Edge nhỏ thường biến mất khi cộng friction.
- [ ] **Capacity**: chiến lược có chạy với scale thật không? Hay chỉ work khi $1k mà fail khi $10M?
- [ ] **Out-of-sample**: kết quả trên data sau khi mô hình "đóng băng" có giống in-sample không?
- [ ] **Robustness**: thay đổi nhỏ (start date, hyperparam, universe) có làm kết quả đổi nhiều không? Nếu có → overfit.
- [ ] **Multiple comparison**: bạn đã thử bao nhiêu chiến lược trước khi đến cái này?
- [ ] **Regime dependence**: chiến lược có phụ thuộc một regime cụ thể (bull market, low volatility) không? Test trên các regime khác.

### Sanity check một dòng

Chạy chiến lược trên **dữ liệu shuffled**. Nếu vẫn cho lợi nhuận tương đương → phương pháp có bug, không phải edge.

---

## 7. Calibration (cho mô hình xác suất)

Mô hình bảo "70% xác suất X" — trong số các trường hợp dự đoán 70%, có thật sự ~70% xảy ra không?

**Reliability diagram**: chia predicted probability thành bins (0-10%, 10-20%, ..., 90-100%). Vẽ predicted vs. observed frequency. Đường lý tưởng là y=x.

Mô hình có thể có AUC tốt nhưng calibration tệ — vẫn phân loại đúng, nhưng xác suất "70%" thực ra là 90%. Khi cần ra quyết định dựa trên xác suất (Kelly criterion, expected value), calibration quan trọng hơn AUC.

---

## 8. Robustness Checks

Trước khi ship, chạy:

- **Sensitivity to start/end date** (cho time-series): tịnh tiến cửa sổ ±10% — kết quả còn giữ?
- **Sensitivity to hyperparameter**: ±20% mỗi hyperparam, kết quả thay đổi nhỏ?
- **Bootstrapped CI**: resample dữ liệu 1000 lần, distribution của metric trông sao?
- **Subset performance**: chiến lược hoạt động trên mọi subset hay chỉ một số?
- **Temporal stability**: chia thành các giai đoạn, kết quả trong mỗi giai đoạn?

Nếu kết quả nhạy với mọi tinh chỉnh nhỏ — không robust, không ship.

---

## 9. Khi sample nhỏ

Nhiều bài toán đời thực sample nhỏ (n < 30, đôi khi n = 1 chính bạn). Vẫn có cách validation:

- **Bayesian thinking**: prior + likelihood → posterior. Khi data ít, prior mạnh.
- **Confidence interval rộng**: chấp nhận CI rộng, ra quyết định trong điều kiện CI rộng.
- **Effect size lớn cần thiết**: sample nhỏ chỉ phát hiện được effect lớn. Nếu effect nhỏ, sample nhỏ không cho biết gì.
- **N-of-1 design**: cho self-experiment. Alternating periods (A-B-A-B), randomize order, blind nếu được.
- **Trung thực về uncertainty**: "Tôi thử trong 2 tuần và cảm thấy tốt hơn" không phải bằng chứng — chỉ là gợi ý điều đáng test kỹ hơn.

---

## 10. Báo cáo kết quả

Báo cáo trung thực gồm:

- **Effect size + CI** (chính)
- **P-value** (phụ, nếu phù hợp)
- **Số test đã chạy + correction**
- **Baselines comparison**
- **Robustness check results**
- **Failed strategies / dead-ends** (đặc biệt quan trọng)
- **Limitations** (sample size, generalizability, assumptions)

Không báo cáo "tỉa": đừng giấu chiến lược fail, đừng round-up p-value, đừng chỉ chọn time window đẹp nhất.

Nếu bạn báo cáo đầy đủ và kết quả vẫn convincing — đáng tin. Nếu phải giấu để convincing — không đáng tin.

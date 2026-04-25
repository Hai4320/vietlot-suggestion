# 03 — 12 cái bẫy nhận thức kinh điển

> Đây là danh sách kẻ thù. Mỗi mục: **tên → mô tả → ví dụ → cách kiểm tra mình có đang dính**.

Trước khi tin một kết quả của chính mình, đọc lại danh sách này và tự đối chiếu. Nó ngắn vì cô đặc, nhưng đủ phủ ~80% các sai lầm phổ biến nhất trong nghiên cứu thực nghiệm.

---

## 1. Gambler's Fallacy (Sai lầm con bạc)

**Mô tả**: Tin rằng các sự kiện độc lập phụ thuộc vào lịch sử. "Đã ra đỏ 5 lần, lần này phải đen."

**Ví dụ ngoài xổ số**:
- "Tháng này startup ra mắt fail nhiều, tháng sau chắc thuận lợi hơn."
- "Tôi xui mãi rồi, sắp đến lúc may mắn."
- "Cổ phiếu này giảm 5 phiên liên tiếp, sắp bật."

**Test mình có dính không**: Dữ liệu của bạn có thực sự i.i.d. không? Nếu có (xổ số, coin flip thực), thì lịch sử **không có** thông tin về tương lai. Nếu bạn nghĩ là có, hãy hỏi: cơ chế vật lý/causal nào tạo ra dependency đó?

---

## 2. Hot Hand Fallacy (Tay nóng)

**Mô tả**: Đối nghịch với #1 — tin rằng chuỗi thắng/thua sẽ tiếp tục. "Đang lên dây, bao tới luôn."

**Ví dụ**:
- "Số này ra 3 kỳ liên tiếp, chắc sẽ tiếp tục" (hot number).
- "Quỹ này 5 năm liền vượt thị trường, tôi tin manager."
- "Đội này thắng 8 trận, sẽ thắng tiếp."

**Test**: Streak thường là kết quả ngẫu nhiên. Tính xác suất một chuỗi như vậy xuất hiện thuần túy ngẫu nhiên — bạn sẽ ngạc nhiên là nó cao thế nào. Đặc biệt khi bạn quan sát hàng nghìn entity và chỉ chú ý đến entity có streak dài nhất (survivorship — xem #6).

---

## 3. Base Rate Neglect (Bỏ qua tần suất nền)

**Mô tả**: Coi xác suất cao trong test mà quên xác suất nền của hiện tượng. "Test ung thư dương tính 99% chính xác → tôi 99% bị ung thư" — sai nếu bệnh hiếm.

**Ví dụ**:
- "Mô hình dự đoán 99% chính xác cho fraud" — nhưng nếu fraud chỉ 0.1% giao dịch, thì 99% tổng vẫn có thể có precision rất thấp.
- "Phỏng vấn cảm thấy ứng viên này giỏi" — quên rằng pool đầu vào đã rất tốt, nên ngay cả ứng viên trung bình cũng "có vẻ giỏi".

**Test**: Áp dụng Bayes. P(A|B) = P(B|A) × P(A) / P(B). Đặc biệt khi A là sự kiện hiếm (P(A) thấp), kể cả test rất chính xác vẫn cho posterior thấp.

---

## 4. Survivorship Bias (Thiên kiến sống sót)

**Mô tả**: Nhìn vào đối tượng "sống sót" mà quên đối tượng đã rớt khỏi sample.

**Ví dụ**:
- "Các tỷ phú đều bỏ học → bỏ học sẽ thành tỷ phú" (quên hàng triệu người bỏ học không thành tỷ phú).
- "Chiến lược đầu tư này backtest 10 năm cho 30%/năm" — backtest trên các quỹ còn tồn tại. Quỹ phá sản đã bị xóa khỏi dataset.
- "Khách hàng còn lại của tôi đều khen sản phẩm" — bạn không nói chuyện với khách đã churn.

**Test**: Sample bạn dùng có loại trừ ai/cái gì không? "Nếu mất, ai/cái gì biến mất khỏi dữ liệu?" Tìm đúng đối tượng đó để bù vào.

---

## 5. Selection Bias (Thiên kiến lựa chọn)

**Mô tả**: Mẫu của bạn không đại diện cho tổng thể bạn quan tâm, vì cơ chế chọn mẫu tương quan với biến cần đo.

**Ví dụ**:
- Survey trên Twitter về thói quen đọc sách → người Twitter không đại diện dân số.
- "Bệnh nhân điều trị X hồi phục nhanh hơn" — nhưng bác sĩ chọn X cho ca nhẹ, Y cho ca nặng.
- A/B test tự chọn (opt-in beta users) — họ không giống user thường.

**Test**: Quá trình mẫu có thể tương quan với outcome không? Có nhóm nào không bao giờ vào sample không?

---

## 6. P-Hacking & Multiple Comparison

**Mô tả**: Test rất nhiều giả thuyết / tinh chỉnh rất nhiều, một số sẽ "có ý nghĩa" thuần túy ngẫu nhiên.

**Ví dụ**:
- Thử 20 chiến lược, công bố chiến lược "có p<0.05".
- Tinh chỉnh cutoff, threshold, feature 50 lần — phiên bản cuối "đẹp".
- Subgroup analysis: "Chiến lược này hiệu quả với phụ nữ 30-40 tuổi ở miền Bắc thứ Ba" — đã cắt thành rất nhiều subgroup.

**Test**: 
- Đếm bạn đã thử bao nhiêu phiên bản.
- Áp dụng Bonferroni: α_corrected = 0.05 / N (N = số test).
- Hoặc Benjamini-Hochberg cho FDR.
- Pre-register trước khi nhìn kết quả.

---

## 7. Look-Ahead Bias / Data Leakage

**Mô tả**: Mô hình "nhìn lén" thông tin tương lai mà nó sẽ không có khi deploy.

**Ví dụ**:
- Backtest dùng giá đóng cửa hôm nay để quyết định mua vào sáng nay.
- Feature engineering chuẩn hóa (mean, std) trên toàn bộ dataset trước khi split.
- Target leakage: feature thực ra được derive từ chính label (vd: "đã trả phí phạt" để dự đoán default).

**Test**:
- Mọi feature ở thời điểm t chỉ được dùng dữ liệu ≤ t-1.
- Fit preprocessing (scaler, imputer) chỉ trên train, transform trên val/test.
- Hỏi: feature này có thật sự available tại thời điểm prediction không?

---

## 8. Regression to the Mean (Quy tụ về trung bình)

**Mô tả**: Giá trị cực đoan có xu hướng vừa phải hơn ở lần đo sau. Dễ bị nhầm là "hiệu quả của can thiệp".

**Ví dụ**:
- "Cầu thủ xuất sắc kỳ này thường tệ hơn kỳ sau" → không phải vì áp lực, mà vì kỳ này họ đang cao hơn năng lực thực.
- "Sau khi mắng nhân viên kém, họ làm tốt hơn" → không phải vì mắng, mà vì kỳ trước họ đã ở đáy.
- "Liệu pháp X giúp bệnh nhân nặng nhất hồi phục nhiều nhất" → người ở cực nặng tự nhiên hồi phục về trung bình.

**Test**: Có control group (không can thiệp) tự nhiên hồi phục bao nhiêu? Pre-/post- không đủ — phải có counterfactual.

---

## 9. Simpson's Paradox

**Mô tả**: Xu hướng trên tổng thể có thể đảo ngược khi chia theo subgroup (hoặc ngược lại) do confounding.

**Ví dụ**:
- Trường A có rate nhập học (admit rate) thấp hơn trường B trên tổng — nhưng cao hơn trong mọi ngành. Nguyên nhân: A có nhiều thí sinh ở ngành cạnh tranh.
- Liệu pháp X hiệu quả hơn Y trên cả nam và nữ riêng — nhưng kém hơn trên tổng. Nguyên nhân: X được kê nhiều cho ca nặng hơn.

**Test**: Có biến confounder nào (Z) tương quan với cả treatment và outcome không? Stratify theo Z để xem direction có đổi không.

---

## 10. Texas Sharpshooter (Thợ săn Texas)

**Mô tả**: Bắn vào tường rồi vẽ vòng quanh các lỗ. Tìm pattern sau khi đã xem dữ liệu.

**Ví dụ**:
- "Số 13 và 27 cùng xuất hiện 3 lần liên tiếp — pattern!" — nhưng bạn không pre-specify cặp này.
- Cluster bệnh xung quanh nhà máy → có thể có thật, có thể là noise vì bạn vẽ "cluster" sau khi nhìn.
- "Stocks bắt đầu bằng chữ G performed best in Q3" — sau khi đã thử mọi tiêu chí cắt.

**Test**: Bạn có pre-specify pattern này không? Hay bạn tìm thấy nó sau khi nhìn? Nếu sau, cần out-of-sample test mới.

---

## 11. Goodhart's Law

**Mô tả**: "Khi metric trở thành mục tiêu, nó không còn là metric tốt."

**Ví dụ**:
- Đo nhân viên bằng số dòng code → code phồng ra.
- Đo backtest performance → tinh chỉnh đến khi metric đẹp, generalization tệ.
- KPI "thời gian xử lý ticket" → ticket bị đóng vội, mở lại sau.

**Test**: Metric của bạn còn align với mục tiêu thật không? Có cách nào "ăn gian" metric mà không tạo giá trị thật?

---

## 12. Confirmation Bias (Thiên kiến xác nhận)

**Mô tả**: Tìm/nhớ chọn lọc dữ liệu ủng hộ giả thuyết của mình.

**Ví dụ**:
- Đọc kết quả backtest, chú ý những lần thắng, lướt qua những lần thua.
- Hỏi user feedback theo cách dẫn dắt câu trả lời mong muốn.
- Khi giả thuyết trông yếu, tự nhiên thấy lý do "chưa hợp lý để test ngay bây giờ".

**Test**: Nếu giả thuyết bạn đang test là **NGƯỢC LẠI** với điều bạn muốn, bạn sẽ làm gì khác đi? Mỗi sự khác biệt = một dấu hiệu confirmation bias.

---

## Bonus: Bẫy đặc thù theo domain

Khi áp dụng vào lĩnh vực mới, bổ sung vào file này các bẫy đặc thù bạn gặp. Ví dụ từ Vietlott:

- **"Hot number" / "Due number"**: biến thể trực tiếp của #1 và #2.
- **"Pattern frequency"**: thực ra là #10 (sharpshooter) — bạn tìm pattern sau khi nhìn dữ liệu.
- **"Strategy outperformed in 6/10 backtest periods"**: thường là noise + multiple-comparison khi nhiều chiến lược được thử.
- **Backtest improvement không sống sót sau real-world friction** (chi phí giao dịch, taxes, slippage trong tài chính; hoặc chi phí thực hiện trong life experiments).

## Cách dùng danh sách

Trước khi tin một kết quả của bạn, **đi từng mục một** và viết một câu trả lời ngắn:

```
1. Gambler's fallacy — Áp dụng? □ Phản biện: ...
2. Hot hand — Áp dụng? □ Phản biện: ...
... 
12. Confirmation bias — Áp dụng? □ Phản biện: ...
```

Hơi mất công, nhưng nhanh hơn nhiều so với deploy một chiến lược sai.

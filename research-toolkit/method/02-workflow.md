# 02 — Quy trình 5 pha

> Quy trình này cố ý chậm hơn so với "lao vào code". Đó là tính năng, không phải bug. Hầu hết thời gian bạn tiết kiệm được bằng cách bỏ qua quy trình sẽ bị mất nhiều lần khi đuổi theo một edge không tồn tại.

## Tổng quan

```
[1. FRAME]  →  [2. HYPOTHESIZE]  →  [3. VALIDATE]  →  [4. ADVERSARIAL REVIEW]  →  [5. SHIP hoặc REFRAME]
                          ↑                                          │
                          └──────  loop khi reviewer reject  ←───────┘
```

Mỗi pha có **input**, **hành động**, **output**, và **tiêu chí dừng** rõ ràng.

---

## Pha 1 — FRAME (Đóng khung)

**Mục tiêu**: Trước khi viết một dòng code, biết chính xác bạn đang hỏi gì và bạn sẽ chấp nhận câu trả lời nào.

**Hành động**:
1. Viết câu hỏi nghiên cứu thành **một câu duy nhất**, đủ cụ thể để có thể sai.
   - ✗ "Mình muốn tìm hiểu xổ số có pattern không"
   - ✓ "Trong 500 lần quay gần nhất của Power 5/35, các số xuất hiện 30 ngày qua có xác suất xuất hiện kỳ tới cao hơn ngưỡng độ tin cậy 95% so với phân phối uniform không?"

2. Phân loại loại tuyên bố bạn sẽ đưa ra:
   - **Mô tả** (descriptive): "Đã quan sát được X" — rủi ro thấp.
   - **Suy luận** (inferential): "X tổng quát hóa thành Y" — rủi ro trung bình.
   - **Quy phạm** (prescriptive): "Vì X, nên làm Y" — rủi ro cao, cần burden of proof cao nhất.

3. Liệt kê **giả định ngầm** (assumption inventory). Tối thiểu trả lời:
   - Mẫu của bạn có đại diện cho tổng thể bạn quan tâm không?
   - Dữ liệu có i.i.d. không? Có stationary không?
   - Phân phối có giả định gì (normal, fat-tail, bounded)?
   - Quan hệ có thật sự độc lập, hay chỉ uncorrelated?

4. Định nghĩa **tiêu chí thành công** và **tiêu chí dừng** TRƯỚC khi xem dữ liệu:
   - Effect size tối thiểu để đáng quan tâm?
   - Sample size cần thiết?
   - Khi nào tôi tuyên bố "không có edge" và bỏ?

**Output**: File `charter.md` (xem [templates/charter.md](../templates/charter.md)) — pre-commit của bạn.

**Tiêu chí dừng pha**: Nếu bạn không thể trả lời "Nếu sai, tôi biết bằng cách nào?" — quay lại định nghĩa lại câu hỏi.

---

## Pha 2 — HYPOTHESIZE (Đưa ra giả thuyết)

**Mục tiêu**: Liệt kê các giả thuyết cạnh tranh, **trong đó luôn có null hypothesis**.

**Hành động**:
1. Liệt kê **tất cả** các giả thuyết khả dĩ — không chỉ giả thuyết bạn yêu thích.
   - H0 (null): không có edge / hiệu quả nào ngoài ngẫu nhiên.
   - H1, H2, …: các giả thuyết giải thích thay thế.

2. Với mỗi giả thuyết, viết một thẻ hypothesis (xem [templates/hypothesis.md](../templates/hypothesis.md)) có:
   - Phát biểu chính xác.
   - Dự đoán quan sát được nếu giả thuyết đúng.
   - Dự đoán quan sát được nếu giả thuyết SAI.
   - Test cụ thể, statistic cụ thể.

3. **Limit số giả thuyết bạn test cùng lúc**. Mỗi giả thuyết bạn thử là một "lần ném xúc xắc tìm noise". Nếu test 20 giả thuyết với α=0.05, kỳ vọng có 1 cái "có ý nghĩa" do thuần ngẫu nhiên.

4. **Pre-register**: cam kết sẽ test giả thuyết nào, bằng test gì, trước khi nhìn dữ liệu validation. Có thể đơn giản là một commit git có timestamp.

**Output**: 1-N thẻ giả thuyết, mỗi thẻ falsifiable.

**Tiêu chí dừng pha**: Mỗi thẻ phải trả lời được "kết quả nào sẽ làm tôi từ bỏ giả thuyết này?". Nếu không có câu trả lời, giả thuyết không khoa học — bỏ hoặc viết lại.

---

## Pha 3 — VALIDATE (Kiểm chứng)

**Mục tiêu**: Test giả thuyết nghiêm túc, không phải thân thiện.

**Hành động**: Áp dụng đầy đủ giao thức trong [04-validation.md](04-validation.md). Tóm lược các điểm sống còn:

1. **Train/Validation/Test split**: Một dataset chỉ được nhìn một lần, ở cuối.
2. **Time-aware splits** cho dữ liệu chuỗi thời gian — không random shuffle.
3. **Lookahead bias check**: dữ liệu future không được leak vào feature past.
4. **Multiple-comparison correction**: nếu test N giả thuyết, dùng Bonferroni hoặc Benjamini-Hochberg.
5. **Effect size + confidence interval**, không chỉ p-value.
6. **Permutation / shuffle test** làm baseline: kết quả của bạn so với khi label được xáo trộn ngẫu nhiên ra sao?
7. **Out-of-sample**: nếu validation và test set cho kết quả khác nhau nhiều, **tin test set**, không tin validation.

**Output**: Một báo cáo gồm:
- Hypothesis test → reject / fail-to-reject.
- Effect size + CI.
- Comparison với baseline ngẫu nhiên.
- Diagnostics (residual, calibration, robustness checks).

**Tiêu chí dừng pha**: Nếu kết quả không thỏa **tiêu chí thành công đã pre-commit ở Pha 1** — chuyển sang Pha 5 (REFRAME), không phải đi tinh chỉnh để vớt vát.

---

## Pha 4 — ADVERSARIAL REVIEW (Phản biện đối kháng)

**Mục tiêu**: Tìm cho được lỗi mà bạn không nhìn thấy.

**Hành động**:
1. Nhờ một người (hoặc một AI agent có prompt đối kháng — xem [agents/rigor-reviewer.md](../agents/rigor-reviewer.md)) review độc lập.
2. Người review phải:
   - **Không có động cơ** chia sẻ kết quả với bạn (không phải đồng nghiệp cùng dự án).
   - **Tiếp cận đầy đủ** dữ liệu, code, methodology.
   - **Mandate** là tìm lỗi, không phải xác nhận.

3. Nếu reviewer raise lỗi, có 3 phản ứng tốt:
   - **Sửa** và quay lại Pha 3 với sửa đó.
   - **Phản biện có dữ liệu** rằng lỗi không thật sự là lỗi (cần argue có cơ sở, không cảm tính).
   - **Chấp nhận** rằng kết luận yếu hơn bạn nghĩ → giảm scope tuyên bố.

4. Nếu reviewer pass, **vẫn** chạy thêm các sanity check sau:
   - Nếu bạn shuffle nhãn ngẫu nhiên, mô hình có còn "thấy" pattern không? (Nếu có → bug methodology)
   - Trên một subset hoàn toàn khác (khu vực địa lý khác, năm khác, demographic khác), có robust không?
   - Edge này có sống sót sau **chi phí thực tế**: phí giao dịch, thuế, slippage, friction?

**Output**: Review report (xem template trong [agents/rigor-reviewer.md](../agents/rigor-reviewer.md)). Ghi chú rõ những concern đã giải quyết và chưa giải quyết.

**Tiêu chí dừng pha**: Mọi critical error (theo định nghĩa của reviewer) đã được sửa hoặc accept với caveat rõ ràng.

---

## Pha 5 — SHIP hoặc REFRAME

Sau pha 4, bạn ở một trong ba tình trạng:

### A. Edge xác nhận → SHIP

- Triển khai chiến lược, **với scale nhỏ trước** (paper trading / pilot).
- Theo dõi performance live: edge có sống không, hay chỉ là validation set tốt?
- Pre-commit **kill criteria**: nếu live performance dưới ngưỡng X trong N ngày, dừng.
- Viết postmortem **kể cả khi thành công** — ghi lại điều gì đã làm tốt để lặp lại.

### B. Edge không xác nhận → REFRAME

Đây là kết quả phổ biến nhất, và **không phải thất bại**. Có 3 hướng pivot:

1. **Khám phá có cấu trúc**: từ "dự đoán đầu ra" → "hiểu hệ thống tốt hơn". Output là hiểu biết, không phải lợi thế.
2. **Coverage / đa dạng**: thay vì chọn 1 vé "đúng", chọn N vé phủ không gian tốt. Đây là Vietlott pivot — xem [case-study](../case-study/vietlott.md).
3. **Giải trí có ý thức**: thừa nhận đây là hoạt động không tạo edge, làm cho trải nghiệm/UX tốt hơn, đặt ngân sách rõ ràng.

Xem [05-reframing-pivot.md](05-reframing-pivot.md) chi tiết.

### C. Không kết luận được → SHELVE

- Sample size chưa đủ, dữ liệu chưa đủ tốt, hoặc câu hỏi sai. Viết status note ghi rõ blocker, archive.
- Đặt **trigger** để revisit: "Khi có thêm 1 năm dữ liệu, mở lại."

**Output cuối**: File postmortem (xem [templates/postmortem.md](../templates/postmortem.md)). Đây là tài sản giá trị nhất từ mỗi nghiên cứu.

---

## Anti-pattern phổ biến

| Anti-pattern | Triệu chứng | Cách tránh |
|---|---|---|
| **HARKing** (Hypothesizing After Results are Known) | "À, hóa ra tôi đang test giả thuyết Y" sau khi thấy kết quả | Pre-register ở Pha 1 |
| **Optional stopping** | Dừng nghiên cứu lúc kết quả "đẹp" | Tiêu chí dừng quyết định trước |
| **Garden of forking paths** | Mỗi quyết định nhỏ (cleanup, feature, threshold) làm nghiêng kết quả | Document mọi quyết định, sensitivity analysis |
| **Goodhart drift** | Metric ban đầu tốt, dần dần bạn tối ưu metric thay vì mục tiêu thật | Định kỳ quay lại "mục tiêu thật là gì?" |
| **Skip-the-review** | "Không cần review, tôi đã cẩn thận" | Pha 4 không phải tùy chọn |

## Nhịp thực hành

Trong thực tế, không phải mọi nghiên cứu cần đầy đủ 5 pha với cường độ cao. Cân nhắc theo rủi ro:

- **Rủi ro thấp** (thử nghiệm cá nhân vô hại): pha 1 + 3 + 5 ngắn gọn.
- **Rủi ro trung bình** (quyết định ảnh hưởng tài chính/sức khỏe cá nhân): đầy đủ 5 pha.
- **Rủi ro cao** (ảnh hưởng người khác, không thể đảo ngược): 5 pha với ít nhất 2 reviewer độc lập, có thể pre-registration công khai.

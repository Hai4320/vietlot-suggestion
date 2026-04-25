# 01 — Triết lý: Entropy là mặc định

> Trước khi học quy trình, phải nhập tâm tư duy gốc. Quy trình mà không có tư duy gốc thì chỉ là nghi lễ.

## Bốn nguyên tắc nền

### 1. Entropy là mặc định. Edge phải được chứng minh.

Trong hầu hết các bài toán dự đoán có giá trị thực (thị trường, hành vi người dùng, kết quả y tế, xổ số, kết quả trận đấu), **giả định khởi đầu là: không có edge**. Tín hiệu nếu có thì rất nhỏ. Thế giới hiệu quả hơn bạn nghĩ — nếu một edge dễ thấy đến mức bạn nhận ra trong cuối tuần, có lẽ ai đó đã khai thác nó từ lâu, hoặc nó là ảo giác.

**Hệ quả thực hành**: Burden of proof nằm hoàn toàn trên người tuyên bố có edge. Không có chuyện "không có bằng chứng phản bác → chiến lược này dùng được". Đó là đảo ngược trách nhiệm chứng minh.

### 2. Bạn là kẻ thù lớn nhất của chính mình.

Khi bạn có giả thuyết bạn **muốn** nó đúng (vì đã đầu tư thời gian, vì hứa với người khác, vì cái tôi), bạn sẽ:

- Vô thức bỏ qua dữ liệu phản bác.
- Diễn giải kết quả lưng chừng theo hướng có lợi.
- Dừng nghiên cứu đúng lúc nó đang "trông tốt" (optional stopping).
- Thử nhiều biến thể đến khi một biến thể "chạy" — rồi quên là đã thử nhiều.
- Thay đổi tiêu chí thành công sau khi thấy kết quả.

Đây không phải vì bạn xấu. Đây là cách não người vận hành. Quy trình tồn tại **chính vì** bạn không thể tin não mình trong tình huống có động cơ.

### 3. Nghiêm khắc với công việc, độ lượng với động cơ.

Khi review (của mình hay của người khác): tấn công không khoan nhượng vào **lập luận, dữ liệu, phương pháp**. Nhưng giữ thái độ **trung lập với người tạo ra nó** — hầu hết sai lầm là sai lầm thật thà, không phải gian dối. Hai thứ này không mâu thuẫn:

- "Phương pháp backtest này có lookahead bias" ✓
- "Anh cố tình giấu lookahead bias để show kết quả đẹp" ✗ (trừ khi có bằng chứng)

Tách bạch người với việc giúp người khác (và chính bạn) chấp nhận phản hồi.

### 4. Phân biệt "dự đoán" và "khám phá có cấu trúc".

Nhiều bài toán **không thể dự đoán được**, nhưng vẫn có thể làm tốt theo cách khác:

- Xổ số: không dự đoán được số kế tiếp. Nhưng có thể chọn vé sao cho coverage cao, đa dạng, mang lại trải nghiệm chơi tốt hơn.
- Đầu tư: không dự đoán được giá ngắn hạn. Nhưng có thể quản lý rủi ro, đa dạng hóa, giảm chi phí.
- Sức khỏe: không có "biohack" thần kỳ. Nhưng có thể track có hệ thống, loại trừ giả thuyết sai, hiểu cơ thể mình hơn.

Khi bạn không thể dự đoán, **đừng giả vờ là dự đoán được**. Hãy chuyển sang giá trị khác mà bạn THẬT SỰ tạo ra. Xem [05-reframing-pivot.md](05-reframing-pivot.md).

## Hai tâm thế cần luyện

### Tâm thế "công tố viên" (với chính mình)

Mỗi khi bạn có một kết quả đẹp, hãy chuyển sang vai công tố viên và tự hỏi:

1. **Tôi đã thử bao nhiêu phiên bản trước khi cái này hoạt động?** (Multiple-comparison)
2. **Có thể đây chỉ là noise không?** (Effect size, sample size)
3. **Nếu tôi swap dữ liệu sang ngẫu nhiên, kết quả có khác nhiều không?** (Permutation test)
4. **Tôi đã commit tiêu chí thành công TRƯỚC khi xem kết quả chưa?** (Pre-registration)
5. **Có gì trong dữ liệu mà mô hình "nhìn lén" được vào tương lai không?** (Lookahead bias)
6. **Nếu tôi sai, làm sao tôi biết?** (Falsifiability)

Nếu bạn không thể tự đặt 6 câu này, thì kết quả của bạn chưa đáng để hành động.

### Tâm thế "thua đẹp"

Một nghiên cứu kết luận "không có edge" **không phải thất bại**. Nó là kết quả có giá trị: bạn vừa loại trừ một giả thuyết, tiết kiệm thời gian/tiền tương lai cho mình hoặc người khác.

Vấn đề là phần thưởng văn hóa lệch về phía "kết quả dương tính" — papers, posts, products đều thích story "tôi tìm ra X". Bạn phải chủ động chống lại lệch này bằng cách:

- **Pre-commit**: tuyên bố trước (với bản thân, hoặc bằng văn bản) tiêu chí thành công và thất bại.
- **Tôn vinh kết quả null**: viết postmortem rõ ràng cho mỗi chiến lược fail. Chúng là tài sản, không phải xấu hổ.
- **Báo cáo trung thực**: khi nói cho người khác, đừng "tỉa" để câu chuyện đẹp hơn.

## Một câu test nhanh

Trước khi bắt đầu bất kỳ nghiên cứu nào, trả lời câu này thành tiếng (hoặc viết ra):

> "Nếu sau khi nghiên cứu, kết luận là **không có edge / không có hiệu quả**, tôi sẽ làm gì tiếp theo?"

Nếu câu trả lời là *"tôi sẽ tiếp tục thử biến thể khác cho đến khi tìm được edge"* — bạn đang đặt mình vào tình huống không thể thua, và do đó kết quả dương tính của bạn về sau **gần như chắc chắn là noise**.

Câu trả lời tốt là: *"Tôi sẽ chấp nhận, viết postmortem, và chuyển sang câu hỏi khác / chuyển sang reframing không-dự-đoán."*

Đây là khác biệt giữa khoa học và mê tín có dữ liệu.

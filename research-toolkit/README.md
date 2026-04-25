# Research Toolkit — Bộ skill nghiên cứu chuẩn hóa

Folder này đúc kết quy trình nghiên cứu đã trải qua trong dự án **vietlott-data** thành một bộ tài liệu/template có thể áp dụng lại cho **bất kỳ lĩnh vực nào** liên quan đến: dự đoán, ra quyết định dưới bất định, kiểm chứng giả thuyết, hay đánh giá một chiến lược trước khi đặt cược tiền/thời gian/uy tín vào nó.

## Khi nào dùng bộ này

Dùng khi bạn đang làm một việc có **bất kỳ một** trong các đặc điểm sau:

- Bạn có một **giả thuyết bạn muốn nó đúng** (ví dụ: "kiểu ngủ này tốt hơn", "chiến lược đầu tư này hiệu quả", "phương pháp học này nhanh hơn").
- Bạn dự định ra quyết định dựa trên dữ liệu lịch sử (backtest, A/B test cá nhân, thử nghiệm sản phẩm).
- Có **động cơ thương mại / cảm xúc** đẩy bạn về phía một kết luận cụ thể.
- Mức độ ngẫu nhiên cao, tín hiệu nhỏ, dễ "thấy" hoa văn không tồn tại.
- Sai lầm có hậu quả thực: tiền, sức khỏe, thời gian, danh tiếng.

Không cần dùng khi: việc đó hoàn toàn xác định, đã được kiểm chứng, hoặc rủi ro thấp đến mức "thử rồi biết" rẻ hơn nghiên cứu.

## Cấu trúc folder

```
research-toolkit/
├── README.md                    # File này
├── method/
│   ├── 01-philosophy.md         # Tư duy gốc — entropy là mặc định
│   ├── 02-workflow.md           # Quy trình 5 pha
│   ├── 03-fallacies.md          # 12 cái bẫy nhận thức kinh điển
│   ├── 04-validation.md         # Cách kiểm chứng tử tế
│   └── 05-reframing-pivot.md    # Khi dự đoán thất bại — chuyển hướng thế nào
├── templates/
│   ├── charter.md               # Mở dự án: câu hỏi + tiêu chí dừng
│   ├── hypothesis.md            # Thẻ test 1 giả thuyết
│   └── postmortem.md            # Khi 1 chiến lược fail
├── agents/
│   └── rigor-reviewer.md        # Agent reviewer chung (không gắn domain)
└── case-study/
    └── vietlott.md              # Hành trình thật của project này — ví dụ áp dụng
```

## Cách dùng nhanh

1. **Trước khi bắt đầu** một nghiên cứu: copy [templates/charter.md](templates/charter.md) → điền → cam kết tiêu chí dừng.
2. **Mỗi giả thuyết**: dùng [templates/hypothesis.md](templates/hypothesis.md), một thẻ một giả thuyết.
3. **Khi tự thấy mình đang muốn tin**: đọc lại [method/03-fallacies.md](method/03-fallacies.md), tự đối chiếu.
4. **Trước khi công bố / đưa vào sản xuất**: cho qua [agents/rigor-reviewer.md](agents/rigor-reviewer.md) — hoặc nhờ một người (hoặc Claude với prompt này) review.
5. **Khi một chiến lược fail**: viết [templates/postmortem.md](templates/postmortem.md). Đây là tài sản — không phải thất bại lãng phí.
6. **Khi bế tắc** ở "không thể dự đoán được": [method/05-reframing-pivot.md](method/05-reframing-pivot.md) hướng dẫn cách chuyển từ "dự đoán" sang "khám phá có cấu trúc / giải trí có ý thức / coverage" mà vẫn giữ giá trị.

## Triết lý 1 dòng

> **Mặc định là không có edge. Bạn phải chứng minh có. Nếu không chứng minh được, hãy trung thực về điều đó — và chuyển sang giá trị khác mà vẫn có thật.**

## Áp dụng vào đời sống

Bộ này được rút từ một bài toán xổ số (cực kỳ ngẫu nhiên, dễ tự lừa). Chính vì vậy nó áp dụng tốt cho:

- **Đầu tư cá nhân**: chiến lược trading, lựa chọn quỹ, timing thị trường.
- **Sức khỏe & lối sống**: thử nghiệm chế độ ăn/ngủ/tập, suy luận từ tracker cá nhân.
- **Sự nghiệp**: chọn nghề, chuyển hướng, đánh giá cơ hội startup.
- **Học tập**: phương pháp học, công cụ năng suất, "biohacking não".
- **Sản phẩm**: A/B test với mẫu nhỏ, retention, growth experiment.

Domain khác nhau, nhưng các bẫy nhận thức (gambler's fallacy, survivorship bias, p-hacking…) là **bất biến**.

## Sống với nó

Đây không phải tài liệu đọc một lần. Mỗi lần bạn:
- Hoàn thành một nghiên cứu → cập nhật `case-study/` với bài học mới.
- Phát hiện một loại bẫy chưa có trong `03-fallacies.md` → bổ sung.
- Tìm ra template tốt hơn → sửa template.

Bộ này càng dùng càng sắc.

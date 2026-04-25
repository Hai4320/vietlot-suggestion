# Research Charter — [Tên dự án]

> Điền template này TRƯỚC khi bắt đầu nghiên cứu. Mục đích là pre-commit để ngăn HARKing và optional stopping. Khi xong, lưu vào nơi có timestamp (commit git, hoặc file có ngày).

**Ngày tạo**: YYYY-MM-DD  
**Người tạo**: ...  
**Phiên bản**: 1 (mọi thay đổi sau đều ghi log ở dưới, không sửa lịch sử)

---

## 1. Câu hỏi nghiên cứu

> Một câu duy nhất, đủ cụ thể để có thể sai. Tránh từ mơ hồ ("tốt hơn", "có hiệu quả") — phải định nghĩa được "tốt hơn" bằng metric cụ thể.

```
[Viết câu hỏi ở đây]
```

## 2. Loại tuyên bố

Tích vào loại bạn sẽ đưa ra (ảnh hưởng burden of proof):

- [ ] **Mô tả** (descriptive): chỉ mô tả quan sát đã có. Burden thấp.
- [ ] **Suy luận** (inferential): tổng quát hóa ra ngoài sample. Burden trung bình.
- [ ] **Quy phạm** (prescriptive): khuyến nghị hành động. Burden cao nhất.

## 3. Động cơ — Tự thừa nhận

> Trung thực ghi: bạn **muốn** kết quả nào? Vì sao?

```
[Tôi muốn câu trả lời là ... vì ...]
```

> Ý thức được động cơ giúp phát hiện confirmation bias trong quá trình.

## 4. Giả thuyết và giả thuyết null

### H0 (null)
```
[Giả thuyết null — thường là "không có hiệu ứng / edge / khác biệt"]
```

### H1
```
[Giả thuyết chính bạn muốn test]
```

### Các giả thuyết thay thế (alternative explanations) cần loại trừ
- [ ] Giải thích thay thế 1: ...
- [ ] Giải thích thay thế 2: ...
- [ ] Confounder tiềm năng: ...

## 5. Giả định ngầm (Assumption Inventory)

> Liệt kê tất cả giả định. Mỗi giả định sai = một con đường để kết quả bị invalid.

- [ ] Mẫu đại diện cho: ...
- [ ] Dữ liệu i.i.d.? Lý do tin: ...
- [ ] Dữ liệu stationary? Lý do tin: ...
- [ ] Phân phối: ...
- [ ] Independence của events: ...
- [ ] Khác: ...

## 6. Dữ liệu

- **Nguồn**: ...
- **Sample size**: ...
- **Thời gian thu thập**: ...
- **Có loại trừ ai/cái gì khỏi sample không?** ... (cảnh giác survivorship bias)
- **Cách split train/val/test**: ...
- **Test set có "ngủ yên" cho đến cuối không?** [ ] Có

## 7. Phương pháp

- **Phương pháp/mô hình chính**: ...
- **Baseline comparison**: ... (random / naive / status quo / expert)
- **Test thống kê dùng**: ...
- **Multiple-comparison correction**: ...
- **Số giả thuyết tổng cộng sẽ test**: N = ...

## 8. Tiêu chí thành công (PRE-COMMIT)

> Đây là cam kết. Nếu sau nghiên cứu kết quả không đạt các tiêu chí này, gọi là không đạt và pivot.

- **Effect size tối thiểu để đáng quan tâm**: ...
- **Statistical significance threshold (sau correction)**: α = ...
- **CI rộng tối đa chấp nhận được**: ...
- **Robustness check phải pass**: ...
- **Out-of-sample performance phải ≥ ... so với baseline**

## 9. Tiêu chí dừng (Kill Criteria)

> Khi nào tôi BỎ giả thuyết và không cố gắng vớt vát?

- **Thời gian tối đa cho nghiên cứu này**: ...
- **Sample size tối đa trước khi bỏ**: ...
- **Nếu đến deadline mà chưa đạt tiêu chí thành công** → tuyên bố không đạt, không kéo dài.

## 10. Plan nếu không đạt (REFRAME)

> Pre-commit hướng pivot — buộc bản thân nghĩ trước khi cảm xúc nóng lên.

- [ ] **Hướng A — Khám phá có cấu trúc**: chuyển sang hiểu hệ thống. Output cụ thể: ...
- [ ] **Hướng B — Coverage**: chuyển sang đa dạng hóa. Metric mới: ...
- [ ] **Hướng C — Entertainment**: thừa nhận là hoạt động không-edge. Ngân sách: ...
- [ ] **Archive**: thua đẹp, viết postmortem, sang việc khác.

## 11. Rủi ro nếu sai

> Nếu kết luận sai và bị áp dụng, hậu quả gì?

- **Cho mình**: ...
- **Cho người khác**: ...
- **Mức rủi ro**: [ ] Thấp [ ] Trung bình [ ] Cao
- **Mitigation**: ...

## 12. Reviewer độc lập

- **Người/agent review**: ...
- **Mandate**: tìm lỗi (không phải xác nhận).
- **Có không có động cơ chia sẻ kết luận với tôi?** ...

## 13. Reproducibility

- [ ] Code có version control
- [ ] Random seed được fix (cho mỗi pha)
- [ ] Dữ liệu được lưu snapshot
- [ ] Hyperparam, threshold được log
- [ ] Bất kỳ ai khác có thể chạy lại từ raw data?

---

## Change Log

| Ngày | Phiên bản | Thay đổi | Lý do |
|---|---|---|---|
| YYYY-MM-DD | 1 | Tạo charter | - |

> **QUY TẮC**: Sửa charter sau khi đã thấy kết quả validation = HARKing. Nếu cần thay đổi phương pháp giữa chừng, ghi log với lý do **trước khi** xem kết quả mới.

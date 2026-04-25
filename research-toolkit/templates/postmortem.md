# Postmortem — [Tên chiến lược / nghiên cứu]

> Postmortem là tài sản, không phải sự xấu hổ. Mục đích: future-you (và người khác) không lặp lại sai lầm này, và biết tận dụng những gì đã làm tốt.

**Ngày**: YYYY-MM-DD  
**Người viết**: ...  
**Thời gian dự án**: ... → ...  
**Kết cục**: [ ] Edge xác nhận / [ ] Edge không xác nhận / [ ] Inconclusive / [ ] Pivot sang ... / [ ] Archive

---

## 1. Tóm tắt một đoạn

> Một đoạn 3-5 câu: làm gì, tìm gì, kết cục ra sao.

```
[Tóm tắt]
```

## 2. Giả thuyết ban đầu

> Quote nguyên văn từ charter / hypothesis card ban đầu.

```
[H1 ban đầu]
```

## 3. Đã làm gì

- Phương pháp: ...
- Dữ liệu: ...
- Số chiến lược / variant đã thử: ...
- Reviewer: ...
- Thời gian thực: ...

## 4. Kết quả

- Effect size: ... (CI: ...)
- Baseline so sánh: ...
- Robustness check: ...
- Out-of-sample: ...

## 5. Quyết định cuối

> Theo charter, kết quả này thuộc nhóm nào trong pre-commit kết luận? Và bạn đã chọn pivot/ship/archive nào?

```
[Quyết định + lý do]
```

## 6. Bài học — Cái gì đã làm ĐÚNG

> Ghi cả khi project fail. Có thể bạn đã: pre-commit tốt, không cheat, dừng đúng lúc, viết postmortem. Đây đáng để giữ.

- ...
- ...

## 7. Bài học — Cái gì đã làm SAI / SUÝT SAI

> Trung thực. Cảnh báo bản thân tương lai.

- **Sai về nhận thức**: ... (ví dụ: không nhận ra đó là gambler's fallacy biến thể)
- **Sai về phương pháp**: ... (ví dụ: lookahead bias trong feature X)
- **Sai về quyết định**: ... (ví dụ: kéo dài project sau kill criteria)
- **Sai về tâm lý**: ... (ví dụ: cố vớt vát vì sunk cost)

## 8. Bẫy đã dính

> Đối chiếu với [03-fallacies.md](../method/03-fallacies.md). Bẫy nào đã dính (suýt dính) ở project này?

- [ ] Gambler's fallacy
- [ ] Hot hand
- [ ] Base rate neglect
- [ ] Survivorship bias
- [ ] Selection bias
- [ ] P-hacking / multiple comparison
- [ ] Look-ahead bias / leakage
- [ ] Regression to the mean
- [ ] Simpson's paradox
- [ ] Texas sharpshooter
- [ ] Goodhart's law
- [ ] Confirmation bias
- [ ] Khác: ...

Cho mỗi bẫy đã tích, viết một đoạn ngắn: bẫy biểu hiện thế nào trong project này, và làm sao nhận ra.

## 9. Bẫy mới (chưa có trong list)

> Nếu phát hiện bẫy đặc thù domain — bổ sung vào [03-fallacies.md](../method/03-fallacies.md).

- ...

## 10. Tín hiệu cảnh báo sớm bị bỏ qua

> Có dấu hiệu nào ban đầu đã gợi ý project sẽ fail mà bạn đã bỏ qua? Đáng nhận biết sớm hơn lần sau.

- ...

## 11. Cải thiện toolkit

> Có gì trong toolkit này (template, methodology, fallacy list) đã không bắt được sai lầm? Đề xuất cải thiện cụ thể.

- File cần update: ...
- Đề xuất: ...

## 12. Tài sản tái sử dụng

> Output gì từ project này có thể tái sử dụng?

- Code module: ...
- Dataset / data pipeline: ...
- Insight (kể cả khi giả thuyết fail): ...
- Phương pháp đáng nhân rộng: ...

## 13. Câu hỏi mở / Future work

> Với những gì biết được, câu hỏi tiếp theo đáng theo đuổi là gì? (Có thể là none — đó cũng là kết luận hợp lệ.)

- ...

---

**Ký**: ...  
**Reviewed by**: ...

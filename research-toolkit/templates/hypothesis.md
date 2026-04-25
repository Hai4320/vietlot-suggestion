# Hypothesis Card — [Tên giả thuyết ngắn]

> Một thẻ một giả thuyết. Phải falsifiable: bạn phải biết được kết quả nào sẽ làm bạn từ bỏ.

**ID**: H_xxx  
**Ngày tạo**: YYYY-MM-DD  
**Liên kết charter**: [link]

---

## 1. Phát biểu giả thuyết

> Một câu, mệnh đề có thể đúng hoặc sai (không phải câu hỏi, không phải mong muốn).

```
[H1: ...]
```

**Null đối nghịch (H0)**:
```
[H0: ...]
```

## 2. Cơ sở

> Vì sao bạn đặt giả thuyết này? Cơ chế nào (vật lý, kinh tế, hành vi) khiến bạn nghi ngờ nó đúng?

```
[Lý do tin / không tin]
```

> Nếu lý do duy nhất là "tôi cảm thấy nó hoạt động" hoặc "trong N quan sát đầu tiên trông có pattern" — đây là giả thuyết yếu, hãy ghi nhận trước.

## 3. Dự đoán có thể quan sát

### Nếu giả thuyết ĐÚNG, tôi kỳ vọng quan sát:

- ...
- ...

### Nếu giả thuyết SAI, tôi kỳ vọng quan sát:

- ...
- ...

> Hai danh sách này phải khác nhau rõ ràng. Nếu cùng một quan sát phù hợp với cả hai — giả thuyết không falsifiable.

## 4. Test cụ thể

- **Statistic dùng**: ...
- **Phân phối null**: ...
- **Threshold để reject H0**: p < ... (sau correction nếu có)
- **Effect size tối thiểu để đáng quan tâm**: ...
- **Sample size cần (power analysis)**: ...

## 5. Confounders / Loại trừ

> Nếu kết quả "ủng hộ H1", còn cách giải thích nào khác?

- Confounder 1: ... → kiểm soát bằng: ...
- Confounder 2: ... → kiểm soát bằng: ...
- Reverse causation: ... → loại trừ bằng: ...
- Selection effect: ... → loại trừ bằng: ...

## 6. Pre-commit Result

> Trước khi nhìn dữ liệu validation/test, viết: bạn sẽ kết luận gì với mỗi outcome?

| Outcome | Kết luận |
|---|---|
| Reject H0, effect lớn, robust | ... |
| Reject H0, effect nhỏ | ... |
| Fail to reject H0 | ... |
| Inconclusive | ... |

## 7. Ghi chú khi chạy

> Cập nhật khi đã chạy. KHÔNG sửa các phần trên sau khi đã có kết quả.

- **Ngày chạy**: 
- **Kết quả thô**: 
- **Diagnostic checks pass?**: 
- **Kết luận** (theo bảng pre-commit): 
- **Bài học**: 

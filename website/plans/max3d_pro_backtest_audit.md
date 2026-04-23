# Audit: Max 3D Pro backtest scoring — reward-model correctness

**Status:** ⏳ Planned (for next research cycle — Chu kỳ 24+ or on-demand)
**Origin:** Discovered while implementing check-rate Phase 5 (2026-04-23).
**Severity:** 🔴 High — candidate UX-lie per [website/CLAUDE.md](../CLAUDE.md) ("Avoid UX lies").

---

## 1. Phát hiện

Khi tra quy chế Vietlott Max 3D Pro cho check-rate Phase 5, phát hiện rằng vé Max 3D Pro **khác căn bản Max 3D**:

| | Max 3D | Max 3D Pro |
|---|---|---|
| Vé | 1 bộ 3-digit | **2 bộ 3-digit (A, B) — có thứ tự** |
| Tier prize | 4 tier + KK 2 số cuối | **8 tier** |
| Điều kiện Jackpot | `ticket ∈ Đặc biệt list` | **`A=DB[0] AND B=DB[1]` (đúng thứ tự)** |
| Bonus tier | — | **Giải Phụ Đặc biệt = ngược thứ tự → 400M** |
| Edge case | — | **A=B → prizes 1–6 doubled, ĐB + Phụ ĐB gộp** |
| Prize range | 100K – 1M | **40K – 2,000,000,000** |

Chi tiết trong [plans/check_rate.md §3.5](check_rate.md) (post-Phase 5 update) + [research issue #13 đã resolve].

---

## 2. Hypothesis cần verify

**H1:** Backtest hiện có ([website/src/lib/backtest-data.ts](../src/lib/backtest-data.ts)) cho Max 3D Pro **đang dùng reward model của Max 3D** (per-number tier match), không phải 8-tier + order-sensitive của Max 3D Pro thực.

**H2:** Chu kỳ 22 composite rankings ([website/research/optimization/cycle22_rankings.json](../research/optimization/cycle22_rankings.json)) cho Max 3D Pro dựa trên scoring sai → các "pick" hiển thị trên UI (`🎯 Trúng cao nhất`, `💰 Lỗ ít nhất`, `⚖ Cân bằng`) có thể misleading.

**H3:** Các strategy được đánh giá cho 3D Pro (đặc biệt `coverageopt`, `pairexploiter`) **không tối ưu** cho prize math thật của 3D Pro, vì:
- `pairexploiter` khai thác non-independence giữa digits TRONG cùng 1 số 3-digit → unrelated đến việc pair A với B của vé 3D Pro.
- Tất cả strategy 3D hiện có output dạng unordered set → ORDER (yêu cầu bởi Đặc biệt) không được tối ưu.

---

## 3. Verification steps

### 3.1 Code audit (30 min)

Tìm xem backtest/scoring cho 3D Pro có branch riêng không:

```bash
grep -rn "3d_pro\|3D Pro\|p3d_pro" website/src/lib/ website/research/
grep -rn "prize\|payout\|winnings" website/src/lib/suggest-3d.ts
```

Kiểm:
- [ ] [website/src/lib/backtest-data.ts](../src/lib/backtest-data.ts) — có entries cho max-3d-pro slug không? Dùng prize model gì?
- [ ] [website/research/optimization/cycle22_rebacktest_3d.py](../research/optimization/cycle22_rebacktest_3d.py) — scoring function dùng tier-prize nào? Khớp với [src/vietlott/config/prize_tables.py `MAX_3D_PRO_TIERS`](../../src/vietlott/config/prize_tables.py) (post-Phase 5) không?
- [ ] Python research scripts trong `website/research/3d/` — tương tự, check reward model.

### 3.2 Data diff (1h)

Nếu code audit confirm dùng sai model:

1. Re-run backtest với **correct 8-tier + order + A=B doubling** (reuse [src/vietlott/check_rate/evaluators/p3d_pro.py](../../src/vietlott/check_rate/evaluators/p3d_pro.py) post-Phase 5 as source of truth).
2. So sánh rankings mới vs cũ:
   - Strategy ordering có thay đổi không? Top-pick vẫn là `pairexploiter`?
   - Win-rate / ROI numbers có đảo chiều không?
3. Export diff thành markdown report.

### 3.3 UX validation (30 min)

Dùng check-rate `/check-rate` với 3D Pro evaluator (Phase 5):
- Paste CSV từ `generate3DSuggestions(strategy=<current top pick>, count=50)` → pair adjacent → feed vào check-rate
- Xem ROI thực vs ROI claim trong SuggestionPanel + /algorithms page
- Flag mọi divergence ≥ 10 percentage points

---

## 4. Remediation (if hypothesis confirmed)

### Tier 1 — Data correctness

- [ ] Re-generate `cycle22_rankings.json` entries cho `max-3d-pro` với reward model đúng
- [ ] Update `backtest-data.ts` entries cho 3D Pro
- [ ] Re-run `make research-cycle22` để UI auto-sync

### Tier 2 — UX honesty

- [ ] Trên `/max-3d-pro` SuggestionPanel: hiển thị các số được sinh **dạng cặp (A, B)** thay vì flat list 6 số, kèm ghi chú "chọn thứ tự A→B để nhắm Giải Đặc biệt; đảo ngược để nhắm Phụ Đặc biệt"
- [ ] Thêm disclosure banner nếu strategy không có design riêng cho 3D Pro prize math ("Strategy này optimize cho Max 3D per-number tier; cho 3D Pro reward structure khác.")

### Tier 3 — Strategy design (research)

- [ ] Thiết kế 3D-Pro-native strategy:
  - Forward pair bias (tối đa hoá P(A=DB[0], B=DB[1]))
  - Forward + reverse hedge (chia đôi bet cho 2 thứ tự)
  - A=B doubling exploit (nếu P(duplicate trong Đặc biệt) > average)
- [ ] Register strategy mới trong `SuggestionStrategy` union
- [ ] Backtest riêng cho 3D Pro metric

---

## 5. Impact cần đo

Bao nhiêu user action dựa trên sai backtest?

- Số lần view `/max-3d-pro` trong 30 ngày qua (analytics nếu có)
- Strategy top-pick hiển thị cho 3D Pro hiện tại — nếu đảo sau audit, mức độ UX lie lớn

---

## 6. Không block

**Audit này KHÔNG block bất kỳ feature nào.** Check-rate Phase 5 chính là công cụ để user TỰ kiểm chứng prize math — độc lập với suggest rankings. Audit chỉ để đồng bộ lại rankings hiển thị trên product page + algorithms page với prize math thật.

---

## 7. References

- [plans/check_rate.md](check_rate.md) — Phase 5 spec gốc
- [src/vietlott/check_rate/evaluators/p3d_pro.py](../../src/vietlott/check_rate/evaluators/p3d_pro.py) — source of truth cho 8-tier evaluation (post-Phase 5)
- [src/vietlott/config/prize_tables.py `MAX_3D_PRO_TIERS`](../../src/vietlott/config/prize_tables.py) — canonical prize values
- Vietlott quy chế: https://vietlott.vn/vi/choi/max3dpro/gioi-thieu-san-pham-max3dpro

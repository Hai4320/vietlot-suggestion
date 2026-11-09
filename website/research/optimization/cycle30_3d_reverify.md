# Chu kỳ 30 — Kiểm chứng thuật toán + backtest lại Max 3D / Max 3D Pro (2026-11-09)

**Scripts**: [cycle30_3d_reverify.py](cycle30_3d_reverify.py) (ghi vé walk-forward) → [cycle30_3d_analysis.py](cycle30_3d_analysis.py) (phân tích)
**Kết quả**: [cycle30_3d_reverify.json](cycle30_3d_reverify.json) · protocol cũ trên dữ liệu đầy đủ: [cycle30_backtest_3d_newdata.json](cycle30_backtest_3d_newdata.json) + [cycle30_rankings_3d_newdata.json](cycle30_rankings_3d_newdata.json)
**Không ghi đè** `cycle22_backtest_3d.json` / `cycle22_rankings.json` (UI đang import trực tiếp).

## TL;DR

1. **C6 "vé A=B Max 3D Pro" (Accept duy nhất của dự án) là lỗi evaluator, không phải lợi thế.** Code coi vé (X,X) "trùng 2 trong 4 số giải Nhất" khi X ra **1 lần**, rồi nhân đôi → 60 triệu. Quy chế yêu cầu khớp **2 số quay thưởng** (X ra 2 lần). EV đúng của vé A=B = **5.363đ / vé 10.000đ (ROI −46,4%)**, bằng vé thường (5.345đ, −46,6%). Con số +4.183% chỉ tái hiện được bằng chính cách đọc sai. Kiểm chứng độc lập (agent review riêng) ra cùng số đến từng đồng.
2. **Không thuật toán 3D/3D Pro nào hơn Random.** Evaluator đúng quy chế + baseline Random chính xác + phương sai đúng + Holm: **0/16** có ý nghĩa, trên cả lịch sử đầy đủ (1105 / 752 kỳ) lẫn **out-of-sample thật** (86 / 87 kỳ sau mốc đóng băng).
3. **Quy trình chọn pick của Chu kỳ 22 không phân biệt được tín hiệu với nhiễu**: khi KHÔNG có tín hiệu nào (hoán vị nhãn), nó vẫn cho pick "verified" **84%** số lần; kiểm định z báo động giả **25–29%** (danh nghĩa 5%) với thuật toán tất định. Chạy lại đúng protocol cũ trên dữ liệu đầy đủ: Max 3D từ 3 picks → **null cả 3**, 3D Pro từ null → EVMaximizer (một trong các pick "ăn may" phổ biến nhất dưới H0).
4. **UI chạy sai thuật toán**: pick 🎯 Max 3D `pairexploiter` chạy tham số của biến thể T0.7 (Δ = −0,19pp, xếp gần cuối), không phải T0.5 mà số liệu bên cạnh mô tả.
5. **Công cụ check-rate trả thưởng sai**: Max 3D có giải "KK 2 số cuối" 100.000đ không tồn tại (thổi EV +33%); 3D Pro vé A=B trả 60 triệu thay vì 80.000đ.
6. Số liệu Chu kỳ 22 **tái lập chính xác** từ code (0 sai lệch / 1.632 giá trị) — vấn đề nằm ở evaluator + phương pháp, không phải ở việc chạy.

---

## 1. Dữ liệu

| | Kỳ | Hổng | Dataset Chu kỳ 22 | Out-of-sample thật |
|---|---|---|---|---|
| Max 3D | 1 → 1155 (đến 06/11/2026) | 0 | 1065 kỳ (≤ 1069, thiếu 978–981) | id ≥ 1070 (22/04/2026 →): **86 kỳ** |
| Max 3D Pro | 1 → 802 (đến 07/11/2026) | 0 | 711 kỳ (≤ 715, thiếu 624–627) | id ≥ 716 (21/04/2026 →): **87 kỳ** |

Mọi bản ghi có đúng 2/4/6/8 số 3 chữ số, id liên tục, đã sắp theo ngày. Các kỳ out-of-sample (OOS) chưa từng tham gia chọn thuật toán.

## 2. Tái lập

Tái tạo đúng dataset Chu kỳ 22 (n=1065/711, midpoint 532/355) và chạy lại 17 strategy × 5 run × 4 segment với cùng seed:

- `cycle22_backtest_3d.json`: **0 sai lệch / 816 giá trị mỗi sản phẩm** (exact rate, ROI, Sharpe, tier hits, p-value…).
- Picks trong `cycle22_rankings.json` tái lập y hệt.

→ Pipeline tất định, tái lập được. Mọi khác biệt dưới đây đến từ evaluator/phương pháp/dữ liệu mới, không phải do chạy lệch.

## 3. Evaluator so với quy chế

Nguồn: [vietlott.vn — Max 3D Pro](https://vietlott.vn/vi/choi/max3dpro/gioi-thieu-san-pham-max3dpro), [VOH 31/07/2026 — cơ cấu Max 3D](https://voh.com.vn/xo-so-vietlott/vietlott-max-3d-31-07-ket-qua-xo-so-vietlott-hom-nay-thu-6-31-07-2026-661708.html).

### 3.1 Max 3D

Quy chế: nhóm 2/4/6/8 số trả 1.000.000 / 350.000 / 210.000 / 100.000đ; *"trúng nhiều giải → lĩnh tổng"*; **không có giải theo 2 số cuối**.

| Evaluator | Sai khác | EV / vé 10.000đ |
|---|---|---|
| Quy chế (cộng dồn) | — | **5.460đ (−45,4%)** |
| `advanced_backtest.evaluate_prediction` (backtest) | dừng ở giải đầu tiên (`break`) | 5.430đ (−45,7%) — lệch nhỏ |
| `check_rate/p3d.py` + TS `check-rate/evaluators/p3d.ts` | thêm "KK 2 số cuối" 100.000đ (plan ghi *"placeholder… cần confirm"*) | 7.260đ (−27,4%) — **thổi +33%** |

### 3.2 Max 3D Pro và C6

Quy chế (nguyên văn): Nhất = *"Trùng bất kỳ 2 trong 4 bộ ba số quay thưởng giải Nhất"*; Tư = *"Trùng bất kỳ 2 bộ ba số quay thưởng…"*; Năm/Sáu = *"Trùng 1 bộ ba số quay thưởng…"*; *"Nếu … chọn hai bộ ba số giống nhau, giá trị giải thưởng sẽ cao gấp hai lần"*.

Vé A≠B: code đúng quy chế. Vé (X,X): `resolve_3d_pro` (Python, research port, TS) dùng `a in first_set and b in first_set` → **X có mặt 1 lần là đủ "2 trong 4"**. Ví dụ: vé (123,123), Nhất = [123, 456, 789, 012], 123 không ra ở đâu khác → code trả **60.000.000đ**; quy chế: khớp 1 số → Sáu ×2 = **80.000đ**.

EV chính xác (mô hình 20 vị trí độc lập, đều; liệt kê toàn bộ):

| Vé | EV / 10.000đ | ROI |
|---|---|---|
| A≠B | 5.345đ | −46,6% |
| **A=B theo quy chế** (X phải ra 2 lần; Năm/Sáu ×2) | **5.363đ** | **−46,4%** |
| A=B, biến thể bảo thủ (không Năm/Sáu) | 3.558đ | −64,4% |
| A=B theo code hiện tại (C6) | 428.328đ | **+4.183%** |

Vì sao cách đọc của code không thể đúng:
- Trái chữ "2 trong 4": một số quay thưởng bị đếm hai lần.
- Phép nhân đôi tồn tại để bù xác suất: (X,X) có C(n,2) cách khớp, A≠B có n(n−1) = 2·C(n,2) cách → ×2 làm **EV(A=B) = EV(A≠B)** (5.363 ≈ 5.345). Cách đọc của code biến nó thành tiền thưởng cộng thêm trên xác suất đã gấp hàng trăm lần.
- Là máy in tiền: theo code, mua đủ 1.000 vé (X,X) giá 10 triệu thì **kỳ nào cũng thu ≥ 368 triệu** (trung bình 425,8 triệu) trong cả 802 kỳ. Theo quy chế: trung bình 3,1 triệu, thấp nhất 1,84 triệu.
- "Theoretical EV +4180% khớp quan sát" của Chu kỳ 27–28 là vòng tròn: lý thuyết và backtest dùng cùng một hàm trả thưởng. N_RUNS=200, forward gate, đối chứng Power 5/35 đều không phát hiện được lỗi ở chính hàm này. "Xác nhận thực tế" chỉ gồm việc vietlott.vn nhận vé A=B — chưa có vé nào thử đúng tình huống X ra 1 lần.

**Kết luận: C6 bị bác bỏ.** Cách kiểm tra dứt điểm (nếu cần): hotline Vietlott, hoặc số người trúng giải Nhất từng kỳ 3D Pro mà Vietlott công bố (theo cách đọc của code, mọi vé (X,X) có X trong 4 số giải Nhất đều trúng Nhất → số người trúng sẽ lớn bất thường).

Phụ: quy chế ghi "trúng nhiều giải → lĩnh tổng"; code chỉ trả giải cao nhất. Ảnh hưởng EV ≤ +2,3%, không đổi kết luận nào.

## 4. Kiểm chứng phương pháp (Chu kỳ 22)

- **Đếm mẫu trùng lặp**: z-test dùng n = 5 run × số kỳ × 2 như mẫu độc lập, nhưng 5 run chơi lại cùng một chuỗi kỳ; thuật toán tất định cho 5 run giống hệt nhau. Đo dưới H0 (1.000 lần hoán vị nhãn): tỷ lệ p<0,05 = **25–29%** cho CoverageOpt, EVMaximizer, Portfolio, ULTIMATE_v1/v2; ≈ 5% cho thuật toán ngẫu nhiên.
- **Random mô phỏng bị nhiễu**: Random Max 3D Chu kỳ 22 = 1,852% so với giá trị đúng ≈ 1,98% (thiếu ~13 lượt trúng) → mọi Δ bị cộng thêm ~0,13pp.
- **Split-half "verify" không có sức phân biệt**: hai nửa là chính dữ liệu đã dùng để xếp hạng, chỉ xét dấu, được thử lại 3 lần. Hiệu chuẩn dưới H0: P(pick ≠ null) = **0,84** (Max 3D) / **0,84** (3D Pro); P(có strategy "Suggestive/Accept") = 0,43. Pick "ăn may" phổ biến nhất dưới H0: EVMaximizer, Portfolio, CoverageOpt — đúng các thuật toán tất định.
- **ROI 3D Pro không kiểm định được**: ~45% EV đến từ giải xác suất 2·10⁻⁶ (ĐB 2 tỷ, phụ ĐB) → ROI thực hiện điển hình ≈ −80% dù EV −46,5%; "ROI +13,8%" của TierWeighted đến từ đúng 1 vé giải Nhất (kỳ vọng 0,045 vé).

## 5. Backtest lại

### 5.1 Protocol cũ, dữ liệu đầy đủ (để so sánh)

| | Picks Chu kỳ 22 (dữ liệu tới 04/2026) | Picks khi chạy lại (dữ liệu đầy đủ) |
|---|---|---|
| Max 3D | PairExploiter_T0.5 / CoverageOpt / FreqWholeHot | **null / null / null** |
| Max 3D Pro | null | EVMaximizer ×3 (raw p=0,031, attempt 2) |

Kết quả lật hẳn chỉ sau ~90 kỳ — đúng như mục 4 dự báo.

### 5.2 Kiểm định đúng — toàn bộ lịch sử

Evaluator đúng quy chế (Max 3D cộng dồn, không KK; 3D Pro multiset). H0 = nhãn số hoán đổi được → với vé chọn từ quá khứ, P(trúng | kỳ i) = d_i/1000 chính xác (không cần mô phỏng Random). 5 run gộp theo kỳ, vé trùng → trọng số, phương sai rút không hoàn lại. Metric chính: tỷ lệ số dự đoán có mặt trong 20 số (Δ so với H0, điểm %).

**Max 3D** (1105 kỳ, H0 ≈ 1,98%):

| Strategy | Δ (pp) | KTC 95% | p | p Holm |
|---|---|---|---|---|
| Random (kiểm tra chéo) | −0,09 | [−0,35; +0,17] | 0,51 | — |
| D3 PairExploiter_T0.5 *(pick 🎯 cũ)* | +0,27 | [+0,01; +0,53] | 0,038 | **0,62** |
| D3 PairExploiter_T0.7 *(cái UI thực sự chạy)* | −0,19 | [−0,45; +0,07] | 0,16 | 1 |
| B1 CoverageOpt *(pick 💰 cũ)* | +0,19 | [−0,39; +0,77] | 0,52 | 1 |
| FreqWholeHot *(pick ⚖ cũ)* | +0,13 | [−0,15; +0,41] | 0,36 | 1 |
| 12 strategy còn lại | −0,12 … +0,19 | đều chứa 0 | ≥ 0,51 | 1 |

ROI: H0 = −45,4%; mọi strategy nằm trong nhiễu (Δ ROI từ −8,4 đến +9,3pp, p ≥ 0,13).

**Max 3D Pro** (752 kỳ, H0 ≈ 1,98% mỗi số): tốt nhất B3 StratifiedDigit +0,39pp (p=0,019, Holm 0,30), B2 TierWeighted +0,36pp (p=0,026, Holm 0,39), D1 EVMaximizer +0,61pp (p=0,089, Holm 1). **0/16 có ý nghĩa.** Random +0,08pp.

### 5.3 Out-of-sample thật (sau mốc đóng băng)

| Max 3D (86 kỳ) | Δ (pp) | KTC 95% | p |
|---|---|---|---|
| PairExploiter_T0.5 | +0,11 | [−0,82; +1,04] | 0,82 |
| CoverageOpt | +0,92 | [−1,16; +3,01] | 0,39 |
| FreqWholeHot | −0,01 | [−1,00; +0,98] | 0,99 |

3 pick đã ship không cho thấy lợi thế nào. Lưu ý trung thực: 86 kỳ chỉ phát hiện được hiệu ứng ≥ ~1,3pp (power 80%) nên OOS một mình không bác được hiệu ứng nhỏ cỡ +0,3pp — bằng chứng chính là mục 5.2 (đã không có ý nghĩa sau Holm).

3D Pro OOS (87 kỳ): 0/16 có ý nghĩa sau Holm. TierWeighted +1,12pp (p=0,017 chưa hiệu chỉnh, Holm 0,28) — trong 32 phép thử (2 sản phẩm × 16) có 1 giá trị p cỡ này là bình thường, và cùng thuật toán trên Max 3D cho Δ ≈ 0. Muốn kiểm chứng hiệu ứng cỡ +0,36pp cần ~900 kỳ mới (~6 năm). Kể cả nếu là thật, ROI chỉ từ ~−46% lên ~−43% (thêm ~330đ/vé, chủ yếu giải Sáu 40.000đ).

## 6. Bản port TS so với Python đã backtest

| UI | Research | Kết luận |
|---|---|---|
| `pairexploiter` (🎯 + mặc định Max 3D) | D3 PairExploiter_T0.5 | **Sai tham số**: TS hardcode `LB=300, TEMP=0.7` (`suggest-3d.ts:554-555`) = biến thể T0.7 |
| `coverageopt` (💰 Max 3D) | B1 CoverageOpt | Đúng (khác cách phá hoà; tất định → N bộ = N bộ giống nhau) |
| `frequency` (⚖ Max 3D) | FreqWholeHot | Gần đúng (khác phá hoà ở ngưỡng top-50) |
| `evmax` | D1 EVMaximizer | **Khác hẳn**: Python chọn tất định, TS lấy mẫu có trọng số từ top-80 |
| `ab_exploit` (cả 3 pick Max 3D Pro) | C6 | Port đúng — nhưng C6 sai (mục 3.2) |

Khác: nút "Vé A=B" hiện cả trên Max 3D (`SuggestionPanel.tsx:155-157` bỏ qua `productLimit`); bảng so sánh 3D Pro trên UI lấy số từ evaluator Max 3D (sai trò chơi).

## 7. Kết luận

- Max 3D và Max 3D Pro: **không có thuật toán chọn số nào được chứng minh hơn chọn ngẫu nhiên**; mọi cách chơi đều có EV ≈ −46% (3D Pro) / −45,4% (Max 3D).
- **C6 phải rút lại.** UI đang nói với người dùng vé A=B có lợi nhuận kỳ vọng dương (+4.180%) và "đã được xác nhận" — sai, có thể khiến người dùng mất tiền thật.
- Picks Max 3D hiện tại không đứng vững (protocol cũ trên dữ liệu đầy đủ cũng ra null) và pick 🎯 còn chạy sai tham số.

### Việc cần làm (chưa thực hiện — chờ quyết định)

1. **Gỡ C6 khỏi UI**: `SuggestionPanel.tsx` (picks Max 3D Pro → null), `C6DisclosureBanner`, `/research`, `/methods`, `/algorithms`, glossary, `cycle24_allocator` / `cycle24_portfolios.json`; cập nhật `RESEARCH_HISTORY.md` + `PROJECT_CLOSURE_REPORT.md` (Accept → bác bỏ).
2. **Picks Max 3D → null** (theo protocol cũ trên dữ liệu đầy đủ + kiểm định đúng), hoặc giữ nhưng sửa `pairexploiter` về (200, 0.5) và ghi rõ "không hơn ngẫu nhiên".
3. **Sửa evaluator check-rate** (Python + TS + test `test_p3d_pro.py:190-231`): 3D Pro A=B theo multiset; bỏ "KK 2 số cuối" khỏi Max 3D.
4. Phương pháp cho các chu kỳ sau: baseline Random chính xác, gộp run theo kỳ, Holm, và chỉ chấp nhận pick khi qua OOS đăng ký trước.

## 8. Chạy lại

```bash
uv sync --extra ml
.venv/bin/python website/research/optimization/cycle30_3d_reverify.py   # ~4 phút, 9 tiến trình → .cache/cycle30_3d_tickets.pkl
.venv/bin/python website/research/optimization/cycle30_3d_analysis.py   # ~35 giây (1000 mô phỏng hiệu chuẩn)
```

Script phân tích tự kiểm tra bảng tra vectorized với evaluator gốc (legacy, `check_rate/p3d.py`, `p3d_pro.py`, research port) trên ~170.000 vé/cặp (8.974 vé Max 3D + 160.750 cặp 3D Pro) trước khi tính.

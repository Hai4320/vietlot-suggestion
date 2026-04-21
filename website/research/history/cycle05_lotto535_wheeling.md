## Chu Kỳ 5 — Phase-B: Lotto 5/35 Deep Analysis & Wheeling (04/2026)

### Mục tiêu
Power 5/35 là outlier từ Chu kỳ 2 — nhiều AI strategies thua Random. Áp dụng framework từ Chu kỳ 4 (deep analysis + bias exploitation) nhưng cho matrix structure thay vì digit. Trigger: file `Random_Analysis_Agent.md` (system prompt Quant Cryptanalysis Agent) thúc đẩy approach nghiêm ngặt hơn với Bonferroni correction.

### Phương pháp

**Nhánh A** (đã chọn, thay vì Nhánh B incremental): tuân thủ nghiêm ngặt 5 bước Quant Agent:

1. **Bước 1 — Data ingestion**: Load 539 kỳ Lotto 5/35 (06/2025 – 04/2026)

2. **Bước 2 — 14-test Statistical Analysis** ([power535_deep_analysis.py](../matrix/power535/deep_analysis.py)):
   Thích nghi 13-test framework của 3D sang matrix structure (bỏ digit-level, thêm pair co-occurrence + bonus correlation). Bonferroni α = 0.05/14 = 0.00357.

3. **Bước 3 — Pattern modeling** (chỉ nếu p<0.05 tìm thấy):
   - Phase 2a: Single-ticket strategies mô phỏng empirical parity
   - Phase 2b: Multi-ticket wheeling strategies

4. **Bước 4 — Strict backtesting**: walk-forward, n_runs=3-5, min_history=100, seed=42

5. **Bước 5 — Final report**: markdown theo agent format, tuân thủ Ràng buộc #1 "no confirmation bias"

### Kết quả

**Phase 1 — Deep analysis**:
- **13/14 tests PASS** uniformity (p > 0.05) → data rất gần white noise
- **1 test FAIL** (qua Bonferroni): **T11 Parity odd-count** p=0.0012
  - Mode 0 odd: +84% over expected
  - Mode 3 odd: +13% over expected
  - Mode 5 odd: +41% over expected
  - Mode 2, 4 odd: under-represented -14%, -20%

**Phase 2a — Single-ticket parity (FAIL)**:
3 strategies mô phỏng empirical parity đều **không beat Random**. **Chứng minh toán học**:
```
E[match] = k·j/18 + (5-k)·(5-j)/17
Với k, j indep cùng dist → chỉ phụ thuộc E[k], không phụ thuộc Var[k].
Observed E[k]=2.544 ≈ uniform E[k]=2.571 → không edge.
```

**Phase 2b — Multi-ticket wheeling (INITIAL SUCCESS, LATER CORRECTED)**:

⚠️ **Correction 2026-04-20**: Kết quả "p=0.011" ban đầu tính trên n=510 evaluations (do bug dedup `dates.unique()` trong `walk_forward_multi` bỏ qua 50% data vì Power 5/35 có 2 draws/day). Sau khi fix bug (iterate per-row), kết quả thật:

| Strategy (N=20, n=1317) | P(any≥3)% | Δ vs Random | p_raw | Decision |
|-----------------|----------:|------------:|------:|:--------:|
| ★MinDistanceWheel | 26.80 | +2.66pp | 0.118 | Reject |
| 🔬 HybridParityDiv | 25.89 | +1.75pp | 0.301 | **Reject** |
| ★ParityStratWheel | 25.06 | +0.91pp | 0.587 | Reject |
| RandomN | 24.15 | baseline | — | — |
| GreedyCover3if3_v12 | 19.67 | −4.48pp | 0.005 | Reject (harmful) |
| GreedyCover3if3_parity | 17.31 | −6.83pp | <0.001 | Reject (harmful) |

**Kết luận sau correction**: HybridParityDiv **KHÔNG** có edge thống kê ý nghĩa. Claim "first matrix strategy with p<0.05" rút lại. Negative strategies (Greedy) vẫn significant worse than random — confirming coverage optimization on small hot pool harmful.

**Kết quả ban đầu (giữ lại để tham khảo quy trình) — PRE-CORRECTION**:

| Strategy (N=20, n=510 buggy) | P(any≥3)% | Δ vs Random | p-value (buggy) |
|-----------------|----------:|------------:|--------:|
| 🔬 HybridParityDiv | 27.65 | +4.31pp | 0.011 |
| ★ParityStratWheel | 25.69 | +2.36pp | 0.08 |
| RandomN | 23.33 | baseline | — |
| MinDistanceWheel | 22.16 | −1.17pp | — |
| GreedyCover3if3 | 17.45 | −5.88pp | — |

### Bài học

- 🎯 **Statistical significance ≠ exploitability** — T11 p=0.0012 không đủ single-ticket (đã chứng minh toán học). Multi-ticket cũng không đủ — wheeling strategies đều Reject sau khi fix sample size.

- 🎯 **Sample-size bug khai lộ tầm quan trọng của significance test chuẩn** — kết quả ban đầu "p=0.011" dựa trên n=510 thay vì 1317 thật. Sau correction: p=0.301. Đây là **bài học critical**: mọi claim p-value phải có n minh bạch, verify được. Đã codify vào [EVALUATION.md §4](../EVALUATION.md) (yêu cầu schema có `strategy_n`, `baseline_n`).

- 🎯 **Covering Design kém hơn random** — GreedyCover3if3 −4.48 đến −6.83pp (p<0.01, significant). Lý do: pool top-12 hot numbers quá hẹp, khi draw rơi ngoài pool (rất thường) không vé nào win. Đây là negative result **có ý nghĩa thống kê**.

- 🎯 **Ràng buộc #1 Quant Agent (no confirmation bias) có giá trị** — Phase 1 deep analysis đúng: T11 bias tồn tại. Nhưng Phase 3 không khai thác được. Không extend battery post-hoc tìm thêm bias.

- 🎯 **ROI luôn âm (~−91%)** — kể cả nếu edge tồn tại, giá trị giải 3 (50k) quá nhỏ so với cost 200k/20 vé.

### Artifacts

- [matrix/power535/deep_analysis.py](../matrix/power535/deep_analysis.py) + [.json](../matrix/power535/deep_analysis.json)
- [matrix/power535/parity_backtest.py](../matrix/power535/parity_backtest.py) + [.json](../matrix/power535/parity_backtest_results.json)
- [matrix/power535/wheeling_backtest.py](../matrix/power535/wheeling_backtest.py) + [.json](../matrix/power535/wheeling_backtest_results.json)
- Port TypeScript: [`generateHybridParityDiv`](../src/lib/suggest-matrix.ts) trong `src/lib/suggest-matrix.ts`
- Website integration: auto-bump N=20 cho Power 5/35, warning khi N<10, BacktestCard footnote
- Documentation: §6.3.1 trong [RESEARCH_DOCUMENTATION.md](../RESEARCH_DOCUMENTATION.md)

### Impact

- **Negative result có giá trị**: không có strategy nào (bao gồm HybridParityDiv) đủ p<0.05 sau khi fix sample size. Confirm Lotto 5/35 là khó khai thác — bias T11 tồn tại nhưng không translate thành edge exploitable.
- Chứng minh framework 14-test của `TESTING.md` generalizable ngoài 3D — vẫn detect được bias thật (T11 p=0.0012).
- **Critical process lesson**: bug data-dedup tồn tại ~1 năm không bị phát hiện vì không có significance test enforce correct n. Đã codify schema bắt buộc trong [EVALUATION.md §4](../EVALUATION.md) và wire z-test vào toàn bộ backtest scripts (2026-04-20).
- Điểm tham chiếu: mọi future claim edge phải kèm **z-test + p-value + n minh bạch + decision state** (Accept/Suggestive/Inconclusive/Reject).

---

## Nguyên Tắc Vận Hành

Rút ra từ 5 chu kỳ. **Đã được chuẩn hóa thành canonical methodology** — xem [METHODOLOGY.md §1](../METHODOLOGY.md) cho chi tiết và binding rules.

Tóm tắt ngắn:

1. Backtest ≥ 3 runs, preferred 5 → §1 METHODOLOGY
2. Random baseline bắt buộc → §1.3 METHODOLOGY
3. Cross-product validation bắt buộc → §2 Phase 3 METHODOLOGY
4. Significance test trên mọi claim Δ → §3.2 METHODOLOGY + [EVALUATION §3](../EVALUATION.md)
5. Bonferroni khi multi-test → [TESTING §1.2](../TESTING.md)
6. "Simple beats complex" là prior → §1.5 METHODOLOGY
7. Algebra check trước backtest → §1.4 METHODOLOGY
8. White noise là kết quả hợp lệ (R1 gate) → §1.1 METHODOLOGY

**Các principle mới thêm sau Chu kỳ 5** (không có ở danh sách 8 gốc):

9. **Pre-registration hypothesis** — ghi vào HISTORY *trước* khi implement, chống HARKing → §3.1 METHODOLOGY
10. **Decision rule 4 trạng thái** — Accept / Suggestive / Inconclusive / Reject thay cho binary → [EVALUATION §6](../EVALUATION.md)

---

## Định Hướng Tương Lai (chưa ưu tiên)

- **Power 6/55 & Mega 6/45 wheeling**: nếu có bias parity/structural tương tự 5/35 → áp dụng HybridParityDiv tương tự
- **Online learning**: cập nhật posterior real-time khi có draw mới (thay vì full re-fit)
- **Multi-product ensemble**: cross-strategy vote cho diversity ở tier giải cao
- **Risk-adjusted ROI**: Sharpe-optimal ticket sizing thay vì max match rate

---

---

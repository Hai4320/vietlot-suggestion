## Chu Kỳ 9 — Pre-Registration: Mega 6/45 ExpDecay_Cold Split-Half Replication (04/2026)

> **Trạng thái**: Pre-registered 2026-04-20. Hypothesis + decision rule ghi **trước** khi chạy để chống HARKing (§3.1 METHODOLOGY). Kết quả sẽ append vào sau — không sửa hypothesis.

### Bối cảnh

Sau Chu kỳ 7–8, **chỉ còn 1 Suggestive candidate duy nhất** trên toàn project: `ExpDecay_Cold(half_life=90)` trên Mega 6/45 (Chu kỳ 6, full-sample p=0.0044, Δ Win%=+1.03pp: 2.91% vs 1.89%).

Chu kỳ 7 đã chứng minh **split-half replication là gate hiệu quả** để loại noise pretending to be signal — 2/2 near-miss 3D candidates fail replication. Cùng gate áp dụng cho candidate Suggestive mạnh nhất còn lại.

Nếu pass replication → candidate đầu tiên của project đạt ngưỡng Accept. Nếu fail → confirm "no exploitable edge" across all products tested, khép lại project research line hiện tại.

### Power analysis tiền-cycle (Chu kỳ 8 new principle)

Áp dụng formula variable-baseline từ Chu kỳ 8:
`n_required ≈ (z_α + z_β)² × [p_s(1-p_s) + p_b(1-p_b)] / δ²`

Với `p_s=2.91%`, `p_b=1.89%`, `δ=1.02pp`, α=0.05, power=80% → **n_required ≈ 3530 trials/half**.

| n_runs | Half-1 trials (draws 100–651) | Half-2 trials (draws 651–1302) | Adequate? |
|:-:|:-:|:-:|:-:|
| 5 | 2755 | 3255 | Marginal (~72% power) |
| **7** | **3857** | **4557** | **Yes (~82% power)** |
| 10 | 5510 | 6510 | Yes (higher) |

**Chọn n_runs=7** để đạt ≥80% power ở observed effect size. Nếu true effect size shrink <0.8pp (regression-to-mean sau replication), power insufficient — acknowledged limitation, outcome sẽ vào Inconclusive/Reject zone thay vì Accept.

### Hypothesis (pre-registered)

**H1 — Mega 6/45 + ExpDecay_Cold(half_life=90)**:
- Predicted `win_rate_ge3 > Random baseline` trên **cả 2 halves** (time-ordered split tại index `N // 2 = 651`).
- Mechanism giả định: cold-number weighting (exp decay ngược) khai thác **regression-to-mean** ở Mega 6/45 — số ít xuất hiện gần đây có xu hướng quay lại. Không phải digit bias (matrix product, không có digit structure).
- Expected effect size: Δ ≥ +0.5pp trên **cả** hai half, giữ direction từ full-sample Δ=+1.03pp. Cho phép shrinkage do regression-to-mean, nhưng direction phải consistent.

### Methodology

**Split**: Time-ordered tại index `N // 2 = 651` (không random shuffle — preserve walk-forward semantics).
- Half 1: predictions on draws `[100, 651)` với `train = draws[:i]` for each i. 551 draws × n_runs=7 = **3857 trials**.
- Half 2: predictions on draws `[651, 1302)` với `train = draws[:i]` (includes half-1 history — standard walk-forward). 651 draws × n_runs=7 = **4557 trials**.

**Backtest params**: n_runs=7, seed=42 (reset per strategy per half).

**Strategies run**: `Random` (baseline) + `ExpDecay_Cold(90)` — chỉ 2 strategies để tránh multiple-testing inflation. Mỗi half có z-test vs Random **của cùng half** (variable-baseline lesson từ Chu kỳ 8).

**Bonferroni K=1** (chỉ 1 hypothesis) → α_strict = 0.05 per half.

### Decision rule (binding — set trước khi thấy kết quả)

| Half 1 p_raw | Half 2 p_raw | Direction | Decision |
|:-:|:-:|:-:|:-:|
| < 0.025 | < 0.025 | Δ > 0 cả hai | **Accept** (robust replication, pass Bonferroni-equivalent cross-half) |
| < 0.05 | < 0.05 | Δ > 0 cả hai | **Suggestive** (consistent weak signal) |
| < 0.05 một half, ≥ 0.05 half kia | — | Δ > 0 cả hai | **Inconclusive** (directional consistency only) |
| Còn lại (bao gồm Δ ≤ 0 ở ≥1 half) | — | — | **Reject** |

### Artifacts kỳ vọng

- `matrix/mega645/cycle9_replication.py` — split-half backtest script
- `matrix/mega645/cycle9_replication_results.json` — per-half significance + replication decision
- Section "Chu Kỳ 9 — Result" append vào file này

### Follow-up (conditional on outcome)

- **Accept**: Port TypeScript, update website rankings, ghi principle #11 "split-half replication mandatory for Suggestive → Accept" vào METHODOLOGY.md §3.
- **Suggestive / Inconclusive**: Defer Accept — cân nhắc chờ data thêm (>200 draws) hoặc test variant `half_life ∈ {60, 120}` để kiểm tra sensitivity.
- **Reject**: Document lessons — close research line hiện tại, ghi vào "Định hướng tương lai" các path khả thi (online learning, cross-product ensemble, risk-adjusted sizing).

Bất kể outcome: update METHODOLOGY.md để codify (a) principle #11 split-half gate, (b) variable-baseline power-analysis gate từ Chu kỳ 8.

### Result — Chu Kỳ 9 (2026-04-20, cùng ngày pre-registration)

**Replication = REJECT** theo decision rule pre-registered. **Direction flip** — half 1 Δ âm, half 2 Δ dương. Không đạt điều kiện "both delta > 0" → tự động Reject bất kể p-value.

**H1 — Mega 6/45 + ExpDecay_Cold(half_life=90)**:

| Half | Strategy wins/n | Strategy% | Random wins/n | Random% | Δpp | p_raw | CI95 (pp) | Within-half |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Half 1 (draws 100–651) | 90/3857 | 2.333 | 100/3857 | 2.593 | **−0.259** | 0.463 | [−0.959, +0.437] | Reject |
| Half 2 (draws 651–1302) | 108/4557 | 2.370 | 91/4557 | 1.997 | **+0.373** | 0.223 | [−0.230, +0.980] | Reject |

**Replication decision**: **Reject** — direction inconsistent (`delta_half1=−0.259pp, delta_half2=+0.373pp`).

### Bài học

- 🎯 **Full-sample p=0.0044 hoàn toàn là noise** — khi pool cả 2 halves (3857+4557=8414 trials), tổng `wins_ge3=198, Random=191` chỉ giảm nhẹ Δ từ full-sample (~+1.03pp) xuống còn +0.07pp-pool. **Full-sample p-value bị inflate bởi pooling không cân bằng**: hầu hết signal ở half 2 (Random baseline happened to be low ở half 2 = 2.00% vs half 1 = 2.59%). Khi chia đôi, signal biến mất. Đây là classic **pooling artifact** — có thể xảy ra bất cứ khi nào baseline không stationary qua thời gian (xem Chu kỳ 8 "variable baseline" lesson).

- 🎯 **Direction flip là signature của no-edge** — tương tự Chu kỳ 7 EVMaximizer (half-1 p=0.0007 → half-2 p=0.865 direction-flip), ExpDecay_Cold half-1 −0.26pp → half-2 +0.37pp. Khi true edge = 0 và sample size đủ lớn, fluctuations 2 halves độc lập → P(same direction) = 50%. Quan sát flip ~1/2 cases là không bất ngờ cho noise strategies.

- 🎯 **Split-half replication là gate bắt buộc cho mọi Suggestive claim** — chứng minh lần 3 liên tiếp (Chu kỳ 7 H1 + H2, Chu kỳ 9 H1 = 3/3 candidates Reject sau replication). Principle #11 giờ có **3 pieces of evidence** — codify thành requirement trong METHODOLOGY.md.

- 🎯 **Walk-forward với growing train có subtle behavior** — Half 2 strategy có MORE training data (1300 draws thay vì 650), nhưng Δ trở nên tích cực hơn. Nếu ExpDecay_Cold exploit regression-to-mean thực sự, signal phải STRONGER ở half 2 (more data = better estimate). Thay vào đó Δ nhỏ (+0.37pp, p=0.22) và CI chứa 0. Confirm: **không có edge thật, chỉ là coincidental fluctuation**.

- 🎯 **Variable-baseline lesson từ Chu kỳ 8 xác nhận**: Random half 1 = 2.59% vs Random half 2 = 2.00% — ±0.30pp drift just in baseline. Effect size của strategy (<0.5pp) không detect được khi baseline chính nó noisy ở cùng scale.

### Artifacts

- [matrix/mega645/cycle9_replication.py](../matrix/mega645/cycle9_replication.py) — split-half backtest script
- [matrix/mega645/cycle9_replication_results.json](../matrix/mega645/cycle9_replication_results.json) — per-half significance + replication decision
- [matrix/mega645/cycle9_replication_output.log](../matrix/mega645/cycle9_replication_output.log) — run log

### Impact

1. **Candidate Suggestive cuối cùng của project bị Reject** — sau Chu kỳ 7–9, **không còn strategy nào đạt Accept hoặc Suggestive** trên bất kỳ sản phẩm nào:
   - Power 6/55: Reject (từ Chu kỳ 6)
   - Mega 6/45: Reject (từ Chu kỳ 9, trước đó Suggestive trên full-sample)
   - Lotto 5/35: Reject (từ Chu kỳ 5–6)
   - Max 3D: Reject (từ Chu kỳ 7)
   - Max 3D Pro: Reject (từ Chu kỳ 7)

2. **Project-level conclusion**: Với 25+ strategies đã test × 5 products × walk-forward backtest + split-half replication, **không có evidence cho exploitable edge**. Đây là **negative result có ý nghĩa thống kê** — confirm lottery RNG của Vietlott gần white noise ở mức granularity hiện tại.

3. **Rankings update trên website**: Mega 6/45 không còn "#1 ExpDecay_Cold Suggestive". Cần refresh `backtest-data.ts`, `BacktestCard.tsx` — strategy giờ dùng như diversity generator, không phải edge provider. Claim "first matrix strategy pass significance" rút lại.

4. **Methodology codification** (Principle #11 giờ có 3 replication failures làm bằng chứng):
   - **Principle #11 — Split-half replication mandatory**: mọi Suggestive claim từ full-sample backtest phải pass split-half replication trước khi upgrade sang Accept. Codify vào [METHODOLOGY.md §3](../METHODOLOGY.md).
   - **Principle #12 — Variable-baseline power analysis pre-cycle**: trước mỗi replication cycle, tính `n_required` theo formula `(z_α+z_β)²·[p_s(1-p_s)+p_b(1-p_b)]/δ²` và chọn n_runs để đạt ≥80% power. Nếu n không đủ → report limitation, không claim Accept ngay cả khi pass.

5. **Định hướng Chu kỳ 10+** (cần discussion):
   - **Option A — Pause research line**: Accept "no edge" conclusion, chuyển sang UX/feature work. Website deliver diversity-optimized random + disclaimer EV âm.
   - **Option B — Methodology breakthrough**: thử approaches chưa test: (a) online learning với Kalman filter posterior updates, (b) neural sequence model trên raw draw stream, (c) cross-product joint modeling (e.g., predict Mega từ Power correlations), (d) risk-adjusted portfolio (Kelly sizing thay vì max win-rate).
   - **Option C — Longer data horizon**: Chờ +500 draws (≈1 năm) và re-test top 3-5 strategies on new held-out data. Nếu có drift thật, longer horizon mới capture được.

   Recommend Option A + seed Option C cho retry 2027. Option B high-effort low-probability trước khi có data mới.

---

*Cập nhật lần cuối: 2026-04-20 — Hoàn thành Chu kỳ 9 (Mega 6/45 ExpDecay_Cold replication, direction-flip Reject; last Suggestive candidate eliminated).*

---

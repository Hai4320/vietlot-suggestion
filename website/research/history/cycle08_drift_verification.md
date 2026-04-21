## Chu Kỳ 8 — Pre-Registration: Distribution Shift Analysis + Adaptive Exploitation for Max 3D Pro (04/2026)

> **Trạng thái**: Pre-registered 2026-04-20. Chu kỳ 2 phases — Phase 1 verify drift (bắt buộc chạy trước), Phase 2 conditional on Phase 1 findings.

### Bối cảnh

Chu kỳ 7 phát hiện **direction flip dramatic** cho EVMaximizer trên Max 3D Pro:
- Half 1 (draws 50–355): Δ=+1.344pp, **p=0.0007** (pass Bonferroni)
- Half 2 (draws 355–711): Δ=−0.056pp, p=0.865

Hai hypothesis giải thích được đặt ra:
- **H_shift**: RNG của Max 3D Pro có time-varying bias — digit bias mạnh ở early period sau đó shift/giảm. Nếu đúng, strategy cần **adaptive window** hoặc **short lookback**.
- **H_select**: Full-sample p=0.053 chỉ là post-hoc selection bias từ 21 strategies × 2 products. Nếu đúng, không có edge thật.

Chu kỳ 8 phân biệt 2 hypothesis bằng cách trực tiếp test drift trên raw digit distribution (không qua strategy), rồi conditional design strategy phù hợp.

### Phase 1 — Drift Analysis (Hypotheses)

**H1.A — Digit bias stability across time windows**:
- Split Max 3D Pro vào 3 windows đều nhau: W1=[0, 237), W2=[237, 474), W3=[474, 711) (~237 kỳ/window × 20 số/kỳ = ~4740 số/window).
- Per-window compute per-position digit frequency (3 positions × 10 digits).
- **Test**: Chi² homogeneity test cho mỗi (position, digit) tuple across 3 windows.
  - H0: P(digit=d | position=p) giống nhau qua 3 windows
  - H1: Khác nhau
- Bonferroni K=30 (3 positions × 10 digits), α_strict = 0.05/30 = 0.00167.

**H1.B — Compare với Chu kỳ 4 findings**:
- Chu kỳ 4 phát hiện: digit 6 ở units +11.6% (p=0.003), digit 5 ở tens +6.5% (p=0.006) — trên **full-sample**.
- Phase 1 verify: những bias này có xuất hiện đều ở cả 3 windows, hay concentrate ở window 1?

**Decision rule Phase 1** (binding):
- **Shift confirmed**: ≥1 (position, digit) fail Bonferroni homogeneity → Phase 2 proceed với adaptive design.
- **Shift not confirmed**: Không tuple nào fail Bonferroni → selection bias explanation likely, Phase 2 skip (R1 METHODOLOGY).

### Phase 2 — Adaptive Exploitation (Conditional on Phase 1 = Shift)

**Candidate strategies** (test trên split-half giống Chu kỳ 7):

1. **AdaptiveBiasTracker** (existing in `advanced_backtest.py`) — auto-select best window from `[30, 60, 100, 200, 400]` by chi² strength.
2. **EVMaximizer_short** — EVMaximizer với lookback=100 (thay vì 300). Nếu drift thật, short window capture recent bias tốt hơn.
3. **EVMaximizer_veryshort** — lookback=50, half_life=25. Extreme recency.

**Methodology**: Split-half replication giống Chu kỳ 7 — same decision rule (Accept/Suggestive/Inconclusive/Reject).

**Bonferroni K**: 3 (3 candidate strategies). α_strict = 0.05/3 = 0.0167.

**Expected outcome (pre-registered)**:
- Nếu H_shift đúng: ít nhất 1 adaptive variant pass Suggestive trên cả 2 halves (bias exists recently, adaptive captures it).
- Nếu H_shift đúng nhưng bias đã disappear hoàn toàn: không variant nào pass half 2 — kết luận "RNG tightened, không còn edge".
- Nếu H_select đúng: không variant nào pass (Phase 1 sẽ block này trước).

### Artifacts kỳ vọng

- `3d/cycle8_drift_analysis.py` + `.json` — Phase 1
- `3d/cycle8_adaptive_backtest.py` + `.json` — Phase 2 (nếu Phase 1 trigger)
- Section "Chu Kỳ 8 — Result" append vào file này

### Result — Chu Kỳ 8 (2026-04-20, cùng ngày pre-registration)

**Phase 1 outcome: SHIFT NOT CONFIRMED** cho cả hai products. **Phase 2 skipped theo R1 METHODOLOGY** — không có drift để exploit bằng adaptive strategy.

**Phase 1 — Digit homogeneity test qua 3 windows (237 kỳ/window cho 3D Pro, 354/window cho 3D)**:

| Product | Tuples pass Bonferroni | Top chi² tuple | Top p_raw | Kết luận |
|---|:-:|---|:-:|---|
| Max 3D Pro | **0 / 30** | pos=2, digit=1 (W1=9.2%, W2=9.6%, W3=10.7%) | 0.0696 | Stable |
| Max 3D | **0 / 30** | pos=0, digit=0 (W1=11.0%, W2=9.3%, W3=10.0%) | 0.0054 | Stable |

Bonferroni α_strict = 0.05/30 = 0.00167. Không tuple nào đạt ngưỡng.

**Critical cross-check với Chu kỳ 4 findings**: Chu kỳ 4 phát hiện digit 6 ở units của Max 3D Pro +11.6% (full-sample, pass Bonferroni). Phase 1 confirm bias này **ổn định**:

| Position | Digit | W1% | W2% | W3% | Pooled% | Status |
|---|:-:|:-:|:-:|:-:|:-:|---|
| units (pos=2) | 6 | 11.5 | 11.2 | 10.8 | 11.2 | **Stable bias** — consistent across all 3 windows |
| tens (pos=1) | 5 | 10.8 | 11.3 | 9.9 | 10.7 | Stable bias, slight drift not significant |

Bias thật sự tồn tại (+1.1–1.2pp trên uniform 10%) và **không drift**. Đây là câu trả lời definitive cho câu hỏi Chu kỳ 7: EVMaximizer's half-1 p=0.0007 → half-2 p=0.865 **KHÔNG** phải do distribution shift.

### Explanation cho EVMaximizer failure (post-analysis)

Với bias ổn định nhưng không replicate được, kết luận: **H_select đúng, H_shift sai**.

Breakdown của noise trên half splits:
- Half 1: Random = 1.770%, EVMax = 3.115% → Δ=+1.344pp, p=0.0007
- Half 2: Random = 2.022%, EVMax = 1.966% → Δ=−0.056pp, p=0.865

Random baseline **không** cố định — half 1 Random happened to be unusually low (1.77% vs expected ~2.00%), half 2 Random happened to be unusually high (2.02%). Combination (low Random + high EVMax) trên half 1 tạo ra z-score spuriously cao. Đây là classic "base rate variance" — khi baseline chính nó flutter ±0.25pp, small strategy effect không detect được.

Lesson: **Significance test với variable baseline cần sample size lớn hơn để stable**. 3050 trials mỗi half không đủ khi intrinsic noise ±0.25pp và effect size ~0.3-0.4pp. Need ≥5000 trials/half để có power 80% detecting +0.4pp edge.

### Bài học

- 🎯 **R1 gate ngăn rabbit-hole**: Phase 1 clearly said "no drift" và Chu kỳ 8 dừng ngay Phase 2. Trước Chu kỳ 6, chu kỳ này sẽ rơi vào bẫy design/test 3-5 adaptive variants rồi báo cáo "best variant has p=0.08 on held-out" — kết quả không có ý nghĩa. R1 tiết kiệm ~2-3 ngày compute + analysis thời gian.

- 🎯 **Stable bias ≠ exploitable edge**: Bias digit tồn tại (+1.2pp consistent) nhưng không strategy nào trong 21 đã test exploit được sau replication. Confirm: **lottery edge threshold cao hơn naive "bias exists → strategy wins"**.

- 🎯 **Variable baseline trong two-proportion test**: Khi cả strategy VÀ baseline đều fluctuate, effect size detection cần n lớn hơn dự đoán từ single-rate power analysis. Suggest formula cho future cycles: `n_required ≈ 2 × (z_α + z_β)² × (p_strat + p_base) × (1 - p_strat + 1 - p_base) / δ²`.

- 🎯 **"Distribution shift" là claim cần bằng chứng trực tiếp**, không suy diễn từ replication failure. Replication fail có ≥2 nguyên nhân; phải test từng cái. Phase 1 trực tiếp (raw digit distribution) khác hoàn toàn Phase 2 gián tiếp (strategy performance).

### Artifacts

- [3d/cycle8_drift_analysis.py](../3d/cycle8_drift_analysis.py) — 3-window chi² homogeneity test
- [3d/cycle8_drift_analysis_results.json](../3d/cycle8_drift_analysis_results.json) — full per-tuple results (30 tuples × 2 products)
- Phase 2 scripts **NOT created** (R1 gate blocked)

### Impact

1. **Definitive conclusion for 3D research line**:
   - Bias digit stable, existence confirmed multi-cycle
   - Stable bias không đủ exploit bởi current strategy toolbox (21 strategies tested)
   - Không có evidence of drift → adaptive strategies không justified
   - **3D products đạt white noise status for practical purposes** — signal-to-noise ratio quá thấp

2. **Rankings update** (consistent với post-Chu kỳ 7):
   - Max 3D: không có strategy Accept/Suggestive
   - Max 3D Pro: không có strategy Accept/Suggestive
   - Tất cả strategies dùng như diversity generators, **không phải edge providers**

3. **Methodology refinement**:
   - Add "variable baseline power analysis" warning vào EVALUATION.md
   - Add "drift verification before adaptive design" gate vào METHODOLOGY.md §2 Phase 2

4. **Định hướng Chu kỳ 9**:
   - **Pivot to Mega 6/45 ExpDecay_Cold replication** — strongest remaining Suggestive candidate (p=0.0044, Chu kỳ 6)
   - 3D research line **paused** — chờ data mới (>500 draws) hoặc methodology breakthrough (e.g., neural pattern recognition trên joint (date, digit) features) trước khi retry

---

*Cập nhật lần cuối: 2026-04-20 — Hoàn thành Chu kỳ 8 (drift analysis, R1 gate stopped Phase 2; 3D research paused).*

---

## Chu Kỳ 7 — Pre-Registration: Split-Half Replication (3D Candidates) (04/2026)

> **Trạng thái**: Pre-registered 2026-04-20, chưa chạy. Section này ghi hypothesis **trước** khi implement/backtest để chống HARKing (§3.1 METHODOLOGY). Kết quả sẽ append vào sau khi có JSON output — **không sửa hypothesis sau đó**.

### Bối cảnh

Chu kỳ 6 xác định 3 candidate sát/qua ngưỡng Suggestive trên full-sample backtest:
1. Mega 6/45 ExpDecay_Cold (p=0.0044, Suggestive)
2. Max 3D Pro EVMaximizer (p=0.053, near-miss Reject)
3. Max 3D FreqWholeHot (p=0.066, near-miss Reject)

Full-sample p-value không đủ — cần **replication trên held-out data** để phân biệt edge thật vs false positive do test battery (chọn 21 strategies × 2 products = 42 comparisons, Bonferroni K=21 nhưng báo cáo p_raw).

Chu kỳ 7 bắt đầu với nhánh 3D (candidate #2 và #3). Mega 6/45 hoãn sang cycle kế tiếp.

### Hypotheses (pre-registered)

**H1 — Max 3D + FreqWholeHot(lookback=200)**:
- Predicted exact_match_rate > Random baseline trên **cả hai** half (first 532 draws, last 532 draws).
- Mechanism giả định: whole-number frequency stable over time (digit 6 bias ở đơn vị → một số 3-digit như X?6 được over-sampled nhất quán).
- Expected effect size ≥ +0.30pp on both halves (giữ direction từ full-sample Δ=+0.375pp).

**H2 — Max 3D Pro + EVMaximizer(lookback=300, half_life=100, min_digit_distance=4)**:
- Predicted exact_match_rate > Random baseline trên cả hai half (first 355 draws, last 356 draws).
- Mechanism giả định: tier-weighted EV optimization khai thác digit bias + tier imbalance.
- Expected effect size ≥ +0.40pp on both halves (giữ direction từ full-sample Δ=+0.499pp).

### Methodology

**Split**: Time-ordered split tại index `N // 2` (không random shuffle — preserve walk-forward semantics).
- Half 1 (discovery-reproduction): predictions on draws `[50, N/2)`, history = `draws[:i]` for each i.
- Half 2 (held-out replication): predictions on draws `[N/2, N)`, history = `draws[:i]` (includes half-1 history as training — standard walk-forward).

**Backtest params**: n_runs=5, n_predictions=2, seed=42 (reset per strategy).

**Strategies run**: Random (baseline) + FreqWholeHot(200) (for H1) + EVMaximizer(300, 100, 4) (for H2). Mỗi half có significance test riêng vs Random của cùng half.

**Bonferroni K**: 2 (chỉ 2 hypotheses được test trong cycle này), α_strict = 0.05/2 = 0.025.

### Decision rule (binding — set trước khi thấy kết quả)

Cho mỗi hypothesis H1, H2:

| Half 1 | Half 2 | Direction | Decision |
|--------|--------|-----------|----------|
| p < 0.025 | p < 0.025 | Δ > 0 cả hai | **Accept** (robust replication) |
| p < 0.05 | p < 0.05 | Δ > 0 cả hai | **Suggestive** (consistent weak signal) |
| p < 0.05 một half, p ≥ 0.05 half kia | — | Δ > 0 cả hai | **Inconclusive** (directional consistency only) |
| Còn lại (bao gồm Δ < 0 ở ít nhất 1 half) | — | — | **Reject** |

### Artifacts kỳ vọng

- `3d/cycle7_replication.py` — script backtest split-half
- `3d/cycle7_replication_results.json` — kết quả với significance per-half
- Section "Chu Kỳ 7 — Result" append vào file này

### Result — Chu Kỳ 7 (2026-04-20, cùng ngày pre-registration)

Backtest chạy xong — **cả H1 và H2 đều Reject theo decision rule pre-registered**.

**H1 — Max 3D + FreqWholeHot(200)**:

| Half | Strategy% | Random% | Δpp | p_raw | CI_lo | Decision |
|------|-----------|---------|-----|-------|-------|----------|
| Half 1 (draws 50–532) | 2.054 | 1.888 | +0.166 | 0.5577 | −0.393 | Reject |
| Half 2 (draws 532–1064) | 2.087 | 1.899 | +0.188 | 0.4878 | −0.346 | Reject |

→ **Replication = Reject** (neither half p<0.05 dù direction consistent)

Bài học: full-sample p=0.066 ở Chu kỳ 6 là kết quả của **n lớn gộp 2 half yếu**, không phải edge thật. Effect size Δ=+0.18pp quá nhỏ so với noise level (CI width ~1.1pp). Nếu edge tồn tại, nó << 0.5pp — không đủ exploit với lottery cost structure.

**H2 — Max 3D Pro + EVMaximizer(300, 100, 4)**:

| Half | Strategy% | Random% | Δpp | p_raw | CI_lo | Decision |
|------|-----------|---------|-----|-------|-------|----------|
| Half 1 (draws 50–355) | 3.115 | 1.770 | **+1.344** | **0.0007** | +0.572 | **Accept** |
| Half 2 (draws 355–711) | 1.966 | 2.022 | −0.056 | 0.8654 | −0.714 | Reject |

→ **Replication = Reject** (direction flip — Δ+1.344pp vs −0.056pp)

**Đây là finding quan trọng nhất của cycle** — EVMaximizer có edge **rất mạnh** trên half đầu (p=0.0007, pass Bonferroni) nhưng **biến mất** trên half sau. Hai khả năng giải thích:

1. **Distribution shift hypothesis**: Bias digit của Max 3D Pro thay đổi theo thời gian. Early period (355 kỳ đầu, ~2018-2022) có bias strong; late period (2022-2026) bias đã giảm/shift. Lý do plausible: RNG vendor tuning, migration, hoặc tự nhiên regression-to-mean sau calibration period.
2. **Selection bias hypothesis**: Chu kỳ 4 đã test 21 strategies × 2 products — EVMaximizer "trông tốt" trên full-sample (p=0.053) chủ yếu vì edge mạnh ở half 1. Full-sample test thực chất là post-hoc selection bias, không replicate được trên held-out.

Cả hai hypothesis đều dẫn đến cùng conclusion: **không nên deploy EVMaximizer cho Max 3D Pro** ở trạng thái hiện tại. Nếu là (1), cần chiến lược adaptive tracking bias theo thời gian (AdaptiveBiasTracker đã có sẵn trong codebase — hyperparameters có thể khác). Nếu là (2), không có edge thật.

### Bài học

- 🎯 **Split-half replication là gate hiệu quả** — cả 2 candidate "near-miss" từ Chu kỳ 6 fail replication. Kết quả này không thể có nếu chỉ report full-sample p. Split-half nên thành standard gate cho mọi strategy claim pass p<0.05 trên full sample (**new principle #11**).

- 🎯 **"Near-miss" full-sample thường là noise** — FreqWholeHot với full-sample p=0.066 chỉ ra Δ+0.37pp nhưng split-half trả về Δ+0.17pp và Δ+0.19pp — consistent nhưng cả hai không significant. Full-sample power = power(half1) + power(half2) nên near-miss full-sample ~= marginal on both halves = noise.

- 🎯 **Distribution shift là real risk cho 3D** — EVMaximizer trên Max 3D Pro là ví dụ hoàn hảo của time-varying bias. Bias digit đã được Chu kỳ 4 verify p≈0 qua Bonferroni, nhưng **phân bố theo thời gian** chưa được check đủ kỹ. Cần thêm test: "split by time, verify bias consistency."

- 🎯 **Post-selection inference cần gate bổ sung** — khi chọn top-K strategies từ backtest sweep (như Chu kỳ 4 chọn EVMaximizer từ 21 strategies), p-value của "winner" cần correction mạnh hơn Bonferroni. Tham khảo Hansen (2005) "Superior Predictive Ability" test hoặc White's Reality Check.

- 🎯 **Negative result có giá trị documenting** — đã rút claim Chu kỳ 4 rằng EVMaximizer là top strategy 3D Pro. Website cần update (BacktestCard, algorithms page, SuggestionPanel rankings).

### Artifacts

- [3d/cycle7_replication.py](../3d/cycle7_replication.py) — split-half backtest script
- [3d/cycle7_replication_results.json](../3d/cycle7_replication_results.json) — full result với significance per-half + replication decision
- Output log: saved inline trong cycle7_replication_results.json (meta + hypotheses)

### Impact

1. **2/3 candidate từ Chu kỳ 6 chính thức Reject sau replication** — chỉ còn Mega 6/45 ExpDecay_Cold (p=0.0044) chờ replicate trong cycle sau.
2. **Top rankings cần revise**:
   - Max 3D: không có Accept strategy nào nữa. FreqWholeHot không còn là top theo Δ có ý nghĩa thống kê.
   - Max 3D Pro: EVMaximizer không còn claim là #1. Cần chạy lại rankings với chỉ Random baseline + strategies pass replication (hiện tại: không có).
3. **Methodology gain**: split-half replication gate chứng minh giá trị — nên codify thành requirement cho mọi future Suggestive claim (update METHODOLOGY.md §3 trong cycle tiếp).
4. **Định hướng Chu kỳ 8** (candidates):
   - Replicate Mega 6/45 ExpDecay_Cold (strongest remaining signal)
   - Adaptive strategy cho Max 3D Pro nếu hypothesis "distribution shift" đúng (test "time-varying bias" trên 355-kỳ windows)
   - Add split-half gate vào [EVALUATION.md](../EVALUATION.md) như requirement cho Suggestive → Accept transition

---

*Cập nhật lần cuối: 2026-04-20 — Hoàn thành Chu kỳ 7 (3D replication, 2/2 Reject).*

---

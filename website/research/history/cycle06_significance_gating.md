## Chu Kỳ 6 — Significance Test Enforcement & Sample-Size Correction (04/2026)

### Mục tiêu
Implement 5 improvements từ research sau khi chuẩn hóa documentation (xem [METHODOLOGY.md §3](../METHODOLOGY.md)):
1. Z-test + Wilson CI + 4-state decision rule trên mọi backtest delta
2. Pre-registration hypothesis template
3. R1 gate enforcement trong deep_analysis scripts
4. Algebra sanity check template (Phase 2 gate)
5. Decision rules Accept/Suggestive/Inconclusive/Reject

### Phương pháp
- Tạo shared module [`_significance.py`](./_significance.py): `wilson_ci`, `newcombe_diff_ci`, `two_proportion_z_test`, `decide_state`, `build_significance`
- Wire vào 3 backtest scripts: [matrix/backtest.py](../matrix/backtest.py), [matrix/power535/wheeling_backtest.py](../matrix/power535/wheeling_backtest.py), [3d/advanced_backtest.py](../3d/advanced_backtest.py)
- Thêm R1 gate verdict vào 2 deep_analysis scripts
- Thêm Phase 2 gates (pre-registration + algebra check templates) vào [RESEARCH_PLAYBOOK.md](../RESEARCH_PLAYBOOK.md)

### Phát hiện ngoài dự kiến

**1. Bug `dates.unique()` trong walk-forward backtest** — chỉ lấy `.iloc[0]` của mỗi date, mất 50% data vì Power 5/35 có 2 draws/day. Ảnh hưởng:
- `walk_forward_multi` (wheeling): n=510 thay vì 1317
- `walk_forward_backtest` (single-ticket): ảnh hưởng 5/35 only (6/55 và 6/45 có 1 draw/day)

Sau fix iterate per-row, wheeling results:

| Strategy (N=20) | P(any≥3)% trước | p trước (buggy) | P(any≥3)% sau | p sau | Kết luận |
|-----------------|:---:|:---:|:---:|:---:|---|
| HybridParityDiv | 27.65 | 0.011 | 25.89 | 0.301 | **Reject** (edge biến mất) |
| MinDistanceWheel | 22.16 | - | 26.80 | 0.118 | Reject |
| GreedyCover3if3_v12 | 17.45 | - | 19.67 | 0.005 | Reject (significantly harmful) |

**2. Single-ticket matrix backtest sau z-test (nhiều claim bị rút)**:

| Product | Strategy | Δ (avg) | Win% | p_raw | Decision cũ (Chu kỳ 3) | Decision mới |
|---------|---------|:---:|:---:|:---:|:---:|:---:|
| 6/55 | Bayesian AI | +0.031 | 1.65% | 0.511 | "#1 winner" | **Reject** |
| 6/55 | Freq_Hot | +0.024 | 1.51% | 0.848 | #2 | Reject |
| **6/45** | **ExpDecay_Cold** | **+0.009** | **2.91%** | **0.0044** | không đáng chú ý | **Suggestive** ⚠️ |
| 6/45 | Bayesian / Ensemble | +0.007 | 2.58% | 0.046 | #1 Bayes Sharp | Suggestive |
| 5/35 | Adaptive | +0.038 | 1.90% | 0.157 | - | Reject |

**Finding mới quan trọng nhất**: ExpDecay_Cold trên 6/45 là strategy duy nhất có signal mạnh (p=0.0044, win_rate lift +1.03pp: 2.91% vs 1.89%). Không pass Bonferroni K=14 (α_strict = 0.00357) nhưng gần — cần replicate trên data mới để upgrade sang Accept.

**3. 3D advanced backtest sau z-test — tất cả Reject, nhưng 2 strategies sát ngưỡng**:

| Product | Top Strategy | Exact% | Random% | p_raw | Decision | Ghi chú |
|---------|-------------|:---:|:---:|:---:|:---:|---|
| Max 3D | FreqWholeHot | 2.347 | 1.972 | **0.066** | Reject | Suýt đủ, +200 draws có thể cross |
| Max 3D | JointBias_T1.0 | 2.268 | 1.972 | 0.144 | Reject | - |
| **Max 3D Pro** | **EVMaximizer** | 2.496 | 1.997 | **0.053** | Reject | **Closest to Accept across all products** |
| Max 3D Pro | ULTIMATE_v2_sharp | 2.421 | 1.997 | 0.098 | Reject | - |
| Max 3D Pro | CoverageOpt | 1.437 | 1.997 | 0.013 | Reject (harmful) | Significantly worse than Random |

**Pattern**: ExpDecay_Cold (6/45, p=0.0044), EVMaximizer (3D Pro, p=0.053), FreqWholeHot (Max 3D, p=0.066) là **3 strongest candidates** across all products. Không có Accept, nhưng Suggestive + 2 near-misses → Chu kỳ 7 nên tập trung replicate 3 strategies này.

### Bài học

- 🎯 **Significance test enforcement khai lộ ra bug ẩn** — nếu không có z-test verify n minh bạch, bug sample-size có thể tồn tại vô thời hạn và claim "p<0.05" không reproducible. Đây là lý do EVALUATION.md §4 yêu cầu schema có `strategy_n`, `baseline_n`.

- 🎯 **Honest reporting của negative result** — việc rút claim "HybridParityDiv first significant matrix strategy" là đúng đắn. Ghi chi tiết correction vào HISTORY giúp future researcher không lặp lại mistake.

- 🎯 **4-state decision rule hữu ích hơn binary pass/fail** — các strategies giờ rõ ràng Reject, không còn bị tô hồng thành "suggestive" khi thật ra CI chứa 0.

### Artifacts
- [`_significance.py`](./_significance.py) — shared module với smoke test
- Updates: [matrix/backtest.py](../matrix/backtest.py), [matrix/power535/wheeling_backtest.py](../matrix/power535/wheeling_backtest.py), [3d/advanced_backtest.py](../3d/advanced_backtest.py), [matrix/power535/deep_analysis.py](../matrix/power535/deep_analysis.py), [3d/deep_analysis.py](../3d/deep_analysis.py)
- Bug fix: walk_forward iterate per-row thay vì per-date
- Doc updates: HISTORY Chu kỳ 5 (correction), PLAYBOOK Phase 2 gates

### Impact

Đây là infrastructure cycle — giá trị chính là methodology, không phải thuật toán. Nhưng cũng có finding đáng chú ý:

1. **Mọi future research cycle sẽ có significance test enforcement** — không thể claim "+Δ edge" mà không có p-value + CI + decision state.
2. **Nhiều claim cũ bị rút** do không pass z-test:
   - Chu kỳ 3 claim "Bayesian #1 trên 6/55 +0.031" → thực chất p=0.51, Reject.
   - Chu kỳ 4 claim "EVMaximizer #1 3D Pro" → Δ còn đúng nhưng p=0.053, Reject (sát ngưỡng).
   - Chu kỳ 5 claim "HybridParityDiv first p<0.05 matrix" → bug sample-size, sau correction p=0.301, Reject.
3. **Finding mới — 3 candidate strategies sát hoặc qua ngưỡng Suggestive**:
   - **Mega 6/45 ExpDecay_Cold**: p=0.0044 ✅ Suggestive (strongest)
   - **Max 3D Pro EVMaximizer**: p=0.053 (near-miss, Reject)
   - **Max 3D FreqWholeHot**: p=0.066 (near-miss, Reject)
4. Framework sẵn sàng cho Chu kỳ 7+ — candidate ưu tiên: replicate 3 strategies trên held-out data mới (>200 draws) để upgrade Suggestive → Accept.

### Website updates (item 4 EVALUATION §7 — DONE)

- [`backtest-data.ts`](../src/lib/backtest-data.ts): thêm `pValue`, `decision` fields, refresh toàn bộ values từ JSON 2026-04-20
- [`BacktestCard.tsx`](../src/components/products/BacktestCard.tsx): thêm columns `p` + `Kết luận` với Decision badges
- [`algorithms/page.tsx`](../src/app/algorithms/page.tsx): refresh data + UI + RECOMMENDATIONS với findings correct
- TypeScript typecheck: pass

---

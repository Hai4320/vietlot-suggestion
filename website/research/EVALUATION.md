# Phương Pháp Đánh Giá Thuật Toán — Canonical

> **Mục đích**: Tài liệu canonical về **cách đánh giá** một strategy — metrics nào, khi nào dùng, cách kiểm định ý nghĩa thống kê, cách báo cáo.
>
> **Dùng ở đâu**: Phase 3 của [METHODOLOGY.md](METHODOLOGY.md).
>
> **Áp dụng cho**: Mọi sản phẩm (matrix + 3D), mọi strategy (single-ticket + multi-ticket).

---

## 1. Metric Taxonomy — 3 Tầng

Metric khác nhau trả lời câu hỏi khác nhau. Nhớ rõ **metric đo cái gì** trước khi tối ưu.

### 1.1 Accuracy layer — "Strategy chọn số tốt hơn random không?"

| Metric | Công thức | Khi nào dùng | Baseline cần compare |
|--------|-----------|--------------|---------------------|
| **Avg matches** | `mean(|predicted ∩ actual|)` | Matrix products | `E[X]` hypergeometric |
| **Exact match rate** | `hits / (preds × draws × runs) × 100%` | 3D products | `P = k/N` (k chọn trong N số) |
| **P(any ≥ k)** | `P(best vé trùng ≥k số)` | Multi-ticket wheeling | Monte Carlo Random N vé |
| **Win rate ≥ 3** | `P(có ≥3 trùng)` | Matrix (tỷ lệ trúng giải) | Hypergeometric `P(X≥3)` |

**Lưu ý**: Baseline phải là **closed-form** khi có thể, không chỉ Monte Carlo. Closed-form = zero variance, ước lượng chính xác.

### 1.2 Profitability layer — "Nếu mua thật thì mất bao nhiêu?"

| Metric | Công thức | Caveat |
|--------|-----------|--------|
| **ROI** | `(revenue - cost) / cost × 100%` | **Luôn âm** với lottery — dùng để **so sánh** 2 strategies, không phải tuyệt đối |
| **Net profit** | `revenue - cost` | VND tuyệt đối |
| **Sharpe ratio** | `mean(profit_per_draw) / std(profit_per_draw) × √52` | Khi cần risk-adjusted |
| **Max drawdown** | `max(cum_loss)` | Chuỗi thua dài nhất |

**⚠️ ROI trap**: Strategy có match rate cao chưa chắc ROI cao (nếu match ở tier giải thấp). Và ngược lại — strategy match rate thấp nhưng vào tier cao đột phá ROI. Luôn report **cả accuracy + ROI**.

### 1.3 Robustness layer — "Kết quả có đáng tin không?"

| Metric | Công thức | Ngưỡng |
|--------|-----------|--------|
| **Std matches** | `std(matches) across draws/runs` | So với baseline để check variance reduction |
| **Δ vs Random** | `metric_strategy - metric_random` | Point estimate |
| **p-value (Δ)** | Z-test hoặc permutation | `< 0.05` sau Bonferroni để claim edge |
| **Wilson 95% CI** | `wilson_ci(hits, n)` | Không chứa baseline → significant |
| **Cross-product rank** | `avg rank across products` | < 5 = robust winner |

**Quy tắc vàng**: Claim "strategy X có edge" chỉ hợp lệ khi cả 3 đều true:
1. Point estimate Δ > 0
2. p-value < 0.05 (sau Bonferroni nếu test K configs)
3. 95% CI không chứa 0

Thiếu 1 trong 3 → chỉ nói "inconclusive", không nói "edge".

---

## 2. Single-Ticket vs Multi-Ticket — Evaluation Khác Nhau

### 2.1 Single-ticket

**Metric chính**: Avg matches, Win rate ≥3, ROI.

**Backtest shape**:
```
For each draw d:
    pred = strategy.predict(train_before_d)    # 1 ticket
    match[d] = |pred ∩ actual[d]|
```

**N samples cho test**: `n_runs × (len(draws) - min_history)`.

### 2.2 Multi-ticket (wheeling)

**Metric chính**: P(any vé ≥3), pooled ROI, mean best match.

**Backtest shape**:
```
For each draw d:
    tickets = strategy.predict_n(train_before_d, N)    # N tickets
    hits[d] = [|t ∩ actual[d]| for t in tickets]
    best[d] = max(hits[d])
    any_ge3[d] = any(h >= 3 for h in hits[d])
```

**Quan trọng**: Không so N-ticket strategy với 1-ticket Random. Compare với `RandomN` (N ticket random độc lập).

### 2.3 Khi nào single không đủ — chuyển multi

Bài học Chu kỳ 5: bias parity không thể exploit bằng single ticket (chứng minh đại số). Heuristic:
- Bias **marginal** (từng số riêng lẻ lệch) → single-ticket exploit được (vd: JointDigitBias trên 3D).
- Bias **joint** không ảnh hưởng E[count] marginal (vd: parity distribution) → cần multi-ticket để khai thác structure.

---

## 3. Significance Test — Quy Tắc Bắt Buộc

### 3.1 Vấn đề hiện tại

Các script backtest hiện tại ([matrix/backtest.py](matrix/backtest.py), [matrix/power535/wheeling_backtest.py](matrix/power535/wheeling_backtest.py)) chỉ báo cáo `Δ = avg_strategy - avg_baseline` **không kèm p-value**. Chu kỳ 3 claim "Bayesian Δ+0.031 trên 6/55" — không biết đây có phải trong nhiễu hay không.

**Fix**: Thêm significance test vào backtest output.

### 3.2 Z-test cho proportion (win rate, exact match, P(any≥k))

Áp dụng khi metric là **tỷ lệ**:

```python
from scipy import stats
from math import sqrt

def z_test_proportions(hits_a, n_a, hits_b, n_b):
    """Two-proportion z-test. H0: p_a = p_b."""
    p_a = hits_a / n_a
    p_b = hits_b / n_b
    p_pool = (hits_a + hits_b) / (n_a + n_b)
    se = sqrt(p_pool * (1 - p_pool) * (1/n_a + 1/n_b))
    z = (p_a - p_b) / se if se > 0 else 0.0
    p_value = 2 * (1 - stats.norm.cdf(abs(z)))
    return {"z": z, "p_value": p_value, "delta_pp": (p_a - p_b) * 100}
```

**Ví dụ**: HybridParityDiv `P(any≥3) = 27.65%` trên 1320 draws (3 runs × 440) vs RandomN `23.33%`.
→ z = 2.56, p = 0.011 ✓

### 3.3 Wilson 95% CI cho proportion

Chính xác hơn normal-approximation khi p gần 0 hoặc 1:

```python
def wilson_ci(hits, n, z=1.96):
    """Wilson score interval."""
    if n == 0: return (0.0, 1.0)
    phat = hits / n
    denom = 1 + z**2/n
    center = (phat + z**2/(2*n)) / denom
    half = z * sqrt(phat*(1-phat)/n + z**2/(4*n**2)) / denom
    return (max(0, center-half), min(1, center+half))
```

Report cả `(hits, n, phat, ci_lo, ci_hi)`. Nếu baseline_rate ∉ `[ci_lo, ci_hi]` → significant.

### 3.4 Permutation test (khi không muốn assume normality)

Dùng cho avg matches, khi phân bố không phải Bernoulli rõ:

```python
def permutation_test(scores_a, scores_b, n_perms=10000, seed=42):
    """Two-sample permutation test. H0: mean(a) = mean(b)."""
    rng = np.random.default_rng(seed)
    obs = np.mean(scores_a) - np.mean(scores_b)
    combined = np.concatenate([scores_a, scores_b])
    n_a = len(scores_a)
    extreme = 0
    for _ in range(n_perms):
        rng.shuffle(combined)
        stat = np.mean(combined[:n_a]) - np.mean(combined[n_a:])
        if abs(stat) >= abs(obs):
            extreme += 1
    return {"delta": obs, "p_value": (extreme + 1) / (n_perms + 1)}
```

### 3.5 Multi-testing correction

Khi so sánh K strategies với Random, hoặc grid search K configs:
- **Bonferroni** (conservative): reject nếu `p < 0.05/K`
- **BH-FDR** (less conservative): rank p-values, reject từng cái thoả `p(i) < (i/K) × 0.05`

Recommend: Bonferroni cho K ≤ 10, BH-FDR cho K lớn hơn.

**Luôn report raw p-value + adjusted threshold**, không chỉ boolean "significant".

---

## 4. Required Output Schema

Mọi backtest script phải emit JSON có cấu trúc này cho **mỗi** (strategy, product):

```json
{
  "strategy": "HybridParityDiv",
  "product": "power_535",
  "n_tickets_per_draw": 20,
  "n_draws_evaluated": 440,
  "n_runs": 3,
  "seed": 42,

  "accuracy": {
    "avg_matches": 0.7311,
    "p_any_ge3_pct": 27.65,
    "win_rate_pct": 27.65
  },

  "profitability": {
    "roi_pct": -91.1,
    "net_profit": -24056000,
    "sharpe_ratio": -0.428,
    "max_drawdown": 190000
  },

  "significance": {
    "baseline_name": "RandomN",
    "baseline_metric": 23.33,
    "delta_pp": 4.31,
    "p_value": 0.011,
    "p_value_raw": 0.011,
    "p_value_method": "two_proportion_z",
    "bonferroni_k": 7,
    "bonferroni_threshold": 0.00714,
    "passes_bonferroni": false,
    "ci95_lo_pp": 1.0,
    "ci95_hi_pp": 7.6
  },

  "hyperparams": {"lookback_days": 365, "candidate_pool": 30, "alpha": 1.0},
  "elapsed_seconds": 12.3
}
```

**Ghi chú**:
- `significance.passes_bonferroni` = `false` cho HybridParityDiv nghĩa là: khi đã so sánh 7 strategies, 0.011 không đủ chặt. Vẫn hợp lệ claim "suggestive evidence" nhưng không "confirmed edge". Đây là honest reporting.
- `hyperparams` pinned để reproduce.

---

## 5. Reporting Checklist

Khi viết section "Kết quả" vào [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) hoặc [RESEARCH_DOCUMENTATION.md](RESEARCH_DOCUMENTATION.md):

- [ ] Bảng so sánh có cột: `metric`, `Δ`, `p-value`, `CI95`
- [ ] Highlighted strategy có `significance.p_value < 0.05` (raw) **và** ghi rõ Bonferroni pass/fail
- [ ] Include baseline (Random) ở đầu bảng để đối chiếu
- [ ] Phân bố matches (histogram 0→max) cho strategy top
- [ ] Failure modes: "Strategy kém khi N < ...", "Strategy không hoạt động trên product ..."
- [ ] Limitation: sample size, data recency, compute budget

---

## 6. Decision Rules — Khi Nào Accept, Reject, Inconclusive

| Kết quả | Quyết định | Action |
|---------|-----------|--------|
| `p_raw < 0.05` & `passes_bonferroni` & `ci_lo > 0` | **Accept** — có edge | Phase 4 ship |
| `p_raw < 0.05` nhưng không pass Bonferroni | **Suggestive** — có thể có edge | Replicate trên data mới hoặc product khác trước ship |
| `p_raw ≥ 0.05` & `ci_lo > 0` | **Inconclusive** — under-powered | Tăng n_runs hoặc n_draws, chạy lại |
| `p_raw ≥ 0.05` & `ci` qua 0 | **Reject** — không có edge | Dừng, không ship, ghi HISTORY |
| Δ > 0 nhưng baseline beat strategy ở ≥2 products | **Reject** — không robust | Dừng |

---

## 7. Status Implement (Chu kỳ 6, 2026-04-20)

| # | Item | Status | Notes |
|:-:|------|:------:|-------|
| 1 | `matrix/backtest.py` z-test | ✅ Done | `attach_significance` vs Random. Rerun 2026-04-20. |
| 2 | `matrix/power535/wheeling_backtest.py` z-test | ✅ Done | `attach_significance_wheel` vs RandomN. **Đã khai lộ bug sample-size** (dates dedup). |
| 3 | `3d/advanced_backtest.py` z-test | ✅ Done | `_attach_3d_significance` vs Random. Rerun 2026-04-20. |
| 4 | `backtest-data.ts` + website UI | ✅ Done | Thêm `pValue` + `decision` + Decision badges. BacktestCard + algorithms page refreshed. TypeScript pass. |
| 5 | Backfill p-value HISTORY | ✅ Done | Chu kỳ 2-6 all updated với actual p-values. Các claim cũ bị rút/điều chỉnh theo kết quả z-test. |

**Shared module**: [`_significance.py`](_significance.py) — `wilson_ci`, `newcombe_diff_ci`, `two_proportion_z_test`, `decide_state`, `build_significance`. Smoke test embedded.

**Pre-existing bug exposed**: `walk_forward_multi` và `walk_forward_backtest` iterate qua `dates.unique()` + lấy `.iloc[0]` — bỏ qua 50% data nếu product có multi-draws/day. Đã fix per-row iteration. Ảnh hưởng: Power 5/35 only (6/55 và 6/45 có 1 draw/date nên không ảnh hưởng).

---

*Cập nhật: 2026-04-20 — Codify significance test bắt buộc, taxonomy 3 tầng, output schema chuẩn.*

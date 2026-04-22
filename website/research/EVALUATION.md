# Phương Pháp Đánh Giá Thuật Toán — Canonical

> **Mục đích**: Tài liệu canonical về **cách đánh giá** một strategy — metrics nào, khi nào dùng, cách kiểm định ý nghĩa thống kê, cách báo cáo.
>
> **Dùng ở đâu**: Phase 3 của [METHODOLOGY.md](METHODOLOGY.md) (discovery mode), Phase 3' (exploration mode).
>
> **Áp dụng cho**: Mọi sản phẩm (matrix + 3D), mọi strategy (single-ticket + multi-ticket).
>
> **⚡ Chu kỳ 10 pivot (refined 2026-04-20)**: Primary goal = **tối đa hoá tỷ lệ trúng giải trong tương lai** (future win rate). ROI is meaningful secondary (weight 0.30 vs 0.40). Sharpe + p-value là significance/risk guards. §8 Tournament ranking composite với rebalanced weights. §9 Forward Validation NEW — primary indicator của future generalization. Decision state "Ship-with-caveats" thêm vào §6.

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

### 1.2 Profitability layer — MEANINGFUL SECONDARY trong breakthrough mode (Chu kỳ 10+, refined)

**Trước Chu kỳ 10**: ROI + Sharpe là secondary metrics (báo cáo nhưng không drive decision).

**Sau Chu kỳ 10 (refined)**: Win rate là PRIMARY (weight 0.40 trong §8 composite). ROI là MEANINGFUL SECONDARY (weight 0.30) — vẫn drive decision nhưng không override win rate. Sharpe (0.15) + p-value (0.15) là risk/significance guards. Tournament §8 dùng cả 4 metrics với pre-registered weights ưu tiên win rate.

| Metric | Công thức | Caveat |
|--------|-----------|--------|
| **ROI** | `(revenue - cost) / cost × 100%` | **Luôn âm** với lottery. Trong breakthrough mode: metric là **Δ_ROI vs Random** — "least negative vs Random's baseline ROI". |
| **Net profit** | `revenue - cost` | VND tuyệt đối |
| **Sharpe ratio** | `mean(profit_per_draw) / std(profit_per_draw) × √52` | Risk-adjusted — CO-PRIMARY trong tournament §8 |
| **Max drawdown** | `max(cum_loss)` | Chuỗi thua dài nhất |
| **Kelly fraction** (§8.5) | `f* = (p·b - q) / b` | Recommended bet size fraction of bankroll (multi-ticket only) |

**⚠️ ROI trap**: Strategy có match rate cao chưa chắc ROI cao (nếu match ở tier giải thấp). Và ngược lại — strategy match rate thấp nhưng vào tier cao đột phá ROI. Luôn report **cả accuracy + ROI + Sharpe**.

**⚠️ Breakthrough mode ROI realism**: ROI lottery về lý thuyết luôn âm (EV-negative game). Mục tiêu "tối đa ROI" thực chất là "least negative delta vs Random baseline". Website phải disclaim rõ ràng rằng ngay cả strategy winner cũng có ROI âm.

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

Khi viết section "Kết quả" vào cycle record `history/cycleNN_<slug>.md` (và update index [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md)):

- [ ] Bảng so sánh có cột: `metric`, `Δ`, `p-value`, `CI95`
- [ ] Highlighted strategy có `significance.p_value < 0.05` (raw) **và** ghi rõ Bonferroni pass/fail
- [ ] Include baseline (Random) ở đầu bảng để đối chiếu
- [ ] Phân bố matches (histogram 0→max) cho strategy top
- [ ] Failure modes: "Strategy kém khi N < ...", "Strategy không hoạt động trên product ..."
- [ ] Limitation: sample size, data recency, compute budget

---

## 6. Decision Rules — Accept, Suggestive, Ship-with-caveats, Inconclusive, Inconclusive-underpowered, Reject

**Primary metric** cho decision: **Composite tournament score** ([METHODOLOGY §8](METHODOLOGY.md)) — BINDING post Chu kỳ 20. Single-metric shortcuts (win-rate only OR ROI only) **không được phép** drive verdict quyết định. win_rate_ge3/exact_match_rate là input cho composite, không phải standalone gate.

**Power prerequisite** (BINDING Chu kỳ 20): Any Reject verdict requires power ≥ 50% at bias ceiling (§12 METHODOLOGY). Below 50% power → verdict is **Inconclusive-underpowered**, not Reject.

| Kết quả | Power | Quyết định | Action |
|---------|:---:|-----------|--------|
| Composite rank #1 + `p_raw < 0.05` & `passes_bonferroni` & `ci_lo > 0` & **split-half** both Δ>0 & p<0.025 both & **forward_last_100 Δ>0** | ≥80% | **Accept** — edge confirmed + future-consistent | Ship, primary recommendation |
| Composite rank #1 + `p_raw < 0.05` & split-half both Δ>0 & p<0.05 both & forward_last_100 Δ>0 | ≥50% | **Suggestive** — consistent weak signal | Ship với minor caveat |
| **Composite tournament top-1** + forward_last_100 Δ>0 + split-half inconsistent/not-run | ≥50% | **Ship-with-caveats** | Ship với UI badge "unverified edge — tournament best" |
| forward_last_100 Δ ≤ 0 (regardless of historical) | — | Downgrade by one tier (§9.5) | Forward has veto |
| `p_raw ≥ 0.05` & `ci_lo > 0` & power ≥ 50% | ≥50% | **Inconclusive** — moderate power, need more data | Tăng n_runs/n_draws hoặc chạy again |
| **Δ > 0.3pp observed AND power < 50% AND p_raw ≥ 0.05** (NEW Chu kỳ 20) | <50% | **Inconclusive-underpowered** — revisit at N≥`n_required(80%)` | Do NOT count as falsification for Principle #17 family elimination |
| Direction flip between halves (split-half fail) | any | **Reject** — không robust | Không ship; ghi HISTORY |
| `p_raw ≥ 0.05` & Δ ≤ 0.3pp & power ≥ 50% | ≥50% | **Reject** — không có edge (strong falsification) | Không ship; convergent evidence for family elimination |
| `p_raw ≥ 0.05` & Δ ≤ 0.3pp & power < 50% | <50% | **Reject (weak evidence)** — disclosed limitation | Không ship; do NOT count toward family elimination |
| Δ > 0 nhưng baseline beat strategy ở ≥2 products | any | **Reject** — không robust | Không ship |

**Guardrails (Chu kỳ 9-10 derived + Chu kỳ 20 upgrade)**:
- Mọi Accept/Suggestive claim **phải pass split-half replication** (Principle #11, [METHODOLOGY §3.5](METHODOLOGY.md)).
- Mọi Accept claim phải **pass power gate** ≥80% (Principle #12 binding post Chu kỳ 20, [METHODOLOGY §3.6](METHODOLOGY.md)).
- Reject claims với power <50% **phải flag as Reject (weak evidence)** — not counted for family elimination (Principle #17, [METHODOLOGY §3.11](METHODOLOGY.md)).
- **Forward validation §9 có veto power** — `forward_last_100 Δ ≤ 0` downgrade decision by one tier ngay cả khi historical pass.
- **Composite-binding (Chu kỳ 20)**: Decision rank derived từ composite score §8, không từ single metric. Single-metric tops là diagnostic output, không phải decision driver.
- Ship-with-caveats **không thay thế** Accept — chỉ valid cho composite top-1 + forward positive khi Accept chưa đạt.
- Ship-with-caveats **phải có UI disclosure** hiển thị rõ "không có p<0.05 verified edge".

**Inconclusive-underpowered — revisit criteria** (Chu kỳ 20): Candidate flagged with (cycle, product, strategy, observed_Δ, current_power, n_required_for_80%_power). Revisit condition: `N_per_product ≥ n_required_for_80%_power` (typically requires 2-10× more data). See [PROJECT_CLOSURE_REPORT.md §7.1](PROJECT_CLOSURE_REPORT.md) updated table for 8 current Inconclusive-underpowered candidates.

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

---

## 8. Tournament Ranking — Multi-objective Winner Selection (Chu kỳ 10+, BINDING post Chu kỳ 20)

Phase 3' trong [METHODOLOGY §7.3](METHODOLOGY.md) dùng tournament ranking để select winner-per-product và cross-product robust winner trong breakthrough mode.

**BINDING POLICY post Chu kỳ 20**: Composite tournament score **IS the decision output**. Single-metric decisions (win-rate only, ROI only) disallowed. This upgrades the Chu kỳ 10 pre-reg from "codified but operationally advisory" to "codified and binding."

**Rationale**: Chu kỳ 20 baseline analysis ([post_closure/cycle20_a4_composite_rescore.json](post_closure/cycle20_a4_composite_rescore.json)) found 5 of 8 cycle-product groups had composite-top ≠ single-metric-top (e.g., Chu kỳ 14/15 Power 6/45: composite picks Freq_Hot, win-rate picks Bayesian, ROI picks Freq_Hot). Historical operational practice often defaulted to win-rate primary despite pre-reg weight 0.40 — hidden single-metric bias.

**Concrete check during Phase 3' execution**:
1. Compute 4 metric z-scores per strategy in tournament
2. Compute composite score using pre-registered weights (§8.2)
3. Rank by composite
4. **Decision verdicts derive from composite rank + 3-gate** — not from single-metric rank
5. Report single-metric ranks as diagnostic output, not decision input

**Retroactive note**: 5 Chu kỳ 14-17 cycle-product groups had composite-single-metric divergence but NO verdict reversal (all strategies were Reject regardless of which "top" was picked). Historical bias thus operational-only, did not invalidate cumulative "0 Accept" claim.

### 8.1 Canonical metric set (fixed per cycle)

4 metrics, z-normalized across strategies trong tournament:

| # | Metric | Ký hiệu | Direction |
|:-:|--------|---------|-----------|
| 1 | `Δ win_rate_ge3` (matrix) hoặc `Δ exact_match_rate` (3D) | `delta_win` | higher better |
| 2 | `Δ ROI_pct` vs Random | `delta_roi` | higher better (less negative) |
| 3 | `Sharpe ratio` | `sharpe` | higher better |
| 4 | `-log10(p_value_raw)` | `neg_log_p` | higher better |

Không thêm/bớt metric sau khi cycle bắt đầu. Không dùng custom metric không trong list này.

### 8.2 Composite score (pre-registered weights — refined 2026-04-20)

```
score(strategy) = w1·z(delta_win) + w2·z(delta_roi) + w3·z(sharpe) + w4·z(neg_log_p)
```

**Default weights** — reflects priority "primary = future win rate, secondary = ROI balanced":

| w | Metric | Weight | Rationale |
|:-:|--------|:-:|-----------|
| w1 | delta_win | **0.40** | PRIMARY — win-rate là mục tiêu cao nhất của project |
| w2 | delta_roi | **0.30** | Meaningful secondary — ROI vẫn drive decision, ratio win:ROI = 1.33× |
| w3 | sharpe | **0.15** | Risk-adjusted return guard |
| w4 | neg_log_p | **0.15** | Significance guard chống lucky-noise winner |

**Ratio win:ROI = 4:3** — clear priority but ROI remains substantial contribution. Không phải pure lexicographic.

Weights **immutable within cycle**. Changing weights post-hoc là p-hacking.

### 8.3 Canonical baseline set (fixed per product)

Mandatory inclusion để đảm bảo tournament không cherry-picked:

| Product family | Mandatory baselines |
|----------------|---------------------|
| Matrix (6/55, 6/45, 5/35) | `Random`, `FreqHot(365, 0.8)`, `Pattern(180)` |
| 3D (Max 3D, Max 3D Pro) | `Random`, `FreqWholeHot(200)`, `Digit_Hot(300)` |

Remove baseline = anti-pattern. Thêm extra baselines OK miễn là không remove mandatory ones.

### 8.4 Tournament shape

```
Per product P:
  1. Run ≥10 strategies (≥3 mandatory baselines + ≥7 experimental)
  2. Compute all 4 metrics + significance vs Random
  3. z-normalize each metric across strategies in tournament
  4. score(s) = composite (§8.2)
  5. Rank by score descending
  6. Top-1 = product winner

Cross-product:
  1. For each strategy, compute average rank across products
  2. Cross-product top-1 = robust winner (best average rank)
```

### 8.5 Kelly-optimal sizing (multi-ticket only)

Khi tournament runner với multi-ticket strategy, ngoài win_rate báo cáo Kelly fraction:

```
f* = (p · b - q) / b
  where:
    p = win probability (P(any ≥ 3))
    q = 1 - p
    b = net odds (expected_payout_per_win / ticket_cost)
```

**Caveat**: Kelly assume log-utility + correct probability estimate. Lottery có heavy-tailed payout nên Kelly có thể over-estimate. Recommend **half-Kelly** (`f*/2`) cho conservative sizing. Full formula + Monte Carlo simulation trong [BREAKTHROUGH_ROADMAP.md Path #4](BREAKTHROUGH_ROADMAP.md).

### 8.6 Required tournament output schema

```json
{
  "cycle": "Chu Kỳ 11",
  "product": "power_645",
  "weights": {"w1": 0.40, "w2": 0.30, "w3": 0.15, "w4": 0.15},
  "baselines_included": ["Random", "FreqHot", "Pattern"],
  "n_strategies_total": 12,
  "rankings": [
    {
      "rank": 1,
      "strategy": "KellyPortfolio_v1",
      "delta_win_pp": 0.42,
      "delta_roi_pct": 1.2,
      "sharpe": -0.38,
      "p_value_raw": 0.023,
      "z_scores": {"delta_win": 1.8, "delta_roi": 1.5, "sharpe": 1.2, "neg_log_p": 1.1},
      "composite_score": 1.58,
      "split_half_status": "pending|pass|fail",
      "decision": "Ship-with-caveats"
    },
    ...
  ]
}
```

### 8.7 Anti-patterns

| Anti-pattern | Prevention |
|--------------|------------|
| Weight shopping (tune w's cho winner) | Pre-register trong HISTORY, immutable |
| Baseline cherry-pick (remove strong simple baseline) | §8.3 mandatory set |
| Metric drift (add new metric post-hoc) | §8.1 fixed set |
| N strategies < 10 | Tournament under-powered, require ≥10 |
| Skip split-half trên winner | Required cho Accept-grade; Ship-with-caveats label required UI disclosure |

---

---

## 9. Forward Validation — Primary Indicator of Future Generalization (Chu kỳ 10+)

> **Bối cảnh**: Mục tiêu cao nhất của project là **tối đa hoá tỷ lệ trúng giải trong tương lai**, không phải fit backtest quá khứ. Split-half replication (§3.5 METHODOLOGY, Principle #11) tests robustness — nhưng treat cả 2 halves bình đẳng. Future win rate specifically = generalization sang unseen + recent data.
>
> **Forward validation complements (không replace) split-half**. Split-half vẫn required cho Accept-grade label (Principle #11). Forward validation là **primary deployment signal** — strategy tốt cho production cần pass cả hai.

### 9.1 Rolling-window forward test (mandatory cho mọi breakthrough cycle)

**Definition**: Evaluate strategy chỉ trên most recent N draws, với train set = full history trước mỗi prediction (growing train, walk-forward).

```python
def rolling_window_forward(draws, strategy, last_n=100, n_runs=5):
    """Evaluate strategy on last N draws (most recent), proxy for future deployment."""
    N = len(draws)
    start = N - last_n
    hits = 0
    total = 0
    for _ in range(n_runs):
        for i in range(start, N):
            train = draws[:i]                  # full history up to i
            if len(train) < MIN_HISTORY:
                continue
            pred = strategy.predict(train, draws[i].date, ...)
            m = len(set(pred) & set(draws[i].result))
            if m >= 3: hits += 1
            total += 1
    return {"win_rate_pct": hits/total*100, "hits": hits, "n": total,
            "window_size": last_n, "n_runs": n_runs}
```

**Why rolling-window matters**:
- Matches actual deployment: website predicts next draw using all past data.
- Captures recent regime (nếu có drift) vì only scores on recent predictions.
- Independent gate vs split-half: splits train/test by time, rolling evaluates only recent test.

### 9.2 Canonical forward metrics (3 horizons)

Mọi breakthrough cycle phải report forward win rate tại 3 horizons:

| Horizon | N draws | Use case |
|---------|:-:|-----------|
| **Last-20** | 20 | Freshest snapshot — highest variance nhưng most representative của very-near-future |
| **Last-100** | 100 | Primary forward metric — balance giữa sample size và recency |
| **Last-300** | 300 | Medium-term forward — catches slower drift patterns |

Rolling-window forward evaluation chạy tại từng horizon. Compare forward win rate vs Random trên cùng horizon (`forward_delta_win_pp`).

### 9.3 Recency-weighted win rate (optional secondary indicator)

Alternative: weight evaluations toàn sample nhưng decay by recency (half-life=100 draws).

```
weighted_win_rate = Σ_i w_i · (m_i >= 3) / Σ_i w_i
where w_i = exp(-ln(2) · (N - i) / 100)     # recent i gets weight ~1, old i ~0
```

Report alongside rolling-window. Useful để catch strategies tốt toàn bộ nhưng degrade recently.

### 9.4 Required output schema (forward validation block)

Append vào tournament output schema (§8.6):

```json
{
  "forward_validation": {
    "last_20":  {"win_rate_pct": 2.45, "hits": 4, "n": 100, "forward_delta_pp": +0.55},
    "last_100": {"win_rate_pct": 2.18, "hits": 22, "n": 500, "forward_delta_pp": +0.25},
    "last_300": {"win_rate_pct": 2.05, "hits": 61, "n": 1500, "forward_delta_pp": +0.12},
    "recency_weighted": {"win_rate_pct": 2.10, "half_life_draws": 100}
  }
}
```

### 9.5 Forward validation gate (decision rules update)

Bổ sung cho §6 decision rules:

| Condition | Gate outcome |
|-----------|-------------|
| forward_last_100 Δ > 0 AND split-half both halves Δ > 0 AND p < 0.025 both | **Accept** (primary + forward consistent) |
| forward_last_100 Δ > 0 AND split-half both halves Δ > 0 AND p < 0.05 both | **Suggestive** |
| forward_last_100 Δ > 0 AND split-half not run or inconsistent | **Ship-with-caveats** (forward positive is enough cho caveat-labeled ship) |
| forward_last_100 Δ ≤ 0 | Downgrade by one level (Accept → Suggestive, Suggestive → Ship-with-caveats, Ship-with-caveats → Research-only). **Forward validation có veto power** ngay cả khi historical split-half pass. |

Rationale: strategy pass historical split-half nhưng fail forward last-100 có nghĩa "worked in past, not now" — không safe for deployment. Forward validation fail = không ship (hoặc ship với heavy caveat).

### 9.6 Anti-patterns specific to forward validation

| Anti-pattern | Symptom | Prevention |
|--------------|---------|------------|
| **Cherry-pick horizon** | Report last-20 tốt nhất, bỏ last-300 | §9.2 mandatory 3 horizons |
| **Tune on forward** | Grid-search hyperparam để last-100 win-rate cao nhất | Hyperparam freeze sau pre-reg, không re-tune |
| **Skip rolling-window** | Chỉ split-half, bỏ qua forward | §9.1 mandatory cho breakthrough cycles |
| **Single-run rolling** | n_runs=1 → high variance ở last-20 | n_runs≥5 cho stochastic strategies |

---

*Cập nhật: 2026-04-20 (late) — (Chu kỳ 10 refined) Reweight §8 composite thành 0.40/0.30/0.15/0.15 (win-rate primary, ROI meaningful secondary). Thêm §9 Forward Validation như primary future-generalization indicator với veto power trong §9.5 decision gate.*

*2026-04-20 — (Chu kỳ 10 pivot) ROI + Sharpe elevated to co-primary (§1.2); thêm §6 "Ship-with-caveats" decision state; thêm §8 Tournament Ranking.*

*2026-04-20 — Codify significance test bắt buộc, taxonomy 3 tầng, output schema chuẩn.*

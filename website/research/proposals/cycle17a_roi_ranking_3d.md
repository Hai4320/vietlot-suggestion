## Chu Kỳ 17a — ROI Ranking for 3D Products (Max 3D + Max 3D Pro)

> **⚠ SUPERSEDED (2026-04-22)**: Replaced by [cycle22_optimization_mode.md](cycle22_optimization_mode.md) — expanded scope (3D + matrix unified, not 3D-only) + incorporates Chu kỳ 20 methodology (composite-binding, Phase 0 classification, Principle #17 exclusion list) + Chu kỳ 21 Bayesian family elimination.
>
> **Content below frozen per Principle #16** (pre-reg immutability). Historical reference only.
>
> **Previous status**: PAUSED pending Kịch bản 2 flow (Chu kỳ 17 HMM → 18 closure → 19 post-closure → 20 methodology refinement → 21 Bayesian → **22 Optimization** (this scope expanded)).

### Mode shift: từ "breakthrough research" sang "optimization research"

Chu kỳ 1-16 mục tiêu = **tìm mechanism mới** (Accept breakthrough). 16 cycles × ~60 strategies × 0 Accept → win-rate + ROI axes both exhausted. Chu kỳ 17 shift sang **"best of tested"**: ranking existing strategies bằng ROI primary + replication, để pick data-backed choices cho UI + budget feature.

**User intent (2026-04-21)**:
1. **Use case 1** — màn gợi ý từng trò: pick strategy có ROI tốt nhất per product, replicated
2. **Use case 2** — feature budget-aware sắp tới: "chọn bộ số có ROI/winrate tốt nhất với budget X VND"

**Scope B execution**: 3D phase trước, matrix phase sau (Chu kỳ 17b). User priority 3D first.

### NOT a breakthrough cycle (important distinction)

| Aspect | Breakthrough cycles 1-16 | Chu kỳ 17 optimization |
|--------|--------------------------|-------------------------|
| Strategies | NEW mechanisms | EXISTING strategies re-evaluated |
| Bonferroni | K = n_new | NO Bonferroni (không claim mới) |
| Decision | Accept/Suggestive/Reject | "Ship-worthy" vs "Best of null field" |
| Metric primary | win_rate_ge3 | **pooled_ROI_pct** |
| Tournament | Drive rank | Tiebreaker only |
| Output | ship Accept OR Reject | ALWAYS update UI picks.roi (best available) |

### Hypothesis framing

**No "does strategy X work" claim**. Just: **given 10 existing 3D strategies (all tested in prior cycles), which has most ROI-robust performance across replication slices on Max 3D and Max 3D Pro?**

Decision outcomes:
- **Robust winner**: strategy với full + both halves + forward all show ROI > Random → ship to `picks.roi` với "✓ ROI-robust" badge
- **Null field best**: nếu không strategy nào pass replication → pick least-negative direction-consistent (halves direction-match) với "🔬 Best of null field" badge + honest disclosure
- **Explicit worst**: strategies significantly worse than Random → label rõ ràng "do not pick", ship opposite signal

### Strategies tested (10 existing 3D strategies, no new code)

| Strategy | Source | Role in prior cycles |
|----------|--------|----------------------|
| `Random` | baseline | Chu kỳ 1+ |
| `FreqWholeHot(200)` | Chu kỳ 4 | Near-miss Suggestive Chu kỳ 6, Reject Chu kỳ 7 |
| `FreqCold(200)` | Chu kỳ 4 | Reference |
| `JointDigitBias(300,1,1)` | Chu kỳ 4 | **Mechanism anchor** — top 3D per 3D_FINAL_REPORT |
| `BayesianDigit(300,1,1)` | Chu kỳ 2 | Baseline Bayesian |
| `Bayes_Sharp(180,1,0.5)` | Chu kỳ 2 | Sharp temperature variant |
| `MaxEntropy(300,1)` | Chu kỳ 2 | Coverage-ish |
| `Adaptive` | Chu kỳ 2 | Family eliminated Chu kỳ 14 (retained as ref) |
| `ExpectedValueMaximizer(300,100,4)` | Chu kỳ 4 | Chu kỳ 7 Reject (half-flip) — retained vì ROI-focused design |
| `CoverageOpt` | Chu kỳ 4 | Mentioned in 3D report |

### Products

- **Max 3D** N=1065, midpoint 532, forward last 100
- **Max 3D Pro** N=711, midpoint 355, forward last 100

### Backtest config

- `min_history=50`, `n_runs=5`, `seed=42` (same as Chu kỳ 11/13)
- **Two N configurations** (covers both use cases):
  - **N=1** (single-ticket) → drives picks for UI "Gợi ý" screen
  - **N=20** (multi-ticket) → drives budget feature spec (budget=200k VND scenario)

### ROI replication gate (binding)

```
Strategy "ship-worthy robust" iff ALL 4:
  1. Full-sample ROI > Random ROI
  2. Half-1 ROI > Random Half-1 ROI
  3. Half-2 ROI > Random Half-2 ROI
  4. Forward_last_100 ROI > Random forward ROI (directional only, không strict p)
```

Nếu không strategy pass 4/4 → apply **"null field best" fallback**:
- Pick strategy với best full-sample ROI + direction-consistent halves (relax forward)
- Badge "🔬 Best of null field" không phải "✓ ROI-robust"
- UI disclosure rõ ràng

### Principle #14 magnitude check

3D single-ticket ceiling (Chu kỳ 16 principle generalization) ~+10pp ROI Δ. Auto-flag threshold ±30pp. Any strategy showing |Δ_ROI| > 30pp → sanity audit needed (one-jackpot artifact risk, per Chu kỳ 14 Bayes_Sharp Mega forward +103% outlier).

### Artifacts kỳ vọng

- `website/research/3d/cycle17a_roi_backtest.py` — runner reuses advanced_backtest strategies, ROI-focused output
- `website/research/3d/cycle17a_roi_results.json` — per segment per strategy per N configuration
- Section "Chu Kỳ 17a — Result" append vào file này
- Updated `PRODUCT_RANKS.picks.roi` cho Max 3D + Max 3D Pro trong [SuggestionPanel.tsx](../../src/components/products/SuggestionPanel.tsx)
- `cycle17a_3d_budget_feature_spec.md` fragment (3D portion của feature spec)

### Follow-up

- **Chu kỳ 17b** (next, matrix phase): same methodology áp dụng trên Power/Mega/Lotto với single + multi-ticket
- **Chu kỳ 18** (optional): implement UI budget feature based on combined 17a+17b specs
- **Chu kỳ 19** (optional): project closure report synthesizing 1-18

### Guardrails

- NO new strategies — chỉ re-evaluate existing
- NO mechanism claims — "ROI-robust" is product-decision label, not scientific Accept
- NO Bonferroni — không test new hypotheses
- Pre-reg immutable sau implementation begins
- Honest fallback framing nếu null field (prevent overclaiming)

---

*Pre-registered: 2026-04-21 — Chu Kỳ 17a 3D ROI ranking. Optimization cycle, not breakthrough. User approved Scope B, 3D first.*

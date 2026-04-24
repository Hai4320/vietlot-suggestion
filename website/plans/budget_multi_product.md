# Plan — Multi-Product Budget Strategy Ranker

**Status**: 📝 **PLANNING 2026-04-24** — awaiting user review + approve before execution.

**Origin**: User request post Chu kỳ 28 C6 validation. "Nhập số tiền → list các chiến lược tốt nhất theo từng trò."

**Relation to Chu kỳ 24**: extends the C24 fixed-budget allocator (B=100K, single product) → arbitrary budget × all 5 products simultaneously.

---

## 1. User story

> Là 1 user, tôi muốn nhập 1 số tiền (e.g., 50K / 100K / 500K / tự gõ) và xem ngay:
> - Chiến lược tốt nhất cho mỗi trong 5 sản phẩm
> - ROI lịch sử, P(trúng), ticks-to-first-hit, ruin probability
> - Đề xuất "nên chơi trò nào" cho budget này
> - Tickets sinh ra sẵn sàng mua

Mental model: **budget-first** (vs Chu kỳ 22-23 strategy-first). User quan tâm "100K tôi có thể chơi gì tốt nhất?" hơn là "thuật toán nào hay cho Max 3D?".

---

## 2. Architecture

### 2.1 Compute layer (Python — research/optimization/)

Extend C24 allocator để support:
- **Budget ladder** (pre-compute discrete tiers): 10K / 50K / 100K / 500K / 1M / 5M
- **All 5 products per budget tier** in one sweep
- **Top-3 portfolios per (product, budget_tier)** — covers the "best strategy" scope
- Output: single JSON `budget_ladder_rankings.json` với 3D matrix `{budget_tier × product × top-3 portfolios}`

Runtime estimate: ~5-10 min for full sweep (5 budgets × 5 products × ~10 candidates × 100 draws × 5 runs).

### 2.2 Data module (TypeScript — src/lib/)

`budget-ladder-data.ts` — auto-synced từ JSON (pattern giống C22/C24).

```typescript
export interface ProductPortfolioAtBudget {
  product: ProductKey;
  budget_tier: number; // VND
  n_tickets: number;
  top_portfolio: C24Portfolio;
  expected_roi: number;
  p_win_ge1: number;
  ruin_prob_full_budget: number;
}

export const BUDGET_LADDER: ProductPortfolioAtBudget[]; // 5 tiers × 5 products = 25 entries
```

### 2.3 UI layer

**Route**: `/budget` (new dedicated route, per user's Chu kỳ 24 feedback "không nên ở /suggest").

**Component tree**:
```
/budget page
├── <BudgetInput>           — slider + preset buttons (10K/50K/100K/500K/1M) + custom input
├── <BudgetResultsTable>    — 5 rows (1 per product), sorted by composite score
│   ├── Product name + emoji
│   ├── Recommended portfolio (strategy label + ticket count)
│   ├── Expected stats (ROI, P(hit))
│   ├── Tickets preview (collapsible)
│   └── "Generate tickets" button → CSV + visual list
├── <BudgetComparison>      — which product gives best value?
│   ├── Highest expected ROI
│   ├── Highest P(win≥1)
│   └── Safest (lowest ruin)
└── <BudgetDisclaimer>      — EV âm caveat, rule stability
```

**Nav entry**: "💰 Budget Strategy" under existing tools menu.

**Interpolation**: when user inputs budget between tiers (e.g., 300K), use nearest tier OR interpolate ticket counts within top-3 portfolios.

### 2.4 CLI extension

Extend `vietlott-budget`:
```bash
vietlott-budget --budget 500000  # shows top portfolios for ALL 5 products at 500K
vietlott-budget --budget 500000 --product power_655  # keeps current per-product mode
```

---

## 3. Phases

### Phase 1 — Compute + data (~2h)

1.1 Generalize C24 allocator để loop through budget ladder:
- Add `--budget-ladder` CLI flag
- Output `budget_ladder_rankings.json` với all-products × all-budgets

1.2 Run full sweep → produce canonical JSON

1.3 Auto-sync TS module `budget-ladder-data.ts`

### Phase 2 — UI skeleton (~2h)

2.1 New route `/budget` (page.tsx skeleton)

2.2 Component: `<BudgetInput>` slider + preset tabs

2.3 Component: `<BudgetResultsTable>` — render ranked products from data module

2.4 Nav integration (add link to main menu)

### Phase 3 — Ticket generation + CSV (~1h)

3.1 Reuse `BudgetWidget` ticket generator logic

3.2 "Generate tickets" button per product row

3.3 CSV export compatible với `/check-rate`

### Phase 4 — Polish + tests (~1h)

4.1 Disclaimer banner

4.2 "Compare" card: which product best for this budget

4.3 Type check + build + smoke all routes

4.4 Visual spot-check

### Phase 5 — Ship + docs (~30 min)

5.1 Update `/algorithms` or `/glossary` with budget feature entry

5.2 History record if this becomes a Chu kỳ deliverable (likely Chu kỳ 30 or ship as standalone feature)

5.3 Commit + push

---

## 4. Interaction with C6 A=B (critical dependency)

**Dependency**: C6 A=B Max 3D Pro ACCEPT status (pending external validation).

**If C6 validated** → Max 3D Pro portfolios tại budget ladder dùng A=B exploit (H1 N=10 at B=100K, H5 N=5 at B=50K, pure C6 N=1 at B=10K).

**Expected output** for Max 3D Pro tại B=100K:
- Portfolio = H1 A=B N=10
- Expected ROI = +4056% (per Chu kỳ 28)
- Đây là **outlier vs 4 products khác** (all negative ROI). UI phải:
  - Surface prominently nhưng với disclosure banner về quy chế dependency
  - Rank Max 3D Pro cao nhất trên "compare" card

**If C6 not validated** → Max 3D Pro uses C24 null-pick fallback (C5 or TierWeighted).

---

## 5. Composite scoring per product for "best strategy"

At budget B, for each product:
- Run allocator — generate N candidates × 100 forward draws × 5 runs
- Composite per C24 formula (E[payout] 0.35 / P(win≥1) 0.25 / −var 0.15 / coverage 0.15 / budget_eff 0.10)
- Top-1 = "best strategy"

"Compare products" card uses:
- Best ROI product: argmax(roi_pct) across 5 products at same B
- Best P(hit) product: argmax(p_any_hit)
- Safest product: argmin(ruin_prob)

---

## 6. Effort + timeline

| Phase | Effort | Dependency |
|:-:|:-:|---|
| 1 | ~2h | Python only |
| 2 | ~2h | Phase 1 JSON |
| 3 | ~1h | Phase 2 skeleton |
| 4 | ~1h | Phase 3 |
| 5 | ~30 min | Phase 4 |
| **Total** | **~6-7h** | |

Can split across 2 Chu kỳ (29 = Phase 1-2 compute+skeleton, 30 = Phase 3-5 UI polish).

---

## 7. Open questions (for user review)

1. **Budget ladder tiers**: 10K / 50K / 100K / 500K / 1M / 5M đủ chưa? Thêm tier nào?
2. **Custom budget interpolation**: user gõ 300K — round to nearest tier OR interpolate ticket count?
3. **Route `/budget`** có phải là naming OK? Alternatives: `/portfolio`, `/what-to-play`, `/chu-tro-gi`
4. **Default budget** on page load: 100K (Chu kỳ 24 canonical) OK?
5. **C6 A=B inclusion**: confirmed shipping với Max 3D Pro post-validation?
6. **Comparison metric**: highest ROI = best product, hay P(hit) = best? (3D Pro may dominate ROI post-C6, but user psychology may prefer P(hit))
7. **Include historical losing products?**: Mega 6/45 consistently ROI −86%, user có muốn thấy trong list hay filter out?

---

## 8. Not in scope

- Real-time Vietlott data (crawler is separate pipeline)
- Multi-session portfolio tracking (user saves their plans over time)
- Tax/commission calculation (historical)
- Social sharing / group budgets

---

## 9. Success criteria

- User can input any budget 10K-10M và see ranked product portfolios trong < 2s
- Max 3D Pro dominates ranking tại valid budgets post-C6 (expected ROI +4000% vs other products −85%)
- CSV export tương thích `/check-rate`
- Disclosure banners honest về EV âm + rule stability
- No "🏆 Khuyến nghị" on negative-EV products (keep Chu kỳ 23 honesty gate)

---

## 10. Open for review

Awaiting user answers §7 + approve before execute.

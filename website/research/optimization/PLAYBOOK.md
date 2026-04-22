# Optimization Mode — Playbook

**Lighter methodology vs [RESEARCH_PLAYBOOK.md](../RESEARCH_PLAYBOOK.md) (breakthrough mode).**

Optimization cycles rank existing strategies for UI deployment. No new mechanism. No Accept claims. No falsification. Simpler pipeline, higher delivery focus.

---

## Pipeline (3 phases, simplified)

```
Phase O-0: Scope + Constraints  →  Phase O-1: Rank  →  Phase O-2: Ship
      [exclusion list,              [composite        [UI update,
       products, metrics]            tournament]       honest labels]
```

No Phase 1 bias detection (we're not looking for new bias).
No Phase 2 algorithm design (we're using existing).
No 3-gate (power gate N/A for descriptive).

---

## Phase O-0: Scope + Constraints

### Entry
User/business requirement for UI pick update OR new product/feature.

### Checklist

- [ ] **Scope**: which products (3D only? Matrix only? All?)
- [ ] **Metric priority**:
  - `picks.winrate` → primary metric = win_rate_ge3 (matrix) / exact_match_rate (3D)
  - `picks.roi` → primary metric = roi_pct (least-negative)
  - Both may surface same or different strategy per product
- [ ] **Exclusion list check** (per [README.md §Exclusion list](README.md)):
  - GBM (overfit Chu kỳ 12/12.5)
  - Kelly variants (Chu kỳ 16)
  - HMM variants (Chu kỳ 17)
  - Hybrid ensemble (Chu kỳ 19e)
  - HierarchicalEB_Sharp/_Lazy (Chu kỳ 21)
- [ ] **Phase 0 power classification** (Principle #12 BINDING inherited):
  - Declare "exploratory-only" — Optimization mode accepts this
  - No Accept claims, ranking only
- [ ] **Output format**:
  - `PRODUCT_RANKS[slug].picks.winrate` → best-of-non-excluded by winrate
  - `PRODUCT_RANKS[slug].picks.roi` → best-of-non-excluded by roi
  - Optional: list top-3 per metric cho glossary transparency

### Deliverables
- Pre-reg `proposals/cycleNN_optimization_*.md` documenting scope + metrics + exclusions

### Exit
Pre-reg approved → Phase O-1.

---

## Phase O-1: Rank

### Entry
Pre-reg approved.

### Checklist

- [ ] **Load existing backtest data** — reuse results JSONs, no new backtest unless data stale
- [ ] **Apply exclusion list** — remove blacklisted strategies from ranking pool
- [ ] **Compute composite score** per strategy per product:
  - `score = 0.40 × z(Δ_win) + 0.30 × z(Δ_roi) + 0.15 × z(sharpe) + 0.15 × z(-log10 p)`
  - z-normalize within (product, segment) group
  - Use full-segment data (most stable, largest n)
- [ ] **Rank strategies by composite** — top-3 per product
- [ ] **Verify top-2 with split-half** (Principle #11 light check):
  - Split-half direction consistency required for UI promotion
  - If top-1 direction-flips: demote to top-2
  - If both top-1 + top-2 flip: pick next valid
- [ ] **Pick selection** per [website/CLAUDE.md §Pick selection rule](../../CLAUDE.md):
  1. Loại strategy có decision Reject vì overfit/direction-flip/Principle #14/#15
  2. Max winPct/exactPct → `picks.winrate`
  3. Max roi → `picks.roi`
  4. Nếu cùng strategy → omit `picks.roi`

### Tournament metric set (inherited from Chu kỳ 10 + BINDING Chu kỳ 20)

| Metric | Weight | Notes |
|---|:---:|---|
| Δ win_rate_ge3 (matrix) / Δ exact_match_rate (3D) | 0.40 | primary |
| Δ ROI_pct vs Random | 0.30 | secondary |
| Sharpe ratio | 0.15 | risk-adjusted |
| -log10(p-value) | 0.15 | significance guard |

### Deliverables
- Ranking table per product
- Top-2 split-half verification JSON
- Pick selection justification

### Exit
All products have `(picks.winrate, picks.roi)` assigned → Phase O-2.

---

## Phase O-2: Ship

### Entry
Rankings finalized + pick selection done.

### Checklist

- [ ] Update [website/src/components/products/SuggestionPanel.tsx](../../src/components/products/SuggestionPanel.tsx) `PRODUCT_RANKS[slug].picks`
- [ ] Update [website/src/lib/backtest-data.ts](../../src/lib/backtest-data.ts) with latest metric values
- [ ] Update [website/src/app/algorithms/page.tsx](../../src/app/algorithms/page.tsx) strategy descriptions nếu cần
- [ ] **UI disclosure labels** per [website/RESEARCH_TO_UI_PLAYBOOK.md §5](../../RESEARCH_TO_UI_PLAYBOOK.md):
  - "🎯 Trúng cao nhất" green (winrate pick, directional only)
  - "💰 Lỗ ít nhất" yellow (roi pick, still negative)
  - NOT "🏆 Khuyến nghị" (requires confirmed Accept, not available post-closure)
- [ ] **Honest caveat banner** in affected product pages:
  - "Ranking cập nhật post Chu kỳ NN. ~69 strategies tested, 0 confirmed edge (PROJECT_CLOSURE_REPORT). Picks là 'best of null field', không phải profitable."
- [ ] Build pass: `make website-build`
- [ ] Curl smoke test all 6 product routes
- [ ] Visual spot-check UI

### Deliverables
- Ship-ready UI changes
- Commit message follows convention: `research(cycleNN): optimization rank update — 3D + matrix picks`

### Exit
Build pass + smoke pass + history record written → cycle closed.

---

## Differences from Breakthrough playbook

| Aspect | Breakthrough | Optimization |
|---|---|---|
| Pre-reg length | Full (hypothesis, mechanism, retry tree, ...) | Compact (scope, metrics, exclusions, output) |
| Backtest needed | Yes, new mechanism | No, reuse existing |
| Significance test | 3-gate stacked | Split-half light check only |
| Principle #12 power | BINDING gate | Classification only (exploratory-only) |
| Principle #17 family | BINDING check | N/A (not proposing new) |
| Verdict | Accept / Reject / etc. | "Best pick by composite" (descriptive) |
| Output artifact | `history/cycleNN.md` verdict | UI update + compact history entry |
| Effort | Typically 1-2 tuần | Typically 3-5 ngày |

---

## Anti-patterns (specific to Optimization)

| Anti-pattern | Why bad | Fix |
|---|---|---|
| Surface excluded strategy as UI pick | Dishonest — overfit GBM etc. shown as "best" | Apply exclusion list + verification step |
| Promote based on single metric | Violates composite-binding Chu kỳ 20 | Use composite score, document single-metric as diagnostic |
| Claim "Accept" in UI | Scientifically false — no adequate power | Use "🎯 Trúng cao nhất" / "💰 Lỗ ít nhất" labels |
| Skip split-half verification | Direction-flip strategies will ship bad UX | Top-2 split-half check mandatory |
| Re-backtest existing strategies | Waste compute, results already in JSONs | Reuse existing results; only backtest new product/data |

---

## Reference docs

- [optimization/README.md](README.md) — mode overview + roadmap
- [PROJECT_CLOSURE_REPORT.md](../PROJECT_CLOSURE_REPORT.md) — what research found (null)
- [RESEARCH_PLAYBOOK.md](../RESEARCH_PLAYBOOK.md) — breakthrough methodology (for comparison)
- [EVALUATION.md §8](../EVALUATION.md) — composite tournament spec (BINDING)
- [website/CLAUDE.md §Pick selection rule](../../CLAUDE.md) — UI pick conventions
- [website/RESEARCH_TO_UI_PLAYBOOK.md](../../RESEARCH_TO_UI_PLAYBOOK.md) — shipping UI changes

## What to write when a cycle runs

```markdown
## Chu Kỳ NN — Optimization: <Scope> (Closed YYYY-MM-DD)

**Pre-reg** (frozen): `proposals/executed/cycleNN_*.md`

### Scope
- Products: <list>
- Metrics: composite (0.40/0.30/0.15/0.15)
- Exclusion list applied: <list strategies excluded>

### Rankings

<Per-product top-3 table>

### Picks assigned

| Product | picks.winrate | picks.roi |
|---|---|---|
| ... | ... | ... |

### UI changes shipped
- SuggestionPanel.tsx PRODUCT_RANKS updated
- Build pass ✓, smoke ✓
```

Keep history records short for Optimization cycles. Details live in pre-reg + results JSON.

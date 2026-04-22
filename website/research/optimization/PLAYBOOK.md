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
- [ ] **Pick axes**: 3 composite profiles → 3 picks ([MEASUREMENT.md §3](MEASUREMENT.md))
  - `picks.winrate` → driven by WinRate-focused composite (w=0.60/0.20/0.10/0.10)
  - `picks.roi` → driven by ROI-focused composite (w=0.20/0.60/0.10/0.10)
  - `picks.balanced` → driven by Balanced composite (w=0.40/0.40/0.10/0.10)
  - Collapse khi trùng: 3 cùng → 1 pick, 2 trùng → 2 picks (§3.2)
- [ ] **Exclusion list check** — reference canonical [MEASUREMENT.md §4](MEASUREMENT.md) (2-tier):
  - Tier 1 hard exclude: GBM (C12/12.5), Kelly (C16), HMM (C17), Hybrid (C19e), HierarchicalEB Sharp/Lazy (C21), Single_N6 (C19e)
  - Tier 2 family eliminated (Principle #17): Adaptive (C14), OnlineBayes λ (C14), BayesianDirichlet + Bayes_Sharp (C21), HierarchicalEB default T=1.0 (C21)
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
- [ ] **Compute 3 composite profiles** per strategy per product (§2 [MEASUREMENT.md](MEASUREMENT.md)):
  - **WinRate-focused**: `0.60·z(Δ_win) + 0.20·z(Δ_roi) + 0.10·z(sharpe) + 0.10·z(-log10 p)`
  - **ROI-focused**: `0.20·z(Δ_win) + 0.60·z(Δ_roi) + 0.10·z(sharpe) + 0.10·z(-log10 p)`
  - **Balanced**: `0.40·z(Δ_win) + 0.40·z(Δ_roi) + 0.10·z(sharpe) + 0.10·z(-log10 p)`
  - z-normalize trong (product, non-excluded) group
  - Dùng full-segment data (most stable, largest n)
- [ ] **Rank strategies theo từng profile** — top-3 per product per profile
- [ ] **Identify 3 pick candidates**: argmax của mỗi composite profile
- [ ] **Split-half verify TRÊN PICKS** (Principle #11 light, §3.3 MEASUREMENT):
  - Direction consistency: `sign(half1_Δ_primary) == sign(half2_Δ_primary)`
  - Nếu flip: demote, chọn argmax kế tiếp của same profile. Retry ≤ 3 lần
  - Nếu 3 lần đều flip: pick = `null`, UI "Không có pick đủ tin cậy"
- [ ] **Collapse rules** khi picks trùng strategy (§3.2 MEASUREMENT):
  - 3 trùng → 1 pick `🎯💰⚖`
  - 2 trùng → 2 picks với combined label
  - Khác nhau → 3 picks đầy đủ

### Tournament metric set (4 metrics, §1 [MEASUREMENT.md](MEASUREMENT.md))

| Metric | Notes |
|---|---|
| Δ win_rate_ge3 (matrix) / Δ exact_match_rate (3D) | primary trục winrate |
| Δ ROI_pct vs Random | primary trục roi |
| Sharpe ratio | risk-adjusted guard |
| -log10(p-value) | significance guard |

**Weights khác EVALUATION §8** — Optimization dùng 3 profiles thay vì single composite. Xem §2.2 MEASUREMENT.md cho divergence rationale.

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

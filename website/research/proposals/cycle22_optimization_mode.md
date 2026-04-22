## Chu Kỳ 22 — Pre-Registration: Optimization Mode (3D + Matrix Unified)

**Status (2026-04-22)**: AWAITING user approval. Supersedes [cycle17a_roi_ranking_3d.md](cycle17a_roi_ranking_3d.md) (3D-only scope).

**Mode**: Optimization (not breakthrough). See [optimization/README.md](../optimization/README.md) + [optimization/PLAYBOOK.md](../optimization/PLAYBOOK.md).

**Estimated effort**: 1-2 tuần.

---

### Context

Post Chu kỳ 21, project transitions from breakthrough research (closed Chu kỳ 18) to **user-facing Optimization mode**. Goal: deliver best-available picks per product for UI, given null breakthrough findings.

Chu kỳ 20 methodology refinement enables clean Optimization execution:
- Composite-binding decision (EVALUATION §8)
- Phase 0 power classification (exploratory-only, no Accept claims)
- Principle #17 family elimination → exclusion list for UI promotion

cycle17a (original 3D-only scope) superseded by this expanded scope (3D + matrix unified).

### Hypothesis / Goal (pre-registered)

**Not a scientific hypothesis — goal statement**:

> For each of 5 products (Max 3D, Max 3D Pro, Power 6/55, Mega 6/45, Lotto 5/35), rank all non-excluded strategies by composite tournament score. Assign `picks.winrate` + `picks.roi` for UI deployment. Apply split-half replication light check to top-2. Ship to UI with honest labels.

**No Accept/Reject claims**. Output is descriptive ranking + UI artifact.

### Scope

**Products** (5 total):
- Max 3D (N=1065, ~21 strategies from advanced_backtest.py)
- Max 3D Pro (N=711, same strategy set)
- Power 6/55 (N=1334, ~10 strategies from backtest.py + cycle14/15/16/17/21 additions)
- Mega 6/45 (N=1302, same)
- Power 5/35 (N=543, same — Lotto, smallest N)

**Metrics** (composite inherited from Chu kỳ 10 + BINDING Chu kỳ 20):
- 0.40 × z(Δ_win_rate) + 0.30 × z(Δ_ROI) + 0.15 × z(Sharpe) + 0.15 × z(-log10 p)

**Exclusion list** (per optimization/README.md — excluded from UI `picks`):

| Strategy | Reason | Source cycle |
|---|---|:---:|
| GBMDigitClassifier (3D) | Overfit confirmed | 12, 12.5 |
| Kelly_Portfolio variants | Set-coverage ⊥ concentration, Δ=-28pp | 16 |
| HMM_K2_W20/W40 (3D + matrix) | Concentration collapse + split-half flip | 17 |
| Hybrid_1S_5R, Hybrid_3S_3R | Split-half direction flip | 19e |
| HierarchicalEB_Sharp, HierarchicalEB_Lazy | Split-half direction flip Power 6/55 | 21 |
| Single_N6 | Insignificant at all gates | 19e |

**Excluded but still considered** (for reference only, not promoted):
- Original Bayesian batch (Chu kỳ 2) — eliminated family but close-call candidate
- Online Kalman variants (Chu kỳ 14) — eliminated family
- HierarchicalEB default T=1.0 (Chu kỳ 21) — eliminated family

### Phase 0 Power Classification (Principle #12 inherited)

**ALL products classified `exploratory-only`** per Chu kỳ 20 A5 analysis. Optimization mode explicitly accepts this — descriptive picks without Accept claims.

**Implication**: UI labels MUST be "🎯 Trúng cao nhất" / "💰 Lỗ ít nhất" (descriptive) — NOT "🏆 Khuyến nghị" (requires adequate power for Accept).

### Family Check (Principle #17 inherited)

**N/A for Optimization** — not proposing new mechanism. Using existing strategies.

**Derivative rule**: strategies belonging to eliminated families may be ranked (for diagnostic transparency) but MUST NOT promote as `picks.winrate` or `picks.roi`. Enforced via exclusion list above.

### Methodology

#### Phase O-0: Scope + Constraints (DONE in this pre-reg)

Declared above.

#### Phase O-1: Rank (per optimization/PLAYBOOK.md)

**Data source**: Existing results JSONs — no new backtest unless:
- Product has significantly new data (>50 draws since last cycle) — check crawler date
- Strategy needs re-run for composite score completeness

**Computation per product**:

1. Load all strategies' (win_rate, ROI, Sharpe, p_vs_Random) from latest cycle results
2. Apply exclusion list
3. Compute composite score per strategy (z-normalize within product)
4. Rank by composite descending
5. **Top-2 split-half verification**:
   - Load half1 + half2 Δ for top-2
   - If direction flip (h1×h2 < 0): demote, pick next valid
   - If consistent: proceed

6. **Pick selection**:
   - `picks.winrate` = max(winrate) among non-excluded survivors
   - `picks.roi` = max(roi) among non-excluded survivors
   - If same strategy: omit `picks.roi`, UI shows single pick

#### Phase O-2: Ship (per optimization/PLAYBOOK.md)

UI update:
- [website/src/components/products/SuggestionPanel.tsx](../../src/components/products/SuggestionPanel.tsx) `PRODUCT_RANKS[slug].picks`
- [website/src/lib/backtest-data.ts](../../src/lib/backtest-data.ts) metric values
- [website/src/app/algorithms/page.tsx](../../src/app/algorithms/page.tsx) descriptions nếu có strategy mới featured

Honest labels:
- "🎯 Trúng cao nhất" (green) cho `picks.winrate`
- "💰 Lỗ ít nhất" (yellow) cho `picks.roi`
- Disclosure banner: "Ranking post Chu kỳ 22. 0 confirmed edge (PROJECT_CLOSURE_REPORT)."

Build + smoke test.

### Exit criteria

- [ ] Phase O-1 output: ranking table + split-half verification per 5 products
- [ ] Phase O-2 output: UI changes shipped with honest labels
- [ ] Build pass (`make website-build`)
- [ ] Curl smoke test all product routes 200
- [ ] History record written: `history/cycle22_optimization_mode.md`

### Effort breakdown

| Step | Task | Effort |
|---|---|:---:|
| 1 | Extract current results + composite computation script | 1d |
| 2 | Apply exclusion list + ranking script | 0.5d |
| 3 | Split-half verification cho top-2 per product | 0.5d |
| 4 | Pick selection + output ranking table | 0.5d |
| 5 | UI PRODUCT_RANKS update + labels | 1d |
| 6 | Build + smoke + visual QA | 0.5d |
| 7 | History record + commit + push | 0.5d |
| 8 | Optional: glossary page update with exclusion rationale | 1d |
| **Total** | — | **~5-6d** |

### Retry Tree (Principle #16 inherited, simplified for Optimization)

#### Tier 1 — Mode-level fallback

Không có — Optimization là deterministic given rules. Nếu outputs không ship (ví dụ: all products have ALL strategies excluded):
- Escalate to user — unusual case, investigate
- Fallback: "No strategy recommended" label on affected products (UI honesty)

#### Tier 2 — Within-Optimization retries

| # | Variant | Trigger |
|:-:|---|---|
| 22.1 | Adjust composite weights (reduce win-rate priority → 0.35, boost ROI → 0.35) | Ranking dominated by win-rate to detriment of ROI-positive near-misses |
| 22.2 | Split-half verification expanded to top-3 | Top-2 both direction-flip on multiple products |
| 22.3 | Per-product composite weights (different products, different user intents) | UI user research reveals per-product priority differences |

**Execution policy**: No auto-retry. User-initiated + new pre-reg cycle.

### Eliminated from scope (do NOT do in this cycle)

- New mechanism testing (would be Chu kỳ 25+ reopen territory)
- Reclassify history verdicts (Chu kỳ 20 did that)
- Refactor strategy modules (stable)
- Change evaluation formulas (Chu kỳ 20 finalized)

### Artifacts (planned)

- **Pre-reg** (this file): frozen post-approve per Principle #16
- **Computation script**: `optimization/cycle22_ranking.py`
- **Output data**: `optimization/cycle22_rankings.json`
- **History record**: `history/cycle22_optimization_mode.md` (compact per PLAYBOOK §What to write)
- **UI changes**: SuggestionPanel.tsx, backtest-data.ts, algorithms/page.tsx

### Note on cycle17a

[cycle17a_roi_ranking_3d.md](cycle17a_roi_ranking_3d.md) was the original (PAUSED) pre-reg for 3D-only Optimization, written pre-Chu kỳ 20. Superseded by this pre-reg due to:
- Expanded scope (3D + matrix unified, not 3D-only)
- Uses Chu kỳ 20 methodology (composite-binding, Phase 0 classification)
- Incorporates Chu kỳ 20 Inconclusive-UP reclassifications
- Includes post Chu kỳ 21 Bayesian exclusion list

cycle17a remains in proposals/ for historical reference; content immutable per Principle #16.

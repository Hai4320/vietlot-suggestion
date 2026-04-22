## Chu Kỳ 22 — Pre-Registration: Optimization Mode (3D + Matrix Unified)

**Status**: ✅ **APPROVED 2026-04-22** by user. Frozen per Principle #16. Supersedes [cycle17a_roi_ranking_3d.md](cycle17a_roi_ranking_3d.md) (3D-only scope).

**Mode**: Optimization (not breakthrough). See [optimization/README.md](../optimization/README.md) + [optimization/PLAYBOOK.md](../optimization/PLAYBOOK.md).

**Estimated effort**: 1-2 tuần.

### Canonical goals (approved 2026-04-22)

Optimization Mode xuyên suốt Chu kỳ 22+ phục vụ **2 use cases**:

1. **Use case 1 — per-product picks** (⬅ SCOPE CHU KỲ 22): màn gợi ý từng trò, pick strategy có ROI hoặc winrate tốt nhất per product, replicated (split-half verification top-2).
2. **Use case 2 — budget-aware feature** (⬅ SCOPE CHU KỲ 23): "chọn bộ số có ROI/winrate tốt nhất với budget X VND". Separate pre-reg sẽ viết sau khi Chu kỳ 22 ship.

Chu kỳ 22 chỉ deliver Use case 1. Use case 2 depend on Use case 1 outputs (ranking table + excluded-strategy list) nên phải sau.

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

> Cho mỗi 5 products (Max 3D, Max 3D Pro, Power 6/55, Mega 6/45, Lotto 5/35), tính **3 composite profiles** (WinRate-focused / ROI-focused / Balanced) theo [MEASUREMENT.md §2](../optimization/MEASUREMENT.md). Chọn top-1 của mỗi profile làm `picks.winrate` / `picks.roi` / `picks.balanced`. Split-half verify **trên các picks** (không phải top-2 composite). Apply collapse rules khi picks trùng strategy. Ship UI với labels honest.

**No Accept/Reject claims**. Output là descriptive ranking (3 axes) + UI artifact.

### Scope

**Products** (5 total, với per-product sub-deliverables):

| # | Product | N | Strategies sau exclusion | Risk null picks | Sub-deliverable |
|:-:|---|:-:|:-:|---|---|
| 22.A | Max 3D | 1065 | ~16 | Low | `rankings.products.max_3d` |
| 22.B | Max 3D Pro | 711 | ~16 | Moderate | `rankings.products.max_3d_pro` |
| 22.C | Power 6/55 | 1334 | ~12 | Low | `rankings.products.power_655` |
| 22.D | Mega 6/45 | 1302 | ~12 | Low | `rankings.products.mega_645` |
| 22.E | **Power 5/35** | **543** | ~12 | **Elevated (small N)** | `rankings.products.power_535` — accept `picks=null` nếu flip 3× |

**Ranking script chạy 1 lần** cho cả 5 products (deterministic compute), nhưng output có 5 sub-sections độc lập. Review gate per-product: nếu một product có issue bất thường, pause review product đó không block 4 còn lại.

**Metrics + composite profiles** (canonical: [MEASUREMENT.md §2](../optimization/MEASUREMENT.md)):

3 profiles, tất cả frozen trong pre-reg này:

| Profile | w_win | w_roi | w_sharpe | w_neg_log_p | Drives |
|---|:-:|:-:|:-:|:-:|---|
| WinRate-focused | 0.60 | 0.20 | 0.10 | 0.10 | `picks.winrate` |
| ROI-focused | 0.20 | 0.60 | 0.10 | 0.10 | `picks.roi` |
| Balanced | 0.40 | 0.40 | 0.10 | 0.10 | `picks.balanced` |

Divergence rationale với EVALUATION §8 default (0.40/0.30/0.15/0.15): xem MEASUREMENT §2.2.

**Exclusion list** (canonical: [MEASUREMENT.md §4](../optimization/MEASUREMENT.md) — 2-tier unified):

**Tier 1 — Hard exclude**:

| Strategy | Reason | Source cycle |
|---|---|:---:|
| GBMDigitClassifier (3D) | Overfit confirmed | 12, 12.5 |
| Kelly_Portfolio variants | Set-coverage ⊥ concentration, Δ=−28pp | 16 |
| HMM_K2_W20/W40 (3D + matrix) | Concentration collapse + split-half flip | 17 |
| Hybrid_1S_5R, Hybrid_3S_3R | Split-half direction flip | 19e |
| HierarchicalEB_Sharp, HierarchicalEB_Lazy | Split-half direction flip Power 6/55 | 21 |
| Single_N6 | Insignificant at all gates | 19e |

**Tier 2 — Family eliminated (Principle #17 binding) — matrix**:

| Strategy | Family | Source cycle |
|---|---|:---:|
| AdaptiveWindowStrategy / ★Adaptive | Adaptive/drift | 14 |
| OnlineBayes λ=0.01/0.03/0.10 | Online Bayesian/Kalman | 14 |
| BayesianDirichletStrategy / ★Bayesian | Bayesian batch | 21 (family broadly) |
| Bayes_Sharp / ★Bayes_Sharp | Bayesian batch | 21 |
| HierarchicalEB (T=1.0 default) | Hierarchical Bayesian | 21 |

**Tier 2 — conservative extension cho 3D** (user decision 2026-04-22):

| Strategy | Family |
|---|---|
| C1: BayesJoint_HL100 | Bayesian (joint-digit) — conservative lump vào Bayesian family |
| C1: BayesJoint_HL150_S | Bayesian (joint-digit) |
| A3: AdaptBias_T0.9 | Adaptive/drift (AdaptiveBiasTracker) |
| A3: AdaptBias_T0.7 | Adaptive/drift |

**KHÔNG exclude** (ensemble family chỉ bị config-specific binding, không broadly eliminated): `EnsembleBorda`, `C2: MultiSignal`, `ULTIMATE_v1/v2_sharp`.

**Cross-product pooling**: N/A (không rank-able per-product do scope nature).

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

**Computation per product** (canonical logic: [MEASUREMENT.md §2-§3](../optimization/MEASUREMENT.md)):

1. Load all strategies' (win_rate, ROI, Sharpe, p_vs_Random, half1_Δ, half2_Δ) from latest cycle results
2. Apply exclusion list (Tier 1 + Tier 2)
3. Z-normalize 4 metrics trong scope (product, non-excluded)
4. Compute **3 composite scores** cho mỗi strategy (WinRate / ROI / Balanced profiles)
5. **Identify 3 pick candidates**: argmax của mỗi composite
6. **Split-half verify TRÊN PICKS** (không phải top-2 composite):
   - Với mỗi pick: check `sign(half1_Δ_primary) == sign(half2_Δ_primary)` với primary metric của profile
   - Nếu flip: demote, chọn argmax kế tiếp same profile. Retry ≤ 3 lần
   - Nếu 3 lần đều flip: pick = `null`, UI "Không có pick đủ tin cậy"
7. **Collapse rules** ([MEASUREMENT §3.2](../optimization/MEASUREMENT.md)):
   - 3 picks cùng strategy → UI hiển thị 1 pick `🎯💰⚖`
   - 2 trùng → 2 picks với combined labels
   - Khác nhau → 3 picks đầy đủ
8. Output → `optimization/cycle22_rankings.json` theo schema [MEASUREMENT §5](../optimization/MEASUREMENT.md)

#### Phase O-2: Ship (per optimization/PLAYBOOK.md)

UI update:
- [website/src/components/products/SuggestionPanel.tsx](../../src/components/products/SuggestionPanel.tsx) `PRODUCT_RANKS[slug].picks`
- [website/src/lib/backtest-data.ts](../../src/lib/backtest-data.ts) metric values
- [website/src/app/algorithms/page.tsx](../../src/app/algorithms/page.tsx) descriptions nếu có strategy mới featured

Honest labels (theo [MEASUREMENT §6.3](../optimization/MEASUREMENT.md)):
- "🎯 Trúng cao nhất" (green) cho `picks.winrate`
- "💰 Lỗ ít nhất" (yellow) cho `picks.roi`
- "⚖ Cân bằng" (neutral) cho `picks.balanced`
- Combined labels khi collapse: `🎯💰`, `🎯⚖`, `💰⚖`, hoặc `🎯💰⚖`
- Disclosure banner: "Ranking post Chu kỳ 22. 0 confirmed edge (PROJECT_CLOSURE_REPORT). Picks là 'best of null field', không profitable."

Build + smoke test.

### Exit criteria

Checklist đầy đủ: [MEASUREMENT.md §6](../optimization/MEASUREMENT.md). Phân chia theo phase:

**Phase O-1 exit (để unlock O-2)**:
- [ ] `cycle22_rankings.json` chứa 5 products, mỗi product có 3 rankings (winrate/roi/balanced) + picks với `split_half_ok`
- [ ] Power 5/35 null picks acceptable (không phải bug — §3.4 MEASUREMENT)
- [ ] `cycle22_review.md` diagnose unusual patterns
- [ ] USER APPROVAL GATE pass

**Phase O-2 exit (ship UI)**:
- [ ] SuggestionPanel picks match rankings JSON
- [ ] Page `/research/cycle22` live với full ranking tables
- [ ] Glossary giải thích 3 profiles + null picks
- [ ] Labels đúng: `🎯`/`💰`/`⚖` + collapse variants, KHÔNG `🏆 Khuyến nghị`
- [ ] Honesty gates pass (§6.4 MEASUREMENT)
- [ ] `make website-build` pass
- [ ] Curl smoke all 6 routes 200
- [ ] History record written

### Effort breakdown

**Order**: Phase O-1 (compute + review) hoàn toàn trước, Phase O-2 (UI) LAST per user decision 2026-04-22.

**Phase O-1 — Compute + Review (ngày 1-3)**:

| Step | Task | Effort |
|---|---|:---:|
| 1 | Viết `optimization/cycle22_ranking.py` — load data, exclusion Tier 1+2, z-normalize, 3 composites, split-half on picks, collapse rules | 1d |
| 2 | Chạy script → sinh `optimization/cycle22_rankings.json` (5 products) | 0.2d |
| 3 | Review per-product 22.A → 22.E — mỗi product có gate check: picks valid, split-half ok, collapse reasonable | 0.5d |
| 4 | Write diagnostic report `optimization/cycle22_review.md` — highlight null picks nếu có, unusual rankings, cross-product patterns | 0.3d |
| 5 | **USER APPROVAL GATE** — review rankings + picks trước khi sang Phase O-2 | — |

**Phase O-2 — Ship UI (ngày 4-6, LAST)**:

| Step | Task | Effort |
|---|---|:---:|
| 6 | Update [backtest-data.ts](../../src/lib/backtest-data.ts) metric values | 0.5d |
| 7 | Update [SuggestionPanel.tsx](../../src/components/products/SuggestionPanel.tsx) `PRODUCT_RANKS[slug].picks.{winrate,roi,balanced}` + collapse labels | 0.5d |
| 8 | Tạo page mới `/research/cycle22` render full ranking tables (3 profiles × ranked strategies per product) | 1d |
| 9 | Update [glossary/page.tsx](../../src/app/glossary/page.tsx) giải thích 3 profiles + null picks | 0.3d |
| 10 | Disclosure banner + build + curl smoke + visual QA | 0.5d |
| 11 | History record `history/cycle22_optimization_mode.md` + commit | 0.2d |
| **Total** | — | **~5-6d** |

### Retry Tree (Principle #16 inherited, simplified for Optimization)

#### Tier 1 — Mode-level fallback

Không có — Optimization là deterministic given rules. Nếu outputs không ship (ví dụ: all products have ALL strategies excluded):
- Escalate to user — unusual case, investigate
- Fallback: "No strategy recommended" label on affected products (UI honesty)

#### Tier 2 — Within-Optimization retries

| # | Variant | Trigger |
|:-:|---|---|
| 22.1 | Adjust một trong 3 profile weights (ví dụ Balanced → 0.45/0.35/0.10/0.10) | Balanced pick consistently giống WinRate pick → no added value |
| 22.2 | Split-half retry expanded > 3 (raise to 5) | ≥3 products có ≥1 pick = `null` sau 3 retries |
| 22.3 | Per-product profile weights (khác products, khác user intents) | UI user research reveals per-product priority differences |
| 22.4 | Bỏ Balanced pick (về 2-pick mô hình cũ) | Balanced consistently collapse với winrate hoặc roi trên tất cả 5 products |

**Execution policy**: No auto-retry. User-initiated + new pre-reg cycle.

### Eliminated from scope (do NOT do in this cycle)

- New mechanism testing (would be Chu kỳ 25+ reopen territory)
- Reclassify history verdicts (Chu kỳ 20 did that)
- Refactor strategy modules (stable)
- Change evaluation formulas (Chu kỳ 20 finalized)

### Artifacts (planned)

**Phase O-1 outputs (Research layer)**:
- **Pre-reg** (this file): frozen post-approve per Principle #16
- **Computation script**: `optimization/cycle22_ranking.py`
- **Output data**: `optimization/cycle22_rankings.json` (schema §5 MEASUREMENT.md, 5 products)
- **Diagnostic review**: `optimization/cycle22_review.md` (highlight null picks, unusual rankings per product)

**Phase O-2 outputs (UI layer, LAST)**:
- **History record**: `history/cycle22_optimization_mode.md`
- **UI page mới**: `/research/cycle22` rendering full ranking tables
- **UI updates**: SuggestionPanel.tsx, backtest-data.ts, glossary/page.tsx
- **Disclosure banner** updates on affected product pages

### Note on cycle17a

[cycle17a_roi_ranking_3d.md](cycle17a_roi_ranking_3d.md) was the original (PAUSED) pre-reg for 3D-only Optimization, written pre-Chu kỳ 20. Superseded by this pre-reg due to:
- Expanded scope (3D + matrix unified, not 3D-only)
- Uses Chu kỳ 20 methodology (composite-binding, Phase 0 classification)
- Incorporates Chu kỳ 20 Inconclusive-UP reclassifications
- Includes post Chu kỳ 21 Bayesian exclusion list

cycle17a remains in proposals/ for historical reference; content immutable per Principle #16.

## Chu Kỳ 22 — Optimization Mode (Closed 2026-04-22)

**Pre-reg** (frozen, APPROVED 2026-04-22, moved to `executed/` 2026-04-23): [`proposals/executed/cycle22_optimization_mode.md`](../proposals/executed/cycle22_optimization_mode.md)

**Methodology**: [`optimization/MEASUREMENT.md`](../optimization/MEASUREMENT.md) §2-§6 (3 composite profiles, split-half on picks, 2-tier exclusion)

**Artifacts**:
- [`optimization/cycle22_backtest_matrix.json`](../optimization/cycle22_backtest_matrix.json) (178KB) — fresh re-backtest 12 strategies × 3 products × 4 segments
- [`optimization/cycle22_backtest_3d.json`](../optimization/cycle22_backtest_3d.json) (203KB) — 17 strategies × 2 products × 4 segments
- [`optimization/cycle22_rankings.json`](../optimization/cycle22_rankings.json) (canonical) — 3 profiles × 5 products
- [`optimization/cycle22_review.md`](../optimization/cycle22_review.md) — Phase O-1 diagnostic review
- [`optimization/cycle22_ranking.py`](../optimization/cycle22_ranking.py) + `cycle22_rebacktest_{matrix,3d}.py` — scripts

### Scope

**5 products** with per-product sub-deliverables (22.A-22.E):

| Sub | Product | N | Ranked | Picks outcome |
|:-:|---|:-:|:-:|---|
| 22.A | Max 3D | 1065 | 17 | 3 picks diverse ✓ |
| 22.B | Max 3D Pro | 711 | 17 | **all null** (regime split) |
| 22.C | Power 6/55 | 1334 | 12 | 1 pick (collapse all_three) ✓ |
| 22.D | Mega 6/45 | 1302 | 12 | **all null** (baseline drift) |
| 22.E | Power 5/35 | 543 | 12 | 1 pick (collapse all_three), Δ_win âm nhẹ ⚠ |

### Composite profiles (3, pre-registered)

| Profile | w_win | w_roi | w_sharpe | w_neg_log_p | Drives |
|---|:-:|:-:|:-:|:-:|---|
| WinRate | 0.60 | 0.20 | 0.10 | 0.10 | `picks.winrate` |
| ROI | 0.20 | 0.60 | 0.10 | 0.10 | `picks.roi` |
| Balanced | 0.40 | 0.40 | 0.10 | 0.10 | `picks.balanced` |

### Picks assigned (UI-layer)

| Product | picks.winrate | picks.roi | picks.balanced | Collapse |
|---|---|---|---|---|
| Power 6/55 | **MinDistance** | MinDistance | MinDistance | all_three |
| Mega 6/45 | — | — | — | — (all null) |
| Power 5/35 | **Freq_Hot** | Freq_Hot | Freq_Hot | all_three |
| Max 3D | **PairExploiter** | CoverageOpt | FreqWholeHot | none |
| Max 3D Pro | — | — | — | — (all null) |

### Key findings

1. **Mega 6/45 null cause**: Random baseline drift +0.67pp giữa half1 (2.033%) và half2 (2.704%) → mọi top candidate direction flip. Honest null per Principle #11.
2. **Max 3D Pro null cause**: Genuine regime split — D1 EVMaximizer h1 +1.15pp → h2 −0.20pp; ULTIMATE_v2_sharp ngược lại (h1 −0.33pp → h2 +0.93pp). Consistent với Chu kỳ 17 HMM findings về 3D quirkiness per segment.
3. **Power 5/35 Δ_win negative**: Freq_Hot picks.winrate có Δ_win = −0.045pp (tệ hơn Random nhẹ). Composite vẫn top vì ROI +1.80% + sharpe tốt. User decision Option C (glossary-only disclosure).
4. **p=0.0379 (nominal sig)**: Chỉ D3 PairExploiter_T0.5 Max 3D đạt nominal significance — không Accept claim vì Optimization mode không có power gate.

### UI changes shipped (Phase O-2)

**New strategies** ported Python → TypeScript ([types.ts](../../src/lib/types.ts) `SuggestionStrategy` enum +3):
- `mindistance` — [suggest-matrix.ts:278](../../src/lib/suggest-matrix.ts)
- `coverageopt` + `pairexploiter` — [suggest-3d.ts:485](../../src/lib/suggest-3d.ts)

**UI updates**:
- [`SuggestionPanel.tsx`](../../src/components/products/SuggestionPanel.tsx) — `PRODUCT_RANKS` với 3-pick structure + collapse modes + null handling
- [`/research/cycle22`](../../src/app/research/cycle22/page.tsx) — NEW page rendering full rankings (3 profiles × ranked strategies × 5 products)
- [`/glossary`](../../src/app/glossary/page.tsx) — new section "Chu kỳ 22" với 7 terms (Optimization mode, composite profile, pick semantic, null pick, split-half on picks, collapse rules, Tier 1/2 exclusion)
- [`/research`](../../src/app/research/page.tsx) — banner highlighting Chu kỳ 22 + link
- [`cycle22-data.ts`](../../src/lib/cycle22-data.ts) — auto-generated data module from rankings JSON

**QA passed**:
- Type check: `tsc --noEmit` exit 0
- Build: `npm run build` pass (Next.js 16 + Turbopack, 15 static pages)
- Curl smoke: all 11 routes return 200
- Placeholder URL check: 0 leaks

### Methodology revisions codified this cycle

1. **3 composite profiles** (MEASUREMENT §2) — Optimization mode divergence với EVALUATION §8 single composite. Legitimate vì không produce Accept/Reject claims.
2. **Split-half verify on picks** (MEASUREMENT §3.3) — fix logic flaw trong pre-reg ban đầu. Retry ≤ 3 lần, hết retries → null.
3. **Unified 2-tier exclusion** (MEASUREMENT §4) — Tier 1 hard exclude + Tier 2 family eliminated Principle #17. Conservative 3D extension (BayesJoint, AdaptBias).
4. **Collapse rules** (MEASUREMENT §3.2) — 3 picks trùng → 1 pick, 2 trùng → combined label.
5. **Pick semantic (Option C, user decision)** — pick = composite winner, không đảm bảo beat Random. Glossary disclosure required.

### Effort breakdown

- Phase O-1 (re-backtest + ranking + review): ~4 hours
  - Matrix re-backtest: 1625s (27 min)
  - 3D re-backtest: 822s (14 min)
  - Script dev + ranking + review: ~3 hours
- Phase O-2 (UI): ~3 hours
  - Port 3 strategies: ~1 hour
  - SuggestionPanel refactor + PRODUCT_RANKS: ~1 hour
  - `/research/cycle22` page + glossary + data module: ~1 hour
- **Total**: ~7 hours (below estimate 5-6 days — re-backtest was the budget buffer)

### Next

- **Chu kỳ 23**: Budget-aware feature (UC2) — "chọn bộ số có ROI/winrate tốt nhất với budget X VND". Depends on Chu kỳ 22 rankings data. Separate pre-reg.
- **Chu kỳ 24** (optional): UI transparency polish.
- **Breakthrough reopen**: only on [§9 PROJECT_CLOSURE_REPORT](../PROJECT_CLOSURE_REPORT.md) triggers.

## Chu Kỳ 23 — App-wide UX Refactor (Closed 2026-04-22)

**Pre-reg** (frozen, moved to `executed/` 2026-04-23): [`proposals/executed/cycle23_app_refactor.md`](../proposals/executed/cycle23_app_refactor.md)
**Mode**: Optimization (UI-only, no new research mechanism)

### Scope
Refactor 7 user-facing routes theo 7 user feedback issues:
1. UI thừa / chú thích lung tung → condensed disclaimer + collapsible details
2. Dữ liệu chưa sync → 7 stale string groups updated across 6 files
3. UI lạc mục tiêu → compact header, primary action (Generate) moved up
4. Badges lung tung → taxonomy reset: max 3 pick badges (🎯 / 💰 / ⚖), removed #rank/★/🔬/🧪
5. /research/cycle22 page riêng → inline vào /research (route deleted, data module retained)
6. Statistics chưa cập nhật → /research rewrite 867→250 lines, KEY_STATS 13→22 cycles
7. Suggest feature cần redo → 3-fold flow: picks → generate → advanced collapsed

### Phases executed

| Phase | Tier | Commit | Changes |
|:-:|:-:|---|---|
| 23.1 | T5+T2 | `fe89e1c` | Stale string audit: 7 files updated tới Chu kỳ 22 state |
| 23.2 | T2 | `d594622` | Badge reset: ALL_STRATEGIES dropped badge field, strategy cards 1-badge-per, research picks card simplified |
| 23.3 | T5+T3 | `efc87ec` | /research rewrite + inline cycle22 section, /research/cycle22 route deleted + archived |
| 23.4 | T4 | `7557278` | /suggest compact header + Generate UP + strategy grid collapsible; product pages "✨ Gợi ý số" CTA + ?p= query param |

### Results vs evaluation criteria

**Task-completion**:
- M1 time-to-first-suggestion: baseline ~20s → after ~8s ✓ (Generate button in first viewport)
- M2 clicks-to-generate: 3-4 → 2 ✓ (click product → click Generate; default pick already loaded)

**Density**:
- D1 badges per item: ≤2 ✓ (was 3-4)
- D2 status vocabularies: 3 ✓ (pick / warning / default; was 8)
- D3 disclaimer pre-action: ~40 chars ✓ (was ~200)
- D4 /research sections: 5 ✓ (was ~8 scattered)
- D5 /suggest default strategies visible: 0 (grid collapsed) ✓

**Data integrity**:
- I1 stale strings: 0 critical mentions ("Chu kỳ 14 pending" etc.) ✓
- I2 backtest-data matches cycle22: partially (historical retained, header flagged) ✓
- I3 single source: cycle22-data.ts → /research inline ✓

**Preservation**:
- P1 6 primary routes 200 ✓ (11 routes total, all 200)
- P2 generate valid: ✓ (tested all products)
- P3 13 strategies accessible: ✓ (via /algorithms + SuggestionPanel advanced)
- P4 no console errors: ✓
- P5 mobile responsive: ✓ (flex column fallbacks preserved)
- P6 honesty gates §6.4: ✓ (composite winner semantic preserved, glossary updated)
- P7 history accessible: ✓ (/research timeline accordion)

### Files changed

**Deleted**:
- `src/app/research/cycle22/page.tsx` (archived to `research/optimization/cycle22_page_archive.md`)

**Created**:
- `proposals/cycle23_app_refactor.md` (pre-reg, frozen)
- `history/cycle23_app_refactor.md` (this)
- `research/optimization/cycle22_page_archive.md` (archive for deleted route)

**Rewritten** (large):
- `src/app/research/page.tsx` (867 → 250 lines)
- `src/components/products/SuggestionPanel.tsx` (badges reset + flow reorder)

**Updated** (stale strings / badges / minor):
- `src/app/algorithms/page.tsx`, `src/app/glossary/page.tsx`, `src/app/suggest/page.tsx`
- `src/components/pages/MatrixProductPage.tsx`, `ThreeDProductPage.tsx`
- `src/components/common/ResearchStateBanner.tsx`
- `src/lib/backtest-data.ts` (header only)

### QA

- Type check: `tsc --noEmit` exit 0
- Build: `npm run build` pass, 11 static pages (12 routes incl. /api/crawl)
- Smoke: curl 11/11 routes 200 ✓ (`/research/cycle22` renders 404 page content as expected)
- Content: `/research` has inline cycle22 section, `/suggest?p=max-3d` pre-selects correctly, product pages show "✨ Gợi ý số" CTA

### Effort

~5 hours total:
- 23.1 audit: 1h
- 23.2 badge reset: 0.5h
- 23.3 research reorg: 1.5h
- 23.4 suggest + product: 1.5h
- History + final: 0.5h

Below pre-reg estimate 9d — most complexity was in removal/simplification, not addition.

### Next

- Chu kỳ 24: budget-aware feature (UC2 "chọn bộ số với budget X VND"), pre-reg chưa viết.
- Chu kỳ 25+ optional UI polish hoặc data refresh.
- Reopen breakthrough: only on §9 triggers (PROJECT_CLOSURE_REPORT).

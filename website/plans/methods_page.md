# Plan — New `/methods` Page (Strategies Catalog + Comparison + C6 Spotlight)

**Status**: 📝 **PLANNING 2026-04-24** — awaiting user review.

**Origin**: User request "thay vì thêm vào research tôi muốn thêm 1 trang mới thể hiện tất cả các chiến lược và mô tả chiến lược, so sánh sau đó là thông tin về C6".

**Supersedes**: Plan 2 [c6_ab_ship.md §2.7 /research page update](c6_ab_ship.md). Keeps Plan 2's SuggestionPanel integration, disclosure banner, glossary, allocator update, formal closure. **Moves C6 spotlight to new `/methods` page** instead of `/research`.

**Does not replace** `/algorithms` (existing 13-UI-strategies page stays). New page is SUPERSET covering 73 catalog methods + Chu kỳ 22-28 research findings.

---

## 1. Purpose

**Central hub** for all betting methods researched/catalogued:
- Browse all 73 methods (Chu kỳ 22-28 catalog)
- Read mechanism descriptions
- Compare metrics side-by-side
- Spotlight first Accept claim (C6 A=B)

**Target user journey**:
1. User lands on `/methods` from nav
2. Reads C6 spotlight → understands significance
3. Filters/searches to find methods matching budget/product interest
4. Compares 2-4 methods in matrix view
5. Clicks through to `/max-3d-pro` (C6) or `/suggest?p=X` to actually use

---

## 2. Page structure

### Section 2.1 — Hero + C6 Spotlight (top of page)

**First element** người dùng thấy:

```
🏆 Chu kỳ 28 Accept — C6 A=B Max 3D Pro
First positive-EV finding in 28 cycles of research.
[Expected ROI +4180%] [P(hit) 2%] [Ruin @ 100K = 0%]

Cơ chế: Vé Max 3D Pro (A, B) với A = B = X. Vietlott quy chế cho doubled prize
khi X trúng Nhất/Nhì/Ba/Tư. EV theoretical = +4180% per 10K ticket.

[Mua tại /max-3d-pro →]  [Xem backtest chi tiết →]
```

Prominent, green-accent, Accept badge. Below-fold: detailed mechanism + disclosure.

### Section 2.2 — Overview stats

```
47/73 methods tested across 7 optimization cycles
21 breakthrough cycles (all null)
1 Accept (🏆 C6 A=B)
7 eliminated families
```

Mini stat cards, links to key docs.

### Section 2.3 — Methods catalog (browse/filter)

**Table rows** (47 tested + 26 untested/deferred = 73 total):

| # | Method | Category | Products | Status | Best ROI | Best P(hit) |
|:-:|---|:-:|---|:-:|---:|---:|
| 1 | A1 Fixed bộ số | A | Matrix | Tested, no edge | −88% | 2.4% |
| 2 | A3 Random baseline | A | All | Baseline | −48% (3D) | 4.1% (3D Pro) |
| ... | ... | ... | ... | ... | ... | ... |
| 42 | **C6 A=B exploit** | C | 3D Pro | 🏆 **ACCEPT** | **+3864%** | 2.0% |

**Filters** (multi-select):
- Category (A universal / B matrix / C 3D / D / E / F / G / H / I cultural / J institutional)
- Product (Power 6/55, 6/45, 5/35, Max 3D, Max 3D Pro)
- Status (Accept, Suggestive, Tested no-edge, Untested, Deferred, Eliminated-family)
- Tier (Chu kỳ 25/26/27/28 research tier)

**Search**: by method ID, name, or description keyword.

**Sort**: by any metric column (ROI, P(hit), ticks-to-first-hit, ruin, category).

**Default sort**: Status (Accept first) then ROI descending.

### Section 2.4 — Method description expansions

Click method row → expand inline (or modal) với:

- **Full name + ID** (e.g., "C6 A=B Exploit (Max 3D Pro)")
- **Mechanism** (2-3 paragraphs): how it works, why it works/doesn't
- **Origin cycle** (e.g., "Tested Chu kỳ 27-28")
- **Verdict** + rationale
- **All metrics** (4-segment backtest stats)
- **User action** (if applicable: "Try in /max-3d-pro" button for C6 / "Chơi trong /suggest" for others)
- **Links** to history doc + review doc

For C6 specifically: expanded by default, full description shown.

### Section 2.5 — Comparison matrix

User selects 2-6 methods via checkboxes → compare side-by-side:

| Metric | A3 Random (baseline) | C1 bao lô 6 perm | C6 A=B | H1 A=B portfolio N=10 |
|---|---:|---:|---:|---:|
| Product | All | Max 3D | Max 3D Pro | Max 3D Pro |
| ROI full | −48% to −90% | −47.7% | **+3864%** | **+4056%** |
| P(hit) | 1.4-4% | 9.9% | 2.0% | 17.8% |
| Ticks-to-first-hit (p50) | 18-49 | 10 | ? | ? |
| Cost per draw | 10K | 60K | 10K | 100K |
| Ruin @ B=1M | 0% | 100% | 0% | 100% |
| Status | Baseline | Tested no-edge | **🏆 Accept** | Hybrid validated |

Export: "Copy as markdown" for sharing.

### Section 2.6 — Disclosure / caveats

Banner across all sections:

```
⚠ EV luôn âm cho mọi sản phẩm Vietlott CHỈ TRỪ C6 A=B (có exploit quy chế hợp pháp).
⚠ C6 phụ thuộc Vietlott quy chế — rule có thể thay đổi mà không báo trước.
⚠ Kết quả backtest là simulation trên lịch sử; thực tế có variance.
⚠ Xem research docs để hiểu limitation của từng method.
```

### Section 2.7 — Research timeline (collapsible, compact)

Compact timeline showing 28 cycles với headline per cycle:
- 1-21: Breakthrough (0 Accept)
- 22: Optimization picks
- 23: UX
- 24: Budget portfolio
- 25-27: Method evaluation framework (Tier 1-3)
- 28: 🏆 C6 Accept

Click → link vào `RESEARCH_HISTORY.md` render.

---

## 3. Data architecture

### 3.1 Unified methods catalog data module

New file: `src/lib/methods-catalog-data.ts`

Aggregates:
- 73-method list từ `BETTING_METHODS_CATALOG.md` (static entries — hand-coded TS version OR parsed at build)
- Metrics from Chu kỳ 25-28 JSON results (imported via resolveJsonModule)
- Chu kỳ 22 picks metadata (existing `cycle22-data.ts`)
- Legacy `backtest-data.ts` (13 UI strategies)

```typescript
export interface CatalogMethod {
  id: string;                    // e.g., "C6_ab_random"
  category: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";
  name_vi: string;
  description_vi: string;
  mechanism_vi: string;          // 2-3 paragraph explanation
  applicable_products: string[];
  cycles_tested: number[];       // e.g., [27, 28]
  status: "accept" | "suggestive" | "tested_no_edge" | "untested" | "deferred" | "eliminated";
  verdict_note_vi?: string;
  metrics?: {
    full: MethodMetrics;
    half1: MethodMetrics;
    half2: MethodMetrics;
    forward: MethodMetrics;
  };
  user_action?: {
    label: string;
    href: string;
  };
  history_link?: string;
  review_link?: string;
}

export const METHODS_CATALOG: CatalogMethod[];  // 73 entries
```

### 3.2 C6 spotlight content

Separate content block (can be embedded MD or TS constant):

```typescript
export const C6_SPOTLIGHT = {
  badge: "🏆 First Accept Chu kỳ 28",
  title_vi: "C6 A=B Exploit — Max 3D Pro",
  theoretical_ev_pct: 4180,
  backtest_ev_pct: 3864,
  n_runs: 200,
  p_hit: 0.0193,
  mechanism_vi: "... markdown paragraphs ...",
  disclosure_vi: "...",
  play_href: "/max-3d-pro",
  details_href: "/methods#c6",
};
```

---

## 4. Component tree

```
/methods page (new)
├── <C6Spotlight>           — hero, always expanded
├── <OverviewStats>         — 4 stat cards
├── <MethodsFilters>        — category/product/status/search
├── <MethodsTable>          — sortable, paginated
│   └── <MethodRowExpanded> — per-method description (lazy load)
├── <ComparisonBuilder>     — checkbox select → side-by-side
├── <ResearchTimeline>      — collapsible 28-cycle timeline
└── <DisclosureFooter>      — caveats
```

Reusable components:
- `<StrategyCard>` — single method summary (reuse in Dashboard/home if needed)
- `<MetricsTable>` — 4-segment × 12-metric display
- `<AcceptBadge>` — `🏆` with green styling (reusable on `/max-3d-pro` too)

---

## 5. Phases

### Phase 1 — Data module (~2h)

1.1 Write `src/lib/methods-catalog-data.ts` — 73 entries hand-coded (bulk write từ BETTING_METHODS_CATALOG.md)

1.2 Import Chu kỳ 25-28 results JSONs, map method_id → metrics

1.3 Wire status field: Accept (1), Suggestive (0 post-28), Tested-no-edge (47-1=46), Untested/Deferred (26)

1.4 Unit sanity: 73 entries, 1 Accept, correct category counts per catalog

### Phase 2 — `/methods` page skeleton (~1.5h)

2.1 New route `src/app/methods/page.tsx`

2.2 Sections 2.1-2.2 (Hero C6 + Overview) — static render

2.3 Nav integration (add link to main menu)

2.4 Route smoke: returns 200

### Phase 3 — Methods table + filters (~2h)

3.1 `<MethodsTable>` component with sortable columns

3.2 `<MethodsFilters>` — category/product/status multi-select + search input

3.3 Default sort by Status → ROI descending

3.4 Row expansion inline với description + metrics

### Phase 4 — Comparison matrix (~1.5h)

4.1 Checkbox column on methods table

4.2 Sticky comparison panel at bottom OR modal

4.3 Side-by-side table render (up to 6 methods)

4.4 "Copy as markdown" export

### Phase 5 — C6 spotlight polish (~1h)

5.1 Full hero section với detailed mechanism

5.2 Embedded quy chế table (tier amounts × A=B doubling)

5.3 "Play at /max-3d-pro" CTA button

5.4 Disclosure banner prominent

### Phase 6 — Research timeline collapsible (~45 min)

6.1 Compact timeline component

6.2 Click expand → show cycle headlines

6.3 Links to history docs

### Phase 7 — Disclosure footer + QA (~45 min)

7.1 Global caveats banner

7.2 Type check + build

7.3 Route smoke 12 routes (including new `/methods`)

7.4 Visual + responsive check

### Phase 8 — Commit + ship (~30 min)

Commit theo `RESEARCH_TO_UI_PLAYBOOK.md`.

---

## 6. Interaction với existing pages

| Existing page | Action |
|---|---|
| `/algorithms` | **Keep as-is** — 13 UI strategies. Add note "Xem full catalog at /methods" |
| `/research` | **Keep as-is** — research narrative. Add note "Phương pháp chi tiết tại /methods" |
| `/glossary` | Add entry "C6 A=B Exploit" cross-linked to `/methods#c6` |
| `/max-3d-pro` | Plan 2 SuggestionPanel C6 integration STILL required (actual usage) |
| `/suggest` | Unchanged |

**Nav menu proposal**:
```
Home | Gợi ý | Methods | Check Rate | Research | Glossary
```
Insert "Methods" between "Gợi ý" and "Check Rate".

---

## 7. Scope tradeoffs

| Include | Effort | Value |
|---|:-:|---|
| ✅ C6 Spotlight | 1h | Critical (first Accept) |
| ✅ 73-method table | 2h | Core |
| ✅ Filters + search | 1h | UX |
| ✅ Comparison matrix | 1.5h | UX differentiator |
| ⚪ Research timeline | 45 min | Nice-to-have |
| ❌ Real-time metric recompute | N/A | Out of scope (data is frozen post-cycle) |
| ❌ User annotations / notes | N/A | Out of scope |
| ❌ Social sharing | N/A | Out of scope |

**Total effort**: ~10h (phased).

Can split across 2 sessions (data + table first, comparison + C6 polish second).

---

## 8. Merged plan with Plan 2 (c6_ab_ship.md)

**Plan 2 + Plan 3 overlap** = 1 unified execution:

| Plan 2 Phase | Plan 3 Phase | Notes |
|---|---|---|
| 1 TS port | — | Separate |
| 2 SuggestionPanel `/max-3d-pro` | — | Separate |
| 3 Glossary | — | Plan 3 adds C6 entry cross-link |
| 4 Chu kỳ 24 allocator | — | Separate |
| 5 Formal closure docs | 8 Commit | Combined commit possible |
| 6 QA + commit | 7 QA + commit | Combined |
| ~~Plan 2 §2.7 /research update~~ | **Replaced by Plan 3 /methods page** | |

**Merged execution order** (recommended):
1. Phase 1 (Plan 2): TS port + type enum
2. Phase 1 (Plan 3): data module
3. Phase 2 (both): Plan 2 SuggestionPanel + Plan 3 page skeleton — parallel
4. Phase 3-7 (Plan 3): table + filters + comparison + C6 spotlight
5. Phase 3-4 (Plan 2): glossary + allocator
6. Phase 5-6 (Plan 2): formal closure + QA
7. Commit + push (1 big commit or split into 2-3 logical)

Total merged effort: **~12-14h** across both plans.

---

## 9. Open questions (for user review)

1. **Route name**: `/methods` (English, aligns with catalog) vs `/chien-luoc` (Vietnamese consistent with user request) vs `/phuong-phap` (Vietnamese literal)?
2. **C6 Spotlight position**: top of page (hero) — approve? Or after overview stats?
3. **73-method hand-code**: bulk write all 73 entries in TS (~500 lines) OR render from parsed markdown at build time?
4. **Comparison matrix max**: 6 methods side-by-side OK? Or limit to 4 for mobile friendliness?
5. **Research timeline**: include hay skip để tinh gọn?
6. **Execution order**: Plan 2 first (C6 usable) → Plan 3 after. Or merged (one big batch)?
7. **Entries for untested/deferred methods**: include trong table (grayed out) or filter out by default?
8. **Data freshness**: if Chu kỳ 29+ happens, how to update? (Re-run allocator → JSON auto-sync via TS import pattern, same as C22/C24.)

---

## 10. Not in scope

- User-level tracking (saved plans, favorites)
- Interactive backtest simulator (user tweaks params and sees new results)
- Real-time ROI updates (data is frozen per cycle)
- Mobile app version

---

## 11. Awaiting review

User please answer §9 questions + approve direction. Then tôi execute theo merged or separated plan.

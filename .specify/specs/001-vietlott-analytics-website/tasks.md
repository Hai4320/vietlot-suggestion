# Tasks — Vietlott Analytics Website

## Phase 1: Foundation + Power 6/55

### US-00: Project Setup
- [P] T001: Initialize Next.js 15 project with TypeScript in `website/` directory
- [P] T002: Configure Tailwind CSS 4 + dark theme
- [P] T003: Install and setup shadcn/ui (Card, Table, Tabs, Button, Badge, Separator)
- [ ] T004: Install Recharts
- [ ] T005: Create TypeScript interfaces in `lib/types.ts`
- [ ] T006: Create product config registry in `lib/products-config.ts`
- [ ] T007: Write `scripts/build_data.py` — JSONL → JSON converter
- [ ] T008: Run build_data.py to generate initial JSON files in `public/data/`

**Checkpoint: Project builds, `pnpm dev` runs, JSON data available**

### US-01: Home Page (→ spec US-01)
- [ ] T009: Create root layout with Navbar + Sidebar + Footer
- [ ] T010: Create Sidebar component with product navigation links
- [ ] T011: Create Navbar component with title + language toggle placeholder
- [ ] T012: Create ProductCard component
- [ ] T013: Build Home page with hero section + 2 product groups grid

**Checkpoint: Home page renders with all 5 product cards, navigation works**

### US-02: Recent Results — Power 655 (→ spec US-02)
- [ ] T014: Create `lib/data-loader.ts` — fetch and parse JSON data
- [ ] T015: Create `hooks/useProductData.ts` — load + memoize product data
- [ ] T016: Create NumberBall component (colored circular badge for drawn numbers)
- [ ] T017: Create MatrixResultTable component (paginated table, 20 per page)
- [ ] T018: Create Power 655 page with Tabs layout
- [ ] T019: Wire Results tab to MatrixResultTable

**Checkpoint: Power 655 page shows recent results with number balls**

### US-03: Frequency Analysis — Power 655 (→ spec US-03)
- [ ] T020: Create `lib/stats-matrix.ts` — frequency calculation (all-time + windowed)
- [ ] T021: Create TimeFilter component (All / 90d / 60d / 30d)
- [ ] T022: Create FrequencyBarChart component (Recharts bar chart with color gradient)
- [ ] T023: Wire Frequency tab on Power 655 page

**Checkpoint: Frequency bar chart renders with time filter**

### US-04: Hot/Cold Summary — Power 655 (→ spec US-04)
- [ ] T024: Add hot/cold calculation to `lib/stats-matrix.ts`
- [ ] T025: Create HotColdCards component
- [ ] T026: Wire Hot/Cold tab on Power 655 page

**Checkpoint: Hot/cold cards display with correct data**

### US-05: Trend Over Time — Power 655 (→ spec US-05)
- [ ] T027: Add rolling frequency calculation to `lib/stats-matrix.ts`
- [ ] T028: Create TrendLineChart component (multi-line, number selector)
- [ ] T029: Wire Trends tab on Power 655 page

**Checkpoint: Trend line chart renders with multi-select**

### US-06: Pair Analysis — Power 655 (→ spec US-06)
- [ ] T030: Add pair frequency calculation to `lib/stats-matrix.ts`
- [ ] T031: Create PairFrequencyTable component
- [ ] T032: Wire Pairs tab on Power 655 page

**Checkpoint: Top 20 pairs table renders**

### US-07: Suggestion — Power 655 (→ spec US-07)
- [ ] T033: Create `lib/suggest-matrix.ts` — 3 strategies (frequency, absence, mixed)
- [ ] T034: Create SuggestionPanel component (strategy selector + generate button + results)
- [ ] T035: Create Disclaimer component
- [ ] T036: Wire Suggest tab on Power 655 page

**Checkpoint: Suggestion panel generates and displays number sets**

---

## Phase 2: Mega 6/45 + Lotto 5/35 (Reuse Matrix Template)

### US-02–07 for Mega 6/45
- [P] T037: Create Power 645 page (reuse all matrix components)
- [P] T038: Update data-loader and products-config for power_645
- [ ] T039: Verify all tabs work correctly for 6/45 range (1-45, no special number)

### US-02–07 for Lotto 5/35
- [P] T040: Create Power 535 page (reuse all matrix components)
- [P] T041: Update data-loader and products-config for power_535
- [ ] T042: Handle special number display (5 main + 1 special from 1-12)

**Checkpoint: All 3 matrix products fully functional**

---

## Phase 3: Max 3D + Max 3D Pro (New 3D Template)

### US-08: Recent Results — 3D
- [ ] T043: Create ThreeDResultTable component (prize tier layout)
- [ ] T044: Create Max 3D page with Tabs layout
- [ ] T045: Wire Results tab to ThreeDResultTable

### US-09: Digit Frequency — 3D (→ spec US-09)
- [ ] T046: Create `lib/stats-3d.ts` — digit frequency by position + tier
- [ ] T047: Create DigitPositionChart component (3 bar charts)
- [ ] T048: Wire Digit Analysis tab with tier filter

### US-10: Top 3-Digit Numbers — 3D (→ spec US-10)
- [ ] T049: Add top-N 3-digit frequency to `lib/stats-3d.ts`
- [ ] T050: Create TopNumbersTable component
- [ ] T051: Wire Top Numbers tab

### US-11: Suggestion — 3D (→ spec US-11)
- [ ] T052: Create `lib/suggest-3d.ts` — 3D suggestion strategies
- [ ] T053: Wire Suggest tab on 3D page (reuse SuggestionPanel with 3D adapter)

### Max 3D Pro
- [P] T054: Create Max 3D Pro page (reuse 3D template)
- [ ] T055: Verify all tabs work for 3D Pro data

**Checkpoint: Both 3D products fully functional**

---

## Phase 4: Polish & Cross-cutting

### US-12: Bilingual (→ spec US-12)
- [ ] T056: Create `lib/i18n.ts` with all translation strings
- [ ] T057: Create `hooks/useLanguage.ts` (context + localStorage)
- [ ] T058: Create LanguageToggle component
- [ ] T059: Apply translations to all pages and components

### US-13: Responsive (→ spec US-13)
- [ ] T060: Mobile sidebar → hamburger menu
- [ ] T061: Responsive chart sizing
- [ ] T062: Horizontal scroll for tables on mobile
- [ ] T063: Touch-friendly interactions

### SEO & Deploy
- [ ] T064: Add metadata (title, description, og tags) per page
- [ ] T065: Configure `next.config.ts` for static export
- [ ] T066: Create GitHub Actions workflow for build + deploy
- [ ] T067: Final testing and performance audit

**Checkpoint: Website deployed and accessible**

---

## Task Legend
- `[P]` = Can run in parallel with adjacent `[P]` tasks
- `[ ]` = Sequential (depends on prior tasks)
- Checkpoints are validation gates — verify functionality before proceeding

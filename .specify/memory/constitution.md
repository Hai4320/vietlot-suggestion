# Constitution — Vietlott Analytics Website

## Core Principles

### 1. Code Quality
- **TypeScript strict mode** — No `any` types; all data interfaces fully typed
- **Linting** — ESLint + Prettier enforced, no warnings allowed
- **Component-driven** — Each UI element is a reusable, isolated component
- **DRY** — Shared logic (stats calculation, data loading) lives in dedicated modules
- **Naming** — Descriptive names: `FrequencyBarChart`, `useProductData`, `formatDrawDate`

### 2. Testing Standards
- **Unit tests** for all utility/stat functions (frequency, hot/cold, gaps, suggest)
- **Component tests** for critical UI components
- **Data integrity tests** — Validate JSON data shape at build time
- Test framework: Vitest (built-in with Next.js)

### 3. User Experience
- **Mobile-first** — Responsive from 320px to 1920px+
- **Dark theme** — Primary dark palette with lottery-themed accents
- **Performance** — First Contentful Paint < 1.5s on 3G; all pages statically generated
- **Accessibility** — Semantic HTML, ARIA labels on charts, keyboard navigable
- **Bilingual** — Vietnamese (default) + English toggle, stored in localStorage
- **Loading states** — Skeleton screens while data loads, never blank pages

### 4. Performance Requirements
- **Static Export** — All pages pre-rendered at build time (no runtime server)
- **Bundle size** — Total JS < 200KB gzipped
- **Image optimization** — SVG for icons, WebP for any raster images
- **Data loading** — JSON files loaded via static import, not runtime fetch
- **Charts** — Lazy loaded via `next/dynamic` to reduce initial bundle

### 5. Data Integrity
- **Single source of truth** — `data/*.jsonl` files from the crawler
- **Build-time processing** — Python script converts JSONL → optimized JSON
- **Type safety** — TypeScript interfaces match data schemas exactly
- **No data mutation** — All computations are pure functions

### 6. Architecture Governance
- **Separation of concerns** — Pages → Components → Hooks → Utils → Types
- **No business logic in components** — Stats calculations live in `lib/`
- **Consistent patterns** — Each product page uses the same template structure
- **Incremental adoption** — New products added by config, not code duplication

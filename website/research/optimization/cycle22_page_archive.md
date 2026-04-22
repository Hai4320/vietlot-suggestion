# Chu Kỳ 22 — `/research/cycle22` Page Archive

> **Archived 2026-04-22** per Chu kỳ 23 Phase 23.3 refactor. The dedicated `/research/cycle22` route was deleted — content merged into `/research` main page.

## Provenance

- Original route file: `website/src/app/research/cycle22/page.tsx` (deleted this cycle)
- Data source still active: `website/src/lib/cycle22-data.ts`
- Inline rendering (current): `website/src/app/research/page.tsx` section `#cycle22`

## Original content rendered

- Full rankings tables: 3 composite profiles × 5 products × N strategies (all rows)
- Per-product pick cards với split-half status details
- Retry attempts logged (stored in `cycle22_rankings.json`)
- Methodology cross-reference to `MEASUREMENT.md §2`

## Current location

- JSON source (all ranks): `website/research/optimization/cycle22_rankings.json`
- Compact inline version: `/research#cycle22` (top 5 per profile per product, collapsible)
- Diagnostic: `website/research/optimization/cycle22_review.md`

## Restore procedure

1. Recreate `website/src/app/research/cycle22/page.tsx` từ git history commit `c6f437f` (có page đầy đủ)
2. HOẶC read full rankings từ `cycle22_rankings.json` directly

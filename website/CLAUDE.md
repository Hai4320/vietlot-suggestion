@AGENTS.md

# Website Dev Guide (Claude Code)

This is the **Next.js 16 + Turbopack** frontend for the Vietlott-data project.
Research ingestion + UI for lottery suggestions.

## Quick commands (run from repo root)

```bash
make website-dev       # start dev server (port 3000; falls back to 3001 if busy)
make website-build     # production build (catches type errors)
make website-data      # regenerate public/data/*.json from data/*.jsonl
```

Or from `website/`:

```bash
npm run dev            # same as website-dev
npm run build          # same as website-build
npx tsc --noEmit       # type check only
```

## Key paths

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages (1 per route) |
| `src/components/products/` | Product-specific UI (SuggestionPanel, BacktestCard, ThreeDResultTable, etc) |
| `src/components/pages/` | Full-page compositions (e.g., ThreeDProductPage shared by max-3d + max-3d-pro) |
| `src/components/ui/` | shadcn primitives (Badge, Card, Table, Tabs, Sheet) |
| `src/lib/suggest-matrix.ts` | Matrix product strategies (Power 6/55, 6/45, 5/35) |
| `src/lib/suggest-3d.ts` | 3D strategies (Max 3D, 3D Pro) |
| `src/lib/backtest-data.ts` | **Hardcoded** backtest results consumed by BacktestCard + /algorithms (manual sync from research/) |
| `src/lib/types.ts` | `SuggestionStrategy` union + shared types |
| `src/lib/products-config.ts` | Product metadata (slug, color, data file) |
| `public/data/*.json` | UI-consumed draw data (generated from `data/*.jsonl` by `scripts/build_data.py`) |
| `research/` | Research artifacts (Python backtest + markdown docs) — see [research/README.md](research/README.md) |

## Updating UI after a research cycle

**When a research cycle completes (Chu kỳ N → N+1), follow [RESEARCH_TO_UI_PLAYBOOK.md](RESEARCH_TO_UI_PLAYBOOK.md).** Checklist covers:

1. Update `backtest-data.ts` với new strategies + revised decisions
2. Update `SuggestionPanel.tsx` `PRODUCT_RANKS` per decision matrix
3. Update `/research`, `/algorithms` pages
4. Update [ALGORITHM_MANAGEMENT.md](ALGORITHM_MANAGEMENT.md) Ma trận table
5. Build + type check + curl smoke + visual check
6. Commit per template

**Avoid UX lies**: any strategy shown in SuggestionPanel `rec1` with claim contradicting latest cycle = critical bug. Historical cases (all fixed 2026-04-21):
- Max 3D Pro rec1="evmax" (Rejected Chu kỳ 7 months earlier)
- Power 5/35 rec1="hybridparity" with "p=0.011 significant" claim (Chu kỳ 5 correction showed p=0.301 Reject)

## Strategy tier + badge conventions

See [ALGORITHM_MANAGEMENT.md §2](ALGORITHM_MANAGEMENT.md) for tier system (Built-in / Internet research / App research).

See [RESEARCH_TO_UI_PLAYBOOK.md §5](RESEARCH_TO_UI_PLAYBOOK.md) for badge colors + language conventions:
- `✓ Accept` (green) — 3-gate pass, confirmed edge
- `🔬 Research pick` (orange) — directional only, best-in-family
- `⚠ Ship-with-caveats` (yellow) — technical pass but scientific doubt
- `Reject` (muted) — failed replication

**Never** use "🏆 Khuyến nghị" cho strategy without confirmed Accept — orange "🔬 Research pick" là correct default.

## Research disclosure banners

3D product pages MUST show research-mode banner ([ThreeDProductPage.tsx](src/components/pages/ThreeDProductPage.tsx)) explaining 28 strategies tested + 0 Accept + EV negative. Banner renders BEFORE data loads (không bị trapped sau loading spinner).

## Testing before commit

Mandatory:
- `npm run build` — catches most errors (next build runs full type + static gen)
- Curl smoke all 6 routes return 200
- Visual spot-check pages affected by the change

Optional:
- `npx tsc --noEmit` — faster than full build for type-only changes

## Not the Next.js you know

Next.js 16 + Turbopack may differ from training data:
- Server Components default, `"use client"` directive required for interactive
- `app/` directory (not `pages/`)
- Built-in `<details>` / `<summary>` used for collapsibles (no Accordion dep)

When unsure, read relevant guide in `node_modules/next/dist/docs/` before code changes.

## References

- [RESEARCH_TO_UI_PLAYBOOK.md](RESEARCH_TO_UI_PLAYBOOK.md) — when to update UI after research
- [ALGORITHM_MANAGEMENT.md](ALGORITHM_MANAGEMENT.md) — strategy tier system + code architecture
- [research/RESEARCH_HISTORY.md](research/RESEARCH_HISTORY.md) — research cycle index
- [research/METHODOLOGY.md](research/METHODOLOGY.md) — Principles #11-#15
- [../CLAUDE.md](../CLAUDE.md) — top-level dev guide (Python crawler + backtest CLI)

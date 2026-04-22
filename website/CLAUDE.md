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
| `src/lib/backtest-data.ts` | **Historical snapshot** (pre-C22). /algorithms dùng cho strategies không port vào Chu kỳ 22. |
| `src/lib/cycle22-data.ts` | **Auto-synced** từ `research/optimization/cycle22_rankings.json` (direct JSON import, resolveJsonModule). Source of truth cho current picks. |
| `src/lib/types.ts` | `SuggestionStrategy` union + shared types |
| `src/lib/products-config.ts` | Product metadata (slug, color, data file) |
| `public/data/*.json` | UI-consumed draw data (generated from `data/*.jsonl` by `scripts/build_data.py`, triggered via `make website-data`) |
| `research/` | Research artifacts (Python backtest + markdown docs) — see [research/README.md](research/README.md) |

## Data pipelines (auto-sync)

Hai pipelines auto-sync vào UI:

| Pipeline | Source | Destination | Trigger | Sync step |
|---|---|---|---|---|
| **Draw data** | `data/*.jsonl` (crawler output) | `public/data/*.json` (UI fetch) | `make website-dev` / `website-build` | Python script `build_data.py` via Makefile dep |
| **Chu kỳ 22 rankings** | `website/research/optimization/cycle22_rankings.json` | `src/lib/cycle22-data.ts` (TS module) | Every Next.js build/hot-reload | **Direct JSON import** — no codegen step |

**Re-run research rankings** khi backtest data thay đổi:
```bash
make research-cycle22              # Compute rankings từ existing backtest JSONs (fast, ~5s)
make research-cycle22-rebacktest   # Fresh re-backtest (slow, ~40min matrix+3D)
```

UI sẽ pick up tự động trên next `make website-dev` / `website-build` (JSON imported trực tiếp, không cần regenerate TS file).

## Updating UI after a research cycle

**When a research cycle completes (Chu kỳ N → N+1), follow [RESEARCH_TO_UI_PLAYBOOK.md](RESEARCH_TO_UI_PLAYBOOK.md).** Checklist covers:

1. Run `make research-cycleN` → regenerate `cycleN_rankings.json`
2. For Chu kỳ 22+ Optimization mode: UI auto-picks up via JSON import (no manual TS edit needed)
3. For breakthrough cycles với new strategies: update `backtest-data.ts` với new entries + decisions
4. Update `SuggestionPanel.tsx` `PRODUCT_RANKS` nếu picks change
5. Update `/research`, `/algorithms` page narrative nếu cần
6. Build + type check + curl smoke + visual check
7. Commit per template

**Avoid UX lies**: any strategy shown in SuggestionPanel `picks.winrate` or `picks.roi` with claim contradicting latest cycle = critical bug. Historical cases (all fixed 2026-04-21):
- Max 3D Pro rec1="evmax" (Rejected Chu kỳ 7 months earlier)
- Power 5/35 rec1="hybridparity" with "p=0.011 significant" claim (Chu kỳ 5 correction showed p=0.301 Reject)

## Research pick schema (post Chu kỳ 22 — 2026-04-22)

`PRODUCT_RANKS[slug].picks` replaces old `rec1`/`rec2` fields. Chu kỳ 22 refactored thành 3-pick structure driven by 3 composite profiles:

```ts
picks: {
  winrate:  { strategy, stat } | null;   // 🎯 Trúng cao nhất — argmax composite WinRate profile (0.60/0.20/0.10/0.10)
  roi:      { strategy, stat } | null;   // 💰 Lỗ ít nhất    — argmax composite ROI profile (0.20/0.60/0.10/0.10)
  balanced: { strategy, stat } | null;   // ⚖ Cân bằng     — argmax composite Balanced profile (0.40/0.40/0.10/0.10)
};
collapse: "none" | "all_three" | "winrate_roi" | "winrate_balanced" | "roi_balanced";
defaultStrategy: SuggestionStrategy;  // Fallback useState khi tất cả picks = null
```

**Pick selection rule (Chu kỳ 22 Optimization mode)**: canonical trong [research/optimization/MEASUREMENT.md](research/optimization/MEASUREMENT.md) §3. Summary:
1. Apply Tier 1 + Tier 2 exclusion (MEASUREMENT §4)
2. Compute 3 composite scores per strategy (z-normalized within product)
3. For each profile: argmax → pick candidate
4. Split-half verify **on each pick candidate** (MEASUREMENT §3.3). Retry ≤ 3 lần nếu direction flip; hết retries → `null`
5. Apply collapse rules (§3.2): 3 picks trùng strategy → 1 pick với combined label `🎯💰⚖`; 2 trùng → combined 2 picks

**Null picks** = honest outcome (Power 6/45 + Max 3D Pro hiện tại). UI hiển thị disclosure banner, KHÔNG fallback. Xem `/research/cycle22` cho full rankings + diagnostic.

Default-selected strategy in SuggestionPanel `useState` = `picks.winrate ?? picks.roi ?? picks.balanced ?? defaultStrategy`.

**Semantic clarification** (user decision 2026-04-22, Option C): Pick = composite winner, **không đảm bảo beat Random** trên primary metric. Power 5/35 Freq_Hot Δ_win = −0.045pp nhưng vẫn top composite. UI giữ label `🎯 Trúng cao nhất` + glossary giải thích rõ. Xem [/glossary "Chu kỳ 22"](src/app/glossary/page.tsx).

## Strategy tier + badge conventions

See [ALGORITHM_MANAGEMENT.md §2](ALGORITHM_MANAGEMENT.md) for tier system (Built-in / Internet research / App research).

See [RESEARCH_TO_UI_PLAYBOOK.md §5](RESEARCH_TO_UI_PLAYBOOK.md) for badge colors + language conventions:
- `✓ Accept` (green) — 3-gate pass, confirmed edge [breakthrough mode only]
- `🎯 Trúng cao nhất` (green) — winrate pick (composite WinRate profile)
- `💰 Lỗ ít nhất` (yellow) — roi pick (composite ROI profile)
- `⚖ Cân bằng` (slate) — balanced pick (composite Balanced profile) [Chu kỳ 22+]
- `🎯💰⚖` (emerald) — 1 pick duy nhất, collapse all_three [Chu kỳ 22+]
- `🎯💰` / `🎯⚖` / `💰⚖` (emerald/green/yellow) — 2 picks combined, partial collapse [Chu kỳ 22+]
- `🧪 C22` (colored) — strategy badge cho mindistance/coverageopt/pairexploiter (ported Chu kỳ 22)
- `⚠ Ship-with-caveats` (yellow) — technical pass but scientific doubt
- `Reject` (muted) — failed replication

**Never** use "🏆 Khuyến nghị" cho strategy without confirmed Accept — split picks "🎯 Trúng cao nhất" + "💰 Lỗ ít nhất" là correct default. Labels must be honest: winrate pick ≠ confirmed edge, roi pick ≠ có lãi.

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

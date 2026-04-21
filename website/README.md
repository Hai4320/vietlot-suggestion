# Vietlott Suggestion — Website

Next.js 16 + Turbopack frontend cho `vietlott-data` project. Trang hiển thị dữ liệu xổ số Vietnam Vietlott + research-backed suggestion panel + full research transparency.

## Nội dung

- **Product pages** (Power 6/55, 6/45, 5/35; Max 3D, Max 3D Pro): historical draws, frequency analysis, digit positions, top numbers, play guide
- **Suggest page**: research-backed number suggestions với honest caveats
- **Research page**: 8-cycle research history + principles + cycle timeline + 3D closure summary
- **Algorithms page**: strategy descriptions + tier system + per-product rankings

## Dev setup

```bash
# From repo root
make website-install   # first-time: install npm dependencies
make website-dev       # start dev server on port 3000
```

Browser: http://localhost:3000

## Commands

| Command | Purpose |
|---------|---------|
| `make website-dev` | Start dev server with hot reload |
| `make website-build` | Production build (catches type errors) |
| `make website-data` | Regenerate `public/data/*.json` from `data/*.jsonl` crawled data |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type check only (faster than full build) |

## Project structure

```
website/
├── src/
│   ├── app/                    # Next.js App Router (pages)
│   │   ├── max-3d/             # Max 3D product page
│   │   ├── max-3d-pro/         # Max 3D Pro product page
│   │   ├── power-655/          # Power 6/55 product page
│   │   ├── power-645/          # Mega 6/45 product page
│   │   ├── power-535/          # Lotto 5/35 product page
│   │   ├── suggest/            # Unified suggestion panel
│   │   ├── research/           # Research transparency page
│   │   ├── algorithms/         # Algorithm descriptions + rankings
│   │   └── api/crawl/          # Admin-only crawl trigger API
│   ├── components/
│   │   ├── pages/              # Full-page compositions (ThreeDProductPage, etc)
│   │   ├── products/           # Product UI (SuggestionPanel, BacktestCard, etc)
│   │   ├── ui/                 # shadcn primitives
│   │   ├── charts/             # Chart components
│   │   ├── common/             # Shared (Disclaimer, TimeFilter)
│   │   └── layout/             # Nav, Footer
│   └── lib/
│       ├── suggest-matrix.ts   # Matrix strategies implementation
│       ├── suggest-3d.ts       # 3D strategies implementation
│       ├── backtest-data.ts    # Hardcoded backtest results (from research/)
│       ├── stats-matrix.ts     # Matrix stats calcs
│       ├── stats-3d.ts         # 3D stats calcs
│       ├── types.ts            # Shared types + SuggestionStrategy union
│       └── products-config.ts  # Product metadata
├── public/data/*.json          # UI-consumed draw data (regenerated from data/*.jsonl)
├── research/                   # Research artifacts + markdown docs
│   ├── METHODOLOGY.md          # Research pipeline + Principles #1-15
│   ├── RESEARCH_HISTORY.md     # Index of all research cycles
│   ├── history/cycleNN_*.md    # Per-cycle immutable records
│   ├── 3d/                     # 3D research code + results
│   └── matrix/                 # Matrix research code + results
├── CLAUDE.md                   # Dev guide for Claude Code (refer here for UI updates)
├── AGENTS.md                   # Next.js 16 breaking changes note
├── ALGORITHM_MANAGEMENT.md     # Strategy tier system + code architecture
└── RESEARCH_TO_UI_PLAYBOOK.md  # Workflow: research cycle → UI update checklist
```

## Documentation map

**For users**: navigate to `/research` on the website for plain-Vietnamese story.

**For devs** (onboarding order):
1. [CLAUDE.md](CLAUDE.md) — quick reference, conventions
2. [ALGORITHM_MANAGEMENT.md](ALGORITHM_MANAGEMENT.md) — strategy tier system
3. [RESEARCH_TO_UI_PLAYBOOK.md](RESEARCH_TO_UI_PLAYBOOK.md) — when/how to update UI from research
4. [research/README.md](research/README.md) — research pipeline overview
5. [research/METHODOLOGY.md](research/METHODOLOGY.md) — binding principles

**For researchers**:
1. [research/RESEARCH_HISTORY.md](research/RESEARCH_HISTORY.md) — cycle index
2. [research/METHODOLOGY.md](research/METHODOLOGY.md) — 5-phase pipeline + 15 principles
3. [research/TESTING.md](research/TESTING.md) — 14+13 test batteries
4. [research/EVALUATION.md](research/EVALUATION.md) — metrics + decision rules
5. [research/RESEARCH_PLAYBOOK.md](research/RESEARCH_PLAYBOOK.md) — cycle template
6. [research/BREAKTHROUGH_ROADMAP.md](research/BREAKTHROUGH_ROADMAP.md) — novel R&D paths

**Product-specific synthesis**:
- [research/3d/3D_FINAL_REPORT.md](research/3d/3D_FINAL_REPORT.md) — 3D research final verdict (closed Chu kỳ 13)

## Research transparency

**Current state post-Chu kỳ 13 (2026-04-21)**:
- **3D research line CLOSED** — 28 strategies tested, 0 Accept/Suggestive. See [3D_FINAL_REPORT.md](research/3d/3D_FINAL_REPORT.md).
- **Matrix research ACTIVE** — Chu kỳ 14 planned = Path #1 Online Bayesian Kalman (Mega 6/45 primary).
- **Project-wide**: 0 scientifically robust Accept across ~50 strategies × 5 products. Research picks shown in UI chỉ directional, not confirmed edge.

## Tech stack

- Next.js 16.2 + Turbopack
- React 19 (Server Components default)
- Tailwind CSS 4
- shadcn/ui (Badge, Card, Table, Tabs, Sheet)
- TypeScript strict mode

## Contributing

1. Follow [RESEARCH_TO_UI_PLAYBOOK.md](RESEARCH_TO_UI_PLAYBOOK.md) when surfacing research results to UI
2. Run `npm run build` before commit (catches most errors)
3. Visual spot-check affected pages
4. Follow language + badge conventions in [CLAUDE.md](CLAUDE.md)

## License

See [../LICENSE](../LICENSE) (MIT).

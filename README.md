# 🎰 Vietlott Analytics

> An open-source analytics platform for the Vietnamese lottery (Vietlott) — frequency statistics, trend charts, backtested number-suggestion engines, and a transparent research log.

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)

Vietlott Analytics turns nine years of public Vietlott draw history into an interactive web app. It visualizes how numbers behave over time, lets you run number-suggestion strategies that have been backtested against thousands of real draws, and documents — honestly — which strategies actually hold up and which do not.

> **Disclaimer.** This is a data-science and educational project. The lottery is a game of chance with negative expected value; nothing here predicts winning numbers or constitutes gambling advice. The research log is included precisely to show how few strategies survive rigorous testing.

---

## ✨ The Web App

A [Next.js 16](https://nextjs.org/) application (under [`website/`](website/)) that serves as the project's primary interface.

### Supported products

| Product | Format | Category |
|---------|--------|----------|
| **Power 6/55** | Pick 6 of 1–55 | Matrix (Jackpot) |
| **Mega 6/45** | Pick 6 of 1–45 | Matrix (Jackpot) |
| **Lotto 5/35** | Pick 5 of 1–35 | Matrix |
| **Max 3D** | 3-digit draw | Number-string |
| **Max 3D Pro** | 3-digit draw, multi-prize | Number-string |

### Features

- **📊 Statistics & charts** — all-time and rolling-window (30/60/90-day) number frequency, hot/cold numbers, pair frequency, and trend lines, rendered with [Recharts](https://recharts.org/).
- **🎯 Number suggestions** — per-product suggestion engine exposing a 3-pick structure: highest hit-rate, lowest loss (ROI), and balanced. Each pick is selected from backtested composite scores, not guesswork.
- **🔬 Algorithm comparison** — 6+ suggestion strategies (frequency, long-absence, pair-frequency, pattern, exponential-decay, diversity-optimized, …) backtested over thousands of historical draws, with sortable win-rate / ROI tables.
- **📋 Methods catalog** — a classified catalog of 73 play methods that have been tried, including which were rejected and the (single) one that showed a real, verified edge.
- **🎟️ Ticket checker** — paste your numbers (CSV) and check them against the full draw history to see which prizes they would have won.
- **📝 Research log** — a transparent record of research cycles (07/2025 → 04/2026): what was tested, what failed replication, and what survived.
- **📖 Glossary** — plain-language explanations of every metric and term used across the app.

### Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + Turbopack |
| UI | React 19, Tailwind CSS v4, shadcn/ui, lucide-react |
| Charts | Recharts |
| Data | Static JSON generated from the crawler's JSONL output |
| Language | TypeScript |

> ℹ️ This project pins **Next.js 16 + Turbopack**, which differs from older Next.js conventions (Server Components by default, `app/` router, native `<details>` collapsibles). See [`website/AGENTS.md`](website/AGENTS.md).

---

## 🚀 Quick Start (Web)

```bash
# From the repo root
make website-data      # generate website/public/data/*.json from data/*.jsonl
make website-dev       # start the dev server on http://localhost:3000
```

Or directly inside [`website/`](website/):

```bash
cd website
npm install
npm run dev            # development
npm run build          # production build (also runs the full type check)
npm run start          # serve the production build
```

The app reads pre-generated JSON from `website/public/data/`, so it builds and deploys as a standard Next.js application (e.g. to Vercel or any Node host) with no runtime database.

---

## ⚙️ How the Data Pipeline Works

The web app sits on top of an automated data layer:

```
vietlott.vn  ──crawl──▶  data/*.jsonl  ──build_data.py──▶  website/public/data/*.json  ──▶  Web App
```

1. **Crawl** — a Python package fetches the latest results for each product directly from [vietlott.vn](https://vietlott.vn/) and stores them as deduplicated, date-sorted JSONL.
2. **Build** — [`website/scripts/build_data.py`](website/scripts/build_data.py) transforms the JSONL into the compact JSON the UI consumes (run via `make website-data`).
3. **Serve** — the Next.js app renders statistics, charts, and suggestions from that JSON.

Each draw record is `{ date, id, result, process_time }`.

### Data backend (Python)

The crawler/analysis package lives in [`src/vietlott/`](src/vietlott/) and ships a CLI:

```bash
# Install
uv sync --extra dev          # or: pip install -e .

# Crawl latest results for a product
vietlott-crawl power_655

# Backfill missing draw IDs
vietlott-missing power_655
```

Available products: `power_655`, `power_645`, `power_535`, `keno`, `3d`, `3d_pro`, `bingo18`.

Backtesting and the suggestion strategies (frequency, long-absence, pair-frequency, pattern, exponential-decay, …) live in [`src/machine_learning/`](src/machine_learning/) (install the `ml` extra).

---

## 🗂️ Repository Layout

```
.
├── website/              # Next.js 16 web app (the primary interface)
│   ├── src/app/          # App Router routes (home, suggest, algorithms, methods, research, check-rate, glossary, per-product)
│   ├── src/components/    # UI components (products, charts, check-rate, layout, ui)
│   ├── src/lib/          # data loaders, suggestion engines, product config, types
│   ├── public/data/      # generated JSON consumed by the UI
│   ├── scripts/          # build_data.py (JSONL → JSON)
│   └── research/         # research artifacts (backtests + markdown logs)
├── src/vietlott/         # Python crawler + CLI (crawl, missing, suggest)
├── src/machine_learning/ # backtesting + suggestion strategies
└── data/                 # raw draw history (JSONL)
```

---

## 🧪 Development

```bash
# Web
make website-build         # production build (catches type errors)
cd website && npx tsc --noEmit   # type check only

# Python
make test                  # run the test suite
make lint                  # ruff check + format
```

See [`CLAUDE.md`](CLAUDE.md) and [`website/CLAUDE.md`](website/CLAUDE.md) for the full developer guides, and [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidelines.

---

## 🙏 Acknowledgements

This project is inspired by [vietvudanh/vietlott-data](https://github.com/vietvudanh/vietlott-data), whose crawler and data approach laid the groundwork. The web app, suggestion engines, and research log in this repository build on that foundation.

---

## 📄 License

Released under the [MIT License](LICENSE).

This project is for educational and research purposes only. It is not affiliated with Vietlott, and it does not provide gambling advice.

---

<div align="center">
  <strong>⭐ If you find this project useful, consider giving it a star.</strong>
</div>

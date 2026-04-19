# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vietlott-data is a Python package that crawls, stores, and analyzes Vietnamese lottery (Vietlott) results. It supports 7 lottery products: power655, power645, power535, keno, 3d, 3d_pro, and bingo18.

## Common Commands

```bash
# Setup
make .venv                  # Create virtual environment
uv sync --extra dev         # Install dev dependencies

# Development
make test                   # Run all tests (uv run pytest src/vietlott/tests)
make lint                   # Lint + format (ruff check --select I --fix + ruff format)
make build                  # Lint, test, then build dist

# Run crawlers
make run-crawl              # Crawl keno, power_535, power_655
PYTHONPATH=src uv run python src/vietlott/cli/crawl.py <product_name>

# Run missing data detection
make run-missing
PYTHONPATH=src uv run python src/vietlott/cli/missing.py <product_name>

# Run a single test file
uv run pytest src/vietlott/tests/<test_file>.py
```

## Architecture

### Source Layout (`src/vietlott/`)

- **`config/products.py`** — Central configuration. Each lottery product is a `ProductConfig` (attrs dataclass) defining name, data path, number range, draw interval, threading, and pagination. `product_config_map` is the registry keyed by product name (e.g., `"power_655"`, `"keno"`).

- **`config/map_class.py`** — Maps product name strings to their crawler class (factory pattern).

- **`crawler/products/base.py`** — `BaseProduct` is the abstract base for all crawlers. The `crawl()` method handles multi-threaded page fetching via `ThreadPoolExecutor`, deduplication against existing JSONL data, date normalization, and writing results back to JSONL. Each product subclass overrides `process_result()` to parse its specific HTML response.

- **`crawler/products/`** — One module per product (power655.py, keno.py, etc.), each subclassing `BaseProduct`.

- **`crawler/schema/`** — Request/response models using attrs+cattrs for the Vietlott API.

- **`crawler/requests_helper/`** — HTTP client configuration, cookie management, and the `fetch_wrapper` that handles paginated requests.

- **`cli/`** — Click-based CLI entry points: `crawl.py` (fetch data), `missing.py` (detect gaps in draw IDs), `suggest.py` (number suggestion with backtesting).

### Data

Stored in `data/` as JSONL files. Each record has: `date`, `id`, `result` (list of drawn numbers), `process_time`. Data is sorted by `[date, id]` and deduplicated on `id`.

### Machine Learning (`src/machine_learning/`)

Optional module (requires `ml` extra). Contains prediction strategies (frequency, long_absence, pair_frequency, pattern, exponential_decay, random) and a backtesting framework. Uses the strategy pattern with a common base class.

### Documentation Generation

`src/render_readme.py` and `src/render_docs.py` generate README.md and docs/index.html with frequency tables and statistics from the data files.

## Key Conventions

- **Package manager:** uv (not pip directly)
- **Data processing:** polars (not pandas) for core data operations
- **Line length:** 120 characters (ruff config)
- **Python version:** >=3.11, <3.14
- **Product names** use underscores in code (`power_655`) but filenames omit them (`power655.jsonl`)
- **Adding a new product:** Create a `ProductConfig` in `config/products.py`, add to `product_config_map`, create a crawler subclass in `crawler/products/`, and register it in `config/map_class.py`

## Custom Slash Commands

- **`/suggest <product> <N>`** — Generate N lottery number suggestions with historical backtest performance. Crawls latest data first, then runs the diversity-optimized suggestion engine. Default: `power_535 10`.

## Custom Subagents

- **`suggest`** (`.claude/agents/suggest.md`) — Autonomous agent that crawls latest data, generates lottery suggestions, and backtests them. Invoke with `@suggest` or let Claude auto-delegate when you ask for lottery number suggestions. Uses the `suggest.py` CLI tool under the hood.

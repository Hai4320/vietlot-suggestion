# Makefile
VENV_DIR := .venv
UV := uv
LINTER := ruff  # Replace this with the packages you need
LOGURU_LEVEL := INFO
export

all: lint test
.PHONY: all requirements-dev test lint build pypi run-crawl run-missing run-check-rate website-install website-dev website-build website-data research-cycle22 research-cycle22-rebacktest

.venv:
	@echo "Initializing virtual environment..."
	$(UV) venv

requirements-dev: .venv
	@echo "Generating & installing dev requirements..."
	$(UV) run pip compile --extra dev pyproject.toml > requirements-dev.txt
	$(UV) run pip install -r requirements-dev.txt
	$(UV) run pip install -e .

test:
	$(UV) run pytest src/vietlott/tests

lint: .venv
	@echo "Linting..."
	$(UV) run ruff check --select I --fix ./src
	$(UV) run ruff format ./src

build: lint test
	@echo "Building..."
	$(UV) run python -m build

pypi: build
	@echo "Publishing..."
	$(UV) run python -m twine upload --repository testpypi dist/*

run-crawl: .venv
	@echo "Running crawl scripts..."
	LOGURU_LEVEL=$(LOGURU_LEVEL) PYTHONPATH=src $(UV) run python src/vietlott/cli/crawl.py keno
	LOGURU_LEVEL=$(LOGURU_LEVEL) PYTHONPATH=src $(UV) run python src/vietlott/cli/crawl.py power_535
	LOGURU_LEVEL=$(LOGURU_LEVEL) PYTHONPATH=src $(UV) run python src/vietlott/cli/crawl.py power_655

run-missing: .venv
	@echo "Running missing scripts..."
	LOGURU_LEVEL=$(LOGURU_LEVEL) PYTHONPATH=src $(UV) run python src/vietlott/cli/missing.py keno
	LOGURU_LEVEL=$(LOGURU_LEVEL) PYTHONPATH=src $(UV) run python src/vietlott/cli/missing.py power_535

run-check-rate: .venv
	@echo "Usage: make run-check-rate CSV=path/to/tickets.csv [ARGS='--backtest-draws 100']"
	@test -n "$(CSV)" || (echo "CSV= required" && exit 1)
	LOGURU_LEVEL=$(LOGURU_LEVEL) PYTHONPATH=src $(UV) run python src/vietlott/cli/check_rate.py $(CSV) $(ARGS)

# ── Website ──────────────────────────────────────────────────
website-install:
	@echo "Installing website dependencies..."
	cd website && npm install

website-data: .venv
	@echo "Building website data from JSONL..."
	$(VENV_DIR)/bin/python website/scripts/build_data.py

website-dev: website-data
	@echo "Starting website dev server..."
	cd website && npm run dev

website-build: website-data
	@echo "Building website for production..."
	cd website && npm run build

# ── Research data pipeline ──────────────────────────────────
# Chu kỳ 22 Optimization rankings: JSON → UI auto-sync
# UI reads research/optimization/cycle22_rankings.json directly qua TS import
# (no codegen step). Re-run ranking script nếu cần refresh data.

research-cycle22-rebacktest: .venv
	@echo "Chu kỳ 22 — Re-running fresh split-half backtests (matrix + 3D)..."
	$(VENV_DIR)/bin/python website/research/optimization/cycle22_rebacktest_matrix.py
	$(VENV_DIR)/bin/python website/research/optimization/cycle22_rebacktest_3d.py

research-cycle22: .venv
	@echo "Chu kỳ 22 — Computing rankings từ existing backtest JSONs..."
	$(VENV_DIR)/bin/python website/research/optimization/cycle22_ranking.py
	@echo "✓ cycle22_rankings.json updated. Next 'make website-dev' hoặc 'make website-build' sẽ pick up tự động."

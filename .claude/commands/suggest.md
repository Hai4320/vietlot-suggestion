# Vietlott Number Suggestion

Generate lottery number suggestions with backtest performance analysis.

## Arguments

$ARGUMENTS should be in format: `<product> [number_of_tickets]`

Examples:
- `/suggest power_535 10`
- `/suggest power_655 5`
- `/suggest power_535` (defaults to 10 tickets)

## Instructions

Parse the arguments:
- First argument = product name (required): power_535, power_655, power_645, keno, 3d, 3d_pro, bingo18
- Second argument = number of tickets (optional, default: 10)

If no arguments provided, use `power_535 10` as default.

### Step 1: Crawl latest data

Run the crawler to ensure data is up-to-date:

```
PYTHONPATH=src .venv/bin/python src/vietlott/cli/crawl.py <product>
```

### Step 2: Generate suggestions with backtest

Run the suggest CLI tool:

```
PYTHONPATH=src .venv/bin/python src/vietlott/cli/suggest.py <product> --tickets <N> --backtest-draws 50
```

### Step 3: Present results

Show the user:
1. The suggested tickets table
2. Coverage statistics (how many numbers/specials covered)
3. Backtest performance (match distribution, prizes won, ROI)
4. A brief reminder that lottery is random and this is for entertainment only

### Game rules reference

| Product | Main Numbers | Special | Ticket Price |
|---------|-------------|---------|-------------|
| power_535 | 5 from 1-35 | 1 from 1-12 | 10,000 VND |
| power_655 | 6 from 1-55 | none | 10,000 VND |
| power_645 | 6 from 1-45 | none | 10,000 VND |

### Algorithm summary

The suggestion engine uses a **diversity-first, score-seeded** approach:
- Composite score per number: 30% recent-30d frequency + 25% recent-14d + 20% days-overdue + 15% all-time
- Score-weighted random sampling with diversity constraints
- Each number appears at most ceil(N * main_size / total_numbers) + 1 times
- Special numbers distributed round-robin across tickets
- Backtest simulates tickets against last 50 historical draws

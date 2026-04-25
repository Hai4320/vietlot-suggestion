---
name: backtest-accounting-pitfalls
description: Specific accounting bugs in the project's backtest paths that inflate apparent ROI
type: project
---

**Pitfall A — single-ticket variance dominance (`machine_learning/backtest.py` and the readme ROI table).**
The readme reports random strategy +1806.79% ROI on 26,440 power_655 tickets. By reproducing the prize math: 561×50,000 + 27×500,000 + 1×5,000,000,000 = 5,041,550,000 VND — exactly the reported gain. The "edge" is one 5-match hit. Under random play P(≥1 5-match in 26,440 tickets) ≈ 0.235, so a quarter of seeds produce a similar headline. The 1806% figure is *single-trial variance* presented as a metric.

**Pitfall B — best-ticket-per-draw asymmetry (`src/vietlott/cli/suggest.py::backtest_tickets`).**
For each draw it finds the *best* match across all N tickets and credits only that ticket's prize, but charges cost = n_draws × n_tickets × 10_000 (all tickets). This *under*-counts winnings (multiple low-tier wins per draw collapse to one) and arguably *over*-counts cost relative to the EV calculation. The opposite asymmetry to Pitfall A — but still wrong.

**Pitfall C — no FWER/multiple-testing correction.**
4–8 strategies are compared on the same backtest window. With α=0.05 per test, FWER at K=4 is 1−0.95⁴ ≈ 18.5%; at K=8 is ≈ 33.7%. The readme's "🥇/🥈/🥉" ranking has no such adjustment.

**Pitfall D — in-sample tuning.**
Strategy hyperparameters (lookback_days=365, top_n=10, prior_strength=1.0, half_life=90, selection_weight=0.7…) are not derived from theory; they have been chosen by someone. If they were chosen by looking at backtest performance — even informally during development — every reported metric is in-sample.

**Pitfall E — partial look-ahead in detect_game_shape.**
`detect_game_shape` in suggest.py looks at the *full* dataset (including the most recent draws) to decide main_size and sp_max. For backtesting tickets *against* part of that dataset, this is mild but real leakage of structural info. More importantly the `Stats` object is built once on the entire `df` (including draws 1..N) and then evaluated on draws N−k..N — composite scores on those backtest draws thus include the draws themselves. Subtle but real.

**Why:** These pitfalls inflate apparent ROI by orders of magnitude relative to the −74% house edge. A user reading the table is led to believe lottery prediction works.

**How to apply:** When reviewing any new strategy/backtest comparison: (1) demand a Monte Carlo null built from shuffling the same data — does the strategy still beat the null? (2) demand strict walk-forward with state recomputed per evaluation date. (3) require Bonferroni or BH correction on K-strategy tables.

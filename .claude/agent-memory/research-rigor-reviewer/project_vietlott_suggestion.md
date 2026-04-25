---
name: vietlott-suggestion-engine
description: Project context — what the suggestion/check-rate stack is and what the user is doing with it
type: project
---

The repo crawls Vietlott (Vietnamese lottery) data and ships a "suggestion engine" composed of multiple algorithms (mindistance, maxentropy, absence, bayesian, frequency hot/cold, exponential_decay, pair_frequency, not_repeat, pattern, ensemble, wheeling, adaptive_window). There is a `/suggest` CLI, a `check-rate` CLI/UI for scoring saved tickets against draws, and a "Save to test/" UI button that persists generated tickets to CSVs (e.g. `test/data-24-04.csv`).

**Why:** The user appears to be actively generating tickets and tracking them against real future Vietlott draws — i.e. using the tool to play, not just to study randomness. Recent commits add ROI dashboards and cross-strategy comparison features. The `readme.md` for `machine_learning/` claims "educational only" but presents an ROI ranking with random at +1806% — confusing presentation that reads like a leaderboard.

**How to apply:** When reviewing this project's predictive claims, the reviewer's primary obligation is to make the i.i.d. nullity of the data unambiguous and to flag accounting/UX patterns that produce false confidence. Do not be tactful about the math — give exact null probabilities, exact house edge, and exact identification of which "wins" in a backtest are noise vs. signal.

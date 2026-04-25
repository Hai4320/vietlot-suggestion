---
name: power-535-iid-baseline
description: Empirical and theoretical baselines for Vietlott power_535 — use as null hypothesis when evaluating strategies
type: project
---

**Empirical (verified 2026-04-25, n=551 draws in `data/power535.jsonl`):**
- Main numbers (1–35): chi-square = 29.26, df=34, p ≈ 0.70 → fail to reject uniformity.
- Special (1–12): chi-square = 6.86, df=11, p ≈ 0.81 → fail to reject uniformity.
- Min/max main frequency 66/96, expected 78.7, stdev 8.11 — entirely within sampling noise (binomial sd ≈ 8.6).

**Theoretical (verified by closed-form EV calculation):**
- Per-ticket expected payout = 2,594 VND vs. 10,000 VND cost.
- House edge ≈ 74.06%. Long-run ROI for any unbiased strategy must converge to about −74%.
- P(5-match-and-special / jackpot) per ticket ≈ 2.57e-07.
- P(5-main-no-special) per ticket ≈ 2.82e-06.

**Why:** Establishes the null hypothesis. Any strategy claiming positive ROI on power_535 over a meaningful sample must either find a physical bias (none in current data) or has a methodology bug (look-ahead, double-count, single-ticket variance dominating).

**How to apply:** When the user (or readme) shows positive-ROI numbers, immediately compute: (a) is this within sampling noise of the −74% null, (b) is the apparent edge driven by 1–2 very rare large wins. If yes, the headline is variance, not signal.

## Chu Kỳ 27 — Pre-Registration: Tier-3 Compounding + Calendar + Deferred 3D

**Status**: ✅ **EXECUTED 2026-04-24** (same-day framework + 9 methods shipped). Moved to `executed/` on close. Frozen per Principle #16. Verdict record: [history/cycle27_tier3_compounding_calendar.md](../../history/cycle27_tier3_compounding_calendar.md).

**Mode**: Optimization extension (compounding + time frequency + bet-structure variants).

**Parent catalog**: [BETTING_METHODS_CATALOG.md](../BETTING_METHODS_CATALOG.md).

**Estimated effort**: ~3-4h (framework D6 + D3 extensions ~1.5h + specs + sweep + review).

---

### Canonical goal

Extend `methods_evaluator.py` D6 compounding dimension + D3 time frequency (weekly calendar) + add C6 A=B bet-structure. Execute Tier-3 method sweep. Document compounding bankruptcy rates for user education.

**Not a scientific hypothesis** — Optimization descriptive.

---

### Scope

#### Phase 27.1 — Framework extension

**D6 compounding** — bet size varies per outcome:

| compounding.type | Behavior |
|---|---|
| `flat` (existing) | Bet fixed |
| `martingale` (new) | Double after loss; reset after win. Cap at `max_multiplier`. |
| `anti_martingale` (new) | Double after win; reset after loss. Cap at `max_multiplier`. |
| `near_miss_escalation` (new) | Escalate only after "near-miss" (matrix: 3-match on 5-need; 3D: same 2 digits) |

**Cost scaling**: each draw, cost = base_ticket_price × current_multiplier × n_tickets_in_bundle. Running multiplier tracked in RunState.

**D3 time frequency** — add:
- `weekly_calendar` — play only on specific weekdays (needs draw date parsing)

**Bet-structure addition**:
- `a_equal_b` (new, 3D Pro only) — ticket = [X, X] where X is selection-picked

#### Phase 27.2 — Method specs

**G compounding** (matrix + 3D, cautionary):

| ID | Method | Products |
|:-:|---|---|
| G2-M | Martingale (double after loss, cap 32×) | power_655, power_645, power_535, max_3d, max_3d_pro |
| G2-M-cap8 | Martingale capped at 8× (safer) | power_655, power_535, max_3d |
| G3-AM | Anti-Martingale (double after win, cap 16×) | power_655, max_3d |
| G5-NM | Near-miss escalation (matrix 3-match triggers 2×) | power_655, power_645 |

**E calendar**:

| ID | Method | Products |
|:-:|---|---|
| E2 | Alternate (play every 2nd draw) | all 5 |
| E-K3 | Every 3rd draw | all 5 |
| E-K7 | Every 7th draw (weekly sparse) | all 5 |

**Deferred 3D**:

| ID | Method | Products |
|:-:|---|---|
| C6-AB | 3D Pro A=B exploit (ticket = [X, X] via TierWeighted) | max_3d_pro |
| C6-AB-random | A=B with random X | max_3d_pro |

**Explicit deferrals (beyond Chu kỳ 27)**:
- B8 5/35 special sub-strategies — needs significant adapter work (separate special generation)
- B9 6/55 bonus-ball targeting — needs adapter work (tier-2 aware scoring)
- E4 proper jackpot-triggered — needs Vietlott jackpot flag in data layer
- C4 KK 2-số-cuối focused — needs tier-aware selection (considered but descope for Chu kỳ 28 if time)

Total Tier-3 specs: ~10.

#### Phase 27.3 — Sweep

Compute estimate: ~5-10 min (compounding has no bundle blow-up; calendar only plays subset).

**Critical warning for compounding**: Martingale bankruptcy rates will be reported prominently. Max multiplier cap is CRUCIAL — without cap, single 10-draw cold streak = 1024× bet = ruin. With cap 32× = 2^5, user still loses 10K + 20K + 40K + ... + 320K = 630K on 5 losses before reset at win, and may never recover house edge.

#### Phase 27.4 — Review + close

`cycle27_review.md` with special focus on:
- Bankruptcy rates per compounding variant
- Time-to-ruin distribution
- Capped vs uncapped Martingale comparison
- Cross-product compounding consistency

---

### Methodology

Inherits Chu kỳ 25/26: N_RUNS=20, 4-segment, 12-metric bundle, same composite weights.

**Compounding-specific metrics**:
- `max_multiplier_reached` per run
- `bankruptcy_rate_B1M` (cumulative loss exceeds 1M)
- `pct_runs_hit_cap` (reached max_multiplier)

**Family check Principle #17**:
- G2/G3/G5 compounding — NOT in eliminated family (Kelly G7 is, but these are different). TEST to DOCUMENT bankruptcy, not to claim edge. Pass.
- E calendar = neutral time filter. Pass.
- C6 A=B = 3D Pro specific bet structure. Pass.

All Tier-3 methods pass Principle #17.

---

### Retry Tree (Principle #16)

**Tier 1 — Paradigm swap**:
- R1: Martingale uncapped causes int overflow → enforce cap in framework regardless
- R2: Near-miss escalation rarely triggers → report low trigger rate as finding

**Tier 2 — Within-paradigm**:
- V1: Adjust max_multiplier caps (e.g., 16× instead of 32×)
- V2: Test only on Power 6/55 if compute explodes

Cap 3 retries.

---

### NOT in scope

- B8/B9 product-specific adapter work (deferred Chu kỳ 28 if time)
- E4 proper jackpot-triggered (needs data)
- UI changes

---

### Artifacts

- Pre-reg (this file) — frozen, moves to `executed/` on ship
- `methods_evaluator.py` extended (D6 compounding + D3 weekly + a_equal_b)
- `cycle27_methods/*.json` — ~10 spec files
- `cycle27_results.json` — canonical output
- `cycle27_review.md` — review with bankruptcy focus
- `history/cycle27_*.md` — closure record
- Updated [BETTING_METHODS_CATALOG.md](../../BETTING_METHODS_CATALOG.md) with Tier-3 rows

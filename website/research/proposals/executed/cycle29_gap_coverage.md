## Chu Kỳ 29 — Pre-Registration: Gap Coverage (Remaining Easy Methods)

**Status**: ✅ **EXECUTED 2026-04-24** (same-day framework + 6 methods shipped, all null). Moved to `executed/` on close. Frozen per Principle #16. Verdict record: [history/cycle29_gap_coverage.md](../../history/cycle29_gap_coverage.md).

**Mode**: Optimization extension — fill catalog gap for methods testable with framework extensions (~30 min each).

**Parent**: [BETTING_METHODS_CATALOG.md](../BETTING_METHODS_CATALOG.md) — 47/73 tested post-28, goal ~53-55/73 post-29.

**Estimated effort**: ~3-4h (framework extensions + 6-8 specs + sweep + review).

---

### Canonical goal

Extend `methods_evaluator.py` for 3 new dimensional variants (F5 jackpot-stop / F8 reset-after-cold / G4 progression) + add C7 digit-sum filter (trivial). Execute gap method sweep. Update catalog.

**Not a breakthrough hypothesis** — Optimization descriptive coverage.

---

### Scope

#### Phase 29.1 — Framework extension (~1h)

**D5 stop_condition new types**:
- `jackpot_only` — stop only on highest-tier hit (Đặc biệt for matrix / Nhất for 3D Pro A=B). Requires tier_name check from TicketResult.

**D1 selection new variant**:
- `persistent_with_reset` — algo_persistent + reset cache after K consecutive misses

**D6 compounding new type**:
- `progression_1326` — sequence [1, 3, 2, 6] bet multipliers; advance on win, reset on loss

#### Phase 29.2 — Method specs (~30 min)

| ID | Method | Product | Framework need |
|:-:|---|---|---|
| F5a | Stop at Đặc biệt only (matrix) | Power 6/55, 6/45 | `jackpot_only` stop |
| F5b | Stop at Nhất only (3D Pro, A=B persistence) | max_3d_pro | combined jackpot_only + a_equal_b |
| F8 | F3 + reset after 30 cold | Matrix + 3D | `persistent_with_reset` selection |
| G4 | 1-3-2-6 progression | Power 6/55 | `progression_1326` compounding |
| C7 | Digit-sum targeting (Max 3D) | max_3d | sum-range filter (existing) |
| F9 | Stop after 3 hits | Matrix | existing `n_hits` stop |
| H3 | Cross-product "same numbers" (Power 6/55 + Mega 6/45 shared) | Both products | existing framework (manual pairs) |

Total: **7 specs**. Some skipped B8/B9 cần adapter work — defer Chu kỳ 30 nếu user muốn.

#### Phase 29.3 — Sweep + review (~1.5h)

N_RUNS=20 (default) for all new methods. Estimate compute: 30-60s.

`cycle29_review.md` with dominance analysis + catalog update.

---

### Decision rule

- Inherits Chu kỳ 25/26/27 composite weights
- No Accept claims (gap coverage for catalog completeness)
- Any Δ_ROI > +3pp vs Random + forward-pass → flag for Chu kỳ 30 replication
- Expected outcome: all methods within variance of Random (null findings fill catalog)

---

### Family check (Principle #17)

- F5/F8/F9: stop-condition variants, not new family
- G4: compounding variant (same family as G2 Kelly-adjacent). G7 Kelly eliminated; G4 progression không Kelly — OK per methodology
- C7: digit-sum filter (selection variant), not eliminated family

All pass.

---

### Artifacts

- Pre-reg (this file) — frozen, moves to `executed/` on close
- `methods_evaluator.py` extended (F5/F8/G4 support)
- `cycle29_methods/*.json` — 7 specs
- `cycle29_results.json` — canonical output
- `cycle29_review.md` — review + catalog update
- `history/cycle29_gap_coverage.md` — closure record

---

### NOT in scope

- B8 5/35 special sub-strategies (needs significant special-generation adapter work)
- B9 6/55 bonus-ball targeting (needs tier-2 aware scoring)
- Deferred to Chu kỳ 30 if user wants OR skip permanently

---

### Expected outcome

- 7 new methods tested
- 53-55/73 catalog coverage
- Likely 0 Accept (gap methods are low-priority variants)
- Framework + catalog complete enough for Plan 3 `/methods` page build

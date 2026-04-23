## Chu Kỳ 23 — Pre-Registration: App-wide UX Refactor

**Status**: ✅ **EXECUTED 2026-04-22** (all 4 phases 23.1-23.4 shipped). Moved to `executed/` 2026-04-23. Frozen per Principle #16. Verdict record: [history/cycle23_app_refactor.md](../../history/cycle23_app_refactor.md).

**Mode**: Optimization mode extension (UI-only, no new research mechanism).

**Supersedes**: previous Chu kỳ 23 plan (budget-aware feature) — pushed to Chu kỳ 24.

---

### Context

Post Chu kỳ 22 Optimization shipment, user feedback identified 7 UX issues:
1. UI thừa, chú thích lung tung
2. Dữ liệu thiếu hệ thống, chưa sync
3. Khó hiểu, lạc mục tiêu page
4. Badge taxonomy lung tung
5. `/research/cycle22` nên merge vào `/research`
6. Statistics chưa cập nhật
7. Suggest feature cần làm lại

### Goal (not scientific — UX goal)

> Refactor 7 user-facing routes để: (1) user time-to-first-suggestion < 10s, (2) clicks-to-generate = 2, (3) single source of truth cho stats, (4) max 5 badges toàn app, (5) honest disclosure giữ nguyên (không tụt).

**No new research**. UI layer only. No new strategies. No mechanism changes.

### Scope

**Pages refactored**: `/`, `/suggest`, `/power-655`, `/power-645`, `/power-535`, `/max-3d`, `/max-3d-pro`, `/algorithms`, `/research`, `/glossary`.

**Pages deleted**: `/research/cycle22` (merged vào `/research`).

**Shared components touched**: `SuggestionPanel`, `MatrixProductPage`, `ThreeDProductPage`, `BacktestCard`, data modules (`backtest-data.ts`, `cycle22-data.ts`).

### Evaluation criteria

See [cycle22_review.md §4 — carried forward with additions](../optimization/cycle22_review.md) → minimum gates:

**Task** (measured):
- M1: time-to-first-suggestion < 10s
- M2: clicks-to-generate = 2

**Density**:
- D1: ≤ 2 badges per item, D2: ≤ 3 status vocabularies, D3: disclaimer < 50 chars pre-action, D4: `/research` ≤ 5 sections, D5: `/suggest` default ≤ 5 strategies visible.

**Data integrity**:
- I1: 0 stale strings ("Chu kỳ 14 pending" etc.), I2: backtest-data matches cycle22 rankings, I3: single source `cycle22-data.ts`.

**Preservation (MUST NOT break)**:
- P1: 6 primary routes 200, P2: generate function valid, P3: all 13 strategies accessible via `/algorithms`, P4: no console errors, P5: mobile responsive, P6: honesty gates §6.4 MEASUREMENT.md still pass, P7: history drawer accessible.

### Phases

| Phase | Tier | Scope | Est |
|:-:|:-:|---|:-:|
| 23.1 | T5+T2 | Data sync script + stale string audit + `backtest-data.ts` rebuild | 2d |
| 23.2 | T2 | Badge taxonomy reset (max 5 badges) | 1d |
| 23.3 | T5+T3 | `/research` reorg + inline cycle22 + delete `/research/cycle22` route | 2d |
| 23.4a | T4 | `/suggest` 3-fold refactor (product picker → quick generate → advanced) | 2d |
| 23.4b | T4 | Product pages light SuggestionPanel | 1.5d |

**Atomic commits per phase**. Revert granularity = 1 phase.

### Execution policy

- No formal mockups (code is spec). User trusts developer judgment.
- Canary: commit each phase separately, push periodically.
- Archive `/research/cycle22` content as static markdown before deletion (preserve history).
- Baseline measurements captured at start (M1/M2 stopwatch before refactor).

### Artifacts

- `proposals/cycle23_app_refactor.md` (this, frozen)
- `scripts/sync_ui_data.py` (data sync script, idempotent)
- Phase commits per atomic scope
- `history/cycle23_app_refactor.md` (closure record)

### Eliminated from scope

- Budget-aware feature (Chu kỳ 24 now)
- New research mechanisms
- Re-backtest (data from Chu kỳ 22 reused)
- Backend/API changes

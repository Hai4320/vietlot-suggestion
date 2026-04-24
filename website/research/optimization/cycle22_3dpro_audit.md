# Chu Kỳ 22 — Max 3D Pro Backtest Audit (2026-04-24)

**Origin**: [plans/max3d_pro_backtest_audit.md](../../plans/max3d_pro_backtest_audit.md) (discovered during check-rate Phase 5).

**Scope**: Phase A verification — re-run Chu kỳ 22 backtest for `max_3d_pro` using the correct 8-tier order-sensitive + A=B doubling evaluator (instead of the legacy Max-3D-style 4-tier per-number evaluator). Diff rankings.

**TL;DR**:
- Legacy evaluator WAS wrong for 3D Pro (confirmed H1 from audit plan)
- Rankings rearrange internally — top-1 flips for 2/3 composite profiles (ROI + Balanced: EVMaximizer → TierWeighted). Win-rate top-1 unchanged (EVMaximizer)
- **No strategy survives split-half + forward verify** under corrected evaluator → `picks = null` UI state from Chu kỳ 22 **remains correct**
- **Severity downgraded**: 🔴 High (audit doc assumption) → 🟢 Low (no UI user-impact because picks were null)
- **Recommendation**: write note in `cycle22_review.md` appendix documenting the fix + keep `/research` surfaces as-is. No re-ship needed.

---

## 1. What was wrong

Canonical check-rate evaluator ([src/vietlott/check_rate/evaluators/p3d_pro.py](../../../src/vietlott/check_rate/evaluators/p3d_pro.py), shipped check-rate Phase 5) resolves Max 3D Pro tickets via:
- Ticket = (A, B), 2 ordered 3-digit numbers
- 8-tier hierarchy (ĐB / Phụ ĐB / Nhất / Nhì / Ba / Tư / Năm / Sáu), mutually exclusive
- Order-sensitive: Đặc biệt requires A=DB[0] AND B=DB[1]; Phụ Đặc biệt = reversed
- A=B doubling: Nhất–Sáu prizes doubled; ĐB+Phụ ĐB collapsed to combined 2.4B on (X,X) draw
- Prize amounts: 2B / 400M / 30M / 10M / 4M / 1M / 100K / 40K VND

Research backtest ([research/3d/advanced_backtest.py:1238 `evaluate_prediction`](../3d/advanced_backtest.py), used by Chu kỳ 22 [cycle22_rebacktest_3d.py:118](cycle22_rebacktest_3d.py)) uses:
- Flat list of predicted 3-digit strings, treated as independent tickets
- 4-tier lookup (`TIER_ORDER = ["Giải Đặc biệt", "Giải Nhất", "Giải Nhì", "Giải ba"]`)
- Prize amounts from `PRODUCTS_3D["max_3d_pro"]["prizes"]` = Max 3D's amounts (1M / 350K / 210K / 100K) — wrong for 3D Pro
- No order, no pair structure, no A=B doubling, no Tư/Năm/Sáu tiers

**Affected**: every 3D Pro cycle to date (4, 7, 11, 12, 12.5, 13, 17, 22) — all used same shared evaluator.

---

## 2. Corrected evaluator

**Artifact**: [research/3d/p3d_pro_evaluator.py](../3d/p3d_pro_evaluator.py)

Ports the canonical resolver into a research-scripts-compatible module. Key function `evaluate_prediction_3dpro(predicted, draw, prize_map=None)` is a drop-in replacement for `evaluate_prediction`:
- Pairs adjacent predictions into tickets `((p[0], p[1]), (p[2], p[3]), ...)`. For Chu kỳ 22 `N_PREDICTIONS=2`, this yields 1 ticket per draw.
- Applies `resolve_3d_pro_ticket` (mirror of check_rate logic)
- Returns same dict shape as legacy `evaluate_prediction` for drop-in compat (keys: `exact_count`, `matches`, `total_prize`, plus extra `n_tickets`)

**Smoke test passed**: Random strategy 500 draws → win rate 5.6%, tier_hits = {Năm: 2, Sáu: 26}, ROI −75.2%. Aligns with theoretical ~4% pair-hit rate + absence of Tư/Nhất/Nhì/Ba/ĐB/Phụ ĐB for random picks.

---

## 3. Corrected backtest

**Artifact**: [cycle22_rebacktest_3dpro_corrected.py](cycle22_rebacktest_3dpro_corrected.py) → [cycle22_backtest_3dpro_corrected.json](cycle22_backtest_3dpro_corrected.json)

Constants identical to Chu kỳ 22 original:
- `N_RUNS=5`, `SEED=42`, `MIN_HISTORY=50`, `N_PREDICTIONS=2` (paired into 1 ticket), `FORWARD_WINDOW=100`
- 17 non-excluded strategies × 4 segments (full / half1 / half2 / forward)
- Elapsed: 326s (vs original's full 3D batch 822s for 2 products)

---

## 4. Rankings diff — full segment

Analyzer: [cycle22_3dpro_diff.py](cycle22_3dpro_diff.py) → [cycle22_3dpro_diff.json](cycle22_3dpro_diff.json)

### WinRate profile

| Rank | OLD (wrong eval) | NEW (correct eval) |
|:-:|---|---|
| 1 | D1: EVMaximizer (+1.425) | **D1: EVMaximizer (+1.479)** |
| 2 | ULTIMATE_v2_sharp (+1.221) | **B2: TierWeighted (+1.096)** |
| 3 | A1: JointBias_T1.0 (+0.846) | A1: JointBias_T1.0 (+0.676) |
| 4 | B3: StratifiedDigit (+0.493) | ULTIMATE_v2_sharp (+0.663) |
| 5 | A2: CondChain_T0.6 (+0.475) | B3: StratifiedDigit (+0.296) |

**Top-1 unchanged** (EVMaximizer). Internal rearrangement: TierWeighted climbs #6 → #2.

### ROI profile (largest change)

| Rank | OLD | NEW |
|:-:|---|---|
| 1 | D1: EVMaximizer (+1.551) | **B2: TierWeighted (+2.088)** ← flip |
| 2 | ULTIMATE_v2_sharp (+1.423) | D1: EVMaximizer (+1.619) |
| 3 | A1: JointBias_T1.0 (+0.715) | A1: JointBias_T1.0 (+0.285) |
| 4 | A2: CondChain_T0.6 (+0.555) | ULTIMATE_v2_sharp (+0.039) |
| 5 | B2: TierWeighted (+0.351) | A2: CondChain_T0.8 (−0.022) |

**Top-1 FLIPPED** (EVMaximizer → TierWeighted). Reason: under correct evaluator, B2 TierWeighted scores ROI **+13.8%** on full segment (vs −40.5% under wrong eval). Why: TierWeighted concentrates bets on numbers appearing in high-value tiers — amplified massively when the 2B Đặc biệt tier is actually reachable (it's 2000× higher than the 1M that the wrong eval assumed).

### Balanced profile

| Rank | OLD | NEW |
|:-:|---|---|
| 1 | D1: EVMaximizer (+1.488) | **B2: TierWeighted (+1.592)** ← flip |
| 2 | ULTIMATE_v2_sharp (+1.322) | D1: EVMaximizer (+1.549) |

**Top-1 FLIPPED**. Same cause as ROI.

---

## 5. Split-half + forward verification (decision gate)

Chu kỳ 22 MEASUREMENT §3.3 requires split-half verify **on picks**. Retry up to 3× for direction flips; persistent flip → `picks = null`.

Applying to the NEW top-1 candidates:

### B2: TierWeighted (new top-1 ROI + Balanced)

| Segment | win% | Δ_win_pp vs Random | ROI% |
|:-:|:-:|:-:|:-:|
| full | 4.471 | +0.48 | **+13.8** |
| half1 | 4.771 | +0.85 | **+117.7** |
| half2 | 4.213 | +0.51 | **+87.9** |
| forward | 3.000 | **−2.40** | **−84.4** |

Split-half: ROI both halves positive, Δ_win both positive — **PASS** split-half.
Forward: ROI collapses from +87.9% (h2) to −84.4% (forward), Δ_win drops −2.4pp (3× worse than Random). **FAIL forward gate** (Principle #13 binding).

**Verdict**: would be Rejected at forward gate. `picks.roi` = null (3D Pro retains null).

### D1: EVMaximizer (new top-1 WinRate, unchanged vs old)

| Segment | win% | Δ_win_pp | ROI% |
|:-:|:-:|:-:|:-:|
| full | 4.985 | +0.997 | −16.6 |
| half1 | 5.882 | +1.96 | **+56.9** |
| half2 | 4.213 | +0.51 | **−79.8** |
| forward | 5.000 | −0.40 | −80.0 |

Split-half on ROI: +56.9 → −79.8 **direction flip**. Forward Δ_win negative. **FAIL** split-half.

**Verdict**: `picks.winrate` = null.

### ULTIMATE_v2_sharp (old #2)

Split-half Δ_win: h1 −0.65, h2 +2.47 — **direction flip**. Forward +2.6 positive but split-half already fails. **Verdict**: null.

### Every other candidate

All exhibit either split-half direction flip or forward Δ drop > 1pp. None passes the full 3-gate.

---

## 6. Conclusion

| Item | Status |
|---|---|
| H1 (evaluator was wrong) | ✅ **Confirmed** |
| H2 (Chu kỳ 22 rankings affected) | ✅ **Confirmed** — top-1 flipped for ROI + Balanced profiles |
| H3 (UI picks misleading) | ❌ **Not confirmed** — Chu kỳ 22 UI shows `picks = null` for 3D Pro regardless; no misleading pick surfaced to user |
| Net user-impact | 🟢 **None at UI layer**. `/research` + `/algorithms` surfaces may show ranking *numbers* derived from wrong eval, but no actionable pick is affected |

**Severity reassessment**: 🔴 High (original audit plan assumption) → 🟢 **Low (diagnostic-only)**.

### Actions required

**Tier 1 (data correctness) — RECOMMENDED, low cost**:
- ✅ Completed: corrected evaluator + corrected backtest JSON + diff report (this document)
- ⏳ Add footnote in [cycle22_review.md](cycle22_review.md) appendix linking to this audit, acknowledging that legacy 3D Pro metrics were computed under wrong model but conclusion (null picks) is preserved
- ⚪ Optional: patch [cycle22_rebacktest_3d.py](cycle22_rebacktest_3d.py) to auto-select evaluator by `product_key` for any future re-run

**Tier 2 (UX honesty) — NOT NEEDED**:
- No picks displayed for 3D Pro, so no user-facing label is misleading
- `/research` inline ranking table for 3D Pro should stay as-is unless user requests full correction — but flagging the caveat in glossary might be nice-to-have (LOW priority)

**Tier 3 (native strategy design) — DEFERRED**:
- From audit plan §4. Proposing 3D-Pro-native strategies (forward pair bias, forward+reverse hedge, A=B exploit) is a research cycle. Per project closure (Chu kỳ 18), new mechanisms require §9 trigger. **DEFER** until reopen criteria met. Note: current finding (no strategy survives 3-gate under correct evaluator either) WEAKENS the case for investing in native strategies — the bias, if any, is very small and probably below data-horizon power.

### Not actioned

- Overwriting `cycle22_rankings.json` — **intentionally not done**. Original rankings are a frozen record tied to the shipped UI state; overwriting would break provenance. The corrected rankings live in separate file `cycle22_backtest_3dpro_corrected.json` + `cycle22_3dpro_diff.json` for future reference.
- Re-running full Chu kỳ 22 ranking script — not needed since UI picks unaffected

### Affected historical cycles (informational)

All prior 3D Pro research also used wrong evaluator. The Reject verdicts stand either way because:
- Chu kỳ 7 replication: EVMaximizer split-half flip (0.0007 / 0.865) → still split-half flip under corrected numbers (+56.9 / −79.8 ROI)
- Chu kỳ 8 drift verification: digit bias stability finding — not evaluator-dependent
- Chu kỳ 11 copula / 12 GBM / 13 pooling: overfit/null verdicts — not sensitive to prize-amount scaling
- Chu kỳ 17 HMM: regime falsification based on chi²+max_dev observations — not evaluator-dependent

**No verdict needs reclassification**. The corpus of Reject stands.

---

## 7. Provenance

- Created: 2026-04-24
- Scripts: `p3d_pro_evaluator.py` (3d/), `cycle22_rebacktest_3dpro_corrected.py`, `cycle22_3dpro_diff.py`
- Data: `cycle22_backtest_3dpro_corrected.json` (326s elapsed), `cycle22_3dpro_diff.json`
- Source-of-truth evaluator: `src/vietlott/check_rate/evaluators/p3d_pro.py` (shipped check-rate Phase 5, 147 pytest pass)
- Cross-referenced: [plans/max3d_pro_backtest_audit.md](../../plans/max3d_pro_backtest_audit.md) (origin)

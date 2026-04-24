# Plan — Ship C6 A=B Exploit to UI (Max 3D Pro)

**Status**: 📝 **PLANNING 2026-04-24** — user confirmed external validation passed. Awaiting approve before execution.

**Origin**: Chu kỳ 27-28 research finding. C6 A=B Max 3D Pro = +4758% ROI (theoretical +4180%). User validated Vietlott quy chế enforcement externally (2026-04-24).

**Significance**: **FIRST Accept claim in 28-cycle project history**.

---

## 1. What is C6 A=B?

Max 3D Pro ticket = (A, B) pair. Per Vietlott quy chế:
- Nếu A = B = X và X ∈ {Nhất tier numbers} → prize **doubled** = 60M VND (vs normal 30M)
- Tương tự Nhì → 20M, Ba → 8M, Tư → 2M
- Ticket cost **10K VND** per pair
- 20-number universe mỗi kỳ (4 Nhất + 6 Nhì + 8 Ba + 2 ĐB)

**Theoretical EV per ticket**:
```
0.02 × (0.2×60M + 0.3×20M + 0.4×8M + 0.1×2M) = 428K
```
Cost 10K → ROI = +4180% per play.

**Status**: Chu kỳ 28 validated at N=200 across all 4 segments. Negative control confirmed no framework artifact. Forward-gate passed. Upgraded → **Accept** post external validation.

---

## 2. Ship scope

### 2.1 Core TS port (src/lib/suggest-3d-pro-ab.ts — new file)

```typescript
/**
 * C6 A=B Exploit — Max 3D Pro only
 * Generate N ticket pairs [X, X] with random X ∈ [000, 999].
 */
export function generateAB3DPro(count: number): ThreeDProTicket[] {
  const tickets: ThreeDProTicket[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    tickets.push({ a: x, b: x });
  }
  return tickets;
}
```

Minimal code — ~10 lines. Reproduces Chu kỳ 28 C6_ab_random exactly.

### 2.2 Add to SuggestionStrategy enum (src/lib/types.ts)

```typescript
export type SuggestionStrategy =
  | "frequency"
  | ... (existing)
  | "ab_exploit"; // C6 A=B Max 3D Pro Accept claim from Chu kỳ 28
```

### 2.3 UI update — `/max-3d-pro` SuggestionPanel

**Before**: null picks (from Chu kỳ 22 regime-split). Shows disclosure "⚠ Không có edge xác nhận".

**After**:
- **Primary pick**: 🏆 **A=B Exploit** (Accept)
- Portfolio size selector: **1 vé (10K)** / **5 vé (50K)** / **10 vé (100K)** / custom
- Stats display:
  - Expected ROI: +4180% (theoretical) / +3864% (backtest N=200)
  - P(win ≥ 1 ticket): depends on N (2% × N single / 9.6% × 5 / 17.8% × 10)
  - Ruin @ B=100K, N=100 draws: 0%
- Generate button → produces N tickets, each A=B with fresh random X
- CSV export compatible với `/check-rate`

### 2.4 Badge taxonomy (first 🏆 badge)

Per `website/RESEARCH_TO_UI_PLAYBOOK.md`:
- `🏆 Khuyến nghị` reserved cho confirmed Accept với real edge
- Previously never issued (0 Accept in Chu kỳ 1-27)
- **Chu kỳ 28 C6 → first 🏆 badge use**

Badge color: **green** (stronger than existing `🎯` pick).

### 2.5 Disclosure banner (mandatory)

```
⚠ C6 A=B Exploit Disclaimer:
- Dựa trên Vietlott quy chế A=B doubling rule (xác nhận 2026-04-24)
- Rule có thể thay đổi không báo trước — monitor Vietlott notifications
- Bạn phải nhập cùng số cho A và B khi mua vé thực tế trên vietlott.vn
- EV tính toán theo giá vé hiện tại 10K VND/pair
- Chỉ áp dụng cho Max 3D Pro. Không apply cho Max 3D hay các sản phẩm khác.
```

Always show trên `/max-3d-pro` page trên khi C6 pick là primary.

### 2.6 Glossary entry (src/app/glossary/page.tsx)

New section:
```
C6 A=B Exploit (Chu kỳ 28 Accept)
- Mechanism: Vietlott Max 3D Pro quy chế cho phép ticket A=B. Khi trúng Nhất/Nhì/Ba, prize doubled.
- Backtest: N=200 across 4 segments = +3864% ROI consistent (theoretical +4180%)
- Status: Accept post external validation 2026-04-24 — first Accept in project history
- Scope: Max 3D Pro only, 10K VND/ticket
- Rule dependency: if Vietlott changes quy chế, exploit disappears
```

### 2.7 /research page update

Add section **"🎯 Breakthrough đã tìm được"**:
- Cumulative claim: 0 Accept → **1 Accept (C6 A=B Max 3D Pro)**
- Link sang cycle28 meta-analysis
- Update chart/stats với first green checkmark

### 2.8 Research artifacts (formal closure)

- `PROJECT_CLOSURE_REPORT.md` §9 "reopen triggers" section updated: "null-reversal finding achieved Chu kỳ 28 with external validation 2026-04-24"
- `RESEARCH_HISTORY.md` cumulative tally: **1 Accept added**
- New history record or append to cycle28: "Accept granted after user external validation 2026-04-24"

---

## 3. Integration với Chu kỳ 24 Budget Portfolio

**Current Chu kỳ 24 state**: Max 3D Pro = null-pick (disclosed "⚠ Không có edge xác nhận").

**Post-C6 Accept**: Update Chu kỳ 24 allocator:
- Max 3D Pro anchor = C6 A=B (Pure or portfolio variant depending on budget)
- Regenerate `cycle24_portfolios.json` với new anchor
- Max 3D Pro dominates ranking across all budgets (only product với positive ROI)
- Remove disclosure banner; replace với C6 disclaimer

**Ripple**: Chu kỳ 24 review doc appendix needed ghi nhận update.

---

## 4. Phases

### Phase 1 — TS port + types (~30 min)

1.1 Create `src/lib/suggest-3d-pro-ab.ts` với `generateAB3DPro()` function

1.2 Add `"ab_exploit"` to `SuggestionStrategy` enum in `src/lib/types.ts`

1.3 Unit-test-ish: run `generateAB3DPro(10)` in Node, verify 10 tickets each A=B

### Phase 2 — UI SuggestionPanel update (~1.5h)

2.1 Update `PRODUCT_RANKS["max-3d-pro"]` in `SuggestionPanel.tsx`:
- Replace null picks với `{ strategy: "ab_exploit", stat: {...} }`
- Add badge "🏆 A=B Exploit"
- Add portfolio size selector state

2.2 Generate handler: call `generateAB3DPro(count)` with user-selected N

2.3 Stats display logic: compute expected ROI/P(hit) based on N

2.4 Disclosure banner component (reusable): render on `/max-3d-pro` page

### Phase 3 — Glossary + research page updates (~45 min)

3.1 Glossary: new section "C6 A=B Exploit"

3.2 `/research` page: highlight first Accept claim, link to cycle28

3.3 `/algorithms` page: add `ab_exploit` row (badge 🏆)

### Phase 4 — Chu kỳ 24 allocator update (~30 min)

4.1 Edit `cycle24_allocator.py` PRODUCT_CONFIGS["max_3d_pro"]:
- anchors: `["C6 A=B"]` (new anchor name)
- bet_size override: `a_equal_b_portfolio` với `n_tickets = budget/10_000`

4.2 Re-run allocator → regenerate `cycle24_portfolios.json`

4.3 Verify UI auto-picks up new data (cycle24-data.ts imports JSON directly)

### Phase 5 — Formal closure (~30 min)

5.1 Update `PROJECT_CLOSURE_REPORT.md` §9 reopen status + cumulative count

5.2 Update `RESEARCH_HISTORY.md` cumulative: 0 Accept → 1 Accept

5.3 Append to `history/cycle28_c6_validation_meta_analysis.md`: post-script "Accept granted 2026-04-24 post user validation"

5.4 Update memory `project_research_state.md`: Optimization phase CLOSED với Accept

### Phase 6 — QA + commit (~30 min)

6.1 TypeScript check

6.2 `npm run build` pass

6.3 Curl smoke 11 routes

6.4 Visual check `/max-3d-pro` — C6 pick displays, badges render, disclosure banner present

6.5 Commit theo `RESEARCH_TO_UI_PLAYBOOK.md` template. This commit will be historic — first time Accept badge ships.

---

## 5. Effort estimate

| Phase | Effort |
|:-:|:-:|
| 1 TS port | ~30 min |
| 2 UI SuggestionPanel | ~1.5h |
| 3 Glossary + research page | ~45 min |
| 4 Chu kỳ 24 allocator update | ~30 min |
| 5 Formal closure docs | ~30 min |
| 6 QA + commit | ~30 min |
| **Total** | **~4-4.5h** |

Realistically can compress to ~3h if no refactor surprises.

---

## 6. Dependencies / risks

### Dependencies
- **Chu kỳ 28 research artifacts** (cycle28_meta_analysis.md + results.json) — shipped ✅
- **Vietlott quy chế enforcement** — user validated ✅
- **Chu kỳ 22 picks TS port infrastructure** — reusable ✅
- **Next.js 16 build** — same as existing infra

### Risks
- **Rule change**: Vietlott có thể modify quy chế → disclosure banner cần update mechanism (rebuild + redeploy)
- **User misuse**: user mua A≠B expecting doubled prize → disclaimer explicit rằng PHẢI A=B
- **First Accept bias**: UI prominence của 🏆 badge cho 1 product (Max 3D Pro) có thể skew user hành vi về sản phẩm đó. Legitimate vì product thực sự có edge, nhưng cần careful presentation.

### Mitigation
- Banner prominent + link đến `/research/cycle28` cho full context
- Portfolio size selector mặc định = 10 vé (B=100K) — aligns với Chu kỳ 24 budget canonical
- Không auto-redirect từ other products sang Max 3D Pro. User tự chọn.

---

## 7. Testing strategy

### Functional
- `generateAB3DPro(N)` returns N tickets each A=B
- All A,B digits zero-padded 3-digit
- X values uniformly distributed (no bias toward specific numbers)

### Integration
- UI click "Generate 10 tickets" → 10 ticket rows render
- CSV export → feed into `/check-rate` → parsed correctly
- Check-rate evaluates payout according to `p3d_pro_evaluator.py` (same rule as research backtest)

### Visual / UX
- 🏆 badge green, prominent
- Disclosure banner không bị miss (appears above fold)
- Portfolio selector works on mobile
- No layout breaks at various budget inputs

### Statistical (light)
- Seed reproducibility: no (user-facing randomness OK)
- But ensure no obvious bias (10 random Xs should have variance)

---

## 8. Rollback plan

If Vietlott changes quy chế post-ship và C6 exploit disappears:

1. Hot-fix: hide C6 picks (return to null-pick state for Max 3D Pro)
2. Update disclosure banner với "⚠ Rule changed as of YYYY-MM-DD"
3. Research cycle to verify (Chu kỳ 29 "C6 rule-change verification")
4. Demote C6 from Accept → Historical (disclosed trong research archive)

Rollback is ~1h effort if needed.

---

## 9. Commit structure

Single commit with strong message highlighting historic significance:

```
feat(max-3d-pro): ship C6 A=B exploit — first Accept in 28-cycle research history

Chu kỳ 28 validated C6 A=B Max 3D Pro finding at N_RUNS=200 (+3864% ROI
consistent across 4 segments). User externally validated Vietlott quy chế
enforcement 2026-04-24.

Status: SUGGESTIVE-CONFIRMED → Accept. First Accept claim since project
inception.

[... details per RESEARCH_TO_UI_PLAYBOOK.md ...]
```

---

## 10. Open questions (for user review)

1. **Default portfolio size**: 10 tickets (B=100K) OK làm default? Hoặc 1 (conservative)?
2. **Badge emoji**: 🏆 (per convention) hoặc custom (🎯 đậm hơn)?
3. **Disclosure banner tone**: Vietnamese formal hay casual?
4. **`/research` page integration**: prominent "First Accept" callout OK, hay conservative / just mention?
5. **Chu kỳ 24 allocator**: re-run để Max 3D Pro dominates budget feature, OR keep separate (C6 = special case, budget = everyday pick)?
6. **History record**: append to cycle28 OR write new cycle29 "C6 Accept ceremony"? (Latter is more explicit but may be overkill)

---

## 11. Not in scope

- Betting tips for other products post-C6 (no new mechanism found in 26 other methods)
- Real-time Vietlott rule monitoring (manual user responsibility per disclosure)
- Multi-draw strategy (user plays tickets once; doesn't factor multi-session)
- Automated ticket purchase (Vietlott doesn't expose API)

---

## 12. Open for review

Awaiting user answers §10 + approve before execute.

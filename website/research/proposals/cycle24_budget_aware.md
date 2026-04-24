## Chu Kỳ 24 — Pre-Registration: Budget-Aware Ticket Portfolio (UC2)

**Status**: 📝 **DRAFT 2026-04-24** — awaiting user APPROVE before execution. Will be frozen per Principle #16 on approval.

**Mode**: Optimization extension (no new research mechanism — composition layer on top of Chu kỳ 22 picks). See [optimization/README.md Phase 3](../optimization/README.md) + [optimization/PLAYBOOK.md](../optimization/PLAYBOOK.md).

**Supersedes**: original Chu kỳ 23 plan (budget-aware pushed from 23→24 after UX Refactor took the Chu kỳ 23 slot 2026-04-22).

**Estimated effort**: ~1 tuần (CLI tool + UI widget + pre-reg execution).

---

### Canonical goal (pre-registered)

Given user-provided budget **B (VND)**, deliver a **ticket portfolio X = {(strategy, ticket_count_per_strategy)}** per product that (a) costs ≤ B, (b) uses strategies consistent with Chu kỳ 22 + audit corrections, and (c) maximizes a pre-registered composite objective. Output surfaces through UI `/suggest` (enhanced) + optional CLI `vietlott-budget`.

**Not a scientific hypothesis** — this is a composition/allocation optimization. Inherits descriptive-only Accept/Reject stance from Chu kỳ 22.

---

### Context

Post Chu kỳ 22 + Chu kỳ 23:
- 3/5 products have `picks.*` in [cycle22_rankings.json](../optimization/cycle22_rankings.json): Power 6/55 (MinDistance), Power 5/35 (Freq_Hot), Max 3D (diverse 3-pick). 2/5 null (Mega 6/45, Max 3D Pro).
- UI picks surface the strategy. **Gap**: user doesn't know *how many tickets* to buy, or *how to trade off budget between winrate picks vs ROI picks vs Random-diversify*.

Budget-aware feature closes that gap: a single input (VND budget) → concrete bet plan.

**Dependency on Phase A audit** (plans/max3d_pro_backtest_audit.md):
- Nếu audit xác nhận Max 3D Pro ranking không đổi meaningfully sau evaluator fix → Chu kỳ 24 dùng picks hiện tại (max_3d_pro vẫn null → skip từ budget-aware scope).
- Nếu audit làm valid picks xuất hiện cho 3D Pro → Chu kỳ 24 extend scope bao gồm 3D Pro, dùng corrected evaluator.

---

### Hypothesis / Goal (pre-registered)

For each product P with valid `picks.*` (post-audit), and budget B in a pre-registered ladder:

```
X*(P, B) = arg max_{X: cost(X) ≤ B}  composite_budget(P, X, B)
```

where `composite_budget` = weighted sum of backtest-estimated metrics:

| Component | Weight | Definition |
|---|:-:|---|
| E[payout] | 0.35 | Expected total winnings from X across historical forward window |
| P(win ≥ 1 ticket) | 0.25 | Probability ≥1 ticket in X hits any tier (diversification premium) |
| Variance penalty | 0.15 | −1 × std(payout across runs) normalized |
| Coverage | 0.15 | Unique-number fraction of X (avoids near-duplicates) |
| Budget efficiency | 0.10 | 1 − unused_budget / B (favors using budget fully, not over-saving) |

**Weights frozen this pre-reg**. No tuning post-execution.

---

### Scope

**Budget ladder (5 tiers)**:

| Tier | Budget (VND) | Target user |
|---|:-:|---|
| T1 | 10,000 | 1 vé — baseline |
| T2 | 50,000 | 5 vé — casual |
| T3 | 100,000 | 10 vé — regular |
| T4 | 500,000 | 50 vé — heavy |
| T5 | 1,000,000 | 100 vé — enthusiast |

**Products in scope**:
- Power 6/55, Power 5/35, Max 3D (dựa trên Chu kỳ 22 valid picks)
- **Excluded**: Mega 6/45 (null picks, no anchor); Max 3D Pro (null hoặc corrected từ Phase A audit TBD)

**Portfolio strategies** (candidates to compose X from):
- **Pure**: repeat pick strategy N times (with stochastic variation)
- **Mixed**: split budget between `picks.winrate` + `picks.roi` (ratio ∈ {50/50, 70/30, 30/70})
- **Hedged**: X% pick-driven + (100−X)% Random diversification (X ∈ {70, 85, 100})
- **Wheel** (matrix only): MinDistance or coverage-optimized full wheel when N ≥ 20

**Explicitly excluded allocation paradigms**:
- **Kelly concentration** — falsified Chu kỳ 16 (Δ up to −28pp). Principle #17 family-eliminated. **DO NOT propose**.
- **Bayesian posterior portfolio sizing** — falsified Chu kỳ 21. Eliminated family.

---

### Methodology

#### Phase 0 — Power Gate Classification
- Primary metric: composite_budget score (descriptive-only, no significance claim)
- Inherits Chu kỳ 22 exploratory-only classification for all products
- **No Accept/Reject verdicts**. Output is best-portfolio-per-budget table.

#### Phase 1 — Implementation
1. Python allocator `research/optimization/cycle24_allocator.py`:
   - Enumerate portfolio candidates per (product, budget_tier)
   - For each candidate: simulate forward-window (last 100 draws) × N_RUNS=5
   - Compute composite_budget per pre-reg formula
   - Output `cycle24_portfolios.json` — top-3 portfolios per (product, budget)
2. CLI tool `vietlott-budget` (Click, reuses check_rate evaluators):
   - `vietlott-budget --product power_655 --budget 100000`
   - Output: recommended portfolio + expected stats + disclaimer
3. UI widget `/suggest` budget section:
   - Input: slider or preset buttons for budget ladder
   - Output: recommended portfolio breakdown + downloadable CSV compatible với check-rate
4. Integration test: generated portfolio passes into check-rate → ROI numbers align with allocator predictions (within ±10%)

#### Phase 2 — Validation

Post-ship QA:
- All 3 products × 5 budget tiers = 15 recommendations verified
- Composite scores reproducible (seed=42)
- UI generates valid CSV for check-rate

### Retry Tree (Principle #16)

**Tier 1 — Paradigm swap (if composite_budget produces inconsistent recommendations across budget tiers)**:
- R1: Drop composite, switch to pure E[payout] maximization
- R2: Drop composite, switch to pure P(win ≥ 1) maximization

**Tier 2 — Within-paradigm variants (if valid composite but implementation issues)**:
- V1: Increase N_RUNS to 10 (reduce simulation variance)
- V2: Extend forward window to last-200 (more stable E[payout] estimates)
- V3: Add "diversity bonus" explicit term to composite
- V4: Cap per-strategy ticket count at budget/3 (prevent pathological all-in)

Cap **3 retries total** per Principle #16. Failure after retries → ship smaller scope (e.g., only T1–T3 budgets, defer T4–T5).

### Family Check (Principle #17 binding)

- Kelly-family allocation: ❌ ELIMINATED (Chu kỳ 16). Trigger to unbind: N ≥ 2×current AND novel bias dimension discovered.
- Bayesian posterior sizing: ❌ ELIMINATED (Chu kỳ 21). Same unbind trigger.
- Diversity/coverage-based allocation: ✅ OK (underpins Chu kỳ 22 MinDistance pick)
- Wheeling: ✅ OK (Chu kỳ 5 methodology fix validates usage)

This cycle proposes **diversity + wheeling + hedge mixtures** — none in eliminated family.

---

### Decision Rule

**Composite score (frozen pre-reg)** — rank portfolio candidates within (product, budget_tier) by composite_budget. Top-1 = recommended.

**Budget efficiency floor**: reject portfolios using < 80% of budget (exception: T1=10K has only 1 option). Prevents degenerate "buy 1 ticket with 1M budget" outcomes.

**No UI escalation**: all recommendations surface with disclosure — EV âm, portfolio tốt nhất trong null field, không đảm bảo positive ROI. Label taxonomy: "💰 Portfolio T3 (100K)" not "🏆 Khuyến nghị".

---

### Artifacts

- Pre-reg (this file) — frozen on approve
- `research/optimization/cycle24_allocator.py` — computation
- `research/optimization/cycle24_portfolios.json` — canonical output (3 products × 5 budgets × top-3 portfolios)
- `research/optimization/cycle24_review.md` — diagnostic review (if anomalies surface)
- `history/cycle24_budget_aware.md` — closure record on ship
- CLI: `src/vietlott/cli/budget.py` + `vietlott-budget` entry in `pyproject.toml`
- UI: `website/src/components/products/BudgetWidget.tsx` (new) + integration into `/suggest`

---

### Open questions (resolve before freeze)

1. **Max 3D Pro inclusion**: Phase A audit output pending. Default assumption: exclude (null picks stay null). Revisit if audit flips rankings.
2. **Matrix product Mega 6/45**: null picks → no anchor. Option A = exclude from Chu kỳ 24. Option B = allow "Random diversification only" for null-pick products. **Recommendation: Option A** — simpler UX + consistent with Chu kỳ 22 null semantic.
3. **Ticket count minimum for wheel strategies**: current Chu kỳ 22 MinDistance is single-ticket logic ported. For budget T4+ (≥50 tickets), do we keep single-ticket repeat OR auto-swap to full wheel? **Recommendation**: budget ≥ 50 tickets triggers wheel mode if product is matrix. Document in allocator.

---

### Not in scope

- New strategy mechanism proposal (would trigger §9 closure reopen, Chu kỳ 25+ only)
- Modifying Chu kỳ 22 picks output (upstream)
- Running check-rate analytics on real user budgets (privacy)

---

### Approval checklist (for user to confirm before freeze)

- [ ] Goal statement accurate?
- [ ] Budget ladder matches user intent? (10K / 50K / 100K / 500K / 1M VND)
- [ ] Composite weights acceptable? (0.35/0.25/0.15/0.15/0.10)
- [ ] Product scope correct? (Power 6/55, Power 5/35, Max 3D; exclude Mega 6/45 + 3D Pro)
- [ ] Phase A audit result integration path clear?
- [ ] Retry tree + family check satisfactory?
- [ ] Artifact list complete?

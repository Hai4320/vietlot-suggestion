## Chu Kỳ 24 — Pre-Registration: Budget-Aware Ticket Portfolio (UC2)

**Status**: ✅ **APPROVED 2026-04-24** (user decision: single budget B=100K = 10 tickets, all 5 products, composite weights as drafted). Pre-execution scope amendment 2026-04-24 (budget 50K → 100K before any execution started — allowed under Principle #16 since no execution artifact had been produced). Frozen post-amendment; content immutable until execution closes.

**Mode**: Optimization extension (no new research mechanism — composition layer on top of Chu kỳ 22 picks). See [optimization/README.md Phase 3](../optimization/README.md) + [optimization/PLAYBOOK.md](../optimization/PLAYBOOK.md).

**Supersedes**: original Chu kỳ 23 plan (budget-aware pushed from 23→24 after UX Refactor took the Chu kỳ 23 slot 2026-04-22).

**Estimated effort**: ~3-4 ngày (smaller scope than original 1 week — single budget simplifies allocator + UI; offset by adding 2 null-pick products with disclosure policy).

---

### Canonical goal (pre-registered)

Given user-provided budget **B (VND)**, deliver a **ticket portfolio X = {(strategy, ticket_count_per_strategy)}** per product that (a) costs ≤ B, (b) uses strategies consistent with Chu kỳ 22 + audit corrections, and (c) maximizes a pre-registered composite objective. Output surfaces through UI `/suggest` (enhanced) + optional CLI `vietlott-budget`.

**Not a scientific hypothesis** — this is a composition/allocation optimization. Inherits descriptive-only Accept/Reject stance from Chu kỳ 22.

---

### Context

Post Chu kỳ 22 + Chu kỳ 23 + Phase A 3D Pro audit (2026-04-24):
- 3/5 products have valid `picks.*` in [cycle22_rankings.json](../optimization/cycle22_rankings.json): Power 6/55 (MinDistance), Power 5/35 (Freq_Hot), Max 3D (diverse 3-pick).
- 2/5 products null: Mega 6/45 (baseline drift), Max 3D Pro (regime split; confirmed null under corrected 8-tier evaluator per [cycle22_3dpro_audit.md](../optimization/cycle22_3dpro_audit.md)).
- UI picks surface the strategy. **Gap**: user doesn't know *how many tickets* to buy, or *how to trade off budget between winrate picks vs ROI picks vs Random-diversify*.

Budget-aware feature closes that gap: a single input (VND budget) → concrete bet plan.

**User decision 2026-04-24**: all 5 products in scope (including 2 null-pick products). Implication: allocator must handle null-pick products with a disclosed fallback strategy — see §Null-pick policy below.

**Phase A audit resolution**: max_3d_pro rankings DID shift internally (B2 TierWeighted replaces EVMaximizer as top composite under corrected evaluator), but still fails forward gate → picks stays null. Chu kỳ 24 references corrected evaluator when allocating for 3D Pro.

---

### Hypothesis / Goal (pre-registered)

For each product P, at the pre-registered reference budget **B = 100,000 VND** (= 10 tickets @ 10K each):

```
X*(P) = arg max_{X: cost(X) ≤ 100000}  composite_budget(P, X)
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

**Budget (single reference, frozen)**: **100,000 VND = 10 tickets** per product per invocation.

Rationale: user decision 2026-04-24 (initial 50K amended to 100K before execution). Original draft had 5-tier ladder (10K–1M); shrunk to 1 tier for MVP scope. Future Chu kỳ 25+ can extend ladder if needed. Allocator + UI may still accept arbitrary budget input — but only B=100K is pre-registered and verified; other values surface with "experimental" caveat.

**Products in scope (ALL 5)**:

| Product | Chu kỳ 22 picks state | Chu kỳ 24 allocator policy |
|---|:-:|---|
| Power 6/55 | ✓ valid (MinDistance all_three) | Use pick strategies directly |
| Power 5/35 | ✓ valid (Freq_Hot all_three) | Use pick strategies directly |
| Max 3D | ✓ valid (3-pick diverse) | Use pick strategies directly |
| Mega 6/45 | ✗ null (baseline drift) | Null-pick policy (see §Null-pick policy) |
| Max 3D Pro | ✗ null (regime split, confirmed under corrected evaluator) | Null-pick policy (see §Null-pick policy) |

**Portfolio strategies** (candidates to compose X from, with 10-ticket budget constraint):
- **Pure**: repeat one pick strategy 10 times (with stochastic seed variation per ticket)
- **Mixed**: split 10 tickets between `picks.winrate` + `picks.roi` (ratios: 5:5, 7:3, 3:7, 6:4, 4:6)
- **Hedged**: k tickets pick-driven + (10−k) tickets Random diversification (k ∈ {7, 8, 9, 10})
- **Wheel** (matrix only): MinDistance-style 10-ticket spread maximizing pairwise Hamming distance

**Explicitly excluded allocation paradigms**:
- **Kelly concentration** — falsified Chu kỳ 16 (Δ up to −28pp). Principle #17 family-eliminated. **DO NOT propose**.
- **Bayesian posterior portfolio sizing** — falsified Chu kỳ 21. Eliminated family.

---

### Null-pick policy (Mega 6/45 + Max 3D Pro)

User decision 2026-04-24: both null-pick products included in Chu kỳ 24 scope. Allocator must still produce a portfolio recommendation for each.

**Principle**: honesty-first — portfolio draws from best-composite strategy from rankings **regardless of split-half/forward verdict**, but UI disclosure explicitly flags that product has no verified edge.

**Strategy source per null-pick product**:

| Product | Source | Strategy fallback |
|---|---|---|
| Mega 6/45 | cycle22_rankings.json top-composite by Balanced profile | Whatever ranks #1 under Balanced weights (ignoring split-half failure) |
| Max 3D Pro | cycle22_backtest_3dpro_corrected.json top-composite by Balanced profile | Under corrected evaluator: B2 TierWeighted (#1 ROI/Balanced), D1 EVMaximizer (#1 WinRate). Use Balanced → B2 TierWeighted. |

**Disclosure policy**:
- UI label: `⚠ Không có edge xác nhận` (not 🎯/💰/⚖ pick badges)
- Tooltip/expandable: "Sản phẩm này không có strategy nào vượt qua split-half + forward verify. Portfolio dưới đây dựa trên top-composite strategy trong null field, chỉ mang tính tham khảo."
- CSV export: include `caveat: "no_verified_edge"` column
- Không fallback sang Random — phá logic Chu kỳ 22 null semantic. Random sẵn có làm baseline nhưng không surface làm recommendation.

**If user disables disclosure (future opt-out)**: still emit portfolio but with reduced font-size warning. Không được hide.

### Methodology

#### Phase 0 — Power Gate Classification
- Primary metric: composite_budget score (descriptive-only, no significance claim)
- Inherits Chu kỳ 22 exploratory-only classification for all products
- **No Accept/Reject verdicts**. Output is best-portfolio-per-product table at B=100K.

#### Phase 1 — Implementation
1. Python allocator `research/optimization/cycle24_allocator.py`:
   - Enumerate portfolio candidates per product (Pure / Mixed / Hedged / Wheel variants)
   - For each candidate: simulate forward-window (last 100 draws) × N_RUNS=5 at B=100K (10 tickets)
   - For null-pick products (Mega 6/45, Max 3D Pro): source strategy from top-composite Balanced profile ranking (ignore split-half failure)
   - For Max 3D Pro: use corrected backtest data from `cycle22_backtest_3dpro_corrected.json` (not legacy `cycle22_backtest_3d.json`)
   - Compute composite_budget per pre-reg formula
   - Output `cycle24_portfolios.json` — top-3 portfolios per product × 5 products = 15 recommendations
2. CLI tool `vietlott-budget` (Click, reuses check_rate evaluators):
   - `vietlott-budget --product power_655`  (budget implicitly 100K)
   - Flag `--budget N` to experiment with non-100K values (clearly marked non-canonical)
   - Output: recommended portfolio + expected stats + disclaimer (+ null-pick caveat if applicable)
3. UI widget `/suggest` budget section:
   - Input: 100K budget displayed prominently; optional "custom budget" expander
   - Output: recommended portfolio breakdown + downloadable CSV compatible với check-rate
   - Null-pick products: disclosure banner above portfolio
4. Integration test: generated portfolio at B=100K passes into check-rate → ROI numbers align với allocator predictions (within ±10% tolerance, accounting for simulation variance)

#### Phase 2 — Validation

Post-ship QA:
- All 5 products × 1 budget (100K) = 5 recommendations verified
- Composite scores reproducible (seed=42)
- UI generates valid CSV for check-rate
- Null-pick products surface with proper disclosure banner (automated UI check)

### Retry Tree (Principle #16)

**Tier 1 — Paradigm swap (if composite_budget produces pathological recommendations for ≥2 products)**:
- R1: Drop composite, switch to pure E[payout] maximization
- R2: Drop composite, switch to pure P(win ≥ 1) maximization

**Tier 2 — Within-paradigm variants (if valid composite but implementation issues)**:
- V1: Increase N_RUNS to 10 (reduce simulation variance)
- V2: Extend forward window to last-200 (more stable E[payout] estimates)
- V3: Add "diversity bonus" explicit term to composite
- V4: Cap per-strategy ticket count at 3/5 (prevent pathological all-in)

Cap **3 retries total** per Principle #16. Failure after retries → ship smaller scope (e.g., only 3 valid-pick products, defer null-pick products to Chu kỳ 25+ with updated policy).

### Family Check (Principle #17 binding)

- Kelly-family allocation: ❌ ELIMINATED (Chu kỳ 16). Trigger to unbind: N ≥ 2×current AND novel bias dimension discovered.
- Bayesian posterior sizing: ❌ ELIMINATED (Chu kỳ 21). Same unbind trigger.
- Diversity/coverage-based allocation: ✅ OK (underpins Chu kỳ 22 MinDistance pick)
- Wheeling: ✅ OK (Chu kỳ 5 methodology fix validates usage)

This cycle proposes **diversity + wheeling + hedge mixtures** — none in eliminated family.

---

### Decision Rule

**Composite score (frozen pre-reg)** — rank portfolio candidates per product by composite_budget at B=100K. Top-1 = recommended.

**Budget efficiency floor**: at B=100K with per-ticket cost 10K, only 10-ticket portfolios qualify. Portfolios using <10 tickets (e.g., 7-ticket saving 30K) rejected unless variance_penalty justifies (≥10% composite improvement vs full 10-ticket equivalent). Prevents degenerate "save most of budget" outcomes while allowing legitimate risk-off picks.

**No UI escalation**: all recommendations surface with disclosure — EV âm, portfolio tốt nhất trong null field, không đảm bảo positive ROI. Label taxonomy: `💰 Portfolio 100K` (valid-pick products) / `⚠ Không có edge xác nhận` (null-pick products). Never "🏆 Khuyến nghị".

---

### Artifacts

- Pre-reg (this file, at `proposals/` root) — APPROVED, moves to `proposals/executed/` on ship
- `research/optimization/cycle24_allocator.py` — computation
- `research/optimization/cycle24_portfolios.json` — canonical output (5 products × top-3 portfolios @ B=100K)
- `research/optimization/cycle24_review.md` — diagnostic review (if anomalies surface)
- `history/cycle24_budget_aware.md` — closure record on ship
- CLI: `src/vietlott/cli/budget.py` + `vietlott-budget` entry in `pyproject.toml`
- UI: `website/src/components/products/BudgetWidget.tsx` (new) + integration into `/suggest`

---

### User decisions (resolved 2026-04-24, frozen)

| Item | Resolution |
|---|---|
| Budget ladder | **Single tier B = 100K (10 tickets)**. No ladder in Chu kỳ 24 scope. Amended from initial 50K during pre-execution (2026-04-24) — no allocator run had been produced yet, so amendment doesn't break Principle #16 frozen-after-execute semantic. Optional UI custom-budget expander, but only 100K is canonical. |
| Composite weights | **As drafted**: 0.35/0.25/0.15/0.15/0.10 (E[payout]/P(win≥1)/variance_penalty/coverage/budget_eff) |
| Product scope | **All 5 products** incl. Mega 6/45 + Max 3D Pro (null-pick policy applies to 2 null products) |
| Phase A audit integration | **Use corrected evaluator** for 3D Pro (from [cycle22_3dpro_audit.md](../../optimization/cycle22_3dpro_audit.md)); do not overwrite cycle22_rankings.json |
| Retry tree + family check | As drafted, satisfactory |
| Wheel trigger threshold | At B=100K there are 10 tickets → wheel mode auto-engaged for matrix products (MinDistance-style 10-ticket spread). No threshold decision needed in Chu kỳ 24. |

---

### Not in scope

- New strategy mechanism proposal (would trigger §9 closure reopen, Chu kỳ 25+ only)
- Modifying Chu kỳ 22 picks output (upstream)
- Running check-rate analytics on real user budgets (privacy)
- Budget ladder beyond 100K (ladder extension = Chu kỳ 25+ scope if demanded)

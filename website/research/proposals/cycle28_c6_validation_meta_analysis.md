## Chu Kỳ 28 — Pre-Registration: C6 A=B Validation + Meta-Analysis + Novel Hybrids

**Status**: ✅ **APPROVED 2026-04-24** (user "Next"). Frozen per Principle #16.

**Mode**: Optimization validation + meta-analysis. HIGHEST STAKES cycle (potential first Accept claim in project history).

**Parent cycles**: [cycle27](./executed/cycle27_tier3_compounding_calendar.md) (C6 A=B SUGGESTIVE) + [cycle25/26](./executed/) (Inconclusives).

**Estimated effort**: ~4h.

---

### Canonical goal (pre-registered)

Validate the Chu kỳ 27 C6 A=B Max 3D Pro SUGGESTIVE finding (+4758% ROI) at tighter CI (N_RUNS=200). Retest prior Inconclusives. Generate novel hybrid methods from dimensional gaps. Write meta-analysis across Chu kỳ 22-27.

**Not a mechanism hypothesis** — validation of a known-mechanism betting structure exploit.

---

### Context

Chu kỳ 27 HEADLINE: C6 A=B Max 3D Pro random X = **ROI +4758% ± variance across 4 segments**, forward-gate PASS, 0% ruin B=1M. Theoretical EV = +4180% matches observed. Mechanism: Vietlott quy chế A=B doubling rule.

**Status post-27**: SUGGESTIVE, not Accept. Principle #14 flag fired + resolved via EV math, but standard Replication gates need:
- N_RUNS=200 (was 20 in C27 → reduce variance CI)
- External real-world validation (cannot do in-framework — requires user ticket purchase)

---

### Hypothesis / Goal

**H1**: C6 A=B Max 3D Pro ROI CI at N_RUNS=200 contains +4180% theoretical EV and bounds exclude 0.

**H2**: Inconclusive candidates from Chu kỳ 25-26 either (a) confirm at tighter CI → upgrade Suggestive, or (b) regress to variance → confirm Inconclusive.

**H3**: Novel hybrid methods (C6 × bet-size variations) maintain or improve on C6 base.

---

### Scope

#### Phase 28.1 — C6 validation

Run C6_ab_random and C6_ab_tierweighted at **N_RUNS=200** (10× the Chu kỳ 27 runs).

Expected: tighter CI around +4200%. If 95% CI excludes 0 → Suggestive confirmed. If CI straddles 0 → demote to Inconclusive.

Output segments: full + half1 + half2 + forward (same as Chu kỳ 27).

#### Phase 28.2 — Inconclusive retests at N_RUNS=200

Retest candidates flagged in Chu kỳ 25-26:

| Method | Product | Chu kỳ | Prior Δ vs Random |
|---|---|:-:|:-:|
| F7 K=50 escape | Power 5/35 | 25 | +10.8pp |
| F1b so gan 3D (FreqWholeCold persistence) | Max 3D | 25 | +284% full (variance) |
| C5 forward+reverse hedge | Max 3D Pro | 26 | +34.5pp full, forward fail |
| E_K=7 weekly | Power 6/45 | 27 | +25pp |

#### Phase 28.3 — Novel hybrid discovery

New method specs from dimensional gaps:

| ID | Method | Rationale |
|:-:|---|---|
| H1 | C6 A=B × portfolio N=10 (budget 100K) | Test cost-scaled C6 exploit |
| H2 | C6 A=B × Martingale cap8 | Compound winning A=B bets |
| H3 | C6 A=B × permutation_all (single) | Can we get both A=B doubling + permutation coverage? No — mutually exclusive. Skip. |
| H4 | C6 A=B × Hedged (9 A=B + 1 Random) | Compare vs pure C6 |
| H5 | N=2 parallel A=B (X1=X1, X2=X2 different numbers) | Spread exposure |

#### Phase 28.4 — Meta-analysis review doc

`cycle28_meta_analysis.md`:
- Cross-cycle synthesis: 22-27 summary table
- C6 validation verdict (with external-validation checklist)
- Chu kỳ 25-26 Inconclusives disposition
- Novel hybrid winners/losers
- Recommendations cho user: validation steps + potential UI actions
- Principle #12 power analysis for C6

---

### Methodology

**N_RUNS=200 for critical methods** — 10× Chu kỳ 27. Compute budget ~5-10× longer per method.

**Framework inherits Chu kỳ 25-27** — no extensions needed.

**Composite weights unchanged** from Chu kỳ 25.

---

### Decision Rule

For C6 A=B:
- 95% CI on ROI >> 0 AND consistent across 4 segments AND theoretical EV matches → **Upgrade to Suggestive-confirmed** (pending external validation)
- CI borderline or inconsistent → **Keep as Suggestive with caveats**
- If replication fails → **Demote to Inconclusive** + investigate discrepancy

For novel hybrids:
- Must beat pure C6 by ≥3pp to qualify as improvement
- Otherwise pure C6 random remains the recommended form

**NO Accept claim this cycle**. Accept requires external Vietlott validation (user action).

---

### Family Check (Principle #17)

- C6 replication + novel hybrids: bet-structure variants, not new mechanism family → pass
- Retests of F/E methods: already tested families → pass

All pass.

---

### Retry Tree (Principle #16)

**Tier 1 paradigm swap**:
- R1: If C6 N_RUNS=200 shows inconsistency across segments → demote to Inconclusive, do NOT upgrade
- R2: If F1b outlier re-appears at N=200 → reasonable evidence of real signal

**Tier 2 within-paradigm**:
- V1: Increase to N_RUNS=500 if CI still too wide
- V2: Test C6 on power_535 for negative control (expected: no edge since no A=B doubling rule in quy chế 5/35)

Cap 3 retries.

---

### Real-world validation workflow (USER ACTION REQUIRED)

Framework can VALIDATE simulation correctness + statistical robustness. CANNOT validate real Vietlott payout. User must:

1. **Purchase 1-3 test tickets**: A=B pair with X ∈ hot-tier numbers (e.g., X=007 if it's historically in Nhất)
2. **Wait for drawing** + record outcome
3. **If X in Nhất of that drawing**: verify Vietlott payout = 60M VND (doubled) — confirms quy chế enforcement
4. **Vietlott UI check**: confirm that bet interface allows typing same number twice in both A and B slots
5. **Rule change monitoring**: subscribe Vietlott quy chế updates; if rule changes, C6 exploit may disappear

If all 4 pass → Accept claim becomes actionable via UI surfacing + user disclosure.

---

### Artifacts

- Pre-reg (this file) — frozen, moves to `executed/` on close
- `cycle28_methods/*.json` — retest specs + novel hybrid specs
- `cycle28_results.json` — canonical output at N_RUNS=200
- `cycle28_meta_analysis.md` — cross-cycle synthesis + C6 validation report
- `history/cycle28_*.md` — closure record
- Updated [BETTING_METHODS_CATALOG.md](../../BETTING_METHODS_CATALOG.md) + PROJECT_CLOSURE_REPORT (if C6 warrants)

---

### NOT in scope (explicit)

- External real-world ticket purchase trial (requires user action)
- Vietlott UI feasibility check (requires user action)
- Accept claim without external validation
- Deferred 3D methods (C4, B8, B9) — still deferred

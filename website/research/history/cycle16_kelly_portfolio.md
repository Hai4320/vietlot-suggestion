## Chu Kỳ 16 — Pre-Registration: Kelly-optimal Multi-ticket Portfolio (Path #2) — ROI-axis Pivot (04/2026)

### Context

Chu kỳ 14 + 15 6/6 + 5/6 Reject eliminated win-rate paths on matrix (Path #1 Online Bayesian drift falsified; Path #3 Cross-product pool shared-RNG falsified). Project-wide ~55 strategies × 5 products × 3-gate = **0 robust Accept/Suggestive**. Win-rate axis fully exhausted at current data horizon.

**Mandatory pivot per BREAKTHROUGH_ROADMAP Priority Matrix post-Chu kỳ 15**: Path #2 Kelly-optimal Multi-ticket Portfolio, ROI-axis primary. Mechanism paradigm khác (portfolio theory vs probability estimation) — có thể extract value từ existing weak bias ngay cả khi không có win-rate edge. Untested family.

### Paradigm shift

| Axis | Before Chu kỳ 16 | From Chu kỳ 16 |
|------|------------------|----------------|
| Primary metric | `win_rate_ge3` (single-ticket) | `pooled_ROI_pct` (multi-ticket portfolio) |
| Decision gate | 3-gate on win_rate proportion | 3-gate on `p_any_hit_ge3_pct` (ROI proxy — tier-3+ drives revenue) |
| Secondary | ROI descriptive | `p_any_hit_ge3`, Sharpe, single-ticket Δ descriptive |
| Comparison | vs Random (1-ticket) | vs **RandomN** (N independent random tickets) |
| Tournament weights | 0.40 / 0.30 / 0.15 / 0.15 | unchanged (immutable §8.2) — but Kelly expected to dominate ROI z-score axis |

Vẫn giữ primary goal "future win rate" ở tournament weight 0.40, nhưng mechanism Kelly directly optimize ROI (0.30) — expected tournament winner trên ROI dimension even if win-rate tie.

### Hypothesis (pre-registered)

**Core claim**: Kelly-weighted multi-ticket portfolio beat uniform `RandomN` trên `p_any_hit_ge3_pct` (proxy for ROI sign) across 3 matrix products, driven bởi Bayesian posterior concentration on historically-biased numbers.

**Null hypothesis (H0 — a priori plausible post-Chu kỳ 14/15)**:
- Bias near-null + independence across tickets → Kelly selection ≈ random selection → no improvement
- Diversity constraint could hurt if it prevents concentration on truly hot numbers

**Alternative (H1)**:
- Posterior-weighted ticket scoring extracts latent bias value → Δ vs RandomN > 0 nominally significant

**K=3 new variants × 3 products = 9 hypothesis cells**:

| # | Hypothesis | Strategy | Product |
|:-:|-----------|----------|---------|
| H1-H3 | hot-weighted + diversity beats RandomN | `KellyPortfolio_Hot_H3` | Mega / Power / Lotto |
| H4-H6 | hot-weighted no diversity beats RandomN | `KellyPortfolio_Plain` | Mega / Power / Lotto |
| H7-H9 | **anti-hot-weighted sanity check** (expected to perform worse or equal) | `KellyPortfolio_AntiHot_H3` | Mega / Power / Lotto |

**AntiHot sanity rationale**: if mechanism real (hot bias exploitable), `Hot_H3` should beat `AntiHot_H3` consistently. If AntiHot ~ Hot performance, mechanism is null — both are just doing noise-level selection. Meaningful negative control, đã validated trong Chu kỳ 4 (EV maximizer direction test).

Bonferroni K=3 per product → α_strict = 0.0167.

### Mechanism spec (fixed, immutable post-implementation)

**Core Kelly-inspired selection** (pragmatic simplification of full MC Kelly):

```
For target product P with range [1, N_P] and num_count K_P:
  1. Compute Bayesian posterior mean θ from lookback_days=365:
       alpha[i] = prior_strength + count(i in last 365d)
       θ[i] = alpha[i] / sum(alpha)

  2. Generate candidate pool:
       top_M = top-15 numbers by θ (hot numbers)
       candidates = all C(15, K_P) combinations of top_M
         Mega 6/45 K=6 → C(15,6) = 5005
         Power 6/55 K=6 → C(15,6) = 5005
         Lotto 5/35 K=5 → C(15,5) = 3003

  3. Score each candidate ticket t:
       score(t) = sum(θ[i] for i in t)       # Kelly-proxy: higher θ → higher expected match

  4. Select N=20 tickets by Kelly greedy (+ optional diversity):
       sort candidates by score descending
       Variant A (Hot_H3): pick top-20 subject to pairwise Hamming distance ≥ 3
       Variant B (Plain):  pick top-20 no diversity constraint
```

**Why this is a pragmatic "Kelly-proxy", not full Kelly**:

Full Kelly requires E[log(1 + return_per_ticket)] computed via Monte Carlo over many simulated draws from θ. That's 10,000 candidates × 1,000 MC samples per prediction × 1,200 predictions × 5 runs × 3 products ≈ 180B ops, weeks of compute.

Pragmatic proxy: `score(t) = Σθ` captures "ticket weighted toward hot numbers has higher expected match" — Kelly's spirit without the compute. This is a **necessary simplification** acknowledged upfront (R2 per §1.1). If Accept, full Kelly backtest could be follow-up audit (per Chu kỳ 12.5 precedent).

**Variant A diversity rationale**: Hamming≥3 between selected tickets prevents 20 near-identical picks. Without it, top-20 by score could collapse to variants of "top-K hottest" which offer no portfolio benefit. With it, tickets span different hot-number combinations → genuine portfolio diversification.

**Portfolio size N=20 (fixed this cycle)**: matches HybridParityDiv reference from Chu kỳ 5. Practical scale for real users.

### Future feature note (post-Accept)

User (project owner, 2026-04-21) đã chỉ định: mong muốn phát triển tính năng UI **"tạo bộ N vé với ROI tốt nhất trên số tiền bỏ ra"** — tức budget-aware optimal-N selection. Hiện tại Chu kỳ 16 fix N=20 để test mechanism; future feature sẽ:

1. Cho user input: budget (VND) hoặc N (số vé).
2. Compute Kelly fraction per ticket (proper MC Kelly nếu mechanism Accept; proxy otherwise).
3. Select optimal N* tickets where marginal ticket Kelly ≥ threshold (không bet beyond Kelly positive-EV candidates).
4. Output: N* selected tickets + expected pooled ROI + Kelly-optimal budget.

Design Chu kỳ 16 structures code cho future extensibility:
- Strategies accept `N` tham số rõ ràng via `predict_n(n)` (existing MultiTicketStrategy interface)
- Score function separable → có thể reuse cho Kelly-fraction computation
- Candidate pool generation + score + select là 3 bước độc lập → replace select step với Kelly-fraction-based cutoff sau này

**KHÔNG implement variable-N Chu kỳ 16** — scope tight, test mechanism first. Variable-N = Chu kỳ 16.5 audit-style follow-up nếu Accept.

### Strategies to run (7 total, fewer than win-rate cycles because multi-ticket infra more expensive)

| Strategy | Role | Parameters (immutable pre-reg) |
|----------|------|--------------------------------|
| `RandomN` | **Mandatory baseline** — N independent uniform tickets | N=20 |
| `MinDistanceWheel` | Existing multi-ticket ref (Chu kỳ 5) | N=20, lookback=365, candidates=50, α=1.0 |
| `HybridParityDiv` | Existing multi-ticket ref — Lotto 5/35 only (Chu kỳ 5 Reject but kept for continuity) | N=20 |
| `PatternN` | Baseline extension (single-ticket Pattern × N independent) | N=20, lookback=180 |
| `HotN` | Hot-numbers-only single-ticket × N | N=20, lookback=365 — isolates "just pick hot" vs Kelly selection |
| **`KellyPortfolio_Hot_H3`** | **New #1** | top_M=15, N=20, Hamming≥3, lookback=365, prior=1.0 |
| **`KellyPortfolio_Plain`** | **New #2** | top_M=15, N=20, no diversity, lookback=365, prior=1.0 |
| **`KellyPortfolio_AntiHot_H3`** | **New #3 — sanity check** | top_M=15 COLDEST, N=20, Hamming≥3, lookback=365, prior=1.0 |

Note: `HybridParityDiv` is Lotto-specific (parity stratification calibrated for 5/35 structure). For Mega/Power, substitute with `MinDistanceWheel` again or omit. Pre-reg: if tournament requires ≥7 strategies per product per §8.4, add a variant ref.

### Products & data splits (same as Chu kỳ 15)

| Product | N draws | Midpoint | Forward | Ticket price | Max prize |
|---------|:-:|:-:|:-:|:-:|:-:|
| Power 6/55 | 1334 | 667 | last 100 | 10,000 VND | 30B (jackpot) |
| Mega 6/45 | 1302 | 651 | last 100 | 10,000 VND | 12B |
| Lotto 5/35 | 543 | 271 | last 100 | 10,000 VND | 6B |

### Backtest params

- `min_history=100`, `n_runs=5`, `seed=42` (same as Chu kỳ 14/15)
- `n_tickets_per_draw=20` (portfolio size fixed pre-reg)
- Bonferroni K=3 per product → α_strict = 0.0167
- 3 gates: full + split-half + forward_last_100

### Primary gate metric: `p_any_hit_ge3_pct`

Rationale: for multi-ticket portfolio, `P(any ticket hits ≥3)` is the proxy for ROI sign — tier-3+ hits drive essentially all revenue (tier-0/1/2 returns fixed 0 VND on Vietlott). Using proportion gate per Chu kỳ 5 wheeling convention.

**Secondary reported (no gate)**: `pooled_ROI_pct`, `mean_best_match`, Sharpe, tier histogram.

### Decision rule (binding)

Same 3-gate stacked rule as Chu kỳ 5/11/13/14/15 với α_strict=0.0167:

| Full (p_any≥3) | Split | Forward | Overall |
|:-:|:-:|:-:|:-:|
| p < 0.0167 + CI_lo > 0 | both Δ > 0 + both p < 0.0167 | Δ > 0 | **Accept** |
| p < 0.0167 | both Δ > 0 + both p < 0.05 | Δ > 0 | **Suggestive** |
| p < 0.05 | direction-consistent, 1 half p ≥ 0.05 | Δ > 0 | **Inconclusive** |
| Δ ≤ 0 at any gate | — | — | **Reject** |
| Direction flip split (d1 × d2 ≤ 0) | — | — | **Reject** |

**Additional ROI condition** (binding for Accept only): `pooled_ROI_pct > RandomN.pooled_ROI_pct` on full-sample required for "Accept" decision. If `p_any≥3` passes 3-gate but ROI worse than RandomN → downgrade to **Suggestive** (win-rate evidence only, no ROI benefit = mechanism not delivering ROI goal).

### Principle #14 magnitude sanity (multi-ticket adaptation)

Matrix multi-ticket N=20 at baseline ≈ 40-55% `p_any_hit_ge3`. Natural variance at n=1200 draws: SE ≈ √(0.5·0.5/1200) ≈ 1.4pp. Sensible bias ceiling:
- Matrix multi-ticket ceiling estimate: **+5pp** on `p_any_hit_ge3_pct` (rough — conservative given noise floor)
- 3× threshold = **+15pp auto-flag**

Any Kelly variant showing Δ > +15pp → Ship-with-caveats pending audit (per Chu kỳ 12 GBM precedent). Highly unlikely at matrix scale but binding.

### Principle #15 concentration

Kelly top-20 by score với diversity constraint → inherently diverse across candidates. Should satisfy n_unique_predictions / total ≥ 0.30 easily (20 distinct tickets per draw). Not a concern.

### Power analysis (Principle #12)

- `p_any_hit_ge3` baseline `RandomN(20)`: ≈ 1 - (1-p_single_ge3)^20. Mega p_single_ge3 = 2.4% → `p_any≥3` baseline ≈ 38.5%. Power 6/55 ≈ 22.4%. Lotto 5/35 ≈ 27.5%.
- At Δ = +3pp (realistic for Kelly mechanism if works), α=0.025 Bonf, 80% power: n_required ≈ 3,000 draws/segment.
- Full-sample n: Mega 6,010 trials (sufficient), Power 6,170 (sufficient), Lotto 2,215 (underpowered ~70%).
- Halves: all 3 products underpowered (1,500-3,300 trials).
- Forward_last_100 × 5 runs = 500 trials: severely underpowered (<20% power). Directional signal only.

**Limitation acknowledged**: Halves + forward underpowered, consistent với all prior cycles. Decision rule designed around this (forward directional only, not strict p<0.05).

### Tournament composite (§8.2, immutable weights)

Same 4-metric composite as Chu kỳ 14/15: `0.40·z(Δ_win) + 0.30·z(Δ_ROI) + 0.15·z(Sharpe) + 0.15·z(−log10 p)`.

Kelly expected to dominate `z(Δ_ROI)` if mechanism works — that's the test. Note weight on `Δ_win` still 0.40 (primary goal immutable); Kelly might lose composite to e.g. OnlineBayes_λ0.01 if Kelly's ROI boost doesn't offset win-rate parity.

For multi-ticket, `Δ_win` = Δ on `p_any_hit_ge3_pct` (instead of win_rate_ge3 single-ticket).

### Artifacts kỳ vọng

- `website/research/matrix/kelly_portfolio.py` — 3 strategy classes: `HotN`, `KellyPortfolio_Hot_H3`, `KellyPortfolio_Plain` + shared helpers
- `website/research/matrix/cycle16_kelly_portfolio_backtest.py` — 3-gate harness (generalize `walk_forward_multi` pattern from wheeling_backtest.py to 3 products)
- `website/research/matrix/cycle16_kelly_portfolio_results.json` — per §4 schema + multi-ticket fields
- Section "Chu Kỳ 16 — Result" append vào file này

### Follow-up (conditional)

- **Accept (≥1 cell, 3-gate + ROI>RandomN)**: first project-wide robust Accept. Consider for multi-ticket UI feature (new addition to matrix product pages — N-ticket "smart bet" option). Replication cycle mandatory on data extension.
- **Suggestive**: document; consider experimental UI feature với "🔬 Directional" badge.
- **6/6 Reject**: Path #2 Kelly eliminated. **Win-rate AND ROI both exhausted** across all tested mechanisms. Chu Kỳ 17 options:
  - **Option X — Path #5 Copula matrix** (long-shot win-rate, deprioritized)
  - **Option Y — Formal 3D revisit** (close project with final audit)
  - **Option Z — Stop research, focus UI/UX polish + data accumulation** (project-level closure)

### Guardrails

- K=3 hyperparameter variants pre-fixed (Hot_H3 + Plain + AntiHot_H3); NO post-hoc top_M tuning
- NO Monte Carlo full Kelly implementation unless Accept triggers audit
- Principle #14 binding — |Δ| > +15pp auto-flag
- ROI condition binding on Accept only (not on Suggestive)
- Pre-reg immutable sau implementation begins

---

*Pre-registered: 2026-04-21 — Chu Kỳ 16 Path #2 Kelly Portfolio. User approved, backtest executed cùng ngày.*

### Result — Chu Kỳ 16 (2026-04-21, cùng ngày pre-registration)

**Verdict: 9/9 Reject với dramatic NEGATIVE Δ.** Kelly-style concentration fundamentally **MISMATCHES** set-coverage lottery structure. ROI-axis also confirmed null at Kelly-proxy mechanism. Both win-rate + ROI axes now fully exhausted across all tested mechanisms.

Raw results: [`../matrix/cycle16_kelly_portfolio_results.json`](../matrix/cycle16_kelly_portfolio_results.json). Run log: [`../matrix/cycle16_kelly_portfolio_output.log`](../matrix/cycle16_kelly_portfolio_output.log). Total runtime 1448s (≈24 min, slower than cycles 14/15 do PatternN nested logic + multi-ticket 20× overhead).

#### Result matrix (9 cells, p values essentially 0 against RandomN)

| # | Strategy | Product | Full Δ_p_any≥3 (p) | ROI vs RandomN | **Overall** |
|:-:|----------|---------|:-:|:-:|:-:|
| H1 | Kelly_Hot_H3 | Mega 6/45 | **−15.66pp** (0.0000) | ROI ✗ (−90.9% vs −87.6%) | **Reject** |
| H2 | Kelly_Hot_H3 | Power 6/55 | **−10.05pp** (0.0000) | ROI ✗ (−94.9% vs −94.3%) | **Reject** |
| H3 | Kelly_Hot_H3 | Lotto 5/35 | **−6.05pp** (0.0000) | ROI ✓ (−89.9% vs −91.8%) | **Reject** (win-rate crash) |
| H4 | Kelly_Hot_Plain | Mega 6/45 | **−28.05pp** (0.0000) | ROI ✗ | **Reject** |
| H5 | Kelly_Hot_Plain | Power 6/55 | **−17.59pp** (0.0000) | ROI ✗ | **Reject** |
| H6 | Kelly_Hot_Plain | Lotto 5/35 | **−14.63pp** (0.0000) | ROI ✗ | **Reject** |
| H7 | Kelly_AntiHot_H3 | Mega 6/45 | **−18.90pp** (0.0000) | ROI ✗ | **Reject** |
| H8 | Kelly_AntiHot_H3 | Power 6/55 | **−8.75pp** (0.0000) | ROI ✗ | **Reject** |
| H9 | Kelly_AntiHot_H3 | Lotto 5/35 | **−3.57pp** (0.0047) | ROI ✓ (−89.9%) | **Reject** (win-rate loss) |

**All Kelly variants significantly WORSE than RandomN, nhiều variants >3× magnitude flag threshold** (|Δ|>15pp). Negative direction so Principle #14 auto-flag ngữ nghĩa "implausible overfit" không apply — đây là rejection of mechanism, không phải hidden positive edge.

#### Per-product detail (full-sample)

**Mega 6/45** (N=1302, 6,010 trials):

| Strategy | p_any≥3 | best̄ | ROI | Δ vs RandomN |
|----------|:-:|:-:|:-:|:-:|
| RandomN | 38.02% | 2.39 | −87.6% | — |
| PatternN | 37.44% | 2.37 | −88.3% | −0.57pp |
| HotN | 37.89% | 2.38 | −87.0% | −0.13pp |
| Kelly_Hot_H3 | **22.36%** | 1.82 | −90.9% | −15.66pp |
| Kelly_Hot_Plain | **9.97%** | 1.40 | −90.8% | −28.05pp |
| Kelly_AntiHot_H3 | **19.12%** | 1.79 | −90.8% | −18.90pp |

**Power 6/55** (N=1334, 6,170 trials):

| Strategy | p_any≥3 | ROI | Δ vs RandomN |
|----------|:-:|:-:|:-:|
| RandomN | 23.42% | −94.3% | — |
| PatternN | 22.79% | −93.0% | −0.63pp |
| HotN | 23.26% | −94.2% | −0.16pp |
| Kelly_Hot_H3 | **13.37%** | −94.9% | −10.05pp |
| Kelly_Hot_Plain | **5.83%** | −95.2% | −17.59pp |
| Kelly_AntiHot_H3 | **14.66%** | −94.4% | −8.75pp |

**Lotto 5/35** (N=543, 2,215 trials):

| Strategy | p_any≥3 | ROI | Δ vs RandomN |
|----------|:-:|:-:|:-:|
| RandomN | 23.57% | −91.8% | — |
| PatternN | 23.70% | ≈−90% | +0.13pp |
| HotN | 23.16% | −91.0% | −0.41pp |
| Kelly_Hot_H3 | **17.52%** | −89.9% | −6.05pp |
| Kelly_Hot_Plain | **8.94%** | −92.4% | −14.63pp |
| Kelly_AntiHot_H3 | **20.00%** | −89.9% | −3.57pp |

#### Tournament composite (§8.2, full-sample)

**Mega 6/45** top-3: HotN (+0.77), RandomN (+0.67), PatternN (+0.52). Kelly variants at bottom (negative composite).

**Power 6/55** top-3: PatternN (+1.08 — driven by +1.33pp ROI boost on rare jackpot hit), HotN, RandomN. Kelly variants bottom.

**Lotto 5/35** top-3: **Kelly_Hot_H3 (+0.45)**, **Kelly_AntiHot_H3 (+0.39)**, HotN (+0.24). Kelly variants technically tournament top on Lotto **despite losing win-rate by 3-6pp** — driven by marginal ROI improvement (−89.9% vs −91.8%) on z-normalized ROI axis. Composite tournament gaming artifact: với 9 strategies tight clustering trên ROI, z-score amplifies small differences. **Does NOT indicate mechanism success** — tournament top-1 alone không đủ per 3-gate protocol (Principle #13/14 binding → both Reject on gate 1).

#### Principle #14 magnitude check

| Cell | |Δ| | Vs threshold | Direction | Interpretation |
|------|:-:|:-:|:-:|----------------|
| Mega Hot_H3 | 15.66pp | >15pp threshold | NEGATIVE | Mechanism rejection, not overfit flag |
| Mega Hot_Plain | 28.05pp | 1.9× threshold | NEGATIVE | Dramatic mechanism failure |
| Mega AntiHot_H3 | 18.90pp | >15pp | NEGATIVE | Same |
| Power Hot_Plain | 17.59pp | 1.2× threshold | NEGATIVE | Same |
| All Lotto cells | 3.6-14.6pp | <15pp | NEGATIVE | Within threshold (smaller dataset → more noise) |

**Principle #14 semantic refinement codified (inline, non-breaking)**: threshold |Δ| > 3× ceiling auto-flag applies to **positive Δ suggesting implausible overfit**. **Negative Δ crossing threshold means mechanism catastrophically fails** — different semantics. Both warrant attention but different follow-up. No new principle #16 needed; update §3.8 commentary accordingly.

### Bài học Chu Kỳ 16

- 🎯 **Kelly concentration ⊥ set-coverage lottery structure** — fundamental paradigm mismatch.
  - Kelly portfolio theory optimal cho independent-payoff bets where E[log(return)] maximization leads to concentration on high-edge opportunities.
  - Lottery matrix is **set-coverage problem**: need ≥3 of K drawn numbers covered by any ticket.
  - RandomN(20) random tickets cover ~42/45 numbers on Mega (93% of space) — maximal diversification.
  - Kelly restricted to top-15 pool covers only 15/45 (33%) — P(coverage ≥3) plummets.
  - **Math bottom line**: Kelly optimizes expected return; lottery win-rate maximization requires expected *coverage*, which is maximized by uniform random allocation, not concentration. Same objective function ≠ same optimization.

- 🎯 **Diversity constraint test informative**: Hot_H3 (Hamming≥3) beat Hot_Plain by 9-13pp across products. Diversity helps (Plain collapses tickets toward near-identical subsets of top-15). **But diversity within a narrow pool doesn't recover vs broad-pool random.** 15 numbers too restrictive regardless of internal diversity.

- 🎯 **Direction sanity check clean**: Hot_H3 vs AntiHot_H3 magnitude similar (Mega: −15.7 vs −18.9pp; Power: −10.1 vs −8.8pp; Lotto: −6.1 vs −3.6pp). Direction (hot vs cold) matters LESS than pool restriction (top-15 vs full). Core failure is **pool narrowness**, not mis-direction of bias.

- 🎯 **Tournament composite gaming artifact on Lotto**: Kelly variants top composite despite crushing win-rate loss because ROI axis z-normalized small. Validates pre-reg decision to bind "Accept requires ROI > RandomN" AND 3-gate pass — tournament top-1 alone insufficient signal. Lotto Hot_H3 got tournament top-1 but Reject via win-rate gate.

- 🎯 **Principle #14 semantic clarification**: magnitude flag threshold `|Δ| > 3× ceiling` serves 2 purposes by direction:
  - **Positive Δ crossing**: overfit flag (Chu kỳ 12 GBM precedent, binding for Accept)
  - **Negative Δ crossing**: mechanism catastrophic failure flag (new, Chu kỳ 16 Mega Plain −28pp)
  Different follow-up but both warrant documentation. Update METHODOLOGY §3.8 commentary (non-breaking, no new principle number).

- 🎯 **ROI axis also exhausted at current approach**. Multi-ticket Kelly-proxy is the primary ROI-axis candidate per roadmap; its Reject means:
  - Either ROI axis truly null at matrix scale (consistent với "Vietlott RNG near white noise" thesis)
  - Or alternative mechanisms needed (e.g., tier-specific payout targeting, jackpot-timing heuristics — but these are outside Path #2 Kelly scope)
  - Full Monte Carlo Kelly (proper, not proxy) would use same candidate pool concept → likely same failure mode
  - Broadening candidate pool (top-30, top-45, full C(N,K)) → approaches RandomN → no edge

- 🎯 **Project-wide cumulative (post Chu kỳ 16)**: ~60 strategies × 5 products × 3-gate protocol = **0 scientifically robust Accept/Suggestive**. Both win-rate AND ROI axes null across all tested mechanisms. Vietlott matrix + 3D RNG functionally random at data horizon hiện tại.

### Follow-up

Per pre-registration 9/9 Reject follow-up: **Chu Kỳ 17 là project-level decision điểm**. 3 options:

- **Option X — Path #5 Copula matrix** (long-shot win-rate, very low probability accept). Copula captures joint dependency không decomposable via marginals. Chu kỳ 11 3D variant failed; matrix structure (set-level, N=45/55) có thể khác. Effort 4-6 ngày. **Recommendation: low priority** sau 6 paths failed.

- **Option Y — Formal project closure + audit report**. Write comprehensive "Vietlott research final report" tổng hợp 16 cycles, ~60 strategies, methodology corpus (Principles #11-15), null findings, lessons learned. Publish [`research/PROJECT_CLOSURE_REPORT.md`](../PROJECT_CLOSURE_REPORT.md). Stop active research. **Recommendation: highest value-per-time.**

- **Option Z — Stop research, UI/UX polish + wait for data accumulation**. Focus on website improvements, better transparency disclosures, data crawler stability. Wait ~1 year for more data (~2027 Lotto reaches 1000 draws, Mega 1500). Then reopen if interesting new signals. **Recommendation: reasonable practical path.**

Hybrid Y+Z likely best: ship final report + UI polish + idle research state until data horizon expands. Decision phụ thuộc user priority.

### Future feature note (per user 2026-04-21 request)

Chu kỳ 16 Reject means "budget-aware optimal-N" feature **CANNOT rely on Kelly-proxy mechanism** — Kelly concentration proven wrong paradigm. Alternative mechanisms for the feature:
- **Just N RandomN tickets** — user sets budget, system generates N=budget/price independent random tickets. Maximal diversification. Honest about EV-negative.
- **HotN variant** — N tickets each sampled weighted by bias posterior. Best "theoretically motivated" option even though no statistical Accept. Shows in Chu kỳ 16 as roughly tied với RandomN on win-rate — not worse, not much better.
- **Explicit EV-negative disclaimer** — feature UI must frame as "N honest random tickets" not "Kelly-optimal winning strategy".

Implementation guidance: **Do NOT ship Kelly variants to users** — statistically significantly WORSE than random. HotN or RandomN-only là honest choice.

---

*Result appended: 2026-04-21. Chu Kỳ 16 closed. Chu Kỳ 17 = project-level decision (Option X/Y/Z pending user).*

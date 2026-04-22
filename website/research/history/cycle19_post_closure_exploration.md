## Chu Kỳ 19 — Post-Closure Exploration (5 mini-cycles, 2026-04-22)

**Context**: Sau Chu kỳ 18 Closure, user yêu cầu chạy 5 recommendations còn lại từ META_REVIEW để **cast wide net** trước khi stop hoàn toàn. Mỗi mini-cycle rẻ (post-hoc analysis hoặc standalone battery test), tổng cộng ~1 ngày compute.

**Scope**: KHÔNG phải breakthrough search. Là audit + closure evidence strengthening.

### Summary findings

| # | Cycle | Method | Key finding | Impact on closure |
|---|---|---|---|---|
| 19a | FDR re-analysis | BH-FDR trên 37 gate-1 p-values từ cycle 7-17 | **0 resurrections** — 3-gate stacking (Principles #11 + #13) là real filter, không phải Bonferroni | ✓ Confirms closure §5.11 |
| 19b | Tier-weighted ROI ranking | Surface existing ROI ranks vs win_rate ranks | 8 divergence cases giữa 2 rankings. GBM Chu kỳ 12 tops both but overfit (Chu kỳ 12.5). **Input cho Optimization mode** nếu Chu kỳ 20 resume. | Useful deliverable |
| 19c | NIST-style RNG battery | Integer-sequence tests: uniformity, per-number serial, per-number runs | Matrix products: all valid tests PASS. 3D: digit bias FAIL (confirms Chu kỳ 4). RNG functionally random at number level | ✓ Reinforces closure §6.2 |
| 19d | Seasonality (weekday/month/holiday) | Chi² contingency across calendar groupings × digit/number counts | **10/10 tests PASS** — no significant seasonality effect. **NEW FALSIFICATION ROW** | ✓ Strengthens closure §7.1 |
| 19e | Single+Multi ticket ensemble | Hybrid 1-Bayesian + 5-Random (+ variants) vs pure Random/Single, 3-gate | **Reject**: Hybrid_1S_5R, Hybrid_3S_3R, Single_N6 all fail split-half. Forward +1.4pp isolated noise (p=0.43). | ✓ New mechanism reject, confirms concentration ⊥ coverage (Chu kỳ 16) |

**Net**: No new Accept or Suggestive surface. 1 new falsification (seasonality) + methodology validations. Closure verdict unchanged but strengthened.

---

### 19a — BH-FDR re-analysis

**Rationale**: META_REVIEW §3.2 flagged Bonferroni K=14 as potentially over-conservative. Could any Chu kỳ 7-17 strategy resurface under BH-FDR?

**Method**: Recursively extract all `sig_vs_Random` blocks from 10 result JSONs. Filter to full-segment, positive-delta candidates. Apply Benjamini-Hochberg FDR at α=0.05 globally across 37 tests.

**Result**:
- 37 positive-delta vs-Random candidates on gate-1 full segment
- **0 strategies passed BH-FDR but failed Bonferroni** (true resurrection)
- 3 already-passing Bonferroni candidates:
  - GBM Max 3D / Max 3D Pro (cycle 12, p<0.0001, Δ=+3.1 to +3.6pp) — **Chu kỳ 12.5 confirmed overfit**, not valid
  - HierarchicalBayesDigit Max 3D (cycle 13, p=0.011, Δ=+0.49pp) — passes gate-1 but FAILS split-half (half1 Δ=+0.04 p=0.88) AND forward (Δ=−1.2pp) → was properly Rejected

**Interpretation**: Gate-1 Bonferroni is NOT the binding constraint. Even with FDR relaxation, 3-gate stacking (Principles #11 + #13) eliminates all candidates. Cumulative evidence for closure verdict is robust to multiple-comparison correction choice.

Data: [post_closure/cycle19a_fdr_reanalysis.json](../post_closure/cycle19a_fdr_reanalysis.json)

---

### 19b — Tier-weighted ROI ranking

**Rationale**: META_REVIEW §2a suggested "maximize E[payout]" as alternative to win_rate_ge3. ROI metric is already tier-weighted; this cycle surfaces ROI ranking and flags cases where ROI rank ≠ win_rate rank.

**Method**: Extract 90 full-segment strategy results from cycles 7-17. Per (cycle, product), rank by win_rate vs ROI. Count divergence cases.

**Result**: 8 (cycle, product) pairs where win_rate-top ≠ ROI-top. Notable:

| Cycle | Product | Win-rate top | ROI top |
|---|---|---|---|
| cycle14/15 | power_645 | Bayesian (win=2.70%, roi=−88.8%) | Freq_Hot (win=2.45%, roi=−72.0%) |
| cycle14/15 | power_535 | Adaptive (win=1.85%, roi=−88.7%) | OnlineBayes_λ0.01 (win=1.85%, roi=−86.7%) |
| cycle11 | max_3d | EmpiricalCopula (win=2.12%) | GaussianCopulaEmpMargins |
| cycle17 | max_3d / max_3d_pro | HMM_K2_W40 | FreqWholeHot / Random |

**Interpretation**: ROI ranks diverge meaningfully from win_rate ranks in 8/14 cases. For Optimization mode (Chu kỳ 20 optional), ROI-ranked picks may differ from win-rate picks — explicit dual-pick UI (`picks.winrate` + `picks.roi`) is correct.

**Caveat**: GBM Chu kỳ 12 tops both rankings but is overfit (Chu kỳ 12.5 audit) — must exclude from UI.

Data: [post_closure/cycle19b_tier_weighted_ranking.json](../post_closure/cycle19b_tier_weighted_ranking.json)

---

### 19c — NIST-style RNG battery

**Rationale**: META_REVIEW §2c #1 + Hướng D — formal RNG whiteness confirmation for closure evidence strengthening.

**Method**: 6 tests adapted for integer sequences:
1. Uniformity chi² on drawn numbers
2. Digit uniformity (3D only, 3×10=30 bins)
3. Serial correlation lag-1 (Pearson + Fisher z)
4. Runs test on parity sequence (Wald-Wolfowitz)
5. Runs test on above/below-median sequence
6. Monobit on bit representation

Initial flatten-sorted approach caused test-construction artifacts on matrix (matrix draws are sorted within-draw, inducing false serial correlation). **Re-ran matrix with correct per-number indicator sequences** (for each 1..max_val, binary sequence of "drawn / not drawn" per draw).

**Result (corrected)**:

| Product | Uniformity | Digit | Per-num Serial | Per-num Runs | Other artifacts |
|---|:---:|:---:|:---:|:---:|---|
| Max 3D | ✓ p=0.24 | **✗ p<0.0001** | ✓ | ✓ | Monobit invalid (0-999 in 10 bits) |
| Max 3D Pro | ✓ p=0.54 | **✗ p=0.0001** | ✓ | ✓ | Monobit invalid |
| Power 6/55 | ✓ p=0.42 | — | ✓ 0/55 fail | ✓ 0/55 fail | — |
| Power 6/45 | ✓ p=0.83 | — | ✓ 0/45 fail | ✓ 0/45 fail | — |
| Power 5/35 | ✓ p=0.59 | — | ✓ 0/35 fail | ✓ 0/35 fail | — |

**Key finding**: All 5 products PASS valid uniformity + serial + runs tests at number level. 3D FAIL digit-level uniformity (confirms known Chu kỳ 4 bias, digit 6 +11%, digit 5 +8%). Monobit binary tests on 3D are invalid (numbers 0-999 use 10 bits but top bits biased 0 by construction — not RNG issue).

**Interpretation**: RNG is **functionally uniform at number level** for all products. Only exploitable bias is 3D digit-level, already characterized and demonstrated as unexploitable after 3-gate (Chu kỳ 4-13). Reinforces closure §6.2.

Data: [post_closure/cycle19c_nist_battery.json](../post_closure/cycle19c_nist_battery.json), [post_closure/cycle19c_nist_battery_matrix_v2.json](../post_closure/cycle19c_nist_battery_matrix_v2.json)

---

### 19d — Seasonality (weekday / month / holiday)

**Rationale**: META_REVIEW §2a "higher-order temporal: day-of-week chi² per weekday; lunar calendar seasonality (Tết, lễ)". Chu kỳ 8 drift only tested 3-window coarse; sub-group drift untested.

**Method**: Group draws by weekday (0-6), month (1-12), holiday/regular (VN Tết + major national holidays 2017-2026). Chi² contingency test per (product × grouping) on digit counts (3D) or number counts (matrix). Bonferroni α=0.05/k per product where k = number of groupings.

**Result**:

| Product | Weekday χ² | Month χ² | Holiday vs Regular |
|---|:---:|:---:|:---:|
| max_3d | p=0.30 ✓ | p=0.51 ✓ | (n_holiday=16, skipped) |
| max_3d_pro | p=0.64 ✓ | p=0.65 ✓ | (n_holiday=9, skipped) |
| power_655 | p=0.98 ✓ | p=0.9965 ✓ | (n_holiday=18, skipped) |
| power_645 | p=0.42 ✓ | p=0.93 ✓ | (n_holiday=18, skipped) |
| power_535 | p=0.90 ✓ | p=0.97 ✓ | (n_holiday=8, skipped) |

**10/10 tests PASS** (p-values 0.30 to 0.9965 — no sub-group bias detectable). Most p-values > 0.5 indicate very clean null fit.

**Interpretation**: **NEW FALSIFIED HYPOTHESIS** — no weekday or month bias on digit/number frequency. Adds to §7.1 of closure report. Holiday sample size too small for meaningful test (max N=18/product) — untested but low prior probability given all other temporal tests pass.

**Note on weekday distribution**: Products show balanced 3-draws-per-week distribution (e.g., Max 3D: Mon/Wed/Fri, Max 3D Pro: Tue/Thu/Sat, Power 5/35: daily). No draw-day concentration artifact.

Data: [post_closure/cycle19d_seasonality.json](../post_closure/cycle19d_seasonality.json)

---

### 19e — Single + Multi-ticket ensemble

**Rationale**: META_REVIEW §2c #2 — "1 Bayesian + 5 RandomN = 6 vé? Chưa test offset giữa diversification loss và information gain." Genuinely novel paradigm unaddressed by cycles 1-17. Hypothesis: ensemble of informed + random tickets might offset Kelly's concentration failure (Chu kỳ 16).

**Method**: Power 6/55, 6 tickets per draw, 4 portfolio configs:
- `Random_N6` (baseline): 6 pure Random tickets
- `Single_N6`: 6× Bayesian(365,1.0,1.0) resampled (concentration baseline)
- `Hybrid_1S_5R`: 1 Bayesian + 5 Random
- `Hybrid_3S_3R`: 3 Bayesian + 3 Random

Walk-forward, n_runs=5, seed=42. Metric: P(any_ticket_ge3). Segments: full + half1 + half2 + forward_last_100.

**Result** (Δ vs Random_N6):

| Strategy | Full | Half1 | Half2 | Forward | Split-half? | Verdict |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Hybrid_1S_5R | −0.335 (p=0.50) | −0.214 (p=0.79) | −0.180 (p=0.78) | **+1.400** (p=0.43) | ✗ (3 negatives + isolated positive) | **Reject** |
| Hybrid_3S_3R | −0.159 (p=0.75) | −0.428 (p=0.59) | −0.180 (p=0.78) | +1.200 (p=0.49) | ✗ (3 negatives + isolated positive) | **Reject** |
| Single_N6 | +0.123 (p=0.81) | +0.471 (p=0.56) | +0.210 (p=0.75) | +0.400 (p=0.82) | ✓ directional | — (all insignificant) |

**Interpretation**:
- Hybrids show *negative* Δ on full/half1/half2 (−0.2 to −0.4pp), then *positive* +1.2-1.4pp on forward_last_100 → classic direction flip → Principle #11 Reject.
- The forward positive is noise artifact (n=500, p=0.43, wide CI). Not a real effect.
- Single_N6 (pure concentration) positive but tiny (+0.12 to +0.47pp), all p>0.55 — not significant at any gate. Consistent with Chu kỳ 16 Kelly rejection.
- **No ensemble structure offsets set-coverage geometry**.

Conclusion: Information gain from 1 Bayesian ticket does NOT offset loss of 1 Random slot. Hybrid portfolios lose on coverage without compensating edge. Adds to Eliminated list: "Single+Multi ticket ensemble" joins Kelly as falsified (same geometry root cause).

Data: [post_closure/cycle19e_single_multi_ensemble.json](../post_closure/cycle19e_single_multi_ensemble.json)

---

### Overall Chu kỳ 19 conclusion

5 mini-cycles, ~1 day compute, 0 breakthrough findings. But:
- 1 new falsification (seasonality) → §7.1 of closure report update
- 1 new mechanism Reject (Single+Multi ensemble) → eliminated family extension
- Methodology validations: FDR confirms 3-gate is real filter; NIST confirms RNG uniformity claim
- Useful deliverable: 19b ROI ranking ready for Chu kỳ 20 Optimization mode

**Closure verdict unchanged, strengthened. Ready to fully stop active research.** Optimization mode (Chu kỳ 20) still optional user-initiated.

### Updates to closure report needed

1. §7.1 table: add row "Seasonality (weekday/month)" → Falsified (origin 19d)
2. §7.1 table: add row "Single+Multi ticket ensemble" → Falsified (origin 19e, same geometry root)
3. §7.2: add "RNG functionally uniform at number level" → formally confirmed (origin 19c)
4. §7.4: note FDR re-analysis confirms no Bonferroni/FDR choice artifact (origin 19a)

### Artifacts

- [post_closure/cycle19a_fdr_reanalysis.json](../post_closure/cycle19a_fdr_reanalysis.json)
- [post_closure/cycle19b_tier_weighted_ranking.json](../post_closure/cycle19b_tier_weighted_ranking.json)
- [post_closure/cycle19c_nist_battery.json](../post_closure/cycle19c_nist_battery.json)
- [post_closure/cycle19c_nist_battery_matrix_v2.json](../post_closure/cycle19c_nist_battery_matrix_v2.json)
- [post_closure/cycle19d_seasonality.json](../post_closure/cycle19d_seasonality.json)
- [post_closure/cycle19e_single_multi_ensemble.json](../post_closure/cycle19e_single_multi_ensemble.json)

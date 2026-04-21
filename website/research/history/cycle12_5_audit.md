## Chu Kỳ 12.5 — Audit: Diagnose GBM "Technical Accept" on Max 3D Pro (04/2026)

> **Đây không phải cycle nghiên cứu mới** — là **diagnostic cycle** để resolve ambiguity về Max 3D Pro "Technical Accept" flagged Ship-with-caveats trong Chu kỳ 12. Purpose: xác định root cause của implausible Δ=+3pp (leak vs overfit) và codify các Principles mới nếu phát hiện rõ.

### Scope

5 pre-declared diagnostic tests trên GBMDigitClassifier (Chu kỳ 12 strategy):

1. **Permutation test** — shuffle labels during training, refit, measure forward Δ. Δ_permuted ≈ 0 → no leak; Δ_permuted ≫ 0 → feature leaks label info.
2. **Feature importance** — permutation importance để identify driver features.
3. **Prediction diversity** — count unique top-2 picks + concentration. Low diversity → model collapse (overfit signature).
4. **Single-feature ablation** — train GBM với 1 feature một lúc, measure Δ. Identify whether one feature alone reproduces the apparent edge.
5. **Split-forward consistency** — chia last 200 draws thành 4×50 windows, check Δ direction consistency.

### Findings

#### Max 3D Pro (the "Technical Accept" product, N=711)

| Test | Result | Interpretation |
|------|--------|----------------|
| 1 Permutation | Normal Δ=+1.00pp, Permuted Δ=**0.00pp** | **NO LEAK** — features don't encode label info. Pure overfitting confirmed. |
| 2 Feature importance | Top: marg_p1, pair_01, marg_p2, pair_02, marg_p0 — all marginal/pair features ranking highest; sum_parity lowest | Known-bias features (per Chu kỳ 4) dominate, không có "suspicious" feature |
| 3 Prediction diversity | 67 unique predictions / 600 total (2 per draw × 100 × 3 runs). Top-5 = **39.5% concentration**. Most-picked: '197' (66 times) | **MODERATE CONCENTRATION** — model has persistent favorites |
| 4 Ablation (forward, 1 feature each) | pair_01 alone Δ=+2.50pp, marg_p0 +2.00pp, pair_02 +1.50pp, sum +1.50pp, freq_30 +1.50pp, freq_300 +1.50pp — **multiple features individually claim edges** | Classic overfit signature — when trivial single features "work", it's training-period noise alignment với base rate. Implausible for trivial features |
| 5 Split-forward (4×50 windows) | W1 +1.0pp, W2 **−2.0pp**, W3 +1.0pp, W4 +0.3pp → 3/4 positive but scattered | Δ sign varies wildly window-to-window. Not a stable edge. |

#### Max 3D (the "Reject" product, N=1065) — confirms consistency

| Test | Result |
|------|--------|
| 1 Permutation | Normal Δ=**−1.83pp**, Permuted Δ=−2.33pp — both strongly negative |
| 3 Prediction diversity | 49 unique, '380' picked **216/600 times (36%!)** — extreme collapse |
| 4 Ablation | ALL 13 features individually give negative Δ (−0.33 to −2.33pp). No feature helps on Max 3D |
| 5 Split-forward | W1 −2.3, W2 −1.0, W3 +0.3, W4 −2.3 — 1/4 positive. Consistent forward failure. |

### Definitive diagnosis

**Max 3D Pro "Technical Accept" = confirmed overfitting artifact**:
1. Không có data leak (permutation Δ=0 xác nhận)
2. Model overfits to training-period co-occurrence patterns of known-bias features (digit marginals + pairs)
3. Model collapses to few favorite predictions (67 unique / 600, with top-5 = 40%)
4. Edge không stable qua sliced forward windows (1 window −2pp)
5. Multiple trivial single-feature ablations cá nhân show implausible +2pp — classic overfit-on-training-period signature

**Max 3D forward failure (−1.9pp in Chu kỳ 12) = extreme overfitting** — model collapsed to '380' 36% của predictions, which simply không trong last-100 draws.

### Proposed new Principles

**Principle #14 — Magnitude sanity check (STRONGLY RECOMMENDED, codify vào METHODOLOGY.md)**:

Định nghĩa "bias ceiling" cho mỗi product class:
- 3D: +0.4pp số-level (from Chu kỳ 4 digit-bias max ~+1.2pp × 3 positions, compound)
- Matrix 6/55, 6/45, 5/35: +0.3pp win_rate_ge3 (from Chu kỳ 5-6 observations max)

**Rule**: If claimed full-sample Δ > **3× bias ceiling**, auto-flag as "Ship-with-caveats pending audit", regardless of p-values hay split-half pass. Require audit cycle (như 12.5) trước khi claim Accept. Rationale: genuine edges exceed known ceiling chỉ nếu mechanism captures novel bias — must verify khi scale suspect.

**Principle #15 — Prediction concentration check (RECOMMENDED for ML/discriminative strategies)**:

For discriminative models (GBM, neural nets, classifiers):
- Require `n_unique_predictions / total_predictions > 0.5` trong forward window
- Require top-5 concentration < 30%

Lottery với 1000 candidates, concentrated predictions signal model has overfit. Codify vào METHODOLOGY.md as auto-Reject flag.

**Principle #13 v2 — Forward gate tighten**:

Current: forward gate = "Δ > 0 directional only" (too loose với n=1000).
v2: Forward gate requires **(Δ > 0) AND (|Δ| > minimum_detectable_effect)** where MDE = 2 × standard_error. For n=1000, SE ≈ 0.4pp → MDE ≈ 0.8pp. Alternative: require forward p < 0.15 (one-sided) nếu full-sample passed Bonferroni.

### Final classification (override Chu kỳ 12 Ship-with-caveats)

Max 3D Pro GBM: **Reject** (confirmed overfit per audit — deprecate Ship-with-caveats status).

Chu kỳ 12 pre-reg rule satisfied → initially Technical Accept. Chu kỳ 12.5 audit provides NEW EVIDENCE not available at pre-reg time. Science allows NEW evidence to update prior conclusions — different from post-hoc rule changes (which would be p-hacking). Audit-based Reject is consistent with scientific rigor.

**Project state**: 0 scientifically robust Accept/Suggestive across 25 strategies × 5 products.

### Artifacts

- [3d/cycle12_5_audit.py](../3d/cycle12_5_audit.py) — 5-test diagnostic script (reusable cho future audit cycles)
- [3d/cycle12_5_audit_results.json](../3d/cycle12_5_audit_results.json) — full test results
- [3d/cycle12_5_audit_output.log](../3d/cycle12_5_audit_output.log) — run log

### Impact

1. **Max 3D Pro GBM deprecated** — not shipped, not ranked, not mentioned trên website. Cycle 12 entry updated to "Reject (audit-confirmed overfit)".
2. **Principle #14 proposed** (magnitude check) — strong candidate để codify. Would have pre-emptively flagged Cycle 12 before expensive forward gate catch.
3. **Principle #15 proposed** (prediction concentration) — specific to ML strategies. Would have caught '380' 36%-concentration pattern.
4. **Principle #13 v2** — tighten forward gate minimum detectable effect threshold.
5. **3D status**: 25 strategies tested, 0 robust edges confirmed. Ready for Chu kỳ 13 = last remaining 3D path (Cross-product pool) before mandatory pivot sang matrix.

---

*Cập nhật lần cuối: 2026-04-21 — Chu kỳ 12.5 audit confirmed Max 3D Pro GBM = overfit (not leak). Principle #14/#15 proposed. Max 3D Pro GBM deprecated → Reject. Ready Chu kỳ 13 Path B Cross-product pool.*

---

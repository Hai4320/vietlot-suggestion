# Lịch Sử Nghiên Cứu — Vietlott Algorithm R&D

> **Mục đích**: Nhật ký chronological các chu kỳ nghiên cứu — mục tiêu, phương pháp, kết quả, bài học. Khác với [RESEARCH_DOCUMENTATION.md](RESEARCH_DOCUMENTATION.md) (tài liệu kỹ thuật canonical), file này tập trung vào **quá trình** và **ngữ cảnh** của mỗi quyết định.
>
> **Khi nào cập nhật**: Mỗi lần hoàn thành một research cycle — tạo file mới trong [history/](history/), thêm row vào summary table bên dưới, link vào phần "Cycle Index". Không sửa các file cycle cũ (immutable record).
>
> **Cấu trúc** (tái cấu trúc 2026-04-21): File này là **index + corpus**. Chi tiết mỗi cycle nằm trong `history/cycleNN_<slug>.md` riêng.

---

## Tóm Tắt Các Chu Kỳ

| # | Thời gian | Mục tiêu | Kết quả then chốt |
|:-:|-----------|----------|-------------------|
| 1 | 07/2025 | Baseline strategies cho matrix | 10 thuật toán cơ bản (freq, absence, pattern…) |
| 2 | 10/2025 – 01/2026 | Research-backed strategies | Bayesian, MaxEntropy, Adaptive, Ensemble, MinDistance |
| 3 | 02/2026 | Tối ưu matrix + recommendations | Pattern #1 tổng hợp, Bayesian #1 Power 6/55 |
| 4 | 03/2026 – 04/2026 | 3D deep analysis + strategies | 13-test RNG framework, EVMax #1 3D Pro, JointBias #2 |
| 5 | 04/2026 | Phase-B Lotto 5/35 + wheeling | Negative — no wheeling strategy passes significance after sample-size fix |
| 6 | 04/2026 | Significance test enforcement | Z-test wired pipeline; 3 candidates Suggestive/near-miss |
| 7 | 04/2026 | Split-half replication (3D) | 2/2 Reject — FreqWholeHot noise, EVMaximizer half-split flip |
| 8 | 04/2026 | Distribution shift verification (3D R1 gate) | No drift — bias stable. 3D paused, pivot Mega 6/45 |
| 9 | 04/2026 | Mega 6/45 ExpDecay_Cold split-half | Reject — direction flip (h1 −0.26pp, h2 +0.37pp). Last Suggestive eliminated |
| 10 | **04/2026** | **PIVOT — Breakthrough Mode** | Tournament + multi-objective; Principles #11/#12 preserved; "Ship-with-caveats" state |
| 11 | 04/2026 | Copula-based joint digit (Path A, 3D) | **Reject** — 3/4 Reject + 1/4 Inconclusive. Copula thua cả JointDigitBias heuristic |
| 12 | 04/2026 | Tree-based GBM classifier (Path E, 3D) | **Split** — Max 3D Reject (fwd flip), Max 3D Pro "Technical Accept" flagged Ship-with-caveats |
| 12.5 | 04/2026 | Audit GBM "Technical Accept" (diagnostic) | No leak. Confirmed overfit. Max 3D Pro GBM **deprecated → Reject**. Principles #13/14/15 codified |
| 13 | 04/2026 | Cross-product pooling (Path B, 3D) | **4/4 Reject** — pooling HURTS Max 3D Pro. 3D exhausted (28 strategies). Principle #13 validated 5th |
| 14 | 04/2026 | Online Bayesian Kalman (Path #1, matrix) | **6/6 Reject** — drift hypothesis falsified; adaptive family eliminated. Principle #13 validated 6th (Lotto OnlineBayes λ=0.03) |

---

## Cycle Index (chi tiết)

| # | File | Summary (1-line hook) |
|:-:|------|------------------------|
| 1 | [cycle01_baseline.md](history/cycle01_baseline.md) | 10 baseline strategies, walk-forward infra bootstrap |
| 2 | [cycle02_research_backed.md](history/cycle02_research_backed.md) | Bayesian / MaxEntropy / Adaptive / MinDistance — literature-backed adds |
| 3 | [cycle03_consolidation.md](history/cycle03_consolidation.md) | Consolidation + per-product top strategy recommendations |
| 4 | [cycle04_3d_deep_analysis.md](history/cycle04_3d_deep_analysis.md) | 3D products expansion — 13-test RNG framework + digit-level bias strategies |
| 5 | [cycle05_lotto535_wheeling.md](history/cycle05_lotto535_wheeling.md) | Phase-B Lotto 5/35 deep analysis + wheeling; negative result after sample-size fix |
| 6 | [cycle06_significance_gating.md](history/cycle06_significance_gating.md) | Two-proportion z-test enforced project-wide; 3 candidates identified |
| 7 | [cycle07_3d_replication.md](history/cycle07_3d_replication.md) | Split-half replication on 3D candidates — both Reject (1st half-split flip observed) |
| 8 | [cycle08_drift_verification.md](history/cycle08_drift_verification.md) | 3-window chi² homogeneity — no drift. R1 gate stopped Phase 2. 3D paused |
| 9 | [cycle09_mega645_replication.md](history/cycle09_mega645_replication.md) | Last Suggestive candidate split-half Reject (direction flip). Project-wide null |
| 10 | [cycle10_breakthrough_pivot.md](history/cycle10_breakthrough_pivot.md) | **Pivot to breakthrough mode** — win-rate primary goal, tournament ranking |
| 11 | [cycle11_copula.md](history/cycle11_copula.md) | Copula strategies (Path A) — Gaussian + Empirical, 3/4 Reject on 3D |
| 12 | [cycle12_gbm.md](history/cycle12_gbm.md) | GBM discriminative (Path E) — full-sample +3pp, forward flip Max 3D, implausible magnitudes |
| 12.5 | [cycle12_5_audit.md](history/cycle12_5_audit.md) | GBM audit — no leak, overfit confirmed. Principles #14/#15 codified |
| 13 | [cycle13_pool.md](history/cycle13_pool.md) | Cross-product pool (Path B) — 4/4 Reject. 3D mechanism space exhausted |
| 14 | [cycle14_online_bayesian.md](history/cycle14_online_bayesian.md) | Online Bayesian Kalman (Path #1, matrix) — 6/6 Reject. Matrix bias stable same as 3D; adaptive family eliminated |

---

## Principles Corpus (codified in [METHODOLOGY.md](METHODOLOGY.md))

Methodology principles phát sinh từ negative results:

| # | Principle | Origin cycles | Section |
|:-:|-----------|---------------|---------|
| 11 | **Split-half replication mandatory** cho Suggestive → Accept | 7, 9 | [METHODOLOGY §3.5](METHODOLOGY.md) |
| 12 | **Variable-baseline power analysis** pre-cycle | 8, 9 | [METHODOLOGY §3.6](METHODOLOGY.md) |
| 13 | **Forward gate mandatory** — 3-gate stacked (full + split-half + forward_last_100) | 7, 9, 11, 12, 13 (5× validated) | [METHODOLOGY §3.7](METHODOLOGY.md) |
| 14 | **Magnitude sanity check** — auto-flag if \|Δ\| > 3× bias ceiling | 12, 12.5 | [METHODOLOGY §3.8](METHODOLOGY.md) |
| 15 | **Prediction concentration check** (ML strategies) — n_unique/total ≥ 0.30 | 12.5 | [METHODOLOGY §3.9](METHODOLOGY.md) |

Guardrails bất biến (từ Chu kỳ 1+):
- Walk-forward (no look-ahead)
- Random baseline mandatory
- Pre-registration hypothesis trước implement
- Significance test trên Δ, không bare

---

## Project-Wide Cumulative State (post-Chu kỳ 13)

### Strategies tested
- **Matrix (Power 6/55, Mega 6/45, Lotto 5/35)**: ~23 strategies across cycles 1-6, 9, 14
- **3D (Max 3D, Max 3D Pro)**: **28 strategies** across cycles 4, 6, 7, 8, 11, 12, 13
- **Total**: ~53 strategies × 5 products × 3-gate protocol (cycles 7+)

### Accept / Suggestive tally
- **0** scientifically robust Accept across entire project history (post Chu kỳ 14)
- **0** current Suggestive (last candidate ExpDecay_Cold eliminated Chu kỳ 9)
- **0** Ship-with-caveats standing (Chu kỳ 12 GBM Max 3D Pro deprecated Chu kỳ 12.5)

### 3D research line
**DEFINITIVELY CLOSED** sau Chu kỳ 13. Bias real + stable (Chu kỳ 8) nhưng không exploitable bằng bất kỳ paradigm nào đã test (probabilistic, copula, discriminative, pooled). Retry criteria: >500 additional draws (~2027) OR novel bias dimension discovery OR Vietlott RNG methodology audit.

📄 **Full synthesis**: [3d/3D_FINAL_REPORT.md](3d/3D_FINAL_REPORT.md) — 28 strategies × 8 cycles tổng hợp, mechanism analysis, methodology corpus, revisit criteria.

### Matrix research line
**ACTIVE (weak hopes)** — Chu kỳ 14 Path #1 Online Bayesian 6/6 Reject. Drift hypothesis falsified trên matrix (consistent với Chu kỳ 8 3D finding). Adaptive/drift-based family eliminated. Remaining paths: Path #3 (Cross-product matrix Mega/Power/Lotto overlap [1,35]), Path #2 (Kelly portfolio ROI-axis), Path #5 (Copula matrix).

---

## Active / Next Cycle

**Chu kỳ 14 (closed, 2026-04-21, 6/6 Reject)**: Path #1 Online Bayesian Kalman. Mega 6/45 all 3 λ variants Reject (split flip hoặc Δ<0). Lotto 5/35 same. See [cycle14_online_bayesian.md](history/cycle14_online_bayesian.md).

**Chu kỳ 15 (proposal, user decide)**: 2 candidates:

**Option A — Path #3 Cross-product Joint Matrix** (per roadmap priority):
- Hypothesis: Power 6/55 + Mega 6/45 + Lotto 5/35 share bias on overlap [1,35] (same vendor, possibly shared physical machines)
- Mechanism: pool bias estimates across 3 products → tighter P(number_i)
- Win-rate axis, NOT drift-dependent
- Caveat: Chu kỳ 13 3D variant Reject — matrix structure differs enough warrant test

**Option B — Path #2 Kelly-optimal Multi-ticket Portfolio** (pivot to ROI-axis):
- Hypothesis: win-rate stuck near-null (9 cycles); ROI optimization via multi-ticket selection tractable
- Mechanism: Kelly criterion trên portfolio, EV-negative game explicit
- Changes project focus from win-rate to ROI

Chu kỳ 12 GBM Max 3D Pro deprecated — không ship, không rank. Audit complete.

---

*File restructured 2026-04-21: split into per-cycle files trong [history/](history/). Main file giờ là compact index (this file, ~180 lines vs trước 1499 lines).*

*Cập nhật lần cuối: 2026-04-21 — Chu kỳ 14 closed (6/6 Reject). Chu kỳ 15 pending user decision.*

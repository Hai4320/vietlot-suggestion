# Lịch Sử Nghiên Cứu — Vietlott Algorithm R&D

> **Mục đích**: Nhật ký chronological các chu kỳ nghiên cứu — mục tiêu, phương pháp, kết quả, bài học. File này là **index + corpus** cho 16 chu kỳ đã đóng; chi tiết mỗi cycle nằm trong [`history/cycleNN_<slug>.md`](history/) riêng.
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
| 15 | 04/2026 | Cross-product Joint Matrix (Path #3) | **5/6 Reject + 1/6 Inconclusive** — shared-RNG hypothesis falsified on matrix (Lotto pool hurt −0.677pp p=0.046). Win-rate axis fully exhausted |
| 16 | 04/2026 | Kelly-optimal Multi-ticket Portfolio (Path #2, ROI-axis) | **9/9 Reject** với Δ dramatic NEGATIVE (-3.57 to -28.05pp). Kelly concentration ⊥ set-coverage lottery. Both win-rate + ROI axes exhausted |
| 17 | 04/2026 | HMM Regime Detection (Hướng C, Kịch bản 2 1-shot) | **6/6 Reject**. 4/6 Principle #15 collapse (single-state degenerate); 2/6 passed concentration fail split-half + forward. Discrete latent regime hypothesis falsified. **Principle #16 Retry Tree codified** (first cycle using it). |
| 18 | 04/2026 | **Project Closure Report** (Hướng G, Kịch bản 2 Stage 2) | Terminal cycle. `PROJECT_CLOSURE_REPORT.md` consolidate 17 cycles + ~66 strategies + Principles #11-#16 + reopen criteria. Active breakthrough research CLOSED. |
| 19 | 04/2026 | **Post-closure exploration** (5 mini-cycles: FDR, ROI rank, NIST, seasonality, ensemble) | 19a 0 resurrections | 19b 8 ROI divergences | 19c RNG uniform all 5 products | **19d seasonality falsified** | **19e ensemble Reject**. Closure strengthened, 2 new falsification rows §7.1. |
| 20 | 04/2026 | **Methodology refinement** (doc-only, post-closure self-assessment) | 4 improvements codified across 5 docs. Principle #17 (family elimination) added. Principle #12 BINDING. Composite-binding §8. 8 Reject → Inconclusive-underpowered reclassified. Cumulative claim refined. |
| 21 | 04/2026 | **Hierarchical Bayesian (Hướng B unblocked)** | **9/9 Reject**. 2 split-half direction flips Power 6/55 (power-independent reject). Forward +1.6pp noise signature. Bayesian broad family eliminated §7.5 closure update. |
| **22** | **04/2026** | **Optimization Mode — Phase O-1 + O-2 shipped** | Post-closure Optimization: 3 composite profiles (WinRate/ROI/Balanced) × 5 products. Fresh re-backtest với split-half trên picks. 3/5 có valid picks (Power 6/55 MinDistance dominate, Power 5/35 Freq_Hot dominate, Max 3D diverse 3-pick: PairExploiter + CoverageOpt + FreqWholeHot). 2/5 null honest (Mega 6/45 baseline drift, Max 3D Pro regime split). UI shipped: 3 new TS strategies (mindistance/coverageopt/pairexploiter), `/research/cycle22` full-rankings page, glossary C22 section. |
| **23** | **04/2026** | **App-wide UX Refactor** | 4-phase UX cleanup (Optimization mode extension, UI-only): 23.1 stale string audit (7 files), 23.2 badge taxonomy reset (max 3 pick badges: 🎯/💰/⚖), 23.3 `/research` rewrite 867→250 lines + `/research/cycle22` route deleted (inline vào `/research`), 23.4 `/suggest` compact header + Generate up-front + product pages "✨ Gợi ý số" CTA với `?p=` query param. Time-to-first-suggestion ~20s → ~8s. No new research mechanism. |
| **24** | **04/2026** | **Budget-aware Portfolio (UC2)** | Allocator + CLI + UI @ B=100K VND (10 tickets) × 5 products. 44 portfolio candidates ranked by 5-term composite (E[payout] 0.35 / P(win≥1) 0.25 / variance_penalty 0.15 / coverage 0.15 / budget_eff 0.10). Top winners: Max 3D Mixed(PairExploiter+FreqWholeHot, 7:3) composite +1.200 / Power 6/55 Hedged(MinDistance, 9+1R) / Power 5/35 Pure(Freq_Hot). Null-pick products (Mega 6/45, Max 3D Pro) ship với explicit "⚠ Không có edge xác nhận" disclosure. CLI `vietlott-budget`, UI BudgetWidget in `/suggest`. Pre-reg amended 50K→100K pre-execution. No Accept/Reject (Optimization mode). |
| **25** | **04/2026** | **Method Evaluation Framework + Tier-1** | Generic 6-dim method-spec evaluator (`methods_evaluator.py`) + 13 method specs × 5 products × 4 segments × N_RUNS=20. **Gambler's fallacy "số gan" REFALSIFIED** (F1 cold persistence −5 to −8 pp vs Random on 3 matrix products). F2 hot persistence also worse than Random. A1b fixed FreqWholeHot on Max 3D beats Random by +4.8 pp (small Suggestive). F7 K=50 escape × Power 5/35 = +10.8 pp Inconclusive. F1b Max 3D +284.6% outlier flagged variance artifact. Psychology metrics shipped: pain streak P(≥5) = 100% all products, ruin prob B=500K/N=100 = 85-100%, ticks-to-first-hit p50 = 18-49 draws. Framework reusable Chu kỳ 26-28. 9 Tier-1 methods added to catalog (26/73 tested). |
| **26** | **04/2026** | **Tier-2 Wheeling + 3D Permutations** | Framework extended với 5 new bet_size types (full_wheel / key_wheel / permutation_all / paired_mirror / forward_reverse_hedge) + 4 filter types (sum_range / parity_balanced / no_consecutive / has_consecutive) + CLI flags cho multi-cycle reuse. 12 Tier-2 method specs × applicable products. **Wheeling (B1/B3) boosts P(hit) 1.6-5× nhưng ROI tied Random** — confirms lottery math ("wheels = more chances, same house edge"). Filter-based (B5/B6/B10/B11) = statistical noise. **C1 bao lô 6 hoán vị Max 3D**: P(hit) 5× Random, ROI tied (−47.7%/−45.6% vs −48.1%). **C5 Forward+reverse hedge 3D Pro**: full segment +34.5pp nhưng FORWARD-GATE FAIL (−84.7% forward) — Inconclusive, variance trap from lucky half1 hit. No Accept/Suggestive. 9 new Tier-2 methods added (35/73 tested). |
| **27** | **04/2026** | **🚨 Tier-3 Compounding + Calendar + C6 A=B SUGGESTIVE** | Framework extended với D6 compounding (Martingale/Anti-Martingale/near-miss escalation) + D3 weekly + a_equal_b bet-structure. 9 Tier-3 specs. **🚨 HEADLINE: C6 A=B Max 3D Pro = +4758% ROI consistent 4 segments, forward-gate PASS, 0% ruin at B=1M. FIRST potentially positive-EV finding in 27 cycles.** Exploit Max 3D Pro quy chế A=B doubling rule. Theoretical EV = +4180% matches observed. Principle #14 flag fired, investigated, resolved via EV math. Random BEATS TierWeighted (+322pp) — no algorithm needed. SUGGESTIVE pending Chu kỳ 28 real-world validation. Compounding (G2/G3/G5) forward-gate FAIL — 100% bankruptcy rate B=1M, cautionary documentation. Calendar (E) = no EV, variance only. 9 new methods (44/73 tested). |

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
| 15 | [cycle15_cross_product.md](history/cycle15_cross_product.md) | Cross-product Joint Matrix (Path #3) — 5/6 Reject + 1/6 Inconclusive. Shared-RNG falsified (matrix + 3D both). Win-rate axis exhausted |
| 16 | [cycle16_kelly_portfolio.md](history/cycle16_kelly_portfolio.md) | Kelly Portfolio (Path #2) — 9/9 Reject with dramatic negative Δ. Kelly concentration ⊥ set-coverage lottery. Both axes exhausted |
| 17 | [cycle17_hmm_regime.md](history/cycle17_hmm_regime.md) | HMM Regime Detection (Hướng C Kịch bản 2) — 6/6 Reject. Principle #15 fired on 4/6 (state collapse); 2/6 concentration-pass fail split-half + forward. Principle #16 Retry Tree codified & applied. Paradigm falsified. |
| 18 | [cycle18_closure.md](history/cycle18_closure.md) | **Project Closure Report** (Hướng G Kịch bản 2 Stage 2) — [PROJECT_CLOSURE_REPORT.md](PROJECT_CLOSURE_REPORT.md) terminal artifact. Active breakthrough research closed. Chu kỳ 19 Optimization optional. |
| 19 | [cycle19_post_closure_exploration.md](history/cycle19_post_closure_exploration.md) | **Post-closure exploration** (5 mini-cycles per user "chạy từng khuyến nghị"): 19a FDR re-analysis, 19b tier-weighted ROI rank, 19c NIST-style RNG battery, 19d seasonality, 19e single+multi ensemble. +2 new falsifications, methodology gaps §7.4 partially closed. |
| 20 | [cycle20_methodology_refinement.md](history/cycle20_methodology_refinement.md) | **Methodology refinement** (doc-only post-closure self-assessment): 4 improvements codified (Principle #12 BINDING + #17 family elimination + composite-binding §8 + Phase 0 power gate). 8 verdicts Reject → Inconclusive-underpowered. Cumulative claim refined to 5-level scheme. |
| 21 | [cycle21_hierarchical_bayesian.md](history/cycle21_hierarchical_bayesian.md) | **Hierarchical Bayesian** (Hướng B) — 9/9 Reject. 2 split-half direction flips Power 6/55 (Sharp + Lazy forward +1.6pp noise signature). Bayesian family broadly eliminated §7.5. Chu kỳ 20 methodology rules applied cleanly. |
| **22** | [cycle22_optimization_mode.md](history/cycle22_optimization_mode.md) | **Optimization Mode Phase O-1 + O-2** — first cycle post-closure user-facing work. 3 composite profiles methodology codified ([optimization/MEASUREMENT.md](optimization/MEASUREMENT.md)). Fresh re-backtest 12 matrix + 17 3D strategies với split-half segments. UI shipped với 3 new TS strategies + `/research/cycle22` page + glossary C22 section. |
| **23** | [cycle23_app_refactor.md](history/cycle23_app_refactor.md) | **App-wide UX Refactor** — 4 phases shipped 2026-04-22 theo 7 user feedback issues. Badge taxonomy reset (3 pick badges only). `/research/cycle22` route removed → inline vào `/research`. Data module `cycle22-data.ts` retained. Time-to-first-suggestion 20s→8s. No research mechanism change. |
| **24** | [cycle24_budget_aware.md](history/cycle24_budget_aware.md) | **Budget-aware Portfolio** — allocator + `vietlott-budget` CLI + BudgetWidget UI @ B=100K × 5 products. 44 portfolio candidates × 5-term composite. Max 3D composite winner (+1.200). Null-pick products ship với disclosure banner. Pre-reg amended 50K→100K pre-execution. No Accept/Reject claims. |
| **25** | [cycle25_method_evaluation_framework.md](history/cycle25_method_evaluation_framework.md) | **Method Evaluation Framework + Tier-1** — generic 6-dim evaluator + 13 method specs × 5 products × 4 segments. Gambler's fallacy "số gan" REFALSIFIED. A1b / F7 Inconclusive signals flagged for Chu kỳ 28 replication. Psychology metrics (pain streak, ruin prob, ticks-to-first-hit) shipped. Framework reusable Chu kỳ 26-28. |
| **26** | [cycle26_tier2_wheeling_3d_permutations.md](history/cycle26_tier2_wheeling_3d_permutations.md) | **Tier-2 Wheeling + 3D Permutations** — framework extension (5 new bet_size types + 4 filters) + 12 Tier-2 specs. Wheeling boosts P(hit) 1.6-5× but ROI tied Random. C5 fw+rv hedge 3D Pro failed forward gate (variance trap). Filter-based methods = noise. 9 Tier-2 methods added (35/73 tested). |
| **27** | [cycle27_tier3_compounding_calendar.md](history/cycle27_tier3_compounding_calendar.md) | **Tier-3 Compounding + Calendar + 🚨 C6 A=B SUGGESTIVE** — framework D6+D3+a_equal_b + 9 specs. **C6 A=B Max 3D Pro = +4758% ROI across 4 segments, forward-gate pass — FIRST potentially positive-EV in 27 cycles. Exploits quy chế A=B doubling rule.** Requires Chu kỳ 28 real-world validation before Accept. Compounding G2/G3/G5 = forward-fail (100% bankruptcy). Calendar E = no edge. 9 new methods (44/73 tested). |

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
| 16 | **Retry tree + optionality preservation** — pre-reg phải document Tầng 1 (cycle-level) + Tầng 2 (within-paradigm) alternatives với trigger conditions | 17 (meta-review 2026-04-22) | [METHODOLOGY §3.10](METHODOLOGY.md) |
| 17 | **Family-level elimination binding** — new cycles cannot propose mechanisms in eliminated families without citing + evidencing unbind trigger | 20 (2026-04-22, retroactive from 8/13/14/15/16/17/19e) | [METHODOLOGY §3.11](METHODOLOGY.md) + [PROJECT_CLOSURE_REPORT §7.5](PROJECT_CLOSURE_REPORT.md) |

**Principle #12 upgraded BINDING Chu kỳ 20**: Power analysis từ advisory thành binding gate. Reject verdict requires power ≥50%; otherwise `Inconclusive-underpowered`. See [METHODOLOGY §3.6](METHODOLOGY.md) updated + [EVALUATION §6](EVALUATION.md) new verdict row.

**EVALUATION §8 composite-binding BINDING Chu kỳ 20**: Tournament composite score is the decision output. Single-metric verdicts disallowed.

Guardrails bất biến (từ Chu kỳ 1+):
- Walk-forward (no look-ahead)
- Random baseline mandatory
- Pre-registration hypothesis trước implement
- Significance test trên Δ, không bare

---

## Project-Wide Cumulative State (post-Chu kỳ 23)

### Strategies tested
- **Matrix (Power 6/55, Mega 6/45, Lotto 5/35)**: ~34 strategies across cycles 1-6, 9, 14, 15, 16, 19e, 21 (single-ticket + multi-ticket + hierarchical Bayesian)
- **3D (Max 3D, Max 3D Pro)**: **28 strategies** across cycles 4, 6, 7, 8, 11, 12, 13
- **Total**: ~66 strategies × 5 products × 3-gate protocol (cycles 7+)

### Accept / Suggestive tally (breakthrough phase closed)
- **0** scientifically robust Accept across 21 breakthrough cycles (closure formalized Chu kỳ 18)
- **0** current Suggestive (last candidate ExpDecay_Cold eliminated Chu kỳ 9)
- **0** Ship-with-caveats standing (Chu kỳ 12 GBM Max 3D Pro deprecated Chu kỳ 12.5)
- **79 Reject** / **8 Inconclusive-underpowered** / **1 Inconclusive** (5-level scheme post Chu kỳ 20)
- **7 eliminated families** with unbind triggers (Principle #17)

### Optimization phase output (Chu kỳ 22)
- **3 composite profiles** × 5 products ranked (MEASUREMENT §2)
- **3/5 products** valid UI picks (Power 6/55 MinDistance, Power 5/35 Freq_Hot, Max 3D 3-pick diverse)
- **2/5 products** honest null (Mega 6/45 baseline drift, Max 3D Pro regime split)
- **Semantic**: pick = composite winner, không đảm bảo beat Random (Option C, glossary disclosure)

### 3D research line
**DEFINITIVELY CLOSED** sau Chu kỳ 13. Bias real + stable (Chu kỳ 8) nhưng không exploitable bằng bất kỳ paradigm nào đã test (probabilistic, copula, discriminative, pooled). Retry criteria: >500 additional draws (~2027) OR novel bias dimension discovery OR Vietlott RNG methodology audit.

📄 **Full synthesis**: [3d/3D_FINAL_REPORT.md](3d/3D_FINAL_REPORT.md) — 28 strategies × 8 cycles tổng hợp, mechanism analysis, methodology corpus, revisit criteria.

### Matrix research line
**BOTH axes EXHAUSTED (post Chu kỳ 21)** — Win-rate: Path #1 drift falsified (14), Path #3 shared-RNG falsified (15). ROI: Path #2 Kelly concentration ⊥ set-coverage lottery (16, 9/9 Reject Δ up to −28pp). Hierarchical Bayesian (Hướng B, Chu kỳ 21) 9/9 Reject — Bayesian family broadly eliminated. Eliminated families: adaptive/drift, cross-product pool, Kelly concentration, Bayesian (batch + online + hierarchical), HMM regime, GBM@current-features, Hybrid 1S_5R/3S_3R. **No remaining high-probability paths** at current data horizon.

---

## Active / Next Cycle

**Chu kỳ 14 (closed, 2026-04-21, 6/6 Reject)**: Path #1 Online Bayesian. Drift hypothesis falsified. See [cycle14_online_bayesian.md](history/cycle14_online_bayesian.md).

**Chu kỳ 15 (closed, 2026-04-21, 5/6 Reject + 1/6 Inconclusive)**: Path #3 Cross-product Joint Matrix. Shared-RNG falsified on matrix. See [cycle15_cross_product.md](history/cycle15_cross_product.md).

**Chu kỳ 16 (closed, 2026-04-21, 9/9 Reject with Δ up to −28pp)**: Path #2 Kelly Portfolio. Kelly concentration fundamentally mismatches set-coverage lottery structure (RandomN diversification beats Kelly top-M pool). Both axes now null. See [cycle16_kelly_portfolio.md](history/cycle16_kelly_portfolio.md).

**Chu kỳ 17 (closed, 2026-04-22, 6/6 Reject)**: HMM Regime Detection (Hướng C from Kịch bản 2). Paradigm falsified. Principle #16 Retry Tree codified. See [cycle17_hmm_regime.md](history/cycle17_hmm_regime.md).

**Chu kỳ 18 (closed, 2026-04-22)**: **PROJECT CLOSURE**. Terminal artifact: [PROJECT_CLOSURE_REPORT.md](PROJECT_CLOSURE_REPORT.md). Active breakthrough research closed. See [cycle18_closure.md](history/cycle18_closure.md).

**Chu kỳ 19 (closed, 2026-04-22)**: **Post-closure exploration** — 5 mini-cycles (19a FDR / 19b ROI rank / 19c NIST / 19d seasonality / 19e ensemble). +2 new falsifications (seasonality, single+multi ensemble). Methodology gaps §7.4 closed. Closure strengthened. See [cycle19_post_closure_exploration.md](history/cycle19_post_closure_exploration.md).

**Chu kỳ 20 (closed, 2026-04-22)**: **Methodology refinement** — 4 improvements codified across 5 canonical docs. 8 Reject verdicts reclassified to Inconclusive-underpowered. Principle #17 (family elimination binding) added. Principle #12 upgraded BINDING. EVALUATION §8 composite-binding. See [cycle20_methodology_refinement.md](history/cycle20_methodology_refinement.md).

**Chu kỳ 21 (closed, 2026-04-22)**: **Hierarchical Bayesian** (Hướng B unblocked). 9/9 Reject. 2 direction-flip split-half Power 6/55 (Sharp + Lazy). Bayesian family broadly eliminated (batch + online + hierarchical convergent null). Closure §7.5 updated. See [cycle21_hierarchical_bayesian.md](history/cycle21_hierarchical_bayesian.md).

**Chu kỳ 22 (closed, 2026-04-22)**: **Optimization Mode Phase O-1 + O-2 shipped**. 3 composite profiles (WinRate / ROI / Balanced) × 5 products. Fresh re-backtest với split-half on picks. 3/5 products valid picks, 2/5 null honest. UI shipped: 3 new TS strategies + `/research/cycle22` full-rankings page + glossary C22 section + `PRODUCT_RANKS` 3-pick structure. Canonical methodology codified trong [optimization/MEASUREMENT.md](optimization/MEASUREMENT.md). See [cycle22_optimization_mode.md](history/cycle22_optimization_mode.md).

**Chu kỳ 23 (closed, 2026-04-22)**: **App-wide UX Refactor**. 4 phases theo 7 user feedback issues. Badge taxonomy reset (max 3 pick badges), `/research` rewrite 867→250 lines, `/research/cycle22` route deleted (merged inline vào `/research`), `/suggest` compact header + Generate up-front. Time-to-first-suggestion 20s→8s. Original Chu kỳ 23 budget-aware plan pushed to Chu kỳ 24. No new research mechanism. See [cycle23_app_refactor.md](history/cycle23_app_refactor.md).

**Chu kỳ 24 (closed, 2026-04-24)**: **Budget-aware Portfolio (UC2)**. Allocator + `vietlott-budget` CLI + BudgetWidget UI shipped @ B=100K × 5 products. 44 portfolio candidates ranked by 5-term composite; null-pick products (Mega 6/45, Max 3D Pro) ship với explicit disclosure banner. Pre-reg amended 50K→100K before execution. Phase A 3D Pro audit prerequisite integrated. See [cycle24_budget_aware.md](history/cycle24_budget_aware.md).

**Chu kỳ 25 (closed, 2026-04-24)**: **Method Evaluation Framework + Tier-1**. Generic 6-dim method-spec evaluator shipped (`methods_evaluator.py`). 13 method specs × 5 products × 4 segments. Gambler's fallacy "số gan" REFALSIFIED (F1 cold persistence −5 to −8 pp vs Random matrix). A1b fixed FreqWholeHot Max 3D +4.8 pp (small Suggestive). F7 K=50 × Power 5/35 +10.8 pp Inconclusive. Psychology metrics shipped (pain streak 100% all products, ruin B=500K/N=100 = 85-100%). 9/73 Tier-1 methods tested; 47 remaining Chu kỳ 26-28. See [cycle25_method_evaluation_framework.md](history/cycle25_method_evaluation_framework.md) + [BETTING_METHODS_CATALOG.md](BETTING_METHODS_CATALOG.md).

**Chu kỳ 26 (closed, 2026-04-24)**: **Tier-2 Wheeling + 3D Permutations**. Framework extended (5 new bet_size types + 4 filters + CLI flags). 12 method specs × applicable products. Wheeling boosts P(hit) 1.6-5× but ROI tied Random (confirms lottery math). Filter-based methods = statistical noise. C1 bao lô 6 hoán vị Max 3D: P(hit) 5× Random, ROI tied. **C5 forward+reverse hedge 3D Pro** apparent full +34.5pp nhưng forward-gate FAIL (Principle #13 caught variance trap). No Accept/Suggestive. 9 new Tier-2 methods added (35/73 tested). See [cycle26_tier2_wheeling_3d_permutations.md](history/cycle26_tier2_wheeling_3d_permutations.md).

**Chu kỳ 27 (closed, 2026-04-24)**: **🚨 Tier-3 Compounding + Calendar + C6 A=B Exploit**. Framework extended với D6 compounding + D3 weekly + a_equal_b. 9 method specs × applicable products. **HEADLINE**: C6 A=B Max 3D Pro = +4758% ROI consistent 4 segments, forward-gate PASS, 0% ruin B=1M — **FIRST potentially positive-EV finding in 27 cycles**. Exploit quy chế A=B doubling rule. Random BEATS TierWeighted (+322pp). Principle #14 flag fired, resolved via theoretical EV match (+4180% predicted ≈ observed). **SUGGESTIVE pending Chu kỳ 28 real-world validation before Accept**. Compounding G2/G3/G5 forward-gate FAIL (100% bankruptcy B=1M, cautionary). Calendar E = no EV. 9 new methods (44/73 tested). See [cycle27_tier3_compounding_calendar.md](history/cycle27_tier3_compounding_calendar.md).

**Next**: **Chu kỳ 28 CRITICAL PRIORITY** — C6 A=B real-world validation (external ticket trial + Vietlott UI feasibility + N_RUNS=200 replication). Also meta-analysis + retest Inconclusives + novel hybrid discovery. Effort ~5 ngày.

**Reopen breakthrough**: only on triggers in [PROJECT_CLOSURE_REPORT.md §9](PROJECT_CLOSURE_REPORT.md) (data N≥2000, Vietlott discloses betting volume, novel paradigm paper, null-reversal finding).

Chu kỳ 12 GBM Max 3D Pro deprecated — không ship, không rank. Audit complete.

---

*File restructured 2026-04-21: split into per-cycle files trong [history/](history/). Main file giờ là compact index.*

*Cập nhật lần cuối: 2026-04-24 — Chu kỳ 27 closed. 🚨 C6 A=B Max 3D Pro = +4758% ROI SUGGESTIVE (first positive-EV finding across 27 cycles, exploits quy chế A=B doubling rule, pending Chu kỳ 28 real-world validation). Compounding G2/G3/G5 = forward-fail bankruptcy. Calendar E = no EV. 44/73 methods tested post-27. Cumulative breakthrough state unchanged: 66 strategies, 0 Accept, 79 Reject / 8 Inconclusive-UP / 1 Inconclusive. Post-27: **1 Suggestive (C6 A=B)** awaiting validation.*

# Research — Vietlott Algorithm R&D

Thư mục chứa toàn bộ nghiên cứu, backtest, và dữ liệu phân tích cho hệ thống gợi ý số Vietlott.

## 🎯 Trạng thái hiện tại (2026-04-24) — **Chu kỳ 22 + 23 + 24 + 25 + 26 + 27 shipped** — 🚨 **C6 A=B SUGGESTIVE (first positive-EV in 27 cycles)**

### Active focus: **[optimization/](optimization/)** → user-facing UI deliverables

**Breakthrough research phase CLOSED** (Chu kỳ 1-21, 0 Accept). **Optimization phase active**:
- **Chu kỳ 22** (2026-04-22): Optimization Mode Phase O-1 + O-2 shipped — 3 composite profiles × 5 products + UI 3 new TS strategies + `PRODUCT_RANKS` 3-pick structure.
- **Chu kỳ 23** (2026-04-22): App-wide UX Refactor shipped — 4 phases, badge taxonomy reset, `/research/cycle22` route removed (inline vào `/research`), time-to-first-suggestion 20s→8s.
- **Phase A audit** (2026-04-24): Max 3D Pro 8-tier evaluator fix shipped ([cycle22_3dpro_audit.md](optimization/cycle22_3dpro_audit.md)). Severity 🟢 Low — UI picks were null anyway, no user-visible impact.
- **Chu kỳ 24** (2026-04-24): Budget-aware Portfolio (UC2) shipped — allocator + `vietlott-budget` CLI + BudgetWidget UI @ B=100K × 5 products. Null-pick products surface với disclosure banner.
- **Chu kỳ 25** (2026-04-24): Method Evaluation Framework + Tier-1 shipped — generic 6-dim method-spec evaluator + 13 methods × 5 products. Gambler's fallacy "số gan" REFALSIFIED. Psychology metrics shipped (pain streak, ruin prob, ticks-to-first-hit). Framework reusable Chu kỳ 26-28.
- **Chu kỳ 26** (2026-04-24): Tier-2 Wheeling + 3D Permutations shipped — framework extended (5 new bet_size types + 4 filters) + 12 methods. Wheeling boosts P(hit) 1.6-5× but ROI tied Random. C5 forward+reverse hedge 3D Pro failed forward gate (variance trap).
- **Chu kỳ 27** (2026-04-24): 🚨 **Tier-3 shipped with HEADLINE SUGGESTIVE finding**. Framework extended (D6 compounding + D3 weekly + a_equal_b). 9 methods. **C6 A=B Max 3D Pro = +4758% ROI consistent 4 segments, forward-gate pass — FIRST potentially positive-EV finding in 27 cycles.** Exploits quy chế A=B doubling rule. Pending Chu kỳ 28 real-world validation. Compounding G2/G3/G5 = forward-fail (100% bankruptcy). Calendar E = no EV. See [BETTING_METHODS_CATALOG.md](BETTING_METHODS_CATALOG.md) (73 methods, **44 tested**).

### Primary entry points

| Doc | Purpose |
|---|---|
| [**optimization/README.md**](optimization/README.md) | 🎯 Optimization mode overview + roadmap (Chu kỳ 22+) |
| [**optimization/MEASUREMENT.md**](optimization/MEASUREMENT.md) | 🎯 Canonical measurement methodology (3 composite profiles + split-half on picks + unified 2-tier exclusion + checklist) |
| [optimization/PLAYBOOK.md](optimization/PLAYBOOK.md) | Optimization process (lighter than breakthrough) |
| [optimization/cycle22_rankings.json](optimization/cycle22_rankings.json) | Canonical Chu kỳ 22 output (3 profiles × 5 products) |
| [optimization/cycle22_review.md](optimization/cycle22_review.md) | Chu kỳ 22 diagnostic review |
| [history/cycle22_optimization_mode.md](history/cycle22_optimization_mode.md) | Chu kỳ 22 closure record |
| [history/cycle23_app_refactor.md](history/cycle23_app_refactor.md) | Chu kỳ 23 UX refactor closure record |
| [history/cycle24_budget_aware.md](history/cycle24_budget_aware.md) | Chu kỳ 24 budget-aware portfolio closure record |
| [optimization/cycle24_portfolios.json](optimization/cycle24_portfolios.json) | Canonical Chu kỳ 24 output (5 products × top-3 portfolios @ B=100K) |
| [history/cycle25_method_evaluation_framework.md](history/cycle25_method_evaluation_framework.md) | Chu kỳ 25 framework + Tier-1 closure record |
| [history/cycle26_tier2_wheeling_3d_permutations.md](history/cycle26_tier2_wheeling_3d_permutations.md) | Chu kỳ 26 Tier-2 closure record |
| [history/cycle27_tier3_compounding_calendar.md](history/cycle27_tier3_compounding_calendar.md) | 🚨 Chu kỳ 27 Tier-3 closure record (C6 A=B SUGGESTIVE) |
| [BETTING_METHODS_CATALOG.md](BETTING_METHODS_CATALOG.md) | 73-method catalog (**44 tested**, 29 remaining Chu kỳ 28 + deferred) |
| [optimization/methods_evaluator.py](optimization/methods_evaluator.py) | Generic 6-dim method-spec evaluator (shared Chu kỳ 25-28, extended C26+C27) |
| [optimization/cycle25_results.json](optimization/cycle25_results.json) | Canonical Chu kỳ 25 output (13 methods × 5 products × 4 segments) |
| [optimization/cycle26_results.json](optimization/cycle26_results.json) | Canonical Chu kỳ 26 output (12 Tier-2 methods) |
| [optimization/cycle27_results.json](optimization/cycle27_results.json) | Canonical Chu kỳ 27 output (9 Tier-3 methods) |
| [optimization/cycle25_review.md](optimization/cycle25_review.md) | Chu kỳ 25 diagnostic review + dominance analysis |
| [optimization/cycle26_review.md](optimization/cycle26_review.md) | Chu kỳ 26 diagnostic review + dominance analysis |
| [optimization/cycle27_review.md](optimization/cycle27_review.md) | 🚨 Chu kỳ 27 review với C6 A=B HEADLINE + EV math + Principle #14 analysis |
| [proposals/README.md](proposals/README.md) | Proposals index + TODO list (no pending, awaiting Chu kỳ 28 kickoff — CRITICAL C6 A=B validation) |
| [proposals/executed/](proposals/executed/) | Frozen pre-regs của cycles đã execute (17, 20, 21, 22, 23, 24, 25, 26, 27) |

### Research archive (breakthrough phase terminal)

| Doc | Purpose |
|---|---|
| [PROJECT_CLOSURE_REPORT.md](PROJECT_CLOSURE_REPORT.md) | 🏁 Terminal closure artifact (updated Chu kỳ 19-21) |
| [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) | 27 cycles index (21 breakthrough + 6 optimization) |
| [METHODOLOGY.md](METHODOLOGY.md), [EVALUATION.md](EVALUATION.md), [TESTING.md](TESTING.md), [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md), [BREAKTHROUGH_ROADMAP.md](BREAKTHROUGH_ROADMAP.md) | Canonical breakthrough methodology (reference for reopen triggers) |

### Cumulative result (post Chu kỳ 24)

~66 strategies × 5 products × refined 3-gate =
- **0 strong Accept / 0 Suggestive** (breakthrough null after 21 cycles)
- **79 Reject** / **8 Inconclusive-underpowered** (pending N≥2000-3000 per product, ~2027-2030) / **1 Inconclusive** (Chu kỳ 15 matrix)
- **7 eliminated families** với unbind triggers (Principle #17)

**Optimization output**:
- Chu kỳ 22: 3/5 products có valid UI picks (Power 6/55, Power 5/35, Max 3D), 2/5 honest null (Mega 6/45 baseline drift, Max 3D Pro regime split).
- Chu kỳ 24: 44 portfolio candidates × 5 products ranked @ B=100K. Max 3D composite winner (+1.200 Mixed(PairExploiter+FreqWholeHot, 7:3)). Null-pick products deliver disclosed portfolios ("⚠ Không có edge xác nhận" banner).

**Reopen breakthrough research**: chỉ khi đủ triggers — xem [PROJECT_CLOSURE_REPORT.md §9](PROJECT_CLOSURE_REPORT.md).

## Mục tiêu (historical — Breakthrough Mode, Chu kỳ 10-21)

> **Trạng thái**: Breakthrough phase CLOSED (Chu kỳ 18). Section này giữ cho historical reference + khi re-evaluate reopen criteria. Active focus hiện tại → [Optimization mode](#optimization-mode-active-chu-kỳ-22).

Sau Chu kỳ 9, project đã exhaust discovery mode (25+ strategies, 3/3 Suggestive candidates fail replication). **Pivot Chu kỳ 10** chuyển sang breakthrough mode với priority hierarchy:

1. **PRIMARY** — future win rate (tournament weight 0.40)
2. **SECONDARY** — ROI least-negative (weight 0.30)
3. **GUARDS** — Sharpe + p-value (weights 0.15 + 0.15)

**Approach codified** (Chu kỳ 10-21): Tournament ranking + Forward validation + 7 novel paradigms (Online Bayesian, Cross-product, Copula, Kelly, GBM, HMM, Hierarchical Bayesian) — all tested, all falsified or family-eliminated.

**Guardrails** (non-negotiable, inherited by Optimization): Principles #11 split-half + #12 power + pre-reg + walk-forward + Random baseline.

**Chu kỳ 20 refinement binding**: composite-binding (EVALUATION §8), Principle #17 family elimination, Phase 0 power gate. See [history/cycle20_methodology_refinement.md](history/cycle20_methodology_refinement.md).

> **Lưu ý**: EV âm disclaimer vẫn applies. Reopen breakthrough — xem [§9 triggers](PROJECT_CLOSURE_REPORT.md).

## Optimization Mode (active, Chu kỳ 22+)

**User pivot 2026-04-22**: shift from breakthrough → user-facing Optimization. Deliverables:

| Cycle | Status | Scope |
|:-:|:-:|---|
| 22 | ✅ Shipped 2026-04-22 | 3 composite profiles × 5 products ranking + UI picks shipped |
| 23 | ✅ Shipped 2026-04-22 | App-wide UX refactor (4 phases), `/research/cycle22` route removed |
| 24 | ✅ Shipped 2026-04-24 | Budget-aware portfolio (UC2) @ B=100K — allocator + `vietlott-budget` CLI + BudgetWidget UI |
| 25 | ✅ Shipped 2026-04-24 | Method evaluation framework + Tier-1 (13 methods). Gambler's fallacy refalsified. |
| 26 | ✅ Shipped 2026-04-24 | Tier-2: wheeling + 3D permutations (12 methods). P(hit) ↑ but ROI tied. |
| 27 | ✅ Shipped 2026-04-24 | 🚨 Tier-3: compounding + calendar + **C6 A=B SUGGESTIVE** +4758% ROI (first positive-EV in 27 cycles) |
| 28 | ⏳ **Pending CRITICAL** | C6 A=B real-world validation + N_RUNS=200 + meta-analysis + retest Inconclusives |

Canonical methodology: [optimization/MEASUREMENT.md](optimization/MEASUREMENT.md). Roadmap: [optimization/README.md](optimization/README.md).

## Cấu trúc thư mục

```
research/
├── README.md                       ← Bạn đang đọc file này
├── _significance.py                ← Shared module: z-test, Wilson CI, decision rules
│
│   ── 🎯 ACTIVE: Optimization Mode (Chu kỳ 22+) ──
├── optimization/
│   ├── README.md                              ← Optimization overview + roadmap
│   ├── MEASUREMENT.md                         ← 🎯 Canonical methodology (3 profiles + checklist)
│   ├── PLAYBOOK.md                            ← Optimization process (lighter than breakthrough)
│   ├── cycle22_rebacktest_{matrix,3d}.py      ← Chu kỳ 22 re-backtest scripts
│   ├── cycle22_backtest_{matrix,3d}.json      ← Fresh split-half backtest outputs
│   ├── cycle22_ranking.py                     ← 3-composite ranking script
│   ├── cycle22_rankings.json                  ← Canonical Chu kỳ 22 output (3 profiles × 5 products)
│   ├── cycle22_review.md                      ← Phase O-1 diagnostic review
│   ├── cycle22_3dpro_audit.md                 ← Phase A audit (3D Pro 8-tier evaluator fix, 2026-04-24)
│   ├── cycle22_rebacktest_3dpro_corrected.py  ← Corrected 3D Pro rebacktest
│   ├── cycle22_backtest_3dpro_corrected.json  ← Corrected 3D Pro output (audit)
│   ├── cycle22_3dpro_diff.py + .json          ← 3D Pro rank-diff analyzer
│   ├── cycle24_allocator.py                   ← 🎯 Chu kỳ 24 portfolio allocator
│   └── cycle24_portfolios.json                ← Canonical Chu kỳ 24 output (5 products × top-3 @ B=100K)
│
│   ── Proposals (pre-regs) ──
├── proposals/                      ← Index: [proposals/README.md](proposals/README.md)
│   ├── cycle17a_roi_ranking_3d.md  ← Superseded by cycle22 (historical reference)
│   └── executed/                   ← Frozen pre-regs của completed cycles
│       ├── cycle17_hmm_regime.md
│       ├── cycle20_methodology_refinement.md
│       ├── cycle20_evaluation_checklist.md
│       ├── cycle21_hierarchical_bayesian.md
│       ├── cycle22_optimization_mode.md    ← moved 2026-04-23 after shipment
│       ├── cycle23_app_refactor.md         ← moved 2026-04-23 after shipment
│       └── cycle24_budget_aware.md         ← moved 2026-04-24 after shipment
│
│   ── 🏁 Research archive (breakthrough phase closed Chu kỳ 18) ──
├── PROJECT_CLOSURE_REPORT.md       ← Terminal closure (updated Chu kỳ 19-21)
├── RESEARCH_HISTORY.md             ← 27 cycles index (21 breakthrough + 6 optimization)
│
│   ── Canonical breakthrough methodology (reference) ──
├── METHODOLOGY.md                  ← 5-phase pipeline + Principles #11-#17
├── EVALUATION.md                   ← Metrics + §8 Composite-binding tournament
├── TESTING.md                      ← Bias detection battery (14 matrix / 13 digit)
├── RESEARCH_PLAYBOOK.md            ← Breakthrough template + checklists
├── BREAKTHROUGH_ROADMAP.md         ← Novel R&D paths (mostly falsified)
│
│   ── Post-closure mini-cycle data ──
├── post_closure/                   ← Chu kỳ 19 experiment data (FDR/ROI/NIST/seasonality/ensemble)
│   └── cycle19{a,b,c,d,e}_*.json
│
│   ── Code + kết quả ──
├── matrix/                         ← Sản phẩm ma trận (Power 6/55, Mega 6/45, Lotto 5/35)
│   ├── backtest.py / _results.json           ← Canonical 16 thuật toán walk-forward
│   ├── online_bayesian.py                    ← Chu kỳ 14 shared module
│   ├── kelly_portfolio.py                    ← Chu kỳ 16 shared module
│   ├── cross_product_strategies.py           ← Chu kỳ 15 shared module
│   ├── cycle14_online_bayesian_backtest.py + _results.json
│   ├── cycle15_cross_product_backtest.py + _results.json
│   ├── cycle16_kelly_portfolio_backtest.py + _results.json
│   ├── literature_review.md                  ← Lý thuyết (wheeling, Bayesian, max-entropy…)
│   ├── logs/                                 ← Runtime stdout (cycle14/15/16)
│   ├── power535/                             ← Chu kỳ 5 Phase-B (deep_analysis + parity + wheeling)
│   └── mega645/                              ← Chu kỳ 9 (cycle9_replication)
│
├── 3d/                             ← Sản phẩm 3D (Max 3D, Max 3D Pro)
│   ├── 3D_FINAL_REPORT.md                    ← Synthesis 8 cycles × 28 strategies (CLOSED)
│   ├── deep_analysis.py / .json              ← 13-test RNG Chu kỳ 4 (shared)
│   ├── backtest.py / _results.json           ← 12 thuật toán cơ bản (shared)
│   ├── advanced_backtest.py / _results.json  ← 21 thuật toán nâng cao (shared)
│   ├── copula_strategies.py                  ← Chu kỳ 11 shared module
│   ├── gbm_strategy.py                       ← Chu kỳ 12/12.5 shared module
│   ├── pooled_strategies.py                  ← Chu kỳ 13 shared module
│   ├── cycle7_replication.py + _results.json
│   ├── cycle8_drift_analysis.py + _results.json
│   ├── cycle11_copula_backtest.py + _results.json
│   ├── cycle12_gbm_backtest.py + _results.json
│   ├── cycle12_5_audit.py + _results.json
│   ├── cycle13_pooled_backtest.py + _results.json
│   └── logs/                                 ← Runtime stdout (cycle11/12/12.5/13)
│
├── history/                        ← 23 chu kỳ đã đóng (immutable records)
│   └── cycleNN_<slug>.md           ← cycle01 .. cycle23
│
└── archive/                        ← File superseded (giữ để tham khảo)
    ├── superseded_docs/            ← Docs đã được thay thế
    │   ├── META_REVIEW_POST_CYCLE16.md     ← Decision anchor for Chu kỳ 17 (role subsumed by PROJECT_CLOSURE_REPORT §11 + Chu kỳ 19, moved 2026-04-22)
    │   ├── RESEARCH_DOCUMENTATION.md       ← Technical monolith stale sau Chu kỳ 6 (moved 2026-04-22)
    │   ├── 3d_REPORT_cycle4_snapshot.md    ← 3D Chu kỳ 4 pre-replication (moved 2026-04-22)
    │   ├── RESEARCH_PLAN.md                ← 07/2025 5-phase plan → thay bằng METHODOLOGY + EVALUATION + TESTING
    │   ├── RNG_ANALYSIS_REPORT.md          ← Snapshot 516 draws → thay bằng matrix/power535/deep_analysis
    │   └── Random_Analysis_Agent.md        ← Source system prompt → incorporated vào METHODOLOGY §1.1
    ├── phase1_backtest*.py/.json           ← Phase 1 cũ → dùng matrix/backtest.py
    ├── phase1_analysis_report.md
    ├── phase4_analysis_report.md
    ├── 3d_analysis_report.md
    └── run_new_3d.py
```

## Tài liệu chính (nên đọc theo thứ tự)

### 🎯 Optimization mode (CURRENT FOCUS)

| # | File | Mô tả | Khi nào đọc |
|---|------|--------|-------------|
| 1 | [optimization/README.md](optimization/README.md) | Optimization overview + roadmap Chu kỳ 22-24+ | Entry point for active work |
| 2 | [optimization/MEASUREMENT.md](optimization/MEASUREMENT.md) | Canonical methodology (3 composite profiles + split-half on picks + 2-tier exclusion + checklist) | Before running Optimization cycle |
| 3 | [optimization/PLAYBOOK.md](optimization/PLAYBOOK.md) | Optimization process (lighter 3-phase) | Before running Optimization cycle |
| 4 | [proposals/README.md](proposals/README.md) | Proposals index + TODO (Chu kỳ 24 pending) | Navigation |
| 5 | [proposals/executed/cycle22_optimization_mode.md](proposals/executed/cycle22_optimization_mode.md) | Chu kỳ 22 frozen pre-reg | Historical reference |
| 6 | [proposals/executed/cycle23_app_refactor.md](proposals/executed/cycle23_app_refactor.md) | Chu kỳ 23 frozen pre-reg | Historical reference |

### Canonical breakthrough references (research phase, for reference/reopen)

| # | File | Mô tả | Khi nào đọc |
|---|------|--------|-------------|
| 5 | [METHODOLOGY.md](METHODOLOGY.md) | Pipeline 5-phase + Principles #11-#17 (binding) | Reopen breakthrough OR understand past cycles |
| 6 | [TESTING.md](TESTING.md) | Bias detection battery — 14 matrix / 13 digit tests | Reopen Phase 1 discovery |
| 7 | [EVALUATION.md](EVALUATION.md) | Metrics + §8 Composite-binding tournament | Inherited by Optimization |
| 8 | [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md) | Breakthrough template + checklists | Breakthrough cycles only |
| 9 | [BREAKTHROUGH_ROADMAP.md](BREAKTHROUGH_ROADMAP.md) | 7 novel R&D paths (6 falsified) | Historical roadmap reference |

### Trạng thái hiện tại & decision anchor

| # | File | Mô tả | Khi nào đọc |
|---|------|--------|-------------|
| 0 | [PROJECT_CLOSURE_REPORT.md](PROJECT_CLOSURE_REPORT.md) | 🏁 **Terminal closure artifact** (2026-04-22, updated Chu kỳ 19-21) — 21 breakthrough cycles consolidated, null findings catalog, reopen criteria, utility statement | Đọc ĐẦU TIÊN khi pick up project |
| 0b | [history/cycle20_methodology_refinement.md](history/cycle20_methodology_refinement.md) | ✓ Chu kỳ 20 DONE — post-closure methodology refinement (4 improvements codified) | Khi cần biết rule changes post-Chu kỳ 20 |
| 0c | [history/cycle22_optimization_mode.md](history/cycle22_optimization_mode.md) | ✓ Chu kỳ 22 DONE — Optimization Phase O-1 + O-2 shipped | Current picks state |
| 0d | [history/cycle23_app_refactor.md](history/cycle23_app_refactor.md) | ✓ Chu kỳ 23 DONE — App UX refactor | Current UI state |
| 0e | [proposals/README.md](proposals/README.md) | 📋 Proposals index + TODO list (Chu kỳ 24 pending) | Khi planning next cycle |

### Context & lịch sử

| # | File | Mô tả | Khi nào đọc |
|---|------|--------|-------------|
| 5 | [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) | Index 23 chu kỳ + principles corpus + project-wide cumulative state | Hiểu "tại sao" đằng sau quyết định |
| 6 | [3d/3D_FINAL_REPORT.md](3d/3D_FINAL_REPORT.md) | Synthesis cuối cùng 3D research (28 strategies × 8 cycles, CLOSED) | Khi làm việc với Max 3D/3D Pro |
| 7 | [matrix/literature_review.md](matrix/literature_review.md) | Lý thuyết nền tảng (papers, algorithms) | Khi thiết kế thuật toán mới |
| 8 | [proposals/](proposals/) | Active pre-regs (Chu kỳ 24 pending); [executed/](proposals/executed/) chứa cycles 17/20/21/22/23 | Khi planning next cycle |
| 9 | [archive/superseded_docs/](archive/superseded_docs/) | Historical docs đã thay thế (META_REVIEW_POST_CYCLE16, RESEARCH_DOCUMENTATION, v.v.) | Historical context only |

## Cách chạy backtest

### Ma trận (Power 6/55, Mega 6/45, Lotto 5/35)

```bash
cd website/research
python3 matrix/backtest.py 2>&1 | tee matrix/output.log
```

**Output**: `matrix/backtest_results.json` — 16 thuật toán × 3 sản phẩm × 3 runs

**Phụ thuộc**: numpy, pandas. Đọc dữ liệu từ `data/power655.jsonl`, `data/power645.jsonl`, `data/power535.jsonl`

### Phase-B: Deep Analysis & Wheeling cho Lotto 5/35 (04/2026)

```bash
# 1. Phase 1 — 14-test statistical analysis (Quant Agent methodology)
.venv/bin/python3 website/research/matrix/power535/deep_analysis.py

# 2. Phase 2a — Single-ticket parity strategies (baseline)
.venv/bin/python3 website/research/matrix/power535/parity_backtest.py

# 3. Phase 2b — Multi-ticket wheeling (HybridParityDiv)
.venv/bin/python3 website/research/matrix/power535/wheeling_backtest.py
```

**Phụ thuộc bổ sung**: `scipy` (cho chi², KS, hypergeometric tests):
```bash
uv pip install scipy numpy pandas
```

**Kết quả then chốt** (đã bị REJECT sau Chu kỳ 5 correction): HybridParityDiv raw đạt P(any≥3) = 27.65% ở N=20 (+4.31pp vs Random, p=0.011) nhưng sau sample-size fix p=0.301. Xem [history/cycle05_lotto535_wheeling.md](history/cycle05_lotto535_wheeling.md).

### 3D (Max 3D, Max 3D Pro)

```bash
# Phân tích thống kê sâu (chạy trước nếu dữ liệu mới)
python3 3d/deep_analysis.py 2>&1 | tee 3d/deep_analysis_output.log

# Backtest 12 thuật toán cơ bản
python3 3d/backtest.py 2>&1 | tee 3d/backtest_output.log

# Backtest 11 thuật toán nâng cao (cần scipy)
python3 3d/advanced_backtest.py 2>&1 | tee 3d/advanced_backtest_output.log
```

## Hướng dẫn phát triển

### Thêm thuật toán mới cho Ma trận

1. **Đọc** `RESEARCH_PLAYBOOK.md` để nắm phương pháp luận
2. **Thêm class** mới vào `matrix/backtest.py`:
   ```python
   class NewStrategyModel:
       def __init__(self): ...
       def fit(self, data: pd.DataFrame) -> None: ...
       def predict(self, n_numbers: int) -> list[int]: ...
   ```
3. **Đăng ký** trong dict `strategies` cuối file
4. **Chạy** backtest: `python3 matrix/backtest.py`
5. **Cập nhật** kết quả vào website:
   - `website/src/lib/backtest-data.ts` (dữ liệu bảng)
   - `website/src/app/algorithms/page.tsx` (mô tả thuật toán)
   - `website/src/components/products/SuggestionPanel.tsx` (rankings, nếu tốt hơn top 7)

### Thêm thuật toán mới cho 3D

1. **Đọc** [3d/3D_FINAL_REPORT.md](3d/3D_FINAL_REPORT.md) và `3d/deep_analysis.json` để hiểu dữ liệu
2. **Nếu thuật toán đơn giản**: thêm vào `3d/backtest.py`
3. **Nếu thuật toán nâng cao** (cần scipy): thêm vào `3d/advanced_backtest.py`
4. Cùng quy trình cập nhật website như trên

### Quy tắc backtest (quan trọng!)

- **Walk-forward**: Chỉ dùng dữ liệu quá khứ để dự đoán, KHÔNG nhìn tương lai
- **n_runs ≥ 3**: Trung bình nhiều lần chạy để giảm variance
- **min_history**: Ma trận ≥ 100 draws, 3D ≥ 50 draws
- **seed = 42**: Để kết quả có thể tái tạo
- **So sánh với Random**: Mọi thuật toán phải có baseline Random để so sánh

### Quy trình cập nhật website sau nghiên cứu mới

```
Nghiên cứu xong → Chạy backtest → Cập nhật 3 file website:
  1. backtest-data.ts      (số liệu bảng đánh giá)
  2. algorithms/page.tsx    (mô tả, origin tag)
  3. SuggestionPanel.tsx    (rankings, strategies list — nếu vào top 7)
```

## Danh sách thuật toán hiện tại

### Ma trận (17 thuật toán)

| # | Tên | Loại | Ghi chú |
|---|-----|------|---------|
| 1 | Random | Baseline | Tham chiếu |
| 2 | Freq_Hot | Cơ bản | Chọn số xuất hiện nhiều |
| 3 | Freq_Cold | Cơ bản | Chọn số ít xuất hiện |
| 4 | LongAbsence | Cơ bản | Số vắng lâu nhất |
| 5 | NotRepeat | Cơ bản | Tránh số vừa ra |
| 6 | Pattern | Cơ bản | Cấu trúc chẵn/lẻ/cao/thấp |
| 7 | ExpDecay_Hot | Cơ bản | Exponential decay - hot |
| 8 | ExpDecay_Cold | Cơ bản | Exponential decay - cold |
| 9 | PairFrequency | Cơ bản | Cặp số hay xuất hiện cùng |
| 10 | MixedStrategy | Cơ bản | Kết hợp freq + absence |
| 11 | Bayesian | Mới (AI) | Dirichlet posterior + temperature |
| 12 | Bayes_Sharp | Mới (AI) | Bayesian với temp thấp (sharp) |
| 13 | MaxEntropy | Mới | Tối đa entropy (phủ sóng) |
| 14 | Ensemble | Mới | Kết hợp nhiều model |
| 15 | MinDistance | Mới | Tối đa khoảng cách Hamming |
| 16 | Adaptive | Mới | Tự chọn model tốt nhất gần đây |
| **17** | 🔬 HybridParityDiv | Nghiên cứu (multi-ticket) | 5/35 only, N≥10 — wheeling parity-stratified + max-min Hamming. **Sau Chu kỳ 6 correction: không pass z-test (p=0.301 ở N=20).** Kept as reference implementation; tham khảo [HISTORY §Chu kỳ 5+6](RESEARCH_HISTORY.md) |

### 3D — Cơ bản (12 thuật toán trong `3d/backtest.py`)

| # | Tên | Mô tả |
|---|-----|-------|
| 1 | Random | Baseline |
| 2-3 | Freq_Whole_Hot/Cold | Tần suất toàn bộ số 000-999 |
| 4-5 | Digit_Hot/Cold | Tần suất từng chữ số |
| 6 | Pattern_3D | Mẫu chẵn/lẻ/tổng |
| 7 | Tier_Focus_DB | Tập trung giải đặc biệt |
| 8 | Bayesian_Digit | Bayesian từng chữ số |
| 9 | Bayes_Sharp | Bayesian sharp |
| 10 | Bayesian_Whole | Bayesian toàn bộ 000-999 |
| 11 | MaxEntropy | Tối đa entropy |
| 12 | Adaptive | Tự chọn model + SumRange + Markov |

### 3D — Nâng cao (11 thuật toán trong `3d/advanced_backtest.py`)

| # | Tên | Nguồn gốc |
|---|-----|-----------|
| 1 | JointDigitBias | Nghiên cứu — khai thác phân bố đồng thời |
| 2 | ConditionalChain | Nghiên cứu — xác suất có điều kiện |
| 3 | AdaptiveBiasTracker | Nghiên cứu — theo dõi bias thay đổi |
| 4 | MinimumCoverageSet | Nghiên cứu — phủ sóng tối thiểu |
| 5 | TierWeightedCoverage | Nghiên cứu — phủ theo tier giải |
| 6 | StratifiedDigitSampling | Nghiên cứu — lấy mẫu phân tầng |
| 7 | BayesianJointPosterior | Nghiên cứu — Bayesian joint posterior |
| 8 | MultiSignalEnsemble | Nghiên cứu — ensemble đa tín hiệu |
| 9 | OptimalTicketPortfolio | Nghiên cứu — portfolio tối ưu |
| 10 | ExpectedValueMaximizer | Nghiên cứu — tối đa EV |
| 11 | InformationTheoreticSelector | Nghiên cứu — information theory |

## Kết quả tóm tắt

### Ma trận — Top thuật toán mỗi sản phẩm (updated 2026-04-20, Chu kỳ 9)

| Sản phẩm | Top theo Δ (full-sample) | Δ (avg) | Win% | Full-sample p_raw | Split-half replication | Decision |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Power 6/55 | Bayesian AI | +0.031 | 1.65% | 0.511 | — | **Reject** (không có edge) |
| Mega 6/45 | ExpDecay_Cold | +0.009 | 2.91% | 0.0044 | **half1 Δ=−0.26pp, half2 Δ=+0.37pp → direction flip** | **Reject** (Chu kỳ 9) |
| Mega 6/45 (alt) | Ensemble / Bayesian | +0.007 | 2.58% | 0.046 | not run | Reject (full-sample near-miss) |
| Lotto 5/35 (single) | Adaptive | +0.038 | 1.90% | 0.157 | — | Reject |
| Lotto 5/35 (N=20 wheel) | MinDistanceWheel | +2.66pp | 26.80% | 0.118 | — | Reject |

### 3D — Top thuật toán (Exact Match %, updated 2026-04-20 Chu kỳ 8)

| Sản phẩm | Strategy | Full-sample p | Split-half p1 / p2 | Decision |
|----------|:---:|:---:|:---:|:---:|
| Max 3D | FreqWholeHot | 0.066 (near-miss) | 0.558 / 0.488 | **Reject** (both halves non-sig) |
| Max 3D Pro | EVMaximizer | 0.053 (near-miss) | **0.0007** / 0.865 | **Reject** (base-rate noise, not drift) |

**Tất cả 3D strategies Reject sau replication + drift verification.**

### Project-level status (post Chu kỳ 23, 2026-04-23)

**Breakthrough phase CLOSED (Chu kỳ 18) + Optimization phase ACTIVE (Chu kỳ 22+).**

- ~66 strategies × 5 products × 3-gate protocol → **0 Accept / 0 Suggestive** across 21 breakthrough cycles
- **79 Reject / 8 Inconclusive-underpowered / 1 Inconclusive** (5-level scheme, post Chu kỳ 20)
- **7 eliminated families** (Principle #17 binding): adaptive/drift, cross-product pool, Kelly concentration, Bayesian (batch+online+hierarchical), HMM regime, GBM@current-features, Hybrid 1S_5R/3S_3R
- **3D line CLOSED** (Chu kỳ 13), **Matrix line EXHAUSTED** (post Chu kỳ 21, both win-rate + ROI axes)

### Optimization output (Chu kỳ 22 shipped 2026-04-22)

3 composite profiles (WinRate / ROI / Balanced) × 5 products. UI picks:

| Sản phẩm | picks.winrate | picks.roi | picks.balanced | Collapse | Note |
|---|---|---|---|---|---|
| Power 6/55 | MinDistance | MinDistance | MinDistance | all_three | N=1334 |
| Power 5/35 | Freq_Hot | Freq_Hot | Freq_Hot | all_three | N=543, Δ_win −0.045pp (composite winner) |
| Max 3D | PairExploiter | CoverageOpt | FreqWholeHot | none | Diverse 3-pick |
| Mega 6/45 | — | — | — | — | null (baseline drift) |
| Max 3D Pro | — | — | — | — | null (regime split) |

Semantic (Option C): pick = composite winner, **không đảm bảo beat Random**. Glossary disclosure required. See [history/cycle22_optimization_mode.md](history/cycle22_optimization_mode.md).

### UX state (Chu kỳ 23 shipped 2026-04-22)

Badge taxonomy reset (max 3 pick badges), `/research` rewrite, `/suggest` Generate-first flow, `/research/cycle22` route removed (inline). See [history/cycle23_app_refactor.md](history/cycle23_app_refactor.md).

> **Lưu ý**: Xổ số là hoàn toàn ngẫu nhiên. Không thuật toán nào đảm bảo lợi nhuận. ROI luôn âm.

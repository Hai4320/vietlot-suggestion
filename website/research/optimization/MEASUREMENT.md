# Optimization Mode — Phương pháp đo lường & Checklist đánh giá

> **Mục đích**: Tài liệu canonical cho Optimization mode (Chu kỳ 22+) về (1) cách đo lường, (2) cách chọn picks, (3) exclusion list thống nhất, (4) checklist đánh giá output trước khi ship UI.
>
> **Relation**: Kế thừa [EVALUATION.md §8](../EVALUATION.md) (breakthrough tournament) nhưng bổ sung multi-composite profiles. Mọi divergence được khai báo rõ ở §9.

**Status**: Approved 2026-04-22. Binding cho Chu kỳ 22+.

---

## §1. Metrics (4, z-normalized)

Giữ nguyên set metrics của EVALUATION §8.1 — không thêm/bớt để tránh dimension creep.

| # | Metric | Ký hiệu | Direction | Source |
|:-:|---|---|---|---|
| 1 | Δ win_rate_ge3 (matrix) hoặc Δ exact_match_rate (3D) | `delta_win` | higher better | backtest results JSON |
| 2 | Δ ROI_pct vs Random | `delta_roi` | higher better (less negative) | backtest results JSON |
| 3 | Sharpe ratio | `sharpe` | higher better | backtest results JSON |
| 4 | `-log10(p_value_raw)` vs Random | `neg_log_p` | higher better | significance test output |

**Z-normalization**: Tính z-score trong phạm vi `(product, full-segment)` — tức là tất cả strategies non-excluded của cùng product, dùng full-data segment (most stable, largest n). Không dùng split-half cho composite computation.

---

## §2. Composite profiles (3)

Optimization mode dùng **3 profiles pre-registered** để phục vụ 3 use-case pick khác nhau. Tất cả 3 đều **immutable trong scope của cycle** (principle của §8.2 EVALUATION).

| Profile | w1 (win) | w2 (roi) | w3 (sharpe) | w4 (neg_log_p) | Pick được drive |
|---|:-:|:-:|:-:|:-:|---|
| **WinRate-focused** | **0.60** | 0.20 | 0.10 | 0.10 | `picks.winrate` |
| **ROI-focused** | 0.20 | **0.60** | 0.10 | 0.10 | `picks.roi` |
| **Balanced** | 0.40 | 0.40 | 0.10 | 0.10 | `picks.balanced` |

**Formula chung**:
```
score_profile(s) = w1·z(delta_win) + w2·z(delta_roi) + w3·z(sharpe) + w4·z(neg_log_p)
```

### §2.1 Rationale chọn weights

- **Primary-to-secondary ratio 3:1** trong WinRate/ROI-focused (0.60 vs 0.20) — đủ "thiên lệch" để output khác biệt đáng kể so với Balanced, nhưng không lexicographic (pure max single-metric).
- **Balanced = 40/40** symmetric — không dùng `0.40/0.30` của EVALUATION §8 default để tránh lẫn lộn; 40/40 thể hiện đúng tinh thần "cân bằng cả 2".
- **Guards 0.10 + 0.10** (giảm từ §8 default `0.15 + 0.15`): Optimization mode không có Accept claim → significance guard là **diagnostic**, không decisive. Sharpe tương tự. Free lên 0.10 để primary metric tách rõ hơn.

### §2.2 Divergence với EVALUATION §8

| Aspect | §8 (Breakthrough) | Optimization |
|---|---|---|
| Số composite profiles | 1 (default 0.40/0.30/0.15/0.15) | 3 (WinRate/ROI/Balanced) |
| Immutability | Within cycle | Within cycle, nhưng **cả 3 profiles** frozen cùng lúc |
| Drives decision | Accept/Reject verdict | UI pick selection (descriptive) |
| Guards weight | 0.15 + 0.15 | 0.10 + 0.10 |

**Legitimacy**: Optimization không produce Accept/Reject → §8 binding policy (composite-decision-binding) không bị vi phạm. Nhiều profiles là **pre-registered upfront**, không phải p-hacking trong cycle.

---

## §3. Pick selection logic

### §3.1 Ba picks được phát sinh

Mỗi product (3D + matrix) sinh ra **tối đa 3 picks** từ 3 composite profiles tương ứng:

```
picks.winrate  = argmax over non-excluded strategies of score_WinRate
picks.roi      = argmax over non-excluded strategies of score_ROI
picks.balanced = argmax over non-excluded strategies of score_Balanced
```

**Semantic clarification (user decision 2026-04-22)**: Pick được drive **thuần bởi composite tournament** — không có gate "must beat Random on primary metric". Khi argmax có Δ_primary ≤ 0 (strategy perform kém hoặc ngang Random), vẫn được chọn là "least-bad composite winner". UI label (`🎯 Trúng cao nhất` / `💰 Lỗ ít nhất`) giữ nguyên nhưng **glossary MUST giải thích**: "Pick = best composite score, không đảm bảo beat Random; tham khảo raw metrics trong bảng ranking để đọc đúng".

**Lý do chọn semantic này** (Option C của cycle22_review.md §4):
- Consistent với EVALUATION §8 composite-binding — composite IS decision output
- Honest transparency qua glossary thay vì relabel conditional
- Giữ picks không null → UI có content mọi trường hợp
- User có thể đọc raw Δ_win/Δ_roi trên page full ranking để tự judge

### §3.2 Collapse rules (khi picks trùng strategy)

Ứng dụng chuỗi rule theo thứ tự:

1. **3 picks cùng 1 strategy** → UI hiển thị **1 pick duy nhất** với label `🎯💰⚖ Pick duy nhất` (strategy thống trị cả 3 chiều).
2. **Balanced trùng WinRate** (nhưng ROI khác) → UI hiển thị 2 picks: `🎯 Trúng cao nhất` + `💰 Lỗ ít nhất`. Balanced được omit (không thêm giá trị mới).
3. **Balanced trùng ROI** (nhưng WinRate khác) → tương tự: 2 picks, balanced omit.
4. **WinRate trùng ROI** (nhưng Balanced khác) → UI hiển thị 2 picks: `🎯💰 WinRate+ROI` + `⚖ Cân bằng`. Label hợp nhất winrate+roi.
5. **3 picks khác nhau** → UI hiển thị đủ 3: `🎯 Trúng cao nhất` + `💰 Lỗ ít nhất` + `⚖ Cân bằng`.

### §3.3 Split-half verification (replication gate — Principle #11 light)

**Scope**: verify **trên các pick candidates**, không phải trên top-2 composite.

Với mỗi pick candidate (tối đa 3 strategies sau §3.1):
- Load `half1_Δ` + `half2_Δ` cho `delta_win` và `delta_roi` từ backtest results.
- **Direction consistency test**: `sign(half1_Δ_primary) == sign(half2_Δ_primary)` với `primary` = metric chính của profile (win với WinRate/Balanced, roi với ROI).
- **Nếu flip** (`half1 × half2 < 0`): demote pick đó, chọn **argmax kế tiếp** của same composite profile. Lặp tối đa 3 lần.
- **Nếu 3 lần đều flip**: pick đó = `null`, UI hiển thị "Không có pick đủ tin cậy cho trục này."

**Lý do scope thay đổi**: trong pre-reg cũ split-half verify trên top-2 composite — nhưng max(winrate) hoặc max(roi) có thể không ở top-2 composite. Nếu pick bypass split-half → vi phạm yêu cầu "replicated". Scope mới đảm bảo mọi strategy được surface lên UI đã pass replication light check.

### §3.4 Per-product caveats

- **Power 5/35 (N=543)** có statistical power **~40%** so với Power 6/55. Split-half test dễ flip hơn → xác suất `picks = null` cao hơn. Đây là **honest outcome** theo principle #11, không phải bug. UI cần label rõ "Không có pick đủ tin cậy cho trục này" thay vì ẩn hoặc fallback.
- **Max 3D Pro (N=711)** trung bình — moderate risk null picks.
- **Power 6/55 (N=1334)**, **Mega 6/45 (N=1302)**, **Max 3D (N=1065)** — statistical power đủ, ít khả năng null picks.
- **Composite weights UNIFORM across 5 products** trong Chu kỳ 22 (không per-product weights). Per-product tuning chỉ trigger theo retry 22.3 nếu user research post-ship reveals different priorities.

---

## §4. Exclusion list (unified, 2-tier)

Strategies **KHÔNG được surface** thành bất kỳ pick nào. Gồm 2 tier rõ ràng để trace về nguyên nhân.

### §4.1 Tier 1 — Hard exclude (bằng chứng trực tiếp từ cycle)

| Strategy | Product | Lý do | Source cycle |
|---|---|---|:-:|
| `GBMDigitClassifier` (các variants) | 3D | Overfit confirmed (train vs test divergence) | 12, 12.5 |
| `Kelly_Portfolio_*` (tất cả variants) | Matrix + 3D | Set-coverage ⊥ concentration, Δ ROI = −28pp | 16 |
| `HMM_K2_W20` + `HMM_K2_W40` | Matrix + 3D | Concentration collapse + split-half direction flip | 17 |
| `Hybrid_1S_5R`, `Hybrid_3S_3R` | Matrix | Split-half direction flip | 19e |
| `HierarchicalEB_Sharp` | Power 6/55 | Split-half direction flip | 21 |
| `HierarchicalEB_Lazy` | Power 6/55 | Split-half direction flip | 21 |
| `Single_N6` | Matrix | Insignificant ở tất cả gates | 19e |

### §4.2 Tier 2 — Family eliminated (Principle #17 binding)

Strategies thuộc các **families bị eliminate** tại Chu kỳ 14-21. Có thể ranked cho diagnostic transparency nhưng **cấm surface** vào `picks.*`.

**Matrix** (Power 6/55, 6/45, 5/35):

| Strategy | Family | Source cycle |
|---|---|:-:|
| `AdaptiveWindowStrategy` / `★Adaptive` | Adaptive/drift | 14 |
| `OnlineBayes_λ=0.01` | Online Bayesian / Kalman | 14 |
| `OnlineBayes_λ=0.03` | Online Bayesian / Kalman | 14 |
| `OnlineBayes_λ=0.10` | Online Bayesian / Kalman | 14 |
| `BayesianDirichletStrategy(365, 1.0, 1.0)` / `★Bayesian` | Bayesian batch | 21 (family broadly) |
| `Bayes_Sharp(180, 1.0, 0.5)` / `★Bayes_Sharp` | Bayesian batch | 21 |
| `HierarchicalEB` (default T=1.0) | Hierarchical Bayesian | 21 |

**3D** (Max 3D, Max 3D Pro) — conservative extension 2026-04-22:

| Strategy | Family | Lý do conservative |
|---|---|---|
| `C1: BayesJoint_HL100` | Bayesian (joint-digit posterior) | Bayesian family đã broadly eliminate ở matrix; conservative lump 3D joint cùng họ |
| `C1: BayesJoint_HL150_S` | Bayesian (joint-digit posterior) | Same |
| `A3: AdaptBias_T0.9` | Adaptive/drift | Adaptive family eliminated Chu kỳ 14; `AdaptiveBiasTracker` cùng họ |
| `A3: AdaptBias_T0.7` | Adaptive/drift | Same |

**Rationale conservative extension**: User quyết (2026-04-22) khi mình raise nuance "3D BayesJoint mechanism khác matrix batch Dirichlet". Chọn lump về family thay vì per-mechanism để tránh sunk-cost debate per strategy. Nếu reopen breakthrough với §9 trigger, có thể unbind separate.

**Ensemble family** (`EnsembleBorda`, `C2: MultiSignal`, `ULTIMATE_v1/v2_sharp`) **KHÔNG** exclude — chỉ 2 configs `Hybrid_1S_5R` + `Hybrid_3S_3R` bị Principle #17 binding (Chu kỳ 19e). Ensemble rộng hơn chưa broadly falsified.

### §4.3 Cross-product pooling (N/A)

Cross-product strategies (Chu kỳ 13 + 15) **không** rank-able per-product do đặc tính cross-scope. Tự loại khỏi ranking pool, không cần liệt kê.

### §4.4 Unbind protocol

Tier 2 có thể unbind khi đủ điều kiện §9 [PROJECT_CLOSURE_REPORT](../PROJECT_CLOSURE_REPORT.md). Tier 1 chỉ unbind khi re-backtest với new data cho bằng chứng đảo chiều + pre-registered unbind cycle.

---

## §5. Output schema (`cycleNN_rankings.json`)

File output canonical cho mỗi Optimization cycle:

```json
{
  "cycle": 22,
  "approved_at": "2026-04-22",
  "pre_reg": "proposals/cycle22_optimization_mode.md",
  "exclusion_list_version": "MEASUREMENT.md §4 (2026-04-22)",
  "profiles": {
    "winrate": {"w_win": 0.60, "w_roi": 0.20, "w_sharpe": 0.10, "w_neg_log_p": 0.10},
    "roi":     {"w_win": 0.20, "w_roi": 0.60, "w_sharpe": 0.10, "w_neg_log_p": 0.10},
    "balanced":{"w_win": 0.40, "w_roi": 0.40, "w_sharpe": 0.10, "w_neg_log_p": 0.10}
  },
  "products": {
    "max_3d": {
      "n_strategies_total": 21,
      "n_excluded_tier1": 3,
      "n_excluded_tier2": 4,
      "n_ranked": 14,
      "rankings": {
        "winrate":  [{"strategy": "...", "score": 1.58, "delta_win": 0.012, "delta_roi": -0.15, ...}, ...],
        "roi":      [...],
        "balanced": [...]
      },
      "picks": {
        "winrate":  {"strategy": "...", "source_profile": "winrate",  "split_half_ok": true},
        "roi":      {"strategy": "...", "source_profile": "roi",      "split_half_ok": true},
        "balanced": {"strategy": "...", "source_profile": "balanced", "split_half_ok": true}
      },
      "collapse_applied": "none|winrate_roi|winrate_balanced|roi_balanced|all_three"
    },
    "max_3d_pro": { ... },
    "power_655":  { ... },
    "mega_645":   { ... },
    "power_535":  { ... }
  }
}
```

---

## §6. Checklist đánh giá (pass/fail gates)

Chạy checklist này **trước khi** ship UI changes. Mỗi gate phải pass.

### §6.1 Pre-cycle gates

- [ ] **Pre-reg frozen**: file `proposals/cycleNN_*.md` có `Status: APPROVED` + date
- [ ] **Exclusion list verified**: so khớp với §4 MEASUREMENT.md — không thiếu strategy nào trong code
- [ ] **Composite profiles frozen**: 3 profiles weights declared trong pre-reg, match §2 MEASUREMENT.md
- [ ] **Products scope declared**: list 5 products + N(draws) per product

### §6.2 Phase O-1 gates (ranking)

- [ ] **Backtest data fresh**: results JSONs ≤ 50 draws stale (nếu không, re-run backtest)
- [ ] **Excluded applied**: rankings không chứa Tier 1 + Tier 2 strategies
- [ ] **3 composites computed**: rankings file có đủ `winrate / roi / balanced` cho mỗi product
- [ ] **Z-normalization within-product**: z-score tính trong scope (product, non-excluded), không cross-product
- [ ] **Split-half verified trên 3 picks**: mỗi pick có `split_half_ok` field. Retry ≤ 3 lần khi flip
- [ ] **Collapse rules applied**: `collapse_applied` field match §3.2 logic
- [ ] **Null picks honored**: nếu sau 3 retries vẫn flip, pick = `null` (không force surface)

### §6.3 Phase O-2 gates (ship)

- [ ] **SuggestionPanel.tsx updated**: `PRODUCT_RANKS[slug].picks` match `cycleNN_rankings.json`
- [ ] **backtest-data.ts updated**: metric values match results JSON
- [ ] **UI labels correct**:
  - `🎯 Trúng cao nhất` (green) cho winrate pick
  - `💰 Lỗ ít nhất` (yellow) cho roi pick
  - `⚖ Cân bằng` (neutral) cho balanced pick
  - Collapsed picks dùng combined labels (§3.2)
  - **CẤM** `🏆 Khuyến nghị` (chỉ hợp lệ khi Accept — không còn khả thi post-closure)
- [ ] **Disclosure banner present** trong affected product pages: "Ranking post Chu kỳ NN. 0 confirmed edge — picks là 'best of null field', không profitable."
- [ ] **Glossary updated**: [/glossary](../../src/app/glossary/page.tsx) có entry "3 composite profiles" giải thích cho user
- [ ] **Build pass**: `make website-build` exit 0
- [ ] **Curl smoke**: all 6 product routes return 200
- [ ] **Visual check**: mỗi product page hiển thị đúng số pick (1/2/3) theo collapse

### §6.4 Honesty gates (cross-cutting)

- [ ] **Không có Accept claim**: UI text không chứa từ khoá "confirmed edge", "statistically significant", "accept", "khuyến nghị" (chỉ exceptions: glossary giải thích terms)
- [ ] **Excluded strategies không leak**: grep `SuggestionPanel.tsx` cho các strategy trong §4 → 0 matches ngoài backtest-data reference
- [ ] **ROI negative disclosed**: mỗi `picks.roi` có ROI% hiển thị (số âm) trong UI — không ẩn
- [ ] **Split-half result transparent**: glossary giải thích "replicated" nghĩa là gì + cách verify

### §6.5 Post-cycle gates

- [ ] **History record written**: `history/cycleNN_optimization_*.md` (compact theo PLAYBOOK template)
- [ ] **Pre-reg moved**: `proposals/cycleNN_*.md` → `proposals/executed/cycleNN_*.md`
- [ ] **Memory updated**: `project_research_state.md` có entry mới cho cycle
- [ ] **Commit follows convention**: `research(cycleNN): optimization — <scope>`

---

## §7. Anti-patterns (specific cho Optimization)

| Anti-pattern | Lý do sai | Fix |
|---|---|---|
| Surface strategy Tier 1 hoặc Tier 2 | Vi phạm exclusion binding | Apply §4 trước khi rank |
| Chọn pick bằng max single-metric không qua composite | Lost interpretability, không trace về profile | Luôn dùng composite profile tương ứng |
| Skip split-half trên picks vì composite top-2 đã check | Pick có thể không ở top-2 composite → uncovered | Split-half **trên picks**, §3.3 |
| Tạo weights mới mid-cycle | p-hacking trá hình | Weights frozen trong pre-reg |
| Label "🏆 Khuyến nghị" | Claim Accept trá hình | Chỉ dùng `🎯` / `💰` / `⚖` |
| Ẩn ROI negative vì "UX khó chấp nhận" | Dishonest | Hiển thị rõ, phần explainer dẫn về glossary |
| Re-backtest excluded strategy để "thử lại" | Sunk-cost variants (vi phạm Principle #17) | Cần pre-registered unbind cycle với §9 trigger |

---

## §8. Principle inheritance

| Principle | Status trong Optimization |
|---|---|
| #11 Split-half replication | **Inherited (light)** — verify trên picks §3.3 |
| #12 Power analysis | **Classification only** — all products exploratory-only, không Accept claim |
| #13 Forward gate | **N/A** — descriptive, không verdict |
| #14 Magnitude sanity (2 directions) | **N/A** — không Reject claim |
| #15 Prediction concentration | **Implicit via Tier 1** — HMM/Hybrid đã exclude vì lý do này |
| #16 Retry tree | **Lighter** — only §3.3 split-half retry (≤3) |
| #17 Family elimination binding | **Inherited** — Tier 2 §4.2 enforce |

---

## §9. Change log

| Date | Cycle | Change |
|---|:-:|---|
| 2026-04-22 | 22 | Document created. 3 composite profiles + unified 2-tier exclusion + split-half on picks |

---

## References

- [EVALUATION.md §8](../EVALUATION.md) — breakthrough tournament composite (§8 default 0.40/0.30/0.15/0.15)
- [METHODOLOGY.md](../METHODOLOGY.md) — Principles #11-#17 corpus
- [PROJECT_CLOSURE_REPORT.md §9](../PROJECT_CLOSURE_REPORT.md) — reopen triggers (for Tier 2 unbind)
- [PLAYBOOK.md](PLAYBOOK.md) — Optimization process (3-phase pipeline)
- [README.md](README.md) — workspace overview
- [../../CLAUDE.md](../../CLAUDE.md) — website pick selection rule
- [../../RESEARCH_TO_UI_PLAYBOOK.md](../../RESEARCH_TO_UI_PLAYBOOK.md) — ship UI changes convention

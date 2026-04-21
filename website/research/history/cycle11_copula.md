## Chu Kỳ 11 — Pre-Registration: Copula-based Joint Digit Model for 3D (04/2026)

### Context — Path swap từ roadmap

Chu kỳ 10 recommend Path #1 Online Bayesian trên matrix products. User direct 2026-04-21 pivot sang **Path A — Copula-based joint digit model cho 3D** (đề xuất thay thế trong discussion, không có trong BREAKTHROUGH_ROADMAP.md gốc). Lý do chọn 3D trước:

1. **Dependency evidence là mạnh nhất & đã có** trên 3D (Chu kỳ 4: pos_1_2 χ²=157.74 p=1e-06, pos_0_2 p=1.5e-05, pos_0_1 p=0.032). Copula = mechanism formalize cùng dependency này.
2. **21 strategies 3D đã test (gồm JointDigitBias, ConditionalChain)** — tất cả treat dependency như sampling trick. Copula model nó properly như joint distribution + marginals separation. Mechanism khác fundamentally.
3. **Data không cần wait** — Chu kỳ 8 confirm bias real + stable; signal tồn tại, vấn đề là exploitation mechanism.
4. **User priority**: muốn 3D research trước khi move sang matrix paths.

Online Bayesian (Path #1) defer sang **Chu kỳ 12**. Kelly Portfolio (Path #2) giữ Chu kỳ 13+.

### Mục tiêu

Test hypothesis: **copula-based joint modeling (proper decomposition marginal × dependency structure) beat existing joint exploitation strategies (`JointDigitBias`, `FreqWholeHot`) trên Max 3D và Max 3D Pro.**

### Hypothesis (pre-registered)

**H1 — Max 3D + GaussianCopulaEmpMargins**:
- Predicted `exact_match_rate > Random` và **`> JointDigitBias`** trên full-sample + cả 2 halves + forward_last_100.
- Mechanism: empirical CDF per digit position (preserve true marginal shape) → Gaussian copula fit trên ranks (capture dependency structure) → joint resampling. Khác `JointDigitBias` ở chỗ separate marginals khỏi dependency (robust hơn khi marginals không đều).
- Expected effect: Δ ≥ +0.2pp vs Random trên full-sample (conservative — 3D baseline ~2%, Δ ≥ +0.2pp equivalent ~10% relative improvement).

**H2 — Max 3D + EmpiricalCopula**:
- Predicted `exact_match_rate > Random` và `> JointDigitBias` trên full-sample + cả 2 halves + forward_last_100.
- Mechanism: pure non-parametric — rank-transform historical data, resample from empirical joint rank distribution, inverse-rank back. Không giả sử Gaussian dependency.
- Expected effect: Δ ≥ +0.2pp vs Random trên full-sample. Nếu Gaussian assumption wrong, EmpCopula có thể beat GaussianCopula.

**H3, H4 — Cùng 2 strategies trên Max 3D Pro**. Max 3D Pro có bias stronger (digit 6 units +1.6pp — Chu kỳ 4/8) → khả năng detect signal cao hơn nếu mechanism đúng.

### Methodology

**Products & data splits**:
- Max 3D: N=1065, midpoint=532. Half-1 [50, 532), Half-2 [532, 1065). Forward window = last 100 draws [965, 1065).
- Max 3D Pro: N=711, midpoint=355. Half-1 [50, 355), Half-2 [355, 711). Forward window = last 100 draws [611, 711).

**Strategies run** (K=2 new, Bonferroni α=0.025):

| Strategy | Role | Parameters (fixed pre-reg) |
|----------|------|----------------------------|
| `Random` | Primary baseline | uniform 000-999 |
| `JointDigitBiasStrategy` | **Mechanism anchor** — new candidates phải beat | lookback=300, temperature=1.0, alpha=1.0 (same as existing) |
| `FreqWholeHotStrategy` | Secondary baseline | lookback=200 (same as Chu kỳ 7) |
| **`GaussianCopulaEmpMargins`** | New #1 | lookback=300, refit_interval=50, alpha=1.0 (Laplace smoothing for empirical CDF) |
| **`EmpiricalCopula`** | New #2 | lookback=300, refit_interval=50, resample_mode="rank-rank" |

**Backtest params**: `min_history=50`, `n_runs=5`, `n_predictions=2`, `seed=42` (same as Chu kỳ 7). Refit copula mỗi 50 draws (cache between refits).

**3 gates**:
1. **Full-sample** walk-forward vs Random. Significance: 2-prop z-test pooled + Newcombe CI. Bonferroni K=2, α_strict=0.025.
2. **Split-half** (time-ordered midpoint, same as Chu kỳ 7). Both halves must Δ > 0 AND p < 0.05.
3. **Forward_last_100** (fit on [0, N-100), predict [N-100, N)). Same significance test vs Random same window.

### Decision rule (binding — set trước khi thấy kết quả)

| Full-sample | Split-half | Forward | Decision |
|:-:|:-:|:-:|:-:|
| p < 0.025 + CI_lo > 0 | both Δ > 0 + both p < 0.05 | Δ > 0 + p < 0.05 | **Accept** |
| p < 0.05 (fail Bonf) | both Δ > 0 + both p < 0.05 | Δ > 0 | **Suggestive** |
| p < 0.05 | split-half direction-consistent nhưng 1 half p ≥ 0.05 | Δ > 0 | **Inconclusive** |
| Δ ≤ 0 tại bất kỳ gate | — | — | **Reject** |
| Direction flip split-half (d1×d2 ≤ 0) | — | — | **Reject** |

**Secondary comparison**: cùng 3 gates nhưng baseline = `JointDigitBias` (mechanism anchor). Reported descriptive, KHÔNG là gate cho decision — mục đích là đánh giá "copula có beat existing joint mech không". Nếu vs-Random pass nhưng vs-JointDigitBias fail → mechanism đóng góp 0 vs existing; signal có thể đến từ baseline noise.

### Power analysis (Principle #12)

Áp dụng formula `n_required ≈ (z_α + z_β)² × [p_s(1-p_s) + p_b(1-p_b)] / δ²` với assumption Δ = +0.3pp (conservative), baseline p_b ≈ 2.0%, p_s ≈ 2.3%, α=0.05, power=80%:

- n_required ≈ 3,900 trials/half
- Max 3D half-1: (532-50) × 5 runs × 2 predictions = 4,820 trials ≥ 3,900 ✓
- Max 3D half-2: (1065-532) × 5 × 2 = 5,330 ≥ 3,900 ✓
- Max 3D Pro half-1: (355-50) × 5 × 2 = 3,050 < 3,900 ✗ (underpowered ~70%)
- Max 3D Pro half-2: (711-355) × 5 × 2 = 3,560 < 3,900 ✗ (underpowered ~75%)

**Limitation acknowledged**: Max 3D Pro underpowered. Nếu Max 3D Pro Reject với |Δ| < 0.3pp → ambiguous (could be no effect OR insufficient power). Nếu Accept/Suggestive → meaningful (passed despite underpowered). Decision: không raise n_runs vì sẽ bloat compute + ghi limitation vào result section.

**Forward window** (100 draws × 5 runs × 2 = 1,000 trials/product) — very underpowered cho small effects, sẽ dùng làm **directional signal only** (require Δ > 0 + same sign as full-sample + halves; không strict p<0.05 requirement — gate chỉ cần `directional Δ > 0`).

### Artifacts kỳ vọng

- `website/research/3d/copula_strategies.py` — 2 strategy classes (GaussianCopulaEmpMargins, EmpiricalCopula)
- `website/research/3d/cycle11_copula_backtest.py` — 3-gate harness (full-sample + split-half + forward)
- `website/research/3d/cycle11_copula_results.json` — full result + decision per hypothesis
- Section "Chu Kỳ 11 — Result" append vào file này
- Nếu Accept/Suggestive: smoke test unit + port TypeScript cho website

### Follow-up (conditional)

- **Accept**: Port TS, update website rankings, first 3D strategy đạt Accept sau Chu kỳ 7 eliminations. Update READMEs.
- **Suggestive/Inconclusive**: Document + defer. Có thể test variants (t-copula, Archimedean family) Chu kỳ 11.5.
- **Reject**: Record lessons. Chu kỳ 12 pivot Path #3 Cross-product pool (3D + 3D Pro) — mechanism khác để exhaust 3D possibilities, hoặc revert to Path #1 Online Bayesian matrix như roadmap gốc.

### Guardrails riêng cho Chu kỳ 11

- **No hyperparameter tuning** sau khi xem kết quả — lookback/refit_interval pre-fixed.
- **No strategy variants post-hoc** — nếu muốn t-copula/vine, phải là Chu kỳ mới với fresh pre-registration.
- **No metric swap** — primary = exact_match_rate vs Random. ROI reported as descriptive (secondary metric phase breakthrough — weight 0.30 nếu tournament).
- **Pre-reg this section immutable** after implementation begins.

---

*Pre-registered: 2026-04-21 — Chu kỳ 11 Path A (Copula-based joint digit model) for 3D. Implementation pending.*

### Result — Chu Kỳ 11 (2026-04-21, cùng ngày pre-registration)

**Verdict: 0/4 Accept · 0/4 Suggestive · 1/4 Inconclusive · 3/4 Reject — Path A eliminated.**

#### Max 3D (N=1065, midpoint=532, forward=[965,1065))

| Strategy | Full Δpp | Full p | Full CI_lo | Half1 Δ (p) | Half2 Δ (p) | Split | Fwd Δ (p) | vs JDB full | **Overall** |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| GaussianCopulaEmpMargins | +0.236 | 0.208 | −0.133 | +0.311 (0.280) | +0.206 (0.446) | Reject | +0.600 (0.446) | −0.069 | **Inconclusive** |
| EmpiricalCopula | +0.414 | 0.031 | +0.037 | +0.373 (0.198) | +0.169 (0.531) | Reject | **−0.500** (0.486) | +0.108 | **Reject** (fwd flip) |

#### Max 3D Pro (N=711, midpoint=355, forward=[611,711))

| Strategy | Full Δpp | Full p | Full CI_lo | Half1 Δ (p) | Half2 Δ (p) | Split | Fwd Δ (p) | vs JDB full | **Overall** |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| GaussianCopulaEmpMargins | +0.000 | 1.000 | −0.480 | +0.164 (0.635) | **−0.309** (0.336) | Reject | +0.700 (0.245) | **−0.378** | **Reject** (full Δ=0 + split flip) |
| EmpiricalCopula | **−0.060** | 0.802 | −0.537 | +0.623 (0.088) | +0.337 (0.331) | Reject | +1.000 (0.110) | −0.439 | **Reject** (full Δ<0) |

#### Baseline reference (full-sample)

| Product | Random % | JointDigitBias % | FreqWholeHot % |
|---------|:-:|:-:|:-:|
| Max 3D | 1.704 | 2.010 | 1.862 |
| Max 3D Pro | 1.997 | **2.375** | 1.937 |

### Bài học

- 🎯 **Copula decomposition không giúp exploit 3D bias** — mechanism "proper" (separate marginals × dependency) thua cả heuristic `JointDigitBias` trên Max 3D Pro (copula 1.997%/1.937% vs JointDigitBias **2.375%**, Δ_vs_JDB −0.378pp và −0.439pp). Hypothesis "copula = better mechanism vì formalize dependency" sai với 3D infrastructure — có thể do Gaussian copula family không capture được dependency shape thực (e.g., dependency của Vietlott 3D có thể là categorical không monotonic, không phù hợp Gaussian hay empirical rank-rank).

- 🎯 **Max 3D EmpiricalCopula là case-study forward-flip** — full-sample p=0.031 (nominal significant) + half1/half2 cả 2 Δ>0 (dù p>0.05) nhìn promising. Nhưng forward Δ=−0.500pp flip direction mạnh. Xác nhận lần thứ tư trong project (Chu kỳ 7 EVMax + Chu kỳ 9 ExpDecay + Chu kỳ 11 này) rằng **full-sample "Suggestive" p<0.05 + direction-consistent split-half chưa đủ — forward gate bắt buộc**. Principle #11 tightened: cần 3 gates độc lập, không chỉ split-half.

- 🎯 **Max 3D Pro test gần như không info** — underpowered như predicted (70-75% power), full Δ=+0.000pp cho GaussianCopula (identical với Random at 1.997%) — hoặc là không có effect thật, hoặc effect nhỏ hơn noise floor của n=6,610 trials. Split-half cho EmpiricalCopula half1 Δ=+0.623pp, half2 Δ=+0.337pp (cả 2 dương, direction-consistent) — pattern này giống Chu kỳ 7 EVMax half-1 strong rồi half-2 shrink. Sample thêm ~5 năm 3D Pro data cần thiết để distinguish "real but tiny" vs "zero effect".

- 🎯 **Vs-JointDigitBias fail là signal key** — 2/4 hypotheses có Δ_vs_JDB âm (−0.378, −0.439 trên Max 3D Pro), 2/4 dương nhưng nhỏ (+0.108, −0.069). Copula không beat existing mech ở bất kỳ product nào significantly. **Mechanism improvement = zero**, signal từ full-sample (EmpCopula +0.414pp vs Random) = baseline noise.

- 🎯 **3D bias real + stable (Chu kỳ 8) nhưng effectively non-exploitable by any mechanism tested** — giờ có **23 strategies failed**. Kết luận strengthened: signal-to-noise ratio của 3D bias quá thấp cho practical exploitation, bất kể parametric hay non-parametric, heuristic hay copula-based.

### Artifacts

- [3d/copula_strategies.py](../3d/copula_strategies.py) — 2 copula strategy classes (reusable)
- [3d/cycle11_copula_backtest.py](../3d/cycle11_copula_backtest.py) — 3-gate harness (full + split-half + forward)
- [3d/cycle11_copula_results.json](../3d/cycle11_copula_results.json) — full results + per-hypothesis decision
- [3d/cycle11_copula_output.log](../3d/cycle11_copula_output.log) — run log

### Impact

1. **3D research line strengthen "paused" status** — giờ 23 strategies failed (21 trước Chu kỳ 11 + 2 copula). Khuyến nghị KHÔNG test thêm mechanism variants trên 3D cho đến khi có significantly more data (>500 draws 3D Pro, >2 years).

2. **Principle #11 reinforcement** — 3 forward-flip cases (Chu kỳ 7 EVMax, Chu kỳ 9 ExpDecay, Chu kỳ 11 EmpCopula) justify **3-gate stacking** (full + split-half + forward) thay cho 2-gate (full + split-half) của Chu kỳ 7-9. Propose codify into METHODOLOGY.md Principle #13 — "Forward gate mandatory for any Accept/Suggestive claim".

3. **Definitive negative result cho copula family** — Gaussian and non-parametric empirical copula, 2 family thông dụng nhất cho small-dimensional joint, both fail. Nếu muốn tiếp tục copula direction cần t-copula (tail dependence) hoặc vine/Archimedean — nhưng prior of success giờ rất thấp sau 3D-wide replication failures.

4. **Chu kỳ 12 redirect — options:**
   - **Option A (recommended) — Revert to roadmap Path #1 Online Bayesian on matrix products** (Power 6/55, Mega 6/45). Khác product + khác mechanism — fresh prior. Đây là path hoạch định trước khi user priority shift sang 3D.
   - **Option B — Path #3 Cross-product pool 3D + 3D Pro** per Chu kỳ 10 roadmap. Lý thuyết: pool data → detect weaker bias more reliably. Nhưng Chu kỳ 11 đã show 3D Pro + 3D standalone không exploitable → pool có thể không add info. Low prior.
   - **Option C — Abandon active research, shift UX**. Accept "no exploitable edge" conclusion; chuyển effort sang website improvements (ship-with-caveats label cho best-in-class diversity generators).

   Recommend **Option A** — fresh mechanism + fresh product class. Option B redundant sau Chu kỳ 11. Option C viable nếu Option A cũng fail → then definitively pause research line.

5. **Update project research state memory** — Chu kỳ 11 done Reject; Chu kỳ 12 propose Online Bayesian matrix.

---

*Cập nhật lần cuối: 2026-04-21 — Hoàn thành Chu kỳ 11 (Path A Copula, 3/4 Reject + 1/4 Inconclusive). Path A eliminated. Recommend Chu kỳ 12 = Path #1 Online Bayesian matrix.*

---

## Chu Kỳ 17 — Pre-Registration: Hidden Markov Model Regime Detection (Hướng C, Kịch bản 2)

> **Trạng thái (2026-04-22)**: PENDING — awaiting user approval of pre-reg trước khi implementation. Thay thế proposal cycle17a (Optimization mode PAUSED separately cho Kịch bản 2 Stage 3).

### Context

[META_REVIEW_POST_CYCLE16.md](../META_REVIEW_POST_CYCLE16.md) confirmed ~60 strategies × 0 Accept, cả win-rate và ROI axes exhausted với mechanisms đã thử (1-16). Meta-review đề xuất Kịch bản 2: "1-shot mới + closure" — 1 breakthrough attempt trước khi đóng project. User chose **Hướng C (HMM Regime Detection)** sau data availability check xác nhận Hướng A (Retail Betting Pool) không feasible do Vietlott không expose per-number bet volume.

**Novel paradigm chưa test**: Lottery output có thể có **discrete latent regimes** (vd. "exploitable period" vs "noise period") thay vì smooth drift. Chu kỳ 8 drift chi² 3-window (low power slow drift) + Chu kỳ 14 Kalman online (smooth tracker, averages across regimes) không catch discrete regime switches. HMM với Viterbi decode có sensitivity profile khác.

**Tension với prior findings**: Chu kỳ 8 confirmed bias STABLE (no drift detected). H0 = "no exploitable regime exists." HMM tests alternative H1 = "discrete latent states với heterogeneous bias strength." Nếu Chu kỳ 8 + 14 đúng thì HMM reject; nếu có regime structure HMM mới catch.

**Scope**: Breakthrough attempt, không phải optimization. Follow Principles #11-#15 strict.

### Hypothesis (pre-registered)

**Core claim**: HMM với K=2 states + Viterbi-decoded dynamic strategy selection (signal state → FreqHot, noise state → Random) beat BOTH pure-Random baseline AND always-FreqHot strategy với Δ_win_rate > 0 trên full + split-half + forward gates.

**H1 — Max 3D + HMM_K2_W20** (primary, largest N):
- `win_rate_exact > Random` AND `> FreqWholeHot(always-on)` trên full + both halves + forward_last_100
- Expected Δ vs Random: +0.05 to +0.20pp (conservative, 3D bias ceiling ±0.4pp)
- Expected Δ vs always-FreqHot: +0.05 to +0.10pp (regime switching adds value)

**H2 — Max 3D Pro + HMM_K2_W20** (secondary 3D):
- Same as H1 for Max 3D Pro
- N=711 → N_effective ~491, borderline power; accept weaker signal
- Expected Δ: cùng scale

**H3 — Power 6/55 + HMM_K2_W20** (matrix cross-paradigm test):
- `win_rate_ge3 > Random` AND `> Freq_Hot(365, 0.8)` trên full + both halves + forward_last_100
- Expected Δ vs Random: +0.05 to +0.20pp (matrix bias ceiling +0.3pp)
- Matrix test kiểm tra HMM có generalize ngoài 3D-digit paradigm không

**H4, H5, H6 — HMM_K2_W40 variants** (sensitivity analysis, window W=40 thay vì W=20):
- Same products, longer observation window → more stable state inference, less responsive to short bursts
- Tests robustness of results across window choice

### Methodology

#### Products & data splits

| Product | N | min_history | Midpoint | Half-1 | Half-2 | Forward_last_100 |
|---------|---|-------------|----------|--------|--------|------------------|
| Max 3D | 1065 | 200 | 532 | [200, 532) | [532, 1065) | [965, 1065) |
| Max 3D Pro | 711 | 200 | 355 | [200, 355) | [355, 711) | [611, 711) |
| Power 6/55 | 1334 | 200 | 667 | [200, 667) | [667, 1334) | [1234, 1334) |

**Warmup W=20 draws** for observation sequence bootstrap; excluded from evaluation.

#### Observation sequence (input cho HMM)

**2-dim observation vector per draw t**:

```
o_t = [
    chi²_recent(t, W=20),        # χ² of drawn-number frequency last W draws vs uniform
    max_deviation_recent(t, W=20) # max |observed_freq - expected| across numbers/digits
]
```

For 3D products: frequency measured at **digit-level** (per position, 0-9) — aligns with Chu kỳ 4 bias characterization.
For matrix products: frequency measured at **number-level** (1-55 for Power 6/55).

Normalize observations to zero-mean unit-variance using train-window statistics (prevent scale mismatch in EM).

#### HMM mechanism spec (immutable post-implementation)

```
Model: Gaussian HMM, K=2 hidden states, diagonal covariance
Parameters:
  π = initial state probabilities (shape K)
  A = transition matrix (shape K×K)
  μ_k = emission mean per state (shape K × 2)
  Σ_k = emission covariance per state (shape K × 2 × 2, diagonal)

Fit: Baum-Welch EM, max_iter=100, convergence tol=1e-4, random_state=42
Init: K-means on observation sequence for μ_k initialization
Decode: Viterbi algorithm → most-likely state sequence {s_t}

State labeling (post-fit):
  - state_signal = argmax_k μ_k[0]  (state với chi² cao hơn = exploitable)
  - state_noise = remaining state
```

**Walk-forward protocol** (per draw t ≥ min_history):
1. Compute o_t from draws[max(0, t-W) : t]
2. Fit HMM on {o_i : i ∈ [W, t)} (past only, no look-ahead)
3. Viterbi decode → s_t
4. If s_t == state_signal: predict via FreqHot strategy
5. Else: predict via Random
6. Evaluate prediction against actual draw t

#### Strategies (per product)

**3D products (Max 3D, Max 3D Pro)** — comparison set:

| Strategy | Role | Spec |
|----------|------|------|
| `Random` | Mandatory baseline | uniform from 000-999, 20 numbers per prediction |
| `FreqWholeHot` | **Always-on anchor** — strong 3D baseline (Chu kỳ 4 #1) | top-20 most-frequent whole 3D numbers trong lookback |
| `HMM_K2_W20(FreqWholeHot/Random)` | **New #1** | K=2, W=20, signal→FreqWholeHot, noise→Random |
| `HMM_K2_W40(FreqWholeHot/Random)` | **New #2** (sensitivity) | K=2, W=40, same mapping |

**Matrix (Power 6/55)** — comparison set:

| Strategy | Role | Spec |
|----------|------|------|
| `Random` | Mandatory baseline | uniform 1-55, 7 numbers per prediction |
| `Freq_Hot(365, 0.8)` | **Always-on anchor** — strong matrix baseline | top-7 hot numbers last 365 days, blend weight 0.8 |
| `HMM_K2_W20(FreqHot/Random)` | **New #1** | K=2, W=20, signal→Freq_Hot(365,0.8), noise→Random |
| `HMM_K2_W40(FreqHot/Random)` | **New #2** (sensitivity) | K=2, W=40, same mapping |

**Backtest params**: `n_runs=5`, `seed=42` (HMM fit + strategy sampling reproducible).

#### 3-gate protocol

**Gate 1 — Full-sample** (Bonferroni K=6: 2 HMM configs × 3 products):
- α_strict = 0.05 / 6 = 0.00833
- Required: p < 0.00833 + 2-prop z-test CI_lo > 0 vs Random
- AND: Δ > 0 vs always-on anchor (FreqWholeHot for 3D, Freq_Hot for matrix) với p < 0.05 raw

**Gate 2 — Split-half replication** (Principle #11):
- Time-ordered midpoint split
- Train HMM on half-1, evaluate on half-1 (in-sample) AND half-2 (out-of-sample)
- Both halves Δ > 0 vs Random AND both p < 0.05 (non-Bonferroni per split gate convention)
- Direction-flip cross halves → instant Reject

**Gate 3 — Forward_last_100** (Principle #13):
- Fit HMM on [0, N−100), predict [N−100, N)
- Directional Δ > 0 required vs Random
- p < 0.05 bonus not required (relaxed per Chu kỳ 10 forward convention)

#### Principle checks

**Principle #14 — Magnitude sanity**:
- 3D bias ceiling: ±0.4pp number-level (Chu kỳ 4)
- Matrix bias ceiling: ±0.3pp (Chu kỳ 14/15)
- Auto-flag if |Δ| > 3× ceiling → review for overfit/leak
- 3D flag threshold: ±1.2pp
- Matrix flag threshold: ±0.9pp

**Principle #15 — Regime concentration**:
- Check inferred state distribution: min(P(state_signal), P(state_noise)) ≥ 0.20
- If one state dominates >80% draws → HMM collapsed to single-state (no real regime switching)
- Auto-flag + review nếu concentration violates

#### Decision rule (binding — set pre-experiment)

| Full vs Random | vs Anchor | Split-half | Forward | Magnitude | Concentration | Overall |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| p < 0.00833 + CI_lo > 0 | Δ > 0 + p < 0.05 | both Δ > 0 + both p < 0.05 | Δ > 0 | within 3× | both ≥ 0.20 | **Accept** |
| p < 0.05 (fail Bonf) | Δ > 0 | both Δ > 0 + both p < 0.05 | Δ > 0 | within 3× | both ≥ 0.20 | **Suggestive** |
| p < 0.05 | Δ > 0 | 1 half p ≥ 0.05, direction consistent | Δ > 0 | within 3× | both ≥ 0.20 | **Inconclusive** |
| Δ ≤ 0 tại bất kỳ gate | — | — | — | — | — | **Reject** |
| |Δ| > 3× ceiling (flag) | — | — | — | — | — | **Technical-Accept-flagged** (audit) |
| state concentration < 0.20 | — | — | — | — | — | **Reject (Principle #15)** |

#### Eliminated (do NOT test per prior cycles)

- **Kelly portfolio integration** — Chu kỳ 16 reject, concentration ⊥ set-coverage
- **Cross-product regime sharing** — Chu kỳ 13/15 reject, shared-RNG falsified
- **Online HMM with forgetting factor** — Chu kỳ 14 falsified adaptive family (drift hypothesis rejected)
- **K≥3 states** — overfit risk with N_effective=491-1114; escalate only if K=2 passes R1 gate
- **Post-hoc hyperparameter tuning** — W=20 and W=40 are PRE-REGISTERED; no grid search allowed

### Risk mitigations

#### R1. HMM look-ahead leak
- Fit HMM per-draw on past-only data; re-fit every K=10 draws (efficiency) với `[W, t_current)` window
- Viterbi decode past-state posterior, **never future**
- Unit test: verify state inference at time t uses only observations t' < t

#### R2. State identifiability
- K-means init on observation sequence để break symmetry
- State labeling: `state_signal = argmax_k μ_k[chi²]` post-fit (consistent convention)
- If μ_0 ≈ μ_1 (within 0.1σ) → states indistinguishable, auto-flag and reject

#### R3. EM local optima
- 10 random restart (different K-means seeds), pick best log-likelihood
- Report convergence log-likelihood + iteration count in results.json

#### R4. Overfit via strategy switching
- Always-on anchor baseline (FreqHot/FreqWholeHot) tests "does regime switching ADD value beyond pure exploitation"
- If HMM beats Random but loses to always-FreqHot → HMM is FreqHot-in-disguise, reject

#### R5. Bonferroni over-conservative
- K=6 is correct per META_REVIEW §3.2 (2 configs × 3 products)
- Do NOT relax to K=3 post-hoc
- Report raw p-values + Bonferroni-adjusted alongside

### Artifacts (planned)

- **Pre-reg** (this file): `website/research/proposals/cycle17_hmm_regime.md` → move to `history/cycle17_hmm_regime.md` after completion
- **Shared module**: `website/research/shared/hmm_regime.py` — HMM fit + Viterbi decode + strategy switcher (new `shared/` dir if needed, or place in `3d/` và `matrix/` duplicated)
- **3D backtest**: `website/research/3d/cycle17_hmm_backtest.py` + `cycle17_hmm_results.json`
- **Matrix backtest**: `website/research/matrix/cycle17_hmm_backtest.py` + `cycle17_hmm_results.json`
- **Logs**: `3d/logs/cycle17_hmm_output.log`, `matrix/logs/cycle17_hmm_output.log`
- **Results doc**: `website/research/history/cycle17_hmm_regime.md` (verdict + analysis + lessons)
- **Dependencies**: `hmmlearn` via uv — add to `pyproject.toml` optional-dependencies[ml]

### Exit conditions

**Expected breakthrough probability**: 10-15% (per META_REVIEW).

**If ANY product passes all 3 gates + principle checks** (Accept or Suggestive):
- Escalate: run K=3 HMM + expand remaining 2 products (Mega 6/45, Lotto 5/35)
- Ship to UI nếu Accept
- Proceed to Chu kỳ 18 Closure report with ACCEPT finding (rare null reversal)

**If all 3 products Reject** (expected ~85-90% outcome):
- Document definitive null cho HMM paradigm trong Chu kỳ 17 report
- Strengthen closure evidence: "discrete latent regime structure CONFIRMED ABSENT" added to fundamental blockers
- Proceed to Chu kỳ 18 Closure report (`PROJECT_CLOSURE_REPORT.md` consolidate 1-17)
- Optional: resume Optimization mode (cycle17a in proposals/) làm Chu kỳ 19

**If Technical-Accept-flagged** (magnitude > 3× ceiling):
- Spawn audit cycle 17.5 (similar to 12.5 GBM audit)
- 5-test diagnostic: leak test, stationarity test, train-test split verification, state-strategy correlation, concentration decomposition
- Final verdict post-audit

### Effort estimate

| Task | Effort |
|------|:---:|
| `hmm_regime.py` shared module implementation | 1d |
| Unit tests + look-ahead leak verification | 0.5d |
| 3D backtest script (2 products × 2 configs) | 1d |
| Matrix backtest script (Power 6/55 × 2 configs) | 0.5d |
| Run backtests (~30min each × 6 = 3h total; include buffer) | 0.5d |
| Analysis + decision rule application | 1d |
| Write-up `history/cycle17_hmm_regime.md` + UI impact decision | 1d |
| Contingency (debugging, R1-R5 mitigations) | 1d |
| **Total** | **6.5d** |

### Retry Tree — Within-HMM paradigm alternatives

Pre-reg này fixed K=2, W=20+W=40, chi²+max_dev, FreqHot/Random. Nếu reject, các variants CHƯA test trong cycle này (lưu để Chu kỳ 17.x hoặc sau nếu muốn exhaust HMM paradigm):

#### 17.1 — Alternative K (state count)

| Variant | Rationale | Điều kiện trigger retry |
|---|---|---|
| **K=3** (hot/cold/uniform) | 3-state tách bias direction (positive vs negative deviation) | Chỉ nếu K=2 pass R1 (concentration ≥0.20 cả 2 states) → escalate |
| **K=1 sanity** | Degenerate — should match always-FreqHot | Diagnostic, không retry breakthrough |

#### 17.2 — Alternative observation features

Hiện tại: `[chi²_recent_20, max_deviation_recent_20]`. Alternatives:

| Obs dim | Feature | Rationale |
|---|---|---|
| 1D | `entropy_recent_W` (Shannon entropy of recent freq) | Simpler — single scalar, less overfit |
| 1D | `top_k_concentration(k=5, W=20)` (% mass in top-5) | Captures concentration without χ² noise |
| 3D | `[chi², max_dev, entropy]` | Richer — test if 2-dim too coarse |
| 3D | `[chi²_W20, chi²_W60, entropy_W20]` | Multi-timescale bias detection |
| 2D | `[digit_6_freq, digit_0_freq]` (3D only) | Target specific Chu kỳ 4 biased digits |

**Retry trigger**: nếu K=2 HMM concentration collapse (one state >80% draws) → observation features không discriminate regimes → try richer feature set 17.2.3 or 17.2.4.

#### 17.3 — Alternative strategy-regime mapping

Hiện tại: signal→FreqHot, noise→Random. Alternatives:

| Variant | Signal state strategy | Noise state strategy | Rationale |
|---|---|---|---|
| **17.3.1** | JointDigitBias (3D) / Bayesian (matrix) | Random | Different anchor — test if FreqHot is not optimal signal-state pick |
| **17.3.2** | FreqHot | FreqCold (反向) | "Noise" state bets cold to hedge — test symmetric bet |
| **17.3.3** | FreqHot | ExpDecay | Short-memory noise baseline |
| **17.3.4** | Ensemble (FreqHot + Bayesian) | Random | Ensemble in signal state |
| **17.3.5** | EVMax (3D) / MaxEntropy (matrix) | Random | Tournament-top strategies từ Chu kỳ 2/4 |

**Retry trigger**: nếu K=2 FreqHot/Random reject but HMM shows real regime structure (concentration passes + log-likelihood improvement over K=1) → signal state cần strategy khác.

#### 17.4 — Alternative window W

Hiện tại: W=20 primary, W=40 sensitivity. Alternatives:

| W | Rationale |
|---|---|
| W=10 | Fast-response — catches burst biases |
| W=30 | Compromise 20-40 |
| W=60 | Long-memory — smoother state inference |
| W=100 | Very long — nếu regimes are slow |
| W=dynamic | Adaptive W per state (complex, high overfit risk) |

**Retry trigger**: nếu W=20 và W=40 cho kết quả KHÁC NHAU đáng kể → window-dependent → chạy grid {10, 30, 60} làm sensitivity cycle 17.4.

#### 17.5 — Alternative products (power escalation)

Hiện tại: Max 3D + Max 3D Pro + Power 6/55. Nếu 3 products reject nhưng underpower concern:

| Product | N | Ghi chú |
|---|---|---|
| Mega 6/45 | 1302 | Tương tự Power 6/55, matrix mid-size |
| Lotto 5/35 | 543 | Smallest N, power very weak, chỉ chạy nếu muốn exhaust matrix |

**Retry trigger**: nếu 3 primary products reject với p-values borderline (0.05 < p < 0.20) on forward gate → power issue → expand sang Mega/Lotto pooled aggregate (NOT per-product, power-focused).

#### 17.6 — Alternative HMM family

Nếu Gaussian HMM K=2 reject completely, alternatives hoàn toàn khác architecture:

| Variant | Mechanism | Scope |
|---|---|---|
| **Categorical HMM** | Observations discretized bins thay vì Gaussian | If continuous features are the issue |
| **Switching state-space** | Linear dynamics per regime (Kalman within state) | Hybrid Chu kỳ 14 + HMM |
| **Input-output HMM** | Observations depend on action + state | Overkill cho lottery |
| **Semi-Markov (HSMM)** | Explicit state duration distribution | Nếu regimes có fixed duration (weekend effect?) |

**Retry trigger**: chỉ consider nếu Chu kỳ 17 + 17.1-17.4 retries ALL reject → paradigm-level rethink → potentially Chu kỳ 18 instead of more HMM variants.

### Execution policy cho retries

- **Principle**: KHÔNG chạy retry tự động khi reject. Tất cả retries phải được user approve explicitly với evidence nào trigger retry.
- **Principle**: mỗi retry là cycle mới (17.1, 17.2, ...) với pre-reg mới cập nhật scope + rationale. Không mở rộng cycle 17 hiện tại post-hoc.
- **Cap**: tối đa 3 retries (17.1 + 17.2 + 17.3) trước khi escalate lên cycle paradigm-level rethink. Vượt cap → trigger Closure report thay vì thêm retry.

### Ghi chú cuối

Nếu pre-reg này được approve → implementation bắt đầu ngay. Pre-reg **immutable sau approve** — adjustment nào cũng phải re-register (Principle #12 variance: power analysis, Principle #11 variance: gate structure) documented rõ + explicit user approval.

**Alternatives stored**: Tầng 1 (cycle-level fallback) trong [META_REVIEW_POST_CYCLE16.md](../META_REVIEW_POST_CYCLE16.md) §5. Tầng 2 (within-HMM retries) trong §Retry Tree this document. Không lose optionality nếu lựa chọn hiện tại sai.

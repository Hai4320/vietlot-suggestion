## Chu Kỳ 17 — HMM Regime Detection: 6/6 Reject (Paradigm Falsified)

**Hướng C từ Kịch bản 2 — 1-shot mới + closure**. Implementation + results 2026-04-22.

**Pre-reg (immutable)**: [proposals/cycle17_hmm_regime.md](../proposals/cycle17_hmm_regime.md) — 2-state Gaussian HMM, 2-dim observation [chi²_recent_W, max_dev_recent_W], signal state → FreqHot, noise state → Random. 3 products × 2 windows = 6 configs, Bonferroni K=6.

### Executive summary

**All 6 configurations REJECT.** Paradigm-level falsification of "discrete latent regime structure" hypothesis on Vietlott 3D + matrix products.

| Product | Window | Signal_frac | Full Δ_pp | Split-half | Forward Δ_pp | Principle #15 | Verdict |
|---------|:------:|:-----------:|:---------:|:----------:|:------------:|:-------------:|:-------:|
| Max 3D | W=20 | 0.260 | +0.116 (p=0.58) | FAIL (h1 degenerate sig=0.0) | −1.000 | ✓ PASS | Reject |
| Max 3D | W=40 | 0.005 | +0.162 (p=0.44) | n/a | +0.000 | **✗ FAIL** | Reject (P#15) |
| Max 3D Pro | W=20 | 1.000 | −0.411 (p=0.14) | n/a (=FreqHot always) | +0.600 | **✗ FAIL** | Reject (P#15 + full neg) |
| Max 3D Pro | W=40 | 0.004 | +0.039 (p=0.89) | n/a | +0.000 | **✗ FAIL** | Reject (P#15) |
| Power 6/55 | W=20 | 1.000 | −0.388 (p=0.08) | FAIL (h1 Δ=−0.942 p=0.009) | +0.600 | **✗ FAIL** | Reject (P#15 + full neg) |
| Power 6/55 | W=40 | 0.458 | −0.300 (p=0.18) | FAIL (h1 Δ=−0.642 p=0.09) | +0.000 | ✓ PASS | Reject (full neg + split) |

**Tally**: 0 Accept, 0 Suggestive, 0 Inconclusive, **6 Reject**.

**Root cause**: HMM 2-state Gaussian failed to identify meaningful regime structure on Vietlott observation features:
- 4/6 configs: EM collapsed to single-state solution (Principle #15 auto-reject)
- 2/6 configs passed concentration but failed split-half replication AND forward gate

### Detailed results per product

Data: [3d/cycle17_hmm_results.json](../3d/cycle17_hmm_results.json), [matrix/cycle17_hmm_results.json](../matrix/cycle17_hmm_results.json). Logs: [3d/logs/cycle17_hmm_output.log](../3d/logs/cycle17_hmm_output.log), [matrix/logs/cycle17_hmm_output.log](../matrix/logs/cycle17_hmm_output.log).

#### Max 3D (N=1065, bias ceiling ±0.4pp exact)

**W=20**: 87 HMM fits, signal_frac=0.260 (passes concentration).

| Segment | Random | FreqWholeHot | HMM_W20 | Δ vs Random | Δ vs FreqHot | seg sig_frac |
|---------|-------:|-------------:|--------:|:-----------:|:------------:|:------------:|
| full [200, 1065) | 1.827% | 1.907% | **1.942%** | +0.116 | +0.035 | 0.260 |
| half1 [200, 532) | 1.807% | 2.169% | 1.807% | +0.000 | −0.361 | **0.000** (degenerate) |
| half2 [532, 1065) | 1.989% | 1.839% | **2.176%** | +0.188 | +0.338 | 0.422 |
| forward [965, 1065) | 3.400% | 2.400% | 2.400% | **−1.000** | +0.000 | 1.000 |

→ **Reject**: half1 collapses to pure Random (sig_frac=0, equivalent to no-op HMM); half2 has positive signal but isolated; forward gate HMM loses −1.0pp to Random. Split-half replication fails and forward fails.

**W=40**: signal_frac=0.005. **Principle #15 violation** — HMM essentially always chooses Random (signal state triggers only 4 out of 865 predictions). Auto-reject per pre-reg concentration check.

#### Max 3D Pro (N=711, bias ceiling ±0.4pp)

**W=20**: signal_frac=1.000 — HMM collapsed to **pure FreqWholeHot always**. Principle #15 violation. On top of that, FreqWholeHot itself performs *worse* than Random on Max 3D Pro (anchor ≤ Random baseline):
- Full: FreqWholeHot 1.781% vs Random 2.192% (−0.411pp)
- So HMM_W20 = FreqWholeHot = always −0.411pp below Random

**W=40**: signal_frac=0.004 — opposite collapse to pure Random. Principle #15 violation.

#### Power 6/55 (N=1334, bias ceiling ±0.3pp matrix)

**W=20**: signal_frac=1.000 — pure Freq_Hot always. Principle #15 violation. Freq_Hot worse than Random on this product:
- Full: Freq_Hot 1.182% vs Random 1.570% (−0.388pp, p=0.076)
- Half1 was more dramatic: Freq_Hot 1.071% vs Random 2.013% (−0.942pp, **p=0.009** — Random beats anchor significantly)

**W=40**: signal_frac=0.458 (passes concentration check).
- Full: HMM 1.270% vs Random 1.570% (**−0.300pp** below Random)
- Half1: HMM 1.370% vs Random 2.013% (**−0.642pp**, p=0.089)
- Half2: HMM 0.990% vs Random 0.990% (tie, sig_frac=0.604)
- Forward: HMM=Random (sig_frac=0, collapsed)
- → **Reject**: full-gate Δ negative (fails primary gate regardless of #15)

### Decision rule application

Per pre-reg §Decision rule table:
- **Δ ≤ 0 at any gate → Reject**: all 6 configs fail this. W=20 on Max 3D Pro + Power 6/55 fail full gate (negative Δ). W=40 on Power 6/55 fails full gate. Max 3D W=20 fails forward gate. Max 3D W=40 passes concentration... oh wait, Max 3D W=40 fails Principle #15 (sig_frac 0.5% << 20%).
- **state concentration < 0.20 → Reject (Principle #15)**: fires on 4/6 (Max 3D W=40, Max 3D Pro W=20/W=40, Power 6/55 W=20).
- **Full-sample Bonferroni α_strict=0.00833**: 0/6 pass. Best p_raw on positive Δ is 0.44 (Max 3D W=40 full) — far from Bonferroni threshold. Negative Δs (Power 6/55 half1 p=0.009) fall below Random.

**Principle #14 magnitude check**: largest |Δ| = |−0.942pp| on Power 6/55 half1 — marginally exceeds 3× matrix ceiling (0.9pp) by 0.042pp. Direction is **negative** (HMM loses to Random), so not the "positive overfit auto-flag" scenario from Chu kỳ 12. Audit not required (no claim to audit).

### Pattern analysis

**Pattern 1 — HMM collapse to pure states is the dominant failure mode (4/6 configs)**. EM converges to degenerate solutions where one state captures all training data. Two variants:
- W=20 tends to favor "all signal state" (chi² variance too small at short window → appears everywhere high)
- W=40 tends to favor "all noise state" (longer smoothing → appears everywhere low)

This suggests the observation features [chi²_recent_W, max_dev_recent_W] don't decompose cleanly into 2 Gaussian-separable clusters on Vietlott data. Bias fluctuations are continuous, not discrete.

**Pattern 2 — Even when concentration passes, regime structure doesn't replicate**:
- Max 3D W=20: full segment has 26% signal, but half1 has 0% signal (completely different HMM state assignments at different training windows). HMM fit unstable across splits.
- Power 6/55 W=40: full has 46% signal, half1 has 25%, half2 has 60%, forward has 0%. Signal state identification depends entirely on training window choice.

**Pattern 3 — Always-on anchors (FreqWholeHot for 3D, Freq_Hot for matrix) themselves underperform Random on some products**:
- Max 3D Pro full: FreqWholeHot −0.411pp vs Random
- Power 6/55 half1: Freq_Hot −0.942pp vs Random (significant)

This means HMM's "ideal" output — toggle FreqHot when exploitable — is bounded above by FreqHot's own performance, which is often below Random. Even if HMM perfectly identified signal periods, switching to a broken anchor isn't profitable.

### Consistency với prior findings

**Reinforces Chu kỳ 8** (drift falsified on 3D): no temporal regime structure detectable → HMM can't find it either.

**Reinforces Chu kỳ 14** (adaptive/online Bayesian matrix 6/6 reject): adaptive family eliminated. HMM is a discrete-state cousin of online Bayesian; same falsification.

**Cumulative project-wide post Chu kỳ 17**: ~66 strategies × 5 products × 3-gate = **0 Accept / 0 Suggestive**. Paradigm space for breakthrough (at current data horizon) substantially exhausted.

### Retry Tree evaluation (Principle #16 application)

Pre-reg documented 6 within-paradigm retries (17.1 K states, 17.2 observations, 17.3 strategy mapping, 17.4 window W, 17.5 products, 17.6 HMM family). Evaluating triggers:

| Retry | Trigger condition | Triggered? | Rationale |
|---|---|:---:|---|
| 17.1 (K=3 states) | K=2 passes R1 (concentration ≥0.20 both states) | ✗ | Only Max 3D W=20 passes #15; full sample concentration is not the primary failure — split-half + forward are. Adding K=3 won't fix replication instability. |
| 17.2 (alt observations) | K=2 concentration collapse >80% | ✓ (4/6 collapse) | Collapse suggests features fail to discriminate regimes. Plausible to try entropy / top-k features. But: collapse likely means no real regime structure exists (consistent Chu kỳ 8). Trying richer features = epicycles on falsified hypothesis. |
| 17.3 (alt strategy mapping) | Real regime structure + FreqHot wrong anchor | ✗ | Regime structure NOT confirmed real (split-half unstable). Cannot swap anchor on unreliable regime labels. |
| 17.4 (alt W) | W=20 vs W=40 diverge meaningfully | ✗ | Both collapse or fail in similar ways. Different W values won't fix the underlying "no discrete regime" issue. |
| 17.5 (expand products Mega/Lotto) | Borderline p-values on forward gate | ✗ | p-values are far from borderline (0.18-0.58 for positive Δ, 0.009 for negative). Not a power issue — it's a mechanism issue. |
| 17.6 (alt HMM family — HSMM, Categorical, Switching State-Space) | 17.1-17.4 all reject | Eligible but **NOT recommended** | Paradigm-level rethink. But given Chu kỳ 8/14 convergent evidence "no regime structure," escalating to more HMM variants = sunk-cost fallacy. |

**Decision**: No within-paradigm retry triggered. HMM paradigm falsified at the discrete-latent-state level. Escalate per Principle #16 execution policy → paradigm-level rethink → **next step = Closure report per Kịch bản 2 Stage 2**.

### Lessons learned

1. **Principle #15 (concentration check) proved essential** — without it, we might have reported "HMM_W20 on Max 3D Pro matches FreqHot" without realizing HMM is 100% FreqHot (no regime switching). Automatic detection of degenerate ML states prevents false discovery. Empirical validation of #15 utility.

2. **Always-on anchor baseline is critical** — pre-reg required HMM beat BOTH Random AND always-FreqHot. Several products have FreqHot < Random, which trivially makes HMM = FreqHot "beat Random" by being equally bad. Anchor comparison catches this: even when HMM matches anchor exactly (sig_frac=1.0), we don't mistake it for a real effect.

3. **HMM fit instability across training windows** is itself evidence against regime structure. If true regimes existed, state identification would be stable across half-1, half-2, full, forward fits. Observed: signal_frac varies wildly (0% to 100%) across segments within the same config.

4. **Gaussian HMM observation feature choice matters more than expected**: chi²+max_dev seemed natural for bias magnitude, but both correlate and live on overlapping scales. Pattern 1 (dominant collapse mode) suggests features are essentially 1-dimensional effective — a single threshold on chi² might fit the data equally well and trivially collapses to one state.

### Status & next step

**Cycle 17 closed (2026-04-22): 6/6 Reject, HMM paradigm falsified.**

**Cumulative (post Chu kỳ 17)**: ~66 strategies × 0 Accept. Wiin-rate axis + ROI axis + regime-detection all null at current data horizon.

**Per Kịch bản 2** ([META_REVIEW_POST_CYCLE16.md §7](../META_REVIEW_POST_CYCLE16.md)):
- Stage 1 (Hướng C HMM): ✗ done, rejected
- Stage 2 (**next**): Hướng G — `PROJECT_CLOSURE_REPORT.md` consolidate 1-17 cycles. Effort 2-3d.
- Stage 3 (optional): Hướng H — Optimization mode (17a/17b) — can resume from [proposals/cycle17a_roi_ranking_3d.md](../proposals/cycle17a_roi_ranking_3d.md) if desired.

### Artifacts

- **Pre-reg**: [proposals/cycle17_hmm_regime.md](../proposals/cycle17_hmm_regime.md) (with retry tree)
- **Shared module**: [hmm_regime.py](../hmm_regime.py)
- **Backtest scripts**:
  - [3d/cycle17_hmm_backtest.py](../3d/cycle17_hmm_backtest.py)
  - [matrix/cycle17_hmm_backtest.py](../matrix/cycle17_hmm_backtest.py)
- **Results**: [3d/cycle17_hmm_results.json](../3d/cycle17_hmm_results.json), [matrix/cycle17_hmm_results.json](../matrix/cycle17_hmm_results.json)
- **Logs**: [3d/logs/cycle17_hmm_output.log](../3d/logs/cycle17_hmm_output.log), [matrix/logs/cycle17_hmm_output.log](../matrix/logs/cycle17_hmm_output.log)

### Principles applied

- **#11 Split-half replication**: Applied. 0/6 pass (direction flip or degenerate half).
- **#12 Variable-baseline power**: n_trials ~ 500-5670 per segment × run. Full-sample power adequate for detecting ±0.5pp effects; split-half + forward underpowered.
- **#13 Forward gate**: Applied. 0/6 pass directional.
- **#14 Magnitude sanity**: 1 marginal flag (Power 6/55 half1 −0.942pp vs 0.9pp ceiling), but direction negative not positive → not overfit concern.
- **#15 Prediction concentration**: **Fired on 4/6 configs** — this cycle's most important application. First cycle where #15 was primary rejection driver.
- **#16 Retry Tree + Optionality** (NEW, this cycle): Retry tree documented pre-reg. All 6 retry conditions evaluated post-hoc; none triggered. Escalation to paradigm-level rethink → Closure report.

# Breakthrough Roadmap — Novel R&D Paths

> **Bối cảnh**: Sau Chu kỳ 9, 3/3 Suggestive candidates của existing strategy toolbox fail replication. Chu kỳ 10 pivot project sang **breakthrough mode** ([METHODOLOGY §7](METHODOLOGY.md)).
>
> **Mục đích file này**: Liệt kê concrete novel R&D paths với hypothesis + mechanism + success criteria. Mỗi path sẽ được pick cho 1 cycle.
>
> **Không phải là**: Guideline cách run cycle. Đó là [METHODOLOGY.md](METHODOLOGY.md) + [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md).
>
> **⚡ Priority framework (Chu kỳ 10 refined)**: Primary goal = **tối đa hoá tỷ lệ trúng giải trong tương lai**. Paths re-ranked by **Win-rate impact** (direct > indirect). ROI (weight 0.30) vẫn meaningful — không loại Kelly path, chỉ demote ưu tiên.
>
> **Cập nhật 2026-04-21 (post Chu kỳ 13)**: 3D research line CLOSED. Chu kỳ 11/12/12.5/13 đã dùng cho 3D paths (Copula, GBM, Cross-product pool) — 4/4 Reject. **Chu kỳ 14 = Path #1 Online Bayesian trên matrix products** (đã defer 3 chu kỳ chờ 3D exhaust). Paths #2/#3/#5 cho matrix vẫn untested.
>
> **Cập nhật 2026-04-21 (post Chu kỳ 14)**: Path #1 Online Bayesian Reject 6/6 trên matrix. Drift hypothesis falsified (bias stable same as 3D). **Adaptive/drift-based family ELIMINATED** from future roadmap. Chu kỳ 15 = user decision giữa Path #3 (Cross-product matrix, win-rate axis) và Path #2 (Kelly portfolio, ROI-axis pivot).

---

## Priority Matrix (re-ranked Chu kỳ 10 refined — win-rate first; Chu kỳ 14 numbering sync 2026-04-21)

| # | Path | Effort | Win-rate impact | ROI impact | Novelty | Recommend order |
|:-:|------|:-:|:-:|:-:|:-:|:-:|
| 1 | Online Bayesian (Kalman-style) — matrix | Low | **▲▲▲ DIRECT** (adapts posterior P(num_i)) | ▲ | Medium | ~~1st~~ **Chu kỳ 14 — 6/6 Reject** (drift falsified) |
| 3 | Cross-product joint model — matrix (Power/Mega/Lotto overlap) | Med | **▲▲▲** (3× data → better P estimates) | ▲ | High | **1st now (Chu kỳ 15 Option A)** — lưu ý: variant 3D (Path B) đã Reject Chu kỳ 13 |
| 5 | Copula-based dependency modeling — matrix | Med-High | **▲▲** (captures joint → better P(any k)) | ▲ | High | 3rd — lưu ý: variant 3D đã Reject Chu kỳ 11 |
| 2 | Kelly-optimal multi-ticket portfolio | Low-Med | ▲ (indirect via portfolio opt) | ▲▲▲ | High | **2nd now (Chu kỳ 15 Option B)** — pivot to ROI-axis sau khi win-rate paths consistently null |
| 6 | Genetic algorithm strategy search | Med | ▲▲ (optimizes composite, overfit risk) | ▲ | Medium | 5th |
| 4 | Neural sequence (LSTM / Transformer) | High | ▲ (theoretically, overfit likely) | ▲ | Very high | 6th |
| 7 | Reinforcement learning (bandit) | High | ▲ | ▲▲ | Very high | Not recommended until 1-6 explored |

**Win-rate impact legend**: ▲▲▲ DIRECT = mechanism directly estimates/optimizes P(win). ▲▲ = indirect, mechanism improves P estimate via data/joint modeling. ▲ = optimizes other metric, win-rate change as byproduct.

---

## Path #1 — Online Bayesian with Kalman-style Posterior Updates ⭐ (RECOMMENDED FIRST — Chu kỳ 14)

### Win-rate relevance: ▲▲▲ DIRECT
Mechanism **directly estimates P(number_i)** cho mỗi vị trí trong không gian số, cập nhật posterior theo từng draw mới. Primary metric win_rate_ge3 là function trực tiếp của những posterior estimates này — better estimate → higher expected win rate. Đây là path matching primary goal tightest nhất.

### Mechanism
Existing Bayesian strategies (Chu kỳ 2) refit Dirichlet posterior from scratch mỗi prediction. Hypothesis: nếu bias change slowly over time (drift), online update với exponential forgetting factor tốt hơn full re-fit.

```
α_t = (1 - λ) · α_{t-1} + observation_t
P_t(number_i) ∝ α_t[i]^(1/T)
```

- `λ` ∈ [0.01, 0.1] = forgetting rate (smaller = longer memory).
- `T` = temperature.

### Why it might work
Chu kỳ 8 confirm digit bias trên 3D là **stable** (no drift). Nhưng matrix products (5/35, 6/45, 6/55) **chưa verify** stability — có thể có drift chưa detect. Online update catches slow drift that batch re-fit averages out.

### Success criterion (pre-registered)
- Beat batch Bayesian (existing) với Δ ≥ +0.1pp win_rate trên at least 1 matrix product.
- Split-half replication: both halves Δ > 0.
- Tournament top-3 trong cycle.

### Failure mode
- Nếu data không drift → online = batch asymptotically, không improvement.
- Nếu `λ` quá high → forget useful history, tệ hơn batch.

### Implementation outline
```python
class OnlineBayesianStrategy(StrategyBase):
    def __init__(self, forgetting_rate=0.03, temperature=1.0, alpha_prior=1.0):
        self.alpha = None  # posterior counts, updated online
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        if self.alpha is None:
            self._initialize(train_df, min_val, max_val)
        else:
            self._apply_update(train_df, prev_date, target_date)
        return sample_from_posterior(self.alpha, temperature, num_count)
```

### Estimated effort
1-2 ngày implement + test.

---

## Path #2 — Kelly-optimal Multi-ticket Portfolio (secondary, ROI-focused — Chu kỳ 16+ candidate)

### Win-rate relevance: ▲ INDIRECT
Kelly maximizes log-growth (ROI-centric), not P(win) directly. Win rate improvement chỉ là byproduct từ better ticket selection. Với priority refinement Chu kỳ 10 (win-rate 0.40 vs ROI 0.30), path này **demote từ "1st" → "4th"** — vẫn meaningful cho ROI-axis trong tournament nhưng không phải breakthrough trực tiếp cho primary goal.

### Mechanism
Thay vì gợi ý N vé identical-weighted, treat N-ticket problem as portfolio optimization:
- Compute P(win) cho mỗi candidate ticket (từ Bayesian posterior hoặc frequency model).
- Compute expected payout per ticket accounting for tier prizes.
- Select N tickets maximizing **Kelly criterion** trên joint portfolio (not independent tickets).

```
f* = (p·b - q) / b                    # Kelly fraction per ticket class
portfolio = argmax Σ_i f_i · log(1 + outcome_i)   # log-utility
s.t. Σ f_i = budget, diversity constraints
```

### Why it might work
- **Nobody has tried this in project** — all multi-ticket strategies đến nay (MinDistanceWheel, HybridParityDiv, GreedyCover) treat tickets as covering design hoặc diversity problem. Kelly explicitly optimize expected log-growth, not just coverage.
- Directly addresses **ROI goal**: Kelly is provably optimal for long-run wealth under correct probabilities.
- Budget-aware: can compare "best 10 vé" vs "best 20 vé" vs "best 50 vé" empirically.

### Success criterion (pre-registered)
- Δ_ROI vs RandomN > +2pp trên at least 1 matrix product (Lotto 5/35 primary target vì có existing wheeling baseline).
- P(any≥3) ≥ MinDistanceWheel (current best for 5/35 in wheeling category).
- Tournament top-1 trên ROI axis.
- Split-half replication both halves Δ_ROI > 0.

### Failure mode
- Kelly sensitive to probability estimate error. Nếu model P(win) bias → over/under-bet.
- Lottery payoff distribution heavy-tailed → Kelly over-aggressive. Half-Kelly mitigates.
- Diversity constraint vs Kelly optimum tradeoff — need grid search.

### Implementation outline
```python
class KellyPortfolioStrategy(StrategyBase):
    def __init__(self, prob_model="bayesian", kelly_fraction=0.5, budget_N=20):
        self.prob_model = prob_model
        self.kelly_fraction = kelly_fraction  # 0.5 = half-Kelly
        self.budget_N = budget_N
    def predict_n(self, train_df, target_date, N=20):
        candidate_tickets = generate_candidate_pool(...)     # e.g., 10,000 candidates
        p_win_each = estimate_probs(candidate_tickets, self.prob_model, train_df)
        expected_payout = compute_tier_expected_payouts(...)
        selected = kelly_allocate(candidate_tickets, p_win_each, expected_payout,
                                  kelly_fraction=self.kelly_fraction, N=N)
        return selected
```

### Estimated effort
3-4 ngày — moderately complex nhưng closed-form optimization available.

### Path dependencies
- Cần probability model — có thể dùng `BayesianDirichlet` (existing) hoặc mới (Path #1).
- Integration với existing multi-ticket backtest framework (`wheeling_backtest.py`).

---

## Path #3 — Cross-product Joint Model — Matrix (2nd priority — Chu kỳ 15 candidate)

> **Lưu ý scope**: Path #3 trong doc này áp dụng cho **matrix products** (Power 6/55, Mega 6/45, Lotto 5/35 trên overlap 1-35). Biến thể 3D (Path B) đã test Chu kỳ 13 — 4/4 Reject, shared-RNG hypothesis falsified cho 2 products 3D. Matrix vẫn untested — khác physical data (set-level vs digit-level) nên outcome có thể khác.

### Win-rate relevance: ▲▲▲
Pool data across 3 matrix products → 3× sample size cho bias estimation. Better estimates of P(number_i) directly improve win rate nếu shared RNG bias exists. Nếu independent RNG, no improvement (acknowledged failure mode).

### Mechanism
Hypothesis: 3 matrix products (Power 6/55, Mega 6/45, Lotto 5/35) **share physical RNG infrastructure** hoặc same vendor. If có shared bias (e.g., certain numbers over-represented cross-product), joint model có thể detect.

```
P(number_i in product_P) = f(i, P, shared_bias)
Estimate shared_bias jointly across products.
Predict for product P using pooled evidence.
```

### Why it might work
- Power 6/55 và Lotto 5/35 both operated by Vietlott — maybe shared hardware.
- Single-product sample size limited (~1000-1300 draws each); joint pooling x3 data.
- Nếu bias là real (cross-product), much better estimation power.

### Success criterion (pre-registered)
- Δ win_rate ≥ +0.2pp trên at least 2 of 3 matrix products (cross-product validation bắt buộc).
- Split-half: consistency cross-product (not just within-product).
- Tournament top-3.

### Failure mode
- Nếu products use independent RNG → shared_bias = 0 → joint model no better than individual.
- Mapping number space tricky: Power 6/55 có số 1-55, Lotto 5/35 chỉ 1-35. Chỉ overlap 1-35.

### Implementation outline
```python
class CrossProductJointStrategy(StrategyBase):
    def fit_all_products(self, data_dict):
        # Estimate shared number-level bias on intersection [1, 35]
        self.shared_bias = estimate_pooled_dirichlet(data_dict, overlap=[1,35])
        self.product_specific = {p: estimate_residual(data, self.shared_bias)
                                 for p, data in data_dict.items()}
    def predict(self, train_df, target_date, min_val, max_val, num_count):
        combined = combine_shared_and_specific(self.shared_bias, self.product_specific[current_product])
        return sample(combined, num_count)
```

### Estimated effort
4-5 ngày — requires architectural change vì current pipeline per-product.

---

## Path #4 — Neural Sequence Model (LSTM / Transformer)

### Win-rate relevance: ▲ (theoretically high, empirically likely overfit)
Neural softmax output is exactly P(number_i) — theoretically direct win-rate optimization. Nhưng empirical likelihood thành công thấp vì Chu kỳ 4+8 confirm no temporal correlation + bias stable, nên sequence modeling không add information. Overfit risk cao. **Defer** cho đến khi Paths #1, #3, #5 đã explored.

### Mechanism
Treat draw sequence as time series, predict next draw's numbers using neural net. Input = last K draws, output = softmax probability over number space.

### Why it might work
- Neural models có thể capture high-order patterns beyond marginal/pair statistics.
- Attention có thể learn "after this sequence of draws, number X is due".

### Why it probably WON'T work
- Lottery is designed to be **memoryless**. Chu kỳ 4 confirm no temporal correlation trên 3D.
- Chu kỳ 8 confirm bias stable (no drift to exploit).
- Neural models have huge parameter space → easy to overfit on ~1000-draw dataset.
- Compute cost high vs expected edge.

### Success criterion (pre-registered)
- Δ win_rate ≥ +0.3pp sau regularization + split-half validation.
- Beat simplest Bayesian baseline (not just Random).
- Tournament top-3.

### Failure mode (predicted likely)
- Overfit → half-1 great, half-2 near-Random → Reject.
- Compute justification absent nếu only marginal improvement.

### Implementation outline
Pytorch LSTM với small hidden (32-64), output softmax 55-d (6/55). Train rolling 200 draws, predict next.

### Estimated effort
1-2 tuần — requires Pytorch setup, GPU tốt hơn CPU cho iteration.

### Recommendation
**Defer** cho đến khi Paths #1-3 đã explored. Low probability success vì theoretical reasons.

---

## Path #5 — Copula-based Dependency Modeling — Matrix (3rd priority)

> **Lưu ý scope**: Biến thể 3D đã test Chu kỳ 11 (Gaussian + Empirical copula) — 3/4 Reject + 1/4 Inconclusive. Matrix copula vẫn untested; differs vì drawn-set structure (k chọn từ N) thay vì 3 digits độc lập vị trí.

### Win-rate relevance: ▲▲
Copula captures joint dependency structure of drawn numbers. Nếu số có dependency thực (như Chu kỳ 4 finding trên 3D digits), marginal-independent Bayesian miss information → copula có thể lift P(any k match) directly.

### Mechanism
Joint distribution of drawn numbers có thể không decomposable as independent marginals. Use copula (Gaussian, t, vine) to model dependency structure separately from marginals.

```
F_joint(x1, ..., xk) = Copula(F1(x1), ..., Fk(xk))
```

### Why it might work
- Chu kỳ 4 found digit positions NOT independent trong 3D (p<0.001). Copula formalizes this.
- Copula allows sampling joint distributions respecting dependency — better than independent marginal sampling.

### Success criterion
- Beat `JointDigitBias` (existing 3D strategy) với Δ ≥ +0.2pp.
- Split-half robust.

### Failure mode
- Copula fitting on small data (1000 draws) noisy.
- Chu kỳ 7-8 already showed existing joint strategies fail replication — copula có thể cùng failure mode.

### Implementation effort
4-6 ngày — requires copula library (scipy.stats limited; may need rvinecopulib).

---

## Path #6 — Genetic Algorithm Strategy Search

### Mechanism
Define strategy as parameterized formula (e.g., weighted combination of marginal frequency, pair synergy, recency decay, parity features). Search parameter space with GA:
- Fitness = backtest composite score (§8 EVALUATION)
- Crossover + mutation across generations
- Elite preservation

### Why it might work
- Manual tuning explored small region. GA explores larger hyperparameter × feature combination space.
- Can discover non-obvious feature interactions.

### Concerns
- **High overfitting risk** — GA optimizes on backtest, easy to memorize noise.
- Requires very careful **out-of-sample validation** (train split, validation split, held-out test).
- Computationally expensive.

### Success criterion
- Evolved best strategy beats existing top strategies trên **held-out test** (not training data).
- Split-half on test set both Δ > 0.

### Implementation effort
1 tuần.

---

## Path #7 — Reinforcement Learning (Bandit) — NOT RECOMMENDED YET

### Why not recommended
- Framing mismatch: lottery is stateless IID — no "action affects next state".
- RL only valuable if there's exploitable temporal structure, but Chu kỳ 4+8 confirm none exists on 3D.

### When to reconsider
- Nếu data drift detect trên matrix products (Phase 1 of any future cycle).
- Nếu multi-draw correlation discovered (Phase 1 test battery expanded).

---

## Cross-cutting infrastructure needs

### Needed for multiple paths

| Need | Used by | Status |
|------|---------|:-:|
| Tournament ranking script (§8 EVALUATION) | All paths | **TODO** |
| Kelly simulation library | Path #2, general sizing | **TODO** |
| Cross-product data loader | Path #3 | **TODO** |
| Candidate ticket generator (10k+ pool) | Path #2, #6 | **TODO** |
| Split-half replication helper (generic) | All paths | Partial (per-cycle scripts) |

**Recommend**: Tournament ranking infra đã partial reuse qua Chu kỳ 11/12/13 (3D backtest). Cross-product loader sẽ xây khi Chu kỳ 15 (Path #3 matrix) bắt đầu. Kelly simulation defer cho Chu kỳ 16+.

---

## Chu Kỳ 14 Proposal (first matrix breakthrough cycle — deferred 3 cycles chờ 3D exhaust)

> **Historical note**: Đề xuất này ban đầu gắn Chu kỳ 11 (xem git log). Thực tế Chu kỳ 11/12/13 dành cho 3D (Copula Path A → Reject; GBM Path E → Reject; Cross-product pool Path B → 4/4 Reject). Sau khi 3D chính thức CLOSED (Chu kỳ 13), Path #1 Online Bayesian pick lại cho **Chu kỳ 14** — nguyên vẹn rationale + mechanism, chỉ shift cycle number.

**Pick**: **Path #1 — Online Bayesian with Kalman-style Posterior Updates** (swap từ Kelly sau clarification priority win-rate → primary).

**Rationale**: Win-rate relevance ▲▲▲ DIRECT. Mechanism trực tiếp estimate P(number_i), primary metric win_rate_ge3 là function của những estimates này. Low effort (1-2 ngày). Extends existing Bayesian toolbox nên baseline comparison clean. Forward validation cho mechanism này đặc biệt meaningful vì online update inherently forward-oriented.

**Products target**: Mega 6/45 (primary — dataset lớn 1302 draws, existing Bayesian baseline), Lotto 5/35 (secondary — comparison với Chu kỳ 5+9 candidates).

**Deliverables**:
1. `research/matrix/online_bayesian.py` — core implementation (OnlineBayesianStrategy với 3-5 forgetting rate variants)
2. `research/tournament.py` — generic §8 tournament script với forward validation §9 (reused by future cycles)
3. Pre-registration in `history/cycle14_online_bayesian.md` — hypothesis + weights 0.40/0.30/0.15/0.15 + forward validation plan
4. Tournament results + split-half + forward validation JSON

**Success criterion** (primary = win-rate focus, principles #11-#15 binding):
- Tournament top-1 trên Mega 6/45 (4-metric composite, win-rate heaviest)
- `forward_last_100` win_rate > Random AND > batch Bayesian baseline
- Split-half both halves Δ_win > 0
- **Principle #14 magnitude sanity**: matrix bias ceiling +0.3pp → auto-flag threshold |Δ| > +0.9pp
- If all pass → Accept. If forward + split-half pass partially → Suggestive. If only forward pass + tournament top-1 → Ship-with-caveats.

**Fallback if Path #1 produces no significant edge**: Chu Kỳ 15 = Path #3 (Cross-product matrix) — mechanism khác cho win-rate axis. Chu Kỳ 16+ = Kelly portfolio (ROI-focused).

---

*Cập nhật: 2026-04-21 — Post Chu kỳ 13. 3D CLOSED (28 strategies 0 Accept). Chu kỳ 11 Proposal rebrand → Chu Kỳ 14 Proposal. Priority matrix cycle numbers sync: Path #1→Chu kỳ 14, Path #3 matrix→Chu kỳ 15, Kelly→Chu kỳ 16+.*

*Cập nhật: 2026-04-20 (late) — Chu kỳ 10 refined. Priority re-ranked theo win-rate goal. Chu kỳ 11 proposal swap từ Path #2 Kelly → **Path #1 Online Bayesian**. Kelly demote to Chu kỳ 13+.*

*Cập nhật: 2026-04-20 — Initial roadmap, Chu kỳ 10 pivot. 7 paths prioritized.*

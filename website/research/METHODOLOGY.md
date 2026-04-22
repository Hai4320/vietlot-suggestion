# Phương Pháp Research — Canonical Methodology

> **Mục đích**: Tài liệu **canonical** về phương pháp luận nghiên cứu thuật toán xổ số. Hợp nhất 3 pipeline trước đây đang tồn tại song song ([RESEARCH_PLAN.md](archive/superseded_docs/RESEARCH_PLAN.md) 5-phase, [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md) 5-phase, [Random_Analysis_Agent.md](archive/superseded_docs/Random_Analysis_Agent.md) 5-step) thành một quy trình duy nhất.
>
> **Khác với `RESEARCH_PLAYBOOK.md`**: Playbook là **template copy-paste** cho mỗi nghiên cứu mới (checklist, code stubs, lessons learned). File này là **why** đằng sau quy trình — các nguyên tắc bắt buộc, tiêu chí vào/ra từng phase, và anti-patterns.
>
> **Đối tượng đọc**: Người sẽ khởi động một research cycle mới (sản phẩm mới, chiến lược mới, hoặc re-evaluation).
>
> **⚡ Chu kỳ 10 pivot (2026-04-20, refined)**: Project chuyển từ **discovery mode** sang **breakthrough mode**. Primary goal = **tối đa hoá tỷ lệ trúng giải trong tương lai** (future win rate). ROI là meaningful secondary (weight 0.30 vs 0.40). Sharpe + p-value là guards. Pipeline 5-phase cho discovery, **thêm §7 Exploration Mode** cho breakthrough. §1.5 "simple beats complex" relaxed. §8 Multi-objective ranking với win-rate-heavy weights. **§9 EVALUATION Forward Validation** là primary future-generalization indicator. Guardrails (Principles #11, #12, pre-registration, walk-forward, Random baseline) **giữ nguyên** — xem [RESEARCH_HISTORY Chu Kỳ 10](RESEARCH_HISTORY.md#chu-kỳ-10--pivot-decision-research-direction--breakthrough-mode-042026).

---

## 1. Nguyên Tắc Nền Tảng (Bất Biến)

Áp dụng cho **mọi** research cycle, không có ngoại lệ:

### 1.1 Ba ràng buộc của Quant Agent

Rút từ [Random_Analysis_Agent.md](archive/superseded_docs/Random_Analysis_Agent.md) — áp dụng làm ràng buộc cứng:

| # | Ràng buộc | Ý nghĩa thực hành |
|---|-----------|-------------------|
| **R1** | **Không confirmation bias** | Nếu Phase 1 (14-test) trả về "white noise" (không p<α/n sau Bonferroni), **dừng**. Không ép dữ liệu bằng mô hình phức tạp hơn để "tìm ra" pattern. |
| **R2** | **Phát biểu rủi ro overfitting** | Mọi báo cáo cuối phase phải có section "limitation" nêu rõ risk. |
| **R3** | **Code reproducible** | `random.seed(42)`, `np.random.seed(42)`, pin dependency version, data snapshot. Một người khác chạy lại phải ra cùng kết quả. |

### 1.2 Walk-forward bắt buộc

Mọi backtest phải tuân thủ **no look-ahead**:

```python
for i in range(min_history, n_draws):
    train = draws[:i]                      # CHỈ data trước target
    pred  = strategy.predict(train, …)
    eval(pred, draws[i])                   # So với actual
```

**Không được** lấy mẫu ngẫu nhiên để chia train/test — phải theo thứ tự thời gian.

### 1.3 Random baseline bắt buộc

Mọi benchmark phải bao gồm `RandomStrategy`. Đây là **noise floor** — nếu strategy không ≥2σ trên Random, nó là noise.

### 1.4 Chứng minh toán học trước khi code

Bài học lớn nhất từ [Chu kỳ 5](RESEARCH_HISTORY.md#chu-kỳ-5): Phase 2a thất bại được **dự đoán trước** bằng đại số (`E[match] = k·j/18 + (5-k)·(5-j)/17` không phụ thuộc Var[k]). Nếu đã chứng minh trước, có thể skip backtest tốn CPU.

**Quy tắc**: Trước khi implement một chiến lược khai thác bias X, viết 3-5 dòng công thức kỳ vọng (E[match | strategy] vs E[match | random]). Nếu công thức cho thấy bằng nhau → skip implementation.

### 1.5 "Simple beats complex" — soft prior (Chu kỳ 10 relaxed)

**Trước Chu kỳ 10**: Hard prior — complex strategy phải beat simple ≥2σ mới được ship.

**Sau Chu kỳ 10 (breakthrough mode)**: Soft prior. Vẫn bench vs simple baseline (bắt buộc cho tournament ranking §8), nhưng complex không cần beat simple để được ship. Lý do: empirical data của project (Chu kỳ 5–9) cho thấy existing strategy toolbox không tìm ra edge — breakthrough mode explicitly cho phép thử complex/novel paradigms (online learning, neural, portfolio theory) mà không bị block bởi simple baseline không beat được.

**Still required**: mọi strategy (complex hay simple) phải **include cả Random + ≥2 simple baselines** trong tournament. Cherry-pick baseline dễ thắng là anti-pattern (xem §8).

---

## 2. Unified Pipeline (5 Phase)

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Phase 0  │ → │ Phase 1  │ → │ Phase 2  │ → │ Phase 3  │ → │ Phase 4  │
│ Data     │   │ Bias     │   │ Design   │   │ Validate │   │ Ship     │
│ ingest   │   │ detect   │   │ & impl   │   │ & select │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                     │              │              │
                     ↓              ↓              ↓
               [R1 gate:       [§1.4 algebra  [§1.5 significance
                white noise    check before   gate: beat simple
                → stop]        implementation] ≥ 2σ?]
```

### Phase 0 — Data Ingestion

**Mục tiêu**: Hiểu đầy đủ cấu trúc dữ liệu, định thức baseline lý thuyết.

**Entry**: Sản phẩm chưa được nghiên cứu, hoặc dữ liệu đã cập nhật đáng kể (>50 kỳ mới).

**Deliverables**:
- Data format note (fields, encoding, số kỳ, date range)
- Baseline lý thuyết: `E[match]`, `P(win≥k)` bằng công thức (không backtest)
- Data quality check: duplicates, missing draws, outliers

**Exit criteria**:
- [ ] Biết chính xác số kỳ, số/kỳ, không gian số, prize tiers
- [ ] Đã tính `E[match]` theo hypergeometric/binomial
- [ ] Đã verify head+tail của file (format consistent)

### Phase 1 — Bias Detection

**Mục tiêu**: Xác định dữ liệu có white noise hay có bias khai thác được.

**Entry**: Phase 0 xong.

**Bắt buộc chạy**: Test battery (xem [TESTING.md](TESTING.md)) với **Bonferroni correction** `α_strict = 0.05/n_tests`.

**Exit criteria — một trong hai**:
- **Exit A** (white noise): Không test nào pass Bonferroni → **STOP**, báo cáo white noise. Không chuyển sang Phase 2. Đây không phải failure — là kết quả hợp lệ. Ghi vào [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md).
- **Exit B** (bias detected): ≥1 test pass Bonferroni. Ghi rõ:
  - Test nào, p-value, effect size
  - Direction của bias (số/digit nào lệch, bao nhiêu %)
  - Hypothesis về cách khai thác → input cho Phase 2

**Anti-pattern**: "Chạy thêm 20 test nữa để chắc chắn là white noise" — càng nhiều test, ngưỡng Bonferroni càng nghiêm, càng khó phát hiện bias thật. Cố định test battery **trước khi chạy**.

### Phase 2 — Design & Implementation

**Mục tiêu**: Thiết kế chiến lược khai thác bias từ Phase 1, implement, verify correctness.

**Entry**: Exit B của Phase 1 (có bias).

**Quy trình**:
1. **Pre-register hypothesis** (mới — xem §3.1): Ghi vào RESEARCH_HISTORY trước khi implement: "Tôi dự đoán strategy X sẽ beat Random bằng cơ chế Y, với effect size kỳ vọng Z".
2. **Algebra sanity check** (§1.4): Chứng minh E[match | X] > E[match | Random] bằng công thức. Nếu không chứng minh được → high risk strategy không hoạt động (xem Chu kỳ 5).
3. Implement single-ticket variant trước. Nếu single-ticket không exploit được → xét multi-ticket (wheeling).
4. Unit test: seed=42, compare output với expected fixed output (regression).

**Exit criteria**:
- [ ] Strategy chạy reproducible với seed=42
- [ ] Output hợp lệ (đúng range, không trùng, đúng count)
- [ ] Đã có algebra check (nếu áp dụng được) hoặc ghi rõ "không có closed-form"
- [ ] Hypothesis đã pre-register

### Phase 3 — Validate & Select

**Mục tiêu**: Backtest nghiêm ngặt, so sánh với baseline, kiểm định significance.

**Entry**: Phase 2 xong, strategy implement được.

**Quy trình** (chi tiết trong [EVALUATION.md](EVALUATION.md)):
1. Walk-forward backtest, `n_runs ≥ 3` (5 preferred), `min_history` tuỳ product.
2. Include baselines: `Random`, + simple baseline mạnh nhất của product đó (ví dụ `FreqWholeHot` cho 3D, `Pattern` cho matrix).
3. **Significance test bắt buộc trên Δ vs Random** — z-test cho proportion, hoặc two-sample t-test cho mean. Report p-value và Wilson 95% CI.
4. Cross-product validation: test cùng strategy ≥2 products (nếu applicable).
5. Sensitivity: grid search 2-3 hyperparameter quan trọng nhất (Temperature + lookback). Report best config.

**Exit criteria**:
- [ ] p-value của Δ vs Random < 0.05 (hoặc phải kết luận "không khác biệt")
- [ ] 95% CI của Δ không chứa 0
- [ ] Cross-product result (nếu áp dụng)
- [ ] Đã test ≥2 hyperparameter configs

**Anti-pattern — p-hacking**: Chạy 50 hyperparameter configs rồi report config tốt nhất mà không correct multi-testing. Nếu test K configs, nhân p-value × K hoặc report từ **held-out validation set**.

### Phase 4 — Ship

**Mục tiêu**: Đưa strategy vào production (website + docs).

**Entry**: Phase 3 pass.

**Quy trình**:
1. Port TypeScript: `src/lib/suggest-{matrix,3d}.ts`
2. Update website data: `src/lib/backtest-data.ts`, `src/app/algorithms/page.tsx`, `src/components/products/SuggestionPanel.tsx`
3. Update cycle record: tạo [`history/cycleNN_<slug>.md`](history/) với pre-reg + results + verdict
4. Update index: [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) summary table + Cycle Index
5. Include **failure modes**: khi nào strategy này không nên dùng (e.g., N<10 cho HybridParityDiv)

**Exit criteria**:
- [ ] Build pass (`npx next build`)
- [ ] Disclaimer về EV âm hiện trong UI
- [ ] HISTORY entry có đầy đủ: mục tiêu, phương pháp, kết quả, bài học, artifacts

---

## 3. Cải Thiện So Với Pipelines Trước

Các thay đổi này đã được validate qua thực tế (Chu kỳ 5) và được đưa vào là **bắt buộc**:

### 3.1 Pre-registration hypothesis (MỚI)

**Trước**: Phase 2 bắt đầu ngay từ intuition, backtest xong mới viết narrative. Risk HARKing (Hypothesizing After Results are Known).

**Sau**: Trước khi implement, viết 2-3 dòng vào nháp HISTORY:
```
HYPOTHESIS cycle N:
  Strategy: [tên]
  Mechanism: [tôi expect nó beat Random vì ...]
  Predicted effect size: Δ = +X.X pp trên metric Y
  Success criterion: p < 0.05 sau Bonferroni
```
Sau backtest, nếu kết quả khác — nói rõ khác thế nào, không viết lại hypothesis.

### 3.2 Significance test trên backtest delta (MỚI — bắt buộc)

**Trước**: `backtest.py` chỉ report `Δ = avg_matches - E[X]`, không có p-value. Chu kỳ 3 (Bayesian "Δ+0.031") bare Δ không đủ để kết luận có edge.

**Sau**: Mọi backtest script phải output cho mỗi strategy:
- `delta_vs_random`: point estimate
- `p_value_vs_random`: z-test proportion hoặc permutation test
- `ci95_delta`: Wilson 95% CI

Script `matrix/backtest.py` và `matrix/power535/wheeling_backtest.py` hiện thiếu — cần thêm (xem [EVALUATION.md §3](EVALUATION.md)).

### 3.3 Algebra sanity check trước backtest (§1.4)

Bài học từ Chu kỳ 5 Phase 2a: single-ticket không thể exploit parity bias (chứng minh bằng 2 dòng công thức). Trước khi spend compute, làm sanity check này.

### 3.4 R1 gate rõ ràng — white noise là kết quả hợp lệ

**Trước**: Không rõ khi nào "nên dừng". Risk là cycle không kết thúc, researcher tiếp tục thử đến khi p<0.05 (p-hacking).

**Sau**: Nếu Phase 1 không pass Bonferroni, **phải** dừng và ghi lại. Không được mở rộng test battery post-hoc.

### 3.5 Split-half replication mandatory cho Suggestive → Accept (Principle #11 — từ Chu kỳ 7+9)

**Bối cảnh**: Sau Chu kỳ 7 (3D replication, 2/2 Reject) + Chu kỳ 9 (Mega 6/45 ExpDecay_Cold, direction-flip Reject) = **3/3 Suggestive candidates fail replication**.

**Rule (binding)**: Mọi strategy đạt full-sample `p_raw < 0.05` trên Phase 3 backtest phải chạy **split-half replication** trước khi được classify là Suggestive hoặc cao hơn.

**Implementation**:
- Time-ordered split tại `N // 2` (không random shuffle — preserve walk-forward semantics).
- Half 1 predictions on `draws[min_history, N/2)`, Half 2 on `draws[N/2, N)`. Train = `draws[:i]` (growing).
- Baseline **reset per half** — Random của half 1 độc lập với Random của half 2 (xem Principle #12).
- Decision rule (pre-registered, binding — same thresholds across all cycles):

  | Half 1 p_raw | Half 2 p_raw | Direction | Replication decision |
  |:-:|:-:|:-:|:-:|
  | < 0.025 | < 0.025 | Δ > 0 cả hai | **Accept** |
  | < 0.05 | < 0.05 | Δ > 0 cả hai | **Suggestive** (keep) |
  | < 0.05 một half, ≥ 0.05 half kia | — | Δ > 0 cả hai | **Inconclusive** |
  | Còn lại (direction flip included) | — | — | **Reject** |

**Anti-pattern**: "Full-sample p=0.0044 là đủ để ship" → sai. Chu kỳ 9 cho thấy full-sample p có thể được drive hoàn toàn bởi pooling artifact — pool 2 halves có flip direction tạo spurious low p-value khi baseline drift across halves. Chỉ split-half mới phát hiện.

### 3.6 Variable-baseline power analysis pre-cycle (Principle #12 — từ Chu kỳ 8+9)

**Bối cảnh**: Chu kỳ 8 phát hiện Random baseline tự nó flutter ±0.25-0.30pp giữa halves. Khi true edge <0.5pp, effect size không detect được ngay cả khi strategy thật sự có edge.

**Rule**: Trước khi chạy replication cycle, tính `n_required` theo công thức two-proportion với variable baseline:

```
n_per_half ≈ (z_α + z_β)² × [p_s(1−p_s) + p_b(1−p_b)] / δ²
```

Với α=0.05, power=80% (z_α=1.96, z_β=0.84). Nếu `n_runs × n_draws_per_half < n_per_half` → tăng n_runs hoặc report limitation rõ ràng trong HISTORY. Không claim Accept nếu power <80%.

**Anti-pattern**: Dựa trên single-rate power formula (coi baseline cố định) → underestimate n cần thiết. Power analysis phải account for baseline variance.

### 3.7 Forward gate mandatory (Principle #13 — từ Chu kỳ 7/9/11/12)

**Bối cảnh**: 4/4 Suggestive candidates qua Chu kỳ 7+9+11+12 show **forward-flip signature** — full-sample + split-half đều pass nhưng forward window (last 100 draws) cho Δ ≤ 0 hoặc reversed. Split-half mình chưa đủ catch overfitting trên pattern training-specific.

**Rule (binding)**: Mọi strategy đạt Suggestive (§3.5) phải có **forward_last_100** gate Δ > 0 để upgrade sang Accept.

**Implementation**:
- Forward window = last 100 draws của product (held-out từ backtest).
- Strategy fit on `draws[:N-100]`, predict `draws[N-100:N]`.
- Compare vs Random within same forward window (variable-baseline per Principle #12).
- Decision per window: `Pass-strong` (Δ>0 + p<0.05), `Pass-directional` (Δ>0 + p≥0.05), `Reject` (Δ≤0).

**Stacked 3-gate rule**: `Accept` = full-sample pass Bonferroni AND split-half Accept AND forward Pass-{strong|directional}. Any `Reject` at any gate → overall `Reject`. Rationale: forward data was NEVER seen by model design/pre-registration — smallest overfit surface.

### 3.8 Magnitude sanity check (Principle #14 — từ Chu kỳ 12+12.5)

**Bối cảnh**: Chu kỳ 12 GBM claim full-sample Δ=+3pp trên 3D — **7× known bias ceiling** (+0.4pp number-level per Chu kỳ 4). Pre-reg rule đã accept the result technically. Chu kỳ 12.5 audit confirmed pure overfitting (no leak).

**Rule (binding)**: Define "bias ceiling" per product class:
- **3D (Max 3D, Max 3D Pro)**: +0.4pp exact_match_rate over Random (compound from max digit bias ~1.2pp × 3 positions, per Chu kỳ 4)
- **Matrix (6/55, 6/45, 5/35)**: +0.3pp win_rate_ge3 (per Chu kỳ 5-6 observations)

Nếu claimed full-sample `|Δ| > 3 × bias_ceiling`, auto-flag as **Ship-with-caveats pending audit** regardless of p-values hay split-half pass. Require audit cycle (template: Chu kỳ 12.5) trước khi upgrade to Accept.

**Rationale**: Genuine edges > ceiling chỉ nếu mechanism captures **novel unexamined bias** — must verify whenever scale suspect. Most implausible claims = overfit on training-specific patterns, không real edge.

### 3.9 Prediction concentration check (Principle #15 — từ Chu kỳ 12.5)

**Bối cảnh**: Chu kỳ 12.5 audit found GBM Max 3D picks `'380'` 216/600 times (36%) — model collapse to favorite predictions. Max 3D Pro GBM 67 unique / 600 predictions.

**Rule (binding for ML/discriminative strategies)**:
- `n_unique_predictions / total_predictions ≥ 0.30` trong forward window
- Top-5 concentration `< 30%`

Strategies violating → auto-flag as **Reject** (overfit signature). Applies to GBM, neural nets, classifier-based strategies. Does not apply to hand-crafted probabilistic strategies (Bayesian, Copula) — those inherently sample from distribution.

**Rationale**: Lottery với 1000 candidates (3D) hoặc ≥35 candidates (matrix), uniform-like prediction diversity expected. High concentration = model hyper-converged to training-period favorites that don't generalize.

### 3.10 Retry Tree + Optionality Preservation (Principle #16 — từ Chu kỳ 17)

**Bối cảnh**: Meta-review [META_REVIEW_POST_CYCLE16.md](META_REVIEW_POST_CYCLE16.md) 2026-04-22 phát hiện: sau 16 cycles × ~60 strategies × 0 Accept, project dễ bị "locked in" vào 1 design choice mà không còn visibility vào alternatives đã cân nhắc. Nếu một cycle reject mà không có retry tree documented, user phải re-derive alternatives from scratch — lose institutional knowledge + risk proposing same variant lại.

**Rule (binding for all pre-registrations cycle 17+)**: Mỗi pre-reg phải include 2 levels of alternatives:

1. **Tầng 1 — Cycle-level alternatives** (nếu reject hoàn toàn paradigm này, đi đâu?)
   - Link tới META_REVIEW (hoặc equivalent doc) § các hướng song song
   - Effort + pass probability của mỗi hướng alternative
   - Decision criteria để pick hướng kế tiếp

2. **Tầng 2 — Within-paradigm retries** (nếu reject nhưng muốn thử variant trong cùng paradigm)
   - Tối thiểu 3-5 variants chưa test (alt hyperparams, alt features, alt mapping)
   - **Trigger condition** cho mỗi variant — evidence nào từ kết quả hiện tại cho thấy variant đó đáng thử
   - Execution policy: không auto-retry; mỗi retry phải user-approve + pre-reg mới

**Execution policy** (binding):
- Không chạy retry automatic khi reject — phải explicit user approval
- Mỗi retry là cycle mới (N.1, N.2, ...) với pre-reg riêng, không mở rộng cycle gốc post-hoc
- Cap tối đa 3 retries / paradigm trước khi escalate paradigm-level rethink
- Mỗi retry phải ghi rõ trigger evidence + drop các variants không còn relevant

**Rationale**: Prevents two failure modes:
1. **Sunk-cost lock-in** — "đã tốn thời gian paradigm này, cố thêm" → mở ra thêm variants không systematic
2. **Reinvent-the-wheel** — sau cycle reject, forget alternatives đã brainstormed pre-experiment → duplicate work

Preservation of optionality giữ user option value cao: nếu paradigm fail, đường kế tiếp đã sẵn. Nếu paradigm pass, retry tree làm baseline scope cho follow-up cycles.

**Template**: Xem [RESEARCH_PLAYBOOK.md §Retry Tree Template](RESEARCH_PLAYBOOK.md#retry-tree-template). Ví dụ thực tế: [proposals/cycle17_hmm_regime.md §Retry Tree](proposals/cycle17_hmm_regime.md#retry-tree--within-hmm-paradigm-alternatives) (6 variants 17.1-17.6, each with trigger + rationale).

---

## 4. Anti-patterns (Đã Gặp)

| Anti-pattern | Triệu chứng | Phòng ngừa |
|--------------|-------------|------------|
| **p-hacking** | Chạy nhiều configs, report tốt nhất | Pre-register + Bonferroni trên K configs |
| **HARKing** | Viết hypothesis sau khi thấy kết quả | Pre-register (§3.1) |
| **Look-ahead** | Train set chứa future data | `train = draws[:i]` bắt buộc |
| **n_runs=1** | Variance bởi luck, không reproducible | `n_runs ≥ 3` (5 preferred) |
| **Bare Δ** | "Strategy X có Δ+0.03" không kèm test | Significance test mandatory (§3.2) |
| **Confirmation bias** | Cycle không thừa nhận white noise | R1 gate (§1.1) |
| **Single-product claim** | "Strategy tốt nhất" dựa trên 1 product | Cross-product validation |
| **Complex first** | Đi thẳng ensemble/NN mà chưa check baseline | Bao gồm simple baseline (§1.5) |

---

## 5. Decision Tree — Khi Nào Skip Phase Nào

```
Có dữ liệu mới (>50 kỳ) hoặc sản phẩm mới?
├── Có  → Phase 0 bắt buộc
└── Không → Skip Phase 0

Phase 1 (Bias detection) đã chạy trong 12 tháng qua?
├── Có  → Skip Phase 1, reuse kết quả
└── Không → Phase 1 bắt buộc

Phase 1 exit A (white noise)?
├── Có  → STOP cycle, ghi HISTORY
└── Không → Phase 2 → Phase 3

Phase 3 p-value < 0.05 sau Bonferroni?
├── Có  → Phase 4
└── Không → Quay về Phase 2 (tối đa 2 vòng iterate trước khi kết luận no-edge)
```

---

## 6. File Liên Quan

| File | Vai trò |
|------|---------|
| [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md) | Template + checklist copy-paste cho mỗi cycle |
| [EVALUATION.md](EVALUATION.md) | Metric + significance test cho Phase 3 |
| [TESTING.md](TESTING.md) | Test battery chi tiết cho Phase 1 |
| [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) | Index + principles corpus (nơi ghi pre-reg hypothesis vào `history/cycleNN_<slug>.md`) |
| [META_REVIEW_POST_CYCLE16.md](META_REVIEW_POST_CYCLE16.md) | Current decision anchor (8 hướng + 3 kịch bản, PAUSED 2026-04-22) |

---

---

## 7. Exploration / Breakthrough Mode (Chu kỳ 10+)

### 7.1 When to use

Dùng Exploration Mode khi:
- Discovery mode (§2 standard pipeline) đã exhaust — R1 gate hit on all products, không bias exploitable nào còn unsearched.
- Researcher commits to trying **novel mechanism** (portfolio theory, online learning, neural sequence, cross-product joint) thay vì optimize existing bias-exploitation strategies.
- Active R&D để **rank và ship best-available strategy**, không cần wait for p<0.05 Accept-grade edge.

Dùng Discovery Mode (§2) khi:
- Sản phẩm mới chưa research.
- Data mới đáng kể (+500 draws) trên product đã research — có thể phát sinh new bias.
- Replication cycle cho existing Suggestive/Accept candidate.

Cả 2 modes chia sẻ guardrails trong §1 và §3.5/§3.6 (Principles #11, #12).

### 7.2 Differences from Discovery Mode

| Axis | Discovery (§2) | Exploration (§7) |
|------|----------------|-------------------|
| **Phase 1 (bias detection)** | Bắt buộc. R1 gate = STOP | Optional. Có thể skip nếu strategy không dựa vào bias |
| **Phase 2 design** | Dựa trên Phase 1 findings | Dựa trên novel mechanism (portfolio, online, neural…) |
| **Simple-beats-complex prior** | Hard (must beat ≥2σ) | Soft (benchmark required, không phải gate) |
| **Primary output** | Accept / Suggestive / Reject | Tournament ranking (§8) |
| **Ship criterion** | Accept or Suggestive (post-replication) | Tournament winner OR Accept-grade edge |
| **Split-half replication (§3.5)** | Required for Suggestive→Accept | Required for Accept-grade label |
| **Variable-baseline power (§3.6)** | Required before replication | Required before replication |

### 7.3 Exploration pipeline (5-phase adapted)

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Phase 0  │ → │ Phase 1' │ → │ Phase 2' │ → │ Phase 3' │ → │ Phase 4  │
│ Data     │   │ Mechanism│   │ Design   │   │ Tournament│  │ Ship     │
│ ingest   │   │ survey   │   │ & impl   │   │  & repl.  │  │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Phase 1' — Mechanism survey** (thay cho bias detection): liệt kê các novel mechanisms từ [BREAKTHROUGH_ROADMAP.md](BREAKTHROUGH_ROADMAP.md). Chọn 1-3 mechanisms → pre-register hypothesis.

**Phase 2' — Design & implement**: same rules (pre-reg, algebra check where applicable, unit tests, seed=42). Nếu mechanism non-analytical (e.g., neural net), skip algebra check nhưng ghi rõ limitation.

**Phase 3' — Tournament + Replication + Forward validation**:
1. Walk-forward backtest với `n_runs ≥ 5`, report full metric set (§8).
2. Tournament ranking per product (§8, win-rate-heavy weights).
3. **Forward validation** ([EVALUATION §9](EVALUATION.md)) trên top-3 candidates — rolling-window last-20/100/300.
4. Top-1 per product + ≥2 composite-top cross-product → split-half replication (§3.5).
5. **Gate combine**:
   - Accept-grade: split-half both halves Δ>0 + p<0.025 both + forward_last_100 Δ>0
   - Suggestive: split-half both halves Δ>0 + p<0.05 both + forward_last_100 Δ>0
   - Ship-with-caveats: tournament top-1 + forward_last_100 Δ>0 (even if split-half fail/not-run)
   - Forward_last_100 Δ≤0 → downgrade by one tier ([EVALUATION §9.5](EVALUATION.md))

### 7.4 Anti-patterns specific to breakthrough mode

| Anti-pattern | Symptom | Prevention |
|--------------|---------|------------|
| **Hyper-complex first** | Đi thẳng neural net, không baseline simple nào | §1.5 soft prior — vẫn bench vs simple; §8 tournament bắt buộc multi-baseline |
| **Weight shopping** | Tune composite weights post-hoc để winner đổi | §8 weights pre-registered, không điều chỉnh sau backtest |
| **Ship-all** | Ship mọi strategy, label "experimental" | Tournament top-1 only; ship-with-caveats có UI disclosure |
| **Drift eval metric** | Add metric mới để winner trông tốt hơn | Metric set fixed per cycle (§8 canonical list) |
| **Skip replication** | "Breakthrough = ship ngay" | §3.5 split-half vẫn required cho Accept label |

---

## 8. Multi-objective Tournament Ranking (Chu kỳ 10+)

Phần này chi tiết hoá cách rank strategies khi có 4 metrics không đồng nhất (Δ_random, win_rate, ROI, Sharpe). Full metric schema + formula trong [EVALUATION.md §8](EVALUATION.md).

### 8.1 Composite score (pre-registered weights — refined 2026-04-20)

```
score(strategy) = w1 · z(Δ_win_rate) + w2 · z(Δ_ROI) + w3 · z(Sharpe) + w4 · z(−log10 p_value)
```

- `z(·)` = z-normalize across strategies trong tournament (so that all 4 contributions on same scale).
- Weights **phải pre-register trong cycle's HISTORY entry** trước khi chạy backtest. Không tune sau.
- **Default weights** — ưu tiên win rate, ROI balanced meaningful secondary:

| w | Metric | Weight | Rationale |
|:-:|--------|:-:|-----------|
| w1 | Δ_win_rate vs Random | **0.40** | PRIMARY — mục tiêu cao nhất của project |
| w2 | Δ_ROI vs Random | **0.30** | Meaningful secondary — ratio win:ROI = 4:3, ROI vẫn drive decision |
| w3 | Sharpe | **0.15** | Risk-adjusted return guard |
| w4 | −log₁₀(p_value) | **0.15** | Significance guard chống lucky-noise winner |

### 8.2 Tournament structure

Per product:
1. Run ≥10 strategies including `Random`, `FreqHot`, `Pattern` (3 mandatory baselines).
2. Compute all 4 metrics + significance vs Random.
3. Z-normalize each metric across strategies.
4. Composite score per pre-registered weights.
5. **Top-1** = product winner.

Cross-product:
1. Average rank per strategy across products.
2. **Cross-product top-1** = robust winner.

### 8.3 Ship decision

| Outcome | Label | Website treatment |
|---------|-------|-------------------|
| Top-1 + split-half both halves Δ>0 + p<0.025 both | **Accept** (✓ edge confirmed) | Primary recommendation, no caveat |
| Top-1 + split-half both halves Δ>0 + p<0.05 both | **Suggestive** | Recommended, minor caveat |
| Top-1 + split-half inconsistent/not-run | **Ship-with-caveats** | Ship but label "unverified edge — tournament best" |
| Not top-1, but Δ>0 consistent | **Research-only** | Not on primary site, archive only |
| Direction flip or negative Δ | **Reject** | Not shipped |

### 8.4 Anti-cherry-pick enforcement

- **Baseline set fixed**: Random + FreqHot + Pattern (matrix); Random + FreqWholeHot + Digit_Hot (3D). Không remove baseline dễ thắng để make winner shine.
- **Metric set fixed**: 4 metrics như §8.1. Không add/remove metrics post-hoc.
- **Weights fixed**: pre-registered, immutable within cycle.
- **N strategies ≥ 10**: tournament với <10 strategies underpowered statistically.

---

*Cập nhật: 2026-04-20 (late) — (Chu kỳ 10 refined) Reweight §8 composite thành 0.40/0.30/0.15/0.15 sau user clarification "ưu tiên win rate, ROI cân bằng". Phase 3' thêm forward validation gate reference §9 EVALUATION.*

*Cập nhật: 2026-04-20 — (Chu kỳ 10 pivot) thêm §7 Exploration Mode, relax §1.5 simple-beats-complex, thêm §8 Multi-objective Tournament Ranking. Guardrails §1, §3.5, §3.6 giữ nguyên.*

*2026-04-20 — (Chu kỳ 9) thêm §3.5 Split-half replication mandatory (Principle #11) và §3.6 Variable-baseline power analysis (Principle #12) sau 3/3 Suggestive candidates fail replication.*

*2026-04-21 — (Chu kỳ 12/12.5) thêm §3.7 Forward gate (Principle #13) sau 4/4 forward-flip cases, §3.8 Magnitude sanity check (Principle #14) và §3.9 Prediction concentration check (Principle #15) sau GBM false-Accept audit.*

*2026-04-20 — Hợp nhất PLAN + PLAYBOOK + Quant Agent thành pipeline duy nhất; codify pre-registration, significance-on-delta, R1 gate.*

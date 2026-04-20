# Phương Pháp Research — Canonical Methodology

> **Mục đích**: Tài liệu **canonical** về phương pháp luận nghiên cứu thuật toán xổ số. Hợp nhất 3 pipeline trước đây đang tồn tại song song ([RESEARCH_PLAN.md](archive/superseded_docs/RESEARCH_PLAN.md) 5-phase, [RESEARCH_PLAYBOOK.md](RESEARCH_PLAYBOOK.md) 5-phase, [Random_Analysis_Agent.md](archive/superseded_docs/Random_Analysis_Agent.md) 5-step) thành một quy trình duy nhất.
>
> **Khác với `RESEARCH_PLAYBOOK.md`**: Playbook là **template copy-paste** cho mỗi nghiên cứu mới (checklist, code stubs, lessons learned). File này là **why** đằng sau quy trình — các nguyên tắc bắt buộc, tiêu chí vào/ra từng phase, và anti-patterns.
>
> **Đối tượng đọc**: Người sẽ khởi động một research cycle mới (sản phẩm mới, chiến lược mới, hoặc re-evaluation).

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

### 1.5 "Simple beats complex" là prior

Mặc định giả định complex không tốt hơn simple. Chỉ chấp nhận complex strategy khi beat simple **≥ 2σ** (có significance test, không chỉ Δ điểm).

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
3. Update canonical doc: [RESEARCH_DOCUMENTATION.md](RESEARCH_DOCUMENTATION.md)
4. Update changelog: [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) — thêm cycle mới ở cuối
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
| [RESEARCH_HISTORY.md](RESEARCH_HISTORY.md) | Nhật ký cycle (nơi ghi pre-registered hypothesis) |
| [RESEARCH_DOCUMENTATION.md](RESEARCH_DOCUMENTATION.md) | Canonical results |

---

*Cập nhật: 2026-04-20 — Hợp nhất PLAN + PLAYBOOK + Quant Agent thành pipeline duy nhất; codify pre-registration, significance-on-delta, R1 gate.*

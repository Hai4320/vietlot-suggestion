# Research Review (bản tiếng Việt)

> Bản dịch của [research-review-2026-04-25.md](research-review-2026-04-25.md). Khi có khác biệt, bản gốc tiếng Anh là canonical.

**Đối tượng review:** engine gợi ý số Vietlott (`src/vietlott/cli/suggest.py`, `src/machine_learning/strategies/*`, `src/machine_learning/backtest.py`, `src/vietlott/cli/check_rate.py`).

**Artifact đã kiểm tra:**
- `test/data-24-04.csv` — 24 vé đã lưu (4 thuật toán × 6 vé) cho `power_535`, sinh ngày 2026-04-24.
- 551 kỳ quay `power_535` lịch sử (2025-06-29 → 2026-04-25) trong `data/power535.jsonl`.
- Cả 4 thuật toán dùng cho file CSV đã lưu: `mindistance`, `maxentropy`, `absence`, `bayesian`.

---

## Phán quyết tóm tắt

**Hỏng về căn bản như một công cụ dự đoán, gây hiểu lầm về phương pháp như một artifact nghiên cứu.** Dữ liệu `power_535` về thống kê **không phân biệt được với i.i.d. uniform** (chi-square p ≈ 0.70 cho số chính, p ≈ 0.81 cho số đặc biệt). House edge lý thuyết ≈ 74%. Mọi thuật toán trong engine đang vận hành trên một **kênh nhiễu** và không cung cấp cải thiện expected-value nào so với vé chọn ngẫu nhiên uniform. Các bảng "backtest performance" và bảng leaderboard trong readme có lỗi accounting và lỗi multiple-testing khiến các so sánh **không thể diễn giải**. UX bóng bẩy (slash command, nút "Save to test/", dashboard ROI) đang **chủ động làm tăng niềm tin** của người dùng vào những kết luận mà toán học cấm.

Có thể sửa chữa bằng cách **reframe** từ "dự đoán" sang "đa dạng hóa + null testing", nhưng quỹ đạo sản phẩm hiện tại không vững.

---

## Điểm mạnh

- **Chất lượng code và vệ sinh kỹ thuật cao.** Strategies được type rõ, có docstring, tách biệt; framework backtest có retry/error handling, thậm chí có heuristic `_check_lookback_bias`. Kiến trúc check-rate evaluator (registry per-game + prize_tables là source-of-truth) sạch sẽ.
- **Một số chỗ toán đúng.** Conjugacy Dirichlet-multinomial trong `bayesian_dirichlet.py` được implement đúng (cả công thức và sampling). Mục tiêu Jaccard-distance diversity trong `min_distance_diversity.py` được định nghĩa rõ ràng.
- **Một giá trị thật sự: đa dạng hóa bộ vé.** `MinDistanceDiversityStrategy` và `MaxEntropyStrategy`, *nếu được framing trung thực*, là hữu ích: chúng tạo một portfolio **tối đa coverage** của không gian số. Chúng không tăng expected value — nhưng chúng **giảm variance** của "có ít nhất 1 trong N vé của tôi trúng" so với N lần rút uniform độc lập, khi cấu trúc giải thưởng lồi (convex) theo số match — mà thực tế là vậy. Đây là **lợi ích thật, có thể bảo vệ về mặt toán học (nhỏ)**, khác biệt với dự đoán.
- **`readme.md` có một dòng disclaimer** rằng ROI âm sâu ở quy mô lớn và đây là experiment giáo dục. Tiếc là dòng này bị mâu thuẫn ngay bởi bảng leaderboard ngay phía trên (xem mục Lỗi nghiêm trọng).
- **Crawler dữ liệu và lưu trữ vững.** Dedup theo `id`, sort theo `[date, id]`, JSONL append. Không phải chủ đề của review nhưng đáng ghi nhận như một nền móng ổn định.

---

## Lỗi nghiêm trọng (Critical Errors)

Các lỗi này invalidate những tuyên bố dự đoán và các con số backtest headline.

### 1. Dữ liệu không thể hiện non-uniformity nào ở mức phát hiện được — mọi "edge" đang fit vào nhiễu

Tôi đã chạy chi-square goodness-of-fit Pearson trên toàn bộ 551 kỳ `power_535`:

| Test                              | n     | χ² statistic | df | p-value | Kết luận                           |
| --------------------------------- | ----- | -----------: | -: | ------: | ---------------------------------- |
| Số chính (1–35), 5/kỳ             | 2,755 |        29.26 | 34 |   0.699 | Fail to reject H₀: uniform i.i.d.  |
| Số đặc biệt (1–12), 1/kỳ          |   551 |         6.86 | 11 |   0.810 | Fail to reject H₀: uniform i.i.d.  |

Quan sát min/max tần suất số chính: 66 / 96. Kỳ vọng 78.7. SD lý thuyết per number ≈ √(551·5·(1/35)·(34/35)) ≈ 8.7. SD thực tế qua 35 tần suất là 8.11. **Dữ liệu, ở giới hạn của sample available, là chính xác null uniform-i.i.d.** Không có signal "hot", "cold", "due", hay "Bayesian-posterior" nào tồn tại trong dataset này.

Đây không phải ý kiến. Bất kỳ ai đề xuất ngược lại nợ một test sống sót sau multiple-comparison correction trên implicit search space (bạn đã test ít nhất 8 chiến lược × ~5 hyperparameter mỗi cái, nên kết quả α=0.05 cần Bonferroni với ≥40 tests, tức p<0.00125).

### 2. "1806% ROI cho random play" trong readme là ảo giác kế toán backtest

`src/machine_learning/readme.md` xếp hạng strategies theo ROI trên 26,440 vé power_655 (1322 kỳ × 20 vé). Báo cáo:

| Strategy            | Net Profit (VND) | ROI |
| ------------------- | ---------------: | --: |
| Random              |    +4,777,150,000 | +1806.79% |
| Long Absence        |     −215,250,000 |  −81.41% |

Điều này mâu thuẫn về toán với thực tế trừ khi một trong hai điều đúng: (a) xổ số bị bias nặng và `Random` thắng do may mắn, hoặc (b) toán sai. (a) đã bị falsified bởi §1. Vậy là (b).

Tôi reproduce arithmetic. Với phân phối match báo cáo 561×3-match, 27×4-match, 1×5-match, và bảng giải trong `base.py` (3:50,000; 4:500,000; 5:5,000,000,000):

```
gain = 561·50,000 + 27·500,000 + 1·5,000,000,000 = 5,041,550,000 VND
```

Đúng đúng con số đã báo cáo. **Toàn bộ "+1806% profit" là MỘT cú 5-match draw trả 5 tỷ VND.**

Xác suất ≥ 1 hit như vậy trong 26,440 vé random:
```
P(5-match per ticket) = C(6,5)·C(49,1) / C(55,6) = 1.014e-5
P(≥1 in 26,440 tickets) = 1 − (1 − 1.014e-5)^26440 ≈ 0.235
```

Vậy với chơi thuần random, headline 1806% này xuất hiện với xác suất ≈ **23.5%** — thuần túy do variance. Khoảng cách 1.5e-tỷ-phần-trăm giữa hàng "Random" và "Long Absence" trong leaderboard **không phải so sánh chất lượng strategy**; nó là so sánh "lần random này có hit 5-match không? có vs không". Nó không mang thông tin gì về chất lượng strategy, và toàn bộ ranking 8 strategies đều đứng trên cùng nền tảng đó.

Bug duy nhất này khiến bảng ranking trong readme **không có bằng chứng**. **Cần xóa hoặc thay bằng phân phối null Monte-Carlo cho thấy mỗi strategy nằm ở đâu trong phân phối random-play.**

### 3. `LongAbsenceStrategy` ("absence") là gambler's fallacy giáo khoa

`strategies/long_absence.py` rank số theo days-since-last-appearance và sample từ top-N. Tuyên bố ngầm là số "overdue" có khả năng xuất hiện kỳ tới cao hơn. Với draws độc lập, đây chính xác là **gambler's fallacy**.

**Phản bác:**
Gọi $X_t \in \{1,…,35\}$ là một kỳ quay (treat mỗi vị trí bóng như Bernoulli độc lập cho dễ tractable). Dưới i.i.d. uniformity, $P(\text{số } v \text{ xuất hiện ở kỳ } t \mid \text{lịch sử}) = P(\text{số } v \text{ xuất hiện ở kỳ } t)$ — theo định nghĩa của độc lập. Conditioning set "v vắng mặt k ngày" mang **zero information** cho Bernoulli generating $X_t$. Waiting time giữa các lần xuất hiện là geometric; tính chất *memoryless* của phân phối geometric chính xác là phát biểu hình thức rằng "due" là **không nhất quán**.

**Hệ quả định lượng:**
Chọn từ top-10 số vắng lâu nhất **không** nâng xác suất hit per number lên trên 5/35 = 0.1429. Nó *làm thay đổi distribution của tổng matches per ticket*, nhưng mean **giữ nguyên**, và variance **tăng** (vì bạn dồn mass lên subset 10 phần tử trong khi sự thật là uniform trên 35). Higher variance với cùng mean và prize structure lồi-theo-matches có thể về lý thuyết cải thiện win probability cho jackpot tiers — nhưng readme cho thấy hiệu ứng *ngược*lại (Long Absence là tệ nhất ở −81%), vì variance cũng làm bạn dễ tạo ra vé *zero*-match hơn. **Không có scenario nào dưới i.i.d. uniformity mà strategy này outperform uniform sampling theo kỳ vọng.**

### 4. Posterior `BayesianDirichletStrategy` ("bayesian") tâm ở uniform — sampling tạo ra nhiễu, không phải tín hiệu

`strategies/bayesian_dirichlet.py` build posterior Dirichlet $\theta \mid c \sim \text{Dir}(\alpha_0 + c_1, …, \alpha_0 + c_V)$ với $c_i$ là counts 365 ngày và $\alpha_0 = 1$ default. Với V=35 và $\sum c_i \approx 365 \cdot 5 = 1825$ điển hình (nếu data dày 1 kỳ/ngày — điều chỉnh cadence thật không đổi argument):

- **Posterior mean:** $\hat\theta_i = \frac{\alpha_0 + c_i}{V\alpha_0 + \sum c_j} = \frac{1 + c_i}{35 + 1825} \approx \frac{1+c_i}{1860}$.
- Dưới i.i.d. uniformity, $E[c_i] = 1825/35 = 52.14$, vậy $E[\hat\theta_i] = (1+52.14)/1860 ≈ 0.02857 = 1/35$.
- **Posterior mean bằng đúng prior uniform.** Sampling $\theta \sim$ posterior cho draws scattered quanh 1/35 với concentration $\sum\alpha = 1860$, tức SD per coordinate ≈ $\sqrt{(1/35)(34/35)/1861} ≈ 0.0040$ — khoảng 14% của mean.

Điều này có nghĩa strategy đang **chọn số dựa trên một vector nhiễu** mà magnitude vài phần trăm của mean và **không** mang dịch chuyển posterior khỏi uniform. **Framing Bayesian là lá che — model đang làm rejection sampling quanh uniform với extra steps.** Evidence $c_i$ chỉ shift $\hat\theta$ một cách có ý nghĩa khỏi uniform nếu non-uniformity thật sự có mặt, mà §1 đã loại trừ.

Còn một subtlety về code: phép biến đổi temperature `alpha = (alpha - 1)/temperature + 1` được áp dụng *sau* Bayesian update, điều này **không chuẩn** (temperature thường là construct phía likelihood trong các model softmax-style, không phải Dirichlet hyperparameter). Với temperature < 1 nó có thể đẩy `alpha` về (clamped) 0.01, tạo samples cực đoan — tức một sharpening **không có biện minh Bayesian** mà chỉ tăng sampling variance. Đáng fix hoặc remove.

### 5. Backtest in-flight của `suggest.py` chỉ credit ticket tốt nhất per draw mà charge cost cho TẤT CẢ

`backtest_tickets()` (suggest.py:281–352):
```
for rec in test_records:
    ...
    for i, tk in enumerate(tickets):
        m = len(set(tk["main"]) & draw_main)
        ...
        if m > best_main or (m == best_main and sp_match and not best_sp):
            best_main = m
            best_sp = sp_match
            ...
    rule = resolve_power_535(best_main, best_sp) ...
    if prize_name:
        prize_counter[prize_name] += 1
        total_winnings += prize_amt
total_cost = n_draws * n_tickets * 10_000
```

Chỉ MỘT giải (highest-tier match) được credit per draw, nhưng cost là `n_draws × n_tickets × 10_000`. Trong chơi thật, **mọi vé thắng đều được trả tiền**. Với tier "Encourage" Power 5/35 (10,000 VND cho 0–2 main + special) phủ một *tỷ lệ lớn* các vé, điều này **under-report winnings có hệ thống**. Một lo ngại nhỏ thêm: khi 2 vé hòa main match nhưng chỉ một có special, ordering rule giữ vé first seen — fine, nhưng không document ở đâu cả.

Đây là asymmetry *ngược lại* lỗi #2 (readme over-report bằng cách đếm 1 cú variance hit khổng lồ; engine suggest.py under-report bằng cách collapse per-draw wins về 1). Cả hai đều sai.

**Accounting đúng:** Sum prize qua tất cả vé mỗi kỳ, đúng như chơi thật. Check-rate `Power535Evaluator` (trong `evaluators/power535.py`) thực ra đã làm đúng — nó iterate `for ticket, nums in parsed:` bên trong draw loop và accumulate mỗi giải. Vậy là codebase có *cả* implementation đúng và sai. **CLI user-facing đang dùng cái sai.**

### 6. `Stats` build một lần trên full dataset, rồi "backtest" trên đuôi của cùng dataset

Trong `suggest.py`:
```
stats = Stats(df, main_size, num_min, num_max, sp_max)   # dùng TẤT CẢ kỳ
ticket_list = generate_tickets(stats, tickets, seed=seed)
bt = backtest_tickets(stats, ticket_list, min(backtest_draws, len(stats.records)))
```

Stats object's `freq_30`, `freq_14`, `days_since`, `sum_mean/std`, special stats được tính trên toàn bộ dataframe — *bao gồm chính các kỳ sẽ được score trong backtest*. Tickets sinh ra từ các stats này đã **peek vào tương lai**; "backtest" sau đó hỏi tickets-đã-peek-thông-tin đó performed thế nào trên cùng các kỳ.

Đây là **data leakage**. Không catastrophic (leakage nhỏ so với noise floor i.i.d.), nhưng **không nhất quán về lý thuyết**. Backtest đúng phải, với mỗi kỳ evaluation, recompute statistics chỉ dùng data trước kỳ đó — đó là điều `LongAbsenceStrategy._days_since_last_appearance(target_date)` thực ra làm đúng (chú ý filter `< target_date`). CLI né pattern đó bằng cách collapse tất cả thành một Stats snapshot.

---

## Paradoxes & Fallacies đã nhận diện

### Gambler's Fallacy (long_absence, cũng nhúng trong `Stats.scores`)
**Bằng chứng:** `LongAbsenceStrategy.predict()` rank `sorted_by_absence` và sample `top_n`. `suggest.py::Stats` cộng `0.20 * days_since[v]/mds` vào composite score.

**Phản bác:** Độc lập ⇒ phân phối có điều kiện cho lịch sử bằng marginal. Geometric waiting time là memoryless: $P(T = k+m \mid T > k) = P(T = m)$. "Due" không phải thuộc tính của các quá trình độc lập.

### Reverse Gambler's Fallacy / Hot-Hand Fallacy (frequency hot, exponential_decay, pair_frequency, và các trọng số 0.30 + 0.25 + 0.15 frequency trong `Stats.scores`)
**Bằng chứng:** Composite score = 0.30·freq_30 + 0.25·freq_14 + 0.15·freq_all, tất cả upweight tần suất gần đây.

**Phản bác:** Cùng argument đảo ngược. Nếu xổ số i.i.d. uniform, tần suất gần đây $c_i$ có $E[c_i] = N/V$ và $\text{Var}(c_i) = N\cdot(1/V)(1-1/V)$ — thuần sampling noise. Past frequency mang **không thông tin** về xác suất tương lai. (Subtlety sâu hơn: kể cả nếu xổ số có *bias cố định* về số $v$, frequency strategy sẽ giúp — nhưng chi-square §1 cho thấy bias đó dưới ngưỡng phát hiện, và bias phải *bền theo thời gian* để khai thác được.)

### Texas Sharpshooter (readme so sánh strategy + grouping check_rate.py)
**Bằng chứng:** 8 strategies, rank theo ROI, không FWER correction. "Người thắng" là bất kỳ ai may mắn hit một giải tier-cao trong cửa sổ backtest.

**Phản bác:** Với K strategies độc lập test ở α = 0.05:
- K=4 (set absence/bayesian/maxentropy/mindistance trong `data-24-04.csv`): FWER = 1 − 0.95⁴ ≈ 18.5%.
- K=8 (readme): FWER = 1 − 0.95⁸ ≈ 33.7%.

Nhưng K thực ra **lớn hơn** vì mỗi strategy có hyperparameters đã được chọn (lookback_days ∈ {30, 90, 180, 365}, top_n, prior_strength, temperature, half_life, selection_weight, …). Ước lượng hợp lý implicit search space K ≈ 50, cho FWER ≈ **92%**. **Bất kỳ strategy "thắng" nào ở α=0.05 không adjusted về cơ bản chắc chắn là tốt nhất do may, không phải do edge.**

### Multiple Comparisons / Look-Elsewhere Effect
Như trên — lặp lại, vì đây là **tội thống kê chủ đạo** trong project.

### Survivorship Bias
**Bằng chứng:** Danh sách strategies là một set đã curated; strategies performed kém trong development không thấy được. So sánh được công bố là conditioned trên "strategies sống sót đến publication."

### Reification of Statistical Artifacts
**Bằng chứng:** `MaxEntropyStrategy` chia 1–35 thành 5 dải và sample một số per dải. Tên gợi ý một bảo đảm information-theoretic. **Không có gì như thế.** Nó chỉ enforce structural diversity. Tên đang reify một sampling constraint thành một thuộc tính algorithmic của data.

### Goodhart's Law (latent)
**Bằng chứng:** Một khi "ROI on backtest" trở thành leaderboard target, mọi strategy sẽ bị tinh chỉnh (có ý thức hay không) để maximize nó trên cửa sổ lịch sử — không phải để dự đoán thật.

### Conjunction-Adjacent Reasoning
**Bằng chứng:** Composite score trong `suggest.py::Stats` là `0.30·freq_30 + 0.25·freq_14 + 0.20·days_since + 0.15·freq_all`, sum = **0.90** (chú ý: không normalize). Trọng số không có biện minh, components có correlate, và tổng-bằng-0.90 với "+0.10 ngầm" tách riêng là đáng nghi. Đọc như recipe hand-tuned trình bày như nó là posterior có nguyên tắc. Bất kể ưu điểm thực nghiệm thế nào, nó *không phải* một đại lượng Bayesian hay information-theoretic.

### Berkson's Paradox / Selection Bias (tiềm năng, trong UX check_rate)
**Bằng chứng:** User "save" vé họ thích. Sau đó họ evaluate. Lựa chọn vé nào để save là **non-random**. Đánh giá hình thức cần fix một protocol evaluation *trước* khi vé đã save được score lên các kỳ.

---

## Lo ngại methodology

Các điều này **làm yếu nhưng không single-handedly invalidate** công việc; fix chúng và engine trở thành công cụ research trung thực hơn.

1. **Không spec reproducibility.** Seed default trong `suggest.py` là `int(datetime.now().timestamp())` — tức **tươi mỗi lần chạy**. User không thể reproduce CSV đã save. CSV cũng không record seed. Thêm `seed` (và library versions) như cột bắt buộc của CSV.

2. **Không có baseline comparison, không bao giờ.** Mọi backtest của strategy cần báo cáo cùng với (a) một uniform-random baseline run với *cùng* seed-class và số vé, và (b) một phân phối null Monte-Carlo simulated của cùng metric. Không có chúng, các con số ROI riêng lẻ **không đọc được**.

3. **Không có effect-size hay confidence interval.** Bảng phân phối match cho counts nhưng không có uncertainty. Với ~50 backtest draws (default suggest.py), gần như mọi khác biệt giữa strategies nằm trong ±2σ của zero.

4. **`check_rate.py` không adjust cho multiple algorithm groups.** Nó iterate `(game × algorithm)` groups và in một bảng per group. Không aggregate p-value, không corrected comparison.

5. **`backtest.py::_calculate_sharpe_ratio` sai về khái niệm cho xổ số.** Sharpe giả định một series return phân phối liên tục với moment thứ hai hữu hạn; series profit của xổ số bị dominated bởi sub-cent EV per ticket xen lẫn các spike scale-jackpot, nên empirical mean và SD cực kỳ heavy-tailed và **Sharpe ill-defined** (trong finite samples nó bị dominate bởi việc có hay không 1 jackpot hit). Annualize bằng `√52` cũng không có biện minh cho lottery có effective draw cadence mà code không thực sự inspect. **Remove Sharpe khỏi metrics; thay bằng median match count và MC-null percentile của win count.**

6. **Heuristic `_check_lookback_bias` đang check sai thứ.** Nó tìm tên attribute kiểu `predict_future` hoặc `future_data`. Look-ahead bias thực sự trong codebase là **structural** (Stats build trên full dataframe trong `suggest.py`) — heuristic không thấy nó.

7. **Ensemble strategy chưa review sâu, nhưng cờ.** `strategies/ensemble.py` có thể combine các strategies khác. Nếu nó làm thế bằng weighting trên backtest performance, nó **in-sample-optimized** và cần test out-of-sample.

8. **`detect_game_shape` infer `sp_max` từ max special đã quay.** Nếu special range là 1–12 nhưng 551 kỳ gần nhất tình cờ top out ở 11, engine sẽ underestimate sp_max và **không bao giờ chọn 12**. Harm thật nhỏ, nhưng **biểu thị việc dùng data để infer *cấu trúc*** trong khi cấu trúc nên đến từ source-of-truth prize-table.

---

## Các vấn đề Statistical / Mathematical

1. **Độc lập của các bóng "main" chưa được test.** Tôi đã test marginal frequencies. Chi-square **không thể detect dependencies *cặp*** (vd "nếu 7 quay ra, 14 dễ ra hơn"). Test đúng sẽ compute observed vs. expected pair counts trên C(35,2) = 595 cặp. Với 551 kỳ × C(5,2) = 5510 pair-occurrences quan sát, expected per pair là 5510/595 ≈ 9.26 — borderline cho chi-square individual-cell, fine in aggregate. **Khuyến nghị thêm test này.** Tôi dự đoán nó cũng fail to reject. Nhưng cho đến khi test, claims về pair-frequency strategies (`PairFrequencyStrategy`) **doubly unfounded**.

2. **Thiếu power analysis.** Với 551 kỳ, effect size minimum nào có thể detect? Cho single-number-bias ε trong xác suất per-draw (5/35 + ε), test có α=0.05 power ≥ 0.8 để detect khoảng ε ≈ 0.012 (tức bias tương đối 8% trên một số). Bất cứ gì nhỏ hơn là **vô hình** ở n này. Vậy phát biểu *trung thực* là "không có single-number bias detectable lớn hơn ~8% xác suất uniform". Strategies đang tìm bias **dưới sàn đó rất xa**.

3. **Conditional independence của số đặc biệt chưa test.** Cấu trúc data là `[m1,m2,m3,m4,m5,sp]`. Việc sp có độc lập với các m hay không (kỳ vọng từ máy bóng riêng biệt) cần test với Cramer's V hoặc mutual-information trên joint table. Eyeball nhanh confirm không có dependence rõ ràng, nhưng **cần được báo cáo**.

4. **Phép biến đổi temperature Dirichlet đáng nghi về toán.** `alpha = (alpha - 1)/temperature + 1` là linear shrinkage của $\alpha-1$ quanh 0; gọi nó là "temperature" gợi ý softmax-style flattening nhưng quan hệ giữa Dirichlet concentration và predictive entropy là **không trivial** và không phải scaling temperature đơn giản. Cần derivation hoặc remove.

5. **Công thức `roi`:** `(total_winnings - total_cost) / total_cost * 100` arithmetic ổn nhưng **interpretation trong setting winner-takes-all** (1 jackpot dominate) là **misleading hoang dã**. Báo cáo median ROI qua nhiều simulated runs, không phải single observed ROI.

6. **`max_entropy.py` đặt tên sai.** Maximum entropy trên discrete uniform support là *uniform* distribution. Stratified sampling **không phải** maxent; nó là một dạng variance reduction bằng cách đảm bảo coverage dải. Implementation hiện tại fine như diversification heuristic nhưng nên đổi tên `StratifiedSamplingStrategy` để tránh gợi ý một bảo đảm xác suất nó không deliver.

7. **`LongAbsenceStrategy` dùng `random.sample` của Python sau cache** — nhưng `random` là **shared global state**; nếu hai strategies chạy interleaved không seeding, results **không deterministic**. Dùng instance `random.Random(seed)` strategy-local.

---

## Đánh giá Benefit & Impact

### Giá trị thật
- **Giáo dục, nếu framing như counterfactual.** Codebase là phương tiện tuyệt vời cho dạy: build cái gì đó "trông như prediction", chạy chi-square phá vỡ tiền đề, sau đó walk through cách edge bề ngoài của mỗi strategy collapse dưới Monte-Carlo null. Đó là **kết quả chất lượng cao**.
- **Đa dạng hóa, khi scoping trung thực.** `MinDistanceDiversityStrategy` và `MaxEntropyStrategy` (đã đổi tên) có thể useful nếu user *sẽ* chơi dù sao — chúng giảm variance của "ít nhất 1 trong N vé hit bất kỳ giải", với **zero expected-value cost**. Đây là benefit nhỏ, nhưng **thật**, và **trực giao với prediction**.

### Rủi ro tổn hại
- **Coi tool này như predictive sẽ tốn tiền user theo trung bình.** EV per ticket 2,594 VND so với cost 10,000 VND. Mỗi 100 vé chơi tốn kỳ vọng **740,000 VND**. UX bóng bẩy làm cảm giác mất này như **tiến bộ**.
- **Nút "Save to test/" + workflow tracking là gambling-engagement loop trong mọi thứ trừ tên gọi.** Generate → save → wait for draw → score → repeat. Đó là cùng dopamine cycle mà các operator gambling licensed thiết kế quanh. Framing "research" **không phải lá chắn pháp lý hay đạo đức**.
- **Framing misleading trong artifacts đã công bố.** Leaderboard readme đặt random + 1806% ngay cạnh long-absence − 81% **không có caveat** rằng khác biệt là 1 cú variance. Ai đó forward bảng đó cho bạn vừa mới spread thông tin sai.
- **Vulnerable populations.** Người chơi xổ số đã over-represented ở demographic thu nhập thấp. Một tool free, polished, tiếng Việt mà "predict" số Vietlott reach **đúng audience ít trang bị nhất để evaluate methodology**.

### Cost-benefit
- Nỗ lực engineering chìm vào strategy zoo: substantial. Insight predictive marginal sản xuất: **zero** (theo §1).
- Tái phân bổ effort đó vào (a) một tool baseline trung thực "uniform-i.i.d." duy nhất, (b) visualizer null Monte-Carlo, (c) hiển thị EV per-ticket trong UI, sẽ mang lại **giá trị research nhiều hơn nhiều** và **uplift rủi ro gambling xấp xỉ zero**.

### Khuyến nghị đạo đức
1. **Remove leaderboard ROI khỏi `machine_learning/readme.md`.** Thay bằng phân phối density null Monte-Carlo của "winnings on N tickets over M draws" và overlay mỗi strategy như đường dọc. **Mắt sẽ tự thấy sự thật.**
2. **Thêm thông báo bắt buộc trước hành động cho nút "Save to test/"**: "Các gợi ý này có expected return là −74%. Lưu chúng không cải thiện odds của bạn." Bằng tiếng Việt, **prominent**.
3. **Thêm EV per-ticket vào mọi output.** `2,594 VND expected return on 10,000 VND ticket` cần xuất hiện cạnh mọi gợi ý.
4. **Reframe README project từ prediction sang randomness pedagogy.** "Vietlott data + tools để demonstrate rằng kết quả xổ số không thể predict."
5. **Strip `LongAbsenceStrategy`, `FrequencyStrategy(hot|cold)`, `ExponentialDecayStrategy`** khỏi suggestion paths. Giữ chúng chỉ trong package explicit `gamblers_fallacy_demos/` với **comments refutation ở đầu**.

---

## Khuyến nghị (đã prioritize)

| # | Priority   | Hành động                                                                                                   | Lý do                                  |
| - | ---------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1 | **MUST**   | Thay leaderboard ROI trong readme bằng density null Monte-Carlo.                                            | Bảng hiện tại là misinformation.        |
| 2 | **MUST**   | Thêm cảnh báo house-edge −74% / −EV vào output suggest CLI và UI "Save to test/".                            | Bảo vệ user.                            |
| 3 | **MUST**   | Fix `suggest.py::backtest_tickets` để credit *tất cả* vé thắng per draw, không chỉ best.                     | Correctness.                            |
| 4 | **MUST**   | Bắt `Stats` recompute strictly per-evaluation-date trong mọi backtest. Loại bỏ leakage single-Stats.        | Look-ahead bias.                        |
| 5 | **HIGH**   | Thêm so sánh null Monte-Carlo vào mọi output backtest: percentile của metric quan sát vs simulated null.    | Không có nó, không kết quả nào diễn giải được. |
| 6 | **HIGH**   | Thêm Bonferroni / BH correction vào bảng so sánh K-strategy trong `check_rate.py`.                          | Family-wise error rate.                 |
| 7 | **HIGH**   | Record và emit `seed` trong mọi hàng CSV đã save.                                                            | Reproducibility.                        |
| 8 | **HIGH**   | Drop `Sharpe ratio` khỏi `BacktestResult` hoặc thay bằng metric percentile non-parametric.                  | Heavy-tailed return; Sharpe sai.        |
| 9 | **MEDIUM** | Test pair-frequency independence trong data; báo cáo kết quả.                                                | Đóng cửa với edge pair_frequency.       |
| 10| **MEDIUM** | Đổi tên `MaxEntropyStrategy` → `StratifiedSamplingStrategy`. Document rằng nó là variance reduction, không phải prediction. | Naming trung thực.                  |
| 11| **MEDIUM** | Remove `temperature` transform khỏi `BayesianDirichletStrategy` hoặc derive nó hình thức.                   | Vệ sinh toán học.                       |
| 12| **LOW**    | Move `LongAbsenceStrategy` và `FrequencyStrategy` sang namespace `demos/gamblers_fallacy/` với refutation trong docstring. | Ngăn re-export tương lai như suggestions. |
| 13| **LOW**    | Dùng instance `random.Random(seed)` strategy-local xuyên suốt, không phải `random` global.                  | Determinism.                            |

---

## Mức độ tin tưởng (Confidence Level)

**Tin tưởng cao** ở:
- Kết quả chi-square i.i.d. trên `power_535` (computed trực tiếp từ `data/power535.jsonl`, 551 kỳ, p ≈ 0.70 main, p ≈ 0.81 special).
- House edge lý thuyết −74% (closed-form EV calculation đối chiếu với `prize_tables.py`).
- Reproduction "1806% Random ROI" của readme như sự kiện variance single-jackpot với xác suất baseline ~23.5% xảy ra.
- Bug accounting backtest trong `suggest.py::backtest_tickets` (đọc trong source, đã trace).
- Data leakage trong single-snapshot `Stats` (đọc trong source, đã trace).
- Phản bác toán học của gambler's fallacy và posterior-converges-to-uniform dưới i.i.d. (textbook).

**Tin tưởng trung bình** ở:
- Magnitude chính xác của FWER inflation qua implicit hyperparameter grid (estimate K=50 là order-of-magnitude, không exact).
- Empirical claim rằng `MinDistanceDiversityStrategy` thực sự giảm variance cho prize structure lồi (đúng dưới giả định hợp lý, không formally verify cho prize table `power_535` chính xác ở đây).

**Điều gì sẽ thay đổi đánh giá của tôi:**
- Một backtest pre-registered, walk-forward nơi mọi strategy được so sánh với null Monte-Carlo của cùng n trên data shuffled-history, với FWER corrected, mà **vẫn produce ROI > null distribution của random ở p < 0.001 sau K-correction**. Tôi sẽ update đáng kể. Cho đến đó, prior của tôi là **không có edge tồn tại** và mọi xuất hiện của một là **artifact methodology**.
- Một nghiên cứu cơ học / vật lý của máy quay Vietlott thực tế cho thấy vấn đề calibration. Cho đến đó, bằng chứng data **nhất quán với i.i.d. uniform**.
- Bằng chứng reproducibility: re-run backtest readme với RNG seed khác và obtaining ranking tương tự sẽ shift đánh giá của tôi về phía "có signal nào đó". **Tôi dự đoán ranking sẽ không nhận ra được.**

---

*Ghi chú reviewer cho user:* code trong repo này tốt; **science thì không**. Việc giá trị nhất project này có thể làm cho cuộc sống con người là **trung thực về toán** và channel UX xuất sắc của nó vào việc cho user thấy rằng **xổ số không thể bị beat**. Đó tự nó là một kết quả publishable, hữu ích.

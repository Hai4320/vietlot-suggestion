# Case Study — Vietlott Prediction Project

> Project mà bộ toolkit này được rút ra. Đọc để thấy quy trình áp dụng vào một bài toán thật, các sai lầm đã trải qua, và cách pivot dẫn đến output có giá trị thật.

## Bối cảnh

**Bài toán**: Crawl, lưu và phân tích kết quả xổ số Vietlott (Power 5/35, Power 6/45, Power 6/55, Keno, 3D, 3D Pro, Bingo18). Mục đích ban đầu (ngầm): tìm chiến lược dự đoán/chọn số tốt hơn ngẫu nhiên.

**Domain**: Cực kỳ ngẫu nhiên (xổ số dựa trên cơ học vật lý gần i.i.d. có chủ đích). Đây là nơi gambler's fallacy mạnh nhất.

## Pha 1: Frame (đã làm thiếu sót ban đầu)

**Câu hỏi ban đầu (ngầm)**: "Có chiến lược chọn số nào tốt hơn ngẫu nhiên không?"

**Vấn đề**: Câu hỏi không pre-specify "tốt hơn theo metric nào", "khi nào tôi tuyên bố không tốt hơn".

→ **Bài học**: Charter (xem [templates/charter.md](../templates/charter.md)) quan trọng. Nếu không pre-commit, dễ HARK và optional-stop.

## Pha 2: Hypothesize (đã thử quá nhiều)

Đã code và backtest **>10 chiến lược** (xem [src/machine_learning/strategies/](../../src/machine_learning/strategies/)):

- `frequency` — chọn theo tần suất xuất hiện
- `long_absence` — chọn các số "lâu chưa ra" (due numbers)
- `pair_frequency` — cặp số hay đi cùng nhau
- `pattern` — tìm pattern trong chuỗi quay
- `exponential_decay` — frequency có decay theo thời gian
- `bayesian_dirichlet` — Dirichlet prior trên distribution các số
- `max_entropy` — max entropy distribution với một số constraints
- `min_distance_diversity` — chọn số có khoảng cách lớn
- `not_repeat` — không lặp số kỳ trước
- `pattern` (variant) — recurring patterns
- `wheeling` — wheeling system
- `adaptive_window` — window size thích ứng
- `ensemble` — kết hợp các strategies
- `random_strategy` — baseline

**Vấn đề nhận ra (sau)**: Mỗi chiến lược thử = một lần gieo xúc xắc tìm noise. Với 10+ chiến lược và α=0.05, kỳ vọng có 0.5+ chiến lược "có ý nghĩa" thuần ngẫu nhiên.

→ **Bài học**: Phải pre-specify số chiến lược, áp dụng multiple-comparison correction. Xem [04-validation.md](../method/04-validation.md) §3.

## Pha 3: Validate (đã phát hiện nhiều bẫy)

Khi nghiêm túc backtest, các phát hiện:

### 3.1 Mọi chiến lược "frequency-based" đều là gambler's fallacy biến thể

- "Hot numbers" (số hay ra) → giả định non-stationarity hoặc bias vật lý không có bằng chứng.
- "Due numbers" (số lâu chưa ra) → giả định "phải ra để cân bằng" — sai cho i.i.d.
- "Pair frequency" → tìm pattern trong noise (Texas sharpshooter).

### 3.2 Backtest trên dữ liệu lịch sử cho kết quả đẹp giả

Nguyên nhân:
- **In-sample fitting**: chiến lược tinh chỉnh trên cùng dữ liệu test trên đó.
- **Multiple-comparison**: 10+ chiến lược, một số tự nhiên trông tốt.
- **Survivorship**: backtest trên giai đoạn cụ thể, không robust cross time.

### 3.3 Sanity check với shuffled data

Nếu xáo trộn ngẫu nhiên kết quả lịch sử và chạy lại các chiến lược → **kết quả tương tự với chiến lược ngẫu nhiên**. Đây là dấu hiệu mạnh: chiến lược không thực sự "thấy" pattern, chỉ exploit cấu trúc trong giai đoạn cụ thể.

→ **Bài học**: Permutation/shuffle test là defense mạnh, đáng làm với mọi predictive claim.

## Pha 4: Adversarial Review

Đã tạo agent `research-rigor-reviewer` (xem [.claude/agents/research-rigor-reviewer.md](../../.claude/agents/research-rigor-reviewer.md)) với mandate:

- Tìm gambler's fallacy và biến thể.
- Kiểm tra lookahead bias trong backtest.
- Đánh giá multiple-comparison correction.
- Cảnh báo nếu chiến lược thúc đẩy hành vi đánh bạc có hại.

Bộ rigor-reviewer trong toolkit này ([agents/rigor-reviewer.md](../agents/rigor-reviewer.md)) là **phiên bản domain-agnostic** của agent đó — đã được generalize để dùng cho lĩnh vực bất kỳ.

→ **Bài học**: Adversarial reviewer (con người hoặc AI) là khoản đầu tư đắt giá nhất trong nghiên cứu. Không có nó, confirmation bias không bị chặn.

## Pha 5: Reframe (output thực sự có giá trị)

Sau khi chấp nhận: **không có edge dự đoán** (xổ số đúng là i.i.d.), project pivot theo 2 hướng:

### Hướng B — Coverage / Đa dạng

Engine `suggest.py` chuyển từ "predict winning numbers" sang **"diversity-first ticket selection"**:

- Composite score nhẹ (frequency, recency) chỉ làm seed.
- Constraint: mỗi số xuất hiện ≤ ceil(N×5/35)+1 lần across N tickets.
- Special numbers (1-12) round-robin → coverage tối đa.
- Backtest đo **coverage và prize distribution**, không "expected ROI".

Kết quả: với 10 vé Power 5/35, đạt 100% coverage 1-35 cho main numbers — không tăng EV (vẫn negative-sum), nhưng tăng xác suất ít nhất 1 vé thắng giải nhỏ và làm trải nghiệm chơi đa dạng.

### Hướng C — Giải trí có ý thức

UI/UX rewrite (commit `1953acf`):

- Toàn bộ giao diện tiếng Việt thân thiện.
- Bỏ jargon kỹ thuật ("backtest", "ROI", "expected value" → "thử lại với kỳ trước", "tiền vé thu lại").
- Thêm disclaimer rõ ràng: "Xổ số là ngẫu nhiên. Đây là giải trí, không phải kế hoạch tài chính. Chơi có trách nhiệm."
- Nút "Lưu vào test/" để xuất gợi ý ra CSV theo dõi sau (commit `1115420`) — biến project thành **companion để chơi có ý thức**, không phải tool dự đoán.

→ **Bài học**: Pivot **trung thực** thành entertainment có giá trị thật. Pivot **giả** (vẫn bán "có edge" với từ ngữ khác) là lừa dối.

## Bẫy đã đối mặt

Theo [03-fallacies.md](../method/03-fallacies.md):

- ✅ **Gambler's fallacy**: trực tiếp trong long_absence, frequency strategies.
- ✅ **Hot hand**: trong frequency-weighted strategies.
- ✅ **Texas sharpshooter**: pair_frequency, pattern strategies — tìm pattern sau khi nhìn dữ liệu.
- ✅ **P-hacking / multiple comparison**: 10+ chiến lược thử trên cùng dataset.
- ✅ **Confirmation bias**: ban đầu chú ý các backtest "đẹp" hơn các backtest fail.
- ✅ **Goodhart drift**: backtest metric (số lần thắng) trở thành mục tiêu, không phải mục tiêu thật (giải trí có ngân sách).

## Bài học đặc thù domain

Bổ sung vào fallacy list cho domain xổ số / random-number:

- **"Patterns trong dãy ngẫu nhiên trông giống pattern thật"**: não người tìm pattern kể cả khi không có. Mỗi pattern bạn "thấy" cần test out-of-sample.
- **"Backtest improvement không sống sót"**: edge nhỏ trong backtest thường biến mất khi tính chi phí vé, thuế, behavioral adherence.
- **"Coverage strategy không phải edge"**: phải cẩn thận không nói/bán nó như một edge. Nó chỉ làm distribution rủi ro khác đi, không tăng EV.

## Tài sản tái sử dụng từ project

- **Crawler infrastructure**: tái sử dụng được cho bất kỳ data với cấu trúc tương tự.
- **Backtest framework**: ([src/machine_learning/backtest.py](../../src/machine_learning/backtest.py)) — pattern dùng được cho bất kỳ predictive strategy.
- **Adversarial reviewer agent**: đã generalize thành [agents/rigor-reviewer.md](../agents/rigor-reviewer.md).
- **UX-first reframing pattern**: rewrite jargon → friendly language khi pivot từ "tool có edge" sang "tool giải trí có ý thức". Pattern này áp dụng được cho mọi product có positioning thay đổi.
- **Bộ toolkit này**.

## Nếu làm lại từ đầu

Với nhận thức bây giờ, sẽ làm khác:

1. **Pre-commit charter** trước khi code dòng đầu tiên — cam kết tiêu chí "tôi sẽ tuyên bố không có edge khi ..."
2. **Pre-specify số chiến lược** — tối đa 3-5, không 10+.
3. **Train/val/test split** từ đầu, test set chỉ chạm 1 lần ở cuối.
4. **Permutation test** sớm — trước khi đầu tư công sức tinh chỉnh chiến lược.
5. **Pivot decision sớm hơn**: ngay sau pha validate đầu tiên không đạt, không kéo dài thêm 5 chiến lược.
6. **Output là honest entertainment tool từ đầu** — không phải pretend predictive tool rồi pivot.

Tổng thời gian tiết kiệm được nếu làm theo: ước lượng 60-70%. Nhưng các "thất bại" cũng tạo ra bộ toolkit này — không hẳn là lãng phí.

## Liên hệ tới đời sống

Pattern "đầu tư vào giả thuyết yêu thích → backtest trông đẹp → reviewer tìm ra lỗi → pivot trung thực sang giá trị thật" áp dụng cho:

- **Đầu tư cá nhân**: tin có hệ thống → backtest đẹp → friction giết edge → pivot sang index investing.
- **Productivity hack**: tin morning routine X tối ưu → tracker cho thấy không tương quan → pivot sang "consistency, không phải optimization".
- **Diet experiment**: tin keto/IF/X giải quyết vấn đề → kết quả không robust → pivot sang "ăn ít junk + đủ ngủ".

Trong mọi trường hợp, **value trung thực sau pivot > value giả vờ trước pivot**.

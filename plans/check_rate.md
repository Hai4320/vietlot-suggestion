# Check-rate — Kế hoạch triển khai (CLI + Website)

Tính năng mới: đọc CSV chứa các bộ số (xuất từ `suggest` hoặc nhập tay), đối chiếu với lịch sử để tính **tỷ lệ trúng theo từng giải, theo từng trò, theo từng thuật toán**, kèm thống kê **exact-match history** (bộ số đã từng được quay hay chưa).

2 mặt trận song song:
- **CLI Python**: `vietlott-check-rate INPUT.csv [--backtest-draws N] [--latest-n N] [--product P]`
- **Website**: route `/check-rate` — paste CSV hoặc upload file → render ngay trên browser (client-side TS, không upload server).

---

## 0. Quyết định kiến trúc

**Client-side TypeScript evaluator trên website** (không gọi Python từ API route).

| Lý do | Chi tiết |
|---|---|
| Logic nhỏ | Subset match + prize lookup ~50 dòng/product → port sang TS rẻ |
| Privacy | CSV user không rời máy |
| Deploy đơn giản | Next.js không cần Python runtime |
| Parity | Golden fixture dùng chung pytest + Node smoke test |

Tradeoff: duplicate logic Python/TS — chặn drift bằng golden fixture tests.

**Không dùng TS unit test framework** (bỏ qua vitest/jest). Parity enforce qua 1 Node script đọc cùng fixture JSON rồi gọi TS evaluator, diff với expected — chạy trong `npm run build` pipeline hoặc `make check-rate-parity`.

---

## 1. CSV schema (chuẩn duy nhất, dùng chung CLI + website)

Một dòng = một vé. Gom nhóm theo cặp `(game, algorithm)` khi tính thống kê.

| Cột | Mô tả | Ví dụ |
|---|---|---|
| `game` | Tên product khớp `product_config_map` | `power_535`, `power_645`, `power_655`, `3d`, `3d_pro` |
| `algorithm` | Nhãn user đặt, dùng để gom nhóm | `diversity_v1`, `frequency`, `manual` |
| `ticket_no` | Số thứ tự trong batch | `1` |
| `numbers` | Các số chính space-separated (Power) **hoặc** 1 số 3-digit zero-padded (3D) | `"7 9 10 16 19"` / `"015"` |
| `special` | Số đặc biệt 1–12 (chỉ `power_535`), để trống cho các game khác | `3` |

**Power 655:** cột `special` luôn trống (user ticket không chọn bonus ball).

---

## 2. Output (4 khối — giống hệt ở CLI và UI)

Với mỗi cặp `(game, algorithm)`:

1. **Prize-tier hit rate**: prize name × count × % of draws × total VND
2. **Match distribution**: match count (Power) hoặc tier (3D) × draws × %
3. **Aggregate ROI**: total cost vs total winnings, ROI %
4. **Exact-match history**: mỗi vé — đã trùng y hệt bao nhiêu lần, liệt kê occurrences gần nhất

Ngoài ra có **Latest-N block** (tách riêng): chi tiết K kỳ quay gần nhất, ai trúng giải gì.

### Semantic exact-match theo game (đã chốt)

- **Power 535/645/655**: tập main-numbers của vé == tập main-numbers draw (bỏ special/bonus).
- **3D / 3D Pro**: số 3-digit của vé xuất hiện trong bất kỳ tier nào của draw.

### Tier collision 3D (đã chốt)

Nếu 1 số 3-digit trùng nhiều tier cùng kỳ → **cộng dồn** tiền giải (đúng quy chế Vietlott).

---

## 3. Bảng giải (`config/prize_tables.py` — Python + mirror TS)

Jackpot dùng mức **min công bố** (6B/12B/30B/3B) — mục đích so sánh thuật toán, không dự đoán tiền thật.

### 3.1 Power 5/35
| Tier | Điều kiện | VND |
|---|---|---|
| Jackpot | 5 main + special | 6,000,000,000 |
| 2nd | 5 main | 5,000,000 |
| 3rd | 4 main + special | 500,000 |
| 4th | 4 main | 100,000 |
| 5th | 3 main + special | 30,000 |
| Encourage | 3 main no sp / (0–2 main + sp) | 10,000 |

### 3.2 Power 6/45 (Mega)
| Tier | Điều kiện | VND |
|---|---|---|
| Jackpot | 6 main | 12,000,000,000 |
| 1st | 5 main | 10,000,000 |
| 2nd | 4 main | 300,000 |
| 3rd | 3 main | 30,000 |

### 3.3 Power 6/55
| Tier | Điều kiện | VND |
|---|---|---|
| Jackpot 1 | 6 main | 30,000,000,000 |
| Jackpot 2 | 5 main + bonus ball | 3,000,000,000 |
| 1st | 5 main (no bonus) | 40,000,000 |
| 2nd | 4 main | 500,000 |
| 3rd | 3 main | 50,000 |

### 3.4 Max 3D
| Tier | VND | Note |
|---|---|---|
| Giải Đặc biệt | 1,000,000 | |
| Giải Nhất | 350,000 | |
| Giải Nhì | 210,000 | |
| Giải ba | 100,000 | |
| KK 2 số cuối | 100,000 | trùng 2 digit cuối của Đặc biệt |

### 3.5 Max 3D Pro — **placeholder**, verify trước Phase 5
Schema tier giống 3D, amounts tạm dùng placeholder. Cần tra cứu quy chế Vietlott chính thức khi tới Phase 5.

---

## 4. Cấu trúc module

### 4.1 Python (repo root)

```
src/vietlott/
├── cli/
│   ├── check_rate.py              # [P0 ✓] click CLI
│   └── suggest.py                 # [P1] thêm --export-csv, --algorithm
├── check_rate/
│   ├── models.py                  # [P0 ✓] Ticket, EvalResult, HistoryMatch, PerDrawHit
│   ├── io.py                      # [P0 ✓] read/write CSV
│   ├── loader.py                  # [P0 ✓] load JSONL → normalized list[dict]
│   ├── reporter.py                # [P0 ✓] tabulate formatter
│   └── evaluators/
│       ├── base.py                # [P0 ✓] BaseEvaluator + registry
│       ├── power535.py            # [P1]
│       ├── power645.py            # [P2]
│       ├── power655.py            # [P3]
│       ├── p3d.py                 # [P4]
│       └── p3d_pro.py             # [P5]
├── config/
│   └── prize_tables.py            # [P0 ✓]
└── tests/check_rate/              # [P0 ✓] 22 tests đang chạy
```

### 4.2 Website (TypeScript)

```
website/src/
├── app/
│   └── check-rate/
│       └── page.tsx               # [W0+P1] route /check-rate
├── components/check-rate/
│   ├── CsvInput.tsx               # [W0+P1] textarea + file upload
│   ├── ResultCard.tsx             # [W0+P1] 1 card per (game, algorithm)
│   ├── PrizeTable.tsx             # [W0+P1]
│   ├── MatchDistChart.tsx         # [W0+P1] recharts bar
│   ├── HistoryList.tsx            # [W0+P1]
│   └── CopyAsCsvButton.tsx        # [W0+P1] trên /suggest, /power-535, etc.
└── lib/check-rate/
    ├── types.ts                   # [W0] Ticket, EvalResult (mirror Python models)
    ├── io.ts                      # [W0] parse CSV string → Ticket[]
    ├── loader.ts                  # [W0] fetch public/data/<game>.json
    ├── prize_tables.ts            # [W0] mirror of Python prize_tables
    ├── reporter.ts                # [W0] format EvalResult for display
    ├── registry.ts                # [W0] EVALUATORS registry + dispatch
    └── evaluators/
        ├── power535.ts            # [P1]
        ├── power645.ts            # [P2]
        ├── power655.ts            # [P3]
        ├── p3d.ts                 # [P4]
        └── p3d_pro.ts             # [P5]
```

### 4.3 Golden fixtures (dùng chung)

```
tests/fixtures/check_rate/
├── power_535_sample.csv
├── power_535_sample.expected.json     # output EvalResult + HistoryMatch[]
├── power_535_draws.json               # minimal synthetic draws for determinism
├── power_645_sample.csv / expected / draws
├── power_655_sample.csv / expected / draws
├── p3d_sample.csv / expected / draws
└── p3d_pro_sample.csv / expected / draws
```

Pytest load fixture → chạy Python evaluator → `assert result == expected`. Node script (`scripts/verify_check_rate_parity.mjs`) load cùng fixture → chạy TS evaluator → diff `expected.json`. CI chạy cả 2.

---

## 5. Phase chi tiết

### Phase 0 — Python Foundation ✅ DONE

Tóm tắt: `config/prize_tables.py` + `check_rate/` package + CLI skeleton + 22 unit tests. Registry sẵn sàng cho evaluators plug vào. CLI chạy end-to-end với dummy output "no evaluator registered".

---

### Phase W0 + Phase 1 — Website infra + Power 5/35 end-to-end (**PR lớn nhất**)

**Mục tiêu:** user vào `/check-rate`, paste CSV Power 535, xem kết quả ngay. Ship MVP website.

#### W0 deliverables (website infra, agnostic product)

1. `lib/check-rate/types.ts` — mirror Python `Ticket`, `EvalResult`, `HistoryMatch`, `PerDrawHit`
2. `lib/check-rate/io.ts` — `parseCsv(text: string): Ticket[]` + validation lỗi rõ ràng (dòng số mấy, lỗi gì)
3. `lib/check-rate/prize_tables.ts` — mirror Python resolvers (`resolvePower535`, etc.)
4. `lib/check-rate/registry.ts` — `BaseEvaluator` interface + `EVALUATORS` map
5. `lib/check-rate/loader.ts` — `loadDraws(game): Promise<Draw[]>` fetch `/data/<file>.json`
6. `lib/check-rate/reporter.ts` — utility format tiền VND, %, etc.
7. `app/check-rate/page.tsx` — route shell (có thể là server component dùng `"use client"` cho form)
8. `components/check-rate/CsvInput.tsx` — Tab: Paste (textarea) / Upload (FileReader API)
9. `components/check-rate/ResultCard.tsx`, `PrizeTable.tsx`, `MatchDistChart.tsx`, `HistoryList.tsx`

#### Python Phase 1 deliverables

1. `check_rate/evaluators/power535.py` — `parse_numbers`, `evaluate`, `history_match`
2. `cli/suggest.py` — thêm `--export-csv PATH` + `--algorithm NAME`, refactor inline prize-table → import từ `prize_tables`
3. Unit tests: known-ticket → known-prize cho mọi tier + encourage

#### TS Phase 1 deliverables

1. `lib/check-rate/evaluators/power535.ts` — mirror Python logic
2. `lib/check-rate/evaluators/index.ts` — import tất cả evaluators để trigger registration
3. Route `/check-rate` smoke check qua browser manual test

#### Golden fixture + parity

1. `tests/fixtures/check_rate/power_535_sample.csv` — ~10 tickets cover multiple tiers
2. `tests/fixtures/check_rate/power_535_draws.json` — ~20 synthetic draws đủ để trigger Jackpot/2nd/3rd/4th/5th/Encourage
3. `tests/fixtures/check_rate/power_535_sample.expected.json` — hand-crafted expected output
4. Pytest `test_power535_golden.py` — load fixtures, assert evaluate output == expected
5. `scripts/verify_check_rate_parity.mjs` — Node script load fixture, import TS evaluator, diff expected
6. Makefile `check-rate-parity` target chạy cả pytest + node script

#### UX — suggest → check-rate bridge

1. Trên `/suggest` (nếu có) và mỗi product page (e.g. `/power-535`) — nút **"Copy picks as CSV"** → clipboard.
2. Trên `/check-rate` — nếu clipboard có CSV-format hợp lệ, gợi ý "Paste từ clipboard?" (optional, bỏ qua cũng được).

#### Public data JSON schema check

Verify `public/data/power535.json` schema có đủ `date + id + result[]`. Nếu thiếu (e.g. chỉ có recent 50), extend `scripts/build_data.py` để xuất toàn bộ lịch sử vào riêng `public/data/check-rate/power535.json` hoặc thêm field.

**Risk:**
- Python ↔ TS drift → mitigate bằng golden fixture (CI block nếu lệch).
- Refactor suggest có thể phá test hiện có → giữ output text cũ, chỉ thêm CSV branch.
- UI polish dễ tốn thời gian — MVP chấp nhận table thô, chart đơn giản.

---

### Phase 2 — Power 6/45 (Python + TS + golden)

**Scope thu hẹp so với Phase 1** vì infra đã xong.

1. `evaluators/power645.py` — subset match size 6, no special/bonus
2. `lib/check-rate/evaluators/power645.ts` — mirror
3. Fixture: `power_645_sample.csv` + `expected.json` + `draws.json`
4. Unit tests + parity test
5. UI tự support (registry dispatch). Nếu cần color/icon khác → thêm vào `products-config.ts`.

**Risk:** thấp. Pattern đã có.

---

### Phase 3 — Power 6/55 (Python + TS + golden)

**Điểm khó nhất: bonus ball semantic.** User ticket KHÔNG chứa bonus ball (khác 535 có special).

1. `evaluators/power655.py`:
   - Match main: `set(ticket) ∩ set(draw[:6])`
   - Bonus: `draw[6] ∈ set(ticket)`
   - Jackpot 2 = 5-main + bonus, 1st = 5-main + no bonus
2. `evaluators/power655.ts` — mirror với cùng comment giải thích bonus logic
3. Fixture phải có 2 case phân biệt: (5 main, bonus trong ticket) vs (5 main, bonus không trong ticket)
4. Unit + parity tests

**Risk:** dễ nhầm bonus với special → test 2 case 5-main là bắt buộc.

---

### Phase 4 — Max 3D (Python + TS + golden)

**Thay đổi semantic:** tier-based, không phải subset match.

1. `evaluators/p3d.py`:
   - Parse `numbers`: single 3-digit zero-padded string
   - `evaluate`: với mỗi draw, check tier chứa số của vé → lookup `MAX_3D_TIERS`. Cộng dồn nếu trùng nhiều tier.
   - Case special: KK 2 số cuối = `ticket[-2:] == draw["Giải Đặc biệt"][0][-2:]` (chỉ so với số Đặc biệt thứ 1 hoặc tất cả? cần confirm — placeholder: cả 2 số Đặc biệt)
2. `io.py` validation: nếu `game in {3d, 3d_pro}` → regex `^\d{3}$` cho `numbers`
3. `history.py`: với 3D, đếm per-tier occurrence + lần gần nhất
4. TS mirror `evaluators/p3d.ts` — lưu ý xử lý unicode tier names "Giải Đặc biệt" (UTF-8 phải đúng)
5. UI: `MatchDistChart` handle tier key string thay vì int

**Risk:** evaluator hoàn toàn khác Power — không được dùng chung base class helper. Unicode tier name trên TS có thể nghịch khi compare string.

**Cần confirm trong Phase 4:** KK 2 số cuối so với Đặc biệt[0] hay cả 2 số? (Đề xuất mặc định: so với cả 2, cộng dồn.)

---

### Phase 5 — Max 3D Pro (Python + TS + golden)

1. Verify prize amounts thực tế theo quy chế Vietlott 3D Pro (thay placeholder trong `prize_tables.py`)
2. `evaluators/p3d_pro.py` — tái dùng logic p3d, chỉ đổi bảng prize
3. `evaluators/p3d_pro.ts` — tương tự
4. Fixtures + parity
5. Doc update: so sánh song song prize 3D vs 3D Pro

**Risk:** nếu 3D Pro có tier mới (ví dụ thêm Khuyến khích khác) → cần mở rộng base, không chỉ đổi bảng.

---

## 6. Golden fixture harness chi tiết

### Fixture file format

**`<name>.csv`**: đúng schema § 1.

**`<name>_draws.json`**:
```json
[
  {"date": "2024-01-01", "id": "00001", "result": [7, 9, 10, 16, 19, 3]},
  ...
]
```
Hoặc với 3D:
```json
[
  {"date": "2024-01-01", "id": "00001", "result": {"Giải Đặc biệt": ["015", "517"], ...}},
  ...
]
```

**`<name>.expected.json`**:
```json
{
  "groups": [
    {
      "game": "power_535",
      "algorithm": "diversity_v1",
      "n_tickets": 3,
      "n_draws": 20,
      "prize_counter": {"Jackpot": 0, "2nd": 1, ...},
      "prize_winnings": {"2nd": 5000000, ...},
      "match_dist": {"5": 1, "4": 3, ...},
      "total_cost": 600000,
      "total_winnings": 5030000,
      "roi": 738.33
    }
  ],
  "history": [
    {"ticket_no": 1, "total_hits": 0, ...},
    ...
  ]
}
```

### Harness

1. **Python**: `tests/check_rate/test_<product>_golden.py` — pytest parametrize load fixture → `get_evaluator(game).evaluate(...)` → `assert_dicts_equal(result, expected)`. Reused helper `compare_eval_result.py`.
2. **Node**: `scripts/verify_check_rate_parity.mjs`:
   - Load cùng CSV + draws + expected
   - Dynamic import TS evaluator (build trước qua `tsx`)
   - Serialize EvalResult → deep-equal với expected JSON
   - Exit 1 nếu khác, in diff
3. **Makefile**: `check-rate-parity: pytest + node-script`. Chạy trong CI và local trước PR.

### Regenerate fixtures

Khi thay đổi prize table / logic có chủ đích:
```bash
make check-rate-fixture-regenerate PRODUCT=power_535
```
Script Python chạy evaluator trên `<name>.csv` + `<name>_draws.json` → ghi ra `<name>.expected.json`. Dev review diff git trước khi commit.

---

## 7. Ma trận testing

| Phase | Python unit | TS smoke (manual browser) | Golden parity | CI check |
|---|---|---|---|---|
| 0 ✅ | io / registry / prize_tables | — | — | pytest |
| W0+1 | 535 eval + suggest export | `/check-rate` paste + upload | `power_535_golden` | pytest + node parity + `npm run build` |
| 2 | 645 eval | card render 645 | `power_645_golden` | pytest + node parity |
| 3 | 655 eval (2 case 5-main) | card render 655 | `power_655_golden` | pytest + node parity |
| 4 | 3D eval (tier + KK) | card render 3D | `p3d_golden` | pytest + node parity |
| 5 | 3D Pro eval | card render 3D Pro | `p3d_pro_golden` | pytest + node parity |

---

## 8. Sample output

### CLI (sau Phase 3)

```
=== VIETLOTT CHECK-RATE ===
Input: tickets.csv (24 tickets, 3 games, 2 algorithms)
Backtest window: last 100 draws per game

--- power_535 / diversity_v1 (10 tickets) ---
Prize          Count  %       Total VND      Avg/draw
Jackpot        0      0.0%    0              0
2nd            1      1.0%    5,000,000      50,000
3rd            3      3.0%    1,500,000      15,000
...
ROI: -62.3%   Win rate: 18.0%

Exact-match history:
  Ticket #1 [7 9 10 16 19] sp=3 — main đã trùng y hệt 0 lần trong 1842 kỳ
  Ticket #2 [1 5 11 20 28] sp=7 — main đã trùng y hệt 1 lần: 2019-03-14 #00134
```

### Website `/check-rate` (sau Phase W0+1)

```
┌─────────────────────────────────────────────┐
│  CHECK-RATE                                 │
│  [ Paste CSV ] [ Upload file ]              │
│  ┌─ textarea ────────────────────────┐      │
│  │ game,algorithm,ticket_no,...      │      │
│  └───────────────────────────────────┘      │
│  [ Đánh giá ] [ Clear ]                     │
├─────────────────────────────────────────────┤
│  ┌── Card: power_535 / diversity_v1 ──┐     │
│  │ 10 tickets · 100 kỳ · ROI −62.3%   │     │
│  │ [Prize table] [Match dist chart]   │     │
│  │ Exact-match history: 1 vé đã trùng │     │
│  └────────────────────────────────────┘     │
│  ┌── Card: power_655 / diversity_v1 ──┐     │
│  │ ...                                │     │
│  └────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

Trên mỗi trang product hiện có (`/power-535`, `/max-3d`, etc.): nút **"Copy picks as CSV"** → copy clipboard với format đúng schema § 1 → user paste thẳng `/check-rate`.

---

## 9. Phản biện / vấn đề mở

Các điểm tôi nghĩ có thể gây debate, đã chốt hoặc pending:

| # | Vấn đề | Trạng thái |
|---|---|---|
| 1 | `--latest-n` = in chi tiết K kỳ gần nhất, tách khỏi aggregate | ✅ chốt |
| 2 | Exact-match Power: chỉ xét main numbers (bỏ special/bonus) | ✅ chốt |
| 3 | 3D tier collision: cộng dồn tiền giải | ✅ chốt |
| 4 | Jackpot = min công bố, không cộng dồn thực tế | ✅ chốt |
| 5 | Power 655 bonus ball: user ticket không chọn bonus | ✅ chốt |
| 6 | Suggest export chỉ cover Power, 3D ticket nhập tay | ✅ chốt |
| 7 | Kiến trúc: client-side TS evaluator | ✅ chốt |
| 8 | Không TS unit test, parity qua Node script + pytest | ✅ chốt |
| 9 | CSV input UX: textarea paste + file upload (2 ways) | ✅ chốt |
| 10 | "Copy picks as CSV" bridge trên product pages | ✅ chốt |
| 11 | Route = `/check-rate` | ✅ chốt |
| 12 | **KK 2 số cuối 3D**: so với Đặc biệt[0] hay cả 2 số? | ⏳ pending Phase 4 |
| 13 | **Max 3D Pro prize amounts**: cần verify quy chế | ⏳ pending Phase 5 |
| 14 | Public data JSON: `public/data/<game>.json` có đủ history? | 🔍 kiểm khi vào Phase W0+1 |
| 15 | Jackpot/bonus display: UI có highlight khi "tham chiếu" không? | 💬 UX detail, chốt khi implement |

---

## 10. PR / merge order

| PR | Phase | Nội dung | Dự kiến file mới |
|---|---|---|---|
| #1 ✅ | 0 | Python foundation | 12 files |
| #2 | W0 + 1 | Website infra + Power 535 Python/TS/UI + suggest export | ~22 files |
| #3 | 2 | Power 645 Python + TS + golden | ~6 files |
| #4 | 3 | Power 655 Python + TS + golden (bonus ball) | ~6 files |
| #5 | 4 | Max 3D Python + TS + golden (tier-based) | ~6 files |
| #6 | 5 | Max 3D Pro Python + TS + golden | ~6 files |

Mỗi PR phải pass:
- `make test` (pytest Python)
- `make check-rate-parity` (pytest + node parity)
- `make website-build` (Next.js type check + build)
- `uv run ruff check && uv run ruff format`

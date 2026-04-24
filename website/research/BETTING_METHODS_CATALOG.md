# Betting Methods Catalog — Vietlott

> **Purpose**: Comprehensive enumeration của mọi phương pháp chơi (betting methods) cho 5 sản phẩm Vietlott, để set up framework đánh giá hiệu suất systematic. Không bỏ qua phương pháp nào — target Chu kỳ 25+ evaluation.
>
> **Created**: 2026-04-24 (post Chu kỳ 24 shipment, user request).
>
> **Key distinction**:
> - **Strategy** (đã test qua 24 chu kỳ) = NUMBER SELECTION algorithm (what numbers to pick)
> - **Method** (focus của doc này) = FULL BETTING REGIME = selection × bet-size × time-frequency × duration × stop-condition × compounding

---

## Dimensional framework

Mỗi "method" là 1 point trong 6-dimensional space:

| Dimension | Options |
|---|---|
| **D1. Selection** | Algorithm-chosen / Random / Fixed / User-chosen / Follow-past |
| **D2. Bet size** | 1 ticket / N tickets / Budget-capped N / All combinations (wheel) |
| **D3. Time frequency** | Every draw / Alternate / Weekly calendar / Event-triggered (jackpot rollover) |
| **D4. Duration** | Fixed N draws / Until condition (hit/budget-exhaust) / Indefinite |
| **D5. Stop condition** | Never / After 1st hit / After N hits / After loss-streak K / Budget cap |
| **D6. Compounding** | None (flat) / Martingale / Anti-Martingale / Budget-locked |

Một method là 1 tuple of choices. Framework Chu kỳ 25 sẽ allow specifying + evaluating any valid tuple.

---

## A. Selection-only methods (D1 varies, D2-D6 baseline = 1 vé/kỳ, every draw, indefinite, never stop, flat)

Universal across 5 products:

| # | Method | Selection (D1) | Đã test? |
|:-:|---|---|---|
| A1 | **Fixed same bộ số N kỳ** | User/algorithm-picked, unchanged | ✓ **Chu kỳ 25** (matrix A1 / 3D A1b) |
| A2 | **Algorithm-chosen fresh each draw** | Re-run algo mỗi kỳ | ✓ Chu kỳ 1-21 (all strategies) |
| A3 | **Pure Random each draw** | Uniform random | ✓ Baseline trong mọi cycle |
| A4 | **Rotate algorithms across draws** | Week 1 Freq_Hot, Week 2 MinDistance, ... | ✓ **Chu kỳ 25** (matrix only) |
| A5 | **Ensemble vote** | K algorithms vote, pick top N | ✓ C22 composite profiles (3 axes), Chu kỳ 19e single+multi ensemble (Reject) |
| A6 | **Follow last winning numbers** | Copy bộ vừa trúng kỳ trước | Chưa |
| A7 | **Anti-last-winning** | Avoid bộ vừa trúng | Gần NotRepeat (Chu kỳ 1) |
| A8 | **Follow "near-miss" last draw** | Copy bộ đã 4/6 matches kỳ trước | Chưa |
| A9 | **User-picked lucky numbers** | Birthday/cultural — fixed | Chưa (cultural) |
| A10 | **Mirror number** | 3D: 123 → 876 (complement) | Chưa |

## B. Matrix-specific selection (Power 6/55, 6/45, 5/35)

| # | Method | Mô tả | Đã test? |
|:-:|---|---|---|
| B1 | **Full wheel K numbers** | Chọn K > main_count, mua tất cả C(K, main_count) tổ hợp | ✓ **Chu kỳ 26** — P(hit) ↑ nhưng ROI tied Random |
| B2 | **Reduced/Partial wheel** | Subset of full wheel guaranteeing N-match if K-match in wheel | Chưa (deferred Chu kỳ 27+, cần math optimization) |
| B3 | **Key-number wheel** | 1-2 fixed numbers + rotate others | ✓ **Chu kỳ 26** — within variance |
| B4 | **Position-weighted selection** | Weight numbers bởi vị trí lịch sử (low/mid/high range) | Gần Pattern (Chu kỳ 1-3) — subsumed |
| B5 | **Sum-range filter** | Chỉ chọn bộ với sum trong historical range | ✓ **Chu kỳ 26** — statistical noise |
| B6 | **Parity-stratified** | Balance odd/even theo distribution | ✓ **Chu kỳ 26** — within variance |
| B7 | **Birthday-universe** | Chỉ từ 1-31 (ngày) hoặc 1-12 (tháng) | Deferred — trivial restriction, low value |
| B8 | **Special number sub-strategy (5/35 only)** | Pick special 1-12 theo: fixed / hot / cold / freq-match | Deferred Chu kỳ 27 (5/35-specific adapter) |
| B9 | **Bonus-ball targeted (6/55 only)** | Optimize cho tier 2 (match 5 + bonus) vs jackpot | Deferred Chu kỳ 27 (6/55 bonus adapter) |
| B10 | **Consecutive-avoid** | Tránh số liền kề (e.g., 4-5-6) | ✓ **Chu kỳ 26** — within variance (+1.5pp 6/45) |
| B11 | **Consecutive-prefer** | Chỉ chọn có ít nhất K cặp liền kề | ✓ **Chu kỳ 26** — within variance |

## C. 3D-specific selection (Max 3D, Max 3D Pro)

| # | Method | Mô tả | Đã test? |
|:-:|---|---|---|
| C1 | **Bao lô 6 hoán vị** | 1 bộ 3 chữ số khác nhau → 6 permutations (123/132/213/231/312/321) | ✓ **Chu kỳ 26** — P(hit) 5× Random, ROI tied (no edge) |
| C2 | **Bao bộ ba (3 hoán vị)** | 1 bộ có cặp giống (e.g., 122) → 3 perms | Subsumed bởi C1 (same permutation_all framework) |
| C3 | **Bao xỉu chủ** | User pick → mua cả xỉu (3 số) + chủ (2 số cuối) | N/A — Vietlott 3D không có tier riêng này |
| C4 | **KK 2 số cuối focused** | Tập trung giải KK (Max 3D) hoặc Tư/Năm (3D Pro) | Deferred Chu kỳ 27 (tier-targeting adapter) |
| C5 | **Forward + reverse hedge (3D Pro)** | Mua (A,B) + (B,A) → hit cả ĐB + Phụ ĐB | ✓ **Chu kỳ 26** — full +34.5pp nhưng forward-gate FAIL, Inconclusive |
| C6 | **Same-digit A=B exploit (3D Pro)** | Tập trung tickets A=B để double Nhất-Sáu prizes | ✓ **Chu kỳ 27-28 — 🚨 SUGGESTIVE-CONFIRMED: N=200 ROI +3864% full, all 4 segments +3752% to +4372% consistent. Negative control 5/35 = Random (no artifact). Theoretical EV +4180% matches observed. Hybrid N=5/N=10 scale linearly. PENDING external validation (user ticket trial) before Accept.** |
| C7 | **Digit-sum targeting** | Chọn số có digit-sum ∈ [hot range] (e.g., 10-20) | Subsumed — similar to MaxEntropy SumRange |
| C8 | **Mirror-paired (số đối)** | Mua 123 + 876 cùng lúc | ✓ **Chu kỳ 26** — within variance |
| C9 | **Digit-position Bayesian** | Per-position independent posterior | ✓ Chu kỳ 4, 11 (Reject) |
| C10 | **Joint-digit bias exploit** | Non-independence per pair | ✓ Chu kỳ 4 (Reject) |
| C11 | **Same last digit** | 100, 210, 340, 450 (all end in 0) | Chưa — cultural heuristic |

## D. Bet-size / volume methods (D2 varies)

| # | Method | Mô tả | Đã test? |
|:-:|---|---|---|
| D1 | **1 vé/kỳ** | Minimum — baseline | ✓ Chu kỳ 1-21 default |
| D2 | **N vé/kỳ cùng strategy** | N copies of same algo output (với stochastic variation) | ✓ Chu kỳ 24 (Pure @ N=10) |
| D3 | **N vé/kỳ mixed strategies** | 3-5 tickets each from k algos | ✓ Chu kỳ 24 (Mixed mode) |
| D4 | **N vé hedged with Random** | k algorithm + (N-k) Random | ✓ Chu kỳ 24 (Hedged mode) |
| D5 | **Wheel expansion** | Generate 10-100 tickets theo wheel structure | Part of B1/B2 |
| D6 | **Budget-locked N calc** | User inputs B, system computes N = B/price | ✓ Chu kỳ 24 (B=100K → N=10) |

## E. Time frequency methods (D3 varies)

| # | Method | Mô tả | Đã test? |
|:-:|---|---|---|
| E1 | **Every draw** | Fire on every scheduled draw | ✓ default |
| E2 | **Alternate (every 2nd/3rd)** | Skip 1-2 draws to stretch budget | ✓ **Chu kỳ 27** — no EV edge, stretches budget only |
| E3 | **Weekly calendar** | Chỉ T2+T4+T6 hoặc T7+CN | ✓ **Chu kỳ 27** (every K=3, K=7) — variance from sparse sampling |
| E4 | **Jackpot-threshold triggered** | Play only when jackpot rollover ≥ X tỷ | ✓ **Chu kỳ 25 MVP proxy** — needs Vietlott jackpot flag data cho real test |
| E5 | **Dry-spell triggered** | Play sau K kỳ liên tiếp không có jackpot hit | Chưa |
| E6 | **User-specified interval** | Random/sporadic based on user mood | N/A — không reproducible |

## F. Duration & stop-condition methods (D4, D5 varies) — user's "mua đến khi trúng"

| # | Method | Mô tả | Đã test? |
|:-:|---|---|---|
| F1 | **"Số gan" persistence — buy cold until hit** | Chọn 1 bộ gồm số vắng lâu nhất, mua liên tục đến khi trúng ≥ any tier | ✓ **Chu kỳ 25** — REFALSIFIED worse than Random |
| F2 | **Hot number persistence** | Mirror — mua 1 bộ hot, persist | ✓ **Chu kỳ 25** — worse than Random matrix |
| F3 | **Algorithm-chosen persistence** | Pick via algo 1 lần, persist cho đến hit | ✓ **Chu kỳ 25** — mixed (F3 Power 5/35 = -83.5%, best of matrix persistence) |
| F4 | **Stop at first ANY tier** | Stop persistence sau khi hit bất kỳ tier (kể cả Giải ba) | ✓ Chu kỳ 25 (stop_condition.type=any_tier_hit) |
| F5 | **Stop at jackpot only** | Chỉ dừng khi hit jackpot (tier 1) — rất costly | Chưa — overlaps F4 variants |
| F6 | **Budget-capped persistence** | F1-F5 + "stop nếu budget exhausted" escape valve | ✓ **Chu kỳ 25** — slight lift vs F3 |
| F7 | **Max-K-draws escape valve** | F1-F5 + "stop sau K kỳ không hit" | ✓ **Chu kỳ 25** — F7 × Power 5/35 = -80.1% Inconclusive |
| F8 | **Reset after N cold streak** | Change selection sau N kỳ không hit | Chưa |
| F9 | **N-hit stop** | Stop sau K lần trúng (không chỉ 1st) | Chưa |

## G. Compounding methods (D6 varies) — bet size thay đổi theo outcome

| # | Method | Mô tả | Đã test? |
|:-:|---|---|---|
| G1 | **Flat betting** | Bet size cố định mọi kỳ | ✓ default |
| G2 | **Martingale** | Double-up sau mỗi lần thua | ✓ **Chu kỳ 27** — 100% bankruptcy at B=1M, forward-fail confirms no edge (CAUTIONARY) |
| G3 | **Anti-Martingale (Paroli)** | Double-up sau mỗi lần thắng | ✓ **Chu kỳ 27** — no edge, within variance |
| G4 | **1-3-2-6 progression** | Fixed sequence theo streak | Skipped — trivial variant of G1 |
| G5 | **Near-miss escalation** | Tăng bet sau kỳ almost-hit (4/6 match) | ✓ **Chu kỳ 27** — low trigger rate, no edge |
| G6 | **Win-reset** | Sau khi thắng, reset về bet base | Subsumed by flat (trivial) |
| G7 | **Kelly criterion** (POS banned — falsified Chu kỳ 16) | Optimal log-utility sizing | ❌ Eliminated Chu kỳ 16 |

## H. Portfolio construction (cross-time)

| # | Method | Mô tả | Đã test? |
|:-:|---|---|---|
| H1 | **Same bộ × N kỳ (fixed)** | 1 bộ số đóng băng qua time | Gần A1 |
| H2 | **Rolling top-1 algorithm** | Rank algos mỗi tháng, chọn top-1 cho tháng kế | Chưa |
| H3 | **Committee voting** | K algorithms vote per ticket | Different from Chu kỳ 19e ensemble config |
| H4 | **Meta-level Bayesian** | Update algorithm preference based on past performance | Gần AdaptiveWindow (Chu kỳ 1-14, Reject adaptive family) |
| H5 | **Cross-product portfolio** | Mua cả 5 products mỗi kỳ với cùng budget | Chưa — tests intrinsic RNG correlation |

## I. Cultural / pattern-based (low research value, document-only)

| # | Method | Rationale | Priority |
|:-:|---|---|:-:|
| I1 | **Ngày sinh (birthday)** | Ngày/tháng/năm user + gia đình | Low — no edge, document làm educational |
| I2 | **Số đẹp** (6, 8, 9, 68, 86, 99) | Cultural preference | Low |
| I3 | **Avoid số xấu** (4, 7, 13) | Cultural avoidance — BUT crowd-avoidance có thể → higher expected payout (chia ít người) | ⚠ Medium nếu Vietlott expose retail pool size |
| I4 | **Giải mộng** (dream numbers) | Từ giấc mơ + sách giải mộng | Low |
| I5 | **Feng shui / năm mệnh** | Theo ngũ hành | Low |

**Note**: I3 anti-crowd potentially có edge via *payout splitting* (nếu ít người đánh số đẹp → payout jackpot không chia nhiều = expected payout ↑). Nhưng Vietlott không expose bet volume per number → infeasible to test (same finding trong Chu kỳ 17 Hướng A).

## J. Subscription / institutional methods

| # | Method | Mô tả | Priority |
|:-:|---|---|:-:|
| J1 | **Vietlott subscription (if exists)** | Auto-buy same ticket cho N kỳ | ? — check Vietlott product offering |
| J2 | **Syndicate pool** | Nhiều người pool money, chia prize | N/A — không thay đổi per-ticket math |
| J3 | **Group wheel (câu lạc bộ)** | Club members mua wheel collectively | Similar to B1/B2 |

---

## Dimensional coverage table (post-Chu kỳ 24)

| Dimension | Tested | Not tested |
|---|---|---|
| D1 Selection | Algorithm (21 cycles), Random, Composite | Rotate, Follow-past, Cultural, Mirror |
| D2 Bet size | 1 vé, N=10 budget | N=1-50 variable, Wheel systems |
| D3 Time frequency | Every-draw only | Alternate, Calendar, Jackpot-triggered |
| D4 Duration | Indefinite only | Fixed N, Until-hit |
| D5 Stop condition | Never | Hit, Loss-streak, Budget-cap |
| D6 Compounding | Flat only | Martingale, Anti-Martingale, Progression |

**→ Dimensions D3-D6 ENTIRELY UNEXPLORED**. Biggest research gap: STOP-CONDITION + COMPOUNDING regimes.

---

## Proposal: Chu kỳ 25+ evaluation framework

### Philosophy
Framework-first approach: build a **generic method evaluator** taking method-spec tuple + simulating outcome. Then test methods systematically.

### Sub-cycles breakdown

#### Chu kỳ 25 — Framework + Tier-1 (high priority gaps)
**Effort**: ~1 tuần
- 25.1: Generic method evaluator (`methods_evaluator.py`)
  - Input: method-spec JSON (selection, size, frequency, duration, stop, compound)
  - Output: metrics (E[payout], P(any hit), ROI, variance, ticks-to-first-hit, max-drawdown, time-to-bankruptcy)
  - Reuses C24 infrastructure + extends for stop conditions
- 25.2: Tier 1 methods test
  - **F1/F2/F3 persistence strategies** (user-requested "số gan")
  - **F6/F7 with stops** (budget-cap, K-draws escape)
  - **A1 fixed-ticket N-kỳ** baseline
  - **A4 rotate algorithms**
  - **E4 jackpot-triggered** (Power 6/55 + 6/45)

#### Chu kỳ 26 — Tier-2 methods
**Effort**: ~1 tuần
- **B1/B2/B3 wheeling systems** (full, reduced, key-number)
- **B8 special sub-strategies (5/35)**
- **B9 bonus-ball targeting (6/55)**
- **C1/C2 3D bao lô permutations**
- **C5/C6 3D Pro forward+reverse + A=B exploit**

#### Chu kỳ 27 — Tier-3 compounding + cultural-adjacent
**Effort**: ~1 tuần
- **G2-G6 compounding variants** (Martingale will fail — quantify collapse rate)
- **E2/E3/E5 calendar/event patterns**
- **I3 anti-crowd** (document-only unless Vietlott bet-volume data appears)

#### Chu kỳ 28 — Meta-analysis
**Effort**: ~3 ngày
- Cross-cycle comparison: best methods per product
- Dominated-set elimination
- Suggest "novel methods" from gaps in dimensional coverage (e.g., Chu kỳ 22 composite + F7 escape)

### Evaluation metrics (mandatory cho framework)

| Metric | Formula | Why |
|---|---|---|
| **E[payout / kỳ]** | avg prize per bet unit | Raw expected |
| **P(any hit / kỳ)** | % kỳ có ít nhất 1 ticket trúng | Diversification check |
| **ROI** | (prize − cost) / cost × 100 | Net efficiency |
| **Sharpe ratio** | mean/std × √freq | Risk-adjusted |
| **Max drawdown** | worst peak-to-trough loss | Stress test |
| **Time-to-first-hit (median)** | median kỳ until ≥1 hit any tier | Relevant cho F-methods |
| **Time-to-bankruptcy** | median kỳ until cumulative loss > B | Critical cho G compounding + F6 |
| **Variance-of-payout** | std(prize) / mean(prize) | Sanity check |

### Null hypothesis expectation
Lottery EV âm → MOST methods will have ROI < 0. Goal: rank ROI from least-negative to most-negative; find methods **dominated** (strictly worse on every metric than Random) to eliminate.

### Gates (inherit from Chu kỳ 20 methodology)
- **Pre-registration binding** (Principle #16) — method list frozen per cycle
- **Composite-binding decision** (EVALUATION §8) — no single-metric claims
- **Family check** — methods in eliminated families (Kelly G7, Bayesian sizing) REJECTED without execution
- **No Accept/Reject** — Optimization mode descriptive

### Reopen breakthrough?
Chỉ nếu metric analysis shows method với Δ_ROI > +3pp vs Random stable qua split-half + forward gates. Triggers §9 criteria re-check.

---

## Cataloguing status

- **Document maintained in** [website/research/BETTING_METHODS_CATALOG.md](BETTING_METHODS_CATALOG.md)
- **Methods tested in Chu kỳ 25-28** sẽ get kết quả inline vào bảng trên (Đã test? column updated)
- **Proposal**: mỗi test method có 1 row trong method_results.json canonical artifact

---

## Open questions (for user review)

1. **Scope**: 4 sub-cycles (25/26/27/28) OR gộp thành 1 Chu kỳ 25 lớn?
2. **Priority**: Tier assignment OK không? Có method nào user muốn elevate / demote?
3. **Infeasible methods**: I1-I5 cultural — skip entirely hay document-only?
4. **G category (compounding)**: test để chứng minh bankruptcy, hay skip vì obvious?
5. **Novel method discovery**: Chu kỳ 28 có scope "propose new method from gaps"? Framework nào để generate ideas systematically?
6. **Reset cumulative claim**: Nếu method F1 (số gan persistence) có time-to-first-hit = 10 kỳ median, cost = 100K, payout avg 60K → ROI −40% BUT intermediate "almost-hit" events. Metrics cần capture tâm lý user (streak anxiety)?

---

## Immediate next step

Đợi user approve:
- ✅ Catalog structure
- ✅ Missing methods / re-prioritization
- ✅ Chu kỳ 25 pre-reg scope (framework + Tier-1) → viết pre-reg file

Then freeze pre-reg, execute.

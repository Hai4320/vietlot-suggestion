# Chu Kỳ 22 — Phase O-1 Review (Diagnostic)

**Date**: 2026-04-22
**Pre-reg**: [proposals/executed/cycle22_optimization_mode.md](../proposals/executed/cycle22_optimization_mode.md)
**Methodology**: [MEASUREMENT.md](MEASUREMENT.md)
**Input**: `cycle22_backtest_matrix.json` (+ `_3d.json`) — fresh re-backtest với split-half segments
**Output**: `cycle22_rankings.json` (canonical) — 3 composite profiles × 5 products

**Status**: Awaiting USER APPROVAL GATE trước khi sang Phase O-2 (UI).

---

## §1. Scoreboard (per-product)

| Sub | Product | N | Ranked | Picks | Collapse | Status |
|:-:|---|:-:|:-:|---|---|---|
| 22.A | Max 3D | 1065 | 17 | 3 khác nhau ✓ | none | **OK** — 3 picks diverse |
| 22.B | Max 3D Pro | 711 | 17 | **all null** | — | ⚠ Xem §3.2 |
| 22.C | Power 6/55 | 1334 | 12 | 1 (MinDistance) | all_three | **OK** — clean dominant |
| 22.D | Power 6/45 | 1302 | 12 | **all null** | — | ⚠ Xem §3.1 |
| 22.E | Power 5/35 | 543 | 12 | 1 (Freq_Hot) | all_three | ⚠ Xem §4 (Δ_win negative) |

**Tổng**: 5/15 picks valid (3 cho Max 3D + 1 Power 6/55 + 1 Power 5/35). 9 picks null (Power 6/45 × 3 + Max 3D Pro × 3, 3 profiles cho Power 6/55 collapse về 1, tương tự Power 5/35).

---

## §2. Valid picks (3 products)

### 22.C Power 6/55 — `MinDistance` dominates

```
  picks.winrate  = MinDistance  (rank 1/12, composite=+1.757)
  picks.roi      = MinDistance  (rank 1/12, composite=+1.334)
  picks.balanced = MinDistance  (rank 1/12, composite=+1.546)
  collapse       = all_three → UI: 1 pick "🎯💰⚖"
```

- **Raw**: Δ_win=**+0.308pp**, Δ_roi=**+1.36%**, p=0.148
- **Split-half verified**: h1 Δ + h2 Δ cùng dương (strategy beats baseline consistently trên cả 2 halves)
- **Next best**: ExpDecay_Hot (comp +0.764 winrate), tách khá xa từ MinDistance

### 22.A Max 3D — 3 picks diverse

```
  picks.winrate  = D3: PairExploiter_T0.5  (rank 1, try #1)
  picks.roi      = B1: CoverageOpt          (rank 2, try #2)  ← retry vì rank-1 flipped trên trục roi
  picks.balanced = FreqWholeHot             (rank 1, try #1)
  collapse       = none → UI: 3 picks đầy đủ
```

- **D3 PairExploiter_T0.5**: Δ_win=+0.414pp, Δ_roi=+10.35%, **p=0.038** (nominal sig)
- **B1 CoverageOpt**: Δ_win=+0.364pp, Δ_roi=+11.61%, p=0.066
- **FreqWholeHot**: Δ_win=+0.374pp, Δ_roi=+12.93% (baseline-tier strategy best ở balanced)
- **Observation**: 3 strategies gần nhau về composite, tách bởi nuance weights — healthy diversity

### 22.E Power 5/35 — `Freq_Hot` dominates nhưng có caveat

```
  picks.winrate  = Freq_Hot  (rank 1/12, composite=+0.814)
  picks.roi      = Freq_Hot  (rank 1/12, composite=+1.208)
  picks.balanced = Freq_Hot  (rank 1/12, composite=+1.012)
  collapse       = all_three → UI: 1 pick "🎯💰⚖"
```

- **Raw**: Δ_win=**−0.045pp** (negative!), Δ_roi=**+1.80%**, p=0.905
- ⚠ **Freq_Hot có Δ_win NEGATIVE nhưng vẫn top winrate profile** — xem §4 discussion
- Split-half verified nhưng direction check trên win metric passes chỉ vì cả 2 halves có Δ_win tương tự (có thể cùng âm hoặc gần 0)

---

## §3. Null picks — 2 products có issue

### §3.1 Power 6/45 (all null) — baseline drift across halves

**Null cause**: Random baseline dịch chuyển lớn giữa half1 (win=2.033%) và half2 (win=2.704%) = **+0.671pp shift**. Mọi strategy tracking real draws đều có delta flip (positive h1, negative h2) khi baseline tự nó shift nhiều như vậy.

Top candidates với half deltas:

| Strategy | h1 Δ_win | h2 Δ_win | h1 Δ_roi | h2 Δ_roi | Flip source |
|---|:-:|:-:|:-:|:-:|---|
| MinDistance | +0.653pp | **−0.338pp** | +2.94% | **−2.68%** | Both trục flip |
| Freq_Cold | +0.798pp | **−0.031pp** | +3.37% | −4.24% | Both flip |
| Freq_Hot | +0.581pp | **−0.584pp** | +38.91% | −5.07% | Both flip |
| ExpDecay_Hot | +0.544pp | **−0.276pp** | +6.53% | −3.32% | Both flip |

**Interpretation**: Null picks = **honest** outcome — không có strategy nào consistently beat baseline trên cả 2 halves ở power_645. Không phải bug.

**Không có methodology flaw** — đây là design ý nghĩa của Principle #11 split-half: test strategy vs baseline trên hai windows độc lập. Khi baseline tự drift ngược chiều strategy, flip detection sẽ trigger.

### §3.2 Max 3D Pro (all null) — true regime split

Random baseline dịch nhẹ (h1=1.967%, h2=2.163%, +0.196pp). Nhưng các strategies top có flip thật sự:

| Strategy | h1 Δ_ex | h2 Δ_ex | h1 Δ_roi | h2 Δ_roi | Flip type |
|---|:-:|:-:|:-:|:-:|---|
| D1: EVMaximizer | **+1.148pp** | −0.197pp | +23.44% | −1.32% | Positive→negative |
| ULTIMATE_v2_sharp | −0.328pp | **+0.927pp** | −26.07% | +39.27% | Negative→positive (opposite!) |
| A1: JointBias_T1.0 | +0.426pp | −0.365pp | +0.36% | −9.13% | Positive→negative |

**Interpretation**: Max 3D Pro có **genuine regime switch** giữa hai halves. 2 strategies có direction đối nghịch (D1 drop từ strong positive xuống negative, ULTIMATE_v2_sharp đi ngược) suggests underlying draw distribution khác nhau ở h1 vs h2. Điều này consistent với **Chu kỳ 17 HMM findings** — 3D có quirkiness per segment.

**Notable**: `ULTIMATE_v2_sharp forward=+7.0% ROI` (từ log re-backtest) cho thấy strategy này đang perform tốt ở recent window — nhưng không verified replication → không pick.

---

## §4. Power 5/35 — Freq_Hot có Δ_win âm

### Vấn đề

```
picks.winrate = Freq_Hot  với  Δ_win = -0.045pp (negative!)
```

Composite vẫn đưa Freq_Hot lên top vì:
- z(delta_win) cho Freq_Hot ≈ 0 (gần trung bình), nhưng nhiều strategies có z_win ÂM HƠN
- z(delta_roi) = Freq_Hot cao nhất (+1.80% so với nhiều strategies −1 → −5%)
- Profile WinRate weights 0.60 cho win + 0.20 cho roi → vẫn positive composite dù win âm nhẹ

**Diễn giải honest**: Freq_Hot là "**ít tệ nhất**" trên trục winrate, không phải "**best winrate**". UI label `🎯 Trúng cao nhất` sẽ misleading — user sẽ hiểu "strategy này trúng cao nhất" nhưng thực ra nó perform **kém hơn Random** trên win-rate.

### Quyết định cần user

3 option xử lý:

**Option A — Relabel UI honest**:
- Đổi label từ `🎯 Trúng cao nhất` → `🎯 Ít tệ nhất (win)` khi pick có Δ_win ≤ 0
- Tương tự `💰 Ít tệ nhất (roi)` khi Δ_roi ≤ 0
- Preserves pick, just more honest label

**Option B — Tighten pick eligibility**:
- Thêm rule: `picks.winrate` candidate phải có `delta_win_pp > 0` (tương tự roi/balanced)
- Nếu không có → null pick, UI "Không có strategy vượt Random trên trục này"
- Honest but tốn thêm null picks

**Option C — Pre-reg amendment**:
- Declare rằng picks reflect composite TOURNAMENT (least-negative không phải beat-baseline)
- Glossary page giải thích rõ "pick ≠ confirmed edge"
- Giữ nguyên logic hiện tại

**Mình khuyến nghị Option A** — minh bạch nhất, không mất picks hợp lý. Cần revise MEASUREMENT §3 để codify rule "conditional labels".

---

**✅ USER DECISION 2026-04-22: Option C** — glossary-only. Rationale codified in [MEASUREMENT §3.1](MEASUREMENT.md). UI labels giữ nguyên (`🎯 Trúng cao nhất` / `💰 Lỗ ít nhất` / `⚖ Cân bằng`), glossary page phải có entry giải thích semantic "pick = best composite, không đảm bảo beat Random".

---

## §5. Surprising findings

### 5.1 MinDistance leads 2/5 products

`MinDistance` top cho cả power_655 (valid) và power_645 (flipped). Strategy này ưu tiên pick số có **khoảng cách tối thiểu lớn** giữa các chữ số được chọn — không giống Freq/Pattern logic. Đáng research riêng nếu cần breakthrough (nhưng project đã closed).

### 5.2 FreqWholeHot (3D baseline) ≠ null

FreqWholeHot là baseline mandatory cho 3D (EVALUATION §8.3) — thường null-ish. Tại Max 3D có Δ_win=+0.374pp, Δ_roi=+12.93% → ranked top balanced. Có thể do 3D có digit-level hot-cold biases stable hơn matrix.

### 5.3 Power 5/35 có 2 strategies với Δ_win = 0

Random và MaxEntropy đều có Δ_win=+0.000pp (exact tie at full sample). Small N (543) + chỉ 2,715 predictions tổng → low resolution trên win rate. Ties có thể legitimate.

### 5.4 D3 PairExploiter_T0.5 at Max 3D — p=0.0379

Đây là p-value **thấp nhất** trong toàn bộ cycle 22 ranked strategies (nominal significant). Nhưng không surface vì:
- Không có Accept claim trong Optimization mode (Principle #12 power gate → exploratory-only)
- Split-half verified nhưng weak — forward test chưa xét trong Phase O-1

Flag: có thể rời-bộ nhớ cho cycle 24 hoặc breakthrough reopen nếu appear stable over time.

---

## §6. Recommendations trước khi sang Phase O-2

| # | Recommendation | Rationale |
|:-:|---|---|
| 1 | **Quyết Option A/B/C cho power_535 Freq_Hot negative Δ_win** | §4 — cần user decision trước khi label UI |
| 2 | Ship 3/5 products (Max 3D + Power 6/55 + Power 5/35) với proper UI labels | 3 products có valid picks |
| 3 | **Power 6/45 + Max 3D Pro hiển thị "null picks" page** | Không fallback, không ẩn — honest disclosure |
| 4 | Disclosure banner cho Power 6/45 + Max 3D Pro: "Split-half replication fail, data underpowered cho claim" | UX transparency |
| 5 | Glossary entry: "Null picks = honest outcome, không phải bug" | User education |
| 6 | Page `/research/cycle22` show full rankings 3 profiles × N strategies để transparency | Per Option A user decision trước đó |

---

## §7. Artifacts

- **Raw re-backtest**:
  - [cycle22_backtest_matrix.json](cycle22_backtest_matrix.json) (178KB, 12 strategies × 3 products × 4 segments)
  - [cycle22_backtest_3d.json](cycle22_backtest_3d.json) (203KB, 17 strategies × 2 products × 4 segments)
- **Rankings** (canonical): [cycle22_rankings.json](cycle22_rankings.json)
- **Scripts**:
  - [cycle22_rebacktest_matrix.py](cycle22_rebacktest_matrix.py)
  - [cycle22_rebacktest_3d.py](cycle22_rebacktest_3d.py)
  - [cycle22_ranking.py](cycle22_ranking.py)

**Compute time**: Matrix 1625s (~27min), 3D 822s (~14min) → total ~41min single-threaded.

---

## §8. Gate before Phase O-2

- [x] Rankings JSON produced theo §5 MEASUREMENT schema
- [x] Split-half verify trên picks (không phải top-2 composite) — fixed from original pre-reg
- [x] Collapse rules applied (§3.2 MEASUREMENT)
- [x] Null picks honored (không force surface)
- [ ] **USER APPROVAL** — cần chốt §4 option + confirm 5 products ready for UI

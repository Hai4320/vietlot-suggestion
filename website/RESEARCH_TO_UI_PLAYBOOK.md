# Research → UI Playbook

> **Mục đích**: Bridge doc cho flow **sau khi hoàn thành một research cycle** → **cập nhật UI + documents**. Giải quyết gap: ALGORITHM_MANAGEMENT.md cover code mechanics (add new strategy), nhưng không có doc hướng dẫn rõ **khi nào ship**, **file nào phải update**, và **làm sao tránh UX claim sai khoa học**.
>
> **Dùng khi nào**: Sau mỗi cycle (Chu kỳ N → N+1), cycle audit (Chu kỳ 12.5 style), hoặc khi data refresh → re-rank. Áp dụng cho bất kỳ decision state nào (Accept / Suggestive / Ship-with-caveats / Reject / Inconclusive).
>
> **Không phải**: Research methodology (xem [research/METHODOLOGY.md](research/METHODOLOGY.md)), algorithm code architecture (xem [ALGORITHM_MANAGEMENT.md](ALGORITHM_MANAGEMENT.md) §4-5).

---

## 1. Overview — Research outputs vs UI surfaces

### Research outputs (per cycle)

| Output | Location | Immutable? |
|--------|----------|:-:|
| Pre-registration hypothesis + decision rule | `research/history/cycleNN_<slug>.md` | ✅ Yes (append-only) |
| Backtest results JSON | `research/<product-dir>/cycleN_*_results.json` | ✅ Yes |
| Run logs | `research/<product-dir>/cycleN_*_output.log` (gitignored) | — |
| Result section append | Same cycle file | ✅ Yes |
| Methodology update (if new Principle) | `research/METHODOLOGY.md` §3.N | Append-only |
| Summary table + cycle index row | `research/RESEARCH_HISTORY.md` | Editable |
| Product-specific final report (if research line closes) | `research/<product-dir>/<PRODUCT>_FINAL_REPORT.md` | Editable |

### UI surfaces (affected)

| Surface | File(s) | Type |
|---------|---------|------|
| Per-product suggestion panel | [`src/components/products/SuggestionPanel.tsx`](src/components/products/SuggestionPanel.tsx) — `PRODUCT_RANKS` | Hardcoded TS constant |
| Product page banner (3D-style research-mode disclosure) | [`src/components/pages/ThreeDProductPage.tsx`](src/components/pages/ThreeDProductPage.tsx) | Inline JSX |
| BacktestCard table | [`src/lib/backtest-data.ts`](src/lib/backtest-data.ts) — `BACKTEST_MATRIX` + `BACKTEST_3D` | Hardcoded TS constant |
| Research page — story + stats + picks | [`src/app/research/page.tsx`](src/app/research/page.tsx) | Inline constants |
| Algorithms page — strategy descriptions + rankings + recommendations | [`src/app/algorithms/page.tsx`](src/app/algorithms/page.tsx) — `STRATEGIES`, `RECOMMENDATIONS_3D`, `RECOMMENDATIONS` | Inline constants |
| Algorithm management doc (Ma trận table) | [`ALGORITHM_MANAGEMENT.md`](ALGORITHM_MANAGEMENT.md) §3 | Markdown |

### Data flow (current state — manual, Chu kỳ 13)

```
research/<cycle>/backtest_results.json
        ↓ (manual copy-extract by dev)
src/lib/backtest-data.ts (TS constants)
        ↓ (imported by)
src/components/products/BacktestCard.tsx
src/app/algorithms/page.tsx
```

**Note**: No automated pipeline currently. Dev đọc JSON, cập nhật TS constant bằng tay. Phase 3 roadmap có đề cập automation (build script sinh TS từ JSON).

---

## 2. Decision Matrix — Research outcome → UI action

Sau khi cycle kết thúc, apply decision rule binding từ pre-registration. Actions per state:

| Research state | Deploy to UI? | SuggestionPanel `picks`? | BacktestCard decision badge | Banner / disclaimer | Rationale |
|----------------|:-:|-----------|-----------|---------|-----------|
| **Accept** (pass 3-gate + Principle #14 magnitude OK) | ✅ Yes | Candidate cho `picks.winrate`/`picks.roi` với green "✓ Accept" badge | `Accept` (green) | None — confirmed edge | First robust edge in project history; allowed to claim edge |
| **Suggestive** (full Bonferroni + split-half pass + forward directional, pending Accept) | 🟡 Ship-with-disclaimer | Candidate cho `picks` với "🔬 Directional" orange badge; gắn "🎯 Trúng cao nhất" hoặc "💰 Lỗ ít nhất" tùy axis | `Suggestive` (yellow) | "Suggestive — pending replication" | Has statistical evidence, not robust across all gates |
| **Ship-with-caveats** (Principle #14 flag OR scientific doubt despite technical pass) | 🟡 **LIMITED** — research/algorithms page only; NOT trong SuggestionPanel `picks` | Display trong ranked list với "⚠ Ship-with-caveats", KHÔNG trong `picks` | `Suggestive` + caveat note | "Replication required, do not deploy" | Usually from audit cycle (e.g., Chu kỳ 12.5 GBM) |
| **Inconclusive** (split-half disagreement hoặc gate partial) | ❌ No | Remove khỏi `picks` nếu đang ở đó | `Inconclusive` (gray) | Optional note in description | Not enough evidence either way |
| **Reject** (Δ≤0, split-half direction flip, forward flip, etc) | ❌ No | Remove khỏi `picks`; demote in `ranks`; add ⚠ vào `stats[key]` | `Reject` (muted red) | If was claimed before: ⚠ stale claim retracted | Scientific confidence it's not real |

### 2.5 Pick selection rule (post 2026-04-21 pick-by-metric refactor)

Mỗi product có 1-2 picks split theo axis. Rule codified sau khi replace `rec1`/`rec2` flat fields bằng `picks: { winrate, roi? }`:

| Axis | Pick key | Label UI | Tiêu chí chọn |
|------|----------|----------|---------------|
| 🎯 Tỷ lệ trúng cao nhất | `picks.winrate` | Green badge "🎯 Trúng cao nhất" | Max `winPct` (matrix) / `exactPct` (3D) trong non-Reject-overfit UI-available strategies |
| 💰 Lỗ ít nhất | `picks.roi` (optional) | Yellow badge "💰 Lỗ ít nhất" | Max `roi` (least negative). Omit nếu cùng strategy với winrate → Pareto-dominant, 1 pick |

**Algorithm** (dev-side, khi sync sau cycle):
1. Lọc strategies có decision `Reject` vì overfit/direction-flip/Principle #14/#15 fail → EXCLUDE
2. Lọc strategies không có UI mapping (vd: CoverageOpt ↔ maxentropy) → EXCLUDE
3. Sort theo winPct desc → top 1 = `picks.winrate.strategy`
4. Sort theo roi desc → top 1
5. Nếu step 3 & step 4 cùng strategy → omit `picks.roi` (collapse)
6. Tie-break (cùng winPct hoặc cùng roi): avg_matches cao hơn

**⚠️ Methodology caveat** (flagged trong UI disclaimer + [/glossary "Pick selection rule"](src/app/glossary/page.tsx)):
- Rule dùng point estimate từ 1 backtest, KHÔNG áp split-half cho chính quy tắc pick
- Tie-breaking bằng avg_matches là ad-hoc, có thể flip ở split khác
- Label "💰 Lỗ ít nhất" cần honest: ROI từ −31% đến −94%, không có lãi
- Cần cải thiện cycle sau (vd: pick bằng cross-validated estimate thay vì train-set max)

### Key gate definitions

- **Principle #14 magnitude threshold**: `|Δ_full| > 3 × bias_ceiling` where:
  - 3D: bias ceiling = 0.4pp → threshold = 1.2pp
  - Matrix (6/55, 6/45, 5/35): bias ceiling = 0.3pp → threshold = 0.9pp
  - If exceeded → auto-flag Ship-with-caveats pending audit, regardless of p-values
- **Forward gate v1 (current, loose)**: `forward Δ > 0` directional
- **Forward gate v2 (proposed Chu kỳ 12.5, tighten)**: `forward Δ > 0 AND |forward Δ| > 2 × SE` OR `forward p < 0.15 one-sided`
- **Principle #15 (ML strategies)**: `n_unique_predictions / total_predictions ≥ 0.30` AND `top-5 concentration < 30%`. Violating → auto-Reject.

---

## 3. File-by-file checklist (per cycle)

Áp dụng qua 5 phases. Each phase có specific files to touch.

### Phase A — Research artifacts (before UI)

**Required** regardless of cycle outcome:

- [ ] `research/history/cycleNN_<slug>.md` — append Result section with decision + reason
- [ ] `research/RESEARCH_HISTORY.md` — add row to summary table + cycle index với 1-line hook
- [ ] `research/<product>/cycleN_*_results.json` — commit JSON artifacts

**If new Principle codified** (ví dụ: Chu kỳ 12.5 → Principle #14/#15):

- [ ] `research/METHODOLOGY.md` §3.N — append binding rule với origin cycles
- [ ] Update footer timestamp in METHODOLOGY

**If research line closes** (e.g., Chu kỳ 13 closed 3D):

- [ ] `research/<product>/<PRODUCT>_FINAL_REPORT.md` — comprehensive synthesis
- [ ] If superseding old report: add ⚠️ SUPERSEDED banner to old

### Phase B — UI core updates (after each cycle, regardless of ship decision)

**Always needed** to reflect reality vs stale claims:

- [ ] `src/lib/backtest-data.ts`:
  - Update header comment: "Refreshed {date} post-Chu kỳ N"
  - Update `BACKTEST_MATRIX` or `BACKTEST_3D` per product với new strategy rows
  - **Critical**: Update existing strategies' `decision` field if Rejected by new cycle (e.g., Chu kỳ 9 changed Mega ExpDecay_Cold Suggestive → Reject)
  - Add comment inline with ⚠️ marker on Rejected strategies: `// ⚠️ Chu kỳ N reason`

### Phase C — Deploy decision-dependent updates

**Only if Accept / Suggestive / Ship-with-caveats**:

- [ ] `src/components/products/SuggestionPanel.tsx`:
  - `ALL_STRATEGIES` — add new strategy entry nếu chưa có, với emoji + label + description
  - `PRODUCT_RANKS[<slug>]`:
    - Update `ranks` (re-order by new cycle result; winrate pick nên rank 1)
    - Update `stats` (với Δ, p-value, mark best axis với 🎯/💰)
    - Update `picks.winrate` (always) + `picks.roi` (omit nếu Pareto-dominant) per §2.5 rule
    - Update `recReason` với honest framing ("Split axes..." hoặc "Pareto-dominant...")
- [ ] `src/app/algorithms/page.tsx`:
  - `STRATEGIES` array — add new entry nếu chưa có
  - `RECOMMENDATIONS_3D` or `RECOMMENDATIONS` — update `winratePick` + `roiPick?` per product theo `MetricPick` schema
  - Update backtest tables nếu liệt kê cycle-specific results
- [ ] `src/app/research/page.tsx`:
  - `CURRENT_PICKS` — update `winratePick` + `roiPick?` per `CurrentPick` schema (mirror SuggestionPanel)
- [ ] `src/app/glossary/page.tsx`:
  - Update "Research pick (UI)" example nếu picks thay đổi; "Pareto-dominant" example nếu dominance thay đổi

**Only if Reject** (previously was Accept/Suggestive/Ship):

- [ ] Remove khỏi `picks.winrate`/`picks.roi` in SuggestionPanel → replace với next-best per §2.5 rule; re-check Pareto-dominance
- [ ] Demote trong `ranks`; update `stats[key]` với ⚠️ marker
- [ ] `ALL_STRATEGIES` description: add ⚠️ note with cycle reference ("⚠️ Chu kỳ N split-half Reject")
- [ ] Remove "🏆 Khuyến nghị" / "🎯 Trúng cao nhất" / "💰 Lỗ ít nhất" badge (tự động mất khi strategy không còn trong `picks`)
- [ ] `algorithms/page.tsx` RECOMMENDATIONS: update `winratePick` / `roiPick` + reason text
- [ ] `research/page.tsx` CURRENT_PICKS: mirror update

### Phase D — Research transparency page

- [ ] `src/app/research/page.tsx`:
  - Update summary table / stats-at-a-glance (big numbers) if cycle count changed
  - Add cycle row to `CYCLES_TIMELINE` với date + 1-line result
  - Add principle to `PRINCIPLES` array if new one codified
  - Update banner nếu research line newly closed

### Phase E — Algorithm management docs

- [ ] `website/ALGORITHM_MANAGEMENT.md`:
  - Update "Ma trận Thuật toán × Sản phẩm" table (rankings per product)
  - Update "Hiển thị mặc định" table: 🎯 Trúng cao nhất + 💰 Lỗ ít nhất columns (2 picks hoặc 1 Pareto-dominant) + note
  - Add ⚠️ marker for Rejected strategies in Ma trận table

### Phase F — Validation

**Always needed before pushing**:

- [ ] `cd website && npm run build` — production build (catches type errors, import issues, missing refs)
- [ ] `npx tsc --noEmit` — type check
- [ ] Smoke test routes với curl:
  ```bash
  for url in "/" "/max-3d" "/max-3d-pro" "/suggest" "/research" "/algorithms"; do
    curl -o /dev/null -s -w "%{http_code} $url\n" "http://localhost:3000$url"
  done
  ```
- [ ] Visual check: open relevant pages in browser, verify:
  - Research banner shows (3D pages)
  - SuggestionPanel `picks.winrate` (+ `picks.roi` if 2 picks) matches decision matrix + §2.5 rule
  - BacktestCard decision badges per new state
  - Research page TL;DR + stats match + CURRENT_PICKS consistent
  - Algorithms page `winratePick`/`roiPick` consistent với SuggestionPanel
  - Glossary "Pick selection rule" + "Pareto-dominant" examples chưa stale

### Phase G — Commit

- [ ] Single PR per cycle (easier revert)
- [ ] Commit message template:
  ```
  feat(research): Chu kỳ N — <mechanism> (<decision>)

  <1-2 sentence summary>

  Verdict: <state> per pre-registered 3-gate rule.
  <Key result stats>

  UI updates (if any):
  - <file>: <change>

  Methodology updates (if any):
  - Principle #N: <title>

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```

---

## 4. Case study — Chu kỳ 13 (worked example)

**Context**: Last 3D cycle, closed research line. 2 new strategies tested (PooledDigitBias, HierarchicalBayesDigit), both Reject.

**Applied phases**:

**Phase A** ✓
- Created [`research/history/cycle13_pool.md`](research/history/cycle13_pool.md) with pre-reg + result
- Updated [`research/RESEARCH_HISTORY.md`](research/RESEARCH_HISTORY.md) table + index
- Committed JSON results

**Phase B** ✓
- [`src/lib/backtest-data.ts`](src/lib/backtest-data.ts):
  - Header: "Refreshed 2026-04-21 post-Chu kỳ 13"
  - Added 2 new rows to BACKTEST_3D for both products với Reject decision
  - Updated Mega 6/45 ExpDecay_Cold (Chu kỳ 9): Suggestive → Reject retroactively

**Phase C** ✓ (Original Chu kỳ 13 scope)
- [`SuggestionPanel.tsx`](src/components/products/SuggestionPanel.tsx):
  - Both 3D products: rec1 → JointDigitBias (best remaining directional)
  - rec2 → frequency (simpler backup)
  - Demoted EV Maximizer from rec1 (Chu kỳ 7 Reject)
  - Replaced "🏆 Khuyến nghị" badge với "🔬 Research pick" orange
- Added research-disclosure banner to [`ThreeDProductPage.tsx`](src/components/pages/ThreeDProductPage.tsx)

**Phase C'** ✓ (2026-04-21 pick-by-metric refactor, sau Chu kỳ 13)
- [`SuggestionPanel.tsx`](src/components/products/SuggestionPanel.tsx): `rec1`/`rec2` flat fields → `picks: { winrate, roi? }` schema
  - Power 6/55: Bayesian AI Pareto-dominant → 1 pick
  - Mega 6/45: Bayesian Sharp (win) + Phủ sóng (roi) → 2 picks
  - Lotto 5/35: Tự động tối ưu (win) + Phủ sóng (roi) → 2 picks
  - Max 3D: Phủ sóng Pareto-dominant (CoverageOpt) → 1 pick (JointBias demoted to rank 2 mechanism anchor)
  - Max 3D Pro: JointBias Pareto-dominant → 1 pick
- Badges renamed: "🎯 Win rate" → "🎯 Trúng cao nhất", "💰 ROI" → "💰 Lỗ ít nhất" (honest framing)
- Added "Hiểu đúng về research picks" collapsible disclaimer dưới picks card
- [`algorithms/page.tsx`](src/app/algorithms/page.tsx) + [`research/page.tsx`](src/app/research/page.tsx): mirror schema update
- [`glossary/page.tsx`](src/app/glossary/page.tsx): added 4 terms — "Research pick (UI)", "Pareto-dominant", "Pick selection rule", "Best-of-Reject"

**Phase D** ✓
- Redesigned [`src/app/research/page.tsx`](src/app/research/page.tsx):
  - Banner: "3D Research Line — Definitively Closed (Chu kỳ 13)"
  - Stats row: 28 / 8 / 1,776 / 0-Accept
  - Added Chu kỳ 13 row to CYCLES_TIMELINE
  - Principle #13-#15 already codified

**Phase E** ✓
- [`ALGORITHM_MANAGEMENT.md`](ALGORITHM_MANAGEMENT.md):
  - Ma trận table updated với Hybrid Parity ⚠ Reject marker
  - Default recommendations: per-product replication status notes

**Phase F** ✓ — `npm run build` passed, all routes 200, visual verified

**Phase G** ✓ — commits [405a1e9](../../405a1e9), [b51ce7f](../../b51ce7f), [c2eeadc](../../c2eeadc), [887e275](../../887e275), [f5e12f1](../../f5e12f1)

---

## 5. Badge + Language conventions

Consistent UX language across UI surfaces. Align all files to these:

### Strategy-level badges

| Badge | Color | When used | Where |
|-------|-------|-----------|-------|
| `✓ Accept` | green | Strategy passed 3-gate protocol + Principle #14 check | BacktestCard, SuggestionPanel |
| `🎯 Trúng cao nhất` | green | Winrate pick — max winPct/exactPct trong non-Reject (directional only, KHÔNG confirmed) | SuggestionPanel `picks.winrate`, /algorithms, /research |
| `💰 Lỗ ít nhất` | yellow | ROI pick — max roi (least negative). ROI vẫn âm, KHÔNG có lãi | SuggestionPanel `picks.roi` (when different from winrate) |
| `⚠ Ship-with-caveats` | yellow | Technical pass but scientific doubt | BacktestCard only, NOT trong SuggestionPanel `picks` |
| `Inconclusive` | gray | Gates disagree, not enough evidence | BacktestCard |
| `Reject` | muted red | Failed gate | BacktestCard |
| `🥇 #1` / `🥈 #2` / `🥉 #3` | medals | Relative ranking only, no edge claim | SuggestionPanel strategy grid |

### Language dos/don'ts

| ❌ Avoid (promotional) | ✅ Use instead (honest) |
|------------------------|------------------------|
| "Best strategy", "Khuyến nghị #1" | "🎯 Trúng cao nhất", "💰 Lỗ ít nhất", "Directional pick" |
| "Win rate pick" (sounds like "winner") | "Trúng cao nhất" (directional, clear không phải confirmed) |
| "ROI pick" (sounds like "có lãi") | "Lỗ ít nhất" (rõ ROI vẫn âm) |
| "Win rate X% — beat random 25%" (absolute) | "Δ +0.3pp vs Random" (relative + directional) |
| "ROI -26.5% (cải thiện 42%)" (sounds positive) | "ROI -26.5% vs Random -45%" (comparative) |
| "Confirmed edge" (unless Accept) | "Directional only (p=0.X, chưa significant)" |
| "Breakthrough algorithm" | "Research-grade exploration" |

### Banner conventions per product

**3D products (post-Chu kỳ 13 closed)**:

```
🔬 Research Mode — No confirmed edge
Sau 8 chu kỳ nghiên cứu + 28 chiến lược đã test, 0 chiến lược đạt Accept.
Research picks chỉ directional, không có edge confirmed.
EV luôn âm. Xem /research cho đầy đủ.
```

**Matrix products (still active research)**:

```
🔬 Research Mode — Ongoing
Các chiến lược đã test full-sample + Bonferroni gating.
Suggestive candidates chưa pass split-half replication — directional only.
EV luôn âm.
```

**Product với confirmed Accept** (currently zero):

```
✓ Accept confirmed — 3-gate protocol passed
Strategy X đạt Accept qua full-sample + split-half + forward_last_100.
Magnitude within bias ceiling (Principle #14). No overfit signature.
Edge: +X.XXpp (p=0.XXXX). Historical only, future performance not guaranteed.
```

---

## 6. Data refresh cadence

### Crawl schedule

- **Daily**: new draws arrive per product schedule (2-day for 3D/Mega, 8-min for Keno, etc). Run `make run-crawl` daily.
- **Weekly**: run `make run-missing` to detect gaps + fill.
- **After +100 draws** (any product): trigger re-backtest of existing top strategies to check for forward flip.

### Re-backtest trigger criteria

Không tự động re-rank UI mỗi lần data crawl. Chỉ re-backtest khi:

1. Product đã +100 draws kể từ last cycle
2. Previously "Suggestive" strategy → verify forward flip chưa xuất hiện
3. Before major UI release / deployment
4. Before any public claim of "best strategy"

### Data refresh doesn't imply UI update

- Data refresh = new draws crawled
- UI update = PRODUCT_RANKS (ranks/stats/picks) / BACKTEST_* constants regenerated
- UI update chỉ happen khi có cycle completion HOẶC re-backtest trigger above

---

## 7. Anti-patterns (đã gặp)

| Anti-pattern | Example | Consequence | Prevention |
|--------------|---------|-------------|------------|
| **Ship stale Suggestive** | Mega 6/45 ExpDecay_Cold shown Suggestive 2 months after Chu kỳ 9 Reject | User trusts retracted claim | Principle #13 forward gate mandatory trước Accept; demote stale claims ngay khi Reject |
| **"Chapter 4 era" recommendations** | Max 3D Pro rec1="evmax" months after Chu kỳ 7 split-half Reject | Active UX lie | Chu kỳ outcome must gate UI rec1 within same PR |
| **Magnitude-blind Accept** | GBM Chu kỳ 12 "Technical Accept" on Max 3D Pro (+3pp = 7× ceiling) | Ship false positive | Principle #14 auto-flag magnitude > 3× ceiling |
| **Pre-correction claim persists** | Power 5/35 Hybrid Parity "p=0.011 significant" 1 year after sample-size bug fix (Chu kỳ 5 correction → p=0.301 Reject) | Chu kỳ 5 documented but UI never caught up | Phase B mandatory: update BACKTEST_* constants after each correction |
| **Post-hoc decision rule change** | "Actually, forward gate should be stricter, so let's Accept anyway" | P-hacking ngược | Pre-reg decision rule binding — audit cycle required if wanting to change rule |

---

## 8. Checklist TL;DR

After each cycle:

1. ✅ Append cycle result to `research/history/cycleNN_*.md` + update RESEARCH_HISTORY.md
2. ✅ Update `backtest-data.ts` with new strategies + **revised decisions** for existing Rejects
3. ✅ If shipping: update `SuggestionPanel.tsx` PRODUCT_RANKS với new `picks.winrate` / `picks.roi?` per §2.5 rule
4. ✅ If demoting: remove khỏi `picks` (winrate + roi), demote in ranks, add ⚠ note trong stats[key]. Re-run §2.5 rule để pick next-best.
5. ✅ Update `research/page.tsx` stats + cycles timeline + principles
6. ✅ Update `algorithms/page.tsx` RECOMMENDATIONS if top picks changed
7. ✅ Update `ALGORITHM_MANAGEMENT.md` Ma trận table + default recs
8. ✅ `npm run build` + type check + curl smoke + visual check
9. ✅ Commit per template + push

**Red flags to never ignore**:

- Any strategy shown in UI với decision state older than latest relevant cycle
- Magnitude > 3× bias ceiling (Principle #14) displayed as Accept
- "🏆 Khuyến nghị" on a strategy Rejected in replication
- BacktestCard "Suggestive" badge on strategy later Rejected

---

## 9. References

- [ALGORITHM_MANAGEMENT.md](ALGORITHM_MANAGEMENT.md) — algorithm tier system, code architecture
- [research/METHODOLOGY.md](research/METHODOLOGY.md) — research pipeline + 15 principles
- [research/EVALUATION.md](research/EVALUATION.md) — metrics + significance + decision rules
- [research/RESEARCH_HISTORY.md](research/RESEARCH_HISTORY.md) — cycle index
- [research/3d/3D_FINAL_REPORT.md](research/3d/3D_FINAL_REPORT.md) — 3D closure case study

---

*Created 2026-04-21 post-Chu kỳ 13. Based on Phase 1-4 UI cleanup done during 3D research line closure.*

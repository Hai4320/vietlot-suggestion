## Chu Kỳ 4 — 3D Deep Analysis & Strategies (03/2026 – 04/2026)

### Mục tiêu
Mở rộng sang Max 3D và Max 3D Pro — structure khác (000-999, 20 số/kỳ, 4 tiers prize). Thiết kế framework phân tích thống kê bài bản (13 tests) và thuật toán khai thác bias digit-level.

### Phương pháp

**Phase 1 — 13-test RNG Deep Analysis** (`3d/deep_analysis.py`):
1. Chi² whole number, 2. Chi² per-digit, 3. Digit independence, 4. Serial correlation,
5. Runs test, 6. Digit sum, 7. Tier analysis, 8. Temporal window, 9. Gap analysis,
10. Conditional probability, 11. Ending digit, 12. Repeat analysis, 13. Draw sum.

**Phase 2 — Bias Exploitation Strategies** (`3d/advanced_backtest.py`):
- `JointDigitBias` — joint P(abc) thay vì P(a)P(b)P(c)
- `ConditionalChain` — P(a,b,c) = P(a)·P(b|a)·P(c|a,b)
- `EVMaximizer` — tối ưu Expected Value theo tier prizes
- `PairExploiter`, `ULTIMATE Composite`, 6 strategies nữa

**Phase 3 — Walk-forward backtest** n_runs=5, predictions=2/draw.

### Kết quả

**Bias phát hiện**:
- Digit 6 over-represented **+10%** ở hàng đơn vị (Chi² p≈0, qua Bonferroni)
- Digit 5 over-represented **+6%** ở hàng chục
- Digit positions **KHÔNG** độc lập (Chi² joint p<0.001)
- Temporal stable (no time-varying bias)

**Top strategies**:
| Product | #1 | Exact% | ROI |
|---------|----|--------|-----|
| Max 3D | FreqWholeHot | 2.35% | -32.8% |
| Max 3D Pro | EVMaximizer | 2.50% | **-26.5%** ★ |
| Max 3D (research) | JointBias | 2.27% | -39.0% |

### Bài học
- 🎯 **Digit-level analysis là critical** — whole-number phân bố PASS nhưng digit-level FAIL
- 🎯 **Joint probability > marginal independence** khi positions dependent
- 🎯 **Bias nhỏ (+10%) nhưng consistent** → edge ~15-25% vs random ở thuật toán khai thác
- ✨ **13-test framework tổng quát hóa được** — trở thành template cho Chu kỳ 5

### Artifacts
- `3d/deep_analysis.py` + `3d/deep_analysis.json` (8,000+ dòng data)
- `3d/advanced_backtest.py` + `3d/advanced_backtest_results.json`
- `3d/REPORT.md`
- `RESEARCH_PLAYBOOK.md` — methodology template rút ra từ chu kỳ này

---

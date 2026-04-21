## Chu Kỳ 10 — Pivot Decision: Research Direction → Breakthrough Mode (04/2026)

> **Đây không phải cycle nghiên cứu** — là một **meta-cycle** ghi lại quyết định thay đổi định hướng chiến lược của project sau Chu kỳ 9. Mục đích: tài liệu hoá lý do, scope of changes, và guardrails mới để không drift thành p-hacking.

### Trigger

Sau Chu kỳ 9, 3/3 Suggestive candidates fail split-half replication. Không còn strategy nào đạt Accept hoặc Suggestive trên bất kỳ sản phẩm nào. Traditional null-hypothesis testing pipeline đã exhaust searched space của current strategy toolbox (25+ strategies).

Decision points sau Chu kỳ 9 Impact §5:
- Option A — Pause research line
- Option B — Methodology breakthrough (new approach paradigms)
- Option C — Wait for more data

**Chọn Option B**: pivot sang breakthrough mode với mục tiêu explicit là tìm thuật toán chiến thắng Random với hiệu suất đầu tư (ROI) và tỷ lệ trúng giải (win rate) cao nhất. Document changes ghi trong cycle này, implementation sẽ ở Chu kỳ 11+.

### Mục tiêu mới (explicit — refined 2026-04-20 late afternoon theo user clarification)

**Priority hierarchy** (weight trong tournament §8 composite):

1. **🎯 PRIMARY (weight 0.40) — Tối đa hoá tỷ lệ trúng giải trong tương lai (future win rate)**
   - P(≥3 match) matrix / exact match rate 3D
   - Measured primarily via **forward validation** ([EVALUATION §9](../EVALUATION.md)) — rolling-window last-100 draws
2. **📊 SECONDARY meaningful (weight 0.30) — Hiệu suất đầu tư (ROI balanced)**
   - Δ_ROI vs Random. Ratio win:ROI = 4:3 — ưu tiên rõ ràng nhưng ROI vẫn drive decision (không pure lexicographic)
3. **🛡️ GUARDS**
   - Sharpe (0.15) — risk-adjusted return check
   - −log₁₀(p-value) (0.15) — chống lucky-noise winner

Refinement này replace version first draft "3 objectives equally" — user clarify "winrate ưu tiên, ROI cân bằng" 2026-04-20 afternoon.

### What changes (documents touched)

| File | Change | Lý do |
|------|--------|-------|
| [METHODOLOGY.md](../METHODOLOGY.md) | Thêm §7 "Exploration Mode", relax §1.5 "simple beats complex", thêm §8 Multi-objective ranking với **weights 0.40/0.30/0.15/0.15** (refined). Phase 3' gate add forward validation | Codify pivot + win-rate priority |
| [EVALUATION.md](../EVALUATION.md) | §1.2 ROI thành meaningful secondary (not co-primary), §6 decision rules add forward veto, §8 Tournament ranking với refined weights, **§9 Forward Validation NEW** | Match win-rate-first priority + future generalization |
| [BREAKTHROUGH_ROADMAP.md](../BREAKTHROUGH_ROADMAP.md) (new) | Liệt kê concrete R&D paths + **priority re-rank for win-rate goal** (Path #1 Online Bayesian 1st, Path #3 Cross-product 2nd, Path #2 Kelly demote 4th) | Action plan aligned với priority |
| [RESEARCH_PLAYBOOK.md](../RESEARCH_PLAYBOOK.md) | Breakthrough template weights 0.40/0.30/0.15/0.15, thêm Forward validation plan section, strategy categories E/F/G với Category G note demote | Template support |
| [README.md](../README.md) | Mục tiêu section với explicit priority hierarchy (primary/secondary/guards) + Chu kỳ 11 pivot to Online Bayesian | Surface refined direction |
| [RESEARCH_HISTORY.md](../RESEARCH_HISTORY.md) | This entry + refinement note | Record decision + clarification |

### What STAYS strict (non-negotiable guardrails)

Pivot này KHÔNG relax các guardrails sau — nếu relax sẽ dẫn đến p-hacking và ship snake-oil:

1. **Principle #11 — Split-half replication mandatory** cho mọi Accept claim. Breakthrough strategy vẫn phải pass split-half để được label "statistically proven edge".
2. **Principle #12 — Variable-baseline power analysis** bắt buộc trước replication cycle.
3. **Pre-registration hypothesis** trước implement — chống HARKing.
4. **Walk-forward, no look-ahead** — rule bất khả xâm phạm.
5. **Random baseline bắt buộc** — không có benchmark = không có claim.
6. **EV âm disclaimer trên website** — lottery vẫn là -EV; "least negative ROI" không phải "profitable".

### What IS relaxed

1. **R1 gate không còn là STOP signal** — nếu Phase 1 báo white noise, pivot sang exploration track (thay vì dừng cycle). Exploration track skip Phase 1 bias-detection, đi thẳng vào strategy design với rationale là "novel mechanism" (e.g., portfolio theory, online learning).
2. **"Simple beats complex" không còn là hard prior** — vẫn bench vs simple, nhưng complex không cần beat simple ≥2σ để được ship. Tournament ranking quyết định winner.
3. **Decision state mới "Ship-with-caveats"** — strategy có thể ship vào website khi là best-in-class trên product (tournament winner), kể cả khi p>0.05. Label rõ ràng trong UI.
4. **Phase gate không strict sequential** — có thể chạy Phase 2-3 parallel với Phase 1 nếu strategy design không phụ thuộc bias detection.

### Guardrails mới (breakthrough-specific)

1. **Tournament ranking phải có ≥3 independent baselines** (Random + ≥2 simple) — không cherry-pick baseline dễ thắng.
2. **Composite score weights pre-registered** — không tune weights post-hoc để winner lọt top-1.
3. **Ship-with-caveats UI disclosure** — website phải hiện "unverified edge — best-in-class ranking only, không confirmed significant edge" cho strategies không pass Accept.
4. **Quarterly re-rank** — tournament rankings refresh mỗi 3 tháng khi có data mới (không static).
5. **Explicit risk labeling** — mỗi strategy trong website có badge: Accept (✓ edge confirmed) / Suggestive / Ship-with-caveats / Research-only.

### Proposed Chu Kỳ 11 (first breakthrough cycle — refined)

Xem [BREAKTHROUGH_ROADMAP.md](../BREAKTHROUGH_ROADMAP.md) cho danh sách đầy đủ.

**Recommend pick**: **Path #1 — Online Bayesian với Kalman-style posterior updates** (swap từ Kelly sau user clarification "ưu tiên win-rate").

**Rationale**:
- Win-rate relevance ▲▲▲ DIRECT — mechanism trực tiếp estimate P(number_i), primary metric là function của những estimates này.
- Low effort (1-2 ngày implement).
- Extends existing Bayesian baseline — clean comparison.
- Forward validation §9 đặc biệt meaningful vì online update inherently forward-oriented (posterior tại time t reflect most recent observations).

**Products target**: Mega 6/45 (primary), Lotto 5/35 (secondary).

**Chu kỳ 12 candidate**: Path #3 Cross-product joint model. **Chu kỳ 13+ candidate**: Path #2 Kelly portfolio (ROI-focused, explore sau khi win-rate paths có results).

---

*Cập nhật lần cuối: 2026-04-20 (late) — Chu kỳ 10 refined per user clarification: priority hierarchy explicit (win-rate PRIMARY, ROI meaningful secondary), weights 0.40/0.30/0.15/0.15, Forward Validation §9 NEW, Chu kỳ 11 swap to Path #1 Online Bayesian.*

*2026-04-20 — Pivot Decision documented. Implementation Chu kỳ 11+ (TBD).*

---

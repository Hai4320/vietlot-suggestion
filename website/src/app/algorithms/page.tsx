import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BACKTEST_MATRIX, BACKTEST_3D, type Decision } from "@/lib/backtest-data";
import { DecisionBadge } from "@/components/common/DecisionBadge";
import { formatPValue } from "@/lib/format";

// ============================================================
// Backtest data from Phase 4 evaluation (1300+ draws)
// ============================================================

// Origin tags for proper classification per ALGORITHM_MANAGEMENT.md
const ORIGIN_TAGS = {
  builtin: { label: "Cơ bản", color: "hsl(210, 15%, 55%)", bg: "hsl(210, 15%, 55%)" },
  papers: { label: "📚 Từ papers", color: "hsl(217, 91%, 60%)", bg: "hsl(217, 91%, 60%)" },
  research: { label: "🔬 Tự nghiên cứu", color: "hsl(25, 95%, 53%)", bg: "hsl(25, 95%, 53%)" },
} as const;

const STRATEGIES = [
  {
    id: "hybridparity",
    name: "Hybrid Parity (5/35) ⚠",
    emoji: "🎰",
    origin: "research" as const,
    scope: "all" as const,
    shortDesc: "Multi-ticket wheeling (REJECTED Chu kỳ 5 correction)",
    description:
      "⚠️ **Chu kỳ 5 correction (2026-04-20)**: claim cũ &quot;p=0.011 ở N=20&quot; là artefact của bug sample-size dedup " +
      "(`dates.unique()` bỏ 50% data vì Power 5/35 có 2 draws/day). Sau fix bug iterate per-row: " +
      "thực chất Δ+1.75pp, p=0.301 → **Reject** (không có edge ý nghĩa thống kê). " +
      "Mechanism: phát hiện Phase 1 phân phối số lẻ trong 5 số chính lệch khỏi hypergeometric " +
      "(Chi² p=0.0012, Bonferroni pass). Bias tồn tại nhưng không exploitable single-ticket " +
      "(đã chứng minh toán học) hay multi-ticket wheeling. Giữ trong UI làm reference implementation.",
    methodology: [
      "Ước lượng phân bố số lẻ (k ∈ {0..5}) từ lịch sử — Dirichlet smoothing α=1",
      "Phân bổ N vé theo tỷ lệ largest-remainder: vd N=20 → 1,3,6,8,2,0 vé ở mỗi parity bin",
      "Trong mỗi bin: weighted-without-replacement sample (theo tần suất) cho k số lẻ + (5-k) số chẵn",
      "Max-min Hamming diversity: với mỗi vé mới, sinh 30 candidates, chọn vé xa nhất so với các vé đã có",
      "Shuffle output để UI không lộ thứ tự phân bổ bin",
    ],
    references:
      "T11 Parity test (p=0.0012, Chi² over Bonferroni) — power535_deep_analysis.json. " +
      "Wheeling theory: Gordon, Kuperberg & Patashnik (1995) — covering designs. " +
      "Bluskov (2020) — Combinatorial Systems for Pick-6.",
    color: "hsl(142, 71%, 45%)",
  },
  {
    id: "evmax",
    name: "EV tối đa ⚠",
    emoji: "💰",
    origin: "research" as const,
    scope: "3d" as const,
    shortDesc: "Expected Value maximizer (REJECTED Chu kỳ 7 replication)",
    description:
      "⚠️ **Chu kỳ 7 replication (2026-04-20)**: Full-sample p=0.053 near-miss Suggestive → split-half " +
      "test exposed **dramatic direction flip** (h1 p=0.0007 very strong → h2 p=0.865 fully fail). " +
      "Decision: **Reject**. Signature: full-sample signal was pooling artifact, không replicate trên held-out. " +
      "Mechanism: tối ưu Expected Value = Σ(weight × prize) với exponential decay (half-life=100). " +
      "Lấy mẫu từ top 80 với digit distance ≥ 4. Claim cũ &quot;#1 Max 3D Pro 2.50%&quot; rút lại.",
    methodology: [
      "Tính trọng số thời gian: weight = exp(-ln2 × i / half_life) cho kỳ thứ i",
      "Với mỗi số, tính EV = Σ (weight × prize_tier) qua 300 kỳ gần nhất",
      "Xếp hạng 1000 số theo EV giảm dần, lấy top 80 ứng viên",
      "Lấy mẫu có trọng số từ pool, ràng buộc digit distance ≥ 4 giữa 2 số",
      "Fallback nếu không đủ: chọn random từ pool",
    ],
    references: "Expected Value optimization, Exponential decay weighting, Diversity-constrained sampling — phát triển từ phân tích tier prizes Vietlott",
    color: "hsl(45, 93%, 47%)",
  },
  {
    id: "jointbias",
    name: "Bias liên hợp 🔬",
    emoji: "🧬",
    origin: "research" as const,
    scope: "3d" as const,
    shortDesc: "Joint 3-digit frequency — current research pick cho cả 2 3D products",
    description:
      "Khai thác phát hiện thống kê rằng 3 vị trí chữ số trong 3D KHÔNG độc lập " +
      "(Chi² pos_1_2 p=1e-06, pos_0_2 p=1.5e-05, pos_0_1 p=0.032). Thay vì P(abc) = P(a)×P(b)×P(c), " +
      "thuật toán tính trực tiếp tần suất đồng thời P(abc) trên 300 kỳ gần nhất với Laplace smoothing " +
      "(α=1.0), rồi lấy mẫu từ phân phối 1000 số theo xác suất joint. " +
      "**Research pick current**: Max 3D Δ+0.305pp (p=0.11) + Max 3D Pro Δ+0.378pp (p=0.14) — " +
      "directional only, không confirmed edge. Được chọn vì magnitude trong Principle #14 bias ceiling " +
      "(+0.4pp) + không có overfit signature. Trở thành mechanism anchor cho Chu kỳ 11/12/13 so sánh.",
    methodology: [
      "Đếm tần suất đồng thời (joint frequency) cho mỗi số 000-999 qua 300 kỳ gần nhất",
      "Laplace smoothing: P(num) = (count + α) / (total + 1000 × α), α = 1.0",
      "Temperature scaling: P_t = P^(1/T), T = 1.0 (giữ nguyên phân phối)",
      "Lấy mẫu 2 số từ phân phối, không trùng lặp",
    ],
    references: "Chi-squared independence test, Laplace smoothing, Joint probability estimation — phát hiện từ 13 bài test RNG trên data Vietlott",
    color: "hsl(271, 91%, 65%)",
  },
  {
    id: "bayesian",
    name: "Bayesian AI",
    emoji: "🧠",
    origin: "papers" as const,
    scope: "all" as const,
    shortDesc: "Dirichlet posterior sampling",
    description:
      "Sử dụng phương pháp Bayesian với phân phối Dirichlet để mô hình hóa xác suất xuất hiện của từng số. " +
      "Thuật toán cập nhật \"niềm tin\" (prior) dựa trên tần suất thực tế, sau đó lấy mẫu từ phân phối posterior " +
      "để tạo bộ số. Tham số temperature kiểm soát mức độ tập trung: temperature cao (1.0) cho phân phối rộng " +
      "(phù hợp pool lớn như 6/55), temperature thấp (0.3) tập trung vào số có posterior cao (phù hợp Mega 6/45).",
    methodology: [
      "Thu thập tần suất xuất hiện mỗi số trong N kỳ gần nhất (lookback window)",
      "Xây dựng Dirichlet prior: α_i = 1 + freq(i) cho mỗi số i",
      "Lấy mẫu θ ~ Dirichlet(α) bằng Gamma sampling (Marsaglia-Tsang)",
      "Áp dụng temperature: θ_t = θ^(1/T) rồi normalize",
      "Chọn số theo xác suất θ_t, không trùng lặp",
    ],
    references: "Phân phối Dirichlet-Multinomial (Bayesian statistics), Marsaglia & Tsang (2000)",
    color: "hsl(262, 83%, 58%)",
  },
  {
    id: "pattern",
    name: "Mẫu cấu trúc",
    emoji: "🔮",
    origin: "research" as const,
    scope: "all" as const,
    shortDesc: "Spacing + range distribution analysis (ranked #1 overall matrix)",
    description:
      "Phân tích cấu trúc bộ số: khoảng cách giữa các số liên tiếp (spacing) và phân bố trên các vùng số (band distribution). " +
      "Chia dải số thành các vùng bằng nhau, chọn 1 số từ mỗi vùng dựa trên tần suất lịch sử trong vùng đó " +
      "và ưu tiên khoảng cách gần với median spacing lịch sử. " +
      "Xếp hạng #1 tổng hợp qua tất cả sản phẩm matrix (trung bình Δ = +0.015) và đặc biệt mạnh trên pool nhỏ (5/35). " +
      "Cho 3D: phân tích pattern chẵn/lẻ, lớn/nhỏ từng chữ số + lọc digit-sum.",
    methodology: [
      "Phân tích 200 kỳ gần nhất: spacing và band frequency",
      "Chia dải số thành K vùng bằng nhau (K = số cần chọn)",
      "Từ mỗi vùng: weighted random theo band freq + global freq",
      "Spacing bonus: ưu tiên số tạo khoảng cách gần median lịch sử",
      "3D: chọn pattern chẵn/lẻ + lớn/nhỏ phổ biến nhất, lọc digit-sum",
    ],
    references: "Pattern analysis (thống kê cấu trúc), Range distribution, Spacing analysis, Covering Designs (Gordon 1995)",
    color: "hsl(300, 70%, 50%)",
  },
  {
    id: "maxentropy",
    name: "Phủ sóng tối đa",
    emoji: "🎯",
    origin: "papers" as const,
    scope: "all" as const,
    shortDesc: "Ma trận: Max-Entropy band sampling | 3D: SumRange digit-sum filter",
    description:
      "Cho xổ số ma trận: chia toàn bộ dải số thành các vùng (band) bằng nhau, mỗi vùng chọn đúng 1 số. " +
      "Trong mỗi vùng, sử dụng Dirichlet posterior để quyết định số nào được chọn. " +
      "Đảm bảo phủ sóng đều toàn bộ dải số thay vì tập trung vào 1 vùng. " +
      "Cho Max 3D: sử dụng SumRange Filter — lọc bộ số theo tổng chữ số (digit-sum) nằm trong mean ± 1σ, " +
      "kết hợp trọng số tần suất digit. ROI tốt nhất trong toàn bộ nghiên cứu 3D (-35.1%).",
    methodology: [
      "Ma trận: chia dải [min, max] thành K vùng bằng nhau → Dirichlet sampling mỗi vùng",
      "3D: tính digit-sum distribution từ lịch sử → lọc theo mean ± 1σ",
      "3D: kết hợp digit frequency weights để chọn số trong vùng cho phép",
      "Đảm bảo không trùng lặp",
    ],
    references: "Maximum Entropy Principle (Jaynes, 1957), SumRange digit-sum filtering (GitHub lottery repos)",
    color: "hsl(142, 71%, 45%)",
  },
  {
    id: "adaptive",
    name: "Tự động tối ưu",
    emoji: "⚡",
    origin: "papers" as const,
    scope: "all" as const,
    shortDesc: "Self-tuning lookback window",
    description:
      "Tự động tìm cửa sổ phân tích tối ưu bằng cách thử nhiều khoảng thời gian khác nhau " +
      "(30, 90, 180, 365 ngày) và đánh giá hiệu suất trên các kỳ quay gần nhất. " +
      "Cửa sổ nào cho số trùng khớp trung bình cao nhất sẽ được chọn để tạo gợi ý. " +
      "Kết hợp 80% số dựa trên tần suất + 20% ngẫu nhiên để tránh overfitting.",
    methodology: [
      "Thử các window: [30, 90, 180, 365] ngày",
      "Mini-backtest mỗi window trên 10 kỳ quay gần nhất",
      "Đánh giá: đếm số trùng khớp trung bình",
      "Chọn window tốt nhất",
      "Dùng tần suất trong window đó: 80% top + 20% random",
    ],
    references: "Walk-forward optimization (Pardo, 2008), Adaptive parameter selection",
    color: "hsl(38, 92%, 50%)",
  },
  {
    id: "frequency",
    name: "Tần suất cao",
    emoji: "📊",
    origin: "builtin" as const,
    scope: "all" as const,
    shortDesc: "Frequency-weighted random sampling",
    description:
      "Phương pháp cổ điển: đếm tần suất xuất hiện của mỗi số trong lịch sử, " +
      "sau đó chọn ngẫu nhiên có trọng số — số xuất hiện nhiều hơn có xác suất được chọn cao hơn. " +
      "Dựa trên giả thuyết rằng một số viên bi có thể xuất hiện thường xuyên hơn do yếu tố vật lý. " +
      "Đơn giản nhưng hiệu quả — #1 cho cả Max 3D lẫn Max 3D Pro (Exact 2.33-2.35%).",
    methodology: [
      "Đếm tần suất xuất hiện mỗi số trong toàn bộ lịch sử",
      "Gán trọng số = tần suất",
      "Chọn ngẫu nhiên có trọng số, không trùng lặp",
    ],
    references: "Frequency Analysis (thống kê mô tả cơ bản)",
    color: "hsl(210, 80%, 55%)",
  },
  {
    id: "absence",
    name: "Số vắng lâu",
    emoji: "⏳",
    origin: "builtin" as const,
    scope: "all" as const,
    shortDesc: "Long absence priority",
    description:
      "Ưu tiên những số đã lâu không xuất hiện, dựa trên tâm lý \"law of averages\" — " +
      "nếu một số lâu chưa ra thì \"đến lượt\" nó rồi. Về mặt toán học, điều này không đúng " +
      "với xổ số ngẫu nhiên thật sự, nhưng nếu máy quay không hoàn hảo, có thể có bias nhỏ.",
    methodology: [
      "Xác định lần cuối mỗi số xuất hiện (distance)",
      "Sắp xếp theo khoảng cách giảm dần",
      "Chọn từ top các số vắng lâu nhất, kèm ngẫu nhiên hóa",
    ],
    references: "Gambler's Fallacy analysis, nhưng có giá trị tham khảo",
    color: "hsl(280, 60%, 55%)",
  },
  {
    id: "mixed",
    name: "Kết hợp nóng–lạnh",
    emoji: "🎲",
    origin: "builtin" as const,
    scope: "all" as const,
    shortDesc: "Hot + Cold balanced blend",
    description:
      "Pha trộn 50% số nóng (tần suất cao) và 50% số lạnh (vắng lâu) trong cùng một bộ số. " +
      "Mục đích là cân bằng giữa hai trường phái: \"số hay ra\" và \"số sắp ra\", " +
      "tạo sự đa dạng trong bộ số được gợi ý. " +
      "Cho 3D: tạo số digit-by-digit dùng trọng số tần suất từng vị trí.",
    methodology: [
      "Ma trận: 50% bộ số từ top 15 số tần suất cao + 50% từ top 15 số vắng lâu",
      "3D: tạo từng chữ số (hàng trăm, chục, đơn vị) theo trọng số tần suất vị trí đó",
      "Đảm bảo không trùng lặp trong cùng bộ số",
    ],
    references: "Ensemble approach (kết hợp đơn giản), Digit-level frequency weighting",
    color: "hsl(0, 72%, 51%)",
  },
];

// Backtest results alias from SSOT in lib/backtest-data.ts.
// Previously duplicated inline — consolidated 2026-04-21 (Phase B refactor).
// Any future cycle updates → edit lib/backtest-data.ts ONLY.
const BACKTEST_RESULTS = BACKTEST_MATRIX;

// Research picks split by metric (Win rate vs ROI). 1-2 picks per product.
// Excludes Reject-vì-overfit/direction-flip. Source of truth: lib/backtest-data.ts.
type MetricPick = { name: string; emoji: string; stat: string };
type Recommendation = {
  product: string;
  emoji: string;
  color: string;
  winratePick: MetricPick;
  roiPick?: MetricPick; // undefined if same strategy wins both axes
  reason: string;
  special?: string;
};

const RECOMMENDATIONS: Recommendation[] = [
  {
    product: "Power 6/55",
    emoji: "🔴",
    color: "hsl(0, 72%, 51%)",
    winratePick: { name: "Bayesian AI", emoji: "🧠", stat: "Win 1.65%, Δ+0.031 avg, ROI −91.4%" },
    // Bayesian Pareto-dominant → no separate ROI pick
    reason:
      "Bayesian AI thắng cả 2 axes trong 7 strategies đã test: Win rate cao nhất (1.65%) + ROI ít lỗ nhất (−91.4%, " +
      "tốt hơn 2-3pp so với phần còn lại). Pool 55 số lớn + 1,334 draws → noise cao, z-test p=0.511 → Reject.",
    special: "🔬 Directional pick only — không confirmed edge. Chu kỳ 14 planned = Online Bayesian Kalman variant.",
  },
  {
    product: "Mega 6/45",
    emoji: "🔵",
    color: "hsl(217, 91%, 60%)",
    winratePick: { name: "Bayesian AI Sharp", emoji: "🧠", stat: "T=0.3, Win 3.14%" },
    roiPick: { name: "Phủ sóng tối đa", emoji: "🎯", stat: "ROI −57.5%, Δ+0.010 avg" },
    reason:
      "Split axes: Bayesian Sharp (T=0.3) maximize Win rate 3.14%. Phủ sóng tối đa minimize lỗ với ROI −57.5% " +
      "(30pp tốt hơn Bayesian −88.5%). ⚠ ExpDecay_Cold (Chu kỳ 6 Suggestive p=0.0044) Rejected Chu kỳ 9 sau " +
      "split-half direction flip (h1 Δ=−0.26pp → h2 Δ=+0.37pp).",
    special: "⚠️ Chu kỳ 9 (2026-04-20): ExpDecay_Cold Rejected — claim cũ rút lại. Ensemble + Bayesian AI Suggestive full-sample (p=0.046) chưa replication-verified.",
  },
  {
    product: "Lotto 5/35",
    emoji: "🟢",
    color: "hsl(142, 71%, 45%)",
    winratePick: { name: "Tự động tối ưu", emoji: "⚡", stat: "Win 1.90%, Δ+0.038 avg" },
    roiPick: { name: "Phủ sóng tối đa", emoji: "🎯", stat: "ROI −84.4% (tied với Bayesian, avg cao hơn)" },
    reason:
      "Split axes: Adaptive max Win rate 1.90% (cao nhất). Phủ sóng tối đa min lỗ ROI −84.4% (10pp tốt hơn Adaptive). " +
      "⚠ HybridParityDiv cũ (claim p=0.011) là artefact của bug sample-size — Chu kỳ 5 correction cho p=0.301 → Reject. " +
      "Bias T11 Parity (p=0.0012) tồn tại nhưng không exploitable single-ticket hay multi-ticket.",
    special: "⚠️ HybridParityDiv: stale claim retracted 2026-04-20 after bug fix. Kept as reference implementation only.",
  },
];

// ============================================================
// 3D Products backtest data — SSOT in lib/backtest-data.ts
// (consolidated 2026-04-21 Phase B refactor — was triple-duplicated).
// ============================================================

const BACKTEST_RESULTS_3D = BACKTEST_3D;

const RECOMMENDATIONS_3D: Recommendation[] = [
  {
    product: "Max 3D",
    emoji: "🟣",
    color: "hsl(271, 91%, 65%)",
    winratePick: { name: "Phủ sóng tối đa", emoji: "🎯", stat: "Exact 2.22%, ROI −35.8% (cả 2 best)" },
    // CoverageOpt Pareto-dominates → no separate ROI pick
    reason:
      "Phủ sóng tối đa (CoverageOpt) Pareto-dominant: Win rate 2.22% (+0.52pp vs Random) + ROI −35.8% cả 2 best " +
      "trong UI-available non-overfit strategies. JointBias Δ+0.305pp là mechanism anchor (Chu kỳ 13) nhưng bị dominated metric. " +
      "28 chiến lược đã test qua 8 cycles, 0 Accept/Suggestive sau 3-gate protocol.",
    special: "⚠️ Research line CLOSED Chu kỳ 13 — no algorithm beats Random significantly. Xem 3D Final Report.",
  },
  {
    product: "Max 3D Pro",
    emoji: "🟠",
    color: "hsl(25, 95%, 53%)",
    winratePick: { name: "Bias liên hợp", emoji: "🧬", stat: "Exact 2.38%, ROI −31.5% (cả 2 best)" },
    // JointBias Pareto-dominant → no separate ROI pick
    reason:
      "JointBias Pareto-dominant trong UI-available non-overfit: Win rate 2.38% + ROI −31.5%. " +
      "EVMax ROI −26.5% tốt hơn nhưng Rejected Chu kỳ 7 (dramatic split-half flip h1 p=0.0007 → h2 p=0.865). " +
      "Δ+0.378pp directional, within Principle #14 ceiling.",
    special: "⚠️ EV Maximizer (formerly #1) deprecated — Chu kỳ 7 replication failure. GBM Chu kỳ 12 Technical Accept deprecated bởi Chu kỳ 12.5 audit (confirmed overfit).",
  },
];

export default function AlgorithmsPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="relative text-center py-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl -z-10" />
        <div className="text-5xl mb-4">🔬</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Thuật Toán Gợi Ý
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          10 thuật toán triển khai UI + 28+ chiến lược đã test qua 8 chu kỳ nghiên cứu.
          Walk-forward backtest + 3-gate protocol (full + split-half + forward validation).
        </p>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">10</div>
            <div className="text-xs text-muted-foreground mt-0.5">UI thuật toán</div>
          </div>
          <div className="h-10 w-px bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">28+</div>
            <div className="text-xs text-muted-foreground mt-0.5">Tested (3D)</div>
          </div>
          <div className="h-10 w-px bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">5</div>
            <div className="text-xs text-muted-foreground mt-0.5">Sản phẩm</div>
          </div>
          <div className="h-10 w-px bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">4.951</div>
            <div className="text-xs text-muted-foreground mt-0.5">Kỳ quay phân tích</div>
          </div>
          <div className="h-10 w-px bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-red-500">0</div>
            <div className="text-xs text-muted-foreground mt-0.5">Confirmed edge</div>
          </div>
        </div>
      </div>

      {/* Research state banner */}
      <Card className="border-orange-500/40 bg-orange-500/5">
        <CardContent className="pt-6 pb-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🔬</span>
            <div className="flex-1 space-y-2 text-sm">
              <div className="font-bold text-orange-700 dark:text-orange-400">
                Trạng thái research (2026-04-21)
              </div>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">3D research line CLOSED</strong> sau Chu kỳ 13 —
                28 chiến lược đã test qua 5 paradigms (probabilistic, joint-digit, copula, GBM, pool),
                <strong className="text-foreground"> 0 chiến lược đạt Accept/Suggestive</strong> qua 3-gate protocol.
                Research picks hiển thị dưới đây chỉ là <em>directional pick</em> (hướng positive nhưng không significant),
                không phải confirmed edge.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Matrix research</strong> (Power 6/55, Mega 6/45, Lotto 5/35) — đang active.
                Chu kỳ 14 planned: Path #1 Online Bayesian Kalman. Current rankings vẫn là Chu kỳ 6 era + Chu kỳ 9 correction (ExpDecay_Cold Reject).
              </p>
              <p className="text-xs text-muted-foreground/80 flex flex-wrap gap-3 pt-1">
                <a href="/research" className="underline hover:text-orange-600">Full research story →</a>
                <span>·</span>
                <span>5 Principles (#11-#15) codified trong METHODOLOGY.md</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Origin legend */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-1 rounded-full bg-primary" />
          <div>
            <h2 className="text-xl font-bold">Phân Loại Nguồn Gốc</h2>
            <p className="text-sm text-muted-foreground">
              10 thuật toán được phân loại theo 3 nguồn gốc
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Card className="border-l-4" style={{ borderLeftColor: ORIGIN_TAGS.builtin.color }}>
            <CardContent className="py-3 px-4">
              <Badge className="text-[10px] text-white mb-1.5" style={{ backgroundColor: ORIGIN_TAGS.builtin.bg }}>
                Cơ bản
              </Badge>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Phương pháp phổ biến, ai cũng nghĩ tới. Có sẵn từ đầu.
              </p>
              <p className="text-[10px] mt-1 font-mono text-muted-foreground/60">frequency, absence, mixed</p>
            </CardContent>
          </Card>
          <Card className="border-l-4" style={{ borderLeftColor: ORIGIN_TAGS.papers.color }}>
            <CardContent className="py-3 px-4">
              <Badge className="text-[10px] text-white mb-1.5" style={{ backgroundColor: ORIGIN_TAGS.papers.bg }}>
                📚 Từ papers
              </Badge>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dựa trên bài báo khoa học, GitHub repos, diễn đàn phân tích.
              </p>
              <p className="text-[10px] mt-1 font-mono text-muted-foreground/60">bayesian, maxentropy, adaptive</p>
            </CardContent>
          </Card>
          <Card className="border-l-4" style={{ borderLeftColor: ORIGIN_TAGS.research.color }}>
            <CardContent className="py-3 px-4">
              <Badge className="text-[10px] text-white mb-1.5" style={{ backgroundColor: ORIGIN_TAGS.research.bg }}>
                🔬 Tự nghiên cứu
              </Badge>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Phát triển từ phân tích thống kê sâu (13-14 bài test RNG) trên data Vietlott.
              </p>
              <p className="text-[10px] mt-1 font-mono text-muted-foreground/60">evmax, jointbias, pattern, hybridparity</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Algorithm cards */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full bg-primary" />
          <div>
            <h2 className="text-xl font-bold">Chi Tiết Thuật Toán</h2>
            <p className="text-sm text-muted-foreground">
              Cách mỗi thuật toán hoạt động và cơ sở khoa học
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {STRATEGIES.map((s, idx) => {
            const originTag = ORIGIN_TAGS[s.origin];
            return (
            <Card key={s.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${s.color}20` }}
                  >
                    {s.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{s.name}</CardTitle>
                      <Badge
                        className="text-[10px] text-white"
                        style={{ backgroundColor: originTag.bg }}
                      >
                        {originTag.label}
                      </Badge>
                      {s.scope === "3d" && (
                        <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-400">
                          Chỉ 3D
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        #{idx + 1}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {s.shortDesc}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.description}
                </p>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Phương pháp
                  </h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {s.methodology.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground/70">
                  <span className="shrink-0 mt-0.5">📚</span>
                  <span className="italic">{s.references}</span>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      </section>

      {/* Backtest results */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full bg-green-500" />
          <div>
            <h2 className="text-xl font-bold">Đánh Giá Xác Suất</h2>
            <p className="text-sm text-muted-foreground">
              Walk-forward backtest + 3-gate protocol (full + split-half + forward_last_100). 5 runs, seed=42.
            </p>
          </div>
        </div>

        {/* Methodology card */}
        <Card className="mb-6 border-dashed">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <span className="text-xl shrink-0">📐</span>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Phương pháp đánh giá (updated post-Chu kỳ 13)</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>Walk-forward backtest</strong>: huấn luyện trên `draws[:i]`, dự đoán `draws[i]`, dịch cửa sổ lên. No look-ahead.
                  </li>
                  <li>
                    <strong>3-gate protocol (Principle #13)</strong>: Accept yêu cầu pass cả 3 — full-sample + split-half (time-ordered midpoint) + forward_last_100 (held-out).
                  </li>
                  <li>
                    <strong>Baseline</strong>: Random (hypergeometric E[trùng]) + mechanism anchor (best existing family strategy).
                  </li>
                  <li>
                    <strong>Δ</strong> vs Random; <strong>p-value</strong> từ z-test 2-proportion pooled; <strong>CI</strong> Newcombe hybrid-score.
                  </li>
                  <li>
                    <strong>5 lần chạy</strong>, seed=42 reset per strategy per segment.
                  </li>
                  <li>
                    <strong>Bonferroni</strong>: α_strict = 0.05/K với K = # new strategies trong cycle.
                  </li>
                  <li>
                    <strong>Principle #14</strong>: |Δ| &gt; 3× bias ceiling (3D: 0.4pp → flag 1.2pp; matrix: 0.3pp → flag 0.9pp) auto-flag Ship-with-caveats pending audit.
                  </li>
                  <li>
                    <strong>Principle #15</strong>: ML strategies yêu cầu n_unique_predictions/total ≥ 0.30.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results tables per product */}
        <div className="space-y-8">
          {Object.entries(BACKTEST_RESULTS).map(([key, product]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">{product.label}</CardTitle>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{product.totalDraws.toLocaleString()} kỳ quay</span>
                    <span>•</span>
                    <span>E[trùng] = {product.baseline.E}</span>
                    <span>•</span>
                    <span>P(≥3 trùng) = {product.baseline.winPct}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Thuật toán</TableHead>
                        <TableHead className="text-right">TB Trùng</TableHead>
                        <TableHead className="text-right">Δ</TableHead>
                        <TableHead className="text-right">Win%</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead className="text-right" title="p-value từ z-test vs Random">p</TableHead>
                        <TableHead className="text-center">Kết luận</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.strategies.map((s, i) => (
                        <TableRow
                          key={s.name}
                          className={
                            s.decision === "Suggestive" ? "bg-yellow-500/5 font-medium"
                              : i === 0
                                ? "bg-primary/5 font-medium"
                                : s.type === "base"
                                  ? "bg-muted/30"
                                  : ""
                          }
                        >
                          <TableCell className="text-muted-foreground text-xs">
                            {i === 0 ? "🏆" : i + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{s.name}</span>
                              {s.type === "new" && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0"
                                >
                                  MỚI
                                </Badge>
                              )}
                              {s.type === "base" && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0"
                                >
                                  baseline
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {s.avg.toFixed(4)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-sm ${
                              s.delta > 0
                                ? "text-green-400"
                                : s.delta < -0.005
                                  ? "text-red-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {s.delta > 0 ? "+" : ""}
                            {s.delta.toFixed(4)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {s.winPct.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-red-400">
                            {s.roi.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {formatPValue(s.pValue)}
                          </TableCell>
                          <TableCell className="text-center">
                            <DecisionBadge d={s.decision} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footnote for pattern strategy */}
        <div className="mt-4 text-[11px] text-muted-foreground/60 leading-relaxed px-1">
          <strong>¹</strong> Mẫu cấu trúc: Số liệu backtest sử dụng thuật toán Pattern gốc (phân tích spacing, phân bổ vùng số, chẵn/lẻ).
          Phiên bản triển khai trong gợi ý sử dụng phương pháp tương tự với band frequency + spacing bonus để chạy nhanh trên client-side.
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          3D Products section
          ═══════════════════════════════════════════════════ */}

      {/* 3D Backtest results */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full bg-orange-500" />
          <div>
            <h2 className="text-xl font-bold">Max 3D / 3D Pro — Đánh Giá 15 Chiến Lược</h2>
            <p className="text-sm text-muted-foreground">
              Walk-forward backtest trên 1.775 kỳ quay, bao gồm 2 thuật toán tự nghiên cứu (💰 EV tối đa, 🧬 Bias liên hợp)
            </p>
          </div>
        </div>

        {/* 3D Methodology */}
        <Card className="mb-6 border-dashed">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <span className="text-xl shrink-0">🎰</span>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Khác biệt với xổ số ma trận</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>Pool 1.000 số</strong> (000-999) thay vì 35-55 số — không gian lớn hơn nhiều
                  </li>
                  <li>
                    <strong>20 số trúng/kỳ</strong> gồm 4 hạng giải: Đặc biệt (2), Nhất (4), Nhì (6), Ba (8)
                  </li>
                  <li>
                    <strong>Dự đoán 2 số/lần</strong> — đánh giá bằng % kỳ có ít nhất 1 số trùng khớp (exact match)
                  </li>
                  <li>
                    <strong>Baseline</strong>: Xác suất random = 2.0% (exact match), ROI kỳ vọng ≈ -65%
                  </li>
                  <li>
                    <strong>★★</strong> = chiến lược từ internet research (Markov Chain, SumRange Filter, Composite Score)
                  </li>
                  <li>
                    <strong>💰 / 🧬</strong> = thuật toán tự nghiên cứu (EVMaximizer, JointDigitBias) — phát triển từ phân tích thống kê sâu 13 bài test
                  </li>
                  <li>
                    <strong>Lưu ý</strong>: Khi chọn &quot;Phủ sóng tối đa&quot; cho 3D, hệ thống sử dụng <strong>SumRange Filter</strong> (★★) thay vì MaxEntropy band sampling
                  </li>
                  <li>
                    <strong>Có sẵn trong gợi ý</strong>: 9 chiến lược — Tần suất cao, Bayesian, Phủ sóng tối đa (SumRange), Mẫu cấu trúc, Adaptive, Số vắng lâu, Kết hợp nóng–lạnh, EV tối đa, Bias liên hợp. Hiển thị 7 tốt nhất cho mỗi sản phẩm. Các chiến lược khác (Tier Focus, Digit Hot/Cold, Markov, Composite...) chỉ là kết quả nghiên cứu.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {Object.entries(BACKTEST_RESULTS_3D).map(([key, product]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">{product.label}</CardTitle>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{product.totalDraws.toLocaleString()} kỳ quay</span>
                    <span>•</span>
                    <span>Baseline exact = {product.baseline.exactPct}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Chiến lược</TableHead>
                        <TableHead className="text-right">Exact %</TableHead>
                        <TableHead className="text-right">vs Baseline</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead className="text-right" title="p-value từ z-test vs Random">p</TableHead>
                        <TableHead className="text-center">Kết luận</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.strategies.map((s, i) => {
                        const sAny = s as typeof s & { pValue?: number; decision?: Decision };
                        return (
                        <TableRow
                          key={s.name}
                          className={
                            sAny.decision === "Suggestive" ? "bg-yellow-500/5 font-medium"
                              : i === 0
                                ? "bg-primary/5 font-medium"
                                : s.type === "base"
                                  ? "bg-muted/30"
                                  : s.type === "research"
                                    ? "bg-orange-500/5"
                                    : ""
                          }
                        >
                          <TableCell className="text-muted-foreground text-xs">
                            {i === 0 ? "🏆" : i + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{s.name}</span>
                              {s.type === "new" && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">MỚI</Badge>
                              )}
                              {s.type === "research" && (
                                <Badge className="bg-orange-500 text-white text-[9px] px-1 py-0">RESEARCH</Badge>
                              )}
                              {s.type === "base" && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0">baseline</Badge>
                              )}
                              {s.type === "best" && (
                                <Badge className="bg-green-600 text-white text-[9px] px-1 py-0">TỐT NHẤT</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {s.exactPct.toFixed(3)}%
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-sm ${
                              s.exactPct > product.baseline.exactPct
                                ? "text-green-400"
                                : s.exactPct < product.baseline.exactPct - 0.05
                                  ? "text-red-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {s.exactPct > product.baseline.exactPct ? "+" : ""}
                            {(s.exactPct - product.baseline.exactPct).toFixed(3)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-red-400">
                            {s.roi.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {formatPValue(sAny.pValue)}
                          </TableCell>
                          <TableCell className="text-center">
                            <DecisionBadge d={sAny.decision} />
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 3D Recommendations */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full bg-orange-500" />
          <div>
            <h2 className="text-xl font-bold">Research Picks — Max 3D / 3D Pro</h2>
            <p className="text-sm text-muted-foreground">
              28 chiến lược đã test qua 8 cycles (2026-03 → 2026-04). <strong className="text-orange-600">Research line CLOSED Chu kỳ 13.</strong> Dưới đây chỉ là directional picks — no confirmed edge.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {RECOMMENDATIONS_3D.map((r) => (
            <Card key={r.product} className="relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: r.color }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{r.emoji}</span>
                  <CardTitle className="text-base">{r.product}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Win rate pick (always) */}
                <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: `${r.color}40` }}>
                  <Badge className="text-white text-[10px] bg-green-600">
                    🎯 Win rate pick
                  </Badge>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl">{r.winratePick.emoji}</span>
                    <span className="font-bold text-sm">{r.winratePick.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">{r.winratePick.stat}</div>
                </div>
                {/* ROI pick (only if different) */}
                {r.roiPick ? (
                  <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: `${r.color}40` }}>
                    <Badge className="text-white text-[10px] bg-yellow-600">
                      💰 ROI pick
                    </Badge>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl">{r.roiPick.emoji}</span>
                      <span className="font-bold text-sm">{r.roiPick.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">{r.roiPick.stat}</div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 p-2 text-center">
                    <p className="text-[11px] text-muted-foreground italic">
                      Chiến lược trên thắng cả 2 axes (Win rate + ROI) → 1 pick duy nhất
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">{r.reason}</p>
                {r.special && (
                  <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-2.5">
                    <p className="text-xs text-orange-300 leading-relaxed">{r.special}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recommendations - Matrix products */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full bg-yellow-500" />
          <div>
            <h2 className="text-xl font-bold">Khuyến Nghị — Xổ Số Ma Trận</h2>
            <p className="text-sm text-muted-foreground">
              Thuật toán nào phù hợp nhất cho từng sản phẩm xổ số
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {RECOMMENDATIONS.map((r) => (
            <Card key={r.product} className="relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: r.color }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{r.emoji}</span>
                  <CardTitle className="text-base">{r.product}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Win rate pick (always) */}
                <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: `${r.color}40` }}>
                  <Badge className="text-white text-[10px] bg-green-600">
                    🎯 Win rate pick
                  </Badge>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl">{r.winratePick.emoji}</span>
                    <span className="font-bold text-sm">{r.winratePick.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">{r.winratePick.stat}</div>
                </div>

                {/* ROI pick (only if different) */}
                {r.roiPick ? (
                  <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: `${r.color}40` }}>
                    <Badge className="text-white text-[10px] bg-yellow-600">
                      💰 ROI pick
                    </Badge>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl">{r.roiPick.emoji}</span>
                      <span className="font-bold text-sm">{r.roiPick.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">{r.roiPick.stat}</div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 p-2 text-center">
                    <p className="text-[11px] text-muted-foreground italic">
                      Chiến lược trên thắng cả 2 axes (Win rate + ROI) → 1 pick duy nhất
                    </p>
                  </div>
                )}

                {/* Reason */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {r.reason}
                </p>

                {/* Special note */}
                {r.special && (
                  <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-2.5">
                    <p className="text-xs text-yellow-300 leading-relaxed">
                      {r.special}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Key insights */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full bg-purple-500" />
          <div>
            <h2 className="text-xl font-bold">Phát Hiện Quan Trọng</h2>
            <p className="text-sm text-muted-foreground">
              Những kết luận chính từ quá trình nghiên cứu
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: "🔬",
              title: "3D research line CLOSED (Chu kỳ 13)",
              desc: "28 chiến lược tested qua 5 paradigms (probabilistic, joint-digit, copula, GBM discriminative, cross-product pool) — 0 chiến lược đạt Accept/Suggestive qua 3-gate protocol. Bias thực tồn tại nhưng quá nhỏ so với noise floor của forward window.",
            },
            {
              icon: "🛡️",
              title: "Principle #13 (Forward Gate) validated 5×",
              desc: "Chu kỳ 7 EVMax, 9 ExpDecay Cold, 11 EmpiricalCopula, 12 GBM, 13 HierarchicalBayes — tất cả fail forward_last_100 validation dù pass full-sample. Signature overfitting xuất hiện consistent. 3-gate protocol (full + split-half + forward) giờ binding cho mọi Accept claim.",
            },
            {
              icon: "⚠️",
              title: "Principle #14 (Magnitude Sanity) — caught GBM false Accept",
              desc: "Chu kỳ 12 GBM Max 3D Pro technical Accept theo pre-reg rule (+3.07pp full, split-half pass, forward +0.5pp). Principle #14 flag: 3.07pp là 7× bias ceiling (0.4pp). Chu kỳ 12.5 audit confirm: 'pure overfitting, no leak'. Strategy deprecated.",
            },
            {
              icon: "🧬",
              title: "Bias thực — digit 6 đơn vị +11.6%",
              desc: "Chi² independence test phát hiện P(abc) ≠ P(a)×P(b)×P(c) với p<1e-06 (pos_1_2 Max 3D). Digit 6 hàng đơn vị xuất hiện +11.6% Max 3D Pro. Bias stable qua 3-window test Chu kỳ 8 (0/30 tuples fail Bonferroni). Real nhưng không exploitable tại current N.",
            },
            {
              icon: "🚪",
              title: "Mega 6/45 ExpDecay_Cold deprecated",
              desc: "Chu kỳ 6 Suggestive claim (p=0.0044, +1.03pp) → Chu kỳ 9 split-half REJECT. Direction flip: half-1 Δ=−0.26pp → half-2 Δ=+0.37pp. Full-sample p được drive bởi baseline drift, không edge thật. Principle #11 split-half gate proven invaluable.",
            },
            {
              icon: "📊",
              title: "0 confirmed edge, ROI luôn âm",
              desc: "Sau ~50 strategies × 5 products × 3-gate protocol: 0 Accept/Suggestive robust. ROI luôn âm (-26% đến -97%). Xổ số Vietlott là −EV system — không thuật toán nào đảm bảo trúng thưởng. Research picks shown chỉ là directional, không promise return.",
            },
          ].map((insight) => (
            <Card key={insight.title}>
              <CardContent className="py-4 flex gap-3">
                <span className="text-2xl shrink-0">{insight.icon}</span>
                <div>
                  <h4 className="font-bold text-sm mb-1">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="relative rounded-xl border border-dashed border-yellow-500/30 bg-yellow-500/5 p-5">
        <div className="flex gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div className="space-y-2">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Miễn trừ trách nhiệm
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nghiên cứu này thực hiện hoàn toàn vì mục đích học thuật và giải trí.
              Xổ số Vietlott là hệ thống negative-EV (kỳ vọng âm) —
              <strong> không có thuật toán nào có thể đảm bảo trúng thưởng</strong>.
              Sau 8 chu kỳ nghiên cứu + ~50 chiến lược tested × 5 sản phẩm × 3-gate protocol:
              0 chiến lược Accept/Suggestive robust. Research picks hiển thị chỉ là directional pick
              (positive trend trong backtest nhưng không significant), không phải confirmed edge.
              Chơi có trách nhiệm, không chi nhiều hơn khả năng chịu mất.
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Dữ liệu backtest: {(Object.values(BACKTEST_RESULTS).reduce((s, p) => s + p.totalDraws, 0) + Object.values(BACKTEST_RESULTS_3D).reduce((s, p) => s + p.totalDraws, 0)).toLocaleString()} kỳ quay (Chu kỳ 13 snapshot)
              • Methodology: Walk-forward + 3-gate protocol (full + split-half + forward_last_100), 5 runs, seed=42
              • Codified principles: METHODOLOGY.md §3.5-3.9 (#11-#15)
              • Nguồn nghiên cứu: Dirichlet-Multinomial, Covering Designs (Gordon 1995), Maximum Entropy (Jaynes 1957), Gaussian/Empirical Copula, HistGradientBoosting + hand-crafted features
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

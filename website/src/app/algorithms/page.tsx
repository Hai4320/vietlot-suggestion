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
import type { Decision } from "@/lib/backtest-data";

function formatPValue(p?: number) {
  if (p === undefined) return "—";
  if (p < 0.001) return "<0.001";
  return p.toFixed(3);
}

function DecisionBadge({ d }: { d?: Decision }) {
  if (!d || d === "baseline") return null;
  const cls: Record<Decision, string> = {
    Accept: "bg-green-600 text-white",
    Suggestive: "bg-yellow-500 text-black",
    Inconclusive: "bg-gray-400 text-white",
    Reject: "bg-muted text-muted-foreground",
    baseline: "",
  };
  return <Badge className={`text-[9px] px-1 py-0 ${cls[d]}`}>{d}</Badge>;
}

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
    name: "Hybrid Parity (5/35)",
    emoji: "🎰",
    origin: "research" as const,
    scope: "all" as const,
    shortDesc: "Multi-ticket wheeling: empirical parity allocation + max-min Hamming diversity",
    description:
      "Thuật toán đa vé đầu tiên có edge thống kê ý nghĩa trên Lotto 5/35 (p=0.011 ở N=20). " +
      "Xuất phát từ phát hiện Phase 1: phân phối số lẻ trong 5 số chính lệch khỏi hypergeometric " +
      "(Chi² p=0.0012, qua Bonferroni α=0.00357) — đặc biệt mode 3 số lẻ over +13%, mode 0 số lẻ over +84%. " +
      "Single-ticket không khai thác được (đã chứng minh toán học: E[match] chỉ phụ thuộc trung bình, không phụ thuộc shape). " +
      "Nhưng với N vé, phân bổ theo empirical parity + max-min Hamming distance tạo ra portfolio coverage " +
      "khớp với phân phối draw thật → P(any vé trúng ≥3) cải thiện +4.3pp ở N=20 (27.65% vs Random 23.33%).",
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
    name: "EV tối đa",
    emoji: "💰",
    origin: "research" as const,
    scope: "3d" as const,
    shortDesc: "Expected Value maximizer + exponential decay + diversity",
    description:
      "Tối ưu hóa giá trị kỳ vọng (Expected Value) cho từng số dựa trên giải thưởng theo hạng (ĐB, Nhất, Nhì, Ba) " +
      "và tần suất xuất hiện có trọng số giảm theo thời gian (exponential decay, half-life = 100 kỳ). " +
      "Thuật toán tính EV = Σ(weight × prize) cho mỗi số, xếp hạng theo EV, sau đó lấy mẫu từ top 80 số " +
      "với ràng buộc đa dạng (min digit distance = 4 giữa 2 số được chọn). " +
      "Xếp hạng #1 trên Max 3D Pro (2.50%, ROI -26.5% — tốt nhất toàn bộ 3D).",
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
    name: "Bias liên hợp",
    emoji: "🧬",
    origin: "research" as const,
    scope: "3d" as const,
    shortDesc: "Joint 3-digit frequency + Laplace smoothing",
    description:
      "Khai thác phát hiện thống kê rằng 3 vị trí chữ số (hàng trăm, chục, đơn vị) trong xổ số 3D " +
      "KHÔNG độc lập (Chi² test: p < 0.001). Thay vì mô hình P(abc) = P(a)×P(b)×P(c), " +
      "thuật toán tính trực tiếp tần suất đồng thời P(abc) trên 300 kỳ gần nhất, " +
      "áp dụng Laplace smoothing (α=1.0) để xử lý số chưa xuất hiện, " +
      "rồi lấy mẫu từ phân phối 1000 số theo xác suất joint. " +
      "Xếp hạng #2 Max 3D (2.27%), #2 Max 3D Pro (2.38%).",
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

// Phase 4 backtest results — refreshed 2026-04-20 Chu kỳ 6 (added z-test + decision)
const BACKTEST_RESULTS = {
  power_655: {
    label: "Power 6/55",
    baseline: { E: 0.6545, winPct: 1.333 },
    totalDraws: 1334,
    strategies: [
      { name: "★ Bayesian AI", avg: 0.6853, delta: +0.0308, winPct: 1.648, roi: -91.4, best: 4, type: "new" as const, pValue: 0.511, decision: "Reject" as Decision },
      { name: "Tần suất cao", avg: 0.6780, delta: +0.0235, winPct: 1.513, roi: -93.3, best: 4, type: "old" as const, pValue: 0.848, decision: "Reject" as Decision },
      { name: "Random", avg: 0.6764, delta: +0.0219, winPct: 1.459, roi: -94.2, best: 4, type: "base" as const, decision: "baseline" as Decision },
      { name: "★ Phủ sóng tối đa", avg: 0.6613, delta: +0.0068, winPct: 1.540, roi: -94.7, best: 4, type: "new" as const, pValue: 0.774, decision: "Reject" as Decision },
      { name: "★ Mẫu cấu trúc ¹", avg: 0.6575, delta: +0.0030, winPct: 1.594, roi: -93.0, best: 4, type: "new" as const, pValue: 0.636, decision: "Reject" as Decision },
      { name: "Số vắng lâu", avg: 0.6394, delta: -0.0151, winPct: 1.243, roi: -94.1, best: 4, type: "old" as const, pValue: 0.421, decision: "Reject" as Decision },
      { name: "★ Tự động tối ưu", avg: 0.6405, delta: -0.0140, winPct: 1.270, roi: -94.7, best: 4, type: "new" as const, pValue: 0.483, decision: "Reject" as Decision },
    ],
  },
  power_645: {
    label: "Mega 6/45",
    baseline: { E: 0.8, winPct: 2.383 },
    totalDraws: 1302,
    strategies: [
      { name: "Suy giảm hàm mũ (Cold)", avg: 0.8089, delta: +0.0089, winPct: 2.912, roi: -56.9, best: 5, type: "old" as const, pValue: 0.0044, decision: "Suggestive" as Decision },
      { name: "★ Phủ sóng tối đa", avg: 0.8103, delta: +0.0103, winPct: 2.440, roi: -57.5, best: 5, type: "new" as const, pValue: 0.105, decision: "Reject" as Decision },
      { name: "★ Kết hợp (Ensemble)", avg: 0.8073, delta: +0.0073, winPct: 2.579, roi: -63.9, best: 5, type: "new" as const, pValue: 0.046, decision: "Suggestive" as Decision },
      { name: "★ Bayesian AI", avg: 0.8070, delta: +0.0070, winPct: 2.579, roi: -88.5, best: 4, type: "new" as const, pValue: 0.046, decision: "Suggestive" as Decision },
      { name: "★ Mẫu cấu trúc ¹", avg: 0.7995, delta: -0.0005, winPct: 2.413, roi: -87.5, best: 4, type: "new" as const, pValue: 0.123, decision: "Reject" as Decision },
      { name: "★ Bayesian AI (Sharp)", avg: 0.7992, delta: -0.0008, winPct: 2.357, roi: -89.2, best: 4, type: "new" as const, pValue: 0.165, decision: "Reject" as Decision },
      { name: "Tần suất cao", avg: 0.7978, delta: -0.0022, winPct: 1.969, roi: -89.6, best: 4, type: "old" as const, pValue: 0.797, decision: "Reject" as Decision },
      { name: "Random", avg: 0.7976, delta: -0.0024, winPct: 1.886, roi: -92.1, best: 4, type: "base" as const, decision: "baseline" as Decision },
    ],
  },
  power_535: {
    label: "Lotto 5/35",
    baseline: { E: 0.7143, winPct: 1.386 },
    totalDraws: 539,
    strategies: [
      { name: "★ Tự động tối ưu", avg: 0.7525, delta: +0.0382, winPct: 1.898, roi: -87.1, best: 4, type: "new" as const, pValue: 0.157, decision: "Reject" as Decision },
      { name: "Tần suất cặp", avg: 0.7472, delta: +0.0329, winPct: 1.367, roi: -93.2, best: 3, type: "old" as const, pValue: 0.730, decision: "Reject" as Decision },
      { name: "★ Khoảng cách tối đa", avg: 0.7229, delta: +0.0086, winPct: 1.671, roi: -91.7, best: 3, type: "new" as const, pValue: 0.327, decision: "Reject" as Decision },
      { name: "★ Phủ sóng tối đa", avg: 0.7183, delta: +0.0040, winPct: 1.746, roi: -84.4, best: 4, type: "new" as const, pValue: 0.259, decision: "Reject" as Decision },
      { name: "Random", avg: 0.7175, delta: +0.0032, winPct: 1.215, roi: -90.5, best: 4, type: "base" as const, decision: "baseline" as Decision },
      { name: "★ Bayesian AI", avg: 0.7046, delta: -0.0097, winPct: 1.746, roi: -84.4, best: 4, type: "new" as const, pValue: 0.259, decision: "Reject" as Decision },
      { name: "★ Mẫu cấu trúc ¹", avg: 0.6970, delta: -0.0173, winPct: 1.367, roi: -93.2, best: 3, type: "new" as const, pValue: 0.730, decision: "Reject" as Decision },
      { name: "🔬 HybridParityDiv (N=20)", avg: 0.7075, delta: -0.0068, winPct: 25.89, roi: -91.4, best: 4, type: "new" as const, pValue: 0.301, decision: "Reject" as Decision },
    ],
  },
};

const RECOMMENDATIONS = [
  {
    product: "Power 6/55",
    emoji: "🔴",
    color: "hsl(0, 72%, 51%)",
    primary: "Bayesian AI",
    primaryEmoji: "🧠",
    secondary: "Tần suất cao",
    secondaryEmoji: "📊",
    reason:
      "Bayesian AI có Δ avg match cao nhất (+0.031) nhưng sau z-test Chu kỳ 6: p=0.511 → **Reject**. " +
      "Không strategy nào beat Random với significance. Dùng Bayesian nếu thích mô hình thông minh, nhưng hiểu rằng edge không thực tế.",
    special: "⚠️ Chu kỳ 6 (2026-04-20): toàn bộ strategies Reject khi z-test vs Random. Pool 55 số có thể quá lớn cho 1334 draws.",
  },
  {
    product: "Mega 6/45",
    emoji: "🔵",
    color: "hsl(217, 91%, 60%)",
    primary: "Suy giảm hàm mũ (Cold)",
    primaryEmoji: "⚡",
    secondary: "Bayesian AI",
    secondaryEmoji: "🧠",
    reason:
      "🔬 **ExpDecay_Cold** là strategy duy nhất có signal mạnh nhất (p=0.0044, Suggestive): " +
      "win rate 2.91% vs Random 1.89% (+1.03pp). Chưa pass Bonferroni K=14 (α=0.00357) — cần replicate trên data mới. " +
      "Bayesian AI và Kết hợp (Ensemble) cũng Suggestive (p=0.046).",
    special: "⚠️ 3 strategies Suggestive trên 6/45 — strongest signal qua toàn research. Ứng viên cho Chu kỳ 7 replicate validation.",
  },
  {
    product: "Lotto 5/35",
    emoji: "🟢",
    color: "hsl(142, 71%, 45%)",
    primary: "Tự động tối ưu",
    primaryEmoji: "🎛️",
    secondary: "Mẫu cấu trúc",
    secondaryEmoji: "🔮",
    reason:
      "Sau Chu kỳ 6 correction: HybridParityDiv claim cũ (p=0.011) là artefact của bug sample-size — thực chất p=0.301 → Reject. " +
      "Tất cả strategies single-ticket + wheeling đều Reject. Bias T11 Parity (p=0.0012) tồn tại nhưng không exploitable. " +
      "Adaptive có Δ cao nhất (+0.038) nhưng p=0.157 — chưa đủ ý nghĩa.",
    special: "⚠️ HybridParityDiv: edge cũ biến mất sau khi fix bug `dates.unique()`. Kept trong UI làm reference implementation, không còn recommended.",
  },
];

// ============================================================
// 3D Products backtest data (15 strategies, 1064+ draws)
// ============================================================

// 3D backtest results — refreshed 2026-04-20 Chu kỳ 6. Baseline = Random.
const BACKTEST_RESULTS_3D = {
  "3d": {
    label: "Max 3D",
    totalDraws: 1064,
    baseline: { exactPct: 2.0 },
    strategies: [
      { name: "Tần suất cao (FreqWholeHot)", exactPct: 2.347, roi: -32.8, type: "best" as const, pValue: 0.066, decision: "Reject" as Decision },
      { name: "🧬 Bias liên hợp (T=1.0)", exactPct: 2.268, roi: -39.0, type: "research" as const, pValue: 0.144, decision: "Reject" as Decision },
      { name: "PairExploiter (T=0.5)", exactPct: 2.248, roi: -36.7, type: "research" as const, pValue: 0.171, decision: "Reject" as Decision },
      { name: "★ Phủ sóng tối đa (CoverageOpt)", exactPct: 2.219, roi: -35.8, type: "new" as const, pValue: 0.220, decision: "Reject" as Decision },
      { name: "ULTIMATE_v1", exactPct: 2.219, roi: -44.9, type: "research" as const, pValue: 0.220, decision: "Reject" as Decision },
      { name: "StratifiedDigit", exactPct: 2.199, roi: -40.8, type: "research" as const, pValue: 0.258, decision: "Reject" as Decision },
      { name: "AdaptBias (T=0.9)", exactPct: 2.081, roi: -45.0, type: "research" as const, pValue: 0.584, decision: "Reject" as Decision },
      { name: "TierWeighted", exactPct: 2.061, roi: -44.8, type: "research" as const, pValue: 0.653, decision: "Reject" as Decision },
      { name: "BayesJoint (HL=100)", exactPct: 1.992, roi: -45.5, type: "research" as const, pValue: 0.920, decision: "Reject" as Decision },
      { name: "Random", exactPct: 1.972, roi: -52.6, type: "base" as const, decision: "baseline" as Decision },
      { name: "💰 EV tối đa (EVMaximizer)", exactPct: 1.874, roi: -56.9, type: "research" as const, pValue: 0.609, decision: "Reject" as Decision },
    ],
  },
  "3d_pro": {
    label: "Max 3D Pro",
    totalDraws: 711,
    baseline: { exactPct: 2.0 },
    strategies: [
      { name: "💰 EV tối đa (EVMaximizer)", exactPct: 2.496, roi: -26.5, type: "research" as const, pValue: 0.053, decision: "Reject" as Decision },
      { name: "ULTIMATE_v2_sharp", exactPct: 2.421, roi: -27.5, type: "research" as const, pValue: 0.098, decision: "Reject" as Decision },
      { name: "🧬 Bias liên hợp (T=1.0)", exactPct: 2.375, roi: -31.5, type: "research" as const, pValue: 0.137, decision: "Reject" as Decision },
      { name: "TierWeighted", exactPct: 2.179, roi: -43.0, type: "research" as const, pValue: 0.465, decision: "Reject" as Decision },
      { name: "BayesJoint (HL=150 Sharp)", exactPct: 2.163, roi: -45.0, type: "research" as const, pValue: 0.503, decision: "Reject" as Decision },
      { name: "BayesJoint (HL=100)", exactPct: 2.133, roi: -33.4, type: "research" as const, pValue: 0.582, decision: "Reject" as Decision },
      { name: "Portfolio", exactPct: 2.118, roi: -57.6, type: "research" as const, pValue: 0.624, decision: "Reject" as Decision },
      { name: "CondChain (T=0.8)", exactPct: 2.103, roi: -38.3, type: "research" as const, pValue: 0.668, decision: "Reject" as Decision },
      { name: "MultiSignal Ensemble", exactPct: 2.088, roi: -42.2, type: "research" as const, pValue: 0.712, decision: "Reject" as Decision },
      { name: "Random", exactPct: 1.997, roi: -45.4, type: "base" as const, decision: "baseline" as Decision },
      { name: "Tần suất cao (FreqWholeHot)", exactPct: 1.937, roi: -38.5, type: "best" as const, pValue: 0.802, decision: "Reject" as Decision },
      { name: "CoverageOpt", exactPct: 1.437, roi: -58.6, type: "research" as const, pValue: 0.013, decision: "Reject" as Decision },
    ],
  },
};

const RECOMMENDATIONS_3D = [
  {
    product: "Max 3D",
    emoji: "🟣",
    color: "hsl(271, 91%, 65%)",
    primary: "Bias liên hợp (directional pick)",
    primaryEmoji: "🧬",
    secondary: "Tần suất cao",
    secondaryEmoji: "📊",
    reason:
      "JointDigitBias Δ+0.305pp directional (within Principle #14 bias ceiling). " +
      "28 chiến lược đã test qua 8 cycles, 0 chiến lược Accept/Suggestive sau 3-gate protocol. " +
      "Đây là best directional pick, KHÔNG phải confirmed edge.",
    special: "⚠️ Research line CLOSED Chu kỳ 13 — no algorithm beats Random significantly. Xem 3D Final Report.",
  },
  {
    product: "Max 3D Pro",
    emoji: "🟠",
    color: "hsl(25, 95%, 53%)",
    primary: "Bias liên hợp (directional pick)",
    primaryEmoji: "🧬",
    secondary: "Tần suất cao",
    secondaryEmoji: "📊",
    reason:
      "JointDigitBias Δ+0.378pp directional — strongest remaining pick sau khi EV Maximizer bị Reject Chu kỳ 7 " +
      "(split-half direction flip h1 p=0.0007 → h2 p=0.865). KHÔNG phải confirmed edge.",
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
          Giải thích chi tiết 10 thuật toán gợi ý xổ số cho cả Ma trận (Power/Mega/Lotto)
          lẫn Max 3D/3D Pro, đánh giá trên 4.900+ kỳ quay thực tế.
        </p>
        <div className="flex justify-center gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">10</div>
            <div className="text-xs text-muted-foreground mt-0.5">Thuật toán</div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">5</div>
            <div className="text-xs text-muted-foreground mt-0.5">Sản phẩm</div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">4.948</div>
            <div className="text-xs text-muted-foreground mt-0.5">Kỳ quay phân tích</div>
          </div>
        </div>
      </div>

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
              Walk-forward backtest trên dữ liệu thực tế (3 lần chạy/thuật toán, seed cố định)
            </p>
          </div>
        </div>

        {/* Methodology card */}
        <Card className="mb-6 border-dashed">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <span className="text-xl shrink-0">📐</span>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Phương pháp đánh giá</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>Walk-forward backtest</strong>: Huấn luyện trên dữ liệu cũ, dự đoán kỳ tiếp theo,
                    rồi dịch cửa sổ lên — giống đúng thực tế
                  </li>
                  <li>
                    <strong>Baseline</strong>: Giá trị kỳ vọng toán học E[trùng khớp] từ phân phối siêu hình học (hypergeometric)
                  </li>
                  <li>
                    <strong>Δ</strong>: Chênh lệch so với baseline — dương là tốt hơn ngẫu nhiên
                  </li>
                  <li>
                    <strong>ROI</strong>: Return On Investment — tỷ suất lợi nhuận trên chi phí vé
                  </li>
                  <li>
                    <strong>3 lần chạy</strong> với random seed = 42 để đảm bảo tái tạo kết quả
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
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: `${r.color}40` }}>
                  <Badge className="text-white text-[10px]" style={{ backgroundColor: r.color }}>
                    #1 Khuyến nghị
                  </Badge>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl">{r.primaryEmoji}</span>
                    <span className="font-bold text-sm">{r.primary}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 p-3 space-y-1.5">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Lựa chọn phụ
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{r.secondaryEmoji}</span>
                    <span className="text-sm">{r.secondary}</span>
                  </div>
                </div>
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
              <CardContent className="space-y-4">
                {/* Primary recommendation */}
                <div className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: `${r.color}40` }}>
                  <div className="flex items-center gap-2">
                    <Badge className="text-white text-[10px]" style={{ backgroundColor: r.color }}>
                      #1 Khuyến nghị
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl">{r.primaryEmoji}</span>
                    <span className="font-bold text-sm">{r.primary}</span>
                  </div>
                </div>

                {/* Secondary */}
                <div className="rounded-lg border border-border/50 p-3 space-y-1.5">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Lựa chọn phụ
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{r.secondaryEmoji}</span>
                    <span className="text-sm">{r.secondary}</span>
                  </div>
                </div>

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
              icon: "🔮",
              title: "Mẫu cấu trúc — #1 tổng hợp matrix",
              desc: "Pattern analysis (spacing + band distribution) xếp hạng #1 trung bình qua tất cả sản phẩm matrix (Δ = +0.015). Đặc biệt mạnh trên pool nhỏ (5/35) vì cấu trúc bộ số quan trọng hơn thống kê khi dữ liệu ít.",
            },
            {
              icon: "🧠",
              title: "Bayesian vượt trội trên pool lớn",
              desc: "Thuật toán Bayesian AI đạt Δ = +0.0308 trên Power 6/55 — mức cải thiện cao nhất trong toàn bộ nghiên cứu. Hệ thống tự chọn temperature: 1.0 (rộng) cho pool ≥50 số, 0.3 (sắc nét) cho Mega 6/45.",
            },
            {
              icon: "💰",
              title: "EV tối đa — #1 Max 3D Pro",
              desc: "Thuật toán tự nghiên cứu: tối ưu Expected Value theo tier prizes + exponential decay. Đạt 2.50% exact match và ROI -26.5% — tốt nhất toàn bộ nghiên cứu 3D. Diversity constraint (digit distance ≥ 4) đảm bảo vé không quá tương tự nhau.",
            },
            {
              icon: "🧬",
              title: "Bias liên hợp — digit KHÔNG độc lập",
              desc: "Chi² independence test phát hiện P(abc) ≠ P(a)×P(b)×P(c) với p < 0.001. Digit 6 xuất hiện +10% ở hàng đơn vị. Thuật toán Joint Digit Bias khai thác bias này, đạt #2 cả Max 3D (2.27%) và Max 3D Pro (2.38%).",
            },
            {
              icon: "🎯",
              title: "Phủ sóng tối đa — \"One Punch\" strategy",
              desc: "Dù số trùng trung bình thấp hơn, Phủ sóng tối đa là thuật toán DUY NHẤT đạt trùng 5/6 số (trên Mega 6/45). ROI tốt nhất (-62% so với -90% thông thường). Phù hợp người chơi thích rủi ro cao.",
            },
            {
              icon: "📊",
              title: "Không thuật toán nào thắng xổ số",
              desc: "Tất cả thuật toán đều có ROI âm (-26% đến -97%). Xổ số Vietlott là ngẫu nhiên thật sự. Các thuật toán chỉ giúp cải thiện nhỏ so với chọn random, không phải công cụ kiếm tiền.",
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
              Xổ số Vietlott sử dụng bộ quay số ngẫu nhiên được kiểm định định kỳ —
              <strong> không có thuật toán nào có thể đảm bảo trúng thưởng</strong>.
              Sự cải thiện nhỏ so với random là do khai thác các bias thống kê cực nhỏ
              trong dữ liệu lịch sử, không phải lỗi hệ thống. Hãy chơi có trách nhiệm
              và trong khả năng tài chính của bạn.
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Dữ liệu backtest: {(Object.values(BACKTEST_RESULTS).reduce((s, p) => s + p.totalDraws, 0) + Object.values(BACKTEST_RESULTS_3D).reduce((s, p) => s + p.totalDraws, 0)).toLocaleString()} kỳ quay
              • Phương pháp: Walk-forward validation, 3 runs, seed=42
              • Nguồn nghiên cứu: Dirichlet-Multinomial, Covering Designs (Gordon et al. 1995), Maximum Entropy (Jaynes 1957), Markov Chains, SumRange Filtering
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

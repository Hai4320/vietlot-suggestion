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

// ============================================================
// Backtest data from Phase 4 evaluation (1300+ draws)
// ============================================================

const STRATEGIES = [
  {
    id: "bayesian",
    name: "Bayesian AI",
    emoji: "🧠",
    badge: "★ Mới",
    shortDesc: "Dirichlet posterior sampling",
    description:
      "Sử dụng phương pháp Bayesian với phân phối Dirichlet để mô hình hóa xác suất xuất hiện của từng số. " +
      "Thuật toán cập nhật \"niềm tin\" (prior) dựa trên tần suất thực tế, sau đó lấy mẫu từ phân phối posterior " +
      "để tạo bộ số. Tham số temperature kiểm soát mức độ tập trung: temperature cao (1.0) cho phân phối rộng " +
      "(phù hợp pool lớn như 6/55), temperature thấp (0.5) tập trung vào số có posterior cao (phù hợp pool nhỏ hơn).",
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
    badge: "★ Mới",
    shortDesc: "Spacing + range distribution analysis (ranked #1 overall)",
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
    references: "Pattern analysis (thống kê cấu trúc), Range distribution, Spacing analysis",
    color: "hsl(300, 70%, 50%)",
  },
  {
    id: "maxentropy",
    name: "Phủ sóng tối đa",
    emoji: "🎯",
    badge: "★ Mới",
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
    references: "Maximum Entropy Principle (Jaynes, 1957), SumRange digit-sum filtering (internet research)",
    color: "hsl(142, 71%, 45%)",
  },
  {
    id: "adaptive",
    name: "Tự động tối ưu",
    emoji: "⚡",
    badge: "★ Mới",
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
    badge: null,
    shortDesc: "Frequency-weighted random sampling",
    description:
      "Phương pháp cổ điển: đếm tần suất xuất hiện của mỗi số trong lịch sử, " +
      "sau đó chọn ngẫu nhiên có trọng số — số xuất hiện nhiều hơn có xác suất được chọn cao hơn. " +
      "Dựa trên giả thuyết rằng một số viên bi có thể xuất hiện thường xuyên hơn do yếu tố vật lý.",
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
    badge: null,
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
    badge: null,
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

// Phase 4 backtest results
const BACKTEST_RESULTS = {
  power_655: {
    label: "Power 6/55",
    baseline: { E: 0.6545, winPct: 1.333 },
    totalDraws: 1334,
    strategies: [
      { name: "★ Bayesian AI", avg: 0.6853, delta: +0.0308, winPct: 1.648, roi: -91.4, best: 4, type: "new" as const },
      { name: "Tần suất cao", avg: 0.6780, delta: +0.0235, winPct: 1.513, roi: -93.3, best: 4, type: "old" as const },
      { name: "Random", avg: 0.6764, delta: +0.0219, winPct: 1.459, roi: -94.2, best: 4, type: "base" as const },
      { name: "★ Phủ sóng tối đa", avg: 0.6613, delta: +0.0068, winPct: 1.540, roi: -94.7, best: 4, type: "new" as const },
      { name: "★ Mẫu cấu trúc ¹", avg: 0.6575, delta: +0.0030, winPct: 1.594, roi: -93.0, best: 4, type: "new" as const },
      { name: "Số vắng lâu", avg: 0.6394, delta: -0.0151, winPct: 1.243, roi: -94.1, best: 4, type: "old" as const },
      { name: "★ Tự động tối ưu", avg: 0.6405, delta: -0.0140, winPct: 1.270, roi: -94.7, best: 4, type: "new" as const },
    ],
  },
  power_645: {
    label: "Mega 6/45",
    baseline: { E: 0.8, winPct: 2.383 },
    totalDraws: 1301,
    strategies: [
      { name: "★ Bayesian AI (Sharp)", avg: 0.8229, delta: +0.0229, winPct: 3.136, roi: -86.1, best: 4, type: "new" as const },
      { name: "★ Mẫu cấu trúc ¹", avg: 0.8165, delta: +0.0165, winPct: 2.248, roi: -88.8, best: 4, type: "new" as const },
      { name: "Random", avg: 0.8066, delta: +0.0066, winPct: 1.915, roi: -92.0, best: 4, type: "base" as const },
      { name: "Tần suất cao", avg: 0.8060, delta: +0.0060, winPct: 2.776, roi: -89.4, best: 4, type: "old" as const },
      { name: "★ Phủ sóng tối đa", avg: 0.7893, delta: -0.0107, winPct: 2.193, roi: -62.0, best: 5, type: "new" as const },
      { name: "Số vắng lâu", avg: 0.7954, delta: -0.0046, winPct: 2.776, roi: -86.4, best: 4, type: "old" as const },
      { name: "★ Tự động tối ưu", avg: 0.7918, delta: -0.0082, winPct: 1.943, roi: -92.7, best: 4, type: "new" as const },
    ],
  },
  power_535: {
    label: "Lotto 5/35",
    baseline: { E: 0.7143, winPct: 1.386 },
    totalDraws: 538,
    strategies: [
      { name: "★ Mẫu cấu trúc ¹", avg: 0.7396, delta: +0.0253, winPct: 1.775, roi: -82.2, best: 4, type: "new" as const },
      { name: "★ Tự động tối ưu", avg: 0.7396, delta: +0.0253, winPct: 1.381, roi: -84.2, best: 4, type: "new" as const },
      { name: "Tần suất cao", avg: 0.7258, delta: +0.0115, winPct: 1.578, roi: -74.4, best: 4, type: "old" as const },
      { name: "Random", avg: 0.7101, delta: -0.0042, winPct: 2.564, roi: -78.3, best: 4, type: "base" as const },
      { name: "★ Bayesian AI", avg: 0.6864, delta: -0.0279, winPct: 0.789, roi: -87.2, best: 4, type: "new" as const },
      { name: "★ Phủ sóng tối đa", avg: 0.6884, delta: -0.0259, winPct: 1.381, roi: -93.1, best: 3, type: "new" as const },
      { name: "Số vắng lâu", avg: 0.7061, delta: -0.0082, winPct: 0.789, roi: -96.1, best: 3, type: "old" as const },
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
      "Pool 55 số lớn nhất — Bayesian AI (temp=1.0) vượt trội Δ+0.031. " +
      "Mẫu cấu trúc xếp #5 với Δ+0.003 và win rate tốt (1.59%). Tần suất cao đơn giản nhưng hiệu quả #2.",
    special: null,
  },
  {
    product: "Mega 6/45",
    emoji: "🔵",
    color: "hsl(217, 91%, 60%)",
    primary: "Bayesian AI (Sharp)",
    primaryEmoji: "🧠",
    secondary: "Mẫu cấu trúc",
    secondaryEmoji: "🔮",
    reason:
      "Bayesian AI (Sharp, temp=0.5) win rate 3.14% — cao nhất qua mọi chiến lược. " +
      "Mẫu cấu trúc #2 ổn định. Phủ sóng tối đa đạt 5/6 trùng duy nhất và ROI -62%!",
    special: "⚡ Phủ sóng tối đa: đạt 5/6 trùng khớp DUY NHẤT trong toàn bộ nghiên cứu. ROI -62% (tốt nhất).",
  },
  {
    product: "Lotto 5/35",
    emoji: "🟢",
    color: "hsl(142, 71%, 45%)",
    primary: "Mẫu cấu trúc",
    primaryEmoji: "🔮",
    secondary: "Tự động tối ưu",
    secondaryEmoji: "⚡",
    reason:
      "Pool nhỏ 35 số — Mẫu cấu trúc và Tự động tối ưu cùng hòa ở Δ+0.025 (#1). " +
      "Tần suất cao có ROI tốt nhất (-74.4%). Dữ liệu 538 kỳ — cấu trúc quan trọng hơn thống kê.",
    special: null,
  },
];

// ============================================================
// 3D Products backtest data (15 strategies, 1064+ draws)
// ============================================================

const BACKTEST_RESULTS_3D = {
  "3d": {
    label: "Max 3D",
    totalDraws: 1064,
    baseline: { exactPct: 2.0 },
    strategies: [
      { name: "Tần suất cao (Whole Hot)", exactPct: 2.334, roi: -35.5, type: "best" as const },
      { name: "Tier Focus ĐB", exactPct: 2.186, roi: -42.2, type: "old" as const },
      { name: "Digit Hot", exactPct: 2.137, roi: -39.5, type: "old" as const },
      { name: "★ Bayesian AI (Digit)", exactPct: 2.087, roi: -39.6, type: "new" as const },
      { name: "★★ Phủ sóng tối đa (SumRange)", exactPct: 2.055, roi: -40.0, type: "research" as const },
      { name: "★ Bayesian AI (Sharp)", exactPct: 2.055, roi: -42.0, type: "new" as const },
      { name: "Digit Cold", exactPct: 2.038, roi: -44.4, type: "old" as const },
      { name: "Mẫu cấu trúc 3D", exactPct: 2.005, roi: -46.2, type: "old" as const },
      { name: "★★ Markov Digit", exactPct: 1.972, roi: -46.5, type: "research" as const },
      { name: "★ Phủ sóng tối đa", exactPct: 1.972, roi: -46.9, type: "new" as const },
      { name: "★ Tự động tối ưu", exactPct: 1.940, roi: -46.2, type: "new" as const },
      { name: "Random", exactPct: 1.874, roi: -55.7, type: "base" as const },
      { name: "★ Bayesian AI (Whole)", exactPct: 1.841, roi: -46.0, type: "new" as const },
      { name: "★★ Composite Score", exactPct: 1.808, roi: -59.0, type: "research" as const },
      { name: "Freq Whole Cold", exactPct: 1.644, roi: -54.7, type: "old" as const },
    ],
  },
  "3d_pro": {
    label: "Max 3D Pro",
    totalDraws: 711,
    baseline: { exactPct: 2.0 },
    strategies: [
      { name: "Tần suất cao (Whole Hot)", exactPct: 2.345, roi: -47.2, type: "best" as const },
      { name: "★★ Phủ sóng tối đa (SumRange)", exactPct: 2.295, roi: -35.1, type: "research" as const },
      { name: "★ Phủ sóng tối đa", exactPct: 2.269, roi: -43.8, type: "new" as const },
      { name: "Random", exactPct: 2.219, roi: -38.0, type: "base" as const },
      { name: "Tier Focus ĐB", exactPct: 2.068, roi: -51.1, type: "old" as const },
      { name: "★ Bayesian AI (Digit)", exactPct: 2.068, roi: -43.6, type: "new" as const },
      { name: "★ Tự động tối ưu", exactPct: 2.068, roi: -47.7, type: "new" as const },
      { name: "★ Bayesian AI (Sharp)", exactPct: 2.017, roi: -36.3, type: "new" as const },
      { name: "Mẫu cấu trúc 3D", exactPct: 1.992, roi: -41.2, type: "old" as const },
      { name: "Freq Whole Cold", exactPct: 1.942, roi: -52.7, type: "old" as const },
      { name: "★ Bayesian AI (Whole)", exactPct: 1.866, roi: -43.9, type: "new" as const },
      { name: "Digit Hot", exactPct: 1.815, roi: -50.0, type: "old" as const },
      { name: "Digit Cold", exactPct: 1.815, roi: -44.8, type: "old" as const },
      { name: "★★ Markov Digit", exactPct: 1.790, roi: -51.1, type: "research" as const },
      { name: "★★ Composite Score", exactPct: 1.790, roi: -39.3, type: "research" as const },
    ],
  },
};

const RECOMMENDATIONS_3D = [
  {
    product: "Max 3D",
    emoji: "🟠",
    color: "hsl(24, 95%, 53%)",
    primary: "Tần suất cao",
    primaryEmoji: "📊",
    secondary: "Phủ sóng tối đa",
    secondaryEmoji: "🎯",
    reason:
      "Tần suất cao có tỷ lệ trúng cao nhất (2.334%) và ROI tốt nhất (-35.5%). " +
      "Với pool 1.000 số (000-999), tần suất đơn giản khai thác bias hiệu quả nhất. " +
      "Phủ sóng tối đa (#5, SumRange) là chiến lược dựa trên research mạnh nhất.",
    special: "🔬 Phủ sóng tối đa (SumRange) sử dụng tổng chữ số (digit-sum) — phương pháp mới từ internet research",
  },
  {
    product: "Max 3D Pro",
    emoji: "🟡",
    color: "hsl(48, 96%, 53%)",
    primary: "Tần suất cao",
    primaryEmoji: "📊",
    secondary: "Phủ sóng tối đa",
    secondaryEmoji: "🎯",
    reason:
      "Tần suất cao vẫn dẫn đầu (2.345%), nhưng Phủ sóng tối đa (SumRange) đạt ROI tốt nhất toàn nghiên cứu (-35.1%). " +
      "Max 3D Pro có ít dữ liệu hơn (711 kỳ) nên chiến lược lọc theo tổng chữ số càng hiệu quả.",
    special: "💎 Phủ sóng tối đa (SumRange): ROI -35.1% — tốt nhất trong toàn bộ 15 chiến lược Max 3D Pro!",
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
          Giải thích chi tiết 7 thuật toán phân tích dữ liệu cho xổ số dạng ma trận (Power/Mega/Lotto)
          và 15 chiến lược cho Max 3D/3D Pro, đánh giá trên 4.900+ kỳ quay thực tế.
        </p>
        <div className="flex justify-center gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">7+15</div>
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
          {STRATEGIES.map((s, idx) => (
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
                      {s.badge && (
                        <Badge
                          className="text-[10px] text-white"
                          style={{ backgroundColor: s.color }}
                        >
                          {s.badge}
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
          ))}
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
                        <TableHead className="text-right">Tỷ lệ thắng</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead className="text-right">Best</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.strategies.map((s, i) => (
                        <TableRow
                          key={s.name}
                          className={
                            i === 0
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
                            {s.winPct.toFixed(3)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-red-400">
                            {s.roi.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {s.best === 5 ? (
                              <Badge className="bg-yellow-500 text-black text-[10px]">
                                {s.best} ⭐
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {s.best}
                              </span>
                            )}
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
              Walk-forward backtest trên 1.775 kỳ quay, bao gồm 3 chiến lược mới từ internet research (★★)
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
                    <strong>★★</strong> = chiến lược mới từ internet research (Markov Chain, SumRange Filter, Composite Score)
                  </li>
                  <li>
                    <strong>Lưu ý</strong>: Khi chọn &quot;Phủ sóng tối đa&quot; cho 3D, hệ thống sử dụng <strong>SumRange Filter</strong> (★★) thay vì MaxEntropy band sampling
                  </li>
                  <li>
                    <strong>Có sẵn trong gợi ý</strong>: 7 chiến lược — Tần suất cao, Bayesian, SumRange Filter (= Phủ sóng tối đa), Mẫu cấu trúc, Adaptive, Số vắng lâu, Kết hợp nóng–lạnh. Hiển thị 6 tốt nhất cho mỗi sản phẩm. Các chiến lược khác (Tier Focus, Digit Hot/Cold, Markov, Composite...) chỉ là kết quả nghiên cứu.
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.strategies.map((s, i) => (
                        <TableRow
                          key={s.name}
                          className={
                            i === 0
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
                        </TableRow>
                      ))}
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
            <h2 className="text-xl font-bold">Khuyến Nghị — Max 3D / 3D Pro</h2>
            <p className="text-sm text-muted-foreground">
              Dựa trên 15 chiến lược backtest + 3 chiến lược internet research
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
              title: "Mẫu cấu trúc — #1 tổng hợp",
              desc: "Pattern analysis (spacing + band distribution) xếp hạng #1 trung bình qua tất cả sản phẩm matrix (Δ = +0.015). Đặc biệt mạnh trên pool nhỏ (5/35) vì cấu trúc bộ số quan trọng hơn thống kê khi dữ liệu ít.",
            },
            {
              icon: "🧠",
              title: "Bayesian vượt trội trên pool lớn",
              desc: "Thuật toán Bayesian AI đạt Δ = +0.0308 trên Power 6/55 — mức cải thiện cao nhất trong toàn bộ nghiên cứu. Hệ thống tự chọn temperature: 1.0 (rộng) cho pool ≥50 số, 0.5 (sắc nét) cho pool nhỏ hơn.",
            },
            {
              icon: "🎯",
              title: "Phủ sóng tối đa — \"One Punch\" strategy",
              desc: "Dù số trùng trung bình thấp hơn, Phủ sóng tối đa là thuật toán DUY NHẤT đạt trùng 5/6 số (trên Mega 6/45). ROI tốt nhất (-62% so với -90% thông thường). Phù hợp người chơi thích rủi ro cao.",
            },
            {
              icon: "🎰",
              title: "3D: Tần suất đơn giản thắng cả AI",
              desc: "Với pool 1.000 số (000-999), tần suất đếm đơn giản (Freq Whole Hot) đạt 2.33-2.35% — vượt tất cả thuật toán phức tạp bao gồm Bayesian, Markov Chain, và Composite Score. Đôi khi đơn giản là tốt nhất.",
            },
            {
              icon: "🔬",
              title: "Phủ sóng tối đa (SumRange) — phát hiện từ research",
              desc: "Lọc theo tổng chữ số (digit-sum range mean±1σ) là biến thể 3D của Phủ sóng tối đa, mạnh nhất cho 3D. ROI -35.1% trên Max 3D Pro — tốt nhất trong 15 chiến lược. Nhiều lottery analysis trên Github sử dụng phương pháp tương tự.",
            },
            {
              icon: "📊",
              title: "Không thuật toán nào thắng xổ số",
              desc: "Tất cả thuật toán đều có ROI âm (-35% đến -97%). Xổ số Vietlott là ngẫu nhiên thật sự. Các thuật toán chỉ giúp cải thiện nhỏ so với chọn random, không phải công cụ kiếm tiền.",
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

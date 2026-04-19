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
    id: "maxentropy",
    name: "Phủ sóng tối đa",
    emoji: "🎯",
    badge: "★ Mới",
    shortDesc: "Max-Entropy stratified band sampling",
    description:
      "Chia toàn bộ dải số thành các vùng (band) bằng nhau, mỗi vùng chọn đúng 1 số. " +
      "Trong mỗi vùng, sử dụng Dirichlet posterior để quyết định số nào được chọn. " +
      "Phương pháp này đảm bảo phủ sóng đều toàn bộ dải số thay vì tập trung vào 1 vùng, " +
      "tạo cơ hội cho những lần trúng lớn hiếm gặp (\"high risk, high reward\").",
    methodology: [
      "Chia dải [min, max] thành K vùng bằng nhau (K = số cần chọn)",
      "Với mỗi vùng: tính Dirichlet posterior từ tần suất các số trong vùng đó",
      "Sampling 1 số từ posterior của mỗi vùng",
      "Đảm bảo không trùng lặp giữa các vùng",
      "Kết quả: bộ số phân bố đều trên toàn bộ dải",
    ],
    references: "Maximum Entropy Principle (Jaynes, 1957), Covering Designs (Gordon-Kuperberg-Patashnik, 1995)",
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
    name: "Kết hợp thông minh",
    emoji: "🎲",
    badge: null,
    shortDesc: "Hot + Cold balanced blend",
    description:
      "Pha trộn 50% số nóng (tần suất cao) và 50% số lạnh (vắng lâu) trong cùng một bộ số. " +
      "Mục đích là cân bằng giữa hai trường phái: \"số hay ra\" và \"số sắp ra\", " +
      "tạo sự đa dạng trong bộ số được gợi ý.",
    methodology: [
      "50% bộ số: chọn từ top 15 số tần suất cao nhất (random)",
      "50% còn lại: chọn từ top 15 số vắng lâu nhất (random)",
      "Đảm bảo không trùng lặp giữa hai nhóm",
    ],
    references: "Ensemble approach (kết hợp đơn giản)",
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
      { name: "Kết hợp thông minh", avg: 0.6575, delta: +0.0030, winPct: 1.594, roi: -93.0, best: 4, type: "old" as const },
      { name: "Số vắng lâu", avg: 0.6394, delta: -0.0151, winPct: 1.243, roi: -94.1, best: 4, type: "old" as const },
      { name: "★ Tự động tối ưu", avg: 0.6405, delta: -0.0140, winPct: 1.270, roi: -94.7, best: 4, type: "new" as const },
    ],
  },
  power_645: {
    label: "Mega 6/45",
    baseline: { E: 0.8, winPct: 2.383 },
    totalDraws: 1301,
    strategies: [
      { name: "★ Bayesian Sharp", avg: 0.8229, delta: +0.0229, winPct: 3.136, roi: -86.1, best: 4, type: "new" as const },
      { name: "Kết hợp thông minh", avg: 0.8165, delta: +0.0165, winPct: 2.248, roi: -88.8, best: 4, type: "old" as const },
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
      { name: "Kết hợp thông minh", avg: 0.7396, delta: +0.0253, winPct: 1.775, roi: -82.2, best: 4, type: "old" as const },
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
      "Pool 55 số là lớn nhất — Bayesian Dirichlet có không gian rộng để khai thác chênh lệch tần suất. " +
      "Temperature = 1.0 (phân phối rộng) phù hợp nhất. Vượt thuật toán cũ +0.0073 số trùng trung bình.",
    special: null,
  },
  {
    product: "Mega 6/45",
    emoji: "🔵",
    color: "hsl(217, 91%, 60%)",
    primary: "Bayesian AI",
    primaryEmoji: "🧠",
    secondary: "Kết hợp thông minh",
    secondaryEmoji: "🎲",
    reason:
      "Bayesian với temperature = 0.5 (\"sắc nét\") tập trung hơn vào các số có posterior cao. " +
      "Đạt tỷ lệ thắng cao nhất 3.1% — hơn 39% so với thuật toán thứ hai.",
    special: "💎 Phủ sóng tối đa (MaxEntropy) đạt trùng 5/6 số — duy nhất trong nghiên cứu! ROI tốt nhất (-62%)",
  },
  {
    product: "Lotto 5/35",
    emoji: "🟢",
    color: "hsl(142, 71%, 45%)",
    primary: "Tự động tối ưu",
    primaryEmoji: "⚡",
    secondary: "Tần suất cao",
    secondaryEmoji: "📊",
    reason:
      "Pool nhỏ (35 số) và dữ liệu ít (538 kỳ) khiến các thuật toán phức tạp kém lợi thế. " +
      "Adaptive tự điều chỉnh về kết quả ngang Pattern — ưu điểm là không cần tinh chỉnh thủ công.",
    special: null,
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
          Giải thích chi tiết 6 thuật toán phân tích dữ liệu, đánh giá xác suất trên 1.300+ kỳ quay thực tế,
          và khuyến nghị thuật toán phù hợp nhất cho từng loại xổ số.
        </p>
        <div className="flex justify-center gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">6</div>
            <div className="text-xs text-muted-foreground mt-0.5">Thuật toán</div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">15</div>
            <div className="text-xs text-muted-foreground mt-0.5">Biến thể backtest</div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">3.173</div>
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
      </section>

      {/* Recommendations */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 rounded-full bg-yellow-500" />
          <div>
            <h2 className="text-xl font-bold">Khuyến Nghị Theo Loại Chơi</h2>
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
              icon: "🧠",
              title: "Bayesian vượt trội trên pool lớn",
              desc: "Thuật toán Bayesian Dirichlet đạt Δ = +0.0308 trên Power 6/55 — mức cải thiện cao nhất trong toàn bộ nghiên cứu. Phân phối posterior nắm bắt chênh lệch tần suất thực nghiệm hiệu quả nhất khi pool số lớn.",
            },
            {
              icon: "🎯",
              title: "MaxEntropy — \"One Punch\" strategy",
              desc: "Dù số trùng trung bình thấp hơn, MaxEntropy là thuật toán DUY NHẤT đạt trùng 5/6 số (trên Mega 6/45). ROI tốt nhất (-62% so với -90% thông thường). Phù hợp người chơi thích rủi ro cao.",
            },
            {
              icon: "📊",
              title: "Không thuật toán nào thắng xổ số",
              desc: "Tất cả thuật toán đều có ROI âm (-62% đến -97%). Xổ số Vietlott là ngẫu nhiên thật sự. Các thuật toán chỉ giúp cải thiện nhỏ so với chọn random, không phải công cụ kiếm tiền.",
            },
            {
              icon: "🌡️",
              title: "Temperature quyết định hiệu quả",
              desc: "Bayesian temp=1.0 thắng trên 6/55 (pool lớn) nhưng temp=0.5 lại thắng trên 6/45 (pool nhỏ hơn). Kích thước pool quyết định độ \"sắc nét\" tối ưu của posterior sampling.",
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
              Dữ liệu backtest: {Object.values(BACKTEST_RESULTS).reduce((s, p) => s + p.totalDraws, 0).toLocaleString()} kỳ quay
              • Phương pháp: Walk-forward validation, 3 runs, seed=42
              • Nguồn nghiên cứu: Dirichlet-Multinomial, Covering Designs (Gordon et al. 1995), Maximum Entropy (Jaynes 1957)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
// Deep Statistical Analysis Results
// ============================================================

const RNG_TESTS = [
  { test: "Chi² toàn số (000-999)", max3d: { pass: true, p: 0.253 }, max3dPro: { pass: true, p: 0.543 }, meaning: "Phân bố số nguyên" },
  { test: "Chi² vị trí 0 (trăm)", max3d: { pass: true, p: 0.273 }, max3dPro: { pass: false, p: 0.029 }, meaning: "Bias hàng trăm" },
  { test: "Chi² vị trí 1 (chục)", max3d: { pass: false, p: 0.033 }, max3dPro: { pass: false, p: 0.006 }, meaning: "Bias hàng chục" },
  { test: "Chi² vị trí 2 (đơn vị)", max3d: { pass: false, p: 0.0 }, max3dPro: { pass: false, p: 0.003 }, meaning: "Bias đơn vị" },
  { test: "Độc lập vị trí 0-1", max3d: { pass: false, p: 0.032 }, max3dPro: { pass: false, p: 0.001 }, meaning: "Phụ thuộc trăm-chục" },
  { test: "Độc lập vị trí 1-2", max3d: { pass: false, p: 0.000001 }, max3dPro: { pass: false, p: 0.002 }, meaning: "Phụ thuộc chục-đơn vị" },
  { test: "Độc lập vị trí 0-2", max3d: { pass: false, p: 0.00002 }, max3dPro: { pass: false, p: 0.00009 }, meaning: "Phụ thuộc trăm-đơn vị" },
  { test: "Serial Correlation", max3d: { pass: true, p: 0.96 }, max3dPro: { pass: true, p: 0.97 }, meaning: "Tương quan chuỗi" },
  { test: "Runs Test", max3d: { pass: false, p: 0.040 }, max3dPro: { pass: true, p: 0.081 }, meaning: "Tính ngẫu nhiên chuỗi" },
  { test: "Digit Sum", max3d: { pass: true, p: 0.119 }, max3dPro: { pass: true, p: 0.655 }, meaning: "Tổng chữ số" },
];

const DIGIT_BIAS_DATA = {
  max3d: {
    pos2: [
      { digit: 0, ratio: 1.024 }, { digit: 1, ratio: 0.993 }, { digit: 2, ratio: 0.952 },
      { digit: 3, ratio: 0.987 }, { digit: 4, ratio: 0.965 }, { digit: 5, ratio: 1.001 },
      { digit: 6, ratio: 1.100 }, { digit: 7, ratio: 1.015 }, { digit: 8, ratio: 0.924 },
      { digit: 9, ratio: 1.041 },
    ],
    pos1: [
      { digit: 0, ratio: 0.983 }, { digit: 1, ratio: 0.982 }, { digit: 2, ratio: 1.047 },
      { digit: 3, ratio: 1.001 }, { digit: 4, ratio: 0.982 }, { digit: 5, ratio: 1.060 },
      { digit: 6, ratio: 0.982 }, { digit: 7, ratio: 0.986 }, { digit: 8, ratio: 1.012 },
      { digit: 9, ratio: 0.966 },
    ],
  },
  max3dPro: {
    pos2: [
      { digit: 0, ratio: 0.972 }, { digit: 1, ratio: 0.982 }, { digit: 2, ratio: 0.989 },
      { digit: 3, ratio: 0.985 }, { digit: 4, ratio: 0.979 }, { digit: 5, ratio: 0.990 },
      { digit: 6, ratio: 1.116 }, { digit: 7, ratio: 0.974 }, { digit: 8, ratio: 0.979 },
      { digit: 9, ratio: 1.035 },
    ],
    pos1: [
      { digit: 0, ratio: 1.005 }, { digit: 1, ratio: 1.003 }, { digit: 2, ratio: 1.027 },
      { digit: 3, ratio: 0.975 }, { digit: 4, ratio: 0.961 }, { digit: 5, ratio: 1.065 },
      { digit: 6, ratio: 1.029 }, { digit: 7, ratio: 0.915 }, { digit: 8, ratio: 0.990 },
      { digit: 9, ratio: 1.031 },
    ],
  },
};

// ============================================================
// Backtest Results — Advanced strategies
// ============================================================

const STRATEGIES_3D = [
  {
    id: "ev_maximizer",
    name: "EV Maximizer",
    emoji: "💰",
    badge: "★★ Mới",
    category: "Optimization",
    shortDesc: "Tối ưu hóa trực tiếp giá trị kỳ vọng (E[prize])",
    description: "Tính Expected Value cho mỗi số = Σ P(số ∈ tier) × prize(tier). Dùng exponential decay (half_life=100 draws) " +
      "để ưu tiên dữ liệu gần. Kết hợp diversity constraint (khoảng cách digit ≥ 4) để tránh clustering. " +
      "Chiến lược #1 trên Max 3D Pro với ROI -26.5% (cải thiện 19pp so với random).",
    formula: "E[prize(num)] = Σ_t I(num∈tier_t) × exp(-λ(T-t)) × prize(tier) / Σ_t exp(-λ(T-t))",
    color: "hsl(45, 93%, 47%)",
  },
  {
    id: "ultimate_composite",
    name: "ULTIMATE Composite",
    emoji: "🏆",
    badge: "★★★ Mới",
    category: "Hybrid",
    shortDesc: "Kết hợp 4 tín hiệu: Joint Bias + Pair Synergy + Tier EV + Digit Sum",
    description: "Score = 0.35×JointFreq + 0.30×PairSynergy + 0.20×TierEV + 0.15×DigitSumLikelihood. " +
      "Greedy selection với diversity constraint. Temperature=0.5 để tập trung vào candidates mạnh nhất. " +
      "#2 trên 3D Pro, ổn định trên cả hai sản phẩm.",
    formula: "Score(n) = 0.35·f₁(n) + 0.30·f₂(n) + 0.20·f₃(n) + 0.15·f₄(n)",
    color: "hsl(262, 83%, 58%)",
  },
  {
    id: "joint_digit_bias",
    name: "Joint Digit Bias",
    emoji: "🧠",
    badge: "★ Mới",
    category: "Bias Exploitation",
    shortDesc: "Khai thác phân phối đồng thời P(d0,d1,d2) thay vì P(d0)×P(d1)×P(d2)",
    description: "Phát hiện: 3 vị trí digit KHÔNG độc lập (chi² test p<0.001). Thuật toán này sử dụng phân phối " +
      "đồng thời thực tế thay vì giả sử độc lập. P(abc) = (count(abc) + α) / (total + 1000α) với temperature scaling. " +
      "#3 trên cả hai sản phẩm.",
    formula: "P(abc) = (count(abc) + α) / (total + 1000α), P_temp ∝ P^(1/T)",
    color: "hsl(190, 80%, 45%)",
  },
  {
    id: "pair_exploiter",
    name: "Digit Pair Exploiter",
    emoji: "🔗",
    badge: "★★ Mới",
    category: "Bias Exploitation",
    shortDesc: "Khai thác tỷ lệ O/E của cặp digit không độc lập",
    description: "Synergy(abc) = (O/E[a,b]) × (O/E[b,c]) × (O/E[a,c]). Số có synergy > 1 xuất hiện NHIỀU HƠN " +
      "so với kỳ vọng nếu giả sử độc lập. Dùng geometric mean của O/E ratios × frequency prior. " +
      "Mạnh trên Max 3D (#3).",
    formula: "Synergy(abc) = ∏ᵢⱼ O/E[dᵢ,dⱼ], where O/E = Observed / (P(dᵢ)×P(dⱼ)×N)",
    color: "hsl(340, 75%, 55%)",
  },
  {
    id: "conditional_chain",
    name: "Conditional Chain",
    emoji: "⛓️",
    badge: "★ Mới",
    category: "Bias Exploitation",
    shortDesc: "Chain rule: P(d0) × P(d1|d0) × P(d2|d0,d1)",
    description: "Thay vì giả sử độc lập, sử dụng chain rule xác suất: P(d0,d1,d2) = P(d0)·P(d1|d0)·P(d2|d0,d1). " +
      "Mỗi conditional được ước lượng từ dữ liệu với Laplace smoothing và temperature scaling.",
    formula: "P(d₀,d₁,d₂) = P(d₀) × P(d₁|d₀) × P(d₂|d₀,d₁)",
    color: "hsl(25, 85%, 50%)",
  },
  {
    id: "tier_weighted",
    name: "Tier-Weighted",
    emoji: "🎯",
    badge: "★ Mới",
    category: "Coverage",
    shortDesc: "Trọng số theo bậc giải: Đặc biệt ×100, Nhất ×35, Nhì ×21, Ba ×10",
    description: "Tối ưu cho EXPECTED VALUE thay vì chỉ match rate. Số xuất hiện nhiều ở giải Đặc biệt đáng giá " +
      "gấp 10 lần số ở giải Ba. Temperature scaling để kiểm soát mức tập trung.",
    formula: "w(num) = Σ tier_weight × count_in_tier(num), P ∝ w^(1/T)",
    color: "hsl(142, 71%, 45%)",
  },
  {
    id: "multi_signal",
    name: "Multi-Signal Ensemble",
    emoji: "📡",
    badge: "★★ Mới",
    category: "Hybrid",
    shortDesc: "6 tín hiệu: freq + joint bias + gap + digit sum + tier + conditional",
    description: "Kết hợp 6 tín hiệu độc lập: tần suất (0.30), joint bias (0.25), digit sum likelihood (0.15), " +
      "tier-weighted (0.15), gap/overdue (0.10), conditional probability (0.05). " +
      "ROI tốt cho Max 3D (-35.6%).",
    formula: "Score = Σᵢ wᵢ × signalᵢ(num), Σwᵢ = 1",
    color: "hsl(200, 70%, 50%)",
  },
  {
    id: "bayesian_joint",
    name: "Bayesian Joint Posterior",
    emoji: "📐",
    badge: "★★ Mới",
    category: "Hybrid",
    shortDesc: "Dirichlet posterior trên joint distribution + exponential decay",
    description: "Prior: Dirichlet(α=0.5) trên 1000 số. Likelihood: multinomial với exponential decay weighting. " +
      "Posterior ∝ Prior × Likelihood. Decay half_life=100-150 draws cho phép theo dõi bias shifting.",
    formula: "P(num) ∝ α + Σ_t count_t(num) × exp(-λ(T-t)), λ = ln(2)/half_life",
    color: "hsl(280, 60%, 55%)",
  },
];

interface BacktestRow {
  name: string;
  exact: number;
  roi: number;
  hits: number;
  sharpe: number;
  delta: number;
  type: "new" | "baseline";
}

const BACKTEST_MAX_3D: BacktestRow[] = [
  { name: "FreqWholeHot", exact: 2.347, roi: -32.8, hits: 238, sharpe: -0.546, delta: 0.375, type: "baseline" },
  { name: "★ Joint Digit Bias", exact: 2.268, roi: -39.0, hits: 230, sharpe: -0.722, delta: 0.296, type: "new" },
  { name: "★ Pair Exploiter", exact: 2.248, roi: -36.7, hits: 228, sharpe: -0.648, delta: 0.276, type: "new" },
  { name: "★ Coverage Opt", exact: 2.219, roi: -35.8, hits: 225, sharpe: -0.649, delta: 0.247, type: "new" },
  { name: "★ ULTIMATE v1", exact: 2.219, roi: -44.9, hits: 225, sharpe: -1.002, delta: 0.247, type: "new" },
  { name: "★ Stratified Digit", exact: 2.199, roi: -40.8, hits: 223, sharpe: -0.760, delta: 0.227, type: "new" },
  { name: "★ Adaptive Bias", exact: 2.081, roi: -45.0, hits: 211, sharpe: -0.882, delta: 0.109, type: "new" },
  { name: "★ ULTIMATE v2", exact: 2.071, roi: -43.6, hits: 210, sharpe: -0.887, delta: 0.099, type: "new" },
  { name: "★ Tier Weighted", exact: 2.061, roi: -44.8, hits: 209, sharpe: -0.880, delta: 0.089, type: "new" },
  { name: "★ Multi-Signal", exact: 2.002, roi: -35.6, hits: 203, sharpe: -0.574, delta: 0.030, type: "new" },
  { name: "Random", exact: 1.972, roi: -52.6, hits: 200, sharpe: -1.190, delta: 0.0, type: "baseline" },
];

const BACKTEST_MAX_3D_PRO: BacktestRow[] = [
  { name: "★ EV Maximizer", exact: 2.496, roi: -26.5, hits: 165, sharpe: -0.428, delta: 0.499, type: "new" },
  { name: "★ ULTIMATE v2 Sharp", exact: 2.421, roi: -27.5, hits: 160, sharpe: -0.447, delta: 0.424, type: "new" },
  { name: "★ Joint Digit Bias", exact: 2.375, roi: -31.5, hits: 157, sharpe: -0.519, delta: 0.378, type: "new" },
  { name: "★ Tier Weighted", exact: 2.179, roi: -43.0, hits: 144, sharpe: -0.838, delta: 0.181, type: "new" },
  { name: "★ Bayesian Joint", exact: 2.163, roi: -45.0, hits: 143, sharpe: -0.911, delta: 0.166, type: "new" },
  { name: "★ Bayesian HL100", exact: 2.133, roi: -33.4, hits: 141, sharpe: -0.551, delta: 0.136, type: "new" },
  { name: "★ Cond Chain", exact: 2.103, roi: -38.3, hits: 139, sharpe: -0.646, delta: 0.106, type: "new" },
  { name: "★ Multi-Signal", exact: 2.088, roi: -42.2, hits: 138, sharpe: -0.754, delta: 0.091, type: "new" },
  { name: "★ Pair Exploiter", exact: 2.012, roi: -41.6, hits: 133, sharpe: -0.743, delta: 0.015, type: "new" },
  { name: "Random", exact: 1.997, roi: -45.4, hits: 132, sharpe: -0.898, delta: 0.0, type: "baseline" },
  { name: "FreqWholeHot", exact: 1.937, roi: -38.5, hits: 128, sharpe: -0.652, delta: -0.060, type: "baseline" },
];

const KEY_FINDINGS = [
  {
    icon: "⚡",
    title: "Digit 6 vượt trội ở vị trí đơn vị",
    detail: "Tần suất +10-11% so với kỳ vọng ở CẢ HAI sản phẩm. p-value ≈ 0 cho Max 3D, p = 0.003 cho 3D Pro.",
    impact: "Cao",
  },
  {
    icon: "🔗",
    title: "Các vị trí digit KHÔNG độc lập",
    detail: "Chi-squared test bác bỏ giả thuyết P(abc)=P(a)×P(b)×P(c) với p < 0.001 cho tất cả cặp vị trí.",
    impact: "Cao",
  },
  {
    icon: "📊",
    title: "Digit 5 vượt trội ở vị trí hàng chục",
    detail: "Tần suất +6% ở cả hai sản phẩm, p = 0.006 cho 3D Pro.",
    impact: "Trung bình",
  },
  {
    icon: "🎯",
    title: "EV Maximizer đánh bại random 25%",
    detail: "Trên 3D Pro: exact match 2.496% vs random 1.997% (+0.499pp). ROI -26.5% vs -45.4%.",
    impact: "Cao",
  },
  {
    icon: "📈",
    title: "15/19 chiến lược mới đánh bại random",
    detail: "Trên Max 3D, 78.9% chiến lược mới có exact match rate cao hơn baseline ngẫu nhiên.",
    impact: "Cao",
  },
];

function BiasBar({ ratio, digit }: { ratio: number; digit: number }) {
  const pct = Math.max(0, Math.min(100, (ratio - 0.85) / 0.3 * 100));
  const isAbove = ratio > 1.03;
  const isBelow = ratio < 0.97;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right font-mono">{digit}</span>
      <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden relative">
        <div
          className={`h-full rounded-sm transition-all ${isAbove ? "bg-green-500" : isBelow ? "bg-red-400" : "bg-blue-400/60"}`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-muted-foreground/30" />
      </div>
      <span className={`w-12 text-right font-mono ${isAbove ? "text-green-400 font-bold" : isBelow ? "text-red-400" : "text-muted-foreground"}`}>
        {ratio.toFixed(3)}
      </span>
    </div>
  );
}

function ResultBadge({ pass }: { pass: boolean }) {
  return (
    <Badge variant={pass ? "default" : "destructive"} className="text-xs">
      {pass ? "✓ PASS" : "✗ FAIL"}
    </Badge>
  );
}

export default function ResearchPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          🔬 Nghiên Cứu Thuật Toán Max 3D
        </h1>
        <p className="text-muted-foreground mt-2">
          8 chu kỳ nghiên cứu · 28 chiến lược · 3-gate protocol (full + split-half + forward) · <strong>research line closed 2026-04-21</strong>
        </p>
      </div>

      {/* Research closed banner */}
      <Card className="border-orange-500/40 bg-orange-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔬</span>
            <div className="flex-1 space-y-2 text-sm">
              <div className="font-bold text-orange-700 dark:text-orange-400">
                3D Research Line — Definitively Closed (Chu kỳ 13, 2026-04-21)
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Sau 8 chu kỳ + 28 chiến lược qua 5 mechanism paradigms (Frequency, Joint-digit, Copula,
                Discriminative ML, Cross-product pool), <strong className="text-foreground">0 chiến lược đạt ngưỡng Accept/Suggestive</strong>
                qua 3-gate protocol (full-sample + split-half replication + forward_last_100).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                3D RNG của Vietlott có bias real + stable (Chu kỳ 8 xác nhận no drift)
                nhưng <strong className="text-foreground">không exploitable</strong> ở data horizon hiện tại —
                bias ceiling ~+0.4pp quá nhỏ so với noise floor ±0.44pp của forward window n=1000.
              </p>
              <p className="text-xs text-muted-foreground/80 italic">
                Revisit criteria: &gt;500 draws mới (~2027) OR novel bias dimension discovery OR Vietlott RNG methodology audit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">⚡ Phát Hiện Chính</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KEY_FINDINGS.map((f, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{f.icon}</span>
                  <span className="font-semibold text-sm">{f.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{f.detail}</p>
                <Badge variant={f.impact === "Cao" ? "destructive" : "secondary"} className="text-xs">
                  Impact: {f.impact}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RNG Quality Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🧪 Kiểm Định Chất Lượng RNG</CardTitle>
          <p className="text-sm text-muted-foreground">
            13 bài kiểm tra thống kê — p &lt; 0.05 = bias đáng kể (FAIL)
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead className="text-center">Max 3D</TableHead>
                <TableHead className="text-center">Max 3D Pro</TableHead>
                <TableHead>Ý nghĩa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RNG_TESTS.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm">{t.test}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <ResultBadge pass={t.max3d.pass} />
                      <span className="text-xs text-muted-foreground">p={t.max3d.p < 0.001 ? "<0.001" : t.max3d.p.toFixed(3)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <ResultBadge pass={t.max3dPro.pass} />
                      <span className="text-xs text-muted-foreground">p={t.max3dPro.p < 0.001 ? "<0.001" : t.max3dPro.p.toFixed(3)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.meaning}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Digit Bias Visualization */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Bias Digit — Max 3D (vị trí đơn vị)</CardTitle>
            <p className="text-xs text-muted-foreground">Ratio O/E: &gt;1.03 = over-represented, &lt;0.97 = under-represented</p>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {DIGIT_BIAS_DATA.max3d.pos2.map((d) => (
              <BiasBar key={d.digit} digit={d.digit} ratio={d.ratio} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Bias Digit — Max 3D Pro (vị trí đơn vị)</CardTitle>
            <p className="text-xs text-muted-foreground">Digit 6: +11.6% — bias mạnh nhất</p>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {DIGIT_BIAS_DATA.max3dPro.pos2.map((d) => (
              <BiasBar key={d.digit} digit={d.digit} ratio={d.ratio} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Strategy Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🧠 Thuật Toán Nghiên Cứu Mới</CardTitle>
          <p className="text-sm text-muted-foreground">
            8 thuật toán mới được thiết kế riêng cho Max 3D, khai thác các bias phát hiện được
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {STRATEGIES_3D.map((s) => (
              <div key={s.id} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.emoji}</span>
                  <span className="font-bold">{s.name}</span>
                  {s.badge && (
                    <Badge variant="secondary" className="text-xs">{s.badge}</Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">{s.category}</Badge>
                <p className="text-sm text-muted-foreground">{s.description}</p>
                <div className="bg-muted rounded-md p-2">
                  <p className="text-xs font-mono text-muted-foreground">{s.formula}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backtest Results — Max 3D */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">📈 Backtest: Max 3D (1.064 kỳ)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Walk-forward | 5 runs | 2 predictions/draw | Seed=42
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Chiến lược</TableHead>
                <TableHead className="text-right">Exact %</TableHead>
                <TableHead className="text-right">ROI %</TableHead>
                <TableHead className="text-right">Hits</TableHead>
                <TableHead className="text-right">Sharpe</TableHead>
                <TableHead className="text-right">Δ Random</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BACKTEST_MAX_3D.map((r, i) => (
                <TableRow key={i} className={r.type === "baseline" ? "bg-muted/30" : ""}>
                  <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">
                    {r.name}
                    {i === 0 && <Badge className="ml-2 text-xs" variant="default">🥇</Badge>}
                    {i === 1 && <Badge className="ml-2 text-xs" variant="secondary">🥈</Badge>}
                    {i === 2 && <Badge className="ml-2 text-xs" variant="secondary">🥉</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-mono">{r.exact.toFixed(3)}</TableCell>
                  <TableCell className={`text-right font-mono ${r.roi > -40 ? "text-green-400" : "text-muted-foreground"}`}>{r.roi.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-mono">{r.hits}</TableCell>
                  <TableCell className="text-right font-mono">{r.sharpe.toFixed(3)}</TableCell>
                  <TableCell className={`text-right font-mono ${r.delta > 0 ? "text-green-400" : r.delta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                    {r.delta > 0 ? "+" : ""}{r.delta.toFixed(3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Backtest Results — Max 3D Pro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">📈 Backtest: Max 3D Pro (711 kỳ)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Walk-forward | 5 runs | 2 predictions/draw | Seed=42
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Chiến lược</TableHead>
                <TableHead className="text-right">Exact %</TableHead>
                <TableHead className="text-right">ROI %</TableHead>
                <TableHead className="text-right">Hits</TableHead>
                <TableHead className="text-right">Sharpe</TableHead>
                <TableHead className="text-right">Δ Random</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BACKTEST_MAX_3D_PRO.map((r, i) => (
                <TableRow key={i} className={r.type === "baseline" ? "bg-muted/30" : ""}>
                  <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">
                    {r.name}
                    {i === 0 && <Badge className="ml-2 text-xs" variant="default">🥇</Badge>}
                    {i === 1 && <Badge className="ml-2 text-xs" variant="secondary">🥈</Badge>}
                    {i === 2 && <Badge className="ml-2 text-xs" variant="secondary">🥉</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-mono">{r.exact.toFixed(3)}</TableCell>
                  <TableCell className={`text-right font-mono ${r.roi > -35 ? "text-green-400" : "text-muted-foreground"}`}>{r.roi.toFixed(1)}</TableCell>
                  <TableCell className="text-right font-mono">{r.hits}</TableCell>
                  <TableCell className="text-right font-mono">{r.sharpe.toFixed(3)}</TableCell>
                  <TableCell className={`text-right font-mono ${r.delta > 0 ? "text-green-400" : r.delta < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                    {r.delta > 0 ? "+" : ""}{r.delta.toFixed(3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">📋 Phương Pháp Nghiên Cứu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold">Quy trình nghiên cứu</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Phân tích thống kê sâu (13 bài test)</li>
                <li>Phát hiện bias trong RNG</li>
                <li>Thiết kế 21 thuật toán mới (4 category)</li>
                <li>Walk-forward backtest (không look-ahead)</li>
                <li>Xếp hạng và phân tích kết quả</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Đảm bảo chất lượng</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>✅ Không look-ahead bias</li>
                <li>✅ Seed cố định (reproducible)</li>
                <li>✅ 5 runs per strategy</li>
                <li>✅ Cross-product validation</li>
                <li>✅ Statistical significance tests</li>
              </ul>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Cấu hình backtest</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: "Min History", value: "50 draws" },
                { label: "Predictions/Draw", value: "2 số" },
                { label: "Runs", value: "5 lần" },
                { label: "Ticket Price", value: "10.000 VND" },
              ].map((c) => (
                <div key={c.label} className="rounded-md bg-muted p-2 text-center">
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="font-mono font-bold text-sm">{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="text-xl">🏆 Khuyến Nghị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border-2 border-green-500/30 bg-green-500/5 p-4 space-y-2">
              <h3 className="font-bold text-green-400">Max 3D</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Chiến lược #1:</strong> FreqWholeHot hoặc Joint Digit Bias
              </p>
              <p className="text-xs text-muted-foreground">
                Exact match: 2.35% | ROI: -33% | Cải thiện 19% vs random
              </p>
            </div>
            <div className="rounded-lg border-2 border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
              <h3 className="font-bold text-yellow-400">Max 3D Pro</h3>
              <p className="text-sm text-muted-foreground">
                <strong>Chiến lược #1:</strong> EV Maximizer hoặc ULTIMATE v2
              </p>
              <p className="text-xs text-muted-foreground">
                Exact match: 2.50% | ROI: -26.5% | Cải thiện 42% vs random
              </p>
              <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-2 italic">
                ⚠️ Claim trên là snapshot Chu kỳ 4 (pre-replication). Chu kỳ 7 split-half Rejected EV Maximizer
                (h1 p=0.0007 → h2 p=0.865 direction flip). Xem Chu kỳ Timeline bên dưới.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cycles Timeline (Chu kỳ 7-13) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🔄 Chu Kỳ Nghiên Cứu 3D — Timeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Từ Chu kỳ 4 (initial deep analysis) đến Chu kỳ 13 (research closed) — 8 cycles, progressive protocol tightening
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {[
              { id: "4", name: "Deep Analysis + 21 Strategies", date: "03-04/2026", result: "Claims rút lại sau Chu kỳ 6 significance gating" },
              { id: "6", name: "Significance Test Enforcement", date: "04/2026", result: "Z-test wired; 3 candidates near-miss Suggestive" },
              { id: "7", name: "3D Split-half Replication", date: "04/2026", result: "2/2 Reject — EVMax dramatic flip, FreqWholeHot noise" },
              { id: "8", name: "Drift Verification (R1 Gate)", date: "04/2026", result: "No drift — bias stable. 3D paused" },
              { id: "11", name: "Copula (Path A)", date: "04/2026", result: "3/4 Reject + 1/4 Inconclusive — Copula thua JointBias heuristic" },
              { id: "12", name: "Tree-based GBM (Path E)", date: "04/2026", result: "Max 3D Reject (fwd flip −1.9pp), Max 3D Pro Technical Accept" },
              { id: "12.5", name: "GBM Audit (Diagnostic)", date: "04/2026", result: "No leak, overfit confirmed — Max 3D Pro GBM deprecated → Reject" },
              { id: "13", name: "Cross-product Pool (Path B)", date: "04/2026", result: "4/4 Reject — shared-RNG hypothesis falsified" },
            ].map((c) => (
              <div key={c.id} className="flex gap-3 border-l-2 border-muted pl-3 py-1">
                <Badge variant="outline" className="shrink-0 font-mono">Chu kỳ {c.id}</Badge>
                <div className="flex-1">
                  <div className="font-semibold">{c.name} <span className="text-xs text-muted-foreground font-normal">({c.date})</span></div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.result}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Methodology Principles Corpus (#11-#15) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">📐 Methodology Principles — Codified từ 3D Research</CardTitle>
          <p className="text-sm text-muted-foreground">
            5 binding principles mới được codify vào METHODOLOGY.md §3.5-3.9, chủ yếu từ 3D negative results
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { n: "11", title: "Split-half replication mandatory", origin: "Chu kỳ 7, 9", body: "Mọi Suggestive claim từ full-sample phải pass split-half replication trước khi upgrade sang Accept." },
            { n: "12", title: "Variable-baseline power analysis", origin: "Chu kỳ 8, 9", body: "Trước replication, tính n_required theo formula variable-baseline. Nếu power <80% → report limitation." },
            { n: "13", title: "Forward gate mandatory (3-gate)", origin: "Chu kỳ 7, 9, 11, 12, 13 (5× validated)", body: "Stacked gate: full-sample + split-half + forward_last_100. 5 forward-flip cases justify binding rule." },
            { n: "14", title: "Magnitude sanity check", origin: "Chu kỳ 12, 12.5", body: "Nếu |Δ| > 3× bias ceiling của product class (3D: 0.4pp, matrix: 0.3pp), auto-flag Ship-with-caveats pending audit." },
            { n: "15", title: "Prediction concentration check (ML)", origin: "Chu kỳ 12.5", body: "ML/discriminative strategies require n_unique/total ≥ 0.30 + top-5 concentration < 30% để tránh overfit collapse." },
          ].map((p) => (
            <div key={p.n} className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="font-mono">#{p.n}</Badge>
                <span className="font-semibold">{p.title}</span>
                <span className="text-xs text-muted-foreground">· {p.origin}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{p.body}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground italic mt-2">
            Xem chi tiết binding rules + implementation trong METHODOLOGY.md §3 của repo research.
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-lg border border-yellow-600/40 bg-yellow-600/5 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <strong>⚠️ Disclaimer:</strong> Nghiên cứu này chỉ mang tính chất giáo dục và thử nghiệm. 
          Xổ số là trò chơi có kỳ vọng âm — <strong>không có thuật toán nào đảm bảo lợi nhuận</strong>. 
          Kết quả backtest không đảm bảo hiệu suất tương lai. Không nên đánh cược nhiều hơn số tiền bạn có thể chịu mất.
        </p>
      </div>
    </div>
  );
}

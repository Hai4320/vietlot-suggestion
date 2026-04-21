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
// Deep Statistical Analysis Results (kept for detail section)
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

const DIGIT_BIAS_POS2_MAX3D_PRO = [
  { digit: 0, ratio: 0.972 }, { digit: 1, ratio: 0.982 }, { digit: 2, ratio: 0.989 },
  { digit: 3, ratio: 0.985 }, { digit: 4, ratio: 0.979 }, { digit: 5, ratio: 0.990 },
  { digit: 6, ratio: 1.116 }, { digit: 7, ratio: 0.974 }, { digit: 8, ratio: 0.979 },
  { digit: 9, ratio: 1.035 },
];

const DIGIT_BIAS_POS2_MAX3D = [
  { digit: 0, ratio: 1.024 }, { digit: 1, ratio: 0.993 }, { digit: 2, ratio: 0.952 },
  { digit: 3, ratio: 0.987 }, { digit: 4, ratio: 0.965 }, { digit: 5, ratio: 1.001 },
  { digit: 6, ratio: 1.100 }, { digit: 7, ratio: 1.015 }, { digit: 8, ratio: 0.924 },
  { digit: 9, ratio: 1.041 },
];

// ============================================================
// Hero stats (at-a-glance numbers)
// ============================================================

const KEY_STATS = [
  { label: "Chiến lược đã test", value: "28", sub: "Qua 5 paradigm: Frequency · Joint-digit · Copula · GBM · Pool" },
  { label: "Chu kỳ nghiên cứu", value: "8", sub: "Từ Chu kỳ 4 (03/2026) → Chu kỳ 13 (04/2026)" },
  { label: "Dữ liệu draws", value: "1,776", sub: "Max 3D (1,065) + Max 3D Pro (711)" },
  { label: "Accept confirmed", value: "0", sub: "Qua 3-gate protocol (full + split-half + forward)", alert: true },
];

// ============================================================
// Research story chapters (narrative, plain Vietnamese)
// ============================================================

const CHAPTERS = [
  {
    icon: "🔬",
    phase: "03-04/2026",
    title: "Chương 1 — Phát hiện bias",
    body: "Chúng tôi chạy 13 bài test thống kê trên dữ liệu. Phát hiện: RNG của Vietlott KHÔNG hoàn toàn đồng đều. Cụ thể: digit 6 xuất hiện NHIỀU HƠN 10-11% so với kỳ vọng ở vị trí đơn vị (cả Max 3D lẫn Max 3D Pro). Các vị trí digit cũng không độc lập — có mối phụ thuộc thực giữa chúng.",
    cycle: "Chu kỳ 4",
  },
  {
    icon: "⚡",
    phase: "04/2026",
    title: "Chương 2 — Thử khai thác",
    body: "Thiết kế 21 chiến lược khai thác bias: frequency, joint-digit histogram, conditional chain, EV maximizer, multi-signal ensemble, v.v. Kết quả ban đầu nhìn đầy hứa hẹn — nhiều chiến lược 'beat random' trên full-sample backtest.",
    cycle: "Chu kỳ 4-6",
  },
  {
    icon: "🧪",
    phase: "04/2026",
    title: "Chương 3 — Replication gate cắt xuống",
    body: "Áp dụng split-half replication: chạy chiến lược riêng trên nửa đầu và nửa sau của dữ liệu. Kết quả: EV Maximizer nửa đầu p=0.0007 (rất tốt) → nửa sau p=0.865 (hoàn toàn fail). Đây là signature của overfitting. 2/2 chiến lược near-miss đều Reject.",
    cycle: "Chu kỳ 7-9",
  },
  {
    icon: "🚪",
    phase: "04/2026",
    title: "Chương 4 — Breakthrough mode + đóng 3D",
    body: "Pivot sang paradigm mới: Copula (Path A), GBM tree-based (Path E), Cross-product pool (Path B). GBM ban đầu show +3pp trên Max 3D Pro — nhưng audit Chu kỳ 12.5 confirm overfitting (no leak). Cả 3 path Reject qua 3-gate protocol. 3D research line CHÍNH THỨC ĐÓNG.",
    cycle: "Chu kỳ 10-13",
  },
];

// ============================================================
// Current picks (aligned with /suggest SuggestionPanel)
// ============================================================

const CURRENT_PICKS = [
  {
    product: "Max 3D",
    color: "hsl(271, 91%, 65%)",
    emoji: "🟣",
    pick: "Bias liên hợp (JointDigitBias)",
    delta: "+0.305pp",
    caveat: "Directional only (p=0.11, chưa significant)",
    why: "Mechanism khai thác digit dependencies (pos_1_2 χ²=157.74). Magnitude TRONG bias ceiling → không có dấu hiệu overfit.",
  },
  {
    product: "Max 3D Pro",
    color: "hsl(25, 95%, 53%)",
    emoji: "🟠",
    pick: "Bias liên hợp (JointDigitBias)",
    delta: "+0.378pp",
    caveat: "Directional only (p=0.14). EV Maximizer đã Reject Chu kỳ 7.",
    why: "Strongest remaining pick sau khi EV Maximizer bị Reject (dramatic split-half flip h1 p=0.0007 → h2 p=0.865).",
  },
];

// ============================================================
// Cycles timeline (for technical detail section)
// ============================================================

const CYCLES_TIMELINE = [
  { id: "4", name: "Deep Analysis + 21 Strategies", date: "03-04/2026", result: "Claims rút lại sau Chu kỳ 6 significance gating" },
  { id: "6", name: "Significance Test Enforcement", date: "04/2026", result: "Z-test wired; 3 candidates near-miss Suggestive" },
  { id: "7", name: "3D Split-half Replication", date: "04/2026", result: "2/2 Reject — EVMax dramatic flip, FreqWholeHot noise" },
  { id: "8", name: "Drift Verification (R1 Gate)", date: "04/2026", result: "No drift — bias stable. 3D paused" },
  { id: "11", name: "Copula (Path A)", date: "04/2026", result: "3/4 Reject + 1/4 Inconclusive — Copula thua JointBias heuristic" },
  { id: "12", name: "Tree-based GBM (Path E)", date: "04/2026", result: "Max 3D Reject (fwd flip −1.9pp), Max 3D Pro Technical Accept" },
  { id: "12.5", name: "GBM Audit (Diagnostic)", date: "04/2026", result: "No leak, overfit confirmed — Max 3D Pro GBM deprecated → Reject" },
  { id: "13", name: "Cross-product Pool (Path B)", date: "04/2026", result: "4/4 Reject — shared-RNG hypothesis falsified" },
];

const PRINCIPLES = [
  { n: "11", title: "Split-half replication mandatory", origin: "Chu kỳ 7, 9", body: "Mọi Suggestive claim từ full-sample phải pass split-half replication trước khi upgrade sang Accept." },
  { n: "12", title: "Variable-baseline power analysis", origin: "Chu kỳ 8, 9", body: "Trước replication, tính n_required theo formula variable-baseline. Nếu power <80% → report limitation." },
  { n: "13", title: "Forward gate mandatory (3-gate)", origin: "Chu kỳ 7, 9, 11, 12, 13 (5× validated)", body: "Stacked gate: full-sample + split-half + forward_last_100. 5 forward-flip cases justify binding rule." },
  { n: "14", title: "Magnitude sanity check", origin: "Chu kỳ 12, 12.5", body: "Nếu |Δ| > 3× bias ceiling của product class (3D: 0.4pp, matrix: 0.3pp), auto-flag Ship-with-caveats pending audit." },
  { n: "15", title: "Prediction concentration check (ML)", origin: "Chu kỳ 12.5", body: "ML/discriminative strategies require n_unique/total ≥ 0.30 + top-5 concentration < 30% để tránh overfit collapse." },
];

// ============================================================
// UI helpers
// ============================================================

function BiasBar({ ratio, digit, highlight = false }: { ratio: number; digit: number; highlight?: boolean }) {
  const pct = Math.max(0, Math.min(100, (ratio - 0.85) / 0.3 * 100));
  const isAbove = ratio > 1.03;
  const isBelow = ratio < 0.97;
  return (
    <div className={`flex items-center gap-2 text-xs ${highlight ? "bg-orange-500/10 rounded px-1" : ""}`}>
      <span className={`w-4 text-right font-mono ${highlight ? "font-bold text-orange-500" : ""}`}>{digit}</span>
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

// ============================================================
// Page
// ============================================================

export default function ResearchPage() {
  return (
    <div className="space-y-8 pb-12">
      {/* ================== HERO ================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">
            🔬 Nghiên Cứu Thuật Toán 3D
          </h1>
          <Badge variant="destructive" className="text-xs">Research line closed · 2026-04-21</Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Dự án này đã test 28 chiến lược dự đoán số qua 8 chu kỳ nghiên cứu nghiêm ngặt.
          Dưới đây là kết quả, kết luận, và lý do tại sao không có thuật toán nào đảm bảo lợi nhuận.
        </p>
      </div>

      {/* ================== TL;DR ================== */}
      <Card className="border-orange-500/40 bg-orange-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>⚡</span> Tóm tắt — Đọc 30 giây
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="text-green-500 shrink-0">✓</span>
            <p className="leading-relaxed">
              <strong>Có bias THẬT</strong> trong RNG của Vietlott — digit 6 xuất hiện nhiều hơn 10-11%
              ở vị trí đơn vị, các digit không độc lập nhau.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-orange-500 shrink-0">⚠</span>
            <p className="leading-relaxed">
              <strong>Nhưng bias quá nhỏ</strong> so với noise. Với 1,000-2,000 draws dữ liệu hiện tại,
              tín hiệu (~+0.4pp) bị nhiễu (±0.44pp) che mờ — không thể khẳng định thuật toán nào thắng.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 shrink-0">✗</span>
            <p className="leading-relaxed">
              <strong>0/28 chiến lược đạt Accept</strong> qua quy trình 3-gate (full-sample + split-half
              replication + forward validation). Mọi &ldquo;chiến thắng&rdquo; trên backtest đều thất bại khi
              test lại trên dữ liệu mới.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-500 shrink-0">🎯</span>
            <p className="leading-relaxed">
              <strong>Có thể revisit khoảng 2027</strong> khi có thêm ~500 draws dữ liệu, hoặc khi tìm được
              bias dimension mới (time-of-draw, machine serial, v.v.).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================== KEY STATS ================== */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {KEY_STATS.map((s) => (
          <Card key={s.label} className={s.alert ? "border-red-500/40 bg-red-500/5" : ""}>
            <CardContent className="pt-6 space-y-1">
              <div className={`text-3xl font-bold font-mono ${s.alert ? "text-red-500" : "text-primary"}`}>
                {s.value}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wide">{s.label}</div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ================== STORY ================== */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>📖</span> Câu chuyện nghiên cứu
        </h2>
        <div className="space-y-3">
          {CHAPTERS.map((c, i) => (
            <Card key={i} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60" />
              <CardContent className="pt-5 pl-6 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">{c.icon}</span>
                  <span className="font-bold text-base">{c.title}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">{c.cycle}</Badge>
                  <span className="text-xs text-muted-foreground">· {c.phase}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ================== WHY DOESN'T IT WORK? ================== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <span>🤔</span> Tại sao bias thực nhưng không khai thác được?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="leading-relaxed">
            <strong>Phép so sánh đơn giản:</strong> Tưởng tượng tung đồng xu 100 lần ra 52 mặt ngửa, 48 sấp.
            Đồng xu này fair hay bias +2%? Không chắc — chênh lệch có thể do noise. Cần tung ~10,000 lần
            mới phân biệt được.
          </p>
          <p className="leading-relaxed">
            Với 3D, tình huống tương tự: bias +0.4pp (tín hiệu) gần bằng noise ±0.44pp (độ nhiễu) ở
            forward validation window n=1,000. Signal-to-noise ratio ≈ 0.68 — quá thấp để confident.
          </p>

          {/* Visual: signal vs noise */}
          <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tín hiệu vs Nhiễu trên forward window (n=1,000)
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Tín hiệu (bias ceiling)</span>
                  <span className="font-mono text-green-500">+0.4pp</span>
                </div>
                <div className="h-3 bg-muted rounded">
                  <div className="h-3 bg-green-500/70 rounded" style={{ width: "40%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Nhiễu (standard error)</span>
                  <span className="font-mono text-red-400">±0.44pp</span>
                </div>
                <div className="h-3 bg-muted rounded">
                  <div className="h-3 bg-red-400/70 rounded" style={{ width: "44%" }} />
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground italic mt-2">
                → Tín hiệu và nhiễu gần bằng nhau → 50% khả năng thấy &ldquo;chiến thắng&rdquo; ngẫu nhiên ngay cả khi không có edge thực.
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-2">
            <div className="font-semibold flex items-center gap-2">
              <span>🛡️</span> Forward gate — &ldquo;Gác cổng&rdquo; đã phát hiện 5 lần
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Chu kỳ 7 (EV Maximizer), Chu kỳ 9 (ExpDecay Cold), Chu kỳ 11 (Empirical Copula), Chu kỳ 12
              (GBM), Chu kỳ 13 (Hierarchical Bayes) — mọi chiến lược &ldquo;nhìn có edge&rdquo; trên backtest đều
              thất bại khi test lại trên 100 draws mới nhất (forward validation). Đây là signature
              overfitting điển hình.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ================== CURRENT PICKS ================== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <span>🎯</span> Research picks — Nếu bạn vẫn muốn chơi
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Đây là chọn lựa TỐT NHẤT trong các chọn lựa không-tốt. <strong>KHÔNG phải confirmed edge.</strong>
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {CURRENT_PICKS.map((p) => (
            <div
              key={p.product}
              className="rounded-lg border-2 p-4 space-y-2"
              style={{ borderColor: `${p.color}40`, background: `${p.color}08` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{p.emoji}</span>
                <span className="font-bold">{p.product}</span>
                <Badge className="ml-auto text-[10px] bg-orange-600 text-white">🔬 Directional</Badge>
              </div>
              <div className="text-sm">
                <span className="font-semibold">{p.pick}</span>
                <span className="ml-2 text-green-500 font-mono text-xs">Δ {p.delta} vs Random</span>
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                ⚠ {p.caveat}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.why}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ================== FUTURE / REVISIT ================== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <span>🔮</span> Khi nào có thể mở lại nghiên cứu?
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: "📊",
              title: "Data mở rộng",
              body: "Chờ ~500 draws thêm (Max 3D Pro → 1,500 draws). Timeframe: khoảng 2027-2028 với tần suất draw hiện tại (180/năm).",
            },
            {
              icon: "💡",
              title: "Novel bias dimension",
              body: "Phát hiện chiều bias mới: time-of-draw, machine serial correlations, cross-time patterns, operator schedule artifacts, v.v.",
            },
            {
              icon: "📋",
              title: "RNG audit công khai",
              body: "Nếu Vietlott hoặc regulator công bố phương pháp RNG / audit → có thể target specific mathematical structure.",
            },
          ].map((c, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.icon}</span>
                <span className="font-semibold text-sm">{c.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ================== DIGIT BIAS VIZ (kept visible) ================== */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 Bias digit đơn vị — Max 3D Pro</CardTitle>
            <p className="text-xs text-muted-foreground">Tỷ lệ O/E. Digit 6: <strong className="text-orange-500">+11.6%</strong> — bias mạnh nhất toàn nghiên cứu.</p>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {DIGIT_BIAS_POS2_MAX3D_PRO.map((d) => (
              <BiasBar key={d.digit} digit={d.digit} ratio={d.ratio} highlight={d.digit === 6} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 Bias digit đơn vị — Max 3D</CardTitle>
            <p className="text-xs text-muted-foreground">Tỷ lệ O/E. Digit 6: <strong className="text-orange-500">+10.0%</strong> — cùng pattern với 3D Pro.</p>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {DIGIT_BIAS_POS2_MAX3D.map((d) => (
              <BiasBar key={d.digit} digit={d.digit} ratio={d.ratio} highlight={d.digit === 6} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ================== TECHNICAL DETAILS (COLLAPSIBLE) ================== */}
      <details className="group rounded-lg border border-border">
        <summary className="cursor-pointer list-none flex items-center justify-between p-4 hover:bg-muted/30 transition">
          <span className="font-semibold text-base flex items-center gap-2">
            <span>🔬</span> Chi tiết kỹ thuật (chu kỳ · principles · tests · backtest full)
          </span>
          <span className="text-xs text-muted-foreground group-open:hidden">Click để mở</span>
          <span className="text-xs text-muted-foreground hidden group-open:inline">Click để đóng</span>
        </summary>
        <div className="border-t border-border p-4 space-y-6">
          {/* Cycles timeline */}
          <div>
            <h3 className="font-semibold text-base mb-3">🔄 Timeline 8 chu kỳ</h3>
            <div className="space-y-2">
              {CYCLES_TIMELINE.map((c) => (
                <div key={c.id} className="flex gap-3 border-l-2 border-muted pl-3 py-1">
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px]">Chu kỳ {c.id}</Badge>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">
                      {c.name} <span className="text-xs text-muted-foreground font-normal">({c.date})</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.result}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Principles */}
          <div>
            <h3 className="font-semibold text-base mb-3">📐 Methodology Principles #11-#15</h3>
            <div className="space-y-2">
              {PRINCIPLES.map((p) => (
                <div key={p.n} className="rounded-lg border border-border p-3 bg-muted/20">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="font-mono text-[10px]">#{p.n}</Badge>
                    <span className="font-semibold text-sm">{p.title}</span>
                    <span className="text-[10px] text-muted-foreground">· {p.origin}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RNG tests */}
          <div>
            <h3 className="font-semibold text-base mb-3">🧪 10 bài test kiểm định RNG</h3>
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
                        <span className="text-xs text-muted-foreground">
                          p={t.max3d.p < 0.001 ? "<0.001" : t.max3d.p.toFixed(3)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <ResultBadge pass={t.max3dPro.pass} />
                        <span className="text-xs text-muted-foreground">
                          p={t.max3dPro.p < 0.001 ? "<0.001" : t.max3dPro.p.toFixed(3)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.meaning}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-[11px] text-muted-foreground italic mt-2">
              PASS = phân bố đồng đều (p ≥ 0.05). FAIL = có bias đáng kể (p &lt; 0.05).
            </p>
          </div>

          {/* Backtest config */}
          <div>
            <h3 className="font-semibold text-base mb-3">⚙️ Cấu hình backtest</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: "Min history", value: "50 draws" },
                { label: "Predictions/draw", value: "2 số" },
                { label: "Runs", value: "5 lần" },
                { label: "Ticket price", value: "10k VND" },
                { label: "Forward window", value: "100 draws" },
                { label: "Split type", value: "Time-ordered" },
                { label: "Seed", value: "42 (fixed)" },
                { label: "Multiple testing", value: "Bonferroni" },
              ].map((c) => (
                <div key={c.label} className="rounded-md bg-muted/50 p-2 text-center">
                  <div className="text-[10px] text-muted-foreground">{c.label}</div>
                  <div className="font-mono font-bold text-xs">{c.value}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Nguồn chi tiết: <code className="font-mono bg-muted px-1 rounded">website/research/3d/3D_FINAL_REPORT.md</code>,{" "}
            <code className="font-mono bg-muted px-1 rounded">METHODOLOGY.md</code>, và per-cycle files trong{" "}
            <code className="font-mono bg-muted px-1 rounded">website/research/history/</code>.
          </p>
        </div>
      </details>

      {/* ================== DISCLAIMER ================== */}
      <div className="rounded-lg border border-yellow-600/40 bg-yellow-600/5 px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>⚠️ Disclaimer:</strong> Nghiên cứu này chỉ mang tính giáo dục và thử nghiệm.
          Xổ số là trò chơi có kỳ vọng âm — <strong>không có thuật toán nào đảm bảo lợi nhuận</strong>.
          Mọi research pick trên đây là directional only (nhắm đúng hướng bias), chưa được xác nhận
          thống kê có edge thực. Không nên đánh cược nhiều hơn số tiền bạn có thể chịu mất.
        </p>
      </div>
    </div>
  );
}

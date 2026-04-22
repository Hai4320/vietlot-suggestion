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
import { DecisionBadge } from "@/components/common/DecisionBadge";
import { BACKTEST_MATRIX, type Decision } from "@/lib/backtest-data";
import { formatPValue } from "@/lib/format";

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
  { label: "Chiến lược đã test", value: "69", sub: "Matrix + 3D × 22 cycles (07/2025 → 04/2026)" },
  { label: "Chu kỳ nghiên cứu", value: "22", sub: "Breakthrough closed Chu kỳ 18, Optimization shipped Chu kỳ 22" },
  { label: "Dữ liệu draws", value: "~5,000", sub: "Matrix 3,179 + 3D 1,776 (total 4,955 kỳ quay)" },
  { label: "Accept confirmed", value: "0", sub: "Toàn dự án: 0 Accept, 0 Suggestive verified qua 3-gate", alert: true },
];

// ============================================================
// Research lines — 3D vs Matrix (two-line project state)
// ============================================================

const RESEARCH_LINES = [
  {
    family: "3D",
    slug: "3d",
    emoji: "🎲",
    color: "hsl(271, 91%, 65%)",
    state: "CLOSED",
    stateColor: "destructive",
    products: "Max 3D (1,065) + Max 3D Pro (711)",
    strategies: "28 strategies, 5 paradigms",
    cycles: "Chu kỳ 4-13",
    biasCeiling: "+0.4pp",
    summary: "Bias REAL (digit 6 +10-11% ở vị trí đơn vị) nhưng không exploitable. 28/28 Reject qua 3-gate. Research line đóng 2026-04-21.",
    nextStep: "Revisit ~2027 khi có +500 draws HOẶC novel bias dimension HOẶC RNG audit công khai.",
  },
  {
    family: "Matrix",
    slug: "matrix",
    emoji: "🎰",
    color: "hsl(217, 91%, 60%)",
    state: "ACTIVE",
    stateColor: "default",
    products: "Power 6/55 (1,334) + Mega 6/45 (1,302) + Lotto 5/35 (539)",
    strategies: "~20 strategies (baseline + Bayesian + MaxEntropy + Adaptive)",
    cycles: "Chu kỳ 1-3, 5-6, 9",
    biasCeiling: "+0.3pp",
    summary: "Last Suggestive (Mega 6/45 ExpDecay_Cold) Reject Chu kỳ 9 split-half direction flip (h1 −0.26pp → h2 +0.37pp). Hiện 0 Accept, 0 Suggestive verified.",
    nextStep: "Chu kỳ 14 ready: Path #1 Online Bayesian Kalman (Mega 6/45 primary, Lotto 5/35 secondary).",
  },
];

// ============================================================
// Research story chapters (narrative, plain Vietnamese)
// ============================================================

const CHAPTERS = [
  {
    icon: "🧱",
    phase: "07/2025 – 02/2026",
    title: "Chương 1 — Baseline matrix",
    body: "Xây dựng ~20 strategies cho 3 matrix products (Power 6/55, Mega 6/45, Lotto 5/35): frequency (nóng/lạnh), absence, pattern, Bayesian Dirichlet, MaxEntropy, Adaptive, MinDistance. Walk-forward infra + Random baseline. Chưa có chiến lược nào vượt Random có ý nghĩa thống kê, nhưng chưa có significance test chính thức.",
    cycle: "Chu kỳ 1-3",
  },
  {
    icon: "🔬",
    phase: "03-04/2026",
    title: "Chương 2 — Phát hiện bias 3D",
    body: "Mở rộng sang 3D products. Chạy 13 bài test thống kê: RNG của Vietlott KHÔNG hoàn toàn đồng đều. Cụ thể digit 6 xuất hiện NHIỀU HƠN 10-11% so với kỳ vọng ở vị trí đơn vị (cả Max 3D lẫn Max 3D Pro). Các vị trí digit cũng không độc lập — có phụ thuộc thực giữa chúng.",
    cycle: "Chu kỳ 4",
  },
  {
    icon: "⚡",
    phase: "04/2026",
    title: "Chương 3 — Thử khai thác",
    body: "Thiết kế 21 chiến lược 3D khai thác bias (joint-digit, EV maximizer, multi-signal ensemble) + phase-B Lotto 5/35 wheeling + parity. Kết quả ban đầu hứa hẹn — nhiều chiến lược 'beat random' trên full-sample. Chu kỳ 5 wheeling 5/35 bị khám phá là artefact của bug sample-size → Reject. Chu kỳ 6 cài significance test z-test project-wide.",
    cycle: "Chu kỳ 4-6",
  },
  {
    icon: "🧪",
    phase: "04/2026",
    title: "Chương 4 — Replication gate cắt xuống",
    body: "Áp dụng split-half replication. 3D: EV Maximizer nửa đầu p=0.0007 (rất tốt) → nửa sau p=0.865 (fail hoàn toàn). 2/2 3D candidates Reject (Chu kỳ 7). Matrix: ExpDecay_Cold Mega 6/45 — h1 Δ=−0.26pp → h2 Δ=+0.37pp direction flip, Reject (Chu kỳ 9). Last Suggestive matrix bị loại bỏ.",
    cycle: "Chu kỳ 7-9",
  },
  {
    icon: "🚪",
    phase: "04/2026",
    title: "Chương 5 — Breakthrough 3D + đóng 3D",
    body: "Pivot sang paradigm mới: Copula (Path A), GBM tree-based (Path E), Cross-product pool (Path B). GBM show +3pp trên Max 3D Pro — nhưng audit Chu kỳ 12.5 confirm overfitting. Cả 3 path Reject qua 3-gate. 3D research line CHÍNH THỨC ĐÓNG sau Chu kỳ 13 (28 strategies tested, mechanism space exhausted).",
    cycle: "Chu kỳ 10-13",
  },
  {
    icon: "🧪",
    phase: "04/2026",
    title: "Chương 6 — Matrix exhausted + closure",
    body: "Chu kỳ 14 Online Bayesian Kalman 6/6 Reject. Chu kỳ 15 Cross-product 5/6 Reject. Chu kỳ 16 Kelly Portfolio 9/9 Reject. Chu kỳ 17 HMM 6/6 Reject. Cả 4 paths falsify → Chu kỳ 18 Project Closure Report. Chu kỳ 19 post-closure 5 mini-cycles. Chu kỳ 20 methodology refinement (Principle #17 family elimination). Chu kỳ 21 Hierarchical Bayesian 9/9 Reject (Bayesian family broadly eliminated).",
    cycle: "Chu kỳ 14-21",
  },
  {
    icon: "🎯",
    phase: "04/2026",
    title: "Chương 7 — Optimization Mode shipped",
    body: "Post-closure pivot: rank existing strategies cho UI thay vì tìm mechanism mới. Chu kỳ 22 ship 3 composite profiles (WinRate/ROI/Balanced) × 5 products + UI picks. 3/5 sản phẩm có valid picks, 2/5 null honest. 3 TS strategies mới ported (mindistance/coverageopt/pairexploiter). Chu kỳ 23 app-wide UX refactor (current).",
    cycle: "Chu kỳ 22-23",
  },
];

// ============================================================
// Current picks — 5 products × 1-2 picks (win rate vs ROI axes)
// aligned with /suggest SuggestionPanel + /algorithms RECOMMENDATIONS.
// Rule: pick by metric, exclude Reject-overfit/direction-flip strategies.
// If same strategy wins both → collapsed to 1 pick (roiPick omitted).
// ============================================================

type PickCard = { name: string; stat: string };
type CurrentPick = {
  product: string;
  family: "matrix" | "3d";
  color: string;
  emoji: string;
  winratePick: PickCard;
  roiPick?: PickCard;
  caveat: string;
  why: string;
};

const CURRENT_PICKS: CurrentPick[] = [
  {
    product: "Power 6/55",
    family: "matrix",
    color: "hsl(0, 72%, 51%)",
    emoji: "🔴",
    winratePick: { name: "🧠 Bayesian AI", stat: "Win 1.65%, Δ+0.031 avg, ROI −91.4% (cả 2 best)" },
    caveat: "Directional only (p=0.511, Δpp +0.19). Pareto-dominant — thắng cả 2 axes.",
    why: "Posterior Dirichlet wide (temp=1.0). Best-of-bad trong 7 strategies đã test Chu kỳ 1-6. Chu kỳ 14 Online Bayesian có thể cải thiện.",
  },
  {
    product: "Mega 6/45",
    family: "matrix",
    color: "hsl(217, 91%, 60%)",
    emoji: "🔵",
    winratePick: { name: "🧠 Bayesian AI Sharp", stat: "T=0.3, Win 3.14%" },
    roiPick: { name: "🎯 Phủ sóng tối đa", stat: "ROI −57.5%, Δ+0.010 avg (30pp tốt hơn Bayesian)" },
    caveat: "Ensemble + Bayesian AI tied Suggestive p=0.046 (full-sample) — replication chưa test. Principle #11 chưa Accept.",
    why: "Split axes: Bayesian Sharp max Win rate, Phủ sóng min lỗ. ExpDecay_Cold đã Reject Chu kỳ 9 (direction flip h1 −0.26pp → h2 +0.37pp).",
  },
  {
    product: "Lotto 5/35",
    family: "matrix",
    color: "hsl(142, 71%, 45%)",
    emoji: "🟢",
    winratePick: { name: "⚡ Tự động tối ưu", stat: "Win 1.90%, Δ+0.038 avg (cao nhất)" },
    roiPick: { name: "🎯 Phủ sóng tối đa", stat: "ROI −84.4% (tied với Bayesian, avg cao hơn)" },
    caveat: "Chưa significant (p>0.05). Sample N=539 nhỏ → power <80%. Chu kỳ 14 secondary target.",
    why: "Adaptive Win cao nhất. Phủ sóng lỗ ít nhất (10pp tốt hơn Adaptive). HybridParity Reject Chu kỳ 5 correction.",
  },
  {
    product: "Max 3D",
    family: "3d",
    color: "hsl(271, 91%, 65%)",
    emoji: "🟣",
    winratePick: { name: "🎯 Phủ sóng tối đa", stat: "Exact 2.22%, ROI −35.8% (cả 2 best)" },
    caveat: "Directional only (3D research line CLOSED Chu kỳ 13). Pareto-dominant trong UI-available non-overfit.",
    why: "CoverageOpt Win rate 2.22% + ROI −35.8% cả 2 best. JointBias Δ+0.305pp mechanism anchor nhưng bị dominated. 28/28 strategies Reject qua 3-gate.",
  },
  {
    product: "Max 3D Pro",
    family: "3d",
    color: "hsl(25, 95%, 53%)",
    emoji: "🟠",
    winratePick: { name: "🧬 Bias liên hợp", stat: "Exact 2.38%, ROI −31.5% (cả 2 best)" },
    caveat: "Directional only (p=0.137). EVMax ROI tốt hơn nhưng Reject Chu kỳ 7 (split-half h1 p=0.0007 → h2 p=0.865 flip).",
    why: "JointBias Pareto-dominant trong 3D Pro UI-available non-overfit. Δ+0.378pp within Principle #14 bias ceiling.",
  },
];

// ============================================================
// Cycles timeline (for technical detail section)
// ============================================================

const CYCLES_TIMELINE = [
  { id: "1", name: "Baseline Matrix Strategies", date: "07/2025", result: "10 thuật toán cơ bản: freq, absence, pattern — walk-forward infra" },
  { id: "2", name: "Research-backed Adds", date: "10/2025 – 01/2026", result: "Bayesian + MaxEntropy + Adaptive + MinDistance cho matrix" },
  { id: "3", name: "Matrix Consolidation", date: "02/2026", result: "Pattern #1 tổng hợp, Bayesian #1 Power 6/55" },
  { id: "4", name: "3D Deep Analysis + 21 Strategies", date: "03-04/2026", result: "13-test RNG framework, digit 6 bias phát hiện" },
  { id: "5", name: "Lotto 5/35 Wheeling + Parity", date: "04/2026", result: "Negative — wheeling Reject sau bug sample-size fix" },
  { id: "6", name: "Significance Test Enforcement", date: "04/2026", result: "Z-test wired project-wide; 3 candidates near-miss Suggestive" },
  { id: "7", name: "3D Split-half Replication", date: "04/2026", result: "2/2 Reject — EVMax dramatic flip, FreqWholeHot noise" },
  { id: "8", name: "3D Drift Verification (R1 Gate)", date: "04/2026", result: "No drift — bias stable. 3D paused, pivot Mega 6/45" },
  { id: "9", name: "Mega 6/45 ExpDecay_Cold Replication", date: "04/2026", result: "Reject — direction flip h1 −0.26pp → h2 +0.37pp. Last Suggestive matrix eliminated" },
  { id: "10", name: "Breakthrough Mode Pivot", date: "04/2026", result: "Tournament + multi-objective, Principles #11/#12 preserved" },
  { id: "11", name: "3D Copula (Path A)", date: "04/2026", result: "3/4 Reject + 1/4 Inconclusive — Copula thua JointBias heuristic" },
  { id: "12", name: "3D Tree-based GBM (Path E)", date: "04/2026", result: "Max 3D Reject (fwd flip −1.9pp), Max 3D Pro Technical Accept" },
  { id: "12.5", name: "GBM Audit (Diagnostic)", date: "04/2026", result: "No leak, overfit confirmed — Max 3D Pro GBM deprecated → Reject" },
  { id: "13", name: "3D Cross-product Pool (Path B)", date: "04/2026", result: "4/4 Reject — shared-RNG hypothesis falsified. 3D line CLOSED" },
  { id: "14", name: "Matrix Online Bayesian Kalman (pending)", date: "04/2026+", result: "Path #1 ready — primary Mega 6/45, secondary Lotto 5/35", pending: true },
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

// Show top-3 strategies per matrix product for outcome-landscape visualization
function MatrixOutcomeRow({ slug, label, color }: { slug: string; label: string; color: string }) {
  const bt = BACKTEST_MATRIX[slug];
  if (!bt) return null;
  // sort non-baseline strategies by delta desc, take top 3
  const top = bt.strategies
    .filter((s) => s.type !== "base")
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);
  const baselineWin = bt.baseline.winPct;
  return (
    <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: `${color}40`, background: `${color}08` }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-semibold text-sm" style={{ color }}>{label}</div>
        <div className="text-[10px] text-muted-foreground font-mono">
          N={bt.totalDraws} · baseline Win={baselineWin.toFixed(2)}%
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Strategy</TableHead>
            <TableHead className="text-center text-xs">Δ avg</TableHead>
            <TableHead className="text-center text-xs">Win%</TableHead>
            <TableHead className="text-center text-xs">p</TableHead>
            <TableHead className="text-center text-xs">Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {top.map((s) => (
            <TableRow key={s.name}>
              <TableCell className="text-xs font-medium">{s.name}</TableCell>
              <TableCell className={`text-xs text-center font-mono ${s.delta >= 0 ? "text-green-500" : "text-red-400"}`}>
                {s.delta >= 0 ? "+" : ""}{s.delta.toFixed(4)}
              </TableCell>
              <TableCell className="text-xs text-center font-mono">{s.winPct.toFixed(2)}%</TableCell>
              <TableCell className="text-xs text-center font-mono">
                {s.pValue != null ? formatPValue(s.pValue) : "—"}
              </TableCell>
              <TableCell className="text-center">
                <DecisionBadge d={s.decision as Decision} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
            🔬 Nghiên Cứu Thuật Toán Vietlott
          </h1>
          <Badge variant="destructive" className="text-xs">Breakthrough closed Chu kỳ 18</Badge>
          <Badge variant="default" className="text-xs">Chu kỳ 22 Optimization shipped · 2026-04-22</Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Dự án đã test ~69 chiến lược qua 22 chu kỳ trên 5 sản phẩm Vietlott. 21 cycles breakthrough research (0 Accept), kết thúc với
          PROJECT_CLOSURE_REPORT (Chu kỳ 18). Chu kỳ 22+ chuyển sang{" "}
          <strong>Optimization mode</strong> — rank existing strategies cho UI picks.
        </p>
        <div className="rounded-xl border-2 border-emerald-600/40 bg-emerald-600/5 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🧪</span>
            <div className="flex-1 space-y-1.5">
              <div className="text-sm font-bold">Chu kỳ 22 Optimization Mode — Rankings mới nhất</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                3 composite profiles (WinRate / ROI / Balanced) × 5 sản phẩm. Fresh re-backtest với split-half verification trên picks.
                3/5 sản phẩm có picks valid, 2/5 null honest (Mega 6/45 baseline drift, Max 3D Pro regime split).
              </p>
              <a href="/research/cycle22" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline">
                📊 Xem bảng xếp hạng đầy đủ · 3 profiles × ranked strategies →
              </a>
            </div>
          </div>
        </div>
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
              <strong>Có bias THẬT</strong> trong RNG 3D của Vietlott — digit 6 xuất hiện nhiều hơn 10-11%
              ở vị trí đơn vị. Matrix bias chưa confirm (Bayesian / Ensemble Suggestive full-sample nhưng
              replication chưa test).
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-orange-500 shrink-0">⚠</span>
            <p className="leading-relaxed">
              <strong>Nhưng bias quá nhỏ</strong> so với noise. Bias ceiling: 3D +0.4pp, Matrix +0.3pp.
              Với ~1,000-2,000 draws dữ liệu hiện tại, tín hiệu bị nhiễu (±0.44pp) che mờ — không thể khẳng định
              thuật toán nào thắng.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-red-500 shrink-0">✗</span>
            <p className="leading-relaxed">
              <strong>0/69 chiến lược đạt Accept</strong> qua quy trình 3-gate (full-sample + split-half
              replication + forward validation) sau 22 cycles. Last Suggestive eliminated Chu kỳ 9. 7 families
              eliminated Chu kỳ 14-21 (Adaptive / Cross-product / Kelly / HMM / GBM / Hybrid / Bayesian).
            </p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-500 shrink-0">🎯</span>
            <p className="leading-relaxed">
              <strong>Breakthrough closed Chu kỳ 18</strong>. <strong>Optimization shipped Chu kỳ 22</strong> — 3 composite profiles × 5 products, UI picks ship. Reopen breakthrough chỉ khi dữ liệu ≥2000 draws mỗi sản phẩm (~2027) hoặc novel paradigm.
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

      {/* ================== TWO RESEARCH LINES ================== */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🗂️</span> Hai dòng nghiên cứu — 3D vs Matrix
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {RESEARCH_LINES.map((line) => (
            <Card
              key={line.family}
              className="relative overflow-hidden"
              style={{ borderColor: `${line.color}60` }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: line.color }} />
              <CardHeader className="pl-6 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl">{line.emoji}</span>
                  <CardTitle className="text-base">{line.family}</CardTitle>
                  <Badge
                    variant={line.stateColor === "destructive" ? "destructive" : "default"}
                    className="text-[10px]"
                  >
                    {line.state}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pl-6 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Products: </span>
                    <span className="font-mono">{line.products}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Strategies: </span>
                    <span>{line.strategies}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Chu kỳ: </span>
                    <span className="font-mono">{line.cycles}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bias ceiling: </span>
                    <span className="font-mono font-bold" style={{ color: line.color }}>{line.biasCeiling}</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{line.summary}</p>
                <div className="rounded-md bg-muted/50 p-2 border-l-2" style={{ borderColor: line.color }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                    Next step
                  </div>
                  <div className="text-xs">{line.nextStep}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
            Matrix còn khó hơn: bias ceiling chỉ +0.3pp, và Power 6/55 (pool 55 số) có noise cao hơn.
          </p>

          {/* Visual: signal vs noise */}
          <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tín hiệu vs Nhiễu trên forward window (n=1,000)
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Tín hiệu 3D (bias ceiling)</span>
                  <span className="font-mono text-green-500">+0.4pp</span>
                </div>
                <div className="h-3 bg-muted rounded">
                  <div className="h-3 bg-green-500/70 rounded" style={{ width: "40%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Tín hiệu Matrix (bias ceiling)</span>
                  <span className="font-mono text-green-500">+0.3pp</span>
                </div>
                <div className="h-3 bg-muted rounded">
                  <div className="h-3 bg-green-500/50 rounded" style={{ width: "30%" }} />
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
              Chu kỳ 7 (EV Maximizer 3D), Chu kỳ 9 (ExpDecay_Cold Mega 6/45 — matrix direction flip),
              Chu kỳ 11 (Empirical Copula 3D), Chu kỳ 12 (GBM 3D), Chu kỳ 13 (Hierarchical Bayes 3D) —
              mọi chiến lược &ldquo;nhìn có edge&rdquo; trên backtest đều thất bại khi test lại trên dữ liệu mới.
              Signature overfitting điển hình, xuất hiện ở cả 2 dòng nghiên cứu.
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
            Đây là chọn lựa TỐT NHẤT trong các chọn lựa không-tốt, cho cả 5 sản phẩm.{" "}
            <strong>KHÔNG phải confirmed edge.</strong>
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CURRENT_PICKS.map((p) => (
            <div
              key={p.product}
              className="rounded-lg border-2 p-4 space-y-2.5"
              style={{ borderColor: `${p.color}40`, background: `${p.color}08` }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl">{p.emoji}</span>
                <span className="font-bold text-sm">{p.product}</span>
                <Badge className="ml-auto text-[10px] bg-orange-600 text-white">🔬 Directional</Badge>
              </div>
              {/* Win rate pick */}
              <div className="rounded-md border border-green-600/30 bg-green-600/5 p-2 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Badge className="text-[9px] px-1 py-0 bg-green-600 text-white">🎯 Win rate</Badge>
                  <span className="font-semibold text-sm">{p.winratePick.name}</span>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">{p.winratePick.stat}</div>
              </div>
              {/* ROI pick (only if different) */}
              {p.roiPick ? (
                <div className="rounded-md border border-yellow-600/30 bg-yellow-600/5 p-2 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Badge className="text-[9px] px-1 py-0 bg-yellow-600 text-white">💰 ROI</Badge>
                    <span className="font-semibold text-sm">{p.roiPick.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">{p.roiPick.stat}</div>
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground italic border-l-2 border-border pl-2">
                  Thắng cả 2 axes → 1 pick duy nhất
                </div>
              )}
              <div className="text-xs text-orange-600 dark:text-orange-400">
                ⚠ {p.caveat}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.why}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ================== 3D DIGIT BIAS (3D-specific viz) ================== */}
      <div>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <span>🎲</span> 3D — Bias digit đơn vị (Chu kỳ 4 discovery)
        </h2>
        <p className="text-xs text-muted-foreground mb-3 max-w-3xl">
          Phát hiện nền tảng cho toàn bộ 28 strategies 3D. Digit 6 nổi bật ở cả 2 products — cùng một
          pattern xuất hiện trên 1,776 draws. Tuy nhiên, Chu kỳ 7-13 chứng minh bias này KHÔNG exploitable.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Max 3D Pro</CardTitle>
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
              <CardTitle className="text-base">Max 3D</CardTitle>
              <p className="text-xs text-muted-foreground">Tỷ lệ O/E. Digit 6: <strong className="text-orange-500">+10.0%</strong> — cùng pattern với 3D Pro.</p>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {DIGIT_BIAS_POS2_MAX3D.map((d) => (
                <BiasBar key={d.digit} digit={d.digit} ratio={d.ratio} highlight={d.digit === 6} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ================== MATRIX OUTCOME LANDSCAPE ================== */}
      <div>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <span>🎰</span> Matrix — Top-3 strategies theo Δ, mỗi product
        </h2>
        <p className="text-xs text-muted-foreground mb-3 max-w-3xl">
          Matrix không có &ldquo;smoking gun&rdquo; như 3D digit bias. Thay vào đó, xem top strategies ranked by Δ
          avg_matches (cao hơn = better than Random). Hầu hết p-values {">"}  0.05 → không significant.
          Chỉ Mega 6/45 Ensemble + Bayesian AI đạt Suggestive full-sample (p=0.046) — replication chưa test (Chu kỳ 14 target).
        </p>
        <div className="space-y-3">
          <MatrixOutcomeRow slug="power-655" label="Power 6/55" color="hsl(0, 72%, 51%)" />
          <MatrixOutcomeRow slug="power-645" label="Mega 6/45" color="hsl(217, 91%, 60%)" />
          <MatrixOutcomeRow slug="power-535" label="Lotto 5/35" color="hsl(142, 71%, 45%)" />
        </div>
      </div>

      {/* ================== FUTURE / REVISIT ================== */}
      <div>
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
          <span>🔮</span> Kế hoạch kế tiếp — theo từng dòng nghiên cứu
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {/* 3D column */}
          <Card style={{ borderColor: "hsl(271, 91%, 65%)40" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>🎲</span> 3D (CLOSED) — Khi nào mở lại?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: "📊", title: "Data mở rộng", body: "Chờ ~500 draws thêm (Max 3D Pro → 1,500 draws). Timeframe: ~2027-2028 với tần suất hiện tại (180/năm)." },
                { icon: "💡", title: "Novel bias dimension", body: "Time-of-draw, machine serial, cross-time patterns, operator schedule artifacts." },
                { icon: "📋", title: "RNG audit công khai", body: "Nếu Vietlott / regulator công bố phương pháp RNG → có thể target cấu trúc toán học cụ thể." },
              ].map((c, i) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-1 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.icon}</span>
                    <span className="font-semibold text-sm">{c.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          {/* Matrix column */}
          <Card style={{ borderColor: "hsl(217, 91%, 60%)40" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span>🎰</span> Matrix (ACTIVE) — Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: "⭐", title: "Path #1 Online Bayesian (Chu kỳ 14, ready)", body: "Kalman-style forgetting α_t = (1−λ)·α_{t−1} + obs_t. Primary: Mega 6/45 (N=1302). Secondary: Lotto 5/35. Effort 1-2 ngày." },
                { icon: "🔗", title: "Path #3 Cross-product joint model", body: "Share data across Mega/Power/Lotto để cải thiện P estimates (3× effective data). Novelty cao." },
                { icon: "💰", title: "Path #2 Kelly portfolio (ROI-axis)", body: "Multi-ticket portfolio optimization. Indirect cho win-rate nhưng meaningful cho ROI — demoted sau Chu kỳ 10 refine." },
              ].map((c, i) => (
                <div key={i} className="rounded-lg border border-border p-3 space-y-1 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.icon}</span>
                    <span className="font-semibold text-sm">{c.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
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
            <h3 className="font-semibold text-base mb-3">🔄 Timeline {CYCLES_TIMELINE.length} chu kỳ</h3>
            <div className="space-y-2">
              {CYCLES_TIMELINE.map((c) => (
                <div key={c.id} className={`flex gap-3 border-l-2 pl-3 py-1 ${c.pending ? "border-blue-500" : "border-muted"}`}>
                  <Badge variant={c.pending ? "default" : "outline"} className="shrink-0 font-mono text-[10px]">Chu kỳ {c.id}</Badge>
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
            <h3 className="font-semibold text-base mb-3">🧪 10 bài test kiểm định RNG (3D)</h3>
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
              Matrix products chưa chạy bộ test này — digit-level bias concept không trực tiếp áp dụng cho matrix (5-6 số từ pool 35-55).
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
            <code className="font-mono bg-muted px-1 rounded">website/research/matrix/</code>,{" "}
            <code className="font-mono bg-muted px-1 rounded">METHODOLOGY.md</code>, và per-cycle files trong{" "}
            <code className="font-mono bg-muted px-1 rounded">website/research/history/</code>.
          </p>
        </div>
      </details>

      {/* ================== DISCLAIMER ================== */}
      <div className="rounded-lg border border-yellow-600/40 bg-yellow-600/5 px-4 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>⚠️ Disclaimer:</strong> Nghiên cứu này chỉ mang tính giáo dục và thử nghiệm trên cả 5 sản phẩm Vietlott.
          Xổ số là trò chơi có kỳ vọng âm — <strong>không có thuật toán nào đảm bảo lợi nhuận</strong>.
          Mọi research pick trên đây là directional only (nhắm đúng hướng bias), chưa được xác nhận
          thống kê có edge thực qua 3-gate protocol. Không nên đánh cược nhiều hơn số tiền bạn có thể chịu mất.
        </p>
      </div>
    </div>
  );
}

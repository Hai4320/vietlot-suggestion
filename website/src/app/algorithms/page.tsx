import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BACKTEST_MATRIX, BACKTEST_3D } from "@/lib/backtest-data";
import { CYCLE22_PRODUCTS, type C22ProfileName } from "@/lib/cycle22-data";
import { SortableBacktestTable, type BacktestRow } from "@/components/algorithms/SortableBacktestTable";

// ============================================================
// /algorithms — 13 UI strategies + Chu kỳ 22 rankings compact
// Chu kỳ 23 rewrite (2026-04-22): 1088 → ~350 lines
// ============================================================

export const metadata = {
  title: "Thuật toán gợi ý — Vietlott",
  description: "13 thuật toán UI + bảng xếp hạng Chu kỳ 22 (3 composite profiles × 5 sản phẩm).",
};

type Scope = "matrix" | "3d" | "both" | "power-535";
type Origin = "builtin" | "papers" | "research" | "c22";

interface UIStrategy {
  id: string;
  emoji: string;
  name: string;
  scope: Scope;
  origin: Origin;
  blurb: string; // one-liner
  source?: string; // short ref
}

const STRATEGIES: UIStrategy[] = [
  // Chu kỳ 22 picks (research-layer ports) — prioritized at top
  {
    id: "mindistance",
    emoji: "📐",
    name: "Khoảng cách đa dạng",
    scope: "matrix",
    origin: "c22",
    blurb: "Dirichlet sample + Jaccard diversity — vé khác biệt tối đa",
    source: "Chu kỳ 22 Power 6/55 winner",
  },
  {
    id: "pairexploiter",
    emoji: "🔗",
    name: "Khai thác cặp chữ số",
    scope: "3d",
    origin: "c22",
    blurb: "O/E synergy của 3 cặp vị trí — khai thác non-independence",
    source: "Chu kỳ 22 Max 3D winrate (p=0.038)",
  },
  {
    id: "coverageopt",
    emoji: "🎪",
    name: "Phủ không gian",
    scope: "3d",
    origin: "c22",
    blurb: "Frequency + digit-distance diversity",
    source: "Chu kỳ 22 Max 3D ROI pick",
  },
  // Original research
  {
    id: "pattern",
    emoji: "🔮",
    name: "Mẫu cấu trúc",
    scope: "both",
    origin: "research",
    blurb: "Spacing + phân bố vùng số",
    source: "Phase 1 analysis",
  },
  {
    id: "jointbias",
    emoji: "🧬",
    name: "Bias liên hợp",
    scope: "3d",
    origin: "research",
    blurb: "Phân bố đồng thời 3 chữ số — khai thác digit bias",
    source: "Chu kỳ 4 RNG analysis",
  },
  {
    id: "evmax",
    emoji: "💰",
    name: "EV tối đa",
    scope: "3d",
    origin: "research",
    blurb: "Expected value × exponential decay",
    source: "Phase 4 tier analysis",
  },
  {
    id: "hybridparity",
    emoji: "🎰",
    name: "Hybrid Parity",
    scope: "power-535",
    origin: "research",
    blurb: "Wheeling đa vé: parity + Hamming diversity",
    source: "Chu kỳ 5 — p=0.301 Reject",
  },
  // Papers-backed
  {
    id: "bayesian",
    emoji: "🧠",
    name: "Bayesian AI",
    scope: "both",
    origin: "papers",
    blurb: "Dirichlet posterior sampling",
    source: "Marsaglia & Tsang (2000)",
  },
  {
    id: "maxentropy",
    emoji: "🎯",
    name: "Phủ sóng tối đa",
    scope: "both",
    origin: "papers",
    blurb: "Max entropy + stratified coverage",
    source: "Jaynes (1957)",
  },
  {
    id: "adaptive",
    emoji: "⚡",
    name: "Tự động tối ưu",
    scope: "both",
    origin: "papers",
    blurb: "Walk-forward window tuning",
    source: "Pardo (2008)",
  },
  // Built-in baselines
  {
    id: "frequency",
    emoji: "📊",
    name: "Tần suất cao",
    scope: "both",
    origin: "builtin",
    blurb: "Hot numbers — xuất hiện nhiều nhất",
  },
  {
    id: "absence",
    emoji: "⏳",
    name: "Số vắng lâu",
    scope: "both",
    origin: "builtin",
    blurb: "Cold numbers — Gambler's Fallacy",
  },
  {
    id: "mixed",
    emoji: "🎲",
    name: "Kết hợp nóng–lạnh",
    scope: "both",
    origin: "builtin",
    blurb: "Ensemble đơn giản",
  },
];

const SCOPE_META: Record<Scope, { label: string; color: string }> = {
  matrix: { label: "Ma trận", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  "3d": { label: "3D", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  both: { label: "Cả 2", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  "power-535": { label: "5/35", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
};

const ORIGIN_META: Record<Origin, { label: string; color: string }> = {
  c22: { label: "🧪 C22", color: "bg-primary/15 text-primary" },
  research: { label: "🔬 Research", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  papers: { label: "📚 Papers", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" },
  builtin: { label: "Cơ bản", color: "bg-muted text-muted-foreground" },
};

const PROFILE_META: Record<C22ProfileName, { icon: string; label: string }> = {
  winrate: { icon: "🎯", label: "Trúng" },
  roi: { icon: "💰", label: "Lỗ ít" },
  balanced: { icon: "⚖", label: "Cân bằng" },
};

function formatDelta(n: number, digits = 2) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}`;
}

type MatrixSlug = "power-655" | "power-645" | "power-535";
type ThreeDSlug = "max-3d" | "max-3d-pro";

// Historical strategy names duplicated in Chu kỳ 22 re-backtest → skip (use C22 fresh data)
const HIST_SKIP = new Set([
  "Random", "Tần suất cao", "★ Mẫu cấu trúc", "Mẫu cấu trúc",
  "★ Phủ sóng tối đa", "Phủ sóng tối đa", "★ Phủ sóng tối đa (CoverageOpt)",
  "★ Bayesian AI", "★ Bayesian AI (Sharp)",
  "★ Tự động tối ưu", "★ Bayes_Sharp", "★ Ensemble", "★ Khoảng cách tối đa",
  "Số vắng lâu", "Suy giảm hàm mũ (Cold)", "ExpDecay_Cold", "Freq_Cold",
  "NotRepeat", "Pattern", "ExpDecay_Hot", "PairFreq",
  "Tần suất cặp", "Tần suất cao (FreqWholeHot)",
  "🧬 Bias liên hợp (JointBias)", "💰 EV tối đa (EVMaximizer)",
  "PairExploiter (T=0.5)", "TierWeighted", "ULTIMATE_v1", "ULTIMATE_v2_sharp",
  "BayesJoint (HL=150 Sharp)",
]);

/** Build merged rows — Chu kỳ 22 fresh data priority, historical-only as fallback. */
function buildMatrixRows(productSlug: MatrixSlug, c22Slug: string): BacktestRow[] {
  const rows: BacktestRow[] = [];
  const c22 = CYCLE22_PRODUCTS.find((p) => p.slug === c22Slug);
  // C22 fresh rows (use balanced profile — raw data same across profiles)
  if (c22) {
    for (const e of c22.rankings.balanced) {
      rows.push({
        name: e.strategy,
        metric: e.raw.raw_primary_pct,
        roi: e.raw.raw_roi_pct,
        deltaWin: e.raw.delta_win_pp,
        deltaRoi: e.raw.delta_roi_pct,
        pValue: e.raw.p_value_raw,
        source: "c22",
        excluded: e.strategy === "Random" ? false : !e.pick_eligible,
      });
    }
  }
  // Historical-only rows (not covered by C22)
  const hist = BACKTEST_MATRIX[productSlug];
  if (hist) {
    for (const s of hist.strategies) {
      if (HIST_SKIP.has(s.name)) continue;
      rows.push({
        name: s.name,
        metric: s.winPct,
        roi: s.roi,
        pValue: s.pValue,
        source: "historical",
        decision: s.decision,
        excluded: s.decision === "Reject",
      });
    }
  }
  return rows;
}

function build3DRows(productSlug: ThreeDSlug, c22Slug: string): BacktestRow[] {
  const rows: BacktestRow[] = [];
  const c22 = CYCLE22_PRODUCTS.find((p) => p.slug === c22Slug);
  if (c22) {
    for (const e of c22.rankings.balanced) {
      rows.push({
        name: e.strategy,
        metric: e.raw.raw_primary_pct,
        roi: e.raw.raw_roi_pct,
        deltaWin: e.raw.delta_win_pp,
        deltaRoi: e.raw.delta_roi_pct,
        pValue: e.raw.p_value_raw,
        source: "c22",
        excluded: e.strategy === "Random" ? false : !e.pick_eligible,
      });
    }
  }
  const hist = BACKTEST_3D[productSlug];
  if (hist) {
    for (const s of hist.strategies) {
      if (HIST_SKIP.has(s.name)) continue;
      rows.push({
        name: s.name,
        metric: s.exactPct,
        roi: s.roi,
        pValue: s.pValue,
        source: "historical",
        decision: s.decision,
        excluded: s.decision === "Reject",
      });
    }
  }
  return rows;
}

export default function AlgorithmsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-10">
      {/* Hero */}
      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold tracking-tight">🔬 Thuật toán gợi ý</h1>
          <Badge variant="outline">13 UI · 69 đã test</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          13 thuật toán triển khai UI (có thể dùng trực tiếp ở <Link href="/suggest" className="underline">/suggest</Link>) +
          69 chiến lược đã nghiên cứu qua 22 cycles. Picks hiện tại theo Chu kỳ 22 Optimization mode.
        </p>
      </header>

      {/* Chu kỳ 22 picks — strategy focus */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">🎯 Chu kỳ 22 — Picks theo sản phẩm</h2>
        <p className="text-xs text-muted-foreground">
          3 composite profiles rank strategies (WinRate / ROI / Balanced). Split-half verify trên picks. Null = không pick nào đủ tin cậy (honest).
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Sản phẩm</th>
                <th className="text-left px-3 py-2 font-semibold">🎯 Trúng</th>
                <th className="text-left px-3 py-2 font-semibold">💰 Lỗ ít</th>
                <th className="text-left px-3 py-2 font-semibold">⚖ Cân bằng</th>
                <th className="text-left px-3 py-2 font-semibold">Collapse</th>
              </tr>
            </thead>
            <tbody>
              {CYCLE22_PRODUCTS.map((p) => (
                <tr key={p.slug} className="border-t">
                  <td className="px-3 py-2 font-semibold">
                    <Link href={`/suggest?p=${p.slug}`} className="hover:underline">{p.label}</Link>
                    <div className="text-[10px] text-muted-foreground font-normal">N={p.n_draws.toLocaleString()}</div>
                  </td>
                  {(["winrate", "roi", "balanced"] as C22ProfileName[]).map((pn) => {
                    const pick = p.picks[pn];
                    return (
                      <td key={pn} className="px-3 py-2">
                        {pick ? (
                          <div>
                            <div className="font-mono text-[11px]">{pick.strategy}</div>
                            <div className="text-[10px] text-muted-foreground">
                              rank #{pick.composite_rank}, comp {formatDelta(pick.composite_score, 2)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">null</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2">
                    <Badge variant={p.collapse_applied === "none" ? "outline" : "secondary"} className="text-[10px]">
                      {p.collapse_applied === "none" ? "3 picks" : p.collapse_applied}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          Chi tiết full rankings (top N per profile per product): <Link href="/research#cycle22" className="underline">/research#cycle22</Link>.
        </p>
      </section>

      {/* 13 UI Strategies */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">🧩 13 thuật toán UI</h2>
        <p className="text-xs text-muted-foreground">
          Click vào dòng để thử ngay. Scope = sản phẩm áp dụng. Origin = nguồn gốc (cơ bản / paper / research / Chu kỳ 22 port).
        </p>
        <div className="grid gap-2">
          {STRATEGIES.map((s) => (
            <Link
              key={s.id}
              href={`/suggest`}
              className="flex items-start gap-3 rounded-lg border p-3 hover:border-primary/40 hover:bg-primary/[0.02] transition-colors"
            >
              <div className="text-2xl shrink-0 w-10 text-center">{s.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold">{s.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${SCOPE_META[s.scope].color}`}>
                    {SCOPE_META[s.scope].label}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ORIGIN_META[s.origin].color}`}>
                    {ORIGIN_META[s.origin].label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.blurb}</p>
                {s.source && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono italic">{s.source}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Backtest data per product — sortable, merged C22 fresh + historical */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">📊 Dữ liệu backtest per sản phẩm</h2>
        <p className="text-xs text-muted-foreground">
          Merged: Chu kỳ 22 fresh re-backtest (rows badged <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-primary/15 text-primary font-semibold">🔄 C22</span>) + historical strategies (excluded/không port vào C22).
          Click tiêu đề cột để sort (theo % trúng, ROI, Δ, p-value).
        </p>

        <div className="grid gap-3">
          {/* Matrix */}
          {([
            { slug: "power-655" as MatrixSlug, c22: "power-655" },
            { slug: "power-645" as MatrixSlug, c22: "power-645" },
            { slug: "power-535" as MatrixSlug, c22: "power-535" },
          ]).map(({ slug, c22 }) => {
            const d = BACKTEST_MATRIX[slug];
            const rows = buildMatrixRows(slug, c22);
            const freshCount = rows.filter((r) => r.source === "c22").length;
            return (
              <details key={slug} className="group rounded-lg border open:bg-muted/10">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{d?.label ?? slug}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {rows.length} strategies ({freshCount} fresh C22 + {rows.length - freshCount} historical)
                      {d && ` · baseline ${d.baseline.winPct.toFixed(2)}%`}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground group-open:hidden">▼ mở</span>
                  <span className="text-xs text-muted-foreground hidden group-open:inline">▲ thu gọn</span>
                </summary>
                <div className="px-3 pb-3">
                  <SortableBacktestTable rows={rows} metricLabel="Win %" defaultSort="metric" />
                </div>
              </details>
            );
          })}

          {/* 3D */}
          {([
            { slug: "max-3d" as ThreeDSlug, c22: "max-3d" },
            { slug: "max-3d-pro" as ThreeDSlug, c22: "max-3d-pro" },
          ]).map(({ slug, c22 }) => {
            const d = BACKTEST_3D[slug];
            const rows = build3DRows(slug, c22);
            const freshCount = rows.filter((r) => r.source === "c22").length;
            return (
              <details key={slug} className="group rounded-lg border open:bg-muted/10">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{d?.label ?? slug}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {rows.length} strategies ({freshCount} fresh C22 + {rows.length - freshCount} historical)
                      {d && ` · baseline ${d.baseline.exactPct.toFixed(2)}%`}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground group-open:hidden">▼ mở</span>
                  <span className="text-xs text-muted-foreground hidden group-open:inline">▲ thu gọn</span>
                </summary>
                <div className="px-3 pb-3">
                  <SortableBacktestTable rows={rows} metricLabel="Exact %" defaultSort="metric" />
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* Closing disclaimer */}
      <footer className="rounded-lg border border-orange-500/40 bg-orange-500/5 p-4 space-y-2">
        <div className="text-sm font-semibold">⚠ Đọc trước khi chơi</div>
        <p className="text-xs leading-relaxed">
          Xổ số Vietlott là −EV system (kỳ vọng âm). Sau 22 cycles × 69 strategies × 3-gate protocol:{" "}
          <strong>0 Accept/Suggestive robust</strong>. Picks hiển thị chỉ là directional — composite tournament winner, không confirmed edge.
          ROI thực tế từ −26% đến −97% tùy product. Chơi có trách nhiệm.
        </p>
        <p className="text-[11px] text-muted-foreground pt-1 border-t border-orange-500/20 flex flex-wrap gap-3">
          <Link href="/research" className="underline">📊 Nghiên cứu chi tiết</Link>
          <Link href="/glossary" className="underline">📚 Thuật ngữ + principles</Link>
          <Link href="/suggest" className="underline">🎯 Gợi ý ngay</Link>
        </p>
      </footer>
    </div>
  );
}


import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CYCLE22_PRODUCTS, CYCLE22_TIMESTAMP, C22_PROFILES, type C22ProfileName } from "@/lib/cycle22-data";

// ============================================================
// /research — chronological + compact. Chu kỳ 22 inline.
// ============================================================

const KEY_STATS = [
  { label: "Chu kỳ", value: "22", sub: "07/2025 → 04/2026" },
  { label: "Chiến lược đã test", value: "69", sub: "Matrix + 3D, 7 families" },
  { label: "Draws dữ liệu", value: "4,955", sub: "5 products" },
  { label: "Accept confirmed", value: "0", sub: "Breakthrough closed Chu kỳ 18", alert: true },
];

const TIMELINE = [
  {
    phase: "Chương 1 — Baseline",
    cycles: "Chu kỳ 1-3",
    title: "Matrix foundations",
    body: "10 baseline strategies (frequency / absence / pattern / Bayesian / MaxEntropy / ensemble) × 3 matrix products. Walk-forward infra + z-test vs Random.",
    verdict: "directional",
  },
  {
    phase: "Chương 2 — 3D deep",
    cycles: "Chu kỳ 4-8",
    title: "RNG bias phát hiện",
    body: "13-test RNG battery trên Max 3D + Max 3D Pro. Bias thật ở digit 6 vị trí đơn vị (+10-11%). Chi² independence p<0.001 cho 3 position pairs. Split-half replication (Chu kỳ 7) — 2/2 candidates Reject do direction flip.",
    verdict: "bias real, not exploitable",
  },
  {
    phase: "Chương 3 — Matrix exhaust",
    cycles: "Chu kỳ 9-10",
    title: "Last Suggestive eliminated + pivot",
    body: "ExpDecay_Cold Mega 6/45 split-half Reject (h1 −0.26pp → h2 +0.37pp flip). Pivot Chu kỳ 10 sang breakthrough mode: tournament composite §8, forward validation primary signal.",
    verdict: "0 Suggestive verified",
  },
  {
    phase: "Chương 4 — 3D breakthrough",
    cycles: "Chu kỳ 11-13",
    title: "Copula / GBM / Pool — all Reject",
    body: "Empirical Copula (Path A) 3/4 Reject. GBM tree-based (Path E) +3pp full-sample nhưng Chu kỳ 12.5 audit confirm overfitting (Principles #14/#15 codified). Cross-product pool (Path B) 4/4 Reject. 3D mechanism space exhausted.",
    verdict: "3D research CLOSED",
  },
  {
    phase: "Chương 5 — Matrix paradigms",
    cycles: "Chu kỳ 14-17",
    title: "Online Bayes / Cross-product / Kelly / HMM — all Reject",
    body: "Chu kỳ 14 Online Bayesian Kalman 6/6 Reject (adaptive family eliminated). Chu kỳ 15 Cross-product 5/6 Reject. Chu kỳ 16 Kelly Portfolio 9/9 Reject với Δ dramatic −28pp (set-coverage ⊥ concentration). Chu kỳ 17 HMM 6/6 Reject (Principle #15 collapse, Principle #16 retry tree codified).",
    verdict: "4 families eliminated",
  },
  {
    phase: "Chương 6 — Closure",
    cycles: "Chu kỳ 18-21",
    title: "Project closure + methodology refine",
    body: "Chu kỳ 18 PROJECT_CLOSURE_REPORT. Chu kỳ 19 post-closure 5 mini-cycles (FDR / ROI rank / NIST / seasonality / ensemble). Chu kỳ 20 methodology refinement (Principle #17 family elimination binding). Chu kỳ 21 Hierarchical Bayesian 9/9 Reject (Bayesian family broadly eliminated).",
    verdict: "breakthrough CLOSED, 7 families eliminated",
  },
  {
    phase: "Chương 7 — Optimization",
    cycles: "Chu kỳ 22+",
    title: "UI picks shipped",
    body: "Post-closure pivot: rank existing strategies theo 3 composite profiles (WinRate / ROI / Balanced) cho UI picks. 3/5 products có valid picks, 2/5 null honest. 3 TS strategies mới ported. Chu kỳ 23 app-wide UX refactor (current).",
    verdict: "shipped 2026-04-22",
  },
];

const PRINCIPLES = [
  { n: 11, title: "Split-half replication mandatory", origin: "C7+9" },
  { n: 12, title: "Variable-baseline power analysis (BINDING C20)", origin: "C8+9" },
  { n: 13, title: "Forward gate mandatory (3-gate stacked)", origin: "C7,9,11-13" },
  { n: 14, title: "Magnitude sanity (auto-flag |Δ| > 3× ceiling)", origin: "C12+12.5" },
  { n: 15, title: "Prediction concentration check (ML)", origin: "C12.5" },
  { n: 16, title: "Retry tree + optionality preservation", origin: "C17" },
  { n: 17, title: "Family-level elimination binding", origin: "C20" },
];

const RNG_FINDINGS = [
  { test: "Chi² digit distribution", result: "Stable across time", verdict: "✓ passes" },
  { test: "Digit 6 bias (unit position)", result: "+10-11% both 3D products", verdict: "⚠ real bias" },
  { test: "Position independence", result: "p<0.001 cho 3 pair positions", verdict: "⚠ dependent" },
  { test: "Serial correlation", result: "p≈0.96 no autocorrelation", verdict: "✓ passes" },
  { test: "Drift homogeneity (Chu kỳ 8)", result: "No shift across 3 windows", verdict: "✓ stable" },
  { test: "NIST battery (Chu kỳ 19c)", result: "Uniform all 5 products", verdict: "✓ passes" },
];

const PROFILE_META: Record<C22ProfileName, { icon: string; label: string }> = {
  winrate: { icon: "🎯", label: "Trúng" },
  roi: { icon: "💰", label: "Lỗ ít" },
  balanced: { icon: "⚖", label: "Cân bằng" },
};

function formatNum(n: number, digits = 2) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}`;
}

export default function ResearchPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-10">
      {/* Hero */}
      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold tracking-tight">🔬 Nghiên cứu Vietlott</h1>
          <Badge variant="destructive" className="text-xs">Breakthrough closed</Badge>
          <Badge variant="default" className="text-xs">Chu kỳ 22 shipped</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          22 chu kỳ nghiên cứu nghiêm ngặt, 69 chiến lược, 5 sản phẩm. Kết quả: <strong>0 Accept</strong>.
          Chu kỳ 22 chuyển sang Optimization mode — rank existing strategies cho UI picks.
        </p>
      </header>

      {/* Key stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KEY_STATS.map((s) => (
          <Card key={s.label} className={s.alert ? "border-red-500/40 bg-red-500/5" : ""}>
            <CardContent className="p-4">
              <div className={`text-3xl font-extrabold ${s.alert ? "text-red-500" : "text-primary"}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 font-semibold">{s.label}</div>
              <div className="text-[10px] text-muted-foreground/80 mt-0.5 leading-tight">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Chu kỳ 22 picks — inline (merged from /research/cycle22) */}
      <section id="cycle22" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold">🎯 Chu kỳ 22 — Picks hiện tại</h2>
          <span className="text-[11px] text-muted-foreground">Updated {CYCLE22_TIMESTAMP}</span>
        </div>
        <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground leading-relaxed">
          3 composite profiles rank strategies theo ưu tiên khác nhau. Split-half verify trên picks — retry ≤ 3 lần; flip hết → null (honest).
          Pick = composite winner, <strong>không đảm bảo beat Random</strong>. Weights: {" "}
          {(Object.entries(C22_PROFILES) as [C22ProfileName, (typeof C22_PROFILES)[C22ProfileName]][]).map(([k, w], i) => (
            <span key={k} className="font-mono text-[10px]">
              {i > 0 && " · "}
              {PROFILE_META[k].icon} {k}={w.w_win}/{w.w_roi}/{w.w_sharpe}/{w.w_neg_log_p}
            </span>
          ))}
        </div>
        <div className="grid gap-3">
          {CYCLE22_PRODUCTS.map((p) => {
            const anyPick = !!(p.picks.winrate || p.picks.roi || p.picks.balanced);
            return (
              <details key={p.slug} className="group rounded-lg border open:bg-muted/10">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{p.label}</span>
                    <span className="text-[10px] text-muted-foreground">N={p.n_draws.toLocaleString()}</span>
                    {!anyPick ? (
                      <Badge variant="outline" className="text-[10px] border-orange-500/40 text-orange-600">null picks</Badge>
                    ) : (
                      <div className="flex gap-1">
                        {(["winrate", "roi", "balanced"] as C22ProfileName[]).map((pn) => {
                          const pick = p.picks[pn];
                          if (!pick) return null;
                          return (
                            <span key={pn} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {PROFILE_META[pn].icon} {pick.strategy}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground group-open:hidden">▼</span>
                  <span className="text-xs text-muted-foreground hidden group-open:inline">▲</span>
                </summary>
                <div className="px-3 pb-3 pt-0 space-y-2">
                  {!anyPick ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Mọi top candidate flip split-half direction (3/3 retries). Honest outcome theo Principle #11 — không pick nào đủ tin cậy.
                    </p>
                  ) : null}
                  {(["winrate", "roi", "balanced"] as C22ProfileName[]).map((pn) => (
                    <div key={pn} className="rounded border bg-background/50 p-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">
                          {PROFILE_META[pn].icon} {PROFILE_META[pn].label}
                        </span>
                        {p.picks[pn] ? (
                          <span className="font-mono text-[11px]">{p.picks[pn]!.strategy}</span>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">null (flip)</span>
                        )}
                      </div>
                      <div className="mt-1 overflow-x-auto">
                        <table className="w-full text-[10px] font-mono">
                          <thead className="text-muted-foreground">
                            <tr>
                              <th className="text-right px-1 w-8">#</th>
                              <th className="text-left px-1">Strategy</th>
                              <th className="text-right px-1 w-16">comp</th>
                              <th className="text-right px-1 w-16">Δ_win</th>
                              <th className="text-right px-1 w-16">Δ_roi</th>
                              <th className="text-right px-1 w-12">p</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.rankings[pn].slice(0, 5).map((e) => (
                              <tr key={e.strategy} className="border-t border-muted/30">
                                <td className="text-right px-1 text-muted-foreground">{e.rank}</td>
                                <td className="px-1 truncate">{e.strategy}</td>
                                <td className="text-right px-1">{formatNum(e.composite, 3)}</td>
                                <td className={`text-right px-1 ${e.raw.delta_win_pp > 0 ? "text-green-600 dark:text-green-400" : e.raw.delta_win_pp < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                                  {formatNum(e.raw.delta_win_pp, 3)}
                                </td>
                                <td className={`text-right px-1 ${e.raw.delta_roi_pct > 0 ? "text-green-600 dark:text-green-400" : e.raw.delta_roi_pct < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                                  {formatNum(e.raw.delta_roi_pct, 1)}
                                </td>
                                <td className="text-right px-1 text-muted-foreground">
                                  {e.raw.p_value_raw < 0.001 ? "<.001" : e.raw.p_value_raw.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {p.rankings[pn].length > 5 && (
                          <div className="text-[10px] text-muted-foreground/60 mt-0.5 italic">
                            Hiển thị top 5/{p.rankings[pn].length}. Full ranking trong <code className="font-mono text-[9px]">research/optimization/cycle22_rankings.json</code>.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">📅 Dòng thời gian 22 chu kỳ</h2>
        <div className="space-y-2">
          {TIMELINE.map((t, i) => (
            <details key={i} className="group rounded-lg border open:bg-muted/10">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-foreground">{t.cycles}</span>
                  <span className="font-semibold text-sm">{t.phase}</span>
                  <span className="text-xs text-muted-foreground">— {t.title}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">{t.verdict}</Badge>
              </summary>
              <p className="px-3 pb-3 pt-0 text-xs text-muted-foreground leading-relaxed">{t.body}</p>
            </details>
          ))}
        </div>
      </section>

      {/* RNG findings */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">🎲 RNG findings</h2>
        <p className="text-xs text-muted-foreground">Kết luận bias audit sau 22 cycles — bias real ở 3D digit-level, nhưng không exploitable.</p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Test</th>
                <th className="text-left px-3 py-2">Result</th>
                <th className="text-left px-3 py-2">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {RNG_FINDINGS.map((r) => (
                <tr key={r.test} className="border-t">
                  <td className="px-3 py-1.5 font-mono text-[11px]">{r.test}</td>
                  <td className="px-3 py-1.5">{r.result}</td>
                  <td className="px-3 py-1.5">{r.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Principles */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">📐 Principles corpus (codified từ negative results)</h2>
        <p className="text-xs text-muted-foreground">7 methodology principles sinh ra từ failures — chi tiết trong <Link href="/glossary" className="underline">/glossary</Link>.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRINCIPLES.map((p) => (
            <div key={p.n} className="rounded-lg border p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold">#{p.n} {p.title}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{p.origin}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <footer className="rounded-lg border border-orange-500/40 bg-orange-500/5 p-4 text-sm space-y-2">
        <div className="font-semibold">⚠ Kết luận</div>
        <p className="text-xs leading-relaxed">
          22 chu kỳ × 69 chiến lược × 3-gate protocol: <strong>không thuật toán nào đảm bảo lợi nhuận</strong>.
          Chu kỳ 22 picks là best-of-null-field theo composite tournament — directional only.
          Vietlott là −EV system. Chơi có trách nhiệm.
        </p>
        <p className="text-[11px] text-muted-foreground pt-1 border-t border-orange-500/20 flex flex-wrap gap-3">
          <Link href="/algorithms" className="underline">🔬 13 thuật toán UI + 69 đã test</Link>
          <Link href="/glossary" className="underline">📚 Thuật ngữ + 7 principles</Link>
          <Link href="/suggest" className="underline">🎯 Gợi ý số</Link>
        </p>
      </footer>
    </div>
  );
}

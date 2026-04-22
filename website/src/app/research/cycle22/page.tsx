import Link from "next/link";
import {
  CYCLE22_PRODUCTS,
  CYCLE22_TIMESTAMP,
  C22_PROFILES,
  type C22ProductRanking,
  type C22ProfileName,
  type C22RankingEntry,
} from "@/lib/cycle22-data";

export const metadata = {
  title: "Chu kỳ 22 — Optimization Mode Rankings",
  description: "Bảng xếp hạng 3 composite profiles × 5 sản phẩm, Chu kỳ 22 (2026-04-22).",
};

const PROFILE_LABELS: Record<C22ProfileName, { title: string; icon: string; description: string }> = {
  winrate: {
    title: "🎯 Trúng cao nhất",
    icon: "🎯",
    description: "Weight 0.60 win + 0.20 roi + 0.10 sharpe + 0.10 -log₁₀p — ưu tiên tỷ lệ trúng",
  },
  roi: {
    title: "💰 Lỗ ít nhất",
    icon: "💰",
    description: "Weight 0.20 win + 0.60 roi + 0.10 sharpe + 0.10 -log₁₀p — ưu tiên ROI (ít lỗ)",
  },
  balanced: {
    title: "⚖ Cân bằng",
    icon: "⚖",
    description: "Weight 0.40 win + 0.40 roi + 0.10 sharpe + 0.10 -log₁₀p — cân bằng win + roi",
  },
};

function CollapseBadge({ mode }: { mode: C22ProductRanking["collapse_applied"] }) {
  if (mode === "none") return null;
  const labels: Record<string, string> = {
    all_three: "🎯💰⚖ 1 pick duy nhất — dominate cả 3 profiles",
    winrate_roi: "🎯💰 WinRate + ROI cùng strategy",
    winrate_balanced: "🎯⚖ WinRate + Balanced cùng strategy",
    roi_balanced: "💰⚖ ROI + Balanced cùng strategy",
  };
  return (
    <span className="inline-flex items-center rounded bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-semibold">
      {labels[mode]}
    </span>
  );
}

function PickCard({
  product,
  profile,
}: {
  product: C22ProductRanking;
  profile: C22ProfileName;
}) {
  const pick = product.picks[profile];
  const meta = PROFILE_LABELS[profile];
  if (!pick) {
    return (
      <div className="rounded-lg border border-orange-600/40 bg-orange-600/5 p-3">
        <div className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-1">{meta.icon} {profile}</div>
        <div className="text-sm font-semibold mb-1">Không có pick đủ tin cậy</div>
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          Top composite candidates đều flip direction trên split-half (3/3 retries). Xem chi tiết ranking bên dưới.
        </div>
      </div>
    );
  }
  const sh = pick.split_half;
  return (
    <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
      <div className="text-xs font-bold mb-1">{meta.icon} {profile}</div>
      <div className="text-sm font-bold mb-1.5">{pick.strategy}</div>
      <div className="text-[11px] text-muted-foreground leading-relaxed space-y-1">
        <div>Composite rank #{pick.composite_rank} (score {pick.composite_score.toFixed(3)})</div>
        {sh.status === "verified" && (
          <div className="text-green-600 dark:text-green-400">
            ✓ Split-half verified: {sh.reason}
          </div>
        )}
        {pick.attempt > 1 && (
          <div className="text-[10px] text-muted-foreground/80 italic">(đã retry {pick.attempt - 1} lần — rank trên bị flip)</div>
        )}
      </div>
    </div>
  );
}

function RankingTable({
  ranking,
  profileName,
  primaryMetricField,
}: {
  ranking: C22RankingEntry[];
  profileName: C22ProfileName;
  primaryMetricField: string;
}) {
  const isWinMetric = profileName === "winrate" || profileName === "balanced";
  const primaryLabel = primaryMetricField === "win_rate_pct" ? "Win%" : "Exact%";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] font-mono">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="text-right px-2 py-1.5 w-10">#</th>
            <th className="text-left px-2 py-1.5">Strategy</th>
            <th className="text-right px-2 py-1.5 w-20">Composite</th>
            <th className="text-right px-2 py-1.5 w-20">Δ_win (pp)</th>
            <th className="text-right px-2 py-1.5 w-20">Δ_roi (%)</th>
            <th className="text-right px-2 py-1.5 w-16">{primaryLabel}</th>
            <th className="text-right px-2 py-1.5 w-16">ROI%</th>
            <th className="text-right px-2 py-1.5 w-16">p</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((e) => {
            const isTop = e.rank === 1;
            const rowClass = !e.pick_eligible
              ? "text-muted-foreground/70 bg-muted/20"
              : isTop
                ? "bg-primary/5 font-semibold"
                : "";
            return (
              <tr key={`${profileName}-${e.strategy}`} className={`${rowClass} border-t`}>
                <td className="text-right px-2 py-1">{e.rank}</td>
                <td className="px-2 py-1">
                  {e.strategy}
                  {!e.pick_eligible && <span className="ml-1 text-[9px] italic">(baseline, không pick)</span>}
                </td>
                <td className="text-right px-2 py-1">{e.composite > 0 ? "+" : ""}{e.composite.toFixed(3)}</td>
                <td className={`text-right px-2 py-1 ${e.raw.delta_win_pp > 0 ? "text-green-600 dark:text-green-400" : e.raw.delta_win_pp < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                  {e.raw.delta_win_pp > 0 ? "+" : ""}{e.raw.delta_win_pp.toFixed(3)}
                </td>
                <td className={`text-right px-2 py-1 ${e.raw.delta_roi_pct > 0 ? "text-green-600 dark:text-green-400" : e.raw.delta_roi_pct < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                  {e.raw.delta_roi_pct > 0 ? "+" : ""}{e.raw.delta_roi_pct.toFixed(2)}
                </td>
                <td className="text-right px-2 py-1">{e.raw.raw_primary_pct.toFixed(3)}</td>
                <td className="text-right px-2 py-1">{e.raw.raw_roi_pct.toFixed(2)}</td>
                <td className="text-right px-2 py-1">{e.raw.p_value_raw < 0.001 ? "<0.001" : e.raw.p_value_raw.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {isWinMetric && (
        <div className="text-[10px] text-muted-foreground mt-1 italic">
          Primary: Δ_win (pp). Rank by {profileName} composite profile.
        </div>
      )}
      {!isWinMetric && (
        <div className="text-[10px] text-muted-foreground mt-1 italic">
          Primary: Δ_roi (%). Rank by roi composite profile.
        </div>
      )}
    </div>
  );
}

function ProductSection({ product }: { product: C22ProductRanking }) {
  const anyPick = !!(product.picks.winrate || product.picks.roi || product.picks.balanced);
  return (
    <section id={product.slug} className="rounded-xl border-2 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{product.label}</h2>
          <div className="text-xs text-muted-foreground">
            N = {product.n_draws.toLocaleString()} draws · {product.n_strategies_ranked} strategies ranked · scope {product.scope}
          </div>
        </div>
        <CollapseBadge mode={product.collapse_applied} />
      </div>

      <div>
        <div className="text-sm font-semibold mb-2">Picks (3 composite profiles)</div>
        {!anyPick ? (
          <div className="rounded-lg border border-orange-600/40 bg-orange-600/5 p-3">
            <div className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-1">
              ⚠ Tất cả 3 picks = null
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              Mọi top candidate fail split-half replication (3/3 retries). Đây là <strong>honest outcome</strong> theo Principle #11 —
              không phải bug. Khuyến nghị: không chọn pick cho {product.label} trong Chu kỳ 22, tham khảo bảng ranking để tự đánh giá.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <PickCard product={product} profile="winrate" />
            <PickCard product={product} profile="roi" />
            <PickCard product={product} profile="balanced" />
          </div>
        )}
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-semibold py-2 flex items-center justify-between border-t pt-3">
          <span>📊 Full rankings per profile ({product.n_strategies_ranked} strategies × 3 profiles)</span>
          <span className="text-xs text-muted-foreground group-open:hidden">▼ mở bảng</span>
          <span className="text-xs text-muted-foreground hidden group-open:inline">▲ thu gọn</span>
        </summary>
        <div className="mt-3 space-y-6">
          {(["winrate", "roi", "balanced"] as C22ProfileName[]).map((pn) => (
            <div key={pn}>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {PROFILE_LABELS[pn].title} · <span className="normal-case font-normal italic">{PROFILE_LABELS[pn].description}</span>
              </div>
              <RankingTable
                ranking={product.rankings[pn]}
                profileName={pn}
                primaryMetricField={product.primary_metric_field}
              />
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

export default function Cycle22Page() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <header className="space-y-3">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Link href="/research" className="underline hover:text-primary">← Research</Link>
          <span>/</span>
          <span>Chu kỳ 22</span>
        </div>
        <h1 className="text-3xl font-extrabold">Chu Kỳ 22 — Optimization Mode</h1>
        <p className="text-sm text-muted-foreground">
          Bảng xếp hạng đầy đủ với 3 composite profiles (WinRate / ROI / Balanced) × 5 sản phẩm. Completed {CYCLE22_TIMESTAMP}.
        </p>
        <div className="rounded-lg border border-blue-600/40 bg-blue-600/5 p-3 text-xs leading-relaxed">
          <strong className="text-foreground">📖 Hiểu đúng:</strong> Chu kỳ 22 là{" "}
          <strong>Optimization mode</strong>, không phải breakthrough research. Picks = best composite score,{" "}
          <strong>không đảm bảo beat Random</strong>. Toàn bộ dự án: <strong>0 confirmed edge</strong> sau 21 cycles{" "}
          (xem <a href="/research" className="underline">PROJECT_CLOSURE_REPORT</a>). Xem <a href="/glossary" className="underline">/glossary</a> cho semantic{" "}
          <em>composite profile</em>, <em>split-half replication</em>, <em>null pick</em>.
        </div>
      </header>

      <section className="rounded-xl border-2 border-dashed p-5 space-y-2">
        <h2 className="text-lg font-bold">Composite profiles & methodology</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {(Object.entries(C22_PROFILES) as [C22ProfileName, typeof C22_PROFILES[C22ProfileName]][]).map(([name, w]) => (
            <div key={name} className="rounded-lg border p-3 space-y-1">
              <div className="font-bold">{PROFILE_LABELS[name].title}</div>
              <div className="text-muted-foreground">{PROFILE_LABELS[name].description}</div>
              <div className="font-mono text-[10px] text-muted-foreground/80">
                weights: win={w.w_win}, roi={w.w_roi}, sharpe={w.w_sharpe}, p={w.w_neg_log_p}
              </div>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground pt-2 border-t mt-2">
          Source: <code className="font-mono text-[10px]">research/optimization/MEASUREMENT.md §2</code>.{" "}
          Split-half verify trên 3 pick candidates, retry ≤ 3 lần. Collapse rules khi picks trùng strategy.
        </div>
      </section>

      <nav className="flex flex-wrap gap-2 text-xs sticky top-0 bg-background/90 backdrop-blur py-2 z-10 border-b">
        {CYCLE22_PRODUCTS.map((p) => (
          <a key={p.slug} href={`#${p.slug}`} className="px-3 py-1 rounded-lg border hover:bg-primary/10 transition-colors">
            {p.label}
          </a>
        ))}
      </nav>

      {CYCLE22_PRODUCTS.map((p) => (
        <ProductSection key={p.slug} product={p} />
      ))}

      <footer className="text-xs text-muted-foreground border-t pt-4 space-y-1">
        <div>Artifacts: <span className="font-mono">research/optimization/cycle22_rankings.json</span>, <span className="font-mono">cycle22_review.md</span></div>
        <div>Methodology: <span className="font-mono">research/optimization/MEASUREMENT.md</span> (frozen 2026-04-22 per Principle #16).</div>
      </footer>
    </div>
  );
}

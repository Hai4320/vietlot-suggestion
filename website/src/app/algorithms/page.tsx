import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BACKTEST_MATRIX, BACKTEST_3D } from "@/lib/backtest-data";
import { CYCLE22_PRODUCTS, type C22ProfileName } from "@/lib/cycle22-data";
import { SortableBacktestTable, type BacktestRow } from "@/components/algorithms/SortableBacktestTable";

// /algorithms — danh mục các thuật toán đã triển khai trên giao diện
// + bảng xếp hạng từ đợt nghiên cứu mới nhất.

export const metadata = {
  title: "Các thuật toán gợi ý số — Vietlott",
  description: "Danh mục các thuật toán gợi ý số đã thử và xếp hạng theo dữ liệu mô phỏng.",
};

type Scope = "matrix" | "3d" | "both" | "power-535";
type Origin = "builtin" | "papers" | "research" | "c22";

interface UIStrategy {
  id: string;
  emoji: string;
  name: string;
  scope: Scope;
  origin: Origin;
  blurb: string;
}

const STRATEGIES: UIStrategy[] = [
  {
    id: "mindistance",
    emoji: "📐",
    name: "Bộ số khác biệt nhau",
    scope: "matrix",
    origin: "c22",
    blurb: "Sinh nhiều bộ số sao cho các bộ khác nhau nhất có thể, tránh trùng lặp giữa các vé.",
  },
  {
    id: "pairexploiter",
    emoji: "🔗",
    name: "Khai thác liên hệ giữa các vị trí",
    scope: "3d",
    origin: "c22",
    blurb: "Riêng cho 3D — tận dụng quan sát rằng các vị trí chữ số không hoàn toàn độc lập với nhau.",
  },
  {
    id: "coverageopt",
    emoji: "🎪",
    name: "Phủ đều không gian",
    scope: "3d",
    origin: "c22",
    blurb: "Riêng cho 3D — kết hợp tần suất xuất hiện với độ khác biệt giữa các chữ số.",
  },
  {
    id: "pattern",
    emoji: "🔮",
    name: "Theo mẫu cấu trúc",
    scope: "both",
    origin: "research",
    blurb: "Phân tích khoảng cách giữa các số và phân bố theo vùng (thấp / giữa / cao).",
  },
  {
    id: "jointbias",
    emoji: "🧬",
    name: "Liên hệ 3 chữ số",
    scope: "3d",
    origin: "research",
    blurb: "Riêng cho 3D — xét phân bố đồng thời của cả 3 vị trí chữ số.",
  },
  {
    id: "evmax",
    emoji: "💰",
    name: "Ưu tiên giải lớn",
    scope: "3d",
    origin: "research",
    blurb: "Riêng cho 3D — ưu tiên các số có khả năng trúng giải cao nhất.",
  },
  {
    id: "hybridparity",
    emoji: "🎰",
    name: "Cân bằng chẵn-lẻ (5/35)",
    scope: "power-535",
    origin: "research",
    blurb: "Riêng cho Power 5/35 — sinh nhiều vé cân chẵn-lẻ và đảm bảo các vé khác biệt nhau.",
  },
  {
    id: "bayesian",
    emoji: "🧠",
    name: "Dự đoán thông minh",
    scope: "both",
    origin: "papers",
    blurb: "Cập nhật xác suất từng số dựa trên dữ liệu gần đây và tự điều chỉnh theo lượng dữ liệu sẵn có.",
  },
  {
    id: "maxentropy",
    emoji: "🎯",
    name: "Trải đều tối đa",
    scope: "both",
    origin: "papers",
    blurb: "Chia phạm vi số thành các vùng và phủ đều.",
  },
  {
    id: "adaptive",
    emoji: "⚡",
    name: "Tự động chọn cửa sổ",
    scope: "both",
    origin: "papers",
    blurb: "Tự dò cửa sổ thời gian phù hợp nhất từ dữ liệu gần đây.",
  },
  {
    id: "frequency",
    emoji: "📊",
    name: "Số ra nhiều (số nóng)",
    scope: "both",
    origin: "builtin",
    blurb: "Ưu tiên các số xuất hiện nhiều nhất trong lịch sử quay.",
  },
  {
    id: "absence",
    emoji: "⏳",
    name: "Số vắng lâu (số gan)",
    scope: "both",
    origin: "builtin",
    blurb: "Ưu tiên các số lâu chưa xuất hiện trở lại.",
  },
  {
    id: "mixed",
    emoji: "🎲",
    name: "Kết hợp số nóng và số lạnh",
    scope: "both",
    origin: "builtin",
    blurb: "Trộn 50/50 số nóng và số lạnh.",
  },
];

const SCOPE_META: Record<Scope, { label: string; color: string }> = {
  matrix: { label: "Power 6/55, 6/45, 5/35", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  "3d": { label: "Max 3D & 3D Pro", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  both: { label: "Mọi sản phẩm", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  "power-535": { label: "Riêng Power 5/35", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
};

const ORIGIN_META: Record<Origin, { label: string; color: string }> = {
  c22: { label: "Đợt nghiên cứu mới", color: "bg-primary/15 text-primary" },
  research: { label: "Nghiên cứu nội bộ", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  papers: { label: "Theo bài nghiên cứu", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" },
  builtin: { label: "Cơ bản", color: "bg-muted text-muted-foreground" },
};

const PROFILE_META: Record<C22ProfileName, { icon: string; label: string }> = {
  winrate: { icon: "🎯", label: "Trúng nhiều" },
  roi: { icon: "💰", label: "Lỗ ít" },
  balanced: { icon: "⚖", label: "Cân bằng" },
};

type MatrixSlug = "power-655" | "power-645" | "power-535";
type ThreeDSlug = "max-3d" | "max-3d-pro";

// Tên thuật toán đã được tái mô phỏng ở đợt 22 — bỏ trùng để chỉ giữ kết quả mới
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

/** Ghép dữ liệu từ Đợt 22 (mới) + dữ liệu lịch sử trước đó. */
function buildMatrixRows(productSlug: MatrixSlug, c22Slug: string): BacktestRow[] {
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
      {/* Tiêu đề */}
      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold tracking-tight">Các thuật toán gợi ý số</h1>
          <Badge variant="outline">{STRATEGIES.length} thuật toán có thể dùng</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Đây là danh sách các thuật toán đã được triển khai trên giao diện — anh có thể dùng trực tiếp ở
          trang <Link href="/suggest" className="underline">Gợi ý số</Link>. Bên cạnh đó, hơn 60 cách khác cũng đã
          được thử trong nội bộ qua nhiều đợt nghiên cứu (xem bảng cuối trang).
        </p>
      </header>

      {/* Gợi ý hiện tại theo sản phẩm */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Gợi ý hiện tại theo sản phẩm</h2>
        <p className="text-xs text-muted-foreground">
          Mỗi sản phẩm được xếp hạng theo 3 góc nhìn: <strong>Trúng nhiều</strong>, <strong>Lỗ ít</strong>, và <strong>Cân bằng</strong>.
          Khi không có thuật toán nào đủ tin cậy, ô sẽ trống — đây là kết quả trung thực, không &ldquo;cố tìm&rdquo; cho có.
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Sản phẩm</th>
                {(["winrate", "roi", "balanced"] as C22ProfileName[]).map((pn) => {
                  const m = PROFILE_META[pn];
                  return (
                    <th key={pn} className="text-left px-3 py-2 font-semibold">
                      {m.icon} {m.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {CYCLE22_PRODUCTS.map((p) => (
                <tr key={p.slug} className="border-t">
                  <td className="px-3 py-2 font-semibold">
                    <Link href={`/suggest?p=${p.slug}`} className="hover:underline">{p.label}</Link>
                  </td>
                  {(["winrate", "roi", "balanced"] as C22ProfileName[]).map((pn) => {
                    const pick = p.picks[pn];
                    return (
                      <td key={pn} className="px-3 py-2">
                        {pick ? (
                          <div className="text-sm">{pick.strategy}</div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Chưa có gợi ý đủ tin cậy</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          Xem xếp hạng đầy đủ tại <Link href="/research" className="underline">trang Nghiên cứu</Link>.
        </p>
      </section>

      {/* Danh sách thuật toán */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Tất cả thuật toán</h2>
        <p className="text-xs text-muted-foreground">
          Bấm vào dòng để mở trang Gợi ý số và thử ngay.
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
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bảng số liệu mô phỏng */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Số liệu mô phỏng theo từng sản phẩm</h2>
        <p className="text-xs text-muted-foreground">
          Bảng dưới đây tổng hợp kết quả mô phỏng (chạy lại trên dữ liệu lịch sử Vietlott) cho từng sản phẩm.
          Bao gồm cả các thuật toán đã thử trong nội bộ — không phải tất cả đều có trên giao diện.
          Bấm tiêu đề cột để sắp xếp.
        </p>

        <div className="grid gap-3">
          {/* Power 6/55, 6/45, 5/35 */}
          {([
            { slug: "power-655" as MatrixSlug, c22: "power-655" },
            { slug: "power-645" as MatrixSlug, c22: "power-645" },
            { slug: "power-535" as MatrixSlug, c22: "power-535" },
          ]).map(({ slug, c22 }) => {
            const d = BACKTEST_MATRIX[slug];
            const rows = buildMatrixRows(slug, c22);
            return (
              <details key={slug} className="group rounded-lg border open:bg-muted/10">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{d?.label ?? slug}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {rows.length} cách đã thử
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground group-open:hidden">▼ mở</span>
                  <span className="text-xs text-muted-foreground hidden group-open:inline">▲ thu gọn</span>
                </summary>
                <div className="px-3 pb-3">
                  <SortableBacktestTable rows={rows} metricLabel="Tỉ lệ trúng" defaultSort="metric" />
                </div>
              </details>
            );
          })}

          {/* Max 3D / 3D Pro */}
          {([
            { slug: "max-3d" as ThreeDSlug, c22: "max-3d" },
            { slug: "max-3d-pro" as ThreeDSlug, c22: "max-3d-pro" },
          ]).map(({ slug, c22 }) => {
            const d = BACKTEST_3D[slug];
            const rows = build3DRows(slug, c22);
            return (
              <details key={slug} className="group rounded-lg border open:bg-muted/10">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{d?.label ?? slug}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {rows.length} cách đã thử
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground group-open:hidden">▼ mở</span>
                  <span className="text-xs text-muted-foreground hidden group-open:inline">▲ thu gọn</span>
                </summary>
                <div className="px-3 pb-3">
                  <SortableBacktestTable rows={rows} metricLabel="Tỉ lệ trúng đúng" defaultSort="metric" />
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* Lưu ý kết */}
      <footer className="rounded-lg border border-orange-500/40 bg-orange-500/5 p-4 space-y-2">
        <div className="text-sm font-semibold">Đọc trước khi chơi</div>
        <p className="text-xs leading-relaxed">
          Xổ số Vietlott về mặt toán học là &ldquo;trò chơi lỗ kỳ vọng&rdquo; — về dài hạn người chơi luôn thua.
          Sau hơn 22 đợt mô phỏng và đo lường, chưa có thuật toán nào trong số trên đảm bảo trúng nhiều hơn
          chọn ngẫu nhiên một cách rõ ràng. Riêng cách C6 (Vé A=B Max 3D Pro) là ngoại lệ duy nhất nhờ
          khai thác quy chế nhân đôi giải của Vietlott — xem chi tiết tại{" "}
          <Link href="/methods" className="underline">trang Cách chơi</Link>.
        </p>
        <p className="text-xs">Hãy chơi có trách nhiệm và trong khả năng tài chính của mình.</p>
        <p className="text-[11px] text-muted-foreground pt-1 border-t border-orange-500/20 flex flex-wrap gap-3">
          <Link href="/research" className="underline">Lịch sử nghiên cứu</Link>
          <Link href="/glossary" className="underline">Thuật ngữ</Link>
          <Link href="/suggest" className="underline">Gợi ý ngay</Link>
        </p>
      </footer>
    </div>
  );
}

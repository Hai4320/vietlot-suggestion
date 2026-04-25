"use client";

import { useState, useMemo } from "react";

export interface BacktestRow {
  name: string;
  /** Win% (matrix: win_rate_ge3) hoặc Exact% (3D) */
  metric: number;
  roi: number;
  /** Delta vs Random (pp for matrix win/exact, % for ROI). Optional. */
  deltaWin?: number;
  deltaRoi?: number;
  pValue?: number;
  /** "c22" = Chu kỳ 22 fresh re-backtest · "historical" = pre-C22 snapshot */
  source: "c22" | "historical";
  /** Decision từ breakthrough phase (Reject/Suggestive/Accept/Inconclusive/baseline) */
  decision?: string;
  /** Excluded via Tier 1/2 MEASUREMENT §4 — không hiển thị là pick nhưng ranked cho transparency */
  excluded?: boolean;
}

type SortKey = "metric" | "roi" | "deltaWin" | "deltaRoi" | "pValue" | "name";
type SortDir = "asc" | "desc";

// Nhãn các cột (dùng tham khảo nội bộ — header bảng dùng trực tiếp)
const METRIC_LABELS = {
  metric: "Tỉ lệ trúng",
  roi: "Lãi/lỗ %",
  deltaWin: "Trúng so với ngẫu nhiên",
  deltaRoi: "Lãi/lỗ so với ngẫu nhiên",
  pValue: "Tin cậy",
  name: "Cách chơi",
} as const;
void METRIC_LABELS;

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  metric: "desc",
  roi: "desc",
  deltaWin: "desc",
  deltaRoi: "desc",
  pValue: "asc",
  name: "asc",
};

function sortValue(row: BacktestRow, key: SortKey): number | string {
  switch (key) {
    case "metric": return row.metric;
    case "roi": return row.roi;
    case "deltaWin": return row.deltaWin ?? -Infinity;
    case "deltaRoi": return row.deltaRoi ?? -Infinity;
    case "pValue": return row.pValue ?? Infinity;
    case "name": return row.name.toLowerCase();
  }
}

function decisionBadge(d?: string) {
  if (!d || d === "baseline") {
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Chuẩn so sánh</span>;
  }
  const labelMap: Record<string, { text: string; cls: string }> = {
    Accept: { text: "Đã xác nhận", cls: "bg-green-500/15 text-green-700 dark:text-green-400" },
    Suggestive: { text: "Có dấu hiệu", cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
    Reject: { text: "Đã loại", cls: "bg-red-500/15 text-red-700 dark:text-red-400" },
    Inconclusive: { text: "Chưa rõ", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  };
  const m = labelMap[d];
  if (!m) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{d}</span>;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.cls}`}>{m.text}</span>;
}

export function SortableBacktestTable({
  rows,
  metricLabel,
  defaultSort = "metric",
}: {
  rows: BacktestRow[];
  /** Display label for the primary metric column ("Win %" or "Exact %") */
  metricLabel: string;
  defaultSort?: SortKey;
}) {
  const [sortKey, setSortKey] = useState<SortKey>(defaultSort);
  const [sortDir, setSortDir] = useState<SortDir>(DEFAULT_DIR[defaultSort]);

  const sorted = useMemo(() => {
    const copy = rows.slice();
    copy.sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      let cmp: number;
      if (typeof va === "string" && typeof vb === "string") {
        cmp = va.localeCompare(vb);
      } else {
        cmp = (va as number) - (vb as number);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const hasFresh = rows.some((r) => r.source === "c22");
  const hasDeltas = rows.some((r) => r.deltaWin !== undefined || r.deltaRoi !== undefined);

  const onSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(DEFAULT_DIR[key]);
    }
  };

  const SortHeader = ({ k, children, className = "" }: { k: SortKey; children: React.ReactNode; className?: string }) => {
    const active = sortKey === k;
    return (
      <th className={`${className} select-none`}>
        <button
          type="button"
          onClick={() => onSort(k)}
          className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-muted transition-colors text-[10px] font-semibold uppercase tracking-wider ${
            active ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <span>{children}</span>
          <span className={`text-[9px] ${active ? "opacity-100" : "opacity-30"}`}>
            {active && sortDir === "asc" ? "▲" : active && sortDir === "desc" ? "▼" : "↕"}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div className="space-y-2">
      {hasFresh && (
        <p className="text-[10px] text-muted-foreground italic">
          Hàng có nhãn <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-primary/15 text-primary font-semibold">🔄 Mới</span> là kết quả từ đợt nghiên cứu mới nhất. Các hàng còn lại là số liệu lịch sử trước đó.
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs font-mono">
          <thead className="bg-muted/40">
            <tr className="border-b">
              <th className="text-right px-2 py-1.5 w-8 text-[10px] font-semibold text-muted-foreground uppercase">#</th>
              <SortHeader k="name" className="text-left px-2 py-1.5">Cách chơi</SortHeader>
              <SortHeader k="metric" className="text-right px-2 py-1.5 w-20">{metricLabel}</SortHeader>
              {hasDeltas && <SortHeader k="deltaWin" className="text-right px-2 py-1.5 w-20">Trúng so với ngẫu nhiên</SortHeader>}
              <SortHeader k="roi" className="text-right px-2 py-1.5 w-16">Lãi/lỗ %</SortHeader>
              {hasDeltas && <SortHeader k="deltaRoi" className="text-right px-2 py-1.5 w-20">Lãi/lỗ so với ngẫu nhiên</SortHeader>}
              <SortHeader k="pValue" className="text-right px-2 py-1.5 w-16">Tin cậy</SortHeader>
              <th className="text-left px-2 py-1.5 w-24 text-[10px] font-semibold text-muted-foreground uppercase">Kết luận</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr
                key={r.name}
                className={`border-t border-muted/30 ${r.excluded ? "opacity-60" : ""}`}
              >
                <td className="text-right px-2 py-1 text-muted-foreground">{i + 1}</td>
                <td className="px-2 py-1">
                  <span className="flex items-center gap-1.5">
                    {r.source === "c22" && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-primary/15 text-primary font-semibold shrink-0">
                        🔄 Mới
                      </span>
                    )}
                    <span className="truncate">{r.name}</span>
                    {r.excluded && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 shrink-0" title="Cách này không được xét vào danh sách gợi ý">
                        không xét
                      </span>
                    )}
                  </span>
                </td>
                <td className="text-right px-2 py-1">{r.metric.toFixed(3)}</td>
                {hasDeltas && (
                  <td className={`text-right px-2 py-1 ${
                    r.deltaWin === undefined ? "text-muted-foreground/40"
                      : r.deltaWin > 0 ? "text-green-600 dark:text-green-400"
                      : r.deltaWin < 0 ? "text-red-600 dark:text-red-400" : ""
                  }`}>
                    {r.deltaWin === undefined ? "—" : `${r.deltaWin > 0 ? "+" : ""}${r.deltaWin.toFixed(3)}`}
                  </td>
                )}
                <td className={`text-right px-2 py-1 ${r.roi > 0 ? "text-green-600 dark:text-green-400" : r.roi < -50 ? "text-red-600 dark:text-red-400" : ""}`}>
                  {r.roi.toFixed(1)}
                </td>
                {hasDeltas && (
                  <td className={`text-right px-2 py-1 ${
                    r.deltaRoi === undefined ? "text-muted-foreground/40"
                      : r.deltaRoi > 0 ? "text-green-600 dark:text-green-400"
                      : r.deltaRoi < 0 ? "text-red-600 dark:text-red-400" : ""
                  }`}>
                    {r.deltaRoi === undefined ? "—" : `${r.deltaRoi > 0 ? "+" : ""}${r.deltaRoi.toFixed(2)}`}
                  </td>
                )}
                <td className="text-right px-2 py-1 text-muted-foreground">
                  {r.pValue === undefined ? "—" : r.pValue < 0.001 ? "<.001" : r.pValue.toFixed(3)}
                </td>
                <td className="px-2 py-1">{decisionBadge(r.decision)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground italic pl-1">
        Bấm tiêu đề cột để sắp xếp. Các cột &ldquo;so với ngẫu nhiên&rdquo; là chênh lệch của thuật toán so với chọn ngẫu nhiên thuần.
      </p>
    </div>
  );
}

export type { SortKey };

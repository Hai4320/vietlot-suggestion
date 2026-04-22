"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  getStrategyRows,
  researchOnlyReason,
  type StrategyRow,
} from "@/lib/algorithm-comparison";
import type { C22ProfileName } from "@/lib/cycle22-data";
import type { SuggestionStrategy } from "@/lib/types";

type SortKey = "rank" | "deltaWin" | "deltaRoi" | "rawWin" | "rawRoi" | "pValue" | "sharpe" | "composite";
type SortDir = "asc" | "desc";

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  rank: "asc",
  deltaWin: "desc",
  deltaRoi: "desc",
  rawWin: "desc",
  rawRoi: "desc",
  pValue: "asc",
  sharpe: "desc",
  composite: "desc",
};

const PROFILE_META: Record<C22ProfileName, { label: string; icon: string; bg: string; description: string }> = {
  winrate: {
    label: "Trúng",
    icon: "🎯",
    bg: "bg-green-600",
    description: "Trọng số 60% Δ_win / 20% Δ_ROI / 10% Sharpe / 10% −log(p)",
  },
  roi: {
    label: "Lỗ ít",
    icon: "💰",
    bg: "bg-yellow-600",
    description: "Trọng số 20% Δ_win / 60% Δ_ROI / 10% Sharpe / 10% −log(p)",
  },
  balanced: {
    label: "Cân bằng",
    icon: "⚖",
    bg: "bg-slate-600",
    description: "Trọng số 40% Δ_win / 40% Δ_ROI / 10% Sharpe / 10% −log(p)",
  },
};

function sortValue(row: StrategyRow, key: SortKey, profile: C22ProfileName): number {
  switch (key) {
    case "rank": return row.rank[profile];
    case "deltaWin": return row.deltaWinPp;
    case "deltaRoi": return row.deltaRoiPct;
    case "rawWin": return row.rawWinPct;
    case "rawRoi": return row.rawRoiPct;
    case "pValue": return row.pValue;
    case "sharpe": return row.sharpe;
    case "composite": return row.composite[profile];
  }
}

function formatDeltaPp(pp: number): string {
  const sign = pp > 0 ? "+" : "";
  return `${sign}${pp.toFixed(3)}`;
}

function formatDeltaPct(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}`;
}

function formatPValue(p: number): string {
  if (p < 0.001) return "<.001";
  if (p >= 0.9995) return "1.00";
  return p.toFixed(3);
}

function SortHead({
  k,
  label,
  hint,
  sortKey,
  sortDir,
  onSort,
}: {
  k: SortKey;
  label: string;
  hint?: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <th className="text-right px-2 py-1.5 whitespace-nowrap" title={hint}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-muted transition-colors text-[10px] font-semibold uppercase tracking-wider ${
          active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        <span>{label}</span>
        <span className={`text-[9px] ${active ? "opacity-100" : "opacity-30"}`}>
          {active && sortDir === "asc" ? "▲" : active && sortDir === "desc" ? "▼" : "↕"}
        </span>
      </button>
    </th>
  );
}

export interface AlgorithmComparisonTableProps {
  slug: string;
  selectedUiKey: SuggestionStrategy;
  onSelectUiKey: (key: SuggestionStrategy) => void;
  picks: {
    winrate: { strategy: SuggestionStrategy } | null;
    roi: { strategy: SuggestionStrategy } | null;
    balanced: { strategy: SuggestionStrategy } | null;
  };
  primaryMetricLabel: string;
  color: string;
}

export function AlgorithmComparisonTable({
  slug,
  selectedUiKey,
  onSelectUiKey,
  picks,
  primaryMetricLabel,
  color,
}: AlgorithmComparisonTableProps) {
  const [profile, setProfile] = useState<C22ProfileName>("balanced");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expanded, setExpanded] = useState(false);

  const rows = useMemo(() => getStrategyRows(slug), [slug]);

  const sorted = useMemo(() => {
    const copy = rows.slice();
    copy.sort((a, b) => {
      // Baseline (Random) always sinks to the bottom
      if (a.isBaseline !== b.isBaseline) return a.isBaseline ? 1 : -1;
      const cmp = sortValue(a, sortKey, profile) - sortValue(b, sortKey, profile);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir, profile]);

  if (rows.length === 0) {
    return null;
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(DEFAULT_DIR[key]);
    }
  };

  // Show top 7 by default (excluding Random); expand reveals the rest
  const visible = expanded ? sorted : sorted.filter((r) => !r.isBaseline).slice(0, 7).concat(sorted.filter((r) => r.isBaseline));
  const hiddenCount = sorted.filter((r) => !r.isBaseline).length - 7;

  const pickStrategyOf = (profileName: C22ProfileName): SuggestionStrategy | null =>
    profileName === "winrate" ? picks.winrate?.strategy ?? null
    : profileName === "roi" ? picks.roi?.strategy ?? null
    : picks.balanced?.strategy ?? null;

  const sortProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <details className="group rounded-xl border" style={{ borderColor: `${color}40`, background: `${color}04` }} open>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-2 text-sm font-semibold">
        <span>📊</span>
        <span>So sánh các thuật toán</span>
        <span className="text-[11px] font-normal text-muted-foreground">
          · {rows.filter((r) => !r.isBaseline).length} chiến lược · vs Random baseline
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground group-open:hidden">▼ mở</span>
        <span className="ml-auto text-[10px] text-muted-foreground hidden group-open:inline">▲ thu gọn</span>
      </summary>

      <div className="px-4 pb-4 pt-1 space-y-3">
        {/* Profile tabs — pick which composite scoring to sort by */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sắp xếp theo:</span>
          {(["winrate", "roi", "balanced"] as C22ProfileName[]).map((p) => {
            const meta = PROFILE_META[p];
            const isActive = profile === p;
            return (
              <button
                key={p}
                onClick={() => setProfile(p)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  isActive ? `${meta.bg} text-white shadow-sm` : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
                title={meta.description}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
          <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">
            Click row để chọn thuật toán
          </span>
        </div>

        {/* The main comparison table */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs font-mono">
            <thead className="bg-muted/40">
              <tr className="border-b">
                <SortHead {...sortProps} k="rank" label="#" hint="Rank theo composite profile đang chọn" />
                <th className="text-left px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Thuật toán</th>
                <SortHead {...sortProps} k="deltaWin" label="Δ trúng (pp)" hint="Chênh lệch win rate so với Random, đơn vị điểm phần trăm" />
                <SortHead {...sortProps} k="rawWin" label={primaryMetricLabel} hint="Tỷ lệ trúng tuyệt đối trên backtest" />
                <SortHead {...sortProps} k="deltaRoi" label="Δ ROI (%)" hint="Chênh lệch ROI so với Random, đơn vị phần trăm" />
                <SortHead {...sortProps} k="rawRoi" label="ROI%" hint="ROI tuyệt đối (vẫn âm cho mọi strategy theo EV game)" />
                <SortHead {...sortProps} k="pValue" label="p" hint="p-value z-test vs Random; p<0.05 = nominal significant" />
                <SortHead {...sortProps} k="sharpe" label="Sharpe" hint="Sharpe ratio của chuỗi Δ_win per-draw" />
                <SortHead {...sortProps} k="composite" label="Composite" hint="Điểm tổng hợp z-normalized theo profile đang chọn" />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const isSelected = !r.isBaseline && r.uiKey === selectedUiKey;
                const wrPick = pickStrategyOf("winrate");
                const roiPick = pickStrategyOf("roi");
                const balPick = pickStrategyOf("balanced");
                const isWinratePick = r.uiKey && wrPick === r.uiKey;
                const isRoiPick = r.uiKey && roiPick === r.uiKey;
                const isBalancedPick = r.uiKey && balPick === r.uiKey;
                const clickable = !r.isBaseline && r.uiKey !== null;
                return (
                  <tr
                    key={r.jsonName}
                    onClick={clickable ? () => onSelectUiKey(r.uiKey!) : undefined}
                    className={`border-t border-muted/30 transition-colors ${
                      clickable ? "cursor-pointer hover:bg-muted/40" : "cursor-default"
                    } ${r.isBaseline ? "text-muted-foreground italic" : ""}`}
                    style={isSelected ? { backgroundColor: `${color}15`, outline: `1.5px solid ${color}` } : undefined}
                  >
                    <td className="text-right px-2 py-1 text-muted-foreground">
                      {r.isBaseline ? "—" : `#${r.rank[profile]}`}
                    </td>
                    <td className="px-2 py-1">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className={`truncate ${r.isBaseline ? "" : "font-medium"}`}>{r.label}</span>
                        {isWinratePick && (
                          <Badge className="bg-green-600 text-white text-[9px] px-1 py-0 h-4" title="Pick Trúng">
                            🎯
                          </Badge>
                        )}
                        {isRoiPick && !isWinratePick && (
                          <Badge className="bg-yellow-600 text-white text-[9px] px-1 py-0 h-4" title="Pick Lỗ ít">
                            💰
                          </Badge>
                        )}
                        {isBalancedPick && !isWinratePick && !isRoiPick && (
                          <Badge className="bg-slate-600 text-white text-[9px] px-1 py-0 h-4" title="Pick Cân bằng">
                            ⚖
                          </Badge>
                        )}
                        {isSelected && (
                          <span className="text-[9px] px-1 py-0.5 rounded font-semibold" style={{ backgroundColor: `${color}25`, color }}>
                            ✓ đang chọn
                          </span>
                        )}
                        {!r.isBaseline && !r.uiKey && (
                          <span
                            className="text-[9px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 cursor-help"
                            title={researchOnlyReason(r.jsonName) ?? "Chỉ có trong backtest Python, chưa port UI"}
                          >
                            📚 Nghiên cứu
                          </span>
                        )}
                        {!r.pickEligible && !r.isBaseline && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400" title="Excluded from picks per MEASUREMENT §4">
                            excluded
                          </span>
                        )}
                      </span>
                    </td>
                    <td className={`text-right px-2 py-1 ${
                      r.isBaseline ? ""
                        : r.deltaWinPp > 0 ? "text-green-600 dark:text-green-400"
                        : r.deltaWinPp < 0 ? "text-red-600 dark:text-red-400" : ""
                    }`}>
                      {r.isBaseline ? "0.000" : formatDeltaPp(r.deltaWinPp)}
                    </td>
                    <td className="text-right px-2 py-1">{r.rawWinPct.toFixed(3)}</td>
                    <td className={`text-right px-2 py-1 ${
                      r.isBaseline ? ""
                        : r.deltaRoiPct > 0 ? "text-green-600 dark:text-green-400"
                        : r.deltaRoiPct < 0 ? "text-red-600 dark:text-red-400" : ""
                    }`}>
                      {r.isBaseline ? "0.00" : formatDeltaPct(r.deltaRoiPct)}
                    </td>
                    <td className={`text-right px-2 py-1 ${r.rawRoiPct < -50 ? "text-red-600 dark:text-red-400/80" : ""}`}>
                      {r.rawRoiPct.toFixed(1)}
                    </td>
                    <td className={`text-right px-2 py-1 ${
                      r.isBaseline ? "" : r.pValue < 0.05 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"
                    }`}>
                      {formatPValue(r.pValue)}
                    </td>
                    <td className="text-right px-2 py-1 text-muted-foreground">{r.sharpe.toFixed(2)}</td>
                    <td className={`text-right px-2 py-1 font-semibold ${
                      r.isBaseline ? ""
                        : r.composite[profile] > 0 ? "text-foreground"
                        : "text-muted-foreground"
                    }`}>
                      {r.composite[profile].toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expand/collapse toggle + legend */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <span>🎯 Trúng</span>
            <span>💰 Lỗ ít</span>
            <span>⚖ Cân bằng</span>
            <span className="text-amber-700 dark:text-amber-400" title="Chỉ có trong backtest Python, chưa port vào UI — không chọn được. Hover badge để xem lý do cụ thể.">
              📚 Nghiên cứu = không click được
            </span>
            <span className="opacity-50">· Δ = vs Random · pp = điểm phần trăm · p&lt;0.05 tô xanh</span>
          </div>
          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-[11px] px-2 py-0.5 rounded-md border bg-background hover:bg-muted transition-colors font-medium"
            >
              {expanded ? "Ẩn bớt" : `Xem thêm ${hiddenCount} thuật toán`}
            </button>
          )}
        </div>
      </div>
    </details>
  );
}

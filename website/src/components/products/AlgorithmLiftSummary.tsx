"use client";

import { useMemo } from "react";
import {
  getRepresentativeRow,
  getRandomBaseline,
  combinedWinProbability,
} from "@/lib/algorithm-comparison";
import { formatProbability } from "@/lib/prize-probability";
import type { SuggestionStrategy } from "@/lib/types";

/**
 * Compact "historical lift" card shown above the prize table.
 *
 * Takes the user's currently-selected strategy and displays, in plain language,
 * how the backtest Δ_win / Δ_ROI changes the chance of winning ≥1 time across
 * the generated ticket batch — compared head-to-head with Random.
 *
 * Honest framing:
 *   - Only applied to the "primary metric" tier (≥3 match for matrix,
 *     exact-match for 3D) — jackpot odds are NOT multiplied by the lift.
 *   - Δ_win is an in-sample backtest measurement, not a guarantee of future
 *     performance. Shown with p-value context.
 */

export interface AlgorithmLiftSummaryProps {
  slug: string;
  selectedUiKey: SuggestionStrategy;
  selectedLabel: string;
  ticketCount: number;
  color: string;
}

const PRIMARY_TIER_DESC: Record<string, string> = {
  "power-655": "Giải 8 trở lên (≥3 số trùng)",
  "power-645": "Giải 4 trở lên (≥3 số trùng)",
  "power-535": "Giải 5 trở lên (≥3 số trùng)",
  "max-3d": "Trúng 1 số 3 chữ số trong 20 số quay",
  "max-3d-pro": "Trúng 1 số 3 chữ số (khớp vị trí)",
};

export function AlgorithmLiftSummary({
  slug,
  selectedUiKey,
  selectedLabel,
  ticketCount,
  color,
}: AlgorithmLiftSummaryProps) {
  const data = useMemo(() => {
    const rep = getRepresentativeRow(slug, selectedUiKey);
    const baseline = getRandomBaseline(slug);
    if (!rep || !baseline) return null;

    // Per-ticket probability for the primary tier (raw_primary_pct is %)
    const baselineP = baseline.rawWinPct / 100;
    const strategyP = rep.rawWinPct / 100;

    return {
      rep,
      baseline,
      baselinePerTicket: baselineP,
      strategyPerTicket: strategyP,
      baselineCombined: combinedWinProbability(baselineP, ticketCount),
      strategyCombined: combinedWinProbability(strategyP, ticketCount),
    };
  }, [slug, selectedUiKey, ticketCount]);

  if (!data) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium">ℹ️ Cách &quot;{selectedLabel}&quot;</span> chưa có dữ liệu mô phỏng để so sánh với chọn ngẫu nhiên.
        Dự kiến hiệu năng tương đương chọn ngẫu nhiên.
      </div>
    );
  }

  const { rep, baselineCombined, strategyCombined } = data;
  const deltaPositive = rep.deltaWinPp > 0;
  const tierDesc = PRIMARY_TIER_DESC[slug] ?? "trúng giải cơ bản";
  const isSignificant = rep.pValue < 0.05;

  return (
    <div className="rounded-xl border" style={{ borderColor: `${color}40`, background: `${color}06` }}>
      <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: `${color}25` }}>
        <span className="text-base">🔬</span>
        <h4 className="text-sm font-bold">So với chọn ngẫu nhiên</h4>
        <span className="text-[11px] text-muted-foreground">
          · cách <strong className="text-foreground">{selectedLabel}</strong>
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">(theo dữ liệu mô phỏng)</span>
      </div>

      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Trúng nhiều/ít hơn ngẫu nhiên — định tính */}
        <div className="rounded-lg border bg-background/50 p-3 space-y-1">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Khả năng trúng</div>
          <div className={`text-base font-bold ${deltaPositive ? "text-green-600 dark:text-green-400" : rep.deltaWinPp < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
            {deltaPositive
              ? "Trúng nhiều hơn chọn ngẫu nhiên một chút"
              : rep.deltaWinPp < 0
                ? "Trúng ít hơn chọn ngẫu nhiên một chút"
                : "Tương đương chọn ngẫu nhiên"}
          </div>
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            {isSignificant
              ? "Mức chênh lệch khá rõ ràng trong mô phỏng — nhưng vẫn có thể là biến động ngẫu nhiên."
              : "Mức chênh lệch nhỏ — chưa thể khẳng định khác với chọn ngẫu nhiên."}
          </div>
        </div>

        {/* Áp dụng cho N vé */}
        <div className="rounded-lg border bg-background/50 p-3 space-y-1">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Khi mua {ticketCount} vé
          </div>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm text-muted-foreground">{formatProbability(baselineCombined)}</span>
            <span className="text-muted-foreground">→</span>
            <span className={`text-base font-bold ${deltaPositive ? "text-green-600 dark:text-green-400" : rep.deltaWinPp < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
              {formatProbability(strategyCombined)}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            Khả năng trúng ít nhất 1 vé ở mức {tierDesc.toLowerCase()} — so với chọn ngẫu nhiên.
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 -mt-1">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Lưu ý: Số liệu trên đo trên dữ liệu lịch sử Vietlott. Chỉ áp dụng cho mức {tierDesc.toLowerCase()} —
          giải cao hơn (Jackpot) vẫn giữ nguyên xác suất theo Vietlott. Lãi/lỗ kỳ vọng vẫn âm với mọi cách chơi
          trừ trường hợp đặc biệt như C6 (Vé A=B Max 3D Pro).
        </p>
      </div>
    </div>
  );
}


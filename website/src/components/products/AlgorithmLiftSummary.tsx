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
        <span className="font-medium">ℹ️ Thuật toán &quot;{selectedLabel}&quot;</span> chưa có dữ liệu backtest Chu kỳ 22 để so sánh lift với Random.
        Dự kiến hiệu năng tương đương baseline.
      </div>
    );
  }

  const { rep, baseline, baselineCombined, strategyCombined } = data;
  const deltaAbsPp = (strategyCombined - baselineCombined) * 100;
  const liftRelPct = baseline.rawWinPct > 0 ? (rep.deltaWinPp / baseline.rawWinPct) * 100 : 0;
  const deltaPositive = rep.deltaWinPp > 0;
  const tierDesc = PRIMARY_TIER_DESC[slug] ?? "tỷ lệ trúng cơ bản";
  const isSignificant = rep.pValue < 0.05;

  return (
    <div className="rounded-xl border" style={{ borderColor: `${color}40`, background: `${color}06` }}>
      <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: `${color}25` }}>
        <span className="text-base">🔬</span>
        <h4 className="text-sm font-bold">Lift so với Random</h4>
        <span className="text-[11px] text-muted-foreground">
          · thuật toán <strong className="text-foreground">{selectedLabel}</strong>
          {rep.label !== selectedLabel && <span className="opacity-70"> (variant: {rep.label})</span>}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">Backtest Chu kỳ 22</span>
      </div>

      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Δ win-rate */}
        <div className="rounded-lg border bg-background/50 p-3 space-y-1">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Δ trúng vs Random</div>
          <div className={`text-xl font-bold font-mono ${deltaPositive ? "text-green-600 dark:text-green-400" : rep.deltaWinPp < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
            {deltaPositive ? "+" : ""}{rep.deltaWinPp.toFixed(3)}<span className="text-sm font-normal text-muted-foreground ml-0.5">pp</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {deltaPositive ? "+" : ""}{liftRelPct.toFixed(1)}% tương đối ·
            p = {rep.pValue < 0.001 ? "<.001" : rep.pValue.toFixed(3)}
            {isSignificant && <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">· nominal sig</span>}
          </div>
        </div>

        {/* Δ ROI */}
        <div className="rounded-lg border bg-background/50 p-3 space-y-1">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Δ ROI vs Random</div>
          <div className={`text-xl font-bold font-mono ${rep.deltaRoiPct > 0 ? "text-green-600 dark:text-green-400" : rep.deltaRoiPct < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
            {rep.deltaRoiPct > 0 ? "+" : ""}{rep.deltaRoiPct.toFixed(2)}<span className="text-sm font-normal text-muted-foreground ml-0.5">%</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            ROI tuyệt đối: {rep.rawRoiPct.toFixed(1)}% (vẫn âm theo EV trò chơi)
          </div>
        </div>

        {/* Applied to N tickets */}
        <div className="rounded-lg border bg-background/50 p-3 space-y-1">
          <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            Áp dụng cho {ticketCount} vé
          </div>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-sm text-muted-foreground">{formatProbability(baselineCombined)}</span>
            <span className="text-muted-foreground">→</span>
            <span className={`text-base font-bold ${deltaPositive ? "text-green-600 dark:text-green-400" : rep.deltaWinPp < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
              {formatProbability(strategyCombined)}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Chênh lệch: {deltaAbsPp > 0 ? "+" : ""}{deltaAbsPp.toFixed(3)}pp · tier {tierDesc}
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 -mt-1">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          ⚠️ Δ_win đo trên in-sample backtest (n = {baseline.rawWinPct > 0 ? "" : ""}lịch sử)
          · chỉ áp dụng cho tier primary ({tierDesc}) · các giải cao hơn (Jackpot) giữ nguyên odds chính thức
          · p ≥ 0.05 ⇒ lift không phân biệt được với nhiễu ngẫu nhiên.
        </p>
      </div>
    </div>
  );
}

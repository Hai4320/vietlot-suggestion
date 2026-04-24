"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumberBall } from "./NumberBall";
import { CopyAsCheckRateCsv } from "@/components/check-rate/CopyAsCheckRateCsv";
import { AlgorithmComparisonTable } from "./AlgorithmComparisonTable";
import { AlgorithmLiftSummary } from "./AlgorithmLiftSummary";
import type { SuggestionStrategy, SuggestionSet, ThreeDSuggestionSet } from "@/lib/types";
import { calculatePrizeProbabilities, formatProbability, type PrizeTierProbability } from "@/lib/prize-probability";
import { getRepresentativeRow, getStrategyRows } from "@/lib/algorithm-comparison";
import { CYCLE22_PRODUCTS } from "@/lib/cycle22-data";

// ── Module-level cache: survives across page navigations ──
interface CachedPanelState {
  strategy: SuggestionStrategy;
  count: number;
  countInput: string;
  results: (SuggestionSet | ThreeDSuggestionSet)[];
  page: number;
}
const panelStateCache = new Map<string, CachedPanelState>();

interface MatrixSuggestionPanelProps {
  type: "matrix";
  slug: "power-655" | "power-645" | "power-535";
  onGenerate: (strategy: SuggestionStrategy, count: number) => SuggestionSet[];
  hasSpecial: boolean;
  color: string;
}

interface ThreeDSuggestionPanelProps {
  type: "3d";
  slug: "max-3d" | "max-3d-pro";
  onGenerate: (strategy: SuggestionStrategy, count: number) => ThreeDSuggestionSet[];
  hasSpecial?: false;
  color: string;
}

type SuggestionPanelProps = MatrixSuggestionPanelProps | ThreeDSuggestionPanelProps;

const PAGE_SIZE = 20;

// Strategy metadata moved to lib/strategies-metadata — shared source of
// truth for SuggestionPanel (here) + QuickGenerate (/check-rate).
import { STRATEGIES as ALL_STRATEGIES } from "@/lib/strategies-metadata";

// Per-product ranking + research picks (Chu kỳ 22 Optimization mode, 2026-04-22).
// 3 composite profiles (WinRate / ROI / Balanced) → up to 3 picks per product.
// Collapse rules: khi picks trùng strategy, UI gộp labels.
// See website/research/optimization/MEASUREMENT.md §3 for semantics.
// Null picks: Power 6/45 (baseline drift flip) + Max 3D Pro (regime split) — honest outcome.
type ProductSlug = "power-655" | "power-645" | "power-535" | "max-3d" | "max-3d-pro";

type ProductPick = { strategy: SuggestionStrategy; stat: string };
const PRODUCT_RANKS: Record<ProductSlug, {
  picks: { winrate: ProductPick | null; roi: ProductPick | null; balanced: ProductPick | null };
  // Fallback strategy for useState initializer when all picks are null
  defaultStrategy: SuggestionStrategy;
}> = {
  "power-655": {
    picks: {
      winrate: { strategy: "mindistance", stat: "Δ+0.308pp, composite +1.757 (rank 1)" },
      roi: { strategy: "mindistance", stat: "Δ_ROI +1.36%, composite +1.334 (rank 1)" },
      balanced: { strategy: "mindistance", stat: "composite +1.546 (rank 1)" },
    },
    defaultStrategy: "mindistance",
  },
  "power-645": {
    picks: { winrate: null, roi: null, balanced: null },
    defaultStrategy: "mindistance",
  },
  "power-535": {
    picks: {
      winrate: { strategy: "frequency", stat: "composite +0.814 (rank 1) — lưu ý: Δ_win −0.045pp (≈ tie Random)" },
      roi: { strategy: "frequency", stat: "ROI +1.80% vs Random, composite +1.208" },
      balanced: { strategy: "frequency", stat: "composite +1.012 (rank 1)" },
    },
    defaultStrategy: "frequency",
  },
  "max-3d": {
    picks: {
      winrate: { strategy: "pairexploiter", stat: "Δ+0.414pp, p=0.038, composite +1.603 (rank 1)" },
      roi: { strategy: "coverageopt", stat: "Δ_ROI +11.61%, composite +1.465 (rank 2 after retry)" },
      balanced: { strategy: "frequency", stat: "FreqWholeHot: Δ_ROI +12.93%, composite +1.586 (rank 1 balanced)" },
    },
    defaultStrategy: "pairexploiter",
  },
  "max-3d-pro": {
    // Chu kỳ 28 Accept (2026-04-24) — first positive-EV finding in 28 cycles
    // C6 A=B exploits Vietlott quy chế doubling rule. Theoretical EV +4180%,
    // backtest N=200 = +3864% ROI consistent across 4 segments. Forward-gate passes.
    // User must manually enter A=B on vietlott.vn UI.
    picks: {
      winrate: { strategy: "ab_exploit", stat: "P(hit) 2.0%/vé, scales với N" },
      roi: { strategy: "ab_exploit", stat: "ROI +3864% backtest (theoretical +4180%)" },
      balanced: { strategy: "ab_exploit", stat: "composite 🏆 ACCEPT Chu kỳ 28" },
    },
    defaultStrategy: "ab_exploit",
  },
};

export function SuggestionPanel(props: SuggestionPanelProps) {
  const productRank = PRODUCT_RANKS[props.slug];
  const cached = panelStateCache.get(props.slug);
  // Default strategy: first valid pick (winrate → roi → balanced) else defaultStrategy fallback
  const primaryPickStrategy =
    productRank.picks.winrate?.strategy ??
    productRank.picks.roi?.strategy ??
    productRank.picks.balanced?.strategy ??
    productRank.defaultStrategy;
  const [strategy, setStrategy] = useState<SuggestionStrategy>(cached?.strategy ?? primaryPickStrategy);
  const [count, setCount] = useState(cached?.count ?? 5);
  const [countInput, setCountInput] = useState(cached?.countInput ?? "5");
  const [results, setResults] = useState<(SuggestionSet | ThreeDSuggestionSet)[]>(cached?.results ?? []);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedCount, setRevealedCount] = useState(cached?.results?.length ? PAGE_SIZE : 0);
  const [page, setPage] = useState(cached?.page ?? 0);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Persist state to module-level cache on every change
  useEffect(() => {
    panelStateCache.set(props.slug, { strategy, count, countInput, results, page });
  }, [props.slug, strategy, count, countInput, results, page]);

  // Build pill list for quick strategy selector — dedupe UI keys by best
  // composite-balanced rank, order ascending. Strategies without C22 data
  // (e.g. mixed, bayesian, adaptive, hybridparity for Matrix products)
  // appended at the end so everything remains reachable.
  const quickPills = useMemo(() => {
    const rows = getStrategyRows(props.slug);
    const byUiKey = new Map<SuggestionStrategy, { rank: number; deltaWinPp: number }>();
    for (const r of rows) {
      if (r.isBaseline || !r.uiKey) continue;
      const existing = byUiKey.get(r.uiKey);
      if (!existing || r.rank.balanced < existing.rank) {
        byUiKey.set(r.uiKey, { rank: r.rank.balanced, deltaWinPp: r.deltaWinPp });
      }
    }
    const withData = Array.from(byUiKey.entries())
      .map(([key, m]) => ({ key, ...m, hasData: true }))
      .sort((a, b) => a.rank - b.rank);

    // Append UI-only strategies (no C22 data) that are still valid for this product
    const HIDE_PER_PRODUCT: Record<string, SuggestionStrategy[]> = {
      "power-655": ["evmax", "jointbias", "coverageopt", "pairexploiter", "hybridparity"],
      "power-645": ["evmax", "jointbias", "coverageopt", "pairexploiter", "hybridparity"],
      "power-535": ["evmax", "jointbias", "coverageopt", "pairexploiter"],
      "max-3d":    ["mindistance", "hybridparity", "absence", "bayesian", "adaptive"],
      "max-3d-pro":["mindistance", "hybridparity", "absence", "bayesian", "adaptive"],
    };
    const hidden = new Set(HIDE_PER_PRODUCT[props.slug] ?? []);
    const inWithData = new Set(withData.map((r) => r.key));
    const extras = ALL_STRATEGIES
      .filter((s) => !inWithData.has(s.key) && !hidden.has(s.key))
      .map((s) => ({ key: s.key, rank: 99, deltaWinPp: NaN, hasData: false }));

    return [...withData, ...extras];
  }, [props.slug]);

  const handleCountChange = (val: string) => {
    setCountInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 200) setCount(n);
  };

  // Auto-bump ticket count to 20 when HybridParity is selected with too few tickets
  const handleSelectStrategy = (key: SuggestionStrategy) => {
    setStrategy(key);
    if (key === "hybridparity" && count < 10) {
      setCount(20);
      setCountInput("20");
    }
  };

  const hybridWarning = strategy === "hybridparity" && count < 10;

  const handleGenerate = () => {
    setIsRevealing(true);
    setRevealedCount(0);
    setPage(0);
    const generated = props.onGenerate(strategy, count);
    setResults(generated);

    const revealCount = Math.min(generated.length, PAGE_SIZE);
    generated.forEach((_, i) => {
      if (i >= revealCount) return;
      setTimeout(() => {
        setRevealedCount((prev) => prev + 1);
        if (i === revealCount - 1) setIsRevealing(false);
      }, 150 + i * 100);
    });
    if (revealCount === 0) setIsRevealing(false);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  const selectedStrategy = ALL_STRATEGIES.find((s) => s.key === strategy)!;
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageStart = page * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, results.length);
  const pageResults = results.slice(pageStart, pageEnd);
  const prizeTiers = useMemo(() => {
    if (results.length === 0) return [] as PrizeTierProbability[];
    return calculatePrizeProbabilities(props.slug, results.length);
  }, [results.length, props.slug]);

  const handleDownload = useCallback((format: "txt" | "csv") => {
    if (results.length === 0) return;
    const productName = props.slug.replace(/-/g, "_");
    const now = new Date();
    const date = now.toISOString().slice(0, 10) + "_" + now.toTimeString().slice(0, 8).replace(/:/g, "");
    const strategyLabel = selectedStrategy.label;

    let content: string;
    let filename: string;
    let mime: string;

    if (format === "csv") {
      const header = props.type === "matrix"
        ? (props.hasSpecial ? "STT,Bộ số,Số đặc biệt" : "STT,Bộ số")
        : "STT,Bộ số";
      const rows = results.map((set, i) => {
        if (props.type === "matrix") {
          const ms = set as SuggestionSet;
          const nums = ms.numbers.map((n) => String(n).padStart(2, "0")).join(" - ");
          return props.hasSpecial && ms.special !== undefined
            ? `${i + 1},"${nums}",${String(ms.special).padStart(2, "0")}`
            : `${i + 1},"${nums}"`;
        }
        const ts = set as ThreeDSuggestionSet;
        return `${i + 1},"${ts.numbers.join(" - ")}"`;
      });
      content = [header, ...rows].join("\n");
      filename = `${productName}_${strategy}_${date}.csv`;
      mime = "text/csv;charset=utf-8";
    } else {
      const lines: string[] = [
        `Gợi ý xổ số — ${props.slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())}`,
        `Chiến lược: ${strategyLabel}`,
        `Ngày tạo: ${date}`,
        `Số lượng: ${results.length} bộ`,
        "",
        "─".repeat(40),
      ];
      results.forEach((set, i) => {
        const idx = String(i + 1).padStart(3, " ");
        if (props.type === "matrix") {
          const ms = set as SuggestionSet;
          const nums = ms.numbers.map((n) => String(n).padStart(2, "0")).join("  ");
          const special = props.hasSpecial && ms.special !== undefined ? `  |  ★ ${String(ms.special).padStart(2, "0")}` : "";
          lines.push(`${idx}.  ${nums}${special}`);
        } else {
          const ts = set as ThreeDSuggestionSet;
          lines.push(`${idx}.  ${ts.numbers.join("  ")}`);
        }
      });
      lines.push("", "─".repeat(40));
      // Append prize probabilities
      if (prizeTiers.length > 0) {
        lines.push("", "📐 Tỷ lệ trúng từng giải:", "");
        const col1 = Math.max(...prizeTiers.map((t) => t.name.length), 4);
        lines.push(`${'Giải'.padEnd(col1)}  ${'Giải thưởng'.padEnd(16)}  ${'Mỗi vé'.padEnd(18)}  ${results.length} vé`);
        lines.push("─".repeat(col1 + 60));
        for (const tier of prizeTiers) {
          lines.push(
            `${tier.name.padEnd(col1)}  ${tier.prize.padEnd(16)}  ${formatProbability(tier.perTicket).padEnd(18)}  ${formatProbability(tier.combined)}`
          );
        }
      }
      lines.push("", "⚠️ Lưu ý: Xổ số là hoàn toàn ngẫu nhiên. Gợi ý chỉ mang tính tham khảo.");
      content = lines.join("\n");
      filename = `${productName}_${strategy}_${date}.txt`;
      mime = "text/plain;charset=utf-8";
    }

    const blob = new Blob(["\uFEFF" + content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [results, props.type, props.slug, props.hasSpecial, strategy, selectedStrategy.label, prizeTiers]);

  return (
    <div className="space-y-5">
      {/* Compact header — no banner bloat */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎯</span>
        <h2 className="text-lg font-bold">Bộ số may mắn</h2>
      </div>

      {/* Research picks card — Chu kỳ 22: 3 profiles (winrate/roi/balanced).
          Each pick card shows inline stats (Δ_win, Δ_ROI, p-value) so users
          can compare picks without relying on tooltip hover. */}
      {(() => {
        const wrPick = productRank.picks.winrate;
        const roiPick = productRank.picks.roi;
        const balPick = productRank.picks.balanced;
        const allNull = !wrPick && !roiPick && !balPick;

        if (allNull) {
          return (
            <div className="rounded-xl border p-3" style={{ borderColor: "#f59e0b40", background: "#f59e0b08" }}>
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <div className="flex-1 text-sm">
                  <span className="font-semibold">Chưa có pick đủ tin cậy.</span>{" "}
                  <span className="text-muted-foreground">Chọn chiến lược tuỳ ý bên dưới, hoặc tham khảo bảng so sánh để tự quyết. Chi tiết tại <a href="/research" className="underline">/research</a>.</span>
                </div>
              </div>
            </div>
          );
        }

        // Deduplicate picks (collapse modes show only unique strategies)
        type RenderedPick = {
          label: string;
          icon: string;
          bgClass: string;
          borderClass: string;
          pick: ProductPick;
        };
        const seen = new Set<string>();
        const rendered: RenderedPick[] = [];
        if (wrPick && !seen.has(wrPick.strategy)) {
          rendered.push({ label: "Trúng cao nhất", icon: "🎯", bgClass: "bg-green-600 text-white", borderClass: "border-green-600/40", pick: wrPick });
          seen.add(wrPick.strategy);
        }
        if (roiPick && !seen.has(roiPick.strategy)) {
          rendered.push({ label: "Lỗ ít nhất", icon: "💰", bgClass: "bg-yellow-600 text-white", borderClass: "border-yellow-600/40", pick: roiPick });
          seen.add(roiPick.strategy);
        }
        if (balPick && !seen.has(balPick.strategy)) {
          rendered.push({ label: "Cân bằng", icon: "⚖", bgClass: "bg-slate-600 text-white", borderClass: "border-slate-600/40", pick: balPick });
          seen.add(balPick.strategy);
        }

        return (
          <div className="rounded-xl border p-4" style={{ borderColor: `${props.color}40`, background: `${props.color}08` }}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {rendered.length === 1 ? "Gợi ý tối ưu" : "So sánh 3 gợi ý"}
              </span>
              <span className="text-[10px] text-muted-foreground">· Chu kỳ 22 · click để chọn</span>
            </div>
            <div className={`grid gap-2.5 ${rendered.length === 1 ? "grid-cols-1" : rendered.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
              {rendered.map((r, i) => {
                const isActive = strategy === r.pick.strategy;
                const rep = getRepresentativeRow(props.slug, r.pick.strategy);
                const stratLabel = ALL_STRATEGIES.find((s) => s.key === r.pick.strategy)?.label ?? r.pick.strategy;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectStrategy(r.pick.strategy)}
                    className={`relative text-left rounded-lg border-2 p-3 transition-all hover:shadow-md ${r.borderClass}`}
                    style={isActive ? { backgroundColor: `${props.color}18`, borderColor: props.color } : { background: "var(--background)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${r.bgClass}`}>
                        {r.icon} {r.label}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-semibold" style={{ color: props.color }}>✓ đang chọn</span>
                      )}
                    </div>
                    <div className="text-sm font-bold mb-1.5 leading-tight">{stratLabel}</div>
                    {rep ? (
                      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Δ trúng</div>
                          <div className={rep.deltaWinPp > 0 ? "text-green-600 dark:text-green-400 font-semibold" : rep.deltaWinPp < 0 ? "text-red-600 dark:text-red-400 font-semibold" : ""}>
                            {rep.deltaWinPp > 0 ? "+" : ""}{rep.deltaWinPp.toFixed(2)}pp
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Δ ROI</div>
                          <div className={rep.deltaRoiPct > 0 ? "text-green-600 dark:text-green-400 font-semibold" : rep.deltaRoiPct < 0 ? "text-red-600 dark:text-red-400 font-semibold" : ""}>
                            {rep.deltaRoiPct > 0 ? "+" : ""}{rep.deltaRoiPct.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">p-value</div>
                          <div className={rep.pValue < 0.05 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                            {rep.pValue < 0.001 ? "<.001" : rep.pValue.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground italic">{r.pick.stat}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Part A: Full algorithm comparison table — sortable, 3 profile tabs. */}
      {(() => {
        const product = CYCLE22_PRODUCTS.find((p) => p.slug === props.slug);
        if (!product) return null;
        const primaryLabel = product.scope === "matrix" ? "Win %" : "Exact %";
        return (
          <AlgorithmComparisonTable
            slug={props.slug}
            selectedUiKey={strategy}
            onSelectUiKey={handleSelectStrategy}
            picks={productRank.picks}
            primaryMetricLabel={primaryLabel}
            color={props.color}
          />
        );
      })()}

      {/* Primary strategy picker — card grid, always visible, above Count+Generate.
          Per-product filtered via `quickPills`. Each card: emoji + label +
          description + Δ_win. Pick badges top-left, ✓ indicator top-right
          when active. Grid collapses to 2 cols on tablet, 1 on mobile. */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chọn chiến lược
          </span>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            💡 Số liệu chi tiết tại bảng so sánh phía trên
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {quickPills.map(({ key, deltaWinPp, hasData }) => {
            const meta = ALL_STRATEGIES.find((s) => s.key === key);
            if (!meta) return null;
            const isSelected = strategy === key;
            const isWinratePick = key === productRank.picks.winrate?.strategy;
            const isRoiPick = key === productRank.picks.roi?.strategy;
            const isBalancedPick = key === productRank.picks.balanced?.strategy;
            const deltaStr = !hasData ? "—" : `${deltaWinPp >= 0 ? "+" : ""}${deltaWinPp.toFixed(2)}pp`;
            const deltaColor = !hasData ? "text-muted-foreground/50"
              : deltaWinPp > 0 ? "text-green-600 dark:text-green-400"
              : deltaWinPp < 0 ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground";
            return (
              <button
                key={key}
                onClick={() => handleSelectStrategy(key)}
                className={`relative text-left rounded-xl border-2 p-3 pr-4 transition-all duration-200 hover:shadow-md ${
                  isSelected ? "shadow-md" : "border-border hover:border-muted-foreground/30"
                }`}
                style={isSelected ? { borderColor: props.color, backgroundColor: `${props.color}12` } : undefined}
              >
                {/* Pick badge corner */}
                {isWinratePick && (
                  <span className="absolute -top-1.5 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-600 text-white shadow-sm">
                    🎯 Trúng
                  </span>
                )}
                {!isWinratePick && isRoiPick && (
                  <span className="absolute -top-1.5 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-600 text-white shadow-sm">
                    💰 Lỗ ít
                  </span>
                )}
                {!isWinratePick && !isRoiPick && isBalancedPick && (
                  <span className="absolute -top-1.5 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-600 text-white shadow-sm">
                    ⚖ Cân bằng
                  </span>
                )}
                {/* Selected check */}
                {isSelected && (
                  <span
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                    style={{ backgroundColor: props.color }}
                  >
                    ✓
                  </span>
                )}
                {/* Content */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl">{meta.emoji}</span>
                  <span className="font-bold text-sm flex-1 truncate">{meta.label}</span>
                  <span className={`text-[11px] font-mono font-semibold ${isSelected ? "" : deltaColor}`} style={isSelected ? { color: props.color } : undefined}>
                    {deltaStr}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  {meta.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Count + Generate (primary action) */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tạo</span>
          <Input
            type="number"
            min={1}
            max={200}
            value={countInput}
            onChange={(e) => handleCountChange(e.target.value)}
            onBlur={() => {
              const n = parseInt(countInput, 10);
              if (isNaN(n) || n < 1) { setCount(1); setCountInput("1"); }
              else if (n > 200) { setCount(200); setCountInput("200"); }
            }}
            className="w-[76px] text-center font-mono"
          />
          <span className="text-sm text-muted-foreground">bộ</span>
          <div className="hidden sm:flex items-center gap-1 ml-1">
            {[5, 10, 20, 50].map((n) => (
              <button
                key={n}
                onClick={() => { setCount(n); setCountInput(String(n)); }}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                  count === n ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isRevealing}
          size="lg"
          className="ml-auto px-6 font-bold gap-2 shadow transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: props.color, color: "white" }}
        >
          {isRevealing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tạo...
            </>
          ) : (
            <>✨ Tạo gợi ý</>
          )}
        </Button>
      </div>
      {hybridWarning && (
        <div className="text-[11px] text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5 -mt-3">
          <span>⚠️</span>
          <span>Hybrid Parity cần <strong>N≥10</strong> vé để khai thác parity bias (tối ưu N=20).</span>
        </div>
      )}

      {/* Disclaimer + advanced (collapse) */}
      <details className="group rounded-lg border border-yellow-600/30 bg-yellow-600/5 px-3 py-2">
        <summary className="cursor-pointer list-none flex items-center gap-2 text-xs text-muted-foreground">
          <span>ℹ️</span>
          <span>22 chu kỳ · 69 chiến lược · 0 Accept — pick chỉ directional.</span>
          <span className="ml-auto text-[10px] group-open:hidden">▼</span>
          <span className="ml-auto text-[10px] hidden group-open:inline">▲</span>
        </summary>
        <div className="mt-2 pt-2 border-t border-yellow-600/20 text-[11px] text-muted-foreground leading-relaxed">
          <p>Picks = composite tournament winner. KHÔNG đảm bảo beat Random. ROI luôn âm.</p>
          <p className="flex gap-3 pt-1">
            <a href="/research" className="underline">📊 Nghiên cứu</a>
            <a href="/glossary" className="underline">📚 Thuật ngữ</a>
            <a href="/algorithms" className="underline">🔬 13 thuật toán</a>
          </p>
        </div>
      </details>

      {/* Results */}
      {results.length > 0 && (
        <div ref={resultsRef} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              🎰 Kết quả gợi ý
              <Badge variant="secondary" className="text-xs">
                {selectedStrategy.emoji} {selectedStrategy.label}
              </Badge>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{results.length} bộ số</span>
              <span className="h-3 w-px bg-border" />
              <button
                onClick={() => handleDownload("txt")}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-border hover:bg-muted transition-colors"
                title="Tải file .txt"
              >
                📄 .txt
              </button>
              <button
                onClick={() => handleDownload("csv")}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-border hover:bg-muted transition-colors"
                title="Tải file .csv (mở bằng Excel)"
              >
                📊 .csv
              </button>
              {props.type === "matrix" && (
                <CopyAsCheckRateCsv
                  game={props.slug.replace("-", "_")}
                  algorithm={strategy}
                  tickets={results.map((set) => {
                    const ms = set as SuggestionSet;
                    return {
                      numbers: ms.numbers,
                      special: props.slug === "power-535" ? ms.special ?? null : null,
                    };
                  })}
                  label="🎯 Check-rate"
                />
              )}
            </div>
          </div>

          {/* Part B: Historical lift summary — shown above prize table */}
          <AlgorithmLiftSummary
            slug={props.slug}
            selectedUiKey={strategy}
            selectedLabel={selectedStrategy.label}
            ticketCount={results.length}
            color={props.color}
          />

          {/* Prize tier probability table */}
          {prizeTiers.length > 0 && (
            <div className="rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ background: `${props.color}08` }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    📐 Tỷ lệ trúng từng giải
                    <Badge variant="secondary" className="text-[10px]">{results.length} vé</Badge>
                  </h4>
                  <span className="text-[10px] text-muted-foreground">Công thức: 1 − (1 − 1/odds)ⁿ</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2 font-semibold">Giải</th>
                      <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Điều kiện</th>
                      <th className="text-right px-3 py-2 font-semibold">Giải thưởng</th>
                      <th className="text-right px-3 py-2 font-semibold">Mỗi vé</th>
                      <th className="text-right px-4 py-2 font-semibold" style={{ color: props.color }}>
                        {results.length} vé
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prizeTiers.map((tier) => (
                      <tr key={tier.name} className={`border-b last:border-b-0 transition-colors hover:bg-muted/20 ${tier.highlight ? "bg-yellow-500/5" : ""}`}>
                        <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                          {tier.highlight && <span className="mr-1">🏆</span>}
                          {tier.name}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground hidden sm:table-cell">{tier.condition}</td>
                        <td className="px-3 py-2.5 text-right font-medium whitespace-nowrap">{tier.prize}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                          {formatProbability(tier.perTicket)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold whitespace-nowrap" style={{ color: props.color }}>
                          {formatProbability(tier.combined)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 border-t bg-muted/20 text-[10px] text-muted-foreground">
                Tỷ lệ trên là xác suất trúng ≥1 lần cho mỗi hạng giải khi mua {results.length} vé với bộ số khác nhau. Theo luật xổ số Vietlott.
              </div>
            </div>
          )}

          {/* Pagination top */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Trang {page + 1} / {totalPages} (bộ {pageStart + 1}–{pageEnd})
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="h-7 px-2 text-xs">
                  ← Trước
                </Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pn: number;
                  if (totalPages <= 7) pn = i;
                  else if (page < 3) pn = i;
                  else if (page > totalPages - 4) pn = totalPages - 7 + i;
                  else pn = page - 3 + i;
                  return (
                    <button key={pn} onClick={() => { setPage(pn); setRevealedCount(PAGE_SIZE); }}
                      className={`h-7 w-7 rounded text-xs font-mono ${page === pn ? "bg-primary text-primary-foreground font-bold" : "bg-muted hover:bg-muted/80 text-muted-foreground"}`}
                    >{pn + 1}</button>
                  );
                })}
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1}
                  onClick={() => { setPage((p) => p + 1); setRevealedCount(PAGE_SIZE); }} className="h-7 px-2 text-xs">
                  Sau →
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {pageResults.map((set, localIdx) => {
              const globalIdx = pageStart + localIdx;
              const isVisible = page === 0 ? localIdx < revealedCount : true;
              return (
                <Card
                  key={`${strategy}-${count}-${globalIdx}`}
                  className={`transition-all duration-500 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  } ${globalIdx === 0 ? "ring-2 ring-primary/20" : ""}`}
                >
                  <CardContent className="flex items-center gap-4 py-3 px-4">
                    {/* Rank */}
                    <div
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        globalIdx === 0
                          ? "text-white shadow-lg"
                          : globalIdx < 3
                            ? "bg-muted text-foreground"
                            : "bg-muted/50 text-muted-foreground"
                      }`}
                      style={globalIdx === 0 ? { backgroundColor: props.color } : undefined}
                    >
                      {globalIdx === 0 ? "★" : `#${globalIdx + 1}`}
                    </div>

                    {/* Numbers */}
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {props.type === "matrix"
                        ? (set as SuggestionSet).numbers.map((n, j) => (
                            <NumberBall key={j} number={n} size="md" />
                          ))
                        : (set as ThreeDSuggestionSet).numbers.map((n, j) => (
                            <span
                              key={j}
                              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-mono font-bold text-white shadow-sm"
                              style={{ backgroundColor: props.color }}
                            >
                              {n}
                            </span>
                          ))}
                      {props.type === "matrix" &&
                        props.hasSpecial &&
                        (set as SuggestionSet).special !== undefined && (
                          <NumberBall
                            number={(set as SuggestionSet).special!}
                            variant="special"
                            size="md"
                          />
                        )}
                    </div>

                    {/* Top pick badge */}
                    {globalIdx === 0 && (
                      <Badge variant="outline" className="hidden sm:flex text-[10px] shrink-0 gap-1" style={{ borderColor: props.color, color: props.color }}>
                        ⭐ Top pick
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination bottom */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={page === 0}
                onClick={() => { setPage((p) => p - 1); setRevealedCount(PAGE_SIZE); resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className="h-8 px-3">
                ← Trang trước
              </Button>
              <span className="text-sm text-muted-foreground px-3">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1}
                onClick={() => { setPage((p) => p + 1); setRevealedCount(PAGE_SIZE); resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className="h-8 px-3">
                Trang sau →
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Link to historical decisions page */}
      <p className="text-[11px] text-muted-foreground text-center">
        Xem Decision (Accept/Suggestive/Reject) + các paradigms đã bị loại (Copula, GBM, Pool...) tại{" "}
        <a href="/algorithms" className="underline hover:text-foreground">/algorithms</a>.
      </p>

      {/* Disclaimer */}
      <div className="relative rounded-xl border border-dashed border-yellow-500/30 bg-yellow-500/5 p-4">
        <div className="flex gap-3">
          <span className="text-xl shrink-0">⚠️</span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Lưu ý quan trọng
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Xổ số là hoàn toàn ngẫu nhiên. Gợi ý này chỉ dựa trên phân tích thống kê lịch sử
              và <strong>không đảm bảo</strong> kết quả trúng thưởng. Hãy chơi có trách nhiệm và
              trong khả năng tài chính của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

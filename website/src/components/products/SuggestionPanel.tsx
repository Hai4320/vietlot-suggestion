"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumberBall } from "./NumberBall";
import { BacktestCard } from "./BacktestCard";
import type { SuggestionStrategy, SuggestionSet, ThreeDSuggestionSet } from "@/lib/types";
import { calculatePrizeProbabilities, formatProbability, type PrizeTierProbability } from "@/lib/prize-probability";

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

const ALL_STRATEGIES: { key: SuggestionStrategy; emoji: string; label: string; description: string; badge?: string }[] = [
  {
    key: "evmax",
    emoji: "💰",
    label: "EV tối đa",
    description: "Tối ưu kỳ vọng giải thưởng × exponential decay + đa dạng vé — #1 Max 3D Pro (2.50%)",
    badge: "🔬 Nghiên cứu",
  },
  {
    key: "jointbias",
    emoji: "🧬",
    label: "Bias liên hợp",
    description: "Khai thác phân bố đồng thời 3 chữ số — #2 Max 3D (2.27%), #3 Max 3D Pro (2.38%)",
    badge: "🔬 Nghiên cứu",
  },
  {
    key: "bayesian",
    emoji: "🧠",
    label: "Bayesian AI",
    description: "Dirichlet posterior sampling — tự chọn temperature theo pool size",
    badge: "★ Mới",
  },
  {
    key: "pattern",
    emoji: "🔮",
    label: "Mẫu cấu trúc",
    description: "Phân tích khoảng cách, phân bố vùng số — #1 tổng hợp qua mọi sản phẩm matrix",
    badge: "★ Mới",
  },
  {
    key: "maxentropy",
    emoji: "🎯",
    label: "Phủ sóng tối đa",
    description: "Ma trận: chia vùng phủ đều. 3D: lọc theo tổng chữ số (digit-sum)",
    badge: "★ Mới",
  },
  {
    key: "adaptive",
    emoji: "⚡",
    label: "Tự động tối ưu",
    description: "Tự tìm cửa sổ phân tích tối ưu từ dữ liệu gần nhất",
    badge: "★ Mới",
  },
  {
    key: "frequency",
    emoji: "📊",
    label: "Tần suất cao",
    description: "Ưu tiên số xuất hiện nhiều nhất trong lịch sử",
  },
  {
    key: "absence",
    emoji: "⏳",
    label: "Số vắng lâu",
    description: "Ưu tiên các số lâu không xuất hiện — \"đến lượt\" rồi!",
  },
  {
    key: "mixed",
    emoji: "🎲",
    label: "Kết hợp nóng–lạnh",
    description: "Ma trận: 50/50 nóng + lạnh. 3D: digit-by-digit random trọng số",
  },
];

// Per-product ranking & backtest stats from actual backtest results
// Order = rank (1 = best). Derived from walk-forward backtest on real data.
// Each product shows only the top 6 strategies (MAX_SHOWN=6) out of 7 total.
type ProductSlug = "power-655" | "power-645" | "power-535" | "max-3d" | "max-3d-pro";
const MAX_STRATEGIES_SHOWN = 7;
const PRODUCT_RANKS: Record<ProductSlug, { ranks: Record<SuggestionStrategy, number>; stats: Record<SuggestionStrategy, string>; rec1: SuggestionStrategy; rec2: SuggestionStrategy; recReason: string }> = {
  "power-655": {
    ranks: { bayesian: 1, frequency: 2, pattern: 3, maxentropy: 4, adaptive: 5, mixed: 6, absence: 7, evmax: 8, jointbias: 9 },
    stats: { bayesian: "Δ+0.031, Win 1.65%", frequency: "Δ+0.024, Win 1.51%", pattern: "Δ+0.003, ổn định #1 tổng hợp", maxentropy: "Win 1.54%, ROI -62%", adaptive: "Δ-0.014", mixed: "50/50 nóng+lạnh", absence: "Win 1.24%, Δ-0.015", evmax: "Chỉ cho 3D", jointbias: "Chỉ cho 3D" },
    rec1: "bayesian", rec2: "frequency",
    recReason: "Pool 55 số lớn nhất — Bayesian AI (temp=1.0) khai thác posterior rộng, vượt trội +0.031 avg matches.",
  },
  "power-645": {
    ranks: { bayesian: 1, pattern: 2, frequency: 3, maxentropy: 4, mixed: 5, adaptive: 6, absence: 7, evmax: 8, jointbias: 9 },
    stats: { bayesian: "Sharp T=0.3, Win 3.14%", pattern: "Δ+0.017, ổn định", frequency: "Δ+0.006, Win 2.78%", maxentropy: "5/6 trùng! ROI -62%", mixed: "50/50 nóng+lạnh", adaptive: "Win 1.94%", absence: "Win 2.78%, Δ-0.005", evmax: "Chỉ cho 3D", jointbias: "Chỉ cho 3D" },
    rec1: "bayesian", rec2: "pattern",
    recReason: "Bayesian AI (Sharp T=0.3) đạt win rate 3.14% — cải thiện +0.64pp so với T=0.5 cũ. Phủ sóng tối đa đạt 5/6 trùng duy nhất!",
  },
  "power-535": {
    ranks: { pattern: 1, adaptive: 2, frequency: 3, bayesian: 4, maxentropy: 5, mixed: 6, absence: 7, evmax: 8, jointbias: 9 },
    stats: { pattern: "Δ+0.025, Win 1.78%", adaptive: "Δ+0.025, hòa #1", frequency: "Win 1.58%, ROI -74%", bayesian: "Δ-0.028", maxentropy: "Δ-0.026", mixed: "50/50 nóng+lạnh", absence: "Win 0.79%, Δ-0.008", evmax: "Chỉ cho 3D", jointbias: "Chỉ cho 3D" },
    rec1: "pattern", rec2: "adaptive",
    recReason: "Pool nhỏ 35 số — Mẫu cấu trúc phân tích vùng số + khoảng cách hiệu quả, hòa với Tự động tối ưu ở Δ+0.025.",
  },
  "max-3d": {
    ranks: { frequency: 1, jointbias: 2, bayesian: 3, maxentropy: 4, pattern: 5, adaptive: 6, mixed: 7, evmax: 8, absence: 9 },
    stats: { frequency: "Exact 2.35%, ROI -32.8%", jointbias: "🔬 Exact 2.27%, ROI -39.0%", bayesian: "Exact 2.09%, 38× trúng Nhất", maxentropy: "Phủ sóng 2.06%, ROI -40%", pattern: "Exact ~2.0%", adaptive: "Exact 1.94%", mixed: "digit-by-digit", evmax: "Chỉ tốt cho 3D Pro", absence: "chưa backtest" },
    rec1: "frequency", rec2: "jointbias",
    recReason: "Tần suất cao #1 (2.35%). Bias liên hợp (#2, 2.27%) khai thác sự phụ thuộc giữa 3 vị trí chữ số — phát hiện mới từ nghiên cứu thống kê.",
  },
  "max-3d-pro": {
    ranks: { evmax: 1, jointbias: 2, frequency: 3, maxentropy: 4, bayesian: 5, adaptive: 6, mixed: 7, pattern: 8, absence: 9 },
    stats: { evmax: "🔬 Exact 2.50%, ROI -26.5% 🏆", jointbias: "🔬 Exact 2.38%, ROI -31.5%", frequency: "Exact 1.94%", maxentropy: "Phủ sóng 2.30%, ROI -35.1%", bayesian: "Exact 2.07%", adaptive: "Exact 2.07%", mixed: "digit-by-digit", pattern: "Exact ~2.0%", absence: "chưa backtest" },
    rec1: "evmax", rec2: "jointbias",
    recReason: "EV tối đa #1 (2.50%, ROI -26.5%) — tối ưu kỳ vọng giải thưởng + exponential decay. Bias liên hợp #2 (2.38%) khai thác phân bố đồng thời 3 chữ số.",
  },
};

export function SuggestionPanel(props: SuggestionPanelProps) {
  const productRank = PRODUCT_RANKS[props.slug];
  const cached = panelStateCache.get(props.slug);
  const [strategy, setStrategy] = useState<SuggestionStrategy>(cached?.strategy ?? productRank.rec1);
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

  const sortedStrategies = useMemo(() => {
    return [...ALL_STRATEGIES]
      .filter((s) => productRank.ranks[s.key] <= MAX_STRATEGIES_SHOWN)
      .sort((a, b) => productRank.ranks[a.key] - productRank.ranks[b.key]);
  }, [productRank]);

  const handleCountChange = (val: string) => {
    setCountInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 1 && n <= 200) setCount(n);
  };

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
    <div className="space-y-8">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl p-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${props.color}15 0%, ${props.color}08 50%, ${props.color}15 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${props.color} 1px, transparent 1px), radial-gradient(circle at 80% 20%, ${props.color} 1px, transparent 1px), radial-gradient(circle at 50% 80%, ${props.color} 1px, transparent 1px)`,
            backgroundSize: "60px 60px, 80px 80px, 40px 40px",
          }}
        />
        <div className="relative">
          <div className="text-5xl mb-3">🎯</div>
          <h2 className="text-2xl font-extrabold mb-2">
            Bộ số may mắn của bạn
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Chọn chiến lược phân tích, hệ thống sẽ dựa trên dữ liệu lịch sử để gợi ý những bộ số tiềm năng nhất
          </p>
        </div>
      </div>

      {/* Recommendation card */}
      <div className="rounded-xl border-2 p-4" style={{ borderColor: `${props.color}40`, background: `${props.color}08` }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-bold">Khuyến nghị:</span>
            <button onClick={() => setStrategy(productRank.rec1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold text-white transition-transform hover:scale-105"
              style={{ backgroundColor: props.color }}>
              {ALL_STRATEGIES.find(s => s.key === productRank.rec1)?.emoji} {ALL_STRATEGIES.find(s => s.key === productRank.rec1)?.label}
            </button>
            <span className="text-xs text-muted-foreground">hoặc</span>
            <button onClick={() => setStrategy(productRank.rec2)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium border transition-transform hover:scale-105"
              style={{ borderColor: props.color, color: props.color }}>
              {ALL_STRATEGIES.find(s => s.key === productRank.rec2)?.emoji} {ALL_STRATEGIES.find(s => s.key === productRank.rec2)?.label}
            </button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">{productRank.recReason}</p>
        </div>
      </div>

      {/* Strategy selector — sorted by backtest rank */}
      <div>
        <label className="text-sm font-semibold mb-3 block text-muted-foreground uppercase tracking-wider">
          Chọn chiến lược{" "}
          <span className="normal-case font-normal">
            (xếp theo backtest — {props.slug.replace(/-/g, " ").replace(/^./, c => c.toUpperCase())})
          </span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedStrategies.map((s, idx) => {
            const bt = productRank.stats[s.key];
            const isRec = s.key === productRank.rec1;
            return (
            <button
              key={s.key}
              onClick={() => setStrategy(s.key)}
              className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                strategy === s.key
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : isRec
                    ? "border-border bg-primary/[0.02] hover:border-muted-foreground/30"
                    : "border-border hover:border-muted-foreground/30"
              }`}
              style={isRec && strategy !== s.key ? { borderColor: `${props.color}30` } : undefined}
            >
              {strategy === s.key && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                    style={{ backgroundColor: props.color }}
                  >
                    ✓
                  </div>
                </div>
              )}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  idx === 0 ? "bg-yellow-500 text-black"
                    : idx === 1 ? "bg-gray-300 text-black"
                    : idx === 2 ? "bg-orange-700 text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  #{idx + 1}
                </span>
              {s.badge && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: props.color }}
                >
                  {s.badge}
                </span>
              )}
              {isRec && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-600 text-white">
                  🏆 Khuyến nghị
                </span>
              )}
              </div>
              <div className="text-2xl mb-2 mt-4">{s.emoji}</div>
              <div className="font-bold text-sm">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</div>
              {bt && (
                <div className="mt-2 text-[10px] font-mono text-muted-foreground/70 bg-muted/50 rounded px-2 py-0.5 inline-block">
                  📊 {bt}
                </div>
              )}
            </button>
            );
          })}
        </div>
      </div>

      {/* Count + Generate */}
      <div className="flex flex-wrap items-center gap-4">
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
            className="w-[80px] text-center font-mono"
          />
          <span className="text-sm text-muted-foreground">bộ số</span>
          <div className="hidden sm:flex items-center gap-1 ml-2">
            {[5, 10, 20, 50, 100].map((n) => (
              <button
                key={n}
                onClick={() => { setCount(n); setCountInput(String(n)); }}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
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
          className="relative overflow-hidden px-8 font-bold text-base gap-2 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: props.color,
            color: "white",
          }}
        >
          {isRevealing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tạo...
            </>
          ) : (
            <>
              ✨ Tạo gợi ý ngay
            </>
          )}
        </Button>
      </div>

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
            </div>
          </div>

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

      {/* Backtest evaluation */}
      <BacktestCard slug={props.slug} color={props.color} />

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

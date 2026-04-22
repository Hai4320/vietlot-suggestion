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

// Strategy metadata — descriptions condensed, badges removed (see pick badges only).
// Chi tiết research đầy đủ: /algorithms + /research + /glossary.
const ALL_STRATEGIES: { key: SuggestionStrategy; emoji: string; label: string; description: string }[] = [
  {
    key: "mindistance",
    emoji: "📐",
    label: "Khoảng cách đa dạng",
    description: "Ma trận: Dirichlet sample + Jaccard diversity — vé khác biệt tối đa",
  },
  {
    key: "pairexploiter",
    emoji: "🔗",
    label: "Khai thác cặp chữ số",
    description: "3D: O/E synergy 3 cặp vị trí — khai thác non-independence",
  },
  {
    key: "coverageopt",
    emoji: "🎪",
    label: "Phủ không gian (3D)",
    description: "3D: frequency + digit-distance diversity",
  },
  {
    key: "pattern",
    emoji: "🔮",
    label: "Mẫu cấu trúc",
    description: "Phân tích spacing + phân bố vùng số",
  },
  {
    key: "maxentropy",
    emoji: "🎯",
    label: "Phủ sóng tối đa",
    description: "Ma trận: chia vùng phủ đều. 3D: lọc digit-sum",
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
    description: "Ưu tiên số lâu không xuất hiện",
  },
  {
    key: "bayesian",
    emoji: "🧠",
    label: "Bayesian AI",
    description: "Dirichlet posterior sampling — auto tune theo pool",
  },
  {
    key: "adaptive",
    emoji: "⚡",
    label: "Tự động tối ưu",
    description: "Tự tìm cửa sổ phân tích từ dữ liệu gần nhất",
  },
  {
    key: "jointbias",
    emoji: "🧬",
    label: "Bias liên hợp",
    description: "3D: phân bố đồng thời 3 chữ số",
  },
  {
    key: "mixed",
    emoji: "🎲",
    label: "Kết hợp nóng–lạnh",
    description: "Ma trận: 50/50. 3D: digit-by-digit weighted",
  },
  {
    key: "evmax",
    emoji: "💰",
    label: "EV tối đa",
    description: "3D: kỳ vọng giải thưởng × exponential decay",
  },
  {
    key: "hybridparity",
    emoji: "🎰",
    label: "Hybrid Parity (5/35)",
    description: "Power 5/35: wheeling đa vé parity + Hamming diversity",
  },
];

// Per-product ranking + research picks (Chu kỳ 22 Optimization mode, 2026-04-22).
// 3 composite profiles (WinRate / ROI / Balanced) → up to 3 picks per product.
// Collapse rules: khi picks trùng strategy, UI gộp labels.
// See website/research/optimization/MEASUREMENT.md §3 for semantics.
// Null picks: Power 6/45 (baseline drift flip) + Max 3D Pro (regime split) — honest outcome.
type ProductSlug = "power-655" | "power-645" | "power-535" | "max-3d" | "max-3d-pro";
const MAX_STRATEGIES_SHOWN = 7;

type ProductPick = { strategy: SuggestionStrategy; stat: string };
type CollapseMode = "none" | "all_three" | "winrate_roi" | "winrate_balanced" | "roi_balanced";
const PRODUCT_RANKS: Record<ProductSlug, {
  ranks: Record<SuggestionStrategy, number>;
  stats: Record<SuggestionStrategy, string>;
  picks: { winrate: ProductPick | null; roi: ProductPick | null; balanced: ProductPick | null };
  collapse: CollapseMode;
  // Fallback strategy for useState initializer when all picks are null
  defaultStrategy: SuggestionStrategy;
  recReason: string;
}> = {
  "power-655": {
    // Chu kỳ 22: MinDistance top all 3 profiles (composite +1.757/+1.334/+1.546), collapse all_three
    ranks: { mindistance: 1, maxentropy: 2, frequency: 3, pattern: 4, bayesian: 5, absence: 6, mixed: 7, adaptive: 8, evmax: 9, jointbias: 10, hybridparity: 11, coverageopt: 12, pairexploiter: 13 },
    stats: { mindistance: "Δ+0.308pp, ROI +1.36% vs Random, split-half verified (C22 pick)", maxentropy: "Δ+0.081pp, ROI +1.55%", frequency: "Δ−0.065pp, ROI +1.12%", pattern: "Δ−0.227pp, ROI +0.19%", bayesian: "🚫 Tier 2 excluded (Bayesian family eliminated Chu kỳ 21)", absence: "Δ−0.162pp, ROI +0.82%", mixed: "50/50 nóng+lạnh", adaptive: "🚫 Tier 2 excluded (Adaptive family eliminated Chu kỳ 14)", evmax: "Chỉ cho 3D", jointbias: "Chỉ cho 3D", hybridparity: "Chỉ cho 5/35", coverageopt: "Chỉ cho 3D", pairexploiter: "Chỉ cho 3D" },
    picks: {
      winrate: { strategy: "mindistance", stat: "Δ+0.308pp, composite +1.757 (rank 1)" },
      roi: { strategy: "mindistance", stat: "Δ_ROI +1.36%, composite +1.334 (rank 1)" },
      balanced: { strategy: "mindistance", stat: "composite +1.546 (rank 1)" },
    },
    collapse: "all_three",
    defaultStrategy: "mindistance",
    recReason: "Chu kỳ 22: MinDistance dominates cả 3 profiles (winrate/roi/balanced) — Δ+0.308pp win, ROI +1.36% vs Random. Split-half verified. Composite +1.757 cách biệt khá với #2 ExpDecay_Hot (+0.764).",
  },
  "power-645": {
    // Chu kỳ 22: all picks null — baseline drift between halves (+0.67pp shift) flips all top candidates
    ranks: { mindistance: 1, frequency: 2, maxentropy: 3, pattern: 4, absence: 5, mixed: 6, bayesian: 7, adaptive: 8, evmax: 9, jointbias: 10, hybridparity: 11, coverageopt: 12, pairexploiter: 13 },
    stats: { mindistance: "Δ+0.399pp, ROI +2.55% | ⚠ split-half flip (h1+, h2−)", frequency: "Δ+0.083pp, ROI +17.29% | ⚠ split-half flip", maxentropy: "Δ−0.283pp", pattern: "Δ−0.133pp", absence: "Δ−0.083pp", mixed: "50/50 nóng+lạnh", bayesian: "🚫 Tier 2 excluded", adaptive: "🚫 Tier 2 excluded", evmax: "Chỉ cho 3D", jointbias: "Chỉ cho 3D", hybridparity: "Chỉ cho 5/35", coverageopt: "Chỉ cho 3D", pairexploiter: "Chỉ cho 3D" },
    picks: { winrate: null, roi: null, balanced: null },
    collapse: "none",
    defaultStrategy: "mindistance",
    recReason: "Chu kỳ 22: Không có pick đủ tin cậy cho Mega 6/45. Random baseline dịch +0.67pp giữa hai halves → mọi strategy top đều flip direction. Đây là honest null outcome — không phải bug. Vui lòng tham khảo bảng xếp hạng chi tiết để tự chọn.",
  },
  "power-535": {
    // Chu kỳ 22: Freq_Hot top all 3 profiles (collapse all_three). ⚠ Δ_win=-0.045 (negative) but composite wins via ROI+sharpe.
    ranks: { frequency: 1, maxentropy: 2, absence: 3, pattern: 4, mindistance: 5, mixed: 6, hybridparity: 7, bayesian: 8, adaptive: 9, evmax: 10, jointbias: 11, coverageopt: 12, pairexploiter: 13 },
    stats: { frequency: "Δ+1.80% ROI (best), Δ_win −0.045pp (≈ tie Random)", maxentropy: "Δ_win +0.000pp, ROI 0 (tied Random)", absence: "Δ−0.271pp", pattern: "Δ−0.452pp", mindistance: "Δ−0.135pp, ROI −0.68%", mixed: "50/50 nóng+lạnh", hybridparity: "⚠️ Chu kỳ 5 Reject (p=0.301)", bayesian: "🚫 Tier 2 excluded", adaptive: "🚫 Tier 2 excluded", evmax: "Chỉ cho 3D", jointbias: "Chỉ cho 3D", coverageopt: "Chỉ cho 3D", pairexploiter: "Chỉ cho 3D" },
    picks: {
      winrate: { strategy: "frequency", stat: "composite +0.814 (rank 1) — lưu ý: Δ_win −0.045pp (≈ tie Random)" },
      roi: { strategy: "frequency", stat: "ROI +1.80% vs Random, composite +1.208" },
      balanced: { strategy: "frequency", stat: "composite +1.012 (rank 1)" },
    },
    collapse: "all_three",
    defaultStrategy: "frequency",
    recReason: "Chu kỳ 22: Freq_Hot dominates cả 3 profiles. ⚠ Pick winrate có Δ_win NEGATIVE nhẹ (−0.045pp ≈ tie với Random) — được chọn vì composite winner (ROI +1.8% + least bad win). Xem /glossary để hiểu semantic 'pick = composite winner, không đảm bảo beat Random'.",
  },
  "max-3d": {
    // Chu kỳ 22: 3 picks diverse. Winrate=PairExploiter (rank 1, +0.414pp, p=0.038), ROI=CoverageOpt (rank 2 after retry, +11.6pp ROI), Balanced=FreqWholeHot (rank 1, +12.9pp ROI)
    ranks: { pairexploiter: 1, frequency: 2, coverageopt: 3, maxentropy: 4, jointbias: 5, pattern: 6, bayesian: 7, adaptive: 8, mixed: 9, evmax: 10, absence: 11, hybridparity: 12, mindistance: 13 },
    stats: { pairexploiter: "Δ+0.414pp, ROI +10.35%, p=0.0379 (C22 winrate pick)", frequency: "Δ+0.374pp, ROI +12.93% (FreqWholeHot, C22 balanced pick)", coverageopt: "Δ+0.364pp, ROI +11.61% (C22 roi pick, retry #2)", maxentropy: "~ tương đương CoverageOpt (không tested C22, Freq 3D close)", jointbias: "Δ+0.118pp (A1 JointBias_T1.0 ranked)", pattern: "chưa có equivalent direct", bayesian: "🚫 Tier 2 excluded (BayesJoint)", adaptive: "🚫 Tier 2 excluded (AdaptBias)", mixed: "digit-by-digit", evmax: "D1 tested: Δ+0.020pp, ROI −9.48% (rank #17)", absence: "chưa backtest", hybridparity: "Chỉ cho 5/35", mindistance: "Chỉ cho matrix" },
    picks: {
      winrate: { strategy: "pairexploiter", stat: "Δ+0.414pp, p=0.038, composite +1.603 (rank 1)" },
      roi: { strategy: "coverageopt", stat: "Δ_ROI +11.61%, composite +1.465 (rank 2 after retry)" },
      balanced: { strategy: "frequency", stat: "FreqWholeHot: Δ_ROI +12.93%, composite +1.586 (rank 1 balanced)" },
    },
    collapse: "none",
    defaultStrategy: "pairexploiter",
    recReason: "Chu kỳ 22: 3 picks diverse — PairExploiter winrate (p=0.038 best nominal sig của cycle), CoverageOpt ROI (+11.6pp), FreqWholeHot balanced. Tất cả split-half verified. Pick đa dạng theo user intent (max trúng / min lỗ / cân bằng).",
  },
  "max-3d-pro": {
    // Chu kỳ 22: all picks null — regime split between halves. D1 top but h1→h2 flip from +1.15pp to -0.20pp.
    ranks: { evmax: 1, frequency: 2, jointbias: 3, pairexploiter: 4, maxentropy: 5, coverageopt: 6, pattern: 7, bayesian: 8, adaptive: 9, mixed: 10, absence: 11, hybridparity: 12, mindistance: 13 },
    stats: { evmax: "Δ+0.484pp, ROI +13.43% | ⚠ split-half flip (h1 +1.15pp → h2 −0.20pp)", frequency: "Δ+0.030pp, ROI −7.38% (FreqWholeHot in C22)", jointbias: "Δ+0.363pp (A1 JointBias_T1.0)", pairexploiter: "Δ+0.121pp, ROI −0.21%", maxentropy: "~ tương đương B1", coverageopt: "Δ−0.575pp, ROI −18.71% (rank #17 cuối bảng cho 3D Pro)", pattern: "chưa tested", bayesian: "🚫 Tier 2 excluded", adaptive: "🚫 Tier 2 excluded", mixed: "digit-by-digit", absence: "chưa backtest", hybridparity: "Chỉ cho 5/35", mindistance: "Chỉ cho matrix" },
    picks: { winrate: null, roi: null, balanced: null },
    collapse: "none",
    defaultStrategy: "evmax",
    recReason: "Chu kỳ 22: Không có pick đủ tin cậy cho Max 3D Pro. Regime split giữa hai halves: EVMaximizer top composite nhưng h1 +1.15pp → h2 −0.20pp (direction flip). ULTIMATE_v2_sharp opposite flip. Honest null outcome — tham khảo bảng xếp hạng chi tiết.",
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

      {/* Research picks card — Chu kỳ 22: 3 profiles (winrate/roi/balanced) + collapse modes + null support */}
      {(() => {
        const wrPick = productRank.picks.winrate;
        const roiPick = productRank.picks.roi;
        const balPick = productRank.picks.balanced;
        const allNull = !wrPick && !roiPick && !balPick;
        const collapse = productRank.collapse;

        if (allNull) {
          return (
            <div className="rounded-xl border p-3" style={{ borderColor: "#f59e0b40", background: "#f59e0b08" }}>
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <div className="flex-1 text-sm">
                  <span className="font-semibold">Chưa có pick đủ tin cậy.</span>{" "}
                  <span className="text-muted-foreground">Chọn chiến lược tuỳ ý bên dưới. Chi tiết tại <a href="/research" className="underline">/research</a>.</span>
                </div>
              </div>
            </div>
          );
        }

        // Deduplicate picks theo strategy (collapse modes hiển thị chỉ unique picks)
        type RenderedPick = { label: string; icon: string; bgClass: string; pick: ProductPick };
        const seen = new Set<string>();
        const rendered: RenderedPick[] = [];
        if (wrPick && !seen.has(wrPick.strategy)) {
          rendered.push({ label: "Trúng", icon: "🎯", bgClass: "bg-green-600 text-white", pick: wrPick });
          seen.add(wrPick.strategy);
        }
        if (roiPick && !seen.has(roiPick.strategy)) {
          rendered.push({ label: "Lỗ ít", icon: "💰", bgClass: "bg-yellow-600 text-white", pick: roiPick });
          seen.add(roiPick.strategy);
        }
        if (balPick && !seen.has(balPick.strategy)) {
          rendered.push({ label: "Cân bằng", icon: "⚖", bgClass: "bg-slate-600 text-white", pick: balPick });
          seen.add(balPick.strategy);
        }

        return (
          <div className="rounded-xl border p-4" style={{ borderColor: `${props.color}40`, background: `${props.color}08` }}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {rendered.length === 1 ? "Gợi ý tối ưu" : "Gợi ý theo mục tiêu"}
                </span>
                {rendered.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectStrategy(r.pick.strategy)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-transform hover:scale-105"
                    style={{
                      backgroundColor: strategy === r.pick.strategy ? props.color : "transparent",
                      color: strategy === r.pick.strategy ? "white" : props.color,
                      border: `1.5px solid ${props.color}`,
                    }}
                    title={r.pick.stat}
                  >
                    <span className={`inline-flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded ${r.bgClass}`}>
                      {r.icon} {r.label}
                    </span>
                    <span>{ALL_STRATEGIES.find(s => s.key === r.pick.strategy)?.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Count + Generate (primary action, immediately after picks) */}
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

      {/* Advanced strategy selector — collapsed by default */}
      <details className="group rounded-lg border px-3 py-2">
        <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-semibold">
          <span>🔧 Tuỳ chỉnh chiến lược</span>
          <span className="text-xs font-normal text-muted-foreground">
            (đang dùng: {selectedStrategy.emoji} {selectedStrategy.label})
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground group-open:hidden">▼ mở</span>
          <span className="ml-auto text-[10px] text-muted-foreground hidden group-open:inline">▲ thu gọn</span>
        </summary>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedStrategies.map((s) => {
            const isWinratePick = s.key === productRank.picks.winrate?.strategy;
            const isRoiPick = s.key === productRank.picks.roi?.strategy;
            const isBalancedPick = s.key === productRank.picks.balanced?.strategy;
            const isRec = isWinratePick || isRoiPick || isBalancedPick;
            return (
            <button
              key={s.key}
              onClick={() => handleSelectStrategy(s.key)}
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
              {/* Pick badge — 1 per card, priority: winrate > roi > balanced */}
              {isWinratePick && (
                <div className="absolute top-2 left-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-600 text-white"
                    title={`🎯 Trúng cao nhất — ${productRank.picks.winrate!.stat}`}
                  >
                    🎯 Trúng
                  </span>
                </div>
              )}
              {!isWinratePick && isRoiPick && (
                <div className="absolute top-2 left-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-600 text-white"
                    title={`💰 Lỗ ít nhất — ${productRank.picks.roi!.stat}`}
                  >
                    💰 Lỗ ít
                  </span>
                </div>
              )}
              {!isWinratePick && !isRoiPick && isBalancedPick && (
                <div className="absolute top-2 left-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-600 text-white"
                    title={`⚖ Cân bằng — ${productRank.picks.balanced!.stat}`}
                  >
                    ⚖ Cân bằng
                  </span>
                </div>
              )}
              <div className="text-2xl mb-2 mt-5">{s.emoji}</div>
              <div className="font-bold text-sm">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</div>
            </button>
            );
          })}
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

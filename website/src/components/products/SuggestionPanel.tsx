"use client";

import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumberBall } from "./NumberBall";
import type { SuggestionStrategy, SuggestionSet, ThreeDSuggestionSet } from "@/lib/types";

interface MatrixSuggestionPanelProps {
  type: "matrix";
  onGenerate: (strategy: SuggestionStrategy, count: number) => SuggestionSet[];
  hasSpecial: boolean;
  color: string;
}

interface ThreeDSuggestionPanelProps {
  type: "3d";
  onGenerate: (strategy: SuggestionStrategy, count: number) => ThreeDSuggestionSet[];
  hasSpecial?: false;
  color: string;
}

type SuggestionPanelProps = MatrixSuggestionPanelProps | ThreeDSuggestionPanelProps;

const PAGE_SIZE = 20;

const STRATEGIES: { key: SuggestionStrategy; emoji: string; label: string; description: string; badge?: string; matrixRank: number; threeDRank: number; matrixBt?: string; threeDBt?: string }[] = [
  {
    key: "bayesian",
    emoji: "🧠",
    label: "Bayesian AI",
    description: "Dirichlet posterior — hiệu quả nhất trên xổ số ma trận (6/55, 6/45)",
    badge: "★ Mới",
    matrixRank: 1, threeDRank: 4,
    matrixBt: "Win 1.65-3.14%", threeDBt: "Exact 2.07-2.09%",
  },
  {
    key: "maxentropy",
    emoji: "🎯",
    label: "Phủ sóng tối đa",
    description: "Ma trận: chia vùng phủ đều. 3D: SumRange Filter (lọc theo tổng chữ số)",
    badge: "★ Mới",
    matrixRank: 4, threeDRank: 2,
    matrixBt: "Trùng 5/6 — ROI -62%", threeDBt: "SumRange: 2.06-2.30%, ROI -35%",
  },
  {
    key: "adaptive",
    emoji: "⚡",
    label: "Tự động tối ưu",
    description: "Tự tìm cửa sổ phân tích tối ưu từ dữ liệu gần nhất",
    badge: "★ Mới",
    matrixRank: 3, threeDRank: 5,
    matrixBt: "Tốt nhất cho 5/35", threeDBt: "Exact 1.94-2.07%",
  },
  {
    key: "frequency",
    emoji: "📊",
    label: "Tần suất cao",
    description: "Ưu tiên số xuất hiện nhiều nhất — #1 cho Max 3D (2.33-2.35%)",
    matrixRank: 2, threeDRank: 1,
    matrixBt: "Win 1.51-2.78%", threeDBt: "Exact 2.33-2.35% #1",
  },
  {
    key: "absence",
    emoji: "⏳",
    label: "Số vắng lâu",
    description: "Ưu tiên các số lâu không xuất hiện — \"đến lượt\" rồi!",
    matrixRank: 5, threeDRank: 6,
    matrixBt: "Win 0.79-2.78%", threeDBt: "chưa backtest riêng",
  },
  {
    key: "mixed",
    emoji: "🎲",
    label: "Kết hợp nóng–lạnh",
    description: "Ma trận: 50/50 nóng + lạnh. 3D: digit-by-digit random trọng số",
    matrixRank: 6, threeDRank: 3,
    matrixBt: "chưa backtest riêng", threeDBt: "chưa backtest riêng",
  },
];

export function SuggestionPanel(props: SuggestionPanelProps) {
  const [strategy, setStrategy] = useState<SuggestionStrategy>(
    props.type === "3d" ? "frequency" : "bayesian"
  );
  const [count, setCount] = useState(5);
  const [countInput, setCountInput] = useState("5");
  const [results, setResults] = useState<(SuggestionSet | ThreeDSuggestionSet)[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [page, setPage] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const sortedStrategies = useMemo(() => {
    return [...STRATEGIES].sort((a, b) =>
      (props.type === "3d" ? a.threeDRank : a.matrixRank) -
      (props.type === "3d" ? b.threeDRank : b.matrixRank)
    );
  }, [props.type]);

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

  const selectedStrategy = STRATEGIES.find((s) => s.key === strategy)!;
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageStart = page * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, results.length);
  const pageResults = results.slice(pageStart, pageEnd);
  const avgWinProb = useMemo(() => {
    if (results.length === 0) return 0;
    return results.reduce((s, r) => s + (r.winProbability ?? 0), 0) / results.length;
  }, [results]);
  const combinedWinProb = useMemo(() => {
    if (results.length === 0) return 0;
    let pLose = 1;
    for (const r of results) pLose *= 1 - (r.winProbability ?? 0);
    return 1 - pLose;
  }, [results]);

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

      {/* Strategy selector — sorted by backtest rank */}
      <div>
        <label className="text-sm font-semibold mb-3 block text-muted-foreground uppercase tracking-wider">
          Chọn chiến lược{" "}
          <span className="normal-case font-normal">
            (xếp theo backtest{props.type === "3d" ? " — Max 3D" : " — ma trận"})
          </span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedStrategies.map((s, idx) => {
            const bt = props.type === "3d" ? s.threeDBt : s.matrixBt;
            return (
            <button
              key={s.key}
              onClick={() => setStrategy(s.key)}
              className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                strategy === s.key
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border hover:border-muted-foreground/30"
              }`}
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
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="text-muted-foreground">{results.length} bộ số</span>
              {avgWinProb > 0 && (
                <>
                  <span className="h-3 w-px bg-border" />
                  <span className="font-mono text-muted-foreground">
                    TB mỗi bộ: <span className="text-foreground font-bold">{(avgWinProb * 100).toFixed(2)}%</span>
                  </span>
                  <span className="h-3 w-px bg-border" />
                  <span className="font-mono text-muted-foreground">
                    Tổng hợp {results.length} bộ: <span className="text-green-400 font-bold">{(combinedWinProb * 100).toFixed(2)}%</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Win probability explanation */}
          {avgWinProb > 0 && (
            <div className="rounded-lg bg-muted/30 border border-border/50 px-4 py-2.5 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">📐 Tỷ lệ thắng:</span>{" "}
              {props.type === "matrix"
                ? "P(≥3 số trùng) tính bằng phân phối siêu hình học (hypergeometric). \"Tổng hợp\" = xác suất thắng ≥1 lần nếu mua tất cả bộ số."
                : "P(≥1 số trùng khớp chính xác trong 20 số quay). \"Tổng hợp\" = xác suất thắng ≥1 lần nếu mua tất cả bộ số."}
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
              const prob = set.winProbability ?? 0;
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

                    {/* Win probability */}
                    {prob > 0 && (
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-mono font-bold" style={{ color: props.color }}>
                          {(prob * 100).toFixed(2)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">tỷ lệ thắng</div>
                      </div>
                    )}

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

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const STRATEGIES: { key: SuggestionStrategy; emoji: string; label: string; description: string }[] = [
  {
    key: "frequency",
    emoji: "📊",
    label: "Tần suất cao",
    description: "Ưu tiên các số xuất hiện nhiều nhất trong lịch sử",
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
    label: "Kết hợp thông minh",
    description: "Pha trộn số nóng & số lạnh để cân bằng xác suất",
  },
];

export function SuggestionPanel(props: SuggestionPanelProps) {
  const [strategy, setStrategy] = useState<SuggestionStrategy>("mixed");
  const [count, setCount] = useState(5);
  const [results, setResults] = useState<(SuggestionSet | ThreeDSuggestionSet)[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    setIsRevealing(true);
    setRevealedCount(0);
    const generated = props.onGenerate(strategy, count);
    setResults(generated);

    // Staggered reveal animation
    generated.forEach((_, i) => {
      setTimeout(() => {
        setRevealedCount((prev) => prev + 1);
        if (i === generated.length - 1) {
          setIsRevealing(false);
        }
      }, 200 + i * 150);
    });

    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  };

  const selectedStrategy = STRATEGIES.find((s) => s.key === strategy)!;

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

      {/* Strategy selector — card style */}
      <div>
        <label className="text-sm font-semibold mb-3 block text-muted-foreground uppercase tracking-wider">
          Chọn chiến lược
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STRATEGIES.map((s) => (
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
              <div className="text-2xl mb-2">{s.emoji}</div>
              <div className="font-bold text-sm">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Count + Generate */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tạo</span>
          <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3, 5, 10, 20].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">bộ số</span>
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
        <div ref={resultsRef} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              🎰 Kết quả gợi ý
              <Badge variant="secondary" className="text-xs">
                {selectedStrategy.emoji} {selectedStrategy.label}
              </Badge>
            </h3>
            <span className="text-xs text-muted-foreground">
              {results.length} bộ số
            </span>
          </div>

          <div className="space-y-2">
            {results.map((set, i) => {
              const isVisible = i < revealedCount;
              return (
                <Card
                  key={`${strategy}-${count}-${i}`}
                  className={`transition-all duration-500 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  } ${i === 0 ? "ring-2 ring-primary/20" : ""}`}
                >
                  <CardContent className="flex items-center gap-4 py-4 px-5">
                    {/* Rank */}
                    <div
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0
                          ? "text-white shadow-lg"
                          : i < 3
                            ? "bg-muted text-foreground"
                            : "bg-muted/50 text-muted-foreground"
                      }`}
                      style={i === 0 ? { backgroundColor: props.color } : undefined}
                    >
                      {i === 0 ? "★" : `#${i + 1}`}
                    </div>

                    {/* Numbers */}
                    <div className="flex flex-wrap gap-2 flex-1">
                      {props.type === "matrix"
                        ? (set as SuggestionSet).numbers.map((n, j) => (
                            <NumberBall key={j} number={n} size="md" />
                          ))
                        : (set as ThreeDSuggestionSet).numbers.map((n, j) => (
                            <span
                              key={j}
                              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-base font-mono font-bold text-white shadow-sm"
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

                    {/* Copy hint for first */}
                    {i === 0 && (
                      <Badge variant="outline" className="hidden sm:flex text-[10px] shrink-0 gap-1" style={{ borderColor: props.color, color: props.color }}>
                        ⭐ Top pick
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
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

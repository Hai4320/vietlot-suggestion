"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberBall } from "./NumberBall";
import { Disclaimer } from "@/components/common/Disclaimer";
import type { SuggestionStrategy, SuggestionSet, ThreeDSuggestionSet } from "@/lib/types";

interface MatrixSuggestionPanelProps {
  type: "matrix";
  onGenerate: (strategy: SuggestionStrategy, count: number) => SuggestionSet[];
  hasSpecial: boolean;
}

interface ThreeDSuggestionPanelProps {
  type: "3d";
  onGenerate: (strategy: SuggestionStrategy, count: number) => ThreeDSuggestionSet[];
  hasSpecial?: false;
}

type SuggestionPanelProps = MatrixSuggestionPanelProps | ThreeDSuggestionPanelProps;

const STRATEGY_LABELS: Record<SuggestionStrategy, string> = {
  frequency: "📊 Dựa trên tần suất",
  absence: "⏳ Dựa trên số vắng lâu",
  mixed: "🎲 Kết hợp (nóng + lạnh)",
};

export function SuggestionPanel(props: SuggestionPanelProps) {
  const [strategy, setStrategy] = useState<SuggestionStrategy>("mixed");
  const [count, setCount] = useState(5);
  const [results, setResults] = useState<(SuggestionSet | ThreeDSuggestionSet)[]>([]);

  const handleGenerate = () => {
    const generated = props.onGenerate(strategy, count);
    setResults(generated);
  };

  return (
    <div className="space-y-4">
      <Disclaimer />

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm font-medium mb-1 block">Chiến lược</label>
          <Select value={strategy} onValueChange={(v) => setStrategy(v as SuggestionStrategy)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STRATEGY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Số bộ</label>
          <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3, 5, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerate} className="px-6">
          ✨ Tạo gợi ý
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 mt-4">
          {results.map((set, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <span className="text-sm text-muted-foreground w-8">#{i + 1}</span>
              <div className="flex flex-wrap gap-1.5">
                {props.type === "matrix"
                  ? (set as SuggestionSet).numbers.map((n, j) => (
                      <NumberBall key={j} number={n} size="md" />
                    ))
                  : (set as ThreeDSuggestionSet).numbers.map((n, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-mono font-bold bg-primary text-primary-foreground"
                      >
                        {n}
                      </span>
                    ))}
                {props.type === "matrix" && props.hasSpecial && (set as SuggestionSet).special !== undefined && (
                  <NumberBall number={(set as SuggestionSet).special!} variant="special" size="md" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

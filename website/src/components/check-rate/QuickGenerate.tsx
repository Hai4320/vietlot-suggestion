"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadDraws, registeredGames } from "@/lib/check-rate";
import { MATRIX_PRODUCTS } from "@/lib/products-config";
import { generateSuggestions } from "@/lib/suggest-matrix";
import type { MatrixDraw, SuggestionStrategy } from "@/lib/types";

const MATRIX_STRATEGIES: { key: SuggestionStrategy; label: string; note?: string }[] = [
  { key: "pattern", label: "Pattern — structural spacing", note: "top-ranked" },
  { key: "mindistance", label: "Min-distance diversity", note: "Chu kỳ 22" },
  { key: "frequency", label: "Frequency (hot)" },
  { key: "absence", label: "Absence (cold)" },
  { key: "mixed", label: "Mixed hot+cold" },
  { key: "bayesian", label: "Bayesian / Dirichlet" },
  { key: "maxentropy", label: "Max entropy — stratified bands" },
  { key: "adaptive", label: "Adaptive window" },
  { key: "hybridparity", label: "Hybrid parity (5/35 only)" },
];

interface Props {
  onAppend: (csvRows: string) => void;
}

export function QuickGenerate({ onAppend }: Props) {
  const supported = new Set(registeredGames());
  const [game, setGame] = useState<string>(() => MATRIX_PRODUCTS.find((p) => supported.has(p.key))?.key ?? MATRIX_PRODUCTS[0].key);
  const [strategy, setStrategy] = useState<SuggestionStrategy>("pattern");
  const [count, setCount] = useState(10);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = MATRIX_PRODUCTS.find((p) => p.key === game);
  const isSupported = supported.has(game);

  async function handleGenerate() {
    if (!product) return;
    if (strategy === "hybridparity" && game !== "power_535") {
      setError("hybridparity chỉ hỗ trợ power_535.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const draws = (await loadDraws(game)) as MatrixDraw[];
      const sets = generateSuggestions(
        draws,
        product.mainCount,
        product.minNumber,
        product.maxNumber,
        product.hasSpecial,
        12,
        strategy,
        count,
      );
      const algoLabel = (label.trim() || strategy).replace(/[^A-Za-z0-9_-]+/g, "_");
      const header = "game,algorithm,ticket_no,numbers,special\n";
      const rows = sets
        .map((s, i) => {
          const nums = s.numbers.join(" ");
          const sp = game === "power_535" && s.special !== undefined ? s.special : "";
          return `${game},${algoLabel},${i + 1},${nums},${sp}`;
        })
        .join("\n");
      onAppend(header + rows + "\n");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">Sinh gợi ý nhanh</h3>
        <span className="text-xs text-muted-foreground">— tự động điền CSV từ thuật toán có sẵn</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Trò chơi</span>
          <select
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            value={game}
            onChange={(e) => setGame(e.target.value)}
          >
            {MATRIX_PRODUCTS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.emoji} {p.name} {supported.has(p.key) ? "" : "(chưa hỗ trợ)"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span className="text-xs text-muted-foreground">Thuật toán</span>
          <select
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as SuggestionStrategy)}
          >
            {MATRIX_STRATEGIES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
                {s.note ? ` — ${s.note}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Số vé</span>
          <Input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 10)))}
          />
        </label>
      </div>

      <div className="flex items-end gap-2 flex-wrap">
        <label className="flex flex-col gap-1 text-sm flex-1 min-w-[160px]">
          <span className="text-xs text-muted-foreground">Nhãn thuật toán (tùy chọn)</span>
          <Input
            placeholder={strategy}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <Button onClick={handleGenerate} disabled={busy || !isSupported}>
          {busy ? "Đang sinh…" : "Sinh + append vào CSV"}
        </Button>
      </div>

      {!isSupported && (
        <div className="text-xs text-muted-foreground">
          <Badge variant="outline">{game}</Badge> chưa có evaluator — bạn vẫn có thể sinh tickets,
          nhưng kết quả check-rate sẽ báo &ldquo;chưa hỗ trợ&rdquo;. Đợi Phase 2–5.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadDraws, registeredGames } from "@/lib/check-rate";
import { MATRIX_PRODUCTS, PRODUCTS, THREE_D_PRODUCTS } from "@/lib/products-config";
import { strategiesFor, type StrategyGroup } from "@/lib/strategies-metadata";
import { generate3DSuggestions } from "@/lib/suggest-3d";
import { generateSuggestions } from "@/lib/suggest-matrix";
import type { MatrixDraw, SuggestionStrategy, ThreeDDraw } from "@/lib/types";

type ProductGroup = Exclude<StrategyGroup, "both">;

interface Props {
  onAppend: (csvRows: string) => void;
}

function firstStrategyFor(group: ProductGroup, productKey?: string): SuggestionStrategy {
  const available = strategiesFor(group, productKey);
  return available[0]?.key ?? "frequency";
}

export function QuickGenerate({ onAppend }: Props) {
  const supported = new Set(registeredGames());
  const [game, setGame] = useState<string>(() => {
    const firstSupported = PRODUCTS.find((p) => supported.has(p.key));
    return firstSupported?.key ?? PRODUCTS[0].key;
  });
  const product = PRODUCTS.find((p) => p.key === game);
  const group: ProductGroup = product?.group === "3d" ? "3d" : "matrix";
  const availableStrategies = strategiesFor(group, game);
  const [strategy, setStrategy] = useState<SuggestionStrategy>(() => firstStrategyFor(group, game));
  const [count, setCount] = useState(10);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = supported.has(game);

  // Reset strategy if user switches to a product group the current strategy doesn't fit
  useEffect(() => {
    const stillAvailable = availableStrategies.some((s) => s.key === strategy);
    if (!stillAvailable) setStrategy(firstStrategyFor(group, game));
  }, [game, group, strategy, availableStrategies]);

  async function handleGenerate() {
    if (!product) return;
    const meta = availableStrategies.find((s) => s.key === strategy);
    if (!meta) {
      setError(`${strategy} không áp dụng cho ${game}.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const algoLabel = (label.trim() || strategy).replace(/[^A-Za-z0-9_-]+/g, "_");
      const header = "game,algorithm,ticket_no,numbers,special\n";
      let body: string;

      if (group === "matrix" && product.group === "matrix") {
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
        body = sets
          .map((s, i) => {
            const nums = s.numbers.join(" ");
            const sp = game === "power_535" && s.special !== undefined ? s.special : "";
            return `${game},${algoLabel},${i + 1},${nums},${sp}`;
          })
          .join("\n");
      } else {
        // loadDraws is typed for matrix — at runtime it returns whatever shape
        // the public JSON has, which for 3D is a tier dict. Go via unknown to
        // bypass the narrow Draw type.
        const draws = (await loadDraws(game)) as unknown as ThreeDDraw[];
        // 3D generator returns sets of multiple 3-digit numbers per "set".
        // For 3d: each number = one ticket; for 3d_pro: pair adjacent (A, B).
        const numbersPerTicket = game === "3d_pro" ? 2 : 1;
        const totalNumbersNeeded = count * numbersPerTicket;
        const setsCountHint = Math.max(1, Math.ceil(totalNumbersNeeded / 6));
        const sets = generate3DSuggestions(draws, strategy, setsCountHint);
        const allNumbers = sets.flatMap((s) => s.numbers);
        if (allNumbers.length < totalNumbersNeeded) {
          throw new Error(
            `Generator chỉ trả về ${allNumbers.length} số, cần ${totalNumbersNeeded}.`,
          );
        }
        if (game === "3d_pro") {
          // Pair adjacent numbers: [n1, n2, n3, n4, ...] → (n1,n2), (n3,n4), ...
          const rows: string[] = [];
          for (let i = 0; i < count; i++) {
            const a = allNumbers[i * 2];
            const b = allNumbers[i * 2 + 1];
            rows.push(`${game},${algoLabel},${i + 1},${a} ${b},`);
          }
          body = rows.join("\n");
        } else {
          const picked = allNumbers.slice(0, count);
          body = picked.map((num, i) => `${game},${algoLabel},${i + 1},${num},`).join("\n");
        }
      }
      onAppend(header + body + "\n");
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
            <optgroup label="Matrix">
              {MATRIX_PRODUCTS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.emoji} {p.name} {supported.has(p.key) ? "" : "(chưa hỗ trợ)"}
                </option>
              ))}
            </optgroup>
            <optgroup label="3D">
              {THREE_D_PRODUCTS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.emoji} {p.name} {supported.has(p.key) ? "" : "(chưa hỗ trợ)"}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          <span className="text-xs text-muted-foreground">Thuật toán</span>
          <select
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as SuggestionStrategy)}
          >
            {availableStrategies.map((s) => (
              <option key={s.key} value={s.key}>
                {s.emoji} {s.label}
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
          nhưng kết quả check-rate sẽ báo &ldquo;chưa hỗ trợ&rdquo;. Đợi các phase sau.
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

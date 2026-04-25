"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateSuggestions } from "@/lib/suggest-matrix";
import { generate3DSuggestions } from "@/lib/suggest-3d";
import {
  getPortfolio,
  anchorToTSStrategy,
  CYCLE24_BUDGET_VND,
  CYCLE24_N_TICKETS,
  type C24Portfolio,
  type C24ProductKey,
} from "@/lib/cycle24-data";
import type {
  MatrixDraw,
  ThreeDDraw,
  SuggestionSet,
  ThreeDSuggestionSet,
  ProductInfo,
} from "@/lib/types";

interface BudgetWidgetProps {
  product: ProductInfo;
  matrixDraws?: MatrixDraw[];
  threeDDraws?: ThreeDDraw[];
}

type Ticket =
  | { type: "matrix"; numbers: number[]; special?: number }
  | { type: "3d"; number: string }
  | { type: "3d_pro"; a: string; b: string };

function slugToProductKey(slug: string): C24ProductKey {
  const map: Record<string, C24ProductKey> = {
    "power-655": "power_655",
    "power-645": "power_645",
    "power-535": "power_535",
    "max-3d": "max_3d",
    "max-3d-pro": "max_3d_pro",
  };
  return map[slug] ?? "power_655";
}

// Power 5/35 is the only matrix product with a 1-12 special; others hasSpecial=false
function specialMaxFor(product: ProductInfo): number {
  if (product.slug === "power-535") return 12;
  return 0;
}

function generateMatrix(
  anchor: string,
  count: number,
  product: ProductInfo,
  draws: MatrixDraw[]
): Ticket[] {
  const strategy = anchorToTSStrategy(anchor);
  const suggs: SuggestionSet[] = generateSuggestions(
    draws,
    product.mainCount,
    product.minNumber,
    product.maxNumber,
    product.hasSpecial,
    specialMaxFor(product),
    strategy,
    count,
  );
  return suggs.map((s) => ({
    type: "matrix" as const,
    numbers: s.numbers,
    special: s.special,
  }));
}

// Flatten a list of SuggestionSets into individual 3-digit strings.
// 3D suggest outputs vary — some strategies return 1 num per set, some more.
// We flatten then take exactly `need` strings.
function flattenThreeDStrings(suggs: ThreeDSuggestionSet[]): string[] {
  const out: string[] = [];
  for (const s of suggs) {
    for (const n of s.numbers) out.push(n);
  }
  return out;
}

function padRandomThreeD(): string {
  return Math.floor(Math.random() * 1000).toString().padStart(3, "0");
}

function generate3D(
  anchor: string,
  count: number,
  draws: ThreeDDraw[],
  isPro: boolean,
): Ticket[] {
  const strategy = anchorToTSStrategy(anchor);
  const multiplier = isPro ? 2 : 1;
  const need = count * multiplier;
  // Ask for `need` sets; flatten might produce more, we trim. If under, pad with random.
  const suggs: ThreeDSuggestionSet[] = generate3DSuggestions(
    draws,
    strategy,
    need,
  );
  const flat = flattenThreeDStrings(suggs);
  while (flat.length < need) flat.push(padRandomThreeD());
  const numbers = flat.slice(0, need);
  if (isPro) {
    const tickets: Ticket[] = [];
    for (let i = 0; i < count; i++) {
      tickets.push({ type: "3d_pro", a: numbers[2 * i], b: numbers[2 * i + 1] });
    }
    return tickets;
  }
  return numbers.map((n) => ({ type: "3d" as const, number: n }));
}

function buildTickets(
  portfolio: C24Portfolio,
  productKey: C24ProductKey,
  product: ProductInfo,
  matrixDraws?: MatrixDraw[],
  threeDDraws?: ThreeDDraw[],
): Ticket[] {
  const N = CYCLE24_N_TICKETS;
  const { kind, params } = portfolio;
  const isMatrix = product.group === "matrix";
  const isPro = productKey === "max_3d_pro";

  const gen = (anchor: string, c: number): Ticket[] => {
    if (isMatrix) return generateMatrix(anchor, c, product, matrixDraws ?? []);
    return generate3D(anchor, c, threeDDraws ?? [], isPro);
  };

  if (kind === "pure") {
    return gen(params.strat ?? "", N);
  }
  if (kind === "mixed") {
    const k = params.k ?? 5;
    const t1 = gen(params.s1 ?? "", k);
    const t2 = gen(params.s2 ?? "", N - k);
    return [...t1, ...t2];
  }
  if (kind === "hedged") {
    const k = params.k ?? 7;
    const t1 = gen(params.strat ?? "", k);
    const t2 = gen("Random", N - k);
    return [...t1, ...t2];
  }
  // wheel_mindistance → treat as Pure MinDistance (TS mindistance already diverse batch)
  return gen("MinDistance", N);
}

function formatTicket(t: Ticket): string {
  if (t.type === "matrix") {
    const main = t.numbers.map((n) => n.toString().padStart(2, "0")).join(" ");
    if (t.special !== undefined) return `${main} | ${t.special.toString().padStart(2, "0")}`;
    return main;
  }
  if (t.type === "3d") return t.number;
  return `${t.a} ${t.b}`;
}

function formatVND(n: number): string {
  return n.toLocaleString("vi-VN");
}

export function BudgetWidget({ product, matrixDraws, threeDDraws }: BudgetWidgetProps) {
  const productKey = slugToProductKey(product.slug);
  const c24 = getPortfolio(productKey);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);

  if (!c24 || !c24.top_portfolio) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💰 Portfolio {formatVND(CYCLE24_BUDGET_VND)}đ</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Không có portfolio available cho sản phẩm này.
        </CardContent>
      </Card>
    );
  }

  const top = c24.top_portfolio;

  const onGenerate = () => {
    try {
      const ts = buildTickets(top, productKey, product, matrixDraws, threeDDraws);
      setTickets(ts);
    } catch (e) {
      console.error("BudgetWidget generate failed", e);
      setTickets([]);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span>💰 Portfolio {formatVND(CYCLE24_BUDGET_VND)}đ</span>
            <Badge variant="outline">{CYCLE24_N_TICKETS} vé</Badge>
          </CardTitle>
        </div>
        {c24.null_pick && (
          <div className="mt-2 rounded-md border border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            ⚠ <b>Chưa có cách nào được xác nhận có lợi thế</b> cho {product.nameVi}. Gói vé bên dưới chỉ là cách
            được xếp hạng cao nhất trong nhóm chưa kiểm chứng được — chỉ mang tính tham khảo.
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          <div className="font-medium text-foreground">{top.label}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            <div>Tiền thưởng kỳ vọng / kỳ: <span className="font-mono">{formatVND(Math.round(top.expected_payout_vnd))}đ</span></div>
            <div>Khả năng trúng ít nhất 1 vé: <span className="font-mono">{(top.p_win_ge1 * 100).toFixed(1)}%</span></div>
            <div>Lãi/lỗ lịch sử: <span className="font-mono">{top.roi_pct.toFixed(1)}%</span></div>
          </div>
        </div>

        <Button onClick={onGenerate} size="sm" className="w-full">
          ✨ Gợi ý {CYCLE24_N_TICKETS} vé cho hôm nay
        </Button>

        {tickets && tickets.length > 0 && (
          <div className="text-xs font-mono bg-muted/50 rounded-md p-3 space-y-1">
            {tickets.map((t, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-muted-foreground w-6">#{(i + 1).toString().padStart(2, "0")}</span>
                <span>{formatTicket(t)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-[11px] text-muted-foreground leading-relaxed">
          Lưu ý: Lãi/lỗ kỳ vọng vẫn âm — gói vé này không đảm bảo có lãi.
          {" "}
          {c24.null_pick
            ? "Sản phẩm này chưa có cách chơi nào kiểm chứng được — số chỉ mang tính tham khảo."
            : "Cách chơi này nằm trong nhóm xếp hạng cao của đợt nghiên cứu mới nhất."}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BACKTEST_MATRIX,
  BACKTEST_3D,
  type MatrixBacktest,
  type ThreeDBacktest,
} from "@/lib/backtest-data";

interface Props {
  slug: string;
  color: string;
}

export function BacktestCard({ slug, color }: Props) {
  const [open, setOpen] = useState(false);
  const matrixData = BACKTEST_MATRIX[slug];
  const threeDData = BACKTEST_3D[slug];

  if (!matrixData && !threeDData) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <div
          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white transition-transform"
          style={{ backgroundColor: color, transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </div>
        <span className="text-sm font-semibold group-hover:underline">
          📊 Bảng đánh giá xác suất thống kê
        </span>
        <Badge variant="outline" className="text-[10px] ml-auto">
          {matrixData
            ? `${matrixData.totalDraws.toLocaleString()} kỳ`
            : `${threeDData!.totalDraws.toLocaleString()} kỳ`}
        </Badge>
      </button>

      {open && (
        <Card className="overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <CardContent className="p-0">
            {matrixData ? (
              <MatrixTable data={matrixData} color={color} />
            ) : (
              <ThreeDTable data={threeDData!} color={color} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MatrixTable({ data, color }: { data: MatrixBacktest; color: string }) {
  return (
    <div>
      <div className="px-4 py-2.5 border-b text-xs text-muted-foreground flex items-center justify-between" style={{ background: `${color}08` }}>
        <span className="font-semibold">{data.label} — Walk-forward Backtest</span>
        <span>E[trùng] = {data.baseline.E} | P(≥3) = {data.baseline.winPct}%</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-[11px]">#</TableHead>
              <TableHead className="text-[11px]">Thuật toán</TableHead>
              <TableHead className="text-right text-[11px]">TB Trùng</TableHead>
              <TableHead className="text-right text-[11px]">Δ</TableHead>
              <TableHead className="text-right text-[11px]">Win %</TableHead>
              <TableHead className="text-right text-[11px]">ROI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.strategies.map((s, i) => (
              <TableRow
                key={s.name}
                className={
                  i === 0 ? "bg-primary/5 font-medium" : s.type === "base" ? "bg-muted/30" : ""
                }
              >
                <TableCell className="text-muted-foreground text-[11px]">
                  {i === 0 ? "🏆" : i + 1}
                </TableCell>
                <TableCell className="text-[12px]">
                  <div className="flex items-center gap-1">
                    {s.name}
                    {s.type === "new" && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0">MỚI</Badge>
                    )}
                    {s.type === "base" && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0">baseline</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-[12px]">
                  {s.avg.toFixed(4)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-[12px] ${
                    s.delta > 0 ? "text-green-400" : s.delta < -0.005 ? "text-red-400" : "text-muted-foreground"
                  }`}
                >
                  {s.delta > 0 ? "+" : ""}{s.delta.toFixed(4)}
                </TableCell>
                <TableCell className="text-right font-mono text-[12px]">
                  {s.winPct.toFixed(2)}%
                </TableCell>
                <TableCell className="text-right font-mono text-[12px] text-red-400">
                  {s.roi.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="px-4 py-1.5 border-t bg-muted/20 text-[10px] text-muted-foreground space-y-0.5">
        <div>Δ = chênh lệch so với kỳ vọng toán học | Win % = tỷ lệ trùng ≥3 số (per-ticket) | ROI = lợi nhuận trên chi phí vé</div>
        {data.strategies.some((s) => s.name.includes("Hybrid Parity")) && (
          <div className="text-yellow-600 dark:text-yellow-400">
            🔬 Hybrid Parity: Win % = P(≥1 vé trong N=20 trúng ≥3) — thang đo đa vé, không so sánh trực tiếp per-ticket với các dòng khác.
          </div>
        )}
      </div>
    </div>
  );
}

function ThreeDTable({ data, color }: { data: ThreeDBacktest; color: string }) {
  return (
    <div>
      <div className="px-4 py-2.5 border-b text-xs text-muted-foreground flex items-center justify-between" style={{ background: `${color}08` }}>
        <span className="font-semibold">{data.label} — Walk-forward Backtest</span>
        <span>Baseline exact = {data.baseline.exactPct}%</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-[11px]">#</TableHead>
              <TableHead className="text-[11px]">Chiến lược</TableHead>
              <TableHead className="text-right text-[11px]">Exact %</TableHead>
              <TableHead className="text-right text-[11px]">vs Baseline</TableHead>
              <TableHead className="text-right text-[11px]">ROI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.strategies.map((s, i) => (
              <TableRow
                key={s.name}
                className={
                  i === 0 ? "bg-primary/5 font-medium"
                    : s.type === "base" ? "bg-muted/30"
                    : s.type === "research" ? "bg-orange-500/5"
                    : ""
                }
              >
                <TableCell className="text-muted-foreground text-[11px]">
                  {i === 0 ? "🏆" : i + 1}
                </TableCell>
                <TableCell className="text-[12px]">
                  <div className="flex items-center gap-1">
                    {s.name}
                    {s.type === "new" && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0">MỚI</Badge>
                    )}
                    {s.type === "research" && (
                      <Badge className="bg-orange-500 text-white text-[8px] px-1 py-0">🔬</Badge>
                    )}
                    {s.type === "base" && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0">baseline</Badge>
                    )}
                    {s.type === "best" && (
                      <Badge className="bg-green-600 text-white text-[8px] px-1 py-0">#1</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-[12px]">
                  {s.exactPct.toFixed(3)}%
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-[12px] ${
                    s.exactPct > data.baseline.exactPct
                      ? "text-green-400"
                      : s.exactPct < data.baseline.exactPct - 0.05
                        ? "text-red-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {s.exactPct > data.baseline.exactPct ? "+" : ""}
                  {(s.exactPct - data.baseline.exactPct).toFixed(3)}%
                </TableCell>
                <TableCell className="text-right font-mono text-[12px] text-red-400">
                  {s.roi.toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="px-4 py-1.5 border-t bg-muted/20 text-[10px] text-muted-foreground">
        Exact % = tỷ lệ trùng khớp chính xác | vs Baseline = so với random (2.0%) | ROI = lợi nhuận trên chi phí vé
      </div>
    </div>
  );
}

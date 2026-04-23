"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EvalResult, HistoryMatch } from "@/lib/check-rate";
import { formatVnd, roi } from "@/lib/check-rate";

interface ResultCardProps {
  result: EvalResult;
  histories: HistoryMatch[];
}

export function ResultCard({ result, histories }: ResultCardProps) {
  const nPlays = result.nTickets * result.nDraws;
  const roiValue = roi(result);
  const roiSign = roiValue >= 0 ? "+" : "";

  const prizeRows = Object.entries(result.prizeCounter)
    .map(([name, count]) => ({
      name,
      count,
      winnings: result.prizeWinnings[name] ?? 0,
      pct: nPlays ? (count / nPlays) * 100 : 0,
    }))
    .sort((a, b) => b.winnings - a.winnings);

  const matchRows = Object.entries(result.matchDist)
    .map(([k, v]) => ({
      key: k,
      count: v,
      pct: nPlays ? (v / nPlays) * 100 : 0,
    }))
    .sort((a, b) => Number(b.key) - Number(a.key));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{result.game}</Badge>
          <span>/ {result.algorithm}</span>
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {result.nTickets} tickets × {result.nDraws} kỳ = {nPlays} plays
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Prize tiers */}
        <section>
          <h3 className="text-sm font-semibold mb-2">Trúng giải</h3>
          {prizeRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không trúng giải nào trong cửa sổ backtest.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giải</TableHead>
                  <TableHead className="text-right">Số lần</TableHead>
                  <TableHead className="text-right">% plays</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prizeRows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right">{r.count}</TableCell>
                    <TableCell className="text-right">{r.pct.toFixed(2)}%</TableCell>
                    <TableCell className="text-right font-mono">{formatVnd(r.winnings)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        {/* Match distribution */}
        <section>
          <h3 className="text-sm font-semibold mb-2">Phân bố số trùng</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Số trùng</TableHead>
                <TableHead className="text-right">Lần</TableHead>
                <TableHead className="text-right">%</TableHead>
                <TableHead className="w-full">Tỉ lệ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchRows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">{r.key}</TableCell>
                  <TableCell className="text-right">{r.count}</TableCell>
                  <TableCell className="text-right">{r.pct.toFixed(2)}%</TableCell>
                  <TableCell>
                    <div className="h-2 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(r.pct, 100).toFixed(2)}%` }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        {/* ROI */}
        <section className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Tổng chi</div>
            <div className="font-mono">{formatVnd(result.totalCost)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Tổng thắng</div>
            <div className="font-mono">{formatVnd(result.totalWinnings)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">ROI (tham chiếu)</div>
            <div className={`font-mono ${roiValue >= 0 ? "text-green-600" : "text-red-600"}`}>
              {roiSign}
              {roiValue.toFixed(2)}%
            </div>
          </div>
        </section>

        {/* Exact-match history */}
        <section>
          <h3 className="text-sm font-semibold mb-2">Lịch sử trùng y hệt</h3>
          <div className="space-y-1.5 text-sm">
            {histories.map((h) => (
              <div key={h.ticketNo} className="flex items-start gap-2 flex-wrap">
                <span className="text-muted-foreground w-16 shrink-0">Vé #{h.ticketNo}</span>
                <span className="font-mono">{h.numbersDisplay}</span>
                <span className="text-muted-foreground">
                  →{" "}
                  {h.totalHits === 0
                    ? "chưa từng trùng"
                    : `${h.totalHits} lần (${Object.entries(h.byTier)
                        .filter(([, v]) => v > 0)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")})`}
                </span>
                {h.occurrences.length > 0 && (
                  <span className="w-full pl-16 text-xs text-muted-foreground">
                    {h.occurrences.slice(-3).map((o) => `${o[0]} #${o[1]}`).join("  ·  ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EvalResult } from "@/lib/check-rate";
import { formatVnd, roi } from "@/lib/check-rate";

interface GroupSummary {
  key: string;
  game: string;
  algorithm: string;
  result: EvalResult;
}

interface SummaryCardProps {
  /** Tất cả các nhóm (game × cách chọn số) đã được tra. */
  groups: GroupSummary[];
}

export function SummaryCard({ groups }: SummaryCardProps) {
  if (groups.length === 0) return null;

  const totalTickets = groups.reduce((s, g) => s + g.result.nTickets, 0);
  const totalPlays = groups.reduce((s, g) => s + g.result.nTickets * g.result.nDraws, 0);
  const totalCost = groups.reduce((s, g) => s + g.result.totalCost, 0);
  const totalWinnings = groups.reduce((s, g) => s + g.result.totalWinnings, 0);
  const totalRoi = totalCost > 0 ? ((totalWinnings - totalCost) / totalCost) * 100 : 0;
  const totalHits = groups.reduce(
    (s, g) => s + Object.values(g.result.prizeCounter).reduce((a, b) => a + b, 0),
    0,
  );

  // Tổng hợp số lần trúng theo từng giải qua mọi nhóm
  const prizeAggregate: Record<string, { count: number; winnings: number }> = {};
  for (const g of groups) {
    for (const [name, count] of Object.entries(g.result.prizeCounter)) {
      const w = g.result.prizeWinnings[name] ?? 0;
      const cur = prizeAggregate[name] ?? { count: 0, winnings: 0 };
      prizeAggregate[name] = { count: cur.count + count, winnings: cur.winnings + w };
    }
  }
  const prizeRows = Object.entries(prizeAggregate)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.winnings - a.winnings);

  // So sánh các nhóm: tính ROI + tổng số lần trúng + tổng thắng cho từng group
  const compareRows = groups
    .map((g) => {
      const groupPlays = g.result.nTickets * g.result.nDraws;
      const groupHits = Object.values(g.result.prizeCounter).reduce((a, b) => a + b, 0);
      const groupRoi = roi(g.result);
      return {
        key: g.key,
        game: g.game,
        algorithm: g.algorithm,
        nTickets: g.result.nTickets,
        nDraws: g.result.nDraws,
        plays: groupPlays,
        hits: groupHits,
        winnings: g.result.totalWinnings,
        cost: g.result.totalCost,
        roi: groupRoi,
        hitRate: groupPlays > 0 ? (groupHits / groupPlays) * 100 : 0,
      };
    })
    .sort((a, b) => b.roi - a.roi);

  const bestRoi = compareRows[0]?.roi ?? -Infinity;
  const bestHits = Math.max(...compareRows.map((r) => r.hits));
  const bestWinnings = Math.max(...compareRows.map((r) => r.winnings));

  // Liệt kê các sản phẩm đã có trong CSV
  const games = Array.from(new Set(groups.map((g) => g.game)));

  return (
    <Card className="w-full border-primary/40 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">📊 Tổng hợp toàn bộ</span>
          <Badge variant="outline" className="text-xs">
            {groups.length} cách chọn số
          </Badge>
          {games.map((g) => (
            <Badge key={g} variant="secondary" className="text-xs">
              {g}
            </Badge>
          ))}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Bốn ô số liệu chính */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Tổng số vé</div>
            <div className="text-2xl font-extrabold">{totalTickets}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              ({totalPlays.toLocaleString("vi-VN")} lần thử trên lịch sử)
            </div>
          </div>
          <div className="rounded-lg border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Số lần trúng giải</div>
            <div className="text-2xl font-extrabold">{totalHits}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              ({totalPlays > 0 ? ((totalHits / totalPlays) * 100).toFixed(2) : "0.00"}% của tổng lần thử)
            </div>
          </div>
          <div className="rounded-lg border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Tổng tiền thưởng</div>
            <div className="text-xl font-extrabold font-mono">{formatVnd(totalWinnings)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              chi phí giả định: {formatVnd(totalCost)}
            </div>
          </div>
          <div className="rounded-lg border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">Lãi/lỗ tổng (giả định)</div>
            <div
              className={`text-2xl font-extrabold font-mono ${
                totalRoi >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {totalRoi >= 0 ? "+" : ""}
              {totalRoi.toFixed(2)}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              nếu mua đủ tất cả các vé qua mọi kỳ
            </div>
          </div>
        </div>

        {/* Bảng so sánh các nhóm */}
        {compareRows.length >= 2 && (
          <section>
            <h3 className="text-sm font-semibold mb-2">So sánh các cách chọn số</h3>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cách chọn số</TableHead>
                    <TableHead className="text-right">Số vé</TableHead>
                    <TableHead className="text-right">Số lần trúng</TableHead>
                    <TableHead className="text-right">% lần trúng</TableHead>
                    <TableHead className="text-right">Tổng thưởng</TableHead>
                    <TableHead className="text-right">Lãi/lỗ %</TableHead>
                    <TableHead>Đánh giá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compareRows.map((r) => {
                    const isBestRoi = r.roi === bestRoi && bestRoi > -Infinity;
                    const isBestHits = r.hits === bestHits && bestHits > 0;
                    const isBestWinnings = r.winnings === bestWinnings && bestWinnings > 0;
                    return (
                      <TableRow key={r.key}>
                        <TableCell className="font-medium">
                          <div>{r.algorithm}</div>
                          <div className="text-[10px] text-muted-foreground">{r.game}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{r.nTickets}</TableCell>
                        <TableCell className="text-right font-mono">{r.hits}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {r.hitRate.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatVnd(r.winnings)}</TableCell>
                        <TableCell
                          className={`text-right font-mono ${
                            r.roi >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {r.roi >= 0 ? "+" : ""}
                          {r.roi.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {isBestRoi && (
                              <Badge className="bg-green-600 hover:bg-green-700 text-[9px]">
                                💰 Lãi/lỗ tốt nhất
                              </Badge>
                            )}
                            {isBestHits && !isBestRoi && (
                              <Badge variant="secondary" className="text-[9px]">
                                🎯 Trúng nhiều nhất
                              </Badge>
                            )}
                            {isBestWinnings && !isBestRoi && !isBestHits && (
                              <Badge variant="secondary" className="text-[9px]">
                                💵 Thưởng cao nhất
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 italic">
              Bảng trên chỉ phản ánh kết quả khi áp các vé này lên dữ liệu lịch sử — KHÔNG đảm bảo
              kỳ tới. Mọi cách chơi xổ số đều có lãi/lỗ kỳ vọng âm về dài hạn.
            </p>
          </section>
        )}

        {/* Tổng các giải đã trúng */}
        {prizeRows.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold mb-2">Tổng các giải đã trúng (qua mọi cách)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giải</TableHead>
                  <TableHead className="text-right">Tổng số lần</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prizeRows.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right font-mono">{p.count}</TableCell>
                    <TableCell className="text-right font-mono">{formatVnd(p.winnings)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        )}

        {totalHits === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Không có vé nào trúng giải khi áp lên dữ liệu lịch sử trong cửa sổ đã chọn.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

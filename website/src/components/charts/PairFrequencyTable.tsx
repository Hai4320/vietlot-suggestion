"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { NumberBall } from "@/components/products/NumberBall";
import type { NumberPair } from "@/lib/types";

interface PairFrequencyTableProps {
  data: NumberPair[];
}

export function PairFrequencyTable({ data }: PairFrequencyTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Cặp số</TableHead>
            <TableHead className="text-right">Số lần</TableHead>
            <TableHead className="text-right">Tỉ lệ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, i) => (
            <TableRow key={`${item.pair[0]}-${item.pair[1]}`}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <NumberBall number={item.pair[0]} size="sm" />
                  <span className="text-muted-foreground mx-1">+</span>
                  <NumberBall number={item.pair[1]} size="sm" />
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold">{item.count}</TableCell>
              <TableCell className="text-right text-muted-foreground">{item.percentage.toFixed(1)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

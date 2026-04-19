"use client";

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { NumberBall } from "./NumberBall";
import type { MatrixDraw } from "@/lib/types";

interface MatrixResultTableProps {
  draws: MatrixDraw[];
  mainCount: number;
  hasSpecial: boolean;
  pageSize?: number;
}

export function MatrixResultTable({ draws, mainCount, hasSpecial, pageSize = 20 }: MatrixResultTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(draws.length / pageSize);
  const paged = draws.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Ngày</TableHead>
              <TableHead className="w-20">Kỳ</TableHead>
              <TableHead>Kết quả</TableHead>
              {hasSpecial && <TableHead className="w-20">Đặc biệt</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((draw) => (
              <TableRow key={draw.id}>
                <TableCell className="font-mono text-sm">{draw.date}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{draw.id}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {draw.result.slice(0, mainCount).map((n, i) => (
                      <NumberBall key={i} number={n} size="sm" />
                    ))}
                  </div>
                </TableCell>
                {hasSpecial && (
                  <TableCell>
                    {draw.special !== undefined && <NumberBall number={draw.special} variant="special" size="sm" />}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            ← Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Sau →
          </Button>
        </div>
      )}
    </div>
  );
}

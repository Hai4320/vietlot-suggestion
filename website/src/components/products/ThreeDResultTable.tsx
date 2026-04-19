"use client";

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { ThreeDDraw } from "@/lib/types";

interface ThreeDResultTableProps {
  draws: ThreeDDraw[];
  pageSize?: number;
}

const TIER_LABELS: Record<string, string> = {
  special: "🏆 Giải Đặc biệt",
  first: "🥇 Giải Nhất",
  second: "🥈 Giải Nhì",
  third: "🥉 Giải Ba",
};

const TIER_COLORS: Record<string, string> = {
  special: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  first: "bg-red-500/10 text-red-300 border-red-500/20",
  second: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  third: "bg-green-500/10 text-green-300 border-green-500/20",
};

export function ThreeDResultTable({ draws, pageSize = 15 }: ThreeDResultTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(draws.length / pageSize);
  const paged = draws.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <div className="space-y-3">
        {paged.map((draw) => (
          <div key={draw.id} className="rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-sm font-semibold">{draw.date}</span>
              <span className="text-xs text-muted-foreground">Kỳ #{draw.id}</span>
            </div>
            <div className="space-y-2">
              {(["special", "first", "second", "third"] as const).map((tier) => {
                const numbers = draw.result[tier];
                if (!numbers || numbers.length === 0) return null;
                return (
                  <div key={tier} className="flex items-start gap-3">
                    <span className="text-xs font-medium w-32 shrink-0 pt-1">{TIER_LABELS[tier]}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {numbers.map((n, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-sm font-mono font-bold border ${TIER_COLORS[tier]}`}
                        >
                          {n.padStart(3, "0")}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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

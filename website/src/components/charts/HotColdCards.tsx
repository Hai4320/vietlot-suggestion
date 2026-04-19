"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberBall } from "@/components/products/NumberBall";
import type { HotColdNumber } from "@/lib/types";

interface HotColdCardsProps {
  hot: HotColdNumber[];
  cold: HotColdNumber[];
}

export function HotColdCards({ hot, cold }: HotColdCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-red-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            🔥 Số nóng <span className="text-xs text-muted-foreground font-normal">(xuất hiện nhiều nhất)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hot.map((item, i) => (
              <div key={item.number} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                <NumberBall number={item.number} variant="hot" size="sm" />
                <span className="text-sm">
                  <span className="font-semibold">{item.count}</span> lần
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {item.daysSinceLast}d trước
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            ❄️ Số lạnh <span className="text-xs text-muted-foreground font-normal">(vắng mặt lâu nhất)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cold.map((item, i) => (
              <div key={item.number} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                <NumberBall number={item.number} variant="cold" size="sm" />
                <span className="text-sm">
                  <span className="font-semibold">{item.daysSinceLast}</span> ngày vắng
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {item.count} lần
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

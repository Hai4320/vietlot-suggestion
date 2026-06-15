import Link from "next/link";
import type { ProductInfo, MatrixDraw, ThreeDDraw } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: ProductInfo;
  totalDraws?: number;
  lastDate?: string;
  latestDraw?: MatrixDraw | ThreeDDraw;
}

function isMatrixDraw(draw: MatrixDraw | ThreeDDraw): draw is MatrixDraw {
  return Array.isArray((draw as MatrixDraw).result);
}

export function ProductCard({ product, totalDraws, lastDate, latestDraw }: ProductCardProps) {
  return (
    <Link href={`/${product.slug}`}>
      <Card className="h-full transition-all hover:border-primary/50 hover:-translate-y-0.5 cursor-pointer group overflow-hidden">
        {/* Color accent bar */}
        <div className="h-1" style={{ background: product.color }} />
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{product.emoji}</span>
              <div>
                <h3 className="font-mono font-bold text-lg group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {product.descriptionVi}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] shrink-0"
              style={{ borderColor: product.color, color: product.color }}
            >
              {product.group === "matrix" ? "Ma trận" : "Dãy số"}
            </Badge>
          </div>

          {/* Latest result */}
          {latestDraw && (
            <div className="bg-secondary/60 rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center justify-between font-mono text-xs text-muted-foreground tabular-nums">
                <span className="text-primary">#{latestDraw.id}</span>
                <span>{latestDraw.date}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {isMatrixDraw(latestDraw) ? (
                  <>
                    {latestDraw.result.map((n, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-mono font-bold tabular-nums text-white shadow-sm"
                        style={{ backgroundColor: product.color }}
                      >
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                    {latestDraw.special !== undefined && (
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-mono font-bold tabular-nums bg-yellow-500 text-black shadow-sm">
                        {String(latestDraw.special).padStart(2, "0")}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {latestDraw.result.special?.map((n, i) => (
                      <span
                        key={`s-${i}`}
                        className="inline-flex items-center justify-center px-2.5 h-8 rounded-md text-sm font-mono font-bold text-white shadow-sm"
                        style={{ backgroundColor: product.color }}
                      >
                        {n}
                      </span>
                    ))}
                    {latestDraw.result.first?.map((n, i) => (
                      <span
                        key={`f-${i}`}
                        className="inline-flex items-center justify-center px-2.5 h-8 rounded-md text-sm font-mono font-bold bg-muted-foreground/20 text-foreground"
                      >
                        {n}
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
            {totalDraws !== undefined && (
              <div>
                <span className="font-semibold text-foreground">{totalDraws.toLocaleString()}</span>{" "}
                kỳ quay
              </div>
            )}
            {lastDate && (
              <div className="ml-auto">
                Cập nhật: <span className="font-semibold text-foreground">{lastDate}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

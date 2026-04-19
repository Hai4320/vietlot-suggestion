import Link from "next/link";
import type { ProductInfo } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: ProductInfo;
  totalDraws?: number;
  lastDate?: string;
}

export function ProductCard({ product, totalDraws, lastDate }: ProductCardProps) {
  return (
    <Link href={`/${product.slug}`}>
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-0.5 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-2xl">{product.emoji}</span>
              {product.name}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {product.group === "matrix" ? "Ma trận" : "Dãy số"}
            </Badge>
          </div>
          <CardDescription>{product.descriptionVi}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {totalDraws !== undefined && (
              <div>
                <span className="font-semibold text-foreground">{totalDraws.toLocaleString()}</span>{" "}
                kỳ quay
              </div>
            )}
            {lastDate && (
              <div>
                Mới nhất: <span className="font-semibold text-foreground">{lastDate}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getProduct } from "@/lib/products-config";
import { loadThreeDData } from "@/lib/data-loader";
import { calcDigitFrequency, calcTopNumbers } from "@/lib/stats-3d";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThreeDResultTable } from "@/components/products/ThreeDResultTable";
import { DigitPositionChart } from "@/components/charts/DigitPositionChart";
import { TimeFilterSelect } from "@/components/common/TimeFilter";
import { PlayGuide } from "@/components/products/PlayGuide";
import { PLAY_GUIDES } from "@/lib/play-guides";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ResearchStateBanner } from "@/components/common/ResearchStateBanner";
import { C6DisclosureBanner } from "@/components/common/C6DisclosureBanner";
import type {
  ThreeDDraw,
  TimeFilter,
  ThreeDTier,
} from "@/lib/types";

interface Props {
  slug: string;
}

const TIERS: { value: ThreeDTier | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "special", label: "Đặc biệt" },
  { value: "first", label: "Giải nhất" },
  { value: "second", label: "Giải nhì" },
  { value: "third", label: "Giải ba" },
];

export default function ThreeDProductPage({ slug }: Props) {
  const product = getProduct(slug);
  const [draws, setDraws] = useState<ThreeDDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [tier, setTier] = useState<ThreeDTier | "all">("all");

  useEffect(() => {
    if (!product) return;
    loadThreeDData(product.dataFile).then((d) => {
      setDraws(d.draws);
      setLoading(false);
    });
  }, [product]);

  if (!product) return <div className="p-8 text-center">Sản phẩm không tồn tại</div>;

  const digit0 = loading ? [] : calcDigitFrequency(draws, 0, tier, timeFilter);
  const digit1 = loading ? [] : calcDigitFrequency(draws, 1, tier, timeFilter);
  const digit2 = loading ? [] : calcDigitFrequency(draws, 2, tier, timeFilter);
  const topNumbers = loading ? [] : calcTopNumbers(draws, tier, timeFilter, 30);

  const lastDraw = draws[0];

  return (
    <div className="space-y-6">
      {/* Research disclosure banner — always visible, before data loads */}
      {slug === "max-3d-pro" ? (
        <C6DisclosureBanner />
      ) : (
        <ResearchStateBanner variant="closed" size="sm" />
      )}

      {/* Product header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {product.emoji} {product.nameVi}
          </h1>
          <p className="text-muted-foreground mt-1">{product.descriptionVi}</p>
        {lastDraw && (
          <div className="mt-3 text-sm text-muted-foreground">
            <span>
              Kỳ gần nhất: #{lastDraw.id} — {lastDraw.date}
            </span>
            <div className="flex gap-2 mt-1 flex-wrap">
              {lastDraw.result.special && (
                <span>
                  ĐB:{" "}
                  {lastDraw.result.special.map((n, i) => (
                    <Badge key={i} variant="outline" className="mr-1">
                      {n}
                    </Badge>
                  ))}
                </span>
              )}
              {lastDraw.result.first && (
                <span>
                  G1:{" "}
                  {lastDraw.result.first.map((n, i) => (
                    <Badge key={i} variant="secondary" className="mr-1">
                      {n}
                    </Badge>
                  ))}
                </span>
              )}
            </div>
          </div>
        )}
        </div>
        <Link
          href={`/suggest?p=${slug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow transition-all hover:shadow-lg hover:scale-[1.02] shrink-0"
          style={{ backgroundColor: product.color }}
        >
          ✨ Gợi ý số
        </Link>
      </div>

      {/* Main content */}
      <Tabs defaultValue="results">
        <TabsList className="flex-wrap">
          <TabsTrigger value="results">Kết quả</TabsTrigger>
          <TabsTrigger value="digits">Tần suất chữ số</TabsTrigger>
          <TabsTrigger value="top">Top số</TabsTrigger>
          <TabsTrigger value="guide">Cách chơi</TabsTrigger>
        </TabsList>

        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả quay số</CardTitle>
            </CardHeader>
            <CardContent>
              <ThreeDResultTable draws={draws} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Digit Frequency Tab */}
        <TabsContent value="digits">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Tần suất chữ số theo vị trí</CardTitle>
              <div className="flex gap-2">
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as ThreeDTier | "all")}
                  className="rounded-md border bg-background px-3 py-1 text-sm"
                >
                  {TIERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <TimeFilterSelect value={timeFilter} onChange={setTimeFilter} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DigitPositionChart data={digit0} title="Hàng trăm" color="hsl(0, 72%, 51%)" />
                <DigitPositionChart data={digit1} title="Hàng chục" color="hsl(217, 91%, 60%)" />
                <DigitPositionChart data={digit2} title="Hàng đơn vị" color="hsl(142, 71%, 45%)" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Numbers Tab */}
        <TabsContent value="top">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Top số xuất hiện nhiều nhất</CardTitle>
              <div className="flex gap-2">
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as ThreeDTier | "all")}
                  className="rounded-md border bg-background px-3 py-1 text-sm"
                >
                  {TIERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <TimeFilterSelect value={timeFilter} onChange={setTimeFilter} />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Số</TableHead>
                    <TableHead className="text-right">Lần xuất hiện</TableHead>
                    <TableHead className="text-right">Tỷ lệ</TableHead>
                    <TableHead className="text-right">Cách đây</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topNumbers.map((item, idx) => (
                    <TableRow key={item.number}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-base">
                          {item.number}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                      <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        {item.daysSinceLast === 0
                          ? "Hôm nay"
                          : `${item.daysSinceLast} ngày`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Play Guide Tab */}
        <TabsContent value="guide">
          {PLAY_GUIDES[product.key] && (
            <PlayGuide data={PLAY_GUIDES[product.key]} color={product.color} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

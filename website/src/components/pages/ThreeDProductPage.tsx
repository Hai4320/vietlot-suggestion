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
import { Disclaimer } from "@/components/common/Disclaimer";
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
      <div className="rounded-lg border border-orange-500/40 bg-orange-500/5 p-3 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-lg">🔬</span>
          <div className="flex-1">
            <div className="font-semibold text-orange-700 dark:text-orange-400">
              Research Mode — No confirmed edge
            </div>
            <div className="text-muted-foreground mt-1 leading-relaxed">
              Sau 8 chu kỳ nghiên cứu + 28 chiến lược được test (probabilistic, copula, discriminative ML, cross-product pool),
              <strong className="text-foreground"> 0 chiến lược đạt ngưỡng Accept/Suggestive</strong> qua 3-gate protocol.
              Các gợi ý ở <a href="/suggest" className="underline hover:text-orange-600">trang Suggest</a> chỉ là directional picks (hope, not confirmed edge).
              Xổ số Max 3D / Max 3D Pro có EV âm cố định — không có thuật toán nào đảm bảo trúng thưởng.
            </div>
          </div>
        </div>
      </div>

      {/* Product header */}
      <div>
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

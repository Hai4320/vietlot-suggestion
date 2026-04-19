"use client";

import { useEffect, useState, useCallback } from "react";
import { getProduct } from "@/lib/products-config";
import { loadMatrixData } from "@/lib/data-loader";
import { calcFrequency, calcHotCold, calcPairFrequency, calcTrend } from "@/lib/stats-matrix";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatrixResultTable } from "@/components/products/MatrixResultTable";
import { FrequencyBarChart } from "@/components/charts/FrequencyBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { HotColdCards } from "@/components/charts/HotColdCards";
import { PairFrequencyTable } from "@/components/charts/PairFrequencyTable";
import { NumberBall } from "@/components/products/NumberBall";
import { TimeFilterSelect } from "@/components/common/TimeFilter";
import { Disclaimer } from "@/components/common/Disclaimer";
import { PlayGuide } from "@/components/products/PlayGuide";
import { PLAY_GUIDES } from "@/lib/play-guides";
import type {
  MatrixDraw,
  TimeFilter,
} from "@/lib/types";

interface Props {
  slug: string;
}

export default function MatrixProductPage({ slug }: Props) {
  const product = getProduct(slug);
  const [draws, setDraws] = useState<MatrixDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  useEffect(() => {
    if (!product) return;
    loadMatrixData(product.dataFile).then((d) => {
      setDraws(d.draws);
      // pre-select top 5 frequent numbers for trend chart
      const freq = calcFrequency(d.draws, product.mainCount);
      setSelectedNumbers(freq.slice(0, 5).map((f) => f.number));
      setLoading(false);
    });
  }, [product]);

  if (!product) return <div className="p-8 text-center">Sản phẩm không tồn tại</div>;
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const frequency = calcFrequency(draws, product.mainCount, timeFilter);
  const hotCold = calcHotCold(draws, product.minNumber, product.maxNumber, product.mainCount);
  const pairs = calcPairFrequency(draws, product.mainCount, 30);
  const trend = calcTrend(draws, selectedNumbers, product.mainCount);

  const toggleNumber = (n: number) => {
    setSelectedNumbers((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].slice(-10),
    );
  };

  const lastDraw = draws[0];

  return (
    <div className="space-y-6">
      {/* Product header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {product.emoji} {product.nameVi}
        </h1>
        <p className="text-muted-foreground mt-1">{product.descriptionVi}</p>
        {lastDraw && (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Kỳ gần nhất: #{lastDraw.id} — {lastDraw.date}</span>
            <span className="mx-2">|</span>
            <div className="flex gap-1">
              {lastDraw.result.slice(0, product.mainCount).map((n, i) => (
                <NumberBall key={i} number={n} size="sm" />
              ))}
              {lastDraw.special !== undefined && (
                <NumberBall number={lastDraw.special} variant="special" size="sm" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <Tabs defaultValue="results">
        <TabsList className="flex-wrap">
          <TabsTrigger value="results">Kết quả</TabsTrigger>
          <TabsTrigger value="frequency">Tần suất</TabsTrigger>
          <TabsTrigger value="hotcold">Nóng / Lạnh</TabsTrigger>
          <TabsTrigger value="trend">Xu hướng</TabsTrigger>
          <TabsTrigger value="pairs">Cặp số</TabsTrigger>
          <TabsTrigger value="guide">Cách chơi</TabsTrigger>
        </TabsList>

        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Kết quả quay số</CardTitle>
            </CardHeader>
            <CardContent>
              <MatrixResultTable
                draws={draws}
                mainCount={product.mainCount}
                hasSpecial={product.hasSpecial}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frequency Tab */}
        <TabsContent value="frequency">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Biểu đồ tần suất xuất hiện</CardTitle>
              <TimeFilterSelect value={timeFilter} onChange={setTimeFilter} />
            </CardHeader>
            <CardContent>
              <FrequencyBarChart data={frequency} color={product.color} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hot / Cold Tab */}
        <TabsContent value="hotcold">
          <Card>
            <CardHeader>
              <CardTitle>Số nóng / Số lạnh</CardTitle>
            </CardHeader>
            <CardContent>
              <HotColdCards hot={hotCold.hot} cold={hotCold.cold} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Tab */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Xu hướng theo thời gian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: product.maxNumber - product.minNumber + 1 }, (_, i) => i + product.minNumber).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => toggleNumber(n)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        selectedNumbers.includes(n)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
              </div>
              <TrendLineChart data={trend} selectedNumbers={selectedNumbers} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pairs Tab */}
        <TabsContent value="pairs">
          <Card>
            <CardHeader>
              <CardTitle>Cặp số xuất hiện cùng nhau</CardTitle>
            </CardHeader>
            <CardContent>
              <PairFrequencyTable data={pairs} />
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

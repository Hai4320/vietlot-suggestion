import { MATRIX_PRODUCTS, THREE_D_PRODUCTS, PRODUCTS } from "@/lib/products-config";
import { ProductCard } from "@/components/products/ProductCard";
import type { MatrixDraw, ThreeDDraw } from "@/lib/types";
import Link from "next/link";
import fsNode from "fs";
import path from "path";

interface ProductSnapshot {
  totalDraws: number;
  endDate: string;
  latestDraw?: MatrixDraw | ThreeDDraw;
}

function getProductSnapshots() {
  const snaps: Record<string, ProductSnapshot> = {};
  for (const p of PRODUCTS) {
    try {
      const filePath = path.join(process.cwd(), "public", "data", p.dataFile);
      const raw = fsNode.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      snaps[p.key] = {
        totalDraws: data.meta.totalDraws,
        endDate: data.meta.endDate,
        latestDraw: data.draws[0],
      };
    } catch {
      // skip
    }
  }
  return snaps;
}

export default function HomePage() {
  const snaps = getProductSnapshots();
  const totalDraws = Object.values(snaps).reduce((s, m) => s + m.totalDraws, 0);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative text-center py-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl -z-10" />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
          <span className="text-primary">Vietlott</span> Analytics
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Thống kê tần suất, biểu đồ xu hướng và gợi ý số may mắn cho các sản
          phẩm xổ số Vietlott.
        </p>

        {/* Stats strip */}
        <div className="flex justify-center gap-8 mt-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">{PRODUCTS.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Sản phẩm</div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">
              {totalDraws.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Kỳ quay số</div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary">6</div>
            <div className="text-xs text-muted-foreground mt-0.5">Loại thống kê</div>
          </div>
        </div>
      </div>

      {/* Matrix Products */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-8 w-1 rounded-full bg-red-500" />
          <div>
            <h2 className="text-xl font-bold">Xổ số Ma trận</h2>
            <p className="text-sm text-muted-foreground">
              Săn Jackpot lên đến hàng trăm tỷ đồng
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MATRIX_PRODUCTS.map((p) => (
            <ProductCard
              key={p.key}
              product={p}
              totalDraws={snaps[p.key]?.totalDraws}
              lastDate={snaps[p.key]?.endDate}
              latestDraw={snaps[p.key]?.latestDraw}
            />
          ))}
        </div>
      </section>

      {/* 3D Products */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-8 w-1 rounded-full bg-purple-500" />
          <div>
            <h2 className="text-xl font-bold">Xổ số Dãy số</h2>
            <p className="text-sm text-muted-foreground">
              Giải cố định, nhiều hạng giải, dễ dò kết quả
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {THREE_D_PRODUCTS.map((p) => (
            <ProductCard
              key={p.key}
              product={p}
              totalDraws={snaps[p.key]?.totalDraws}
              lastDate={snaps[p.key]?.endDate}
              latestDraw={snaps[p.key]?.latestDraw}
            />
          ))}
        </div>
      </section>
      {/* Research Section */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-8 w-1 rounded-full bg-green-500" />
          <div>
            <h2 className="text-xl font-bold">Nghiên Cứu Thuật Toán</h2>
            <p className="text-sm text-muted-foreground">
              Tìm hiểu các thuật toán gợi ý số và kết quả đánh giá
            </p>
          </div>
        </div>
        <Link
          href="/algorithms"
          className="group flex items-center gap-4 rounded-xl border border-border p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
        >
          <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
            🔬
          </div>
          <div className="flex-1">
            <h3 className="font-bold group-hover:text-primary transition-colors">
              6 Thuật Toán Gợi Ý — Đánh Giá & Khuyến Nghị
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Bayesian AI, MaxEntropy, Adaptive và 3 thuật toán cổ điển. Backtest trên 3.173 kỳ quay thực tế.
            </p>
          </div>
          <svg className="shrink-0 w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </Link>
      </section>
    </div>
  );
}

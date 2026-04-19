import { MATRIX_PRODUCTS, THREE_D_PRODUCTS, PRODUCTS } from "@/lib/products-config";
import { ProductCard } from "@/components/products/ProductCard";
import type { MatrixDraw, ThreeDDraw } from "@/lib/types";
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
    </div>
  );
}

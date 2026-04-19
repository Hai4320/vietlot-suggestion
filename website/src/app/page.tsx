import { MATRIX_PRODUCTS, THREE_D_PRODUCTS, PRODUCTS } from "@/lib/products-config";
import { ProductCard } from "@/components/products/ProductCard";
import fsNode from "fs";
import path from "path";

function getProductMeta() {
  const metas: Record<string, { totalDraws: number; endDate: string }> = {};
  for (const p of PRODUCTS) {
    try {
      const filePath = path.join(process.cwd(), "public", "data", p.dataFile);
      const raw = fsNode.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      metas[p.key] = {
        totalDraws: data.meta.totalDraws,
        endDate: data.meta.endDate,
      };
    } catch {
      // skip
    }
  }
  return metas;
}

export default function HomePage() {
  const metas = getProductMeta();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold mb-3">
          🎰 Vietlott Analytics
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Thống kê, biểu đồ tần suất và gợi ý số cho các sản phẩm xổ số
          Vietlott. Dữ liệu được cập nhật hàng ngày.
        </p>
        <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <div>
            <span className="text-2xl font-bold text-foreground">
              {PRODUCTS.length}
            </span>{" "}
            sản phẩm
          </div>
          <div>
            <span className="text-2xl font-bold text-foreground">
              {Object.values(metas)
                .reduce((s, m) => s + m.totalDraws, 0)
                .toLocaleString()}
            </span>{" "}
            kỳ quay
          </div>
        </div>
      </div>

      {/* Matrix Products */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🎯 Xổ số Ma trận
          <span className="text-sm font-normal text-muted-foreground">
            — Săn giải Jackpot tiền tỷ
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MATRIX_PRODUCTS.map((p) => (
            <ProductCard
              key={p.key}
              product={p}
              totalDraws={metas[p.key]?.totalDraws}
              lastDate={metas[p.key]?.endDate}
            />
          ))}
        </div>
      </section>

      {/* 3D Products */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🔢 Xổ số Dãy số
          <span className="text-sm font-normal text-muted-foreground">
            — Giải cố định, dễ dò
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {THREE_D_PRODUCTS.map((p) => (
            <ProductCard
              key={p.key}
              product={p}
              totalDraws={metas[p.key]?.totalDraws}
              lastDate={metas[p.key]?.endDate}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

import { MATRIX_PRODUCTS, THREE_D_PRODUCTS, PRODUCTS } from "@/lib/products-config";
import { ProductCard } from "@/components/products/ProductCard";
import type { MatrixDraw, ThreeDDraw } from "@/lib/types";
import Link from "next/link";
import type { CSSProperties } from "react";
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

  const lastUpdated = Object.values(snaps)
    .map((s) => s.endDate)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div className="space-y-14">
      {/* Hero — terminal readout */}
      <section className="reveal" style={{ "--i": 0 } as CSSProperties}>
        <p className="terminal-label mb-4 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          // vietlott data terminal
        </p>
        <h1 className="font-mono text-4xl md:text-6xl font-bold tracking-tighter leading-[1.05]">
          Phân tích xổ số
          <br />
          <span className="text-primary">không hứa hẹn</span>, chỉ dữ liệu.
        </h1>
        <p className="mt-5 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
          Tần suất, xu hướng và backtest gợi ý số cho mọi sản phẩm Vietlott —
          mọi con số bên dưới đều bắt nguồn từ kết quả quay thực tế đã được kiểm chứng.
        </p>

        {/* Stat readout panel */}
        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-md border border-border bg-border">
          {[
            { v: PRODUCTS.length.toString(), l: "Sản phẩm" },
            { v: totalDraws.toLocaleString("vi-VN"), l: "Kỳ quay đã lưu" },
            { v: "6", l: "Loại thống kê" },
            { v: lastUpdated ?? "—", l: "Cập nhật mới nhất" },
          ].map((s) => (
            <div key={s.l} className="bg-card px-5 py-4">
              <dt className="terminal-label">{s.l}</dt>
              <dd className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-primary">
                {s.v}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Matrix Products */}
      <section className="reveal" style={{ "--i": 1 } as CSSProperties}>
        <SectionHeader
          index="01"
          title="Xổ số Ma trận"
          subtitle="Săn Jackpot lên đến hàng trăm tỷ đồng"
        />
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
      <section className="reveal" style={{ "--i": 2 } as CSSProperties}>
        <SectionHeader
          index="02"
          title="Xổ số Dãy số"
          subtitle="Giải cố định, nhiều hạng giải, dễ dò kết quả"
        />
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

      {/* Khám phá thêm */}
      <section className="reveal" style={{ "--i": 3 } as CSSProperties}>
        <SectionHeader
          index="03"
          title="Khám phá thêm"
          subtitle="Danh mục đầy đủ các cách chơi và kết quả nghiên cứu của dự án"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <ExploreCard
            href="/methods"
            emoji="📋"
            title="Danh mục 73 cách chơi Vietlott"
            desc="Đầy đủ các cách đã được thử và phân loại — bao gồm 1 cách đầu tiên có lợi thế thật."
          />
          <ExploreCard
            href="/algorithms"
            emoji="🔬"
            title="Các thuật toán gợi ý số"
            desc="Hơn 6 thuật toán đã được mô phỏng trên hàng nghìn kỳ quay thực tế."
          />
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-4 border-b border-border pb-4">
      <span className="font-mono text-sm font-bold text-primary tabular-nums">
        {index}
      </span>
      <div className="h-8 w-px bg-border" />
      <div>
        <h2 className="font-mono text-xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function ExploreCard({
  href,
  emoji,
  title,
  desc,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 overflow-hidden rounded-md border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      {/* left lime rail on hover */}
      <span className="absolute inset-y-0 left-0 w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 origin-top transition-transform" />
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-2xl">
        {emoji}
      </div>
      <div className="flex-1">
        <h3 className="font-mono font-bold group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
      <span className="shrink-0 font-mono text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
        →
      </span>
    </Link>
  );
}

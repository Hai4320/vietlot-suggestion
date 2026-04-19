"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MATRIX_PRODUCTS, THREE_D_PRODUCTS } from "@/lib/products-config";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border bg-card">
      <div className="flex flex-col gap-1 p-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
            pathname === "/" && "bg-accent text-accent-foreground"
          )}
        >
          🏠 Trang chủ
        </Link>

        <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Xổ số Ma trận
        </div>
        {MATRIX_PRODUCTS.map((p) => (
          <Link
            key={p.slug}
            href={`/${p.slug}`}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
              pathname === `/${p.slug}` && "bg-accent text-accent-foreground font-medium"
            )}
          >
            <span>{p.emoji}</span>
            <span>{p.name}</span>
          </Link>
        ))}

        <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Xổ số Dãy số
        </div>
        {THREE_D_PRODUCTS.map((p) => (
          <Link
            key={p.slug}
            href={`/${p.slug}`}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
              pathname === `/${p.slug}` && "bg-accent text-accent-foreground font-medium"
            )}
          >
            <span>{p.emoji}</span>
            <span>{p.name}</span>
          </Link>
        ))}

        <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Nghiên cứu
        </div>
        <Link
          href="/algorithms"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
            pathname === "/algorithms" && "bg-accent text-accent-foreground font-medium"
          )}
        >
          <span>🔬</span>
          <span>Thuật toán</span>
        </Link>
      </div>
    </aside>
  );
}

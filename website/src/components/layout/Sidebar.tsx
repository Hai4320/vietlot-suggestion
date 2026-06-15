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
            "flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground",
            pathname === "/" && "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/25"
          )}
        >
          🏠 Trang chủ
        </Link>

        <div className="terminal-label mt-5 mb-2 px-3 flex items-center gap-2">
          <span className="text-primary">/</span> Xổ số Ma trận
        </div>
        {MATRIX_PRODUCTS.map((p) => (
          <Link
            key={p.slug}
            href={`/${p.slug}`}
            className={cn(
              "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground",
              pathname === `/${p.slug}` && "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/25"
            )}
          >
            <span>{p.emoji}</span>
            <span>{p.name}</span>
          </Link>
        ))}

        <div className="terminal-label mt-5 mb-2 px-3 flex items-center gap-2">
          <span className="text-primary">/</span> Xổ số Dãy số
        </div>
        {THREE_D_PRODUCTS.map((p) => (
          <Link
            key={p.slug}
            href={`/${p.slug}`}
            className={cn(
              "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground",
              pathname === `/${p.slug}` && "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/25"
            )}
          >
            <span>{p.emoji}</span>
            <span>{p.name}</span>
          </Link>
        ))}

        <div className="terminal-label mt-5 mb-2 px-3 flex items-center gap-2">
          <span className="text-primary">/</span> Công cụ
        </div>
        <Link
          href="/suggest"
          className={cn(
            "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground",
            pathname === "/suggest" && "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/25"
          )}
        >
          <span>✨</span>
          <span>Gợi ý số</span>
        </Link>
        <Link
          href="/check-rate"
          className={cn(
            "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground",
            pathname === "/check-rate" && "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/25"
          )}
        >
          <span>🎯</span>
          <span>Tra vé đã trúng chưa</span>
        </Link>

        <div className="terminal-label mt-5 mb-2 px-3 flex items-center gap-2">
          <span className="text-primary">/</span> Nghiên cứu
        </div>
        <Link
          href="/methods"
          className={cn(
            "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground",
            pathname === "/methods" && "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/25"
          )}
        >
          <span>📋</span>
          <span>Cách chơi (73)</span>
        </Link>
        <Link
          href="/algorithms"
          className={cn(
            "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground",
            pathname === "/algorithms" && "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/25"
          )}
        >
          <span>🔬</span>
          <span>Thuật toán</span>
        </Link>
        <Link
          href="/research"
          className={cn(
            "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground",
            pathname === "/research" && "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/25"
          )}
        >
          <span>📊</span>
          <span>Nghiên cứu</span>
        </Link>
        <Link
          href="/glossary"
          className={cn(
            "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground",
            pathname === "/glossary" && "bg-primary/10 text-primary font-medium ring-1 ring-inset ring-primary/25"
          )}
        >
          <span>📚</span>
          <span>Thuật ngữ</span>
        </Link>
      </div>
    </aside>
  );
}

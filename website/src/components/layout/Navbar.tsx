"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MATRIX_PRODUCTS, THREE_D_PRODUCTS } from "@/lib/products-config";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="lg:hidden">
            <Button variant="ghost" size="icon" className="shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav className="flex flex-col gap-1 p-4 pt-12">
              <Link href="/" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent", pathname === "/" && "bg-accent")}>
                🏠 Trang chủ
              </Link>
              <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Xổ số Ma trận</div>
              {MATRIX_PRODUCTS.map((p) => (
                <Link key={p.slug} href={`/${p.slug}`} onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent", pathname === `/${p.slug}` && "bg-accent font-medium")}>
                  <span>{p.emoji}</span><span>{p.name}</span>
                </Link>
              ))}
              <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Xổ số Dãy số</div>
              {THREE_D_PRODUCTS.map((p) => (
                <Link key={p.slug} href={`/${p.slug}`} onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent", pathname === `/${p.slug}` && "bg-accent font-medium")}>
                  <span>{p.emoji}</span><span>{p.name}</span>
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Title */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          🎰 <span className="hidden sm:inline">Vietlott Analytics</span>
        </Link>

        <div className="flex-1" />

        {/* Github link */}
        <a
          href="https://github.com/vietvudanh/vietlott-data"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </header>
  );
}

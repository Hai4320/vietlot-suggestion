"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MATRIX_PRODUCTS, THREE_D_PRODUCTS } from "@/lib/products-config";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [crawling, setCrawling] = useState(false);

  const handleCrawl = useCallback(async () => {
    if (crawling) return;
    setCrawling(true);
    try {
      const res = await fetch("/api/crawl", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        // Refresh the page to show new data
        router.refresh();
      } else {
        console.error("Crawl failed:", data.message);
      }
    } catch (err) {
      console.error("Crawl request failed:", err);
    } finally {
      setCrawling(false);
    }
  }, [crawling, router]);

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
              <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Công cụ</div>
              <Link href="/suggest" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent", pathname === "/suggest" && "bg-accent font-medium")}>
                <span>✨</span><span>Gợi ý số</span>
              </Link>
              <Link href="/check-rate" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent", pathname === "/check-rate" && "bg-accent font-medium")}>
                <span>🎯</span><span>Check-rate</span>
              </Link>
              <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nghiên cứu</div>
              <Link href="/methods" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent", pathname === "/methods" && "bg-accent font-medium")}>
                <span>📋</span><span>Methods (73)</span>
              </Link>
              <Link href="/algorithms" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent", pathname === "/algorithms" && "bg-accent font-medium")}>
                <span>🔬</span><span>Thuật toán</span>
              </Link>
              <Link href="/research" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent", pathname === "/research" && "bg-accent font-medium")}>
                <span>📊</span><span>Nghiên cứu</span>
              </Link>
              <Link href="/glossary" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent", pathname === "/glossary" && "bg-accent font-medium")}>
                <span>📚</span><span>Thuật ngữ</span>
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Title */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">Vietlott</span>
          <span className="hidden sm:inline text-muted-foreground font-normal text-sm">Analytics</span>
        </Link>

        <div className="flex-1" />

        {/* Quick links for desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {MATRIX_PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={`/${p.slug}`}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
                pathname === `/${p.slug}` && "bg-accent font-medium text-primary"
              )}
            >
              {p.name}
            </Link>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          {THREE_D_PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={`/${p.slug}`}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
                pathname === `/${p.slug}` && "bg-accent font-medium text-primary"
              )}
            >
              {p.name}
            </Link>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <Link
            href="/suggest"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
              pathname === "/suggest" && "bg-accent font-medium text-primary"
            )}
          >
            ✨ Gợi ý
          </Link>
          <Link
            href="/check-rate"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
              pathname === "/check-rate" && "bg-accent font-medium text-primary"
            )}
          >
            🎯 Check-rate
          </Link>
          <Link
            href="/methods"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
              pathname === "/methods" && "bg-accent font-medium text-primary"
            )}
          >
            📋 Methods
          </Link>
          <Link
            href="/algorithms"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
              pathname === "/algorithms" && "bg-accent font-medium text-primary"
            )}
          >
            🔬 Thuật toán
          </Link>
          <Link
            href="/research"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
              pathname === "/research" && "bg-accent font-medium text-primary"
            )}
          >
            📊 Nghiên cứu
          </Link>
          <Link
            href="/glossary"
            className={cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
              pathname === "/glossary" && "bg-accent font-medium text-primary"
            )}
          >
            📚 Thuật ngữ
          </Link>
        </nav>

        {/* Crawl button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCrawl}
          disabled={crawling}
          className="ml-2 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        >
          {crawling ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="hidden sm:inline">Đang cào...</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              <span className="hidden sm:inline">Cập nhật</span>
            </>
          )}
        </Button>
      </div>
    </header>
  );
}

"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { PRODUCTS, MATRIX_PRODUCTS, THREE_D_PRODUCTS } from "@/lib/products-config";
import { loadMatrixData, loadThreeDData } from "@/lib/data-loader";
import { generateSuggestions } from "@/lib/suggest-matrix";
import { generate3DSuggestions } from "@/lib/suggest-3d";
import { SuggestionPanel } from "@/components/products/SuggestionPanel";
// BudgetWidget import tạm gỡ (Chu kỳ 24 hidden) — see research/history/cycle24_budget_aware.md.
// Component + data module vẫn còn trong repo để re-enable sau.
import { cn } from "@/lib/utils";
import type {
  MatrixDraw,
  ThreeDDraw,
  SuggestionStrategy,
  SuggestionSet,
  ThreeDSuggestionSet,
  ProductInfo,
} from "@/lib/types";

type ProductSlug = "power-655" | "power-645" | "power-535" | "max-3d" | "max-3d-pro";

const ALL_SLUGS: ProductSlug[] = ["power-655", "power-645", "power-535", "max-3d", "max-3d-pro"];

function isValidSlug(s: string | null): s is ProductSlug {
  return s !== null && (ALL_SLUGS as string[]).includes(s);
}

type DrawsCache = Record<string, { matrix?: MatrixDraw[]; threeD?: ThreeDDraw[] }>;

// ── Module-level caches: survive across page navigations ──
let cachedSelectedSlug: ProductSlug = "power-655";
let cachedDraws: DrawsCache = {};
let cachedLoadedSlugs = new Set<string>();
let cachedMountedSlugs = new Set<string>();

export default function SuggestPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <SuggestPageContent />
    </Suspense>
  );
}

function SuggestPageContent() {
  const searchParams = useSearchParams();
  const queryProduct = searchParams.get("p");
  const initialSlug: ProductSlug = isValidSlug(queryProduct) ? queryProduct : cachedSelectedSlug;

  const [selectedSlug, setSelectedSlug] = useState<ProductSlug>(initialSlug);
  const [drawsCache, setDrawsCache] = useState<DrawsCache>(cachedDraws);
  const [loadedSlugs, setLoadedSlugs] = useState<Set<string>>(cachedLoadedSlugs);
  const mountedSlugs = useRef<Set<string>>(cachedMountedSlugs);

  // React to query param changes (e.g., navigation from product pages)
  useEffect(() => {
    if (isValidSlug(queryProduct) && queryProduct !== selectedSlug) {
      setSelectedSlug(queryProduct);
    }
  }, [queryProduct, selectedSlug]);

  // Sync selected slug to module cache
  useEffect(() => { cachedSelectedSlug = selectedSlug; }, [selectedSlug]);

  // Load data for a slug (cached — only fetches once)
  const ensureLoaded = useCallback((slug: ProductSlug) => {
    if (loadedSlugs.has(slug)) return;
    const product = PRODUCTS.find((p) => p.slug === slug)!;
    if (product.group === "matrix") {
      loadMatrixData(product.dataFile).then((d) => {
        const next = { ...drawsCache, [slug]: { matrix: d.draws } };
        setDrawsCache(next);
        cachedDraws = next;
        const nextLoaded = new Set(loadedSlugs).add(slug);
        setLoadedSlugs(nextLoaded);
        cachedLoadedSlugs = nextLoaded;
      });
    } else {
      loadThreeDData(product.dataFile).then((d) => {
        const next = { ...drawsCache, [slug]: { threeD: d.draws } };
        setDrawsCache(next);
        cachedDraws = next;
        const nextLoaded = new Set(loadedSlugs).add(slug);
        setLoadedSlugs(nextLoaded);
        cachedLoadedSlugs = nextLoaded;
      });
    }
  }, [loadedSlugs, drawsCache]);

  // Load selected product data on mount & on selection change
  useEffect(() => {
    ensureLoaded(selectedSlug);
    mountedSlugs.current.add(selectedSlug);
    cachedMountedSlugs = mountedSlugs.current;
  }, [selectedSlug, ensureLoaded]);

  // Generate handlers per product (stable references via slug closure)
  const makeMatrixHandler = useCallback(
    (slug: ProductSlug) =>
      (strategy: SuggestionStrategy, count: number): SuggestionSet[] => {
        const product = PRODUCTS.find((p) => p.slug === slug)!;
        const draws = drawsCache[slug]?.matrix || [];
        const specialMax = product.key === "power_535" ? 12 : product.maxNumber;
        return generateSuggestions(
          draws, product.mainCount, product.minNumber, product.maxNumber,
          product.hasSpecial, specialMax, strategy, count,
        );
      },
    [drawsCache],
  );

  const makeThreeDHandler = useCallback(
    (slug: ProductSlug) =>
      (strategy: SuggestionStrategy, count: number): ThreeDSuggestionSet[] => {
        const draws = drawsCache[slug]?.threeD || [];
        return generate3DSuggestions(draws, strategy, count);
      },
    [drawsCache],
  );

  // Which slugs have been visited (mount panel once, then keep alive)
  const visitedSlugs = Array.from(mountedSlugs.current);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">✨ Gợi ý bộ số may mắn</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Chọn sản phẩm xổ số và chiến lược phân tích, hệ thống sẽ dựa trên dữ liệu lịch sử để gợi ý những bộ số tiềm năng nhất
        </p>
      </div>

      {/* Product selector */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block text-center">
          Chọn sản phẩm
        </label>

        {/* Desktop: all products in one row */}
        <div className="hidden sm:flex items-center justify-center gap-2">
          {MATRIX_PRODUCTS.map((p) => (
            <ProductButton
              key={p.slug}
              product={p}
              isSelected={selectedSlug === p.slug}
              onClick={() => setSelectedSlug(p.slug as ProductSlug)}
            />
          ))}
          <div className="w-px h-8 bg-border mx-1" />
          {THREE_D_PRODUCTS.map((p) => (
            <ProductButton
              key={p.slug}
              product={p}
              isSelected={selectedSlug === p.slug}
              onClick={() => setSelectedSlug(p.slug as ProductSlug)}
            />
          ))}
        </div>

        {/* Mobile: two rows */}
        <div className="flex sm:hidden flex-col gap-2">
          <div className="flex items-center justify-center gap-2">
            {MATRIX_PRODUCTS.map((p) => (
              <ProductButton
                key={p.slug}
                product={p}
                isSelected={selectedSlug === p.slug}
                onClick={() => setSelectedSlug(p.slug as ProductSlug)}
                compact
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            {THREE_D_PRODUCTS.map((p) => (
              <ProductButton
                key={p.slug}
                product={p}
                isSelected={selectedSlug === p.slug}
                onClick={() => setSelectedSlug(p.slug as ProductSlug)}
                compact
              />
            ))}
          </div>
        </div>
      </div>

      {/* Panels — render once per visited slug, hide inactive ones */}
      {ALL_SLUGS.map((slug) => {
        const isActive = slug === selectedSlug;
        const isLoaded = loadedSlugs.has(slug);
        const hasBeenVisited = visitedSlugs.includes(slug);

        // Only mount panel after it's been visited at least once
        if (!hasBeenVisited) return null;

        const product = PRODUCTS.find((p) => p.slug === slug)!;

        return (
          <div key={slug} className={isActive ? "" : "hidden"}>
            {!isLoaded ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : product.group === "matrix" ? (
              <SuggestionPanel
                type="matrix"
                slug={slug as "power-655" | "power-645" | "power-535"}
                onGenerate={makeMatrixHandler(slug)}
                hasSpecial={product.hasSpecial}
                color={product.color}
              />
            ) : (
              <SuggestionPanel
                type="3d"
                slug={slug as "max-3d" | "max-3d-pro"}
                onGenerate={makeThreeDHandler(slug)}
                color={product.color}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProductButton({
  product,
  isSelected,
  onClick,
  compact,
}: {
  product: ProductInfo;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-xl border-2 transition-all duration-200",
        compact ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm",
        isSelected
          ? "border-primary bg-primary/10 shadow-md font-bold"
          : "border-border hover:border-muted-foreground/40 hover:bg-accent/50",
      )}
      style={
        isSelected
          ? { borderColor: product.color, backgroundColor: `${product.color}15` }
          : undefined
      }
    >
      <span>{product.emoji}</span>
      <span>{compact ? product.name.replace("Power ", "").replace("Mega ", "").replace("Lotto ", "").replace("Max ", "") : product.name}</span>
    </button>
  );
}

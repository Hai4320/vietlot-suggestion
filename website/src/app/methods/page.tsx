"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  METHODS_CATALOG,
  C6_SPOTLIGHT,
  catalogStats,
  categoryLabel,
  statusLabel,
  type CatalogMethod,
  type MethodCategory,
  type MethodStatus,
  type ProductKey,
} from "@/lib/methods-catalog-data";

// ────────── Helpers ──────────

function bestROI(m: CatalogMethod): number | null {
  if (!m.metrics || m.metrics.length === 0) return null;
  return Math.max(...m.metrics.map((x) => x.roi_full_pct));
}

function bestPHit(m: CatalogMethod): number | null {
  if (!m.metrics || m.metrics.length === 0) return null;
  return Math.max(...m.metrics.map((x) => x.p_any_hit));
}

function fmtROI(v: number | null): string {
  if (v === null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function fmtPct(v: number | null): string {
  if (v === null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function productLabel(p: ProductKey | "all"): string {
  const map: Record<ProductKey, string> = {
    power_655: "6/55",
    power_645: "6/45",
    power_535: "5/35",
    max_3d: "3D",
    max_3d_pro: "3D Pro",
  };
  if (p === "all" || !p) return "All";
  return map[p] ?? String(p);
}

function productList(products: ProductKey[] | "all"): string {
  if (products === "all") return "Tất cả";
  return products.map((p) => productLabel(p)).join(", ");
}

function statusColorClass(color: string): string {
  switch (color) {
    case "green":
      return "bg-green-600 text-white hover:bg-green-700";
    case "orange":
      return "bg-orange-500 text-white hover:bg-orange-600";
    case "red":
      return "bg-red-600/10 text-red-700 dark:text-red-400 border border-red-500/30";
    case "amber":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30";
    case "muted":
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

// ────────── Page ──────────

export default function MethodsPage() {
  const stats = useMemo(() => catalogStats(), []);
  const [filterCategory, setFilterCategory] = useState<MethodCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<MethodStatus | "all">("all");
  const [filterProduct, setFilterProduct] = useState<ProductKey | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["C6"])); // C6 pre-expanded
  const [sortBy, setSortBy] = useState<"status" | "roi" | "phit" | "id">("status");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    let rows = METHODS_CATALOG.filter((m) => {
      if (filterCategory !== "all" && m.category !== filterCategory) return false;
      if (filterStatus !== "all" && m.status !== filterStatus) return false;
      if (filterProduct !== "all") {
        if (m.applicable_products !== "all" && !m.applicable_products.includes(filterProduct)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!m.id.toLowerCase().includes(q) && !m.name_vi.toLowerCase().includes(q) && !m.description_vi.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    // Sort
    const statusOrder: Record<MethodStatus, number> = {
      accept: 0,
      suggestive: 1,
      tested_no_edge: 2,
      tested_variant: 3,
      family_eliminated: 4,
      deferred: 5,
      subsumed: 6,
      skipped: 7,
      na: 8,
    };
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "status") cmp = statusOrder[a.status] - statusOrder[b.status];
      else if (sortBy === "roi") cmp = (bestROI(b) ?? -Infinity) - (bestROI(a) ?? -Infinity);
      else if (sortBy === "phit") cmp = (bestPHit(b) ?? -Infinity) - (bestPHit(a) ?? -Infinity);
      else cmp = a.id.localeCompare(b.id);
      return sortDesc ? cmp : -cmp;
    });

    return rows;
  }, [filterCategory, filterStatus, filterProduct, searchQuery, sortBy, sortDesc]);

  const selected = METHODS_CATALOG.filter((m) => selectedIds.has(m.id));

  function toggleSelected(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 6) next.add(id);
    setSelectedIds(next);
  }

  function toggleExpanded(id: string) {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  }

  function exportComparisonMd(): string {
    if (selected.length === 0) return "";
    const cols = ["Method", "Category", "Status", "Products", "Best ROI", "Best P(hit)"];
    const rows = [cols.join(" | ")];
    rows.push(cols.map(() => "---").join(" | "));
    for (const m of selected) {
      const s = statusLabel(m.status);
      rows.push([
        `${m.id} ${m.name_vi}`,
        categoryLabel(m.category),
        `${s.emoji} ${s.text}`,
        productList(m.applicable_products),
        fmtROI(bestROI(m)),
        fmtPct(bestPHit(m)),
      ].join(" | "));
    }
    return rows.join("\n");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Hero */}
      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold tracking-tight">📋 Betting Methods Catalog</h1>
          <Badge variant="outline" className="text-xs">{stats.total} phương pháp · {stats.tested} đã test</Badge>
          <Badge className="bg-green-600 hover:bg-green-700 text-xs">🏆 {stats.accept} Accept</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Full catalog 73 phương pháp chơi Vietlott đã được catalog qua 29 chu kỳ nghiên cứu.
          Browse theo category, filter theo status, so sánh side-by-side.
          <strong className="text-green-700 dark:text-green-500"> C6 A=B Exploit (Max 3D Pro)</strong> là first Accept trong 28-cycle history.
        </p>
      </header>

      {/* Overview stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1 font-semibold">Total methods</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold text-green-600">{stats.accept}</div>
            <div className="text-xs text-muted-foreground mt-1 font-semibold">🏆 Accept</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold">{stats.tested}</div>
            <div className="text-xs text-muted-foreground mt-1 font-semibold">Đã test</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold">{stats.deferred + stats.skipped + stats.subsumed}</div>
            <div className="text-xs text-muted-foreground mt-1 font-semibold">Deferred / subsumed / skipped</div>
          </CardContent>
        </Card>
      </section>

      {/* C6 Spotlight */}
      <section className="rounded-lg border border-green-500/40 bg-green-500/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-4xl shrink-0">🏆</span>
          <div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">{C6_SPOTLIGHT.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{C6_SPOTLIGHT.subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
          <div className="rounded-md bg-background/50 p-3">
            <div className="text-2xl font-bold">+{C6_SPOTLIGHT.theoretical_ev_pct}%</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Theoretical EV</div>
          </div>
          <div className="rounded-md bg-background/50 p-3">
            <div className="text-2xl font-bold">+{C6_SPOTLIGHT.backtest_ev_pct}%</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Backtest (N=200)</div>
          </div>
          <div className="rounded-md bg-background/50 p-3">
            <div className="text-2xl font-bold">{(C6_SPOTLIGHT.p_hit * 100).toFixed(1)}%</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">P(hit)/vé</div>
          </div>
          <div className="rounded-md bg-background/50 p-3">
            <div className="text-2xl font-bold">Chu kỳ {C6_SPOTLIGHT.cycles.join("-")}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Research cycles</div>
          </div>
        </div>

        <p className="text-sm leading-relaxed">{C6_SPOTLIGHT.mechanism_short}</p>

        <details className="space-y-3">
          <summary className="cursor-pointer text-sm font-semibold hover:text-foreground/80">
            ▸ Mechanism chi tiết + EV math + quy chế table
          </summary>
          <div className="pt-3 space-y-4">
            <div className="space-y-2">
              {C6_SPOTLIGHT.mechanism_steps.map((step) => (
                <div key={step.label} className="text-sm">
                  <strong>{step.label}:</strong>{" "}
                  <span className="text-muted-foreground">{step.detail}</span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-md border bg-background/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-semibold">Tier</th>
                    <th className="text-right px-3 py-2 font-semibold">Prize (A ≠ B)</th>
                    <th className="text-right px-3 py-2 font-semibold">A = B (doubled)</th>
                  </tr>
                </thead>
                <tbody>
                  {C6_SPOTLIGHT.prize_table.map((row) => (
                    <tr key={row.tier} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{row.tier}</td>
                      <td className="px-3 py-2 text-right font-mono">{row.base}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-green-700 dark:text-green-400">
                        {row.a_eq_b}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 space-y-1">
              {C6_SPOTLIGHT.disclosures.map((d, i) => (
                <div key={i} className="text-xs text-amber-800 dark:text-amber-300">{d}</div>
              ))}
            </div>
          </div>
        </details>

        <div className="flex flex-wrap gap-2">
          <Link href={C6_SPOTLIGHT.play_href}>
            <Button className="bg-green-600 hover:bg-green-700">🏆 Mua tại /max-3d-pro</Button>
          </Link>
          <Link href={C6_SPOTLIGHT.history_href}>
            <Button variant="outline">Xem research history</Button>
          </Link>
        </div>
      </section>

      {/* Filters */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">📋 Catalog (filter + so sánh)</h2>

        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <input
            type="search"
            placeholder="Tìm method (ID hoặc tên)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border bg-background flex-1 min-w-[200px]"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as MethodCategory | "all")}
            className="px-3 py-2 text-sm rounded-md border bg-background"
          >
            <option value="all">Tất cả category</option>
            {(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as MethodCategory[]).map((c) => (
              <option key={c} value={c}>{categoryLabel(c)}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as MethodStatus | "all")}
            className="px-3 py-2 text-sm rounded-md border bg-background"
          >
            <option value="all">Tất cả status</option>
            <option value="accept">🏆 Accept</option>
            <option value="suggestive">🚨 Suggestive</option>
            <option value="tested_no_edge">✓ Tested (no edge)</option>
            <option value="tested_variant">✓ Tested (variant)</option>
            <option value="family_eliminated">❌ Family eliminated</option>
            <option value="deferred">⏳ Deferred</option>
            <option value="subsumed">— Subsumed</option>
            <option value="skipped">⚪ Skipped</option>
            <option value="na">— N/A</option>
          </select>
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value as ProductKey | "all")}
            className="px-3 py-2 text-sm rounded-md border bg-background"
          >
            <option value="all">Tất cả products</option>
            <option value="power_655">Power 6/55</option>
            <option value="power_645">Mega 6/45</option>
            <option value="power_535">Power 5/35</option>
            <option value="max_3d">Max 3D</option>
            <option value="max_3d_pro">Max 3D Pro</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Hiển thị {filtered.length} / {stats.total} methods.
          Chọn checkbox để so sánh (max 6, hiện tại {selectedIds.size}).
        </div>
      </section>

      {/* Table */}
      <section className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs">
                <th className="px-2 py-3 w-10 text-center">Chọn</th>
                <th className="px-2 py-3 w-14 text-left font-semibold cursor-pointer hover:bg-muted" onClick={() => { setSortBy("id"); setSortDesc(!sortDesc); }}>
                  ID
                </th>
                <th className="px-3 py-3 text-left font-semibold">Method</th>
                <th className="px-3 py-3 text-left font-semibold cursor-pointer hover:bg-muted" onClick={() => { setSortBy("status"); setSortDesc(!sortDesc); }}>
                  Status
                </th>
                <th className="px-3 py-3 text-left font-semibold hidden md:table-cell">Products</th>
                <th className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-muted" onClick={() => { setSortBy("roi"); setSortDesc(!sortDesc); }}>
                  Best ROI
                </th>
                <th className="px-3 py-3 text-right font-semibold hidden lg:table-cell cursor-pointer hover:bg-muted" onClick={() => { setSortBy("phit"); setSortDesc(!sortDesc); }}>
                  Best P(hit)
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const s = statusLabel(m.status);
                const roi = bestROI(m);
                const phit = bestPHit(m);
                const expanded = expandedIds.has(m.id);
                const selected_ = selectedIds.has(m.id);
                return (
                  <>
                    <tr
                      key={m.id}
                      className={`border-b hover:bg-muted/30 cursor-pointer ${m.status === "accept" ? "bg-green-500/5" : ""} ${selected_ ? "bg-primary/5" : ""}`}
                      onClick={() => toggleExpanded(m.id)}
                    >
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selected_}
                          onChange={(e) => { e.stopPropagation(); toggleSelected(m.id); }}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-3 font-mono text-xs">{m.id}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium">{m.name_vi}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{m.description_vi}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusColorClass(s.color)}`}>
                          <span>{s.emoji}</span>
                          <span className="font-medium">{s.text}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {productList(m.applicable_products)}
                      </td>
                      <td className={`px-3 py-3 text-right font-mono text-xs ${roi !== null && roi > 0 ? "text-green-700 dark:text-green-400 font-semibold" : ""}`}>
                        {fmtROI(roi)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs hidden lg:table-cell">
                        {fmtPct(phit)}
                      </td>
                    </tr>
                    {expanded && (
                      <tr key={`${m.id}-exp`} className="border-b bg-muted/10">
                        <td colSpan={7} className="px-6 py-4 space-y-3">
                          {m.mechanism_vi && (
                            <div className="text-sm">
                              <div className="font-semibold mb-1">Cơ chế:</div>
                              <p className="text-muted-foreground leading-relaxed">{m.mechanism_vi}</p>
                            </div>
                          )}
                          {m.verdict_note && (
                            <div className="text-sm">
                              <div className="font-semibold mb-1">Verdict:</div>
                              <p className="text-muted-foreground leading-relaxed">{m.verdict_note}</p>
                            </div>
                          )}
                          {m.metrics && m.metrics.length > 0 && (
                            <div className="text-sm">
                              <div className="font-semibold mb-1">Backtest results:</div>
                              <div className="overflow-x-auto">
                                <table className="text-xs border w-full max-w-2xl">
                                  <thead className="bg-muted/30">
                                    <tr>
                                      <th className="px-2 py-1 text-left">Product</th>
                                      <th className="px-2 py-1 text-right">ROI full</th>
                                      <th className="px-2 py-1 text-right">P(hit)</th>
                                      <th className="px-2 py-1 text-center">Cycle</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {m.metrics.map((mm, i) => (
                                      <tr key={i} className="border-t">
                                        <td className="px-2 py-1">{productLabel(mm.product)}</td>
                                        <td className={`px-2 py-1 text-right font-mono ${mm.roi_full_pct > 0 ? "text-green-700 dark:text-green-400 font-semibold" : ""}`}>
                                          {mm.roi_full_pct >= 0 ? "+" : ""}{mm.roi_full_pct.toFixed(1)}%
                                        </td>
                                        <td className="px-2 py-1 text-right font-mono">{(mm.p_any_hit * 100).toFixed(2)}%</td>
                                        <td className="px-2 py-1 text-center text-muted-foreground">Chu kỳ {mm.cycle}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          {m.cycles_tested.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Tested in Chu kỳ: {m.cycles_tested.join(", ")}
                            </div>
                          )}
                          {m.user_action && (
                            <Link href={m.user_action.href}>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                {m.user_action.label}
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Comparison matrix */}
      {selected.length >= 2 && (
        <section className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold">⚖ So sánh {selected.length} methods</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const md = exportComparisonMd();
                  navigator.clipboard.writeText(md);
                }}
              >
                📋 Copy markdown
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-2 py-2 text-left font-semibold sticky left-0 bg-muted/50">Metric</th>
                  {selected.map((m) => (
                    <th key={m.id} className="px-2 py-2 text-left font-semibold min-w-[140px]">
                      <div className="font-mono text-[10px]">{m.id}</div>
                      <div className="text-xs">{m.name_vi}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-2 py-2 font-medium sticky left-0 bg-background">Category</td>
                  {selected.map((m) => <td key={m.id} className="px-2 py-2">{categoryLabel(m.category)}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="px-2 py-2 font-medium sticky left-0 bg-background">Status</td>
                  {selected.map((m) => {
                    const s = statusLabel(m.status);
                    return (
                      <td key={m.id} className="px-2 py-2">
                        <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded ${statusColorClass(s.color)}`}>
                          {s.emoji} {s.text}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b">
                  <td className="px-2 py-2 font-medium sticky left-0 bg-background">Products</td>
                  {selected.map((m) => <td key={m.id} className="px-2 py-2 text-xs">{productList(m.applicable_products)}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="px-2 py-2 font-medium sticky left-0 bg-background">Best ROI full</td>
                  {selected.map((m) => {
                    const v = bestROI(m);
                    return (
                      <td key={m.id} className={`px-2 py-2 font-mono ${v !== null && v > 0 ? "text-green-700 dark:text-green-400 font-semibold" : ""}`}>
                        {fmtROI(v)}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b">
                  <td className="px-2 py-2 font-medium sticky left-0 bg-background">Best P(hit)</td>
                  {selected.map((m) => <td key={m.id} className="px-2 py-2 font-mono">{fmtPct(bestPHit(m))}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="px-2 py-2 font-medium sticky left-0 bg-background">Cycles tested</td>
                  {selected.map((m) => <td key={m.id} className="px-2 py-2 text-xs text-muted-foreground">{m.cycles_tested.length ? m.cycles_tested.join(", ") : "—"}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Disclosure footer */}
      <section className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4 space-y-1 text-xs text-amber-800 dark:text-amber-300">
        <div>⚠ EV luôn âm cho 4 sản phẩm — CHỈ TRỪ C6 A=B Max 3D Pro (exploit quy chế hợp pháp).</div>
        <div>⚠ C6 phụ thuộc Vietlott quy chế — rule có thể thay đổi mà không báo trước.</div>
        <div>⚠ Kết quả backtest là simulation trên lịch sử; actual variance cao.</div>
        <div>⚠ Xem chi tiết từng method qua click row + <Link href="/research" className="underline">research history</Link>.</div>
      </section>
    </div>
  );
}

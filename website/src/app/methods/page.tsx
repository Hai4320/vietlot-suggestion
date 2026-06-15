"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function productLabel(p: ProductKey | "all"): string {
  const map: Record<ProductKey, string> = {
    power_655: "Power 6/55",
    power_645: "Mega 6/45",
    power_535: "Power 5/35",
    max_3d: "Max 3D",
    max_3d_pro: "Max 3D Pro",
  };
  if (p === "all" || !p) return "Mọi sản phẩm";
  return map[p] ?? String(p);
}

function productList(products: ProductKey[] | "all"): string {
  if (products === "all") return "Mọi sản phẩm";
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["C6"])); // C6 mở sẵn
  const [sortBy, setSortBy] = useState<"status" | "id">("status");
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

    // Sắp xếp: ưu tiên các trạng thái tốt lên đầu khi sort theo "đánh giá"
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
    const cols = ["Cách chơi", "Nhóm", "Đánh giá", "Sản phẩm áp dụng"];
    const rows = [cols.join(" | ")];
    rows.push(cols.map(() => "---").join(" | "));
    for (const m of selected) {
      const s = statusLabel(m.status);
      rows.push([
        `${m.id} ${m.name_vi}`,
        categoryLabel(m.category),
        `${s.emoji} ${s.text}`,
        productList(m.applicable_products),
      ].join(" | "));
    }
    return rows.join("\n");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Tiêu đề */}
      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold tracking-tight">Danh mục cách chơi Vietlott</h1>
          <Badge variant="outline" className="text-xs">{stats.total} cách đã liệt kê</Badge>
          {stats.accept > 0 && (
            <Badge className="bg-green-600 hover:bg-green-700 text-xs">
              {stats.accept} cách đã xác nhận có lợi thế
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Đây là danh mục đầy đủ các cách chơi Vietlott mà chúng tôi đã thử và phân loại
          qua nhiều đợt nghiên cứu. Anh có thể duyệt theo nhóm, lọc theo trạng thái, và so sánh
          các cách chơi cạnh nhau. Cách chơi <strong className="text-green-700 dark:text-green-500">C6 — Vé A=B (Max 3D Pro)</strong>{" "}
          là cách đầu tiên có lợi thế thật sau hơn 28 đợt nghiên cứu.
        </p>
      </header>

      {/* Giải thích nhanh các thuật ngữ */}
      <details className="rounded-lg border bg-muted/20 px-4 py-3">
        <summary className="cursor-pointer font-semibold text-sm">
          Giải thích nhanh các thuật ngữ trong trang này
        </summary>
        <dl className="mt-3 space-y-2 text-sm leading-relaxed">
          <div>
            <dt className="font-medium">Đợt nghiên cứu</dt>
            <dd className="text-muted-foreground">
              Mỗi đợt là một lần chúng tôi mô phỏng và đo nhiều cách chơi trên dữ liệu lịch sử Vietlott. Hiện đã có 29 đợt.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Có lợi thế</dt>
            <dd className="text-muted-foreground">
              Cách chơi giúp anh trúng nhiều hơn / lỗ ít hơn so với chọn ngẫu nhiên thuần. Trong 73 cách thì hiện chỉ có 1 cách (C6) được xác nhận có lợi thế thật.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Mô phỏng (backtest)</dt>
            <dd className="text-muted-foreground">
              Chạy lại cách chơi trên dữ liệu kết quả thực tế đã có để xem nếu chơi từ trước thì sẽ ra sao.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Lãi/lỗ kỳ vọng</dt>
            <dd className="text-muted-foreground">
              Trung bình lãi hoặc lỗ trên mỗi đồng bỏ ra. Vé số luôn lỗ kỳ vọng (vì nhà cái có lợi thế) — trừ trường hợp đặc biệt như C6.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Tỉ lệ trúng</dt>
            <dd className="text-muted-foreground">
              Trong 100 vé mua thì khoảng bao nhiêu vé trúng (tính cả giải nhỏ).
            </dd>
          </div>
          <div>
            <dt className="font-medium">Cảm tính / ngụy biện con bạc</dt>
            <dd className="text-muted-foreground">
              Niềm tin sai phổ biến rằng số chưa ra lâu thì sắp ra, hoặc số đang ra nhiều thì sẽ tiếp tục ra. Mỗi kỳ Vietlott là độc lập — quá khứ không dự đoán được tương lai.
            </dd>
          </div>
        </dl>
      </details>

      {/* Thống kê tổng quan */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1 font-semibold">Tổng số cách đã liệt kê</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold text-green-600">{stats.accept}</div>
            <div className="text-xs text-muted-foreground mt-1 font-semibold">Đã xác nhận có lợi thế</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-3xl font-extrabold">{stats.tested}</div>
            <div className="text-xs text-muted-foreground mt-1 font-semibold">Đã được kiểm chứng</div>
          </CardContent>
        </Card>
      </section>

      {/* Điểm nhấn C6 */}
      <section className="rounded-lg border border-green-500/40 bg-green-500/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-4xl shrink-0">🏆</span>
          <div>
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">{C6_SPOTLIGHT.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{C6_SPOTLIGHT.subtitle}</p>
          </div>
        </div>

        <ul className="space-y-2 pl-1">
          {C6_SPOTLIGHT.highlights.map((h, i) => (
            <li key={i} className="text-sm leading-relaxed flex gap-2">
              <span className="text-green-600 shrink-0">•</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>

        <p className="text-sm leading-relaxed text-muted-foreground border-t pt-3">
          {C6_SPOTLIGHT.mechanism_short}
        </p>

        <details className="space-y-3">
          <summary className="cursor-pointer text-sm font-semibold hover:text-foreground/80">
            Xem chi tiết cách hoạt động và bảng tiền thưởng
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
                    <th className="text-left px-3 py-2 font-semibold">Giải</th>
                    <th className="text-right px-3 py-2 font-semibold">Vé thường (A khác B)</th>
                    <th className="text-right px-3 py-2 font-semibold">Vé A = B (gấp đôi)</th>
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
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Lưu ý quan trọng:</div>
              {C6_SPOTLIGHT.disclosures.map((d, i) => (
                <div key={i} className="text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </details>

        <div className="flex flex-wrap gap-2">
          <Link href={C6_SPOTLIGHT.play_href}>
            <Button className="bg-green-600 hover:bg-green-700">Mua tại trang Max 3D Pro</Button>
          </Link>
          <Link href={C6_SPOTLIGHT.history_href}>
            <Button variant="outline">Xem lịch sử nghiên cứu</Button>
          </Link>
        </div>
      </section>

      {/* Bộ lọc */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Tra cứu & so sánh</h2>

        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <input
            type="search"
            placeholder="Tìm cách chơi (theo mã hoặc tên)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border bg-background flex-1 min-w-[200px]"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as MethodCategory | "all")}
            className="px-3 py-2 text-sm rounded-md border bg-background"
          >
            <option value="all">Mọi nhóm</option>
            {(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as MethodCategory[]).map((c) => (
              <option key={c} value={c}>{categoryLabel(c)}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as MethodStatus | "all")}
            className="px-3 py-2 text-sm rounded-md border bg-background"
          >
            <option value="all">Mọi đánh giá</option>
            <option value="accept">Đã xác nhận có lợi thế</option>
            <option value="suggestive">Có dấu hiệu tốt</option>
            <option value="tested_no_edge">Đã thử — không có lợi thế</option>
            <option value="tested_variant">Đã thử (dạng chuẩn)</option>
            <option value="family_eliminated">Cả nhóm đã bị loại</option>
            <option value="deferred">Tạm hoãn</option>
            <option value="subsumed">Trùng cách khác</option>
            <option value="skipped">Chưa thử</option>
            <option value="na">Không áp dụng</option>
          </select>
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value as ProductKey | "all")}
            className="px-3 py-2 text-sm rounded-md border bg-background"
          >
            <option value="all">Mọi sản phẩm</option>
            <option value="power_655">Power 6/55</option>
            <option value="power_645">Mega 6/45</option>
            <option value="power_535">Power 5/35</option>
            <option value="max_3d">Max 3D</option>
            <option value="max_3d_pro">Max 3D Pro</option>
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Đang hiển thị {filtered.length} / {stats.total} cách chơi.
          Bấm vào hàng để xem chi tiết. Tích vào ô đầu hàng để chọn (tối đa 6) rồi so sánh — hiện chọn {selectedIds.size}.
        </div>
      </section>

      {/* Bảng cách chơi */}
      <section className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs">
                <th className="px-2 py-3 w-10 text-center">Chọn</th>
                <th
                  className="px-2 py-3 w-14 text-left font-semibold cursor-pointer hover:bg-muted"
                  onClick={() => { setSortBy("id"); setSortDesc(!sortDesc); }}
                >
                  Mã
                </th>
                <th className="px-3 py-3 text-left font-semibold">Cách chơi</th>
                <th
                  className="px-3 py-3 text-left font-semibold cursor-pointer hover:bg-muted"
                  onClick={() => { setSortBy("status"); setSortDesc(!sortDesc); }}
                >
                  Đánh giá
                </th>
                <th className="px-3 py-3 text-left font-semibold hidden md:table-cell">Áp dụng cho</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const s = statusLabel(m.status);
                const expanded = expandedIds.has(m.id);
                const selected_ = selectedIds.has(m.id);
                return (
                  <Fragment key={m.id}>
                    <tr
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
                    </tr>
                    {expanded && (
                      <tr key={`${m.id}-exp`} className="border-b bg-muted/10">
                        <td colSpan={5} className="px-6 py-4 space-y-4">
                          {m.mechanism_vi && (
                            <div className="text-sm">
                              <div className="font-semibold mb-1">Cách hoạt động</div>
                              <p className="text-muted-foreground leading-relaxed">{m.mechanism_vi}</p>
                            </div>
                          )}

                          {m.how_to_buy && (
                            <div className={`rounded-md p-3 border space-y-2 ${m.status === "accept" ? "bg-green-500/5 border-green-500/40" : "bg-primary/5 border-primary/30"}`}>
                              <div className="font-semibold text-sm">Hướng dẫn mua thực tế</div>
                              <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                                {m.how_to_buy.steps.map((step, i) => (
                                  <li key={i} className="leading-relaxed">{step}</li>
                                ))}
                              </ol>
                              <div className="grid md:grid-cols-2 gap-x-4 gap-y-1 text-xs pt-2 border-t border-border/50 mt-2">
                                {m.how_to_buy.sample_ticket && (
                                  <div className="md:col-span-2">
                                    <strong className="text-foreground">Vé mẫu:</strong>{" "}
                                    <span className="font-mono text-muted-foreground">{m.how_to_buy.sample_ticket}</span>
                                  </div>
                                )}
                                {m.how_to_buy.cost_per_draw_vnd !== undefined && (
                                  <div>
                                    <strong className="text-foreground">Chi phí mỗi kỳ:</strong>{" "}
                                    <span className="font-mono text-muted-foreground">
                                      {typeof m.how_to_buy.cost_per_draw_vnd === "number"
                                        ? `${m.how_to_buy.cost_per_draw_vnd.toLocaleString("vi-VN")} VND`
                                        : m.how_to_buy.cost_per_draw_vnd}
                                    </span>
                                  </div>
                                )}
                                {m.how_to_buy.where_to_buy && (
                                  <div>
                                    <strong className="text-foreground">Mua ở đâu:</strong>{" "}
                                    <span className="text-muted-foreground">{m.how_to_buy.where_to_buy}</span>
                                  </div>
                                )}
                                {m.how_to_buy.play_schedule && (
                                  <div className="md:col-span-2">
                                    <strong className="text-foreground">Lịch chơi gợi ý:</strong>{" "}
                                    <span className="text-muted-foreground">{m.how_to_buy.play_schedule}</span>
                                  </div>
                                )}
                              </div>
                              {m.how_to_buy.warnings && m.how_to_buy.warnings.length > 0 && (
                                <div className="pt-2 border-t border-border/50 space-y-0.5">
                                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Cần lưu ý:</div>
                                  {m.how_to_buy.warnings.map((w, i) => (
                                    <div key={i} className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed flex gap-1.5">
                                      <span className="shrink-0">•</span>
                                      <span>{w}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {m.verdict_note && (
                            <div className="text-sm">
                              <div className="font-semibold mb-1">Kết luận nghiên cứu</div>
                              <p className="text-muted-foreground leading-relaxed">{m.verdict_note}</p>
                            </div>
                          )}

                          {m.cycles_tested.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Đã được thử qua {m.cycles_tested.length} đợt nghiên cứu.
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
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bảng so sánh */}
      {selected.length >= 2 && (
        <section className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold">So sánh {selected.length} cách chơi</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const md = exportComparisonMd();
                  navigator.clipboard.writeText(md);
                }}
              >
                Sao chép bảng
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedIds(new Set())}
              >
                Bỏ chọn tất cả
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-2 py-2 text-left font-semibold sticky left-0 bg-muted/50">Hạng mục</th>
                  {selected.map((m) => (
                    <th key={m.id} className="px-2 py-2 text-left font-semibold min-w-[160px]">
                      <div className="font-mono text-[10px]">{m.id}</div>
                      <div className="text-xs">{m.name_vi}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-2 py-2 font-medium sticky left-0 bg-background">Nhóm</td>
                  {selected.map((m) => <td key={m.id} className="px-2 py-2">{categoryLabel(m.category)}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="px-2 py-2 font-medium sticky left-0 bg-background">Đánh giá</td>
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
                  <td className="px-2 py-2 font-medium sticky left-0 bg-background">Áp dụng cho</td>
                  {selected.map((m) => <td key={m.id} className="px-2 py-2 text-xs">{productList(m.applicable_products)}</td>)}
                </tr>
                <tr className="border-b">
                  <td className="px-2 py-2 font-medium sticky left-0 bg-background">Số đợt đã thử</td>
                  {selected.map((m) => (
                    <td key={m.id} className="px-2 py-2 text-xs text-muted-foreground">
                      {m.cycles_tested.length > 0 ? `${m.cycles_tested.length} đợt` : "Chưa thử"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Lưu ý chung */}
      <section className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4 space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
        <div className="font-semibold mb-1">Lưu ý chung</div>
        <div className="flex gap-2">
          <span className="shrink-0">•</span>
          <span>Trong điều kiện thông thường, mọi cách chơi xổ số đều lỗ kỳ vọng — chỉ riêng cách C6 (Vé A=B Max 3D Pro) có lợi thế thật nhờ khai thác quy chế nhân đôi giải.</span>
        </div>
        <div className="flex gap-2">
          <span className="shrink-0">•</span>
          <span>Cách C6 phụ thuộc quy chế Vietlott — nếu Vietlott đổi quy tắc, lợi thế biến mất.</span>
        </div>
        <div className="flex gap-2">
          <span className="shrink-0">•</span>
          <span>Kết quả các mô phỏng là chạy trên dữ liệu lịch sử — biến động thực tế có thể khác đáng kể.</span>
        </div>
        <div className="flex gap-2">
          <span className="shrink-0">•</span>
          <span>
            Bấm vào từng hàng trong bảng để xem chi tiết, hoặc xem thêm{" "}
            <Link href="/research" className="underline">lịch sử nghiên cứu</Link>.
          </span>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CYCLE22_PRODUCTS, CYCLE22_TIMESTAMP, type C22ProfileName } from "@/lib/cycle22-data";

// /research — tóm tắt theo trình tự thời gian, dùng tiếng Việt thân thiện.

const KEY_STATS = [
  { label: "Đợt nghiên cứu", value: "29", sub: "07/2025 → 04/2026" },
  { label: "Cách đã thử", value: "73", sub: "Trên 5 sản phẩm Vietlott" },
  { label: "Kỳ quay đã dùng để mô phỏng", value: "4.955", sub: "" },
  { label: "Cách đã xác nhận có lợi thế", value: "1", sub: "C6 — Vé A=B Max 3D Pro (Đợt 28)", highlight: true },
];

const TIMELINE = [
  {
    phase: "Giai đoạn 1 — Nền tảng",
    cycles: "Đợt 1-3",
    title: "Thử các cách cơ bản trên Power 6/55, 6/45, 5/35",
    body: "Thử 10 cách chọn số cơ bản (số nóng / số lạnh / theo mẫu / dự đoán thông minh / trải đều / kết hợp) trên 3 sản phẩm Power. Thiết lập hạ tầng đo lường — so sánh với chọn ngẫu nhiên thuần.",
    verdict: "Có dấu hiệu nhưng chưa chắc",
  },
  {
    phase: "Giai đoạn 2 — Đào sâu Max 3D",
    cycles: "Đợt 4-8",
    title: "Phát hiện sai số thật ở chữ số đơn vị",
    body: "13 phép kiểm tra thống kê trên Max 3D + Max 3D Pro. Phát hiện chữ số 6 ở vị trí đơn vị xuất hiện nhiều hơn bình thường (+10-11%). Các vị trí chữ số có liên hệ với nhau (không hoàn toàn độc lập). Tuy nhiên kiểm tra chéo (chia dữ liệu làm 2 nửa) cho thấy không khai thác được — sai số có nhưng không tận dụng được.",
    verdict: "Sai số thật nhưng không khai thác được",
  },
  {
    phase: "Giai đoạn 3 — Vét cạn các cách trên Power",
    cycles: "Đợt 9-10",
    title: "Loại nốt các 'có vẻ tốt' còn lại + chuyển hướng",
    body: "Cách 'số lạnh suy giảm' trên Mega 6/45 lúc đầu có vẻ tốt nhưng kiểm tra lại nửa sau cho kết quả ngược lại — đã loại. Sau Đợt 10 chuyển sang chế độ &ldquo;đột phá&rdquo;: yêu cầu cao hơn (cộng dồn nhiều tiêu chí + xác minh trên dữ liệu mới).",
    verdict: "Không cách nào đứng vững",
  },
  {
    phase: "Giai đoạn 4 — Đột phá trên Max 3D",
    cycles: "Đợt 11-13",
    title: "Thử các phương pháp toán phức tạp — đều bị loại",
    body: "Thử 3 hướng nâng cao: phân tích đồng phụ thuộc giữa các vị trí (Copula), học máy tăng cường (GBM), gộp dữ liệu nhiều sản phẩm (Pool). Tất cả đều bị loại — trong đó GBM có dấu hiệu &ldquo;mạnh&rdquo; nhưng kiểm tra kỹ phát hiện đó là &ldquo;học thuộc dữ liệu cũ&rdquo; chứ không phải hiểu thật sự (dẫn đến 2 nguyên tắc nghiên cứu mới về cảnh báo overfitting).",
    verdict: "Đã đóng nghiên cứu Max 3D",
  },
  {
    phase: "Giai đoạn 5 — Vét cạn Power",
    cycles: "Đợt 14-17",
    title: "Bayesian / Kelly / HMM — đều bị loại",
    body: "Thử các phương pháp nâng cao trên Power: Bayes thích nghi theo thời gian, dùng dữ liệu chéo giữa các sản phẩm, công thức Kelly nổi tiếng trong cờ bạc, mô hình Markov ẩn. Tất cả đều không vượt qua chọn ngẫu nhiên — đặc biệt Kelly cho kết quả TỆ HƠN ngẫu nhiên 28 điểm vì xổ số yêu cầu phủ rộng chứ không tập trung như cờ bạc.",
    verdict: "4 nhóm phương pháp đã bị loại hoàn toàn",
  },
  {
    phase: "Giai đoạn 6 — Tổng kết",
    cycles: "Đợt 18-21",
    title: "Tổng kết dự án + tinh chỉnh phương pháp luận",
    body: "Đợt 18 ra báo cáo tổng kết. Đợt 19-21 chạy thêm các đợt mini để chắc chắn không bỏ sót gì. Đợt 21 thử Bayes phân cấp — cũng bị loại. Sau giai đoạn này, tổng cộng 7 nhóm phương pháp đã bị loại hoàn toàn.",
    verdict: "Đột phá đã đóng — 7 nhóm phương pháp loại",
  },
  {
    phase: "Giai đoạn 7 — Tối ưu giao diện",
    cycles: "Đợt 22+",
    title: "Tích hợp các cách tốt nhất vào giao diện",
    body: "Sau khi đóng giai đoạn đột phá, dự án chuyển sang xếp hạng các cách hiện có theo 3 góc nhìn (Trúng nhiều / Lỗ ít / Cân bằng) để tích hợp vào giao diện. 3/5 sản phẩm có gợi ý đủ tin cậy, 2/5 trống (kết quả trung thực).",
    verdict: "Đã tích hợp 22/04/2026",
  },
  {
    phase: "Giai đoạn 8 — Phát hiện bất ngờ",
    cycles: "Đợt 27-29",
    title: "C6 A=B (Max 3D Pro) — cách đầu tiên có lợi thế thật",
    body: "Sau khi mở rộng nghiên cứu sang quy chế Vietlott (chứ không chỉ thuật toán chọn số), phát hiện vé Max 3D Pro với A=B (cùng 1 số nhập 2 lần) được Vietlott trả thưởng GẤP ĐÔI khi trúng các giải đầu. Mô phỏng nhiều lần đều cho lợi nhuận kỳ vọng dương rõ rệt. Người chơi đã trúng và xác nhận thực tế — đây là cách đầu tiên trong dự án được xác nhận có lợi thế.",
    verdict: "1 cách đã được xác nhận có lợi thế",
  },
];

const PRINCIPLES = [
  { n: 11, title: "Bắt buộc kiểm tra chéo nửa-nửa (split-half)", reason: "Kết quả tốt trên dữ liệu này phải lặp lại được trên dữ liệu khác mới đáng tin." },
  { n: 12, title: "Phải đủ cỡ mẫu mới kết luận", reason: "Mẫu nhỏ rất dễ cho ra kết quả may rủi nhìn như có lợi thế." },
  { n: 13, title: "Bắt buộc xác minh tiến (forward gate)", reason: "Phải kiểm tra trên dữ liệu chưa từng dùng để đào tạo, ít nhất 3 lớp." },
  { n: 14, title: "Cảnh báo khi mức tăng quá phi lý", reason: "Nếu kết quả tăng vượt mức trần lý thuyết, có thể là lỗi đo chứ không phải lợi thế thật." },
  { n: 15, title: "Kiểm tra mức độ tập trung của dự đoán (cho học máy)", reason: "Nếu mô hình dự đoán tập trung quá, có thể đã 'học thuộc' dữ liệu cũ." },
  { n: 16, title: "Bảo toàn lựa chọn — thử lại trước khi loại", reason: "Một lần thử thất bại chưa đủ để loại — phải thử lại có hệ thống." },
  { n: 17, title: "Loại cả nhóm phương pháp khi có đủ bằng chứng", reason: "Nếu nhiều cách trong cùng một nhóm đều thất bại, loại cả nhóm thay vì thử thêm vô tận." },
];

const RNG_FINDINGS = [
  { test: "Phân bố các chữ số (chi-square)", result: "Ổn định theo thời gian", verdict: "Bình thường" },
  { test: "Sai số ở chữ số 6 (vị trí đơn vị)", result: "+10-11% so với kỳ vọng (cả Max 3D và 3D Pro)", verdict: "Có sai số thật" },
  { test: "Tính độc lập giữa các vị trí", result: "3 cặp vị trí có liên hệ rõ rệt", verdict: "Có liên hệ" },
  { test: "Tương quan giữa các kỳ liên tiếp", result: "Không phát hiện tương quan", verdict: "Bình thường" },
  { test: "Sự ổn định theo thời gian (Đợt 8)", result: "Không thay đổi qua 3 cửa sổ thời gian", verdict: "Ổn định" },
  { test: "Bộ kiểm tra ngẫu nhiên NIST (Đợt 19)", result: "Đều phân bố đều trên cả 5 sản phẩm", verdict: "Bình thường" },
];

const PROFILE_META: Record<C22ProfileName, { icon: string; label: string }> = {
  winrate: { icon: "🎯", label: "Trúng nhiều" },
  roi: { icon: "💰", label: "Lỗ ít" },
  balanced: { icon: "⚖", label: "Cân bằng" },
};

export default function ResearchPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-10">
      {/* Tiêu đề */}
      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold tracking-tight">Lịch sử nghiên cứu Vietlott</h1>
          <Badge className="text-xs bg-green-600 hover:bg-green-700">1 cách đã xác nhận có lợi thế</Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Đây là tóm tắt hành trình hơn 29 đợt nghiên cứu về xổ số Vietlott — đã thử rất nhiều cách
          chọn số khác nhau, phân tích các quy luật, và kiểm tra cẩn thận từng cách bằng mô phỏng.
          Sau hành trình dài, có <strong className="text-green-700 dark:text-green-500">đúng 1 cách
          được xác nhận có lợi thế thật</strong> (C6 — Vé A=B Max 3D Pro). Trang này ghi lại trung
          thực toàn bộ — kể cả những cách đã thử và bị loại.
        </p>
      </header>

      {/* Số liệu nổi bật */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KEY_STATS.map((s) => (
          <Card key={s.label} className={s.highlight ? "border-green-500/40 bg-green-500/5" : ""}>
            <CardContent className="p-4">
              <div className={`text-3xl font-extrabold ${s.highlight ? "text-green-600" : "text-primary"}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 font-semibold">{s.label}</div>
              {s.sub && <div className="text-[10px] text-muted-foreground/80 mt-0.5 leading-tight">{s.sub}</div>}
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Gợi ý hiện tại */}
      <section id="cycle22" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold">Gợi ý hiện tại theo sản phẩm</h2>
          <span className="text-[11px] text-muted-foreground">Cập nhật {CYCLE22_TIMESTAMP}</span>
        </div>
        <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground leading-relaxed">
          Mỗi sản phẩm được xếp hạng theo 3 góc nhìn:
          {" "}<strong>Trúng nhiều</strong> (ưu tiên trúng nhiều nhất),
          {" "}<strong>Lỗ ít</strong> (ưu tiên lỗ ít nhất),
          {" "}<strong>Cân bằng</strong> (cân bằng cả hai).
          Mỗi gợi ý sau đó được kiểm tra chéo trên 2 nửa dữ liệu — nếu không nhất quán sẽ trả về &ldquo;chưa có gợi ý đủ tin cậy&rdquo;
          (kết quả trung thực, không cố tìm cho có).
        </div>
        <div className="grid gap-3">
          {CYCLE22_PRODUCTS.map((p) => {
            const anyPick = !!(p.picks.winrate || p.picks.roi || p.picks.balanced);
            return (
              <details key={p.slug} className="group rounded-lg border open:bg-muted/10">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{p.label}</span>
                    {!anyPick ? (
                      <Badge variant="outline" className="text-[10px] border-orange-500/40 text-orange-600">Chưa có gợi ý đủ tin cậy</Badge>
                    ) : (
                      <div className="flex gap-1">
                        {(["winrate", "roi", "balanced"] as C22ProfileName[]).map((pn) => {
                          const pick = p.picks[pn];
                          if (!pick) return null;
                          return (
                            <span key={pn} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                              {PROFILE_META[pn].icon} {pick.strategy}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground group-open:hidden">▼</span>
                  <span className="text-xs text-muted-foreground hidden group-open:inline">▲</span>
                </summary>
                <div className="px-3 pb-3 pt-0 space-y-2">
                  {!anyPick ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Mọi cách đứng đầu khi kiểm tra lại trên nửa dữ liệu khác đều cho kết quả ngược lại —
                      tức là đó chỉ là biến động ngẫu nhiên. Đây là kết quả trung thực: chưa có gợi ý nào đủ tin cậy.
                    </p>
                  ) : null}
                  {(["winrate", "roi", "balanced"] as C22ProfileName[]).map((pn) => (
                    <div key={pn} className="rounded border bg-background/50 p-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">
                          {PROFILE_META[pn].icon} {PROFILE_META[pn].label}
                        </span>
                        {p.picks[pn] ? (
                          <span className="text-[11px]">{p.picks[pn]!.strategy}</span>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Chưa có gợi ý đủ tin cậy</span>
                        )}
                      </div>
                      <div className="mt-1 overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead className="text-muted-foreground">
                            <tr>
                              <th className="text-right px-1 w-8">#</th>
                              <th className="text-left px-1">Cách chơi</th>
                              <th className="text-right px-1 w-28">Trúng so với ngẫu nhiên</th>
                              <th className="text-right px-1 w-28">Lãi/lỗ so với ngẫu nhiên</th>
                              <th className="text-right px-1 w-16">Tin cậy</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.rankings[pn].slice(0, 5).map((e) => (
                              <tr key={e.strategy} className="border-t border-muted/30">
                                <td className="text-right px-1 text-muted-foreground">{e.rank}</td>
                                <td className="px-1 truncate">{e.strategy}</td>
                                <td className={`text-right px-1 font-mono ${e.raw.delta_win_pp > 0 ? "text-green-600 dark:text-green-400" : e.raw.delta_win_pp < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                                  {e.raw.delta_win_pp > 0 ? "+" : ""}{e.raw.delta_win_pp.toFixed(2)}
                                </td>
                                <td className={`text-right px-1 font-mono ${e.raw.delta_roi_pct > 0 ? "text-green-600 dark:text-green-400" : e.raw.delta_roi_pct < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                                  {e.raw.delta_roi_pct > 0 ? "+" : ""}{e.raw.delta_roi_pct.toFixed(1)}
                                </td>
                                <td className="text-right px-1 text-muted-foreground font-mono">
                                  {e.raw.p_value_raw < 0.001 ? "<0,001" : e.raw.p_value_raw.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {p.rankings[pn].length > 5 && (
                          <div className="text-[10px] text-muted-foreground/60 mt-0.5 italic">
                            Hiển thị 5/{p.rankings[pn].length} cách đứng đầu.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* Dòng thời gian */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Dòng thời gian các đợt nghiên cứu</h2>
        <div className="space-y-2">
          {TIMELINE.map((t, i) => (
            <details key={i} className="group rounded-lg border open:bg-muted/10">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-foreground">{t.cycles}</span>
                  <span className="font-semibold text-sm">{t.phase}</span>
                  <span className="text-xs text-muted-foreground">— {t.title}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">{t.verdict}</Badge>
              </summary>
              <p className="px-3 pb-3 pt-0 text-xs text-muted-foreground leading-relaxed">{t.body}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Kết luận về máy quay số */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Kết luận về máy quay số Vietlott</h2>
        <p className="text-xs text-muted-foreground">
          Sau nhiều đợt kiểm tra, máy quay của Vietlott về cơ bản hoạt động khá ngẫu nhiên — có một vài
          sai số nhỏ ở Max 3D nhưng không đủ để khai thác trong thực tế.
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Phép kiểm tra</th>
                <th className="text-left px-3 py-2">Kết quả</th>
                <th className="text-left px-3 py-2">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {RNG_FINDINGS.map((r) => (
                <tr key={r.test} className="border-t">
                  <td className="px-3 py-1.5">{r.test}</td>
                  <td className="px-3 py-1.5">{r.result}</td>
                  <td className="px-3 py-1.5">{r.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Nguyên tắc nghiên cứu */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Các nguyên tắc nghiên cứu rút ra</h2>
        <p className="text-xs text-muted-foreground">
          Sau nhiều lần &ldquo;tưởng đã tìm thấy lợi thế nhưng kiểm tra lại thì hóa ra không phải&rdquo;, dự án
          đã đúc rút thành các nguyên tắc nghiên cứu cứng để tránh sai lầm trong tương lai.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRINCIPLES.map((p) => (
            <div key={p.n} className="rounded-lg border p-3 text-xs space-y-1">
              <div className="font-semibold">Nguyên tắc {p.n}: {p.title}</div>
              <div className="text-muted-foreground leading-relaxed">{p.reason}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Kết */}
      <footer className="rounded-lg border border-orange-500/40 bg-orange-500/5 p-4 text-sm space-y-2">
        <div className="font-semibold">Kết luận chung</div>
        <p className="text-xs leading-relaxed">
          Sau hàng chục đợt mô phỏng và đo lường, không một thuật toán chọn số nào đảm bảo lợi nhuận
          khi chơi xổ số Vietlott — về dài hạn, người chơi luôn lỗ kỳ vọng. Trường hợp duy nhất có
          lợi thế thật là cách C6 (Vé A=B Max 3D Pro), nhưng đó là khai thác quy chế nhân đôi giải
          chứ không phải nhờ thuật toán.
        </p>
        <p className="text-xs">
          Hãy chơi có trách nhiệm và trong khả năng tài chính của mình.
        </p>
        <p className="text-[11px] text-muted-foreground pt-1 border-t border-orange-500/20 flex flex-wrap gap-3">
          <Link href="/methods" className="underline">Danh mục cách chơi</Link>
          <Link href="/algorithms" className="underline">Tất cả thuật toán</Link>
          <Link href="/glossary" className="underline">Thuật ngữ</Link>
          <Link href="/suggest" className="underline">Gợi ý số</Link>
        </p>
      </footer>
    </div>
  );
}

/**
 * ResearchStateBanner — research transparency disclosure.
 *
 * Variants:
 *   closed — breakthrough closed post Chu kỳ 18, Optimization shipped Chu kỳ 22
 *   active — reserved for future reopen (currently unused)
 *   accept — strategy has Accept confirmed (currently none)
 *
 * Size "sm" (compact — for product pages) vs "md" (detailed — for /research, /algorithms).
 */

export type ResearchVariant = "closed" | "active" | "accept";
export type BannerSize = "sm" | "md";

interface Props {
  variant: ResearchVariant;
  size?: BannerSize;
  /** Product context — 3D / matrix / specific. Shown in body text. */
  context?: "3d" | "matrix" | string;
}

const COPY: Record<ResearchVariant, { title: string; body: string; hint?: string; color: string }> = {
  closed: {
    title: "Lưu ý: chưa có thuật toán nào được xác nhận có lợi thế cho sản phẩm này",
    body:
      "Sau hơn 22 đợt mô phỏng và đo lường nghiêm ngặt, không có thuật toán chọn số nào đảm bảo trúng " +
      "nhiều hơn chọn ngẫu nhiên. Các gợi ý hiện tại trên trang này chỉ là cách &ldquo;có vẻ tốt nhất&rdquo; " +
      "theo dữ liệu mô phỏng — KHÔNG đảm bảo có lợi thế thật. Lãi/lỗ kỳ vọng vẫn âm.",
    hint: "Xem chi tiết tại trang Lịch sử nghiên cứu.",
    color: "orange",
  },
  active: {
    title: "Lưu ý: dự án đang theo dõi sau khi đóng giai đoạn đột phá",
    body:
      "Giai đoạn nghiên cứu đột phá đã đóng. Hiện chỉ tích hợp các cách hiện có vào giao diện, không " +
      "nghiên cứu thuật toán mới.",
    hint: "Xem chi tiết tại trang Lịch sử nghiên cứu.",
    color: "orange",
  },
  accept: {
    title: "Đã được xác nhận có lợi thế",
    body:
      "Cách này đã vượt qua đầy đủ các kiểm tra (mô phỏng đầy đủ + kiểm tra chéo nửa-nửa + " +
      "kiểm tra trên dữ liệu mới). Tuy nhiên kết quả lịch sử không đảm bảo cho tương lai.",
    color: "green",
  },
};

export function ResearchStateBanner({ variant, size = "md" }: Props) {
  const { title, body, hint, color } = COPY[variant];
  const borderColor = color === "green" ? "border-green-500/40 bg-green-500/5" : "border-orange-500/40 bg-orange-500/5";
  const titleColor = color === "green" ? "text-green-700 dark:text-green-400" : "text-orange-700 dark:text-orange-400";

  if (size === "sm") {
    return (
      <div className={`rounded-lg border p-3 text-sm ${borderColor}`}>
        <div className="flex items-start gap-2">
          <span className="text-lg shrink-0">🔬</span>
          <div className="flex-1 space-y-1">
            <div className={`font-semibold ${titleColor}`}>{title}</div>
            <p className="text-muted-foreground leading-relaxed text-xs">{body}</p>
            {hint && (
              <p className="text-xs text-muted-foreground/80">
                <a href="/research" className="underline hover:text-orange-600">
                  {hint}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-5 ${borderColor}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🔬</span>
        <div className="flex-1 space-y-2 text-sm">
          <div className={`font-bold ${titleColor}`}>{title}</div>
          <p className="text-muted-foreground leading-relaxed">{body}</p>
          {hint && (
            <p className="text-xs text-muted-foreground/80 italic">
              <a href="/research" className="underline hover:text-orange-600">
                {hint}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

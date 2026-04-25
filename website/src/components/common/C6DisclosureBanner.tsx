/**
 * Bảng thông báo riêng cho Max 3D Pro — cách C6 (Vé A=B).
 * Đây là cách chơi đầu tiên trong dự án nghiên cứu được xác nhận có lợi thế thật.
 */

export function C6DisclosureBanner() {
  return (
    <div className="rounded-lg border p-4 border-green-500/40 bg-green-500/5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🏆</span>
        <div className="flex-1 space-y-2">
          <div className="font-semibold text-green-700 dark:text-green-400">
            Cách chơi đầu tiên có lợi thế thật trong hơn 28 đợt nghiên cứu — Vé A=B
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mua vé Max 3D Pro với <strong>A và B là cùng một số</strong> (ví dụ 007 và 007).
            Theo quy chế Vietlott, khi vé như vậy trúng 1 trong 4 giải đầu (Nhất, Nhì, Ba, Tư),
            tiền thưởng được <strong>nhân đôi</strong>. Mô phỏng nhiều lần đều cho lợi nhuận
            kỳ vọng dương rõ rệt — đã được kiểm chứng qua trúng thưởng thực tế.
          </p>
          <div className="text-xs text-muted-foreground space-y-1 pt-1">
            <div className="flex gap-2">
              <span className="shrink-0">•</span>
              <span><strong>Phụ thuộc quy chế Vietlott</strong> — nếu Vietlott đổi quy tắc nhân đôi, lợi thế biến mất.</span>
            </div>
            <div className="flex gap-2">
              <span className="shrink-0">•</span>
              <span>Người chơi <strong>phải tự nhập cùng 1 số vào cả 2 ô A và B</strong> trên vietlott.vn — Vietlott không tự gợi ý.</span>
            </div>
            <div className="flex gap-2">
              <span className="shrink-0">•</span>
              <span>Chỉ áp dụng cho <strong>Max 3D Pro</strong> — Max 3D và các sản phẩm Power không có quy chế này.</span>
            </div>
            <div className="flex gap-2">
              <span className="shrink-0">•</span>
              <span>Tỉ lệ trúng giải cao mỗi vé khoảng 2 trong 100 — đa số kỳ sẽ không trúng. Lỗ ngắn hạn là bình thường.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

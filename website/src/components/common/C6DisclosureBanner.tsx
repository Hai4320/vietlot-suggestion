/**
 * C6DisclosureBanner — specific to Max 3D Pro A=B Exploit (Chu kỳ 28 Accept).
 *
 * Renders on `/max-3d-pro` prominently để disclose:
 * - Accept status + source cycle
 * - Theoretical vs backtest EV
 * - Quy chế dependency (rule stability risk)
 * - User instruction: must enter A=B on vietlott.vn UI
 *
 * First use of 🏆 badge in 28-cycle project history.
 */

export function C6DisclosureBanner() {
  return (
    <div className="rounded-lg border p-4 border-green-500/40 bg-green-500/5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🏆</span>
        <div className="flex-1 space-y-2">
          <div className="font-semibold text-green-700 dark:text-green-400">
            Accept Chu kỳ 28 — A=B Exploit (first positive-EV finding trong 28 chu kỳ research)
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vé Max 3D Pro với <strong>A = B = X</strong> được quy chế Vietlott thưởng
            gấp đôi ở Giải Nhất / Nhì / Ba / Tư khi trúng.
            Theoretical EV <strong className="text-foreground">+4180%</strong> /
            backtest validated <strong className="text-foreground">+3864%</strong> (N_RUNS=200,
            4/4 segments consistent).
          </p>
          <div className="text-xs text-muted-foreground space-y-1 pt-1">
            <div>
              ⚠ <strong>Phụ thuộc quy chế Vietlott</strong> — rule có thể thay đổi không báo trước
            </div>
            <div>
              ⚠ <strong>User phải nhập cùng 1 số 2 lần (A, B)</strong> trên vietlott.vn — không auto
            </div>
            <div>
              ⚠ Chỉ áp dụng <strong>Max 3D Pro</strong>, không áp dụng các sản phẩm khác
            </div>
            <div>
              ⚠ Variance cao — high-tier hit rare (~2%), hầu hết kỳ không trúng
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

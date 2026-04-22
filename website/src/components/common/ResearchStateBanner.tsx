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
    title: "🔬 Research Mode — No confirmed edge",
    body:
      "Sau 22 chu kỳ + 69 chiến lược × 3-gate protocol, 0 Accept. Breakthrough research closed Chu kỳ 18. " +
      "Chu kỳ 22 Optimization ship picks theo composite tournament — directional only, không confirmed edge. EV âm cố định.",
    hint: "Xem /research cho full story.",
    color: "orange",
  },
  active: {
    title: "🔬 Research Mode — Post-closure monitoring",
    body:
      "Breakthrough closed Chu kỳ 18. Reopen chỉ khi đủ §9 triggers (N≥2000 per product, novel paradigm, null-reversal). " +
      "Current activity: Optimization mode (UI rankings), không research mechanism mới.",
    hint: "Xem /research + /algorithms cho chi tiết methodology.",
    color: "orange",
  },
  accept: {
    title: "✓ Accept confirmed — 3-gate protocol passed",
    body:
      "Strategy đạt Accept qua full-sample + split-half + forward_last_100. Magnitude within bias ceiling " +
      "(Principle #14). No overfit signature. Historical only — future performance not guaranteed.",
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

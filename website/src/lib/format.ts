/**
 * Shared formatting helpers for research data display.
 */

/**
 * Format p-value for UI display.
 * Returns "—" for undefined, "<0.001" for sub-threshold, 3-decimal otherwise.
 */
export function formatPValue(p?: number): string {
  if (p === undefined) return "—";
  if (p < 0.001) return "<0.001";
  return p.toFixed(3);
}

/**
 * Format Δ (delta vs baseline) in percentage points.
 * Returns signed value with 3-decimal precision.
 */
export function formatDeltaPp(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(3)}pp`;
}

/**
 * Format ROI percentage with 1-decimal + sign.
 */
export function formatRoi(roi: number): string {
  const sign = roi > 0 ? "+" : "";
  return `${sign}${roi.toFixed(1)}%`;
}

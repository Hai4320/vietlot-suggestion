import { Badge } from "@/components/ui/badge";
import type { Decision } from "@/lib/backtest-data";

/**
 * Decision badge — shared UI for 4-state research decision visualization
 * per EVALUATION.md §6 + Principle #13 (3-gate stacked).
 *
 * Color conventions (per RESEARCH_TO_UI_PLAYBOOK §5):
 *   Accept (green)       — 3-gate pass + Principle #14 OK, confirmed edge
 *   Suggestive (yellow)  — partial gate pass, pending replication
 *   Inconclusive (gray)  — gates disagree, not enough evidence
 *   Reject (muted)       — failed gate
 *   baseline             — not rendered (baseline strategies have no decision)
 */
export function DecisionBadge({ d }: { d?: Decision }) {
  if (!d || d === "baseline") return null;
  const map: Record<Decision, { text: string; cls: string }> = {
    Accept: { text: "Đã xác nhận", cls: "bg-green-600 text-white" },
    Suggestive: { text: "Có dấu hiệu", cls: "bg-yellow-500 text-black" },
    Inconclusive: { text: "Chưa rõ", cls: "bg-gray-400 text-white" },
    Reject: { text: "Đã loại", cls: "bg-muted text-muted-foreground" },
    baseline: { text: "", cls: "" },
  };
  const m = map[d];
  return <Badge className={`text-[9px] px-1 py-0 ${m.cls}`}>{m.text}</Badge>;
}

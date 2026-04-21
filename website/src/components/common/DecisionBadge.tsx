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
  const styles: Record<Decision, string> = {
    Accept: "bg-green-600 text-white",
    Suggestive: "bg-yellow-500 text-black",
    Inconclusive: "bg-gray-400 text-white",
    Reject: "bg-muted text-muted-foreground",
    baseline: "",
  };
  return <Badge className={`text-[9px] px-1 py-0 ${styles[d]}`}>{d}</Badge>;
}

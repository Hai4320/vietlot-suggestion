"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface CheckRateCsvTicket {
  numbers: number[]; // main numbers
  special?: number | null;
}

interface Props {
  game: string; // "power_535", "power_655", ...
  algorithm: string;
  tickets: CheckRateCsvTicket[];
  /** Navigate to /check-rate after copying */
  navigateAfter?: boolean;
  label?: string;
}

export function CopyAsCheckRateCsv({
  game,
  algorithm,
  tickets,
  navigateAfter = true,
  label = "Copy CSV for Check-rate",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (tickets.length === 0) return;
    const lines = ["game,algorithm,ticket_no,numbers,special"];
    tickets.forEach((t, i) => {
      const nums = t.numbers.join(" ");
      const special = t.special ?? "";
      lines.push(`${game},${algorithm},${i + 1},${nums},${special}`);
    });
    const csv = lines.join("\n") + "\n";
    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (navigateAfter) {
        setTimeout(() => {
          window.location.href = "/check-rate";
        }, 400);
      }
    } catch {
      // Fallback: open page in new tab; user pastes manually
      window.prompt("Clipboard không cho phép. Sao chép CSV này rồi mở /check-rate:", csv);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={handleCopy}
      disabled={tickets.length === 0}
    >
      {copied ? "✓ Đã copy" : label}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Vé cho việc xuất CSV — hỗ trợ cả Power matrix và Max 3D/Pro.
 * - Power: numbers = mảng số, special có thể là số (5/35) hoặc null
 * - Max 3D: numbers = ["007"]   |   special = null
 * - Max 3D Pro: numbers = ["007", "042"] (2 ô A, B)   |   special = null
 */
export interface SaveTestTicket {
  numbers: (number | string)[];
  special?: number | null;
}

interface Props {
  /** Đặt tên trò chơi đúng với check-rate evaluator: power_535 / power_645 / power_655 / 3d / 3d_pro */
  game: string;
  algorithm: string;
  tickets: SaveTestTicket[];
  /** Nhãn hiển thị trên nút */
  label?: string;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function buildFilename(game: string, algorithm: string): string {
  const now = new Date();
  const stamp = `${pad2(now.getDate())}-${pad2(now.getMonth() + 1)}_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  // Loại các ký tự đặc biệt khỏi algorithm (vd có thể chứa dấu / hoặc khoảng trắng)
  const safeAlgo = algorithm.replace(/[^A-Za-z0-9_-]/g, "_");
  return `data_${game}_${safeAlgo}_${stamp}.csv`;
}

function buildCsv(game: string, algorithm: string, tickets: SaveTestTicket[]): string {
  const lines = ["game,algorithm,ticket_no,numbers,special"];
  tickets.forEach((t, i) => {
    // Numbers: cả số và chuỗi đều join bằng khoảng trắng
    const nums = t.numbers.map((n) => String(n)).join(" ");
    const special = t.special === null || t.special === undefined ? "" : String(t.special);
    lines.push(`${game},${algorithm},${i + 1},${nums},${special}`);
  });
  return lines.join("\n") + "\n";
}

export function SaveToTestFolder({ game, algorithm, tickets, label = "💾 Lưu vào test/" }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function handleSave() {
    if (tickets.length === 0) return;
    setBusy(true);
    setStatus(null);
    try {
      const filename = buildFilename(game, algorithm);
      const csv = buildCsv(game, algorithm, tickets);
      const res = await fetch("/api/save-test-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, csv }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ kind: "ok", text: data.message ?? `Đã lưu ${filename}` });
      } else {
        setStatus({ kind: "err", text: data.message ?? "Lưu thất bại" });
      }
    } catch (err) {
      setStatus({ kind: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(null), 4500);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1 items-end">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleSave}
        disabled={busy || tickets.length === 0}
        title={`Lưu ${tickets.length} vé vào folder test/ để tra sau`}
      >
        {busy ? "Đang lưu..." : label}
      </Button>
      {status && (
        <span
          className={`text-[10px] ${
            status.kind === "ok"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {status.text}
        </span>
      )}
    </div>
  );
}

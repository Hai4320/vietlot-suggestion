"use client";

import { useState } from "react";
import { CsvInput } from "@/components/check-rate/CsvInput";
import { QuickGenerate } from "@/components/check-rate/QuickGenerate";
import { ResultCard } from "@/components/check-rate/ResultCard";
import { SummaryCard } from "@/components/check-rate/SummaryCard";
import { Badge } from "@/components/ui/badge";
import {
  CsvFormatError,
  type EvalResult,
  type HistoryMatch,
  type Ticket,
  getEvaluator,
  groupTickets,
  loadDraws,
  parseCsv,
  registeredGames,
} from "@/lib/check-rate";

interface GroupReport {
  key: string;
  result: EvalResult;
  histories: HistoryMatch[];
  unsupported?: false;
}

interface UnsupportedReport {
  key: string;
  game: string;
  algorithm: string;
  nTickets: number;
  unsupported: true;
}

type Report = GroupReport | UnsupportedReport;

function clampBacktestDraws(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(5000, Math.floor(n));
}

export default function CheckRatePage() {
  const [csv, setCsv] = useState("");
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [backtestDrawsInput, setBacktestDrawsInput] = useState("100");
  const backtestDraws = clampBacktestDraws(backtestDrawsInput);

  async function evaluate() {
    setBusy(true);
    setError(null);
    setReports(null);
    try {
      const tickets = parseCsv(csv);
      if (tickets.length === 0) {
        setError("CSV không chứa vé nào.");
        return;
      }
      const groups = groupTickets(tickets);
      const gameSet = new Set<string>();
      for (const t of tickets) gameSet.add(t.game);

      // Fetch draws per game (parallel)
      const drawsByGame = new Map<string, Awaited<ReturnType<typeof loadDraws>>>();
      await Promise.all(
        Array.from(gameSet).map(async (game) => {
          if (!getEvaluator(game)) return;
          try {
            drawsByGame.set(game, await loadDraws(game));
          } catch (e) {
            console.warn(`Failed to load draws for ${game}`, e);
          }
        }),
      );

      const out: Report[] = [];
      for (const [key, groupTicketsList] of groups) {
        const [game, algorithm] = key.split("|");
        const ev = getEvaluator(game);
        if (!ev) {
          out.push({ key, game, algorithm, nTickets: groupTicketsList.length, unsupported: true });
          continue;
        }
        const draws = drawsByGame.get(game);
        if (!draws) {
          out.push({ key, game, algorithm, nTickets: groupTicketsList.length, unsupported: true });
          continue;
        }
        const window = backtestDraws > 0 && draws.length > backtestDraws ? draws.slice(-backtestDraws) : draws;
        let parseError: string | null = null;
        try {
          // parseNumbers may throw for invalid ticket — validate up front
          for (const t of groupTicketsList) ev.parseNumbers(t);
        } catch (e) {
          parseError = e instanceof Error ? e.message : String(e);
        }
        if (parseError) {
          setError(parseError);
          return;
        }
        const result = ev.evaluate(groupTicketsList, window);
        const histories = groupTicketsList.map((t: Ticket) => ev.historyMatch(t, draws));
        out.push({ key, result, histories });
      }
      setReports(out);
    } catch (e) {
      if (e instanceof CsvFormatError) setError(`CSV lỗi: ${e.message}`);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container mx-auto max-w-5xl p-4 md:p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Tra vé Vietlott — đã trúng giải nào?</h1>
        <p className="text-sm text-muted-foreground">
          Dán hoặc nhập danh sách các bộ số (theo định dạng CSV bên dưới) → hệ thống sẽ tra trên dữ
          liệu lịch sử Vietlott xem các vé đó đã trúng giải nào, ở những kỳ nào.
        </p>
        <p className="text-xs text-muted-foreground">
          Hiện đang hỗ trợ:{" "}
          {registeredGames().map((g) => (
            <Badge key={g} variant="secondary" className="mr-1">
              {g}
            </Badge>
          ))}
        </p>
      </header>

      <QuickGenerate
        onAppend={(csvRows) => {
          // If existing textarea is empty or only whitespace, replace. Otherwise
          // append as new block — drop the duplicate header line.
          setCsv((prev) => {
            const trimmed = prev.trim();
            if (!trimmed) return csvRows;
            const [, ...rest] = csvRows.split("\n");
            return trimmed + "\n" + rest.join("\n");
          });
        }}
      />

      <section className="space-y-3 rounded-lg border p-4">
        <CsvInput
          value={csv}
          onChange={setCsv}
          onEvaluate={evaluate}
          onClear={() => {
            setCsv("");
            setReports(null);
            setError(null);
          }}
          busy={busy}
        />
        <div className="flex items-center gap-3 text-sm">
          <label htmlFor="backtest-draws" className="text-muted-foreground">
            Tra trên bao nhiêu kỳ gần nhất:
          </label>
          <input
            id="backtest-draws"
            type="number"
            min={0}
            max={5000}
            className="w-24 rounded-md border bg-background px-2 py-1 text-sm"
            value={backtestDrawsInput}
            onChange={(e) => setBacktestDrawsInput(e.target.value)}
            onBlur={() => setBacktestDrawsInput(String(backtestDraws))}
          />
          <span className="text-muted-foreground">(để 0 nghĩa là tra toàn bộ lịch sử)</span>
        </div>
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
      </section>

      {reports && (
        <section className="space-y-4">
          {/* Tổng hợp toàn bộ — chỉ hiển thị khi có ít nhất 1 nhóm tra được */}
          {(() => {
            const supportedGroups = reports
              .filter((r): r is GroupReport => !r.unsupported)
              .map((r) => {
                const [game, algorithm] = r.key.split("|");
                return { key: r.key, game, algorithm, result: r.result };
              });
            return supportedGroups.length > 0 ? <SummaryCard groups={supportedGroups} /> : null;
          })()}

          {/* Chi tiết từng nhóm */}
          {reports.map((r) =>
            r.unsupported ? (
              <div
                key={r.key}
                className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
              >
                <Badge variant="outline">{r.game}</Badge> / {r.algorithm} ({r.nTickets} vé) —{" "}
                chưa hỗ trợ (sẽ bổ sung sau).
              </div>
            ) : (
              <ResultCard key={r.key} result={r.result} histories={r.histories} />
            ),
          )}
        </section>
      )}
    </main>
  );
}

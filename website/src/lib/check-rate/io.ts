// CSV parser for check-rate tickets. Mirror of Python vietlott.check_rate.io.
// Minimal hand-rolled parser (no external dep) — schema is flat, no embedded
// commas/quotes expected in the `numbers` column (space-separated ints).

import type { Ticket } from "./types";

export const REQUIRED_COLUMNS = ["game", "algorithm", "ticket_no", "numbers", "special"];

export class CsvFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvFormatError";
  }
}

export function parseCsv(text: string): Ticket[] {
  const stripped = text.replace(/^﻿/, ""); // strip BOM
  const rawLines = stripped.split(/\r?\n/).filter((l) => l.length > 0);
  if (rawLines.length === 0) throw new CsvFormatError("Empty CSV (no rows)");

  const header = splitCsvLine(rawLines[0]);
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    throw new CsvFormatError(
      `Missing columns: ${missing.join(", ")}. Expected: ${REQUIRED_COLUMNS.join(",")}`,
    );
  }

  const idx: Record<string, number> = {};
  header.forEach((col, i) => (idx[col] = i));

  const tickets: Ticket[] = [];
  for (let i = 1; i < rawLines.length; i++) {
    const rowNum = i + 1;
    const cells = splitCsvLine(rawLines[i]);
    try {
      tickets.push(parseRow(cells, idx));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new CsvFormatError(`Row ${rowNum}: ${msg}`);
    }
  }
  return tickets;
}

function parseRow(cells: string[], idx: Record<string, number>): Ticket {
  const game = (cells[idx.game] ?? "").trim();
  if (!game) throw new Error("game is empty");

  const algorithm = (cells[idx.algorithm] ?? "").trim();
  if (!algorithm) throw new Error("algorithm is empty");

  const ticketNoRaw = (cells[idx.ticket_no] ?? "").trim();
  const ticketNo = Number(ticketNoRaw);
  if (!Number.isInteger(ticketNo)) throw new Error(`ticket_no must be int, got '${ticketNoRaw}'`);

  const numbersRaw = (cells[idx.numbers] ?? "").trim();
  if (!numbersRaw) throw new Error("numbers is empty");

  const specialRaw = (cells[idx.special] ?? "").trim();
  let special: number | null = null;
  if (specialRaw !== "") {
    const n = Number(specialRaw);
    if (!Number.isInteger(n)) throw new Error(`special must be int or empty, got '${specialRaw}'`);
    special = n;
  }

  return { game, algorithm, ticketNo, numbersRaw, special };
}

function splitCsvLine(line: string): string[] {
  // Minimal CSV split — supports quoted fields with embedded commas (not newlines).
  const out: string[] = [];
  let i = 0;
  let cur = "";
  let inQuote = false;
  while (i < line.length) {
    const c = line[i];
    if (inQuote) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      if (c === '"') {
        inQuote = false;
        i += 1;
        continue;
      }
      cur += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuote = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      out.push(cur);
      cur = "";
      i += 1;
      continue;
    }
    cur += c;
    i += 1;
  }
  out.push(cur);
  return out;
}

export function groupTickets(tickets: Ticket[]): Map<string, Ticket[]> {
  const groups = new Map<string, Ticket[]>();
  for (const t of tickets) {
    const key = `${t.game}|${t.algorithm}`;
    const arr = groups.get(key);
    if (arr) arr.push(t);
    else groups.set(key, [t]);
  }
  return groups;
}

export function ticketsToCsv(tickets: Ticket[]): string {
  const lines = [REQUIRED_COLUMNS.join(",")];
  for (const t of tickets) {
    const special = t.special === null ? "" : String(t.special);
    // numbers may contain spaces but not commas — safe to emit unquoted for power; still quote 3D single values is fine too
    lines.push([t.game, t.algorithm, t.ticketNo, t.numbersRaw, special].join(","));
  }
  return lines.join("\n") + "\n";
}

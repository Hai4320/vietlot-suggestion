import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * POST /api/save-test-csv
 *
 * Body: { filename: string, csv: string }
 * Lưu file CSV vào <repo>/test/ — dùng để xuất gợi ý vé sang folder test
 * cho việc tra trúng sau này. Chỉ chạy local dev (cần ghi filesystem).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const csv = typeof body?.csv === "string" ? body.csv : "";
    const rawFilename = typeof body?.filename === "string" ? body.filename : "";

    if (!csv) {
      return NextResponse.json({ success: false, message: "CSV rỗng" }, { status: 400 });
    }

    // Sanitize filename: chỉ giữ basename, ép có đuôi .csv
    const safeName = path.basename(rawFilename).replace(/[^A-Za-z0-9._\-]/g, "_") || "data.csv";
    const filename = safeName.endsWith(".csv") ? safeName : `${safeName}.csv`;

    const projectRoot = path.resolve(process.cwd(), "..");
    const testDir = path.join(projectRoot, "test");
    await mkdir(testDir, { recursive: true });

    const fullPath = path.join(testDir, filename);
    await writeFile(fullPath, csv, "utf-8");

    // Đếm số vé thật: tổng dòng không rỗng - 1 (trừ header)
    const ticketCount = Math.max(0, csv.split(/\r?\n/).filter((l: string) => l.length > 0).length - 1);

    return NextResponse.json({
      success: true,
      message: `Đã lưu ${ticketCount} vé vào test/${filename}`,
      path: `test/${filename}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

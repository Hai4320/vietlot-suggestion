import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

/**
 * POST /api/crawl
 * Triggers the Python crawler for specified products,
 * then rebuilds the JSON data files from JSONL.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const products: string[] = body.products ?? [
      "power_655",
      "power_645",
      "power_535",
      "3d",
      "3d_pro",
    ];

    const projectRoot = path.resolve(process.cwd(), "..");
    const pythonPath = path.join(projectRoot, ".venv", "bin", "python");
    const crawlScript = path.join(projectRoot, "src", "vietlott", "cli", "crawl.py");
    const buildDataScript = path.join(process.cwd(), "scripts", "build_data.py");

    const results: { product: string; status: string; message: string }[] = [];

    // Step 1: Crawl each product
    for (const product of products) {
      try {
        const { stdout, stderr } = await execAsync(
          `PYTHONPATH="${path.join(projectRoot, "src")}" "${pythonPath}" "${crawlScript}" ${product}`,
          { timeout: 120_000, cwd: projectRoot },
        );
        results.push({
          product,
          status: "ok",
          message: (stdout || stderr || "").trim().slice(-200),
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ product, status: "error", message: msg.slice(-200) });
      }
    }

    // Step 2: Rebuild JSON data from JSONL
    try {
      await execAsync(`"${pythonPath}" "${buildDataScript}"`, {
        timeout: 30_000,
        cwd: projectRoot,
      });
    } catch {
      // non-fatal
    }

    const ok = results.filter((r) => r.status === "ok").length;

    return NextResponse.json({
      success: true,
      message: `Crawled ${ok}/${products.length} products`,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

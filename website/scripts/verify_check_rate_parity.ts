// Golden-fixture parity check: TS evaluator output must match Python
// evaluator output on identical input. Reads fixtures from
// <repo-root>/tests/fixtures/check_rate/ and diffs TS-produced groups +
// history against expected.json (authored for Python, mirrored by TS).

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv, groupTickets } from "../src/lib/check-rate/io";
import { getEvaluator, registeredGames } from "../src/lib/check-rate/registry";
import {
  serializeGroupForParity,
  serializeHistoryForParity,
} from "../src/lib/check-rate/reporter";
import "../src/lib/check-rate/evaluators"; // trigger registration

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const FIXTURE_DIR = join(REPO_ROOT, "tests", "fixtures", "check_rate");

interface Failure {
  fixture: string;
  path: string;
  expected: unknown;
  actual: unknown;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const ak = Object.keys(ao).sort();
    const bk = Object.keys(bo).sort();
    if (ak.length !== bk.length) return false;
    if (!ak.every((k, i) => k === bk[i])) return false;
    return ak.every((k) => deepEqual(ao[k], bo[k]));
  }
  return false;
}

function verifyFixture(fixtureName: string, failures: Failure[]): void {
  const csvPath = join(FIXTURE_DIR, `${fixtureName}.csv`);
  const drawsPath = join(FIXTURE_DIR, `${fixtureName.replace("_sample", "_draws")}.json`);
  const expectedPath = join(FIXTURE_DIR, `${fixtureName}.expected.json`);

  const csv = readFileSync(csvPath, "utf-8");
  const draws = JSON.parse(readFileSync(drawsPath, "utf-8"));
  const expected = JSON.parse(readFileSync(expectedPath, "utf-8"));

  const tickets = parseCsv(csv);
  const groups = groupTickets(tickets);

  // Expected groups[] align with Python grouping order (insertion order per game+algorithm)
  const actualGroups: unknown[] = [];
  const actualHistory: unknown[] = [];

  for (const [key, groupTickets] of groups) {
    const [game] = key.split("|");
    const evaluator = getEvaluator(game);
    if (!evaluator) {
      console.error(`  ✖  no evaluator registered for game=${game}`);
      failures.push({ fixture: fixtureName, path: "registry", expected: game, actual: null });
      continue;
    }
    const result = evaluator.evaluate(groupTickets, draws);
    actualGroups.push(serializeGroupForParity(result));
    for (const t of groupTickets) {
      actualHistory.push(serializeHistoryForParity(evaluator.historyMatch(t, draws)));
    }
  }

  compareField(fixtureName, "groups", expected.groups, actualGroups, failures);
  compareField(fixtureName, "history", expected.history, actualHistory, failures);
}

function compareField(
  fixture: string,
  path: string,
  expected: unknown,
  actual: unknown,
  failures: Failure[],
): void {
  if (deepEqual(expected, actual)) {
    console.log(`  ✓  ${path}`);
    return;
  }
  console.log(`  ✖  ${path}`);
  console.log(`     expected: ${JSON.stringify(expected)}`);
  console.log(`     actual:   ${JSON.stringify(actual)}`);
  failures.push({ fixture, path, expected, actual });
}

function main(): void {
  console.log(`check-rate parity: ${FIXTURE_DIR}`);
  console.log(`registered evaluators: [${registeredGames().join(", ")}]`);

  const fixtures = readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith(".expected.json"))
    .map((f) => basename(f, ".expected.json"));

  if (fixtures.length === 0) {
    console.error("No golden fixtures found.");
    process.exit(1);
  }

  const failures: Failure[] = [];
  for (const f of fixtures) {
    console.log(`\nfixture: ${f}`);
    verifyFixture(f, failures);
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} parity failure(s).`);
    process.exit(1);
  }
  console.log("\nAll parity checks passed.");
}

main();

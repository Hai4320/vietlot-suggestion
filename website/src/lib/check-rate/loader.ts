// Runtime loader for product history JSON. Called from the browser.
// Expected shape: { meta: {...}, draws: Draw[] } per build_data.py output.

import type { Draw } from "./types";

const GAME_TO_FILE: Record<string, string> = {
  power_535: "/data/power535.json",
  power_645: "/data/power645.json",
  power_655: "/data/power655.json",
  "3d": "/data/max3d.json",
  "3d_pro": "/data/max3d_pro.json",
};

interface DrawEnvelope {
  meta?: unknown;
  draws: Draw[];
}

export async function loadDraws(game: string): Promise<Draw[]> {
  const url = GAME_TO_FILE[game];
  if (!url) throw new Error(`No data file mapped for game=${game}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const payload = (await res.json()) as DrawEnvelope;
  if (!Array.isArray(payload.draws)) {
    throw new Error(`Unexpected schema at ${url}: missing draws[]`);
  }
  // Ensure oldest → newest for deterministic match dist; website JSON is DESC
  return [...payload.draws].reverse();
}

export function supportedGames(): string[] {
  return Object.keys(GAME_TO_FILE);
}

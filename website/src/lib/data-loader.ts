import type { MatrixProductData, ThreeDProductData } from "./types";

const cache = new Map<string, unknown>();

export async function loadMatrixData(dataFile: string): Promise<MatrixProductData> {
  if (cache.has(dataFile)) return cache.get(dataFile) as MatrixProductData;
  const res = await fetch(`/data/${dataFile}`);
  const data: MatrixProductData = await res.json();
  cache.set(dataFile, data);
  return data;
}

export async function loadThreeDData(dataFile: string): Promise<ThreeDProductData> {
  if (cache.has(dataFile)) return cache.get(dataFile) as ThreeDProductData;
  const res = await fetch(`/data/${dataFile}`);
  const data: ThreeDProductData = await res.json();
  cache.set(dataFile, data);
  return data;
}

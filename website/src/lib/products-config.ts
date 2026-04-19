import type { ProductInfo } from "./types";

export const PRODUCTS: ProductInfo[] = [
  {
    key: "power_655",
    name: "Power 6/55",
    nameVi: "Power 6/55",
    slug: "power-655",
    emoji: "🔴",
    description: "Choose 6 numbers from 1-55. Jackpot 1 (≥30B) + Jackpot 2 (≥3B)",
    descriptionVi: "Chọn 6 số từ 01-55. Jackpot 1 (≥30 tỷ) + Jackpot 2 (≥3 tỷ)",
    group: "matrix",
    minNumber: 1,
    maxNumber: 55,
    mainCount: 6,
    hasSpecial: true,
    dataFile: "power655.json",
    color: "hsl(0, 72%, 51%)",
  },
  {
    key: "power_645",
    name: "Mega 6/45",
    nameVi: "Mega 6/45",
    slug: "power-645",
    emoji: "🔵",
    description: "Choose 6 numbers from 1-45. Jackpot starts at 12 billion VND",
    descriptionVi: "Chọn 6 số từ 01-45. Jackpot khởi điểm 12 tỷ đồng",
    group: "matrix",
    minNumber: 1,
    maxNumber: 45,
    mainCount: 6,
    hasSpecial: false,
    dataFile: "power645.json",
    color: "hsl(217, 91%, 60%)",
  },
  {
    key: "power_535",
    name: "Lotto 5/35",
    nameVi: "Lotto 5/35",
    slug: "power-535",
    emoji: "🟢",
    description: "Choose 5 numbers from 1-35 + 1 special (1-12). Jackpot from 6B VND",
    descriptionVi: "Chọn 5 số từ 01-35 + 1 số đặc biệt (01-12). Jackpot từ 6 tỷ",
    group: "matrix",
    minNumber: 1,
    maxNumber: 35,
    mainCount: 5,
    hasSpecial: true,
    dataFile: "power535.json",
    color: "hsl(142, 71%, 45%)",
  },
  {
    key: "3d",
    name: "Max 3D",
    nameVi: "Max 3D",
    slug: "max-3d",
    emoji: "🟣",
    description: "Pick 3-digit numbers (000-999). Multiple prize tiers",
    descriptionVi: "Chọn bộ 3 số (000-999). Nhiều hạng giải thưởng",
    group: "3d",
    minNumber: 0,
    maxNumber: 999,
    mainCount: 3,
    hasSpecial: false,
    dataFile: "max3d.json",
    color: "hsl(271, 91%, 65%)",
  },
  {
    key: "3d_pro",
    name: "Max 3D Pro",
    nameVi: "Max 3D Pro",
    slug: "max-3d-pro",
    emoji: "🟠",
    description: "Pick 2 sets of 3-digit numbers. Match forward and reverse order",
    descriptionVi: "Chọn 2 bộ 3 số, dò cả đúng và ngược thứ tự. Giải ĐB tới 2 tỷ",
    group: "3d",
    minNumber: 0,
    maxNumber: 999,
    mainCount: 3,
    hasSpecial: false,
    dataFile: "max3d_pro.json",
    color: "hsl(25, 95%, 53%)",
  },
];

export const MATRIX_PRODUCTS = PRODUCTS.filter((p) => p.group === "matrix");
export const THREE_D_PRODUCTS = PRODUCTS.filter((p) => p.group === "3d");

export function getProduct(slug: string): ProductInfo | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductByKey(key: string): ProductInfo | undefined {
  return PRODUCTS.find((p) => p.key === key);
}

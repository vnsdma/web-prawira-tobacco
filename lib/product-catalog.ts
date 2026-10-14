/**
 * Prawira Tobacco Product Catalog Helper
 * Handles:
 * 1. Similarity Grades (Tingkat Kemiripan)
 * 2. Product Variants (25gr, 50gr, 100gr, 100gr Mix) with Shipping Weight Buffers
 * 3. Taste Categories (Kretek, Mild, Dingin/Ice, Aksesoris)
 * 4. Quick Add-On Accessories for Product Detail
 */

export type SimilarityGradeType = "premium" | "harian" | "ekonomis"

export interface SimilarityGrade {
  type: SimilarityGradeType
  label: string
  percentage: string
  fullBadge: string
  description: string
  bgClass: string
  textClass: string
  borderClass: string
  accentColor: string
}

export interface ProductVariant {
  id: string              // e.g. "25g", "50g", "100g", "100g-mix"
  name: string            // e.g. "25gr - Tester"
  label: string           // e.g. "Tester"
  weightGrams: number     // actual tobacco net weight
  bufferWeightGrams: number // weight in system including packaging/box
  priceMultiplier: number // relative to base 100gr price
  isDefault?: boolean
  isPopular?: boolean
  popularBadge?: string
  description?: string
}

export interface QuickAddonItem {
  id: string
  name: string
  category: "papir" | "busa" | "lem"
  options: {
    id: string
    productId?: number
    label: string
    price: number
    weightGrams: number
  }[]
}

/* ─── 1. SIMILARITY GRADES ─────────────────────────────────────── */
export function getSimilarityGrade(product: {
  name: string
  category: string
}): SimilarityGrade | null {
  if (product.category === "accessories") return null

  const name = product.name.toLowerCase()

  // 1. Grade Premium (70% Mirip) -> Surya Premium, Mild Prem (Sampurna Premium), Magnum Premium
  // Status: Stok Terbatas / Rilis Berkala
  if (
    name.includes("premium") ||
    name.includes("sampurna") ||
    name.includes("magnum") ||
    (name.includes("surya") && name.includes("prem"))
  ) {
    return {
      type: "premium",
      label: "Grade Premium (Stok Terbatas)",
      percentage: "70% Mirip",
      fullBadge: "Grade Premium (Edisi Terbatas)",
      description: "Racikan edisi khusus 70% mirip rokok pabrikan. Kuota sangat terbatas sesuai jadwal rilis berkala agen.",
      bgClass: "bg-amber-500/15 dark:bg-amber-500/20",
      textClass: "text-amber-700 dark:text-amber-400",
      borderClass: "border-amber-500/30",
      accentColor: "#d97706",
    }
  }

  // 2. Grade Ekonomis (40-50% Mirip) -> Purple Ice Burst (Permata Putih), Ekonomis
  if (
    name.includes("purple") ||
    name.includes("ice burst") ||
    name.includes("permata") ||
    name.includes("ekonomis")
  ) {
    return {
      type: "ekonomis",
      label: "Grade Ekonomis",
      percentage: "40-50% Mirip",
      fullBadge: "Grade Ekonomis (40-50% Mirip)",
      description: "Pilihan paling hemat dengan sentuhan sensasi dingin fruity yang menyegarkan.",
      bgClass: "bg-purple-500/15 dark:bg-purple-500/20",
      textClass: "text-purple-700 dark:text-purple-400",
      borderClass: "border-purple-500/30",
      accentColor: "#9333ea",
    }
  }

  // 3. Grade Harian (60% Mirip - Seri Linting Bintang Utama) -> Surya Linting, Mild Linting, Samsu Linting, Marlong, GGF
  return {
    type: "harian",
    label: "Pilihan Harian Terbaik",
    percentage: "60% Mirip",
    fullBadge: "Pilihan Harian Terbaik - Stok Selalu Ready",
    description: "Seri Linting (Kemiripan 60%): Racikan paling pas untuk stok harian, rasa mantap di tenggorokan dengan harga jauh lebih hemat.",
    bgClass: "bg-emerald-500/15 dark:bg-emerald-500/20",
    textClass: "text-emerald-700 dark:text-emerald-400",
    borderClass: "border-emerald-500/30",
    accentColor: "#059669",
  }
}

/* ─── 2. PRODUCT VARIANTS WITH PACKAGING WEIGHT BUFFERS ────────── */
/**
 * Shipping Buffer weights:
 * - 25gr tester  -> 35 gram
 * - 50gr harian  -> 65 gram
 * - 100gr hemat  -> 120 gram (Terlaris)
 * - 200gr paket bulanan -> 235 gram
 */
export function getProductVariants(baseProduct: {
  id: number
  name: string
  price: number
  half_unit_price?: number | null
  category: string
}): ProductVariant[] {
  if (baseProduct.category === "accessories") {
    return []
  }

  const base100gPrice = baseProduct.price || 23000
  const custom50gPrice = baseProduct.half_unit_price || Math.round((base100gPrice * 0.55) / 500) * 500

  // 25gr Tester price: approx 35% of 100g price rounded to nearest 500
  const price25g = Math.max(7000, Math.round((base100gPrice * 0.35) / 500) * 500)

  // 200gr Paket Hemat Bulanan price: 2x 100g minus volume discount (hemat Rp 1.000)
  const price200g = Math.round((base100gPrice * 1.95) / 1000) * 1000

  return [
    {
      id: "25g",
      name: "25gr - Tester Ziplock",
      label: "Tester Ziplock",
      weightGrams: 25,
      bufferWeightGrams: 35,
      priceMultiplier: price25g / base100gPrice,
      isDefault: false,
      description: "Kemasan pouch ziplock kedap udara. Porsi pas buat coba rasa baru.",
    },
    {
      id: "50g",
      name: "50gr - Harian (Kemasan Refill)",
      label: "Harian (Refill)",
      weightGrams: 50,
      bufferWeightGrams: 65,
      priceMultiplier: custom50gPrice / base100gPrice,
      isDefault: true,
      description: "Kemasan plastik refill kedap udara. Pas untuk stok linting 3-5 hari.",
    },
    {
      id: "100g",
      name: "100gr - Hemat (Kemasan Refill)",
      label: "Hemat (Refill)",
      weightGrams: 100,
      bufferWeightGrams: 120,
      priceMultiplier: 1.0,
      isPopular: true,
      popularBadge: "Terlaris",
      description: "Kemasan plastik refill hemat untuk konsumsi santai 1-2 minggu.",
    },
    {
      id: "200g",
      name: "200gr - Paket Bulanan (Kemasan Refill)",
      label: "Bulanan (Refill)",
      weightGrams: 200,
      bufferWeightGrams: 235,
      priceMultiplier: price200g / base100gPrice,
      popularBadge: "Paket Bulanan",
      description: "Kemasan plastik refill hemat sebulan penuh, harga paling ekonomis dan hemat ongkir.",
    },
  ]
}

/* Calculate variant exact price */
export function calculateVariantPrice(
  basePrice: number,
  variant: ProductVariant,
  halfUnitPrice?: number | null
): number {
  if (variant.id === "100g") return basePrice
  if (variant.id === "50g" && halfUnitPrice) return halfUnitPrice
  if (variant.id === "200g") return Math.round((basePrice * 1.95) / 1000) * 1000
  return Math.round((basePrice * variant.priceMultiplier) / 500) * 500
}

/* ─── 3. TASTE PROFILES FOR HOMEPAGE FAST FILTER ───────────────── */
export type TasteCategoryFilter =
  | "all"
  | "kretek"
  | "mild"
  | "ice"
  | "accessories"

export interface TasteFilterOption {
  id: TasteCategoryFilter
  label: string
  shortLabel: string
  badgeNote: string
  color: string
}

export const TASTE_FILTERS: TasteFilterOption[] = [
  {
    id: "all",
    label: "Semua Produk",
    shortLabel: "Semua",
    badgeNote: "Katalog Lengkap",
    color: "#d97706",
  },
  {
    id: "kretek",
    label: "Kretek Manis & Mantap",
    shortLabel: "Kretek Mantap",
    badgeNote: "Surya, Samsu, Marlong",
    color: "#b45309",
  },
  {
    id: "mild",
    label: "Tarikan Halus / Mild",
    shortLabel: "Halus Mild",
    badgeNote: "Mild Prem, Sampurna",
    color: "#059669",
  },
  {
    id: "ice",
    label: "Sensasi Dingin / Mint Berry",
    shortLabel: "Dingin Ice",
    badgeNote: "Purple Burst, Ice",
    color: "#0284c7",
  },
  {
    id: "accessories",
    label: "Kertas Papir & Busa Filter",
    shortLabel: "Pelengkap Tingwe",
    badgeNote: "Papir, Busa, Lem",
    color: "#78350f",
  },
]

export function matchesTasteCategory(
  product: { name: string; category: string },
  tasteCategory: TasteCategoryFilter
): boolean {
  if (tasteCategory === "all") return true

  const name = product.name.toLowerCase()
  const isAccessory = product.category === "accessories"

  if (tasteCategory === "accessories") {
    return isAccessory || name.includes("papir") || name.includes("busa") || name.includes("lem") || name.includes("cengkeh")
  }

  // If searching for tobacco taste, exclude accessories
  if (isAccessory) return false

  if (tasteCategory === "kretek") {
    return (
      name.includes("surya") ||
      name.includes("samsu") ||
      name.includes("marlong") ||
      name.includes("ggf") ||
      name.includes("magnum") ||
      name.includes("bayote")
    )
  }

  if (tasteCategory === "mild") {
    return (
      name.includes("mild") ||
      name.includes("sampurna") ||
      name.includes("melisa")
    )
  }

  if (tasteCategory === "ice") {
    return (
      name.includes("ice") ||
      name.includes("burst") ||
      name.includes("purple") ||
      name.includes("melon") ||
      name.includes("menthol") ||
      name.includes("dingin")
    )
  }

  return true
}

/* ─── 4. QUICK ADD-ON ACCESSORIES CONFIG ───────────────────────── */
export const QUICK_ADDONS: QuickAddonItem[] = [
  {
    id: "addon-papir",
    name: "Sekalian Papir",
    category: "papir",
    options: [
      {
        id: "papir-1pak",
        productId: 48,
        label: "1 Pak (Standar)",
        price: 2000,
        weightGrams: 15,
      },
      {
        id: "papir-5pak",
        productId: 50,
        label: "Paket Hemat 5 Pak",
        price: 8000,
        weightGrams: 45,
      },
    ],
  },
  {
    id: "addon-busa",
    name: "Sekalian Busa Filter",
    category: "busa",
    options: [
      {
        id: "busa-kecil",
        productId: 46,
        label: "Bungkus Kecil (50 pcs)",
        price: 5000,
        weightGrams: 25,
      },
      {
        id: "busa-besar",
        productId: 45,
        label: "Kantong Besar (100 pcs)",
        price: 10000,
        weightGrams: 60,
      },
    ],
  },
  {
    id: "addon-lem",
    name: "Sekalian Lem Kertas",
    category: "lem",
    options: [
      {
        id: "lem-standar",
        productId: 49,
        label: "1 Botol Lem Kertas",
        price: 3000,
        weightGrams: 20,
      },
    ],
  },
]

export interface TobaccoProfile {
  throatHit: "Halus (Mild)" | "Sedang" | "Mantap (Kretek)"
  throatHitScore: number // 1 to 5
  aroma: string
  aromaScore: number // 1 to 5
  cooling: "Non-Ice" | "Dingin Segar" | "Extra Ice"
  coolingScore: number // 0 to 5
  notes: string[]
  badgeTag?: string
  flavorColor: string
}

export function getTobaccoProfile(product: {
  name: string
  category: string
  description?: string | null
}): TobaccoProfile | null {
  if (product.category === "accessories") {
    return null
  }

  const nameLower = product.name.toLowerCase()

  // 1. Barrack Whiskey Ice
  if (nameLower.includes("whiskey ice") || (nameLower.includes("whiskey") && nameLower.includes("ice"))) {
    return {
      throatHit: "Halus (Mild)",
      throatHitScore: 2,
      aroma: "Whiskey Oak & Mint",
      aromaScore: 5,
      cooling: "Dingin Segar",
      coolingScore: 3,
      notes: ["Whiskey Oak", "Dingin Segar", "Aromatik"],
      badgeTag: "Whiskey & Dingin",
      flavorColor: "#d97706",
    }
  }

  // 2. Barrack Whiskey Original
  if (nameLower.includes("whiskey")) {
    return {
      throatHit: "Sedang",
      throatHitScore: 3,
      aroma: "Aromatik Bourbon Whiskey",
      aromaScore: 5,
      cooling: "Non-Ice",
      coolingScore: 0,
      notes: ["Oak Smokey", "Caramel Hint", "Hangat"],
      badgeTag: "Aroma Whiskey",
      flavorColor: "#b45309",
    }
  }

  // 3. Barrack Soju
  if (nameLower.includes("soju")) {
    return {
      throatHit: "Halus (Mild)",
      throatHitScore: 2,
      aroma: "Soju Korea & Fruity",
      aromaScore: 4,
      cooling: "Dingin Segar",
      coolingScore: 2,
      notes: ["Fruity Segar", "Manis Lembut", "Tingwe Modern"],
      badgeTag: "Soju Fruity",
      flavorColor: "#059669",
    }
  }

  // 4. Barrack Melisa
  if (nameLower.includes("melisa")) {
    return {
      throatHit: "Sedang",
      throatHitScore: 3,
      aroma: "Floral & Madu Alami",
      aromaScore: 4,
      cooling: "Non-Ice",
      coolingScore: 0,
      notes: ["Manis Madu", "Herbal Segar", "Lembut"],
      badgeTag: "Madu & Floral",
      flavorColor: "#eab308",
    }
  }

  // 5. Amphora
  if (nameLower.includes("amphora")) {
    return {
      throatHit: "Sedang",
      throatHitScore: 3,
      aroma: "Cavendish Klasik",
      aromaScore: 5,
      cooling: "Non-Ice",
      coolingScore: 0,
      notes: ["Cokelat Hint", "Gurih Mantap", "Premium Import"],
      badgeTag: "Pipa Cavendish",
      flavorColor: "#78350f",
    }
  }

  // 6. Generic Ice / Menthol
  if (nameLower.includes("ice") || nameLower.includes("menthol") || nameLower.includes("cool")) {
    return {
      throatHit: "Halus (Mild)",
      throatHitScore: 2,
      aroma: "Mint Menthol Segar",
      aromaScore: 4,
      cooling: "Extra Ice",
      coolingScore: 5,
      notes: ["Sensasi Es", "Tenggorokan Segar", "Bersih"],
      badgeTag: "Extra Dingin",
      flavorColor: "#0284c7",
    }
  }

  // 7. Cigarettes - Mild
  if (nameLower.includes("mild")) {
    return {
      throatHit: "Halus (Mild)",
      throatHitScore: 2,
      aroma: "Cengkeh Halus & Manis",
      aromaScore: 3,
      cooling: "Non-Ice",
      coolingScore: 0,
      notes: ["Tarikan Ringan", "Cengkeh Lembut"],
      badgeTag: "Tarikan Halus",
      flavorColor: "#64748b",
    }
  }

  // 8. Cigarettes - Bold / Super / Kretek
  if (nameLower.includes("super") || nameLower.includes("bold") || nameLower.includes("kretek") || nameLower.includes("djarum")) {
    return {
      throatHit: "Mantap (Kretek)",
      throatHitScore: 4,
      aroma: "Rempah & Cengkeh Gurih",
      aromaScore: 4,
      cooling: "Non-Ice",
      coolingScore: 0,
      notes: ["Kretek Mantap", "Gurih Kuat", "Aroma Tebal"],
      badgeTag: "Kretek Mantap",
      flavorColor: "#991b1b",
    }
  }

  // 9. Default Fallback for Artisan Tobacco
  return {
    throatHit: "Sedang",
    throatHitScore: 3,
    aroma: "Tembakau Asli Nusantara",
    aromaScore: 4,
    cooling: "Non-Ice",
    coolingScore: 0,
    notes: ["Gurih Alami", "Rajangan Halus", "Khas Nusantara"],
    badgeTag: "Nusantara Asli",
    flavorColor: "#a85a22",
  }
}

"use client"

import { Layers, Flame, Leaf, Sparkles, Package, Compass } from "lucide-react"

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

const TASTE_CATEGORIES = [
  {
    id: "all",
    label: "Semua Produk",
    badge: "Koleksi Lengkap",
    icon: Layers,
  },
  {
    id: "kretek",
    label: "Kretek Manis & Mantap",
    badge: "Surya, Samsu, Marlong",
    icon: Flame,
  },
  {
    id: "mild",
    label: "Tarikan Halus / Mild",
    badge: "Mild Prem, Sampurna",
    icon: Leaf,
  },
  {
    id: "ice",
    label: "Sensasi Dingin / Mint Berry",
    badge: "Purple Ice Burst",
    icon: Sparkles,
  },
  {
    id: "accessories",
    label: "Kertas Papir & Busa Filter",
    badge: "Aksesoris Lengkap",
    icon: Package,
  },
]

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-1.5 px-4 md:px-7 text-xs font-bold text-text-secondary uppercase tracking-wider font-display">
        <Compass size={14} className="text-accent" />
        <span>Cari Berdasarkan Selera:</span>
      </div>

      <div className="h-scroll pb-1">
        {TASTE_CATEGORIES.map(({ id, label, badge, icon: Icon }) => {
          const isActive = selectedCategory === id
          return (
            <button
              key={id}
              type="button"
              className={`pill flex items-center gap-2 transition-all ${
                isActive
                  ? "active bg-accent text-accent-text font-bold shadow-sm"
                  : "hover:border-accent/40"
              }`}
              onClick={() => onCategoryChange(id)}
              aria-pressed={isActive}
            >
              <Icon
                size={14}
                className={isActive ? "text-accent-text" : "text-text-muted"}
              />
              <div className="flex flex-col text-left">
                <span className="text-xs leading-tight">{label}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

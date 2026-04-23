"use client"

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

const CATEGORIES = [
  { id: "all",         label: "Semua" },
  { id: "cigarettes",  label: "Rokok" },
  { id: "tobacco",     label: "Tembakau" },
  { id: "accessories", label: "Aksesoris" },
]

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="h-scroll mt-3 pb-1">
      {CATEGORIES.map(({ id, label }) => (
        <button
          key={id}
          className={`pill ${selectedCategory === id ? "active" : ""}`}
          onClick={() => onCategoryChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

const categories = [
  { id: "all", name: "Semua", icon: "🏪" },
  { id: "cigarettes", name: "Rokok", icon: "🚬" },
  { id: "tobacco", name: "Tembakau", icon: "🌿" },
  { id: "accessories", name: "Aksesoris", icon: "🔧" },
]

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="px-4 py-2 border-b">
      <ScrollArea className="w-full">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className="whitespace-nowrap"
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
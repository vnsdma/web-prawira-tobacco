"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

/* ─── Types ──────────────────────────────────────────────────── */
export interface CartItem {
  id:        string
  productId?: number
  name:      string
  price:     number
  image:     string
  quantity:  number
  weight?:   number
  variant?:  string
}

export interface LastAddedItem {
  id:        string
  name:      string
  timestamp: number
}

interface CartContextType {
  items:            CartItem[]
  addItem:          (item: Omit<CartItem, "quantity">) => void
  addMultipleItems: (items: Omit<CartItem, "quantity">[]) => void
  removeItem:       (id: string) => void
  updateQuantity:   (id: string, quantity: number) => void
  clearCart:        () => void
  getTotalItems:    () => number
  getTotalPrice:    () => number
  getTotalWeight:   () => number
  isOpen:           boolean
  setIsOpen:        (open: boolean) => void
  lastAdded:        LastAddedItem | null
}

/* ─── Context ────────────────────────────────────────────────── */
const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = "prawira_cart"

/* ─── Provider ───────────────────────────────────────────────── */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]         = useState<CartItem[]>([])
  const [isOpen, setIsOpen]       = useState(false)
  const [hydrated, setHydrated]   = useState(false)
  const [lastAdded, setLastAdded] = useState<LastAddedItem | null>(null)

  /* Load from localStorage once on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {
      // corrupted storage — start fresh
      localStorage.removeItem(STORAGE_KEY)
    }
    setHydrated(true)
  }, [])

  /* Persist on every change (skip before hydration to avoid overwrite) */
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // storage full or unavailable — silently ignore
    }
  }, [items, hydrated])

  /* ── Actions ── */
  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setLastAdded({ id: newItem.id, name: newItem.name, timestamp: Date.now() })
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id)
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...newItem, quantity: 1, weight: newItem.weight || 65 }]
    })
  }, [])

  const addMultipleItems = useCallback((newItems: Omit<CartItem, "quantity">[]) => {
    if (!newItems.length) return
    const first = newItems[0]
    setLastAdded({ id: first.id, name: `${first.name} + ${newItems.length - 1} item`, timestamp: Date.now() })

    setItems((prev) => {
      let updated = [...prev]
      for (const newItem of newItems) {
        const existingIdx = updated.findIndex((i) => i.id === newItem.id)
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + 1,
          }
        } else {
          updated.push({ ...newItem, quantity: 1, weight: newItem.weight || 65 })
        }
      }
      return updated
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const getTotalItems = useCallback(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  const getTotalPrice = useCallback(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  )

  const getTotalWeight = useCallback(
    () => items.reduce((sum, i) => sum + i.quantity * (i.weight || 65), 0),
    [items]
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addMultipleItems,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getTotalWeight,
        isOpen,
        setIsOpen,
        lastAdded,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

/* ─── Hook ───────────────────────────────────────────────────── */
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}

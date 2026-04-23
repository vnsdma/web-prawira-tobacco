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
  id:       string
  name:     string
  price:    number
  image:    string
  quantity: number
}

interface CartContextType {
  items:          CartItem[]
  addItem:        (item: Omit<CartItem, "quantity">) => void
  removeItem:     (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart:      () => void
  getTotalItems:  () => number
  getTotalPrice:  () => number
  isOpen:         boolean
  setIsOpen:      (open: boolean) => void
}

/* ─── Context ────────────────────────────────────────────────── */
const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = "prawira_cart"

/* ─── Provider ───────────────────────────────────────────────── */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]     = useState<CartItem[]>([])
  const [isOpen, setIsOpen]   = useState(false)
  const [hydrated, setHydrated] = useState(false)

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
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id)
      if (existing) {
        return prev.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...newItem, quantity: 1 }]
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

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isOpen,
        setIsOpen,
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

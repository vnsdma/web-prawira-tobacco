"use client"

import type { ReactNode } from "react"
import { useCart } from "@/hooks/use-cart"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react"
import { useState } from "react"
import CheckoutDialog from "./checkout-dialog"

interface CartSheetProps {
  children: ReactNode
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style:                 "currency",
    currency:              "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

export default function CartSheet({ children }: CartSheetProps) {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [sheetOpen, setSheetOpen]       = useState(false)

  const handleCheckout = () => {
    setSheetOpen(false)
    setTimeout(() => setShowCheckout(true), 300)
  }

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>{children}</SheetTrigger>

        <SheetContent
          side="right"
          style={{
            width:      "100%",
            maxWidth:   "420px",
            background: "var(--bg)",
            border:     "none",
            borderLeft: "1px solid var(--border)",
            padding:    0,
            display:    "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <SheetHeader
            style={{
              padding:      "20px 20px 16px",
              borderBottom: "1px solid var(--border)",
              flexShrink:   0,
            }}
          >
            <SheetTitle
              style={{
                fontFamily: "var(--font-display)",
                fontSize:   "16px",
                fontWeight: 700,
                color:      "var(--text-primary)",
                display:    "flex",
                alignItems: "center",
                gap:        "10px",
              }}
            >
              <ShoppingCart size={18} style={{ color: "var(--accent)" }} />
              Keranjang
              {getTotalItems() > 0 && (
                <span
                  className="badge badge-accent"
                  style={{ fontSize: "10px", padding: "2px 8px" }}
                >
                  {getTotalItems()} item
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {/* Items */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
            {items.length === 0 ? (
              <div className="empty-state" style={{ paddingTop: "80px" }}>
                <ShoppingCart size={40} style={{ color: "var(--text-muted)", opacity: 0.3 }} />
                <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Keranjang masih kosong
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Tambahkan produk untuk mulai belanja
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display:      "flex",
                      gap:          "12px",
                      padding:      "12px",
                      borderRadius: "var(--r-lg)",
                      background:   "var(--bg-card)",
                      border:       "1px solid var(--border)",
                      alignItems:   "center",
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        width:        "56px",
                        height:       "56px",
                        borderRadius: "var(--r-md)",
                        background:   "var(--bg-raised)",
                        flexShrink:   0,
                        overflow:     "hidden",
                        display:      "flex",
                        alignItems:   "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <span style={{ fontSize: "22px", opacity: 0.25 }}>🌿</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily:   "var(--font-display)",
                          fontSize:     "13px",
                          fontWeight:   600,
                          color:        "var(--text-primary)",
                          marginBottom: "2px",
                          overflow:     "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace:   "nowrap",
                        }}
                      >
                        {item.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize:   "13px",
                          fontWeight: 600,
                          color:      "var(--accent)",
                          marginBottom: "8px",
                        }}
                      >
                        {formatPrice(item.price)}
                      </p>

                      {/* Qty controls */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            width:          "24px",
                            height:         "24px",
                            borderRadius:   "6px",
                            border:         "1px solid var(--border-strong)",
                            background:     "var(--bg-raised)",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            cursor:         "pointer",
                            color:          "var(--text-secondary)",
                          }}
                        >
                          <Minus size={10} strokeWidth={2.5} />
                        </button>

                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize:   "13px",
                            fontWeight: 600,
                            color:      "var(--text-primary)",
                            minWidth:   "20px",
                            textAlign:  "center",
                          }}
                        >
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{
                            width:          "24px",
                            height:         "24px",
                            borderRadius:   "6px",
                            background:     "var(--accent)",
                            border:         "none",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            cursor:         "pointer",
                            color:          "var(--accent-text)",
                          }}
                        >
                          <Plus size={10} strokeWidth={2.5} />
                        </button>

                        <button
                          onClick={() => removeItem(item.id)}
                          style={{
                            marginLeft:     "auto",
                            width:          "24px",
                            height:         "24px",
                            borderRadius:   "6px",
                            border:         "1px solid var(--border-strong)",
                            background:     "transparent",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            cursor:         "pointer",
                            color:          "var(--text-muted)",
                          }}
                        >
                          <Trash2 size={10} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div
              style={{
                padding:       "16px 20px",
                borderTop:     "1px solid var(--border)",
                flexShrink:    0,
                background:    "var(--bg)",
              }}
            >
              {/* Subtotal */}
              <div
                style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  alignItems:     "center",
                  marginBottom:   "14px",
                }}
              >
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Total ({getTotalItems()} item)
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize:   "16px",
                    fontWeight: 700,
                    color:      "var(--accent)",
                  }}
                >
                  {formatPrice(getTotalPrice())}
                </span>
              </div>

              {/* Checkout button */}
              <button
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "12px" }}
                onClick={handleCheckout}
              >
                Lanjut ke Checkout
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout dialog — opened after sheet closes */}
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={setShowCheckout}
        items={items}
        total={getTotalPrice()}
      />
    </>
  )
}

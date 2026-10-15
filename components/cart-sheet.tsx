"use client"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { useCart } from "@/hooks/use-cart"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck, PackageCheck, Scale } from "lucide-react"
import CheckoutDialog from "./checkout-dialog"

interface CartSheetProps {
  children?: ReactNode
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

const FREE_SHIPPING_THRESHOLD = 100_000

export default function CartSheet({ children }: CartSheetProps) {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems, getTotalWeight, addItem } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [sheetOpen, setSheetOpen]       = useState(false)
  const [mounted, setMounted]           = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const totalItems = mounted ? getTotalItems() : 0

  const subtotal = getTotalPrice()
  const totalWeight = getTotalWeight()
  const weightQuota = 1000 // 1 kg
  const weightProgress = Math.min(100, Math.round((totalWeight / weightQuota) * 100))
  const remainingWeightGrams = Math.max(0, weightQuota - totalWeight)

  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  const handleCheckout = () => {
    setSheetOpen(false)
    setTimeout(() => setShowCheckout(true), 250)
  }

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          {children ?? (
            <button className="icon-btn" aria-label="Keranjang Belanja">
              <ShoppingBag size={16} />
              {totalItems > 0 && (
                <span className="notif-dot">{totalItems}</span>
              )}
            </button>
          )}
        </SheetTrigger>

        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-background border-l border-border p-0 flex flex-col h-full shadow-2xl"
        >
          {/* Header */}
          <SheetHeader className="p-5 border-b border-border bg-card/60 flex-shrink-0">
            <SheetTitle className="font-display text-base font-bold text-text-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-accent" />
                <span>Keranjang Belanja</span>
              </div>
              {getTotalItems() > 0 && (
                <span className="badge badge-soft text-xs px-2.5 py-0.5 rounded-full">
                  {getTotalItems()} item
                </span>
              )}
            </SheetTitle>

            {/* Free Shipping Progress */}
            {items.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-raised border border-border/80">
                <div className="flex items-center gap-2 text-xs font-medium mb-1.5">
                  <Truck size={14} className={freeShippingProgress >= 100 ? "text-success" : "text-accent"} />
                  {freeShippingProgress >= 100 ? (
                    <span className="text-success font-semibold">Selamat! Anda mendapatkan Bebas Ongkir</span>
                  ) : (
                    <span className="text-text-secondary">
                      Tambah <strong className="text-text-primary">{formatPrice(remainingForFreeShipping)}</strong> untuk Bebas Ongkir
                    </span>
                  )}
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      freeShippingProgress >= 100 ? "bg-success" : "bg-accent"
                    }`}
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Indikator Sisa Kuota Ongkir 1 Kg (Shipping Weight Progress Bar) */}
            {items.length > 0 && (
              <div className="mt-2.5 p-3 rounded-xl bg-accent/5 border border-accent/20">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <div className="flex items-center gap-1.5 text-accent">
                    <Scale size={14} />
                    <span>Sisa Kuota Ongkir 1 Kg</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-text-primary">
                    {totalWeight}g / 1.000g
                  </span>
                </div>

                <div className="w-full h-1.5 bg-border/60 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      totalWeight > 1000 ? "bg-amber-500" : "bg-accent"
                    }`}
                    style={{ width: `${weightProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {remainingWeightGrams > 0 ? (
                    <>
                      Berat keranjang Anda saat ini: <strong className="text-text-primary">{totalWeight} gram</strong>. Anda masih bisa menambah hingga <strong className="text-accent">{remainingWeightGrams} gram</strong> lagi dengan ongkos kirim yang sama!
                    </>
                  ) : (
                    <>
                      Berat keranjang Anda saat ini: <strong className="text-amber-500">{totalWeight} gram</strong>. Kapasitas 1 kg terlampaui (masuk batas tier tarif ongkir berikutnya).
                    </>
                  )}
                </p>

                {/* Quick Add Aksesoris Sekalian Hemat Ongkir */}
                {remainingWeightGrams >= 15 && (
                  <div className="mt-2 pt-2 border-t border-accent/15 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-text-muted">Isi sisa kuota:</span>
                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          id: "addon-papir-1pak",
                          productId: 48,
                          name: "Kertas Papir Premium (1 Pak)",
                          price: 2000,
                          image: "/images/accessories.png",
                          weight: 15,
                          variant: "1 Pak",
                        })
                      }
                      className="text-[10px] px-2 py-0.5 rounded-full bg-card hover:bg-raised border border-border text-text-primary transition-colors flex items-center gap-1 font-medium"
                    >
                      <Plus size={10} className="text-accent" /> Papir (+15g)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          id: "addon-busa-kecil",
                          productId: 46,
                          name: "Busa Filter Regular (Bungkus Kecil)",
                          price: 5000,
                          image: "/images/accessories.png",
                          weight: 25,
                          variant: "Bungkus Kecil",
                        })
                      }
                      className="text-[10px] px-2 py-0.5 rounded-full bg-card hover:bg-raised border border-border text-text-primary transition-colors flex items-center gap-1 font-medium"
                    >
                      <Plus size={10} className="text-accent" /> Busa (+25g)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          id: "addon-lem-standar",
                          productId: 49,
                          name: "Lem Kertas Tingwe",
                          price: 3000,
                          image: "/images/accessories.png",
                          weight: 20,
                          variant: "1 Botol",
                        })
                      }
                      className="text-[10px] px-2 py-0.5 rounded-full bg-card hover:bg-raised border border-border text-text-primary transition-colors flex items-center gap-1 font-medium"
                    >
                      <Plus size={10} className="text-accent" /> Lem (+20g)
                    </button>
                  </div>
                )}
              </div>
            )}
          </SheetHeader>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-raised flex items-center justify-center text-text-muted mb-4">
                  <ShoppingBag size={30} className="opacity-40" />
                </div>
                <h3 className="font-display font-semibold text-base text-text-primary mb-1">
                  Keranjang Masih Kosong
                </h3>
                <p className="text-xs text-text-muted max-w-xs mb-4">
                  Temukan koleksi tembakau kurasi pilihan kami dan tambahkan ke sini.
                </p>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="px-4 py-2 rounded-lg bg-accent text-accent-text text-xs font-semibold hover:bg-accent-hover transition-colors"
                >
                  Mulai Belanja
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-xl bg-card border border-border hover:border-accent/30 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-raised border border-border/60 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PackageCheck size={20} className="text-text-muted opacity-50" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display font-semibold text-xs text-text-primary truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {item.variant && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-raised text-accent font-medium">
                              {item.variant}
                            </span>
                          )}
                          <span className="text-[10px] text-text-muted">
                            {(item.weight || 65) * item.quantity}g
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-text-muted hover:text-destructive p-1 -mt-1 -mr-1 transition-colors"
                        aria-label={`Hapus ${item.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="font-sans font-bold text-xs text-accent tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-raised p-0.5 rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-text-secondary hover:bg-card transition-colors disabled:opacity-30"
                          disabled={item.quantity <= 1}
                          aria-label="Kurangi jumlah"
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className="w-6 text-center font-sans font-bold text-xs text-text-primary tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-text-secondary hover:bg-card transition-colors"
                          aria-label="Tambah jumlah"
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-5 border-t border-border bg-card/80 backdrop-blur-sm flex-shrink-0 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal Produk</span>
                  <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-muted text-[11px]">
                  <span>Total Berat Paket</span>
                  <span className="font-mono">{totalWeight} gram</span>
                </div>
                <div className="flex justify-between text-text-muted text-[11px]">
                  <span>Biaya Pengiriman</span>
                  <span>Dihitung saat checkout</span>
                </div>
                <div className="flex justify-between font-sans font-bold text-sm text-text-primary pt-2 border-t border-border">
                  <span>Estimasi Total</span>
                  <span className="text-accent text-base tabular-nums">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-display font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <span>Lanjut ke Pembayaran</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog Modal */}
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={setShowCheckout}
        items={items}
        total={subtotal}
      />
    </>
  )
}

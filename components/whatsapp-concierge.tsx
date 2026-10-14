"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X, Sparkles, ShoppingBag, Check } from "lucide-react"
import { getTasteConsultationLink } from "@/lib/whatsapp"
import { useCart } from "@/hooks/use-cart"
import CartSheet from "@/components/cart-sheet"

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

export default function WhatsAppConcierge() {
  const [openBubble, setOpenBubble] = useState(true)
  const [bouncing, setBouncing] = useState(false)
  const [showPill, setShowPill] = useState(false)

  const { getTotalItems, getTotalPrice, lastAdded } = useCart()
  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  const waUrl = getTasteConsultationLink()

  // Reaktif ketika produk baru ditambahkan ke keranjang
  useEffect(() => {
    if (!lastAdded) return
    setBouncing(true)
    setShowPill(true)

    const bounceTimer = setTimeout(() => setBouncing(false), 800)
    const pillTimer = setTimeout(() => setShowPill(false), 2200)

    return () => {
      clearTimeout(bounceTimer)
      clearTimeout(pillTimer)
    }
  }, [lastAdded?.timestamp])

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-40 flex flex-col items-end gap-2.5 pointer-events-none select-none">
      {/* ── 1. Speech Callout Prompt (Konsultasi Rasa) ── */}
      {openBubble && (
        <div className="pointer-events-auto bg-card border border-border shadow-lg rounded-2xl p-3.5 max-w-[240px] text-xs space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-accent text-[11px]">
              <Sparkles size={12} />
              <span>Kurator Tembakau</span>
            </span>
            <button
              onClick={() => setOpenBubble(false)}
              className="text-text-muted hover:text-text-primary p-0.5"
              aria-label="Tutup notifikasi"
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-text-secondary text-[11.5px] leading-relaxed">
            Bingung pilih aroma atau tarikan? Chat kami untuk konsultasi rasa gratis!
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors mt-1"
          >
            Chat di WhatsApp &rarr;
          </a>
        </div>
      )}

      {/* ── 2. Subtle Micro-feedback Pill Saat Barang Ditambahkan ── */}
      {showPill && lastAdded && (
        <div className="pointer-events-auto bg-card/95 backdrop-blur-md border border-accent/30 shadow-lg rounded-full px-3.5 py-1.5 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-text-primary font-medium text-[11.5px] truncate max-w-[150px] sm:max-w-[200px]">
            {lastAdded.name}
          </span>
          <span className="text-accent font-bold text-[11px] bg-accent-muted px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Check size={11} className="text-emerald-600" /> +1
          </span>
        </div>
      )}

      {/* ── 3. Floating Cart Action Button ── */}
      <CartSheet>
        <button
          type="button"
          aria-label={`Buka Keranjang Belanja, total ${totalItems} item`}
          className={`pointer-events-auto group relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-accent-text shadow-lg shadow-accent/25 transition-all duration-200 hover:scale-105 active:scale-95 border border-accent/40 ${
            bouncing
              ? "scale-110 ring-2 ring-accent ring-offset-2 ring-offset-background"
              : ""
          }`}
        >
          <div className="relative flex items-center justify-center">
            <ShoppingBag size={18} className="transition-transform group-hover:rotate-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">
                {totalItems}
              </span>
            )}
          </div>

          <span className="font-semibold text-xs tracking-tight hidden sm:inline">
            Keranjang {totalItems > 0 ? `(${totalItems})` : ""}
          </span>

          {totalItems > 0 && totalPrice > 0 && (
            <span className="text-[11px] font-medium opacity-90 hidden md:inline border-l border-white/25 pl-2">
              {formatPrice(totalPrice)}
            </span>
          )}
        </button>
      </CartSheet>

      {/* ── 4. Floating WhatsApp Action Button ── */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Konsultasi Rasa Tembakau via WhatsApp"
        className="pointer-events-auto group flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:scale-105 active:scale-95 border border-emerald-500/40"
      >
        <MessageCircle size={18} className="fill-white" />
        <span className="font-semibold text-xs tracking-tight hidden sm:inline">
          Konsultasi Rasa WA
        </span>
      </a>
    </div>
  )
}

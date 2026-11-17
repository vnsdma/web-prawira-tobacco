"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X, Sparkles, ShoppingBag, Check, Bot, QrCode } from "lucide-react"
import { getTasteConsultationLink } from "@/lib/whatsapp"
import { useCart } from "@/hooks/use-cart"
import CartSheet from "@/components/cart-sheet"
import { ChatInterface } from "@/components/chat-kurator/chat-interface"

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
  const [isChatOpen, setIsChatOpen] = useState(false)

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
    <>
      <div className="fixed bottom-20 md:bottom-6 right-4 z-40 flex flex-col items-end gap-2.5 pointer-events-none select-none">
        {/* ── 1. Speech Callout Prompt (Kurator Tembakau AI & QRIS) ── */}
        {openBubble && !isChatOpen && (
          <div className="pointer-events-auto bg-card border border-border shadow-xl rounded-2xl p-3.5 max-w-[260px] text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-bold text-accent text-[11px]">
                <Sparkles size={13} className="text-accent animate-pulse" />
                <span>Kurator Tembakau AI</span>
              </span>
              <button
                onClick={() => setOpenBubble(false)}
                className="text-text-muted hover:text-text-primary p-0.5"
                aria-label="Tutup notifikasi"
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-text-secondary text-[11px] leading-relaxed">
              Bingung pilih rasa atau mau pesan cepat? Chat dengan <strong>AI Kurator</strong> untuk cek stok & bayar via <strong>QRIS langsung</strong>!
            </p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setOpenBubble(false)
                  setIsChatOpen(true)
                }}
                className="flex-1 text-center py-1.5 px-2.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-text font-bold text-[11px] transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <Bot size={12} />
                <span>Chat & Pesan QRIS</span>
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Hubungi CS WhatsApp Toko"
                className="py-1.5 px-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] transition-colors"
              >
                <MessageCircle size={14} />
              </a>
            </div>
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

        {/* ── 3. Floating Action Buttons (Cart & AI Kurator) ── */}
        <div className="flex items-center gap-2">
          {/* Floating Cart Action Button */}
          <CartSheet>
            <button
              type="button"
              aria-label={`Buka Keranjang Belanja, total ${totalItems} item`}
              className={`pointer-events-auto group relative flex items-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-full bg-card hover:bg-raised text-text-primary shadow-lg shadow-black/10 transition-all duration-200 hover:scale-105 active:scale-95 border border-border ${
                bouncing ? "scale-110 ring-2 ring-accent ring-offset-2 ring-offset-background" : ""
              }`}
            >
              <div className="relative flex items-center justify-center">
                <ShoppingBag size={17} className="transition-transform group-hover:rotate-6 text-text-secondary" />
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
                <span className="text-[11px] font-medium opacity-90 hidden md:inline border-l border-border pl-2">
                  {formatPrice(totalPrice)}
                </span>
              )}
            </button>
          </CartSheet>

          {/* Floating AI Kurator Chat Trigger Button */}
          <button
            type="button"
            onClick={() => setIsChatOpen((prev) => !prev)}
            aria-label="Buka Chat Kurator Tembakau AI"
            className="pointer-events-auto group relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-accent-text shadow-xl shadow-accent/25 transition-all duration-200 hover:scale-105 active:scale-95 border border-accent/40 cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <Bot size={18} className="transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-accent" />
            </div>
            <span className="font-bold text-xs tracking-tight">
              Kurator AI
            </span>
          </button>
        </div>
      </div>

      {/* ── 4. Interactive AI Chatbot Modal ── */}
      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  )
}

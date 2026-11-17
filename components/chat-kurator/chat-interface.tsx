"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Send,
  Sparkles,
  X,
  RotateCcw,
  Bot,
  User,
  Loader2,
  ChevronDown,
  ShoppingBag,
  HelpCircle,
  QrCode,
  ShieldCheck,
} from "lucide-react"
import { ChatToolCard } from "./chat-tool-card"

export interface SessionCartItem {
  id: number
  name: string
  price: number
  quantity: number
  image_url?: string
  weight?: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  tool_type?:
    | "stock_card"
    | "order_review"
    | "qris_card"
    | "payment_success"
    | "whatsapp_action"
    | "cart_prompt"
    | "cart_review"
    | "checkout_container"
  tool_data?: any
}

interface ChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
}

const SAMPLE_PROMPTS = [
  "🍃 Rekomendasi tembakau manis & dingin",
  "📦 Cek stok Linting Surya",
  "🍂 Tembakau kretek gurih mantap apa yang enak?",
  "🛒 Mau pesan tembakau langsung di sini",
  "❓ Cara simpan tembakau biar awet dan tidak kering",
]

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "Halo! Saya **Kurator Tembakau Prawira**. 🍂\n\nSaya siap membantu Anda:\n• **Konsultasi rasa** (Manis Buah, Dingin/Ice, Kretek Gurih, Mild)\n• **Cek stok fisik real-time** dari gudang Prawira\n• **Beli banyak varian & checkout ongkir Biteship** langsung di dalam chat ini!\n\nVarian apa yang sedang Kakak cari hari ini?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])

  // In-chat conversational cart session
  const [cartItems, setCartItems] = useState<SessionCartItem[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isOrderProcessing, setIsOrderProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0)
  const cartSubtotal = cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0)

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [messages, isOpen, isSending])

  // ── 1. Action: Add Product to Cart Session ────────────────────
  const handleAddToCart = (product: any, qty = 1) => {
    let nextItems: SessionCartItem[] = []

    setCartItems((prev) => {
      const existing = prev.find((it) => it.id === product.id)
      if (existing) {
        nextItems = prev.map((it) =>
          it.id === product.id ? { ...it, quantity: it.quantity + qty } : it
        )
      } else {
        nextItems = [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: qty,
            image_url: product.image_url,
            weight: product.weight || 65,
          },
        ]
      }
      return nextItems
    })

    const count = nextItems.reduce((acc, it) => acc + it.quantity, 0)
    const subtotal = nextItems.reduce((acc, it) => acc + it.price * it.quantity, 0)

    const botMsg: ChatMessage = {
      id: "cart-add-" + Date.now(),
      role: "assistant",
      content: `✅ **${qty}x ${product.name}** (${formatRupiah(product.price)}) berhasil dimasukkan ke daftar belanja Kakak! 🧺\n\nApakah ada produk atau perlengkapan lain yang ingin ditambahkan (seperti *papir*, *filter busa*, atau varian tembakau lain), atau sudah cukup?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      tool_type: "cart_prompt",
      tool_data: {
        cartItems: nextItems,
        totalCount: count,
        subtotal: subtotal,
      },
    }

    setMessages((prev) => [...prev, botMsg])
  }

  // ── 2. Action: Open Cart Review ───────────────────────────────
  const handleOpenCart = (customList?: SessionCartItem[]) => {
    const activeItems = customList || cartItems
    const subtotal = activeItems.reduce((acc, it) => acc + it.price * it.quantity, 0)

    if (activeItems.length === 0) {
      const emptyMsg: ChatMessage = {
        id: "cart-empty-" + Date.now(),
        role: "assistant",
        content:
          "Keranjang belanja Kakak saat ini masih kosong. Silakan tanyakan rasa atau pilih varian tembakau terlebih dahulu ya!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, emptyMsg])
      return
    }

    const cartMsg: ChatMessage = {
      id: "cart-review-" + Date.now(),
      role: "assistant",
      content:
        "Baik Kak! Berikut daftar belanjaan yang sudah terkumpul di keranjang Kakak. Kakak bisa mengubah jumlahnya, menghapus item, atau langsung lanjut ke pengiriman & pembayaran:",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      tool_type: "cart_review",
      tool_data: {
        items: activeItems,
        subtotal: subtotal,
      },
    }
    setMessages((prev) => [...prev, cartMsg])
  }

  // ── 3. Action: Update Quantity in Cart ────────────────────────
  const handleUpdateCartQty = (productId: number, newQty: number) => {
    let nextItems: SessionCartItem[] = []
    setCartItems((prev) => {
      if (newQty <= 0) {
        nextItems = prev.filter((it) => it.id !== productId)
      } else {
        nextItems = prev.map((it) => (it.id === productId ? { ...it, quantity: newQty } : it))
      }
      return nextItems
    })

    const subtotal = nextItems.reduce((acc, it) => acc + it.price * it.quantity, 0)

    // Update the last cart_review message tool_data in place
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.tool_type === "cart_review")
      if (idx !== -1) {
        const actualIdx = prev.length - 1 - idx
        const updated = [...prev]
        updated[actualIdx] = {
          ...updated[actualIdx],
          tool_data: {
            items: nextItems,
            subtotal,
          },
        }
        return updated
      }
      return prev
    })
  }

  // ── 4. Action: Remove Item from Cart ──────────────────────────
  const handleRemoveFromCart = (productId: number) => {
    handleUpdateCartQty(productId, 0)
  }

  // ── 5. Action: Continue Shopping / Browse More Products ────────
  const handleContinueShopping = async () => {
    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "tambah produk lain",
        }),
      })
      const data = await res.json()
      const botMsg: ChatMessage = {
        id: "shop-more-" + Date.now(),
        role: "assistant",
        content:
          data.reply ||
          "Tentu Kak! Berikut beberapa varian tembakau pilihan & perlengkapan tingwe favorit yang siap dikirim hari ini:",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tool_type: "stock_card",
        tool_data: data.tool_data || {
          items: [],
        },
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      handleSend("katalog produk")
    }
  }

  // ── 6. Action: Proceed to Checkout Container ──────────────────
  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      handleOpenCart()
      return
    }

    const subtotal = cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0)

    const checkoutMsg: ChatMessage = {
      id: "checkout-step-" + Date.now(),
      role: "assistant",
      content:
        "Silakan lengkapi formulir pengiriman di bawah ini untuk menghitung ongkir Biteship otomatis dan menerbitkan **Dynamic QRIS**:",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      tool_type: "checkout_container",
      tool_data: {
        items: cartItems,
        subtotal: subtotal,
      },
    }
    setMessages((prev) => [...prev, checkoutMsg])
  }

  // ── 7. Send User Message ──────────────────────────────────────
  const handleSend = async (customText?: string) => {
    const textToSend = customText || input
    if (!textToSend.trim() || isSending) return

    const trimmed = textToSend.trim()
    const lower = trimmed.toLowerCase()

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!customText) setInput("")

    // Check if user is saying finished / checkout
    if (
      lower === "sudah" ||
      lower === "cukup" ||
      lower === "selesai" ||
      lower === "lihat keranjang" ||
      lower === "cek keranjang" ||
      lower === "checkout" ||
      lower === "mau bayar"
    ) {
      if (cartItems.length > 0) {
        handleOpenCart()
        return
      }
    }

    // Check if user wants to continue shopping
    if (lower.includes("tambah produk lain") || lower.includes("tambah lagi") || lower.includes("mau beli lagi")) {
      handleContinueShopping()
      return
    }

    setIsSending(true)

    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`)
      }

      const data = await res.json()

      // If backend suggests open cart
      if (data.action_hint === "open_cart" && cartItems.length > 0) {
        handleOpenCart()
        return
      }

      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content: data.reply || "Ada yang bisa saya bantu kembali seputar tembakau Prawira?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tool_type: data.tool_type,
        tool_data: data.tool_data,
      }

      setMessages((prev) => [...prev, botMsg])
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: `⚠️ Maaf Kak, koneksi sedang mengalami gangguan (${err.message}). Silakan ketik kembali pertanyaan Anda ya!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsSending(false)
    }
  }

  // ── 8. User Confirms Order in In-Chat Checkout Container ──────
  const handleConfirmOrder = async (orderPayload: any) => {
    setIsOrderProcessing(true)
    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_order",
          action_payload: orderPayload,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Gagal membuat order (HTTP ${res.status})`)
      }

      const data = await res.json()

      // Clear session cart on successful order
      setCartItems([])

      const botMsg: ChatMessage = {
        id: "qris-bot-" + Date.now(),
        role: "assistant",
        content: `✅ Pesanan Anda berhasil dibuat dengan nomor invoice **${data.order.order_number}**!\n\nSilakan scan **Dynamic QRIS** di bawah ini untuk menyelesaikan pembayaran sebesar **${formatRupiah(data.qris.finalAmount)}**:`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tool_type: "qris_card",
        tool_data: {
          ...data.qris,
          order_id: data.order.id,
        },
      }

      setMessages((prev) => [...prev, botMsg])
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "err-order-" + Date.now(),
        role: "assistant",
        content: `❌ Gagal memproses pesanan: ${err.message}. Silakan periksa kembali data Anda atau hubungi admin via WhatsApp.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsOrderProcessing(false)
    }
  }

  // ── 9. User Checks Payment Status ─────────────────────────────
  const handleCheckPayment = async (transactionId: string, orderId: string) => {
    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_payment",
          action_payload: { transactionId, order_id: orderId },
        }),
      })

      const data = await res.json()

      if (data.is_paid) {
        const botSuccessMsg: ChatMessage = {
          id: "paid-bot-" + Date.now(),
          role: "assistant",
          content: `🎉 ${data.message || "Pembayaran QRIS telah terverifikasi lunas!"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          tool_type: "payment_success",
          tool_data: data,
        }
        setMessages((prev) => [...prev, botSuccessMsg])
      } else {
        const botPendingMsg: ChatMessage = {
          id: "pending-bot-" + Date.now(),
          role: "assistant",
          content: `ℹ️ ${data.message || "Pembayaran belum terdeteksi. Silakan selesaikan scan di m-Banking terlebih dahulu lalu klik periksa kembali."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
        setMessages((prev) => [...prev, botPendingMsg])
      }
    } catch (err: any) {
      alert("Kendala saat memeriksa status: " + err.message)
    }
  }

  const handleResetChat = () => {
    if (confirm("Mulai percakapan baru dengan Kurator Tembakau?")) {
      setCartItems([])
      setMessages([
        {
          id: "welcome-new",
          role: "assistant",
          content: "Halo kembali! Ada varian tembakau atau pesanan yang ingin Anda tanyakan?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Jendela Chat Kurator Tembakau Prawira"
      className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 flex flex-col w-full sm:w-[440px] h-full sm:h-[650px] max-h-screen bg-card sm:rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      {/* ── 1. Top Header ── */}
      <div className="flex items-center justify-between px-3.5 py-3 bg-raised border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-accent/15 text-accent border border-accent/30 shadow-2xs">
            <Sparkles size={16} />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-display font-bold text-xs text-text-primary">
              <span>Kurator Tembakau AI</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-[9.5px]">
                Online
              </span>
            </div>
            <div className="text-[10.5px] text-text-muted leading-tight">
              Konsultasi & Checkout Biteship QRIS
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Header Cart Badge Button */}
          {totalCartCount > 0 && (
            <button
              type="button"
              onClick={() => handleOpenCart()}
              className="px-2.5 py-1 rounded-full bg-accent text-accent-text font-bold text-[10.5px] flex items-center gap-1 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Lihat Keranjang Belanja"
            >
              <ShoppingBag size={12} />
              <span>{totalCartCount} item</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetChat}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-card transition-colors cursor-pointer"
            title="Reset Percakapan"
            aria-label="Reset Percakapan"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-card transition-colors cursor-pointer"
            title="Tutup Chat"
            aria-label="Tutup Chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── 2. Message Feed ── */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scroll-smooth bg-background/50">
        {messages.map((m) => {
          const isUser = m.role === "user"
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[94%] ${
                isUser ? "ml-auto" : "mr-auto"
              }`}
            >
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                  isUser
                    ? "bg-accent text-accent-text rounded-tr-xs font-medium"
                    : "bg-card border border-border text-text-primary rounded-tl-xs whitespace-pre-wrap"
                }`}
              >
                {/* Formatting markdown basic bold & lists */}
                <div className="space-y-1">
                  {m.content.split("\n").map((line, idx) => {
                    if (!line.trim()) return <div key={idx} className="h-1.5" />
                    return (
                      <div key={idx} className="leading-relaxed">
                        {renderFormattedText(line)}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tool Cards (Stock, Cart Review, Checkout Container, QRIS, Success) */}
              {m.tool_type && m.tool_data && (
                <div className="w-full">
                  <ChatToolCard
                    toolType={m.tool_type}
                    toolData={m.tool_data}
                    onAddToCart={handleAddToCart}
                    onOpenCart={() => handleOpenCart()}
                    onUpdateCartQty={handleUpdateCartQty}
                    onRemoveFromCart={handleRemoveFromCart}
                    onProceedToCheckout={handleProceedToCheckout}
                    onContinueShopping={handleContinueShopping}
                    onConfirmOrder={handleConfirmOrder}
                    onCheckPayment={handleCheckPayment}
                    isProcessing={isOrderProcessing}
                  />
                </div>
              )}

              <span className="text-[9.5px] text-text-muted mt-1 px-1 font-mono">
                {m.timestamp}
              </span>
            </div>
          )
        })}

        {isSending && (
          <div className="flex items-center gap-2 text-text-muted text-xs p-2 rounded-xl bg-card border border-border/60 max-w-[180px] animate-pulse">
            <Loader2 size={13} className="animate-spin text-accent" />
            <span className="text-[11px]">Kurator sedang berpikir...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 3. Quick Suggestion Prompts ── */}
      <div className="px-3 py-1.5 bg-raised/80 border-t border-border/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
        {totalCartCount > 0 ? (
          <>
            <button
              type="button"
              onClick={() => handleOpenCart()}
              className="flex-shrink-0 text-[10.5px] font-bold px-3 py-1 rounded-full bg-accent text-accent-text flex items-center gap-1 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingBag size={11} />
              <span>Cek Keranjang ({totalCartCount} item)</span>
            </button>
            <button
              type="button"
              onClick={() => handleProceedToCheckout()}
              className="flex-shrink-0 text-[10.5px] font-semibold px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              Lanjut ke Checkout &rarr;
            </button>
            <button
              type="button"
              onClick={() => handleContinueShopping()}
              className="flex-shrink-0 text-[10.5px] font-medium px-2.5 py-1 rounded-full border border-border bg-card text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            >
              + Tambah Varian Lain
            </button>
          </>
        ) : (
          SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="flex-shrink-0 text-[10.5px] font-medium px-2.5 py-1 rounded-full border border-border bg-card hover:border-accent/40 hover:bg-card/80 text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              {prompt}
            </button>
          ))
        )}
      </div>

      {/* ── 4. Input Box Bar ── */}
      <div className="p-2.5 bg-card border-t border-border flex items-center gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={
            totalCartCount > 0
              ? `Ketik produk lain atau 'selesai' (${totalCartCount} item di keranjang)...`
              : "Tanya rasa, cek stok, atau pesan tembakau..."
          }
          disabled={isSending}
          className="flex-1 bg-raised border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || isSending}
          aria-label="Kirim Pesan ke Kurator"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-accent hover:bg-accent-hover text-accent-text transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-shrink-0 shadow-sm"
        >
          {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}

function formatRupiah(amount: number) {
  return "Rp " + Math.round(amount || 0).toLocaleString("id-ID")
}

// Simple text formatter for **bold** text in chat
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

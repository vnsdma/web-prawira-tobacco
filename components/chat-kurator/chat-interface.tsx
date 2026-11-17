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

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  tool_type?: "stock_card" | "order_review" | "qris_card" | "payment_success" | "whatsapp_action"
  tool_data?: any
}

interface ChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
}

const SAMPLE_PROMPTS = [
  "🍃 Rekomendasi tembakau manis & dingin",
  "📦 Cek stok Linting Melon Ice",
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
        "Halo! Saya **Kurator Tembakau Prawira**. 🍂\n\nSaya siap membantu Anda:\n• **Konsultasi rasa** (Manis, Dingin/Ice, Kretek Gurih, Mild)\n• **Cek stok fisik real-time** dari gudang Prawira\n• **Pesan langsung & bayar via QRIS otomatis** tanpa perlu berpindah aplikasi!\n\nVarian apa yang sedang Kakak cari hari ini?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])

  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isOrderProcessing, setIsOrderProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [messages, isOpen, isSending])

  // ── Send User Message ─────────────────────────────────────────
  const handleSend = async (customText?: string) => {
    const textToSend = customText || input
    if (!textToSend.trim() || isSending) return

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!customText) setInput("")
    setIsSending(true)

    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`)
      }

      const data = await res.json()

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

  // ── User Selects Product from Stock Card ──────────────────────
  const handleSelectProduct = (product: any) => {
    const promptText = `Saya mau pesan 1 pack ${product.name}.\nNama: \nNo WA: 08\nAlamat: `
    setInput(promptText)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(promptText.length, promptText.length)
    }, 100)
  }

  // ── User Confirms Order in Review Card ────────────────────────
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

  // ── User Checks Payment Status ────────────────────────────────
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
      className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 flex flex-col w-full sm:w-[420px] h-full sm:h-[620px] max-h-screen bg-card sm:rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      {/* ── 1. Top Header ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-raised border-b border-border flex-shrink-0">
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
              Konsultasi & Checkout QRIS Instan
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
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
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[92%] ${
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

              {/* Tool Cards (Stock, Review, QRIS, Success) */}
              {m.tool_type && m.tool_data && (
                <div className="w-full">
                  <ChatToolCard
                    toolType={m.tool_type}
                    toolData={m.tool_data}
                    onSelectProduct={handleSelectProduct}
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
        {SAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt)}
            className="flex-shrink-0 text-[10.5px] font-medium px-2.5 py-1 rounded-full border border-border bg-card hover:border-accent/40 hover:bg-card/80 text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
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
          placeholder="Tanya rasa, cek stok, atau pesan tembakau..."
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
  return "Rp " + Math.round(amount).toLocaleString("id-ID")
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

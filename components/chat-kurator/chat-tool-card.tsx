"use client"

import React, { useState, useEffect } from "react"
import {
  Package,
  CheckCircle2,
  Clock,
  QrCode,
  Copy,
  Check,
  Send,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Truck,
  Sparkles,
} from "lucide-react"

interface ToolCardProps {
  toolType: "stock_card" | "order_review" | "qris_card" | "payment_success" | "whatsapp_action"
  toolData: any
  onSelectProduct?: (product: any) => void
  onConfirmOrder?: (orderPayload: any) => void
  onCheckPayment?: (transactionId: string, orderId: string) => void
  isProcessing?: boolean
}

function formatRupiah(amount: number) {
  return "Rp " + Math.round(amount).toLocaleString("id-ID")
}

export const ChatToolCard: React.FC<ToolCardProps> = ({
  toolType,
  toolData,
  onSelectProduct,
  onConfirmOrder,
  onCheckPayment,
  isProcessing = false,
}) => {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(15 * 60) // 15 mins
  const [isVerifying, setIsVerifying] = useState(false)

  // Countdown timer for QRIS
  useEffect(() => {
    if (toolType !== "qris_card") return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [toolType])

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleCopyQRString = (text: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVerify = async () => {
    if (!onCheckPayment) return
    setIsVerifying(true)
    try {
      await onCheckPayment(toolData.transactionId || "", toolData.order_id || toolData.invoiceNumber || "")
    } finally {
      setIsVerifying(false)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. KARTU STOK & PRODUK (STOCK CARD)
  // ─────────────────────────────────────────────────────────────
  if (toolType === "stock_card") {
    const items = toolData?.items || []
    if (items.length === 0) return null

    return (
      <div className="my-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/15">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11.5px]">
            <Package size={13} className="text-amber-500" />
            <span>Katalog & Stok Live Gudang</span>
          </div>
          <span className="text-[10px] text-text-muted">Supabase Real-Time</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((prod: any) => {
            const inStock = (prod.in_stock || 0) > 0
            return (
              <div
                key={prod.id}
                className="flex flex-col justify-between rounded-lg border border-border bg-card p-2.5 transition-all hover:border-accent/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-semibold text-text-primary text-[11.5px] line-clamp-1">{prod.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold whitespace-nowrap ${
                        inStock
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {inStock ? `Stok: ${prod.in_stock}` : "Habis"}
                    </span>
                  </div>
                  <div className="text-[12px] font-bold text-accent">{formatRupiah(prod.price)}</div>
                </div>

                <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[10px] text-text-muted">Pack 100gr</span>
                  <button
                    type="button"
                    disabled={!inStock}
                    onClick={() => onSelectProduct && onSelectProduct(prod)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent hover:bg-accent-hover text-accent-text text-[10.5px] font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Pesan Varian Ini</span>
                    &rarr;
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 2. KARTU KONFIRMASI PESANAN (ORDER REVIEW)
  // ─────────────────────────────────────────────────────────────
  if (toolType === "order_review") {
    const { customer_name, customer_phone, shipping_address, items = [], subtotal, shipping_cost, total_amount } = toolData

    return (
      <div className="my-2.5 rounded-xl border border-accent/40 bg-card p-3.5 text-xs shadow-md">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border">
          <div className="flex items-center gap-1.5 text-accent font-semibold text-xs">
            <Sparkles size={13} className="text-accent" />
            <span>Rincian Pesanan Prawira Tobacco</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-accent/15 text-accent font-bold text-[10px]">
            Siap Bayar QRIS
          </span>
        </div>

        {/* Data Penerima */}
        <div className="space-y-1.5 rounded-lg bg-raised p-2.5 text-[11px] mb-2.5">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Penerima:</span>
            <span className="font-semibold text-text-primary">{customer_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">WhatsApp:</span>
            <span className="font-mono text-text-primary">+{customer_phone}</span>
          </div>
          <div className="pt-1 border-t border-border/60">
            <span className="text-text-muted block mb-0.5">Alamat Pengiriman:</span>
            <span className="text-text-primary font-medium line-clamp-2">{shipping_address}</span>
          </div>
        </div>

        {/* Daftar Item */}
        <div className="space-y-1 mb-2.5">
          {items.map((it: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-[11px]">
              <span className="text-text-primary font-medium">
                {it.name} <span className="text-text-muted">x{it.quantity}</span>
              </span>
              <span className="font-semibold text-text-primary">{formatRupiah(it.price * it.quantity)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border/40">
            <span className="inline-flex items-center gap-1">
              <Truck size={11} /> Ongkir (Biteship Logistik)
            </span>
            <span>{formatRupiah(shipping_cost)}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold pt-1.5 border-t border-border text-accent">
            <span>Total Tagihan:</span>
            <span>{formatRupiah(total_amount)}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => onConfirmOrder && onConfirmOrder(toolData)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Membuat QRIS Mandiri...</span>
            </>
          ) : (
            <>
              <QrCode size={13} />
              <span>Konfirmasi & Buat QRIS Pembayaran &rarr;</span>
            </>
          )}
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 3. KARTU PEMBAYARAN DYNAMIC QRIS (QRIS PAYMENT CARD)
  // ─────────────────────────────────────────────────────────────
  if (toolType === "qris_card") {
    const { invoiceNumber, finalAmount, qr_image_url, qr_string, uniqueCode, transactionId, order_id } = toolData

    return (
      <div className="my-2.5 rounded-2xl border-2 border-emerald-500/40 bg-card p-4 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header QRIS */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] tracking-wide">
              QRIS RESMI
            </span>
            <span className="text-[11px] font-mono text-text-muted">#{invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
            <Clock size={12} />
            <span>{formatTimer(countdown)}</span>
          </div>
        </div>

        {/* QR Code Image Container */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shadow-inner my-2">
          {qr_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr_image_url}
              alt={`QRIS ${invoiceNumber}`}
              className="w-48 h-48 object-contain rounded-md"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400 font-mono text-[11px]">
              Memuat QR Code...
            </div>
          )}
          <div className="text-[10px] text-slate-500 font-semibold tracking-wider mt-1.5 uppercase">
            NMID: ID1024349486166 (PRAWIRA TOBACCO)
          </div>
        </div>

        {/* Nominal Tagihan */}
        <div className="rounded-xl bg-raised p-2.5 my-2.5 text-center">
          <span className="text-[10.5px] text-text-muted block">Total Tagihan Transfer Tepat:</span>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            {formatRupiah(finalAmount)}
          </div>
          {uniqueCode > 0 && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5">
              (Termasuk kode verifikasi otomatis {uniqueCode})
            </span>
          )}
        </div>

        {/* Dukungan Aplikasi */}
        <div className="text-center text-[10px] text-text-muted mb-3 leading-tight">
          Bisa di-scan dari <strong>BCA Mobile, Livin Mandiri, BRImo, BNI, GoPay, OVO, Dana, ShopeePay</strong> & semua aplikasi perbankan berlogo QRIS.
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5">
          <button
            type="button"
            disabled={isVerifying}
            onClick={handleVerify}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Memverifikasi Pembayaran...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={14} />
                <span>Saya Sudah Bayar (Cek Status)</span>
              </>
            )}
          </button>

          {qr_string && (
            <button
              type="button"
              onClick={() => handleCopyQRString(qr_string)}
              className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-border bg-raised hover:bg-card text-text-secondary text-[10.5px] font-medium transition-colors cursor-pointer"
            >
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              <span>{copied ? "Kode QRIS Berhasil Disalin!" : "Salin Raw String QRIS"}</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 4. KARTU SUKSES PEMBAYARAN (PAYMENT SUCCESS CARD)
  // ─────────────────────────────────────────────────────────────
  if (toolType === "payment_success") {
    const { order_number, amount, whatsapp_url, message } = toolData

    return (
      <div className="my-2.5 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 p-4 text-xs shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
          <span>PEMBAYARAN QRIS LUNAS</span>
        </div>

        <p className="text-[11.5px] text-text-secondary leading-relaxed mb-3">
          {message || `Pesanan #${order_number} berhasil diverifikasi lunas sebesar ${formatRupiah(amount)}.`}
        </p>

        <div className="space-y-2">
          {whatsapp_url && (
            <a
              href={whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-98"
            >
              <Send size={13} />
              <span>Kirim Konfirmasi ke WhatsApp Toko &rarr;</span>
            </a>
          )}
          <a
            href={`/api/orders?order_id=${encodeURIComponent(order_number)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-border bg-card text-text-secondary text-[11px] font-medium hover:text-text-primary transition-colors"
          >
            <ExternalLink size={11} />
            <span>Lihat Data Pesanan #{order_number}</span>
          </a>
        </div>
      </div>
    )
  }

  return null
}

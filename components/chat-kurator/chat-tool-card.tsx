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
  ShoppingBag,
  Trash2,
  MapPin,
  AlertCircle,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react"
import BiteshipAreaSelector from "@/components/biteship-area-selector"
import type { BiteshipArea, BiteshipPricing } from "@/lib/biteship"

export interface ToolCardProps {
  toolType:
    | "stock_card"
    | "order_review"
    | "qris_card"
    | "payment_success"
    | "whatsapp_action"
    | "cart_prompt"
    | "cart_review"
    | "checkout_container"
  toolData: any
  onSelectProduct?: (product: any) => void
  onAddToCart?: (product: any) => void
  onUpdateCartQty?: (productId: number, newQty: number) => void
  onRemoveFromCart?: (productId: number) => void
  onOpenCart?: () => void
  onProceedToCheckout?: () => void
  onContinueShopping?: () => void
  onConfirmOrder?: (orderPayload: any) => void
  onCheckPayment?: (transactionId: string, orderId: string) => void
  isProcessing?: boolean
}

function formatRupiah(amount: number) {
  return "Rp " + Math.round(amount || 0).toLocaleString("id-ID")
}

export const ChatToolCard: React.FC<ToolCardProps> = ({
  toolType,
  toolData,
  onSelectProduct,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onOpenCart,
  onProceedToCheckout,
  onContinueShopping,
  onConfirmOrder,
  onCheckPayment,
  isProcessing = false,
}) => {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(15 * 60) // 15 mins
  const [isVerifying, setIsVerifying] = useState(false)

  // ── Checkout Container Form State ──
  const [recipientName, setRecipientName] = useState(toolData?.customer_name || "")
  const [recipientPhone, setRecipientPhone] = useState(toolData?.customer_phone || "")
  const [recipientAddress, setRecipientAddress] = useState(toolData?.shipping_address || "")
  const [selectedArea, setSelectedArea] = useState<BiteshipArea | null>(null)
  const [biteshipRates, setBiteshipRates] = useState<BiteshipPricing[]>([])
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [selectedRateIdx, setSelectedRateIdx] = useState<number>(0)
  const [formError, setFormError] = useState<string | null>(null)

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

  // Fetch Biteship rates whenever area changes in checkout container
  const handleAreaSelect = async (area: BiteshipArea | null) => {
    setSelectedArea(area)
    setBiteshipRates([])
    setSelectedRateIdx(0)
    setFormError(null)

    if (!area) return

    const items = toolData?.items || []
    if (items.length === 0) return

    setIsLoadingRates(true)
    try {
      const res = await fetch("/api/biteship/rates/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_area_id: area.id,
          items: items.map((i: any) => ({
            name: i.name,
            value: i.price,
            weight: i.weight || 65,
            quantity: i.quantity || 1,
          })),
        }),
      })

      const data = await res.json()
      if (data.pricing && Array.isArray(data.pricing) && data.pricing.length > 0) {
        setBiteshipRates(data.pricing)
        setSelectedRateIdx(0)
      } else {
        setBiteshipRates([])
      }
    } catch (err) {
      console.error("Biteship rate error:", err)
    } finally {
      setIsLoadingRates(false)
    }
  }

  // Handle Checkout submission
  const handleSubmitCheckout = () => {
    setFormError(null)
    const items = toolData?.items || []

    if (items.length === 0) {
      setFormError("Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.")
      return
    }
    if (!recipientName.trim()) {
      setFormError("Mohon isi Nama Lengkap penerima.")
      return
    }
    const cleanPhone = recipientPhone.replace(/\D/g, "")
    if (!cleanPhone || cleanPhone.length < 9) {
      setFormError("Mohon masukkan nomor WhatsApp penerima yang aktif.")
      return
    }
    if (!selectedArea) {
      setFormError("Mohon pilih Kecamatan / Kota tujuan melalui pencarian Biteship.")
      return
    }
    if (!recipientAddress.trim()) {
      setFormError("Mohon isi alamat lengkap & patokan pengiriman.")
      return
    }

    const currentRate = biteshipRates[selectedRateIdx]
    const shippingCost = currentRate ? currentRate.price : 14000
    const courierService = currentRate
      ? `${currentRate.courier_name} ${currentRate.courier_service_name}`
      : "Biteship Standard"

    const payload = {
      customer_name: recipientName.trim(),
      customer_phone: cleanPhone,
      customer_email: `${cleanPhone}@prawiraguest.com`,
      shipping_address: `${recipientAddress.trim()}, Kec. ${selectedArea.administrative_division_level_3_name}, ${selectedArea.administrative_division_level_2_name}, ${selectedArea.administrative_division_level_1_name} ${selectedArea.postal_code}`,
      destination_area_id: selectedArea.id,
      destination_area_name: `${selectedArea.name} (${selectedArea.postal_code})`,
      shipping_service: courierService,
      courier_name: currentRate?.courier_name || "Biteship",
      shipping_cost: shippingCost,
      items: items.map((i: any) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      subtotal: toolData?.subtotal || items.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0),
      total_amount:
        (toolData?.subtotal || items.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0)) +
        shippingCost,
    }

    if (onConfirmOrder) {
      onConfirmOrder(payload)
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
                    onClick={() => {
                      if (onAddToCart) {
                        onAddToCart(prod)
                      } else if (onSelectProduct) {
                        onSelectProduct(prod)
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent hover:bg-accent-hover text-accent-text text-[10.5px] font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                  >
                    <Plus size={11} />
                    <span>Pesan Varian Ini</span>
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
  // 2. KARTU PROMPT SETELAH TAMBAH PRODUK (CART PROMPT)
  // ─────────────────────────────────────────────────────────────
  if (toolType === "cart_prompt") {
    const totalCount = toolData?.totalCount || 1
    const subtotal = toolData?.subtotal || 0

    return (
      <div className="my-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/15">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-[11.5px]">
            <ShoppingBag size={13} className="text-emerald-600" />
            <span>Keranjang Belanja ({totalCount} item)</span>
          </div>
          <span className="font-mono font-bold text-accent text-xs">{formatRupiah(subtotal)}</span>
        </div>

        <p className="text-[11px] text-text-secondary mb-2.5 leading-relaxed">
          Ingin menambah perlengkapan tingwe (*papir*, *filter busa*, atau varian lain), atau sudah cukup dan mau lanjut checkout?
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onContinueShopping && onContinueShopping()}
            className="py-1.5 px-2 rounded-lg border border-border bg-card hover:bg-raised text-text-primary text-[10.5px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Plus size={11} />
            <span>Tambah Produk Lain</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenCart && onOpenCart()}
            className="py-1.5 px-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-[10.5px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <ShoppingBag size={11} />
            <span>Lihat Keranjang & Selesai &rarr;</span>
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 3. KARTU INTERAKTIF KERANJANG (CART REVIEW)
  // ─────────────────────────────────────────────────────────────
  if (toolType === "cart_review") {
    const items = toolData?.items || []
    const subtotal = toolData?.subtotal || items.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0)

    if (items.length === 0) {
      return (
        <div className="my-2.5 rounded-xl border border-border bg-card p-3.5 text-center text-xs">
          <ShoppingBag size={20} className="mx-auto text-text-muted mb-1.5 opacity-60" />
          <p className="font-semibold text-text-primary">Keranjang belanja Anda kosong</p>
          <button
            type="button"
            onClick={() => onContinueShopping && onContinueShopping()}
            className="mt-2 py-1 px-3 rounded-lg bg-accent text-accent-text text-[11px] font-bold"
          >
            Pilih Varian Tembakau
          </button>
        </div>
      )
    }

    return (
      <div className="my-2.5 rounded-xl border border-accent/40 bg-card p-3 text-xs shadow-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
          <div className="flex items-center gap-1.5 text-accent font-bold text-xs">
            <ShoppingBag size={14} className="text-accent" />
            <span>Daftar Pesanan ({items.length} varian)</span>
          </div>
          <span className="text-[10px] text-text-muted">Bisa ubah jumlah / hapus</span>
        </div>

        {/* List Items */}
        <div className="space-y-2 mb-3 divide-y divide-border/40">
          {items.map((it: any) => (
            <div key={it.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-text-primary text-[11.5px] truncate block">{it.name}</span>
                <span className="text-[11px] text-accent font-bold">{formatRupiah(it.price)}</span>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-1 flex-shrink-0 bg-raised px-1 py-0.5 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => onUpdateCartQty && onUpdateCartQty(it.id, it.quantity - 1)}
                  className="w-5 h-5 rounded bg-card hover:bg-accent hover:text-accent-text border border-border flex items-center justify-center text-text-primary font-bold text-xs transition-colors cursor-pointer"
                  title="Kurangi"
                >
                  <Minus size={10} />
                </button>
                <span className="w-5 text-center font-bold text-text-primary text-xs font-mono">{it.quantity}</span>
                <button
                  type="button"
                  onClick={() => onUpdateCartQty && onUpdateCartQty(it.id, it.quantity + 1)}
                  className="w-5 h-5 rounded bg-card hover:bg-accent hover:text-accent-text border border-border flex items-center justify-center text-text-primary font-bold text-xs transition-colors cursor-pointer"
                  title="Tambah"
                >
                  <Plus size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveFromCart && onRemoveFromCart(it.id)}
                  title="Hapus item"
                  className="ml-1 p-1 text-text-muted hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Subtotal Row */}
        <div className="flex items-center justify-between pt-2 border-t border-border font-bold text-xs mb-3">
          <span className="text-text-secondary">Subtotal ({items.reduce((a: number, b: any) => a + b.quantity, 0)} item):</span>
          <span className="text-accent text-sm font-mono">{formatRupiah(subtotal)}</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onContinueShopping && onContinueShopping()}
            className="py-2 px-2 rounded-lg border border-border bg-raised hover:bg-card text-text-secondary hover:text-text-primary text-[10.5px] font-semibold text-center transition-all active:scale-95 cursor-pointer"
          >
            + Belanja Produk Lain
          </button>
          <button
            type="button"
            onClick={() => onProceedToCheckout && onProceedToCheckout()}
            className="py-2 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold text-center shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Lanjut Checkout</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 4. CONTAINER CHECKOUT & ONGKIR BITESHIP (CHECKOUT CONTAINER)
  // ─────────────────────────────────────────────────────────────
  if (toolType === "checkout_container") {
    const items = toolData?.items || []
    const subtotal = toolData?.subtotal || items.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0)
    const currentRate = biteshipRates[selectedRateIdx]
    const shippingCost = currentRate ? currentRate.price : 0
    const totalAmount = subtotal + shippingCost

    return (
      <div className="my-2.5 rounded-2xl border-2 border-accent/40 bg-card p-3.5 text-xs shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border">
          <div className="flex items-center gap-1.5 text-accent font-bold text-xs">
            <Truck size={14} className="text-accent" />
            <span>Pengiriman & Ekspedisi Biteship</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-accent/15 text-accent font-bold text-[10px]">
            {items.length} Varian Dipilih
          </span>
        </div>

        {/* Error Notification */}
        {formError && (
          <div className="mb-2.5 p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-1.5 animate-in shake">
            <AlertCircle size={13} className="flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-2.5">
          {/* 1. Nama Penerima */}
          <div>
            <label className="text-[10.5px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
              Nama Lengkap Penerima:
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full bg-raised border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none transition-all"
            />
          </div>

          {/* 2. No WhatsApp */}
          <div>
            <label className="text-[10.5px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
              Nomor WhatsApp:
            </label>
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full bg-raised border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none transition-all font-mono"
            />
          </div>

          {/* 3. Kecamatan / Kota Tujuan via Biteship API */}
          <div>
            <BiteshipAreaSelector onSelectArea={handleAreaSelect} selectedArea={selectedArea} />
          </div>

          {/* 4. Alamat Lengkap & Patokan */}
          <div>
            <label className="text-[10.5px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
              Alamat Lengkap & Patokan Rumah:
            </label>
            <textarea
              rows={2}
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, dan patokan..."
              className="w-full bg-raised border border-border focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none transition-all resize-none"
            />
          </div>

          {/* 5. Pilihan Kurir & Tarif Ongkir Live Biteship */}
          {selectedArea && (
            <div className="pt-2 border-t border-border/60">
              <label className="text-[10.5px] font-semibold text-text-secondary uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span>Pilihan Layanan Ekspedisi:</span>
                {isLoadingRates && (
                  <span className="flex items-center gap-1 text-[10px] text-accent font-normal">
                    <Loader2 size={10} className="animate-spin" /> Menghitung ongkir...
                  </span>
                )}
              </label>

              {isLoadingRates ? (
                <div className="p-3 rounded-lg bg-raised border border-border text-center text-text-muted text-[11px] flex items-center justify-center gap-2">
                  <Loader2 size={13} className="animate-spin text-accent" />
                  <span>Mengambil tarif resmi ekspedisi Biteship...</span>
                </div>
              ) : biteshipRates.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {biteshipRates.slice(0, 5).map((rate, idx) => {
                    const isSelected = selectedRateIdx === idx
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedRateIdx(idx)}
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "border-accent bg-accent/10 ring-1 ring-accent"
                            : "border-border bg-raised hover:bg-card"
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-text-primary text-[11px] block">
                            {rate.courier_name} • {rate.courier_service_name}
                          </span>
                          <span className="text-[10px] text-text-muted block">
                            Estimasi: {rate.duration || rate.shipment_duration_range || "1-3 hari"}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-accent text-xs">
                          {formatRupiah(rate.price)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10.5px]">
                  Tarif Biteship standar: <strong>Rp 14.000</strong> (JNE / J&T Regular)
                </div>
              )}
            </div>
          )}

          {/* 6. Ringkasan Tagihan */}
          <div className="pt-2.5 border-t border-border space-y-1 rounded-lg bg-raised/70 p-2 text-[11px]">
            <div className="flex items-center justify-between text-text-secondary">
              <span>Subtotal ({items.reduce((a: number, b: any) => a + b.quantity, 0)} item):</span>
              <span className="font-mono font-semibold">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-text-secondary">
              <span className="flex items-center gap-1">
                <Truck size={11} />
                <span>Ongkir {currentRate ? `(${currentRate.courier_name})` : ""}:</span>
              </span>
              <span className="font-mono font-semibold">
                {selectedArea ? formatRupiah(shippingCost) : "Pilih lokasi dahulu"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-border/60 text-accent">
              <span>Total Pembayaran:</span>
              <span className="font-mono text-sm">{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleSubmitCheckout}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Membuat QRIS Mandiri...</span>
              </>
            ) : (
              <>
                <QrCode size={14} />
                <span>Buat Pesanan & Bayar QRIS Sekarang &rarr;</span>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 5. KARTU PEMBAYARAN DYNAMIC QRIS (QRIS PAYMENT CARD)
  // ─────────────────────────────────────────────────────────────
  if (toolType === "qris_card") {
    const { invoiceNumber, finalAmount, qr_image_url, qr_string, uniqueCode } = toolData

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
              (Termasuk kode verifikasi unik {uniqueCode})
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
  // 6. KARTU SUKSES PEMBAYARAN (PAYMENT SUCCESS CARD)
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

  // ─────────────────────────────────────────────────────────────
  // 7. KARTU AKSI WHATSAPP OTOMATIS (WHATSAPP ACTION CARD)
  // ─────────────────────────────────────────────────────────────
  if (toolType === "whatsapp_action") {
    const { target_phone, message_preview, direct_url, status_text, provider } = toolData || {}

    return (
      <div className="my-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11.5px]">
            <Send size={13} className="text-emerald-500" />
            <span>Aksi WhatsApp Otomatis</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[9.5px] font-semibold">
            {provider || "WhatsApp Gateway"}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
          {target_phone && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted">Nomor Tujuan:</span>
              <span className="font-mono font-bold text-text-primary">+{target_phone}</span>
            </div>
          )}
          {status_text && (
            <div className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
              {status_text}
            </div>
          )}
          {message_preview && (
            <div className="p-2 rounded-lg bg-card border border-border text-[11px] text-text-secondary italic line-clamp-3">
              &ldquo;{message_preview}&rdquo;
            </div>
          )}
        </div>

        {direct_url && (
          <a
            href={direct_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-98"
          >
            <Send size={12} />
            <span>Buka Chat WhatsApp Resmi &rarr;</span>
          </a>
        )}
      </div>
    )
  }

  return null
}

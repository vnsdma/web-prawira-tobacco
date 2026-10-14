"use client"

import { useState, useEffect } from "react"
import { Mail, Package, Clock, CheckCircle2, XCircle, Search, Copy, Check, Hash, Truck, ShieldAlert, AlertCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

export interface OrderItem {
  id: number
  quantity: number
  price: number
  product_name?: string
  products?: {
    name: string
  }
}

export interface Order {
  id: number
  order_number?: string
  total_amount: number
  order_status?: string
  payment_status?: string
  status?: string
  courier?: string
  shipping_service?: string
  created_at: string
  order_items: OrderItem[]
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateString
  }
}

function getStatusBadge(status?: string) {
  const s = (status || "pending").toLowerCase()
  switch (s) {
    case "settlement":
    case "capture":
    case "success":
    case "completed":
      return (
        <span className="badge status-success flex items-center gap-1">
          <CheckCircle2 size={12} /> Selesai
        </span>
      )
    case "pending":
      return (
        <span className="badge status-pending flex items-center gap-1">
          <Clock size={12} /> Menunggu
        </span>
      )
    case "cancel":
    case "cancelled":
    case "expire":
    case "failed":
      return (
        <span className="badge status-cancelled flex items-center gap-1">
          <XCircle size={12} /> Batal
        </span>
      )
    default:
      return (
        <span className="badge badge-muted flex items-center gap-1 capitalize">
          <Package size={12} /> {s}
        </span>
      )
  }
}

function OrderSkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-2 py-1">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-40 rounded-sm" />
          <Skeleton className="h-3 w-16 rounded-sm" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-32 rounded-sm" />
          <Skeleton className="h-3 w-16 rounded-sm" />
        </div>
      </div>
      <div className="pt-2 border-t border-border flex justify-between items-center">
        <Skeleton className="h-3 w-20 rounded-sm" />
        <Skeleton className="h-4 w-28 rounded-sm" />
      </div>
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════
   1. GUEST ORDER TRACKER (REQUIRES EMAIL + ORDER ID)
   ═════════════════════════════════════════════════════════════════ */
export function GuestOrderTracker() {
  const [email, setEmail] = useState("")
  const [orderId, setOrderId] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !orderId.trim()) {
      toast({
        title: "Data Belum Lengkap",
        description: "Masukkan alamat email dan nomor pesanan Anda.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setErrorMsg("")
    setOrder(null)

    try {
      const params = new URLSearchParams({
        email: email.trim(),
        order_id: orderId.trim(),
      })
      const res = await fetch(`/api/orders?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Pesanan tidak ditemukan.")
      }

      if (Array.isArray(data) && data.length > 0) {
        setOrder(data[0])
      } else {
        setErrorMsg("Pesanan tidak ditemukan. Pastikan email dan nomor pesanan sudah benar.")
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal melacak pesanan.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({ title: "Tersalin", description: `Nomor pesanan ${text} telah disalin.` })
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-4">
      {/* Form Card */}
      <div className="p-4 md:p-6 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Truck size={17} className="text-accent" />
          <h3 className="font-display font-bold text-sm md:text-base text-text-primary">
            Lacak Pesanan Tamu (Guest)
          </h3>
        </div>
        <p className="text-xs text-text-muted mb-4 leading-relaxed">
          Gunakan alamat email dan nomor pesanan yang Anda dapatkan saat melakukan checkout untuk mengetahui status terkini.
        </p>

        <form onSubmit={handleTrack} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">
              Alamat Email Pemesan <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base pl-9 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">
              Nomor Pesanan / Order ID <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Contoh: ORD-1727..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="input-base pl-9 text-xs font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 mt-2"
          >
            <Search size={14} />
            <span>{loading ? "Melacak Pesanan..." : "Lacak Status Pesanan"}</span>
          </button>
        </form>
      </div>

      {/* Shimmer Loading */}
      {loading && (
        <div className="space-y-3">
          <OrderSkeletonCard />
        </div>
      )}

      {/* Error State */}
      {!loading && errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Pelacakan Gagal</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Result Card */}
      {!loading && order && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
            <div>
              <span className="text-[10px] text-text-muted block">Nomor Pesanan</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-display font-bold text-sm text-text-primary">
                  {order.order_number || `ORD-${order.id}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(order.order_number || `ORD-${order.id}`)}
                  className="p-1 rounded hover:bg-raised text-text-muted hover:text-text-primary transition-colors"
                  title="Salin nomor pesanan"
                >
                  {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
            <div>{getStatusBadge(order.order_status || order.payment_status || order.status)}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-raised p-3 rounded-xl">
            <div>
              <span className="text-[10px] text-text-muted block">Tanggal Pemesanan</span>
              <span className="font-medium text-text-primary">{formatDate(order.created_at)}</span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted block">Layanan Ekspedisi</span>
              <span className="font-medium text-text-primary">
                {order.shipping_service || order.courier || "Kurir Reguler"}
              </span>
            </div>
          </div>

          {/* Item Breakdown */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
              Detail Barang
            </span>
            <div className="space-y-1.5">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs text-text-secondary">
                  <span className="truncate pr-2">
                    {item.products?.name || item.product_name || "Produk"} <span className="text-text-muted">×{item.quantity}</span>
                  </span>
                  <span className="font-medium text-text-primary flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Summary */}
          <div className="flex justify-between items-center pt-3 border-t border-border font-display">
            <span className="text-xs font-semibold text-text-secondary">Total Tagihan</span>
            <span className="font-bold text-base text-accent">
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════
   2. LOGGED-IN ORDER HISTORY (AUTOMATIC FOR AUTHENTICATED USER)
   ═════════════════════════════════════════════════════════════════ */
export default function OrderHistory() {
  const { user, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const { toast } = useToast()

  const loadUserOrders = async () => {
    if (!user?.email) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Gagal mengambil data pesanan.")
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      toast({
        title: "Gagal Mengambil Riwayat",
        description: "Terjadi kesalahan saat memuat riwayat pesanan.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      loadUserOrders()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const handleCopyOrderId = (id: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast({ title: "Tersalin", description: `ID Pesanan ${text} telah disalin.` })
    setTimeout(() => setCopiedId(null), 1500)
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border text-center space-y-3">
        <ShieldAlert size={28} className="text-warning mx-auto" />
        <h3 className="font-display font-bold text-base text-text-primary">
          Masuk untuk Melihat Riwayat
        </h3>
        <p className="text-xs text-text-muted max-w-sm mx-auto">
          Fitur riwayat pesanan lengkap khusus untuk akun terdaftar. Anda dapat masuk terlebih dahulu atau gunakan fitur Lacak Pesanan Tamu.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-label="Memuat riwayat pesanan">
        <OrderSkeletonCard />
        <OrderSkeletonCard />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-card border border-border space-y-2">
        <div className="w-12 h-12 rounded-full bg-raised flex items-center justify-center text-text-muted mx-auto mb-2">
          <Package size={22} className="opacity-50" />
        </div>
        <h3 className="font-display font-semibold text-sm text-text-primary">
          Belum Ada Riwayat Pesanan
        </h3>
        <p className="text-xs text-text-muted max-w-xs mx-auto">
          Semua pesanan yang Anda lakukan dengan akun ini akan otomatis tampil di sini.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <span>Total {orders.length} pesanan tercatat</span>
        <button
          type="button"
          onClick={loadUserOrders}
          className="hover:text-accent flex items-center gap-1 transition-colors"
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {orders.map((order) => {
        const displayId = order.order_number || `ORD-${order.id}`
        return (
          <div
            key={order.id}
            className="p-4 md:p-5 rounded-2xl bg-card border border-border hover:border-accent/40 transition-colors shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xs md:text-sm text-text-primary">
                  {displayId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyOrderId(order.id, displayId)}
                  className="p-1 rounded hover:bg-raised text-text-muted hover:text-text-primary transition-colors"
                  title="Salin nomor pesanan"
                >
                  {copiedId === order.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                </button>
              </div>
              <div>{getStatusBadge(order.order_status || order.payment_status || order.status)}</div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-text-muted">
              <span>Waktu: {formatDate(order.created_at)}</span>
              <span>{order.shipping_service || order.courier || "Kurir"}</span>
            </div>

            <div className="space-y-1.5 py-1">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs text-text-secondary">
                  <span className="truncate pr-2">
                    {item.products?.name || item.product_name || "Produk"} <span className="text-text-muted">×{item.quantity}</span>
                  </span>
                  <span className="font-medium text-text-primary flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-border font-display">
              <span className="text-xs font-semibold text-text-secondary">Total Pembayaran</span>
              <span className="font-bold text-sm md:text-base text-accent">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
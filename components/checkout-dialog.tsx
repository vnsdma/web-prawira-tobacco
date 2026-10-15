"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useCart, type CartItem } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { MapPin, User, Phone, Mail, ChevronDown, ChevronUp, Loader2, CheckCircle2, Download, RefreshCw, QrCode, CreditCard, Banknote, PackageCheck, Copy, Check, Store, Bike, Truck } from "lucide-react"
import BiteshipAreaSelector from "@/components/biteship-area-selector"
import type { BiteshipArea, BiteshipPricing } from "@/lib/biteship"

/* ─── Types ──────────────────────────────────────────────────── */
interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  total: number // Subtotal from cart
}

interface ShippingForm {
  name: string
  email: string
  phone: string
  address: string
  notes: string
}

interface CashifyData {
  qr_string: string
  transactionId: string
  totalAmount: number
}

type Step = "form" | "payment" | "success"
type DeliveryMethod = "pickup" | "local" | "expedition"

/* ─── Helpers ────────────────────────────────────────────────── */
function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

function InputField({
  label, icon: Icon, required, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: React.ElementType
  required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-text-secondary block font-display">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          className="input-base pl-9 text-xs"
          required={required}
          {...props}
        />
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function CheckoutDialog({
  open,
  onOpenChange,
  items,
  total: subtotal,
}: CheckoutDialogProps) {
  const { toast } = useToast()
  const { clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()

  const [step, setStep] = useState<Step>("form")
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [showItems, setShowItems] = useState(false)
  const [copiedOrder, setCopiedOrder] = useState(false)
  
  // Cashify Specific States
  const [cashifyData, setCashifyData] = useState<CashifyData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success">("pending")
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Customer Form (Guest or Authenticated)
  const [form, setForm] = useState<ShippingForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })

  // Delivery Method: pickup (Ambil di Toko Rp 0) | local (Kurir Lokal Flat Rp 5.000) | expedition (RajaOngkir)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("expedition")

  // RajaOngkir Shipping States
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  
  const [selectedProvince, setSelectedProvince] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  
  const [couriers] = useState(["jne", "pos", "tiki"])
  const [selectedCourier, setSelectedCourier] = useState("jne")
  const [shippingServices, setShippingServices] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState("")
  // Biteship Shipping States
  const [selectedBiteshipArea, setSelectedBiteshipArea] = useState<BiteshipArea | null>(null)
  const [biteshipPricing, setBiteshipPricing] = useState<BiteshipPricing[]>([])
  const [selectedBiteshipRateIdx, setSelectedBiteshipRateIdx] = useState<string>("")
  const [isCalculatingBiteship, setIsCalculatingBiteship] = useState(false)
  const [shippingCost, setShippingCost] = useState(0)

  // Total weight in grams (65g fallback for tobacco packaging buffer)
  const totalWeight = items.reduce((sum, item) => sum + item.quantity * (item.weight || 65), 0)

  // Effective Shipping Cost based on delivery method
  const effectiveShippingCost =
    deliveryMethod === "pickup"
      ? 0
      : deliveryMethod === "local"
      ? 5000
      : shippingCost

  // Final Total = Subtotal + Effective Shipping Cost
  const finalTotalAmount = subtotal + effectiveShippingCost

  // Load Midtrans Snap client script dynamically if needed
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).snap) {
      const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
      const snapUrl = isProduction
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js"
      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY

      if (clientKey) {
        const script = document.createElement("script")
        script.src = snapUrl
        script.setAttribute("data-client-key", clientKey)
        script.async = true
        document.head.appendChild(script)
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      setForm((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        email: user.email ?? prev.email,
        phone: user.phone ?? prev.phone,
        address: user.address ?? prev.address,
      }))
    }
  }, [isAuthenticated, user, open])

  useEffect(() => {
    if (open) {
      fetchProvinces()
    } else {
      setTimeout(() => {
        setStep("form")
        setLoading(false)
        setOrderNumber("")
        setCopiedOrder(false)
        setCashifyData(null)
        setPaymentStatus("pending")
        // Reset RajaOngkir
        setSelectedProvince(""); setCities([]); setSelectedCity("")
        setDistricts([]); setSelectedDistrict("")
        setShippingServices([]); setShippingCost(0)
      }, 300)
    }
  }, [open])

  const update = (field: keyof ShippingForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  /* ── RajaOngkir Fetchers ── */
  const fetchProvinces = async () => {
    try {
      const res = await fetch("/api/rajaongkir/province")
      const data = await res.json()
      const extractedData = data?.provinces || data?.data || data?.results || data
      setProvinces(Array.isArray(extractedData) ? extractedData : [])
    } catch (err) {
      console.error(err)
      setProvinces([])
    }
  }

  const fetchCities = async (provId: string) => {
    try {
      const res = await fetch(`/api/rajaongkir/city?province_id=${provId}`)
      const data = await res.json()
      const extractedData = data?.cities || data?.data || data?.results || data
      setCities(Array.isArray(extractedData) ? extractedData : [])
    } catch (err) {
      console.error(err)
      setCities([])
    }
  }

  const fetchDistricts = async (cityId: string) => {
    try {
      const res = await fetch(`/api/rajaongkir/district/${cityId}`)
      const data = await res.json()
      const extractedData = data?.districts || data?.results || data?.data || data
      setDistricts(Array.isArray(extractedData) ? extractedData : [])
    } catch (err) {
      console.error("Fetch districts error:", err)
      setDistricts([])
    }
  }

  const fetchShippingCost = async (destId: string, courier: string) => {
    try {
      const res = await fetch("/api/rajaongkir/cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: "501", destination: destId, weight: totalWeight, courier }),
      })
      const data = await res.json()
      const extractedData = data?.results || data?.data || data
      if (Array.isArray(extractedData) && extractedData.length > 0 && extractedData[0].costs) {
        setShippingServices(extractedData[0].costs)
      } else {
        setShippingServices([])
      }
    } catch {
      toast({ title: "Gagal memuat ongkir", variant: "destructive" })
    }
  }

  /* ── Biteship Rate Handlers ── */
  const fetchBiteshipRates = async (areaId: string) => {
    setIsCalculatingBiteship(true)
    setBiteshipPricing([])
    setSelectedBiteshipRateIdx("")
    setShippingCost(0)

    try {
      const res = await fetch("/api/biteship/rates/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_area_id: areaId,
          items: items.map((i) => ({
            name: i.name,
            value: i.price,
            weight: i.weight || 65,
            quantity: i.quantity,
          })),
        }),
      })
      const data = await res.json()
      if (data.pricing && Array.isArray(data.pricing)) {
        setBiteshipPricing(data.pricing)
        if (data.pricing.length > 0) {
          setSelectedBiteshipRateIdx("0")
          setShippingCost(data.pricing[0].price)
        }
      }
    } catch (err) {
      console.error("Biteship rates error:", err)
      toast({ title: "Gagal memuat tarif ekspedisi Biteship", variant: "destructive" })
    } finally {
      setIsCalculatingBiteship(false)
    }
  }

  const handleBiteshipAreaSelect = (area: BiteshipArea | null) => {
    setSelectedBiteshipArea(area)
    if (area) {
      fetchBiteshipRates(area.id)
    } else {
      setBiteshipPricing([])
      setSelectedBiteshipRateIdx("")
      setShippingCost(0)
    }
  }

  /* ── Selection Handlers ── */
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedProvince(val)
    setSelectedCity(""); setCities([])
    setSelectedDistrict(""); setDistricts([])
    setShippingServices([]); setShippingCost(0)
    if (val) fetchCities(val)
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedCity(val)
    setSelectedDistrict(""); setDistricts([])
    setShippingServices([]); setShippingCost(0)
    if (val) fetchDistricts(val)
  }

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedDistrict(val)
    setShippingServices([]); setShippingCost(0)
    if (val && selectedCourier) fetchShippingCost(val, selectedCourier)
  }

  const handleCourierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedCourier(val)
    if (selectedDistrict && val) fetchShippingCost(selectedDistrict, val)
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedShipping(val)
    const service = shippingServices[Number(val)]
    if (service) setShippingCost(service.cost[0].value)
  }

  /* ── Cashify Status Check ── */
  const checkStatus = async () => {
    if (!cashifyData?.transactionId || checkingStatus) return
    setCheckingStatus(true)
    try {
      const res = await fetch("/api/payment/cashify/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: cashifyData.transactionId }),
      })
      const result = await res.json()
      
      const status = result.final_status?.toLowerCase()
      if (["paid", "success", "settlement", "completed"].includes(status)) {
        setPaymentStatus("success")
        toast({ title: "Pembayaran Berhasil!", description: "Pesanan Anda sedang diproses." })
      } else {
        toast({ title: "Belum Dibayar", description: "Silakan scan QRIS dan selesaikan pembayaran." })
      }
    } catch (err) {
      console.error("Check status error:", err)
    } finally {
      setCheckingStatus(false)
    }
  }

  /* ── Download QR ── */
  const downloadQR = async () => {
    if (!cashifyData?.qr_string) return
    try {
      const imageUrl = cashifyData.qr_string?.startsWith("http") 
        ? cashifyData.qr_string 
        : `https://larabert-qrgen.hf.space/v1/create-qr-code?size=500x500&style=2&color=ea580c&data=${encodeURIComponent(cashifyData.qr_string || "")}`

      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `QRIS-${cashifyData.transactionId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      toast({ title: "Gagal mengunduh QR", variant: "destructive" })
    }
  }

  const handleCopyOrderNumber = () => {
    if (!orderNumber) return
    navigator.clipboard.writeText(orderNumber)
    setCopiedOrder(true)
    toast({ title: "Tersalin", description: "Nomor pesanan berhasil disalin." })
    setTimeout(() => setCopiedOrder(false), 2000)
  }

  /* ── Submit Order (STRICT PRESERVATION OF PAYMENT GATEWAYS) ── */
  const handleSubmit = async (paymentMethod: "snap" | "cod" | "cashify") => {
    // Validasi form data (Nama, Email, dan WhatsApp selalu wajib)
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast({
        title: "Data tidak lengkap",
        description: "Nama, email, dan nomor HP/WhatsApp wajib diisi.",
        variant: "destructive",
      })
      return
    }

    // Validasi alamat untuk kurir lokal atau ekspedisi
    if (deliveryMethod !== "pickup" && !form.address.trim()) {
      toast({
        title: "Alamat belum diisi",
        description: "Mohon cantumkan alamat lengkap pengiriman.",
        variant: "destructive",
      })
      return
    }

    // Validasi tujuan ekspedisi reguler via Biteship
    if (deliveryMethod === "expedition" && (!selectedBiteshipArea || !selectedBiteshipRateIdx)) {
      toast({
        title: "Pengiriman belum dipilih",
        description: "Silakan cari kecamatan tujuan dan pilih layanan ekspedisi.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let provName = "Lokal"
      let cityName = "Lokal"
      let distName = "Lokal"
      let courierName = ""

      if (deliveryMethod === "pickup") {
        courierName = "Ambil Sendiri di Toko (Bebas Ongkir)"
      } else if (deliveryMethod === "local") {
        courierName = "Kurir Lokal Area Sekitar Toko (Flat Rp 5.000)"
      } else {
        provName = selectedBiteshipArea?.administrative_division_level_1_name || ""
        cityName = selectedBiteshipArea?.administrative_division_level_2_name || ""
        distName = selectedBiteshipArea?.administrative_division_level_3_name || ""
        const selectedRate = biteshipPricing[Number(selectedBiteshipRateIdx)]
        courierName = selectedRate
          ? `${selectedRate.courier_name.toUpperCase()} - ${selectedRate.courier_service_name}`
          : "JNE - Reguler"
      }

      const resolvedAddress =
        deliveryMethod === "pickup"
          ? (form.address.trim() || "Ambil Langsung di Toko Prawira Tobacco (Jl. Tentara Pelajar No. 42)")
          : form.address.trim()

      const orderPayload = {
        user_id: user?.id ?? null,
        user_uid: user?.id ? String(user.id) : `guest_${Date.now()}`,
        customer_name: form.name.trim(),
        customer_email: form.email.trim().toLowerCase(),
        customer_phone: form.phone.trim(),
        customer_address: resolvedAddress,
        shipping_address: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          address: resolvedAddress,
          delivery_method: deliveryMethod,
          province: provName,
          city: cityName,
          district: distName,
        },
        shipping_cost: effectiveShippingCost,
        courier: courierName,
        notes: form.notes.trim(),
        items: items.map((item) => {
          const parsedId = (item as any).productId
            ? Number((item as any).productId)
            : Number(item.id.includes("-") && !isNaN(Number(item.id.split("-")[0])) ? item.id.split("-")[0] : item.id)
          return {
            product_id: isNaN(parsedId) || parsedId <= 0 ? 44 : parsedId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          }
        }),
        subtotal: subtotal,
        discount: 0,
        total_amount: finalTotalAmount,
        payment_method: paymentMethod,
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      const createdOrderNumber = data.order?.order_number ?? `ORD-${data.id}`
      setOrderNumber(createdOrderNumber)

      // Payment Gateway Dispatches
      if (paymentMethod === "cashify") {
        const cashifyRes = await fetch("/api/payment/cashify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: data.id, amount: finalTotalAmount }),
        })
        const cashifyResult = await cashifyRes.json()
        if (!cashifyRes.ok || !cashifyResult.success) throw new Error(cashifyResult.error)

        setCashifyData(cashifyResult.data)
        clearCart()
        setStep("success")
      } else if (paymentMethod === "snap") {
        const snapRes = await fetch("/api/payment/snap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: data.id,
            amount: finalTotalAmount,
            customer: {
              name: form.name,
              email: form.email,
              phone: form.phone,
              address: form.address,
            },
          }),
        })
        const snapData = await snapRes.json()
        if (!snapRes.ok || !snapData.token) throw new Error(snapData.error)

        if (typeof window !== "undefined" && (window as any).snap) {
          ;(window as any).snap.pay(snapData.token, {
            onSuccess: () => { clearCart(); setStep("success"); setLoading(false) },
            onPending: () => { clearCart(); setStep("success"); setLoading(false) },
            onClose: () => setLoading(false),
          })
        } else if (snapData.redirect_url) {
          window.location.href = snapData.redirect_url
        }
      } else {
        clearCart()
        setStep("success")
      }
    } catch (err) {
      toast({
        title: "Gagal membuat pesanan",
        description: err instanceof Error ? err.message : "Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100vw-32px)] max-h-[90dvh] overflow-y-auto bg-background border border-border rounded-2xl p-0 shadow-2xl">
        
        {/* ── SUCCESS / QRIS STEP ── */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center p-7 md:p-10 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              paymentStatus === "success" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            }`}>
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h2 className="font-display text-lg md:text-xl font-bold text-text-primary">
                {paymentStatus === "success" ? "Pesanan Berhasil!" : "Menunggu Pembayaran"}
              </h2>
              <p className="text-xs text-text-muted mt-1 max-w-sm">
                {paymentStatus === "success"
                  ? "Pembayaran Anda telah diverifikasi. Kami segera menyiapkan pesanan Anda."
                  : "Silakan pindai kode QRIS di bawah ini untuk menyelesaikan transaksi."}
              </p>

              {orderNumber && (
                <div className="mt-3 p-3 rounded-xl bg-raised border border-border text-left space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-text-muted">Nomor Pesanan:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-text-primary">{orderNumber}</span>
                      <button
                        type="button"
                        onClick={handleCopyOrderNumber}
                        className="p-1 rounded hover:bg-card text-text-muted hover:text-text-primary transition-colors"
                        title="Salin nomor pesanan"
                      >
                        {copiedOrder ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-text-muted">Metode Pengiriman:</span>
                    <span className="font-semibold text-text-primary text-[11px]">
                      {deliveryMethod === "pickup"
                        ? "Ambil Sendiri di Toko (Bebas Ongkir)"
                        : deliveryMethod === "local"
                        ? "Kurir Lokal Area Sekitar Toko (Rp 5.000)"
                        : "Ekspedisi Reguler"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-text-muted">Email Pemesan:</span>
                    <span className="font-medium text-text-primary text-[11px]">{form.email}</span>
                  </div>

                  {deliveryMethod === "pickup" && (
                    <div className="mt-1 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400 space-y-0.5">
                      <div className="font-semibold flex items-center gap-1">
                        <Store size={12} />
                        <span>Lokasi Toko Prawira:</span>
                      </div>
                      <p>Jl. Tentara Pelajar No. 42 (Buka 09:00 - 21:00 WIB). Tunjukkan nomor pesanan ini ke petugas kasir saat pengambilan.</p>
                    </div>
                  )}

                  <p className="text-[10px] text-text-muted pt-1 border-t border-border">
                    💡 Simpan nomor pesanan dan email di atas untuk melacak pesanan di menu <strong>Akun &gt; Lacak Pesanan</strong>.
                  </p>
                </div>
              )}
            </div>

            {cashifyData && paymentStatus !== "success" && (
              <div className="p-4 bg-white rounded-xl border border-border shadow-sm flex flex-col items-center gap-3">
                <img 
                  src={
                    cashifyData.qr_string?.startsWith("http") 
                      ? cashifyData.qr_string 
                      : `https://larabert-qrgen.hf.space/v1/create-qr-code?size=500x500&style=2&color=ea580c&data=${encodeURIComponent(cashifyData.qr_string || "")}`
                  } 
                  alt="QRIS Payment" 
                  className="w-52 h-52 rounded-lg object-contain"
                />
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={downloadQR}
                    className="flex-1 py-2 px-3 rounded-lg border border-border hover:bg-raised text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors text-text-primary"
                  >
                    <Download size={13} />
                    <span>Simpan QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={checkStatus}
                    disabled={checkingStatus}
                    className="flex-1 py-2 px-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {checkingStatus ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    <span>Cek Status</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              className="px-6 py-2.5 rounded-lg bg-raised hover:bg-border text-text-primary text-xs font-semibold transition-colors"
              onClick={() => onOpenChange(false)}
            >
              Selesai
            </button>
          </div>
        )}

        {/* ── CHECKOUT FORM STEP ── */}
        {step === "form" && (
          <>
            <DialogHeader className="p-5 border-b border-border bg-card/60">
              <DialogTitle className="font-display text-base font-bold text-text-primary flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageCheck size={18} className="text-accent" />
                  <span>Penyelesaian Pesanan</span>
                </div>
                {!isAuthenticated && (
                  <span className="badge badge-soft text-[10px] px-2 py-0.5 rounded-full font-normal">
                    Guest Checkout
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="p-5 space-y-5">
              {/* Order Items Collapsible */}
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowItems(!showItems)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-text-primary hover:bg-raised transition-colors"
                >
                  <span>Ringkasan Produk ({items.length} item)</span>
                  {showItems ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showItems && (
                  <div className="p-3.5 pt-0 border-t border-border space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs text-text-secondary">
                        <span className="truncate pr-2">{item.name} ×{item.quantity}</span>
                        <span className="font-semibold text-text-primary flex-shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 border-t border-border bg-raised/40 flex justify-between items-center text-xs">
                  <span className="text-text-muted">Subtotal Produk</span>
                  <span className="font-bold font-sans tabular-nums text-text-primary">{formatPrice(subtotal)}</span>
                </div>
              </div>

              {/* Recipient Form */}
              <div className="space-y-3">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-text-muted">
                  1. Informasi Penerima & Kontak
                </h3>
                <InputField
                  label="Nama Lengkap"
                  icon={User}
                  placeholder="Nama penerima paket"
                  value={form.name}
                  onChange={update("name")}
                  required
                />
                
                {/* Email Field - Essential for Guest Checkout & Tracking */}
                <div>
                  <InputField
                    label="Alamat Email"
                    icon={Mail}
                    type="email"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={update("email")}
                    required
                  />
                  <p className="text-[10px] text-text-muted mt-1">
                    Gunakan email aktif untuk bukti pemesanan dan pelacakan status pesanan.
                  </p>
                </div>

                <InputField
                  label="Nomor WhatsApp / HP"
                  icon={Phone}
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={update("phone")}
                  required
                />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary block font-display">
                    Alamat Lengkap {deliveryMethod !== "pickup" && <span className="text-destructive">*</span>}
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-3 text-text-muted pointer-events-none" />
                    <textarea
                      className="input-base pl-9 text-xs min-h-[72px]"
                      placeholder={
                        deliveryMethod === "pickup"
                          ? "Opsional jika ambil di toko (atau tulis catatan pengambilan)"
                          : "Jalan, No Rumah, RT/RW, Kelurahan..."
                      }
                      value={form.address}
                      onChange={update("address")}
                      required={deliveryMethod !== "pickup"}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Metode & Kurir Pengiriman */}
              <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-text-muted">
                    2. Metode Pengiriman
                  </h3>
                  <span className="text-[11px] font-mono text-text-muted">
                    Berat Paket: <strong>{totalWeight}g</strong>
                  </span>
                </div>

                {/* 3 Delivery Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Pickup */}
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("pickup")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      deliveryMethod === "pickup"
                        ? "border-accent bg-accent/10 ring-1 ring-accent text-text-primary"
                        : "border-border bg-raised hover:border-text-muted/40 text-text-secondary"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Store size={18} className={deliveryMethod === "pickup" ? "text-accent" : "text-text-muted"} />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Gratis
                        </span>
                      </div>
                      <div className="font-display font-bold text-xs text-text-primary">Ambil di Toko</div>
                      <p className="text-[10px] text-text-muted mt-1 leading-snug">
                        Bebas ongkir & barang langsung disiapkan di konter
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/50 font-display font-bold text-xs text-accent">
                      Rp 0
                    </div>
                  </button>

                  {/* Option 2: Local Courier */}
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("local")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      deliveryMethod === "local"
                        ? "border-accent bg-accent/10 ring-1 ring-accent text-text-primary"
                        : "border-border bg-raised hover:border-text-muted/40 text-text-secondary"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Bike size={18} className={deliveryMethod === "local" ? "text-accent" : "text-text-muted"} />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                          Flat
                        </span>
                      </div>
                      <div className="font-display font-bold text-xs text-text-primary">Kurir Lokal</div>
                      <p className="text-[10px] text-text-muted mt-1 leading-snug">
                        Area sekitar toko / tetangga (radius dekat)
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/50 font-display font-bold text-xs text-text-primary">
                      Rp 5.000
                    </div>
                  </button>

                  {/* Option 3: Expedition */}
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("expedition")}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      deliveryMethod === "expedition"
                        ? "border-accent bg-accent/10 ring-1 ring-accent text-text-primary"
                        : "border-border bg-raised hover:border-text-muted/40 text-text-secondary"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Truck size={18} className={deliveryMethod === "expedition" ? "text-accent" : "text-text-muted"} />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-raised text-text-muted border border-border">
                          RajaOngkir
                        </span>
                      </div>
                      <div className="font-display font-bold text-xs text-text-primary">Ekspedisi Reguler</div>
                      <p className="text-[10px] text-text-muted mt-1 leading-snug">
                        JNE, POS, TIKI ke seluruh kecamatan
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/50 font-display font-bold text-xs text-text-primary">
                      {shippingCost > 0 ? formatPrice(shippingCost) : "Hitung Otomatis"}
                    </div>
                  </button>
                </div>

                {/* Info Box for Pickup */}
                {deliveryMethod === "pickup" && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Store size={14} />
                      <span>Ambil Sendiri di Toko Prawira Tobacco</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      📍 <strong>Alamat Toko:</strong> Jl. Tentara Pelajar No. 42 (Buka setiap hari 09:00 - 21:00 WIB).
                      <br />
                      Barang Anda akan langsung dipacking dan disiapkan untuk diambil di konter toko setelah pembayaran selesai.
                    </p>
                  </div>
                )}

                {/* Info Box for Local Courier */}
                {deliveryMethod === "local" && (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs space-y-1">
                    <div className="font-semibold text-accent flex items-center gap-1.5">
                      <Bike size={14} />
                      <span>Pengantaran Kurir Lokal Toko (Rp 5.000)</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      🛵 Khusus area sekitar toko / tetangga dan pelanggan dekat rumah. Paket akan diantar langsung oleh kurir toko ke alamat Anda hari ini.
                    </p>
                  </div>
                )}

                {/* Biteship Destination Form for Expedition */}
                {deliveryMethod === "expedition" && (
                  <div className="space-y-3.5 pt-2 border-t border-border/60">
                    {/* Autocomplete Area Search */}
                    <BiteshipAreaSelector
                      onSelectArea={handleBiteshipAreaSelect}
                      selectedArea={selectedBiteshipArea}
                      disabled={loading}
                    />

                    {/* Calculating Loader */}
                    {isCalculatingBiteship && (
                      <div className="p-3.5 rounded-xl bg-raised border border-border flex items-center justify-center gap-2 text-xs text-text-muted">
                        <Loader2 size={15} className="text-accent animate-spin" />
                        <span>Menghitung ongkir real-time ekspedisi Biteship...</span>
                      </div>
                    )}

                    {/* Biteship Courier Services */}
                    {!isCalculatingBiteship && biteshipPricing.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block font-display">
                          Pilihan Ekspedisi &amp; Layanan Pengiriman: <span className="text-destructive">*</span>
                        </label>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {biteshipPricing.map((rate, idx) => {
                            const isSelected = selectedBiteshipRateIdx === String(idx)
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  setSelectedBiteshipRateIdx(String(idx))
                                  setShippingCost(rate.price)
                                }}
                                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                  isSelected
                                    ? "border-accent bg-accent/10 shadow-xs ring-1 ring-accent"
                                    : "border-border bg-card hover:bg-raised text-text-secondary"
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-text-primary uppercase font-display">
                                      {rate.courier_name}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-raised border border-border text-text-muted font-medium">
                                      {rate.courier_service_name}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-text-muted mt-0.5 block">
                                    Estimasi tiba: {rate.duration || "1 - 3 hari"}
                                  </span>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <span className="font-bold font-sans tabular-nums text-accent text-sm block">
                                    {formatPrice(rate.price)}
                                  </span>
                                  {rate.available_for_instant_waybill_id && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                      ⚡ Resi Otomatis
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {!isCalculatingBiteship && selectedBiteshipArea && biteshipPricing.length === 0 && (
                      <div className="p-3 text-center text-xs text-text-muted bg-raised rounded-xl border border-border">
                        Tidak ada layanan ekspedisi yang tersedia untuk rute tujuan ini.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="p-3.5 rounded-xl bg-raised border border-border space-y-1 text-xs">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal Belanja</span>
                  <span className="font-medium font-sans tabular-nums text-text-primary">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Metode Pengiriman</span>
                  <span className="font-medium text-text-primary">
                    {deliveryMethod === "pickup"
                      ? "Ambil di Toko"
                      : deliveryMethod === "local"
                      ? "Kurir Lokal Toko"
                      : "Ekspedisi Reguler"}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Biaya Ongkir</span>
                  <span>
                    {deliveryMethod === "pickup" ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Gratis (Rp 0)</span>
                    ) : effectiveShippingCost > 0 ? (
                      <span className="font-medium font-sans tabular-nums text-text-primary">{formatPrice(effectiveShippingCost)}</span>
                    ) : (
                      "Pilih pengiriman"
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-bold text-sm text-text-primary font-display">Total Akhir:</span>
                  <span className="font-bold text-base text-accent font-sans tabular-nums">{formatPrice(finalTotalAmount)}</span>
                </div>
              </div>

              {/* Payment Methods (PAYMENT GATEWAY STRICTLY PRESERVED) */}
              <div className="space-y-2 pt-1">
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-text-muted mb-2">
                  3. Pilih Metode Pembayaran
                </h3>

                {/* Cashify QRIS */}
                <button
                  type="button"
                  onClick={() => handleSubmit("cashify")}
                  disabled={loading}
                  className="w-full p-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-xs font-semibold flex items-center justify-between transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <QrCode size={16} />
                    <span>QRIS (Gopay / ShopeePay / Dana / BCA)</span>
                  </div>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                </button>

                {/* Midtrans Snap (Bank Transfer / Virtual Account) */}
                <button
                  type="button"
                  onClick={() => handleSubmit("snap")}
                  disabled={loading}
                  className="w-full p-3 rounded-xl bg-card hover:bg-raised border border-border text-text-primary text-xs font-semibold flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-accent" />
                    <span>Virtual Account / Transfer Bank (Midtrans)</span>
                  </div>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                </button>

                {/* COD */}
                <button
                  type="button"
                  onClick={() => handleSubmit("cod")}
                  disabled={loading}
                  className="w-full p-3 rounded-xl bg-card hover:bg-raised border border-border text-text-secondary text-xs font-medium flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <Banknote size={16} className="text-text-muted" />
                    <span>Bayar di Tempat (COD)</span>
                  </div>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
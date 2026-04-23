"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import type { CartItem } from "@/hooks/use-cart"
import { MapPin, User, Phone, FileText, ChevronDown, ChevronUp, Loader2, CheckCircle } from "lucide-react"

/* ─── Types ──────────────────────────────────────────────────── */
interface CheckoutDialogProps {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  items:         CartItem[]
  total:         number
}

interface ShippingForm {
  name:     string
  phone:    string
  address:  string
  notes:    string
}

type Step = "form" | "payment" | "success"

/* ─── Helpers ────────────────────────────────────────────────── */
function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style:                 "currency",
    currency:              "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

function InputField({
  label, icon: Icon, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon:  React.ElementType
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label
        style={{
          fontSize:   "12px",
          fontWeight: 500,
          fontFamily: "var(--font-display)",
          color:      "var(--text-secondary)",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <Icon
          size={14}
          style={{
            position:  "absolute",
            left:      "12px",
            top:       "50%",
            transform: "translateY(-50%)",
            color:     "var(--text-muted)",
          }}
        />
        <input
          className="input-base"
          style={{ paddingLeft: "36px" }}
          {...props}
        />
      </div>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
export default function CheckoutDialog({
  open,
  onOpenChange,
  items,
  total,
}: CheckoutDialogProps) {
  const { toast }               = useToast()
  const { clearCart }           = useCart()
  const { user, isAuthenticated } = useAuth()

  const [step, setStep]         = useState<Step>("form")
  const [loading, setLoading]   = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [showItems, setShowItems] = useState(false)

  const [form, setForm] = useState<ShippingForm>({
    name:    "",
    phone:   "",
    address: "",
    notes:   "",
  })

  /* Pre-fill form when user is logged in */
  useEffect(() => {
    if (isAuthenticated && user) {
      setForm((prev) => ({
        ...prev,
        name:    user.name    ?? prev.name,
        phone:   user.phone   ?? prev.phone,
        address: user.address ?? prev.address,
      }))
    }
  }, [isAuthenticated, user, open])

  /* Reset on close */
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("form")
        setLoading(false)
        setOrderNumber("")
      }, 300)
    }
  }, [open])

  const update = (field: keyof ShippingForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  /* ── Submit order ── */
  const handleSubmit = async (paymentMethod: "snap" | "cod") => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast({
        title:       "Data tidak lengkap",
        description: "Nama, nomor HP, dan alamat wajib diisi",
        variant:     "destructive",
      })
      return
    }

    setLoading(true)

    try {
      /* Build order payload — identify user by user_id, not email */
      const orderPayload = {
        /* Auth */
        user_id:   user?.id   ?? null,
        user_uid:  user?.id   ? String(user.id) : `guest_${Date.now()}`,

        /* Customer info from form */
        customer_name:    form.name.trim(),
        customer_phone:   form.phone.trim(),
        customer_address: form.address.trim(),
        notes:            form.notes.trim(),

        /* Items */
        items: items.map((item) => ({
          product_id: Number(item.id),
          name:       item.name,
          quantity:   item.quantity,
          price:      item.price,
        })),

        /* Totals */
        subtotal:      total,
        shipping_cost: 0,          // RajaOngkir integration — 0 for now / COD
        discount:      0,
        total_amount:  total,

        /* Payment */
        payment_method: paymentMethod,
      }

      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(orderPayload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      const createdOrderNumber = data.order?.order_number ?? `ORD-${data.id}`
      setOrderNumber(createdOrderNumber)

      if (paymentMethod === "snap") {
        /* Midtrans Snap */
        const snapRes = await fetch("/api/payment/snap", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: data.id,
            amount:   total,
            customer: {
              name:  form.name,
              phone: form.phone,
            },
          }),
        })

        const snapData = await snapRes.json()

        if (!snapRes.ok || !snapData.token) {
          throw new Error(snapData.error ?? "Gagal membuat token pembayaran")
        }

        /* Open Snap popup — snap.js must be loaded globally */
        if (typeof window !== "undefined" && (window as any).snap) {
          ;(window as any).snap.pay(snapData.token, {
            onSuccess: () => {
              clearCart()
              setStep("success")
              setLoading(false)
            },
            onPending: () => {
              clearCart()
              setStep("success")
              setLoading(false)
            },
            onError: () => {
              toast({ title: "Pembayaran gagal", variant: "destructive" })
              setLoading(false)
            },
            onClose: () => {
              setLoading(false)
            },
          })
        } else {
          /* Fallback: redirect to redirect_url */
          if (snapData.redirect_url) {
            window.location.href = snapData.redirect_url
          } else {
            throw new Error("Snap.js belum dimuat")
          }
        }
      } else {
        /* COD */
        clearCart()
        setStep("success")
        setLoading(false)
      }
    } catch (err) {
      console.error("Checkout error:", err)
      toast({
        title:       "Gagal membuat pesanan",
        description: err instanceof Error ? err.message : "Coba lagi",
        variant:     "destructive",
      })
      setLoading(false)
    }
  }

  /* ─────────────────────────────────────────────── Render ─── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth:  "480px",
          width:     "calc(100vw - 32px)",
          maxHeight: "90dvh",
          overflowY: "auto",
          background: "var(--bg)",
          border:    "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          padding:   0,
        }}
      >
        {/* ── Success screen ── */}
        {step === "success" && (
          <div
            style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              padding:        "48px 32px",
              textAlign:      "center",
              gap:            "16px",
            }}
          >
            <div
              style={{
                width:          "64px",
                height:         "64px",
                borderRadius:   "50%",
                background:     "rgba(74,168,100,0.1)",
                border:         "1px solid rgba(74,168,100,0.2)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={28} style={{ color: "#4aa864" }} />
            </div>

            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize:   "18px",
                  fontWeight: 700,
                  color:      "var(--text-primary)",
                  marginBottom: "6px",
                }}
              >
                Pesanan Dibuat!
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Pesanan kamu sudah masuk dan sedang diproses.
              </p>
              {orderNumber && (
                <p
                  style={{
                    marginTop:  "8px",
                    fontSize:   "12px",
                    color:      "var(--text-muted)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  No. pesanan: <span style={{ color: "var(--accent)" }}>{orderNumber}</span>
                </p>
              )}
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: "8px", padding: "10px 28px" }}
              onClick={() => onOpenChange(false)}
            >
              Selesai
            </button>
          </div>
        )}

        {/* ── Order form ── */}
        {step === "form" && (
          <>
            <DialogHeader
              style={{
                padding:      "20px 20px 16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <DialogTitle
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize:   "16px",
                  fontWeight: 700,
                  color:      "var(--text-primary)",
                }}
              >
                Checkout
              </DialogTitle>
            </DialogHeader>

            <div style={{ padding: "20px" }}>

              {/* Order summary (collapsible) */}
              <div
                style={{
                  background:   "var(--bg-card)",
                  border:       "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  marginBottom: "20px",
                  overflow:     "hidden",
                }}
              >
                <button
                  onClick={() => setShowItems(!showItems)}
                  style={{
                    width:          "100%",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "space-between",
                    padding:        "12px 14px",
                    background:     "transparent",
                    border:         "none",
                    cursor:         "pointer",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize:   "13px",
                      fontWeight: 600,
                      color:      "var(--text-primary)",
                    }}
                  >
                    {items.length} produk · {formatPrice(total)}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {showItems
                      ? <ChevronUp size={14} />
                      : <ChevronDown size={14} />
                    }
                  </span>
                </button>

                {showItems && (
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      padding:   "10px 14px",
                      display:   "flex",
                      flexDirection: "column",
                      gap:       "8px",
                    }}
                  >
                    {items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display:        "flex",
                          justifyContent: "space-between",
                          alignItems:     "center",
                          gap:            "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize:     "12px",
                            color:        "var(--text-secondary)",
                            flex:         1,
                            overflow:     "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace:   "nowrap",
                          }}
                        >
                          {item.name}
                          <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>
                            ×{item.quantity}
                          </span>
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize:   "12px",
                            fontWeight: 600,
                            color:      "var(--accent)",
                            flexShrink: 0,
                          }}
                        >
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}

                    <div
                      style={{
                        borderTop:      "1px solid var(--border)",
                        paddingTop:     "8px",
                        marginTop:      "4px",
                        display:        "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                        Total
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-display)" }}>
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping form */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize:   "13px",
                    fontWeight: 600,
                    color:      "var(--text-primary)",
                  }}
                >
                  Info Pengiriman
                </p>

                <InputField
                  label="Nama Penerima *"
                  icon={User}
                  placeholder="Nama lengkap"
                  value={form.name}
                  onChange={update("name")}
                  required
                />

                <InputField
                  label="Nomor HP *"
                  icon={Phone}
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={form.phone}
                  onChange={update("phone")}
                  required
                />

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    style={{
                      fontSize:   "12px",
                      fontWeight: 500,
                      fontFamily: "var(--font-display)",
                      color:      "var(--text-secondary)",
                    }}
                  >
                    Alamat Lengkap *
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin
                      size={14}
                      style={{
                        position: "absolute",
                        left:     "12px",
                        top:      "13px",
                        color:    "var(--text-muted)",
                      }}
                    />
                    <textarea
                      className="input-base"
                      style={{
                        paddingLeft: "36px",
                        minHeight:   "80px",
                        resize:      "vertical",
                      }}
                      placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota"
                      value={form.address}
                      onChange={update("address")}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label
                    style={{
                      fontSize:   "12px",
                      fontWeight: 500,
                      fontFamily: "var(--font-display)",
                      color:      "var(--text-secondary)",
                    }}
                  >
                    Catatan (opsional)
                  </label>
                  <div style={{ position: "relative" }}>
                    <FileText
                      size={14}
                      style={{
                        position: "absolute",
                        left:     "12px",
                        top:      "13px",
                        color:    "var(--text-muted)",
                      }}
                    />
                    <textarea
                      className="input-base"
                      style={{ paddingLeft: "36px", minHeight: "60px", resize: "vertical" }}
                      placeholder="Catatan untuk penjual..."
                      value={form.notes}
                      onChange={update("notes")}
                    />
                  </div>
                </div>
              </div>

              {/* Payment method buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  className="btn-primary"
                  style={{ width: "100%", padding: "13px", fontSize: "14px" }}
                  onClick={() => handleSubmit("snap")}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  ) : null}
                  Bayar Online (Transfer / E-Wallet)
                </button>

                <button
                  className="btn-ghost"
                  style={{ width: "100%", padding: "13px", fontSize: "14px" }}
                  onClick={() => handleSubmit("cod")}
                  disabled={loading}
                >
                  Bayar di Tempat (COD)
                </button>
              </div>

              {/* Guest notice */}
              {!isAuthenticated && (
                <p
                  style={{
                    marginTop:  "14px",
                    fontSize:   "11px",
                    color:      "var(--text-muted)",
                    textAlign:  "center",
                    lineHeight: 1.5,
                  }}
                >
                  Belanja tanpa akun. Login untuk lacak pesanan lebih mudah.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

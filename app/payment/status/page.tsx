"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, XCircle, ArrowLeft, Loader2, PackageCheck } from "lucide-react"

function PaymentStatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">("loading")

  const orderId = searchParams.get("order_id")
  const transactionStatus = searchParams.get("transaction_status")

  useEffect(() => {
    if (transactionStatus) {
      if (transactionStatus === "settlement" || transactionStatus === "capture") {
        setStatus("success")
      } else if (transactionStatus === "pending") {
        setStatus("pending")
      } else {
        setStatus("failed")
      }
    } else {
      setStatus("pending")
    }
  }, [transactionStatus])

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-14 w-14 text-success" />
      case "pending":
        return <Clock className="h-14 w-14 text-warning" />
      case "failed":
        return <XCircle className="h-14 w-14 text-destructive" />
      default:
        return <Loader2 className="h-14 w-14 text-text-muted animate-spin" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "success":
        return {
          title: "Pembayaran Berhasil!",
          description: "Terima kasih! Pembayaran Anda telah kami terima dan pesanan akan segera diproses.",
        }
      case "pending":
        return {
          title: "Menunggu Pembayaran",
          description: "Pembayaran Anda sedang dalam proses verifikasi atau menunggu penyelesaian.",
        }
      case "failed":
        return {
          title: "Pembayaran Belum Berhasil",
          description: "Transaksi tidak dapat diselesaikan atau telah kedaluwarsa. Silakan coba lagi.",
        }
      default:
        return {
          title: "Memverifikasi Transaksi...",
          description: "Sedang memproses status pembayaran Anda dengan payment gateway.",
        }
    }
  }

  const statusMessage = getStatusMessage()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border shadow-xl rounded-2xl overflow-hidden bg-card">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex justify-center mb-4">{getStatusIcon()}</div>
          <CardTitle className="font-display text-xl font-bold text-text-primary">
            {statusMessage.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-5 px-6 pb-8">
          <p className="text-xs text-text-muted leading-relaxed max-w-xs mx-auto">
            {statusMessage.description}
          </p>

          {orderId && (
            <div className="bg-raised p-3.5 rounded-xl border border-border text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Nomor Pesanan:</span>
                <span className="font-mono font-bold text-text-primary">{orderId}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Beranda</span>
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center text-text-muted text-xs">Memuat status pembayaran...</div>
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  )
}

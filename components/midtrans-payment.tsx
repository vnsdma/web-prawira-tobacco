"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface MidtransPaymentProps {
  token: string
  clientKey: string
  isProduction: boolean
  onSuccess?: (result: any) => void
  onPending?: (result: any) => void
  onError?: (result: any) => void
  onClose?: () => void
}

declare global {
  interface Window {
    snap: any
  }
}

export default function MidtransPayment({
  token,
  clientKey,
  isProduction,
  onSuccess,
  onPending,
  onError,
  onClose,
}: MidtransPaymentProps) {
  const { toast } = useToast()

  useEffect(() => {
    // Load Snap.js script
    const snapUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js"

    const script = document.createElement("script")
    script.src = snapUrl
    script.setAttribute("data-client-key", clientKey)
    script.async = true

    script.onload = () => {
      if (window.snap && token) {
        // Open Snap payment popup
        window.snap.pay(token, {
          onSuccess: (result: any) => {
            console.log("Payment success:", result)
            toast({
              title: "Pembayaran Berhasil",
              description: "Terima kasih! Pesanan Anda sedang diproses.",
            })
            onSuccess?.(result)
          },
          onPending: (result: any) => {
            console.log("Payment pending:", result)
            toast({
              title: "Pembayaran Tertunda",
              description: "Pembayaran Anda sedang diproses. Silakan tunggu konfirmasi.",
            })
            onPending?.(result)
          },
          onError: (result: any) => {
            console.log("Payment error:", result)
            toast({
              title: "Pembayaran Gagal",
              description: "Terjadi kesalahan dalam pembayaran. Silakan coba lagi.",
              variant: "destructive",
            })
            onError?.(result)
          },
          onClose: () => {
            console.log("Payment popup closed")
            toast({
              title: "Pembayaran Dibatalkan",
              description: "Anda menutup halaman pembayaran.",
            })
            onClose?.()
          },
        })
      }
    }

    script.onerror = () => {
      console.error("Failed to load Snap.js")
      toast({
        title: "Error",
        description: "Gagal memuat sistem pembayaran. Silakan refresh halaman.",
        variant: "destructive",
      })
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup script when component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [token, clientKey, isProduction, onSuccess, onPending, onError, onClose, toast])

  return null // This component doesn't render anything visible
}
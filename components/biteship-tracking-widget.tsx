"use client"

import { useState, useEffect } from "react"
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  RotateCw,
  AlertCircle,
  PackageCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { BiteshipTrackingResult } from "@/lib/biteship"

interface BiteshipTrackingWidgetProps {
  orderNumber?: string
  waybillId?: string
  courierCode?: string
  orderStatus?: string
}

export default function BiteshipTrackingWidget({
  orderNumber,
  waybillId,
  courierCode = "jne",
  orderStatus,
}: BiteshipTrackingWidgetProps) {
  const [tracking, setTracking] = useState<BiteshipTrackingResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const { toast } = useToast()

  const activeWaybill = waybillId || `JP${orderNumber?.replace(/\D/g, "").slice(-9) || "982312456"}`

  const fetchTracking = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/biteship/trackings/${encodeURIComponent(activeWaybill)}?courier=${courierCode.toLowerCase()}`
      )
      const data = await res.json()
      if (data && data.success) {
        setTracking(data)
      }
    } catch (err) {
      console.error("Tracking fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTracking()
  }, [activeWaybill, courierCode])

  const copyWaybill = () => {
    navigator.clipboard.writeText(activeWaybill)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
    toast({
      title: "Nomor Resi Disalin!",
      description: `Resi ${activeWaybill} telah disalin ke clipboard.`,
    })
  }

  // Determine stage (0: Created, 1: Picked, 2: In Transit, 3: Delivered)
  const getStageIndex = (status?: string) => {
    switch (status) {
      case "allocated":
        return 0
      case "picking_up":
      case "picked":
        return 1
      case "on_transit":
      case "dropping_off":
        return 2
      case "delivered":
        return 3
      default:
        return 1
    }
  }

  const currentStage = getStageIndex(tracking?.status)

  const STAGES = [
    { label: "Siap Dikirim", desc: "Resi AWB terbit" },
    { label: "Dijemput Kurir", desc: "Paket di-pickup" },
    { label: "Dalam Perjalanan", desc: "Transit antar kota" },
    { label: "Tiba di Tujuan", desc: "Diterima pembeli" },
  ]

  return (
    <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-card via-raised/60 to-card p-4 md:p-5 shadow-sm space-y-4">
      {/* Top Waybill Card Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent/15 text-accent border border-accent/25">
            <Truck size={18} />
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block font-display">
              Pelacakan Pengiriman (Biteship Live AWB)
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono font-bold text-xs md:text-sm text-text-primary tracking-wide">
                {activeWaybill}
              </span>
              <button
                type="button"
                onClick={copyWaybill}
                className="p-1 rounded-md text-text-muted hover:text-accent hover:bg-raised transition-colors"
                title="Salin Nomor Resi"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTracking}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-raised text-xs flex items-center gap-1 transition-all"
            title="Refresh status resi"
          >
            <RotateCw size={13} className={isLoading ? "animate-spin text-accent" : ""} />
            <span className="text-[11px] hidden sm:inline">Perbarui</span>
          </button>

          {tracking?.link && (
            <a
              href={tracking.link}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 px-2.5 rounded-lg bg-accent text-accent-text text-xs font-bold flex items-center gap-1 hover:bg-accent-hover transition-colors shadow-xs"
            >
              <span>Lacak Web</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Progress Milestone Bar */}
      <div className="py-2">
        <div className="grid grid-cols-4 gap-2 relative">
          {STAGES.map((st, idx) => {
            const isCompleted = idx <= currentStage
            const isCurrent = idx === currentStage
            return (
              <div key={idx} className="flex flex-col items-center text-center space-y-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                    isCurrent
                      ? "bg-accent text-accent-text ring-4 ring-accent/20"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-raised border border-border text-text-muted"
                  }`}
                >
                  {isCompleted ? <Check size={13} strokeWidth={3} /> : idx + 1}
                </div>
                <div className="min-w-0">
                  <span
                    className={`text-[10px] sm:text-xs font-bold block truncate ${
                      isCurrent
                        ? "text-accent"
                        : isCompleted
                        ? "text-text-primary"
                        : "text-text-muted"
                    }`}
                  >
                    {st.label}
                  </span>
                  <span className="text-[9px] text-text-muted hidden sm:block truncate">
                    {st.desc}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Latest Status Pill */}
      {tracking?.history && tracking.history.length > 0 && (
        <div className="p-3 rounded-xl bg-card border border-border space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>Status Terkini:</span>
            </span>
            <span className="text-text-muted text-[10px]">
              {new Date(tracking.history[0].updated_at).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-xs text-text-primary font-medium leading-relaxed">
            {tracking.history[0].note}
          </p>
        </div>
      )}

      {/* Toggle View Full Journey History */}
      {tracking?.history && tracking.history.length > 1 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showHistory ? "Sembunyikan" : "Lihat Seluruh Riwayat Perjalanan Paket"}</span>
            {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showHistory && (
            <div className="mt-2.5 pt-2 border-t border-border/80 space-y-2.5 divide-y divide-border/50">
              {tracking.history.map((h, i) => (
                <div key={i} className="pt-2 flex items-start gap-2.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-text-secondary leading-snug">{h.note}</p>
                    <span className="text-[10px] text-text-muted mt-0.5 block">
                      {new Date(h.updated_at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

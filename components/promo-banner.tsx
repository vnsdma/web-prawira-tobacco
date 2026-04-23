"use client"

import { useState, useEffect } from "react"
import { Tag, ArrowRight } from "lucide-react"

interface Promo {
  id: number
  name: string
  code: string
  description: string
  image_url: string | null
  discount_type: string
  discount_value: number
}

export default function PromoBanner() {
  const [promos, setPromos]   = useState<Promo[]>([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    fetch("/api/mobile/promo/active")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setPromos(data))
      .catch(() => {})
  }, [])

  // Fallback static banner when no promos
  const fallback = {
    tag:   "Promo Minggu Ini",
    title: "Diskon 20% Tembakau Pilihan",
    sub:   "Pakai kode: GASKEUN20",
    cta:   "Klaim Sekarang",
  }

  const activeBanner = promos[current]

  return (
    <div className="px-lg">
      <div
        className="promo-banner animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <span
            className="badge badge-soft mb-2"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <Tag size={9} />
            {activeBanner ? activeBanner.name : fallback.tag}
          </span>

          <h2
            className="font-display"
            style={{
              fontSize: "clamp(16px, 4vw, 20px)",
              fontWeight: 700,
              color: "#f0ece5",
              lineHeight: 1.25,
              marginTop: "6px",
              marginBottom: "4px",
            }}
          >
            {activeBanner
              ? activeBanner.description || activeBanner.name
              : fallback.title}
          </h2>

          <p style={{ fontSize: "11px", color: "#8a8070", marginBottom: "12px" }}>
            {activeBanner
              ? `Kode: ${activeBanner.code}`
              : fallback.sub}
          </p>

          <button
            className="btn-primary"
            style={{ fontSize: "12px", padding: "7px 16px" }}
          >
            {fallback.cta}
            <ArrowRight size={12} />
          </button>
        </div>

        {/* Dot indicators when multiple promos */}
        {promos.length > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: "14px",
              right: "16px",
              display: "flex",
              gap: "5px",
              zIndex: 1,
            }}
          >
            {promos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width:        i === current ? "16px" : "6px",
                  height:       "6px",
                  borderRadius: "3px",
                  background:   i === current ? "var(--accent)" : "rgba(200,169,110,0.3)",
                  border:       "none",
                  cursor:       "pointer",
                  transition:   "all 200ms ease",
                  padding:      0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

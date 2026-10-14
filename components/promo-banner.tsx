"use client"

import { useState, useEffect } from "react"
import { Tag, Copy, Check, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const [promos, setPromos] = useState<Promo[]>([])
  const [current, setCurrent] = useState(0)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch("/api/mobile/promo/active")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPromos(data)
        }
      })
      .catch(() => {})
  }, [])

  const fallback = {
    tag: "100% Cukai Resmi & Legal",
    title: "Tembakau Racikan Berpita Cukai Resmi – Timbangan Akurat & Kemasan Kedap Udara",
    code: "PRAWIRA20",
    description: "Timbangan digital presisi dan kemasan zipper kedap udara anti-kering untuk menjaga kesegaran rasa & aroma otentik nusantara.",
  }

  const activeBanner = promos[current]
  const currentTitle = activeBanner ? activeBanner.description || activeBanner.name : fallback.title
  const currentCode = activeBanner ? activeBanner.code : fallback.code
  const currentTag = activeBanner ? activeBanner.name : fallback.tag

  const handleCopyCode = () => {
    if (!currentCode) return
    navigator.clipboard.writeText(currentCode)
    setCopied(true)
    toast({
      title: "Kode Promo Tersalin",
      description: `Gunakan kode ${currentCode} saat checkout.`,
    })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-4 md:px-7">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2c2621] via-[#211d1a] to-[#181512] text-[#f7f5f2] p-5 md:p-7 border border-[#3e3730] shadow-md">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-32 h-32 bg-accent/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-semibold mb-3">
            <Tag size={11} />
            <span>{currentTag}</span>
          </div>

          {/* Heading */}
          <h2 className="font-display text-lg md:text-2xl font-bold tracking-tight text-white mb-2 leading-tight">
            {currentTitle}
          </h2>

          <p className="text-xs md:text-sm text-[#b5ada3] mb-4 line-clamp-2">
            {fallback.description}
          </p>

          {/* CTA & Code snippet */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs font-semibold">
              <span className="text-[#a89f94] text-[11px] font-sans font-normal">Kode:</span>
              <span className="text-accent">{currentCode}</span>
            </div>

            <button
              onClick={handleCopyCode}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-xs font-semibold transition-all duration-200 active:scale-95 shadow-sm"
              aria-label="Salin kode promo"
            >
              {copied ? (
                <>
                  <Check size={13} strokeWidth={2.5} />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Carousel indicator dots */}
        {promos.length > 1 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 z-10">
            {promos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "w-5 bg-accent" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Sparkles, Check, ShoppingBag, Plus, PackageCheck, Zap, Flame, ShieldCheck, ChevronRight } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"

interface StarterFlavor {
  id: string
  productId: number
  name: string
  shortLabel: string
  tasteNote: string
  badgeColor: string
  price: number
}

const STARTER_FLAVORS: StarterFlavor[] = [
  {
    id: "surya-25g",
    productId: 44,
    name: "Linting Surya",
    shortLabel: "Surya Linting",
    tasteNote: "Kretek Manis & Gurih",
    badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    price: 8000,
  },
  {
    id: "mild-25g",
    productId: 29,
    name: "Linting Mild",
    shortLabel: "Mild Linting",
    tasteNote: "Tarikan Halus & Enteng",
    badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    price: 8000,
  },
  {
    id: "samsu-25g",
    productId: 33,
    name: "Linting Samsu",
    shortLabel: "Samsu Linting",
    tasteNote: "Aroma Cengkeh Mantap",
    badgeColor: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
    price: 8000,
  },
  {
    id: "ice-25g",
    productId: 42,
    name: "Purple Ice Burst",
    shortLabel: "Purple Ice Burst",
    tasteNote: "Sensasi Dingin Fruity",
    badgeColor: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
    price: 8000,
  },
]

export default function StarterKitBanner() {
  const { addMultipleItems } = useCart()
  const { toast } = useToast()
  const [selectedFlavorIdx, setSelectedFlavorIdx] = useState(0)
  const [justAdded, setJustAdded] = useState(false)

  const selectedFlavor = STARTER_FLAVORS[selectedFlavorIdx]

  // Bundle Total: Tembakau 25g (8k) + Papir 1 Pak (2k) + Busa Kecil (5k) + Lem (3k) = 18k
  const bundleItems = [
    { name: `Tembakau ${selectedFlavor.shortLabel} 25gr`, packaging: "Pouch Ziplock Kedap Udara", price: 8000 },
    { name: "Kertas Papir Premium", packaging: "1 Pak (Standar)", price: 2000 },
    { name: "Busa Filter Regular", packaging: "1 Bungkus Kecil (50 pcs)", price: 5000 },
    { name: "Lem Kertas Tingwe", packaging: "1 Botol Khusus", price: 3000 },
  ]

  const totalPrice = bundleItems.reduce((acc, curr) => acc + curr.price, 0)

  const handleAddStarterKit = () => {
    addMultipleItems([
      {
        id: `${selectedFlavor.productId}-25g`,
        productId: selectedFlavor.productId,
        name: `${selectedFlavor.name} (25gr - Tester Ziplock)`,
        price: 8000,
        image: "/images/accessories.png",
        weight: 35,
        variant: "25gr - Tester Ziplock",
      },
      {
        id: "addon-papir-1pak",
        productId: 48,
        name: "Kertas Papir Premium (1 Pak)",
        price: 2000,
        image: "/images/accessories.png",
        weight: 15,
        variant: "1 Pak",
      },
      {
        id: "addon-busa-kecil",
        productId: 46,
        name: "Busa Filter Regular (Bungkus Kecil)",
        price: 5000,
        image: "/images/accessories.png",
        weight: 25,
        variant: "Bungkus Kecil",
      },
      {
        id: "addon-lem-standar",
        productId: 49,
        name: "Lem Kertas Tingwe (1 Botol)",
        price: 3000,
        image: "/images/accessories.png",
        weight: 20,
        variant: "1 Botol",
      },
    ])

    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1500)

    toast({
      title: "Starter Kit Berhasil Ditambahkan! 🎒",
      description: `${selectedFlavor.shortLabel} 25g Ziplock + Paket Alat Linting Lengkap siap di keranjang.`,
    })
  }

  return (
    <div className="px-4 md:px-7 py-2">
      <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-accent/10 p-5 md:p-6 shadow-md">
        {/* Glow Accent Circles */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* Left Text & Highlight */}
          <div className="space-y-3 max-w-xl">
            {/* Top Youth Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs tracking-wide uppercase">
                <Zap size={13} className="text-emerald-500" />
                <span>Starter Kit Anak Kost / Pemula</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-muted bg-raised px-2.5 py-0.5 rounded-full border border-border">
                🎒 Modal Receh • Langsung Siap Linting
              </span>
            </div>

            <div>
              <h2 className="font-display font-extrabold text-lg md:text-2xl text-text-primary tracking-tight leading-snug">
                Baru Coba Tingwe? <span className="text-accent underline decoration-accent/40 underline-offset-4">Gak Perlu Pusing Beli Alat Terpisah!</span>
              </h2>
              <p className="text-xs md:text-sm text-text-secondary mt-1 leading-relaxed">
                Paket all-in-one hemat modal belasan ribu. Dapet <strong className="text-text-primary">Tembakau Tester 25gr Kemasan Pouch Ziplock Kedap Udara</strong> + <strong className="text-text-primary">Paket Lengkap Alat Linting</strong>. Buka paket langsung bisa ngelinting di kost atau tongkrongan!
              </p>
            </div>

            {/* Flavor Selector Pills */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block font-display">
                Pilih Varian Tembakau Ziplock Kamu:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STARTER_FLAVORS.map((f, idx) => {
                  const isSelected = selectedFlavorIdx === idx
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFlavorIdx(idx)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/15 shadow-sm ring-1 ring-emerald-500"
                          : "border-border bg-card/80 hover:bg-raised text-text-secondary"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-display font-bold text-xs text-text-primary truncate">
                          {f.shortLabel}
                        </span>
                        {isSelected && <Check size={12} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" strokeWidth={3} />}
                      </div>
                      <span className="text-[10px] text-text-muted line-clamp-1">
                        {f.tasteNote}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Included Items Badges */}
            <div className="pt-1.5">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                Isi Paket Lengkap Dalam Box:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {bundleItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-raised/70 border border-border/80 flex flex-col justify-between"
                  >
                    <span className="font-semibold text-text-primary line-clamp-1">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-text-muted line-clamp-1 mt-0.5">
                      {item.packaging}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Perks Line */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-text-secondary font-medium">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check size={13} strokeWidth={2.5} /> Ziplock Kedap Udara (Anti Kering)
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={13} strokeWidth={2.5} /> Cukai Resmi &amp; Timbangan Pas
              </span>
              <span className="inline-flex items-center gap-1 text-accent">
                <Flame size={13} /> Pas 30-40 Linting
              </span>
            </div>

            {/* Quick Link to Cara Melinting Guide */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("cara-melinting")
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent hover:underline cursor-pointer bg-accent/10 px-3 py-1.5 rounded-xl border border-accent/25 hover:bg-accent/20 transition-all"
              >
                <span>📖 Butuh tutorial cara melinting tiap alat? Klik lihat panduan lengkap di bawah</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Right Card / 1-Click Buy CTA Box */}
          <div className="w-full lg:w-auto lg:min-w-[280px] flex-shrink-0 bg-card/95 border-2 border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg text-center sm:text-left">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-display">
                  Paket All-In-One Siap Linting
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  Hemat Akhir Bulan
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-center sm:justify-start gap-2">
                <span className="font-display font-extrabold text-3xl text-accent">
                  Rp18.000
                </span>
                <span className="text-xs text-text-muted line-through">
                  Rp22.000
                </span>
              </div>

              <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                Tembakau {selectedFlavor.shortLabel} 25g + Papir + Filter + Lem. Bobot ringan (hanya 95g), bebas boncos ongkir!
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleAddStarterKit}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
                  justAdded
                    ? "bg-emerald-600 text-white"
                    : "bg-accent hover:bg-accent-hover text-accent-text"
                }`}
              >
                {justAdded ? (
                  <>
                    <Check size={16} strokeWidth={3} />
                    <span>Masuk Keranjang!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>Sikat Starter Kit Ini (1-Klik)</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-text-muted text-center">
                ✨ Siap kirim via Kurir Lokal (Rp 5.000), Ambil Toko (Rp 0), atau Ekspedisi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

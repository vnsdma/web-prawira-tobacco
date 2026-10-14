"use client"

import { Truck, ShieldCheck, Clock, Award } from "lucide-react"

const BENEFITS = [
  { icon: Truck,       title: "Gratis Ongkir",   desc: "Min. belanja Rp100rb" },
  { icon: ShieldCheck, title: "100% Asli",       desc: "Garansi kualitas kurasi" },
  { icon: Clock,       title: "Kirim Cepat",     desc: "Proses di hari yang sama" },
  { icon: Award,       title: "Pelanggan Setia", desc: "Poin & promo berkala" },
]

export default function PromoChips() {
  return (
    <div className="h-scroll mt-3 pb-1">
      {BENEFITS.map(({ icon: Icon, title, desc }) => (
        <div
          key={title}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card border border-border hover:border-accent/40 transition-colors duration-200 cursor-default"
        >
          <div className="w-7 h-7 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 text-accent">
            <Icon size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-text-primary leading-tight font-display">
              {title}
            </span>
            <span className="text-[10px] text-text-muted leading-tight">
              {desc}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

import { Sparkles, MessageCircle, Wind, ThermometerSnowflake, Flame } from "lucide-react"
import { getTobaccoProfile } from "@/lib/tobacco-profiles"
import { getProductTasteInquiryLink } from "@/lib/whatsapp"

interface TobaccoTasteProfileProps {
  product: {
    name: string
    category: string
    description?: string | null
  }
}

function MeterBar({ score, max = 5, colorClass = "bg-accent" }: { score: number; max?: number; colorClass?: string }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < score
        return (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-xs transition-all ${
              isFilled ? colorClass : "bg-raised border border-border/60"
            }`}
          />
        )
      })}
    </div>
  )
}

export default function TobaccoTasteProfile({ product }: TobaccoTasteProfileProps) {
  const profile = getTobaccoProfile(product)

  if (!profile) return null

  const waLink = getProductTasteInquiryLink(product.name)

  return (
    <div className="rounded-xl border border-accent/25 bg-raised/40 p-3 sm:p-3.5 space-y-2.5">
      {/* Title */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center text-accent">
            <Sparkles size={12} />
          </div>
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-text-primary">
            Karakter &amp; Profil Rasa
          </h3>
        </div>
        {profile.badgeTag && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-accent text-accent-text">
            {profile.badgeTag}
          </span>
        )}
      </div>

      {/* Visual Meters Grid (Compact 3-columns across mobile & desktop) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
        {/* Throat Hit */}
        <div className="bg-card border border-border/80 rounded-lg p-2 sm:p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
            <span className="text-text-muted flex items-center gap-1 truncate">
              <Wind size={11} className="text-accent flex-shrink-0" />
              <span className="truncate">Tarikan</span>
            </span>
            <span className="font-semibold text-text-primary truncate ml-1">{profile.throatHit}</span>
          </div>
          <MeterBar score={profile.throatHitScore} max={5} colorClass="bg-amber-600" />
        </div>

        {/* Aroma Intensity */}
        <div className="bg-card border border-border/80 rounded-lg p-2 sm:p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
            <span className="text-text-muted flex items-center gap-1 truncate">
              <Flame size={11} className="text-accent flex-shrink-0" />
              <span className="truncate">Aroma</span>
            </span>
            <span className="font-semibold text-text-primary truncate ml-1" title={profile.aroma}>
              {profile.aroma}
            </span>
          </div>
          <MeterBar score={profile.aromaScore} max={5} colorClass="bg-accent" />
        </div>

        {/* Cooling Effect */}
        <div className="bg-card border border-border/80 rounded-lg p-2 sm:p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
            <span className="text-text-muted flex items-center gap-1 truncate">
              <ThermometerSnowflake size={11} className="text-sky-500 flex-shrink-0" />
              <span className="truncate">Dingin</span>
            </span>
            <span className="font-semibold text-text-primary truncate ml-1">{profile.cooling}</span>
          </div>
          <MeterBar score={profile.coolingScore} max={5} colorClass="bg-sky-500" />
        </div>
      </div>

      {/* Flavor Notes Tags */}
      {profile.notes && profile.notes.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">
            Catatan Karakter Rasa:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {profile.notes.map((note, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-md bg-card border border-border text-text-secondary font-medium"
              >
                #{note}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Direct WhatsApp Consultation Helper */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
        <span className="text-[11px] text-text-muted">
          Ragu dengan karakternya? Tanyakan langsung detail racikan ini.
        </span>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex-shrink-0 hover:underline"
        >
          <MessageCircle size={13} />
          <span>Tanya via WA &rarr;</span>
        </a>
      </div>
    </div>
  )
}

"use client"

import { Truck, Zap, Star } from "lucide-react"

const CHIPS = [
  { icon: Truck,  label: "Gratis ongkir >Rp100rb" },
  { icon: Zap,    label: "Flash sale 17:00" },
  { icon: Star,   label: "Member extra 5%" },
]

export default function PromoChips() {
  return (
    <div
      className="h-scroll mt-3 pb-1"
      style={{ gap: "8px" }}
    >
      {CHIPS.map(({ icon: Icon, label }) => (
        <div
          key={label}
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "7px",
            padding:      "7px 12px",
            borderRadius: "var(--r-md)",
            background:   "var(--bg-card)",
            border:       "1px solid var(--border)",
            cursor:       "pointer",
            whiteSpace:   "nowrap",
            transition:   "border-color 200ms ease",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent-border)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")
          }
        >
          <span
            style={{
              width:          "18px",
              height:         "18px",
              borderRadius:   "5px",
              background:     "var(--accent-muted)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
            }}
          >
            <Icon size={10} style={{ color: "var(--accent)" }} />
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

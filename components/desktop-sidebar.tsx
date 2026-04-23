"use client"

import { Home, LayoutGrid, Package, User, Sun, Moon, Tag } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"

interface DesktopSidebarProps {
  activeTab:    string
  onTabChange:  (tab: string) => void
}

const NAV_ITEMS = [
  { id: "home",    label: "Beranda",  icon: Home },
  { id: "catalog", label: "Katalog",  icon: LayoutGrid },
  { id: "orders",  label: "Pesanan",  icon: Package },
  { id: "profile", label: "Profil",   icon: User },
]

export default function DesktopSidebar({ activeTab, onTabChange }: DesktopSidebarProps) {
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const { getTotalItems }   = useCart()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = theme === "dark"

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        PRAWIRA<em>.</em>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-item ${activeTab === id ? "active" : ""}`}
            onClick={() => onTabChange(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {id === "orders" && getTotalItems() > 0 && (
              <span
                className="badge badge-accent"
                style={{ marginLeft: "auto", fontSize: "9px", padding: "1px 6px" }}
              >
                {getTotalItems()}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Promo teaser */}
        <div
          style={{
            background:   "var(--accent-muted)",
            border:       "1px solid var(--accent-border)",
            borderRadius: "var(--r-md)",
            padding:      "12px",
            display:      "flex",
            gap:          "8px",
            alignItems:   "flex-start",
          }}
        >
          <Tag size={14} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-display)" }}>
              Promo aktif
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              Diskon 20% tembakau pilihan
            </p>
          </div>
        </div>

        {/* User info */}
        {isAuthenticated && user && (
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "10px",
              padding:    "10px 12px",
              borderRadius: "var(--r-md)",
              background: "var(--bg-raised)",
            }}
          >
            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-display)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name}
              </p>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        {mounted && (
          <button
            className="sidebar-item"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            style={{ justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              <span>{isDark ? "Mode Terang" : "Mode Gelap"}</span>
            </div>
            <div className={`theme-toggle ${isDark ? "on" : ""}`} style={{ pointerEvents: "none" }}>
              <div className="theme-toggle-knob" />
            </div>
          </button>
        )}
      </div>
    </aside>
  )
}

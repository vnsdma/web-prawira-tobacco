"use client"

import { Home, LayoutGrid, User, Sun, Moon, Sparkles, BookOpen } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import Logo from "@/components/logo"

interface DesktopSidebarProps {
  activeTab:    string
  onTabChange:  (tab: string) => void
}

const NAV_ITEMS = [
  { id: "home",    label: "Beranda", icon: Home },
  { id: "catalog", label: "Katalog", icon: LayoutGrid },
  { id: "profile", label: "Akun",    icon: User },
]

export default function DesktopSidebar({ activeTab, onTabChange }: DesktopSidebarProps) {
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = theme === "dark"

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="mb-6 px-2">
        <div className="sidebar-logo p-0 mb-1 flex items-center gap-2">
          <Logo size={26} className="text-accent flex-shrink-0" />
          <div className="flex items-center">
            <span>PRAWIRA</span>
            <em>.</em>
          </div>
        </div>
        <p className="text-[11px] font-medium text-text-muted tracking-wider uppercase">
          Artisan Tobacco Store
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              className={`sidebar-item ${isActive ? "active" : ""}`}
              onClick={() => onTabChange(id)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={17} className={isActive ? "text-accent" : "text-text-muted"} />
              <span className="flex-1 text-left">{label}</span>
            </button>
          )
        })}

        {/* Quick Shortcut to Cara Melinting Guide */}
        <button
          type="button"
          onClick={() => {
            if (activeTab !== "home") onTabChange("home")
            setTimeout(() => {
              document.getElementById("cara-melinting")?.scrollIntoView({ behavior: "smooth" })
            }, 100)
          }}
          className="sidebar-item hover:text-accent group text-text-secondary cursor-pointer"
        >
          <BookOpen size={17} className="text-text-muted group-hover:text-accent" />
          <span className="flex-1 text-left">Cara Melinting</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent/15 text-accent font-bold">
            Panduan
          </span>
        </button>
      </nav>

      {/* Footer Area */}
      <div className="mt-auto space-y-3 pt-4 border-t border-border">
        {/* User Card */}
        {isAuthenticated && user ? (
          <button
            type="button"
            onClick={() => onTabChange("profile")}
            className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl bg-raised border border-border/80 hover:border-accent/40 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-accent-muted text-accent font-display font-bold text-xs flex items-center justify-center flex-shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text-primary truncate font-display">
                {user.name}
              </p>
              <p className="text-[10px] text-text-muted truncate">
                {user.email}
              </p>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onTabChange("profile")}
            className="w-full text-left p-3 rounded-xl bg-accent-muted/40 border border-accent-border/50 hover:bg-accent-muted/60 transition-colors block"
          >
            <div className="flex items-center gap-1.5 text-accent text-xs font-semibold mb-1">
              <Sparkles size={12} />
              <span>Masuk / Lacak Pesanan</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Login untuk melihat riwayat atau lacak pesanan sebagai tamu.
            </p>
          </button>
        )}

        {/* Theme Mode Switcher (Zero CLS placeholder during hydration) */}
        {mounted ? (
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-card hover:bg-raised border border-border transition-colors text-xs font-medium text-text-secondary"
            aria-label="Ganti mode tampilan"
          >
            <div className="flex items-center gap-2.5">
              {isDark ? <Sun size={15} className="text-accent" /> : <Moon size={15} className="text-accent" />}
              <span>{isDark ? "Mode Terang" : "Mode Gelap"}</span>
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${isDark ? "bg-accent" : "bg-border-strong"}`}>
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isDark ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </button>
        ) : (
          <div className="h-[42px] w-full" aria-hidden="true" />
        )}
      </div>
    </aside>
  )
}

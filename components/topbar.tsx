"use client"

import { useState, useEffect } from "react"
import {
  Home,
  LayoutGrid,
  Sun,
  Moon,
  Search,
  X,
  ShoppingBag,
  PackageSearch,
  BookOpen,
  Smartphone,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import CartSheet from "@/components/cart-sheet"
import Logo from "@/components/logo"
import { APK_CONFIG } from "@/lib/apk-config"

interface TopbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export default function Topbar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const { getTotalItems } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = theme === "dark"
  const totalItems = getTotalItems()

  const handleNavClick = (tab: string) => {
    onTabChange(tab)
    if (tab === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleGuideClick = () => {
    if (activeTab !== "home") {
      onTabChange("home")
    }
    setTimeout(() => {
      document.getElementById("cara-melinting")?.scrollIntoView({ behavior: "smooth" })
    }, 120)
  }

  return (
    <header className="page-header">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 md:gap-5">
        {/* ── Left: Brand Identity ── */}
        <div
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2 cursor-pointer flex-shrink-0 select-none group"
        >
          <Logo size={26} className="text-accent flex-shrink-0 transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <div className="flex items-center leading-none">
              <span className="font-display font-extrabold text-lg md:text-xl tracking-tight text-text-primary">
                PRAWIRA
              </span>
              <span className="text-accent font-extrabold text-xl leading-none">.</span>
            </div>
            <span className="text-[9.5px] font-semibold text-text-muted tracking-wider uppercase hidden sm:block">
              Artisan Tobacco Store
            </span>
          </div>
        </div>

        {/* ── Center: Desktop Navigation Links ── */}
        <nav className="hidden lg:flex items-center gap-1 bg-raised/80 p-1 rounded-xl border border-border flex-shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick("home")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "home"
                ? "bg-accent text-accent-text shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-card"
            }`}
          >
            <Home size={14} />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick("catalog")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "catalog"
                ? "bg-accent text-accent-text shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-card"
            }`}
          >
            <LayoutGrid size={14} />
            <span>Katalog</span>
          </button>

          <button
            type="button"
            onClick={handleGuideClick}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-accent hover:bg-card flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <BookOpen size={14} />
            <span>Panduan Linting</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent/15 text-accent font-bold uppercase">
              Tips
            </span>
          </button>
        </nav>

        {/* ── Center-Right: Responsive Desktop Search Bar ── */}
        <div className="hidden md:flex search-wrap flex-1 max-w-md">
          <Search size={15} className="search-icon" />
          <input
            className="input-base text-xs"
            placeholder="Cari tembakau linting, cerutu, papir, filter..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              aria-label="Bersihkan pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Right: User Account, Theme Switcher & Cart ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Direct Download APK CTA in Topbar (Minimalist & Non-Intrusive) */}
          <a
            href={APK_CONFIG.downloadUrl}
            download={APK_CONFIG.fileName}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer touch-manipulation"
            title={`Unduh Aplikasi Android Prawira (${APK_CONFIG.fileName})`}
          >
            <Smartphone size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xs:inline">Unduh APK</span>
            <span className="xs:hidden">APK</span>
          </a>

          {/* Track Order / Account CTA */}
          <button
            type="button"
            onClick={() => onTabChange("profile")}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              activeTab === "profile"
                ? "bg-accent text-accent-text border-accent shadow-xs"
                : "bg-card border-border hover:border-accent text-text-secondary hover:text-accent"
            }`}
            title={isAuthenticated && user ? `Akun: ${user.name}` : "Lacak Pesanan Tamu / Riwayat"}
          >
            {isAuthenticated && user ? (
              <>
                <div className="w-4 h-4 rounded-full bg-accent/20 text-accent font-bold text-[10px] flex items-center justify-center">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="max-w-[100px] truncate">{user.name || "Akun"}</span>
              </>
            ) : (
              <>
                <PackageSearch size={14} />
                <span>Lacak Pesanan</span>
              </>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            className="icon-btn"
            onClick={() => mounted && setTheme(isDark ? "light" : "dark")}
            aria-label="Ganti mode tema"
            title={mounted ? (isDark ? "Mode Terang" : "Mode Gelap") : "Ganti tema"}
            disabled={!mounted}
          >
            {mounted ? (
              isDark ? <Sun size={16} className="text-accent" /> : <Moon size={16} className="text-accent" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-border/50 inline-block" />
            )}
          </button>

          {/* Cart Drawer Trigger */}
          <CartSheet>
            <button className="icon-btn" aria-label="Keranjang Belanja">
              <ShoppingBag size={16} />
              {totalItems > 0 && (
                <span className="notif-dot">{totalItems}</span>
              )}
            </button>
          </CartSheet>
        </div>
      </div>
    </header>
  )
}

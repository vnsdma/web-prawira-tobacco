"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Search, Bell, Sun, Moon, Package, User, LayoutGrid, Home, Tag, ChevronRight, Plus, Flame, Sparkles } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "next-themes"
import CartSheet from "@/components/cart-sheet"
import ProductGrid from "@/components/product-grid"
import CategoryFilter from "@/components/category-filter"
import PromoBanner from "@/components/promo-banner"
import PromoChips from "@/components/promo-chips"
import DesktopSidebar from "@/components/desktop-sidebar"

export default function HomePage() {
  const [searchQuery, setSearchQuery]       = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab]           = useState("home")
  const [searchFocused, setSearchFocused]   = useState(false)
  const { getTotalItems }                   = useCart()
  const { user, isAuthenticated }           = useAuth()
  const { theme, setTheme }                 = useTheme()
  const [mounted, setMounted]               = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isDark = theme === "dark"

  return (
    <div className="app-shell">

      {/* ── Desktop sidebar ── */}
      <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Main content ── */}
      <main className="main-content">

        {/* ═══ HOME TAB ═══════════════════════════════════════════ */}
        {activeTab === "home" && (
          <>
            {/* Page header */}
            <header className="page-header">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Mobile logo */}
                <span
                  className="font-display font-bold text-lg tracking-tight leading-none md:hidden"
                  style={{ color: "var(--text-primary)" }}
                >
                  PRAWIRA<span style={{ color: "var(--accent)" }}>.</span>
                </span>

                {/* Desktop search in header */}
                <div className="hidden md:flex search-wrap flex-1 max-w-sm">
                  <Search
                    size={14}
                    className="search-icon"
                  />
                  <input
                    className="input-base"
                    placeholder="Cari produk tembakau..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Dark mode toggle */}
                {mounted && (
                  <button
                    className="icon-btn"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    aria-label="Toggle theme"
                  >
                    {isDark
                      ? <Sun size={15} />
                      : <Moon size={15} />
                    }
                  </button>
                )}

                {/* Notification */}
                <button className="icon-btn">
                  <Bell size={15} />
                </button>

                {/* Cart */}
                <CartSheet>
                  <button className="icon-btn" aria-label="Keranjang">
                    <ShoppingCart size={15} />
                    {getTotalItems() > 0 && (
                      <span className="notif-dot">{getTotalItems()}</span>
                    )}
                  </button>
                </CartSheet>
              </div>
            </header>

            {/* Mobile search */}
            <div className="px-lg pb-0 pt-3 md:hidden">
              <div className="search-wrap">
                <Search size={14} className="search-icon" />
                <input
                  className="input-base"
                  placeholder="Cari produk tembakau..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>
            </div>

            {/* Promo banner */}
            <div className="mt-3">
              <PromoBanner />
            </div>

            {/* Promo chips */}
            <PromoChips />

            {/* Category filter */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            {/* Featured products header */}
            <div className="section-header mt-1">
              <span className="section-title">
                {selectedCategory === "all"
                  ? "Semua Produk"
                  : selectedCategory === "cigarettes"
                  ? "Rokok"
                  : selectedCategory === "tobacco"
                  ? "Tembakau"
                  : "Aksesoris"}
              </span>
              <span className="section-link flex items-center gap-1">
                Filter <ChevronRight size={12} />
              </span>
            </div>

            {/* Product grid */}
            <ProductGrid
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
            />
          </>
        )}

        {/* ═══ CATALOG TAB ════════════════════════════════════════ */}
        {activeTab === "catalog" && (
          <>
            <header className="page-header">
              <span className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
                Katalog
              </span>
              {mounted && (
                <button
                  className="icon-btn"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              )}
            </header>

            <div className="px-lg pt-3">
              <div className="search-wrap">
                <Search size={14} className="search-icon" />
                <input
                  className="input-base"
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            <div className="section-header mt-1">
              <span className="section-title">
                {selectedCategory === "all" ? "Semua Produk" : selectedCategory}
              </span>
            </div>

            <ProductGrid
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
            />
          </>
        )}

        {/* ═══ ORDERS TAB ═════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <>
            <header className="page-header">
              <span className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
                Pesanan Saya
              </span>
              {mounted && (
                <button
                  className="icon-btn"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              )}
            </header>
            {/* OrderHistory lazy import to keep chunk small */}
            <OrderHistorySection />
          </>
        )}

        {/* ═══ PROFILE TAB ════════════════════════════════════════ */}
        {activeTab === "profile" && (
          <>
            <header className="page-header">
              <span className="font-display font-bold text-base" style={{ color: "var(--text-primary)" }}>
                {isAuthenticated ? "Profil" : "Masuk"}
              </span>
              {mounted && (
                <button
                  className="icon-btn"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              )}
            </header>
            <ProfileSection />
          </>
        )}

      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="bottom-nav md:hidden">
        <button
          className={`nav-item ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
        >
          <Home size={18} />
          <span>Beranda</span>
        </button>

        <button
          className={`nav-item ${activeTab === "catalog" ? "active" : ""}`}
          onClick={() => setActiveTab("catalog")}
        >
          <LayoutGrid size={18} />
          <span>Katalog</span>
        </button>

        <button
          className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <Package size={18} />
          <span>Pesanan</span>
        </button>

        <button
          className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <User size={18} />
          <span>Profil</span>
        </button>
      </nav>

    </div>
  )
}

/* ─── Lazy section components (avoid circular imports) ────────── */
function OrderHistorySection() {
  const OrderHistory = require("@/components/order-history").default
  return <OrderHistory />
}

function ProfileSection() {
  const ProfileSectionComponent = require("@/components/profile-section").default
  return <ProfileSectionComponent />
}

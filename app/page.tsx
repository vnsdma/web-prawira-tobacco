"use client"

import { useState, useEffect } from "react"
import { ShoppingBag, Search, Sun, Moon, User, LayoutGrid, Home, X, PackageSearch } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useTheme } from "next-themes"
import CartSheet from "@/components/cart-sheet"
import ProductGrid from "@/components/product-grid"
import CategoryFilter from "@/components/category-filter"
import PromoBanner from "@/components/promo-banner"
import PromoChips from "@/components/promo-chips"
import StarterKitBanner from "@/components/starter-kit-banner"
import HowToRollSection from "@/components/how-to-roll-section"
import DesktopSidebar from "@/components/desktop-sidebar"
import ProfileSection from "@/components/profile-section"
import SeoContentSection from "@/components/seo-content-section"
import Logo from "@/components/logo"

export default function HomePage() {
  const [searchQuery, setSearchQuery]           = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab]               = useState("home")
  const { getTotalItems }                       = useCart()
  const { theme, setTheme }                     = useTheme()
  const [mounted, setMounted]                   = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = theme === "dark"

  return (
    <div className="app-shell">
      {/* ── Desktop Sidebar ── */}
      <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Main Content Area ── */}
      <main className="main-content">

        {/* ═══ HOME TAB ═══════════════════════════════════════════ */}
        {activeTab === "home" && (
          <>
            {/* Sticky Header */}
            <header className="page-header">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Mobile Brand Logo */}
                <div className="flex items-center gap-1.5 md:hidden">
                  <Logo size={22} className="text-accent flex-shrink-0" />
                  <div className="flex items-center">
                    <span className="font-display font-bold text-lg tracking-tight text-text-primary">
                      PRAWIRA
                    </span>
                    <span className="text-accent font-bold text-xl leading-none">.</span>
                  </div>
                </div>

                {/* Desktop Search Bar */}
                <div className="hidden md:flex search-wrap flex-1 max-w-md">
                  <Search size={15} className="search-icon" />
                  <input
                    className="input-base text-xs"
                    placeholder="Cari tembakau, rokok, cerutu, pipa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Track Order Quick Button */}
                <button
                  onClick={() => setActiveTab("profile")}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-accent text-xs font-medium text-text-secondary hover:text-accent transition-colors bg-card"
                  title="Lacak Pesanan Tamu / Riwayat"
                >
                  <PackageSearch size={14} />
                  <span>Lacak Pesanan</span>
                </button>

                {/* Theme Toggle (Zero CLS placeholder during hydration) */}
                {mounted ? (
                  <button
                    className="icon-btn"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    aria-label="Ganti tema tampilan"
                    title={isDark ? "Mode Terang" : "Mode Gelap"}
                  >
                    {isDark ? <Sun size={16} className="text-accent" /> : <Moon size={16} className="text-accent" />}
                  </button>
                ) : (
                  <div className="w-[36px] h-[36px]" aria-hidden="true" />
                )}

                {/* Cart Trigger */}
                <CartSheet>
                  <button className="icon-btn" aria-label="Keranjang Belanja">
                    <ShoppingBag size={16} />
                    {getTotalItems() > 0 && (
                      <span className="notif-dot">{getTotalItems()}</span>
                    )}
                  </button>
                </CartSheet>
              </div>
            </header>

            {/* Mobile Search Bar */}
            <div className="px-4 pt-3 md:hidden">
              <div className="search-wrap">
                <Search size={15} className="search-icon" />
                <input
                  className="input-base text-xs"
                  placeholder="Cari tembakau pilihan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* SEO Authoritative H1 Heading */}
            <div className="px-4 md:px-7 pt-3 pb-1">
              <h1 className="font-display font-bold text-base md:text-xl text-text-primary tracking-tight hidden md:block">
                Jual Tembakau Linting Nusantara &amp; Perlengkapan Tingwe Terlengkap
              </h1>
              <p className="text-xs text-text-muted mt-0.5 max-w-2xl hidden sm:block">
                Pusat beli tembakau iris aromatik, cerutu, papir &amp; aksesoris linting dewe original dengan pengiriman aman ke seluruh Indonesia.
              </p>
            </div>

            {/* Editorial Hero Promo Banner */}
            <div className="mt-2">
              <PromoBanner />
            </div>

            {/* Benefit Trust Chips */}
            <PromoChips />

            {/* Dedicated Section: Starter Kit Anak Kost / Pemula */}
            <StarterKitBanner />

            {/* Category Filter Pills */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            {/* Section Header */}
            <div className="section-header mt-2">
              <div className="flex items-center gap-2">
                <span className="section-title">
                  {selectedCategory === "all"
                    ? "Koleksi Tembakau & Produk Pilihan"
                    : selectedCategory === "kretek"
                    ? "Koleksi Kretek Manis & Mantap"
                    : selectedCategory === "mild"
                    ? "Koleksi Tarikan Halus / Mild"
                    : selectedCategory === "ice"
                    ? "Koleksi Sensasi Dingin / Mint Berry"
                    : selectedCategory === "accessories"
                    ? "Kertas Papir & Busa Filter"
                    : "Koleksi Produk Terpilih"}
                </span>
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  Reset Pencarian
                </button>
              )}
            </div>

            {/* Product Grid */}
            <ProductGrid
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
            />

            {/* Interactive How to Roll (Cara Melinting) Section */}
            <HowToRollSection />

            {/* SEO Informational & FAQ Section */}
            <SeoContentSection />
          </>
        )}

        {/* ═══ CATALOG TAB ════════════════════════════════════════ */}
        {activeTab === "catalog" && (
          <>
            <header className="page-header">
              <h1 className="font-display font-bold text-base text-text-primary">
                Katalog Produk
              </h1>
              <div className="flex items-center gap-2">
                {mounted ? (
                  <button
                    className="icon-btn"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    aria-label="Ganti mode tampilan"
                  >
                    {isDark ? <Sun size={16} className="text-accent" /> : <Moon size={16} className="text-accent" />}
                  </button>
                ) : (
                  <div className="w-[36px] h-[36px]" aria-hidden="true" />
                )}
                <CartSheet>
                  <button className="icon-btn" aria-label="Keranjang Belanja">
                    <ShoppingBag size={16} />
                    {getTotalItems() > 0 && (
                      <span className="notif-dot">{getTotalItems()}</span>
                    )}
                  </button>
                </CartSheet>
              </div>
            </header>

            <div className="px-4 md:px-7 pt-4 md:hidden">
              <div className="search-wrap max-w-xl">
                <Search size={15} className="search-icon" />
                <input
                  className="input-base text-xs"
                  placeholder="Cari semua katalog produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            <div className="section-header mt-2">
              <span className="section-title">
                Semua Produk ({selectedCategory === "all" ? "Semua" : selectedCategory})
              </span>
            </div>

            <ProductGrid
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
            />
          </>
        )}

        {/* ═══ PROFILE & ORDER TRACKING TAB ═══════════════════════ */}
        {activeTab === "profile" && (
          <>
            <header className="page-header">
              <h1 className="font-display font-bold text-base text-text-primary">
                Akun & Lacak Pesanan
              </h1>
              <div className="flex items-center gap-2">
                {mounted ? (
                  <button
                    className="icon-btn"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    aria-label="Ganti mode"
                  >
                    {isDark ? <Sun size={16} className="text-accent" /> : <Moon size={16} className="text-accent" />}
                  </button>
                ) : (
                  <div className="w-[36px] h-[36px]" aria-hidden="true" />
                )}
                <CartSheet>
                  <button className="icon-btn" aria-label="Keranjang Belanja">
                    <ShoppingBag size={16} />
                    {getTotalItems() > 0 && (
                      <span className="notif-dot">{getTotalItems()}</span>
                    )}
                  </button>
                </CartSheet>
              </div>
            </header>

            <ProfileSection />
          </>
        )}
      </main>

      {/* ── Mobile Bottom Navigation Bar (Home, Catalog, Profile) ── */}
      <nav className="bottom-nav" aria-label="Navigasi Utama">
        <button
          type="button"
          className={`nav-item ${activeTab === "home" ? "active" : ""}`}
          onClick={() => setActiveTab("home")}
          aria-label="Beranda"
        >
          <Home size={19} />
          <span>Beranda</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "catalog" ? "active" : ""}`}
          onClick={() => setActiveTab("catalog")}
          aria-label="Katalog"
        >
          <LayoutGrid size={19} />
          <span>Katalog</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
          aria-label="Akun"
        >
          <User size={19} />
          <span>Akun</span>
        </button>
      </nav>
    </div>
  )
}

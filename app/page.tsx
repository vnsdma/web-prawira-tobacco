"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import ProductGrid from "@/components/product-grid"
import CategoryFilter from "@/components/category-filter"
import PromoBanner from "@/components/promo-banner"
import PromoChips from "@/components/promo-chips"
import StarterKitBanner from "@/components/starter-kit-banner"
import HowToRollSection from "@/components/how-to-roll-section"
import Topbar from "@/components/topbar"
import ProfileSection from "@/components/profile-section"
import SeoContentSection from "@/components/seo-content-section"
import { Home, LayoutGrid, User } from "lucide-react"

export default function HomePage() {
  const [searchQuery, setSearchQuery]           = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeTab, setActiveTab]               = useState("home")

  return (
    <div className="app-shell">
      {/* ── Topbar (Desktop Navigation & Mobile Header) ── */}
      <Topbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── Main Content Area ── */}
      <main className="main-content">

        {/* ═══ HOME TAB ═══════════════════════════════════════════ */}
        {activeTab === "home" && (
          <>
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
                    aria-label="Bersihkan pencarian"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* SEO Authoritative H1 Heading */}
            <div className="px-4 md:px-7 pt-4 pb-1">
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
            {/* Mobile Search Bar */}
            <div className="px-4 pt-3 md:hidden">
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

            <div className="px-4 md:px-7 pt-4 pb-1">
              <h1 className="font-display font-bold text-base md:text-xl text-text-primary tracking-tight">
                Katalog Lengkap Produk
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Jelajahi seluruh varian tembakau linting, cerutu, papir, filter, dan perlengkapan tingwe original.
              </p>
            </div>

            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            <div className="section-header mt-2">
              <span className="section-title">
                Semua Produk ({selectedCategory === "all" ? "Semua Kategori" : selectedCategory})
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
          <div className="px-4 md:px-7 pt-4">
            <ProfileSection />
          </div>
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

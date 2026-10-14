"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import {
  Plus,
  Check,
  Flame,
  PackageSearch,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
} from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { Skeleton } from "@/components/ui/skeleton"
import { getTobaccoProfile } from "@/lib/tobacco-profiles"
import {
  getSimilarityGrade,
  matchesTasteCategory,
  type TasteCategoryFilter,
} from "@/lib/product-catalog"

export interface Product {
  id: number
  name: string
  description: string
  price: number
  in_stock: number
  category: string
  image_url: string | null
  half_unit_price?: number | null
}

interface ProductGridProps {
  searchQuery: string
  selectedCategory: string // can be "all" | "kretek" | "mild" | "ice" | "accessories" | "tobacco" | "cigarettes"
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

function ProductSkeletonCard() {
  return (
    <div className="product-card" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16 rounded-sm" />
          <Skeleton className="h-4 w-11/12 rounded-sm" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-24 rounded-sm" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/* ─── BEST SELLER HIGHLIGHT: TRIO BINTANG UTAMA SERI LINTING ────── */
function MainstayStarsSpotlight({ products }: { products: Product[] }) {
  const { addItem } = useCart()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState(0)
  const [addedKey, setAddedKey] = useState<string | null>(null)

  const product = products[activeTab] || products[0]
  if (!product) return null

  const price100g = product.price || 23000
  const price50g = product.half_unit_price || Math.round((price100g * 0.55) / 500) * 500
  const price200g = Math.round((price100g * 1.95) / 1000) * 1000

  const handleAddVariant = (
    size: "50g" | "100g" | "200g",
    price: number,
    weight: number,
    label: string
  ) => {
    addItem({
      id: `${product.id}-${size}`,
      productId: product.id,
      name: `${product.name} (${label})`,
      price: price,
      image: product.image_url ?? "",
      weight: weight,
      variant: label,
    })

    const key = `${product.id}-${size}`
    setAddedKey(key)
    setTimeout(() => setAddedKey(null), 1200)

    toast({
      title: "Berhasil Ditambahkan!",
      description: `${product.name} (${label}) siap di keranjang.`,
    })
  }

  // Tailored description for each star product
  const getStarDescription = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes("surya")) {
      return "Kretek manis gurih dengan tarikan mantap khas tembakau nusantara. Rasa pas di tenggorokan, racikan paling dicari untuk stok harian."
    }
    if (n.includes("mild")) {
      return "Tarikan halus dan enteng, tidak bikin serak di tenggorokan. Best value harian untuk penikmat rokok putih/mild dengan harga sangat hemat."
    }
    if (n.includes("samsu")) {
      return "Aroma cengkeh rempah wangi khas selera nusantara. Karakter mantap, padat, dan tahan lama untuk penikmat kretek legendaris."
    }
    return "Seri Linting (Kemiripan 60%): Racikan paling pas untuk stok harian, rasa mantap di tenggorokan dengan harga jauh lebih hemat."
  }

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-card to-amber-500/5 border-2 border-accent/40 p-4 md:p-6 shadow-md relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Tag & Star Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-text text-xs font-bold shadow-sm">
            <Flame size={13} className="text-amber-200 animate-pulse" />
            <span>Bintang Utama (Best Value / Paling Dicari)</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
            <Check size={11} className="text-emerald-600" />
            <span>Pilihan Harian Terbaik - Stok Selalu Ready</span>
          </span>
        </div>

        {/* 3 Mainstay Star Switcher Tabs */}
        {products.length > 1 && (
          <div className="flex items-center gap-1 bg-raised/80 p-1 rounded-xl border border-border">
            {products.map((p, idx) => {
              const isSelected = activeTab === idx
              const shortName = p.name.replace(/linting/i, "").trim()
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    isSelected
                      ? "bg-accent text-accent-text shadow-xs"
                      : "text-text-secondary hover:text-text-primary hover:bg-card"
                  }`}
                >
                  <span>{shortName}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-200" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 relative z-10">
        {/* Product Image */}
        <Link
          href={`/produk/${product.id}`}
          className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-raised border border-border overflow-hidden flex-shrink-0 group block"
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
              Prawira
            </div>
          )}
        </Link>

        {/* Content & Direct Checkout CTA */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <Link href={`/produk/${product.id}`} className="hover:text-accent transition-colors">
              <h3 className="font-display font-bold text-base md:text-xl text-text-primary">
                {product.name}
              </h3>
            </Link>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              60% Mirip • Stok Ready
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
              Kemasan Plastik Refill
            </span>
          </div>

          <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
            {getStarDescription(product.name)}
          </p>

          {/* Youth-oriented Callout for experienced rollers */}
          <div className="mt-2 text-[11px] text-text-muted bg-raised/80 rounded-lg px-2.5 py-1.5 border border-border inline-flex items-center gap-1.5">
            <span>💡</span>
            <span>Udah jago ngelinting? Ambil kemasan <strong>Plastik Refill 50gr / 100gr</strong>. Tinggal tuang ke toples tingwe kamu, harga jauh lebih hemat, rokok pabrikan lewat!</span>
          </div>

          {/* Quick Choice Buttons: 50gr, 100gr, 200gr */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {/* 50gr Harian Refill */}
            <button
              type="button"
              onClick={() => handleAddVariant("50g", price50g, 65, "50gr - Harian (Kemasan Refill)")}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                addedKey === `${product.id}-50g`
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-card border-border hover:border-accent text-text-primary hover:bg-accent/10"
              }`}
            >
              {addedKey === `${product.id}-50g` ? (
                <Check size={13} />
              ) : (
                <Plus size={13} className="text-accent" />
              )}
              <span>50gr Harian - Refill ({formatPrice(price50g)})</span>
            </button>

            {/* 100gr Hemat Refill (Terlaris) */}
            <button
              type="button"
              onClick={() => handleAddVariant("100g", price100g, 120, "100gr - Hemat (Kemasan Refill)")}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                addedKey === `${product.id}-100g`
                  ? "bg-emerald-600 text-white"
                  : "bg-accent hover:bg-accent-hover text-accent-text"
              }`}
            >
              {addedKey === `${product.id}-100g` ? <Check size={13} /> : <ShoppingBag size={13} />}
              <span>100gr Hemat - Refill ({formatPrice(price100g)})</span>
              <span className="text-[9.5px] bg-black/20 px-1.5 py-0.2 rounded-full uppercase">
                Terlaris
              </span>
            </button>

            {/* 200gr Paket Bulanan Refill */}
            <button
              type="button"
              onClick={() => handleAddVariant("200g", price200g, 235, "200gr - Paket Bulanan (Kemasan Refill)")}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                addedKey === `${product.id}-200g`
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-card border-border hover:border-accent text-text-primary hover:bg-accent/10"
              }`}
            >
              {addedKey === `${product.id}-200g` ? (
                <Check size={13} />
              ) : (
                <Sparkles size={13} className="text-accent" />
              )}
              <span>200gr Bulanan - Refill ({formatPrice(price200g)})</span>
              <span className="text-[9.5px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded-full uppercase font-bold">
                Super Hemat
              </span>
            </button>

            <Link
              href={`/produk/${product.id}`}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 ml-1"
            >
              <span>Detail & Pelengkap</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── STANDARD PRODUCT CARD WITH SIMILARITY BADGE ───────────────── */
function ProductCard({ product }: { product: Product }) {
  const { items, addItem } = useCart()
  const { toast } = useToast()
  const [justAdded, setJustAdded] = useState(false)

  const isTobacco = product.category !== "accessories"
  const defaultPrice = isTobacco ? (product.half_unit_price || 12000) : product.price
  const defaultWeight = isTobacco ? 65 : 25

  const cartItemKey = isTobacco ? `${product.id}-50g` : String(product.id)
  const cartItem = items.find((item) => item.id === cartItemKey || item.id === String(product.id))
  const inCartQuantity = cartItem ? cartItem.quantity : 0

  const outOfStock = product.in_stock <= 0
  const lowStock = product.in_stock > 0 && product.in_stock <= 5
  const tobaccoProfile = getTobaccoProfile(product)
  const similarityGrade = getSimilarityGrade(product)

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (outOfStock) return

    addItem({
      id: isTobacco ? `${product.id}-50g` : String(product.id),
      productId: product.id,
      name: isTobacco ? `${product.name} (50gr - Harian (Kemasan Refill))` : product.name,
      price: defaultPrice,
      image: product.image_url ?? "",
      weight: defaultWeight,
      variant: isTobacco ? "50gr - Harian (Kemasan Refill)" : undefined,
    })

    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 900)
  }

  return (
    <div className="product-card group relative">
      {/* Product Image Link */}
      <Link href={`/produk/${product.id}`} className="product-img-wrap block cursor-pointer">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={`Jual ${product.name} - Prawira Tobacco`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-text-muted p-4">
            <PackageSearch size={32} className="opacity-40 mb-1" />
            <span className="text-[11px] font-medium opacity-60">Prawira</span>
          </div>
        )}

        {/* Stock Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {outOfStock ? (
            <span className="badge badge-muted text-[10px] px-2 py-0.5 rounded shadow-sm">
              Habis
            </span>
          ) : lowStock ? (
            <span className="badge badge-soft text-[10px] px-2 py-0.5 rounded flex items-center gap-1 shadow-sm font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <Flame size={10} className="text-amber-500" /> Sisa {product.in_stock} (Stok Terbatas)
            </span>
          ) : similarityGrade?.type === "harian" ? (
            <span className="badge badge-soft text-[10px] px-2 py-0.5 rounded flex items-center gap-1 shadow-sm font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <Check size={10} className="text-emerald-600" /> Stok Ready
            </span>
          ) : null}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Similarity Grade Badge */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
              {product.category === "accessories" ? "Aksesoris" : "Tembakau"}
            </span>
            {similarityGrade && (
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 ${similarityGrade.bgClass} ${similarityGrade.textClass} ${similarityGrade.borderClass}`}
              >
                <Sparkles size={9} />
                <span>{similarityGrade.fullBadge}</span>
              </span>
            )}
          </div>

          <Link href={`/produk/${product.id}`} className="block group-hover:text-accent transition-colors">
            <h3 className="font-display font-semibold text-[13px] md:text-[14px] text-text-primary line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {tobaccoProfile && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-semibold border border-accent/20">
                {tobaccoProfile.badgeTag || tobaccoProfile.aroma}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-raised text-text-muted font-medium border border-border">
                {tobaccoProfile.throatHit}
              </span>
              {tobaccoProfile.cooling !== "Non-Ice" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium border border-sky-500/20">
                  {tobaccoProfile.cooling}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price and Add CTA */}
        <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-border/60">
          <div>
            <span className="text-[10px] text-text-muted block">
              {isTobacco ? "Mulai (50gr)" : "Harga"}
            </span>
            <span className="font-display font-bold text-[13px] md:text-[14.5px] text-accent">
              {formatPrice(defaultPrice)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={`h-8 min-w-[32px] px-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1 transition-all duration-200 ${
              outOfStock
                ? "bg-raised text-text-muted cursor-not-allowed opacity-50"
                : justAdded
                ? "bg-success text-white shadow-sm"
                : inCartQuantity > 0
                ? "bg-accent text-accent-text hover:bg-accent-hover shadow-sm"
                : "bg-raised hover:bg-accent hover:text-accent-text text-text-primary border border-border hover:border-accent"
            }`}
            aria-label={`Tambah ${product.name} ke keranjang`}
            type="button"
          >
            {justAdded ? (
              <Check size={14} strokeWidth={2.5} />
            ) : inCartQuantity > 0 ? (
              <>
                <Check size={12} strokeWidth={2} />
                <span className="text-[11px] font-bold">{inCartQuantity}</span>
              </>
            ) : (
              <Plus size={14} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// In-memory client cache
const clientProductCache = new Map<string, Product[]>()

export default function ProductGrid({ searchQuery, selectedCategory }: ProductGridProps) {
  const debouncedSearch = useDebounce(searchQuery.trim(), 300)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Fetch all active catalog items once and cache
    if (clientProductCache.has("all_active_products")) {
      setAllProducts(clientProductCache.get("all_active_products")!)
      setLoading(false)
      setError(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setError(false)

    fetch(`/api/mobile/products`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const productList = Array.isArray(data.products) ? data.products : []
        clientProductCache.set("all_active_products", productList)
        setAllProducts(productList)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === "AbortError") return
        setError(true)
        setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [])

  // Filter & sort products by taste category & search query
  const filteredProducts = useMemo(() => {
    const list = allProducts.filter((product) => {
      // 1. Taste category match
      const matchesCategory = matchesTasteCategory(
        product,
        selectedCategory as TasteCategoryFilter
      )
      if (!matchesCategory) return false

      // 2. Search query match
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase()
        const matchName = product.name.toLowerCase().includes(s)
        const matchDesc = (product.description || "").toLowerCase().includes(s)
        if (!matchName && !matchDesc) return false
      }

      return true
    })

    // Sort: Bintang Utama (Surya Linting > Mild Linting > Samsu Linting > Linting Lainnya > Lainnya)
    return list.sort((a, b) => {
      const getPriority = (name: string) => {
        const n = name.toLowerCase()
        if (n.includes("surya") && n.includes("linting")) return 50
        if (n.includes("mild") && n.includes("linting")) return 40
        if (n.includes("samsu") && n.includes("linting")) return 30
        if (n.includes("linting")) return 20
        return 0
      }
      return getPriority(b.name) - getPriority(a.name)
    })
  }, [allProducts, selectedCategory, debouncedSearch])

  // Locate the 3 Mainstay Star Products (Surya Linting, Mild Linting, Samsu Linting)
  const mainstayStars = useMemo(() => {
    const list: Product[] = []
    const surya = allProducts.find(
      (p) => p.name.toLowerCase().includes("surya") && !p.name.toLowerCase().includes("prem")
    )
    const mild = allProducts.find(
      (p) => p.name.toLowerCase().includes("mild") && !p.name.toLowerCase().includes("prem")
    )
    const samsu = allProducts.find(
      (p) => p.name.toLowerCase().includes("samsu")
    )
    if (surya) list.push(surya)
    if (mild) list.push(mild)
    if (samsu) list.push(samsu)
    return list
  }, [allProducts])

  if (loading) {
    return (
      <div className="product-grid" aria-label="Memuat produk">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <ProductSkeletonCard key={n} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
          <AlertCircle size={24} />
        </div>
        <h3 className="font-display font-semibold text-base text-text-primary mb-1">
          Gagal Memuat Produk
        </h3>
        <p className="text-xs text-text-muted max-w-sm mb-4">
          Terjadi kendala saat mengambil data produk. Silakan coba kembali.
        </p>
        <button
          onClick={() => {
            clientProductCache.clear()
            setLoading(true)
            setError(false)
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-raised hover:bg-border text-text-primary text-xs font-semibold border border-border transition-colors"
        >
          <RefreshCw size={13} />
          Muat Ulang
        </button>
      </div>
    )
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-raised text-text-muted flex items-center justify-center mb-3">
          <PackageSearch size={24} className="opacity-60" />
        </div>
        <h3 className="font-display font-semibold text-base text-text-primary mb-1">
          Produk Tidak Ditemukan
        </h3>
        <p className="text-xs text-text-muted max-w-sm">
          {debouncedSearch
            ? `Tidak ada produk yang cocok dengan "${debouncedSearch}". Coba kata kunci lain.`
            : "Belum ada produk untuk kategori profil rasa ini."}
        </p>
      </div>
    )
  }

  const showSpotlight =
    selectedCategory === "all" && !debouncedSearch && mainstayStars.length > 0

  return (
    <div className="space-y-4">
      {/* ─── TRIO BINTANG UTAMA SERI LINTING (HERO SECTION SPOTLIGHT) ─── */}
      {showSpotlight && (
        <MainstayStarsSpotlight products={mainstayStars} />
      )}

      {/* ─── GRID OF PRODUCTS ─── */}
      <div className="product-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

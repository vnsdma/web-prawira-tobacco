import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { ArrowLeft, CheckCircle2, Package, ShieldCheck, Truck, ShoppingBag, Flame, Sparkles } from "lucide-react"
import ProductDetailActions from "@/components/product-detail-actions"
import CartSheet from "@/components/cart-sheet"
import TobaccoTasteProfile from "@/components/tobacco-taste-profile"
import { getSimilarityGrade } from "@/lib/product-catalog"

interface PageProps {
  params: Promise<{ id: string }>
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

function getCategoryName(category: string) {
  switch (category) {
    case "tobacco":
      return "Tembakau Iris & Linting"
    case "cigarettes":
      return "Rokok Pilihan"
    case "accessories":
      return "Papir & Aksesoris Tingwe"
    default:
      return "Tembakau & Perlengkapan"
  }
}

/* ─── DYNAMIC SEO METADATA ───────────────────────────────────── */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = getSupabase()
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, category")
    .eq("id", id)
    .single()

  if (!product) {
    return {
      title: "Produk Tidak Ditemukan — Prawira Tobacco",
    }
  }

  const categoryName = getCategoryName(product.category)
  const title = `Jual ${product.name} — Beli Online | Prawira Tobacco`
  const description = `Beli ${product.name} original di Prawira Tobacco. Harga ${formatPrice(product.price)}, kategori ${categoryName}. Pengiriman cepat & aman ke seluruh Indonesia.`

  return {
    title,
    description,
    alternates: {
      canonical: `/produk/${product.id}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/produk/${product.id}`,
      type: "website",
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image_url ? [product.image_url] : [],
    },
  }
}

/* ─── SERVER RENDERED PRODUCT PAGE ───────────────────────────── */
export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = getSupabase()
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (!product) {
    notFound()
  }

  // Fetch related products from the same category
  const { data: relatedProducts } = await supabase
    .from("products")
    .select("id, name, price, image_url, category, in_stock")
    .eq("category", product.category)
    .neq("id", product.id)
    .gt("in_stock", 0)
    .limit(4)

  const categoryName = getCategoryName(product.category)
  const outOfStock = product.in_stock <= 0
  const lowStock = product.in_stock > 0 && product.in_stock <= 5

  /* Schema.org Product JSON-LD for Google Rich Results */
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image_url ? [product.image_url] : [],
    description: product.description || `Jual ${product.name} original terkurasi di Prawira Tobacco.`,
    sku: `PRW-${product.id}`,
    category: categoryName,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/produk/${product.id}`,
      priceCurrency: "IDR",
      price: product.price,
      availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Prawira Tobacco",
      },
    },
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Schema.org Rich Snippet Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Top Header */}
      <header className="page-header border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary px-2.5 py-1.5 rounded-lg border border-border bg-card"
          >
            <ArrowLeft size={14} />
            <span>Kembali</span>
          </Link>
          <span className="font-display font-bold text-sm tracking-tight text-text-primary">
            PRAWIRA<span className="text-accent">.</span>
          </span>
        </div>

        <CartSheet>
          <button className="icon-btn" aria-label="Keranjang Belanja">
            <ShoppingBag size={16} />
          </button>
        </CartSheet>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-text-muted flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-text-primary hover:underline">
            Beranda
          </Link>
          <span>/</span>
          <Link href={`/kategori/${product.category}`} className="hover:text-text-primary hover:underline">
            {categoryName}
          </Link>
          <span>/</span>
          <span className="text-text-primary font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card border border-border rounded-2xl p-5 md:p-8 shadow-sm">
          {/* Product Image */}
          <div className="relative aspect-square rounded-xl bg-raised border border-border overflow-hidden flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={`Jual ${product.name} - Prawira Tobacco`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-text-muted">
                <Package size={48} className="opacity-40 mb-2" />
                <span className="text-xs font-medium">Prawira Tobacco</span>
              </div>
            )}

            {/* Status Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {outOfStock ? (
                <span className="badge badge-muted text-xs px-2.5 py-1 rounded shadow-sm">
                  Stok Habis
                </span>
              ) : lowStock ? (
                <span className="badge badge-soft text-xs px-2.5 py-1 rounded flex items-center gap-1 shadow-sm font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <Flame size={12} className="text-amber-500" /> Sisa {product.in_stock} (Stok Terbatas)
                </span>
              ) : (
                <span className="badge badge-accent text-xs px-2.5 py-1 rounded shadow-sm font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Stok Selalu Ready
                </span>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-soft text-xs">
                  {categoryName}
                </span>
                {(() => {
                  const grade = getSimilarityGrade(product)
                  if (!grade) return null
                  return (
                    <div className="w-full space-y-1 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${grade.bgClass} ${grade.textClass} ${grade.borderClass} shadow-xs`}
                      >
                        <Sparkles size={11} />
                        <span>{grade.fullBadge}</span>
                      </span>
                      <p className="text-[11px] text-text-secondary leading-snug">
                        {grade.description}
                      </p>
                    </div>
                  )
                })()}
              </div>

              <h1 className="font-display font-bold text-xl md:text-2xl text-text-primary tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Price */}
              <div className="pt-1">
                <span className="text-xs text-text-muted block">Harga Resmi</span>
                <span className="font-display font-bold text-2xl md:text-3xl text-accent">
                  {formatPrice(product.price)}
                </span>
              </div>

              {/* Tobacco Taste Profile Meter (Sensory Guidance) */}
              <TobaccoTasteProfile product={product} />

              {/* Description */}
              <div className="pt-2 border-t border-border/60">
                <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 font-display">
                  Deskripsi Produk
                </h2>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                  {product.description ||
                    `${product.name} merupakan pilihan tembakau terkurasi di Prawira Tobacco dengan kualitas aroma dan rajangan prima. Dipersiapkan secara teliti untuk kepuasan sensasi tingwe terbaik.`}
                </p>
              </div>

              {/* Key Trust Signals */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-text-muted">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                  <span>100% Produk Asli</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck size={13} className="text-accent flex-shrink-0" />
                  <span>Ongkir Otomatis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-accent flex-shrink-0" />
                  <span>Packing Higienis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package size={13} className="text-emerald-600 flex-shrink-0" />
                  <span>Stok Terverifikasi</span>
                </div>
              </div>
            </div>

            {/* Interactive Add to Cart and Checkout Actions */}
            <ProductDetailActions product={product} />
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="section-header px-0">
              <h2 className="section-title text-base">
                Produk Terkait dalam Kategori Ini
              </h2>
              <Link
                href={`/kategori/${product.category}`}
                className="text-xs text-accent font-semibold hover:underline"
              >
                Lihat Semua &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/produk/${rel.id}`}
                  className="product-card group p-3 space-y-2 hover:border-accent transition-colors"
                >
                  <div className="aspect-square rounded-lg bg-raised overflow-hidden">
                    {rel.image_url ? (
                      <img
                        src={rel.image_url}
                        alt={`Jual ${rel.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                        Prawira
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-text-primary line-clamp-1 group-hover:text-accent transition-colors">
                      {rel.name}
                    </h3>
                    <span className="text-xs font-bold text-accent block mt-0.5">
                      {formatPrice(rel.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

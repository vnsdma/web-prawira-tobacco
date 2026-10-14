import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { ArrowLeft, ShoppingBag, PackageSearch, Flame } from "lucide-react"
import CartSheet from "@/components/cart-sheet"

interface PageProps {
  params: Promise<{ category: string }>
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

function getCategoryMeta(category: string) {
  switch (category) {
    case "tobacco":
      return {
        title: "Jual Tembakau Iris & Linting Nusantara Asli — Prawira Tobacco",
        h1: "Jual Tembakau Iris & Linting Nusantara Asli",
        description: "Beli tembakau iris pilihan dan tembakau rasa aromatik nusantara di Prawira Tobacco. Tembakau gayo, temanggung, kasturi, whiskey, soju terjamin aroma dan mutunya.",
        badge: "Tembakau Iris & Tingwe",
        intro: "Koleksi daun tembakau pilihan hasil kurasi perkebunan nusantara. Tersedia varian rasa aromatik modern dan rajangan tembakau tradisional dengan aroma khas.",
      }
    case "cigarettes":
      return {
        title: "Jual Aneka Rokok Pilihan Lengkap & Original — Prawira Tobacco",
        h1: "Jual Aneka Rokok Pilihan Lengkap & Original",
        description: "Beli aneka rokok pilihan kemasan resmi dan terkurasi di Prawira Tobacco. Harga terjangkau, produk original, pengiriman aman ke seluruh Indonesia.",
        badge: "Rokok Pilihan",
        intro: "Pilihan rokok kemasan berkualitas terjamin untuk melengkapi kebutuhan belanja Anda dengan harga bersaing.",
      }
    case "accessories":
      return {
        title: "Jual Papir, Filter & Alat Linting Tingwe Terlengkap — Prawira Tobacco",
        h1: "Jual Papir, Filter & Alat Linting Tingwe Terlengkap",
        description: "Beli perlengkapan tingwe lengkap: kertas linting (papir), busa filter rokok, alat linting manual, hingga dompet tembakau di Prawira Tobacco.",
        badge: "Perlengkapan & Aksesoris Tingwe",
        intro: "Kebutuhan lengkap tradisi linting dewe (tingwe). Kertas papir manis, reguler, filter beraneka ukuran, dan alat gulung manual berkualitas.",
      }
    default:
      return null
  }
}

/* ─── DYNAMIC SEO METADATA ───────────────────────────────────── */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const meta = getCategoryMeta(category)
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  if (!meta) {
    return { title: "Kategori Tidak Ditemukan — Prawira Tobacco" }
  }

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/kategori/${category}`,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${siteUrl}/kategori/${category}`,
      type: "website",
    },
  }
}

/* ─── SERVER RENDERED CATEGORY PAGE ──────────────────────────── */
export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params
  const meta = getCategoryMeta(category)

  if (!meta) {
    notFound()
  }

  const supabase = getSupabase()
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, in_stock, image_url, category, description")
    .eq("category", category)
    .order("id", { ascending: false })

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: meta.h1,
    description: meta.description,
    url: `${siteUrl}/kategori/${category}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (products || []).map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${siteUrl}/produk/${p.id}`,
        name: p.name,
      })),
    },
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Schema.org CollectionPage script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Header */}
      <header className="page-header border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary px-2.5 py-1.5 rounded-lg border border-border bg-card"
          >
            <ArrowLeft size={14} />
            <span>Beranda</span>
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-text-muted flex items-center gap-1.5">
          <Link href="/" className="hover:text-text-primary hover:underline">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-text-primary font-medium">{meta.badge}</span>
        </nav>

        {/* Hero Category Banner */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-8 space-y-2.5 shadow-sm">
          <span className="badge badge-soft text-xs">{meta.badge}</span>
          <h1 className="font-display font-bold text-xl md:text-3xl text-text-primary tracking-tight">
            {meta.h1}
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-3xl leading-relaxed">
            {meta.intro}
          </p>
        </div>

        {/* Category Pills Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Link
            href="/"
            className="pill text-xs"
          >
            Semua Produk
          </Link>
          <Link
            href="/kategori/tobacco"
            className={`pill text-xs ${category === "tobacco" ? "active" : ""}`}
          >
            Tembakau Iris
          </Link>
          <Link
            href="/kategori/cigarettes"
            className={`pill text-xs ${category === "cigarettes" ? "active" : ""}`}
          >
            Rokok Pilihan
          </Link>
          <Link
            href="/kategori/accessories"
            className={`pill text-xs ${category === "accessories" ? "active" : ""}`}
          >
            Aksesoris Tingwe
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {products && products.length > 0 ? (
            products.map((p) => {
              const outOfStock = p.in_stock <= 0
              const lowStock = p.in_stock > 0 && p.in_stock <= 5

              return (
                <Link
                  key={p.id}
                  href={`/produk/${p.id}`}
                  className="product-card group relative flex flex-col justify-between hover:border-accent transition-colors"
                >
                  <div className="product-img-wrap aspect-square bg-raised overflow-hidden flex items-center justify-center">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={`Jual ${p.name} - Prawira Tobacco`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-text-muted p-4">
                        <PackageSearch size={28} className="opacity-40 mb-1" />
                        <span className="text-[10px] font-medium">Prawira</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      {outOfStock ? (
                        <span className="badge badge-muted text-[10px] px-1.5 py-0.5 rounded">
                          Habis
                        </span>
                      ) : lowStock ? (
                        <span className="badge badge-soft text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                          <Flame size={10} className="text-accent" /> Sisa {p.in_stock}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="font-display font-semibold text-xs md:text-sm text-text-primary line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                        {p.name}
                      </h2>
                    </div>

                    <div className="pt-2 mt-2 border-t border-border/60">
                      <span className="text-[10px] text-text-muted block">Harga</span>
                      <span className="font-display font-bold text-xs md:text-sm text-accent">
                        {formatPrice(p.price)}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <div className="col-span-full text-center py-12 text-text-muted">
              Tidak ada produk dalam kategori ini saat ini.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

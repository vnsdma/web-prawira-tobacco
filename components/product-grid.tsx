"use client"

import { useState, useEffect } from "react"
import { Plus, Flame } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id:          number
  name:        string
  description: string
  price:       number
  in_stock:    number
  category:    string
  image_url:   string | null
}

interface ProductGridProps {
  searchQuery:      string
  selectedCategory: string
}

function formatPrice(price: number) {
  if (price >= 1_000_000) return `Rp ${(price / 1_000_000).toFixed(1)}jt`
  if (price >= 1_000)     return `Rp ${Math.round(price / 1_000)}rb`
  return `Rp ${price.toLocaleString("id-ID")}`
}

function SkeletonCard({ wide = false }: { wide?: boolean }) {
  if (wide) {
    return (
      <div className="product-card wide" style={{ pointerEvents: "none" }}>
        <div className="skeleton" style={{ width: 130, minHeight: 120, flexShrink: 0, borderRadius: 0 }} />
        <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 14, borderRadius: 6, width: "65%" }} />
          <div className="skeleton" style={{ height: 10, borderRadius: 6, width: "35%" }} />
          <div className="skeleton" style={{ height: 20, borderRadius: 6, width: "45%", marginTop: "auto" }} />
        </div>
      </div>
    )
  }
  return (
    <div className="product-card" style={{ pointerEvents: "none" }}>
      <div className="skeleton" style={{ aspectRatio: "1", width: "100%" }} />
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton" style={{ height: 12, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 10, borderRadius: 6, width: "55%" }} />
        <div className="skeleton" style={{ height: 16, borderRadius: 6, width: "40%", marginTop: 4 }} />
      </div>
    </div>
  )
}

function ProductCard({ product, wide = false, delay = 0 }: {
  product: Product
  wide?:   boolean
  delay?:  number
}) {
  const { addItem } = useCart()
  const { toast }   = useToast()

  const outOfStock = product.in_stock === 0
  const lowStock   = product.in_stock > 0 && product.in_stock < 10

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (outOfStock) return

    addItem({
      id:    String(product.id),
      name:  product.name,
      price: product.price,
      image: product.image_url ?? "",
    })

    toast({
      title:       "Ditambahkan",
      description: product.name,
    })
  }

  return (
    <div
      className={`product-card animate-fade-up${wide ? " wide" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="product-img-wrap"
        style={wide ? { width: 130, minHeight: 120, flexShrink: 0, aspectRatio: "unset", borderRadius: 0 } : {}}
      >
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: "28px", opacity: 0.2 }}>🌿</span>
        )}

        {outOfStock && (
          <span className="badge badge-muted" style={{ position: "absolute", top: 7, left: 7 }}>
            Habis
          </span>
        )}
        {lowStock && !outOfStock && (
          <span className="badge badge-soft"
            style={{ position: "absolute", top: 7, left: 7, display: "flex", alignItems: "center", gap: 3 }}>
            <Flame size={8} />Hampir habis
          </span>
        )}
      </div>

      <div className="product-info"
        style={wide ? { flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 14 } : {}}>
        <div>
          <p className="product-name" style={wide ? { fontSize: 13 } : {}}>{product.name}</p>
          <p className="product-category">{product.category}</p>
        </div>
        <div className="product-footer">
          <span className="product-price">{formatPrice(product.price)}</span>
          <button
            className="add-btn"
            onClick={handleAdd}
            disabled={outOfStock}
            style={outOfStock ? { opacity: 0.35, cursor: "not-allowed" } : {}}
            aria-label={`Tambah ${product.name}`}
            type="button"
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductGrid({ searchQuery, selectedCategory }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    const params = new URLSearchParams()
    if (selectedCategory !== "all") params.append("category", selectedCategory)
    if (searchQuery.trim())         params.append("search", searchQuery.trim())

    fetch(`/api/mobile/products?${params}`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json() })
      .then((data) => {
        if (cancelled) return
        setProducts(Array.isArray(data.products) ? data.products : [])
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false) } })

    return () => { cancelled = true }
  }, [searchQuery, selectedCategory])

  if (loading) return (
    <div className="product-grid stagger">
      <SkeletonCard wide /><SkeletonCard /><SkeletonCard />
      <SkeletonCard /><SkeletonCard />
    </div>
  )

  if (error) return (
    <div className="empty-state">
      <span style={{ fontSize: 36, opacity: 0.2 }}>⚠️</span>
      <p>Gagal memuat produk</p>
      <button className="btn-ghost" style={{ marginTop: 8, padding: "8px 20px", fontSize: 13 }}
        onClick={() => { setError(false); setLoading(true) }}>
        Coba lagi
      </button>
    </div>
  )

  if (products.length === 0) return (
    <div className="empty-state">
      <span style={{ fontSize: 36, opacity: 0.2 }}>🌿</span>
      <p>Produk tidak ditemukan</p>
    </div>
  )

  const [featured, ...rest] = products
  return (
    <div className="product-grid stagger">
      <ProductCard product={featured} wide delay={0} />
      {rest.map((p, i) => <ProductCard key={p.id} product={p} delay={(i + 1) * 50} />)}
    </div>
  )
}

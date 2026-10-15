"use client"

import { useState, useMemo } from "react"
import {
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ArrowRight,
  MessageCircle,
  Flame,
  Layers,
  PackagePlus,
} from "lucide-react"
import { useCart, type CartItem } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"
import CartSheet from "@/components/cart-sheet"
import { getProductTasteInquiryLink } from "@/lib/whatsapp"
import {
  getProductVariants,
  calculateVariantPrice,
  QUICK_ADDONS,
  type ProductVariant,
} from "@/lib/product-catalog"

interface Product {
  id: number
  name: string
  price: number
  in_stock: number
  image_url: string | null
  half_unit_price?: number | null
  category?: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price)
}

export default function ProductDetailActions({ product }: { product: Product }) {
  const { addItem, addMultipleItems } = useCart()
  const { toast } = useToast()

  const outOfStock = product.in_stock <= 0
  const isAccessory = product.category === "accessories"

  // 1. Variants (For Tobacco Products)
  const variants = useMemo(
    () =>
      getProductVariants({
        id: product.id,
        name: product.name,
        price: product.price,
        half_unit_price: product.half_unit_price,
        category: product.category || "tobacco",
      }),
    [product]
  )

  const defaultVariant = variants.find((v) => v.isDefault) || variants[0]
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    defaultVariant || null
  )

  // Current calculated price based on selected variant
  const currentTobaccoPrice = useMemo(() => {
    if (!selectedVariant || isAccessory) return product.price
    return calculateVariantPrice(product.price, selectedVariant, product.half_unit_price)
  }, [product.price, selectedVariant, product.half_unit_price, isAccessory])

  // Current buffer weight for shipping calculations
  const currentTobaccoWeight = useMemo(() => {
    if (!selectedVariant || isAccessory) return 65
    return selectedVariant.bufferWeightGrams
  }, [selectedVariant, isAccessory])

  // 2. Quantity
  const [quantity, setQuantity] = useState(1)

  // 3. Quick Add-On Checkbox States
  const [selectedAddons, setSelectedAddons] = useState<Record<string, { enabled: boolean; optionId: string }>>({
    "addon-papir": { enabled: false, optionId: "papir-1pak" },
    "addon-busa": { enabled: false, optionId: "busa-kecil" },
    "addon-lem": { enabled: false, optionId: "lem-standar" },
  })

  const [justAdded, setJustAdded] = useState(false)

  // Toggle an addon on/off
  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: {
        ...prev[addonId],
        enabled: !prev[addonId]?.enabled,
      },
    }))
  }

  // Change sub-option for an addon (e.g. 1 Pak vs 5 Pak)
  const setAddonOption = (addonId: string, optionId: string) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: {
        enabled: true, // auto-check when changing option
        optionId,
      },
    }))
  }

  // Calculate Add-on Total Price
  const activeAddonsList = useMemo(() => {
    const list: {
      id: string
      productId?: number
      name: string
      price: number
      weight: number
      label: string
    }[] = []

    for (const addon of QUICK_ADDONS) {
      const state = selectedAddons[addon.id]
      if (state?.enabled) {
        const option = addon.options.find((o) => o.id === state.optionId) || addon.options[0]
        list.push({
          id: `addon-${option.id}`,
          productId: option.productId,
          name: `${addon.name} (${option.label})`,
          price: option.price,
          weight: option.weightGrams,
          label: option.label,
        })
      }
    }
    return list
  }, [selectedAddons])

  const totalAddonPrice = useMemo(
    () => activeAddonsList.reduce((sum, a) => sum + a.price, 0),
    [activeAddonsList]
  )

  const grandSubtotal = currentTobaccoPrice * quantity + totalAddonPrice

  // Build items array to add to cart
  const buildItemsToAdd = (): Omit<CartItem, "quantity">[] => {
    const items: Omit<CartItem, "quantity">[] = []

    // 1. Tobacco main item
    const variantLabel = selectedVariant ? ` (${selectedVariant.name})` : ""
    const mainItemId = selectedVariant ? `${product.id}-${selectedVariant.id}` : String(product.id)

    items.push({
      id: mainItemId,
      productId: product.id,
      name: `${product.name}${variantLabel}`,
      price: currentTobaccoPrice,
      image: product.image_url ?? "",
      weight: currentTobaccoWeight,
      variant: selectedVariant?.name,
    })

    // 2. Addons
    for (const addon of activeAddonsList) {
      items.push({
        id: addon.id,
        productId: addon.productId,
        name: addon.name,
        price: addon.price,
        image: product.image_url ?? "",
        weight: addon.weight,
        variant: addon.label,
      })
    }

    return items
  }

  const handleAddToCart = () => {
    if (outOfStock) return

    const itemsToAdd = buildItemsToAdd()

    // Add main item according to quantity
    for (let i = 0; i < quantity; i++) {
      addItem(itemsToAdd[0])
    }

    // Add addon items (1 qty each per click)
    if (itemsToAdd.length > 1) {
      for (let i = 1; i < itemsToAdd.length; i++) {
        addItem(itemsToAdd[i])
      }
    }

    setJustAdded(true)
    const addonCount = itemsToAdd.length - 1
    toast({
      title: "Berhasil Ditambahkan!",
      description:
        addonCount > 0
          ? `${product.name} + ${addonCount} produk pelengkap telah dimasukkan ke keranjang.`
          : `${product.name} (${selectedVariant?.name || "1 pcs"}) telah dimasukkan ke keranjang.`,
    })

    setTimeout(() => setJustAdded(false), 1500)
  }

  return (
    <div className="space-y-4">
      {/* ─── 1. DYNAMIC PRICE ────────────────── */}
      <div className="flex items-baseline gap-2 pt-0.5">
        <span className="font-display font-bold text-2xl sm:text-3xl text-accent">
          {formatPrice(currentTobaccoPrice)}
        </span>
        {selectedVariant && !isAccessory && (
          <span className="text-xs text-text-muted font-medium">
            / {selectedVariant.name}
          </span>
        )}
      </div>

      {/* ─── 2. PRODUCT VARIANT SELECTOR (FOR TOBACCO) ──────────── */}
      {variants.length > 0 && !isAccessory && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5 font-display">
              <Layers size={13} className="text-accent" />
              <span>Pilih Ukuran / Varian:</span>
            </label>
            <span className="text-[11px] text-text-muted">
              Berat kemasan: {selectedVariant?.bufferWeightGrams || 65}g
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id
              const vPrice = calculateVariantPrice(
                product.price,
                v,
                product.half_unit_price
              )

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={`relative p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-accent bg-accent/10 shadow-xs ring-1 ring-accent"
                      : "border-border bg-card hover:bg-raised text-text-secondary"
                  }`}
                >
                  {/* Popular / Paket Badge */}
                  {v.popularBadge && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-accent text-accent-text text-[9px] font-extrabold shadow-sm flex items-center gap-0.5">
                      <Flame size={9} />
                      {v.popularBadge}
                    </span>
                  )}

                  <div>
                    <span
                      className={`text-xs font-bold block ${
                        isSelected ? "text-accent" : "text-text-primary"
                      }`}
                    >
                      {v.name}
                    </span>
                    <span className="text-[10px] text-text-muted leading-tight block mt-0.5 line-clamp-1">
                      {v.description}
                    </span>
                  </div>

                  <span className="text-xs font-extrabold text-accent mt-2 block">
                    {formatPrice(vPrice)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── 3. QUICK ADD-ON ACCESSORIES ("SEKALIAN BELI PELENGKAPNYA?") ─── */}
      {!isAccessory && (
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/80">
            <div className="flex items-center gap-1.5">
              <PackagePlus size={15} className="text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-display font-bold text-xs text-text-primary uppercase tracking-wider">
                Sekalian Beli Pelengkapnya?
              </h3>
            </div>
            <span className="text-[10px] text-text-muted bg-raised px-2 py-0.5 rounded-md">
              Stok Tingwe Aman
            </span>
          </div>

          <p className="text-[11px] text-text-muted leading-relaxed">
            Centang pelengkap di bawah agar pesanan tembakau Anda langsung siap linting saat paket tiba di rumah:
          </p>

          <div className="space-y-2.5 pt-1">
            {QUICK_ADDONS.map((addon) => {
              const state = selectedAddons[addon.id] || { enabled: false, optionId: "" }
              const activeOption =
                addon.options.find((o) => o.id === state.optionId) || addon.options[0]

              return (
                <div
                  key={addon.id}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    state.enabled
                      ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10"
                      : "border-border bg-raised/40 hover:bg-raised"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Checkbox Label */}
                    <button
                      type="button"
                      onClick={() => toggleAddon(addon.id)}
                      className="flex items-center gap-2 text-left cursor-pointer select-none group flex-1"
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                          state.enabled
                            ? "bg-emerald-600 text-white"
                            : "border border-border bg-card group-hover:border-accent"
                        }`}
                      >
                        {state.enabled ? <Check size={12} strokeWidth={3} /> : null}
                      </div>
                      <span className="text-xs font-semibold text-text-primary">
                        + {addon.name}
                      </span>
                    </button>

                    {/* Single Option Price or Dropdown */}
                    {addon.options.length === 1 ? (
                      <span className="text-xs font-bold text-accent">
                        +{formatPrice(addon.options[0].price)}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={state.optionId}
                          onChange={(e) => setAddonOption(addon.id, e.target.value)}
                          className="input-base text-[11px] py-1 px-2 h-auto bg-card border-border"
                        >
                          {addon.options.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label} (+{formatPrice(opt.price)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Subtotal Preview with Addons */}
          {activeAddonsList.length > 0 && (
            <div className="pt-2 border-t border-border/80 flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                Total ({quantity}x Tembakau + {activeAddonsList.length} Pelengkap):
              </span>
              <span className="font-display font-bold text-sm text-accent">
                {formatPrice(grandSubtotal)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── 4. QUANTITY SELECTOR ───────────────────────────────── */}
      {!outOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-text-muted">Jumlah:</span>
          <div className="flex items-center border border-border rounded-lg bg-card p-1">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 flex items-center justify-center rounded text-text-secondary hover:bg-raised disabled:opacity-30"
              aria-label="Kurangi jumlah"
            >
              <Minus size={14} />
            </button>
            <span className="w-9 text-center text-xs font-semibold text-text-primary">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(product.in_stock, quantity + 1))}
              disabled={quantity >= product.in_stock}
              className="w-7 h-7 flex items-center justify-center rounded text-text-secondary hover:bg-raised disabled:opacity-30"
              aria-label="Tambah jumlah"
            >
              <Plus size={14} />
            </button>
          </div>
          <span className="text-[11px] text-text-muted">
            (Stok tersedia: {product.in_stock})
          </span>
        </div>
      )}

      {/* ─── 5. ACTION BUTTONS (ADD TO CART & BUY NOW) ─────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className={`flex-1 py-3 px-5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
            outOfStock
              ? "bg-raised text-text-muted cursor-not-allowed"
              : justAdded
              ? "bg-emerald-600 text-white"
              : "bg-accent hover:bg-accent-hover text-accent-text"
          }`}
        >
          {justAdded ? (
            <>
              <Check size={16} />
              <span>Berhasil Ditambahkan!</span>
            </>
          ) : (
            <>
              <ShoppingBag size={16} />
              <span>
                {outOfStock
                  ? "Stok Habis"
                  : activeAddonsList.length > 0
                  ? `Tambah Tembakau + ${activeAddonsList.length} Pelengkap`
                  : "Tambah ke Keranjang"}
              </span>
            </>
          )}
        </button>

        {!outOfStock && (
          <CartSheet>
            <button
              type="button"
              onClick={handleAddToCart}
              className="py-3 px-5 rounded-xl border border-accent/40 bg-accent-muted text-accent hover:bg-accent/20 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Beli Sekarang</span>
              <ArrowRight size={14} />
            </button>
          </CartSheet>
        )}
      </div>

      {/* Accessory WhatsApp consultation fallback */}
      {isAccessory && (
        <a
          href={getProductTasteInquiryLink(product.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 rounded-xl border border-emerald-600/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle size={15} className="text-emerald-600" />
          <span>Tanya Info Produk Ini via WA</span>
        </a>
      )}
    </div>
  )
}

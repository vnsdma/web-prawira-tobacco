import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createDynamicQRISOrder, checkRadarPayStatus } from "@/lib/qris/gateway-client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mitkblmftejogdxmewet.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const AGENT_API_URL =
  process.env.PRAWIRA_AI_AGENT_API_URL ||
  process.env.NEXT_PUBLIC_AI_AGENT_API_URL ||
  "https://prawira-ai-agent.onrender.com/api"

export interface CitationItem {
  document: string
  page?: number
  similarity?: number
  preview?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: string
  citations?: CitationItem[]
  provider?: string
  tool_type?:
    | "stock_card"
    | "order_review"
    | "qris_card"
    | "payment_success"
    | "whatsapp_action"
    | "cart_prompt"
    | "cart_review"
    | "checkout_container"
  tool_data?: any
}

interface ProductItem {
  id: number
  name: string
  price: number
  in_stock: number
  category?: string
  image_url?: string
  description?: string | null
}

// ── Helper: Enrich raw inventory items from live Enterprise RAG tool output ──
function enrichItemsFromCatalog(rawItems: any[], allProducts: ProductItem[]): ProductItem[] {
  const result: ProductItem[] = []
  const seenIds = new Set<number>()

  for (const item of rawItems) {
    if (!item) continue

    // Extract numeric ID from SKU (e.g. "PT-0044" -> 44)
    let skuId: number | null = null
    if (typeof item.sku === "string") {
      const match = item.sku.match(/\d+/)
      if (match) {
        skuId = parseInt(match[0], 10)
      }
    }

    const itemName = typeof item.name === "string" ? item.name.toLowerCase().trim() : ""

    const matchedProd = allProducts.find((p) => {
      if (skuId !== null && p.id === skuId) return true
      const pName = p.name.toLowerCase().trim()
      if (itemName && pName === itemName) return true
      if (itemName && (pName.includes(itemName) || itemName.includes(pName))) return true
      return false
    })

    if (matchedProd) {
      if (!seenIds.has(matchedProd.id)) {
        seenIds.add(matchedProd.id)
        result.push({
          id: matchedProd.id,
          name: matchedProd.name,
          price: matchedProd.price || item.price || 23000,
          in_stock: typeof item.stock === "number" ? item.stock : matchedProd.in_stock,
          category: matchedProd.category || item.category,
          image_url: matchedProd.image_url,
          description: matchedProd.description || item.description || item.category,
        })
      }
    } else {
      const fallbackId = skuId || Math.floor(Math.random() * 10000) + 1000
      if (!seenIds.has(fallbackId)) {
        seenIds.add(fallbackId)
        result.push({
          id: fallbackId,
          name: item.name || "Tembakau Prawira",
          price: item.price || 23000,
          in_stock: typeof item.stock === "number" ? item.stock : 10,
          category: item.category || "Tembakau",
          image_url: undefined,
          description: item.category || "Produk Prawira Tobacco",
        })
      }
    }
  }

  return result
}

// ── 1. Helper: Fetch and cache catalog from Supabase ──────────────
async function getSupabaseProducts(searchTerm?: string): Promise<ProductItem[]> {
  try {
    let query = supabase.from("products").select("id, name, price, in_stock, category, image_url, description").eq("is_active", true)
    if (searchTerm && searchTerm.trim()) {
      query = query.ilike("name", `%${searchTerm.trim()}%`)
    }
    const { data, error } = await query.order("name", { ascending: true }).limit(100)
    if (error || !data) return []
    return data as ProductItem[]
  } catch (err) {
    console.error("Error fetching products from Supabase:", err)
    return []
  }
}

// ── 1b. Helper: Alias Dictionary & Intelligent Product Matcher ─────
const PRODUCT_ALIASES: Record<string, string[]> = {
  surya: ["surya", "linting surya", "gudang garam surya", "surya 12", "surya 16"],
  samsu: ["samsu", "linting samsu", "dji sam soe", "234", "sam soe"],
  marlong: ["marlong", "linting marlong", "marlboro", "marlo"],
  melon: ["melon", "melon ice", "linting melon"],
  strawberry: ["strawberry", "stroberi", "linting strawberry"],
  cappucino: ["cappucino", "cappuccino", "kopi", "linting cappucino"],
  mild: ["mild", "linting mild", "sampoerna mild"],
  sampurna: ["sampurna", "sampoerna", "sampurna premium"],
  magnum: ["magnum", "magnum premium", "djarum magnum"],
  ggf: ["ggf", "linting ggf", "ggf premium", "garam filter"],
  purple: ["purple", "purple ice", "purple ice burst", "berry", "burst"],
  coklat: ["coklat", "chocolate", "coklat ice"],
  "whiskey ice": ["whiskey ice", "barrack whiskey ice", "wiski ice"],
  whiskey: ["whiskey", "barrack whiskey", "wiski"],
  melisa: ["melisa", "barrack melisa"],
  bayote: ["bayote", "bacote", "barrack bayote"],
  cengkeh: ["cengkeh", "cengkeh murni", "clove"],
  "busa besar": ["busa besar", "filter besar", "busa reguler"],
  "busa kecil": ["busa kecil", "filter kecil", "busa slim", "filter mild"],
  busa: ["busa", "filter"],
  lem: ["lem", "lem rokok"],
  papir: ["papir", "kertas rokok", "kertas linting", "paper"],
}

const GENERIC_MODIFIERS = new Set([
  "premium", "ice", "blend", "pack", "bungkus", "pcs", "bako", "tembakau",
  "linting", "rasa", "varian", "stok", "stock", "ready", "ada", "gak", "nggak",
  "apakah", "berapa", "harga", "min", "kak", "bang", "bos"
])

function matchProducts(query: string, catalog: ProductItem[]): ProductItem[] {
  const q = query.toLowerCase()
  const qTokens = q.split(/[^a-zA-Z0-9]+/).filter(Boolean)

  const scored = catalog.map((p) => {
    let score = 0
    const pName = p.name.toLowerCase()
    const pTokens = pName.split(/[^a-zA-Z0-9]+/).filter(Boolean)

    // 1. Exact full name match
    if (q.includes(pName)) score += 1000

    // 2. Token matches
    let matchedDistinctive = false
    for (const pt of pTokens) {
      if (GENERIC_MODIFIERS.has(pt)) {
        if (qTokens.includes(pt)) score += 10
      } else {
        if (qTokens.includes(pt)) {
          score += 200
          matchedDistinctive = true
        }
      }
    }

    // 3. Alias check
    for (const [key, aliases] of Object.entries(PRODUCT_ALIASES)) {
      if (pName.includes(key)) {
        for (const alias of aliases) {
          if (q.includes(alias)) {
            score += 300
            matchedDistinctive = true
            break
          }
        }
      }
    }

    // Penalize if matched only generic modifiers without any distinctive word
    if (!matchedDistinctive && score > 0) {
      score = 5
    }

    return { product: p, score, matchedDistinctive }
  })

  const maxScore = Math.max(...scored.map((s) => s.score), 0)
  if (maxScore >= 100) {
    return scored
      .filter((s) => s.score >= 50)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.product)
  }
  return []
}

// ── 2. Helper: Clean Indonesian Phone Number ──────────────────────
function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("08")) {
    cleaned = "62" + cleaned.slice(1)
  } else if (!cleaned.startsWith("62") && cleaned.length >= 9) {
    cleaned = "62" + cleaned
  }
  return cleaned
}

// ── 3. Helper: Formatted Currency (IDR) ───────────────────────────
function formatRupiah(amount: number): string {
  return "Rp " + Math.round(amount).toLocaleString("id-ID")
}

// ── 4. Main POST Handler ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, action, action_payload, history = [], session_id } = body

    // ==============================================================
    // AKSI 1: CEK STATUS PEMBAYARAN QRIS (LIVE CHECK VIA RADARPAY)
    // ==============================================================
    if (action === "check_payment") {
      const { transactionId, order_id } = action_payload || {}
      if (!transactionId && !order_id) {
        return NextResponse.json({ error: "transactionId atau order_id diperlukan" }, { status: 400 })
      }

      let query = supabase.from("orders").select("*, order_items(*)")
      if (transactionId) {
        query = query.eq("transaction_id", transactionId)
      } else {
        const cleanOrderId = String(order_id).trim()
        const isNumeric = !isNaN(Number(cleanOrderId))
        if (isNumeric) {
          query = query.or(`id.eq.${cleanOrderId},order_number.eq.${cleanOrderId}`)
        } else {
          query = query.eq("order_number", cleanOrderId)
        }
      }

      const { data: order, error: orderError } = await query.single()
      if (orderError || !order) {
        return NextResponse.json({
          success: false,
          is_paid: false,
          message: "Pesanan belum ditemukan di database.",
        })
      }

      // Check if already paid
      if (order.payment_status === "paid" || order.order_status === "confirmed") {
        const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "628122064877"
        const waMsg = encodeURIComponent(
          `Halo Admin Prawira Tobacco, pesanan saya #${order.order_number} sebesar ${formatRupiah(order.final_amount)} sudah terbayar via QRIS.\nNama: ${order.customer_name}\nAlamat: ${order.shipping_destination || "-"}\nMohon segera diproses ya!`
        )
        return NextResponse.json({
          success: true,
          is_paid: true,
          order_number: order.order_number,
          order_id: order.id,
          amount: order.final_amount,
          whatsapp_url: `https://wa.me/${waNumber}?text=${waMsg}`,
          message: `Alhamdulillah! Pembayaran pesanan #${order.order_number} sebesar ${formatRupiah(order.final_amount)} telah terverifikasi LUNAS. Kami segera menyiapkan barang Anda!`,
        })
      }

      // Query RadarPay gateway if available
      let isPaid = false
      if (order.transaction_id) {
        const radarStatus = await checkRadarPayStatus(order.transaction_id)
        if (radarStatus && ["paid", "success", "settlement", "completed"].includes(radarStatus.toLowerCase())) {
          isPaid = true
        }
      }

      if (isPaid) {
        await supabase
          .from("orders")
          .update({
            order_status: "confirmed",
            payment_status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        // Decrement product stock
        if (order.order_items && order.order_items.length > 0) {
          for (const it of order.order_items) {
            const { data: prod } = await supabase.from("products").select("id, in_stock").eq("id", it.product_id).single()
            if (prod) {
              const newStock = Math.max(0, (prod.in_stock || 0) - (it.quantity || 1))
              await supabase.from("products").update({ in_stock: newStock }).eq("id", it.product_id)
            }
          }
        }

        const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "628122064877"
        const waMsg = encodeURIComponent(
          `Halo Admin Prawira Tobacco, pesanan #${order.order_number} (${formatRupiah(order.final_amount)}) sudah dibayar via QRIS.\nNama: ${order.customer_name}\nAlamat: ${order.shipping_destination || "-"}`
        )

        return NextResponse.json({
          success: true,
          is_paid: true,
          order_number: order.order_number,
          order_id: order.id,
          amount: order.final_amount,
          whatsapp_url: `https://wa.me/${waNumber}?text=${waMsg}`,
          message: `Pembayaran QRIS untuk pesanan #${order.order_number} sebesar ${formatRupiah(order.final_amount)} BERHASIL terkonfirmasi lunas!`,
        })
      }

      return NextResponse.json({
        success: true,
        is_paid: false,
        message: "Pembayaran belum terdeteksi. Silakan selesaikan pembayaran di aplikasi m-Banking/e-Wallet Anda terlebih dahulu, lalu klik periksa kembali.",
      })
    }

    // ==============================================================
    // AKSI 2: KONFIRMASI PESANAN & GENERATE DYNAMIC QRIS OTOMATIS
    // ==============================================================
    if (action === "confirm_order") {
      const {
        customer_name,
        customer_phone,
        customer_email,
        shipping_address,
        items,
        shipping_cost = 12000,
      } = action_payload || {}

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "Daftar item pesanan tidak boleh kosong." }, { status: 400 })
      }
      if (!customer_name || !customer_phone || !shipping_address) {
        return NextResponse.json({ error: "Nama penerima, nomor WhatsApp, dan alamat pengiriman wajib diisi." }, { status: 400 })
      }

      // Server-side price & stock verification
      const productIds = items.map((it: any) => Number(it.id || it.product_id)).filter((id: number) => !isNaN(id) && id > 0)
      const { data: dbProducts, error: prodErr } = await supabase.from("products").select("id, name, price, in_stock").in("id", productIds)

      if (prodErr || !dbProducts) {
        return NextResponse.json({ error: "Gagal memverifikasi produk pesanan dari database." }, { status: 500 })
      }

      const prodMap = new Map<number, any>()
      for (const p of dbProducts) prodMap.set(p.id, p)

      let verifiedSubtotal = 0
      const verifiedItems: any[] = []

      for (const it of items) {
        const pId = Number(it.id || it.product_id)
        const dbP = prodMap.get(pId)
        if (!dbP) {
          return NextResponse.json({ error: `Produk ID #${pId} tidak ditemukan.` }, { status: 400 })
        }
        const qty = Math.max(1, Math.floor(Number(it.quantity || 1)))
        const price = Number(dbP.price)
        const lineTotal = price * qty
        verifiedSubtotal += lineTotal

        verifiedItems.push({
          product_id: pId,
          product_name: dbP.name,
          quantity: qty,
          unit_price: price,
          total_price: lineTotal,
        })
      }

      const verifiedShipping = Math.max(0, Math.round(Number(shipping_cost)))
      const verifiedTotal = verifiedSubtotal + verifiedShipping
      const orderNumber = `ORD-BOT-${Date.now()}`
      const cleanPhone = cleanPhoneNumber(customer_phone)
      const email = customer_email && customer_email.includes("@") ? customer_email.trim().toLowerCase() : `${cleanPhone}@prawiraguest.com`

      // 1. Dapatkan atau buat customer di tabel 'customers'
      let customerId = null
      try {
        const { data: existingCust } = await supabase.from("customers").select("id").eq("email", email).single()
        if (existingCust) {
          customerId = existingCust.id
        } else {
          const { data: newCust } = await supabase
            .from("customers")
            .insert({
              name: customer_name.trim(),
              email: email,
              phone: cleanPhone,
              address: shipping_address.trim(),
              user_uid: `guest_chat_${Date.now()}`,
              status: "active",
            })
            .select("id")
            .single()
          if (newCust) customerId = newCust.id
        }
      } catch (custErr) {
        console.warn("Notice: could not resolve customer record:", custErr)
      }

      // 2. Simpan order ke Supabase
      const orderInsertData: Record<string, any> = {
        order_number: orderNumber,
        customer_id: customerId,
        customer_name: customer_name.trim(),
        customer_email: email,
        total_amount: verifiedTotal,
        subtotal: verifiedSubtotal,
        shipping_cost: verifiedShipping,
        discount_amount: 0,
        final_amount: verifiedTotal,
        payment_method: "qris",
        order_status: "pending",
        payment_status: "pending",
        shipping_address: "Default Origin",
        shipping_service:
          action_payload?.shipping_service ||
          (action_payload?.courier_name && action_payload?.courier_service
            ? `${action_payload.courier_name} ${action_payload.courier_service}`
            : "Biteship Standard / JNE Regular"),
        shipping_destination: JSON.stringify({
          address: shipping_address.trim(),
          phone: cleanPhone,
          name: customer_name.trim(),
          email: email,
          area_id: action_payload?.destination_area_id || null,
          area_name: action_payload?.destination_area_name || null,
          courier: action_payload?.courier_name || null,
          courier_service: action_payload?.courier_service || null,
        }),
        notes: `Pesanan via Kurator AI (No WA: ${cleanPhone}, Kurir: ${action_payload?.shipping_service || "Biteship"})`,
        user_uid: "chatbot_assistant",
      }

      const { data: createdOrder, error: createErr } = await supabase.from("orders").insert(orderInsertData).select().single()

      if (createErr || !createdOrder) {
        console.error("Gagal create order via bot:", createErr)
        return NextResponse.json({ error: "Gagal menyimpan pesanan ke database: " + createErr?.message }, { status: 500 })
      }

      // 2. Simpan order items
      const itemsToInsert = verifiedItems.map((v) => ({
        order_id: createdOrder.id,
        ...v,
      }))
      await supabase.from("order_items").insert(itemsToInsert)

      // 3. Generate Dynamic QRIS Mandiri via RadarPay / Engine
      const qrisResult = await createDynamicQRISOrder({
        orderId: String(createdOrder.id),
        invoiceNumber: orderNumber,
        amount: verifiedTotal,
        customerName: customer_name.trim(),
        customerPhone: cleanPhone,
        notes: `Pesanan AI ${orderNumber}`,
      })

      // 4. Update order dengan transactionId & finalAmount
      await supabase
        .from("orders")
        .update({
          transaction_id: qrisResult.transactionId,
          final_amount: qrisResult.finalAmount,
        })
        .eq("id", createdOrder.id)

      const responsePayload = {
        success: true,
        order: {
          id: createdOrder.id,
          order_number: orderNumber,
          customer_name: customer_name.trim(),
          customer_phone: cleanPhone,
          shipping_address: shipping_address.trim(),
          subtotal: verifiedSubtotal,
          shipping_cost: verifiedShipping,
          total_amount: qrisResult.finalAmount,
          items: verifiedItems,
        },
        qris: {
          transactionId: qrisResult.transactionId,
          invoiceNumber: orderNumber,
          baseAmount: verifiedTotal,
          finalAmount: qrisResult.finalAmount,
          uniqueCode: qrisResult.uniqueCode || 0,
          qr_string: qrisResult.qr_string,
          qr_image_url: qrisResult.qr_image_url,
          expiresAt: qrisResult.expiresAt,
        },
      }

      return NextResponse.json(responsePayload)
    }

    // ==============================================================
    // PERCAKAPAN NATURAL LANGUAGE: KONSULTASI, REKOMENDASI & TRANSAKSI
    // ==============================================================
    const userText = (message || "").trim()
    if (!userText) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 })
    }

    const textLower = userText.toLowerCase()
    const allProducts = await getSupabaseProducts()

    // ── Check if user is finishing shopping / wants to view cart ──
    const isFinishedIntent =
      textLower === "sudah" ||
      textLower === "cukup" ||
      textLower === "selesai" ||
      textLower === "lihat keranjang" ||
      textLower === "cek keranjang" ||
      textLower === "checkout" ||
      textLower === "mau bayar" ||
      textLower === "bayar sekarang"

    if (isFinishedIntent) {
      return NextResponse.json({
        reply:
          "Baik Kak! Silakan periksa daftar belanjaan di keranjang Kakak di bawah ini. Kakak bisa mengubah jumlahnya, menghapus item, atau klik **Lanjut ke Checkout**:",
        action_hint: "open_cart",
        tool_type: "cart_review",
        tool_data: {
          items: [],
          subtotal: 0,
        },
      })
    }

    // ── Check if user wants to browse more products ──
    const isBrowseMore =
      textLower.includes("tambah produk lain") ||
      textLower.includes("tambah lagi") ||
      textLower.includes("cari produk lain") ||
      textLower.includes("katalog")

    if (isBrowseMore) {
      const popularProducts = allProducts.filter((p) =>
        ["Linting Surya", "Linting Samsu", "Barrack Whiskey Ice", "Linting Melon Ice", "Papir", "Busa kecil"].includes(p.name)
      )
      return NextResponse.json({
        reply:
          "Tentu Kak! Berikut beberapa varian tembakau pilihan & perlengkapan tingwe favorit yang siap dikirim hari ini:",
        tool_type: "stock_card",
        tool_data: {
          items: popularProducts.length > 0 ? popularProducts : allProducts.slice(0, 4),
        },
      })
    }

    // ==============================================================
    // 3. ENTERPRISE AI AGENT INTEGRATION (https://prawira-ai-agent.onrender.com/api)
    // ==============================================================
    let agentData: any = null

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20s timeout tolerance for free tier cold starts

      const agentRes = await fetch(`${AGENT_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          session_id: session_id || "session-web",
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (agentRes.ok) {
        agentData = await agentRes.json()
      } else {
        console.warn(`Prawira AI Agent responded with HTTP ${agentRes.status}`)
      }
    } catch (err: any) {
      console.warn("⚠️ Prawira AI Agent call failed/timed out, falling back to local catalog search:", err?.message || err)
    }

    if (agentData) {
      let tool_type: string | undefined = undefined
      let tool_data: any = undefined

      const executedTools = Array.isArray(agentData.executed_tools) ? agentData.executed_tools : []
      const rawStockItems: any[] = []

      for (const toolCall of executedTools) {
        if (toolCall.tool === "check_inventory_stock" && toolCall.result?.found && Array.isArray(toolCall.result.items)) {
          rawStockItems.push(...toolCall.result.items)
        }
      }

      if (rawStockItems.length > 0) {
        const enriched = enrichItemsFromCatalog(rawStockItems, allProducts)
        if (enriched.length > 0) {
          tool_type = "stock_card"
          tool_data = {
            items: enriched,
          }
        }
      }

      // Check if send_whatsapp_action was executed
      if (!tool_type) {
        const waTool = executedTools.find((t: any) => t.tool === "send_whatsapp_action")
        if (waTool && waTool.result) {
          tool_type = "whatsapp_action"
          tool_data = waTool.result
        }
      }

      return NextResponse.json({
        reply: agentData.answer || "Halo! Ada yang bisa saya bantu seputar produk tembakau Prawira Tobacco?",
        citations: agentData.citations || [],
        provider: agentData.provider || "Gemini Enterprise RAG",
        tool_type,
        tool_data,
      })
    }

    // ── Resilient Fallback: Local Catalog Matcher (Only if external AI agent is unreachable) ──
    const matchedProducts = matchProducts(userText, allProducts)
    if (matchedProducts.length > 0) {
      return NextResponse.json({
        reply: `Berikut varian yang relevan di katalog Prawira Tobacco:`,
        tool_type: "stock_card",
        tool_data: {
          items: matchedProducts.slice(0, 4),
        },
        provider: "Local Catalog Fallback",
      })
    }

    return NextResponse.json({
      reply:
        "Halo Kak! Saya **Kurator Tembakau Prawira**. 🍂\n\n" +
        "Saya siap membantu Anda:\n" +
        "• **Konsultasi rasa** (Manis Buah, Dingin/Ice, Kretek Gurih, Mild)\n" +
        "• **Cek stok fisik real-time** dari gudang Prawira\n" +
        "• **Beli banyak varian & checkout ongkir Biteship** langsung di dalam chat ini!\n\n" +
        "Varian tembakau apa yang sedang Kakak cari hari ini?",
      tool_type: "stock_card",
      tool_data: {
        items: allProducts.slice(0, 3),
      },
      provider: "Local Catalog Fallback",
    })
  } catch (error: any) {
    console.error("🔥 Chat API Exception:", error)
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal pada server chat assistant." },
      { status: 500 }
    )
  }
}

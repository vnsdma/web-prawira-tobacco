import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createDynamicQRISOrder, checkRadarPayStatus } from "@/lib/qris/gateway-client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mitkblmftejogdxmewet.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: string
  tool_type?: "stock_card" | "order_review" | "qris_card" | "payment_success" | "whatsapp_action"
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
    const { message, action, action_payload, history = [] } = body

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
        shipping_service: "Biteship Standard / JNE Regular",
        shipping_destination: JSON.stringify({
          address: shipping_address.trim(),
          phone: cleanPhone,
          name: customer_name.trim(),
          email: email,
        }),
        notes: `Pesanan via Kurator AI (No WA: ${cleanPhone})`,
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

    // ── Check if user wants to buy / checkout directly in chat ──
    const isBuyingIntent =
      textLower.includes("beli") ||
      textLower.includes("pesan") ||
      textLower.includes("order") ||
      textLower.includes("mau ambil") ||
      textLower.includes("bayar") ||
      textLower.includes("checkout")

    // Use our high-precision matching engine with alias and distinctive keyword support
    const matchedProducts = matchProducts(userText, allProducts)

    // Detect if user provided recipient details in text
    // E.g.: "Nama: Budi, No HP: 08123456789, Alamat: Jl. Merdeka No 10 Malang"
    const phoneMatch = userText.match(/(?:08|\+628|628)\d{8,12}/)
    const hasAddress = textLower.includes("jl.") || textLower.includes("jalan") || textLower.includes("alamat") || textLower.includes("kota") || textLower.includes("kabupaten") || textLower.includes("kecamatan")

    // ── Scenario A: User provides complete order info ──
    if (isBuyingIntent && matchedProducts.length > 0 && phoneMatch && hasAddress) {
      const selectedProd = matchedProducts[0]
      const qtyMatch = userText.match(/(\d+)\s*(?:pack|bungkus|pcs|biji|kaleng)?/)
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1
      const detectedPhone = cleanPhoneNumber(phoneMatch[0])

      // Extract recipient name
      let extractedName = "Pelanggan Prawira"
      const nameMatch = userText.match(/nama\s*[:=-]?\s*([a-zA-Z\s]{2,30})(?=[,\n]|$)/i)
      if (nameMatch) extractedName = nameMatch[1].trim()

      // Extract shipping address
      let extractedAddress = userText.trim()
      const addrMatch = userText.match(/alamat\s*[:=-]?\s*([^\n\r]+)/i)
      if (addrMatch) {
        extractedAddress = addrMatch[1].replace(/^(?:adalah|:)\s*/i, "").trim()
      } else {
        const jlMatch = userText.match(/(?:jl\.|jalan)\s*[^\n\r]+/i)
        if (jlMatch) extractedAddress = jlMatch[0].trim()
      }

      const shippingCost = 12000
      const subtotal = selectedProd.price * qty
      const totalAmount = subtotal + shippingCost

      return NextResponse.json({
        reply: `Siap Kak! Data pesanan Kak **${extractedName}** sudah saya catat dengan detail di bawah ini.\n\nSilakan cek rincian pesanan dan klik tombol **Konfirmasi & Tampilkan QRIS** untuk melakukan pembayaran langsung:`,
        tool_type: "order_review",
        tool_data: {
          customer_name: extractedName,
          customer_phone: detectedPhone,
          customer_email: `${detectedPhone}@prawiraguest.com`,
          shipping_address: extractedAddress,
          items: [
            {
              id: selectedProd.id,
              name: selectedProd.name,
              price: selectedProd.price,
              quantity: qty,
              image_url: selectedProd.image_url,
            },
          ],
          subtotal,
          shipping_cost: shippingCost,
          total_amount: totalAmount,
        },
      })
    }

    // ── Scenario B: User expresses buying intent for a product but hasn't provided address/phone ──
    if (isBuyingIntent && matchedProducts.length > 0) {
      const prod = matchedProducts[0]
      const qtyMatch = userText.match(/(\d+)\s*(?:pack|bungkus|pcs|biji)?/)
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1

      return NextResponse.json({
        reply: `Pilihan yang sangat pas, Kak! Varian **${prod.name}** tersedia dengan harga **${formatRupiah(prod.price)}** (Sisa stok: **${prod.in_stock} pack**).\n\nUntuk membuat pesanan dan langsung menampilkan **Kode QRIS pembayaran**, mohon kirimkan data penerima dengan format berikut:\n\n*Nama Penerima:*\n*Nomor WhatsApp:*\n*Alamat Lengkap & Kota Tujuan:*`,
        tool_type: "stock_card",
        tool_data: {
          items: [prod],
          prompt_fill: `Saya mau pesan ${qty} pack ${prod.name}.\nNama: \nNo WA: 08\nAlamat: `,
        },
      })
    }

    // ── Scenario C: User asks for taste recommendations ──
    const isTasteQuery =
      textLower.includes("rekomendasi") ||
      textLower.includes("saran") ||
      textLower.includes("enak") ||
      textLower.includes("manis") ||
      textLower.includes("dingin") ||
      textLower.includes("ice") ||
      textLower.includes("kretek") ||
      textLower.includes("mild") ||
      textLower.includes("buah") ||
      textLower.includes("pemula") ||
      textLower.includes("katalog")

    if (isTasteQuery) {
      let filtered: ProductItem[] = []
      let tasteDescription = ""

      if (textLower.includes("manis") || textLower.includes("buah") || textLower.includes("kopi")) {
        filtered = allProducts.filter((p) =>
          ["Linting Melon Ice", "Linting Strawberry", "Linting Cappucino", "Coklat Ice Premium", "Purple Ice Burst"].some((n) => p.name.includes(n))
        )
        tasteDescription =
          "🍃 **Rekomendasi Karakter Manis, Fruity & Creamy Prawira:**\n" +
          "1. **Linting Melon Ice** — Rasa manis buah melon segar dipadu sensasi dingin menthol sejuk.\n" +
          "2. **Linting Strawberry** — Manis legit buah strawberry alami yang ramah di tenggorokan.\n" +
          "3. **Linting Cappucino** — Cita rasa kopi cappucino creamy yang hangat & wangi.\n" +
          "4. **Coklat Ice Premium** — Paduan coklat manis lembut dengan sentuhan mint dingin."
      } else if (textLower.includes("dingin") || textLower.includes("ice") || textLower.includes("menthol")) {
        filtered = allProducts.filter((p) =>
          ["Barrack Whiskey Ice", "Linting Melon Ice", "Purple Ice Burst", "Coklat Ice Premium"].some((n) => p.name.includes(n))
        )
        tasteDescription =
          "❄️ **Rekomendasi Karakter Dingin & Segar (Ice Blend):**\n" +
          "1. **Barrack Whiskey Ice** — Aroma whiskey khas berkelas dengan tarikan dingin menyegarkan.\n" +
          "2. **Linting Melon Ice** — Buah melon dingin yang sangat laris dan nikmat.\n" +
          "3. **Purple Ice Burst** — Sensasi anggur berry segar dengan dingin burst di setiap hisapan."
      } else if (textLower.includes("kretek") || textLower.includes("gurih") || textLower.includes("mantap")) {
        filtered = allProducts.filter((p) =>
          ["Linting Surya", "Linting Samsu", "Linting Marlong", "Magnum Premium", "GGF Premium"].some((n) => p.name.includes(n))
        )
        tasteDescription =
          "🍂 **Rekomendasi Karakter Gurih Mantap (Kretek Nusantara Tradisional):**\n" +
          "1. **Linting Surya** — Aroma cengkeh madu tebal, tarikan gurih mantap khas tembakau nusantara.\n" +
          "2. **Linting Samsu** — Citarasa kretek klasik legendaris, gurih padat dan harum.\n" +
          "3. **Linting Marlong** — Karakter American blend yang mantap dan tegas."
      } else {
        filtered = allProducts.filter((p) =>
          ["Linting Mild", "Barrack Soju", "Sampurna Premium", "Barrack Melisa"].some((n) => p.name.includes(n))
        )
        tasteDescription =
          "✨ **Rekomendasi Karakter Mild & Halus (Sangat Cocok untuk Pemula):**\n" +
          "1. **Linting Mild** — Tarikan sangat ringan, halus, dan bersih tanpa rasa serak.\n" +
          "2. **Barrack Soju** — Golden Virginia aromatik dengan wangi buah segar lembut.\n" +
          "3. **Sampurna Premium** — Racikan halus premium dengan perpaduan rempah seimbang."
      }

      if (filtered.length === 0) {
        filtered = allProducts.slice(0, 4)
      }

      return NextResponse.json({
        reply: `${tasteDescription}\n\nSemua produk di atas siap dikirim hari ini. Kakak bisa klik tombol **[Pesan Produk Ini]** di kartu bawah untuk langsung transaksi via QRIS:`,
        tool_type: "stock_card",
        tool_data: {
          items: filtered.slice(0, 4),
        },
      })
    }

    // ── Scenario D: SOP, Penyimpanan & Garansi ──
    const isSopQuery =
      textLower.includes("simpan") ||
      textLower.includes("kering") ||
      textLower.includes("garansi") ||
      textLower.includes("retur") ||
      textLower.includes("komplain") ||
      textLower.includes("ekspedisi") ||
      textLower.includes("ongkir")

    if (isSopQuery) {
      if (textLower.includes("simpan") || textLower.includes("kering") || textLower.includes("awet")) {
        return NextResponse.json({
          reply:
            "📖 **Panduan Resmi SOP Penyimpanan Tembakau Prawira Tobacco:**\n\n" +
            "1. **Wadah Kedap Udara**: Simpan tembakau di dalam toples kaca kedap udara atau pouch tertutup rapat untuk menjaga kelembaban alaminya.\n" +
            "2. **Kelembaban Optimal (RH)**: Ideal berada pada **65% - 70%** di suhu ruang teduh (20–25°C). Hindari paparan sinar matahari langsung.\n" +
            "3. **Tips Tembakau Kering**: Jika tembakau terasa terlalu kering, letakkan sedikit kulit jeruk/apel bersih atau *hydrostone* basah di dalam toples selama 2–4 jam, tembakau akan kembali pulih dan aromatik!\n\n" +
            "Ada varian tembakau yang ingin Kakak pesan hari ini?",
        })
      } else {
        return NextResponse.json({
          reply:
            "🛡️ **Kebijakan Garansi & Retur Prawira Tobacco:**\n\n" +
            "1. **Garansi 100% Produk Original & Fresh**: Kami menjamin kualitas tembakau dan perlengkapan tingwe sampai ke tangan Anda dalam kondisi prima.\n" +
            "2. **Klaim Retur**: Komplain dapat diajukan maksimal **2x24 jam** sejak paket dinyatakan diterima oleh kurir, dengan menyertakan **video unboxing utuh tanpa jeda**.\n" +
            "3. **Pengiriman**: Didukung oleh sistem ekspedisi Biteship (JNE, J&T, SiCepat, Anteraja) dengan nomor resi otomatis yang bisa dilacak langsung di website.",
        })
      }
    }

    // ── Scenario E: Specific Stock / Product Inquiry ──
    const isStockInquiry =
      textLower.includes("stok") ||
      textLower.includes("stock") ||
      textLower.includes("ready") ||
      textLower.includes("ada") ||
      textLower.includes("tersedia") ||
      textLower.includes("sisa") ||
      textLower.includes("punya") ||
      textLower.includes("berapa") ||
      textLower.includes("harga")

    if (matchedProducts.length > 0) {
      if (matchedProducts.length === 1) {
        const prod = matchedProducts[0]
        const isReady = prod.in_stock > 0
        const descText = prod.description && prod.description !== "bako" ? `\n• **Karakter**: ${prod.description}` : ""
        const reply = isReady
          ? `✅ Varian **${prod.name}** saat ini **READY STOCK** di gudang Prawira Tobacco!\n\n` +
            `• **Harga**: ${formatRupiah(prod.price)} / pack\n` +
            `• **Sisa Stok**: **${prod.in_stock} pack** siap kirim hari ini${descText}\n\n` +
            `Kakak bisa langsung klik tombol **[Pesan Varian Ini]** di kartu bawah atau ketik langsung nama, no. WA, dan alamat untuk pemesanan & bayar via QRIS langsung di chat!`
          : `⚠️ Mohon maaf Kak, varian **${prod.name}** saat ini sedang **HABIS** (Stok: 0). Kami sedang memproses restock dari supplier. Kakak bisa melihat varian serupa lainnya di kartu bawah!`

        return NextResponse.json({
          reply,
          tool_type: "stock_card",
          tool_data: {
            items: [prod],
            prompt_fill: `Saya mau pesan 1 pack ${prod.name}.\nNama: \nNo WA: 08\nAlamat: `,
          },
        })
      }

      return NextResponse.json({
        reply: `Berikut data ketersediaan stok real-time untuk varian yang relevan di gudang Prawira Tobacco:`,
        tool_type: "stock_card",
        tool_data: {
          items: matchedProducts.slice(0, 4),
        },
      })
    }

    if (isStockInquiry && matchedProducts.length === 0) {
      const popularKretek = allProducts.filter((p) =>
        ["Linting Surya", "Linting Samsu", "Linting Marlong", "Barrack Whiskey Ice", "Linting Melon Ice"].includes(p.name)
      )
      return NextResponse.json({
        reply:
          "Mohon maaf Kak, varian yang Kakak tanyakan saat ini **belum tersedia** di katalog gudang Prawira Tobacco. 🙏\n\n" +
          "Namun kami memiliki varian tembakau favorit nusantara yang saat ini **ready stock** dan sangat diminati:\n" +
          "1. **Linting Surya** — Aroma cengkeh madu gurih mantap (Rp 24.000)\n" +
          "2. **Linting Samsu** — Citarasa kretek klasik legendaris 234 (Rp 24.000)\n" +
          "3. **Barrack Whiskey Ice** — Whiskey dingin menyegarkan (Rp 22.000)\n\n" +
          "Kakak bisa melihat dan memesannya langsung dari kartu di bawah ini:",
        tool_type: "stock_card",
        tool_data: {
          items: popularKretek.slice(0, 3),
        },
      })
    }

    // ── Scenario F: General Assistance / Default Tobacco Consultant ──
    return NextResponse.json({
      reply:
        "Halo Kak! Saya **Kurator Tembakau Prawira**. 🍂\n\n" +
        "Saya dapat membantu Anda:\n" +
        "1. **Konsultasi Rasa & Aroma** (Manis Buah, Dingin/Ice, Kretek Gurih, Mild).\n" +
        "2. **Cek Stok Real-Time** katalog tembakau nusantara & aksesoris linting (papir, filter, cengkeh).\n" +
        "3. **Pesan Langsung & Bayar QRIS**: Cukup sebutkan varian dan alamat Anda, saya akan buatkan pesanan dan kirimkan **QRIS resmi** di layar ini!\n\n" +
        "Varian tembakau apa yang sedang Kakak cari hari ini?",
      tool_type: "stock_card",
      tool_data: {
        items: allProducts.slice(0, 3),
      },
    })
  } catch (error: any) {
    console.error("🔥 Chat API Exception:", error)
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal pada server chat assistant." },
      { status: 500 }
    )
  }
}

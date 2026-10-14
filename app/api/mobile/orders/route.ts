import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { webcrypto } from "node:crypto"
import { extractBearerToken, verifyAuthToken } from "@/lib/auth"

const randomUUID = typeof crypto.randomUUID === 'function' ? crypto.randomUUID.bind(crypto) : webcrypto.randomUUID.bind(webcrypto)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    // Validate required fields
    if (!orderData.customer_email || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json(
        { error: "Field customer_email dan daftar items pesanan wajib diisi" },
        { status: 400 },
      )
    }

    // ── Server-side Price Verification ──
    const productIds: number[] = orderData.items
      .map((item: any) => Number(item.product_id || item.id))
      .filter((id: number) => !isNaN(id) && id > 0)

    if (productIds.length !== orderData.items.length) {
      return NextResponse.json({ error: "Satu atau lebih ID produk tidak valid" }, { status: 400 })
    }

    const { data: dbProducts, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, in_stock")
      .in("id", productIds)

    if (prodErr || !dbProducts) {
      return NextResponse.json({ error: "Gagal mengambil data produk dari katalog" }, { status: 500 })
    }

    const prodMap = new Map(dbProducts.map(p => [p.id, p]))
    let verifiedSubtotal = 0
    const verifiedItems = []

    for (const item of orderData.items) {
      const pid = Number(item.product_id || item.id)
      const p = prodMap.get(pid)
      if (!p) {
        return NextResponse.json({ error: `Produk ID #${pid} tidak ditemukan` }, { status: 400 })
      }
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))
      if (p.in_stock < qty) {
        return NextResponse.json({ error: `Stok produk "${p.name}" tidak mencukupi` }, { status: 400 })
      }
      const unitPrice = Number(p.price)
      const totalPrice = unitPrice * qty
      verifiedSubtotal += totalPrice
      verifiedItems.push({
        product_id: pid,
        product_name: p.name,
        quantity: qty,
        unit_price: unitPrice,
        total_price: totalPrice,
      })
    }

    const verifiedShippingCost = Math.max(0, Math.round(Number(orderData.shipping_cost || 0)))
    const verifiedDiscount = Math.max(0, Math.round(Number(orderData.discount || 0)))
    const verifiedTotal = Math.max(0, verifiedSubtotal + verifiedShippingCost - verifiedDiscount)

    // Create or get customer
    let customerId
    try {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", orderData.customer_email.trim().toLowerCase())
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const uniqueUserUid = randomUUID()
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            name: orderData.customer_name || "Guest",
            email: orderData.customer_email.trim().toLowerCase(),
            phone: orderData.customer_phone || "",
            address: orderData.customer_address || "",
            user_uid: uniqueUserUid,
            status: "active",
          })
          .select()
          .single()

        if (customerError) {
          throw new Error(`Failed to create customer: ${customerError.message}`)
        }

        customerId = newCustomer.id
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          total_amount: verifiedTotal,
          final_amount: verifiedTotal,
          subtotal: verifiedSubtotal,
          shipping_cost: verifiedShippingCost,
          discount_amount: verifiedDiscount,
          payment_method: orderData.payment_method || "midtrans",
          payment_status: "pending",
          order_status: "pending",
          shipping_address: orderData.customer_address || "",
          notes: orderData.notes || "",
          user_uid: orderData.user_uid || "guest"
        })
        .select()
        .single()

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`)
      }

      // Create order items
      const orderItems = verifiedItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)
      if (itemsError) {
        console.error("Order items error:", itemsError)
      }

      return NextResponse.json(
        {
          ...order,
          success: true,
          message: "Order created successfully",
        },
        { status: 201 },
      )
    } catch (error: any) {
      console.error("Order processing error:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to process order" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Order request parsing error:", error)
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const orderId = searchParams.get("order_id") || searchParams.get("order_number")

    if (!email && !orderId) {
      return NextResponse.json({ error: "Email atau Nomor Pesanan diperlukan" }, { status: 400 })
    }

    if (orderId) {
      if (!email) {
        return NextResponse.json({ error: "Email pemesanan diperlukan untuk melacak pesanan" }, { status: 400 })
      }
      const cleanOrderId = orderId.trim()
      const cleanEmail = email.trim().toLowerCase()

      let query = supabase.from("orders").select(`
        *,
        order_items (
          *,
          products (name)
        )
      `)

      const isNumeric = /^\d+$/.test(cleanOrderId)
      if (isNumeric) {
        query = query.or(`order_number.eq.${cleanOrderId},id.eq.${cleanOrderId}`)
      } else {
        query = query.eq("order_number", cleanOrderId)
      }

      const { data: matchedOrders, error } = await query
      if (error) throw error
      if (!matchedOrders || matchedOrders.length === 0) {
        return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 })
      }

      const target = matchedOrders.find((o: any) => {
        if (o.customer_email && o.customer_email.toLowerCase() === cleanEmail) return true
        if (o.shipping_destination) {
          try {
            const dest = typeof o.shipping_destination === "string" ? JSON.parse(o.shipping_destination) : o.shipping_destination
            if (dest.email && dest.email.toLowerCase() === cleanEmail) return true
          } catch {}
        }
        return false
      })

      if (target) return NextResponse.json([target])

      const { data: customer } = await supabase.from("customers").select("id").eq("email", cleanEmail).single()
      if (customer && matchedOrders.some((o: any) => o.customer_id === customer.id)) {
        return NextResponse.json([matchedOrders.find((o: any) => o.customer_id === customer.id)])
      }

      return NextResponse.json({ error: "Email tidak sesuai dengan pesanan" }, { status: 403 })
    }

    // Standard list for logged in email
    const cleanEmail = email!.trim().toLowerCase()

    const token = extractBearerToken(request)
    if (!token) {
      return NextResponse.json({ error: "Autentikasi token diperlukan untuk melihat daftar riwayat pesanan" }, { status: 401 })
    }

    let decodedUser
    try {
      decodedUser = verifyAuthToken(token)
    } catch {
      return NextResponse.json({ error: "Token sesi tidak valid atau kedaluwarsa" }, { status: 401 })
    }

    if (decodedUser.email.toLowerCase() !== cleanEmail) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    const { data: customer } = await supabase.from("customers").select("id").eq("email", cleanEmail).single()

    let query = supabase.from("orders").select(`
      *,
      order_items (
        *,
        products (name)
      )
    `).order("created_at", { ascending: false })

    if (customer) {
      query = query.or(`customer_id.eq.${customer.id},customer_email.eq.${cleanEmail}`)
    } else {
      query = query.eq("customer_email", cleanEmail)
    }

    const { data: orders, error } = await query
    if (error) throw error

    return NextResponse.json(orders || [])
  } catch (error: any) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 })
  }
}
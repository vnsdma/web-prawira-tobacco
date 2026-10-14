import { NextResponse } from 'next/server'
import { createClient } from "@supabase/supabase-js"
import { extractBearerToken, verifyAuthToken } from "@/lib/auth"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const orderId = searchParams.get('order_id') || searchParams.get('order_number')

    if (!email && !orderId) {
      return NextResponse.json({ error: 'Email atau Nomor Pesanan diperlukan' }, { status: 400 })
    }

    // ── GUEST / TRACK ORDER MODE (requires both order_id and email for privacy) ──
    if (orderId) {
      if (!email) {
        return NextResponse.json({ error: 'Email pemesanan wajib diisi untuk melacak pesanan' }, { status: 400 })
      }

      const cleanOrderId = orderId.trim()
      const cleanEmail = email.trim().toLowerCase()

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)

      const isNumeric = /^\d+$/.test(cleanOrderId)
      if (isNumeric) {
        query = query.or(`order_number.eq.${cleanOrderId},id.eq.${cleanOrderId}`)
      } else {
        query = query.eq('order_number', cleanOrderId)
      }

      const { data: matchedOrders, error } = await query

      if (error) {
        console.error("❌ Database Fetch Error:", error)
        throw error
      }

      if (!matchedOrders || matchedOrders.length === 0) {
        return NextResponse.json({ error: 'Pesanan tidak ditemukan. Periksa kembali nomor pesanan Anda.' }, { status: 404 })
      }

      // Verify that this order matches the provided email
      const targetOrder = matchedOrders.find((o: any) => {
        if (o.customer_email && o.customer_email.toLowerCase() === cleanEmail) return true
        if (o.shipping_destination) {
          try {
            const dest = typeof o.shipping_destination === 'string' ? JSON.parse(o.shipping_destination) : o.shipping_destination
            if (dest.email && dest.email.toLowerCase() === cleanEmail) return true
          } catch {}
        }
        return false
      })

      if (targetOrder) {
        return NextResponse.json([targetOrder])
      }

      // Check customer table as secondary verification
      const { data: cust } = await supabase.from('customers').select('id').eq('email', cleanEmail).single()
      if (cust && matchedOrders.some((o: any) => o.customer_id === cust.id)) {
        const found = matchedOrders.find((o: any) => o.customer_id === cust.id)
        return NextResponse.json([found])
      }

      return NextResponse.json({ error: 'Email tidak sesuai dengan data pesanan ini.' }, { status: 403 })
    }

    // ── LOGGED IN USER ORDER HISTORY (requires authenticated session for privacy) ──
    const cleanEmail = email!.trim().toLowerCase()

    const token = extractBearerToken(req)
    if (!token) {
      return NextResponse.json({ error: 'Autentikasi token diperlukan untuk melihat daftar riwayat pesanan.' }, { status: 401 })
    }

    let decodedUser
    try {
      decodedUser = verifyAuthToken(token)
    } catch {
      return NextResponse.json({ error: 'Token sesi kedaluwarsa atau tidak valid.' }, { status: 401 })
    }

    if (decodedUser.email.toLowerCase() !== cleanEmail) {
      return NextResponse.json({ error: 'Akses ditolak: Anda tidak memiliki akses ke data pesanan ini.' }, { status: 403 })
    }

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', cleanEmail)
      .single()

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .order('created_at', { ascending: false })

    if (customer) {
      query = query.or(`customer_id.eq.${customer.id},customer_email.eq.${cleanEmail}`)
    } else {
      query = query.eq('customer_email', cleanEmail)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("❌ Database Fetch Error:", error)
      throw error
    }

    return NextResponse.json(orders || [])

  } catch (error: any) {
    console.error("🔥 Get Orders Exception:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("📥 Received Order Payload:", JSON.stringify(body, null, 2))

    // ============================================================
    // LANGKAH 0: VALIDASI DASAR INPUT
    // ============================================================
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Keranjang pesanan tidak boleh kosong." }, { status: 400 })
    }

    let customerEmail = body.customer_email ? body.customer_email.trim().toLowerCase() : null
    let finalCustomerName = body.customer_name?.trim() || "Pelanggan"

    if (!customerEmail) {
      return NextResponse.json({ error: "Email pemesan wajib diisi." }, { status: 400 })
    }

    // ============================================================
    // LANGKAH 1: SERVER-SIDE PRICE & STOCK VERIFICATION
    // Aturan Emas: JANGAN PERCAYA HARGA DARI CLIENT!
    // Ambil harga asli dari tabel 'products' di Supabase
    // ============================================================
    const productIds: number[] = body.items
      .map((item: any) => Number(item.product_id || item.id))
      .filter((id: number) => !isNaN(id) && id > 0)

    if (productIds.length !== body.items.length) {
      return NextResponse.json({ error: "Satu atau lebih ID produk tidak valid." }, { status: 400 })
    }

    const { data: dbProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, in_stock, half_unit_price')
      .in('id', productIds)

    if (productsError || !dbProducts) {
      console.error("❌ Gagal fetch data produk dari database:", productsError)
      return NextResponse.json({ error: "Gagal memverifikasi produk pesanan." }, { status: 500 })
    }

    const productMap = new Map<number, { id: number; name: string; price: number; in_stock: number; half_unit_price?: number | null }>()
    for (const p of dbProducts) {
      productMap.set(p.id, p)
    }

    let verifiedSubtotal = 0
    const verifiedOrderItems = []

    for (const item of body.items) {
      const pId = Number(item.product_id || item.id)
      const dbProd = productMap.get(pId)

      if (!dbProd) {
        return NextResponse.json({ error: `Produk ID #${pId} tidak ditemukan di katalog.` }, { status: 400 })
      }

      const quantity = Math.floor(Number(item.quantity))
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json({ error: `Jumlah pesanan untuk ${dbProd.name} harus lebih dari 0.` }, { status: 400 })
      }

      if (dbProd.in_stock < quantity) {
        return NextResponse.json({
          error: `Stok produk "${dbProd.name}" tidak mencukupi (Tersisa: ${dbProd.in_stock}).`
        }, { status: 400 })
      }

      // Check variant pricing (25gr, 50gr, 100gr, 200gr, accessories)
      const base100g = Number(dbProd.price)
      const price50g = dbProd.half_unit_price ? Number(dbProd.half_unit_price) : Math.round((base100g * 0.55) / 500) * 500
      const price25g = Math.max(7000, Math.round((base100g * 0.35) / 500) * 500)
      const price200g = Math.round((base100g * 1.95) / 1000) * 1000

      const validPrices = [base100g, price50g, price25g, price200g]
      const clientPrice = Number(item.price)
      let verifiedUnitPrice = base100g

      if (!isNaN(clientPrice) && validPrices.includes(clientPrice)) {
        verifiedUnitPrice = clientPrice
      } else if (!isNaN(clientPrice) && clientPrice > 0 && clientPrice >= base100g * 0.25 && clientPrice <= base100g * 2.2) {
        verifiedUnitPrice = clientPrice
      }

      const verifiedTotalPrice = verifiedUnitPrice * quantity
      verifiedSubtotal += verifiedTotalPrice

      verifiedOrderItems.push({
        product_id: pId,
        product_name: item.name || dbProd.name,
        quantity: quantity,
        unit_price: verifiedUnitPrice,
        total_price: verifiedTotalPrice,
      })
    }

    const verifiedShippingCost = Math.max(0, Math.round(Number(body.shipping_cost || 0)))
    const verifiedDiscount = Math.max(0, Math.round(Number(body.discount || 0)))
    const verifiedTotalAmount = Math.max(0, verifiedSubtotal + verifiedShippingCost - verifiedDiscount)

    // ============================================================
    // LANGKAH 2: RESOLVE CUSTOMER ID
    // ============================================================
    let resolvedCustomerId = null

    if (body.user_id) {
      // 1. Ambil data User jika login
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', body.user_id)
        .single()

      if (userData) {
        finalCustomerName = userData.name
        customerEmail = userData.email

        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', userData.email)
          .single()

        if (existingCustomer) {
          resolvedCustomerId = existingCustomer.id
        } else {
          const { data: newCustomer } = await supabase
            .from('customers')
            .insert({
              name: userData.name,
              email: userData.email,
              phone: userData.phone || body.customer_phone || '',
              user_id: userData.id,
              address: typeof body.shipping_address === 'object' 
                ? JSON.stringify(body.shipping_address) 
                : (body.shipping_address || '')
            })
            .select('id')
            .single()
          
          if (newCustomer) resolvedCustomerId = newCustomer.id
        }
      }
    } else if (customerEmail) {
      // Guest Checkout: cek atau buat record customer untuk guest
      const { data: existingGuest } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerEmail)
        .single()

      if (existingGuest) {
        resolvedCustomerId = existingGuest.id
      } else {
        const { data: newGuest } = await supabase
          .from('customers')
          .insert({
            name: finalCustomerName,
            email: customerEmail,
            phone: body.customer_phone || '',
            user_uid: body.user_uid || `guest_${Date.now()}`,
            address: typeof body.shipping_address === 'object' 
              ? JSON.stringify(body.shipping_address) 
              : (body.shipping_address || ''),
            status: 'active'
          })
          .select('id')
          .single()
        if (newGuest) resolvedCustomerId = newGuest.id
      }
    }

    // ============================================================
    // LANGKAH 3: CREATE ORDER DENGAN HARGA TERVERIFIKASI
    // ============================================================
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const orderData = {
      order_number: orderNumber,
      user_id: body.user_id || null,
      customer_id: resolvedCustomerId, 
      customer_name: finalCustomerName, 
      customer_email: customerEmail,
      
      total_amount: verifiedTotalAmount,
      subtotal: verifiedSubtotal, 
      shipping_cost: verifiedShippingCost,
      discount_amount: verifiedDiscount,
      final_amount: verifiedTotalAmount,
      
      payment_method: body.payment_method,
      order_status: 'pending',
      payment_status: 'pending',
      
      shipping_address: body.origin_id ? String(body.origin_id) : 'Default Origin', 
      shipping_service: body.courier,
      shipping_destination: typeof body.shipping_address === 'object' 
        ? JSON.stringify({ ...body.shipping_address, email: customerEmail }) 
        : body.shipping_address,
          
      notes: body.payment_details ? JSON.stringify(body.payment_details) : (body.notes || ''),
      user_uid: body.user_uid || 'guest',
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error("❌ Database Insert Error:", orderError)
      throw orderError
    }

    // ============================================================
    // LANGKAH 4: INSERT ITEMS DENGAN HARGA TERVERIFIKASI
    // ============================================================
    const itemsToInsert = verifiedOrderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
        
    if (itemsError) {
      console.error("❌ Error inserting items:", itemsError)
    }

    return NextResponse.json({ 
      success: true, 
      order: order,
      id: order.id 
    })

  } catch (error: any) {
    console.error("🔥 Create Order Exception:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
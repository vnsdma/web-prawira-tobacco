import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createDynamicQRISOrder } from "@/lib/qris/gateway-client"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json({ error: "order_id diperlukan." }, { status: 400 })
    }

    // 1. Keamanan: Ambil data order asli dari database
    const cleanOrderId = String(order_id).trim()
    const isNumericId = !isNaN(Number(cleanOrderId))
    let query = supabase.from("orders").select("*, order_items(*)")
    if (isNumericId) {
      query = query.or(`id.eq.${cleanOrderId},order_number.eq.${cleanOrderId}`)
    } else {
      query = query.eq("order_number", cleanOrderId)
    }

    const { data: order, error: orderError } = await query.single()
    if (orderError || !order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan di database." }, { status: 404 })
    }

    if (order.payment_status === "paid" || order.payment_status === "settlement") {
      return NextResponse.json({ error: "Pesanan ini sudah dibayar." }, { status: 400 })
    }

    const verifiedAmount = Math.round(Number(order.final_amount || order.total_amount))
    if (verifiedAmount <= 0) {
      return NextResponse.json({ error: "Nominal pesanan tidak valid." }, { status: 400 })
    }

    const invoiceNumber = order.order_number || `ORD-${order.id}`

    console.log(`🚀 [${invoiceNumber}] Membuat Dynamic QRIS Mandiri untuk nominal Rp${verifiedAmount}...`)

    // 2. Generate Dynamic QRIS via RadarPay / Embedded QRIS Engine
    const qrisResult = await createDynamicQRISOrder({
      orderId: String(order.id),
      invoiceNumber,
      amount: verifiedAmount,
      customerName: order.customer_name || "Pelanggan Prawira",
      customerPhone: order.customer_phone || undefined,
      notes: `Pembayaran ${invoiceNumber}`,
    })

    // 3. Simpan transactionId dan final_amount (dengan kode unik jika ada) ke Supabase
    let updateQuery = supabase.from("orders").update({
      transaction_id: qrisResult.transactionId,
      payment_method: "qris",
      payment_status: "pending",
      final_amount: qrisResult.finalAmount,
      updated_at: new Date().toISOString(),
    })

    if (isNumericId) {
      updateQuery = updateQuery.eq("id", cleanOrderId)
    } else {
      updateQuery = updateQuery.eq("order_number", cleanOrderId)
    }
    await updateQuery

    const finalData = {
      transactionId: qrisResult.transactionId,
      invoiceNumber: qrisResult.invoiceNumber,
      baseAmount: qrisResult.baseAmount,
      uniqueCode: qrisResult.uniqueCode,
      totalAmount: qrisResult.finalAmount,
      qr_string: qrisResult.qr_string,
      qr_image_url: qrisResult.qr_image_url,
      expiration: 15,
      status: "pending",
      source: qrisResult.source,
    }

    return NextResponse.json({ success: true, data: finalData })
  } catch (error: any) {
    console.error("❌ QRIS Payment Error:", error)
    return NextResponse.json({ error: error.message || "Gagal membuat Dynamic QRIS" }, { status: 500 })
  }
}

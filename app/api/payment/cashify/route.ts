import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Mapping sederhana, kita fokus ke id.qris
const PACKAGE_IDS: Record<string, string> = {
  qris: "id.qris" 
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id } = body 

    // 1. Validasi Input Awal
    if (!order_id) {
      return NextResponse.json({ error: "order_id diperlukan." }, { status: 400 })
    }

    // 2. Keamanan: Ambil nominal dari database, JANGAN percaya body.amount
    const cleanOrderId = String(order_id).trim()
    const isNumericId = !isNaN(Number(cleanOrderId))
    let query = supabase.from("orders").select("*")
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

    // Config
    const licenseKey = process.env.CASHIFY_LICENSE_KEY
    const qrId = process.env.CASHIFY_QR_ID
    const baseUrl = "https://cashify.my.id/api"

    const payload = {
      qr_id: qrId, 
      amount: verifiedAmount,
      useUniqueCode: true,
      packageIds: ["com.gojek.gopaymerchant"], // Selalu id.qris
      expiredInMinutes: 15,
      qrType: "dynamic",
      paymentMethod: "qris",
      useQris: true
    }

    console.log(`🚀 [${cleanOrderId}] Requesting Cashify QRIS with verified amount Rp${verifiedAmount}...`)

    const response = await fetch(`${baseUrl}/generate/v2/qris`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-license-key": licenseKey!,
      },
      body: JSON.stringify(payload),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ error: result.message || "Gagal membuat QRIS Cashify" }, { status: response.status })
    }

    // Ekstraksi Data
    const sourceData = result?.data?.data || result?.data || result
    const trxId = sourceData.transactionId || sourceData.id || result.transactionId

    const rawQrString = sourceData.qr_string || 
                        sourceData.qr_content || 
                        sourceData.qrString || 
                        sourceData.qr_code || 
                        sourceData.qrCode || 
                        sourceData.qrData || 
                        sourceData.qr_data || 
                        sourceData.content || ""

    if (trxId) {
      let updateQuery = supabase.from('orders').update({ transaction_id: trxId })
      if (isNumericId) {
        updateQuery = updateQuery.eq('id', cleanOrderId)
      } else {
        updateQuery = updateQuery.eq('order_number', cleanOrderId)
      }
      await updateQuery
    }
    
    const finalData = {
      transactionId: trxId,
      totalAmount: sourceData.totalAmount || verifiedAmount, 
      qr_string: rawQrString, 
      expiration: sourceData.expiredInMinutes || 15,
      status: "pending",
    }

    return NextResponse.json({ success: true, data: finalData })

  } catch (error: any) {
    console.error("❌ Cashify API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
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
    const { amount, order_id } = body 
    // Kita tidak butuh ewalletType spesifik lagi dari frontend, kita set default 'qris'

    // 1. Validasi Input Awal
    if (!order_id) {
        return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
    }

    // Config
    const licenseKey = process.env.CASHIFY_LICENSE_KEY
    const qrId = process.env.CASHIFY_QR_ID
    const baseUrl = "https://cashify.my.id/api"

    // Default ke QRIS
    const selectedPackageId = PACKAGE_IDS['qris']

    const payload = {
      qr_id: qrId, 
      amount: Math.round(amount),
      useUniqueCode: true,
      packageIds: ["com.gojek.gopaymerchant"], // Selalu id.qris
      expiredInMinutes: 15,
      qrType: "dynamic",
      paymentMethod: "qris",
      useQris: true
    }

    console.log(`🚀 [${order_id}] Requesting Cashify QRIS...`)

    const response = await fetch(`${baseUrl}/generate/v2/qris`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-license-key": licenseKey!,
      },
      body: JSON.stringify(payload),
    })
    
    const result = await response.json()
    
    // ... (Logika Error Handling sama seperti sebelumnya) ...
    if (!response.ok) {
      return NextResponse.json({ error: result.message || "Failed" }, { status: response.status })
    }

    // Ekstraksi Data
    const sourceData = result.data || result; 
    const trxId = sourceData.transactionId || sourceData.id || result.transactionId;

    // ... (Logika Update Supabase sama seperti sebelumnya) ...
    if (trxId) {
        // Cek apakah order_id angka atau string
        const isNumericId = !isNaN(Number(order_id));
        let query = supabase.from('orders').update({ transaction_id: trxId });

        if (isNumericId) {
            query = query.eq('id', order_id);
        } else {
            query = query.eq('order_number', order_id);
        }
        await query;
    }

    // Return Data
    const finalData = {
        transactionId: trxId,
        totalAmount: sourceData.totalAmount || sourceData.amount, 
        qr_string: sourceData.qr_string || sourceData.qr_content || sourceData.qrString,
        expiration: sourceData.expiredInMinutes || 15,
        status: "pending"
    }

    return NextResponse.json({ success: true, data: finalData })

  } catch (error: any) {
    console.error("❌ API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
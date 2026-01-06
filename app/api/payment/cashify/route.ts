import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// 1. Definisikan Package IDs
const PACKAGE_IDS: Record<string, string> = {
  // QRIS Universal (Sesuai request Anda menggunakan package ID GoPay Merchant)
  qris: "com.gojek.gopaymerchant", 
  
  // E-Wallet Spesifik
  dana: "id.dana",
  ovo: "id.ovo",
  gopay: "id.gopay",
  shopeepay: "id.shopeepay",
  linkaja: "id.linkaja",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, order_id, ewalletType } = body 
    // ewalletType akan berisi: 'qris', 'dana', 'ovo', dll.

    if (!order_id) {
        return NextResponse.json({ error: "Missing order_id" }, { status: 400 })
    }

    const licenseKey = process.env.CASHIFY_LICENSE_KEY
    const qrId = process.env.CASHIFY_QR_ID
    const baseUrl = "https://cashify.my.id/api"

    // 2. Tentukan Package ID berdasarkan pilihan user
    // Jika tidak ketemu, default ke QRIS
    const selectedPackageId = PACKAGE_IDS[ewalletType] || PACKAGE_IDS['qris']

    // 3. Tentukan paymentMethod untuk payload Cashify
    // Jika tipe 'qris', kirim 'qris'. Jika lainnya, kirim 'ewallet'.
    const cashifyPaymentMethod = ewalletType === 'qris' ? 'qris' : 'ewallet';

    const payload = {
      qr_id: qrId, 
      amount: Math.round(amount),
      useUniqueCode: true,
      packageIds: [selectedPackageId], // Package ID dinamis sesuai pilihan
      expiredInMinutes: 15,
      qrType: "dynamic",
      paymentMethod: cashifyPaymentMethod, // 'qris' atau 'ewallet'
      useQris: true
    }

    console.log(`🚀 [${order_id}] Requesting Cashify (${ewalletType}):`, JSON.stringify(payload))

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
      return NextResponse.json({ error: result.message || "Failed" }, { status: response.status })
    }

    // Ekstraksi Data
    const sourceData = result.data || result; 
    const trxId = sourceData.transactionId || sourceData.id || result.transactionId;

    // Update Transaction ID ke Supabase
    if (trxId) {
        const isNumericId = !isNaN(Number(order_id));
        let query = supabase.from('orders').update({ transaction_id: trxId });

        if (isNumericId) {
            query = query.eq('id', order_id);
        } else {
            query = query.eq('order_number', order_id);
        }
        await query;
    }

    const finalData = {
        transactionId: trxId,
        totalAmount: sourceData.totalAmount || sourceData.amount, 
        qr_string: sourceData.qr_string || sourceData.qr_content,
        expiration: sourceData.expiredInMinutes || 15,
        status: "pending"
    }

    return NextResponse.json({ success: true, data: finalData })

  } catch (error: any) {
    console.error("❌ API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
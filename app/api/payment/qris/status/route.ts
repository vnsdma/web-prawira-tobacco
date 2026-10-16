import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkRadarPayStatus } from "@/lib/qris/gateway-client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { transactionId, order_id } = await request.json()

    if (!transactionId && !order_id) {
      return NextResponse.json({ error: "Transaction ID atau order_id diperlukan" }, { status: 400 })
    }

    // 1. Ambil Data Order dari Supabase
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

    const { data: currentOrder, error: fetchError } = await query.single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({
        success: false,
        error: "Order tidak ditemukan di database dengan ID transaksi ini",
      }, { status: 404 })
    }

    // 2. Jika di database sudah status 'paid', langsung kembalikan sukses
    if (currentOrder.payment_status === "paid" || currentOrder.order_status === "confirmed") {
      return NextResponse.json({
        success: true,
        final_status: "paid",
        db_update: "Already Paid",
        order_number: currentOrder.order_number,
      })
    }

    // 3. Cek ke RadarPay Gateway API jika ada transactionId
    let isPaid = false
    if (currentOrder.transaction_id) {
      const externalStatus = await checkRadarPayStatus(currentOrder.transaction_id)
      if (externalStatus && ["paid", "success", "settlement", "completed"].includes(externalStatus)) {
        isPaid = true
      }
    }

    // 4. Jika terkonfirmasi bayar, update order dan kurangi stok
    let dbUpdateStatus = "No Update Needed"
    if (isPaid) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          order_status: "confirmed",
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentOrder.id)

      if (updateError) {
        console.error("❌ Supabase Update Error:", updateError)
        dbUpdateStatus = "Failed: DB Update Error"
      } else {
        console.log(`✅ Order #${currentOrder.order_number} berhasil diverifikasi LUNAS (PAID)`)
        dbUpdateStatus = "Success"

        // Kurangi stok produk
        if (currentOrder.order_items && currentOrder.order_items.length > 0) {
          for (const item of currentOrder.order_items) {
            const { data: product } = await supabase
              .from("products")
              .select("id, in_stock")
              .eq("id", item.product_id)
              .single()

            if (product) {
              const newStock = Math.max(0, product.in_stock - item.quantity)
              await supabase
                .from("products")
                .update({ in_stock: newStock })
                .eq("id", item.product_id)
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      final_status: isPaid ? "paid" : (currentOrder.payment_status || "pending"),
      db_update: dbUpdateStatus,
      order_number: currentOrder.order_number,
    })
  } catch (error: any) {
    console.error("QRIS Check status error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}

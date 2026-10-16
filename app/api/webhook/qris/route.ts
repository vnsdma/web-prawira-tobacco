import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-qris-signature")
    const webhookSecret = process.env.QRIS_WEBHOOK_SECRET || process.env.RADARPAY_WEBHOOK_SECRET

    // 1. Verifikasi HMAC signature jika secret dikonfigurasi
    if (webhookSecret && signature) {
      const computedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex")

      if (computedSignature !== signature) {
        console.error("❌ QRIS Webhook: Invalid HMAC signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody)
    const { event, order_id, invoice_number, status } = payload

    console.log(`🔔 QRIS Webhook Received: ${event} for ${invoice_number || order_id} (${status})`)

    if (event === "payment.success" || status === "PAID") {
      // 2. Cari order berdasarkan order_id atau invoice_number
      let query = supabase.from("orders").select("*, order_items(*)")
      if (invoice_number) {
        query = query.eq("order_number", invoice_number)
      } else if (order_id) {
        query = query.or(`id.eq.${order_id},transaction_id.eq.${order_id}`)
      }

      const { data: order, error: fetchErr } = await query.single()

      if (fetchErr || !order) {
        console.warn("⚠️ QRIS Webhook: Order tidak ditemukan di database:", invoice_number || order_id)
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
      }

      // Jika belum dibayar, update status dan kurangi stok
      if (order.payment_status !== "paid") {
        await supabase
          .from("orders")
          .update({
            order_status: "confirmed",
            payment_status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)

        // Kurangi stok produk
        if (order.order_items && order.order_items.length > 0) {
          for (const item of order.order_items) {
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

        console.log(`✅ QRIS Webhook: Order #${order.order_number} sukses diverifikasi LUNAS`)
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed" })
  } catch (err: any) {
    console.error("❌ QRIS Webhook error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { snap } from "@/lib/midtrans"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { order_id, customer } = await request.json()

    if (!order_id) {
      return NextResponse.json({ error: "order_id diperlukan." }, { status: 400 })
    }

    // Server-side verification: fetch order and verified amount from database
    const cleanOrderId = String(order_id).trim()
    const isNumeric = /^\d+$/.test(cleanOrderId)

    let query = supabase.from("orders").select("*")
    if (isNumeric) {
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

    const verifiedGrossAmount = Math.round(Number(order.final_amount || order.total_amount))
    if (verifiedGrossAmount <= 0) {
      return NextResponse.json({ error: "Nominal pembayaran tidak valid." }, { status: 400 })
    }

    let customerAddress = ""
    if (typeof order.shipping_destination === "string") {
      try {
        const parsed = JSON.parse(order.shipping_destination)
        customerAddress = parsed.address || ""
      } catch {
        customerAddress = order.shipping_destination
      }
    }

    const parameter = {
      transaction_details: {
        order_id: String(order.order_number || order.id),
        gross_amount: verifiedGrossAmount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: customer?.name || order.customer_name || "Pelanggan",
        email: customer?.email || order.customer_email || undefined,
        phone: customer?.phone || undefined,
        billing_address: {
          address: customer?.address || customerAddress || "",
        },
      },
    }

    const transaction = await snap.createTransaction(parameter)

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    })
  } catch (error) {
    console.error("Midtrans payment error:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
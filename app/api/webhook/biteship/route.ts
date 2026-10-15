import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("📦 [Biteship Webhook Received]:", JSON.stringify(body, null, 2))

    const event = body.event || body.type
    const orderId = body.order_id
    const waybillId = body.courier_waybill_id || body.waybill_id
    const status = (body.status || "").toLowerCase()

    if (!orderId && !waybillId) {
      return NextResponse.json({ message: "No order identifier provided" }, { status: 200 })
    }

    // Map Biteship status to human readable / order status
    // Biteship statuses: allocated, picking_up, picked, dropping_off, delivered, rejected, cancelled, on_transit
    let mappedStatus = status
    if (status === "delivered") {
      mappedStatus = "completed"
    } else if (["picked", "dropping_off", "on_transit"].includes(status)) {
      mappedStatus = "on_delivery"
    }

    const referenceId = body.reference_id || orderId
    if (!waybillId && !referenceId) {
      return NextResponse.json({ message: "No order identifier or waybill provided" }, { status: 400 })
    }

    // Build targeted query - never execute without a filter
    let query = supabase.from("orders").update({
      order_status: mappedStatus === "completed" ? "completed" : "processing",
      notes: `[Biteship Webhook] Status: ${status} | Resi: ${waybillId || "-"} | Updated: ${new Date().toISOString()}`,
    })

    if (waybillId && referenceId) {
      query = query.or(`order_number.eq.${referenceId},notes.ilike.%${waybillId}%,order_number.ilike.%${waybillId}%`)
    } else if (referenceId) {
      const isNum = /^\d+$/.test(String(referenceId))
      query = isNum ? query.or(`order_number.eq.${referenceId},id.eq.${referenceId}`) : query.eq("order_number", referenceId)
    } else if (waybillId) {
      query = query.or(`notes.ilike.%${waybillId}%,order_number.ilike.%${waybillId}%`)
    }

    const { error } = await query

    if (error) {
      console.warn("⚠️ [Biteship Webhook] Supabase update warning:", error)
    }

    return NextResponse.json({ success: true, event, status: mappedStatus })
  } catch (err: any) {
    console.error("🔥 [Biteship Webhook Exception]:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

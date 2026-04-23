import { NextResponse } from 'next/server'
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // 1. VALIDASI: Pastikan ID adalah Angka yang Valid
    // Jika ID kosong, "undefined", "null", atau bukan angka -> Return Error 400
    if (!id || id === 'undefined' || id === 'null' || isNaN(Number(id))) {
        console.error("❌ Invalid Order ID requested:", id);
        return NextResponse.json({ error: "Invalid Order ID" }, { status: 400 })
    }

    // 2. Fetch order from Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, price)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error("❌ Database Fetch Error:", error)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      order: order,
      // Mapping untuk kompatibilitas frontend
      payment_status: order.payment_status,
      status: order.order_status
    })

  } catch (error: any) {
    console.error("🔥 Get Order Exception:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
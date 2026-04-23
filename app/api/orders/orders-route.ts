import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      user_id,
      user_uid,
      customer_name,
      customer_phone,
      customer_address,
      notes,
      items,
      subtotal,
      shipping_cost = 0,
      discount      = 0,
      total_amount,
      payment_method,
    } = body

    /* ── Validate ──────────────────────────────────────── */
    if (!customer_name || !customer_phone || !customer_address) {
      return NextResponse.json(
        { error: "Nama, nomor HP, dan alamat wajib diisi" },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Keranjang kosong" },
        { status: 400 }
      )
    }

    if (!total_amount) {
      return NextResponse.json(
        { error: "total_amount diperlukan" },
        { status: 400 }
      )
    }

    /* ── Resolve customer_id (logged-in users only) ────── */
    let resolvedCustomerId: number | null = null

    if (user_id) {
      /* Look up user record */
      const { data: userData } = await supabase
        .from("users")
        .select("id, name, email, phone")
        .eq("id", user_id)
        .single()

      if (userData) {
        /* Check if a customers row already exists for this user */
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", userData.id)
          .single()

        if (existing) {
          resolvedCustomerId = existing.id
        } else {
          /* Create customers row linked to the user */
          const { data: newCustomer } = await supabase
            .from("customers")
            .insert({
              name:    userData.name,
              email:   userData.email,
              phone:   userData.phone ?? customer_phone,
              user_id: userData.id,
              status:  "active",
            })
            .select("id")
            .single()

          if (newCustomer) resolvedCustomerId = newCustomer.id
        }
      }
    }
    /* Guests: resolvedCustomerId stays null — that is fine */

    /* ── Create order ──────────────────────────────────── */
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number:        orderNumber,
        user_id:             user_id             ?? null,
        customer_id:         resolvedCustomerId  ?? null,
        customer_name,
        user_uid:            user_uid            ?? `guest_${Date.now()}`,
        subtotal:            subtotal            ?? total_amount,
        shipping_cost,
        discount_amount:     discount,
        total_amount,
        final_amount:        total_amount,
        payment_method:      payment_method      ?? "cod",
        order_status:        "pending",
        payment_status:      "pending",
        /* Store shipping info in shipping_destination */
        shipping_destination: JSON.stringify({
          name:    customer_name,
          phone:   customer_phone,
          address: customer_address,
        }),
        notes: notes ?? "",
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order insert error:", orderError)
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      )
    }

    /* ── Insert order items ────────────────────────────── */
    const orderItems = items.map((item: any) => ({
      order_id:     order.id,
      product_id:   Number(item.product_id),
      product_name: item.name,
      quantity:     item.quantity,
      unit_price:   item.price,
      total_price:  item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)

    if (itemsError) {
      console.error("Order items insert error:", itemsError)
      /* Non-fatal — order was created, just log it */
    }

    return NextResponse.json(
      {
        success:      true,
        id:           order.id,
        order_number: order.order_number,
        order,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error("Create order exception:", err)
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    )
  }
}

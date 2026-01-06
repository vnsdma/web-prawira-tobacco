import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

import { webcrypto } from "node:crypto"; // Import webcrypto untuk randomUUID

// Menggunakan polyfill untuk crypto.randomUUID agar kompatibel dengan Next.js environment
const randomUUID = typeof crypto.randomUUID === 'function' ? crypto.randomUUID.bind(crypto) : webcrypto.randomUUID.bind(webcrypto);


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    console.log("Received order data:", orderData)

    // Validate required fields
    if (!orderData.customer_email || !orderData.items || !orderData.total_amount) {
      return NextResponse.json(
        { error: "Missing required fields: customer_email, items, or total_amount" },
        { status: 400 },
      )
    }

    // Create or get customer
    let customerId
    try {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", orderData.customer_email)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
        console.log("Using existing customer:", customerId)
      } else {
        // Create new customer
        const uniqueUserUid = randomUUID();
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            name: orderData.customer_name || "Guest",
            email: orderData.customer_email,
            phone: orderData.customer_phone || "",
            address: orderData.customer_address || "",
            user_uid: uniqueUserUid,
            status: "active",
          })
          .select()
          .single()

        if (customerError) {
          console.error("Customer creation error:", customerError)
          throw new Error(`Failed to create customer: ${customerError.message}`)
        }

        customerId = newCustomer.id
        console.log("Created new customer:", customerId)
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          total_amount: orderData.total_amount,
          final_amount: orderData.total_amount, // Assuming no additional costs
          payment_method: orderData.payment_method || "midtrans",
          payment_status: "pending",
          order_status: "pending",
          shipping_address: orderData.customer_address || "",
          notes: orderData.notes || "",
          user_uid : "user_uid"
        })
        .select()
        .single()

      if (orderError) {
        console.error("Order creation error:", orderError)
        throw new Error(`Failed to create order: ${orderError.message}`)
      }

      console.log("Order created:", order)

      // Create order items
      const orderItems = orderData.items.map((item: any) => ({
        order_id: order.id,
        product_id: Number.parseInt(item.id),
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        console.error("Order items error:", itemsError)
        throw new Error(`Failed to create order items: ${itemsError.message}`)
      }

      return NextResponse.json(
        {
          ...order,
          success: true,
          message: "Order created successfully",
        },
        { status: 201 },
      )
    } catch (error) {
      console.error("Order processing error:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to process order" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Order request parsing error:", error)
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    // Get customer
    const { data: customer } = await supabase.from("customers").select("id").eq("email", email).single()

    if (!customer) {
      return NextResponse.json([])
    }

    // Get orders with items
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (name)
        )
      `)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching orders:", error)
      throw error
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
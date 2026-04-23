import { NextResponse } from 'next/server'
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url)
      const email = searchParams.get('email')
  
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }
  
      // Step A: Find the Customer ID associated with this email
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .single()
  
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order('created_at', { ascending: false })
  
      // Step B: Filter orders
      // We check both 'customer_id' (new logic) AND 'customer_email' (legacy logic) to be safe
      if (customer) {
          query = query.or(`customer_id.eq.${customer.id},customer_email.eq.${email}`)
      } else {
          query = query.eq('customer_email', email)
      }
  
      const { data: orders, error } = await query
  
      if (error) {
          console.error("❌ Database Fetch Error:", error)
          throw error
      }
  
      return NextResponse.json(orders)
  
    } catch (error: any) {
      console.error("🔥 Get Orders Exception:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("📥 Received Order Payload:", JSON.stringify(body, null, 2));

    // ============================================================
    // LANGKAH 0: RESOLVE CUSTOMER ID DARI TABLE USERS
    // ============================================================
    let resolvedCustomerId = null;
    let finalCustomerName = body.customer_name; 

    if (body.user_id) {
        // 1. Ambil data User
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', body.user_id)
            .single();

        if (userData) {
            finalCustomerName = userData.name;

            // 2. Cek apakah user ini sudah ada di tabel 'customers'
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('email', userData.email)
                .single();

            if (existingCustomer) {
                resolvedCustomerId = existingCustomer.id;
            } else {
                // Buat customer baru jika belum ada
                const { data: newCustomer } = await supabase
                    .from('customers')
                    .insert({
                        name: userData.name,
                        email: userData.email,
                        phone: userData.phone,
                        user_id: userData.id,
                        address: typeof body.shipping_address === 'object' 
                                 ? JSON.stringify(body.shipping_address) 
                                 : body.shipping_address
                    })
                    .select('id')
                    .single();
                
                if (newCustomer) resolvedCustomerId = newCustomer.id;
            }
        }
    }

    // ============================================================
    // LANGKAH 1: CREATE ORDER (DENGAN MAPPING BARU)
    // ============================================================

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    const orderData = {
        order_number: orderNumber,
        user_id: body.user_id || null,
        customer_id: resolvedCustomerId, 
        customer_name: finalCustomerName, 
        
        total_amount: body.total_amount,
        subtotal: body.subtotal, 
        shipping_cost: body.shipping_cost,
        discount_amount: body.discount || 0,
        final_amount: body.total_amount,
        
        payment_method: body.payment_method,
        order_status: 'pending',
        payment_status: 'pending',
        
        // --- MAPPING BARU DIMULAI DI SINI ---

        // 1. Kolom shipping_address <-- Diisi Origin ID (Sesuai request)
        // Pastikan body.origin_id dikirim dari frontend, atau berikan default
        shipping_address: body.origin_id ? String(body.origin_id) : 'Default Origin', 

        // 2. Kolom shipping_service <-- Diisi Courier
        shipping_service: body.courier, // Contoh: "JNE - CTC"

        // 3. Kolom shipping_destination <-- Diisi Alamat Customer (JSON Object)
        shipping_destination: typeof body.shipping_address === 'object' 
            ? JSON.stringify(body.shipping_address) 
            : body.shipping_address,

        // ------------------------------------
            
        notes: body.payment_details ? JSON.stringify(body.payment_details) : '',
        user_uid: body.user_uid || 'guest',
    }

    // Insert ke Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
        console.error("❌ Database Insert Error:", orderError);
        throw orderError;
    }

    // ============================================================
    // LANGKAH 2: INSERT ITEMS
    // ============================================================
    if (body.items && body.items.length > 0) {
        const orderItems = body.items.map((item: any) => ({
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
            
        if (itemsError) console.error("❌ Error inserting items:", itemsError);
    }

    return NextResponse.json({ 
        success: true, 
        order: order,
        id: order.id 
    })

  } catch (error: any) {
    console.error("🔥 Create Order Exception:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
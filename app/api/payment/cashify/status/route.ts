import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Pastikan Service Role Key ada untuk bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 })
    }

    // 1. Cek Status Real ke API Cashify
    const response = await fetch("https://cashify.my.id/api/generate/check-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-license-key": process.env.CASHIFY_LICENSE_KEY!,
      },
      body: JSON.stringify({ transactionId }),
    })

    const result = await response.json()
    
    // Normalisasi status
    const rawStatus = 
        result?.data?.data?.status || 
        result?.data?.status ||       
        result?.status || 
        'pending';
    
    const cashifyStatus = String(rawStatus).toLowerCase();

    console.log(`🔍 Check Status TransID ${transactionId}: ${cashifyStatus}`)
    
    let dbUpdateStatus = "No Update Needed";
    let debugError = null; // Variable untuk menampung error agar muncul di Postman

    // 2. Jika status PAID/SUCCESS, Lakukan Update DB
    if (['paid', 'success', 'settlement', 'completed'].includes(cashifyStatus)) {
        
        // A. Ambil Data Order
        const { data: currentOrder, error: fetchError } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('transaction_id', transactionId)
            .single();

        if (fetchError || !currentOrder) {
             console.error("❌ Order not found:", fetchError);
             return NextResponse.json({ 
                 success: false, 
                 error: "Order not found in DB associated with this Transaction ID",
                 db_error: fetchError 
             }, { status: 404 });
        }

        // B. Cek apakah sudah pernah paid?
        if (currentOrder.payment_status === 'paid' || currentOrder.order_status === 'success') {
            dbUpdateStatus = "Already Paid (Skipped)";
        } else {
            // C. Lakukan Update
            const { error: updateError } = await supabase
                .from('orders')
                .update({ 
                    order_status: 'confirmed', 
                    payment_status: 'paid',
                    updated_at: new Date().toISOString()
                })
                .eq('transaction_id', transactionId);

            if (updateError) {
                console.error("❌ Supabase Update Error:", updateError);
                dbUpdateStatus = "Failed: DB Update Error";
                debugError = updateError; // Tangkap errornya di sini
            } else {
                console.log(`✅ Order ${transactionId} updated to SUCCESS`);
                dbUpdateStatus = "Success";

                // D. Kurangi Stok
                if (currentOrder.order_items && currentOrder.order_items.length > 0) {
                    for (const item of currentOrder.order_items) {
                        const { data: product } = await supabase
                            .from('products')
                            .select('id, in_stock')
                            .eq('id', item.product_id)
                            .single();

                        if (product) {
                            const newStock = Math.max(0, product.in_stock - item.quantity);
                            await supabase
                                .from('products')
                                .update({ in_stock: newStock })
                                .eq('id', item.product_id);
                        }
                    }
                }
            }
        }
    }

    return NextResponse.json({
        success: true,
        final_status: cashifyStatus,
        db_update: dbUpdateStatus,
        error_detail: debugError, // Cek field ini di Postman nanti!
        original_data: result
    })

  } catch (error: any) {
    console.error("Check status error:", error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
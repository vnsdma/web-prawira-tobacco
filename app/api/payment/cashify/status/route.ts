import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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
    
    // Ekstraksi status (Deep check)
    const cashifyStatus = 
        result?.data?.data?.status || 
        result?.data?.status ||       
        result?.status || 
        'pending';

    console.log(`🔍 Check Status TransID ${transactionId}: ${cashifyStatus}`)
    
    let dbUpdateStatus = "No Update Needed";

    // 2. Jika status PAID/SUCCESS, Lakukan Update DB & Kurangi Stok
    if (['paid', 'success', 'settlement'].includes(cashifyStatus)) {
        
        // A. Ambil Data Order SAAT INI + Detail Item-nya
        // Kita butuh order_items untuk tahu produk apa saja yang dibeli
        const { data: currentOrder, error: fetchError } = await supabase
            .from('orders')
            .select('*, order_items(*)') // <--- Join ke order_items
            .eq('transaction_id', transactionId)
            .single();

        if (fetchError || !currentOrder) {
             console.error("❌ Order not found for stock reduction");
             return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // B. PENTING: Cek apakah status di DB sudah 'success' sebelumnya?
        // Jika sudah success, STOP. Jangan kurangi stok lagi (Mencegah double deduction)
        if (currentOrder.order_status === 'success' || currentOrder.order_status === 'paid') {
            console.log("⚠️ Order already paid. Skipping stock reduction.");
            dbUpdateStatus = "Already Paid (Skipped)";
        } else {
            // C. Update Status Order menjadi SUCCESS
            const { error: updateError } = await supabase
                .from('orders')
                .update({ 
                    order_status: 'success', // atau 'paid'
                    payment_status: 'paid' 
                })
                .eq('transaction_id', transactionId);

            if (updateError) {
                console.error("❌ Supabase Update Error:", updateError);
            } else {
                console.log(`✅ Order ${transactionId} updated to SUCCESS`);
                dbUpdateStatus = "Success";

                // D. KURANGI STOK PRODUK (Looping Item)
                if (currentOrder.order_items && currentOrder.order_items.length > 0) {
                    console.log("📉 Reducing stock for items...");
                    
                    for (const item of currentOrder.order_items) {
                        // 1. Ambil stok produk saat ini
                        const { data: product } = await supabase
                            .from('products')
                            .select('id, in_stock')
                            .eq('id', item.product_id)
                            .single();

                        if (product) {
                            // 2. Hitung stok baru
                            const newStock = product.in_stock - item.quantity;
                            
                            // 3. Update stok ke database
                            await supabase
                                .from('products')
                                .update({ in_stock: newStock })
                                .eq('id', item.product_id);
                                
                            console.log(`   - Product ${item.product_id}: ${product.in_stock} -> ${newStock}`);
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
        original_data: result
    })

  } catch (error: any) {
    console.error("Check status error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
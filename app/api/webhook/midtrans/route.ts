import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request) {
  try {
    const notificationJson = await req.json();

    // 1. Verifikasi Signature SHA-512 Midtrans (Sesuai Spesifikasi Resmi Midtrans)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const signatureKey = String(notificationJson.signature_key || "");
    const orderId = String(notificationJson.order_id || "");
    const statusCode = String(notificationJson.status_code || "");
    const grossAmount = String(notificationJson.gross_amount || "");

    // Payload: order_id + status_code + gross_amount + ServerKey
    const hashPayload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const mySignature = crypto.createHash('sha512').update(hashPayload).digest('hex');

    // Gunakan timingSafeEqual untuk mencegah timing attacks
    const myBuffer = Buffer.from(mySignature, 'utf-8');
    const incomingBuffer = Buffer.from(signatureKey, 'utf-8');
    const isSignatureValid = myBuffer.length === incomingBuffer.length && crypto.timingSafeEqual(myBuffer, incomingBuffer);

    if (!isSignatureValid) {
      console.error(`❌ Midtrans Signature Mismatch for order ${orderId}`);
      return NextResponse.json({ message: 'Invalid Signature' }, { status: 403 });
    }

    // 2. Tentukan Status Transaksi
    const transactionStatus = notificationJson.transaction_status;
    const fraudStatus = notificationJson.fraud_status;
    let newStatus = 'pending';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') newStatus = 'challenge';
      else if (fraudStatus === 'accept') newStatus = 'paid';
    } else if (transactionStatus === 'settlement') {
      newStatus = 'paid';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      newStatus = 'cancelled';
    }

    console.log(`🔔 Midtrans Webhook SHA-512 Verified: ${orderId} -> ${newStatus}`);

    // 3. Ambil data order sebelum update untuk cek status sebelumnya
    const isNumericId = /^\d+$/.test(orderId);
    let selectQuery = supabase.from('orders').select('id, payment_status, order_status, final_amount, total_amount');
    if (isNumericId) {
      selectQuery = selectQuery.eq('id', orderId);
    } else {
      selectQuery = selectQuery.eq('order_number', orderId);
    }
    const { data: existingOrder, error: fetchErr } = await selectQuery.single();

    if (fetchErr || !existingOrder) {
      console.warn(`⚠️ Order ID ${orderId} not found in database`);
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Hindari duplikasi pemotongan stok jika sudah pernah dibayar
    const wasAlreadyPaid = existingOrder.payment_status === 'paid';

    // 4. Update Status Order di Database
    let updateQuery = supabase
      .from('orders')
      .update({ 
        payment_status: newStatus,
        transaction_id: notificationJson.transaction_id,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'paid' ? { order_status: 'confirmed' } : {}) 
      });

    if (isNumericId) {
      updateQuery = updateQuery.eq('id', orderId);
    } else {
      updateQuery = updateQuery.eq('order_number', orderId);
    }

    const { error: updateError } = await updateQuery;
    if (updateError) {
      console.error("❌ Supabase Update Error:", updateError);
      return NextResponse.json({ message: 'DB Error' }, { status: 500 });
    }

    // 5. Potong Stok Produk Otomatis jika Pembayaran Berhasil (dan belum dipotong sebelumnya)
    if (newStatus === 'paid' && !wasAlreadyPaid) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', existingOrder.id);

      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          const { data: product } = await supabase
            .from('products')
            .select('id, in_stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const updatedStock = Math.max(0, product.in_stock - item.quantity);
            await supabase
              .from('products')
              .update({ in_stock: updatedStock })
              .eq('id', item.product_id);
          }
        }
      }
    }

    console.log(`✅ Success: Order ${orderId} updated to ${newStatus}`);
    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('🔥 Webhook Error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request) {
  try {
    const notificationJson = await req.json();

    // 1. Verifikasi Signature Midtrans (Wajib)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const signatureKey = notificationJson.signature_key;
    const orderId = notificationJson.order_id;
    const statusCode = notificationJson.status_code;
    const grossAmount = notificationJson.gross_amount;

    const hashPayload = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const mySignature = crypto.createHash('sha512').update(hashPayload).digest('hex');

    if (mySignature !== signatureKey) {
      return NextResponse.json({ message: 'Invalid Signature' }, { status: 403 });
    }

    // 2. Tentukan Status
    const transactionStatus = notificationJson.transaction_status;
    const fraudStatus = notificationJson.fraud_status;
    let newStatus = 'pending';

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') newStatus = 'challenge';
      else if (fraudStatus == 'accept') newStatus = 'paid'; // Ubah 'success' -> 'paid' sesuai ENUM DB
    } else if (transactionStatus == 'settlement') {
      newStatus = 'paid';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      newStatus = 'cancelled';
    }

    console.log(`🔔 Webhook: Processing ${orderId} -> ${newStatus}`);

    // 3. Update Supabase (Logic Perbaikan)
    // Cek apakah orderId adalah angka murni (ID Database) atau String (Order Number)
    const isNumericId = /^\d+$/.test(orderId);

    let query = supabase
        .from('orders')
        .update({ 
            payment_status: newStatus,
            transaction_id: notificationJson.transaction_id,
            // Jika status paid, update juga order_status agar sinkron
            ...(newStatus === 'paid' ? { order_status: 'confirmed' } : {}) 
        });

    if (isNumericId) {
        // Jika angka ("160"), cari berdasarkan ID
        query = query.eq('id', orderId);
    } else {
        // Jika teks ("ORD-123"), cari berdasarkan order_number
        query = query.eq('order_number', orderId);
    }

    // Eksekusi update dan minta data balik (.select()) untuk memastikan row ditemukan
    const { data, error } = await query.select();

    if (error) {
        console.error("❌ Supabase Update Error:", error);
        return NextResponse.json({ message: 'DB Error' }, { status: 500 });
    }

    if (data.length === 0) {
        console.warn(`⚠️ Order ID ${orderId} not found in database (Check ID mismatch)`);
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    console.log(`✅ Success: Order ${orderId} updated to ${newStatus}`);
    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('🔥 Webhook Error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
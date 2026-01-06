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
    const orderId = notificationJson.order_id; // Ini formatnya TBS-XXX-YYY
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
      else if (fraudStatus == 'accept') newStatus = 'success';
    } else if (transactionStatus == 'settlement') {
      newStatus = 'paid';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      newStatus = 'cancelled';
    }

    // 3. Update Supabase
    // Midtrans mengirim 'order_id' yang sama dengan 'order_number' di database kita
    const { error } = await supabase
        .from('orders')
        .update({ 
            payment_status: newStatus,
            transaction_id: notificationJson.transaction_id // Simpan juga ID dari Midtrans
        })
        .eq('order_number', orderId); // Cocokkan dengan order_number

    if (error) {
        console.error("Supabase Update Error:", error);
        return NextResponse.json({ message: 'DB Error' }, { status: 500 });
    }

    console.log(`✅ Webhook: Order ${orderId} updated to ${newStatus}`);
    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
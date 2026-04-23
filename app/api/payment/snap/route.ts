import { NextResponse } from "next/server";
import { snap } from "@/lib/midtrans"; // Import from your new helper

export async function POST(request: Request) {
  try {
    const { order_id, amount, customer } = await request.json();

    const parameter = {
      transaction_details: {
        order_id: order_id,
        gross_amount: amount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: customer.name,
        phone: customer.phone,
        billing_address: {
          address: customer.address,
        },
      },
    };

    // Use the library to create the transaction
    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });

  } catch (error) {
    console.error("Midtrans payment error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
import { NextResponse } from 'next/server'
import { createClient } from "@supabase/supabase-js"
import { extractBearerToken, verifyAuthToken } from "@/lib/auth"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ Id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.Id || (resolvedParams as any).id

    // 1. VALIDASI: Pastikan ID adalah angka yang valid
    if (!id || id === 'undefined' || id === 'null' || isNaN(Number(id))) {
      return NextResponse.json({ error: "Format ID pesanan tidak valid." }, { status: 400 })
    }

    // 2. Fetch order dari Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          total_price,
          products (name, price)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 })
    }

    // 3. KEAMANAN / OTORISASI: Cegah IDOR & Kebocoran PII
    // Opsi A: Cek Autentikasi JWT (User Login)
    let isAuthorized = false
    const token = extractBearerToken(request)

    if (token) {
      try {
        const decoded = verifyAuthToken(token)
        if (
          (order.user_id && order.user_id === decoded.userId) ||
          (order.customer_email && order.customer_email.toLowerCase() === decoded.email.toLowerCase())
        ) {
          isAuthorized = true
        }
      } catch {
        // Token invalid, fallthrough to guest verification
      }
    }

    // Opsi B: Cek Verifikasi Guest (Email atau Nomor HP dari Query Params)
    if (!isAuthorized) {
      const { searchParams } = new URL(request.url)
      const verifyEmail = searchParams.get('email')?.trim().toLowerCase()
      const verifyPhone = searchParams.get('phone')?.trim()

      if (verifyEmail && order.customer_email && order.customer_email.toLowerCase() === verifyEmail) {
        isAuthorized = true
      }

      if (!isAuthorized && verifyEmail && order.shipping_destination) {
        try {
          const dest = typeof order.shipping_destination === 'string'
            ? JSON.parse(order.shipping_destination)
            : order.shipping_destination
          if (dest.email && dest.email.toLowerCase() === verifyEmail) {
            isAuthorized = true
          }
        } catch {}
      }

      if (!isAuthorized && verifyPhone && order.shipping_destination) {
        try {
          const dest = typeof order.shipping_destination === 'string'
            ? JSON.parse(order.shipping_destination)
            : order.shipping_destination
          if (dest.phone && dest.phone.trim() === verifyPhone) {
            isAuthorized = true
          }
        } catch {}
      }
    }

    // Jika tidak terotorisasi, tolak akses!
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Akses ditolak: Verifikasi identitas (token login atau email pemesan ?email=...) diperlukan." },
        { status: 403 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      order: order,
      payment_status: order.payment_status,
      status: order.order_status
    })

  } catch (error: any) {
    console.error("🔥 Get Order Exception:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
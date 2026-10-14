import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { getPasswordResetRequestLink } from "@/lib/whatsapp"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("08")) {
    return "62" + digits.slice(1)
  }
  return digits
}

function maskPhoneNumber(phone: string): string {
  const clean = phone.trim()
  if (clean.length < 8) return clean
  const start = clean.slice(0, 4)
  const end = clean.slice(-4)
  return `${start}****${end}`
}

function computeOtpHash(email: string, otp: string): string {
  const secret = process.env.JWT_SECRET || "prawira-secret-key"
  return crypto
    .createHmac("sha256", secret)
    .update(`${email.trim().toLowerCase()}:${otp.trim()}`)
    .digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json()

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { message: "Masukkan alamat email akun yang valid" },
        { status: 400 }
      )
    }

    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return NextResponse.json(
        { message: "Masukkan nomor WhatsApp yang terdaftar pada akun Anda" },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const inputPhone = normalizePhoneNumber(phone)

    // 1. Find user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, phone, status")
      .ilike("email", cleanEmail)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: "Kombinasi email dan nomor WhatsApp tidak cocok dengan data akun terdaftar" },
        { status: 400 }
      )
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { message: "Akun ini berstatus tidak aktif. Silakan hubungi admin toko." },
        { status: 403 }
      )
    }

    // 2. Strict 2-Factor check: WhatsApp number MUST match the registered account phone
    const dbPhone = normalizePhoneNumber(user.phone || "")
    if (!dbPhone || dbPhone !== inputPhone) {
      return NextResponse.json(
        { message: "Kombinasi email dan nomor WhatsApp tidak cocok dengan data akun terdaftar" },
        { status: 400 }
      )
    }

    // 3. Generate secure dynamic 6-digit OTP stored in database
    const otp = crypto.randomInt(100000, 1000000).toString()
    const otpHash = computeOtpHash(user.email, otp)
    const tokenKey = `password_reset:${otpHash}`

    // 15 minutes expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    // Clean up previous reset sessions for this user
    await supabase
      .from("user_sessions")
      .delete()
      .eq("user_id", user.id)
      .like("session_token", "password_reset:%")

    // Insert new reset session
    const { error: insertError } = await supabase.from("user_sessions").insert({
      user_id: user.id,
      session_token: tokenKey,
      expires_at: expiresAt.toISOString(),
    })

    if (insertError) {
      console.error("Error storing reset session:", insertError)
      return NextResponse.json(
        { message: "Gagal membuat sesi verifikasi reset password" },
        { status: 500 }
      )
    }

    // 4. WhatsApp link pre-filled for user to contact Admin Toko
    // NOTE: OTP is KEPT CONFIDENTIAL and NOT exposed in the API response or client link
    const whatsappUrl = getPasswordResetRequestLink(user.email, user.phone || phone)
    const maskedPhone = maskPhoneNumber(user.phone || phone)

    return NextResponse.json({
      success: true,
      message: "Data akun terverifikasi. Silakan hubungi WhatsApp Admin Toko dari nomor HP terdaftar untuk mendapatkan Kode Verifikasi.",
      email: user.email,
      maskedPhone,
      whatsappUrl,
      expiresInMinutes: 15,
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan internal server" },
      { status: 500 }
    )
  }
}

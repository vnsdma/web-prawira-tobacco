import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function computeOtpHash(email: string, otp: string): string {
  const secret = process.env.JWT_SECRET || "prawira-secret-key"
  return crypto
    .createHmac("sha256", secret)
    .update(`${email.trim().toLowerCase()}:${otp.trim()}`)
    .digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json()

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: "Email, kode verifikasi OTP, dan password baru wajib diisi" },
        { status: 400 }
      )
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password baru harus memiliki minimal 6 karakter" },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanOtp = String(otp).trim()

    // 1. Find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, status")
      .ilike("email", cleanEmail)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { message: "Akun dengan email tersebut tidak ditemukan" },
        { status: 404 }
      )
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { message: "Akun ini berstatus tidak aktif. Silakan hubungi admin toko." },
        { status: 403 }
      )
    }

    // 2. Verify OTP:
    // Check Case A: Dynamic OTP generated during step 1
    const otpHash = computeOtpHash(user.email, cleanOtp)
    const dynamicTokenKey = `password_reset:${otpHash}`

    const { data: dynamicSession } = await supabase
      .from("user_sessions")
      .select("id, expires_at")
      .eq("user_id", user.id)
      .eq("session_token", dynamicTokenKey)
      .gt("expires_at", new Date().toISOString())
      .single()

    // Check Case B: Admin Master Verification PIN provided by Admin Toko via WhatsApp
    const adminPin = process.env.ADMIN_RESET_PIN
    let isAdminPinValid = false

    if (adminPin && cleanOtp === adminPin.trim()) {
      // Must also have an active unexpired reset session for this user to ensure step 1 was completed
      const { data: pendingSessions } = await supabase
        .from("user_sessions")
        .select("id")
        .eq("user_id", user.id)
        .like("session_token", "password_reset:%")
        .gt("expires_at", new Date().toISOString())
        .limit(1)

      if (pendingSessions && pendingSessions.length > 0) {
        isAdminPinValid = true
      }
    }

    if (!dynamicSession && !isAdminPinValid) {
      return NextResponse.json(
        { message: "Kode Verifikasi OTP tidak valid atau telah kedaluwarsa. Silakan minta kode verifikasi baru ke Admin Toko." },
        { status: 400 }
      )
    }

    // 3. Hash new password using bcrypt
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)

    // 4. Update password in database
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json(
        { message: "Gagal memperbarui password di database" },
        { status: 500 }
      )
    }

    // 5. Invalidate all reset sessions for this user immediately
    await supabase
      .from("user_sessions")
      .delete()
      .eq("user_id", user.id)
      .like("session_token", "password_reset:%")

    return NextResponse.json({
      success: true,
      message: "Password Anda berhasil diperbarui! Silakan masuk dengan password baru.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { message: "Terjadi kesalahan internal server" },
      { status: 500 }
    )
  }
}

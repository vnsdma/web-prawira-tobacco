import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken, extractBearerToken } from "@/lib/auth"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request)
    if (!token) {
      return NextResponse.json({ message: "Token tidak valid" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = verifyAuthToken(token)

    // Delete session
    await supabase.from("user_sessions").delete().eq("session_token", token).eq("user_id", decoded.userId)

    return NextResponse.json({ message: "Logout berhasil" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "Logout berhasil" }) // Always return success for logout
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { searchBiteshipAreas } from "@/lib/biteship"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const input = searchParams.get("input") || ""

    if (input.trim().length < 3) {
      return NextResponse.json({ areas: [] })
    }

    const areas = await searchBiteshipAreas(input)
    return NextResponse.json({ success: true, areas })
  } catch (err: any) {
    console.error("[API] Biteship areas error:", err)
    return NextResponse.json({ error: err.message || "Failed to search areas" }, { status: 500 })
  }
}

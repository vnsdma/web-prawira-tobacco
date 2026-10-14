import { type NextRequest, NextResponse } from "next/server"
import { getBiteshipRates, type BiteshipItem } from "@/lib/biteship"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { destination_area_id, items, couriers } = body

    if (!destination_area_id) {
      return NextResponse.json({ error: "destination_area_id is required" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 })
    }

    const rates = await getBiteshipRates({
      destinationAreaId: destination_area_id,
      items: items as BiteshipItem[],
      couriers: couriers || "jne,jnt,sicepat,anteraja,paxel",
    })

    return NextResponse.json({
      success: true,
      pricing: rates,
    })
  } catch (err: any) {
    console.error("[API] Biteship rates error:", err)
    return NextResponse.json({ error: err.message || "Failed to calculate rates" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getBiteshipTracking } from "@/lib/biteship"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const courier = searchParams.get("courier") || undefined

    const tracking = await getBiteshipTracking({
      orderId: id.startsWith("biteship_") ? id : undefined,
      waybillId: !id.startsWith("biteship_") ? id : undefined,
      courierCode: courier,
    })

    return NextResponse.json(tracking)
  } catch (err: any) {
    console.error("[API] Biteship tracking error:", err)
    return NextResponse.json({ error: err.message || "Failed to fetch tracking" }, { status: 500 })
  }
}

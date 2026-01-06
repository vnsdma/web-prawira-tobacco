import { type NextRequest, NextResponse } from "next/server"

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, destination, weight, courier } = body

    // Validate required fields
    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Fetching shipping cost from RajaOngkir:", { origin, destination, weight, courier })

    const response = await fetch("https://api.rajaongkir.com/starter/cost", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        key: RAJAONGKIR_API_KEY,
      },
      body: new URLSearchParams({
        origin: origin.toString(),
        destination: destination.toString(),
        weight: weight.toString(),
        courier: courier,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] RajaOngkir API error:", response.status, errorText)
      return NextResponse.json({ error: "Failed to fetch shipping cost" }, { status: response.status })
    }

    const result = await response.json()
    console.log("[v0] RajaOngkir response:", JSON.stringify(result, null, 2))

    if (result.rajaongkir?.status?.code !== 200) {
      return NextResponse.json({ error: result.rajaongkir?.status?.description || "API Error" }, { status: 400 })
    }

    const results = result.rajaongkir.results || []

    return NextResponse.json({
      success: true,
      results: results,
    })
  } catch (error) {
    console.error("[v0] Shipping cost calculation error:", error)
    return NextResponse.json({ error: "Failed to calculate shipping cost" }, { status: 500 })
  }
}

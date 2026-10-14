import { type NextRequest, NextResponse } from "next/server"

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY!

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Fetching province from RajaOngkir")

    const response = await fetch("https://rajaongkir.komerce.id/api/v1/destination/province", {
      method: "GET",
      headers: {
        key: RAJAONGKIR_API_KEY,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] RajaOngkir API error:", response.status, errorText)
      return NextResponse.json({ error: "Failed to fetch province" }, { status: response.status })
    }

    const result = await response.json()

    if (result.rajaongkir?.status?.code !== 200) {
      return NextResponse.json({ error: result.rajaongkir?.status?.description || "API Error" }, { status: 400 })
    }

    const provinces = result.rajaongkir.results || []

    return NextResponse.json({
      success: true,
      provinces: provinces,
    })
  } catch (error) {
    console.error("[v0] Province fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch province" }, { status: 500 })
  }
}

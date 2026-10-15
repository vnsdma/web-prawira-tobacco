import { type NextRequest, NextResponse } from "next/server"

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY!

// Helper to group flat results by courier
function groupByCourier(flatResults: any[]) {
  const grouped: { [key: string]: any } = {}
  
  flatResults.forEach((item) => {
    const courierCode = item.code
    
    if (!grouped[courierCode]) {
      grouped[courierCode] = {
        code: courierCode,
        name: item.name,
        costs: []
      }
    }
    
    grouped[courierCode].costs.push({
      service: item.service,
      description: item.description,
      cost: [{
        value: item.cost,
        etd: item.etd,
        note: ''
      }]
    })
  })
  
  return Object.values(grouped)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, destination, weight, courier } = body

    console.log('[Backend] Cost calculation request:', {
      origin,
      destination,
      weight,
      courier
    })

    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json({ 
        error: "Missing required fields: origin, destination, weight, courier" 
      }, { status: 400 })
    }

    // Validate types
    const originNum = Number(origin)
    const destNum = Number(destination)
    const weightNum = Number(weight)

    if (isNaN(originNum) || isNaN(destNum) || isNaN(weightNum)) {
      return NextResponse.json({ 
        error: "Invalid numeric values" 
      }, { status: 400 })
    }

    console.log(`[Backend] Calculating: ${originNum} -> ${destNum}, ${weightNum}g, ${courier}`)

    // RajaOngkir Komerce API
    const formData = {
      origin,
      destination,
      weight,
      courier,
    }
    const formBody = new URLSearchParams(formData as Record<string, string>).toString()
    
    console.log(`[API] Sending URL-Encoded Body: ${formBody}`)

    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost",
      {
        method: "POST",
        headers: {
          "key": RAJAONGKIR_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
      }
    )

    console.log('[Backend] RajaOngkir response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Backend] RajaOngkir HTTP error:", response.status, errorText)
      return NextResponse.json({ 
        error: "Failed to calculate cost from RajaOngkir",
        details: errorText
      }, { status: response.status })
    }

    const result = await response.json()
    console.log('[Backend] RajaOngkir meta:', result.meta)
    console.log('[Backend] Data length:', result.data?.length)

    // Check meta status
    if (result.meta?.code !== 200) {
      console.error('[Backend] RajaOngkir API error:', result.meta)
      return NextResponse.json({ 
        error: result.meta?.message || "RajaOngkir API Error",
        code: result.meta?.code
      }, { status: 400 })
    }

    // RajaOngkir Komerce returns flat array, group by courier
    const flatResults = result.data || []
    const groupedResults = groupByCourier(flatResults)

    console.log("[Backend] Successfully calculated costs")
    console.log("[Backend] Services found:", groupedResults.length)

    return NextResponse.json({
      success: true,
      results: groupedResults,
    })
    
  } catch (error) {
    console.error("[Backend] Cost calculation error:", error)
    return NextResponse.json({ 
      error: "Failed to calculate cost",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
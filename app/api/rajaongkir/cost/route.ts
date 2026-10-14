// import { type NextRequest, NextResponse } from "next/server"

// const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY!

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json()
//     // Pastikan kita menangkap semua field termasuk 'price'
//     const { origin, destination, weight, courier, price } = body 

//     if (!origin || !destination || !weight || !courier || !price) {
//       return NextResponse.json({ 
//         error: "Missing required fields: origin, destination, weight, courier, price" 
//       }, { status: 400 })
//     }

//     console.log(`[API] Calculating cost: ${origin} -> ${destination}, ${weight}g, ${courier}, Price filter: ${price}`)

// const formData = {
//       origin,
//       destination,
//       weight,
//       courier,
//       price, // Tetap kirim 'lowest' atau nilai barang
//     }

//     // 2. Ubah objek data menjadi format URLSearchParams (x-www-form-urlencoded)
//     const formBody = new URLSearchParams(formData as Record<string, string>).toString()
//     
//     console.log(`[API] Sending URL-Encoded Body: ${formBody}`)

//     const response = await fetch(
//       "https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost",
//       {
//         method: "POST",
//         headers: {
//           "key": RAJAONGKIR_API_KEY,
//           // 💡 PERUBAHAN HEADER: Mengubah Content-Type
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//         // 💡 PERUBAHAN BODY: Menggunakan string yang sudah di-encode
//         body: formBody,
//       }
//     )

//   if (!response.ok) {
//           const errorText = await response.text()
//           console.error("[API] HTTP error:", response.status, errorText)
//           return NextResponse.json({ 
//             error: "Failed to calculate cost" 
//           }, { status: response.status })
//         }
    
//         const result = await response.json()
    
//         // Check meta status
//         if (result.meta?.code !== 200) {
//           return NextResponse.json({ 
//             error: result.meta?.message || "API Error",
//             code: result.meta?.code
//           }, { status: 400 })
//         }
    
//         const results = result.data || []
//         console.log("[API] Successfully calculated shipping cost")
    
//         return NextResponse.json({
//           success: true,
//           results: results,
//         })
//       } catch (error) {
//         console.error("[API] Cost calculation error:", error)
//         return NextResponse.json({ 
//           error: "Failed to calculate cost" 
//         }, { status: 500 })
//       }
//     }

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
    const rajaongkirUrl = "https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost"
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
          // 💡 PERUBAHAN HEADER: Mengubah Content-Type
          "Content-Type": "application/x-www-form-urlencoded",
        },
        // 💡 PERUBAHAN BODY: Menggunakan string yang sudah di-encode
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

// Alternative version without grouping (if mobile app handles grouping)
export async function POST_FLAT_RESULTS(request: NextRequest) {
  try {
    const body = await request.json()
    const { origin, destination, weight, courier } = body

    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost",
      {
        method: "POST",
        headers: {
          "key": RAJAONGKIR_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin: Number(origin),
          destination: Number(destination),
          weight: Number(weight),
          courier: courier
        }),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ 
        error: "Failed to calculate cost" 
      }, { status: response.status })
    }

    const result = await response.json()

    if (result.meta?.code !== 200) {
      return NextResponse.json({ 
        error: result.meta?.message || "API Error"
      }, { status: 400 })
    }

    // Return flat results without grouping
    return NextResponse.json({
      success: true,
      results: result.data || [],
    })
    
  } catch (error) {
    console.error("[Backend] Error:", error)
    return NextResponse.json({ 
      error: "Server error" 
    }, { status: 500 })
  }
}
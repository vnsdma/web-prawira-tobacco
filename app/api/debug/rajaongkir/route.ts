// app/api/debug/rajaongkir/route.ts
// ⚠️ DEBUG ENDPOINT - HAPUS SETELAH SELESAI TESTING!

import { NextResponse } from "next/server"

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY!

export async function GET() {
  try {
    console.log("\n=== DEBUG RAJAONGKIR RESPONSE ===")
    
    // Test 1: Check API Key
    console.log("1. API Key Check:")
    console.log("   - Exists:", !!RAJAONGKIR_API_KEY)
    console.log("   - Length:", RAJAONGKIR_API_KEY?.length)
    console.log("   - First 5 chars:", RAJAONGKIR_API_KEY?.substring(0, 5))

    if (!RAJAONGKIR_API_KEY) {
      return NextResponse.json({
        error: "API key not found in environment"
      }, { status: 500 })
    }

    // Test 2: Make Request
    console.log("\n2. Making request to RajaOngkir...")
    
    const response = await fetch(
      "https://rajaongkir.komerce.id/api/v1/destination/province",
      {
        method: "GET",
        headers: {
          "key": RAJAONGKIR_API_KEY,
        },
        cache: "no-store"
      }
    )

    console.log("   - HTTP Status:", response.status)
    console.log("   - Status Text:", response.statusText)
    console.log("   - Headers:", Object.fromEntries(response.headers.entries()))

    // Test 3: Get Response Text
    const responseText = await response.text()
    console.log("\n3. Raw Response:")
    console.log("   - Length:", responseText.length)
    console.log("   - First 200 chars:", responseText.substring(0, 200))

    // Test 4: Parse JSON
    let parsedData
    try {
      parsedData = JSON.parse(responseText)
      console.log("\n4. Parsed JSON Structure:")
      console.log("   - Top level keys:", Object.keys(parsedData))
      
      if (parsedData.rajaongkir) {
        console.log("   - Has 'rajaongkir' key")
        console.log("   - rajaongkir keys:", Object.keys(parsedData.rajaongkir))
        
        if (parsedData.rajaongkir.status) {
          console.log("   - Status:", parsedData.rajaongkir.status)
        } else {
          console.log("   - ⚠️ NO STATUS in rajaongkir")
        }
        
        if (parsedData.rajaongkir.results) {
          console.log("   - Results count:", parsedData.rajaongkir.results.length)
          console.log("   - First result:", parsedData.rajaongkir.results[0])
        } else {
          console.log("   - ⚠️ NO RESULTS in rajaongkir")
        }
      } else {
        console.log("   - ⚠️ NO 'rajaongkir' key in response")
      }

    } catch (parseError) {
      console.error("\n4. JSON Parse Error:", parseError)
      
      return NextResponse.json({
        error: "Failed to parse JSON response",
        httpStatus: response.status,
        rawResponse: responseText,
      })
    }

    // Test 5: Return Debug Info
    console.log("\n=== END DEBUG ===\n")

    return NextResponse.json({
      debug: {
        apiKeyExists: true,
        apiKeyLength: RAJAONGKIR_API_KEY.length,
        httpStatus: response.status,
        httpStatusText: response.statusText,
      },
      responseStructure: {
        topLevelKeys: Object.keys(parsedData),
        hasRajaongkir: !!parsedData.rajaongkir,
        rajaongkirKeys: parsedData.rajaongkir ? Object.keys(parsedData.rajaongkir) : null,
        hasStatus: !!parsedData.rajaongkir?.status,
        hasResults: !!parsedData.rajaongkir?.results,
      },
      status: parsedData.rajaongkir?.status || null,
      resultsCount: parsedData.rajaongkir?.results?.length || 0,
      firstResult: parsedData.rajaongkir?.results?.[0] || null,
      fullResponse: parsedData,
    })

  } catch (error) {
    console.error("\nCritical Error:", error)
    
    return NextResponse.json({
      error: "Request failed",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    }, { status: 500 })
  }
}


// ============================================
// CARA PENGGUNAAN:
// ============================================
//
// 1. Buat file: app/api/debug/rajaongkir/route.ts
// 2. Copy code ini ke file tersebut
// 3. Restart server: npm run dev
// 4. Test di Postman: GET http://localhost:3000/api/debug/rajaongkir
// 5. Lihat response JSON dan terminal logs
// 6. Share response JSON ke saya untuk analisa
//
// ⚠️ PENTING: Hapus endpoint ini setelah selesai debugging!
// ⚠️ Jangan deploy ke production!
//
// ============================================
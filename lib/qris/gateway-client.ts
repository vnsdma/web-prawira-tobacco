import { generateDynamicQRIS, type DynamicQRISResult } from "./generator"
import { formatTLV } from "./emvco"
import { calculateCRC16 } from "./crc16"

export interface QRISOrderResponse {
  transactionId: string
  invoiceNumber: string
  baseAmount: number
  uniqueCode: number
  finalAmount: number
  qr_string: string
  qr_image_url: string
  status: "pending" | "paid" | "expired"
  expiresAt: string
  source: "radarpay-api" | "embedded-engine"
}

// Default standard static QRIS (ASPI Specification for Prawira Tobacco)
// Merchant can override this via QRIS_STATIC_STRING or STATIC_QRIS_STRING in .env.local
function getFallbackStaticQris(): string {
  const envQris = process.env.QRIS_STATIC_STRING || process.env.STATIC_QRIS_STRING
  if (envQris && envQris.trim().length > 20) {
    return envQris.trim()
  }

  const tag26 = formatTLV("00", "ID.GOJEK.MERCHANT") + formatTLV("01", "936009140000000000") + formatTLV("02", "12345678")
  const tag51 = formatTLV("00", "ID.CO.QRIS.WWW") + formatTLV("02", "ID1020000000000") + formatTLV("03", "UME")
  const tag62 = formatTLV("07", "A01")

  const staticPayloadWithoutCrc =
    formatTLV("00", "01") +
    formatTLV("01", "11") +
    formatTLV("26", tag26) +
    formatTLV("51", tag51) +
    formatTLV("52", "5499") +
    formatTLV("53", "360") +
    formatTLV("58", "ID") +
    formatTLV("59", "PRAWIRA TOBACCO") +
    formatTLV("60", "BANDUNG") +
    formatTLV("61", "40115") +
    formatTLV("62", tag62) +
    "6304"

  return staticPayloadWithoutCrc + calculateCRC16(staticPayloadWithoutCrc)
}

/**
 * Creates a dynamic QRIS order via RadarPay API (if available) or via embedded QRIS engine.
 */
export async function createDynamicQRISOrder(params: {
  orderId: string
  invoiceNumber: string
  amount: number
  customerName?: string
  customerPhone?: string
  notes?: string
}): Promise<QRISOrderResponse> {
  const radarPayUrl = process.env.RADARPAY_API_URL || process.env.QRIS_GATEWAY_URL || "http://localhost:3000"
  const apiKey = process.env.RADARPAY_API_KEY || process.env.QRIS_API_KEY

  // 1. Try RadarPay API Gateway first if configured
  if (apiKey) {
    try {
      const response = await fetch(`${radarPayUrl.replace(/\/$/, "")}/api/v1/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          amount: Math.round(params.amount),
          customerName: params.customerName || "Pelanggan Prawira",
          customerPhone: params.customerPhone || "-",
          notes: `Pesanan ${params.invoiceNumber}`,
          expiryMinutes: 15,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          transactionId: data.id,
          invoiceNumber: data.invoiceNumber || params.invoiceNumber,
          baseAmount: data.baseAmount || params.amount,
          uniqueCode: data.uniqueCode || 0,
          finalAmount: data.finalAmount || params.amount,
          qr_string: data.dynamicQrisString,
          qr_image_url: data.qrDataUrl,
          status: (data.status?.toLowerCase() === "paid" ? "paid" : "pending") as "pending" | "paid",
          expiresAt: data.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          source: "radarpay-api",
        }
      }
      console.warn(`[RadarPay] API responded with ${response.status}, falling back to embedded QRIS generator.`)
    } catch (err: any) {
      console.warn("[RadarPay] API unreachable, falling back to embedded QRIS generator:", err.message)
    }
  }

  // 2. Embedded Dynamic QRIS Engine Fallback (Zero external dependency)
  // Generates 3-digit random unique code (1 - 999) for deterministic reconciliation
  const uniqueCode = Math.floor(Math.random() * 899) + 100
  const finalAmount = Math.round(params.amount) + uniqueCode
  const staticQris = getFallbackStaticQris()

  const dynamicResult: DynamicQRISResult = await generateDynamicQRIS(staticQris, finalAmount)

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const transactionId = `QRIS-${params.invoiceNumber}-${Date.now().toString(36).toUpperCase()}`

  return {
    transactionId,
    invoiceNumber: params.invoiceNumber,
    baseAmount: Math.round(params.amount),
    uniqueCode,
    finalAmount,
    qr_string: dynamicResult.dynamicString,
    qr_image_url: dynamicResult.qrDataUrl,
    status: "pending",
    expiresAt,
    source: "embedded-engine",
  }
}

/**
 * Checks payment status against RadarPay API Gateway.
 */
export async function checkRadarPayStatus(transactionId: string): Promise<string | null> {
  const radarPayUrl = process.env.RADARPAY_API_URL || process.env.QRIS_GATEWAY_URL || "http://localhost:3000"
  const apiKey = process.env.RADARPAY_API_KEY || process.env.QRIS_API_KEY

  if (!apiKey) return null

  try {
    const response = await fetch(`${radarPayUrl.replace(/\/$/, "")}/api/v1/orders/${encodeURIComponent(transactionId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return data.status ? String(data.status).toLowerCase() : null
    }
  } catch (err: any) {
    console.error("[RadarPay] Error checking status:", err.message)
  }

  return null
}

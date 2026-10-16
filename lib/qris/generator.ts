import QRCode from "qrcode"
import { calculateCRC16 } from "./crc16"
import { formatTLV, parseEMVCo } from "./emvco"

export interface DynamicQRISResult {
  dynamicString: string
  qrDataUrl: string
  amount: number
  merchantName?: string
  merchantCity?: string
}

/**
 * Converts a static QRIS string into a dynamic QRIS string with a specific amount
 * and valid EMVCo CRC-16 checksum, then renders a high-resolution QR image data URL.
 */
export async function generateDynamicQRIS(
  staticQris: string,
  amount: number
): Promise<DynamicQRISResult> {
  if (!staticQris || typeof staticQris !== "string") {
    throw new Error("Static QRIS string is required")
  }

  const parsed = parseEMVCo(staticQris)
  if (!parsed.tags.has("00")) {
    throw new Error("Invalid QRIS: Missing Tag 00 (Payload Format Indicator)")
  }

  const tags = new Map<string, string>(parsed.tags)

  // Set Point of Initiation Method to 12 (Dynamic)
  tags.set("01", "12")

  // Set Currency to 360 (IDR) if missing
  if (!tags.has("53")) {
    tags.set("53", "360")
  }

  // Set Transaction Amount (Tag 54)
  const amountStr = Math.round(amount).toString()
  tags.set("54", amountStr)

  // Remove existing Tag 63 (CRC) so we can recalculate it fresh
  tags.delete("63")

  // Order tags logically according to EMVCo standard
  const standardOrder = [
    "00", "01",
    // Merchant Accounts (Tag 26 - 51)
    ...Array.from({ length: 26 }, (_, i) => (26 + i).toString().padStart(2, "0")),
    "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62"
  ]

  let payload = ""

  // Append known tags in order
  for (const tag of standardOrder) {
    if (tags.has(tag)) {
      payload += formatTLV(tag, tags.get(tag)!)
      tags.delete(tag)
    }
  }

  // Append any remaining custom tags
  for (const [tag, value] of tags.entries()) {
    payload += formatTLV(tag, value)
  }

  // Append Tag 63 placeholder (Tag 63, length 04)
  const payloadWithTag63Header = payload + "6304"

  // Compute CRC-16 on the payload including '6304'
  const crc = calculateCRC16(payloadWithTag63Header)

  // Final dynamic QRIS string
  const dynamicString = `${payloadWithTag63Header}${crc}`

  // Generate QR image data URL
  const qrDataUrl = await QRCode.toDataURL(dynamicString, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  })

  return {
    dynamicString,
    qrDataUrl,
    amount,
    merchantName: parsed.merchantName || "Prawira Tobacco Store",
    merchantCity: parsed.merchantCity || "Jakarta",
  }
}

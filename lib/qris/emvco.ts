import { calculateCRC16 } from "./crc16"

export interface TLVTag {
  tag: string
  length: string
  value: string
}

export interface DecodedQRIS {
  tags: Map<string, string>
  rawTags: TLVTag[]
  isValidCrc: boolean
  merchantName?: string
  merchantCity?: string
  postalCode?: string
  mcc?: string
  pointOfInitiation?: string
  amount?: string
}

/**
 * Parse an EMVCo QRIS string into TLV tags
 */
export function parseEMVCo(qrisString: string): DecodedQRIS {
  const trimmed = qrisString.trim()
  const rawTags: TLVTag[] = []
  const tagsMap = new Map<string, string>()

  let index = 0
  while (index < trimmed.length) {
    if (index + 4 > trimmed.length) {
      break
    }

    const tag = trimmed.substring(index, index + 2)
    const lengthStr = trimmed.substring(index + 2, index + 4)
    const length = parseInt(lengthStr, 10)

    if (isNaN(length)) {
      break
    }

    const valueStart = index + 4
    const valueEnd = valueStart + length
    if (valueEnd > trimmed.length) {
      break
    }

    const value = trimmed.substring(valueStart, valueEnd)
    rawTags.push({ tag, length: lengthStr, value })
    tagsMap.set(tag, value)

    index = valueEnd
  }

  // Validate CRC16 if tag 63 exists
  let isValidCrc = false
  const tag63Index = trimmed.lastIndexOf("6304")
  if (tag63Index !== -1 && tag63Index + 8 <= trimmed.length) {
    const dataWithoutCrc = trimmed.substring(0, tag63Index + 4)
    const expectedCrc = trimmed.substring(tag63Index + 4, tag63Index + 8).toUpperCase()
    const actualCrc = calculateCRC16(dataWithoutCrc)
    isValidCrc = expectedCrc === actualCrc
  }

  return {
    tags: tagsMap,
    rawTags,
    isValidCrc,
    merchantName: tagsMap.get("59"),
    merchantCity: tagsMap.get("60"),
    postalCode: tagsMap.get("61"),
    mcc: tagsMap.get("52"),
    pointOfInitiation: tagsMap.get("01"),
    amount: tagsMap.get("54"),
  }
}

/**
 * Format a single TLV field: 2-digit tag + 2-digit length + value
 */
export function formatTLV(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0")
  return `${tag}${len}${value}`
}

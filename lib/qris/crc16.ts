/**
 * CRC-16/CCITT-FALSE Implementation
 * Polynomial: 0x1021
 * Initial value: 0xFFFF
 * Standard for EMVCo / ASPI QRIS Tag 63
 */
export function calculateCRC16(data: string): string {
  let crc = 0xffff
  const polynomial = 0x1021

  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i) & 0xff
    crc ^= byte << 8

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0")
}

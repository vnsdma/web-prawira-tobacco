/**
 * WhatsApp integration helper for Prawira Tobacco
 * Configurable via NEXT_PUBLIC_WHATSAPP_NUMBER in .env.local
 */

export const DEFAULT_WHATSAPP_NUMBER = "6281234567890"

export function getStoreWhatsAppNumber(): string {
  const envNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  if (!envNumber) return DEFAULT_WHATSAPP_NUMBER
  // Clean non-digits
  const clean = envNumber.replace(/\D/g, "")
  // Normalize 08xx to 628xx
  if (clean.startsWith("08")) {
    return "62" + clean.slice(1)
  }
  return clean || DEFAULT_WHATSAPP_NUMBER
}

export function getWhatsAppLink(message: string, phone?: string): string {
  const targetPhone = phone ? phone.replace(/\D/g, "") : getStoreWhatsAppNumber()
  const encodedMsg = encodeURIComponent(message)
  return `https://wa.me/${targetPhone}?text=${encodedMsg}`
}

export function getTasteConsultationLink(): string {
  const msg = `Halo Prawira Tobacco, saya pengunjung website dan ingin konsultasi rekomendasi rasa tembakau yang cocok untuk selera saya. Bisa bantu rekomendasikan varian terbaik?`
  return getWhatsAppLink(msg)
}

export function getProductTasteInquiryLink(productName: string): string {
  const msg = `Halo Prawira Tobacco, saya tertarik dengan produk "${productName}". Mau tanya lebih detail tentang karakter rasa, aroma, dan tarikannya sebelum pesan. Terima kasih!`
  return getWhatsAppLink(msg)
}

export function getSamplerPackOrderLink(packName = "Paket Cicip 3 Rasa"): string {
  const msg = `Halo Prawira Tobacco, saya mau order "${packName}" untuk coba varian tembakau pilihan. Apakah stok tersedia dan bisa dikirim hari ini?`
  return getWhatsAppLink(msg)
}

export function getPasswordResetRequestLink(email: string, phone: string): string {
  const msg = `Halo Admin Prawira Tobacco, saya pemilik akun: ${email} (No. WhatsApp: ${phone}). Saya mengajukan permohonan reset password di website resmi. Mohon bantu verifikasi nomor WhatsApp saya dan berikan Kode Verifikasi Reset Akun. Terima kasih!`
  return getWhatsAppLink(msg)
}

export function getPasswordResetLink(email: string, phoneOrOtp: string): string {
  return getPasswordResetRequestLink(email, phoneOrOtp)
}

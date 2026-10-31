/**
 * Konfigurasi Banner & Unduhan APK Android Prawira Tobacco
 *
 * CARA MENARUH FILE APK:
 * 1. Letakkan file APK Anda di folder: `public/downloads/prawira-tobacco.apk`
 *    (Otomatis dapat diunduh via URL: `/downloads/prawira-tobacco.apk`)
 * 2. ATAU jika dihosting di link luar (Google Drive, GitHub Releases, Mediafire, dll),
 *    ubah `downloadUrl` di bawah ini atau isi file .env.local:
 *    NEXT_PUBLIC_APK_URL=https://link-download-apk-anda.com/app.apk
 */

export interface ApkConfig {
  appName: string
  fileName: string
  downloadUrl: string
  version: string
  fileSize: string
  minAndroid: string
  releaseDate: string
  features: string[]
}

export const APK_CONFIG: ApkConfig = {
  appName: "Prawira Tobacco App",
  fileName: "prawira-tobacco.apk",
  downloadUrl: process.env.NEXT_PUBLIC_APK_URL || "/downloads/prawira-tobacco.apk",
  version: "v1.0.0",
  fileSize: "18.5 MB",
  minAndroid: "Android 7.0+",
  releaseDate: "Oktober 2026",
  features: [
    "Pesan tembakau & tingwe lebih cepat & mulus",
    "Notifikasi status pesanan & resi Biteship otomatis",
    "Aplikasi ringan, hemat kuota & tanpa iklan",
    "Katalog selalu update dengan stok otomatis",
  ],
}

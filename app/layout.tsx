import type React from "react"
import type { Metadata, Viewport } from "next"
import { Syne, DM_Sans } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/hooks/use-cart"
import { AuthProvider } from "@/hooks/use-auth"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import WhatsAppConcierge from "@/components/whatsapp-concierge"

/* ─── FONTS (OPTIMIZED BY NEXT.JS - NO BLOCKING @IMPORT) ───── */
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-syne",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/* ─── METADATA (COMMERCIAL BUYER INTENT & TECHNICAL SEO) ─────── */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Jual Tembakau Linting Nusantara & Perlengkapan Tingwe — Prawira Tobacco",
    template: "%s | Prawira Tobacco",
  },
  description: "Beli tembakau linting nusantara, tembakau iris aromatik, cerutu, papir & aksesoris tingwe terlengkap di Prawira Tobacco. Harga terbaik, original, kirim se-Indonesia.",
  keywords: [
    "jual tembakau",
    "beli tembakau",
    "tembakau linting",
    "tembakau iris",
    "tingwe",
    "linting dewe",
    "rokok linting",
    "tembakau nusantara",
    "kertas linting",
    "papir rokok",
    "prawira tobacco",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prawira",
  },
  openGraph: {
    title: "Jual Tembakau Linting Nusantara & Perlengkapan Tingwe — Prawira Tobacco",
    description: "Beli tembakau linting nusantara, tembakau iris aromatik, cerutu, papir & perlengkapan tingwe terlengkap. Harga terbaik, kirim se-Indonesia.",
    url: siteUrl,
    siteName: "Prawira Tobacco",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jual Tembakau Linting Nusantara & Tingwe — Prawira Tobacco",
    description: "Beli tembakau linting nusantara, tembakau iris aromatik, cerutu & papir terlengkap.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f5" },
    { media: "(prefers-color-scheme: dark)",  color: "#121316" },
  ],
}

/* ─── STRUCTURED DATA (SCHEMA.ORG JSON-LD) ───────────────────── */
const storeSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "Prawira Tobacco",
  alternateName: "Prawira Tobacco Store",
  description: "Toko online tembakau nusantara, tembakau iris aromatik, cerutu, papir, filter, dan perlengkapan tingwe terlengkap di Indonesia.",
  url: siteUrl,
  currenciesAccepted: "IDR",
  paymentAccepted: "QRIS, Midtrans, Bank Transfer",
  priceRange: "Rp5.000 - Rp250.000",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
}

/* ─── ROOT LAYOUT ────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable}`}
    >
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="prawira-theme"
        >
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster />
              <WhatsAppConcierge />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

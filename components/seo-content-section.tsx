"use client"

import { useState } from "react"
import { ChevronDown, Leaf, ShieldCheck, Truck, Sparkles } from "lucide-react"

const FAQS = [
  {
    q: "Apa saja jenis tembakau yang dijual di Prawira Tobacco?",
    a: "Prawira Tobacco menyediakan tembakau linting nusantara berkualitas tinggi, mulai dari tembakau rasa aromatik modern (whiskey, soju, vanilla, mint, kopi), tembakau iris tradisional murni (Gayo, Temanggung, Kasturi, Madura), cerutu artisan, hingga rokok kemasan terkurasi.",
  },
  {
    q: "Bagaimana cara beli tembakau online di Prawira Tobacco?",
    a: "Anda cukup memilih produk tembakau atau aksesoris linting yang diinginkan, klik Tambah ke Keranjang, lalu tekan tombol Checkout. Anda dapat membeli langsung sebagai Tamu (Guest) atau Masuk Akun untuk menyimpan riwayat pesanan.",
  },
  {
    q: "Metode pembayaran apa saja yang didukung?",
    a: "Kami mendukung pembayaran instan QRIS (Semua E-Wallet & Mobile Banking) dan Payment Gateway Midtrans (BCA, Mandiri, BNI, BRI, Permata Virtual Account, GoPay, ShopeePay). Transaksi aman dan otomatis terverifikasi.",
  },
  {
    q: "Berapa lama proses pengiriman dan ekspedisi apa yang digunakan?",
    a: "Pesanan dikirim langsung menggunakan kurir JNE, POS Indonesia, dan TIKI dengan perhitungan ongkos kirim otomatis real-time ke seluruh kecamatan di Indonesia. Paket dikemas higienis dan kedap udara untuk menjaga kelembapan serta aroma tembakau.",
  },
]

export default function SeoContentSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <section className="px-4 md:px-7 mt-10 mb-8 border-t border-border pt-8">
      {/* Brand Value Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-card border border-border flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent flex-shrink-0">
            <Leaf size={18} />
          </div>
          <div>
            <h2 className="font-display font-bold text-xs text-text-primary uppercase tracking-wider">
              Tembakau Asli Nusantara
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Kurasi daun tembakau pilihan langsung dari sentra perkebunan nusantara dengan mutu dan aroma terawat.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent flex-shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="font-display font-bold text-xs text-text-primary uppercase tracking-wider">
              Pilihan Tingwe Terlengkap
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Koleksi kertas linting (papir), filter, alat linting rol manual hingga tembakau aneka rasa favorit.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent flex-shrink-0">
            <Truck size={18} />
          </div>
          <div>
            <h2 className="font-display font-bold text-xs text-text-primary uppercase tracking-wider">
              Kirim Aman Se-Indonesia
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Packing rapat dan rapi agar tembakau tidak kering saat pengiriman ekspedisi antar kota dan pulau.
            </p>
          </div>
        </div>
      </div>

      {/* Editorial Overview for Keyword Relevance */}
      <div className="bg-card border border-border rounded-xl p-5 md:p-6 mb-8 space-y-3">
        <h2 className="font-display font-bold text-sm md:text-base text-text-primary tracking-tight">
          Pusat Jual Tembakau Linting Online Terbaik di Indonesia
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          Tradisi <em>tingwe</em> (linting dewe) telah menjadi bagian budaya tembakau nusantara yang kini dinikmati oleh berbagai kalangan karena kualitas rasa yang khas, hemat, dan personal. Di <strong>Prawira Tobacco</strong>, kami menghadirkan kemudahan <strong>beli tembakau linting online</strong> berkualitas dari perkebunan terbaik di Jawa, Sumatera, dan Madura.
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">
          Setiap produk tembakau iris, kertas papir, filter rokok, hingga alat linting dipilih dengan standar kebersihan dan kesegaran terjamin. Nikmati pengalaman belanja praktis dengan perhitungan ongkir otomatis ke seluruh Indonesia dan pelacakan pesanan transparan.
        </p>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-card border border-border rounded-xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-accent" />
          <h2 className="font-display font-bold text-sm md:text-base text-text-primary">
            Pertanyaan Seputar Beli Tembakau Online (FAQ)
          </h2>
        </div>

        <div className="divide-y divide-border/60">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="py-3">
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between text-left gap-3 text-xs md:text-sm font-semibold text-text-primary hover:text-accent transition-colors"
                aria-expanded={openFaq === idx}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={15}
                  className={`text-text-muted flex-shrink-0 transition-transform duration-200 ${
                    openFaq === idx ? "rotate-180 text-accent" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <p className="text-xs text-text-secondary mt-2 leading-relaxed pr-4 animate-in fade-in-50 duration-200">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

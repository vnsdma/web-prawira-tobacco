# Prawira Tobacco E-Commerce

Platform e-commerce berbasis Next.js untuk katalog dan pemesanan produk tembakau, dilengkapi kalkulasi ongkos kirim domestik dan integrasi multiple payment gateway.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Frontend**: React 19, Tailwind CSS, Radix UI / shadcn/ui, Lucide React
- **Database & Backend**: Supabase (PostgreSQL)
- **Payment Gateway**: 
  - Midtrans (Snap, Core API, Webhook)
  - Cashify (QRIS)
- **Logistik / Kurir**: RajaOngkir API
- **Autentikasi**: JWT, Supabase Auth, bcryptjs
- **Validasi Formulir**: React Hook Form, Zod

---

## Struktur Direktori

```text
├── app/
│   ├── api/
│   │   ├── auth/              # Handler login, register, logout, session
│   │   ├── debug/             # Endpoint pengujian logistik
│   │   ├── mobile/            # Endpoint integrasi aplikasi mobile
│   │   ├── orders/            # Pengelolaan pesanan
│   │   ├── payment/           # Handler Midtrans & Cashify QRIS
│   │   ├── rajaongkir/        # Proxy API wilayah dan tarif ekspedisi
│   │   └── webhook/           # Notifikasi callback status transaksi
│   ├── payment/
│   │   └── status/            # Halaman status transaksi
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx               # Halaman katalog utama
├── components/
│   ├── ui/                    # Primitif UI atomik (shadcn / Radix)
│   ├── cart-sheet.tsx         # Drawer keranjang belanja
│   ├── checkout-dialog.tsx    # Modal pengisian data & pengiriman
│   ├── midtrans-payment.tsx   # Dialog integrasi pembayaran Midtrans
│   ├── order-history.tsx      # Komponen riwayat transaksi
│   ├── product-grid.tsx       # Grid tampilan produk
│   ├── profile-section.tsx    # Panel manajemen akun pengguna
│   └── promo-banner.tsx       # Tampilan banner promo
├── hooks/
│   ├── use-auth.tsx           # Context state autentikasi
│   ├── use-cart.tsx           # State management keranjang belanja
│   └── use-toast.ts           # Hook sistem notifikasi
├── lib/
│   ├── midtrans.ts            # Inisialisasi client Midtrans
│   ├── supabase.ts            # Inisialisasi client Supabase
│   └── utils.ts               # Utilitas helper styling
└── public/                    # Aset statis & manifest

```

---

## Fitur Utama

* **Katalog & Filter**: Penyaringan item berdasarkan kategori tembakau dan pengelolaan cart secara real-time.
* **Kalkulasi Ongkir**: Penentuan tarif kurir dinamis berbasis destinasi (provinsi, kota, kecamatan) dan kalkulasi berat belanjaan melalui RajaOngkir.
* **Multi-Gateway Payment**: Pilihan pembayaran melalui Midtrans Snap (Virtual Account, kartu kredit, e-wallet) dan QRIS via Cashify.
* **Otomasi Webhook**: Pembaruan status transaksi otomatis di database Supabase setelah konfirmasi pembayaran diterima.
* **Sistem Promo**: Pengecekan keabsahan kode kupon dan penerapan potongan harga saat checkout.

---

## Konfigurasi Environment

Buat file `.env.local` di root direktori proyek, lalu isi parameter berikut:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Midtrans
MIDTRANS_SERVER_KEY=<your-server-key>
MIDTRANS_CLIENT_KEY=<your-client-key>
MIDTRANS_IS_PRODUCTION=false

# Cashify
CASHIFY_API_KEY=<your-cashify-api-key>
CASHIFY_SECRET_KEY=<your-cashify-secret-key>

# RajaOngkir
RAJAONGKIR_API_KEY=<your-rajaongkir-api-key>
RAJAONGKIR_BASE_URL=[https://pro.rajaongkir.com/api](https://pro.rajaongkir.com/api)

# Autentikasi & Aplikasi
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=<your-jwt-secret>

```

---

## Panduan Menjalankan Proyek

1. **Clone repository dan install dependensi**
```bash
git clone [https://github.com/vnsdma/web-prawira-tobacco.git](https://github.com/vnsdma/web-prawira-tobacco.git)
cd web-prawira-tobacco
npm install

```


2. **Jalankan development server**
```bash
npm run dev

```


Buka `http://localhost:3000` pada peramban.
3. **Kompilasi produksi**
```bash
npm run build
npm run start

```



---

## Endpoint API

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Pendaftaran akun baru |
| `POST` | `/api/auth/login` | Autentikasi akun |
| `POST` | `/api/auth/logout` | Terminasi session |
| `GET` | `/api/auth/me` | Mengambil data pengguna aktif |
| `GET` | `/api/orders` | Mengambil daftar riwayat pesanan |
| `POST` | `/api/orders` | Membuat pesanan baru |
| `GET` | `/api/orders/[id]` | Mengambil rincian spesifik pesanan |
| `GET` | `/api/rajaongkir/province` | Daftar provinsi |
| `GET` | `/api/rajaongkir/city` | Daftar kota / kabupaten |
| `GET` | `/api/rajaongkir/district/[city_id]` | Daftar kecamatan |
| `POST` | `/api/rajaongkir/cost` | Perhitungan tarif ongkos kirim |
| `POST` | `/api/payment/snap` | Pembuatan token transaksi Midtrans Snap |
| `POST` | `/api/payment/cashify` | Pembuatan tagihan QRIS |
| `GET` | `/api/payment/cashify/status` | Pengecekan status transaksi QRIS |
| `POST` | `/api/webhook/midtrans` | Webhook penerima status dari Midtrans |
| `POST` | `/api/mobile/promo/validate` | Validasi kode promo |

---

## Catatan Keamanan

* Kunci privat seperti `SUPABASE_SERVICE_ROLE_KEY` dan `MIDTRANS_SERVER_KEY` dibatasi pemanggilannya hanya pada server runtime (`app/api/`) dan tidak boleh disertakan pada kode sisi klien.
* Endpoint `/api/webhook/midtrans` wajib memverifikasi SHA-512 `signature_key` sebelum memutasi status transaksi pada database.

```

```

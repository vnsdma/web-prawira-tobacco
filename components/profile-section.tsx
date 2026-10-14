"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff, LogOut, CheckCircle, ShieldCheck, Package, Truck, Search, KeyRound, MessageCircle, ArrowLeft, ExternalLink, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import OrderHistory, { GuestOrderTracker } from "@/components/order-history"

export default function ProfileSection() {
  const [guestTab, setGuestTab] = useState<"login" | "register" | "track" | "forgot">("login")
  const [userTab, setUserTab] = useState<"orders" | "profile">("orders")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request")
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotPhone, setForgotPhone] = useState("")
  const [forgotMaskedPhone, setForgotMaskedPhone] = useState("")
  const [forgotOtp, setForgotOtp] = useState("")
  const [forgotNewPassword, setForgotNewPassword] = useState("")
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("")
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false)
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false)
  const [forgotWaLink, setForgotWaLink] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)

  // Auth Form State
  const [loginForm, setLoginForm] = useState({ email: "", password: "" })
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })

  // Profile Edit State
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
  })

  const { user, login, register, logout, updateProfile, isAuthenticated } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
      })
    }
  }, [user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(loginForm.email, loginForm.password)
      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali di Prawira Tobacco!",
      })
    } catch (error) {
      toast({
        title: "Gagal Masuk",
        description: error instanceof Error ? error.message : "Periksa email dan password Anda.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Password Tidak Cocok",
        description: "Pastikan konfirmasi password sama dengan password.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await register({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone,
      })
      toast({
        title: "Registrasi Berhasil",
        description: "Akun Anda telah aktif.",
      })
    } catch (error) {
      toast({
        title: "Registrasi Gagal",
        description: error instanceof Error ? error.message : "Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(editForm)
      toast({
        title: "Profil Diperbarui",
        description: "Informasi kontak dan pengiriman tersimpan.",
      })
    } catch (error) {
      toast({
        title: "Gagal Menyimpan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Berhasil Keluar",
        description: "Sampai jumpa di kunjungan berikutnya!",
      })
    } catch {
      toast({
        title: "Gagal Logout",
        description: "Terjadi kesalahan saat logout.",
        variant: "destructive",
      })
    }
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !forgotPhone) {
      toast({
        title: "Data Belum Lengkap",
        description: "Masukkan email dan nomor WhatsApp yang terdaftar pada akun Anda.",
        variant: "destructive",
      })
      return
    }

    setForgotLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, phone: forgotPhone }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Gagal memproses permintaan reset password.")
      }

      setForgotMaskedPhone(data.maskedPhone || "")
      setForgotWaLink(data.whatsappUrl)
      setForgotOtp("") // Dikosongkan demi keamanan: didapatkan dari Admin via WhatsApp
      setForgotStep("verify")

      // Otomatis buka WhatsApp ke Admin Toko di tab baru
      if (data.whatsappUrl && typeof window !== "undefined") {
        window.open(data.whatsappUrl, "_blank")
      }

      toast({
        title: "Data Akun Terverifikasi",
        description: "Silakan hubungi WhatsApp Admin Toko untuk mendapatkan 6-digit Kode OTP.",
      })
    } catch (err) {
      toast({
        title: "Permintaan Gagal",
        description: err instanceof Error ? err.message : "Terjadi kesalahan.",
        variant: "destructive",
      })
    } finally {
      setForgotLoading(false)
    }
  }

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      toast({
        title: "Kode OTP Tidak Lengkap",
        description: "Masukkan 6-digit kode verifikasi OTP yang valid.",
        variant: "destructive",
      })
      return
    }

    if (forgotNewPassword.length < 6) {
      toast({
        title: "Password Terlalu Pendek",
        description: "Password baru harus memiliki minimal 6 karakter.",
        variant: "destructive",
      })
      return
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      toast({
        title: "Password Tidak Cocok",
        description: "Konfirmasi password baru tidak sesuai.",
        variant: "destructive",
      })
      return
    }

    setForgotLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui password.")
      }

      toast({
        title: "Password Berhasil Diperbarui!",
        description: "Silakan masuk kembali dengan password baru Anda.",
      })

      // Otomatis isi form login dengan email yang baru direset
      setLoginForm((prev) => ({ ...prev, email: forgotEmail, password: "" }))
      setGuestTab("login")
      setForgotStep("request")
      setForgotOtp("")
      setForgotNewPassword("")
      setForgotConfirmPassword("")
    } catch (err) {
      toast({
        title: "Gagal Reset Password",
        description: err instanceof Error ? err.message : "Terjadi kesalahan.",
        variant: "destructive",
      })
    } finally {
      setForgotLoading(false)
    }
  }

  // ── Authenticated User View (Order History is exclusively for logged in users) ──
  if (isAuthenticated && user) {
    return (
      <div className="px-4 py-4 md:px-7 max-w-3xl mx-auto space-y-5">
        {/* Profile Card Header */}
        <div className="p-5 md:p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-muted text-accent font-display font-bold text-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="font-display font-bold text-lg text-text-primary">
                {user.name}
              </h2>
              <span className="badge badge-soft text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <ShieldCheck size={11} /> Member Terdaftar
              </span>
            </div>
            <p className="text-xs text-text-muted">{user.email}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-lg border border-border hover:border-destructive/40 text-text-muted hover:text-destructive text-xs font-medium flex items-center gap-1.5 transition-colors self-center sm:self-start"
          >
            <LogOut size={13} />
            <span>Keluar</span>
          </button>
        </div>

        {/* Sub-Tabs: Riwayat Pesanan (Exclusive) & Data Profil */}
        <div className="flex border-b border-border gap-2">
          <button
            type="button"
            onClick={() => setUserTab("orders")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 -mb-[1px] ${
              userTab === "orders"
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <Package size={14} />
            <span>Riwayat Pesanan Saya</span>
          </button>

          <button
            type="button"
            onClick={() => setUserTab("profile")}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-b-2 -mb-[1px] ${
              userTab === "profile"
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <User size={14} />
            <span>Data Profil & Alamat</span>
          </button>
        </div>

        {/* Tab 1: Riwayat Pesanan Saya */}
        {userTab === "orders" && (
          <div className="pt-1">
            <OrderHistory />
          </div>
        )}

        {/* Tab 2: Edit Info & Delivery Address Form */}
        {userTab === "profile" && (
          <div className="p-5 md:p-6 rounded-2xl bg-card border border-border shadow-sm">
            <h3 className="font-display font-bold text-sm text-text-primary mb-1">
              Data Pengiriman & Kontak
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Alamat dan kontak ini akan otomatis terisi saat Anda melakukan checkout pesanan berikutnya.
            </p>

            <form onSubmit={handleUpdateProfile} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-base pl-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Nomor WhatsApp / HP
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="input-base pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-text-secondary block mb-1">
                  Alamat Lengkap
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-3 text-text-muted pointer-events-none" />
                  <textarea
                    rows={3}
                    placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="input-base pl-9 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-2"
              >
                <CheckCircle size={14} />
                <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    )
  }

  // ── Guest View (Login / Register / Guest Order Tracking) ─────────
  return (
    <div className="px-4 py-4 md:px-7 max-w-lg mx-auto">
      {/* 3-Tab Navigator for Guests */}
      <div className="grid grid-cols-3 p-1 rounded-xl bg-raised border border-border mb-5">
        <button
          type="button"
          onClick={() => {
            setGuestTab("login")
            setForgotStep("request")
          }}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            guestTab === "login" || guestTab === "forgot"
              ? "bg-card text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => {
            setGuestTab("register")
            setForgotStep("request")
          }}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            guestTab === "register"
              ? "bg-card text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          Daftar
        </button>
        <button
          type="button"
          onClick={() => {
            setGuestTab("track")
            setForgotStep("request")
          }}
          className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
            guestTab === "track"
              ? "bg-card text-text-primary shadow-sm"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Search size={12} />
          <span>Lacak Tamu</span>
        </button>
      </div>

      {/* TAB 1: GUEST ORDER TRACKER */}
      {guestTab === "track" && (
        <GuestOrderTracker />
      )}

      {/* TAB 2: LOGIN */}
      {guestTab === "login" && (
        <div className="p-5 md:p-7 rounded-2xl bg-card border border-border shadow-sm">
          <h3 className="font-display font-bold text-base text-text-primary mb-1 text-center">
            Masuk ke Akun
          </h3>
          <p className="text-xs text-text-muted mb-5 text-center">
            Masuk untuk mengakses riwayat lengkap pesanan dan promo khusus member.
          </p>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="input-base pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-text-secondary">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginForm.email || "")
                    setGuestTab("forgot")
                    setForgotStep("request")
                  }}
                  className="text-[11px] text-accent hover:underline font-medium"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="input-base pl-9 pr-9 text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-xs font-semibold transition-colors disabled:opacity-50 mt-4 shadow-sm"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-border text-center">
            <p className="text-xs text-text-muted">
              Pernah belanja tanpa akun?{" "}
              <button
                type="button"
                onClick={() => setGuestTab("track")}
                className="text-accent font-semibold hover:underline"
              >
                Lacak Pesanan Tamu
              </button>
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: FORGOT PASSWORD */}
      {guestTab === "forgot" && (
        <div className="p-5 md:p-7 rounded-2xl bg-card border border-border shadow-sm space-y-5">
          {/* Header with back to login */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <button
              type="button"
              onClick={() => {
                setGuestTab("login")
                setForgotStep("request")
              }}
              className="text-xs font-semibold text-text-muted hover:text-text-primary flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Masuk</span>
            </button>

            <span className="badge badge-soft text-[10px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 text-accent">
              <KeyRound size={11} /> Reset Password
            </span>
          </div>

          {forgotStep === "request" ? (
            /* STEP 1: 2-FACTOR REQUEST (EMAIL + REGISTERED WHATSAPP) */
            <div>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-accent-muted text-accent mx-auto flex items-center justify-center mb-3 shadow-inner">
                  <KeyRound size={22} />
                </div>
                <h3 className="font-display font-bold text-base text-text-primary">
                  Verifikasi Kepemilikan Akun
                </h3>
                <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                  Untuk mencegah pembajakan akun oleh pihak tidak bertanggung jawab, masukkan kombinasi email dan nomor WhatsApp terdaftar Anda.
                </p>
              </div>

              <form onSubmit={handleRequestReset} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Email Akun Terdaftar
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="input-base pl-9 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Nomor WhatsApp Akun Terdaftar
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      className="input-base pl-9 text-xs"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-text-muted mt-1">
                    Nomor yang Anda daftarkan saat membuat akun.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-subtle border border-border text-[11px] text-text-muted flex items-start gap-2.5">
                  <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p>
                    Sistem akan memvalidasi kecocokan data Anda. Kode verifikasi akan diserahkan oleh Admin Toko secara manual via WhatsApp setelah memeriksa nomor pengirim Anda.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <MessageCircle size={15} />
                  <span>{forgotLoading ? "Memvalidasi Akun..." : "Validasi & Hubungi Admin WhatsApp"}</span>
                </button>
              </form>
            </div>
          ) : (
            /* STEP 2: VERIFY OTP FROM ADMIN & ENTER NEW PASSWORD */
            <div>
              <div className="text-center mb-4">
                <h3 className="font-display font-bold text-base text-text-primary">
                  Masukkan Kode dari Admin
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Akun: <span className="font-semibold text-text-primary">{forgotEmail}</span>
                  {forgotMaskedPhone && (
                    <span className="block text-[11px] text-text-secondary mt-0.5">
                      No. WhatsApp Terdaftar: {forgotMaskedPhone}
                    </span>
                  )}
                </p>
              </div>

              {/* Security Instruction Banner - Strict Secrecy */}
              <div className="p-4 rounded-xl bg-card border border-emerald-500/30 text-left mb-4 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={16} />
                  <span>Verifikasi Keamanan Admin Toko</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Demi perlindungan akun, kode OTP <strong>tidak ditampilkan di layar ini</strong>. Silakan hubungi Admin Toko via WhatsApp dari nomor terdaftar Anda untuk verifikasi identitas dan menerima 6-digit Kode OTP.
                </p>
                {forgotWaLink && (
                  <div className="pt-1">
                    <a
                      href={forgotWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      <MessageCircle size={14} />
                      <span>Buka WhatsApp Admin Toko (Minta Kode)</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              <form onSubmit={handleVerifyReset} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Kode Verifikasi OTP dari Admin (6 Digit)
                  </label>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Masukkan kode dari Admin"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                      className="input-base pl-9 text-xs font-mono font-semibold tracking-wider text-center"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Password Baru
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="input-base pl-9 pr-9 text-xs"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      {showForgotNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-secondary block mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                      type={showForgotConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi password baru"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="input-base pl-9 pr-9 text-xs"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      {showForgotConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-4 shadow-sm"
                >
                  <CheckCircle size={14} />
                  <span>{forgotLoading ? "Menyimpan..." : "Simpan Password Baru"}</span>
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                <button
                  type="button"
                  onClick={() => setForgotStep("request")}
                  className="text-text-muted hover:text-text-primary hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Ubah Data Akun</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGuestTab("login")
                    setForgotStep("request")
                  }}
                  className="text-accent hover:underline font-medium"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTER */}
      {guestTab === "register" && (
        <div className="p-5 md:p-7 rounded-2xl bg-card border border-border shadow-sm">
          <h3 className="font-display font-bold text-base text-text-primary mb-1 text-center">
            Daftar Akun Baru
          </h3>
          <p className="text-xs text-text-muted mb-5 text-center">
            Nikmati kemudahan pelacakan pesanan otomatis dan penawaran eksklusif.
          </p>

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Nama Anda"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="input-base pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="input-base pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  className="input-base pl-9 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="input-base pl-9 text-xs"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ulangi password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className="input-base pl-9 text-xs"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-xs font-semibold transition-colors disabled:opacity-50 mt-4 shadow-sm"
            >
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

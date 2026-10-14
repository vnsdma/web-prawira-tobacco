"use client"

import { useState } from "react"
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Clock,
  Layers,
  ChevronRight,
  ChevronLeft,
  Flame,
  HelpCircle,
  X,
  ExternalLink,
  ShoppingBag,
  Check,
  Play,
  Wind,
  Gauge,
  SlidersHorizontal,
} from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useToast } from "@/hooks/use-toast"

export interface RollingStep {
  stepNumber: number
  title: string
  instruction: string
  visualHint: string
  drawTip?: string
  proTip?: string
  warning?: string
}

export interface RollingTool {
  id: "linting-kecil" | "slorok-manual"
  name: string
  shortLabel: string
  subtitle: string
  badge: string
  badgeColor: string
  youtubeUrl: string
  youtubeStartSeconds: number
  timeEst: string
  outputStyle: string
  bestFor: string
  description: string
  requiredGear: { name: string; isOptional?: boolean }[]
  steps: RollingStep[]
  troubleshooting: { issue: string; solution: string }[]
}

export const ROLLING_TOOLS: RollingTool[] = [
  {
    id: "linting-kecil",
    name: "Alat Linting Kecil (Pocket Roller 70mm)",
    shortLabel: "Alat Linting Kecil",
    subtitle: "Alat rol silinder mini paling populer, praktis dibawa ke mana saja & hemat",
    badge: "Paling Populer & Praktis",
    badgeColor: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    youtubeUrl: "https://youtu.be/eLlI8p6MrvA?si=bLKmgjkMqk9r7YGf&t=51",
    youtubeStartSeconds: 51,
    timeEst: "~30 Detik",
    outputStyle: "Silinder Rapi Standar Pabrikan",
    bestFor: "Pemula dan anak kost yang ingin alat ringkas, murah meriah, dan mudah dimasukkan ke kantong saku.",
    description:
      "Menggunakan dua silinder rol fleksibel dengan selembar kain khusus. Sangat mudah digunakan untuk membuat lintingan bulat sempurna cukup dengan beberapa putaran jempol.",
    requiredGear: [
      { name: "Alat Linting Kecil (Ukuran Standar 70mm)" },
      { name: "Tembakau Pilihan (± 0.6 - 0.9 gram)" },
      { name: "Kertas Papir Standar 70mm" },
      { name: "Busa Filter Regular / Mild" },
      { name: "Lem Kertas Tingwe / Sedikit Air" },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Buka Silinder Rol Depan",
        instruction:
          "Pegang alat linting kecil dengan kedua tangan. Angkat dan geser silinder rol bagian depan ke arah atas dan luar hingga kain rol mengendur membentuk lekukan palung.",
        visualHint: "Kain rol terbuka ke bawah membentuk kantung penampung tembakau.",
        proTip: "Pastikan kain rol terbentang rata dan tidak terlipat miring di engsel samping alat.",
      },
      {
        stepNumber: 2,
        title: "Pasang Filter & Atur Kepadatan Tembakau",
        instruction:
          "Letakkan 1 busa filter di salah satu ujung samping (kiri atau kanan). Selanjutnya, masukkan tembakau di sepanjang sisa palung kain rol secara merata.",
        visualHint: "Ketinggian tembakau seimbang sejajar dengan diameter busa filter.",
        drawTip:
          "Ingin tarikan tipis & enteng? Cukup isi tembakau tipis-tipis saja tanpa ditekan. Ingin tarikan berat & mantap? Masukkan tembakau lebih padat dan ditekan merata.",
        proTip: "Gemburkan tembakau terlebih dahulu dengan jari sebelum ditata ke kain rol.",
        warning: "Jangan isi tembakau menggunduk di bagian tengah agar lintingan tidak buncit dan macet saat diputar.",
      },
      {
        stepNumber: 3,
        title: "Kunci Rol & Lakukan Putaran Awal",
        instruction:
          "Tarik silinder rol depan kembali ke posisi tertutup hingga terkunci rapat. Gunakan kedua ibu jari Anda untuk memutar silinder rol depan ke arah bawah (ke arah tubuh Anda) sebanyak 2–3 putaran penuh.",
        visualHint: "Tembakau di dalam tergulung menjadi silinder padat merata.",
        drawTip:
          "Jika ingin tarikan tipis, putar rol secara lembut. Jika ingin tarikan berat, putar sedikit lebih kencang agar tembakau semakin padat rapat.",
      },
      {
        stepNumber: 4,
        title: "Masukkan Kertas Papir & Basahi Garis Lem",
        instruction:
          "Ambil selembar kertas papir. Selipkan tepi bawah papir tegak lurus ke dalam celah rol, dengan posisi garis lem menghadap ke arah Anda di sisi atas. Putar silinder ke bawah perlahan sampai hampir seluruh kertas masuk dan tersisa garis lemnya.",
        visualHint: "Hanya strip perekat lem papir yang tersisa di luar celah.",
        proTip: "Basahi garis lem tipis-tipis secara merata menggunakan lem tingwe atau sedikit air. Jangan terlalu becek.",
        warning: "Pastikan kertas masuk lurus tegak, jangan miring agar kertas tidak kusut atau sobek di dalam.",
      },
      {
        stepNumber: 5,
        title: "Putar Sempurna & Rokok Siap Dihisap!",
        instruction:
          "Setelah lem dibasahi, putar kembali silinder rol ke arah bawah sebanyak 1–2 putaran penuh agar lem merekat kuat di dalam. Buka silinder rol depan, dan sebatang rokok sempurna siap dinikmati!",
        visualHint: "Rokok terangkat rapi dari kain rol dengan lem yang merekat sempurna.",
        proTip: "Ketuk-ketuk perlahan bagian filter rokok ke meja 2–3 kali agar tembakau di pangkal filter semakin rapat.",
      },
    ],
    troubleshooting: [
      {
        issue: "Tarikan rokok terasa terlalu berat / susah disedot?",
        solution: "Tembakau terlalu padat. Untuk tarikan tipis/enteng, cukup isi tembakau tipis-tipis saja dan gemburkan terlebih dahulu.",
      },
      {
        issue: "Rokok cepat habis dan tarikan terlalu kosong?",
        solution: "Tembakau terlalu sedikit/kurang isi. Untuk tarikan berat mantap, isi tembakau lebih padat merata.",
      },
      {
        issue: "Kertas papir terlipat atau sobek saat masuk celah rol?",
        solution: "Kertas dimasukkan serong atau kain rol terlipat. Masukkan kertas tegak lurus dan putar dengan ritme stabil.",
      },
    ],
  },
  {
    id: "slorok-manual",
    name: "Alat Slorok Manual (Alat Cetak Slorokan)",
    shortLabel: "Alat Slorok Manual",
    subtitle: "Metode slorok geser legendaris dengan cetakan palung presisi",
    badge: "Metode Klasik Teruji",
    badgeColor: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    youtubeUrl: "https://youtu.be/eLlI8p6MrvA?si=UOGIq2d94lij8HR8&t=230",
    youtubeStartSeconds: 230,
    timeEst: "~30 Detik",
    outputStyle: "Bentuk Lurus Kokoh & Padat Merata",
    bestFor: "Perokok tingwe yang menyukai teknik slorokan geser klasik dengan hasil gulungan yang padat presisi.",
    description:
      "Alat cetak slorok manual menggunakan alur cetakan dan kain pembungkus dengan sistem geser/slorokan. Sangat cocok untuk membuat rokok dengan kepadatan mantap dari pangkal hingga ujung.",
    requiredGear: [
      { name: "Alat Slorok Manual (Cetakan Slorokan)" },
      { name: "Tembakau Pilihan" },
      { name: "Kertas Papir Pilihan" },
      { name: "Busa Filter Regular / Mild" },
      { name: "Lem Kertas Tingwe / Air" },
    ],
    steps: [
      {
        stepNumber: 1,
        title: "Posisikan Alat Slorok & Buka Cetakan",
        instruction:
          "Letakkan alat slorok di permukaan meja yang datar. Buka tuas atau posisikan kain slorokan pada posisi awal sehingga celah alur cetakan siap diisi.",
        visualHint: "Alur kain slorokan membentuk lekukan panjang yang bersih dan siap diisi.",
      },
      {
        stepNumber: 2,
        title: "Pasang Filter & Atur Kepadatan Tembakau",
        instruction:
          "Letakkan busa filter di salah satu sudut celah slorok. Taburkan tembakau secara merata di sepanjang alur cetakan slorok.",
        visualHint: "Tembakau terisi rata sepanjang alur dari batas filter hingga ujung luar.",
        drawTip:
          "Ingin tarikan tipis? Beri tembakau tipis saja secara merata tanpa dipress. Ingin tarikan berat? Beri tembakau padat dan tekan lembut agar terisi tebal.",
        proTip: "Pastikan tidak ada urat tembakau kasar yang mencuat agar kain slorok meluncur lancar.",
      },
      {
        stepNumber: 3,
        title: "Pasang Kertas Papir & Beri Lem",
        instruction:
          "Posisikan selembar kertas papir di alur slorok, dengan sisi garis lem berada di atas dan menghadap ke arah Anda. Oleskan lem kertas tingwe atau basahi garis lem tipis-tipis secara merata.",
        visualHint: "Kertas papir terpasang lurus di atas cetakan dengan lem yang sudah dibasahi.",
        warning: "Jangan membasahi lem terlalu basah agar kertas tidak menempel prematur ke kain slorok.",
      },
      {
        stepNumber: 4,
        title: "Geser / Slorokkan Tuas Secara Stabil",
        instruction:
          "Pegang badan alat dengan tangan kiri, lalu dorong atau geser tuas slorokan dengan tangan kanan dalam satu gerakan halus, stabil, dan mantap.",
        visualHint: "Kain slorok akan menggulung dan membungkus tembakau bersama papir secara serentak.",
        proTip: "Lakukan gerakan geser dengan kecepatan konstan tanpa tersendat agar lintingan terbentuk mulus.",
      },
      {
        stepNumber: 5,
        title: "Buka Slorokan & Ambil Rokok Jadi",
        instruction:
          "Kembalikan tuas slorok ke posisi semula dan buka penutupnya. Batang rokok yang sudah tergulung padat dan lurus sempurna siap diambil!",
        visualHint: "Rokok tergulung rapi, sambungan lem merekat kuat tanpa kerutan.",
        proTip: "Gunting atau rapikan helai tembakau yang berlebih di ujung depan untuk penampilan maksimal.",
      },
    ],
    troubleshooting: [
      {
        issue: "Tuas slorok terasa seret / macet saat digeser?",
        solution: "Tembakau terlalu banyak/padat. Kurangi sedikit tembakau agar mekanisme slorok bisa meluncur lancar.",
      },
      {
        issue: "Tarikan rokok terlalu enteng dan berasap tipis?",
        solution: "Isi tembakau kurang padat. Untuk tarikan berat mantap, padatkan tembakau secara merata di sepanjang alur slorokan.",
      },
      {
        issue: "Papir terlipat miring saat digeser?",
        solution: "Posisi kertas di awal miring. Pastikan tepi kertas sejajar lurus dengan cetakan sebelum tuas digeser.",
      },
    ],
  },
]

export default function HowToRollSection() {
  const [selectedToolId, setSelectedToolId] = useState<RollingTool["id"]>("linting-kecil")
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalToolId, setModalToolId] = useState<RollingTool["id"]>("linting-kecil")
  const [activeDrawTab, setActiveDrawTab] = useState<"tipis" | "berat">("tipis")

  const { addMultipleItems } = useCart()
  const { toast } = useToast()

  const currentTool = ROLLING_TOOLS.find((t) => t.id === selectedToolId) || ROLLING_TOOLS[0]
  const modalTool = ROLLING_TOOLS.find((t) => t.id === modalToolId) || ROLLING_TOOLS[0]

  const handleSelectTool = (id: RollingTool["id"]) => {
    setSelectedToolId(id)
    setCurrentStepIdx(0)
  }

  const handleOpenModal = (id: RollingTool["id"]) => {
    setModalToolId(id)
    setIsModalOpen(true)
  }

  const nextStep = () => {
    if (currentStepIdx < currentTool.steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1)
    }
  }

  const handleAddStarterKit = () => {
    addMultipleItems([
      {
        id: "44-25g",
        productId: 44,
        name: "Linting Surya (25gr - Tester Ziplock)",
        price: 8000,
        image: "/images/accessories.png",
        weight: 35,
        variant: "25gr - Tester Ziplock",
      },
      {
        id: "addon-papir-1pak",
        productId: 48,
        name: "Kertas Papir Premium (1 Pak)",
        price: 2000,
        image: "/images/accessories.png",
        weight: 15,
        variant: "1 Pak",
      },
      {
        id: "addon-busa-kecil",
        productId: 46,
        name: "Busa Filter Regular (Bungkus Kecil)",
        price: 5000,
        image: "/images/accessories.png",
        weight: 25,
        variant: "Bungkus Kecil",
      },
      {
        id: "addon-lem-standar",
        productId: 49,
        name: "Lem Kertas Tingwe (1 Botol)",
        price: 3000,
        image: "/images/accessories.png",
        weight: 20,
        variant: "1 Botol",
      },
    ])

    toast({
      title: "Perlengkapan Ditambahkan! 🎒",
      description: "Paket Starter Kit (Tembakau 25g + Papir + Busa + Lem) siap di keranjang.",
    })
  }

  return (
    <section id="cara-melinting" className="px-4 md:px-7 py-6 scroll-mt-20">
      <div className="rounded-3xl border-2 border-accent/30 bg-gradient-to-b from-card via-raised/40 to-card p-5 md:p-8 shadow-lg relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ─── SECTION HEADER ────────────────────────────────────────── */}
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-7 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-bold uppercase tracking-wider shadow-xs">
            <Sparkles size={13} />
            <span>Pojok Edukasi Tingwe</span>
          </div>

          <h2 className="font-display font-extrabold text-xl sm:text-2xl md:text-3xl text-text-primary tracking-tight leading-tight">
            Panduan &amp; Cara Melinting Dewe{" "}
            <span className="text-accent underline decoration-accent/40 underline-offset-4">
              (Tingwe)
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            Belajar melinting rokok sendiri dengan dua alat paling praktis dan teruji. Pilih alat di bawah,
            baca langkah demi langkahnya, atau tonton langsung video tutorial YouTube resminya!
          </p>
        </div>

        {/* ─── KUNCI RAHASIA TARIKAN CALLOUT BANNER ────────────────────── */}
        <div className="relative z-10 mb-8 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-emerald-500/10 p-4 md:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-border/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <SlidersHorizontal size={18} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-sm md:text-base text-text-primary flex items-center gap-2">
                  <span>Tips Rahasia Mengatur Tarikan Rokok</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Wajib Tahu!
                  </span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Kenyamanan hisapan rokok ditentukan oleh seberapa padat kamu menaruh tembakau
                </p>
              </div>
            </div>

            {/* Toggle Tab Tipis vs Berat */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-raised border border-border self-stretch sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveDrawTab("tipis")}
                className={`flex-1 sm:flex-none py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeDrawTab === "tipis"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-card"
                }`}
              >
                <Wind size={13} />
                <span>Tarikan Tipis (Enteng)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDrawTab("berat")}
                className={`flex-1 sm:flex-none py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeDrawTab === "berat"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-card"
                }`}
              >
                <Flame size={13} />
                <span>Tarikan Berat (Padat)</span>
              </button>
            </div>
          </div>

          {/* Dynamic Content based on selected Draw */}
          <div className="pt-3.5">
            {activeDrawTab === "tipis" ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-text-primary space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 font-display">
                  <Wind size={15} />
                  <span>Untuk Tarikan Tipis &amp; Enteng: Masukkan Tembakau Tipis Saja</span>
                </div>
                <p className="text-text-secondary leading-relaxed pl-6">
                  💡 <strong>Kuncinya:</strong> Taburkan tembakau secara tipis-tipis dan gemburkan terlebih dahulu.
                  Jangan ditekan paksa! Udara akan mengalir bebas di sela-sela daun tembakau, hisapan terasa sangat enteng di tenggorokan, tidak bikin batuk/serak, dan sangat cocok bagi penikmat rokok mild atau pemula.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-text-primary space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 font-display">
                  <Flame size={15} />
                  <span>Untuk Tarikan Berat &amp; Mantap: Masukkan Tembakau Lebih Padat</span>
                </div>
                <p className="text-text-secondary leading-relaxed pl-6">
                  🔥 <strong>Kuncinya:</strong> Isi tembakau lebih banyak dan padatkan secara merata dari ujung ke ujung.
                  Tarikan akan terasa padat, berbobot, karakter rempah cengkeh lebih tebal di mulut, dan rokok tidak cepat habis saat dibakar (tahan lama untuk santai ngopi).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── 2 TOOL CARDS SIDE-BY-SIDE ─────────────────────────────── */}
        <div className="relative z-10 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-display">
              Pilih Alat yang Ingin Dipelajari:
            </span>
            <span className="text-[11px] text-accent font-semibold hidden sm:inline">
              Dilengkapi panduan langkah demi langkah &amp; video YouTube
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLLING_TOOLS.map((tool, idx) => {
              const isSelected = selectedToolId === tool.id
              return (
                <div
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? "border-accent bg-accent/10 shadow-md ring-2 ring-accent/30"
                      : "border-border bg-card/90 hover:bg-raised hover:border-border-strong text-text-secondary"
                  }`}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-accent text-accent-text font-display font-extrabold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tool.badgeColor}`}
                        >
                          {tool.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-text-muted font-medium flex items-center gap-1">
                        <Clock size={12} /> {tool.timeEst}
                      </span>
                    </div>

                    <h3
                      className={`font-display font-bold text-base md:text-lg transition-colors ${
                        isSelected ? "text-accent" : "text-text-primary group-hover:text-accent"
                      }`}
                    >
                      {tool.name}
                    </h3>

                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      {tool.subtitle}
                    </p>

                    <p className="text-xs text-text-secondary mt-2.5 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* Action Buttons: Cara Pakai & Tonton YouTube */}
                  <div className="pt-4 mt-4 border-t border-border/70 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Step-by-Step Guide Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectTool(tool.id)
                          handleOpenModal(tool.id)
                        }}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          isSelected
                            ? "bg-accent text-accent-text hover:bg-accent-hover"
                            : "bg-raised border border-border hover:border-accent text-text-primary hover:bg-accent/15"
                        }`}
                      >
                        <span>Panduan {tool.shortLabel}</span>
                        <ChevronRight size={13} />
                      </button>

                      {/* Direct YouTube Video Button */}
                      <a
                        href={tool.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Tonton di YouTube</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── ACTIVE TOOL INTERACTIVE STEP-BY-STEP & YOUTUBE VIEWER ──── */}
        <div className="relative z-10 bg-card rounded-2xl border border-border p-5 md:p-7 shadow-sm">
          {/* Header of Active Tool */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-border">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentTool.badgeColor}`}
                >
                  {currentTool.badge}
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock size={12} /> Estimasi waktu: <strong>{currentTool.timeEst}</strong>
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Layers size={12} /> Hasil: <strong>{currentTool.outputStyle}</strong>
                </span>
              </div>
              <h3 className="font-display font-extrabold text-lg md:text-xl text-text-primary">
                Tutorial Langkah Demi Langkah: {currentTool.name}
              </h3>
              <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
                {currentTool.bestFor}
              </p>
            </div>

            {/* YouTube Direct Link + Modal Button */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={currentTool.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Play size={13} fill="currentColor" />
                <span>Buka Video YouTube</span>
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                onClick={() => handleOpenModal(currentTool.id)}
                className="py-2 px-3 rounded-xl border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Lihat Mode Penuh</span>
              </button>
            </div>
          </div>

          {/* Embedded YouTube Video Player */}
          <div className="my-5 rounded-2xl overflow-hidden border border-border bg-black aspect-video max-w-2xl mx-auto shadow-md">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/eLlI8p6MrvA?start=${currentTool.youtubeStartSeconds}&rel=0`}
              title={`Tutorial ${currentTool.name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Stepper Progress Bar */}
          <div className="py-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-text-primary flex items-center gap-1.5 font-display">
                <span className="w-5 h-5 rounded-full bg-accent text-accent-text text-[11px] flex items-center justify-center font-bold">
                  {currentStepIdx + 1}
                </span>
                <span>
                  Langkah {currentStepIdx + 1} dari {currentTool.steps.length}:{" "}
                  <strong className="text-accent">{currentTool.steps[currentStepIdx].title}</strong>
                </span>
              </span>
              <span className="text-text-muted text-[11px]">
                {Math.round(((currentStepIdx + 1) / currentTool.steps.length) * 100)}% Selesai
              </span>
            </div>

            {/* Clickable Step Pills */}
            <div className="grid grid-cols-5 gap-1.5">
              {currentTool.steps.map((st, idx) => {
                const isActive = idx === currentStepIdx
                const isPassed = idx < currentStepIdx
                return (
                  <button
                    key={st.stepNumber}
                    type="button"
                    onClick={() => setCurrentStepIdx(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? "bg-accent ring-2 ring-accent/30"
                        : isPassed
                        ? "bg-emerald-500"
                        : "bg-raised hover:bg-border-strong"
                    }`}
                    title={`Langkah ${st.stepNumber}: ${st.title}`}
                  />
                )
              })}
            </div>
          </div>

          {/* Step Detail Card */}
          <div className="rounded-2xl bg-raised/50 border border-border p-5 md:p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted font-display block">
                  Langkah 0{currentTool.steps[currentStepIdx].stepNumber}
                </span>
                <h4 className="font-display font-extrabold text-base md:text-lg text-text-primary">
                  {currentTool.steps[currentStepIdx].title}
                </h4>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                  {currentTool.steps[currentStepIdx].instruction}
                </p>
              </div>

              {/* Number Badge */}
              <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent border border-accent/30 flex items-center justify-center font-display font-extrabold text-xl flex-shrink-0">
                {currentTool.steps[currentStepIdx].stepNumber}
              </div>
            </div>

            {/* Visual Hint Box */}
            <div className="p-3 rounded-xl bg-card border border-border/80 flex items-start gap-2.5 text-xs text-text-primary">
              <div className="p-1 rounded-md bg-accent/10 text-accent flex-shrink-0 mt-0.5">
                <CheckCircle2 size={14} />
              </div>
              <div>
                <span className="font-semibold text-text-primary block mb-0.5">
                  Visual Ciri-ciri Benar:
                </span>
                <span className="text-text-secondary leading-relaxed">
                  {currentTool.steps[currentStepIdx].visualHint}
                </span>
              </div>
            </div>

            {/* Specific Draw Tip for this step */}
            {currentTool.steps[currentStepIdx].drawTip && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-2">
                <SlidersHorizontal size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-800 dark:text-amber-300 block mb-0.5">
                    Tips Tarikan (Tipis vs Padat):
                  </strong>
                  <span className="text-text-secondary leading-relaxed">
                    {currentTool.steps[currentStepIdx].drawTip}
                  </span>
                </div>
              </div>
            )}

            {/* Pro Tip & Warning Callouts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {currentTool.steps[currentStepIdx].proTip && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-start gap-2">
                  <Lightbulb size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-800 dark:text-emerald-300 block mb-0.5">
                      Pro Tip:
                    </strong>
                    <span className="text-text-secondary leading-relaxed">
                      {currentTool.steps[currentStepIdx].proTip}
                    </span>
                  </div>
                </div>
              )}

              {currentTool.steps[currentStepIdx].warning && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-red-800 dark:text-red-300 block mb-0.5">
                      Perhatikan:
                    </strong>
                    <span className="text-text-secondary leading-relaxed">
                      {currentTool.steps[currentStepIdx].warning}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Stepper Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-border/70">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStepIdx === 0}
                className="py-2 px-3.5 rounded-xl border border-border text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-card cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Langkah Sebelumnya</span>
              </button>

              {currentStepIdx < currentTool.steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="py-2 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>Langkah Berikutnya</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenModal(currentTool.id)}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Check size={14} strokeWidth={3} />
                  <span>Selesai! Lihat Ringkasan</span>
                </button>
              )}
            </div>
          </div>

          {/* ─── REQUIRED GEAR CHECKLIST ─────────────────────────────── */}
          <div className="mt-5 pt-5 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider block font-display">
                Perlengkapan untuk {currentTool.shortLabel}:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {currentTool.requiredGear.map((gear, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-raised border border-border text-text-secondary font-medium"
                  >
                    <Check size={11} className="text-emerald-500" />
                    <span>{gear.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={handleAddStarterKit}
              className="py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-xs font-bold flex items-center gap-2 shadow-sm transition-all flex-shrink-0 cursor-pointer"
            >
              <ShoppingBag size={14} />
              <span>Ambil Starter Kit Bahan (Rp 18.000)</span>
            </button>
          </div>
        </div>

        {/* ─── COMMON TROUBLESHOOTING FAQ ────────────────────────────── */}
        <div className="relative z-10 mt-8 pt-6 border-t border-border/70">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={18} className="text-accent" />
            <h3 className="font-display font-bold text-sm md:text-base text-text-primary">
              Troubleshooting: Solusi Masalah Saat Melinting
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentTool.troubleshooting.map((trouble, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-card border border-border space-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-text-primary block flex items-start gap-1.5">
                    <span className="text-amber-500 font-extrabold">Q:</span>
                    <span>{trouble.issue}</span>
                  </span>
                  <p className="text-[11px] text-text-secondary mt-1.5 leading-relaxed">
                    <strong className="text-emerald-600 dark:text-emerald-400">Solusi:</strong>{" "}
                    {trouble.solution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FULL MODAL GUIDE POPUP ──────────────────────────────────── */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-border flex items-start justify-between gap-4 bg-raised/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${modalTool.badgeColor}`}
                  >
                    {modalTool.badge}
                  </span>
                  <span className="text-xs text-text-muted flex items-center gap-1 font-semibold">
                    <Clock size={12} /> {modalTool.timeEst}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-lg md:text-xl text-text-primary">
                  Panduan Lengkap: {modalTool.name}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {modalTool.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-raised hover:bg-border-strong text-text-muted hover:text-text-primary flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Tutup panduan"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Tool Switcher inside Modal */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-raised border border-border">
                {ROLLING_TOOLS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setModalToolId(t.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      modalToolId === t.id
                        ? "bg-accent text-accent-text shadow-xs"
                        : "text-text-secondary hover:text-text-primary hover:bg-card"
                    }`}
                  >
                    {t.shortLabel}
                  </button>
                ))}
              </div>

              {/* YouTube Link Banner in Modal */}
              <div className="p-3.5 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center flex-shrink-0">
                    <Play size={14} fill="currentColor" />
                  </div>
                  <div>
                    <span className="font-bold text-text-primary block">Video Tutorial YouTube Tersedia</span>
                    <span className="text-text-muted text-[11px]">Tonton langsung menit ke detik {modalTool.youtubeStartSeconds}s</span>
                  </div>
                </div>

                <a
                  href={modalTool.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 transition-all flex-shrink-0"
                >
                  <span>Buka Video</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* All Steps in List Format */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider font-display">
                  Urutan Langkah Lengkap (Step-by-Step):
                </h4>

                {modalTool.steps.map((st) => (
                  <div
                    key={st.stepNumber}
                    className="p-4 rounded-2xl bg-raised/50 border border-border space-y-2 relative"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-accent text-accent-text font-display font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                        {st.stepNumber}
                      </span>
                      <h5 className="font-display font-bold text-sm text-text-primary">
                        {st.title}
                      </h5>
                    </div>

                    <p className="text-xs text-text-secondary pl-10 leading-relaxed">
                      {st.instruction}
                    </p>

                    {st.drawTip && (
                      <div className="ml-10 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-text-secondary flex items-start gap-1.5">
                        <SlidersHorizontal size={13} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-amber-700 dark:text-amber-300">Tips Tarikan:</strong>{" "}
                          {st.drawTip}
                        </span>
                      </div>
                    )}

                    {st.proTip && (
                      <div className="ml-10 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-text-secondary flex items-start gap-1.5">
                        <Lightbulb size={13} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-emerald-700 dark:text-emerald-300">Tips:</strong>{" "}
                          {st.proTip}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Required Gear Checklist */}
              <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                <h5 className="font-display font-bold text-xs text-text-primary uppercase tracking-wider">
                  Daftar Alat &amp; Bahan yang Harus Disiapkan:
                </h5>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {modalTool.requiredGear.map((gear, i) => (
                    <li key={i} className="flex items-center gap-2 text-text-secondary">
                      <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                      <span>{gear.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 md:p-5 border-t border-border bg-raised/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-text-muted text-center sm:text-left">
                🎒 Siap mencoba? Dapatkan paket hemat komplit siap pakai.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-3.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-card flex-1 sm:flex-none cursor-pointer"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleAddStarterKit()
                    setIsModalOpen(false)
                  }}
                  className="py-2 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm flex-1 sm:flex-none cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  <span>Ambil Starter Kit (Rp 18.000)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

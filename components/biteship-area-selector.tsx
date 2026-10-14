"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Check, Loader2, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import type { BiteshipArea } from "@/lib/biteship"

interface BiteshipAreaSelectorProps {
  onSelectArea: (area: BiteshipArea) => void
  selectedArea?: BiteshipArea | null
  disabled?: boolean
}

export default function BiteshipAreaSelector({
  onSelectArea,
  selectedArea,
  disabled,
}: BiteshipAreaSelectorProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<BiteshipArea[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Fetch areas from Biteship API
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 3) {
      setResults([])
      setIsLoading(false)
      return
    }

    let isCancelled = false
    setIsLoading(true)

    fetch(`/api/biteship/maps/areas/?input=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          setResults(data.areas || [])
          setIsLoading(false)
          setIsOpen(true)
        }
      })
      .catch((err) => {
        console.error("Area fetch error:", err)
        if (!isCancelled) {
          setResults([])
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const handleSelect = (area: BiteshipArea) => {
    onSelectArea(area)
    setQuery("")
    setIsOpen(false)
  }

  const handleClear = () => {
    setQuery("")
    setResults([])
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block font-display">
        Kecamatan / Kota / Kode Pos Tujuan:
      </label>

      {/* Selected Area Pill Preview */}
      {selectedArea ? (
        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={15} className="text-accent flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-text-primary truncate block font-display">
                {selectedArea.administrative_division_level_3_name},{" "}
                {selectedArea.administrative_division_level_2_name}
              </span>
              <span className="text-[11px] text-text-muted truncate block">
                {selectedArea.administrative_division_level_1_name} • Kode Pos:{" "}
                <strong>{selectedArea.postal_code}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectArea(null as any)}
            disabled={disabled}
            className="text-xs text-accent hover:underline font-semibold flex-shrink-0 px-2 py-1 rounded-md hover:bg-accent/15 transition-colors"
          >
            Ubah
          </button>
        </div>
      ) : (
        /* Autocomplete Search Input */
        <div className="relative">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3 text-text-muted pointer-events-none" />
            <input
              type="text"
              className="input-base pl-9 pr-8 text-xs py-2.5 w-full"
              placeholder="Ketik minimal 3 huruf (contoh: Klojen, Kebayoran, 65111)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true)
              }}
              disabled={disabled}
            />
            {isLoading ? (
              <Loader2 size={14} className="absolute right-3 text-accent animate-spin" />
            ) : query ? (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 text-text-muted hover:text-text-primary"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown List */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50 divide-y divide-border/60">
              {results.length > 0 ? (
                results.map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => handleSelect(area)}
                    className="w-full text-left p-3 hover:bg-raised transition-colors flex items-start gap-2.5 group cursor-pointer"
                  >
                    <MapPin
                      size={14}
                      className="text-text-muted group-hover:text-accent mt-0.5 flex-shrink-0 transition-colors"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-text-primary group-hover:text-accent block transition-colors">
                        {area.name}
                      </span>
                      <span className="text-[10px] text-text-muted mt-0.5 block">
                        Kode Pos: {area.postal_code}
                      </span>
                    </div>
                  </button>
                ))
              ) : debouncedQuery.length >= 3 && !isLoading ? (
                <div className="p-4 text-center text-xs text-text-muted">
                  Lokasi &quot;{debouncedQuery}&quot; tidak ditemukan. Coba ketik nama kecamatan atau kode pos lain.
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

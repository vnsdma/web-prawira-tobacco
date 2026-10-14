import React from "react"

export default function Logo({
  className = "w-6 h-6 text-accent",
  size = 24,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer Leaf Contour */}
        <path d="M 50 13 C 74 31, 74 58, 50 78 C 26 58, 26 31, 50 13 Z" strokeWidth="3.8" />
        
        {/* Curved Stem */}
        <path d="M 50 78 C 50 82, 47 86, 44 87" strokeWidth="3.4" />

        {/* Upper Leaf Veins */}
        <line x1="50" y1="17" x2="50" y2="34" strokeWidth="2.6" />
        <path d="M 50 24 L 38 29" strokeWidth="2.4" />
        <path d="M 50 24 L 62 29" strokeWidth="2.4" />
        <path d="M 50 31 L 42 34" strokeWidth="2.2" opacity="0.8" />
        <path d="M 50 31 L 58 34" strokeWidth="2.2" opacity="0.8" />

        {/* Playful Smiling Face */}
        <path d="M 39 44 C 41 40, 46 40, 48 44" strokeWidth="3.4" />
        <path d="M 52 44 C 54 40, 59 40, 61 44" strokeWidth="3.4" />
        <path d="M 40 54 C 44 61, 56 61, 60 54" strokeWidth="3.6" />

        {/* Lower Vein Accents */}
        <path d="M 50 73 C 42 69, 36 64, 34 57" strokeWidth="2.4" />
        <path d="M 50 73 C 58 69, 64 64, 66 57" strokeWidth="2.4" />
      </g>
    </svg>
  )
}

"use client"

import { useRef } from "react"

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function SpotlightCard({ children, className, style }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty("--spotlight-x", `${e.clientX - rect.left}px`)
    ref.current.style.setProperty("--spotlight-y", `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`spotlight-card ${className ?? ""}`}
      style={style}
    >
      {children}
    </div>
  )
}

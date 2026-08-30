"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"

interface ContextValue {
  isDirty: boolean
  setDirty: (dirty: boolean) => void
  navigate: (href: string) => void
}

const UnsavedChangesContext = createContext<ContextValue>({
  isDirty: false,
  setDirty: () => {},
  navigate: () => {},
})

function UnsavedChangesDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
      if (e.key === "Enter") onConfirm()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onCancel, onConfirm])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#3a3a3a]/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-[#f5f4f1] border border-[#bfc3c7] rounded-2xl p-8 shadow-[0_32px_80px_rgba(10,20,10,0.22),0_8px_24px_rgba(10,20,10,0.12)]">
        <div className="flex items-start gap-4 mb-7">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#6e7f6a]/15 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-[#6e7f6a]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#3a3a3a] tracking-tight mb-1.5">
              Elmentetlen változtatások
            </h2>
            <p className="text-sm text-[#4a4f4a] font-light leading-relaxed">
              Ha most elhagyod az oldalt, a változtatásaid elvesznek.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg border border-[#bfc3c7] text-sm font-medium text-[#4a4f4a] hover:bg-[#4a4f4a]/8 transition-colors"
          >
            Maradok
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-10 rounded-lg bg-[#4a4f4a] text-[#ededed] text-sm font-semibold hover:bg-[#4a4f4a]/90 transition-colors"
          >
            Elhagyom
          </button>
        </div>
      </div>
    </div>
  )
}

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isDirty, setIsDirty] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  // Tracks whether we pushed a guard entry onto the history stack
  const guardPushedRef = useRef(false)

  useEffect(() => {
    if (!isDirty) {
      // If we were dirty before, pop the guard entry we pushed
      if (guardPushedRef.current) {
        guardPushedRef.current = false
        window.history.go(-1)
      }
      return
    }

    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener("beforeunload", handler)

    // Push a guard history entry so popstate fires on back navigation
    window.history.pushState(null, "", window.location.href)
    guardPushedRef.current = true

    const handlePopState = () => {
      // Re-push the guard so repeated back attempts are also intercepted
      window.history.pushState(null, "", window.location.href)
      setPendingHref("__back__")
      setShowDialog(true)
    }

    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("beforeunload", handler)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isDirty])

  const navigate = useCallback((href: string) => {
    if (isDirty) {
      setPendingHref(href)
      setShowDialog(true)
    } else {
      router.push(href)
    }
  }, [isDirty, router])

  const handleConfirm = useCallback(() => {
    guardPushedRef.current = false
    setIsDirty(false)
    setShowDialog(false)
    setPendingHref(null)
    if (pendingHref === "__back__") {
      // go(-2): undo the re-pushed guard AND the original guard, landing on the real previous page
      window.history.go(-2)
    } else if (pendingHref) {
      router.push(pendingHref)
    }
  }, [pendingHref, router])

  const handleCancel = useCallback(() => {
    setShowDialog(false)
    setPendingHref(null)
  }, [])

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setDirty: setIsDirty, navigate }}>
      {children}
      {showDialog && (
        <UnsavedChangesDialog onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </UnsavedChangesContext.Provider>
  )
}

export const useUnsavedChanges = () => useContext(UnsavedChangesContext)

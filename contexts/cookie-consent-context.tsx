"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

type ConsentValue = "accepted" | "rejected" | null

interface CookieConsentContextValue {
  consent: ConsentValue
  acceptConsent: () => void
  rejectConsent: () => void
  resetConsent: () => void
}

const CookieConsentContext = createContext<CookieConsentContextValue>({
  consent: null,
  acceptConsent: () => {},
  rejectConsent: () => {},
  resetConsent: () => {},
})

const STORAGE_KEY = "cookie-consent"

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentValue>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentValue | null
    if (stored === "accepted" || stored === "rejected") {
      setConsent(stored)
    }
  }, [])

  const acceptConsent = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "accepted")
    setConsent("accepted")
  }, [])

  const rejectConsent = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "rejected")
    setConsent("rejected")
  }, [])

  const resetConsent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setConsent(null)
  }, [])

  return (
    <CookieConsentContext.Provider value={{ consent, acceptConsent, rejectConsent, resetConsent }}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export const useCookieConsent = () => useContext(CookieConsentContext)

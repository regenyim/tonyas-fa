"use client"

import { Analytics } from "@vercel/analytics/next"
import { useCookieConsent } from "@/contexts/cookie-consent-context"

export function ConsentAwareAnalytics() {
  const { consent } = useCookieConsent()
  if (consent !== "accepted") return null
  return <Analytics />
}

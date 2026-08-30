import type React from "react"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { ConditionalFooter } from "@/components/conditional-footer"
import { PageTransition } from "@/components/ui/page-transition"
import { UnsavedChangesProvider } from "@/contexts/unsaved-changes-context"
import { CookieConsentProvider } from "@/contexts/cookie-consent-context"
import { CookieBanner } from "@/components/cookie-banner"
import { ConsentAwareAnalytics } from "@/components/consent-aware-analytics"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: "Zalaegerszegi Nordmann Fenyők - Karácsonyfák",
  description:
    "Nordmann karácsonyfák Zalaegerszeg határában. Családias hangulat, barátoknak és ismerősöknek, beszélgetéssel – nem futószalagon.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/spruce-icon.png", type: "image/png" },
    ],
    apple: "/spruce-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hu" className={plusJakarta.variable}>
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <CookieConsentProvider>
          <UnsavedChangesProvider>
            <Navigation />
            {/* pt-16 compensates for the fixed nav (h-16) so content on all pages isn't hidden underneath it */}
            <main className="flex-1 pt-16">
              <PageTransition>{children}</PageTransition>
            </main>
            <ConditionalFooter />
          </UnsavedChangesProvider>
          <CookieBanner />
          <ConsentAwareAnalytics />
        </CookieConsentProvider>
      </body>
    </html>
  )
}

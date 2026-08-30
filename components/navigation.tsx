"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useUnsavedChanges } from "@/contexts/unsaved-changes-context"

const navigationItems = [
  { label: "Fenyőink",        href: "/#fenyoink" },
  { label: "Hogyan működik?", href: "/#hogyan-mukodik" },
  { label: "GY.I.K.",         href: "/faq" },
  { label: "Elérhetőség",     href: "/contact" },
]

function LogoWave({ isSolid }: { isSolid: boolean }) {
  const chars = "HOLLÓSI FENYŐ".split("")

  return (
    <motion.span
      className={`inline-block cursor-pointer font-bold tracking-tight transition-colors duration-300 ${isSolid ? "text-foreground" : "text-white"}`}
      whileHover="hover"
      initial="initial"
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            initial: { y: 0, scale: 1 },
            hover: {
              y: -4,
              scale: 1.2,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15,
                delay: i * 0.03,
              },
            },
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  )
}

export function Navigation() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const [isOpen, setIsOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeHash, setActiveHash] = useState("")
  const { isDirty, navigate } = useUnsavedChanges()
  const menuPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleOutsideClick = (e: PointerEvent) => {
      if (menuPanelRef.current && !menuPanelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick)
    return () => document.removeEventListener("pointerdown", handleOutsideClick)
  }, [isOpen])

  const guardedClick = (e: React.MouseEvent, href: string, extra?: () => void) => {
    if (isDirty) {
      e.preventDefault()
      extra?.()
      navigate(href)
    } else {
      extra?.()
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash)
    updateHash()
    window.addEventListener("hashchange", updateHash)
    return () => window.removeEventListener("hashchange", updateHash)
  }, [])

  // On non-home pages there's no full-screen hero, so always use the solid style
  const isSolid = !isHome || scrolled

  const navLinkClass = isSolid
    ? "nav-link px-3 py-2 text-sm font-normal text-primary hover:text-foreground transition-colors"
    : "nav-link px-3 py-2 text-sm font-normal text-white/70 hover:text-white transition-colors"

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isSolid
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 text-base" onClick={(e) => guardedClick(e, "/")}>
            <LogoWave isSolid={isSolid} />
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const isActive = !item.href.startsWith("/#") && pathname === item.href
              const activeClass = isSolid
                ? "text-secondary"
                : "text-white"
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${navLinkClass} ${isActive ? `${activeClass} active` : ""}`}
                  onClick={(e) => guardedClick(e, item.href)}
                >
                  {item.label}
                </Link>
              )
            })}
            {isSolid ? (
              <Link href="/booking" onClick={(e) => guardedClick(e, "/booking")}>
                <Button
                  size="sm"
                  className="ml-4 text-sm font-semibold transition-colors duration-200 bg-primary text-primary-foreground hover:bg-primary/75"
                >
                  Időpontfoglalás
                </Button>
              </Link>
            ) : (
              <Link
                href="/booking"
                className={`${navLinkClass} !font-bold`}
                onClick={(e) => guardedClick(e, "/booking")}
              >
                Időpontfoglalás
              </Link>
            )}
            <Link href="/admin" className={navLinkClass} onClick={(e) => guardedClick(e, "/admin")}>
              Admin
            </Link>
          </div>

          {/* Mobile menu button — hidden when overlay is open */}
          {!isOpen && (
            <button
              className={`md:hidden cursor-pointer p-2 transition-colors duration-300 ${isSolid ? "text-foreground" : "text-white"}`}
              onClick={() => setIsOpen(true)}
              aria-label="Menü megnyitása"
            >
              <Menu size={24} />
            </button>
          )}
        </div>

      </div>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-50"
          >
            {/* Menu panel */}
            <motion.div
              ref={menuPanelRef}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-background/98 backdrop-blur-md shadow-md"
            >
              {/* Header row */}
              <div className="flex justify-between items-center h-16 px-4 sm:px-6">
                <Link href="/" className="text-base" onClick={(e) => guardedClick(e, "/", () => setIsOpen(false))}>
                  <LogoWave isSolid={true} />
                </Link>
                <button
                  className="cursor-pointer p-2 text-foreground"
                  onClick={() => setIsOpen(false)}
                  aria-label="Menü bezárása"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Nav items */}
              <div className="pb-4 space-y-0">
                {navigationItems.map((item) => {
                  const isActive = item.href.startsWith("/#")
                    ? pathname === "/" && activeHash === item.href.slice(1)
                    : pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2.5 text-base font-medium transition-colors ${
                        isActive ? "text-foreground" : "text-primary/70 hover:text-foreground"
                      }`}
                      onClick={(e) => guardedClick(e, item.href, () => {
                        if (item.href.startsWith("/#")) setActiveHash(item.href.slice(1))
                        setIsOpen(false)
                      })}
                    >
                      <span className={`relative inline-block ${isActive ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-current" : ""}`}>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
                <Link
                  href="/booking"
                  className={`block px-4 py-2.5 text-base font-bold transition-colors text-foreground`}
                  onClick={(e) => guardedClick(e, "/booking", () => setIsOpen(false))}
                >
                  <span className={`relative inline-block ${pathname === "/booking" ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-current" : ""}`}>
                    Időpontfoglalás
                  </span>
                </Link>
                <Link
                  href="/admin"
                  className="block px-4 py-2.5 text-sm text-primary/40 hover:text-primary/70 transition-colors"
                  onClick={(e) => guardedClick(e, "/admin", () => setIsOpen(false))}
                >
                  Admin
                </Link>
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { SpotlightEffect } from "@/components/ui/spotlight-effect"
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll"
import { TextEffect } from "@/components/ui/text-effect"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { AnimatedList } from "@/components/ui/animated-list"
import { Marquee3D } from "@/components/ui/marquee-3d"
import MistBackground from "@/components/ui/mist-background"
import { Glow } from "@/components/ui/glow"
import { formatPrice } from "@/lib/utils"

const treeVariants = [
  {
    number: "01",
    size: "Kisebb fa",
    height: "1–1,5 m",
    description: "Kisebb helyiségekbe, lakásokba. Nem nyomasztó, de pont elég.",
  },
  {
    number: "02",
    size: "Közepes fa",
    height: "1,5–2 m",
    description: "A legtöbben ezt viszik. Bármilyen nappaliba belefér.",
  },
  {
    number: "03",
    size: "Nagy fa",
    height: "2–2,5 m",
    description: "Erős jelenléte van. Nagyobb szobákba, ahol van neki hely.",
  },
  {
    number: "04",
    size: "Extra magas fa",
    height: "2,5 m felett",
    description: "Magasabb terű helyiségekbe. Ritka, de van belőlük.",
  },
]

const steps = [
  {
    number: "01",
    title: "Online napfoglalás",
    description: "Kiválasztasz egy szombatot vagy vasárnapot. 10 és 12 között érkezhetsz.",
  },
  {
    number: "02",
    title: "Kijössz, fát választasz",
    description: "Körbenéztek, kiválasztod, amelyik tetszik. Van idő megnézni.",
  },
  {
    number: "03",
    title: "Megjelöljük sorszámmal",
    description: "Számot kap a fád, bekerül a rendszerbe. Senki más nem veheti el.",
  },
  {
    number: "04",
    title: "Karácsony előtt kivágjuk",
    description: "A kivágás akkor történik. Így kapsz tényleg friss fát.",
  },
  {
    number: "05",
    title: "Átvétel és fizetés",
    description: "Sorszám alapján azonosítjuk. Készpénz vagy bankkártya.",
  },
]

export default function HomePage() {
  const [pricePerTree, setPricePerTree] = useState<number>(8000)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPricePerTree(data.settings.pricePerTree)
      })
      .catch(() => {})
  }, [])

  const cards = [
    {
      number: "01",
      title: "Csak Nordmann fenyő",
      body: "A legjobb, amit találsz — tűlevél-tartással, dús formával, frissen vágva.",
    },
    {
      number: "02",
      title: `Egységes ár: ${formatPrice(pricePerTree)}`,
      body: "Mérettől függetlenül. Nincs tárgyalás, nincs meglepetés.",
    },
    {
      number: "03",
      title: "Nyugodt, beszélgetős hangulat",
      body: "Van idő körbenézni. Nem sürgetünk senkit.",
    },
    {
      number: "04",
      title: "Megjelöljük a fádat",
      body: "Sorszámmal rögzítve. A kiválasztott fa a tied.",
    },
  ]

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-16">
        {/* Hero image */}
        <img
          src="/spruce.webp"
          alt="Nordmann fenyőerdő"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* WebGL mist — sits between photo and dark gradients */}
        <MistBackground />

        {/* Gradient overlay — top band for nav legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 35%)" }}
        />
        {/* Gradient overlay — bottom band for headline legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)" }}
        />

        {/* Grain texture overlay */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>
        </div>

        {/* Hero content — bottom-left anchored */}
        <div className="absolute z-10 bottom-0 left-0 right-0 pb-10 sm:pb-14">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
            <p
              className="text-xs font-medium tracking-[0.16em] uppercase text-white/50 mb-4"
              style={{ animation: "fade-in-up 0.5s var(--ease-premium) 0.2s both" }}
            >
              Zalaegerszeg · Nordmann fenyők
            </p>
            <TextEffect
              per="word"
              preset="blur"
              as="h1"
              delay={0.35}
              className="text-[clamp(1.75rem,8vw,3rem)] sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6 max-w-2xl"
            >
              KARÁCSONYFA, ZALAEGERSZEG HATÁRÁBAN
            </TextEffect>
            <p
              className="text-base sm:text-lg text-white/60 font-light mb-8 max-w-sm"
              style={{ animation: "fade-in-up 0.6s var(--ease-premium) 0.5s both" }}
            >
              Frissen vágva, személyesen fogadva.<br />Nem futószalagon.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-3"
              style={{ animation: "fade-in-up 0.6s var(--ease-premium) 0.65s both" }}
            >
              <Link href="/booking">
                <Button size="lg" className="w-full sm:w-auto h-12 px-7 text-base rounded-lg bg-white text-foreground hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,255,255,0.3)] active:translate-y-0 active:shadow-none font-semibold">
                  Időpontfoglalás
                </Button>
              </Link>
              <Link
                href="#hogyan-mukodik"
                className="cursor-pointer inline-flex items-center justify-center h-12 px-7 text-base font-normal text-white/75 border border-white/55 rounded-lg hover:text-white hover:border-white/80 transition-all duration-200 w-full sm:w-auto"
              >
                Hogyan működik?
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden="true"
          className="absolute right-6 bottom-12 hidden md:flex flex-col items-center gap-2 text-white/60"
          style={{ animation: "fade-in-up 0.6s var(--ease-premium) 1.2s both" }}
        >
          <span className="text-xs tracking-widest uppercase" style={{ writingMode: "vertical-rl" }}>Scroll</span>
          <div className="w-px h-12 bg-white/40" style={{ animation: "pulse-line 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-section-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <AnimateOnScroll>
            <div className="section-label justify-center">Miért válassz minket</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8 tracking-tight text-center">A mi különlegességünk</h2>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((card, i) => (
              <AnimateOnScroll key={card.title} delay={i * 100}>
                <SpotlightCard
                  className="bg-surface border border-border rounded-lg p-6 h-full [box-shadow:var(--shadow-card)]"
                >
                  <div className="flex items-center mb-2">
                    <p className="text-xs font-bold text-secondary tracking-widest w-8 flex-shrink-0">{card.number}</p>
                    <h3 className="flex-1 font-semibold text-base tracking-tight text-foreground text-center">{card.title}</h3>
                    <div className="w-8 flex-shrink-0" />
                  </div>
                  <p className="text-sm text-primary font-light leading-relaxed text-center">{card.body}</p>
                </SpotlightCard>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
        {/* Transition → Fenyőink */}
        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }} />
      </section>

      {/* Nordmann Fenyőink Section */}
      <section id="fenyoink" className="relative lg:min-h-screen flex items-center bg-background scroll-mt-16">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left — text */}
            <AnimateOnScroll>
              <div className="flex flex-col text-center lg:text-left items-center lg:items-start">
                <div className="section-label justify-center w-full">Kínálatunk</div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 tracking-tight leading-tight">
                  Nordmann fenyőink
                </h2>
                <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">Miért Nordmann?</h3>
                <p className="text-primary font-light mb-3 text-pretty">
                  Nem hullik a tűje. Ez az egyetlen komoly különbség, ami számít, ha otthon szeretnéd tartani az ünnep után is.
                </p>
                <p className="text-primary font-light mb-3 text-pretty">
                  Dús forma, erős ágak — a nehezebb díszeket is elbírja. Gyerekbarát, nincs szúrós tűlevele.
                </p>
                <p className="text-primary font-light mb-8 text-pretty">
                  Frissen vágva adjuk át. Nem hetekkel korábban vágott, ponyva alatt tárolt fa.
                </p>
                <div className="border border-border rounded-lg px-6 py-5 w-full text-center [box-shadow:var(--shadow-card)]">
                  <p className="text-xs font-bold text-primary/40 tracking-widest mb-1 uppercase">Egységes ár</p>
                  <p className="text-3xl font-extrabold text-foreground tracking-tight">
                    <AnimatedNumber value={pricePerTree} from={7000} suffix=" Ft" springOptions={{ stiffness: 75, damping: 27 }} />
                  </p>
                  <p className="text-sm text-primary font-light mt-1">Mérettől függetlenül.</p>
                </div>
              </div>
            </AnimateOnScroll>

            {/* Right — image */}
            <AnimateOnScroll delay={200}>
              <div className="bg-secondary/20 rounded-lg aspect-square overflow-hidden [box-shadow:0_8px_32px_rgba(10,20,10,0.18),0_2px_8px_rgba(10,20,10,0.10)]">
                <img
                  src="/fa.jpeg"
                  alt="Nordmann fa közelről"
                  className="w-full h-full object-cover"
                />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
        {/* Transition → Tree sizes */}
        <div aria-hidden="true" className="absolute z-0 bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, var(--surface))" }} />
      </section>

      {/* Tree Size Variants Section */}
      <section className="relative lg:min-h-screen flex items-center bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — image */}
            <AnimateOnScroll className="hidden lg:block">
              <div className="rounded-xl overflow-hidden aspect-[3/4] w-full max-h-[500px] [box-shadow:0_8px_32px_rgba(10,20,10,0.18),0_2px_8px_rgba(10,20,10,0.10)]">
                <img src="/vasar.png" alt="Nordmann fenyő vásár" className="w-full h-full object-cover" />
              </div>
            </AnimateOnScroll>

            {/* Right — title + cards */}
            <div>
              <AnimateOnScroll>
                <div className="text-center">
                  <div className="section-label justify-center">Méretek</div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-8 tracking-tight">Mekkora fát keresel?</h2>
                </div>
              </AnimateOnScroll>
              <div className="flex flex-col gap-4">
                {treeVariants.map((variant, i) => (
                  <AnimateOnScroll key={variant.number} delay={i * 100}>
                    <SpotlightCard className="bg-white border border-border rounded-lg p-5 h-full [box-shadow:var(--shadow-card)]">
                      <div className="flex items-center gap-4">
                        <p className="text-xs font-bold text-secondary/60 tracking-widest w-6 flex-shrink-0">{variant.number}</p>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base tracking-tight text-foreground">{variant.size} <span className="text-sm font-light text-primary/60 ml-1">{variant.height}</span></h3>
                          <p className="text-sm text-primary font-light leading-relaxed">{variant.description}</p>
                        </div>
                      </div>
                    </SpotlightCard>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <div aria-hidden="true" className="bg-primary overflow-hidden">
        <Marquee3D
          items={["Nordmann", "Zalaegerszeg", `${formatPrice(pricePerTree)}`, "Csak Nordmann fenyő", "Időpontfoglalás", "Frissen vágva"]}
          speed={60}
        />
      </div>

      {/* Hogyan Működik Section */}
      <section id="hogyan-mukodik" className="relative min-h-screen flex items-center bg-section-alt scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left — heading + steps + button */}
            <AnimateOnScroll>
              <div className="flex flex-col items-center text-center">
                <div className="section-label justify-center">A vásárlás folyamata</div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight leading-tight">
                  Hogyan működünk?
                </h2>
                <p className="text-primary font-light mb-8 max-w-xs">
                  Az online foglalástól az átvételig öt lépés.
                </p>
                <div className="w-full mb-8 border border-border rounded-lg px-4 bg-white/60 [box-shadow:var(--shadow-card)]">
                  <AnimatedList
                    staggerDelay={0.1}
                    itemClassName="border-b border-border last:border-b-0"
                    items={steps.map((step, index) => (
                      <div key={step.number} className="flex gap-5 items-start py-4 text-left">
                        <span className="text-xs font-bold text-primary/40 w-6 flex-shrink-0 mt-1 tabular-nums">
                          {step.number}
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-0.5 tracking-tight">{step.title}</h3>
                          <p className="text-sm text-primary font-light leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  />
                </div>
                <Link href="/booking">
                  <Button className="h-12 px-7 text-base rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(74,79,74,0.25)] active:translate-y-0 active:shadow-none font-semibold">
                    Időpontfoglalás
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>

            {/* Right — image */}
            <AnimateOnScroll delay={200} className="hidden lg:block">
              <div className="rounded-xl overflow-hidden w-3/4 mx-auto aspect-[3/4] [box-shadow:0_8px_32px_rgba(10,20,10,0.18),0_2px_8px_rgba(10,20,10,0.10)]">
                <img src="/sorszam.png" alt="Sorszámozott fenyő" className="w-full h-full object-cover" />
              </div>
            </AnimateOnScroll>

          </div>
        </div>
      </section>
    </div>
  )
}

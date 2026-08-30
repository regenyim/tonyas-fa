"use client"

import { useState } from "react"
import { TextEffect } from "@/components/ui/text-effect"
import { InView } from "@/components/ui/in-view"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { SpotlightEffect } from "@/components/ui/spotlight-effect"
import { Marquee3D } from "@/components/ui/marquee-3d"
import { AnimatedList } from "@/components/ui/animated-list"

/* ─── helpers ──────────────────────────────────────────────── */
function Label({ text, placement }: { text: string; placement: string }) {
  return (
    <div className="mb-6">
      <span className="inline-block text-[10px] font-bold tracking-[0.14em] uppercase text-[#6e7f6a] border border-[#6e7f6a]/40 rounded-full px-3 py-1 mb-2">
        {text}
      </span>
      <p className="text-xs text-[#4a4f4a] font-light">Elhelyezés: <strong className="font-medium text-[#3a3a3a]">{placement}</strong></p>
    </div>
  )
}

function Section({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <section className={`py-20 px-6 sm:px-12 lg:px-20 border-b border-[#bfc3c7] ${dark ? "bg-[#3a3a3a]" : "bg-[#f5f4f1]"}`}>
      <div className="max-w-4xl mx-auto">{children}</div>
    </section>
  )
}

/* ─── animated list items ───────────────────────────────────── */
const faqItems = [
  "Lehet bankkártyával fizetni?",
  "Mi van, ha nem tudok eljönni?",
  "Több fát is vihetek?",
  "Mi van, ha rossz idő van?",
  "Van házhozszállítás?",
]

/* ─── page ──────────────────────────────────────────────────── */
export default function PreviewPage() {
  const [textKey, setTextKey] = useState(0)
  const [spotlightKey, setSpotlightKey] = useState(0)
  const [listKey, setListKey] = useState(0)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#3a3a3a] px-6 sm:px-12 lg:px-20 py-10">
        <p className="text-xs font-bold tracking-[0.14em] uppercase text-[#6e7f6a] mb-2">Animáció előnézet</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">6 komponens az oldalra</h1>
        <p className="text-white/50 font-light mt-2">Görgess le minden effektet megtekinteni.</p>
      </div>

      {/* 1 — Text Effect */}
      <Section>
        <Label text="1 · Text Effect" placement="Minden szekció főcíme — h1, h2 elemek" />
        <div className="space-y-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#4a4f4a]/50 mb-3">Per word · blur preset</p>
            <TextEffect key={`word-${textKey}`} per="word" preset="blur" as="h2"
              className="text-4xl sm:text-5xl font-bold text-[#3a3a3a] tracking-tight leading-tight">
              KARÁCSONYFA, ZALAEGERSZEG HATÁRÁBAN
            </TextEffect>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#4a4f4a]/50 mb-3">Per char · fade-in-blur preset</p>
            <TextEffect key={`char-${textKey}`} per="char" preset="fade-in-blur" as="h2" delay={0.3}
              className="text-3xl font-bold text-[#3a3a3a] tracking-tight">
              Nordmann fenyőink
            </TextEffect>
          </div>
          <button onClick={() => setTextKey(k => k + 1)}
            className="text-xs font-semibold text-[#6e7f6a] border border-[#6e7f6a]/40 rounded-lg px-4 py-2 hover:bg-[#6e7f6a]/10 transition-colors">
            ↺ Újrajátszás
          </button>
        </div>
      </Section>

      {/* 2 — Animated Number */}
      <Section>
        <Label text="2 · Animated Number" placement="Egységes ár megjelenítése — főoldal és foglalás" />
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="border border-[#bfc3c7] rounded-xl px-8 py-6 text-center bg-white">
            <p className="text-[10px] font-bold tracking-widest text-[#4a4f4a]/40 uppercase mb-1">Egységes ár</p>
            <p className="text-5xl font-extrabold text-[#3a3a3a] tracking-tight">
              <AnimatedNumber value={8000} suffix=" Ft" springOptions={{ stiffness: 50, damping: 18 }} />
            </p>
            <p className="text-sm text-[#4a4f4a] font-light mt-1">Mérettől függetlenül</p>
          </div>
          <p className="text-sm text-[#4a4f4a] font-light max-w-xs self-center">
            Görgetéskor a szám 0-ról felfelé számol, felhívva a figyelmet az egységes árra.
          </p>
        </div>
      </Section>

      {/* 3 — Spotlight */}
      <Section dark>
        <Label text="3 · Spotlight" placement="'A mi különlegességünk' szekció háttere" />
        <div className="relative rounded-xl overflow-hidden bg-[#4a4f4a] p-10 min-h-[200px] flex items-center">
          <SpotlightEffect key={spotlightKey} fill="#6e7f6a" className="opacity-60" />
          <div className="relative z-10 grid grid-cols-2 gap-4 w-full">
            {["Csak Nordmann fenyő", "Egységes ár", "Nyugodt hangulat", "Sorszámozva"].map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <p className="text-xs font-bold text-[#6e7f6a] tracking-widest mb-0.5">{String(i+1).padStart(2,'0')}</p>
                <p className="text-sm font-semibold text-white">{t}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <p className="text-white/40 text-xs font-light">A zöldes fényfolt animálva jelenik meg a szekció betöltésekor.</p>
          <button onClick={() => setSpotlightKey(k => k + 1)}
            className="text-xs font-semibold text-[#6e7f6a] border border-[#6e7f6a]/40 rounded-lg px-4 py-2 hover:bg-[#6e7f6a]/10 transition-colors whitespace-nowrap">
            ↺ Újrajátszás
          </button>
        </div>
      </Section>

      {/* 4 — 3D Marquee */}
      <Section dark>
        <Label text="4 · 3D Marquee" placement="A jelenlegi lapos marquee csík helyett" />
        <div className="bg-[#4a4f4a] rounded-xl overflow-hidden">
          <Marquee3D
            items={["Nordmann", "Zalaegerszeg", "8 000 Ft", "Csak Nordmann fenyő", "Időpontfoglalás", "Frissen vágva"]}
            speed={18}
          />
        </div>
        <p className="text-white/40 text-xs font-light mt-3">3D perspektíva-torzítással — mélyebb vizuális hatás mint a sík csík.</p>
      </Section>

      {/* 5 — Animated List */}
      <Section>
        <Label text="5 · Animated List" placement="GYIK kérdések · 'Hogyan működik?' lépések" />
        <div className="max-w-md">
          <AnimatedList
            key={listKey}
            staggerDelay={0.1}
            itemClassName="border-b border-[#bfc3c7] py-4 last:border-b-0"
            items={faqItems.map((q, i) => (
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full border border-[#bfc3c7] bg-[#ededed] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#6e7f6a]">{String(i+1).padStart(2,'0')}</span>
                </div>
                <p className="font-semibold text-[#3a3a3a] text-sm">{q}</p>
              </div>
            ))}
          />
        </div>
        <button onClick={() => setListKey(k => k + 1)}
          className="mt-4 text-xs font-semibold text-[#6e7f6a] border border-[#6e7f6a]/40 rounded-lg px-4 py-2 hover:bg-[#6e7f6a]/10 transition-colors">
          ↺ Újrajátszás
        </button>
      </Section>

      {/* 6 — InView trigger */}
      <Section>
        <Label text="6 · In-View Trigger" placement="Minden szekció kártya és szövegblokk megjelenésekor" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["01 · Nordmann", "02 · Egységes ár", "03 · Frissen vágva"].map((t, i) => (
            <InView key={i} transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22,1,0.36,1] }}>
              <div className="bg-white border border-[#bfc3c7] rounded-xl p-6 text-center">
                <p className="text-sm font-semibold text-[#3a3a3a]">{t}</p>
                <p className="text-xs text-[#4a4f4a] font-light mt-1">Görgetéskor jelenik meg</p>
              </div>
            </InView>
          ))}
        </div>
      </Section>

      {/* Footer note */}
      <div className="bg-[#3a3a3a] px-6 sm:px-12 lg:px-20 py-10 text-center">
        <p className="text-white/50 text-sm font-light">
          Minden komponens készen áll az integrációra. Melyiket szeretnéd élesbe tenni?
        </p>
      </div>
    </div>
  )
}

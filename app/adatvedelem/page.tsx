import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Adatvédelmi tájékoztató – Zalaegerszegi Nordmann Fenyők",
  description: "Adatvédelmi tájékoztató — hogyan kezeljük személyes adatait (GDPR).",
}

export default function AdatvedelemPage() {
  return (
    <div className="bg-[#ededed] min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#6e7f6a] mb-3">GDPR tájékoztató</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3a3a3a] tracking-tight mb-2">
          Adatvédelmi tájékoztató
        </h1>
        <p className="text-sm text-[#4a4f4a]/60 mb-10">
          Utolsó frissítés: 2026. október 1. &nbsp;·&nbsp; EU 2016/679 (GDPR) alapján
        </p>

        <div className="space-y-8 text-[#4a4f4a]">

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">1. Adatkezelő</h2>
            <p className="text-sm leading-relaxed font-light">
              Zalaegerszegi Nordmann Fenyők (magánszemély, nem gazdasági társaság).
              Kapcsolat: <strong>+36 (30) 123 4567</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">2. Kezelt adatok és céljaik</h2>
            <p className="text-sm leading-relaxed font-light mb-3">
              Az időpontfoglalás során az alábbi adatokat rögzítjük:
            </p>
            <div className="bg-white border border-[#bfc3c7] rounded-xl overflow-hidden">
              {[
                ["Név", "A foglalás azonosítása, kapcsolattartás"],
                ["Telefonszám", "Kapcsolattartás, egyeztetés"],
                ["E-mail-cím", "Foglalás visszaigazolása"],
                ["Látogatás dátuma", "Időpont-kezelés"],
                ["Fenyők száma", "Felkészülés a látogatáshoz"],
              ].map(([adat, cel], i) => (
                <div key={adat} className={`flex gap-4 px-5 py-3 text-sm ${i !== 0 ? "border-t border-[#bfc3c7]" : ""}`}>
                  <span className="font-medium text-[#3a3a3a] w-36 flex-shrink-0">{adat}</span>
                  <span className="font-light">{cel}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">3. Jogalap</h2>
            <p className="text-sm leading-relaxed font-light">
              Az adatkezelés jogalapja a GDPR 6. cikk (1) b) pontja: az adatkezelés olyan szerződés
              teljesítéséhez szükséges, amelynek az érintett az egyik fele (foglalás létrehozása és kezelése).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">4. Megőrzési idő</h2>
            <p className="text-sm leading-relaxed font-light">
              A foglalási adatokat a szezon lezárultát követően töröljük, legkésőbb az adott naptári év végéig.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">5. Sütik (cookies)</h2>
            <p className="text-sm leading-relaxed font-light mb-4">Az oldal két típusú sütit használ:</p>
            <div className="space-y-3">
              <div className="bg-white border border-[#bfc3c7] rounded-xl px-5 py-4">
                <p className="text-sm font-semibold text-[#3a3a3a] mb-1">Szükséges sütik</p>
                <p className="text-sm font-light leading-relaxed">
                  A foglalási folyamat működéséhez elengedhetetlen munkamenet-adatok. Ezek beleegyezés nélkül
                  is aktívak, mivel az oldal alapvető működéséhez szükségesek.
                </p>
              </div>
              <div className="bg-white border border-[#bfc3c7] rounded-xl px-5 py-4">
                <p className="text-sm font-semibold text-[#3a3a3a] mb-1">Analitikai sütik — Vercel Analytics</p>
                <p className="text-sm font-light leading-relaxed">
                  Névtelen látogatásszámlálás, amellyel mérjük, hány látogató keresi fel az oldalt.
                  Személyes adat nem kerül rögzítésre. Ezek a sütik csak beleegyezésed esetén aktívak —
                  a cookie banneren tudsz dönteni, illetve a footer „Süti-beállítások" linkjén módosíthatod.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">6. Adattovábbítás</h2>
            <p className="text-sm leading-relaxed font-light">
              Személyes adataidat harmadik félnek nem adjuk át, kivéve ha törvény kötelez rá. Az oldalt
              üzemeltető Vercel Inc. tárhelyszolgáltató az adatokat az EU adatvédelmi előírásainak megfelelően kezeli.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">7. Jogaid</h2>
            <p className="text-sm leading-relaxed font-light mb-3">A GDPR alapján az alábbi jogok illetnek meg:</p>
            <ul className="space-y-1.5 text-sm font-light">
              {[
                "Hozzáférés — kérheted az adataidról szóló tájékoztatást",
                "Helyesbítés — kérheted pontatlan adataid javítását",
                "Törlés — kérheted adataid törlését (\"elfeledtetéshez való jog\")",
                "Korlátozás — kérheted az adatkezelés korlátozását",
                "Hordozhatóság — kérheted adataidat géppel olvasható formában",
                "Tiltakozás — tiltakozhatsz az adatkezelés ellen",
              ].map((item) => (
                <li key={item} className="flex gap-2 items-baseline">
                  <span className="text-[#6e7f6a] flex-shrink-0">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-relaxed font-light mt-3">
              Jogaid gyakorlásához írj vagy hívj: <strong>+36 (30) 123 4567</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">8. Felügyeleti hatóság</h2>
            <p className="text-sm leading-relaxed font-light">
              Ha úgy érzed, hogy adataidat jogellenesen kezeljük, panaszt tehetsz a Nemzeti Adatvédelmi
              és Információszabadság Hatóságnál (NAIH):{" "}
              <a
                href="https://naih.hu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6e7f6a] underline underline-offset-2"
              >
                naih.hu
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

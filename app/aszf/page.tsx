import type { Metadata } from "next"
import { phoneNumber } from "@/lib/site"

export const metadata: Metadata = {
  title: "ASZF – Zalaegerszegi Nordmann Fenyők",
  description: "Általános Szerződési Feltételek — időpontfoglalás és fenyővásárlás feltételei.",
}

export default function ASZFPage() {
  return (
    <div className="bg-[#ededed] min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#6e7f6a] mb-3">Jogi dokumentum</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3a3a3a] tracking-tight mb-2">
          Általános Szerződési Feltételek
        </h1>
        <p className="text-sm text-[#4a4f4a]/60 mb-10">Utolsó frissítés: 2026. augusztus 30.</p>

        <div className="bg-[#6e7f6a]/10 border border-[#6e7f6a]/20 rounded-xl px-6 py-5 mb-10">
          <p className="text-sm text-[#4a4f4a] leading-relaxed">
            <strong className="text-[#3a3a3a]">Röviden:</strong> Online időpontot foglalsz egy fenyő megtekintésére és
            kiválasztására. A foglalás nem jelent kötelező vásárlást, a fa ára a helyszínen, az átvételkor fizetendő.
          </p>
        </div>

        <div className="space-y-8 text-[#4a4f4a]">

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">1. A szolgáltatásról</h2>
            <p className="text-sm leading-relaxed font-light">
              A Zalaegerszegi Nordmann Fenyők (továbbiakban: szolgáltató) online időpontfoglaló rendszert üzemeltet,
              amelyen keresztül vásárlók látogatási időpontot foglalhatnak a zalaegerszegi fenyőtelep megtekintésére.
              A szolgáltatás magánszemélyként, nem gazdasági társaságként nyújtott, szezonális tevékenység.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">2. A foglalás menete</h2>
            <p className="text-sm leading-relaxed font-light">
              Az online foglalás a kívánt látogatási nap kiválasztásával, a szükséges adatok (név, telefonszám,
              e-mail-cím, fenyők várható darabszáma) megadásával és az ASZF elfogadásával válik érvényessé.
              A foglalásról e-mailben küldünk visszaigazolást. A foglalás 10:00 és 12:00 közötti érkezést jelent,
              nem percre pontos időpontot.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">3. Árak és fizetés</h2>
            <p className="text-sm leading-relaxed font-light">
              Az aktuális egységár az oldalon feltüntetett ár, mérettől függetlenül érvényes minden fenyőre.
              A vételár megfizetése a helyszínen, az átvételkor történik. Elfogadott fizetési módok:
              készpénz és bankkártyás fizetés.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">4. Lemondás, módosítás</h2>
            <p className="text-sm leading-relaxed font-light">
              A foglalás telefonon bármikor módosítható vagy lemondható. Ha a foglalt napon nem jelensz meg és
              nem értesítesz előre, a sorszámot és a fát felszabadítjuk. Lemondásért nem számítunk fel díjat.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">5. A fa megjelölése és átadása</h2>
            <p className="text-sm leading-relaxed font-light">
              A helyszínen kiválasztott fát sorszámmal jelöljük meg. A sorszámmal ellátott fa csak a te
              foglalásodhoz rendelt, más nem viheti el. A fa kivágása és átadása a szezon vége felé,
              karácsony előtt néhány héttel történik; az időpontot a foglalásban rögzített kapcsolaton
              egyeztetjük.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">6. Adatkezelés</h2>
            <p className="text-sm leading-relaxed font-light">
              A foglalás során megadott személyes adatokat kizárólag a foglalás kezeléséhez használjuk.
              Részletes tájékoztató:{" "}
              <a href="/adatvedelem" className="text-[#6e7f6a] underline underline-offset-2">
                Adatvédelmi tájékoztató
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">7. Jogviták</h2>
            <p className="text-sm leading-relaxed font-light">
              A felek között felmerülő vitákat elsősorban egyeztetéssel rendezzük. Amennyiben ez nem vezet
              eredményre, a Zalaegerszegi Járásbíróság kizárólagos illetékességét kötik ki.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-[#3a3a3a] mb-2">8. Kapcsolat</h2>
            <p className="text-sm leading-relaxed font-light">
              Kérdés esetén hívj minket: <strong>{phoneNumber}</strong>, szombat–vasárnap 10:00–12:00 között.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

import { Phone, MapPin, Facebook } from "lucide-react"
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll"
import { phoneNumber } from "@/lib/site"

export default function ContactPage() {
  return (
    <div className="w-full">

      {/* Hero + Contact Info */}
      <section className="min-h-[calc(100vh-4rem)] flex items-center bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <AnimateOnScroll>
            <div className="section-label justify-center">Kapcsolat</div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight text-center">Elérhetőség</h1>
            <p className="text-lg text-primary font-light max-w-xl mb-12 text-center mx-auto">
              Telefonon elérhetők vagyunk. GPS-koordinátákkal megtalálsz.
            </p>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <AnimateOnScroll delay={0} className="h-full">
              <div className="border border-border bg-surface rounded-lg p-8 h-full">
                <Phone className="h-6 w-6 text-secondary mb-4" />
                <h3 className="font-semibold text-foreground mb-2 tracking-tight">Telefonszám</h3>
                <p className="text-2xl font-bold text-foreground mb-2 tracking-tight">{phoneNumber}</p>
                <p className="text-sm text-primary font-light">A megadott napokon 10:00-12:00 magasságában</p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={100} className="h-full">
              <div className="border border-border bg-surface rounded-lg p-8 h-full">
                <MapPin className="h-6 w-6 text-secondary mb-4" />
                <h3 className="font-semibold text-foreground mb-2 tracking-tight">A helyszínen</h3>
                <p className="text-primary font-light mb-2">
                  A foglalási napokon 10–12 között mindig ott vagyunk a fenyvesben.
                </p>
                <p className="text-sm text-primary font-light">Egyéb időpontban előre egyeztess.</p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={200} className="h-full">
              <div className="border border-border bg-surface rounded-lg p-8 h-full">
                <Facebook className="h-6 w-6 text-secondary mb-4" />
                <h3 className="font-semibold text-foreground mb-2 tracking-tight">Facebook</h3>
                <p className="text-primary font-light">Képek és hírek az idei szezonról.</p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="min-h-screen flex items-center bg-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <AnimateOnScroll>
            <div className="section-label justify-center">Megközelítés</div>
            <h2 className="text-3xl font-bold text-foreground mb-8 tracking-tight text-center">A helyszín</h2>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <AnimateOnScroll>
              <div className="rounded-lg overflow-hidden h-96 bg-secondary/20">
                <iframe
                  title="Zalaegerszeg térkép"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src="https://maps.google.com/maps?q=46.8981178,16.793078&z=15&output=embed"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll delay={150}>
              <p className="text-primary font-light mb-6">
                Nincs utcacím, nincs házszám. Egy kis erdő Zalaegerszeg határán. GPS-koordinátákkal érkezhetsz — ezt
                a foglalás visszaigazolásában küldjük el.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Zalaegerszeg északi részéről közelítsd meg, a 74-es főút irányából.",
                  "Egy rövid földúton kell behajtani — normál autóval simán járható.",
                  "Parkolás ingyen, közvetlenül a fenyvesnél. Pár autónak van hely.",
                  "Ha elvéted az utat, hívj — megtalálunk.",
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-secondary font-bold text-sm tabular-nums flex-shrink-0 mt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-primary font-light">{item}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=46.8981178,16.793078"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 h-12 px-7 text-base font-semibold rounded-lg bg-primary text-background hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(74,79,74,0.25)] active:translate-y-0 active:shadow-none transition-all duration-200"
                >
                  <MapPin className="h-4 w-4" />
                  Útvonal ide
                </a>
                <a
                  href="https://www.facebook.com/karacsonyfak"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer inline-flex items-center justify-center h-12 px-7 text-base font-normal rounded-lg border border-primary/30 text-primary/70 hover:text-primary hover:border-primary/60 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  Kövess Facebookon
                </a>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

    </div>
  )
}

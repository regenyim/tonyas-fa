"use client"

import { useState } from "react"
import { Plus, Minus, CreditCard, CircleHelp, TreePine, CloudRain, Truck } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const faqs: { question: string; answer: string; icon: LucideIcon }[] = [
  {
    question: "Lehet bankkártyával fizetni?",
    answer: "Igen. Készpénz és bankkártya is elfogadott a helyszínen.",
    icon: CreditCard,
  },
  {
    question: "Mi van, ha nem tudok eljönni a foglalt napon?",
    answer: "Hívj fel telefonon, és megbeszélünk egy másik napot. Nem ragaszkodunk a dátumhoz.",
    icon: CircleHelp,
  },
  {
    question: "Több fát is vihetek egy foglalással?",
    answer: "Igen. Jelezd a várható darabszámot a foglalási űrlapon, hogy felkészülhessünk.",
    icon: TreePine,
  },
  {
    question: "Mi van, ha rossz idő van?",
    answer: "Esőben és szélben is nyitva vagyunk. Ha tényleg szélsőséges az időjárás, telefonon egyeztetünk.",
    icon: CloudRain,
  },
  {
    question: "Van házhozszállítás?",
    answer: "Külön egyeztetéssel, plusz díjért Zalaegerszegen és közvetlen környékén igen. Érdeklődj telefonon.",
    icon: Truck,
  },
]

function FAQItem({ question, answer, icon: Icon }: { question: string; answer: string; icon: LucideIcon }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-border last:border-b-0 group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center gap-4 text-left cursor-pointer"
      >
        {/* Icon container */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center transition-colors duration-200 group-hover:bg-secondary group-hover:border-secondary">
          <Icon className="h-4 w-4 text-secondary transition-colors duration-200 group-hover:text-white" strokeWidth={1.5} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground tracking-tight text-base group-hover:text-foreground/70 transition-colors">
            {question}
          </h3>
        </div>

        {/* Toggle */}
        <div className="flex-shrink-0 text-secondary">
          {isOpen ? <Minus className="h-4 w-4" strokeWidth={1.5} /> : <Plus className="h-4 w-4" strokeWidth={1.5} />}
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="pb-5 pl-14 text-base text-primary font-light leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-12">
        <div className="grid lg:grid-cols-2 lg:gap-16 lg:items-start">

          {/* Left */}
          <div className="text-center mb-10 lg:mb-0 lg:sticky lg:top-24 lg:pt-20">
            <div className="section-label justify-center mb-3">Kérdések</div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight leading-tight">
              GYAKRAN ISMÉTELT KÉRDÉSEK
            </h1>
            <p className="text-primary font-light max-w-xs mx-auto">
              A leggyakoribb kérdések, amiket kapunk.
            </p>
          </div>

          {/* Right */}
          <div>
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} icon={faq.icon} />
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

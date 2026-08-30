import { CalendarDays, Home, Settings2, Wallet } from "lucide-react"
import { ReservationStatus } from "@/lib/types"

export const facebookUrl = "https://www.facebook.com/karacsonyfak"
export const phoneNumber = "+36 (20) 345 5136"
export const mapsEmbedUrl = "https://www.google.com/maps?q=46.898189,16.793188&z=18&output=embed"
export const mapsUrl = "https://www.google.com/maps/place/46%C2%B053'53.5%22N+16%C2%B047'35.5%22E/@46.8981903,16.7922776,18z/data=!3m1!4b1!4m4!3m3!8m2!3d46.898189!4d16.793188?entry=ttu&g_ep=EgoyMDI2MDMyOS4wIKXMDSoASAFQAw%3D%3D"

export const publicNavigation = [
  { label: "Kezdőlap", href: "/" },
  { label: "Hogyan működik?", href: "/how-it-works" },
  { label: "Fenyőink", href: "/trees" },
  { label: "Időpontfoglalás", href: "/booking" },
  { label: "GYIK", href: "/faq" },
  { label: "Elérhetőség", href: "/contact" },
]

export const adminNavigation = [
  { label: "Áttekintés", href: "/admin", icon: Home },
  { label: "Foglalások", href: "/admin/reservations", icon: CalendarDays },
  { label: "Kiadások", href: "/admin/expenses", icon: Wallet },
  { label: "Beállítások", href: "/admin/settings", icon: Settings2 },
]

export const reservationStatusMeta: Record<
  ReservationStatus,
  { label: string; className: string; pillClassName: string }
> = {
  [ReservationStatus.BOOKED]: {
    label: "Beérkezett",
    className: "bg-[color:var(--sky-soft)] text-[color:var(--sky-strong)]",
    pillClassName:
      "border-[color:var(--sky-border)] bg-[color:var(--sky-soft)] text-[color:var(--sky-strong)]",
  },
  [ReservationStatus.TREE_TAGGED]: {
    label: "Fa megjelölve",
    className: "bg-[color:var(--champagne-soft)] text-[color:var(--champagne-strong)]",
    pillClassName:
      "border-[color:var(--champagne-border)] bg-[color:var(--champagne-soft)] text-[color:var(--champagne-strong)]",
  },
  [ReservationStatus.CUT]: {
    label: "Kivágva",
    className: "bg-[color:var(--peach-soft)] text-[color:var(--peach-strong)]",
    pillClassName:
      "border-[color:var(--peach-border)] bg-[color:var(--peach-soft)] text-[color:var(--peach-strong)]",
  },
  [ReservationStatus.PICKED_UP]: {
    label: "Átvéve",
    className: "bg-[color:var(--mint-soft)] text-[color:var(--mint-strong)]",
    pillClassName:
      "border-[color:var(--mint-border)] bg-[color:var(--mint-soft)] text-[color:var(--mint-strong)]",
  },
  [ReservationStatus.FREE]: {
    label: "Ingyenes",
    className: "bg-[color:var(--slate-soft)] text-[color:var(--slate-strong)]",
    pillClassName:
      "border-[color:var(--slate-border)] bg-[color:var(--slate-soft)] text-[color:var(--slate-strong)]",
  },
  [ReservationStatus.NO_SHOW]: {
    label: "Nem érkezett meg",
    className: "bg-[color:var(--rose-soft)] text-[color:var(--rose-strong)]",
    pillClassName:
      "border-[color:var(--rose-border)] bg-[color:var(--rose-soft)] text-[color:var(--rose-strong)]",
  },
}

export function formatDateHu(dateStr?: string) {
  if (!dateStr) return "Nincs megadva"
  const [y, m, d] = dateStr.split("-")
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatDateWithWeekdayHu(dateStr?: string) {
  if (!dateStr) return "Nincs megadva"
  const [y, m, d] = dateStr.split("-")
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("hu-HU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export const faqItems = [
  {
    question: "Percre pontos időpontot foglalok?",
    answer:
      "Nem. Egy napot foglalsz, és aznap 10:00 és 12:00 között érkezel, amikor kényelmes. Így nyugodtan lehet nézelődni és beszélgetni is.",
  },
  {
    question: "Mennyibe kerül egy fa?",
    answer:
      "Minden nordmann fenyő egységesen 8000 Ft, mérettől függetlenül. Nincs külön méretár vagy meglepetés a helyszínen.",
  },
  {
    question: "Lehet bankkártyával fizetni?",
    answer: "Igen. A helyszínen készpénzzel és bankkártyával is lehet fizetni.",
  },
  {
    question: "Több fát is választhatunk egy foglalással?",
    answer:
      "Igen, ez teljesen rendben van. A foglalásnál jelezd a várható darabszámot, és ennek megfelelően készülünk.",
  },
  {
    question: "Mi történik a kiválasztott fával?",
    answer:
      "A helyszínen sorszámos címkével megjelöljük, így biztosan a kiválasztott fát kapod meg később is.",
  },
  {
    question: "Mi van, ha mégsem tudok jönni?",
    answer:
      "Telefonon szólj nekünk, és egyeztetünk. Családi vállalkozásként rugalmasan próbálunk segíteni minden helyzetben.",
  },
]

export const publicHighlights = [
  "Csak nordmann fenyő",
  "Egységes ár: 8000 Ft / fa",
  "Előre kiválasztott, sorszámozott fa",
  "Nyugodt, családias hétvégi látogatás",
]

export const howItWorksSteps = [
  {
    title: "Napfoglalás online",
    description:
      "Egy szombati vagy vasárnapi napot választasz. Nem percre pontos időpontot, hanem kényelmes érkezési sávot foglalsz.",
  },
  {
    title: "Érkezés 10 és 12 óra között",
    description:
      "Aznap 10:00 és 12:00 között jössz ki a fenyvesbe, amikor neked kényelmes. Nem kell sietni vagy kapkodni.",
  },
  {
    title: "Fa kiválasztása a helyszínen",
    description:
      "Körbejártok a fák között, megnézitek a formát, magasságot és hangulatot, és kiválasztjátok a megfelelőt.",
  },
  {
    title: "Sorszámos megjelölés",
    description:
      "A kiválasztott fa kap egy sorszámos címkét, amit rögzítünk a foglaláshoz. Így később is ugyanaz a fa vár vissza.",
  },
  {
    title: "Későbbi átvétel frissen kivágva",
    description:
      "A karácsony előtti hétvégén kivágjuk a jelölt fát, te pedig átveszed. Fizetni készpénzzel vagy bankkártyával lehet.",
  },
]

export const treeSizeExamples = [
  { label: "Otthonos méret", height: "1,4 - 1,8 m", note: "lakásokba és kisebb nappalikba" },
  { label: "Klasszikus családi fa", height: "1,8 - 2,2 m", note: "a leggyakoribb választás" },
  { label: "Magasabb, látványos fa", height: "2,2 - 2,6 m", note: "tágasabb terekhez" },
]

export const designDirection = [
  "Editorial jellegű, nagyvonalú tördelés sok levegővel és nyugodt ritmussal.",
  "Mély erdőzöld és meleg krém tónusok dominálnak, visszafogott champagne kiemelésekkel.",
  "Nagy, hangulatos erdei és fenyves fotók adják az első benyomást, nem generikus illusztrációk.",
  "A tipográfia elegáns, de jól olvasható: karakteres címsorok és kényelmesen fogyasztható törzsszöveg.",
  "A főoldal nem startup landing page, inkább prémium családi vállalkozás-portré érzést kelt.",
  "A bizalmi információk külön blokkokban, gyorsan szkennelhető formában jelennek meg.",
  "A foglalási folyamat minden pontján hangsúlyos, hogy napot foglal a látogató, nem percet.",
  "A gombok, mezők és kattintható elemek nagyobbak, kényelmesebbek, főleg a 40+ célközönség miatt.",
  "A kártyák és felületek enyhén lekerekítettek, finom árnyékkal, visszafogottan luxus hatással.",
  "Az információs hierarchia egyszerű: kevés zaj, kevés döntési pont, kevés vizuális terhelés.",
  "A Facebook és a megközelítés természetes, hiteles bizalmi elemként jelenik meg.",
  "Az admin ugyanebből a rendszerből épül, de sűrítettebb, funkcionálisabb és mobilra optimalizált.",
]

export const designSystemSummary = {
  colors: ["erdőzöld", "mohazöld", "elefántcsont", "grafitszürke", "champagne"],
  type: ["Cormorant Garamond a címsorokhoz", "Manrope a felülethez és űrlapokhoz"],
  spacing: ["nagy vertikális szakaszközök", "tágas kártyabelsők", "48 px körüli kényelmes inputmagasság"],
  buttons: ["tömör elsődleges gomb", "visszafogott keretes másodlagos gomb", "nagy mobil tappolási felület"],
  inputs: ["meleg háttér", "erős fókuszgyűrű", "egyértelmű címke és segédszöveg"],
  cards: ["puha sarkok", "vékony határvonal", "enyhe mélység", "editorial belső arányok"],
  badges: ["visszafogott színes státuszok", "olvasásra optimalizált kontraszt"],
  layout: ["keskenyebb olvasósáv szöveghez", "szélesebb fotósáv képi blokkokhoz", "mobile-first szekcióritmus"],
  adminPatterns: ["alsó mobil navigáció", "kártyás listák", "sticky alsó mentési sáv", "pill alapú gyors státuszváltás"],
}

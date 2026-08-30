"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Camera, CheckCircle2, Image as ImageIcon, Plus, Save, Trash2, Upload, X } from "lucide-react"
import { type Reservation, ReservationStatus } from "@/lib/types"
import { formatDateHu, reservationStatusMeta } from "@/lib/site"
import AdminDatePicker from "@/components/admin-date-picker"
import { useUnsavedChanges } from "@/contexts/unsaved-changes-context"

interface Props {
  reservation: Reservation
  currentAdminPaidTo: "Sanyi" | "János" | null
  justCreated?: boolean
}

const inputClass = "w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-sm transition-all duration-150"
const disabledInputClass = "w-full px-4 py-3 rounded-lg border border-border bg-muted text-primary/60 placeholder:text-primary/40 text-sm cursor-not-allowed"
const labelClass = "block text-xs font-bold text-foreground tracking-widest uppercase mb-2"
const normalizePaidTo = (value: string | undefined) => {
  const trimmed = (value || "").trim()
  return trimmed === "János" || trimmed === "Sanyi" ? trimmed : ""
}

export default function ReservationDetailClient({ reservation: initialReservation, currentAdminPaidTo, justCreated }: Props) {
  const router = useRouter()
  const { setDirty, navigate } = useUnsavedChanges()
  const [formData, setFormData] = useState({
    name: initialReservation.name,
    phone: initialReservation.phone,
    email: initialReservation.email || "",
    visitDate: initialReservation.visitDate,
    pickupDate: initialReservation.pickupDate || "",
    treeCount: initialReservation.treeCount,
    status: initialReservation.status,
    treeNumbers: initialReservation.treeNumbers || "",
    notes: initialReservation.notes || "",
    paidTo: normalizePaidTo(initialReservation.paidTo),
    photos: initialReservation.photos || [],
  })
  const initialSnapshot = {
    name: initialReservation.name,
    phone: initialReservation.phone,
    email: initialReservation.email || "",
    visitDate: initialReservation.visitDate,
    pickupDate: initialReservation.pickupDate || "",
    treeCount: initialReservation.treeCount,
    status: initialReservation.status,
    treeNumbers: initialReservation.treeNumbers || "",
    notes: initialReservation.notes || "",
    paidTo: normalizePaidTo(initialReservation.paidTo),
    photos: initialReservation.photos || [],
  }

  useEffect(() => {
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialSnapshot)
    setDirty(isDirty)
  }, [formData])
  useEffect(() => () => setDirty(false), [setDirty])

  type FormSnapshot = typeof formData
  type ChangedField = { label: string; oldVal: string; newVal: string }

  const FIELD_LABELS: Record<keyof FormSnapshot, string> = {
    name: "Név", phone: "Telefonszám", email: "E-mail", visitDate: "Látogatás napja",
    pickupDate: "Átvételi nap", treeCount: "Darabszám", status: "Státusz",
    treeNumbers: "Fa sorszáma", notes: "Megjegyzés", paidTo: "Kinek fizet", photos: "Fotók",
  }

  const formatFieldValue = (key: keyof FormSnapshot, val: unknown): string => {
    if (val === "" || val === null || val === undefined) return "—"
    if (key === "photos") {
      const count = Array.isArray(val) ? val.length : 0
      return `${count} db kép`
    }
    if (key === "status") return reservationStatusMeta[val as ReservationStatus]?.label ?? String(val)
    if (key === "visitDate" || key === "pickupDate") return formatDateHu(String(val))
    return String(val)
  }

  const computeDiff = (prev: FormSnapshot, next: FormSnapshot): ChangedField[] =>
    (Object.keys(FIELD_LABELS) as (keyof FormSnapshot)[])
      .filter((k) => String(prev[k]) !== String(next[k]))
      .map((k) => ({ label: FIELD_LABELS[k], oldVal: formatFieldValue(k, prev[k]), newVal: formatFieldValue(k, next[k]) }))

  const prevSnapshotRef = useRef<FormSnapshot>(formData)
  const alertRef = useRef<HTMLDivElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [savedChanges, setSavedChanges] = useState<ChangedField[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [retrievalDays, setRetrievalDays] = useState<string[]>([])
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [photoUploading, setPhotoUploading] = useState(false)
  const [visiblePhotoIds, setVisiblePhotoIds] = useState<number[]>([])
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (error || success) {
      setTimeout(() => alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50)
    }
  }, [error, success])
  useEffect(() => {
    const isClientValidationError =
      error.toLowerCase().includes("hibás mezőket")
    if (Object.keys(validationErrors).length === 0 && isClientValidationError) {
      setError("")
    }
  }, [validationErrors, error])

  useEffect(() => {
    // Load the settings for this reservation's own year, not the admin's current view year —
    // editing a 2025 reservation should still see 2025's available_days.
    fetch(`/api/admin/settings?year=${initialReservation.year}`).then((response) => response.json()).then((data) => {
      if (data.settings?.retrievalDays) setRetrievalDays(data.settings.retrievalDays.sort())
      if (data.settings?.availableDays) setAvailableDays(data.settings.availableDays.sort())
    }).catch(() => {})
  }, [initialReservation.year])

  const requiresTreeNumber = (status: ReservationStatus) =>
    status === ReservationStatus.TREE_TAGGED ||
    status === ReservationStatus.CUT ||
    status === ReservationStatus.PICKED_UP ||
    status === ReservationStatus.FREE

  const allowsTreeNumbers = (status: ReservationStatus) =>
    status !== ReservationStatus.BOOKED

  const allowsPaidTo = (status: ReservationStatus) =>
    status === ReservationStatus.CUT ||
    status === ReservationStatus.PICKED_UP

  // Parse tree numbers from comma-separated string, filtering invalid entries
  const parseTreeNumbers = (input: string): { numbers: number[]; invalidEntries: string[] } => {
    const parts = input.split(",").map((s) => s.trim()).filter(Boolean)
    const numbers: number[] = []
    const invalidEntries: string[] = []
    for (const part of parts) {
      const num = Number.parseInt(part, 10)
      if (Number.isNaN(num) || num < 0) {
        invalidEntries.push(part)
      } else {
        numbers.push(num)
      }
    }
    return { numbers, invalidEntries }
  }

  const validate = (data: typeof formData): Record<string, string> => {
    const errors: Record<string, string> = {}

    // Tree numbers validation
    if (!allowsTreeNumbers(data.status) && data.treeNumbers.trim()) {
      errors.treeNumbers =
        "Ennél a státusznál nem lehet fa sorszám. Töröld a sorszámot, vagy válassz másik státuszt."
    } else if (requiresTreeNumber(data.status) && !data.treeNumbers.trim()) {
      errors.treeNumbers = "A fa sorszáma kötelező ennél a státusznál."
    } else if (data.treeNumbers.trim()) {
      const { numbers, invalidEntries } = parseTreeNumbers(data.treeNumbers)
      if (invalidEntries.length > 0) {
        errors.treeNumbers = `Érvénytelen sorszám(ok): ${invalidEntries.join(", ")}. Csak 0 vagy pozitív egész számok adhatók meg.`
      } else {
        // Check for duplicates within the input
        const seen = new Set<number>()
        const duplicates: number[] = []
        for (const num of numbers) {
          if (seen.has(num)) {
            if (!duplicates.includes(num)) duplicates.push(num)
          } else {
            seen.add(num)
          }
        }
        if (duplicates.length > 0) {
          errors.treeNumbers = `Duplikált sorszám(ok): ${duplicates.join(", ")}. Minden sorszám csak egyszer szerepelhet.`
        }
      }
    }

    if (!allowsPaidTo(data.status) && normalizePaidTo(data.paidTo) !== "") {
      errors.paidTo =
        "Ennél a státusznál nem rögzíthető fizetés. Töröld a fizetést, vagy válassz másik státuszt."
    }
    return errors
  }

  const handleStatusChange = (newStatus: ReservationStatus) => {
    // Auto-fill paidTo on transition INTO PICKED_UP (the pickup moment, where
    // payment most commonly happens). Only triggers when paidTo is empty —
    // never overwrites an existing value. Earlier transitions (TREE_TAGGED,
    // CUT) intentionally don't auto-fill, since those are tree-workflow
    // events, not payment events.
    const shouldAutoFillPaidTo =
      currentAdminPaidTo !== null &&
      !formData.paidTo &&
      formData.status !== ReservationStatus.PICKED_UP &&
      newStatus === ReservationStatus.PICKED_UP

    const updated = {
      ...formData,
      status: newStatus,
      paidTo: shouldAutoFillPaidTo ? currentAdminPaidTo : formData.paidTo,
    }
    setFormData(updated)
    setValidationErrors(validate(updated))
  }

  const uploadPhoto = async (file: File) => {
    setPhotoUploading(true)
    setError("")
    try {
      const body = new FormData()
      body.set("photo", file)
      const response = await fetch("/api/admin/uploads/reservation-photo", { method: "POST", body })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.error || "A fotó feltöltése nem sikerült.")
        return
      }
      const attachResponse = await fetch(`/api/admin/reservations/${initialReservation.id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: data.photoUrl,
          photoPublicId: data.photoPublicId,
        }),
      })
      const attachData = await attachResponse.json()
      if (!attachResponse.ok || !attachData.success) {
        setError(attachData.error || "A fotó hozzárendelése nem sikerült.")
        return
      }
      const updated = {
        ...formData,
        photos: attachData.reservation?.photos ?? formData.photos,
      }
      setFormData(updated)
      setValidationErrors(validate(updated))
      setVisiblePhotoIds([])
    } catch {
      setError("Hálózati hiba történt a fotó feltöltésekor.")
    } finally {
      setPhotoUploading(false)
    }
  }

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await uploadPhoto(file)
    event.target.value = ""
  }

  const handleSave = async () => {
    const errors = validate(formData)
    setValidationErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError("Kérlek javítsd a hibás mezőket a mentés előtt.")
      return
    }
    if (photoUploading) {
      setError("Várd meg, amíg befejeződik a fotó feltöltése.")
      return
    }
    setIsSaving(true)
    setError("")
    setSuccess("")
    setSavedChanges([])
    const diff = computeDiff(prevSnapshotRef.current, formData)
    try {
      const response = await fetch(`/api/admin/reservations/${initialReservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        setDirty(false)
        prevSnapshotRef.current = { ...formData }
        setSuccess("A foglalás mentése sikerült.")
        setSavedChanges(diff)
      } else {
        setError(data.error || (Array.isArray(data.errors) ? data.errors.join(", ") : "") || "Hiba történt a mentés közben.")
      }
    } catch {
      setError("Hálózati hiba történt.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/reservations/${initialReservation.id}`, { method: "DELETE" })
      const data = await response.json()
      if (data.success) {
        router.push("/admin/reservations")
      } else {
        setError(data.error || "A törlés nem sikerült.")
      }
    } catch {
      setError("Hálózati hiba történt.")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-8 pb-10">

      {/* Back link */}
      <Link
        href="/admin/reservations"
        onClick={(e) => { e.preventDefault(); navigate("/admin/reservations") }}
        className="inline-flex items-center gap-2 text-sm text-primary/60 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 rounded px-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Vissza a listához
      </Link>

      {/* Header */}
      <section className="text-center">
        <div className="section-label justify-center">Foglalás részletei</div>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">{formData.name}</h1>
        <p className="text-primary font-light">Látogatás napja: {formatDateHu(formData.visitDate)}</p>
      </section>

      {/* Just-created success view — replaces the edit form entirely */}
      {justCreated ? (
        <div className="border border-accent/30 bg-accent/8 rounded-lg overflow-hidden">
          <div className="flex items-start gap-3 px-4 py-4">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-px text-accent" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-accent">Gyors foglalás rögzítve</p>
              <p className="text-xs text-primary/60 mt-0.5">A foglalás sikeresen létrejött.</p>
            </div>
          </div>
          <div className="border-t border-accent/20 divide-y divide-accent/10">
            {[
              { label: "Név", value: initialReservation.name },
              { label: "Telefon", value: initialReservation.phone || "—" },
              { label: "Státusz", value: reservationStatusMeta[initialReservation.status]?.label },
              { label: "Látogatás", value: formatDateHu(initialReservation.visitDate) },
              ...(initialReservation.pickupDate ? [{ label: "Átvétel", value: formatDateHu(initialReservation.pickupDate) }] : []),
              ...(initialReservation.treeNumbers ? [{ label: "Fa sorszáma", value: initialReservation.treeNumbers }] : []),
              ...(initialReservation.paidTo ? [{ label: "Kinek fizet", value: initialReservation.paidTo }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="grid grid-cols-[6rem_1fr] sm:grid-cols-[8rem_1fr] items-baseline gap-x-3 px-4 py-2.5">
                <span className="text-[10px] font-bold tracking-widest uppercase text-accent/60">{label}</span>
                <span className="text-xs font-medium text-accent">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 px-4 py-3 border-t border-accent/20">
            <Link
              href="/admin/reservations/quick"
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-xs font-medium text-background hover:bg-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <Plus className="h-3.5 w-3.5" />
              Új gyors foglalás felvétele
            </Link>
            <Link
              href={`/admin/reservations/${initialReservation.id}`}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-accent/40 text-xs font-medium text-accent hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              Foglalás szerkesztése
            </Link>
          </div>
        </div>
      ) : null}

      {!justCreated && <div ref={alertRef}>
        {error && (
          <div className="flex gap-3 p-4 border border-destructive/30 bg-destructive/8 rounded-lg text-sm text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />{error}
          </div>
        )}
        {success && (
          <div className="flex gap-3 p-4 border border-accent/30 bg-accent/8 rounded-lg text-sm text-accent">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{success}</p>
              {savedChanges.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {savedChanges.map((change) => (
                    <li key={change.label} className="text-accent/80 font-light">— {change.label}: {change.oldVal} → {change.newVal}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setSuccess(""); setSavedChanges([]) }}
              className="flex-shrink-0 text-accent/50 hover:text-accent transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              aria-label="Bezárás"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>}

      {!justCreated && <>
      {/* Status */}
      <div className="border border-border bg-surface rounded-lg p-6">
        <p className="text-xs font-bold text-foreground tracking-widest uppercase mb-4">Gyors státuszváltás</p>
        <select
          value={formData.status}
          onChange={(e) => handleStatusChange(e.target.value as ReservationStatus)}
          className="w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-150 cursor-pointer"
        >
          {Object.entries(reservationStatusMeta).map(([value, meta]) => (
            <option key={value} value={value}>{meta.label}</option>
          ))}
        </select>
      </div>

      {/* Basic data + Notes */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="border border-border bg-surface rounded-lg p-6 space-y-5">
          <p className="text-xs font-bold text-foreground tracking-widest uppercase">Alapadatok</p>
          <div>
            <label className={labelClass}>Név</label>
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telefonszám</label>
            <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} inputMode="tel" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>E-mail</label>
            <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Várható darabszám</label>
            <input type="number" inputMode="numeric" min="1" value={formData.treeCount} onChange={(e) => setFormData({ ...formData, treeCount: Math.max(1, Number.parseInt(e.target.value) || 1) })} autoComplete="off" className={inputClass} />
          </div>
        </div>

        <div className="border border-border bg-surface rounded-lg p-6 space-y-5">
          <p className="text-xs font-bold text-foreground tracking-widest uppercase">Sorszám és megjegyzés</p>
          <div>
            <label className={labelClass}>
              Fa sorszáma
              {requiresTreeNumber(formData.status) && <span className="ml-1 text-destructive">*</span>}
            </label>
            <input
              value={formData.treeNumbers}
              disabled={!allowsTreeNumbers(formData.status) && !formData.treeNumbers.trim()}
              onChange={(e) => {
                const updated = { ...formData, treeNumbers: e.target.value }
                setFormData(updated)
                setValidationErrors(validate(updated))
              }}
              placeholder="Például 12, 13"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={`${allowsTreeNumbers(formData.status) || formData.treeNumbers.trim() ? inputClass : disabledInputClass} ${validationErrors.treeNumbers ? "border-destructive ring-1 ring-destructive/40" : ""}`}
            />
            {validationErrors.treeNumbers ? (
              <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {validationErrors.treeNumbers}
              </p>
            ) : !allowsTreeNumbers(formData.status) && !formData.treeNumbers.trim() ? (
              <p className="mt-1.5 text-xs text-primary/60 font-light">A jelenlegi státusznál nem állítható be.</p>
            ) : null}
          </div>
          <div>
            <label className={labelClass}>Megjegyzés</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={4} autoComplete="off" autoCorrect="off" spellCheck={false} className={inputClass + " resize-none"} />
          </div>
          <div>
            <label className={labelClass}>Kinek fizettek?</label>
            <select
              value={formData.paidTo}
              disabled={!allowsPaidTo(formData.status) && !formData.paidTo}
              onChange={(e) => {
                const updated = { ...formData, paidTo: e.target.value as "János" | "Sanyi" | "" }
                setFormData(updated)
                setValidationErrors(validate(updated))
              }}
              className={`${allowsPaidTo(formData.status) || formData.paidTo ? inputClass : disabledInputClass} ${validationErrors.paidTo ? "border-destructive ring-1 ring-destructive/40" : ""}`}
            >
              <option value="">Még nincs rögzítve</option>
              <option value="János">János</option>
              <option value="Sanyi">Sanyi</option>
            </select>
            {validationErrors.paidTo ? (
              <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {validationErrors.paidTo}
              </p>
            ) : !allowsPaidTo(formData.status) && !formData.paidTo ? (
              <p className="mt-1.5 text-xs text-primary/60 font-light">A jelenlegi státusznál nem állítható be.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border border-border bg-surface rounded-lg p-6 space-y-4">
        <p className="text-xs font-bold text-foreground tracking-widest uppercase">Fotó (opcionális)</p>
        <input ref={uploadInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={onFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => uploadInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-primary/5 transition-colors" disabled={photoUploading}>
            <Upload className="h-4 w-4" />
            Feltöltés
          </button>
          <button type="button" onClick={() => cameraInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-primary/5 transition-colors" disabled={photoUploading}>
            <Camera className="h-4 w-4" />
            Gyors fotó
          </button>
        </div>
        {formData.photos.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {formData.photos.map((photo) => (
              <div key={photo.id} className="border border-border rounded-lg p-2 bg-white">
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() =>
                      setVisiblePhotoIds((prev) =>
                        prev.includes(photo.id) ? prev.filter((id) => id !== photo.id) : [...prev, photo.id],
                      )
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-primary/5 transition-colors"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    {visiblePhotoIds.includes(photo.id) ? "Elrejtés" : "Megjelenítés"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const response = await fetch(`/api/admin/reservations/${initialReservation.id}/photos/${photo.id}`, { method: "DELETE" })
                      const data = await response.json()
                      if (!response.ok || !data.success) {
                        setError(data.error || "A kép törlése nem sikerült.")
                        return
                      }
                      const updatedPhotos = formData.photos.filter((p) => p.id !== photo.id)
                      setFormData((prev) => ({ ...prev, photos: updatedPhotos }))
                      setVisiblePhotoIds((prev) => prev.filter((id) => id !== photo.id))
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-primary/5 transition-colors"
                    disabled={photoUploading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Törlés
                  </button>
                </div>
                {visiblePhotoIds.includes(photo.id) ? (
                  <img src={photo.photoUrl} alt={`Foglalás fotó ${photo.id}`} className="h-40 w-full rounded object-cover" loading="lazy" />
                ) : (
                  <div className="h-40 w-full rounded bg-muted flex items-center justify-center text-xs text-primary/60">Kép rejtve</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-primary/60 inline-flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Nincs fotó csatolva.
          </div>
        )}
      </div>

      {/* Date pickers */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="border border-border bg-surface rounded-lg p-3 sm:p-6">
          <p className="text-xs font-bold text-foreground tracking-widest uppercase mb-4">Látogatás napja</p>
          <AdminDatePicker selectedDate={formData.visitDate} onDateSelect={(date) => setFormData({ ...formData, visitDate: date })} highlightDays={availableDays.length > 0 ? availableDays : undefined} />
        </div>
        <div className="border border-border bg-surface rounded-lg p-3 sm:p-6">
          <p className="text-xs font-bold text-foreground tracking-widest uppercase mb-4">Átvételi nap</p>
          <AdminDatePicker selectedDate={formData.pickupDate} onDateSelect={(date) => setFormData({ ...formData, pickupDate: date })} highlightDays={retrievalDays.length > 0 ? retrievalDays : undefined} />
        </div>
      </div>

      {/* Delete */}
      <div className="border border-destructive/20 bg-destructive/4 rounded-lg p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold text-destructive/70 tracking-widest uppercase mb-1">Veszélyes művelet</p>
            <p className="text-sm text-primary font-light">Csak akkor töröld, ha biztosan nincs már szükség erre a foglalásra.</p>
          </div>
          {!showDeleteConfirm ? (
            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/8 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30">
              <Trash2 className="h-4 w-4" />
              Foglalás törlése
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="inline-flex items-center px-5 py-2.5 rounded-lg border border-border text-primary text-sm font-medium hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
                Mégse
              </button>
              <button type="button" onClick={handleDelete} disabled={isDeleting} className="inline-flex items-center px-5 py-2.5 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30">
                {isDeleting ? "Törlés..." : "Végleges törlés"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save / Back */}
      <div className="flex gap-3">
        <button type="button" onClick={() => navigate("/admin/reservations")} className="flex-1 inline-flex items-center justify-center h-11 rounded-lg border border-border text-primary text-sm font-medium hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
          Vissza
        </button>
        <button type="button" onClick={handleSave} disabled={isSaving || photoUploading} className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
          <Save className="h-4 w-4" />
          {isSaving ? "Mentés..." : "Mentés"}
        </button>
      </div>
      </>}

    </div>
  )
}



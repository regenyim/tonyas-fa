"use client"

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Camera, Image as ImageIcon, Save, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReservationStatus } from "@/lib/types"
import { reservationStatusMeta } from "@/lib/site"
import { useUnsavedChanges } from "@/contexts/unsaved-changes-context"
import AdminDatePicker from "@/components/admin-date-picker"

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-border bg-white text-foreground placeholder:text-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-sm transition-all duration-150"
const labelClass = "block text-xs font-bold text-foreground tracking-widest uppercase mb-2"

interface QuickReservationFormProps {
  currentAdminPaidTo: "Sanyi" | "János" | null
}

export default function QuickReservationForm({ currentAdminPaidTo }: QuickReservationFormProps) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const adminNamePlaceholder = `Admin foglalás ${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`
  const router = useRouter()
  const { setDirty, navigate } = useUnsavedChanges()
  const alertRef = useRef<HTMLDivElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [photoUploading, setPhotoUploading] = useState(false)
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [retrievalDays, setRetrievalDays] = useState<string[]>([])

  useEffect(() => {
    if (error) setTimeout(() => alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50)
  }, [error])

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((data) => {
      if (data.settings?.availableDays) setAvailableDays(data.settings.availableDays.sort())
      if (data.settings?.retrievalDays) setRetrievalDays(data.settings.retrievalDays.sort())
    }).catch(() => {})
  }, [])
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    visitDate: "",
    pickupDate: "",
    treeCount: 1,
    notes: "",
    status: ReservationStatus.BOOKED,
    treeNumbers: "",
    paidTo: "",
    photos: [] as Array<{ photoUrl: string; photoPublicId: string }>,
  })
  const initialFormData = {
    name: "",
    phone: "",
    email: "",
    visitDate: "",
    pickupDate: "",
    treeCount: 1,
    notes: "",
    status: ReservationStatus.BOOKED,
    treeNumbers: "",
    paidTo: "",
    photos: [] as Array<{ photoUrl: string; photoPublicId: string }>,
  }

  useEffect(() => {
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData)
    setDirty(isDirty)
  }, [formData, setDirty])
  useEffect(() => () => setDirty(false), [setDirty])

  const uploadPhoto = async (file: File) => {
    setPhotoUploading(true)
    try {
      const body = new FormData()
      body.set("photo", file)
      const response = await fetch("/api/admin/uploads/reservation-photo", {
        method: "POST",
        body,
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.error || "A fotó feltöltése nem sikerült.")
        return
      }
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, { photoUrl: data.photoUrl, photoPublicId: data.photoPublicId }],
      }))
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")

    if (!Number.isInteger(formData.treeCount) || formData.treeCount < 1 || formData.treeCount > 20) {
      setError("A fák száma 1 és 20 között lehet.")
      return
    }

    if (photoUploading) {
      setError("Várd meg, amíg befejeződik a fotó feltöltése.")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/reservations/quick", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.error || data.errors?.join(", ") || "A gyors mentés nem sikerült.")
        return
      }

      setDirty(false)
      router.push(`/admin/reservations/${data.reservation.id}?created=true`)
    } catch {
      setError("Hálózati hiba történt.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = (nextStatus: ReservationStatus) => {
    setFormData((prev) => {
      if (nextStatus === ReservationStatus.BOOKED) {
        return {
          ...prev,
          status: nextStatus,
          visitDate: "",
          pickupDate: "",
          treeNumbers: "",
          paidTo: "",
        }
      }

      if (nextStatus === ReservationStatus.TREE_TAGGED) {
        return {
          ...prev,
          status: nextStatus,
          visitDate: today,
          pickupDate: "",
          treeNumbers: "",
          paidTo: "",
        }
      }

      if (nextStatus === ReservationStatus.CUT) {
        return {
          ...prev,
          status: nextStatus,
          visitDate: today,
          pickupDate: "",
          treeNumbers: "0",
          paidTo: "",
        }
      }

      if (nextStatus === ReservationStatus.PICKED_UP) {
        return {
          ...prev,
          status: nextStatus,
          visitDate: today,
          pickupDate: today,
          treeNumbers: "0",
          paidTo: currentAdminPaidTo || prev.paidTo || "",
        }
      }

      if (nextStatus === ReservationStatus.FREE) {
        return {
          ...prev,
          status: nextStatus,
          visitDate: today,
          pickupDate: today,
          treeNumbers: "0",
          paidTo: "",
        }
      }

      return { ...prev, status: nextStatus }
    })
  }

  const handlePaidToChange = (nextPaidTo: string) => {
    if (nextPaidTo) {
      setFormData((prev) => ({
        ...prev,
        paidTo: nextPaidTo,
        status: ReservationStatus.PICKED_UP,
        treeNumbers: "0",
        pickupDate: prev.pickupDate || today,
      }))
      return
    }

    setFormData((prev) => ({ ...prev, paidTo: nextPaidTo }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div ref={alertRef} className="flex gap-3 p-4 border border-destructive/30 bg-destructive/8 rounded-lg text-sm text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="border border-border bg-surface rounded-lg p-6">
        <label className={labelClass}>Státusz</label>
        <select
          value={formData.status}
          onChange={(e) => handleStatusChange(e.target.value as ReservationStatus)}
          className={inputClass}
        >
          {Object.entries(reservationStatusMeta)
            .filter(([value]) => value !== ReservationStatus.NO_SHOW)
            .map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="min-w-0 border border-border bg-surface rounded-lg p-6 space-y-5">
          <p className="text-xs font-bold text-foreground tracking-widest uppercase">Alapadatok</p>
          <div>
            <label className={labelClass}>Név</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={adminNamePlaceholder}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={inputClass}
            />
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
            <label className={labelClass}>Darabszám *</label>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="20"
              value={formData.treeCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  treeCount: Number.parseInt(e.target.value, 10) || 1,
                })
              }
              autoComplete="off"
              className={inputClass}
            />
          </div>
        </div>

        <div className="min-w-0 border border-border bg-surface rounded-lg p-6 space-y-5">
          <p className="text-xs font-bold text-foreground tracking-widest uppercase">További adatok</p>
          <div>
            <label className={labelClass}>Fa sorszáma</label>
            <input value={formData.treeNumbers} onChange={(e) => setFormData({ ...formData, treeNumbers: e.target.value })} placeholder="Pl. 0 vagy 12, 13" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Kinek fizettek?</label>
            <select value={formData.paidTo} onChange={(e) => handlePaidToChange(e.target.value)} className={inputClass}>
              <option value="">Még nincs rögzítve</option>
              <option value="János">János</option>
              <option value="Sanyi">Sanyi</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Megjegyzés</label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>
      </div>

      <div className="border border-border bg-surface rounded-lg p-6 space-y-4">
        <p className="text-xs font-bold text-foreground tracking-widest uppercase">Fotó (opcionális)</p>
        <input ref={uploadInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={onFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => uploadInputRef.current?.click()} disabled={photoUploading}>
            <Upload className="h-4 w-4" />
            Feltöltés
          </Button>
          <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()} disabled={photoUploading}>
            <Camera className="h-4 w-4" />
            Gyors fotó
          </Button>
        </div>
        {formData.photos.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {formData.photos.map((photo, index) => (
              <div key={photo.photoPublicId} className="border border-border rounded-lg p-2 bg-white">
                <img src={photo.photoUrl} alt={`Foglalás fotó ${index + 1}`} className="h-36 w-full rounded object-cover" loading="lazy" />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={async () => {
                    try {
                      await fetch("/api/admin/uploads/reservation-photo", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ photoPublicId: photo.photoPublicId }),
                      })
                    } catch {}
                    setFormData((prev) => ({
                      ...prev,
                      photos: prev.photos.filter((p) => p.photoPublicId !== photo.photoPublicId),
                    }))
                  }}
                  disabled={photoUploading}
                >
                  <Trash2 className="h-4 w-4" />
                  Kép törlése
                </Button>
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

      <div className="flex gap-3">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => navigate("/admin/reservations")}>
          Vissza
        </Button>
        <Button type="submit" size="lg" className="flex-1" disabled={isSaving || photoUploading}>
          <Save className="h-4 w-4" />
          {isSaving ? "Mentés..." : "Gyors foglalás mentése"}
        </Button>
      </div>
    </form>
  )
}


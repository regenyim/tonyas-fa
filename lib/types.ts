export enum ReservationStatus {
  BOOKED = "BOOKED",
  TREE_TAGGED = "TREE_TAGGED",
  CUT = "CUT",
  PICKED_UP = "PICKED_UP",
  FREE = "FREE",
  NO_SHOW = "NO_SHOW",
}

export interface Reservation {
  id: number
  year: number
  name: string
  phone: string
  email?: string
  visitDate: string
  pickupDate?: string
  treeCount: number
  notes?: string
  treeNumbers?: string
  status: ReservationStatus
  createdAt: string
  paidTo?: "János" | "Sanyi"
  photos: ReservationPhoto[]
  hasPhotos?: boolean
}

export interface ReservationPhoto {
  id: number
  reservationId: number
  photoUrl: string
  photoPublicId: string
  createdAt: string
}

export interface CreateReservationData {
  name: string
  phone: string
  email?: string
  visitDate: string
  pickupDate?: string
  treeCount: number
  notes?: string
}

export interface CreateAdminQuickReservationData {
  treeCount: number
  name?: string
  phone?: string
  email?: string
  visitDate?: string
  pickupDate?: string
  notes?: string
  status?: ReservationStatus
  treeNumbers?: string
  paidTo?: "János" | "Sanyi"
  photos?: Array<{
    photoUrl: string
    photoPublicId: string
  }>
}

export interface UpdateReservationData {
  status?: ReservationStatus
  treeNumbers?: string
  notes?: string
  name?: string
  phone?: string
  email?: string
  visitDate?: string
  pickupDate?: string
  treeCount?: number
  paidTo?: "János" | "Sanyi"
}

export interface Expense {
  id: number
  year: number
  person: "János" | "Sanyi"
  amount: number
  description: string
  date: string
  createdAt: string
}

export interface CreateExpenseData {
  person: "János" | "Sanyi"
  amount: number
  description: string
  date: string
}

export interface Settings {
  year: number
  availableDays: string[]
  maxBookingsPerDay: number
  maxTreesPerSeason: number
  retrievalDays: string[]
  pricePerTree: number
}

export interface Year {
  year: number
  isActive: boolean
  createdAt: string
}

export interface YearWithCounts extends Year {
  reservationCount: number
  expenseCount: number
}

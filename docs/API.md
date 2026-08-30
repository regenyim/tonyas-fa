# API Documentation

All responses are JSON. Success responses include `"success": true`; failures include `"success": false` plus either `error` (string) or `errors` (string array, used by Zod validation failures).

Operational data is partitioned by calendar year. The admin pages filter on a per-session "view year" stored in the `admin_view_year` cookie. The public booking page silently uses whichever year is currently active in the `years` table — customers never see or pick a year. New reservations created via the public route are stamped with the active year server-side.

## Base URL

```
https://v0-christmas-tree-farm-app.vercel.app
```

## Authentication

Admin endpoints require a valid `admin_session` cookie obtained from `POST /api/admin/login`. The session is a stateless HS256 JWT signed with `AUTH_SECRET`, valid for 8 hours.

### Login

**POST** `/api/admin/login`

**Request body:**
```json
{ "username": "admin", "password": "secure-password" }
```

**Response (200):**
```json
{ "success": true }
```
Sets the `admin_session` cookie (httpOnly, sameSite=strict, secure in production).

**Errors:**
- `400` — Invalid body (missing/empty username or password)
- `401` — `{ "success": false, "error": "Hibás felhasználónév vagy jelszó" }`
- `403` — Same-origin check failed (production only)

### Logout

**POST** `/api/admin/logout` — clears the session cookie.

---

## Reservations (admin)

### List reservations

**GET** `/api/admin/reservations`

Lists reservations for the admin's current view year (resolved from the `admin_view_year` cookie).

**Query parameters:**
- `status` (optional) — one of `BOOKED`, `TREE_TAGGED`, `CUT`, `PICKED_UP_PAID`, `NO_SHOW`. Invalid values return `400`.

**Response (200):**
```json
{
  "success": true,
  "year": 2026,
  "reservations": [
    {
      "id": 1,
      "year": 2026,
      "name": "John Doe",
      "phone": "+36201234567",
      "email": "john@example.com",
      "visitDate": "2024-12-15",
      "pickupDate": "2024-12-20",
      "treeCount": 2,
      "notes": "...",
      "treeNumbers": "12, 13",
      "status": "TREE_TAGGED",
      "paidTo": "János",
      "createdAt": "2024-11-01T10:30:00Z"
    }
  ]
}
```

### Quick-create reservation (admin)

**POST** `/api/admin/reservations/quick`

Creates a reservation for the currently active public year. Requires a valid admin session.
Unlike the public create endpoint, this quick-create route does **not** send reservation notification emails.

Only `treeCount` is required in the request body. All other fields are optional:

```json
{
  "treeCount": 1,
  "name": "",
  "phone": "",
  "email": "",
  "visitDate": "",
  "pickupDate": "",
  "notes": "",
  "status": "BOOKED",
  "treeNumbers": "",
  "paidTo": ""
}
```

**Auto-fill behavior when optional fields are empty:**
- `name` → `Admin foglalas YYYYMMDD-HHMM`
- `phone` → `"N/A"`
- `visitDate` → today's local date (`YYYY-MM-DD`)
- `status` defaults to `BOOKED`
- if `status` requires tree numbers (`TREE_TAGGED`, `CUT`, `PICKED_UP`, `FREE`) and `treeNumbers` is empty, the API stores `"0"`

`"0"` is treated as a sentinel meaning "tree number not assigned yet". Multiple reservations may use `"0"`. Conflict checks still apply to real tree numbers.

**Response (200):**
```json
{
  "success": true,
  "reservation": {
    "id": 101,
    "year": 2026,
    "name": "Admin foglalas 20261128-1015",
    "phone": "N/A",
    "visitDate": "2026-11-28",
    "treeCount": 1,
    "status": "BOOKED",
    "createdAt": "2026-11-28T10:15:30.000Z"
  }
}
```

**Errors:** `400` validation error, `401` unauthenticated, `403` origin check, `503` if no active year is configured.

### Get one reservation

**GET** `/api/admin/reservations/[id]` → `{ "success": true, "reservation": { ... } }`

`404` returns `{ "success": false, "error": "Foglalás nem található" }`.

### Update reservation

**PATCH** `/api/admin/reservations/[id]`

All fields optional; at least one must be present.

```json
{
  "name": "Jane Doe",
  "phone": "+36201234567",
  "email": "jane@example.com",
  "visitDate": "2024-12-16",
  "pickupDate": "2024-12-20",
  "treeCount": 3,
  "status": "PICKED_UP_PAID",
  "treeNumbers": "12, 13, 14",
  "notes": "...",
  "paidTo": "Sanyi"
}
```

**Server-enforced rules** (see `lib/reservations.ts`):
- `status` ∈ `{TREE_TAGGED, CUT, PICKED_UP_PAID}` requires non-empty `treeNumbers`.
- `treeNumbers` is a comma-separated list of positive integers; numbers already assigned to other reservations *in the same year* return `400` with the conflicting reservation names. The same number is allowed across different years.
- `paidTo` must be `"János"` or `"Sanyi"` (or empty/null to clear).
- Date fields must match `YYYY-MM-DD`.
- `treeCount` is an integer between 1 and 20.
- The reservation's `year` is immutable and cannot be changed via PATCH.

**Response (200):** `{ "success": true, "reservation": { ... } }`.

**Errors:** `400` on validation, `401` unauthenticated, `403` origin check, `404` not found.

### Delete reservation

**DELETE** `/api/admin/reservations/[id]` → `{ "success": true }` or `404 { error: "Foglalás nem található" }`.

Deleting a reservation that has assigned `tree_numbers` logs a `WARNING` to server logs — those numbers are not reusable elsewhere because uniqueness is enforced in app code, not the DB.

---

## Reservations (public)

### Create reservation

**POST** `/api/reservations`

```json
{
  "name": "John Doe",
  "phone": "+36201234567",
  "email": "john@example.com",
  "visitDate": "2024-12-15",
  "pickupDate": "2024-12-20",
  "treeCount": 2,
  "notes": "..."
}
```

`email`, `pickupDate`, and `notes` are optional.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "year": 2026,
    "name": "John Doe",
    "phone": "+36201234567",
    "visitDate": "2024-12-15",
    "treeCount": 2,
    "status": "BOOKED",
    "createdAt": "..."
  }
}
```

**Errors:** `400 { success: false, errors: [...] }` for validation, including `["Erre a szezonra elfogyott az összes fa."]` if the sum of `treeCount` across the active year's non-`NO_SHOW` reservations plus this request would exceed `settings.maxTreesPerSeason`; `503 { success: false, errors: ["Foglalás jelenleg nem elérhető"] }` if no year is currently marked active in the `years` table; `500 { success: false, errors: ["Szerver hiba. Kérjük, próbáld újra."] }` on server error.

The `year` is stamped server-side from the active year — the request body never contains it.

A side-effect `POST` triggers a Resend email to `RESERVATION_NOTIFY_TO` if all email env vars are set; missing email config logs a warning and the reservation still succeeds.

There is no public `GET /api/reservations` — availability data is computed in the booking page from settings + admin reservation data, not from a public endpoint.

---

## Expenses (admin)

- **GET** `/api/admin/expenses` → `{ success: true, expenses: [ ... ] }`
- **POST** `/api/admin/expenses` body `{ person, amount, description, date }`. `person` ∈ `{"János", "Sanyi"}`, `amount` > 0, `date` `YYYY-MM-DD`. Returns `{ success: true, expense }`.
- **DELETE** `/api/admin/expenses/[id]` → `{ success: true }` or `404`.

## Stats (admin)

**GET** `/api/admin/stats` → `{ success: true, stats: { totalReservations, totalTrees, upcomingWeekend, revenueJanos, revenueSanyi, totalRevenue } }`. Revenue is computed only from `PICKED_UP_PAID` reservations using `settings.price`.

## Settings

- **GET** `/api/admin/settings` (public — no auth) returns the currently active year's settings: `{ success: true, settings: { year, availableDays, maxBookingsPerDay, retrievalDays, pricePerTree }, isSeasonSoldOut: boolean }`. `maxTreesPerSeason` and the raw reserved-tree total are intentionally omitted from this public response — only the computed `isSeasonSoldOut` flag is exposed. Cached `no-store`. Returns `503 { success: false, error: "Foglalás jelenleg nem elérhető" }` if no year is active.
- **GET** `/api/admin/settings?year=2026` (admin) — returns settings for the specified year (includes `maxTreesPerSeason`). Requires the admin session.
- **PATCH** `/api/admin/settings` (admin) — partial update of `availableDays`, `maxBookingsPerDay`, `maxTreesPerSeason`, `retrievalDays`, `pricePerTree` for the admin's current view year. The handler upserts: a missing settings row is created on first PATCH for a year. `availableDays` / `retrievalDays` are arrays of `YYYY-MM-DD` strings (max 366).

## Years (admin)

- **GET** `/api/admin/years` → `{ success: true, years: [{ year, isActive, createdAt, reservationCount, expenseCount }, ...] }`. Used by the year-manager dialog.
- **POST** `/api/admin/years` body `{ year: number }` → `{ success: true, year: { year, isActive, createdAt } }`. Creates the year row plus an initial settings row with values cloned from the most recent prior year (excluding `availableDays`, which always start empty). Returns `400` if the year already exists.
- **POST** `/api/admin/years/[year]/activate` → `{ success: true }`. Atomically clears any existing active flag and sets it on the requested year.
- **DELETE** `/api/admin/years/[year]` → `{ success: true }`. Refuses (`400`) when the year is currently active or when any reservation/expense row references it; the error message includes the row counts.

## View year (admin)

- **POST** `/api/admin/view-year` body `{ year: number }` → `{ success: true, year }`. Sets the `admin_view_year` cookie (httpOnly, sameSite=strict, 1-year maxAge). The cookie value is validated against `years` on every read; a stale cookie is ignored. Returns `400` if the year doesn't exist.

---

## Reservation status flow

```
BOOKED          (initial — set when public POST creates a reservation)
  ↓
TREE_TAGGED     (admin assigns tree numbers)
  ↓
CUT             (admin confirms trees are cut)
  ↓
PICKED_UP_PAID  (customer picked up; paidTo records who took payment)
```

`NO_SHOW` is a terminal off-ramp. Statuses `TREE_TAGGED`, `CUT`, and `PICKED_UP_PAID` all require non-empty `treeNumbers`; the API rejects updates that would clear them.

---

## Same-origin check (CSRF protection)

Mutating routes (POST/PATCH/DELETE) call `enforceSameOrigin`, which compares the `Origin` header to `x-forwarded-host` + `x-forwarded-proto`. This runs **only when `NODE_ENV === "production"`** — local dev and the v0 preview environment skip the check. `403 { error: "Tiltott keres eredet." }` on mismatch.

## Rate limiting

Not implemented.

## Reservation Photo Upload (admin)

- `POST /api/admin/uploads/reservation-photo` (multipart/form-data, field: `photo`)
- Requires admin auth and same-origin checks on production.
- Accepted MIME: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`.
- Max upload size: 10 MB.
- Success: `{ success: true, photoUrl, photoPublicId }`

photoUrl and photoPublicId can be sent to:
- `POST /api/admin/reservations/quick`
- `PATCH /api/admin/reservations/[id]` (with `clearPhoto=true` to remove existing photo)



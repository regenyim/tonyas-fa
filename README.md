# 🎄 Christmas Tree Farm App

A full-stack web application for managing Christmas tree farm operations, including customer reservations, tree inventory, expenses tracking, and admin authentication.

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/hollositamas-projects/v0-christmas-tree-farm-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/uLhcWiTTbMh)

## Overview

A comprehensive management system for Christmas tree farm operations. The app features:

- **Public Booking**: Customers can reserve trees for specific dates
- **Admin Dashboard**: Secure admin interface for managing reservations, expenses, and settings
- **Reservation Management**: Track reservation status from tagged → cut → picked up
- **Tree Inventory**: Manage tree numbers and prevent double-booking
- **Expense Tracking**: Record and categorize farm expenses
- **Data Persistence**: All data stored securely in Neon PostgreSQL

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Backend**: Next.js API Routes, Server Components
- **Database**: Neon PostgreSQL with SQL client
- **Authentication**: Custom password-based admin authentication
- **UI Components**: Radix UI + shadcn/ui patterns
- **Forms**: React Hook Form + Zod validation
- **Utilities**: Date-fns, Recharts, Framer Motion

## Features

### Public Booking Page
- Browse available dates
- Reserve trees with customer details
- Real-time availability tracking
- Mobile-responsive design

### Admin Dashboard
- Secure login with session management
- View all reservations with filtering and sorting
- Edit reservation details with validation
- Track payment status and pick-up information
- Manage expenses
- View system statistics

### Validation & Security
- Form input validation (client + server)
- Tree number uniqueness checking across reservations
- Secure authentication with session tokens
- CORS protection (enabled in production)
- Environment variable management

## Project Structure

```
├── app/
│   ├── (auth)/          # Login page
│   ├── admin/           # Admin dashboard pages
│   ├── api/             # API routes
│   └── booking/         # Public booking page
├── components/          # Reusable React components
├── lib/
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts            # Database connection
│   ├── reservations.ts  # Reservation logic
│   ├── expenses.ts      # Expense logic
│   ├── types.ts         # TypeScript types
│   └── api.ts           # API helpers
├── docs/                # Documentation
└── scripts/             # Database scripts (if any)
```

## Environment Variables

Required environment variables (set in Vercel):

```env
AUTH_SECRET              # Secret key for session signing
DATABASE_URL            # Neon PostgreSQL connection string
RESEND_API_KEY          # API key from Resend
RESERVATION_NOTIFY_TO   # Comma-separated internal recipients
RESERVATION_EMAIL_FROM  # Verified sender, e.g. Foglalás <noreply@yourdomain.tld>
CLOUDINARY_CLOUD_NAME   # Cloudinary cloud name for admin reservation photos
CLOUDINARY_API_KEY      # Cloudinary API key
CLOUDINARY_API_SECRET   # Cloudinary API secret
```

## Development

### Install dependencies
```bash
pnpm install
```

### Run development server
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

### Build for production
```bash
pnpm build
pnpm start
```

## Deployment

Your project is live at:

**[https://vercel.com/hollositamas-projects/v0-christmas-tree-farm-app](https://vercel.com/hollositamas-projects/v0-christmas-tree-farm-app)**

### How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Database

The app uses Neon PostgreSQL for data persistence. All operational data is partitioned by calendar year via a `year` column on `reservations`, `expenses`, and `settings`. The `years` table tracks which years exist and which one is currently *active* (the public booking page uses the active year's settings and stamps new public reservations with it).

Key tables:

- `years` - List of seasons with an `is_active` flag (only one active at a time)
- `admin_users` - Admin accounts (`username`, `password_hash`)
- `reservations` - Customer reservations, keyed by `year`
- `expenses` - Farm expenses (`year`, `person`, `amount`, `description`, `date`)
- `settings` - One row per year (available days, max bookings/day, retrieval days, price per tree)

## API Routes

### Admin Routes
- `POST /api/admin/login` - Admin authentication (body: `{ username, password }`)
- `POST /api/admin/logout` - Clear session cookie
- `GET /api/admin/reservations` - List reservations for the admin's view year (optional `?status=` filter)
- `POST /api/admin/reservations/quick` - Admin quick-create reservation for the active year (treeCount required, other fields optional)
- `GET /api/admin/reservations/[id]` - Get specific reservation (any year)
- `PATCH /api/admin/reservations/[id]` - Update reservation with validation
- `DELETE /api/admin/reservations/[id]` - Delete reservation
- `GET /api/admin/expenses` / `POST /api/admin/expenses` - List/create expenses for the view year
- `DELETE /api/admin/expenses/[id]` - Delete expense
- `GET /api/admin/stats` - Dashboard totals for the view year
- `GET /api/admin/settings` - Active-year settings (no auth) or `?year=X` for any year (admin only)
- `PATCH /api/admin/settings` - Update settings for the view year
- `GET /api/admin/years` - List all years with reservation/expense counts
- `POST /api/admin/years` - Create a new year (clones settings from the most recent prior year)
- `POST /api/admin/years/[year]/activate` - Promote a year to be the public-facing active year
- `DELETE /api/admin/years/[year]` - Delete an empty, non-active year
- `POST /api/admin/view-year` - Set the admin's view-year cookie

### Public Routes
- `POST /api/reservations` - Create new reservation, stamped with the active year (returns 503 if no year is active)

### Bootstrap
- `POST /api/seed-admin` - Create/update an admin user (requires `SEED_ADMIN_KEY` header `x-seed-key`)

## Security Notes

- Admin passwords are hashed with PBKDF2-SHA256 (100k iterations, per-user salt)
- Sessions are stateless HS256 JWTs in HTTP-only cookies (`admin_session`, 8h)
- Same-origin checks on mutating routes prevent CSRF in production
- All inputs are validated on client and server (Zod on the server)
- Database queries use parameterized statements

# Deployment Guide

## Overview

This app is deployed on Vercel and uses Neon PostgreSQL for the database. Changes are automatically synchronized from this repository.

## Prerequisites

1. **Vercel Account** - Already set up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Repository connected to Vercel
3. **Neon Database** - PostgreSQL database set up with tables

## Environment Variables

The following environment variables must be configured in Vercel:

### Required Variables

#### `AUTH_SECRET`
Secret key used for signing session cookies. Must be a strong, random string.

**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Set in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add variable: `AUTH_SECRET`
3. Set the generated value
4. Apply to: Production, Preview, Development

#### `DATABASE_URL`
PostgreSQL connection string from Neon.

**Format:**
```
postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

**Get from Neon:**
1. Log into Neon console
2. Go to your project and database
3. Click "Connection string"
4. Copy the "Pooled connection" string
5. Use the `postgres://` variant (not `postgresql://`)

**Set in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add variable: `DATABASE_URL`
3. Paste the connection string
4. Apply to: Production, Preview, Development

#### `RESEND_API_KEY`
API key used to send reservation notification emails through Resend.

**Set in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add variable: `RESEND_API_KEY`
3. Paste the API key from Resend
4. Apply to: Production, Preview, Development

#### `RESERVATION_NOTIFY_TO`
Comma-separated list of internal email recipients for new reservation notifications.

**Example:**
```env
RESERVATION_NOTIFY_TO=owner@example.com,staff@example.com
```

**Set in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add variable: `RESERVATION_NOTIFY_TO`
3. Paste the recipient list
4. Apply to: Production, Preview, Development

#### `RESERVATION_EMAIL_FROM`
Verified sender identity in Resend.

**Example:**
```env
RESERVATION_EMAIL_FROM=Foglalás <noreply@yourdomain.tld>
```

**Set in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add variable: `RESERVATION_EMAIL_FROM`
3. Paste the verified sender identity
4. Apply to: Production, Preview, Development

#### `CLOUDINARY_CLOUD_NAME`
Cloudinary cloud name for admin reservation photo uploads.

#### `CLOUDINARY_API_KEY`
Cloudinary API key for signed upload and destroy calls.

#### `CLOUDINARY_API_SECRET`
Cloudinary API secret for request signing.## Database Setup

## Database Setup

### Initial Setup

1. **Create Database** in Neon
2. **Create tables** by running the SQL in [Required Tables](#required-tables) below against your Neon database (via the Neon SQL editor or `psql`). There are no automated migrations — `/scripts/test-db-connection.ts` only verifies connectivity.

   After tables exist, seed an admin via:
   ```bash
   curl -X POST "$DEPLOYED_URL/api/seed-admin" \
     -H "x-seed-key: $SEED_ADMIN_KEY" \
     -H "content-type: application/json" \
     -d '{"username":"admin","password":"<at-least-12-chars>"}'
   ```

### Required Tables

The app requires the following tables in PostgreSQL. Field names below match what the code reads/writes (see `lib/db.ts`, `lib/reservations.ts`, `lib/expenses.ts`, `lib/settings.ts`, `lib/years.ts`, `lib/auth.ts`).

Operational data is partitioned by calendar year: `reservations`, `expenses`, and `settings` all have a `year` column with an FK to `years.year`. The `years` table is the source of truth for which seasons exist and which one is currently active (used by the public booking page).

For an existing database that predates this partitioning, run [scripts/add-year-partitioning.sql](../scripts/add-year-partitioning.sql) once — it adds the `year` columns, backfills 2026, creates the `years` table, and adds the FK constraints.

#### `admin_users` table
```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

`password_hash` stores PBKDF2-SHA256 output as `<salt-hex>:<hash-hex>` (100k iterations, 16-byte salt). Use `POST /api/seed-admin` with the `SEED_ADMIN_KEY` header to insert the initial admin without hashing manually.

#### `years` table
```sql
CREATE TABLE years (
  year       INTEGER PRIMARY KEY,
  is_active  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX years_one_active ON years (is_active) WHERE is_active = TRUE;

INSERT INTO years (year, is_active) VALUES (2026, TRUE);
```

The partial unique index enforces that at most one row has `is_active = TRUE`. The app's `activateYear` helper runs the swap in a transaction.

#### `reservations` table
```sql
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL REFERENCES years(year),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  visit_date DATE NOT NULL,
  pickup_date DATE,
  tree_count INTEGER NOT NULL,
  notes TEXT,
  tree_numbers TEXT,            -- comma-separated integers; uniqueness enforced in app code, scoped per year
  status VARCHAR(50) NOT NULL DEFAULT 'BOOKED',
  paid_to VARCHAR(50),          -- 'János' or 'Sanyi' once paid
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX reservations_year_idx ON reservations (year);
```

#### `expenses` table
```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL REFERENCES years(year),
  person VARCHAR(50) NOT NULL,  -- 'János' or 'Sanyi'
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX expenses_year_idx ON expenses (year);
```

#### `settings` table

One row per year. Created automatically when `createYear` runs; if missing, the app falls back to in-memory defaults (see `lib/years.ts` `defaultSettingsFor`).

```sql
CREATE TABLE settings (
  year INTEGER PRIMARY KEY REFERENCES years(year),
  available_days TEXT,                            -- comma-separated YYYY-MM-DD
  max_bookings_per_day INTEGER NOT NULL DEFAULT 20,
  max_trees_per_season INTEGER NOT NULL DEFAULT 500, -- season-wide cap on SUM(tree_count)
  retrieval_days TEXT,                            -- comma-separated YYYY-MM-DD
  price NUMERIC NOT NULL DEFAULT 8000             -- price per tree in HUF
);

INSERT INTO settings (year, max_bookings_per_day, max_trees_per_season, price) VALUES (2026, 20, 500, 8000);
```

## Deployment Process

### Automatic Deployments

Changes are automatically deployed when:
1. Code is pushed to the main branch
2. Pull requests are merged to main
3. Vercel detects changes in the repository

### Manual Deployment

Trigger a manual deployment:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the `v0-christmas-tree-farm-app` project
3. Click "Redeploy" on the latest deployment

### Deployment Status

Monitor deployments:
1. Go to Vercel Dashboard → Project
2. View deployment history
3. Check build logs if deployment fails
4. View live URL when deployment is complete

## Configuration

### Custom Domain

If using a custom domain:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate generation

### Environment Variables

Update environment variables:
1. Go to Project Settings → Environment Variables
2. Modify values as needed
3. Redeploy the project for changes to take effect

## Monitoring & Maintenance

### View Logs

Check application logs:
1. Go to Vercel Dashboard → Project
2. Click on a deployment
3. View "Logs" tab

### Performance

Monitor performance:
1. Go to Project Settings → Analytics
2. View request metrics and response times
3. Check Vercel Speed Insights

### Error Tracking

For production errors:
1. Check Vercel logs
2. Monitor database connection health
3. Verify environment variables are correctly set

## Troubleshooting

### Build Failures

**Problem:** Deployment fails during build

**Solutions:**
1. Check build logs in Vercel
2. Verify all environment variables are set
3. Check for TypeScript errors: `pnpm run build`
4. Ensure database schema is correct

### Database Connection Issues

**Problem:** "DATABASE_URL environment variable is required"

**Solutions:**
1. Verify `DATABASE_URL` is set in Vercel
2. Check connection string format is correct
3. Ensure Neon database is active and running
4. Verify IP whitelist settings in Neon

### Reservation Email Issues

**Problem:** New reservations are saved but notification emails are not sent

**Solutions:**
1. Verify `RESEND_API_KEY` is set in Vercel
2. Verify `RESERVATION_NOTIFY_TO` contains valid comma-separated email addresses
3. Verify `RESERVATION_EMAIL_FROM` is a verified sender in Resend
4. Check function logs in Vercel for `[email]` warnings and API errors

### Authentication Issues

**Problem:** Can't log in to admin panel

**Solutions:**
1. Verify `AUTH_SECRET` is set in Vercel
2. Check that `users` table exists in database
3. Verify user account exists with correct email/password
4. Check session cookie settings

### Tree Number Conflicts

**Problem:** "Tree numbers already in use"

**Solutions:**
1. Check existing reservations for the same tree numbers
2. Verify `tree_numbers` field is not corrupted
3. Run database integrity check

## Rollback

If a deployment has issues:

1. Go to Vercel Dashboard
2. Find the previous working deployment
3. Click the three dots (⋯)
4. Select "Promote to Production"
5. The previous version will be restored

## Security Checklist

Before deploying to production:

- [ ] `AUTH_SECRET` is set to a strong random value
- [ ] `DATABASE_URL` uses a secure connection string (postgresql://)
- [ ] `RESEND_API_KEY` is configured
- [ ] `RESERVATION_NOTIFY_TO` includes at least one valid recipient
- [ ] `RESERVATION_EMAIL_FROM` is verified in Resend
- [ ] Database credentials are not in code
- [ ] Same-origin (`enforceSameOrigin`) checks active in production (automatic when `NODE_ENV=production`)
- [ ] All environment variables are configured
- [ ] SSL/TLS is enabled for custom domains
- [ ] Database backups are configured in Neon
- [ ] Admin credentials are changed from defaults

## Backup & Recovery

### Database Backups

Neon provides automatic backups. To restore:

1. Log into Neon console
2. Go to your database
3. Click "Backups"
4. Select a backup point
5. Click "Restore"

### Code Backup

The entire codebase is backed up by:
1. GitHub repository (version control)
2. Vercel deployment history (up to 100 deployments)

## Performance Optimization

### Database Optimization

1. Add indexes to frequently queried columns:
   ```sql
   CREATE INDEX idx_reservations_date ON reservations(date);
   CREATE INDEX idx_reservations_status ON reservations(status);
   ```

2. Monitor slow queries in Neon

### Frontend Optimization

1. Next.js automatically optimizes:
   - Code splitting
   - Image optimization
   - Static generation where possible

2. Monitor Core Web Vitals in Vercel Analytics

## Support

For issues or questions:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Check Neon documentation: [neon.tech/docs](https://neon.tech/docs)
3. Review GitHub repository issues
4. Contact Vercel support if needed


### Cloudinary Reservation Photo Variables
- CLOUDINARY_CLOUD_NAME - Cloudinary cloud name.
- CLOUDINARY_API_KEY - Cloudinary API key.
- CLOUDINARY_API_SECRET - Cloudinary API secret.


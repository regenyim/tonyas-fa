-- Add optional reservation photo fields for admin-only image attachments.
-- Run once per environment: psql "$DATABASE_URL" -f scripts/add-reservation-photos.sql

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_public_id TEXT,
  ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMP;


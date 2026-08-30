-- Multi-photo support per reservation.
-- Run once per environment: psql "$DATABASE_URL" -f scripts/add-reservation-photo-table.sql

CREATE TABLE IF NOT EXISTS reservation_photos (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_public_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS reservation_photos_reservation_id_idx ON reservation_photos(reservation_id);

-- Backfill legacy single-photo columns, if present and populated.
INSERT INTO reservation_photos (reservation_id, photo_url, photo_public_id, created_at)
SELECT r.id, r.photo_url, r.photo_public_id, COALESCE(r.photo_uploaded_at, r.created_at)
FROM reservations r
WHERE r.photo_url IS NOT NULL
  AND r.photo_public_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM reservation_photos rp
    WHERE rp.reservation_id = r.id AND rp.photo_public_id = r.photo_public_id
  );

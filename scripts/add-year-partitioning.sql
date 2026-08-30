-- Year partitioning migration
-- Run this in the Neon SQL editor (or psql) once. It is idempotent against a fresh schema only;
-- do not re-run on a database that already has the `years` table.
--
-- Effect:
--   1. Adds a `years` table with an `is_active` flag (one row, one active).
--   2. Backfills every existing reservations / expenses / settings row to year = 2026 and
--      makes the column NOT NULL.
--   3. Replaces the `settings.id = 1` singleton with a per-year row keyed on `year`.
--   4. Adds FK constraints from data tables to `years`, so deleting a year that still has
--      data fails at the DB level.

BEGIN;

-- 1. Years table
CREATE TABLE years (
  year       INTEGER PRIMARY KEY,
  is_active  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX years_one_active ON years (is_active) WHERE is_active = TRUE;

INSERT INTO years (year, is_active) VALUES (2026, TRUE);

-- 2. reservations.year
ALTER TABLE reservations ADD COLUMN year INTEGER;
UPDATE reservations SET year = 2026 WHERE year IS NULL;
ALTER TABLE reservations ALTER COLUMN year SET NOT NULL;
ALTER TABLE reservations
  ADD CONSTRAINT reservations_year_fk FOREIGN KEY (year) REFERENCES years(year);
CREATE INDEX reservations_year_idx ON reservations (year);

-- 3. expenses.year
ALTER TABLE expenses ADD COLUMN year INTEGER;
UPDATE expenses SET year = 2026 WHERE year IS NULL;
ALTER TABLE expenses ALTER COLUMN year SET NOT NULL;
ALTER TABLE expenses
  ADD CONSTRAINT expenses_year_fk FOREIGN KEY (year) REFERENCES years(year);
CREATE INDEX expenses_year_idx ON expenses (year);

-- 4. settings: drop id=1 singleton, year becomes PK
ALTER TABLE settings ADD COLUMN year INTEGER;
UPDATE settings SET year = 2026 WHERE id = 1;
ALTER TABLE settings ALTER COLUMN year SET NOT NULL;
ALTER TABLE settings DROP CONSTRAINT settings_pkey;
ALTER TABLE settings ADD PRIMARY KEY (year);
ALTER TABLE settings DROP COLUMN id;
ALTER TABLE settings
  ADD CONSTRAINT settings_year_fk FOREIGN KEY (year) REFERENCES years(year);

COMMIT;

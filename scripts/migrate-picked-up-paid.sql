-- Rename status PICKED_UP_PAID -> PICKED_UP after decoupling pickup from payment.
-- "Paid" is now expressed by the paid_to column, not by the status itself, so
-- existing PICKED_UP_PAID rows (which all have paid_to set already) collapse
-- cleanly into PICKED_UP without losing information.
--
-- Run once per environment: psql "$DATABASE_URL" -f scripts/migrate-picked-up-paid.sql
-- Verify with: SELECT status, COUNT(*) FROM reservations GROUP BY status;
UPDATE reservations SET status = 'PICKED_UP' WHERE status = 'PICKED_UP_PAID';

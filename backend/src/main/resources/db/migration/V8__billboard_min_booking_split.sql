-- Minimum booking duration: split the single free-text `min_booking` column into the value and
-- unit the owner picked, plus a normalized duration in days (Days = 1, Weeks = 7, Months = 30) so
-- availability/pricing math can compare listings on one scale.

-- 1. Add the split + normalized columns (nullable while we backfill).
ALTER TABLE billboard_listings ADD COLUMN min_booking_value INTEGER;
ALTER TABLE billboard_listings ADD COLUMN min_booking_unit  VARCHAR(20);
ALTER TABLE billboard_listings ADD COLUMN min_booking_days  INTEGER;

-- 2. Backfill value + unit from the legacy free text (the fixed dropdown values and labels).
UPDATE billboard_listings SET
    min_booking_value = CASE
        WHEN min_booking IN ('1week', '1 Week', '1month', '1 Month (4 Weeks)', '1 Month', '1 month') THEN 1
        WHEN min_booking IN ('2weeks', '2 Weeks', '2months', '2 Months (8 Weeks)', '2 Months') THEN 2
        WHEN min_booking IN ('3weeks', '3 Weeks', '3months', '3 Months') THEN 3
        ELSE 1
    END,
    min_booking_unit = CASE
        WHEN min_booking IN ('1week', '1 Week', '2weeks', '2 Weeks', '3weeks', '3 Weeks') THEN 'WEEKS'
        ELSE 'MONTHS'
    END;

-- 3. Normalize to days.
UPDATE billboard_listings SET min_booking_days = min_booking_value * CASE min_booking_unit
    WHEN 'DAYS'   THEN 1
    WHEN 'WEEKS'  THEN 7
    WHEN 'MONTHS' THEN 30
    ELSE 30
END;

-- 4. Enforce NOT NULL now that every row is populated.
ALTER TABLE billboard_listings ALTER COLUMN min_booking_value SET NOT NULL;
ALTER TABLE billboard_listings ALTER COLUMN min_booking_unit  SET NOT NULL;
ALTER TABLE billboard_listings ALTER COLUMN min_booking_days  SET NOT NULL;

-- 5. Drop the legacy free-text column.
ALTER TABLE billboard_listings DROP COLUMN min_booking;

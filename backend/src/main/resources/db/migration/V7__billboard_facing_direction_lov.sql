-- Static LOV: billboard facing direction moves from free text to a fixed catalogue of the eight
-- compass points (see the FacingDirection enum). Rows now store the enum code (e.g. NORTH_EAST).

-- 1. Backfill existing rows. Matching is done on a normalized value (uppercased, with spaces,
--    hyphens and underscores removed) so casing and separator variants of the legacy labels and
--    codes all map correctly (e.g. 'North-East', 'north east', 'NORTH_EAST' -> NORTH_EAST).
UPDATE billboard_listings SET facing =
    CASE UPPER(REPLACE(REPLACE(REPLACE(facing, '-', ''), ' ', ''), '_', ''))
        WHEN 'NORTH'     THEN 'NORTH'
        WHEN 'NORTHEAST' THEN 'NORTH_EAST'
        WHEN 'EAST'      THEN 'EAST'
        WHEN 'SOUTHEAST' THEN 'SOUTH_EAST'
        WHEN 'SOUTH'     THEN 'SOUTH'
        WHEN 'SOUTHWEST' THEN 'SOUTH_WEST'
        WHEN 'WEST'      THEN 'WEST'
        WHEN 'NORTHWEST' THEN 'NORTH_WEST'
        ELSE facing
    END;

-- 2. Since facing is NOT NULL with no OTHER catch-all, any value that still is not a valid code
--    (a typo or empty string in legacy free-text data) would fail to parse into the FacingDirection
--    enum and 500 on read. Default those to NORTH so every row remains a valid, readable enum value.
UPDATE billboard_listings SET facing = 'NORTH'
WHERE facing NOT IN ('NORTH','NORTH_EAST','EAST','SOUTH_EAST','SOUTH','SOUTH_WEST','WEST','NORTH_WEST');

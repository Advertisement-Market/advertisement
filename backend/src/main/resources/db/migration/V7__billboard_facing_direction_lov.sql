-- Static LOV: billboard facing direction moves from free text to a fixed catalogue of the eight
-- compass points (see the FacingDirection enum). Rows now store the enum code (e.g. NORTH_EAST).

-- Backfill existing rows: map the legacy display labels to their canonical codes.
UPDATE billboard_listings SET facing = CASE facing
    WHEN 'North'      THEN 'NORTH'
    WHEN 'North-East' THEN 'NORTH_EAST'
    WHEN 'East'       THEN 'EAST'
    WHEN 'South-East' THEN 'SOUTH_EAST'
    WHEN 'South'      THEN 'SOUTH'
    WHEN 'South-West' THEN 'SOUTH_WEST'
    WHEN 'West'       THEN 'WEST'
    WHEN 'North-West' THEN 'NORTH_WEST'
    ELSE facing
END;

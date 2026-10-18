-- Config-driven billboard LOVs: billboard type, traffic type and audience type move from
-- free text to a fixed catalogue of codes (see the LovType enums). Rows now store the enum code
-- (e.g. STATIC_HOARDING); a companion *_other column captures the free text for the OTHER code.

-- 1. Companion free-text columns (populated only when the matching value is OTHER).
ALTER TABLE billboard_listings ADD COLUMN type_other          VARCHAR(120);
ALTER TABLE billboard_listings ADD COLUMN traffic_type_other  VARCHAR(120);
ALTER TABLE billboard_listings ADD COLUMN audience_type_other VARCHAR(120);

-- 2. Backfill existing rows: map the legacy display labels to their canonical codes. Matching is
--    done on TRIM(LOWER(...)) so casing and stray surrounding whitespace do not cause a miss.
UPDATE billboard_listings SET type = CASE TRIM(LOWER(type))
    WHEN 'static hoarding' THEN 'STATIC_HOARDING'
    WHEN 'led digital'     THEN 'LED_DIGITAL'
    WHEN 'unipole'         THEN 'UNIPOLE'
    WHEN 'gantry'          THEN 'GANTRY'
    WHEN 'bus shelter'     THEN 'BUS_SHELTER'
    WHEN 'kiosk'           THEN 'KIOSK'
    WHEN 'digital screen'  THEN 'DIGITAL_SCREEN'
    ELSE type
END;

UPDATE billboard_listings SET traffic_type = CASE TRIM(LOWER(traffic_type))
    WHEN 'city / urban'     THEN 'CITY_URBAN'
    WHEN 'highway'          THEN 'HIGHWAY'
    WHEN 'commercial zone'  THEN 'COMMERCIAL_ZONE'
    WHEN 'residential area' THEN 'RESIDENTIAL_AREA'
    WHEN 'industrial'       THEN 'INDUSTRIAL'
    ELSE traffic_type
END;

UPDATE billboard_listings SET audience_type = CASE TRIM(LOWER(audience_type))
    WHEN 'it crowd / tech professionals' THEN 'IT_TECH_PROFESSIONALS'
    WHEN 'commuters'                     THEN 'COMMUTERS'
    WHEN 'highway travelers'             THEN 'HIGHWAY_TRAVELERS'
    WHEN 'local residents'               THEN 'LOCAL_RESIDENTS'
    WHEN 'shoppers'                      THEN 'SHOPPERS'
    WHEN 'students'                      THEN 'STUDENTS'
    WHEN 'mixed'                         THEN 'MIXED'
    ELSE audience_type
END;

-- 3. Anything still not a known code was a free-text ("Other") entry: preserve it in the
--    companion column and set the value to OTHER so the data validates against the enum.
--    NOTE: the code lists below mirror the enum constants and must stay in sync with their source
--    of truth -- lov/BillboardType.java, lov/TrafficType.java, lov/AudienceType.java. This is a
--    one-off backfill for legacy rows; new rows are validated against the enums by the application,
--    so the lists are not re-read after this migration runs.
UPDATE billboard_listings
SET type_other = type, type = 'OTHER'
WHERE type NOT IN ('STATIC_HOARDING','LED_DIGITAL','UNIPOLE','GANTRY','BUS_SHELTER','KIOSK','DIGITAL_SCREEN','OTHER');

UPDATE billboard_listings
SET traffic_type_other = traffic_type, traffic_type = 'OTHER'
WHERE traffic_type NOT IN ('CITY_URBAN','HIGHWAY','COMMERCIAL_ZONE','RESIDENTIAL_AREA','INDUSTRIAL','OTHER');

UPDATE billboard_listings
SET audience_type_other = audience_type, audience_type = 'OTHER'
WHERE audience_type NOT IN ('IT_TECH_PROFESSIONALS','COMMUTERS','HIGHWAY_TRAVELERS','LOCAL_RESIDENTS','SHOPPERS','STUDENTS','MIXED','OTHER');

-- 4. Sanity check (run manually after the migration): each query should return 0 rows, confirming
--    every listing now holds a valid catalogue code.
--    SELECT COUNT(*) FROM billboard_listings
--      WHERE type NOT IN ('STATIC_HOARDING','LED_DIGITAL','UNIPOLE','GANTRY','BUS_SHELTER','KIOSK','DIGITAL_SCREEN','OTHER');
--    SELECT COUNT(*) FROM billboard_listings
--      WHERE traffic_type NOT IN ('CITY_URBAN','HIGHWAY','COMMERCIAL_ZONE','RESIDENTIAL_AREA','INDUSTRIAL','OTHER');
--    SELECT COUNT(*) FROM billboard_listings
--      WHERE audience_type NOT IN ('IT_TECH_PROFESSIONALS','COMMUTERS','HIGHWAY_TRAVELERS','LOCAL_RESIDENTS','SHOPPERS','STUDENTS','MIXED','OTHER');

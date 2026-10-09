-- Map location selector: store the geographic coordinates the owner picks for a billboard.
-- Both columns are nullable (coordinates are optional); DECIMAL(9,6) gives ~0.11 m precision and
-- comfortably covers latitude [-90, 90] and longitude [-180, 180].
ALTER TABLE billboard_listings ADD COLUMN latitude  DECIMAL(9, 6);
ALTER TABLE billboard_listings ADD COLUMN longitude DECIMAL(9, 6);

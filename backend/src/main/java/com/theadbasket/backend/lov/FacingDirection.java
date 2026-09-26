package com.theadbasket.backend.lov;

/**
 * Static list of compass directions a billboard can face.
 *
 * <p>Unlike the config-driven billboard LOVs ({@link BillboardType} etc.), this is a <b>static</b>
 * LOV: the eight compass points never change, so their display labels are baked into the enum rather
 * than resolved from {@code messages.properties}. Constants are the codes persisted on
 * {@code billboard_listings.facing}.
 */
public enum FacingDirection {

    NORTH("North"),
    NORTH_EAST("North-East"),
    EAST("East"),
    SOUTH_EAST("South-East"),
    SOUTH("South"),
    SOUTH_WEST("South-West"),
    WEST("West"),
    NORTH_WEST("North-West");

    private final String label;

    FacingDirection(String label) {
        this.label = label;
    }

    /** Stable code stored and returned by the API (the enum constant name). */
    public String code() {
        return name();
    }

    /** Fixed display label for the dropdown. */
    public String label() {
        return label;
    }
}

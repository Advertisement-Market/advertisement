package com.theadbasket.backend.lov;

/**
 * Config-driven list of billboard structure types.
 *
 * <p>Constants are the canonical codes persisted on {@code billboard_listings.type}; their display
 * labels live in {@code messages.properties} under {@code lov.billboardType.*}. {@link #OTHER} is a
 * catch-all whose free-text description is captured separately (see
 * {@code billboard_listings.type_other}).
 */
public enum BillboardType implements LovType {

    STATIC_HOARDING,
    LED_DIGITAL,
    UNIPOLE,
    GANTRY,
    BUS_SHELTER,
    KIOSK,
    DIGITAL_SCREEN,
    OTHER;

    @Override
    public String code() {
        return name();
    }

    @Override
    public String messageKey() {
        return "lov.billboardType." + name();
    }
}

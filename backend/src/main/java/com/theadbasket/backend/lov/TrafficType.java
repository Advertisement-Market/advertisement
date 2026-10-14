package com.theadbasket.backend.lov;

/**
 * Config-driven list of the traffic profile around a billboard.
 *
 * <p>Constants are the canonical codes persisted on {@code billboard_listings.traffic_type}; labels
 * live in {@code messages.properties} under {@code lov.trafficType.*}. {@link #OTHER} captures its
 * free-text description in {@code billboard_listings.traffic_type_other}.
 */
public enum TrafficType implements LovType {

    CITY_URBAN,
    HIGHWAY,
    COMMERCIAL_ZONE,
    RESIDENTIAL_AREA,
    INDUSTRIAL,
    OTHER;

    @Override
    public String code() {
        return name();
    }

    @Override
    public String messageKey() {
        return "lov.trafficType." + name();
    }
}

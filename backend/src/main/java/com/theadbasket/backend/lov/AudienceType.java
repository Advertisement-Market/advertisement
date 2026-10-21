package com.theadbasket.backend.lov;

/**
 * Config-driven list of the primary audience a billboard reaches.
 *
 * <p>Constants are the canonical codes persisted on {@code billboard_listings.audience_type}; labels
 * live in {@code messages.properties} under {@code lov.audienceType.*}. {@link #OTHER} captures its
 * free-text description in {@code billboard_listings.audience_type_other}.
 */
public enum AudienceType implements LovType {

    IT_TECH_PROFESSIONALS,
    COMMUTERS,
    HIGHWAY_TRAVELERS,
    LOCAL_RESIDENTS,
    SHOPPERS,
    STUDENTS,
    MIXED,
    OTHER;

    @Override
    public String code() {
        return name();
    }

    @Override
    public String messageKey() {
        return "lov.audienceType." + name();
    }
}

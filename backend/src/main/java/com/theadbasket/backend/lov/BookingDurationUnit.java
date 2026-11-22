package com.theadbasket.backend.lov;

/**
 * Unit a minimum-booking duration is expressed in.
 *
 * <p>A static LOV (like {@link FacingDirection}): the set is fixed and each constant carries its
 * conversion factor to days, so a duration can be normalized to a single comparable
 * {@code days} value. A month is treated as a flat 30 days.
 */
public enum BookingDurationUnit {

    DAYS("Days", 1, 1000),
    WEEKS("Weeks", 7, 1000),
    MONTHS("Months", 30, 1000),
    YEARS("Years", 365, 100);

    /** Maximum allowed minimum-booking value across the application for backward-compatible @Max validation. */
    public static final int MAX_VALUE = 1000;

    private final String label;
    private final int daysPerUnit;
    private final int maxDurationValue;

    BookingDurationUnit(String label, int daysPerUnit, int maxDurationValue) {
        this.label = label;
        this.daysPerUnit = daysPerUnit;
        this.maxDurationValue = maxDurationValue;
    }

    /** Stable code stored and returned by the API (the enum constant name). */
    public String code() {
        return name();
    }

    /** Fixed display label for the dropdown. */
    public String label() {
        return label;
    }

    /** Number of days one unit represents (Days = 1, Weeks = 7, Months = 30, Years = 365). */
    public int daysPerUnit() {
        return daysPerUnit;
    }

    /** Maximum allowed value when expressed in this specific duration unit. */
    public int maxDurationValue() {
        return maxDurationValue;
    }

    /** Pure domain validation check for a duration value in this unit. */
    public boolean isValidDurationValue(int value) {
        return value > 0 && value <= maxDurationValue;
    }

    /** Normalize {@code value} of this unit to a total number of days. */
    public int toDays(int value) {
        return Math.multiplyExact(value, daysPerUnit);
    }
}

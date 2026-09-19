package com.theadbasket.backend.lov;

/**
 * Unit a minimum-booking duration is expressed in.
 *
 * <p>A static LOV (like {@link FacingDirection}): the set is fixed and each constant carries its
 * conversion factor to days, so a duration can be normalized to a single comparable
 * {@code days} value. A month is treated as a flat 30 days.
 */
public enum BookingDurationUnit {

    DAYS("Days", 1),
    WEEKS("Weeks", 7),
    MONTHS("Months", 30);

    private final String label;
    private final int daysPerUnit;

    BookingDurationUnit(String label, int daysPerUnit) {
        this.label = label;
        this.daysPerUnit = daysPerUnit;
    }

    /** Stable code stored and returned by the API (the enum constant name). */
    public String code() {
        return name();
    }

    /** Fixed display label for the dropdown. */
    public String label() {
        return label;
    }

    /** Number of days one unit represents (Days = 1, Weeks = 7, Months = 30). */
    public int daysPerUnit() {
        return daysPerUnit;
    }

    /** Normalize {@code value} of this unit to a total number of days. */
    public int toDays(int value) {
        return value * daysPerUnit;
    }
}

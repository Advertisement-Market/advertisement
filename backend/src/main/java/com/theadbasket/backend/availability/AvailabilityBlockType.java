package com.theadbasket.backend.availability;

/**
 * Domain block types representing calendar availability states.
 * <ul>
 *   <li>{@code OWNER_BLOCKED} - Range explicitly blocked by the listing owner (e.g. maintenance, offline).</li>
 *   <li>{@code BOOKING_HOLD} - Temporary checkout reservation hold created by an advertiser.</li>
 *   <li>{@code CONFIRMED_BOOKING} - Paid billboard reservation campaign.</li>
 * </ul>
 */
public enum AvailabilityBlockType {
    OWNER_BLOCKED,
    BOOKING_HOLD,
    CONFIRMED_BOOKING
}



package com.theadbasket.backend.lov;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class BookingDurationUnitTest {

    @Test
    @DisplayName("Years unit converts accurately to days: 1 year = 365 days, 2 years = 730 days, 10 years = 3650 days")
    void yearsUnit_convertsToDays() {
        assertThat(BookingDurationUnit.YEARS.toDays(1)).isEqualTo(365);
        assertThat(BookingDurationUnit.YEARS.toDays(2)).isEqualTo(730);
        assertThat(BookingDurationUnit.YEARS.toDays(10)).isEqualTo(3650);
    }

    @Test
    @DisplayName("Pure conversion with Math.multiplyExact across all units")
    void pureConversion_acrossAllUnits() {
        assertThat(BookingDurationUnit.DAYS.toDays(7)).isEqualTo(7);
        assertThat(BookingDurationUnit.WEEKS.toDays(4)).isEqualTo(28);
        assertThat(BookingDurationUnit.MONTHS.toDays(3)).isEqualTo(90);
        assertThat(BookingDurationUnit.YEARS.toDays(1)).isEqualTo(365);
    }

    @Test
    @DisplayName("isValidDurationValue enforces per-unit maximum caps")
    void isValidDurationValue_enforcesCaps() {
        // DAYS: max 1000
        assertThat(BookingDurationUnit.DAYS.isValidDurationValue(1)).isTrue();
        assertThat(BookingDurationUnit.DAYS.isValidDurationValue(1000)).isTrue();
        assertThat(BookingDurationUnit.DAYS.isValidDurationValue(1001)).isFalse();

        // WEEKS: max 1000
        assertThat(BookingDurationUnit.WEEKS.isValidDurationValue(1)).isTrue();
        assertThat(BookingDurationUnit.WEEKS.isValidDurationValue(1000)).isTrue();
        assertThat(BookingDurationUnit.WEEKS.isValidDurationValue(1001)).isFalse();

        // MONTHS: max 1000
        assertThat(BookingDurationUnit.MONTHS.isValidDurationValue(1)).isTrue();
        assertThat(BookingDurationUnit.MONTHS.isValidDurationValue(1000)).isTrue();
        assertThat(BookingDurationUnit.MONTHS.isValidDurationValue(1001)).isFalse();

        // YEARS: max 100
        assertThat(BookingDurationUnit.YEARS.isValidDurationValue(1)).isTrue();
        assertThat(BookingDurationUnit.YEARS.isValidDurationValue(100)).isTrue();
        assertThat(BookingDurationUnit.YEARS.isValidDurationValue(101)).isFalse();

        // Zero and negative are invalid
        assertThat(BookingDurationUnit.DAYS.isValidDurationValue(0)).isFalse();
        assertThat(BookingDurationUnit.DAYS.isValidDurationValue(-5)).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"years", "Years", "YEARS", "yEArS"})
    @DisplayName("LovService parses 'years' unit case-insensitively")
    void parseBookingDurationUnit_caseInsensitiveYears(String input) {
        LovService lovService = new LovService(null);
        assertThat(lovService.parseBookingDurationUnit(input)).isEqualTo(BookingDurationUnit.YEARS);
    }
}

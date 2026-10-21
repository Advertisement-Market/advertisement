package com.theadbasket.backend.lov;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;

import java.util.List;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;

/**
 * Unit tests for {@link LovService}: labels come from the real {@code messages.properties},
 * parsing accepts either code or label, and unknown values are rejected.
 */
class LovServiceTest {

    private LovService lovService;

    @BeforeEach
    void setUp() {
        ResourceBundleMessageSource messages = new ResourceBundleMessageSource();
        messages.setBasename("messages");
        messages.setDefaultEncoding("UTF-8");
        messages.setUseCodeAsDefaultMessage(true);
        lovService = new LovService(messages);
    }

    /**
     * Cross-stack canonical parity test.
     * Mirrors the frontend canonical code list in:
     * frontend/src/pages/NewBillboardListing/NewBillboardListing.test.jsx
     * (and TYPE_OPTIONS in NewBillboardListing/steps.jsx and OwnerRegister/steps.jsx).
     * Any change or typo here must match BillboardType enum exactly via valueOf().
     */
    @Test
    void frontendCanonicalCodes_matchBillboardTypeEnumExactValueOf() {
        List<String> frontendCodes = List.of(
                "STATIC_HOARDING",
                "LED_DIGITAL",
                "UNIPOLE",
                "GANTRY",
                "BUS_SHELTER",
                "KIOSK",
                "DIGITAL_SCREEN",
                "OTHER"
        );

        // Every code must resolve strictly via BillboardType.valueOf(code) (exact enum constant match, not parse())
        for (String code : frontendCodes) {
            BillboardType type = BillboardType.valueOf(code);
            assertThat(type).isNotNull();
            assertThat(type.name()).isEqualTo(code);
        }

        // Strict bidirectional parity: enum must not have more or fewer constants than frontend options
        assertThat(BillboardType.values()).hasSize(frontendCodes.size());
    }

    @Test
    void billboardTypes_exposeCodeAndConfigLabel() {
        assertThat(lovService.billboardTypes())
                .hasSize(BillboardType.values().length)
                .contains(new LovOption("STATIC_HOARDING", "Static Hoarding"))
                .contains(new LovOption("LED_DIGITAL", "LED Digital"))
                .contains(new LovOption("OTHER", "Other"));
    }

    @Test
    void trafficAndAudienceLists_resolveLabels() {
        assertThat(lovService.trafficTypes()).contains(new LovOption("CITY_URBAN", "City / Urban"));
        assertThat(lovService.audienceTypes())
                .contains(new LovOption("IT_TECH_PROFESSIONALS", "IT Crowd / Tech Professionals"));
    }

    @Test
    void facingDirections_areStatic_withBakedLabels() {
        assertThat(lovService.facingDirections())
                .hasSize(FacingDirection.values().length)
                .startsWith(new LovOption("NORTH", "North"))
                .contains(new LovOption("NORTH_EAST", "North-East"))
                .contains(new LovOption("SOUTH_WEST", "South-West"));
    }

    @Test
    void parseFacing_acceptsCodeOrLabel_andRejectsUnknown() {
        assertThat(lovService.parseFacing("north_east")).isEqualTo(FacingDirection.NORTH_EAST);
        assertThat(lovService.parseFacing("South-West")).isEqualTo(FacingDirection.SOUTH_WEST);
        assertThatThrownBy(() -> lovService.parseFacing("Upwards"))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_FACING_DIRECTION);
        assertThatThrownBy(() -> lovService.parseFacing("  "))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void bookingDurationUnits_areStatic_withBakedLabels() {
        assertThat(lovService.bookingDurationUnits())
                .containsExactly(
                        new LovOption("DAYS", "Days"),
                        new LovOption("WEEKS", "Weeks"),
                        new LovOption("MONTHS", "Months"));
    }

    @Test
    void parseBookingDurationUnit_acceptsCodeOrLabel_andRejectsUnknown() {
        assertThat(lovService.parseBookingDurationUnit("weeks")).isEqualTo(BookingDurationUnit.WEEKS);
        assertThat(lovService.parseBookingDurationUnit("Months")).isEqualTo(BookingDurationUnit.MONTHS);
        assertThatThrownBy(() -> lovService.parseBookingDurationUnit("Fortnights"))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_BOOKING_DURATION_UNIT);
    }

    @Test
    void bookingDurationUnit_normalizesToDays_monthIs30() {
        assertThat(BookingDurationUnit.DAYS.toDays(5)).isEqualTo(5);
        assertThat(BookingDurationUnit.WEEKS.toDays(2)).isEqualTo(14);
        assertThat(BookingDurationUnit.MONTHS.toDays(2)).isEqualTo(60);
    }

    @Test
    void parse_acceptsCode_caseInsensitive() {
        assertThat(lovService.parse(BillboardType.class, "static_hoarding", ErrorCode.INVALID_BILLBOARD_TYPE))
                .isEqualTo(BillboardType.STATIC_HOARDING);
    }

    @Test
    void parse_acceptsConfigLabel() {
        assertThat(lovService.parse(TrafficType.class, "City / Urban", ErrorCode.INVALID_TRAFFIC_TYPE))
                .isEqualTo(TrafficType.CITY_URBAN);
        assertThat(lovService.parse(AudienceType.class, "  Commuters  ", ErrorCode.INVALID_AUDIENCE_TYPE))
                .isEqualTo(AudienceType.COMMUTERS);
    }

    @Test
    void parse_rejectsUnknownValue_withGivenErrorCode() {
        assertThatThrownBy(() ->
                lovService.parse(AudienceType.class, "Corporate", ErrorCode.INVALID_AUDIENCE_TYPE))
                .isInstanceOf(BadRequestException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.INVALID_AUDIENCE_TYPE);
    }

    @Test
    void parse_rejectsBlankOrNull() {
        assertThatThrownBy(() ->
                lovService.parse(BillboardType.class, "   ", ErrorCode.INVALID_BILLBOARD_TYPE))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() ->
                lovService.parse(BillboardType.class, null, ErrorCode.INVALID_BILLBOARD_TYPE))
                .isInstanceOf(BadRequestException.class);
    }
}

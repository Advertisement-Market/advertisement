package com.theadbasket.backend.owner.dto;

import java.math.BigDecimal;
import java.util.List;

import com.theadbasket.backend.availability.AvailabilityDateValidator;
import com.theadbasket.backend.availability.dto.AvailabilityRangeRequest;
import com.theadbasket.backend.common.validation.BillboardLovPayload;
import com.theadbasket.backend.common.validation.RequiredOtherText;
import com.theadbasket.backend.common.validation.SanitizeText;
import com.theadbasket.backend.common.validation.ValidationPatterns;
import com.theadbasket.backend.lov.BookingDurationUnit;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating a new billboard inventory listing.
 */
@RequiredOtherText
public record BillboardListingCreateRequest(
        @SanitizeText
        @NotBlank(message = "Billboard name is required.")
        @Size(max = 150)
        String name,

        // ── Billboard address ──
        @SanitizeText
        @NotBlank(message = "Address line 1 is required.")
        @Size(max = 300)
        String addressLine1,

        @SanitizeText
        @Size(max = 300)
        String addressLine2,

        @SanitizeText
        @Size(max = 200)
        String landmark,

        @SanitizeText
        @NotBlank(message = "City is required.")
        @Size(max = 100)
        String city,

        @SanitizeText
        @NotBlank(message = "State is required.")
        @Size(max = 100)
        String state,

        @SanitizeText
        @NotBlank(message = "PIN code is required.")
        @Pattern(regexp = ValidationPatterns.PINCODE, message = ValidationPatterns.PINCODE_MESSAGE)
        String pincode,

        @SanitizeText
        @NotBlank(message = "Billboard type is required.")
        @Size(max = 60)
        String type,

        @SanitizeText
        @Size(max = 120)
        String typeOther,

        @NotNull(message = "Width is required.")
        @Positive(message = "Width must be positive.")
        BigDecimal widthFt,

        @NotNull(message = "Height is required.")
        @Positive(message = "Height must be positive.")
        BigDecimal heightFt,

        @PositiveOrZero(message = "Ground height must be positive or zero.")
        @DecimalMax(value = "300", message = "Ground height must be at most 300 ft.")
        @Digits(integer = 3, fraction = 2, message = "Ground height must have at most 3 integer digits and 2 decimal places.")
        BigDecimal groundHeightFt,

        @SanitizeText
        @NotBlank(message = "Facing direction is required.")
        @Size(max = 60)
        String facing,

        @SanitizeText
        @NotBlank(message = "Traffic type is required.")
        @Size(max = 80)
        String trafficType,

        @SanitizeText
        @Size(max = 120)
        String trafficTypeOther,

        @SanitizeText
        @NotBlank(message = "Audience type is required.")
        @Size(max = 120)
        String audienceType,

        @SanitizeText
        @Size(max = 120)
        String audienceTypeOther,

        @SanitizeText
        @Size(max = 60)
        String footfall,

        @NotNull(message = "Starting price is required.")
        @Positive(message = "Starting price must be positive.")
        BigDecimal startPrice,

        @NotNull(message = "Minimum booking duration is required.")
        @Positive(message = "Minimum booking duration must be a positive number.")
        @Max(value = BookingDurationUnit.MAX_VALUE, message = "Minimum booking duration is too large.")
        Integer minBookingValue,

        @SanitizeText
        @NotBlank(message = "Minimum booking duration unit is required.")
        @Size(max = 20)
        String minBookingUnit,

        @SanitizeText
        @Size(max = 500)
        String discountNote,

        @Size(max = AvailabilityDateValidator.MAX_BULK_RANGES, message = "Too many blocked date ranges.")
        List<@NotNull(message = "Blocked range entry is required.") @Valid AvailabilityRangeRequest> blockedRanges
) implements BillboardLovPayload {

    public BillboardListingCreateRequest(
            String name,
            String addressLine1,
            String addressLine2,
            String landmark,
            String city,
            String state,
            String pincode,
            String type,
            String typeOther,
            BigDecimal widthFt,
            BigDecimal heightFt,
            BigDecimal groundHeightFt,
            String facing,
            String trafficType,
            String trafficTypeOther,
            String audienceType,
            String audienceTypeOther,
            String footfall,
            BigDecimal startPrice,
            Integer minBookingValue,
            String minBookingUnit,
            String discountNote) {
        this(name, addressLine1, addressLine2, landmark, city, state, pincode,
                type, typeOther, widthFt, heightFt, groundHeightFt, facing,
                trafficType, trafficTypeOther, audienceType, audienceTypeOther,
                footfall, startPrice, minBookingValue, minBookingUnit, discountNote, null);
    }
}


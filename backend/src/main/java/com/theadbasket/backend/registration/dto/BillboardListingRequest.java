package com.theadbasket.backend.registration.dto;

import java.math.BigDecimal;
import java.util.List;

import com.theadbasket.backend.availability.AvailabilityDateValidator;
import com.theadbasket.backend.availability.dto.AvailabilityRangeRequest;
import com.theadbasket.backend.common.validation.BillboardLovPayload;
import com.theadbasket.backend.common.validation.RequiredOtherText;
import com.theadbasket.backend.common.validation.SanitizeText;
import com.theadbasket.backend.common.validation.ValidationPatterns;

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
 * The owner's first billboard listing, captured during registration.
 */
@RequiredOtherText
public record BillboardListingRequest(
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
        // Free-text description, used only when `type` is OTHER.
        @SanitizeText
        @Size(max = 120)
        String typeOther,
        @NotNull(message = "Width is required.")
        @Positive
        BigDecimal widthFt,
        @NotNull(message = "Height is required.")
        @Positive
        BigDecimal heightFt,
        @PositiveOrZero
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
        // Free-text description, used only when `trafficType` is OTHER.
        @SanitizeText
        @Size(max = 120)
        String trafficTypeOther,
        @SanitizeText
        @NotBlank(message = "Audience type is required.")
        @Size(max = 120)
        String audienceType,
        // Free-text description, used only when `audienceType` is OTHER.
        @SanitizeText
        @Size(max = 120)
        String audienceTypeOther,
        @SanitizeText
        @Size(max = 60)
        String footfall,
        @NotNull(message = "Starting price is required.")
        @Positive
        BigDecimal startPrice,
        @NotNull(message = "Minimum booking duration is required.")
        @Positive(message = "Minimum booking duration must be a positive number.")
        @Max(value = com.theadbasket.backend.lov.BookingDurationUnit.MAX_VALUE, message = "Minimum booking duration is too large.")
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

    public BillboardListingRequest(
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


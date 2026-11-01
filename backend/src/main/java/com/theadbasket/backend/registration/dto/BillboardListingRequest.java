package com.theadbasket.backend.registration.dto;

import java.math.BigDecimal;

import com.theadbasket.backend.common.validation.BillboardLovPayload;
import com.theadbasket.backend.common.validation.RequiredOtherText;
import com.theadbasket.backend.common.validation.SanitizeText;
import com.theadbasket.backend.common.validation.ValidationPatterns;

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
        @Pattern(regexp = ValidationPatterns.PINCODE, message = "Enter a valid 6-digit PIN code.")
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
        String discountNote
) implements BillboardLovPayload {
}


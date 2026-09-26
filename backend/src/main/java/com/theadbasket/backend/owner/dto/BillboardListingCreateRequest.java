package com.theadbasket.backend.owner.dto;

import java.math.BigDecimal;

import com.theadbasket.backend.common.validation.ValidationPatterns;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating a new billboard inventory listing.
 */
public record BillboardListingCreateRequest(
        @NotBlank(message = "Billboard name is required.")
        @Size(max = 150)
        String name,

        // ── Billboard address ──
        @NotBlank(message = "Address line 1 is required.")
        @Size(max = 300)
        String addressLine1,

        @Size(max = 300)
        String addressLine2,

        @Size(max = 200)
        String landmark,

        @NotBlank(message = "City is required.")
        @Size(max = 100)
        String city,

        @NotBlank(message = "State is required.")
        @Size(max = 100)
        String state,

        @NotBlank(message = "PIN code is required.")
        @Pattern(regexp = ValidationPatterns.PINCODE, message = "Enter a valid 6-digit PIN code.")
        String pincode,

        @NotBlank(message = "Billboard type is required.")
        @Size(max = 60)
        String type,

        @Size(max = 120)
        String typeOther,

        @NotNull(message = "Width is required.")
        @Positive(message = "Width must be positive.")
        BigDecimal widthFt,

        @NotNull(message = "Height is required.")
        @Positive(message = "Height must be positive.")
        BigDecimal heightFt,

        @PositiveOrZero(message = "Ground height must be positive or zero.")
        BigDecimal groundHeightFt,

        @NotBlank(message = "Facing direction is required.")
        @Size(max = 60)
        String facing,

        @NotBlank(message = "Traffic type is required.")
        @Size(max = 80)
        String trafficType,

        @Size(max = 120)
        String trafficTypeOther,

        @NotBlank(message = "Audience type is required.")
        @Size(max = 120)
        String audienceType,

        @Size(max = 120)
        String audienceTypeOther,

        @Size(max = 60)
        String footfall,

        @NotNull(message = "Starting price is required.")
        @Positive(message = "Starting price must be positive.")
        BigDecimal startPrice,

        @NotNull(message = "Minimum booking duration is required.")
        @Positive(message = "Minimum booking duration must be a positive number.")
        Integer minBookingValue,

        @NotBlank(message = "Minimum booking duration unit is required.")
        @Size(max = 20)
        String minBookingUnit,

        @Size(max = 500)
        String discountNote
) {
}

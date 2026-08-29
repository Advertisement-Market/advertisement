package com.theadbasket.backend.registration.dto;

import java.math.BigDecimal;

import com.theadbasket.backend.common.validation.ValidationPatterns;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * The owner's first billboard listing, captured during registration.
 */
public record BillboardListingRequest(
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
        @NotNull(message = "Width is required.")
        @Positive
        BigDecimal widthFt,
        @NotNull(message = "Height is required.")
        @Positive
        BigDecimal heightFt,
        @PositiveOrZero
        BigDecimal groundHeightFt,
        @NotBlank(message = "Facing direction is required.")
        @Size(max = 60)
        String facing,
        @NotBlank(message = "Traffic type is required.")
        @Size(max = 80)
        String trafficType,
        @NotBlank(message = "Audience type is required.")
        @Size(max = 120)
        String audienceType,
        @Size(max = 60)
        String footfall,
        @NotNull(message = "Starting price is required.")
        @Positive
        BigDecimal startPrice,
        @NotBlank(message = "Minimum booking duration is required.")
        @Size(max = 50)
        String minBooking,
        @Size(max = 500)
        String discountNote
        ) {

}

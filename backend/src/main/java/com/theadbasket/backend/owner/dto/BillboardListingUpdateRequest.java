package com.theadbasket.backend.owner.dto;

import java.math.BigDecimal;

import com.theadbasket.backend.common.validation.ValidationPatterns;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Request payload for partial updates (PATCH) to an existing billboard listing.
 *
 * <p>Null/omitted fields are ignored (retaining their existing entity values).
 * Non-null fields must satisfy domain constraints; blank strings on non-nullable
 * fields fail bean validation with {@code 400 Bad Request}.
 */
public record BillboardListingUpdateRequest(
        @Size(max = 150)
        @Pattern(regexp = "^(?!\\s*$).+", message = "Billboard name cannot be blank.")
        String name,

        // ── Address fields ──
        @Size(max = 300)
        @Pattern(regexp = "^(?!\\s*$).+", message = "Address line 1 cannot be blank.")
        String addressLine1,

        @Size(max = 300)
        String addressLine2,

        @Size(max = 200)
        String landmark,

        @Size(max = 100)
        @Pattern(regexp = "^(?!\\s*$).+", message = "City cannot be blank.")
        String city,

        @Size(max = 100)
        @Pattern(regexp = "^(?!\\s*$).+", message = "State cannot be blank.")
        String state,

        @Pattern(regexp = ValidationPatterns.PINCODE, message = "Enter a valid 6-digit PIN code.")
        String pincode,

        @Size(max = 60)
        @Pattern(regexp = "^(?!\\s*$).+", message = "Billboard type cannot be blank.")
        String type,

        @Size(max = 120)
        String typeOther,

        @Positive(message = "Width must be positive.")
        BigDecimal widthFt,

        @Positive(message = "Height must be positive.")
        BigDecimal heightFt,

        @PositiveOrZero(message = "Ground height must be positive or zero.")
        BigDecimal groundHeightFt,

        @Size(max = 60)
        @Pattern(regexp = "^(?!\\s*$).+", message = "Facing direction cannot be blank.")
        String facing,

        @Size(max = 80)
        @Pattern(regexp = "^(?!\\s*$).+", message = "Traffic type cannot be blank.")
        String trafficType,

        @Size(max = 120)
        String trafficTypeOther,

        @Size(max = 120)
        @Pattern(regexp = "^(?!\\s*$).+", message = "Audience type cannot be blank.")
        String audienceType,

        @Size(max = 120)
        String audienceTypeOther,

        @Size(max = 60)
        String footfall,

        @Positive(message = "Starting price must be positive.")
        BigDecimal startPrice,

        @Positive(message = "Minimum booking duration must be a positive number.")
        Integer minBookingValue,

        @Size(max = 20)
        @Pattern(regexp = "^(?!\\s*$).+", message = "Minimum booking duration unit cannot be blank.")
        String minBookingUnit,

        @Size(max = 500)
        String discountNote
) {
}

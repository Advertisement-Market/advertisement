package com.theadbasket.backend.common.address;

import com.theadbasket.backend.common.validation.ValidationPatterns;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Shared address payload used by advertiser, owner, agency, and billboard
 * listing requests/responses. Kept as a single reusable shape rather than
 * per-entity duplicates.
 */
public record AddressDto(
        @NotBlank
        @Size(max = 300)

        String line1,
        @Size(max = 300)

        String line2,
        @Size(max = 200)

        String landmark,
        @NotBlank
        @Size(max = 100)

        String city,
        @NotBlank
        @Size(max = 100)

        String state,
        @NotBlank
        @Pattern(regexp = ValidationPatterns.PINCODE)
        String pincode
        ) {

}

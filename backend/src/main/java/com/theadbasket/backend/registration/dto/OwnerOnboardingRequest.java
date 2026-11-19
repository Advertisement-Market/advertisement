package com.theadbasket.backend.registration.dto;

import com.theadbasket.backend.common.validation.SanitizeText;
import com.theadbasket.backend.common.validation.ValidationPatterns;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Authenticated owner onboarding payload (MEMBER -> OWNER promotion).
 *
 * <p>Strictly omits {@code accountEmail} and {@code password}: identity is bound to the
 * authenticated JWT principal, and setting a local password on a Google account via a bearer token
 * alone is disallowed.
 */
public record OwnerOnboardingRequest(
        @SanitizeText
        @NotBlank(message = "First name is required.")
        @Size(max = 80)
        String firstName,
        @SanitizeText
        @NotBlank(message = "Last name is required.")
        @Size(max = 80)
        String lastName,
        // Used only when the signed-in account has no phone on file (e.g., Google accounts);
        // existing non-blank account phones are never overwritten during promotion.
        @NotBlank(message = "Phone number is required.")
        @Pattern(regexp = ValidationPatterns.PHONE, message = "Enter a valid phone number.")
        String phone,
        // ── Business ──
        @SanitizeText
        @NotBlank(message = "Company name is required.")
        @Size(max = 150)
        String companyName,
        @Pattern(regexp = ValidationPatterns.PHONE_OPTIONAL, message = "Enter a valid phone number.")
        String companyPhone,
        @SanitizeText
        @Size(max = 60)
        String companyRegNumber,
        @Pattern(regexp = ValidationPatterns.GST_OPTIONAL, message = "GST number must be 15 characters.")
        String gstNumber,
        // ── Business address ──
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
        @Size(max = 80)
        String tradeLicenseNo,
        @SanitizeText
        @Size(max = 60)
        String ownershipType,
        @SanitizeText
        @Size(max = 120)
        String regulatoryApprovals,
        // ── First billboard ──
        @NotNull(message = "Billboard details are required.")
        @Valid
        BillboardListingRequest billboard,
        @AssertTrue(message = "You must accept the Terms of Service.")
        boolean acceptedTerms
) {
}

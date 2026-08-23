package com.theadbasket.backend.registration.dto;

import com.theadbasket.backend.common.validation.ValidationPatterns;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Full owner registration: account + business + first billboard listing. */
public record OwnerRegistrationRequest(

        @NotBlank(message = "First name is required.")
        @Size(max = 80)
        String firstName,

        @NotBlank(message = "Last name is required.")
        @Size(max = 80)
        String lastName,

        @NotBlank(message = "Email is required.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 180)
        String accountEmail,

        @NotBlank(message = "Phone number is required.")
        @Pattern(regexp = ValidationPatterns.PHONE, message = "Enter a valid phone number.")
        String phone,

        // Password — required only for a brand-new (anonymous) account; ignored when an
        // already-signed-in account completes this wizard. Rules/length enforced in the service.
        @Size(max = 72, message = "Password must be at most 72 characters.")
        String password,

        // ── Business ──
        @NotBlank(message = "Company name is required.")
        @Size(max = 150)
        String companyName,

        @Pattern(regexp = ValidationPatterns.PHONE_OPTIONAL, message = "Enter a valid phone number.")
        String companyPhone,

        @Size(max = 60)
        String companyRegNumber,

        @Pattern(regexp = ValidationPatterns.GST_OPTIONAL, message = "GST number must be 15 characters.")
        String gstNumber,

        @NotBlank(message = "Address is required.")
        @Size(max = 300)
        String businessAddressLine1,

        @Size(max = 300)
        String businessAddressLine2,

        @NotBlank(message = "Office PIN code is required.")
        @Pattern(regexp = ValidationPatterns.PINCODE, message = "Enter a valid 6-digit PIN code.")
        String businessPincode,

        @Size(max = 80)
        String tradeLicenseNo,

        @Size(max = 60)
        String ownershipType,

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

package com.theadbasket.backend.registration.dto;

import java.util.List;

import com.theadbasket.backend.common.validation.SanitizeText;
import com.theadbasket.backend.common.validation.ValidationPatterns;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Full agency registration: account + agency profile + contact + services +
 * business.
 */
public record AgencyRegistrationRequest(
        // Login credentials — required only for a brand-new (anonymous) account; ignored when an
        // already-signed-in account completes this wizard. Rules/length enforced in the service.
        @Email(message = "Enter a valid email address.")
        @Size(max = 180)
        String accountEmail,
        @Size(max = 72, message = "Password must be at most 72 characters.")
        String password,
        // ── Agency ──
        @SanitizeText
        @NotBlank(message = "Agency name is required.")
        @Size(max = 150)
        String agencyName,
        @SanitizeText
        @NotBlank(message = "Agency type is required.")
        @Size(max = 80)
        String agencyType,
        @NotNull(message = "Year established is required.")
        Integer yearEstablished,
        @SanitizeText
        @NotBlank(message = "Years of experience is required.")
        @Size(max = 40)
        String yearsExperience,
        @SanitizeText
        @Size(max = 200)
        String tagline,
        @SanitizeText
        @Size(max = 2000)
        String about,
        @SanitizeText
        @Size(max = 255)
        String website,
        @SanitizeText
        @Size(max = 30)
        String contactNo,
        @SanitizeText
        @Size(max = 255)
        String linkedinUrl,
        // ── Headquarters address ──
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
        // ── Primary contact ──
        @SanitizeText
        @NotBlank(message = "First name is required.")
        @Size(max = 80)
        String firstName,
        @SanitizeText
        @NotBlank(message = "Last name is required.")
        @Size(max = 80)
        String lastName,
        @SanitizeText
        @NotBlank(message = "Designation is required.")
        @Size(max = 120)
        String contactDesignation,
        @NotBlank(message = "Business email is required.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 180)
        String contactEmail,
        @NotBlank(message = "Phone number is required.")
        @Pattern(regexp = ValidationPatterns.PHONE, message = "Enter a valid phone number.")
        String contactPhone,
        // ── Services & expertise ──
        @NotEmpty(message = "Select at least one service.")
        List<@NotBlank String> services,
        @NotEmpty(message = "Select at least one industry.")
        List<@NotBlank String> industries,
        List<@NotBlank String> expertiseTags,
        List<@NotBlank String> languages,
        // ── Business ──
        @SanitizeText
        @NotBlank(message = "Campaigns completed is required.")
        @Size(max = 40)
        String campaignsCompleted,
        @SanitizeText
        @NotBlank(message = "Pricing model is required.")
        @Size(max = 80)
        String pricingModel,
        @SanitizeText
        @NotBlank(message = "Geographic coverage is required.")
        @Size(max = 80)
        String geoCoverage,
        @SanitizeText
        @Size(max = 60)
        String minTenderBudget,
        @SanitizeText
        @Size(max = 300)
        String coverageCities,
        @SanitizeText
        @Size(max = 60)
        String regNumber,
        @Pattern(regexp = ValidationPatterns.GST_OPTIONAL, message = "GST number must be 15 characters.")
        String gstNumber,
        @Pattern(regexp = ValidationPatterns.PAN_OPTIONAL, message = "PAN must be 10 characters.")
        String panNumber,
        @SanitizeText
        @Size(max = 500)
        String keyClients,
        @Valid
        List<PortfolioItemRequest> portfolio,
        @AssertTrue(message = "You must accept the Terms of Service.")
        boolean acceptedTerms
        ) {
}




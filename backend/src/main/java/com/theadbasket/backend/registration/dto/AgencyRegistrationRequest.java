package com.theadbasket.backend.registration.dto;

import com.theadbasket.backend.common.validation.ValidationPatterns;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Full agency registration: account + agency profile + contact + services + business. */
public record AgencyRegistrationRequest(

        @NotBlank(message = "Login email is required.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 180)
        String loginEmail,

        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 72, message = "Password must be 8–72 characters.")
        String password,

        // ── Agency ──
        @NotBlank(message = "Agency name is required.")
        @Size(max = 150)
        String agencyName,

        @NotBlank(message = "Agency type is required.")
        @Size(max = 80)
        String agencyType,

        @NotNull(message = "Year established is required.")
        Integer yearEstablished,

        @NotBlank(message = "Years of experience is required.")
        @Size(max = 40)
        String yearsExperience,

        @Size(max = 200)
        String tagline,

        @Size(max = 2000)
        String about,

        @Size(max = 255)
        String website,

        @Size(max = 30)
        String landline,

        @Size(max = 255)
        String linkedinUrl,

        @NotBlank(message = "Headquarters PIN code is required.")
        @Pattern(regexp = ValidationPatterns.PINCODE, message = "Enter a valid 6-digit PIN code.")
        String headquartersPincode,

        @NotBlank(message = "Office address is required.")
        @Size(max = 500)
        String officeAddress,

        // ── Primary contact ──
        @NotBlank(message = "First name is required.")
        @Size(max = 80)
        String firstName,

        @NotBlank(message = "Last name is required.")
        @Size(max = 80)
        String lastName,

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
        @NotBlank(message = "Campaigns completed is required.")
        @Size(max = 40)
        String campaignsCompleted,

        @NotBlank(message = "Pricing model is required.")
        @Size(max = 80)
        String pricingModel,

        @NotBlank(message = "Geographic coverage is required.")
        @Size(max = 80)
        String geoCoverage,

        @Size(max = 60)
        String minTenderBudget,

        @Size(max = 300)
        String coverageCities,

        @Size(max = 60)
        String regNumber,

        @Pattern(regexp = ValidationPatterns.GST_OPTIONAL, message = "GST number must be 15 characters.")
        String gstNumber,

        @Pattern(regexp = ValidationPatterns.PAN_OPTIONAL, message = "PAN must be 10 characters.")
        String panNumber,

        @Size(max = 500)
        String keyClients,

        @Valid
        List<PortfolioItemRequest> portfolio,

        @AssertTrue(message = "You must accept the Terms of Service.")
        boolean acceptedTerms
) {
}

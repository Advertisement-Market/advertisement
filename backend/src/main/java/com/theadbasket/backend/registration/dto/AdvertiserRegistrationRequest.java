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

/** Full advertiser registration: account + company + contact + first campaign brief. */
public record AdvertiserRegistrationRequest(

        @NotBlank(message = "Login email is required.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 180)
        String loginEmail,

        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 72, message = "Password must be 8–72 characters.")
        String password,

        // ── Company ──
        @NotBlank(message = "Company name is required.")
        @Size(max = 150)
        String companyName,

        @NotBlank(message = "Business type is required.")
        @Size(max = 80)
        String businessType,

        @Size(max = 255)
        String website,

        @Pattern(regexp = ValidationPatterns.GST_OPTIONAL, message = "GST number must be 15 characters.")
        String gstNumber,

        @Pattern(regexp = ValidationPatterns.PAN_OPTIONAL, message = "PAN must be 10 characters.")
        String panNumber,

        @NotEmpty(message = "Select at least one industry.")
        List<@NotBlank String> industries,

        // ── Primary contact ──
        @NotBlank(message = "Contact name is required.")
        @Size(max = 160)
        String contactName,

        @NotBlank(message = "Designation is required.")
        @Size(max = 120)
        String contactDesignation,

        @NotBlank(message = "Contact email is required.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 180)
        String contactEmail,

        @NotBlank(message = "Phone number is required.")
        @Pattern(regexp = ValidationPatterns.PHONE, message = "Enter a valid phone number.")
        String contactPhone,

        @NotBlank(message = "Office address is required.")
        @Size(max = 500)
        String officeAddress,

        @NotBlank(message = "PIN code is required.")
        @Pattern(regexp = ValidationPatterns.PINCODE, message = "Enter a valid 6-digit PIN code.")
        String pincode,

        // ── First requirement ──
        @NotNull(message = "Project details are required.")
        @Valid
        CampaignBriefRequest project,

        @AssertTrue(message = "You must accept the Terms & Conditions.")
        boolean acceptedTerms
) {
}

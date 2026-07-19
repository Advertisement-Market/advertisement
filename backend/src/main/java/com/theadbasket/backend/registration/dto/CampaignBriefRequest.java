package com.theadbasket.backend.registration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** The advertiser's first campaign/requirement brief, captured during registration. */
public record CampaignBriefRequest(

        @NotBlank(message = "Project title is required.")
        @Size(max = 200)
        String title,

        @NotBlank(message = "Project description is required.")
        @Size(max = 2000)
        String description,

        @NotBlank(message = "Target audience is required.")
        @Size(max = 500)
        String targetAudience,

        @NotBlank(message = "Target location is required.")
        @Size(max = 300)
        String targetLocation,

        @NotNull(message = "Start date is required.")
        LocalDate startDate,

        @NotBlank(message = "Duration is required.")
        @Size(max = 50)
        String duration,

        @NotNull(message = "Minimum budget is required.")
        @PositiveOrZero
        BigDecimal budgetMinValue,

        @Size(max = 20)
        String budgetMinUnit,

        @NotNull(message = "Maximum budget is required.")
        @PositiveOrZero
        BigDecimal budgetMaxValue,

        @Size(max = 20)
        String budgetMaxUnit,

        boolean flexibleBudget,

        @NotBlank(message = "Number of quotations required.")
        @Size(max = 20)
        String quotationsRequired,

        @NotEmpty(message = "Select at least one agency preference.")
        List<@NotBlank String> agencyPreferences
) {
}

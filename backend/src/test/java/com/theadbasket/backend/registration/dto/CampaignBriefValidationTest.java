package com.theadbasket.backend.registration.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

public class CampaignBriefValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private CampaignBriefRequest createBrief(LocalDate startDate, LocalDate endDate) {
        return new CampaignBriefRequest(
                "Summer Campaign",
                "Nationwide billboard campaign for product launch",
                "Youth 18-35",
                "Mumbai & Pune",
                startDate,
                endDate,
                "1-3 months",
                BigDecimal.valueOf(100000),
                "INR",
                BigDecimal.valueOf(500000),
                "INR",
                true,
                "3-5",
                List.of("OOH Specialist")
        );
    }

    @Test
    @DisplayName("Valid date range (endDate after startDate) passes validation")
    void validDateRange_passes() {
        LocalDate start = LocalDate.of(2026, 8, 1);
        LocalDate end = LocalDate.of(2026, 8, 31);
        CampaignBriefRequest req = createBrief(start, end);

        Set<ConstraintViolation<CampaignBriefRequest>> violations = validator.validate(req);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Valid same-day date range (endDate == startDate) passes validation")
    void sameDayDateRange_passes() {
        LocalDate sameDay = LocalDate.of(2026, 8, 1);
        CampaignBriefRequest req = createBrief(sameDay, sameDay);

        Set<ConstraintViolation<CampaignBriefRequest>> violations = validator.validate(req);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Inverted date range (endDate before startDate) fails cross-field validation")
    void invertedDateRange_fails() {
        LocalDate start = LocalDate.of(2026, 8, 15);
        LocalDate end = LocalDate.of(2026, 8, 1);
        CampaignBriefRequest req = createBrief(start, end);

        Set<ConstraintViolation<CampaignBriefRequest>> violations = validator.validate(req);
        assertThat(violations).hasSize(1);
        assertThat(violations)
                .anyMatch(v -> v.getMessage().equals("End date must be on or after start date."));
    }

    @Test
    @DisplayName("Null start or end date delegates to @NotNull constraint")
    void nullDates_delegateToNotNullConstraint() {
        CampaignBriefRequest nullStart = createBrief(null, LocalDate.of(2026, 8, 1));
        Set<ConstraintViolation<CampaignBriefRequest>> violationsStart = validator.validate(nullStart);
        assertThat(violationsStart).anyMatch(v -> v.getPropertyPath().toString().equals("startDate"));

        CampaignBriefRequest nullEnd = createBrief(LocalDate.of(2026, 8, 1), null);
        Set<ConstraintViolation<CampaignBriefRequest>> violationsEnd = validator.validate(nullEnd);
        assertThat(violationsEnd).anyMatch(v -> v.getPropertyPath().toString().equals("endDate"));
    }

    @Test
    @DisplayName("AdvertiserRegistrationRequest cascades date validation on nested project record")
    void advertiserRegistration_cascadesDateValidation() {
        LocalDate start = LocalDate.of(2026, 8, 15);
        LocalDate end = LocalDate.of(2026, 8, 1);
        CampaignBriefRequest invalidProject = createBrief(start, end);

        AdvertiserRegistrationRequest req = new AdvertiserRegistrationRequest(
                "adv@example.com", "Passw0rd!", "Nimbus Foods", "FMCG", "https://nimbus.in",
                "27AAAAA0000A1Z5", "ABCDE1234F", List.of("FMCG"), "Rohan", "Kapoor",
                "Marketing Head", "rohan@nimbus.in", "+91 98765 43210",
                "12 MG Road", null, null, "Mumbai", "Maharashtra", "400001",
                invalidProject, true
        );

        Set<ConstraintViolation<AdvertiserRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations)
                .anyMatch(v -> v.getMessage().equals("End date must be on or after start date."));
    }
}

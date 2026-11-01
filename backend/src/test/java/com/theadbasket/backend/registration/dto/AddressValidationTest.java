
package com.theadbasket.backend.registration.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import org.springframework.context.support.ResourceBundleMessageSource;

import com.theadbasket.backend.common.validation.RequiredOtherTextValidator;
import com.theadbasket.backend.common.validation.ValidationPatterns;
import com.theadbasket.backend.lov.LovService;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorFactory;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

class AddressValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ResourceBundleMessageSource messages = new ResourceBundleMessageSource();
        messages.setBasename("messages");
        messages.setDefaultEncoding("UTF-8");
        messages.setUseCodeAsDefaultMessage(true);
        LovService lovService = new LovService(messages);

        try (ValidatorFactory factory = Validation.byDefaultProvider()
                .configure()
                .constraintValidatorFactory(new ConstraintValidatorFactory() {
                    @Override
                    @SuppressWarnings("unchecked")
                    public <T extends ConstraintValidator<?, ?>> T getInstance(Class<T> key) {
                        if (key.equals(RequiredOtherTextValidator.class)) {
                            return (T) new RequiredOtherTextValidator(lovService);
                        }
                        try {
                            return key.getDeclaredConstructor().newInstance();
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    }

                    @Override
                    public void releaseInstance(ConstraintValidator<?, ?> instance) {
                    }
                })
                .buildValidatorFactory()) {
            validator = factory.getValidator();
        }
    }

    private AdvertiserRegistrationRequest createValidAdvertiserRequest(
            String line1, String line2, String landmark, String city, String state, String pincode) {
        CampaignBriefRequest project = new CampaignBriefRequest(
                "Summer Campaign", "Description", "Youth 18-35", "Mumbai",
                LocalDate.now().plusDays(1), LocalDate.now().plusMonths(1), "1 month",
                BigDecimal.valueOf(100000), "INR", BigDecimal.valueOf(500000), "INR",
                true, "3-5", List.of("OOH")
        );
        return new AdvertiserRegistrationRequest(
                "adv@example.com", "Passw0rd!", "Nimbus Foods", "FMCG", "https://nimbus.in",
                "27AAAAA0000A1Z5", "ABCDE1234F", List.of("FMCG"), "Rohan", "Kapoor",
                "Marketing Head", "rohan@nimbus.in", "+91 98765 43210",
                line1, line2, landmark, city, state, pincode, project, true
        );
    }

    private BillboardListingRequest createValidBillboardRequest(
            String line1, String line2, String landmark, String city, String state, String pincode) {
        return new BillboardListingRequest(
                "Prime Unipole", line1, line2, landmark, city, state, pincode,
                "Unipole", null, BigDecimal.valueOf(40), BigDecimal.valueOf(20), BigDecimal.valueOf(10),
                "North", "Highway", null, "Commuters", null, "50k/day", BigDecimal.valueOf(100000), 1, "MONTHS", "10% off"
        );
    }

    private AgencyRegistrationRequest createValidAgencyRequest(String pincode) {
        return new AgencyRegistrationRequest(
                "agency@example.com", "Passw0rd!", "Pinnacle Media", "Full Service",
                2015, "10+", "Top OOH", "About us", "https://pinnacle.in",
                "9876543210", "https://linkedin.com/company/pinnacle",
                "Tower A", "Suite 2", "Near Metro", "Mumbai", "Maharashtra", pincode,
                "Aarav", "Sharma", "Director", "aarav@pinnacle.in", "9876543210",
                List.of("OOH"), List.of("Automotive"), List.of("OOH"), List.of("English"),
                "50", "Fixed", "Pan-India", "10L", "Mumbai",
                "REG123456", "27AAAAA0000A1Z5", "ABCDE1234F", "Client X",
                List.of(new PortfolioItemRequest("Campaign 1", "Billboard in Bandra")),
                true
        );
    }

    private OwnerRegistrationRequest createValidOwnerRequest(String pincode) {
        return new OwnerRegistrationRequest(
                "Rajesh", "Patel", "owner@example.com", "9876543210", "Passw0rd!",
                "Patel Hoardings", "9876543210", "REG987654", "27AAAAA0000A1Z5",
                "Plot 4", "Phase 1", "Near Toll", "Pune", "Maharashtra", pincode,
                "LIC1234", "Direct Owner", "Municipal Approval",
                createValidBillboardRequest("Highway Road", null, null, "Pune", "Maharashtra", "411001"),
                true
        );
    }

    @Test
    @DisplayName("Valid address with all fields passes validation")
    void validAddress_passes() {
        AdvertiserRegistrationRequest req = createValidAdvertiserRequest(
                "12 MG Road", "Suite 400", "Near Metro", "Bengaluru", "Karnataka", "560001"
        );
        Set<ConstraintViolation<AdvertiserRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Valid address with null optional fields (line2, landmark) passes validation")
    void validAddress_withNullOptionalFields_passes() {
        AdvertiserRegistrationRequest req = createValidAdvertiserRequest(
                "12 MG Road", null, null, "Bengaluru", "Karnataka", "560001"
        );
        Set<ConstraintViolation<AdvertiserRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    @DisplayName("Blank addressLine1 fails validation")
    void blankAddressLine1_fails(String line1) {
        AdvertiserRegistrationRequest req = createValidAdvertiserRequest(
                line1, null, null, "Bengaluru", "Karnataka", "560001"
        );
        Set<ConstraintViolation<AdvertiserRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("addressLine1"));
    }

    @Test
    @DisplayName("Null addressLine1 fails validation")
    void nullAddressLine1_fails() {
        AdvertiserRegistrationRequest req = createValidAdvertiserRequest(
                null, null, null, "Bengaluru", "Karnataka", "560001"
        );
        Set<ConstraintViolation<AdvertiserRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("addressLine1"));
    }

    @Test
    @DisplayName("Exceeding max length for address fields fails validation")
    void excessiveLengths_fail() {
        String long301 = "a".repeat(301);
        String long201 = "a".repeat(201);
        String long101 = "a".repeat(101);

        AdvertiserRegistrationRequest req = createValidAdvertiserRequest(
                long301, long301, long201, long101, long101, "560001"
        );
        Set<ConstraintViolation<AdvertiserRegistrationRequest>> violations = validator.validate(req);

        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("addressLine1"));
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("addressLine2"));
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("landmark"));
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("city"));
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("state"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    @DisplayName("Blank city and state fail validation")
    void blankCityAndState_fail(String blank) {
        AdvertiserRegistrationRequest req = createValidAdvertiserRequest(
                "12 MG Road", null, null, blank, blank, "560001"
        );
        Set<ConstraintViolation<AdvertiserRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("city"));
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("state"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    @DisplayName("Blank pincode fails validation on @NotBlank")
    void blankPincode_fails(String pincode) {
        AdvertiserRegistrationRequest req = createValidAdvertiserRequest(
                "12 MG Road", null, null, "Mumbai", "Maharashtra", pincode
        );
        Set<ConstraintViolation<AdvertiserRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("pincode")
                && v.getMessage().equals("PIN code is required."));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "12345", // 5 digits
        "1234567", // 7 digits
        "012345", // leading zero
        "000000", // legacy placeholder zero
        "40000A", // alphanumeric
        "400-01", // special characters
        "400 01"  // internal space
    })
    @DisplayName("Invalid pincode formats fail validation with PINCODE_MESSAGE")
    void invalidPincodeFormats_fail(String pincode) {
        AdvertiserRegistrationRequest req = createValidAdvertiserRequest(
                "12 MG Road", null, null, "Mumbai", "Maharashtra", pincode
        );
        Set<ConstraintViolation<AdvertiserRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("pincode")
                && v.getMessage().equals(ValidationPatterns.PINCODE_MESSAGE));
    }

    @Test
    @DisplayName("AgencyRegistrationRequest rejects 012345 pincode with PINCODE_MESSAGE")
    void agencyPincode_leadingZero_fails() {
        AgencyRegistrationRequest req = createValidAgencyRequest("012345");
        Set<ConstraintViolation<AgencyRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("pincode")
                && v.getMessage().equals(ValidationPatterns.PINCODE_MESSAGE));
    }

    @Test
    @DisplayName("OwnerRegistrationRequest rejects 012345 pincode with PINCODE_MESSAGE")
    void ownerPincode_leadingZero_fails() {
        OwnerRegistrationRequest req = createValidOwnerRequest("012345");
        Set<ConstraintViolation<OwnerRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("pincode")
                && v.getMessage().equals(ValidationPatterns.PINCODE_MESSAGE));
    }

    @Test
    @DisplayName("BillboardListingRequest validates address fields correctly and rejects 012345")
    void billboardAddress_validation() {
        BillboardListingRequest valid = createValidBillboardRequest(
                "Highway Road", null, "Opposite Park", "Pune", "Maharashtra", "411001"
        );
        assertThat(validator.validate(valid)).isEmpty();

        BillboardListingRequest invalidPin = createValidBillboardRequest(
                "Highway Road", null, null, "Pune", "Maharashtra", "012345"
        );
        assertThat(validator.validate(invalidPin))
                .anyMatch(v -> v.getPropertyPath().toString().equals("pincode")
                        && v.getMessage().equals(ValidationPatterns.PINCODE_MESSAGE));

        BillboardListingRequest blankLine1 = createValidBillboardRequest(
                "", null, null, "Pune", "Maharashtra", "411001"
        );
        assertThat(validator.validate(blankLine1))
                .anyMatch(v -> v.getPropertyPath().toString().equals("addressLine1"));
    }
}

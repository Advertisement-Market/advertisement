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

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

class AddressValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
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
                "Unipole", BigDecimal.valueOf(40), BigDecimal.valueOf(20), BigDecimal.valueOf(10),
                "North", "Vehicular", "Commuters", "50k/day", BigDecimal.valueOf(100000), "1 month", "10% off"
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
    @ValueSource(strings = {
        "12345", // 5 digits
        "1234567", // 7 digits
        "40000A", // alphanumeric
        "400-01", // special characters
        "400 01", // internal space
        "", // empty
        "   " // whitespace
    })
    @DisplayName("Invalid pincode formats fail validation")
    void invalidPincodes_fail(String pincode) {
        AdvertiserRegistrationRequest req = createValidAdvertiserRequest(
                "12 MG Road", null, null, "Mumbai", "Maharashtra", pincode
        );
        Set<ConstraintViolation<AdvertiserRegistrationRequest>> violations = validator.validate(req);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("pincode"));
    }

    @Test
    @DisplayName("BillboardListingRequest validates address fields correctly")
    void billboardAddress_validation() {
        BillboardListingRequest valid = createValidBillboardRequest(
                "Highway Road", null, "Opposite Park", "Pune", "Maharashtra", "411001"
        );
        assertThat(validator.validate(valid)).isEmpty();

        BillboardListingRequest invalidPin = createValidBillboardRequest(
                "Highway Road", null, null, "Pune", "Maharashtra", "invalid"
        );
        assertThat(validator.validate(invalidPin))
                .anyMatch(v -> v.getPropertyPath().toString().equals("pincode"));

        BillboardListingRequest blankLine1 = createValidBillboardRequest(
                "", null, null, "Pune", "Maharashtra", "411001"
        );
        assertThat(validator.validate(blankLine1))
                .anyMatch(v -> v.getPropertyPath().toString().equals("addressLine1"));
    }
}

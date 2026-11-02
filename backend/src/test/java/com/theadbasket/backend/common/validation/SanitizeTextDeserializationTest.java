package com.theadbasket.backend.common.validation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.theadbasket.backend.common.util.TextUtil;
import com.theadbasket.backend.owner.dto.BillboardListingUpdateRequest;

import static org.assertj.core.api.Assertions.assertThat;

class SanitizeTextDeserializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Jackson deserializes and sanitizes @SanitizeText fields on BillboardListingUpdateRequest")
    void deserializesAndSanitizesFields() throws Exception {
        String json = """
                {
                  "name": "<<script>script>Cyber Towers Board</script>",
                  "addressLine1": "12 MG Road <script>alert(1)</script>",
                  "addressLine2": "",
                  "landmark": "<img src=x onerror=alert(1) Near Metro Station",
                  "city": "Bengaluru",
                  "state": "Karnataka",
                  "pincode": " 560001 ",
                  "discountNote": "<b>10% off</b> for > 3 months"
                }
                """;

        BillboardListingUpdateRequest req = objectMapper.readValue(json, BillboardListingUpdateRequest.class);

        assertThat(req.name()).isEqualTo("Cyber Towers Board");
        assertThat(req.addressLine1()).isEqualTo("12 MG Road alert(1)");
        // Non-null empty string is preserved so PATCH clearing logic works as intended
        assertThat(req.addressLine2()).isEqualTo("");
        assertThat(req.landmark()).isEqualTo("img src=x onerror=alert(1) Near Metro Station");
        assertThat(req.city()).isEqualTo("Bengaluru");
        assertThat(req.state()).isEqualTo("Karnataka");
        assertThat(req.pincode()).isEqualTo("560001");
        assertThat(req.discountNote()).isEqualTo("10% off for > 3 months");
    }

    @Test
    @DisplayName("Markup-only input on required field deserializes to empty string and fails bean validation")
    void markupOnlyOnRequiredFieldFailsValidation() throws Exception {
        String json = """
                {
                  "name": "<b><i></i></b>",
                  "addressLine1": "12 MG Road",
                  "city": "Bengaluru",
                  "state": "Karnataka",
                  "pincode": "560001",
                  "landmark": "<b><i></i></b>"
                }
                """;

        BillboardListingUpdateRequest req = objectMapper.readValue(json, BillboardListingUpdateRequest.class);

        // Required field collapses to ""
        assertThat(req.name()).isEqualTo("");
        // Optional field collapses to "" so it can clear stored value
        assertThat(req.landmark()).isEqualTo("");

        jakarta.validation.Validator validator = jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator();
        var violations = validator.validate(req);

        // Required 'name' fails @Pattern("^(?!\\s*$).+") validation
        assertThat(violations)
                .extracting(v -> v.getPropertyPath().toString())
                .contains("name")
                .doesNotContain("landmark");
    }

    @Test
    @DisplayName("Jackson deserializes and sanitizes registration DTOs without touching passwords")
    void registrationDtoSanitization() throws Exception {
        String json = """
                {
                  "firstName": "<b>Vikram</b>",
                  "lastName": "Kumar",
                  "accountEmail": "owner@example.com",
                  "phone": "+91 97654 32109",
                  "password": "P@ss<word>!123",
                  "companyName": "<<script>script>Mega Holdings</script>",
                  "addressLine1": "100 Outer Ring Rd",
                  "city": "Bengaluru",
                  "state": "Karnataka",
                  "pincode": "560103",
                  "billboard": {
                    "name": "<script>alert(1)</script>Skyline Prime",
                    "addressLine1": "100 Outer Ring Rd",
                    "city": "Bengaluru",
                    "state": "Karnataka",
                    "pincode": "560103",
                    "type": "STATIC",
                    "widthFt": 40.0,
                    "heightFt": 20.0,
                    "facing": "North",
                    "trafficType": "HIGHWAY",
                    "audienceType": "COMMUTERS",
                    "startPrice": 50000.0,
                    "minBookingValue": 1,
                    "minBookingUnit": "MONTHS",
                    "discountNote": "<b>5% off</b> for > 6 months"
                  },
                  "acceptedTerms": true
                }
                """;

        com.theadbasket.backend.registration.dto.OwnerRegistrationRequest req =
                objectMapper.readValue(json, com.theadbasket.backend.registration.dto.OwnerRegistrationRequest.class);

        assertThat(req.firstName()).isEqualTo("Vikram");
        assertThat(req.companyName()).isEqualTo("Mega Holdings");
        assertThat(req.password()).isEqualTo("P@ss<word>!123");
        assertThat(req.billboard().name()).isEqualTo("alert(1)Skyline Prime");
        assertThat(req.billboard().discountNote()).isEqualTo("5% off for > 6 months");
    }

    @Test
    @DisplayName("Large input exceeding 10,000 characters is safely truncated to prevent ReDoS")
    void largeInputSafelyTruncated() {
        String large = "<a ".repeat(5000); // 15,000 characters
        String sanitized = TextUtil.sanitizeText(large);
        assertThat(sanitized.length()).isLessThanOrEqualTo(10_000);
    }
}


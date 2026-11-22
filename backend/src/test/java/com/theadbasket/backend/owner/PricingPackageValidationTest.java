package com.theadbasket.backend.owner;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.LovService;
import com.theadbasket.backend.owner.dto.PricingPackageRequest;
import com.theadbasket.backend.owner.dto.PricingPackageResponse;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

class PricingPackageValidationTest {

    private static Validator validator;
    private static ObjectMapper objectMapper;
    private static PricingPackageService pricingPackageService;

    @BeforeAll
    @SuppressWarnings("unused")
    static void setUp() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            validator = factory.getValidator();
        }
        objectMapper = new ObjectMapper();

        ResourceBundleMessageSource messages = new ResourceBundleMessageSource();
        messages.setBasename("messages");
        messages.setDefaultEncoding("UTF-8");
        messages.setUseCodeAsDefaultMessage(true);
        LovService lovService = new LovService(messages);
        pricingPackageService = new PricingPackageService(lovService);
    }

    @Test
    @DisplayName("Validation succeeds for valid base and promotional packages")
    void testValidPricingPackageRequest() {
        PricingPackageRequest baseReq = new PricingPackageRequest(
                1, "MONTHS", null, "Base note", true
        );
        Set<ConstraintViolation<PricingPackageRequest>> violations = validator.validate(baseReq);
        assertThat(violations).isEmpty();

        PricingPackageRequest promoReq = new PricingPackageRequest(
                3, "MONTHS", new BigDecimal("250000.50"), "10% off", false
        );
        violations = validator.validate(promoReq);
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("@Digits(12, 2) rejects rates with more than 2 fraction digits or more than 12 integer digits")
    void testRateDigitsValidation() {
        // 3 decimal places -> rejected
        PricingPackageRequest invalidDecimals = new PricingPackageRequest(
                1, "MONTHS", new BigDecimal("100.999"), "Note", true
        );
        Set<ConstraintViolation<PricingPackageRequest>> violations = validator.validate(invalidDecimals);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("rate"));

        // Exactly 12 integer digits and 2 fraction digits -> accepted
        PricingPackageRequest maxAllowed = new PricingPackageRequest(
                1, "MONTHS", new BigDecimal("999999999999.99"), "Note", true
        );
        violations = validator.validate(maxAllowed);
        assertThat(violations).isEmpty();

        // 13 integer digits -> rejected
        PricingPackageRequest exceedsIntegerDigits = new PricingPackageRequest(
                1, "MONTHS", new BigDecimal("1000000000000.00"), "Note", true
        );
        violations = validator.validate(exceedsIntegerDigits);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("rate"));
    }

    @Test
    @DisplayName("@Positive rejects zero and negative rates")
    void testRatePositiveValidation() {
        PricingPackageRequest zeroRate = new PricingPackageRequest(
                1, "MONTHS", BigDecimal.ZERO, "Note", false
        );
        Set<ConstraintViolation<PricingPackageRequest>> violations = validator.validate(zeroRate);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("rate"));

        PricingPackageRequest negativeRate = new PricingPackageRequest(
                1, "MONTHS", new BigDecimal("-50.00"), "Note", false
        );
        violations = validator.validate(negativeRate);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("rate"));
    }

    @Test
    @DisplayName("@Size(max = 150) enforces note maximum length")
    void testNoteLengthValidation() {
        String note150 = "A".repeat(150);
        PricingPackageRequest validNote = new PricingPackageRequest(
                1, "MONTHS", new BigDecimal("100.00"), note150, true
        );
        assertThat(validator.validate(validNote)).isEmpty();

        String note151 = "A".repeat(151);
        PricingPackageRequest invalidNote = new PricingPackageRequest(
                1, "MONTHS", new BigDecimal("100.00"), note151, true
        );
        Set<ConstraintViolation<PricingPackageRequest>> violations = validator.validate(invalidNote);
        assertThat(violations).anyMatch(v -> v.getPropertyPath().toString().equals("note"));
    }

    @Test
    @DisplayName("Jackson serializes and deserializes @JsonProperty('isBase') properly")
    void testJacksonIsBaseSerialization() throws Exception {
        String json = "{\"durationValue\":1,\"durationUnit\":\"MONTHS\",\"rate\":150000.00,\"note\":\"Base tier\",\"isBase\":true}";
        PricingPackageRequest req = objectMapper.readValue(json, PricingPackageRequest.class);
        assertThat(req.isBase()).isTrue();
        assertThat(req.durationValue()).isEqualTo(1);
        assertThat(req.durationUnit()).isEqualTo("MONTHS");

        PricingPackageResponse response = new PricingPackageResponse(
                10L, 1, "MONTHS", 30, new BigDecimal("150000.00"), "Base tier", true
        );
        String responseJson = objectMapper.writeValueAsString(response);
        assertThat(responseJson).contains("\"isBase\":true");
        assertThat(responseJson).doesNotContain("\"base\":true");
    }

    @Test
    @DisplayName("PricingPackageService synthesizes single base package when request list is null or empty")
    void testSynthesizeDefaultBasePackage() {
        BillboardListing listing = new BillboardListing();
        List<BillboardPricingPackage> pkgs = pricingPackageService.validateAndBuildPackages(
                null, listing, new BigDecimal("5000.00"), 1, BookingDurationUnit.MONTHS
        );

        assertThat(pkgs).hasSize(1);
        BillboardPricingPackage base = pkgs.get(0);
        assertThat(base.isBase()).isTrue();
        assertThat(base.getDurationValue()).isEqualTo(1);
        assertThat(base.getDurationUnit()).isEqualTo(BookingDurationUnit.MONTHS);
        assertThat(base.getDurationDays()).isEqualTo(30);
        assertThat(base.getRate()).isEqualByComparingTo(new BigDecimal("150000.00")); // 5000 * 30
    }

    @Test
    @DisplayName("PricingPackageService rejects duplicate duration days even across different units (e.g. 7 DAYS vs 1 WEEKS)")
    void testDuplicateNormalizedDuration() {
        BillboardListing listing = new BillboardListing();
        List<PricingPackageRequest> requests = List.of(
                new PricingPackageRequest(7, "DAYS", new BigDecimal("7000.00"), "7 days base", true),
                new PricingPackageRequest(1, "WEEKS", new BigDecimal("6500.00"), "1 week promo", false)
        );

        assertThatThrownBy(() -> pricingPackageService.validateAndBuildPackages(
                requests, listing, new BigDecimal("1000.00"), 7, BookingDurationUnit.DAYS
        )).isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(com.theadbasket.backend.common.error.ErrorCode.VALIDATION_FAILED);
                    assertThat(bre.getArgs()[0].toString()).contains("Duplicate package duration of 7 days");
                });
    }

    @Test
    @DisplayName("PricingPackageService rejects lists without exactly one base package")
    void testBasePackageCountValidation() {
        BillboardListing listing = new BillboardListing();

        // 0 base packages
        List<PricingPackageRequest> noBase = List.of(
                new PricingPackageRequest(1, "MONTHS", new BigDecimal("30000.00"), "Tier 1", false),
                new PricingPackageRequest(3, "MONTHS", new BigDecimal("85000.00"), "Tier 2", false)
        );
        assertThatThrownBy(() -> pricingPackageService.validateAndBuildPackages(
                noBase, listing, new BigDecimal("1000.00"), 1, BookingDurationUnit.MONTHS
        )).isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(com.theadbasket.backend.common.error.ErrorCode.VALIDATION_FAILED);
                    assertThat(bre.getArgs()[0].toString()).contains("Exactly one base pricing package is required (found 0)");
                });

        // 2 base packages
        List<PricingPackageRequest> twoBases = List.of(
                new PricingPackageRequest(1, "MONTHS", new BigDecimal("30000.00"), "Tier 1", true),
                new PricingPackageRequest(3, "MONTHS", new BigDecimal("85000.00"), "Tier 2", true)
        );
        assertThatThrownBy(() -> pricingPackageService.validateAndBuildPackages(
                twoBases, listing, new BigDecimal("1000.00"), 1, BookingDurationUnit.MONTHS
        )).isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(com.theadbasket.backend.common.error.ErrorCode.VALIDATION_FAILED);
                    assertThat(bre.getArgs()[0].toString()).contains("Exactly one base pricing package is required (found 2)");
                });
    }

    @Test
    @DisplayName("PricingPackageService validates per-unit duration value caps")
    void testUnitCapsValidation() {
        BillboardListing listing = new BillboardListing();

        // Exceeds DAYS cap of 365
        List<PricingPackageRequest> overDays = List.of(
                new PricingPackageRequest(366, "DAYS", new BigDecimal("366000.00"), "Over days", true)
        );
        assertThatThrownBy(() -> pricingPackageService.validateAndBuildPackages(
                overDays, listing, new BigDecimal("1000.00"), 366, BookingDurationUnit.DAYS
        )).isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(com.theadbasket.backend.common.error.ErrorCode.VALIDATION_FAILED);
                    assertThat(bre.getArgs()[0].toString()).contains("Duration value 366 is invalid for unit Days (maximum is 365)");
                });

        // Exceeds YEARS cap of 10
        List<PricingPackageRequest> overYears = List.of(
                new PricingPackageRequest(11, "YEARS", new BigDecimal("3000000.00"), "Over years", true)
        );
        assertThatThrownBy(() -> pricingPackageService.validateAndBuildPackages(
                overYears, listing, new BigDecimal("1000.00"), 11, BookingDurationUnit.YEARS
        )).isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(com.theadbasket.backend.common.error.ErrorCode.VALIDATION_FAILED);
                    assertThat(bre.getArgs()[0].toString()).contains("Duration value 11 is invalid for unit Years (maximum is 10)");
                });
    }

    @Test
    @DisplayName("PricingPackageService auto-calculates base package rate when rate is null")
    void testBasePackageRateAutoCalculation() {
        BillboardListing listing = new BillboardListing();
        List<PricingPackageRequest> requests = List.of(
                new PricingPackageRequest(2, "WEEKS", null, "Base two weeks", true),
                new PricingPackageRequest(1, "MONTHS", new BigDecimal("60000.00"), "Month promo", false)
        );

        List<BillboardPricingPackage> pkgs = pricingPackageService.validateAndBuildPackages(
                requests, listing, new BigDecimal("2500.00"), 2, BookingDurationUnit.WEEKS
        );

        assertThat(pkgs).hasSize(2);
        BillboardPricingPackage base = pkgs.get(0);
        assertThat(base.isBase()).isTrue();
        assertThat(base.getDurationDays()).isEqualTo(14);
        assertThat(base.getRate()).isEqualByComparingTo(new BigDecimal("35000.00")); // 2500 * 14
    }

    @Test
    @DisplayName("Canonical rounding: validateAndBuildPackages rounds auto base rates using HALF_UP and normalizes precision")
    void testCanonicalRoundingHalfUp() {
        BillboardListing listing = new BillboardListing();

        // 1.005 with 1 day should round HALF_UP to 1.01
        List<PricingPackageRequest> requests1 = List.of(
                new PricingPackageRequest(1, "DAYS", null, "Base 1 day", true)
        );
        List<BillboardPricingPackage> pkgs1 = pricingPackageService.validateAndBuildPackages(
                requests1, listing, new BigDecimal("1.005"), 1, BookingDurationUnit.DAYS
        );
        assertThat(pkgs1.get(0).getRate()).isEqualByComparingTo(new BigDecimal("1.01"));

        // 33.334 with 1 day should round HALF_UP to 33.33
        List<PricingPackageRequest> requests2 = List.of(
                new PricingPackageRequest(1, "DAYS", null, "Base 1 day", true)
        );
        List<BillboardPricingPackage> pkgs2 = pricingPackageService.validateAndBuildPackages(
                requests2, listing, new BigDecimal("33.334"), 1, BookingDurationUnit.DAYS
        );
        assertThat(pkgs2.get(0).getRate()).isEqualByComparingTo(new BigDecimal("33.33"));

        // Non-base package with 1 decimal place (100.5) is normalized to scale 2 (100.50)
        List<PricingPackageRequest> requests3 = List.of(
                new PricingPackageRequest(1, "DAYS", new BigDecimal("50.00"), "Base", true),
                new PricingPackageRequest(2, "DAYS", new BigDecimal("100.5"), "Promo", false)
        );
        List<BillboardPricingPackage> pkgs3 = pricingPackageService.validateAndBuildPackages(
                requests3, listing, new BigDecimal("50.00"), 1, BookingDurationUnit.DAYS
        );
        assertThat(pkgs3.get(1).getRate()).isEqualByComparingTo(new BigDecimal("100.50"));
        assertThat(pkgs3.get(1).getRate().scale()).isEqualTo(2);
    }
}

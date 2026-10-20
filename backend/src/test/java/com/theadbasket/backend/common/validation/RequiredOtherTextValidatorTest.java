package com.theadbasket.backend.common.validation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.StaticMessageSource;

import com.theadbasket.backend.lov.LovService;
import com.theadbasket.backend.registration.dto.BillboardListingRequest;

import jakarta.validation.ConstraintValidatorContext;

/**
 * Unit tests for {@link RequiredOtherTextValidator} verifying consistent resolution of codes,
 * default labels, and customized/localized labels via {@link LovService#parse}.
 */
class RequiredOtherTextValidatorTest {

    private LovService lovService;
    private RequiredOtherTextValidator validator;
    private ConstraintValidatorContext context;
    private ConstraintValidatorContext.ConstraintViolationBuilder builder;
    private ConstraintValidatorContext.ConstraintViolationBuilder.NodeBuilderCustomizableContext nodeBuilder;

    @BeforeEach
    void setUp() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);

        StaticMessageSource messageSource = new StaticMessageSource();
        // Default labels
        messageSource.addMessage("lov.billboardType.STATIC_HOARDING", Locale.ENGLISH, "Static Hoarding");
        messageSource.addMessage("lov.trafficType.CITY_URBAN", Locale.ENGLISH, "City / Urban");
        messageSource.addMessage("lov.audienceType.COMMUTERS", Locale.ENGLISH, "Commuters");

        // Customized labels for OTHER catch-all
        messageSource.addMessage("lov.billboardType.OTHER", Locale.ENGLISH, "Other (please specify)");
        messageSource.addMessage("lov.trafficType.OTHER", Locale.ENGLISH, "Other Traffic Profile");
        messageSource.addMessage("lov.audienceType.OTHER", Locale.ENGLISH, "Special Audience / Other");

        lovService = new LovService(messageSource);
        validator = new RequiredOtherTextValidator(lovService);

        context = mock(ConstraintValidatorContext.class);
        builder = mock(ConstraintValidatorContext.ConstraintViolationBuilder.class);
        nodeBuilder = mock(ConstraintValidatorContext.ConstraintViolationBuilder.NodeBuilderCustomizableContext.class);

        when(context.buildConstraintViolationWithTemplate(any())).thenReturn(builder);
        when(builder.addPropertyNode(anyString())).thenReturn(nodeBuilder);
        when(nodeBuilder.addConstraintViolation()).thenReturn(context);
    }

    private BillboardListingRequest request(String type, String typeOther,
            String trafficType, String trafficTypeOther,
            String audienceType, String audienceTypeOther) {
        return new BillboardListingRequest(
                "Skyline Display",
                "10 Main Street", "", "", "Mumbai", "Maharashtra", "400001",
                type, typeOther,
                BigDecimal.valueOf(20), BigDecimal.valueOf(10), BigDecimal.valueOf(5),
                "North",
                trafficType, trafficTypeOther,
                audienceType, audienceTypeOther,
                "50000",
                BigDecimal.valueOf(50000),
                1, "MONTHS", ""
        );
    }

    @Test
    void constructor_requiresNonNullLovService() {
        assertThatThrownBy(() -> new RequiredOtherTextValidator(null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("lovService must not be null");
    }

    @Test
    void nullRequest_isValid() {
        assertThat(validator.isValid(null, context)).isTrue();
    }

    @Test
    void codeOther_withBlankCompanionText_isInvalid() {
        BillboardListingRequest req = request("OTHER", "", "CITY_URBAN", null, "COMMUTERS", null);
        assertThat(validator.isValid(req, context)).isFalse();
        verify(builder).addPropertyNode("typeOther");
    }

    @Test
    void lowercaseAndPaddedCodeOther_withBlankCompanionText_isInvalid() {
        BillboardListingRequest req = request("STATIC_HOARDING", null, "  other  ", "   ", "COMMUTERS", null);
        assertThat(validator.isValid(req, context)).isFalse();
        verify(builder).addPropertyNode("trafficTypeOther");
    }

    @Test
    void customizedLabel_withBlankCompanionText_isInvalid() {
        // "Special Audience / Other" is a custom label resolved through LovService
        BillboardListingRequest req = request("STATIC_HOARDING", null, "CITY_URBAN", null, "Special Audience / Other", "");
        assertThat(validator.isValid(req, context)).isFalse();
        verify(builder).addPropertyNode("audienceTypeOther");
    }

    @Test
    void customizedLabel_caseInsensitiveAndTrimmed_withBlankCompanionText_isInvalid() {
        BillboardListingRequest req = request("  other (please specify)  ", null, "CITY_URBAN", null, "COMMUTERS", null);
        assertThat(validator.isValid(req, context)).isFalse();
        verify(builder).addPropertyNode("typeOther");
    }

    @Test
    void customizedLabel_withNonBlankCompanionText_isValid() {
        BillboardListingRequest req = request(
                "Other (please specify)", "Wall scape installation",
                "Other Traffic Profile", "Airport taxi queue",
                "Special Audience / Other", "Exhibition delegates"
        );
        assertThat(validator.isValid(req, context)).isTrue();
        verify(context, never()).buildConstraintViolationWithTemplate(any());
    }

    @Test
    void nonOtherValue_withBlankCompanionText_isValid() {
        BillboardListingRequest req = request("STATIC_HOARDING", "", "City / Urban", null, "COMMUTERS", "  ");
        assertThat(validator.isValid(req, context)).isTrue();
        verify(context, never()).buildConstraintViolationWithTemplate(any());
    }

    @Test
    void unknownValue_isToleratedByThisValidator() {
        // Unknown values are rejected by LovService / @ValidLov; this validator returns true.
        BillboardListingRequest req = request("UNKNOWN_STRUCTURE", "", "RANDOM_TRAFFIC", null, "INVALID_AUDIENCE", null);
        assertThat(validator.isValid(req, context)).isTrue();
        verify(context, never()).buildConstraintViolationWithTemplate(any());
    }

    @Test
    void nullOrBlankValue_isToleratedByThisValidator() {
        // Null / blank values are governed by @NotBlank / @NotNull
        BillboardListingRequest req = request(null, null, "   ", "", null, "abc");
        assertThat(validator.isValid(req, context)).isTrue();
        verify(context, never()).buildConstraintViolationWithTemplate(any());
    }

    @ParameterizedTest(name = "{0} resolves other for code or label")
    @MethodSource("otherResolutionCases")
    void allThreeEnums_requireCompanionTextWhenOtherSelected(
            String description, BillboardListingRequest req, String expectedViolatingField) {
        assertThat(validator.isValid(req, context)).isFalse();
        verify(builder).addPropertyNode(expectedViolatingField);
    }

    static Stream<Arguments> otherResolutionCases() {
        return Stream.of(
                Arguments.of(
                        "BillboardType by code",
                        new BillboardListingRequest("A", "L1", "", "", "C", "S", "400001",
                                "OTHER", "", BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ZERO, "North",
                                "CITY_URBAN", null, "COMMUTERS", null, "100", BigDecimal.TEN, 1, "MONTHS", ""),
                        "typeOther"
                ),
                Arguments.of(
                        "BillboardType by customized label",
                        new BillboardListingRequest("A", "L1", "", "", "C", "S", "400001",
                                "Other (please specify)", "   ", BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ZERO, "North",
                                "CITY_URBAN", null, "COMMUTERS", null, "100", BigDecimal.TEN, 1, "MONTHS", ""),
                        "typeOther"
                ),
                Arguments.of(
                        "TrafficType by code",
                        new BillboardListingRequest("A", "L1", "", "", "C", "S", "400001",
                                "STATIC_HOARDING", null, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ZERO, "North",
                                "OTHER", null, "COMMUTERS", null, "100", BigDecimal.TEN, 1, "MONTHS", ""),
                        "trafficTypeOther"
                ),
                Arguments.of(
                        "TrafficType by customized label",
                        new BillboardListingRequest("A", "L1", "", "", "C", "S", "400001",
                                "STATIC_HOARDING", null, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ZERO, "North",
                                "Other Traffic Profile", "", "COMMUTERS", null, "100", BigDecimal.TEN, 1, "MONTHS", ""),
                        "trafficTypeOther"
                ),
                Arguments.of(
                        "AudienceType by code",
                        new BillboardListingRequest("A", "L1", "", "", "C", "S", "400001",
                                "STATIC_HOARDING", null, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ZERO, "North",
                                "CITY_URBAN", null, "OTHER", "", "100", BigDecimal.TEN, 1, "MONTHS", ""),
                        "audienceTypeOther"
                ),
                Arguments.of(
                        "AudienceType by customized label",
                        new BillboardListingRequest("A", "L1", "", "", "C", "S", "400001",
                                "STATIC_HOARDING", null, BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ZERO, "North",
                                "CITY_URBAN", null, "Special Audience / Other", null, "100", BigDecimal.TEN, 1, "MONTHS", ""),
                        "audienceTypeOther"
                )
        );
    }
}

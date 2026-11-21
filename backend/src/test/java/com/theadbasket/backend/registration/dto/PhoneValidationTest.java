
package com.theadbasket.backend.registration.dto;

import java.math.BigDecimal;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import org.springframework.context.support.ResourceBundleMessageSource;

import com.theadbasket.backend.common.validation.RequiredOtherTextValidator;
import com.theadbasket.backend.lov.LovService;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorFactory;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/**
 * Exercises the shared phone regexes (ValidationPatterns.PHONE / PHONE_OPTIONAL)
 * through OwnerRegistrationRequest.companyPhone, covering issue #44: a formatted
 * company phone with a country code and spaces must pass, and the {10,20} length
 * boundary must still reject over-long or malformed input.
 */
class PhoneValidationTest {

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

    private BillboardListingRequest validBillboard() {
        return new BillboardListingRequest(
                "Prime Unipole", "Highway Road", null, null, "Pune", "Maharashtra", "411001",
                "Unipole", null, BigDecimal.valueOf(40), BigDecimal.valueOf(20), BigDecimal.valueOf(10),
                "North", "Highway", null, "Commuters", null, "50k/day", BigDecimal.valueOf(100000),
                1, "MONTHS", "10% off"
        );
    }

    private OwnerRegistrationRequest ownerWithCompanyPhone(String companyPhone) {
        return new OwnerRegistrationRequest(
                "Rajesh", "Patel", "owner@example.com", "9876543210", "Passw0rd!",
                "Patel Hoardings", companyPhone, "REG987654", "27AAAAA0000A1Z5",
                "Plot 4", "Phase 1", "Near Toll", "Pune", "Maharashtra", "411001",
                "LIC1234", "Direct Owner", "Municipal Approval",
                validBillboard(),
                true
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "+91 20 2222 3333", // 16-char formatted landline from issue #44
        "9876543210",       // plain 10-digit
        "+91 98765 43210",  // 15-char formatted mobile
        ""                  // optional: blank is allowed
    })
    @DisplayName("Formatted company phone up to 20 chars passes validation")
    void formattedCompanyPhone_passes(String companyPhone) {
        Set<ConstraintViolation<OwnerRegistrationRequest>> violations =
                validator.validate(ownerWithCompanyPhone(companyPhone));
        assertThat(violations)
                .noneMatch(v -> v.getPropertyPath().toString().equals("companyPhone"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "123456789012345678901", // 21 digits (too long)
        "12345",                 // too short (< 10)
        "98765abcde"             // illegal characters
    })
    @DisplayName("Company phone outside the allowed format or length fails validation")
    void invalidCompanyPhone_fails(String companyPhone) {
        Set<ConstraintViolation<OwnerRegistrationRequest>> violations =
                validator.validate(ownerWithCompanyPhone(companyPhone));
        assertThat(violations)
                .anyMatch(v -> v.getPropertyPath().toString().equals("companyPhone")
                        && v.getMessage().equals("Enter a valid phone number."));
    }
}

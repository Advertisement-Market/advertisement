package com.theadbasket.backend.common.validation;

import com.theadbasket.backend.registration.dto.BillboardListingRequest;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Enforces {@link RequiredOtherText}: when a billboard's type / traffic / audience is {@code OTHER}
 * (by code or label), the matching companion free-text field must be non-blank. Each failure is
 * reported against the companion field so it surfaces in the {@code fieldErrors} map.
 */
public class RequiredOtherTextValidator
        implements ConstraintValidator<RequiredOtherText, BillboardListingRequest> {

    @Override
    public boolean isValid(BillboardListingRequest req, ConstraintValidatorContext context) {
        if (req == null) {
            return true; // Nothing to validate; @NotNull elsewhere covers a null body.
        }

        // Report violations on the companion fields, not on the whole object.
        context.disableDefaultConstraintViolation();
        boolean valid = true;
        valid &= check(req.type(), req.typeOther(), "typeOther", context);
        valid &= check(req.trafficType(), req.trafficTypeOther(), "trafficTypeOther", context);
        valid &= check(req.audienceType(), req.audienceTypeOther(), "audienceTypeOther", context);
        return valid;
    }

    private boolean check(String mainValue, String otherText, String otherField,
            ConstraintValidatorContext context) {
        if (isOther(mainValue) && isBlank(otherText)) {
            context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                    .addPropertyNode(otherField)
                    .addConstraintViolation();
            return false;
        }
        return true;
    }

    /** True when the selection is the OTHER catch-all — matches the code {@code OTHER} or label {@code Other}. */
    private boolean isOther(String value) {
        return value != null && "OTHER".equalsIgnoreCase(value.trim());
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}

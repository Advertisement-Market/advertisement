package com.theadbasket.backend.common.validation;

import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.LovType;
import com.theadbasket.backend.lov.TrafficType;
import com.theadbasket.backend.registration.dto.BillboardListingRequest;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Enforces {@link RequiredOtherText}: when a billboard's type / traffic / audience resolves to the
 * {@code OTHER} catch-all, the matching companion free-text field must be non-blank. Whether a value
 * is "other" is decided by the enum itself ({@link LovType#isOther()}), not a literal here, so the
 * rule stays in sync with the catalogue. Each failure is reported against the companion field so it
 * surfaces in the {@code fieldErrors} map.
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
        valid &= check(BillboardType.class, req.type(), req.typeOther(), "typeOther", context);
        valid &= check(TrafficType.class, req.trafficType(), req.trafficTypeOther(), "trafficTypeOther", context);
        valid &= check(AudienceType.class, req.audienceType(), req.audienceTypeOther(), "audienceTypeOther", context);
        return valid;
    }

    private <E extends Enum<E> & LovType> boolean check(Class<E> enumType, String mainValue, String otherText,
            String otherField, ConstraintValidatorContext context) {
        if (selectedIsOther(enumType, mainValue) && isBlank(otherText)) {
            context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                    .addPropertyNode(otherField)
                    .addConstraintViolation();
            return false;
        }
        return true;
    }

    /** True when {@code value} (a code or its label) resolves to an enum constant that is the OTHER catch-all. */
    private <E extends Enum<E> & LovType> boolean selectedIsOther(Class<E> enumType, String value) {
        if (value == null) {
            return false;
        }
        String trimmed = value.trim();
        for (E constant : enumType.getEnumConstants()) {
            if (constant.isOther() && constant.code().equalsIgnoreCase(trimmed)) {
                return true;
            }
        }
        return false;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}

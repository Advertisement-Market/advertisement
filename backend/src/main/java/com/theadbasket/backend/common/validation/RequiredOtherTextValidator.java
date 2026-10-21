package com.theadbasket.backend.common.validation;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;

import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.util.TextUtil;
import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.LovService;
import com.theadbasket.backend.lov.LovType;
import com.theadbasket.backend.lov.TrafficType;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Enforces {@link RequiredOtherText}: when a billboard's type / traffic / audience resolves to the
 * {@code OTHER} catch-all, the matching companion free-text field must be non-blank.
 *
 * <p>Values are resolved via {@link LovService#parse}, ensuring that both enum codes and resolved/localized
 * labels share the exact same resolution logic as the service layer. Each failure is reported against
 * the companion field so it surfaces in the {@code fieldErrors} map.
 */
public class RequiredOtherTextValidator
        implements ConstraintValidator<RequiredOtherText, BillboardLovPayload> {

    private final LovService lovService;

    @Autowired
    public RequiredOtherTextValidator(LovService lovService) {
        this.lovService = Objects.requireNonNull(lovService, "lovService must not be null");
    }

    @Override
    public boolean isValid(BillboardLovPayload req, ConstraintValidatorContext context) {
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
        if (selectedIsOther(enumType, mainValue) && TextUtil.isBlank(otherText)) {
            context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                    .addPropertyNode(otherField)
                    .addConstraintViolation();
            return false;
        }
        return true;
    }

    /**
     * True when {@code value} (a code or resolved label) resolves via {@link LovService} to an enum
     * constant whose {@link LovType#isOther()} is true. If {@code value} cannot be resolved (blank or unknown),
     * this returns {@code false} so invalid-value checks remain the responsibility of dedicated validators
     * or service layer logic.
     */
    private <E extends Enum<E> & LovType> boolean selectedIsOther(Class<E> enumType, String value) {
        if (value == null) {
            return false;
        }
        try {
            E resolved = lovService.parse(enumType, value);
            return resolved != null && resolved.isOther();
        } catch (BadRequestException ignored) {
            return false;
        }
    }
}

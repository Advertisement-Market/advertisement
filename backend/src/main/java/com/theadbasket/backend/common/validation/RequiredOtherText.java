package com.theadbasket.backend.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Class-level constraint for a billboard listing: whenever a config-driven field is set to
 * {@code OTHER}, its companion free-text field must be non-blank. Prevents an "Other" selection
 * from being saved with no description. See {@link RequiredOtherTextValidator}.
 */
@Documented
@Constraint(validatedBy = RequiredOtherTextValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiredOtherText {

    String message() default "A description is required when the selection is 'Other'.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

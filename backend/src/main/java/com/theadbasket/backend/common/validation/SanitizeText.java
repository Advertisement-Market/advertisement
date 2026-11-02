package com.theadbasket.backend.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.fasterxml.jackson.annotation.JacksonAnnotationsInside;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

/**
 * Marks a string field or record component for incoming HTML/XML tag stripping
 * and whitespace/invisible Unicode sanitization during Jackson deserialization.
 *
 * <p>Applied to user free-text fields (such as billboard names, addresses, landmarks,
 * discount notes, and registration descriptions) to neutralize stored markup before
 * bean validation and persistence.
 */
@Documented
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotationsInside
@JsonDeserialize(using = SanitizingTextDeserializer.class)
public @interface SanitizeText {
}

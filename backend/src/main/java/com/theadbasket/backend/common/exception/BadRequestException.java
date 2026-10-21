package com.theadbasket.backend.common.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import com.theadbasket.backend.common.error.ErrorCode;

/** Thrown for a semantically invalid request that bean validation cannot express. Maps to HTTP 400. */
public class BadRequestException extends AppException {

    private final Map<String, String> fieldErrors;

    public BadRequestException(ErrorCode errorCode, Object... args) {
        super(errorCode, args);
        this.fieldErrors = Collections.emptyMap();
    }

    public BadRequestException(ErrorCode errorCode, Map<String, String> fieldErrors) {
        super(errorCode);
        this.fieldErrors = fieldErrors == null
                ? Collections.emptyMap()
                : Collections.unmodifiableMap(new LinkedHashMap<>(fieldErrors));
    }

    public static BadRequestException forFieldErrors(ErrorCode errorCode, Map<String, String> fieldErrors) {
        return new BadRequestException(errorCode, fieldErrors);
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}

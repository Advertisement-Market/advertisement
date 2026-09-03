package com.theadbasket.backend.common.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/**
 * Consistent JSON error body. {@code errorCode} is a stable, machine-readable identifier
 * (an {@code ErrorCode} name) clients can branch on; {@code message} is the resolved
 * human-readable text. {@code fieldErrors} is only present for validation failures and is
 * omitted otherwise.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String errorCode,
        String message,
        String path,
        Map<String, String> fieldErrors
) {

    public static ApiError of(int status, String error, String errorCode, String message, String path) {
        return new ApiError(Instant.now(), status, error, errorCode, message, path, null);
    }

    public static ApiError validation(int status, String error, String errorCode, String message, String path,
                                       Map<String, String> fieldErrors) {
        return new ApiError(Instant.now(), status, error, errorCode, message, path, fieldErrors);
    }
}

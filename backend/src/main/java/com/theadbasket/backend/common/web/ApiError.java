package com.theadbasket.backend.common.web;

import java.time.Instant;

/** Consistent JSON error body returned by {@link GlobalExceptionHandler}. */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
}

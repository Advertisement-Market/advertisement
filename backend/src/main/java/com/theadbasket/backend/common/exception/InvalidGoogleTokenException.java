package com.theadbasket.backend.common.exception;

import com.theadbasket.backend.common.error.ErrorCode;

/** Thrown when a Google ID token fails verification (bad signature, audience, or expiry). Maps to HTTP 401. */
public class InvalidGoogleTokenException extends AppException {

    public InvalidGoogleTokenException(ErrorCode errorCode, Object... args) {
        super(errorCode, args);
    }
}

package com.theadbasket.backend.common.exception;

import com.theadbasket.backend.common.error.ErrorCode;

/** Thrown when a refresh token is missing, expired, or revoked. Maps to HTTP 401. */
public class TokenRefreshException extends AppException {

    public TokenRefreshException(ErrorCode errorCode, Object... args) {
        super(errorCode, args);
    }
}

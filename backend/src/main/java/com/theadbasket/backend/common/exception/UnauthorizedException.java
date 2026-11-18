package com.theadbasket.backend.common.exception;

import com.theadbasket.backend.common.error.ErrorCode;

/** Thrown when a request's authentication/session is invalid or missing. Maps to HTTP 401. */
public class UnauthorizedException extends AppException {

    public UnauthorizedException(ErrorCode errorCode, Object... args) {
        super(errorCode, args);
    }
}

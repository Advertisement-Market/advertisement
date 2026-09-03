package com.theadbasket.backend.common.exception;

import com.theadbasket.backend.common.error.ErrorCode;

/** Thrown on a failed login attempt. Maps to HTTP 401. */
public class InvalidCredentialsException extends AppException {

    public InvalidCredentialsException() {
        super(ErrorCode.INVALID_CREDENTIALS);
    }
}

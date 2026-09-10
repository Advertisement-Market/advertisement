package com.theadbasket.backend.common.exception;

import com.theadbasket.backend.common.error.ErrorCode;

/** Thrown for a semantically invalid request that bean validation cannot express. Maps to HTTP 400. */
public class BadRequestException extends AppException {

    public BadRequestException(ErrorCode errorCode, Object... args) {
        super(errorCode, args);
    }
}

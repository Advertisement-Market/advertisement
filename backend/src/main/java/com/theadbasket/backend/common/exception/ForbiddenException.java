package com.theadbasket.backend.common.exception;

import com.theadbasket.backend.common.error.ErrorCode;

/** Thrown when an authenticated account is forbidden from performing an action (e.g. disabled). Maps to HTTP 403. */
public class ForbiddenException extends AppException {

    public ForbiddenException(ErrorCode errorCode, Object... args) {
        super(errorCode, args);
    }
}

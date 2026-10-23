package com.theadbasket.backend.common.exception;

import com.theadbasket.backend.common.error.ErrorCode;

public class ConflictException extends AppException {

    public ConflictException(ErrorCode errorCode, Object... args) {
        super(errorCode, args);
    }
}

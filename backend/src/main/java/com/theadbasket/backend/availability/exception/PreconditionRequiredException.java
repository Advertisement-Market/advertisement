package com.theadbasket.backend.availability.exception;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.AppException;

public class PreconditionRequiredException extends AppException {
    public PreconditionRequiredException() {
        super(ErrorCode.PRECONDITION_REQUIRED);
    }
}


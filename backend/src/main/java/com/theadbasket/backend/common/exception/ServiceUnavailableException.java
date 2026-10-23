package com.theadbasket.backend.common.exception;

import com.theadbasket.backend.common.error.ErrorCode;

public class ServiceUnavailableException extends AppException {

    public ServiceUnavailableException(String message) {
        super(ErrorCode.SERVICE_UNAVAILABLE, message);
    }
}

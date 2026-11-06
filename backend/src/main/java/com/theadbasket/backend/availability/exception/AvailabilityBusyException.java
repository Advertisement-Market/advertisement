package com.theadbasket.backend.availability.exception;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.AppException;

public class AvailabilityBusyException extends AppException {
    public AvailabilityBusyException() {
        super(ErrorCode.AVAILABILITY_BUSY);
    }
}


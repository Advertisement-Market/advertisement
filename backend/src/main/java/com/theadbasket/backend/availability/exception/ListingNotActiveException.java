package com.theadbasket.backend.availability.exception;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.AppException;

public class ListingNotActiveException extends AppException {
    public ListingNotActiveException() {
        super(ErrorCode.LISTING_NOT_ACTIVE);
    }
}


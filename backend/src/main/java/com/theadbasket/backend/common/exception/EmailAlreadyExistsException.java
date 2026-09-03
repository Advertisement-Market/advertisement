package com.theadbasket.backend.common.exception;

import com.theadbasket.backend.common.error.ErrorCode;

/** Thrown when registering with an email that is already taken. Maps to HTTP 409. */
public class EmailAlreadyExistsException extends AppException {

    public EmailAlreadyExistsException(String email) {
        super(ErrorCode.EMAIL_ALREADY_EXISTS, email);
    }
}

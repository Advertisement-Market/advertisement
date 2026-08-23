package com.theadbasket.backend.common.exception;

/** Thrown when registering with an email that is already taken. Maps to HTTP 409. */
public class EmailAlreadyExistsException extends RuntimeException {

    public EmailAlreadyExistsException(String email) {
        super("An account already exists for email: " + email);
    }
}

package com.theadbasket.backend.common.exception;

/** Thrown on a failed login attempt. Maps to HTTP 401. */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("Invalid email or password.");
    }
}

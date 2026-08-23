package com.theadbasket.backend.common.exception;

/** Thrown when a Google ID token fails verification (bad signature, audience, or expiry). Maps to HTTP 401. */
public class InvalidGoogleTokenException extends RuntimeException {

    public InvalidGoogleTokenException(String message) {
        super(message);
    }
}

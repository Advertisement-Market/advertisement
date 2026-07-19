package com.theadbasket.backend.common.exception;

/** Thrown when a refresh token is missing, expired, or revoked. Maps to HTTP 401. */
public class TokenRefreshException extends RuntimeException {

    public TokenRefreshException(String message) {
        super(message);
    }
}

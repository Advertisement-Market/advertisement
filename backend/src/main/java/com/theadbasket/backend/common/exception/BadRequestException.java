package com.theadbasket.backend.common.exception;

/** Thrown for a semantically invalid request that bean validation cannot express. Maps to HTTP 400. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}

package com.billboard.marketplace.exception;

public class InvalidCredentialsException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    public InvalidCredentialsException() {
        super("Invalid credentials");
    }
}

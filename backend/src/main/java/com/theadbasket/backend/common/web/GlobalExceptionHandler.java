package com.theadbasket.backend.common.web;

import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.EmailAlreadyExistsException;
import com.theadbasket.backend.common.exception.InvalidCredentialsException;
import com.theadbasket.backend.common.exception.InvalidGoogleTokenException;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.common.exception.TokenRefreshException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Translates exceptions into consistent {@link ApiError} JSON responses. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleEmailExists(EmailAlreadyExistsException ex, HttpServletRequest request) {
        log.warn("Conflict on {}: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    @ExceptionHandler({ InvalidCredentialsException.class, BadCredentialsException.class,
            InvalidGoogleTokenException.class, TokenRefreshException.class, AuthenticationException.class })
    public ResponseEntity<ApiError> handleUnauthorized(Exception ex, HttpServletRequest request) {
        String message = (ex instanceof BadCredentialsException) ? "Invalid email or password." : ex.getMessage();
        log.warn("Unauthorized on {}: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.UNAUTHORIZED, message, request);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
        log.warn("Bad request on {}: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Not found on {}: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        log.warn("Validation failed on {}: {}", request.getRequestURI(), fieldErrors);
        HttpStatus status = HttpStatus.BAD_REQUEST;
        ApiError body = ApiError.validation(status.value(), status.getReasonPhrase(),
                "Validation failed.", request.getRequestURI(), fieldErrors);
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        // Log the real cause internally; never leak exception/DB details to the client.
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please try again later.", request);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest request) {
        ApiError body = ApiError.of(status.value(), status.getReasonPhrase(), message, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}

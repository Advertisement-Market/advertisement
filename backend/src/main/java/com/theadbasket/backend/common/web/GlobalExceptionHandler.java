package com.theadbasket.backend.common.web;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.AppException;
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
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
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

    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiError> handleEmailExists(EmailAlreadyExistsException ex, HttpServletRequest request) {
        log.warn("Conflict on {}: {}", request.getRequestURI(), ex.getErrorCode());
        return build(HttpStatus.CONFLICT, ex, request);
    }

    @ExceptionHandler({ InvalidCredentialsException.class, InvalidGoogleTokenException.class,
            TokenRefreshException.class })
    public ResponseEntity<ApiError> handleUnauthorizedApp(AppException ex, HttpServletRequest request) {
        log.warn("Unauthorized on {}: {}", request.getRequestURI(), ex.getErrorCode());
        return build(HttpStatus.UNAUTHORIZED, ex, request);
    }

    @ExceptionHandler({ BadCredentialsException.class, AuthenticationException.class })
    public ResponseEntity<ApiError> handleSpringAuth(AuthenticationException ex, HttpServletRequest request) {
        // Never echo Spring's message (it can reveal whether an account exists); use a generic code.
        log.warn("Authentication failure on {}: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS, request);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
        log.warn("Bad request on {}: {}", request.getRequestURI(), ex.getErrorCode());
        return build(HttpStatus.BAD_REQUEST, ex, request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Not found on {}: {}", request.getRequestURI(), ex.getErrorCode());
        return build(HttpStatus.NOT_FOUND, ex, request);
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
                ErrorCode.VALIDATION_FAILED.name(), resolve(ErrorCode.VALIDATION_FAILED),
                request.getRequestURI(), fieldErrors);
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest request) {
        // Log the real cause internally; never leak exception/DB details to the client.
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, request);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, AppException ex, HttpServletRequest request) {
        String message = resolve(ex.getErrorCode(), ex.getArgs());
        ApiError body = ApiError.of(status.value(), status.getReasonPhrase(),
                ex.getErrorCode().name(), message, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, ErrorCode code, HttpServletRequest request) {
        ApiError body = ApiError.of(status.value(), status.getReasonPhrase(),
                code.name(), resolve(code), request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }

    private String resolve(ErrorCode code, Object... args) {
        return messageSource.getMessage(code.messageKey(), args, LocaleContextHolder.getLocale());
    }
}

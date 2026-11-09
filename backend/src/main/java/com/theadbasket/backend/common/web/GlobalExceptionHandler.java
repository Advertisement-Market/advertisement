package com.theadbasket.backend.common.web;

import com.theadbasket.backend.auth.AuthCookieService;
import com.theadbasket.backend.availability.dto.HoldConflictError;
import com.theadbasket.backend.availability.dto.StaleAvailabilityError;
import com.theadbasket.backend.availability.exception.AvailabilityBusyException;
import com.theadbasket.backend.availability.exception.HoldConflictException;
import com.theadbasket.backend.availability.exception.ListingNotActiveException;
import com.theadbasket.backend.availability.exception.PreconditionRequiredException;
import com.theadbasket.backend.availability.exception.StaleAvailabilityException;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.AppException;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.EmailAlreadyExistsException;
import com.theadbasket.backend.common.exception.InvalidCredentialsException;
import com.theadbasket.backend.common.exception.InvalidGoogleTokenException;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.common.exception.TokenRefreshException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Translates exceptions into consistent {@link ApiError} JSON responses. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MessageSource messageSource;
    private final AuthCookieService authCookieService;

    public GlobalExceptionHandler(MessageSource messageSource, AuthCookieService authCookieService) {
        this.messageSource = messageSource;
        this.authCookieService = authCookieService;
    }

    @ExceptionHandler({ EmailAlreadyExistsException.class, com.theadbasket.backend.common.exception.ConflictException.class })
    public ResponseEntity<ApiError> handleEmailExists(AppException ex, HttpServletRequest request) {
        log.warn("Conflict on {}: {}", request.getRequestURI(), ex.getErrorCode());
        return build(HttpStatus.CONFLICT, ex, request);
    }

    @ExceptionHandler(com.theadbasket.backend.common.exception.ServiceUnavailableException.class)
    public ResponseEntity<ApiError> handleServiceUnavailable(com.theadbasket.backend.common.exception.ServiceUnavailableException ex, HttpServletRequest request) {
        log.warn("Service unavailable on {}: {}", request.getRequestURI(), ex.getErrorCode());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .header(HttpHeaders.RETRY_AFTER, "5")
                .body(ApiError.of(HttpStatus.SERVICE_UNAVAILABLE.value(), HttpStatus.SERVICE_UNAVAILABLE.getReasonPhrase(),
                        ex.getErrorCode().name(), resolve(ex.getErrorCode(), ex.getArgs()), request.getRequestURI()));
    }

    @ExceptionHandler(StaleAvailabilityException.class)
    public ResponseEntity<StaleAvailabilityError> handleStaleAvailability(
            StaleAvailabilityException ex, HttpServletRequest request) {
        log.warn("Stale availability on {}: etag={}", request.getRequestURI(), ex.getEtag());
        String message = resolve(ex.getErrorCode(), ex.getArgs());
        StaleAvailabilityError body = StaleAvailabilityError.of(
                request.getRequestURI(),
                message,
                ex.getCurrentBlocks(),
                ex.getEtag(),
                ex.getToday()
        );
        return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED)
                .header(HttpHeaders.ETAG, "\"" + ex.getEtag() + "\"")
                .body(body);
    }

    @ExceptionHandler(HoldConflictException.class)
    public ResponseEntity<HoldConflictError> handleHoldConflict(
            HoldConflictException ex, HttpServletRequest request) {
        log.warn("Hold conflict on {}", request.getRequestURI());
        String message = resolve(ex.getErrorCode(), ex.getArgs());
        HoldConflictError body = HoldConflictError.of(
                request.getRequestURI(),
                message,
                ex.getConflictingRanges()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(PreconditionRequiredException.class)
    public ResponseEntity<ApiError> handlePreconditionRequired(
            PreconditionRequiredException ex, HttpServletRequest request) {
        log.warn("Precondition required on {}: {}", request.getRequestURI(), ex.getErrorCode());
        return build(HttpStatus.PRECONDITION_REQUIRED, ex, request);
    }

    @ExceptionHandler(AvailabilityBusyException.class)
    public ResponseEntity<ApiError> handleAvailabilityBusy(
            AvailabilityBusyException ex, HttpServletRequest request) {
        log.warn("Availability busy on {}: {}", request.getRequestURI(), ex.getErrorCode());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .header(HttpHeaders.RETRY_AFTER, "5")
                .body(ApiError.of(HttpStatus.SERVICE_UNAVAILABLE.value(),
                        HttpStatus.SERVICE_UNAVAILABLE.getReasonPhrase(),
                        ex.getErrorCode().name(),
                        resolve(ex.getErrorCode(), ex.getArgs()),
                        request.getRequestURI()));
    }

    @ExceptionHandler(ListingNotActiveException.class)
    public ResponseEntity<ApiError> handleListingNotActive(
            ListingNotActiveException ex, HttpServletRequest request) {
        log.warn("Listing not active on {}: {}", request.getRequestURI(), ex.getErrorCode());
        return build(HttpStatus.NOT_FOUND, ex, request);
    }

    @ExceptionHandler(TokenRefreshException.class)
    public ResponseEntity<ApiError> handleTokenRefresh(TokenRefreshException ex, HttpServletRequest request) {
        log.warn("Token refresh failed on {}: {}", request.getRequestURI(), ex.getErrorCode());
        ResponseCookie deletionCookie = authCookieService.createDeletionCookie();
        String message = resolve(ex.getErrorCode(), ex.getArgs());
        ApiError body = ApiError.of(HttpStatus.UNAUTHORIZED.value(), HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                ex.getErrorCode().name(), message, request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header(HttpHeaders.SET_COOKIE, deletionCookie.toString())
                .body(body);
    }

    @ExceptionHandler({ InvalidCredentialsException.class, InvalidGoogleTokenException.class })
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
        if (!ex.getFieldErrors().isEmpty()) {
            HttpStatus status = HttpStatus.BAD_REQUEST;
            String message = resolve(ex.getErrorCode(), ex.getArgs());
            ApiError body = ApiError.validation(status.value(), status.getReasonPhrase(),
                    ex.getErrorCode().name(), message,
                    request.getRequestURI(), ex.getFieldErrors());
            return ResponseEntity.status(status).body(body);
        }
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

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiError> handleMethodValidation(
            HandlerMethodValidationException ex, HttpServletRequest request) {
        log.warn("Method validation failed on {} ({})", sanitizeForLog(request.getRequestURI()), ex.getClass().getSimpleName());
        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableMessage(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        String uri = sanitizeForLog(request.getRequestURI());
        log.warn("Malformed request body on {} ({})", uri, ex.getClass().getSimpleName());
        log.debug("Unreadable request body details on {}", uri, ex);
        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String paramName = sanitizeForLog(ex.getName());
        log.warn("Type mismatch on {} for parameter '{}'", sanitizeForLog(request.getRequestURI()), paramName);
        if (!paramName.isBlank()) {
            HttpStatus status = HttpStatus.BAD_REQUEST;
            ApiError body = ApiError.validation(status.value(), status.getReasonPhrase(),
                    ErrorCode.VALIDATION_FAILED.name(), resolve(ErrorCode.VALIDATION_FAILED),
                    request.getRequestURI(), Map.of(paramName, "Invalid value format."));
            return ResponseEntity.status(status).body(body);
        }
        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParam(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        String paramName = sanitizeForLog(ex.getParameterName());
        log.warn("Missing required parameter '{}' on {}", paramName, sanitizeForLog(request.getRequestURI()));
        HttpStatus status = HttpStatus.BAD_REQUEST;
        ApiError body = ApiError.validation(status.value(), status.getReasonPhrase(),
                ErrorCode.VALIDATION_FAILED.name(), resolve(ErrorCode.VALIDATION_FAILED),
                request.getRequestURI(), Map.of(paramName, "Required parameter is missing."));
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        String method = sanitizeForLog(ex.getMethod());
        log.warn("Method {} not supported on {}", method, sanitizeForLog(request.getRequestURI()));
        HttpStatus status = HttpStatus.METHOD_NOT_ALLOWED;
        String message = resolve(ErrorCode.METHOD_NOT_ALLOWED, method);
        ApiError body = ApiError.of(status.value(), status.getReasonPhrase(),
                ErrorCode.METHOD_NOT_ALLOWED.name(), message, request.getRequestURI());
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(status);
        Set<HttpMethod> supported = ex.getSupportedHttpMethods();
        if (supported != null && !supported.isEmpty()) {
            builder.allow(supported.toArray(HttpMethod[]::new));
        }
        return builder.body(body);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiError> handleUnsupportedMediaType(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        log.warn("Unsupported media type on {} ({})", sanitizeForLog(request.getRequestURI()), sanitizeForLog(String.valueOf(ex.getContentType())));
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ErrorCode.UNSUPPORTED_CONTENT_TYPE, request);
    }

    @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
    public ResponseEntity<ApiError> handleNotAcceptable(
            HttpMediaTypeNotAcceptableException ex, HttpServletRequest request) {
        log.warn("Not acceptable representation requested on {}", sanitizeForLog(request.getRequestURI()));
        return build(HttpStatus.NOT_ACCEPTABLE, ErrorCode.NOT_ACCEPTABLE, request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUploadSize(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {
        log.warn("Upload size exceeded on {}", sanitizeForLog(request.getRequestURI()));
        HttpStatus status = HttpStatus.CONTENT_TOO_LARGE;
        String message = resolve(ErrorCode.FILE_TOO_LARGE, "Uploaded payload exceeds the maximum allowed size.");
        ApiError body = ApiError.of(status.value(), status.getReasonPhrase(),
                ErrorCode.FILE_TOO_LARGE.name(), message, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResourceFound(
            NoResourceFoundException ex, HttpServletRequest request) {
        log.warn("No resource found for {} {}", sanitizeForLog(request.getMethod()), sanitizeForLog(request.getRequestURI()));
        return build(HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND, request);
    }

    private static String sanitizeForLog(String value) {
        return value == null ? "" : value.replaceAll("[\\r\\n\\t]", "_");
    }

    @ExceptionHandler({
            PessimisticLockingFailureException.class,
            CannotAcquireLockException.class
    })
    public ResponseEntity<ApiError> handleLockConflict(Exception ex, HttpServletRequest request) {
        log.warn("Database lock acquisition failed on {}: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.CONFLICT, ErrorCode.CONCURRENT_MODIFICATION, request);
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

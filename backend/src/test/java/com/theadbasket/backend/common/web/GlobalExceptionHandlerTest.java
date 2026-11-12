package com.theadbasket.backend.common.web;

import com.theadbasket.backend.auth.AuthCookieService;
import com.theadbasket.backend.common.error.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding("UTF-8");
        AuthCookieService authCookieService = mock(AuthCookieService.class);
        handler = new GlobalExceptionHandler(messageSource, authCookieService);
    }

    @Test
    @DisplayName("PessimisticLockingFailureException maps to HTTP 409 Conflict with CONCURRENT_MODIFICATION")
    void handleLockConflict_pessimisticLockingFailure_returns409() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/owner/listings/1/media/sync");
        PessimisticLockingFailureException ex = new PessimisticLockingFailureException("Lock acquisition timed out");

        ResponseEntity<ApiError> response = handler.handleLockConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo(ErrorCode.CONCURRENT_MODIFICATION.name());
        assertThat(response.getBody().message()).contains("locked by another concurrent operation");
        assertThat(response.getBody().status()).isEqualTo(409);
    }

    @Test
    @DisplayName("CannotAcquireLockException maps to HTTP 409 Conflict with CONCURRENT_MODIFICATION")
    void handleLockConflict_cannotAcquireLock_returns409() {
        MockHttpServletRequest request = new MockHttpServletRequest("DELETE", "/api/owner/listings/1");
        CannotAcquireLockException ex = new CannotAcquireLockException("Could not obtain lock on table billboard_listings");

        ResponseEntity<ApiError> response = handler.handleLockConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo(ErrorCode.CONCURRENT_MODIFICATION.name());
        assertThat(response.getBody().message()).contains("locked by another concurrent operation");
        assertThat(response.getBody().status()).isEqualTo(409);
    }

    @Test
    @DisplayName("HttpMessageNotReadableException maps to HTTP 400 VALIDATION_FAILED without leaking internals")
    void handleUnreadableMessage_returns400ValidationFailed() {
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/owner/listings/1/availability");
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException(
                "JSON parse error: java.time.LocalDate",
                new MockHttpInputMessage("{}".getBytes(StandardCharsets.UTF_8)));

        ResponseEntity<ApiError> response = handler.handleUnreadableMessage(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED.name());
        assertThat(response.getBody().message()).doesNotContain("java.time");
    }

    @Test
    @DisplayName("MethodArgumentTypeMismatchException maps to HTTP 400 VALIDATION_FAILED with parameter field error")
    void handleTypeMismatch_returns400WithFieldError() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/listings/abc/availability");
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                "abc", Long.class, "billboardId", null, new NumberFormatException("abc"));

        ResponseEntity<ApiError> response = handler.handleTypeMismatch(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED.name());
        assertThat(response.getBody().fieldErrors()).containsKey("billboardId");
    }

    @Test
    @DisplayName("MissingServletRequestParameterException maps to HTTP 400 VALIDATION_FAILED with parameter field error")
    void handleMissingParam_returns400WithFieldError() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/listings/1/availability");
        MissingServletRequestParameterException ex = new MissingServletRequestParameterException("from", "LocalDate");

        ResponseEntity<ApiError> response = handler.handleMissingParam(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED.name());
        assertThat(response.getBody().fieldErrors()).containsKey("from");
    }

    @Test
    @DisplayName("HttpRequestMethodNotSupportedException maps to HTTP 405 METHOD_NOT_ALLOWED with Allow header")
    void handleMethodNotSupported_returns405WithAllowHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/listings/1/availability");
        HttpRequestMethodNotSupportedException ex = new HttpRequestMethodNotSupportedException("POST", List.of("GET"));

        ResponseEntity<ApiError> response = handler.handleMethodNotSupported(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
        assertThat(response.getHeaders().getAllow()).contains(HttpMethod.GET);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo(ErrorCode.METHOD_NOT_ALLOWED.name());
        assertThat(response.getBody().message()).contains("POST");
    }

    @Test
    @DisplayName("HttpMediaTypeNotSupportedException maps to HTTP 415 UNSUPPORTED_CONTENT_TYPE")
    void handleUnsupportedMediaType_returns415() {
        MockHttpServletRequest request = new MockHttpServletRequest("PUT", "/api/owner/listings/1/availability");
        HttpMediaTypeNotSupportedException ex = new HttpMediaTypeNotSupportedException(
                MediaType.TEXT_PLAIN, List.of(MediaType.APPLICATION_JSON));

        ResponseEntity<ApiError> response = handler.handleUnsupportedMediaType(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo(ErrorCode.UNSUPPORTED_CONTENT_TYPE.name());
    }

    @Test
    @DisplayName("HttpMediaTypeNotAcceptableException maps to HTTP 406 NOT_ACCEPTABLE")
    void handleNotAcceptable_returns406() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/listings/1/availability");
        HttpMediaTypeNotAcceptableException ex = new HttpMediaTypeNotAcceptableException(List.of(MediaType.APPLICATION_JSON));

        ResponseEntity<ApiError> response = handler.handleNotAcceptable(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_ACCEPTABLE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo(ErrorCode.NOT_ACCEPTABLE.name());
    }

    @Test
    @DisplayName("MaxUploadSizeExceededException maps to HTTP 413 FILE_TOO_LARGE")
    void handleMaxUploadSize_returns413() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/owner/listings/1/media/sync");
        MaxUploadSizeExceededException ex = new MaxUploadSizeExceededException(55_000_000L);

        ResponseEntity<ApiError> response = handler.handleMaxUploadSize(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONTENT_TOO_LARGE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo(ErrorCode.FILE_TOO_LARGE.name());
    }

    @Test
    @DisplayName("NoResourceFoundException maps to HTTP 404 RESOURCE_NOT_FOUND")
    void handleNoResourceFound_returns404() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/unknown/route");
        NoResourceFoundException ex = new NoResourceFoundException(HttpMethod.GET, "/api/unknown/route", "");

        ResponseEntity<ApiError> response = handler.handleNoResourceFound(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND.name());
    }
}


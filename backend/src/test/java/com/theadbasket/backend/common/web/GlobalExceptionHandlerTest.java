package com.theadbasket.backend.common.web;

import com.theadbasket.backend.auth.AuthCookieService;
import com.theadbasket.backend.common.error.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

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
}


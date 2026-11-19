package com.theadbasket.backend.common.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.theadbasket.backend.auth.AuthCookieService;
import java.sql.SQLException;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.transaction.TransactionSystemException;

/**
 * Verifies {@link GlobalExceptionHandler#handleDataIntegrity} unwraps both
 * {@link DataIntegrityViolationException} and commit-time {@link TransactionSystemException}
 * across Hibernate {@link ConstraintViolationException} and PostgreSQL driver {@link SQLException}
 * message formats.
 */
class GlobalExceptionHandlerConstraintTest {

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        ResourceBundleMessageSource messages = new ResourceBundleMessageSource();
        messages.setBasename("messages");
        handler = new GlobalExceptionHandler(messages, mock(AuthCookieService.class));
        request = new MockHttpServletRequest("POST", "/api/onboarding/owner");
    }

    @Test
    void postgresDriverEmailViolationWrappedInTransactionSystemException_mapsTo409EmailAlreadyExists() {
        SQLException psql = new SQLException(
                "ERROR: duplicate key value violates unique constraint \"uq_users_email\"\n  Detail: Key (email)=(a@b.com) already exists.",
                "23505");
        TransactionSystemException wrapped = new TransactionSystemException("Could not commit JPA transaction", psql);

        ResponseEntity<ApiError> response = handler.handleDataIntegrity(wrapped, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo("EMAIL_ALREADY_EXISTS");
    }

    @Test
    void hibernateOwnerProfileConstraintViolation_mapsTo409AlreadyRegistered() {
        SQLException psql = new SQLException(
                "ERROR: duplicate key value violates unique constraint \"uq_owner_profiles_user\"",
                "23505");
        ConstraintViolationException cve = new ConstraintViolationException(
                "could not execute statement", psql, "uq_owner_profiles_user");
        DataIntegrityViolationException dive = new DataIntegrityViolationException("constraint", cve);

        ResponseEntity<ApiError> response = handler.handleDataIntegrity(dive, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().errorCode()).isEqualTo("ALREADY_REGISTERED");
    }
}

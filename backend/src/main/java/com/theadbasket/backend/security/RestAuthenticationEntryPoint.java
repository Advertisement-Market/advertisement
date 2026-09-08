package com.theadbasket.backend.security;

import com.theadbasket.backend.common.error.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * Returns a JSON 401 (matching {@link com.theadbasket.backend.common.web.ApiError}'s shape,
 * including the stable {@code errorCode}) instead of a redirect when authentication is missing or
 * invalid. Written directly to avoid coupling to a specific Jackson version; the message is still
 * resolved from {@code messages.properties} so no user-facing text is hardcoded here.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final MessageSource messageSource;

    public RestAuthenticationEntryPoint(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        String message = messageSource.getMessage(
                ErrorCode.AUTHENTICATION_REQUIRED.messageKey(), null, LocaleContextHolder.getLocale());
        String body = "{"
                + "\"timestamp\":\"" + Instant.now() + "\","
                + "\"status\":401,"
                + "\"error\":\"Unauthorized\","
                + "\"errorCode\":\"" + ErrorCode.AUTHENTICATION_REQUIRED.name() + "\","
                + "\"message\":\"" + escape(message) + "\","
                + "\"path\":\"" + escape(request.getRequestURI()) + "\""
                + "}";
        response.getWriter().write(body);
    }

    private static String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}

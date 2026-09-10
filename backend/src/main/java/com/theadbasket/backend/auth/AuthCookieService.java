package com.theadbasket.backend.auth;

import com.theadbasket.backend.config.AuthCookieProperties;
import com.theadbasket.backend.config.JwtProperties;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

/**
 * Generates secure HttpOnly cookies for refresh token management and logout cleanup.
 */
@Service
public class AuthCookieService {

    private final AuthCookieProperties cookieProperties;
    private final JwtProperties jwtProperties;

    public AuthCookieService(AuthCookieProperties cookieProperties, JwtProperties jwtProperties) {
        this.cookieProperties = cookieProperties;
        this.jwtProperties = jwtProperties;
    }

    /**
     * Creates an HttpOnly {@link ResponseCookie} for a valid refresh token.
     *
     * @param token raw opaque refresh token string
     * @return configured ResponseCookie
     */
    public ResponseCookie createRefreshTokenCookie(String token) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(cookieProperties.name(), token)
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .sameSite(cookieProperties.sameSite())
                .path(cookieProperties.path())
                .maxAge(jwtProperties.refreshTokenExpiration());

        if (cookieProperties.domain() != null && !cookieProperties.domain().isBlank()) {
            builder.domain(cookieProperties.domain());
        }
        return builder.build();
    }

    /**
     * Creates a clearing {@link ResponseCookie} with {@code maxAge(0)} to remove the cookie on logout.
     *
     * @return expired ResponseCookie
     */
    public ResponseCookie createDeletionCookie() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(cookieProperties.name(), "")
                .httpOnly(true)
                .secure(cookieProperties.secure())
                .sameSite(cookieProperties.sameSite())
                .path(cookieProperties.path())
                .maxAge(0);

        if (cookieProperties.domain() != null && !cookieProperties.domain().isBlank()) {
            builder.domain(cookieProperties.domain());
        }
        return builder.build();
    }

    /**
     * Returns the configured cookie name (defaults to {@code "refreshToken"}).
     */
    public String getCookieName() {
        return cookieProperties.name();
    }
}

package com.theadbasket.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.theadbasket.backend.config.AuthCookieProperties;
import com.theadbasket.backend.config.JwtProperties;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;

class AuthCookieServiceTest {

    @Test
    void createRefreshTokenCookie_setsConfiguredAttributes() {
        AuthCookieProperties cookieProps = new AuthCookieProperties("refreshToken", false, "Strict", "/api/auth", null);
        JwtProperties jwtProps = new JwtProperties("secret", Duration.ofMinutes(15), Duration.ofDays(7));
        AuthCookieService service = new AuthCookieService(cookieProps, jwtProps);

        ResponseCookie cookie = service.createRefreshTokenCookie("sample-token-123");

        assertThat(cookie.getName()).isEqualTo("refreshToken");
        assertThat(cookie.getValue()).isEqualTo("sample-token-123");
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.isSecure()).isFalse();
        assertThat(cookie.getSameSite()).isEqualTo("Strict");
        assertThat(cookie.getPath()).isEqualTo("/api/auth");
        assertThat(cookie.getMaxAge()).isEqualTo(Duration.ofDays(7));
        assertThat(cookie.getDomain()).isNull();
    }

    @Test
    void createRefreshTokenCookie_withDomainAndSecure() {
        AuthCookieProperties cookieProps = new AuthCookieProperties("refreshToken", true, "Lax", "/api/auth", "theadbasket.com");
        JwtProperties jwtProps = new JwtProperties("secret", Duration.ofMinutes(15), Duration.ofDays(7));
        AuthCookieService service = new AuthCookieService(cookieProps, jwtProps);

        ResponseCookie cookie = service.createRefreshTokenCookie("sample-token-123");

        assertThat(cookie.isSecure()).isTrue();
        assertThat(cookie.getSameSite()).isEqualTo("Lax");
        assertThat(cookie.getDomain()).isEqualTo("theadbasket.com");
    }

    @Test
    void createDeletionCookie_setsMaxAgeZeroAndEmptyValue() {
        AuthCookieProperties cookieProps = new AuthCookieProperties("refreshToken", false, "Strict", "/api/auth", null);
        JwtProperties jwtProps = new JwtProperties("secret", Duration.ofMinutes(15), Duration.ofDays(7));
        AuthCookieService service = new AuthCookieService(cookieProps, jwtProps);

        ResponseCookie cookie = service.createDeletionCookie();

        assertThat(cookie.getName()).isEqualTo("refreshToken");
        assertThat(cookie.getValue()).isEmpty();
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getPath()).isEqualTo("/api/auth");
        assertThat(cookie.getMaxAge()).isEqualTo(Duration.ZERO);
    }
}

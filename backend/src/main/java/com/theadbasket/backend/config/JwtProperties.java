package com.theadbasket.backend.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT settings, bound from {@code app.jwt.*}.
 *
 * @param secret                 signing secret (>= 32 chars for HS256); override in prod via JWT_SECRET
 * @param accessTokenExpiration  lifetime of access tokens (e.g. {@code 15m})
 * @param refreshTokenExpiration lifetime of refresh tokens (e.g. {@code 7d})
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        String secret,
        Duration accessTokenExpiration,
        Duration refreshTokenExpiration
) {
}

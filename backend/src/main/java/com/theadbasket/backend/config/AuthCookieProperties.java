package com.theadbasket.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cookie security properties for refresh tokens, bound from {@code app.cookie.*}.
 *
 * <p>Deliberately implemented as a plain record without {@code @RefreshScope} to maintain
 * static JVM security invariants across application execution.
 *
 * @param name     cookie name (defaults to {@code "refreshToken"})
 * @param secure   whether the cookie requires HTTPS (defaults to {@code false} in dev, {@code true} in prod)
 * @param sameSite SameSite attribute ({@code "Strict"}, {@code "Lax"}, or {@code "None"})
 * @param path     cookie scope path (defaults to {@code "/api/auth"})
 * @param domain   optional domain attribute for cross-subdomain scenarios
 */
@ConfigurationProperties(prefix = "app.cookie")
public record AuthCookieProperties(
        String name,
        boolean secure,
        String sameSite,
        String path,
        String domain
) {

    public AuthCookieProperties {
        if (name == null || name.isBlank()) {
            name = "refreshToken";
        }
        if (sameSite == null || sameSite.isBlank()) {
            sameSite = "Strict";
        }
        if (path == null || path.isBlank()) {
            path = "/api/auth";
        }
    }
}

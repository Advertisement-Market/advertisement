package com.theadbasket.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Google Sign-In settings, bound from {@code app.google.*}.
 *
 * @param clientId      OAuth 2.0 Web client id; the ID token's {@code aud} must equal this.
 *                      Override via {@code GOOGLE_CLIENT_ID}. Blank disables Google login.
 * @param tokenInfoUri  endpoint used to verify an ID token (override via {@code GOOGLE_TOKENINFO_URI}).
 */
@ConfigurationProperties(prefix = "app.google")
public record GoogleProperties(
        String clientId,
        String tokenInfoUri
) {

    /** Whether Google login is configured (a client id is present). */
    public boolean enabled() {
        return clientId != null && !clientId.isBlank();
    }
}

package com.theadbasket.backend.auth;

import com.theadbasket.backend.auth.dto.GoogleTokenInfo;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.InvalidGoogleTokenException;
import com.theadbasket.backend.config.GoogleProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Verifies a Google ID token by calling Google's tokeninfo endpoint (which validates the signature
 * and expiry), then asserts the token's audience matches our configured OAuth client id.
 */
@Component
public class GoogleTokenVerifier {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifier.class);

    private final GoogleProperties properties;
    private final RestClient restClient;

    public GoogleTokenVerifier(GoogleProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.create();
    }

    /** Verifies the ID token and returns its claims, or throws if it is missing/invalid/untrusted. */
    public GoogleTokenInfo verify(String idToken) {
        if (!properties.enabled()) {
            throw new BadRequestException("Google sign-in is not configured on the server.");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new InvalidGoogleTokenException("Missing Google credential.");
        }

        GoogleTokenInfo info;
        try {
            info = restClient.get()
                    .uri(properties.tokenInfoUri() + "?id_token={token}", idToken)
                    .retrieve()
                    .body(GoogleTokenInfo.class);
        } catch (RuntimeException ex) {
            log.warn("Google token verification call failed: {}", ex.getMessage());
            throw new InvalidGoogleTokenException("Google could not verify this sign-in. Please try again.");
        }

        if (info == null || info.sub() == null || info.email() == null) {
            log.warn("Google token verification returned an incomplete profile");
            throw new InvalidGoogleTokenException("Google returned an incomplete profile.");
        }
        if (!properties.clientId().equals(info.aud())) {
            log.warn("Google token audience mismatch (aud={})", info.aud());
            throw new InvalidGoogleTokenException("This Google sign-in was not issued for The AdBasket.");
        }
        return info;
    }
}

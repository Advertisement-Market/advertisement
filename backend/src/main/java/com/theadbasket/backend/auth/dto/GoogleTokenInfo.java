package com.theadbasket.backend.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Verified claims from Google's tokeninfo endpoint. {@code email_verified} arrives as a string
 * ("true"/"false"); unknown fields are ignored so the model survives Google adding claims.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleTokenInfo(
        String aud,
        String sub,
        String email,
        @JsonProperty("email_verified") String emailVerified,
        @JsonProperty("given_name") String givenName,
        @JsonProperty("family_name") String familyName,
        String name
) {

    public boolean isEmailVerified() {
        return "true".equalsIgnoreCase(emailVerified);
    }
}

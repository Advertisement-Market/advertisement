package com.theadbasket.backend.auth.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GoogleTokenInfoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("Deserializes real Google tokeninfo response payload")
    void deserializesGoogleTokenInfoPayload() throws Exception {
        String json = """
                {
                    "aud": "client-id",
                    "sub": "12345",
                    "email": "user@gmail.com",
                    "email_verified": "true",
                    "given_name": "Jane",
                    "family_name": "Doe",
                    "name": "Jane Doe"
                }
                """;

        GoogleTokenInfo info = objectMapper.readValue(json, GoogleTokenInfo.class);

        assertThat(info.aud()).isEqualTo("client-id");
        assertThat(info.sub()).isEqualTo("12345");
        assertThat(info.email()).isEqualTo("user@gmail.com");
        assertThat(info.isEmailVerified()).isTrue();
        assertThat(info.emailVerified()).isTrue();
        assertThat(info.givenName()).isEqualTo("Jane");
        assertThat(info.familyName()).isEqualTo("Doe");
        assertThat(info.name()).isEqualTo("Jane Doe");
    }

    @Test
    @DisplayName("Deserializes when Google returns boolean true for email_verified")
    void deserializesWithEmailVerifiedAsBooleanTrue() throws Exception {
        String json = """
                {
                    "aud": "client-id",
                    "sub": "12345",
                    "email": "user@gmail.com",
                    "email_verified": true
                }
                """;

        GoogleTokenInfo info = objectMapper.readValue(json, GoogleTokenInfo.class);
        assertThat(info.isEmailVerified()).isTrue();
    }

    @Test
    @DisplayName("Deserializes with legacy is_email_verified property alias")
    void deserializesWithLegacyIsEmailVerifiedAlias() throws Exception {
        String json = """
                {
                    "aud": "client-id",
                    "sub": "12345",
                    "email": "user@gmail.com",
                    "is_email_verified": "true"
                }
                """;

        GoogleTokenInfo info = objectMapper.readValue(json, GoogleTokenInfo.class);
        assertThat(info.isEmailVerified()).isTrue();
    }

    @Test
    @DisplayName("Deserializes when email_verified is false")
    void deserializesWithEmailVerifiedFalse() throws Exception {
        String json = """
                {
                    "aud": "client-id",
                    "sub": "12345",
                    "email": "user@gmail.com",
                    "email_verified": "false"
                }
                """;

        GoogleTokenInfo info = objectMapper.readValue(json, GoogleTokenInfo.class);
        assertThat(info.isEmailVerified()).isFalse();
    }

    @Test
    @DisplayName("Ignores unknown Google claims without throwing")
    void ignoresUnknownGoogleClaims() throws Exception {
        String json = """
                {
                    "aud": "client-id",
                    "sub": "12345",
                    "email": "user@gmail.com",
                    "email_verified": "true",
                    "picture": "https://lh3.googleusercontent.com/a/photo",
                    "locale": "en",
                    "azp": "client-id.apps.googleusercontent.com",
                    "exp": "1700000000"
                }
                """;

        GoogleTokenInfo info = objectMapper.readValue(json, GoogleTokenInfo.class);
        assertThat(info.email()).isEqualTo("user@gmail.com");
        assertThat(info.isEmailVerified()).isTrue();
    }
}

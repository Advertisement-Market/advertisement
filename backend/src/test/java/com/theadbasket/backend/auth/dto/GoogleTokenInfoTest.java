package com.theadbasket.backend.auth.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GoogleTokenInfoTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deserializesWithEmailVerifiedAsStringTrue() throws Exception {
        String json = """
                {
                    "aud": "my-client-id",
                    "sub": "google-123",
                    "email": "user@example.com",
                    "email_verified": "true",
                    "given_name": "John",
                    "family_name": "Doe",
                    "name": "John Doe"
                }
                """;

        GoogleTokenInfo info = objectMapper.readValue(json, GoogleTokenInfo.class);

        assertThat(info.aud()).isEqualTo("my-client-id");
        assertThat(info.sub()).isEqualTo("google-123");
        assertThat(info.email()).isEqualTo("user@example.com");
        assertThat(info.emailVerified()).isTrue();
        assertThat(info.isEmailVerified()).isTrue();
        assertThat(info.givenName()).isEqualTo("John");
        assertThat(info.familyName()).isEqualTo("Doe");
    }

    @Test
    void deserializesWithEmailVerifiedAsBooleanTrue() throws Exception {
        String json = """
                {
                    "aud": "my-client-id",
                    "sub": "google-123",
                    "email": "user@example.com",
                    "email_verified": true
                }
                """;

        GoogleTokenInfo info = objectMapper.readValue(json, GoogleTokenInfo.class);
        assertThat(info.isEmailVerified()).isTrue();
    }

    @Test
    void deserializesWithLegacyIsEmailVerifiedAlias() throws Exception {
        String json = """
                {
                    "aud": "my-client-id",
                    "sub": "google-123",
                    "email": "user@example.com",
                    "is_email_verified": "true"
                }
                """;

        GoogleTokenInfo info = objectMapper.readValue(json, GoogleTokenInfo.class);
        assertThat(info.isEmailVerified()).isTrue();
    }

    @Test
    void deserializesWithEmailVerifiedFalse() throws Exception {
        String json = """
                {
                    "aud": "my-client-id",
                    "sub": "google-123",
                    "email": "user@example.com",
                    "email_verified": "false"
                }
                """;

        GoogleTokenInfo info = objectMapper.readValue(json, GoogleTokenInfo.class);
        assertThat(info.isEmailVerified()).isFalse();
    }
}

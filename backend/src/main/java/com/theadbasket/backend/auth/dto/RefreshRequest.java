package com.theadbasket.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Payload for token refresh and logout. */
public record RefreshRequest(

        @NotBlank(message = "Refresh token is required.")
        String refreshToken
) {
}

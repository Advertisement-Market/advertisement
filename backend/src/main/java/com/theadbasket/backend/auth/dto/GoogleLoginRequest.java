package com.theadbasket.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Payload for Google sign-in: the ID token (JWT credential) returned by Google Identity Services. */
public record GoogleLoginRequest(

        @NotBlank(message = "Google credential is required.")
        String idToken
) {
}

package com.theadbasket.backend.auth.dto;

/** Tokens + user returned on successful register / login / refresh. */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UserResponse user,
        Long initialListingId
) {

    public AuthResponse(String accessToken, String refreshToken, String tokenType, long expiresIn, UserResponse user) {
        this(accessToken, refreshToken, tokenType, expiresIn, user, null);
    }

    public static AuthResponse bearer(String accessToken, String refreshToken, long expiresIn, UserResponse user) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresIn, user, null);
    }

    public static AuthResponse bearer(String accessToken, String refreshToken, long expiresIn, UserResponse user, Long initialListingId) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresIn, user, initialListingId);
    }
}

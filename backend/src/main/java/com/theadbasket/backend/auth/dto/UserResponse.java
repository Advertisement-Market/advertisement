package com.theadbasket.backend.auth.dto;

import com.theadbasket.backend.user.AuthProvider;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;

/** Public view of a user (never exposes the password hash). */
public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        Role role,
        boolean onboarded,
        boolean hasPassword,
        AuthProvider authProvider,
        boolean emailVerified
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getRole() != null && user.getRole().isOnboarded(),
                user.hasPassword(),
                user.getAuthProvider(),
                user.isEmailVerified()
        );
    }
}

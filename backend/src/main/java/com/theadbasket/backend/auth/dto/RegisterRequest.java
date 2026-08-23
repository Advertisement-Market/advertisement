package com.theadbasket.backend.auth.dto;

import com.theadbasket.backend.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Basic (identity-only) registration payload. {@code phone} is optional and {@code role} is
 * optional — a fresh account defaults to the configured default role ({@code MEMBER}). Password
 * length is enforced by the server policy ({@code app.auth.*}).
 */
public record RegisterRequest(

        @NotBlank(message = "First name is required.")
        @Size(max = 80)
        String firstName,

        @NotBlank(message = "Last name is required.")
        @Size(max = 80)
        String lastName,

        @NotBlank(message = "Email is required.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 180)
        String email,

        @Pattern(regexp = "^$|^[0-9+\\-\\s]{10,15}$", message = "Enter a valid phone number.")
        String phone,

        Role role,

        @NotBlank(message = "Password is required.")
        @Size(max = 72, message = "Password must be at most 72 characters.")
        String password
) {
}

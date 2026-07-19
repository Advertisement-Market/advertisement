package com.theadbasket.backend.auth.dto;

import com.theadbasket.backend.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Registration payload. {@code phone} is optional; {@code role} is ADVERTISER, OWNER, or AGENCY. */
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

        @NotNull(message = "Role is required.")
        Role role,

        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 72, message = "Password must be 8–72 characters.")
        String password
) {
}

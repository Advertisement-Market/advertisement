package com.theadbasket.backend.config;

import com.theadbasket.backend.user.Role;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tunable authentication business rules, bound from {@code app.auth.*}.
 *
 * @param passwordMinLength minimum length for a new/updated password
 * @param passwordMaxLength maximum length (BCrypt truncates beyond 72 bytes)
 * @param defaultRole       role assigned to a fresh basic (identity-only) account
 */
@ConfigurationProperties(prefix = "app.auth")
public record AuthPolicyProperties(
        int passwordMinLength,
        int passwordMaxLength,
        Role defaultRole
) {

    public AuthPolicyProperties {
        if (passwordMinLength <= 0) {
            passwordMinLength = 8;
        }
        if (passwordMaxLength <= 0) {
            passwordMaxLength = 72;
        }
        if (defaultRole == null) {
            defaultRole = Role.MEMBER;
        }
    }
}

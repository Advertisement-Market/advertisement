package com.theadbasket.backend.security;

import com.theadbasket.backend.user.Role;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * The authenticated principal for JWT-protected requests, built directly from the token's claims
 * ({@code uid}, {@code sub}=email, {@code role}) — no per-request database lookup. Injected via
 * {@code @AuthenticationPrincipal}.
 */
public record AuthenticatedUser(Long id, String email, Role role) {

    public Collection<GrantedAuthority> authorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
}

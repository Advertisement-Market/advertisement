package com.theadbasket.backend.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.validation.annotation.Validated;

import com.theadbasket.backend.user.AuthProvider;

import jakarta.validation.constraints.NotEmpty;

/**
 * Which authentication providers currently accept sign-in/registration, bound
 * from {@code app.auth-providers.*}. Backed by
 * {@code config/feature-policy.yml} (external, hot-reloadable via
 * {@code POST /actuator/refresh}) with the values in application.yml as the
 * compiled-in fallback.
 *
 * <p>
 * Deliberately a mutable class, not a record: see {@link RolePolicyProperties}.
 */
@RefreshScope
@Validated
@ConfigurationProperties(prefix = "app.auth-providers")
public class AuthProviderPolicyProperties {

    @NotEmpty(message = "At least one auth provider must remain enabled.")
    private List<AuthProvider> enabled = List.of(AuthProvider.LOCAL);

    public List<AuthProvider> getEnabled() {
        return enabled;
    }

    public void setEnabled(List<AuthProvider> enabled) {
        this.enabled = enabled;
    }

    public boolean isEnabled(AuthProvider provider) {
        return enabled.contains(provider);
    }
}

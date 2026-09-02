package com.theadbasket.backend.config;

import java.util.List;
import java.util.Set;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.validation.annotation.Validated;

import com.theadbasket.backend.user.Role;

import jakarta.validation.constraints.NotEmpty;

/**
 * Which marketplace roles currently accept new registrations, bound from
 * {@code app.roles.*}. Backed by {@code config/feature-policy.yml} (external,
 * hot-reloadable via {@code POST /actuator/refresh}) with the values in
 * application.yml as the compiled-in fallback.
 *
 * <p>
 * Deliberately a mutable class, not a record: {@code @RefreshScope} works by
 * generating a CGLIB proxy subclass on refresh, and all Java records are
 * implicitly final, which CGLIB cannot subclass.
 */
@RefreshScope
@Validated
@ConfigurationProperties(prefix = "app.roles")
public class RolePolicyProperties {

    @NotEmpty(message = "At least one role must remain enabled.")
    private List<Role> enabled = List.of(Role.MEMBER);

    public List<Role> getEnabled() {
        return enabled;
    }

    public void setEnabled(List<Role> enabled) {
        this.enabled = enabled;
    }

    public boolean isEnabled(Role role) {
        return enabled.contains(role);
    }

    public Set<Role> enabledSet() {
        return Set.copyOf(enabled);
    }
}

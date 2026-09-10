package com.theadbasket.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

/**
 * Credentials for the actuator-only HTTP Basic auth chain. Bound from
 * app.actuator.username / app.actuator.password in application.yml, which in
 * turn resolve from the ACTUATOR_ADMIN_USER / ACTUATOR_ADMIN_PASSWORD env vars
 * in real deployments.
 *
 * <p>
 * Deliberately a mutable class with a default constructor, not a record:
 * Spring Cloud's {@code ConfigurationPropertiesRebinder} requires a zero-argument
 * constructor and mutable setters to rebind properties during {@code /actuator/refresh}
 * without raising {@code BeanInstantiationException}.
 */
@RefreshScope
@Validated
@ConfigurationProperties(prefix = "app.actuator")
public class ActuatorCredentialsProperties {

    @NotBlank(message = "Actuator admin username must not be blank.")
    private String username = "admin";

    @NotBlank(message = "Actuator admin password must not be blank.")
    private String password = "dev-only-change-me";

    public ActuatorCredentialsProperties() {
    }

    public ActuatorCredentialsProperties(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // Convenience record-style accessors for backward compatibility
    public String username() {
        return username;
    }

    public String password() {
        return password;
    }
}

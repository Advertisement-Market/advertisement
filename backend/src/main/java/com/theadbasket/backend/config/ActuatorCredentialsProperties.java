package com.theadbasket.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Credentials for the actuator-only HTTP Basic auth chain. Bound from
 * app.actuator.username / app.actuator.password in application.yml, which in
 * turn resolve from the ACTUATOR_ADMIN_USER / ACTUATOR_ADMIN_PASSWORD env vars
 * in real deployments.
 */
@ConfigurationProperties(prefix = "app.actuator")
public record ActuatorCredentialsProperties(String username, String password) {

}

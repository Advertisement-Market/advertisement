package com.theadbasket.backend.config;

import org.springframework.boot.security.autoconfigure.actuate.web.servlet.EndpointRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Separate security chain scoped only to actuator endpoints (served on the
 * management port, 8081 — see application.yml). This never touches the public
 * API's SecurityConfig, since EndpointRequest.toAnyEndpoint() only matches
 * actuator paths.
 *
 * health/info are left public for uptime checks / load balancers; every other
 * actuator endpoint (notably /refresh) requires HTTP Basic auth against the
 * single admin account defined by ActuatorCredentialsProperties.
 */
@Configuration
@EnableWebSecurity
public class ActuatorSecurityConfig {

    @Bean
    @Order(0)
    public SecurityFilterChain actuatorSecurityFilterChain(
            HttpSecurity http,
            UserDetailsService actuatorUserDetailsService) throws Exception {

        http
                .securityMatcher(EndpointRequest.toAnyEndpoint())
                .authorizeHttpRequests(auth -> auth
                .requestMatchers(EndpointRequest.to("health", "info")).permitAll()
                .anyRequest().authenticated())
                .httpBasic(withDefaults -> {
                })
                .csrf(csrf -> csrf.disable())
                .userDetailsService(actuatorUserDetailsService);

        return http.build();
    }

    @Bean
    public UserDetailsService actuatorUserDetailsService(
            ActuatorCredentialsProperties credentials,
            PasswordEncoder passwordEncoder) {

        var admin = User.builder()
                .username(credentials.username())
                .password(passwordEncoder.encode(credentials.password()))
                .roles("ACTUATOR_ADMIN")
                .build();

        return new InMemoryUserDetailsManager(admin);
    }
}

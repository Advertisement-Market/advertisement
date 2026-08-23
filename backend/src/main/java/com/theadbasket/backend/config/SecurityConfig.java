package com.theadbasket.backend.config;

import com.theadbasket.backend.security.JwtAuthenticationFilter;
import com.theadbasket.backend.security.RestAuthenticationEntryPoint;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Stateless JWT security. Auth endpoints, the ping, actuator health/metrics and the H2
 * console (dev) are public; everything else requires a valid bearer token.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] PUBLIC_PATHS = {
        // Auth endpoints that must be reachable without a token (NOT /api/auth/me).
        "/api/auth/register", "/api/auth/register/**",
        "/api/auth/login", "/api/auth/google", "/api/auth/refresh", "/api/auth/logout",
        "/api/ping",
        "/actuator/health", "/actuator/health/**", "/actuator/info", "/actuator/prometheus",
        "/h2-console/**"
    };

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          RestAuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(PUBLIC_PATHS).permitAll()
                // Role-scoped API namespaces (MEMBER accounts must onboard into a role first).
                .requestMatchers("/api/advertiser/**").hasRole("ADVERTISER")
                .requestMatchers("/api/owner/**").hasRole("OWNER")
                .requestMatchers("/api/agency/**").hasRole("AGENCY")
                .anyRequest().authenticated())
            .exceptionHandling(ex -> ex.authenticationEntryPoint(authenticationEntryPoint))
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(CorsProperties corsProperties) {
        CorsConfiguration config = new CorsConfiguration();
        // Allowed browser origins come from app.cors.allowed-origins (CORS_ALLOWED_ORIGINS).
        config.setAllowedOrigins(corsProperties.allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

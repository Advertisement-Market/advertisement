package com.theadbasket.backend.user;

import static org.assertj.core.api.Assertions.assertThat;

import com.theadbasket.backend.config.JpaConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Verifies the users schema + repository against a real PostgreSQL 18 (Testcontainers).
 * Requires Docker; skipped where Docker is unavailable.
 */
@DataJpaTest
@Import(JpaConfig.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class UserRepositoryIT {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:18-alpine");

    @Autowired
    private UserRepository userRepository;

    @Test
    void savesAndLooksUpByEmailCaseInsensitively() {
        userRepository.save(new User("Test", "User", "test@example.com", "hash", "+911234567890", Role.OWNER));

        assertThat(userRepository.existsByEmailIgnoreCase("test@example.com")).isTrue();
        assertThat(userRepository.findByEmailIgnoreCase("TEST@EXAMPLE.COM")).isPresent();
        assertThat(userRepository.findByEmailIgnoreCase("missing@example.com")).isEmpty();
    }
}

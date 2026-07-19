package com.theadbasket.backend.sample;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Integration test that runs against a real PostgreSQL 18 in a Testcontainers container,
 * verifying the Flyway migration applies and seeds data.
 *
 * <p>Requires Docker to be running. Skipped automatically where Docker is unavailable.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class SampleItemRepositoryIT {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:18-alpine");

    @Autowired
    private SampleItemRepository repository;

    @Test
    void flywaySeedsSampleData() {
        assertThat(repository.findAll())
                .extracting(SampleItem::getName)
                .contains("First sample", "Second sample");
    }
}

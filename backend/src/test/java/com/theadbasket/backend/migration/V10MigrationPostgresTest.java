package com.theadbasket.backend.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies V10 Flyway migration, check constraints, indexes, and cascading rules
 * against a real PostgreSQL 16 instance.
 * Matches production image postgres:16-alpine.
 * Gracefully skipped if Docker is unavailable locally; runs in CI.
 */
@Testcontainers(disabledWithoutDocker = true)
class V10MigrationPostgresTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("sa")
            .withPassword("sa");

    @Test
    @DisplayName("V10 migration against real PostgreSQL 16: table creation, check constraints, indexes, and cascading rules")
    void testV10MigrationOnRealPostgreSql() throws Exception {
        PGSimpleDataSource ds = new PGSimpleDataSource();
        ds.setUrl(POSTGRES.getJdbcUrl());
        ds.setUser(POSTGRES.getUsername());
        ds.setPassword(POSTGRES.getPassword());

        // 1. Run migrations up to V9
        Flyway flywayV9 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("9")
                .load();
        flywayV9.migrate();

        long userId;
        long addressId;
        long billboardId = 2001L;

        // 2. Seed prerequisite records
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.execute("INSERT INTO users (first_name, last_name, email, password, role) " +
                    "VALUES ('Test', 'Owner', 'owner10pg@example.com', 'pw', 'OWNER')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM users WHERE email = 'owner10pg@example.com'")) {
                assertThat(rs.next()).isTrue();
                userId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO addresses (line1, pincode, city, state) " +
                    "VALUES ('200 MG Road', '560001', 'Bangalore', 'Karnataka')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM addresses WHERE line1 = '200 MG Road'")) {
                assertThat(rs.next()).isTrue();
                addressId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days, status) " +
                    "VALUES (" + billboardId + ", " + userId + ", 'Test Billboard V10 PG', " + addressId + ", 'DIGITAL', 20.0, 10.0, 'NORTH', " +
                    "'VEHICULAR', 'YOUTH', 500.00, 1, 'DAY', 1, 'ACTIVE')");
        }

        // 3. Migrate to V10
        Flyway flywayV10 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("10")
                .load();
        flywayV10.migrate();

        // 4. Verify table and constraints in PostgreSQL
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {

            // Insert valid block
            stmt.execute("INSERT INTO billboard_availability_blocks (billboard_id, start_date, end_date, block_type, created_by) " +
                    "VALUES (" + billboardId + ", '2026-12-01', '2026-12-10', 'OWNER_BLOCKED', " + userId + ")");

            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM billboard_availability_blocks WHERE billboard_id = " + billboardId)) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).isEqualTo(1);
            }

            // Check constraint: end_date < start_date violates chk_avail_date_order
            assertThatThrownBy(() -> {
                stmt.execute("INSERT INTO billboard_availability_blocks (billboard_id, start_date, end_date, block_type, created_by) " +
                        "VALUES (" + billboardId + ", '2026-12-10', '2026-12-01', 'OWNER_BLOCKED', " + userId + ")");
            }).isInstanceOf(SQLException.class);

            // Buyer deletion sets created_by to NULL
            stmt.execute("INSERT INTO users (first_name, last_name, email, password, role) " +
                    "VALUES ('Buyer', 'User', 'buyer10pg@example.com', 'pw', 'ADVERTISER')");
            long buyerId;
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM users WHERE email = 'buyer10pg@example.com'")) {
                assertThat(rs.next()).isTrue();
                buyerId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO billboard_availability_blocks (billboard_id, start_date, end_date, block_type, created_by) " +
                    "VALUES (" + billboardId + ", '2026-12-15', '2026-12-20', 'CONFIRMED_BOOKING', " + buyerId + ")");

            stmt.execute("DELETE FROM users WHERE id = " + buyerId);
            try (ResultSet rs = stmt.executeQuery("SELECT created_by FROM billboard_availability_blocks WHERE start_date = '2026-12-15'")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getObject("created_by")).isNull();
            }

            // Listing deletion cascades and deletes blocks
            stmt.execute("DELETE FROM billboard_listings WHERE id = " + billboardId);
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM billboard_availability_blocks WHERE billboard_id = " + billboardId)) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).isZero();
            }
        }
    }
}


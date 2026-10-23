package com.theadbasket.backend.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies V9 Flyway migration and constraints against a real PostgreSQL 16 instance.
 * Matches production image postgres:16-alpine.
 * Gracefully skipped if Docker is unavailable locally; runs in CI.
 */
@Testcontainers(disabledWithoutDocker = true)
class V9MigrationPostgresTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("sa")
            .withPassword("sa");

    @Test
    @DisplayName("V9 migration against real PostgreSQL 16: backfills status, creates billboard_media and unique constraints")
    void testV9MigrationOnRealPostgreSql() throws Exception {
        PGSimpleDataSource ds = new PGSimpleDataSource();
        ds.setUrl(POSTGRES.getJdbcUrl());
        ds.setUser(POSTGRES.getUsername());
        ds.setPassword(POSTGRES.getPassword());

        // 1. Run migrations up to V8
        Flyway flywayV8 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("8")
                .load();
        flywayV8.migrate();

        long userId;
        long addressId;

        // 2. Seed prerequisite records
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.execute("INSERT INTO users (first_name, last_name, email, password, role) " +
                    "VALUES ('Owner', 'User', 'owner_pg9@example.com', 'hashedpw', 'OWNER')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM users WHERE email = 'owner_pg9@example.com'")) {
                assertThat(rs.next()).isTrue();
                userId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO addresses (line1, pincode, city, state) " +
                    "VALUES ('123 MG Road', '560001', 'Bangalore', 'Karnataka')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM addresses WHERE line1 = '123 MG Road'")) {
                assertThat(rs.next()).isTrue();
                addressId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days) " +
                    "VALUES (301, " + userId + ", 'Legacy Postgres Billboard', " + addressId + ", 'UNIPOLE', 20.0, 10.0, 'NORTH', " +
                    "'CITY_URBAN', 'COMMUTERS', 15000.00, 1, 'WEEKS', 7)");
        }

        // 3. Migrate to V9
        Flyway flywayV9 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("9")
                .load();
        flywayV9.migrate();

        // 4. Verify in real PostgreSQL
        try (Connection conn = ds.getConnection()) {
            // Verify status backfill
            try (PreparedStatement ps = conn.prepareStatement("SELECT status, rejection_reason, suspension_reason FROM billboard_listings WHERE id = 301");
                 ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString("status")).isEqualTo("ACTIVE");
                assertThat(rs.getString("rejection_reason")).isNull();
                assertThat(rs.getString("suspension_reason")).isNull();
            }

            // Verify billboard_media insertions
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO billboard_media (billboard_id, category, storage_key, upload_id, original_name, content_type, file_size_bytes, is_cover, display_order) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
                ps.setLong(1, 301L);
                ps.setString(2, "DAY_PHOTO");
                ps.setString(3, "billboards/301/uuid-1.jpg");
                ps.setString(4, "upload-uuid-1");
                ps.setString(5, "front.jpg");
                ps.setString(6, "image/jpeg");
                ps.setLong(7, 1024000L);
                ps.setBoolean(8, true);
                ps.setInt(9, 1);
                assertThat(ps.executeUpdate()).isEqualTo(1);

                // Insert second photo (not cover)
                ps.setLong(1, 301L);
                ps.setString(2, "NIGHT_PHOTO");
                ps.setString(3, "billboards/301/uuid-2.jpg");
                ps.setString(4, "upload-uuid-2");
                ps.setString(5, "night.jpg");
                ps.setString(6, "image/jpeg");
                ps.setLong(7, 2048000L);
                ps.setNull(8, java.sql.Types.BOOLEAN);
                ps.setInt(9, 2);
                assertThat(ps.executeUpdate()).isEqualTo(1);
            }

            // Duplicate upload_id rejection
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO billboard_media (billboard_id, category, storage_key, upload_id, original_name, content_type, file_size_bytes, is_cover, display_order) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
                ps.setLong(1, 301L);
                ps.setString(2, "DAY_PHOTO");
                ps.setString(3, "billboards/301/uuid-dup.jpg");
                ps.setString(4, "upload-uuid-1");
                ps.setString(5, "dup.jpg");
                ps.setString(6, "image/jpeg");
                ps.setLong(7, 500000L);
                ps.setNull(8, java.sql.Types.BOOLEAN);
                ps.setInt(9, 3);
                assertThatThrownBy(ps::executeUpdate)
                        .isInstanceOf(SQLException.class);
            }

            // Duplicate is_cover = TRUE rejection
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO billboard_media (billboard_id, category, storage_key, upload_id, original_name, content_type, file_size_bytes, is_cover, display_order) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
                ps.setLong(1, 301L);
                ps.setString(2, "DAY_PHOTO");
                ps.setString(3, "billboards/301/uuid-3.jpg");
                ps.setString(4, "upload-uuid-3");
                ps.setString(5, "second_cover.jpg");
                ps.setString(6, "image/jpeg");
                ps.setLong(7, 800000L);
                ps.setBoolean(8, true);
                ps.setInt(9, 3);
                assertThatThrownBy(ps::executeUpdate)
                        .isInstanceOf(SQLException.class);
            }
        }
    }
}

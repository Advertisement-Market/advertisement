package com.theadbasket.backend.migration;

import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class V9MigrationTest {

    @Test
    @DisplayName("V9 migration adds status and review columns to billboard_listings, backfills legacy listings to ACTIVE, and creates billboard_media table with constraints")
    void testV9Migration() throws Exception {
        String dbName = "v9_migration_test_" + UUID.randomUUID().toString().replace("-", "");
        JdbcDataSource ds = new JdbcDataSource();
        ds.setURL("jdbc:h2:mem:" + dbName + ";DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE");
        ds.setUser("sa");
        ds.setPassword("");

        // 1. Run migrations up to V8
        Flyway flywayV8 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("8")
                .load();
        flywayV8.migrate();

        long userId;
        long addressId;

        // 2. Seed prerequisite records (user, address, and legacy billboard listing)
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.execute("INSERT INTO users (first_name, last_name, email, password, role) " +
                    "VALUES ('Test', 'Owner', 'owner9@example.com', 'pw', 'OWNER')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM users WHERE email = 'owner9@example.com'")) {
                assertThat(rs.next()).isTrue();
                userId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO addresses (line1, pincode, city, state) " +
                    "VALUES ('99 Tech Park', '560001', 'Bangalore', 'Karnataka')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM addresses WHERE line1 = '99 Tech Park'")) {
                assertThat(rs.next()).isTrue();
                addressId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days) " +
                    "VALUES (201, " + userId + ", 'Legacy Billboard', " + addressId + ", 'UNIPOLE', 20.0, 10.0, 'NORTH', " +
                    "'CITY_URBAN', 'COMMUTERS', 15000.00, 1, 'WEEKS', 7)");
        }

        // 3. Migrate to V9
        Flyway flywayV9 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("9")
                .load();
        flywayV9.migrate();

        // 4. Verify post-migration state
        try (Connection conn = ds.getConnection()) {
            // Verify legacy listing status backfilled to ACTIVE
            try (PreparedStatement ps = conn.prepareStatement("SELECT status, rejection_reason, suspension_reason FROM billboard_listings WHERE id = 201");
                 ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString("status")).isEqualTo("ACTIVE");
                assertThat(rs.getString("rejection_reason")).isNull();
                assertThat(rs.getString("suspension_reason")).isNull();
            }

            // Verify billboard_media table columns
            DatabaseMetaData meta = conn.getMetaData();
            try (ResultSet cols = meta.getColumns(null, null, "billboard_media", "upload_id")) {
                assertThat(cols.next()).isTrue();
            }
            try (ResultSet cols = meta.getColumns(null, null, "billboard_media", "storage_key")) {
                assertThat(cols.next()).isTrue();
            }

            // Insert valid media rows
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO billboard_media (billboard_id, category, storage_key, upload_id, original_name, content_type, file_size_bytes, is_cover, display_order) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
                ps.setLong(1, 201L);
                ps.setString(2, "DAY_PHOTO");
                ps.setString(3, "billboards/201/uuid-1.jpg");
                ps.setString(4, "upload-uuid-1");
                ps.setString(5, "front_view.jpg");
                ps.setString(6, "image/jpeg");
                ps.setLong(7, 1024000L);
                ps.setBoolean(8, true);
                ps.setInt(9, 1);
                assertThat(ps.executeUpdate()).isEqualTo(1);

                // Insert second photo (not cover -> null)
                ps.setLong(1, 201L);
                ps.setString(2, "NIGHT_PHOTO");
                ps.setString(3, "billboards/201/uuid-2.jpg");
                ps.setString(4, "upload-uuid-2");
                ps.setString(5, "night_lit.jpg");
                ps.setString(6, "image/jpeg");
                ps.setLong(7, 2048000L);
                ps.setNull(8, java.sql.Types.BOOLEAN);
                ps.setInt(9, 2);
                assertThat(ps.executeUpdate()).isEqualTo(1);
            }

            // Verify duplicate upload_id is rejected by unique constraint
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO billboard_media (billboard_id, category, storage_key, upload_id, original_name, content_type, file_size_bytes, is_cover, display_order) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
                ps.setLong(1, 201L);
                ps.setString(2, "DAY_PHOTO");
                ps.setString(3, "billboards/201/uuid-dup.jpg");
                ps.setString(4, "upload-uuid-1"); // Duplicate!
                ps.setString(5, "dup.jpg");
                ps.setString(6, "image/jpeg");
                ps.setLong(7, 500000L);
                ps.setNull(8, java.sql.Types.BOOLEAN);
                ps.setInt(9, 3);
                assertThatThrownBy(ps::executeUpdate)
                        .isInstanceOf(SQLException.class);
            }

            // Verify duplicate is_cover = TRUE is rejected by unique constraint
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO billboard_media (billboard_id, category, storage_key, upload_id, original_name, content_type, file_size_bytes, is_cover, display_order) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
                ps.setLong(1, 201L);
                ps.setString(2, "DAY_PHOTO");
                ps.setString(3, "billboards/201/uuid-3.jpg");
                ps.setString(4, "upload-uuid-3");
                ps.setString(5, "second_cover.jpg");
                ps.setString(6, "image/jpeg");
                ps.setLong(7, 800000L);
                ps.setBoolean(8, true); // Second cover violates uq_billboard_media_cover
                ps.setInt(9, 3);
                assertThatThrownBy(ps::executeUpdate)
                        .isInstanceOf(SQLException.class);
            }

            // Verify cascade delete: deleting billboard deletes its media
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("DELETE FROM billboard_listings WHERE id = 201");
            }
            try (PreparedStatement ps = conn.prepareStatement("SELECT count(*) FROM billboard_media WHERE billboard_id = 201");
                 ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).isEqualTo(0);
            }
        }
    }
}

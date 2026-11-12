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

class V10MigrationTest {

    @Test
    @DisplayName("V10 migration creates billboard_availability_blocks table, indexes, check constraint, and cascading rules")
    void testV10Migration() throws Exception {
        String dbName = "v10_migration_test_" + UUID.randomUUID().toString().replace("-", "");
        JdbcDataSource ds = new JdbcDataSource();
        ds.setURL("jdbc:h2:mem:" + dbName + ";DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE");
        ds.setUser("sa");
        ds.setPassword("");

        // 1. Run migrations up to V9
        Flyway flywayV9 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("9")
                .load();
        flywayV9.migrate();

        long userId;
        long addressId;
        long billboardId = 1001L;

        // 2. Seed prerequisite records
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.execute("INSERT INTO users (first_name, last_name, email, password, role) " +
                    "VALUES ('Test', 'Owner', 'owner10@example.com', 'pw', 'OWNER')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM users WHERE email = 'owner10@example.com'")) {
                assertThat(rs.next()).isTrue();
                userId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO addresses (line1, pincode, city, state) " +
                    "VALUES ('100 MG Road', '560001', 'Bangalore', 'Karnataka')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM addresses WHERE line1 = '100 MG Road'")) {
                assertThat(rs.next()).isTrue();
                addressId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days, status) " +
                    "VALUES (" + billboardId + ", " + userId + ", 'Test Billboard V10', " + addressId + ", 'DIGITAL', 20.0, 10.0, 'NORTH', " +
                    "'VEHICULAR', 'YOUTH', 500.00, 1, 'DAY', 1, 'ACTIVE')");
        }

        // 3. Migrate to V10
        Flyway flywayV10 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("10")
                .load();
        flywayV10.migrate();

        // 4. Verify table, indexes, and constraints
        try (Connection conn = ds.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            try (ResultSet tables = meta.getTables(null, null, "billboard_availability_blocks", null)) {
                assertThat(tables.next()).isTrue();
            }

            boolean hasEndDateIndex = false;
            try (ResultSet idx = meta.getIndexInfo(null, null, "billboard_availability_blocks", false, false)) {
                while (idx.next()) {
                    if ("idx_avail_billboard_end_date".equalsIgnoreCase(idx.getString("INDEX_NAME"))) {
                        hasEndDateIndex = true;
                        break;
                    }
                }
            }
            assertThat(hasEndDateIndex).isTrue();

            try (Statement stmt = conn.createStatement()) {
                // Insert valid availability block
                stmt.execute("INSERT INTO billboard_availability_blocks (billboard_id, start_date, end_date, block_type, created_by) " +
                        "VALUES (" + billboardId + ", '2026-12-01', '2026-12-10', 'OWNER_BLOCKED', " + userId + ")");

                // Insert valid BOOKING_HOLD with non-null expiry_ts
                stmt.execute("INSERT INTO billboard_availability_blocks (billboard_id, start_date, end_date, block_type, expiry_ts, created_by) " +
                        "VALUES (" + billboardId + ", '2026-12-22', '2026-12-24', 'BOOKING_HOLD', TIMESTAMP WITH TIME ZONE '2026-12-01 10:00:00+00:00', " + userId + ")");

                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM billboard_availability_blocks WHERE billboard_id = " + billboardId)) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).isEqualTo(2);
                }

                // Check constraint: end_date < start_date should fail
                assertThatThrownBy(() -> {
                    stmt.execute("INSERT INTO billboard_availability_blocks (billboard_id, start_date, end_date, block_type, created_by) " +
                            "VALUES (" + billboardId + ", '2026-12-10', '2026-12-01', 'OWNER_BLOCKED', " + userId + ")");
                }).isInstanceOf(SQLException.class);

                // Check constraint: invalid block_type should fail chk_avail_block_type
                assertThatThrownBy(() -> {
                    stmt.execute("INSERT INTO billboard_availability_blocks (billboard_id, start_date, end_date, block_type, created_by) " +
                            "VALUES (" + billboardId + ", '2026-12-11', '2026-12-12', 'UNKNOWN_TYPE', " + userId + ")");
                }).isInstanceOf(SQLException.class);

                // Check constraint: BOOKING_HOLD without expiry_ts should fail chk_avail_hold_expiry
                assertThatThrownBy(() -> {
                    stmt.execute("INSERT INTO billboard_availability_blocks (billboard_id, start_date, end_date, block_type, expiry_ts, created_by) " +
                            "VALUES (" + billboardId + ", '2026-12-25', '2026-12-26', 'BOOKING_HOLD', NULL, " + userId + ")");
                }).isInstanceOf(SQLException.class);

                // FK behavior: Deleting user should SET NULL on created_by without deleting the block
                stmt.execute("INSERT INTO users (first_name, last_name, email, password, role) " +
                        "VALUES ('Buyer', 'User', 'buyer10@example.com', 'pw', 'ADVERTISER')");
                long buyerId;
                try (ResultSet rs = stmt.executeQuery("SELECT id FROM users WHERE email = 'buyer10@example.com'")) {
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

                // FK behavior: Deleting billboard listing cascades and deletes availability blocks
                stmt.execute("DELETE FROM billboard_listings WHERE id = " + billboardId);
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM billboard_availability_blocks WHERE billboard_id = " + billboardId)) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).isZero();
                }
            }
        }
    }
}


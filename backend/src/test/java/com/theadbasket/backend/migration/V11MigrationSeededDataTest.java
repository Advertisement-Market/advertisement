package com.theadbasket.backend.migration;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class V11MigrationSeededDataTest {

    @Test
    @DisplayName("V11 migration safely creates billboard_pricing_packages table, backfills valid listings, and ignores invalid/guarded rows")
    void testV11MigrationWithSeededLegacyData() throws Exception {
        String dbName = "v11_migration_test_" + UUID.randomUUID().toString().replace("-", "");
        JdbcDataSource ds = new JdbcDataSource();
        ds.setURL("jdbc:h2:mem:" + dbName + ";DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE");
        ds.setUser("sa");
        ds.setPassword("");

        // 1. Run migrations up to V10
        Flyway flywayV10 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("10")
                .load();
        flywayV10.migrate();

        long userId;
        long addressId;

        // 2. Seed prerequisite records and test billboard listings
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.execute("INSERT INTO users (first_name, last_name, email, password, role) " +
                    "VALUES ('Migration', 'Owner', 'migration11@example.com', 'pw', 'OWNER')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM users WHERE email = 'migration11@example.com'")) {
                assertThat(rs.next()).isTrue();
                userId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO addresses (line1, pincode, city, state) " +
                    "VALUES ('100 MG Road', '560001', 'Bangalore', 'Karnataka')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM addresses WHERE line1 = '100 MG Road'")) {
                assertThat(rs.next()).isTrue();
                addressId = rs.getLong("id");
            }

            // Listing 101: Valid listing (start_price=1500, min_booking_value=1, min_booking_unit='MONTHS') -> should be backfilled
            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days, status) " +
                    "VALUES (101, " + userId + ", 'Valid Board', " + addressId + ", 'DIGITAL', 20.0, 10.0, 'NORTH', " +
                    "'VEHICULAR', 'YOUTH', 1500.00, 1, 'MONTHS', 30, 'ACTIVE')");

            // Listing 102: Zero start price (start_price=0.00) -> should be skipped by guard
            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days, status) " +
                    "VALUES (102, " + userId + ", 'Zero Price Board', " + addressId + ", 'DIGITAL', 20.0, 10.0, 'NORTH', " +
                    "'VEHICULAR', 'YOUTH', 0.00, 1, 'MONTHS', 30, 'ACTIVE')");

            // Listing 103: Negative start price (start_price=-50.00) -> should be skipped by guard
            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days, status) " +
                    "VALUES (103, " + userId + ", 'Negative Price Board', " + addressId + ", 'DIGITAL', 20.0, 10.0, 'NORTH', " +
                    "'VEHICULAR', 'YOUTH', -50.00, 1, 'MONTHS', 30, 'ACTIVE')");

            // Listing 104: Unknown unit ('HOURS') -> should be skipped by guard
            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days, status) " +
                    "VALUES (104, " + userId + ", 'Unknown Unit Board', " + addressId + ", 'DIGITAL', 20.0, 10.0, 'NORTH', " +
                    "'VEHICULAR', 'YOUTH', 500.00, 1, 'HOURS', 1, 'ACTIVE')");

            // Listing 105: Exceeds unit cap (min_booking_value=1001, min_booking_unit='MONTHS' > 1000 max) -> should be skipped by guard
            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days, status) " +
                    "VALUES (105, " + userId + ", 'Exceeds Cap Board', " + addressId + ", 'DIGITAL', 20.0, 10.0, 'NORTH', " +
                    "'VEHICULAR', 'YOUTH', 500.00, 1001, 'MONTHS', 30030, 'ACTIVE')");

            // Listing 106: NULL start price (drop not-null constraint temporarily on test table to test guard) -> should be skipped by guard
            stmt.execute("ALTER TABLE billboard_listings ALTER COLUMN start_price DROP NOT NULL");
            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days, status) " +
                    "VALUES (106, " + userId + ", 'Null Price Board', " + addressId + ", 'DIGITAL', 20.0, 10.0, 'NORTH', " +
                    "'VEHICULAR', 'YOUTH', NULL, 1, 'MONTHS', 30, 'ACTIVE')");

            // Listing 107: Huge start price (> 10^12 when multiplied by days) -> should be skipped by guard
            stmt.execute("INSERT INTO billboard_listings (id, user_id, name, address_id, type, width_ft, height_ft, facing, " +
                    "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days, status) " +
                    "VALUES (107, " + userId + ", 'Huge Price Board', " + addressId + ", 'DIGITAL', 20.0, 10.0, 'NORTH', " +
                    "'VEHICULAR', 'YOUTH', 50000000000.00, 1, 'MONTHS', 30, 'ACTIVE')");
        }

        // 3. Migrate to V11
        Flyway flywayV11 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("11")
                .load();
        flywayV11.migrate();

        // 4. Verify table and backfilled rows
        try (Connection conn = ds.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            try (ResultSet tables = meta.getTables(null, null, "billboard_pricing_packages", null)) {
                assertThat(tables.next()).isTrue();
            }

            // Verify Listing 101 was successfully backfilled
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT duration_value, duration_unit, duration_days, rate, is_base FROM billboard_pricing_packages WHERE billboard_id = ?")) {
                ps.setLong(1, 101L);
                try (ResultSet rs = ps.executeQuery()) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt("duration_value")).isEqualTo(1);
                    assertThat(rs.getString("duration_unit")).isEqualTo("MONTHS");
                    assertThat(rs.getInt("duration_days")).isEqualTo(30);
                    assertThat(rs.getBigDecimal("rate")).isEqualByComparingTo("45000.00"); // 1500 * 30
                    assertThat(rs.getBoolean("is_base")).isTrue();
                    assertThat(rs.next()).isFalse(); // Exactly 1 row
                }
            }

            // Verify Listings 102, 103, 104, 105, 106, 107 have 0 rows in billboard_pricing_packages
            for (long invalidId : new long[]{102L, 103L, 104L, 105L, 106L, 107L}) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT COUNT(*) FROM billboard_pricing_packages WHERE billboard_id = ?")) {
                    ps.setLong(1, invalidId);
                    try (ResultSet rs = ps.executeQuery()) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getInt(1)).isZero();
                    }
                }
            }
        }
    }
}

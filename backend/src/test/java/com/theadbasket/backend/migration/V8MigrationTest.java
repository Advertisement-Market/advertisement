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

class V8MigrationTest {

    @Test
    @DisplayName("V8 migration splits legacy min_booking into value, unit, and days, enforces NOT NULL, and drops legacy column")
    void testV8MigrationWithPreExistingData() throws Exception {
        // Create an isolated in-memory H2 database in PostgreSQL mode
        String dbName = "v8_migration_test_" + UUID.randomUUID().toString().replace("-", "");
        JdbcDataSource ds = new JdbcDataSource();
        ds.setURL("jdbc:h2:mem:" + dbName + ";DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE");
        ds.setUser("sa");
        ds.setPassword("");

        // 1. Run migrations up to V7
        Flyway flywayV7 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("7")
                .load();
        flywayV7.migrate();

        long userId;
        long addressId;

        // 2. Insert prerequisite parent records (users and addresses) and seed billboard listings in V7 schema
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.execute("INSERT INTO users (first_name, last_name, email, password, role) " +
                    "VALUES ('Owner', 'User', 'owner@example.com', 'hashedpw', 'OWNER')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM users WHERE email = 'owner@example.com'")) {
                assertThat(rs.next()).isTrue();
                userId = rs.getLong("id");
            }

            stmt.execute("INSERT INTO addresses (line1, pincode, city, state) " +
                    "VALUES ('123 MG Road', '560001', 'Bangalore', 'Karnataka')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM addresses WHERE line1 = '123 MG Road'")) {
                assertThat(rs.next()).isTrue();
                addressId = rs.getLong("id");
            }

            // Seed listings covering standard dropdown values, display labels, compound text, and fallback paths
            insertListing(conn, 101L, userId, addressId, "Listing 1week", "1week");
            insertListing(conn, 102L, userId, addressId, "Listing 1 Week", "1 Week");
            insertListing(conn, 103L, userId, addressId, "Listing 2weeks", "2weeks");
            insertListing(conn, 104L, userId, addressId, "Listing 2 Weeks", "2 Weeks");
            insertListing(conn, 105L, userId, addressId, "Listing 3weeks", "3weeks");
            insertListing(conn, 106L, userId, addressId, "Listing 3 Weeks", "3 Weeks");
            insertListing(conn, 107L, userId, addressId, "Listing 1month", "1month");
            insertListing(conn, 108L, userId, addressId, "Listing 1 Month", "1 Month");
            insertListing(conn, 109L, userId, addressId, "Listing 1 month", "1 month");
            insertListing(conn, 110L, userId, addressId, "Listing 1 Month (4 Weeks)", "1 Month (4 Weeks)");
            insertListing(conn, 111L, userId, addressId, "Listing 2months", "2months");
            insertListing(conn, 112L, userId, addressId, "Listing 2 Months", "2 Months");
            insertListing(conn, 113L, userId, addressId, "Listing 2 Months (8 Weeks)", "2 Months (8 Weeks)");
            insertListing(conn, 114L, userId, addressId, "Listing 3months", "3months");
            insertListing(conn, 115L, userId, addressId, "Listing 3 Months", "3 Months");

            // Fallback / edge cases: custom values, empty string, whitespace string, unmapped lowercase
            insertListing(conn, 116L, userId, addressId, "Listing Custom Days", "15 days");
            insertListing(conn, 117L, userId, addressId, "Listing Empty String", "");
            insertListing(conn, 118L, userId, addressId, "Listing Whitespace", "   ");
            insertListing(conn, 119L, userId, addressId, "Listing Unmapped Lowercase", "2 months");
        }

        // 3. Migrate to V8
        Flyway flywayV8 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("8")
                .load();
        flywayV8.migrate();

        // 4. Verify data in post-migration schema
        try (Connection conn = ds.getConnection()) {
            // Verify standard weeks transformations
            assertDuration(conn, 101L, 1, "WEEKS", 7);
            assertDuration(conn, 102L, 1, "WEEKS", 7);
            assertDuration(conn, 103L, 2, "WEEKS", 14);
            assertDuration(conn, 104L, 2, "WEEKS", 14);
            assertDuration(conn, 105L, 3, "WEEKS", 21);
            assertDuration(conn, 106L, 3, "WEEKS", 21);

            // Verify standard months transformations (Note: '1 Month (4 Weeks)' maps to flat 30 days, not 28)
            assertDuration(conn, 107L, 1, "MONTHS", 30);
            assertDuration(conn, 108L, 1, "MONTHS", 30);
            assertDuration(conn, 109L, 1, "MONTHS", 30);
            assertDuration(conn, 110L, 1, "MONTHS", 30);
            assertDuration(conn, 111L, 2, "MONTHS", 60);
            assertDuration(conn, 112L, 2, "MONTHS", 60);
            assertDuration(conn, 113L, 2, "MONTHS", 60);
            assertDuration(conn, 114L, 3, "MONTHS", 90);
            assertDuration(conn, 115L, 3, "MONTHS", 90);

            // Verify documented fallback behavior (ELSE 1 / 'MONTHS' / 30) for unlisted or custom values
            assertDuration(conn, 116L, 1, "MONTHS", 30);
            assertDuration(conn, 117L, 1, "MONTHS", 30);
            assertDuration(conn, 118L, 1, "MONTHS", 30);
            assertDuration(conn, 119L, 1, "MONTHS", 30);

            // 5. Dialect-neutral metadata check: confirm legacy min_booking column is dropped
            DatabaseMetaData meta = conn.getMetaData();
            boolean minBookingColExists = false;
            boolean valueColNotNull = false;
            boolean unitColNotNull = false;
            boolean daysColNotNull = false;

            try (ResultSet rs = meta.getColumns(null, null, null, null)) {
                while (rs.next()) {
                    String tableName = rs.getString("TABLE_NAME");
                    String colName = rs.getString("COLUMN_NAME");
                    if ("billboard_listings".equalsIgnoreCase(tableName)) {
                        int nullable = rs.getInt("NULLABLE");
                        if ("min_booking".equalsIgnoreCase(colName)) {
                            minBookingColExists = true;
                        }
                        if ("min_booking_value".equalsIgnoreCase(colName) && nullable == DatabaseMetaData.columnNoNulls) {
                            valueColNotNull = true;
                        }
                        if ("min_booking_unit".equalsIgnoreCase(colName) && nullable == DatabaseMetaData.columnNoNulls) {
                            unitColNotNull = true;
                        }
                        if ("min_booking_days".equalsIgnoreCase(colName) && nullable == DatabaseMetaData.columnNoNulls) {
                            daysColNotNull = true;
                        }
                    }
                }
            }

            assertThat(minBookingColExists).as("min_booking column must be dropped").isFalse();
            assertThat(valueColNotNull).as("min_booking_value must be NOT NULL").isTrue();
            assertThat(unitColNotNull).as("min_booking_unit must be NOT NULL").isTrue();
            assertThat(daysColNotNull).as("min_booking_days must be NOT NULL").isTrue();

            // 6. Active constraint assertion: inserting NULL into min_booking_value fails with SQLState 23502
            try (Statement stmt = conn.createStatement()) {
                assertThatThrownBy(() -> stmt.execute(
                        "INSERT INTO billboard_listings (" +
                                "user_id, name, address_id, type, width_ft, height_ft, facing, " +
                                "traffic_type, audience_type, start_price, min_booking_value, min_booking_unit, min_booking_days" +
                                ") VALUES (" +
                                userId + ", 'Null Value Test', " + addressId + ", 'UNIPOLE', 40.0, 20.0, 'NORTH', " +
                                "'CITY_URBAN', 'COMMUTERS', 50000.0, NULL, 'MONTHS', 30)"
                ))
                        .isInstanceOf(SQLException.class)
                        .matches(e -> "23502".equals(((SQLException) e).getSQLState()), "Must fail with SQLState 23502 (NOT NULL violation)");
            }
        }
    }

    private void insertListing(Connection conn, long id, long userId, long addressId, String name, String minBooking) throws SQLException {
        String sql = "INSERT INTO billboard_listings (" +
                "id, user_id, address_id, name, type, width_ft, height_ft, facing, " +
                "traffic_type, audience_type, start_price, min_booking" +
                ") VALUES (?, ?, ?, ?, 'UNIPOLE', 40.0, 20.0, 'NORTH', 'CITY_URBAN', 'COMMUTERS', 50000.0, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            ps.setLong(2, userId);
            ps.setLong(3, addressId);
            ps.setString(4, name);
            ps.setString(5, minBooking);
            ps.executeUpdate();
        }
    }

    private void assertDuration(Connection conn, long listingId, int expectedValue, String expectedUnit, int expectedDays) throws SQLException {
        String sql = "SELECT min_booking_value, min_booking_unit, min_booking_days FROM billboard_listings WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, listingId);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).as("Listing %d should exist", listingId).isTrue();
                assertThat(rs.getInt("min_booking_value")).isEqualTo(expectedValue);
                assertThat(rs.getString("min_booking_unit")).isEqualTo(expectedUnit);
                assertThat(rs.getInt("min_booking_days")).isEqualTo(expectedDays);
            }
        }
    }
}

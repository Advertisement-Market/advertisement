package com.theadbasket.backend.migration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies V8 Flyway migration and constraints against a real PostgreSQL 16 instance.
 * Matches production image postgres:16-alpine (docker-compose.yml).
 * Gracefully skipped if Docker is unavailable locally; runs in CI on ubuntu-latest.
 */
@Testcontainers(disabledWithoutDocker = true)
class V8MigrationPostgresTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("sa")
            .withPassword("sa");

    @Test
    @DisplayName("V8 migration against real PostgreSQL 16: backfills min_booking, enforces NOT NULL, drops column")
    void testV8MigrationOnRealPostgreSql() throws Exception {
        PGSimpleDataSource ds = new PGSimpleDataSource();
        ds.setUrl(POSTGRES.getJdbcUrl());
        ds.setUser(POSTGRES.getUsername());
        ds.setPassword(POSTGRES.getPassword());

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
                    "VALUES ('Owner', 'User', 'owner_pg@example.com', 'hashedpw', 'OWNER')");
            try (ResultSet rs = stmt.executeQuery("SELECT id FROM users WHERE email = 'owner_pg@example.com'")) {
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
            insertListing(conn, 201L, userId, addressId, "Listing 1week", "1week");
            insertListing(conn, 202L, userId, addressId, "Listing 1 Week", "1 Week");
            insertListing(conn, 203L, userId, addressId, "Listing 2weeks", "2weeks");
            insertListing(conn, 204L, userId, addressId, "Listing 2 Weeks", "2 Weeks");
            insertListing(conn, 205L, userId, addressId, "Listing 1month", "1month");
            insertListing(conn, 206L, userId, addressId, "Listing 1 Month (4 Weeks)", "1 Month (4 Weeks)");
            insertListing(conn, 207L, userId, addressId, "Listing 2 Months (8 Weeks)", "2 Months (8 Weeks)");
            insertListing(conn, 208L, userId, addressId, "Listing 3 Months", "3 Months");

            // Fallback / edge cases: custom values, empty string, whitespace string, unmapped lowercase
            insertListing(conn, 209L, userId, addressId, "Listing Custom Days", "15 days");
            insertListing(conn, 210L, userId, addressId, "Listing Empty String", "");
            insertListing(conn, 211L, userId, addressId, "Listing Whitespace", "   ");
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
            assertDuration(conn, 201L, 1, "WEEKS", 7);
            assertDuration(conn, 202L, 1, "WEEKS", 7);
            assertDuration(conn, 203L, 2, "WEEKS", 14);
            assertDuration(conn, 204L, 2, "WEEKS", 14);
            assertDuration(conn, 205L, 1, "MONTHS", 30);
            assertDuration(conn, 206L, 1, "MONTHS", 30);
            assertDuration(conn, 207L, 2, "MONTHS", 60);
            assertDuration(conn, 208L, 3, "MONTHS", 90);

            // Documented fallback behavior (ELSE 1 / 'MONTHS' / 30)
            assertDuration(conn, 209L, 1, "MONTHS", 30);
            assertDuration(conn, 210L, 1, "MONTHS", 30);
            assertDuration(conn, 211L, 1, "MONTHS", 30);

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

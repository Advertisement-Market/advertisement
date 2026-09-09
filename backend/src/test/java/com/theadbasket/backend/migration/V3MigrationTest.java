package com.theadbasket.backend.migration;

import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class V3MigrationTest {

    @Test
    @DisplayName("V3 migration safely backfills address records and end_date from populated V2 tables including edge cases")
    void testV3MigrationWithPreExistingData() throws Exception {
        // Create an isolated in-memory H2 database in PostgreSQL mode
        String dbName = "v3_migration_test_" + UUID.randomUUID().toString().replace("-", "");
        JdbcDataSource ds = new JdbcDataSource();
        ds.setURL("jdbc:h2:mem:" + dbName + ";DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE");
        ds.setUser("sa");
        ds.setPassword("");
        String longAddress = "A".repeat(450);

        // 1. Run migrations up to V2
        Flyway flywayV2 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("2")
                .load();
        flywayV2.migrate();

        // 2. Insert test data into V2 tables (including edge cases: dirty data, long text, multiple durations)
        try (Connection conn = ds.getConnection()) {
            try (Statement stmt = conn.createStatement()) {
                // Users
                stmt.execute("INSERT INTO users (id, first_name, last_name, email, password_hash, role) " +
                        "VALUES (1, 'Adv', 'User', 'adv@example.com', 'hashedpw', 'ADVERTISER')");
                stmt.execute("INSERT INTO users (id, first_name, last_name, email, password_hash, role) " +
                        "VALUES (2, 'Owner', 'User', 'owner@example.com', 'hashedpw', 'OWNER')");
                stmt.execute("INSERT INTO users (id, first_name, last_name, email, password_hash, role) " +
                        "VALUES (3, 'Agency', 'User', 'agency@example.com', 'hashedpw', 'AGENCY')");
                stmt.execute("INSERT INTO users (id, first_name, last_name, email, password_hash, role) " +
                        "VALUES (4, 'Adv2', 'User2', 'adv2@example.com', 'hashedpw', 'ADVERTISER')");

                // Refresh token
                stmt.execute("INSERT INTO refresh_tokens (user_id, token, expires_at, revoked) " +
                        "VALUES (1, 'sample-refresh-token', CURRENT_TIMESTAMP, FALSE)");

                // Advertiser Profile 1: Normal with empty GST number
                stmt.execute("INSERT INTO advertiser_profiles (id, user_id, company_name, business_type, contact_designation, contact_email, office_address, pincode, gst_number) " +
                        "VALUES (10, 1, 'Acme Corp', 'Retail', 'CEO', 'adv@example.com', '123 Market Street, Suite 4', '560001', '  ')");

                // Advertiser Profile 2: Long address (> 300 chars) & duplicate empty GST string
                stmt.execute("INSERT INTO advertiser_profiles (id, user_id, company_name, business_type, contact_designation, contact_email, office_address, pincode, gst_number) " +
                        "VALUES (11, 4, 'Long Address Corp', 'Tech', 'CTO', 'adv2@example.com', '" + longAddress + "', '560002', '')");

                // Campaign Brief 1 (1 month duration)
                stmt.execute("INSERT INTO campaign_briefs (id, user_id, title, description, target_audience, target_location, start_date, duration) " +
                        "VALUES (20, 1, 'Summer Sale', 'Big billboard campaign', 'Commuters', 'Bangalore', '2026-06-01', '1 month')");

                // Campaign Brief 2 (15 days duration)
                stmt.execute("INSERT INTO campaign_briefs (id, user_id, title, description, target_audience, target_location, start_date, duration) " +
                        "VALUES (21, 1, 'Flash Sale', 'Quick campaign', 'Commuters', 'Mumbai', '2026-06-01', '15 days')");

                // Campaign Brief 3 (3 months duration)
                stmt.execute("INSERT INTO campaign_briefs (id, user_id, title, description, target_audience, target_location, start_date, duration) " +
                        "VALUES (22, 1, 'Fall Campaign', 'Autumn billboard', 'Shoppers', 'Delhi', '2026-06-01', '3 months')");

                // Campaign Brief 4 (open-ended / unknown duration fallback)
                stmt.execute("INSERT INTO campaign_briefs (id, user_id, title, description, target_audience, target_location, start_date, duration) " +
                        "VALUES (23, 1, 'Brand Awareness', 'Ongoing campaign', 'All', 'National', '2026-06-01', 'ongoing')");

                // Owner Profile (with nullable business_address_line2)
                stmt.execute("INSERT INTO owner_profiles (id, user_id, company_name, business_address_line1, business_address_line2, business_pincode) " +
                        "VALUES (30, 2, 'Sky Media', '45 MG Road', 'Level 2', '560025')");

                // Billboard Listing (with landmark)
                stmt.execute("INSERT INTO billboard_listings (id, user_id, name, pincode, address, landmark, type, width_ft, height_ft, facing, traffic_type, audience_type, start_price, min_booking) " +
                        "VALUES (40, 2, 'MG Road Prime', '560025', 'Opposite Metro Pillar 120', 'Metro Gate 2', 'Unipole', 40.0, 20.0, 'North', 'Vehicular', 'Shoppers', 50000.0, '1 month')");

                // Agency Profile
                stmt.execute("INSERT INTO agency_profiles (id, user_id, agency_name, agency_type, year_established, office_address, headquarters_pincode, contact_designation) " +
                        "VALUES (50, 3, 'Prime Agency', 'OOH Specialist', 2018, '78 Bannerghatta Road', '560076', 'Managing Director')");
            }
        }

        // 3. Migrate to V3
        Flyway flywayV3 = Flyway.configure()
                .dataSource(ds)
                .locations("classpath:db/migration")
                .target("3")
                .load();
        flywayV3.migrate();

        // 4. Verify data in post-migration schema
        try (Connection conn = ds.getConnection()) {
            // Verify users column renames
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT password, is_enabled, is_email_verified, created_ts, updated_ts FROM users WHERE id = 1")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString("password")).isEqualTo("hashedpw");
                assertThat(rs.getBoolean("is_enabled")).isTrue();
                assertThat(rs.getBoolean("is_email_verified")).isFalse();
                assertThat(rs.getTimestamp("created_ts")).isNotNull();
            }

            // Verify refresh_tokens column renames
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT expiry_ts, is_revoked, created_ts FROM refresh_tokens WHERE user_id = 1")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getBoolean("is_revoked")).isFalse();
                assertThat(rs.getTimestamp("expiry_ts")).isNotNull();
            }

            // Verify advertiser_profiles address backfill and contact_email preservation
            Long advAddressId;
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT contact_email, address_id FROM advertiser_profiles WHERE id = 10")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString("contact_email")).isEqualTo("adv@example.com");
                advAddressId = rs.getLong("address_id");
                assertThat(advAddressId).isNotNull().isPositive();
            }

            try (PreparedStatement pstmt = conn.prepareStatement("SELECT line1, pincode, city, state FROM addresses WHERE id = ?")) {
                pstmt.setLong(1, advAddressId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("line1")).isEqualTo("123 Market Street, Suite 4");
                    assertThat(rs.getString("pincode")).isEqualTo("560001");
                    assertThat(rs.getString("city")).isEqualTo("Unknown");
                    assertThat(rs.getString("state")).isEqualTo("Unknown");
                }
            }

            // Verify long address overflow into line2 (zero data loss for 500-char legacy addresses)
            Long adv2AddressId;
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT address_id FROM advertiser_profiles WHERE id = 11")) {
                assertThat(rs.next()).isTrue();
                adv2AddressId = rs.getLong("address_id");
                assertThat(adv2AddressId).isNotNull().isPositive();
            }

            try (PreparedStatement pstmt = conn.prepareStatement("SELECT line1, line2 FROM addresses WHERE id = ?")) {
                pstmt.setLong(1, adv2AddressId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("line1")).hasSize(300);
                    assertThat(rs.getString("line2")).hasSize(150);
                    assertThat(rs.getString("line1") + rs.getString("line2")).isEqualTo(longAddress);
                }
            }

            // Verify campaign_briefs duration-based end_date backfills
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT id, start_date, end_date FROM campaign_briefs ORDER BY id")) {
                // Brief 20: 1 month -> +30 days
                assertThat(rs.next()).isTrue();
                assertThat(rs.getLong("id")).isEqualTo(20);
                assertThat(rs.getDate("end_date")).isEqualTo(java.sql.Date.valueOf("2026-07-01"));

                // Brief 21: 15 days -> +15 days
                assertThat(rs.next()).isTrue();
                assertThat(rs.getLong("id")).isEqualTo(21);
                assertThat(rs.getDate("end_date")).isEqualTo(java.sql.Date.valueOf("2026-06-16"));

                // Brief 22: 3 months -> +90 days
                assertThat(rs.next()).isTrue();
                assertThat(rs.getLong("id")).isEqualTo(22);
                assertThat(rs.getDate("end_date")).isEqualTo(java.sql.Date.valueOf("2026-08-30"));

                // Brief 23: ongoing -> +30 days fallback
                assertThat(rs.next()).isTrue();
                assertThat(rs.getLong("id")).isEqualTo(23);
                assertThat(rs.getDate("end_date")).isEqualTo(java.sql.Date.valueOf("2026-07-01"));
            }

            // Verify owner_profiles address backfill
            Long ownerAddressId;
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT address_id FROM owner_profiles WHERE id = 30")) {
                assertThat(rs.next()).isTrue();
                ownerAddressId = rs.getLong("address_id");
                assertThat(ownerAddressId).isNotNull().isPositive();
            }

            try (PreparedStatement pstmt = conn.prepareStatement("SELECT line1, line2, pincode FROM addresses WHERE id = ?")) {
                pstmt.setLong(1, ownerAddressId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("line1")).isEqualTo("45 MG Road");
                    assertThat(rs.getString("line2")).isEqualTo("Level 2");
                    assertThat(rs.getString("pincode")).isEqualTo("560025");
                }
            }

            // Verify billboard_listings address backfill
            Long billboardAddressId;
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT address_id FROM billboard_listings WHERE id = 40")) {
                assertThat(rs.next()).isTrue();
                billboardAddressId = rs.getLong("address_id");
                assertThat(billboardAddressId).isNotNull().isPositive();
            }

            try (PreparedStatement pstmt = conn.prepareStatement("SELECT line1, landmark, pincode FROM addresses WHERE id = ?")) {
                pstmt.setLong(1, billboardAddressId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("line1")).isEqualTo("Opposite Metro Pillar 120");
                    assertThat(rs.getString("landmark")).isEqualTo("Metro Gate 2");
                    assertThat(rs.getString("pincode")).isEqualTo("560025");
                }
            }

            // Verify agency_profiles address backfill & landline -> contact_no rename
            Long agencyAddressId;
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT address_id FROM agency_profiles WHERE id = 50")) {
                assertThat(rs.next()).isTrue();
                agencyAddressId = rs.getLong("address_id");
                assertThat(agencyAddressId).isNotNull().isPositive();
            }

            try (PreparedStatement pstmt = conn.prepareStatement("SELECT line1, pincode FROM addresses WHERE id = ?")) {
                pstmt.setLong(1, agencyAddressId);
                try (ResultSet rs = pstmt.executeQuery()) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getString("line1")).isEqualTo("78 Bannerghatta Road");
                    assertThat(rs.getString("pincode")).isEqualTo("560076");
                }
            }

            // Verify total addresses count equals 5 (2 adv, 1 owner, 1 billboard, 1 agency)
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT count(*) FROM addresses")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).isEqualTo(5);
            }

            // Verify NO NULL address_id exists anywhere
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT count(*) FROM advertiser_profiles WHERE address_id IS NULL")) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).isEqualTo(0);
            }
        }
    }
}

package com.theadbasket.backend.owner;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.FacingDirection;
import com.theadbasket.backend.lov.TrafficType;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

/**
 * End-to-end integration test verifying that PostgreSQL connectionInitSql ("SET lock_timeout = '5s'")
 * causes real row lock contention in findByIdAndUserIdForUpdate (e.g. during deleteListing or media delete)
 * to fail after 5s with SQLState 55P03, which Spring translates to CannotAcquireLockException and
 * GlobalExceptionHandler maps to HTTP 409 CONCURRENT_MODIFICATION.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("staging")
@Testcontainers(disabledWithoutDocker = true)
class PostgresLockTimeoutIT {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // Feed the container coordinates into spring.datasource.* so application-staging.yml's
        // ${spring.datasource.url/username/password} placeholders resolve Flyway's dedicated datasource
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private BillboardListingRepository billboardListingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    @DisplayName("Real PostgreSQL lock timeout via Hikari connectionInitSql translates to 409 CONCURRENT_MODIFICATION on deleteListing")
    void postgresLockTimeoutProduces409OnDeleteListingAndSucceedsOnRetry() throws Exception {
        // 1. Verify that application pool connections uniformly report 5s lock_timeout
        // and have not leaked Flyway's 'lock_timeout = 0' setting
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SHOW lock_timeout")) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString(1)).isEqualTo("5s");
        }

        User owner = userRepository.save(new User("Lock", "Owner", "lock_owner@example.com", "hash", "+919999999999", Role.OWNER));
        Address address = Address.of("Lock St", "Landmark", "City", "Bangalore", "Karnataka", "560001");

        BillboardListing listing = new BillboardListing();
        listing.setUser(owner);
        listing.setName("Lock Timeout Listing");
        listing.setAddress(address);
        listing.setType(BillboardType.UNIPOLE);
        listing.setWidthFt(new BigDecimal("20.0"));
        listing.setHeightFt(new BigDecimal("10.0"));
        listing.setFacing(FacingDirection.NORTH);
        listing.setTrafficType(TrafficType.HIGHWAY);
        listing.setAudienceType(AudienceType.COMMUTERS);
        listing.setStartPrice(new BigDecimal("50000.00"));
        listing.setMinBookingValue(1);
        listing.setMinBookingUnit(BookingDurationUnit.MONTHS);
        listing.setMinBookingDays(30);
        listing.setStatus(BillboardStatus.ACTIVE);
        final BillboardListing saved = billboardListingRepository.save(listing);

        String token = jwtService.generateAccessToken(owner);

        CountDownLatch lockAcquiredLatch = new CountDownLatch(1);
        CountDownLatch releaseLockLatch = new CountDownLatch(1);

        ExecutorService executor = Executors.newSingleThreadExecutor();
        Future<?> holderFuture = executor.submit(() -> {
            TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
            txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            txTemplate.execute(status -> {
                // Hold pessimistic row lock via repository
                billboardListingRepository.findByIdForUpdate(saved.getId());
                // Signal that the lock query has completed and lock is actively held
                lockAcquiredLatch.countDown();
                try {
                    // Hold lock safely until the test explicitly releases it (30s safety timeout for loaded CI)
                    releaseLockLatch.await(30, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return null;
            });
        });

        try {
            // Confirm Transaction A has acquired the lock before launching the second request
            assertThat(lockAcquiredLatch.await(3, TimeUnit.SECONDS)).isTrue();

            long startTime = System.currentTimeMillis();

            // Calling deleteListing endpoint attempts to acquire findByIdAndUserIdForUpdate on the locked row
            mockMvc.perform(delete("/api/owner/listings/" + saved.getId())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.errorCode").value("CONCURRENT_MODIFICATION"));

            long duration = System.currentTimeMillis() - startTime;
            // The request waited roughly 5 seconds (5000ms) before timing out
            assertThat(duration).isGreaterThanOrEqualTo(4500L);
        } finally {
            // 2. Release the lock and verify that a retry succeeds cleanly
            releaseLockLatch.countDown();
            holderFuture.get(3, TimeUnit.SECONDS);
            executor.shutdownNow();
        }

        // 3. Retry deleteListing now that the lock has been released
        mockMvc.perform(delete("/api/owner/listings/" + saved.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertThat(billboardListingRepository.findById(saved.getId())).isEmpty();
    }
}
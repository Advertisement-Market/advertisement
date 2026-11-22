package com.theadbasket.backend.owner;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("staging")
@Testcontainers(disabledWithoutDocker = true)
class PricingPackagesConcurrencyIT {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> "4");
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

    @Test
    @DisplayName("Concurrent package updates under PostgreSQL row lock maintain exactly one base package invariant")
    void concurrentPackageUpdatesPreserveSingleBaseInvariant() throws Exception {
        User owner = userRepository.save(new User("Conc", "Owner", "conc_owner@example.com", "hash", "+919876543219", Role.OWNER));
        Address address = Address.of("MG Road", "Near Metro", "City", "Bangalore", "Karnataka", "560001");

        BillboardListing listing = new BillboardListing();
        listing.setUser(owner);
        listing.setName("Concurrent Pricing Listing");
        listing.setAddress(address);
        listing.setType(BillboardType.UNIPOLE);
        listing.setWidthFt(new BigDecimal("30.0"));
        listing.setHeightFt(new BigDecimal("15.0"));
        listing.setFacing(FacingDirection.NORTH);
        listing.setTrafficType(TrafficType.HIGHWAY);
        listing.setAudienceType(AudienceType.COMMUTERS);
        listing.setStartPrice(new BigDecimal("2000.00"));
        listing.setMinBookingValue(1);
        listing.setMinBookingUnit(BookingDurationUnit.MONTHS);
        listing.setMinBookingDays(30);
        listing.setStatus(BillboardStatus.ACTIVE);

        BillboardListing saved = billboardListingRepository.save(listing);
        Long listingId = saved.getId();
        String token = jwtService.generateAccessToken(owner);

        String patch1 = """
                {
                  "pricingPackages":[
                    {"durationValue":1,"durationUnit":"MONTHS","rate":null,"note":"1M Base","isBase":true},
                    {"durationValue":3,"durationUnit":"MONTHS","rate":170000.00,"note":"3M Promo","isBase":false}
                  ]
                }""";

        String patch2 = """
                {
                  "pricingPackages":[
                    {"durationValue":1,"durationUnit":"MONTHS","rate":65000.00,"note":"1M Regular","isBase":false},
                    {"durationValue":6,"durationUnit":"MONTHS","rate":null,"note":"6M Base","isBase":true}
                  ]
                }""";

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Callable<Integer>> tasks = List.of(
                () -> {
                    startLatch.await();
                    MvcResult res = mockMvc.perform(patch("/api/owner/listings/" + listingId)
                                    .header("Authorization", "Bearer " + token)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(patch1))
                            .andReturn();
                    return res.getResponse().getStatus();
                },
                () -> {
                    startLatch.await();
                    MvcResult res = mockMvc.perform(patch("/api/owner/listings/" + listingId)
                                    .header("Authorization", "Bearer " + token)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(patch2))
                            .andReturn();
                    return res.getResponse().getStatus();
                }
        );

        List<Future<Integer>> futures = new ArrayList<>();
        for (Callable<Integer> task : tasks) {
            futures.add(executor.submit(task));
        }

        // Release all threads simultaneously
        startLatch.countDown();

        for (Future<Integer> f : futures) {
            int status = f.get(20, TimeUnit.SECONDS);
            // Each request must either succeed (200) or report lock contention conflict (409)
            assertThat(status).isIn(200, 409);
        }

        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);

        // Verify database invariants in PostgreSQL
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT COUNT(*) FROM billboard_pricing_packages WHERE billboard_id = ? AND is_base = true")) {
            ps.setLong(1, listingId);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                int baseCount = rs.getInt(1);
                // Exactly 1 base package must exist
                assertThat(baseCount).isEqualTo(1);
            }
        }

        // Verify no duplicate duration_days
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT duration_days, COUNT(*) FROM billboard_pricing_packages WHERE billboard_id = ? GROUP BY duration_days HAVING COUNT(*) > 1")) {
            ps.setLong(1, listingId);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isFalse(); // No duplicates
            }
        }
    }
}

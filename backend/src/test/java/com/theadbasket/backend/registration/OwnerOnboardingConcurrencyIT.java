package com.theadbasket.backend.registration;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theadbasket.backend.notification.NotificationRepository;
import com.theadbasket.backend.owner.BillboardListingRepository;
import com.theadbasket.backend.owner.OwnerProfileRepository;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

/**
 * Verifies real PostgreSQL 16 pessimistic row locking ({@code SELECT ... FOR UPDATE}) on
 * {@code POST /api/onboarding/owner} under parallel double-submit contention.
 * Gracefully skipped when Docker is unavailable locally; runs in CI.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("staging")
@Testcontainers(disabledWithoutDocker = true)
class OwnerOnboardingConcurrencyIT {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        // Ensure at least 4 connections so concurrent transactions never starve on pool checkout
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> "4");
    }

    private static final String ONBOARD_PAYLOAD = """
            {
              "firstName":"Race","lastName":"Owner","phone":"+91 98765 43210",
              "companyName":"Race Billboards","companyPhone":"","companyRegNumber":"",
              "gstNumber":"","addressLine1":"5 CG Road","addressLine2":"","landmark":"","city":"Ahmedabad",
              "state":"Gujarat","pincode":"380001",
              "tradeLicenseNo":"","ownershipType":"Owned","regulatoryApprovals":"",
              "billboard":{"name":"Concurrent LED Screen","addressLine1":"BKC","addressLine2":"","landmark":"",
                "city":"Mumbai","state":"Maharashtra","pincode":"400051",
                "type":"LED Digital","widthFt":40,"heightFt":25,"groundHeightFt":15,"facing":"North",
                "trafficType":"City / Urban","audienceType":"Commuters","footfall":"150000","startPrice":580000,
                "minBookingValue":3,"minBookingUnit":"MONTHS","discountNote":""},
              "acceptedTerms":true
            }""";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private OwnerProfileRepository ownerProfileRepository;
    @Autowired
    private BillboardListingRepository billboardListingRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("Parallel POST /api/onboarding/owner for same MEMBER: exactly 1 succeeds (201) and 1 fails (409) with zero orphan rows")
    void parallelPromotion_sameMember_exactlyOneSucceedsAndNoOrphans() throws Exception {
        User member = userRepository.saveAndFlush(
                new User("Race", "Member", "race.member@example.com", "pw", "+91 98765 43210", Role.MEMBER));
        String token = jwtService.generateAccessToken(member);

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);

        try {
            Future<MvcResult> f1 = pool.submit(() -> {
                ready.countDown();
                start.await(5, TimeUnit.SECONDS);
                return mockMvc.perform(post("/api/onboarding/owner")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(ONBOARD_PAYLOAD))
                        .andReturn();
            });
            Future<MvcResult> f2 = pool.submit(() -> {
                ready.countDown();
                start.await(5, TimeUnit.SECONDS);
                return mockMvc.perform(post("/api/onboarding/owner")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(ONBOARD_PAYLOAD))
                        .andReturn();
            });

            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            MvcResult r1 = f1.get(15, TimeUnit.SECONDS);
            MvcResult r2 = f2.get(15, TimeUnit.SECONDS);

            List<Integer> statuses = List.of(r1.getResponse().getStatus(), r2.getResponse().getStatus());
            assertThat(statuses).containsExactlyInAnyOrder(201, 409);

            MvcResult loser = r1.getResponse().getStatus() == 409 ? r1 : r2;
            JsonNode loserBody = new ObjectMapper().readTree(loser.getResponse().getContentAsString());
            assertThat(loserBody.get("errorCode").asText())
                    .isIn("ALREADY_REGISTERED", "CONCURRENT_MODIFICATION");

            // Post-commit DB state: exactly 1 OWNER user, 1 profile, 1 listing, 1 notification
            User persisted = userRepository.findById(member.getId()).orElseThrow();
            assertThat(persisted.getRole()).isEqualTo(Role.OWNER);
            assertThat(ownerProfileRepository.count()).isEqualTo(1);
            assertThat(billboardListingRepository.count()).isEqualTo(1);
            assertThat(notificationRepository.count()).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }
    }
}

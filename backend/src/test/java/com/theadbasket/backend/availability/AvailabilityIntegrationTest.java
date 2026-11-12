package com.theadbasket.backend.availability;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.theadbasket.backend.availability.dto.*;
import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.address.AddressRepository;
import com.theadbasket.backend.lov.*;
import com.theadbasket.backend.owner.BillboardListing;
import com.theadbasket.backend.owner.BillboardListingRepository;
import com.theadbasket.backend.owner.BillboardStatus;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AvailabilityIntegrationTest {

    private static final ZoneId IST_ZONE = ZoneId.of("Asia/Kolkata");

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private BillboardListingRepository billboardListingRepository;

    @Autowired
    private BillboardAvailabilityBlockRepository blockRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private Clock clock;

    @Autowired
    private AvailabilityHoldCleanupJob holdCleanupJob;

    private User owner;
    private User otherOwner;
    private String ownerToken;
    private String otherOwnerToken;
    private BillboardListing activeListing;
    private BillboardListing draftListing;
    private BillboardListing suspendedListing;

    @BeforeEach
    void setUp() {
        blockRepository.deleteAll();
        billboardListingRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(new User("Rohan", "Owner", "rohan.avail@example.com", "pass", "9876543201", Role.OWNER));
        otherOwner = userRepository.save(new User("Vikram", "Owner", "vikram.avail@example.com", "pass", "9876543202", Role.OWNER));

        ownerToken = jwtService.generateAccessToken(owner);
        otherOwnerToken = jwtService.generateAccessToken(otherOwner);

        Address addr1 = Address.of("100 MG Road", "Opp Metro", "Indiranagar", "Bangalore", "Karnataka", "560038");
        activeListing = new BillboardListing();
        activeListing.setUser(owner);
        activeListing.setName("Indiranagar Prime LED");
        activeListing.setAddress(addr1);
        activeListing.setType(BillboardType.DIGITAL_SCREEN);
        activeListing.setWidthFt(new BigDecimal("30.00"));
        activeListing.setHeightFt(new BigDecimal("15.00"));
        activeListing.setFacing(FacingDirection.NORTH);
        activeListing.setTrafficType(TrafficType.COMMERCIAL_ZONE);
        activeListing.setAudienceType(AudienceType.COMMUTERS);
        activeListing.setStartPrice(new BigDecimal("100000.00"));
        activeListing.setMinBookingValue(1);
        activeListing.setMinBookingUnit(BookingDurationUnit.DAYS);
        activeListing.setMinBookingDays(1);
        activeListing.setStatus(BillboardStatus.ACTIVE);
        activeListing = billboardListingRepository.save(activeListing);

        Address addr2 = Address.of("200 MG Road", "Near Metro", "Indiranagar", "Bangalore", "Karnataka", "560038");
        draftListing = new BillboardListing();
        draftListing.setUser(owner);
        draftListing.setName("Draft Billboard");
        draftListing.setAddress(addr2);
        draftListing.setType(BillboardType.STATIC_HOARDING);
        draftListing.setWidthFt(new BigDecimal("20.00"));
        draftListing.setHeightFt(new BigDecimal("10.00"));
        draftListing.setFacing(FacingDirection.SOUTH);
        draftListing.setTrafficType(TrafficType.RESIDENTIAL_AREA);
        draftListing.setAudienceType(AudienceType.SHOPPERS);
        draftListing.setStartPrice(new BigDecimal("50000.00"));
        draftListing.setMinBookingValue(1);
        draftListing.setMinBookingUnit(BookingDurationUnit.DAYS);
        draftListing.setMinBookingDays(1);
        draftListing.setStatus(BillboardStatus.DRAFT);
        draftListing = billboardListingRepository.save(draftListing);

        Address addr3 = Address.of("300 MG Road", "Near Park", "Indiranagar", "Bangalore", "Karnataka", "560038");
        suspendedListing = new BillboardListing();
        suspendedListing.setUser(owner);
        suspendedListing.setName("Suspended Billboard");
        suspendedListing.setAddress(addr3);
        suspendedListing.setType(BillboardType.STATIC_HOARDING);
        suspendedListing.setWidthFt(new BigDecimal("20.00"));
        suspendedListing.setHeightFt(new BigDecimal("10.00"));
        suspendedListing.setFacing(FacingDirection.EAST);
        suspendedListing.setTrafficType(TrafficType.CITY_URBAN);
        suspendedListing.setAudienceType(AudienceType.COMMUTERS);
        suspendedListing.setStartPrice(new BigDecimal("50000.00"));
        suspendedListing.setMinBookingValue(1);
        suspendedListing.setMinBookingUnit(BookingDurationUnit.DAYS);
        suspendedListing.setMinBookingDays(1);
        suspendedListing.setStatus(BillboardStatus.SUSPENDED);
        suspendedListing = billboardListingRepository.save(suspendedListing);
    }

    @AfterEach
    void tearDown() {
        blockRepository.deleteAll();
        billboardListingRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Spring context loads successfully")
    void springContext_loads() {
        assertThat(mockMvc).isNotNull();
        assertThat(clock).isNotNull();
    }

    @Test
    @DisplayName("Public GET availability returns 200 unauthenticated")
    void security_publicGet_returns200() throws Exception {
        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "public, max-age=15, stale-while-revalidate=30"))
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Unauthenticated PUT owner availability returns 401")
    void security_ownerPut_unauthenticated_returns401() throws Exception {
        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ranges\":[]}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Missing If-Match on PUT with desired changes returns 428 Precondition Required")
    void missingIfMatch_returns428() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        BulkSyncRequest request = new BulkSyncRequest(List.of(
                new AvailabilityRangeRequest(today.plusDays(10), today.plusDays(15))
        ));

        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isPreconditionRequired())
                .andExpect(jsonPath("$.errorCode").value("PRECONDITION_REQUIRED"));
    }

    @Test
    @DisplayName("Stale ETag on PUT returns 412 with body envelope (currentBlocks, etag, today, errorCode, path)")
    void staleETag_returns412WithBody() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        BulkSyncRequest request = new BulkSyncRequest(List.of(
                new AvailabilityRangeRequest(today.plusDays(10), today.plusDays(15))
        ));

        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, "\"invalid-etag-hash\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isPreconditionFailed())
                .andExpect(jsonPath("$.errorCode").value("AVAILABILITY_STALE"))
                .andExpect(jsonPath("$.currentBlocks").isArray())
                .andExpect(jsonPath("$.etag").isString())
                .andExpect(jsonPath("$.today").value(today.toString()))
                .andExpect(jsonPath("$.path").value("/api/owner/listings/" + activeListing.getId() + "/availability"));
    }

    @Test
    @DisplayName("Submitting empty ranges with stale ETag when blocks exist returns 412")
    void emptyPutWithStaleETag_returns412() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        // Seed an existing block
        blockRepository.save(new BillboardAvailabilityBlock(activeListing.getId(), today.plusDays(5), today.plusDays(10),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));

        BulkSyncRequest request = new BulkSyncRequest(List.of());

        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, "\"stale-etag-hash\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isPreconditionFailed())
                .andExpect(jsonPath("$.errorCode").value("AVAILABILITY_STALE"));
    }

    @Test
    @DisplayName("CORS preflight with If-Match succeeds and allows If-Match")
    void cors_preflightPutWithIfMatch_returns200AndAllowsIfMatch() throws Exception {
        mockMvc.perform(options("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "PUT")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization,content-type,if-match"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, containsStringIgnoringCase("if-match")));
    }

    @Test
    @DisplayName("CORS exposed headers include ETag and Retry-After")
    void cors_exposedHeaders_containsETagAndRetryAfter() throws Exception {
        mockMvc.perform(get("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, containsString("ETag")))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, containsString("Retry-After")));
    }

    @Test
    @DisplayName("Replay same payload returns 200 OK with ETag and server today")
    void replay_samePayload_200WithNewETag() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        BulkSyncRequest request = new BulkSyncRequest(List.of(
                new AvailabilityRangeRequest(today.plusDays(10), today.plusDays(15))
        ));

        // GET current ETag
        MvcResult getRes = mockMvc.perform(get("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();
        String initialETag = getRes.getResponse().getHeader(HttpHeaders.ETAG);

        // First PUT
        MvcResult put1Res = mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, initialETag)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocks").hasJsonPath())
                .andExpect(jsonPath("$.today").value(today.toString()))
                .andReturn();

        String updatedETag = put1Res.getResponse().getHeader(HttpHeaders.ETAG);

        // Repeat identical PUT (replay safe, content-equality short-circuit without checking If-Match)
        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ETAG, updatedETag))
                .andExpect(jsonPath("$.today").value(today.toString()));
    }

    @Test
    @DisplayName("GET owner availability ETag in body and header match; body contains today")
    void get_etagInBodyAndHeaderMatch() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        MvcResult result = mockMvc.perform(get("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.today").value(today.toString()))
                .andReturn();

        String headerETag = result.getResponse().getHeader(HttpHeaders.ETAG);
        OwnerAvailabilityResponse body = objectMapper.readValue(result.getResponse().getContentAsString(), OwnerAvailabilityResponse.class);

        assertThat(headerETag).isEqualTo("\"" + body.etag() + "\"");
    }

    @Test
    @DisplayName("PUT response contains server today in body")
    void put_returnsTodayInBody() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        BulkSyncRequest request = new BulkSyncRequest(List.of(
                new AvailabilityRangeRequest(today.plusDays(20), today.plusDays(25))
        ));

        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, "\"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.today").value(today.toString()));
    }

    @Test
    @DisplayName("PUT with weak ETag header W/\"...\" round trip accepted")
    void put_weakEtagHeader_realHttpRoundTrip() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        BulkSyncRequest request = new BulkSyncRequest(List.of(
                new AvailabilityRangeRequest(today.plusDays(30), today.plusDays(35))
        ));

        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, "W/\"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Concurrency: two simultaneous PUTs with different payloads: one wins, one gets 412")
    void concurrency_differentPayloads_oneWinsOneFails() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        String emptyETag = "\"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\"";

        BulkSyncRequest payload1 = new BulkSyncRequest(List.of(new AvailabilityRangeRequest(today.plusDays(5), today.plusDays(10))));
        BulkSyncRequest payload2 = new BulkSyncRequest(List.of(new AvailabilityRangeRequest(today.plusDays(15), today.plusDays(20))));

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Integer> task1 = () -> {
            ready.countDown();
            start.await();
            return mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                            .header(HttpHeaders.IF_MATCH, emptyETag)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(payload1)))
                    .andReturn().getResponse().getStatus();
        };

        Callable<Integer> task2 = () -> {
            ready.countDown();
            start.await();
            return mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                            .header(HttpHeaders.IF_MATCH, emptyETag)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(payload2)))
                    .andReturn().getResponse().getStatus();
        };

        Future<Integer> f1 = executor.submit(task1);
        Future<Integer> f2 = executor.submit(task2);

        ready.await();
        start.countDown();

        int s1 = f1.get(10, TimeUnit.SECONDS);
        int s2 = f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        List<Integer> statuses = List.of(s1, s2);
        assertThat(statuses).containsExactlyInAnyOrder(200, 412);
    }

    @Test
    @DisplayName("Non-owner PUT returns 404 without locking or blocking concurrent owner PUT")
    void nonOwnerPut_doesNotBlockOwnerPut() throws Exception {
        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ranges\":[]}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("BILLBOARD_NOT_FOUND"));
    }

    @Test
    @DisplayName("Non-owner GET returns 404 with BILLBOARD_NOT_FOUND")
    void nonOwnerGet_returns404() throws Exception {
        mockMvc.perform(get("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherOwnerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("BILLBOARD_NOT_FOUND"));
    }

    @Test
    @DisplayName("Unchanged past range preserves same ID")
    void unchangedPastRange_sameId() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        BillboardAvailabilityBlock pastBlock = blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.minusDays(10), today.minusDays(5),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));
        Long originalId = pastBlock.getId();

        // Get current ETag
        MvcResult getRes = mockMvc.perform(get("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();
        String etag = getRes.getResponse().getHeader(HttpHeaders.ETAG);

        // Client adds a new future range while keeping past range
        BulkSyncRequest request = new BulkSyncRequest(List.of(
                new AvailabilityRangeRequest(today.minusDays(10), today.minusDays(5)),
                new AvailabilityRangeRequest(today.plusDays(10), today.plusDays(15))
        ));

        MvcResult putRes = mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, etag)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        BulkSyncResponse resp = objectMapper.readValue(putRes.getResponse().getContentAsString(), BulkSyncResponse.class);
        assertThat(resp.blocks()).hasSize(2);
        AvailabilityBlockDto pastDto = resp.blocks().stream()
                .filter(b -> b.startDate().equals(today.minusDays(10)))
                .findFirst().orElseThrow();
        assertThat(pastDto.id()).isEqualTo(originalId);
    }

    @Test
    @DisplayName("Unchanged range preserves created_ts timestamp")
    void unchangedRange_createdTsPreserved() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        Instant originalCreatedTs = clock.instant().minusSeconds(3600).truncatedTo(java.time.temporal.ChronoUnit.MICROS);
        BillboardAvailabilityBlock block = new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(1), today.plusDays(5),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId());
        block.setCreatedTs(originalCreatedTs);
        block = blockRepository.save(block);

        MvcResult getRes = mockMvc.perform(get("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andReturn();
        String etag = getRes.getResponse().getHeader(HttpHeaders.ETAG);

        // Add second range
        BulkSyncRequest request = new BulkSyncRequest(List.of(
                new AvailabilityRangeRequest(today.plusDays(1), today.plusDays(5)),
                new AvailabilityRangeRequest(today.plusDays(10), today.plusDays(15))
        ));

        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, etag)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        BillboardAvailabilityBlock reloaded = blockRepository.findById(block.getId()).orElseThrow();
        assertThat(reloaded.getCreatedTs().truncatedTo(java.time.temporal.ChronoUnit.MICROS)).isEqualTo(originalCreatedTs);
    }

    @Test
    @DisplayName("Public endpoint: past dates clamped to today and never returns past blocks")
    void publicEndpoint_pastDates_clampedToToday_neverReturnsPastBlocks() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        // Save block in past: today - 30 to today - 20
        blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.minusDays(30), today.minusDays(20),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));

        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", today.minusDays(60).toString())
                        .param("to", today.plusDays(30).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("Public endpoint: window entirely in past returns empty list 200 with Cache-Control 15s + SWR 30s")
    void publicEndpoint_windowEntirelyInPast_returnsEmptyList200() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", today.minusDays(60).toString())
                        .param("to", today.minusDays(10).toString()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "public, max-age=15, stale-while-revalidate=30"))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("Public DTO contains only startDate and endDate (no id, no blockType)")
    void publicDto_noIdNoBlockType() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(10), today.plusDays(20),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));

        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", today.toString())
                        .param("to", today.plusDays(30).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].startDate").value(today.plusDays(10).toString()))
                .andExpect(jsonPath("$[0].endDate").value(today.plusDays(20).toString()))
                .andExpect(jsonPath("$[0].id").doesNotExist())
                .andExpect(jsonPath("$[0].blockType").doesNotExist());
    }

    @Test
    @DisplayName("Public window: block is clipped to requested query dates")
    void publicWindow_clippedToRequestedDates() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        // Block: today+5 to today+25
        blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(5), today.plusDays(25),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));

        // Query: today+10 to today+20
        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", today.plusDays(10).toString())
                        .param("to", today.plusDays(20).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].startDate").value(today.plusDays(10).toString()))
                .andExpect(jsonPath("$[0].endDate").value(today.plusDays(20).toString()));
    }

    @Test
    @DisplayName("Public merge: hides block boundary between adjacent blocks of different types")
    void publicMerge_hidesBlockBoundary() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        // Block 1: OWNER_BLOCKED today+5 to today+10
        blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(5), today.plusDays(10),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));

        // Block 2: CONFIRMED_BOOKING today+11 to today+15
        blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(11), today.plusDays(15),
                AvailabilityBlockType.CONFIRMED_BOOKING, owner.getId()));

        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", today.toString())
                        .param("to", today.plusDays(30).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].startDate").value(today.plusDays(5).toString()))
                .andExpect(jsonPath("$[0].endDate").value(today.plusDays(15).toString()));
    }

    @Test
    @DisplayName("Public GET on draft billboard returns 404 with Cache-Control: public, max-age=60")
    void publicEndpoint_draftListing_returns404WithCacheControlMaxAge60() throws Exception {
        mockMvc.perform(get("/api/listings/" + draftListing.getId() + "/availability"))
                .andExpect(status().isNotFound())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "public, max-age=60"))
                .andExpect(jsonPath("$.errorCode").value("LISTING_NOT_ACTIVE"));
    }

    @Test
    @DisplayName("Public window too large (> 730 days) returns 400 AVAILABILITY_WINDOW_TOO_LARGE")
    void publicWindow_tooLarge_returns400() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", today.toString())
                        .param("to", today.plusDays(731).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("AVAILABILITY_WINDOW_TOO_LARGE"));
    }

    @Test
    @DisplayName("Public window invalid (from > to) returns 400 AVAILABILITY_WINDOW_INVALID")
    void publicWindow_fromAfterTo_returns400() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", today.plusDays(20).toString())
                        .param("to", today.plusDays(10).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("AVAILABILITY_WINDOW_INVALID"));
    }

    @Test
    @DisplayName("Public window: omitting to parameter defaults to from + 365 days")
    void publicWindow_defaultTo_isFromPlus365() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        // Block within 365 days: today + 100 to today + 110
        blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(100), today.plusDays(110),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));

        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].startDate").value(today.plusDays(100).toString()));
    }

    @Test
    @DisplayName("Marketplace search hook: active block inside query window excludes listing")
    void findAvailableListings_excludesBlockedIds() {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        LocalDate searchFrom = today.plusDays(10);
        LocalDate searchTo = today.plusDays(20);

        // Before block: listing is available
        List<BillboardListing> initial = billboardListingRepository.findAvailableListings(searchFrom, searchTo, clock.instant());
        assertThat(initial).extracting(BillboardListing::getId).contains(activeListing.getId());

        // Add block overlapping window: today+15 to today+18
        blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(15), today.plusDays(18),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));

        // After block: listing is excluded
        List<BillboardListing> after = billboardListingRepository.findAvailableListings(searchFrom, searchTo, clock.instant());
        assertThat(after).extracting(BillboardListing::getId).doesNotContain(activeListing.getId());
    }

    @Test
    @DisplayName("Listing deletion cascades and deletes availability blocks")
    void deletingListing_cascadesBlocks_h2() {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(10), today.plusDays(20),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));

        assertThat(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(activeListing.getId(), AvailabilityBlockType.OWNER_BLOCKED))
                .hasSize(1);

        billboardListingRepository.deleteById(activeListing.getId());

        assertThat(blockRepository.findByBillboardIdAndBlockTypeOrderByStartDateAsc(activeListing.getId(), AvailabilityBlockType.OWNER_BLOCKED))
                .isEmpty();
    }

    @Test
    @DisplayName("Deleting user sets created_by to null while block remains intact")
    void deletingUser_setsCreatedByToNull_preservesAvailabilityBlock() {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        User buyer = userRepository.save(new User("Test", "Buyer", "buyer.int@example.com", "pass", "9876543299", Role.ADVERTISER));

        BillboardAvailabilityBlock block = blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(10), today.plusDays(20),
                AvailabilityBlockType.CONFIRMED_BOOKING, buyer.getId()));

        userRepository.deleteById(buyer.getId());

        BillboardAvailabilityBlock reloaded = blockRepository.findById(block.getId()).orElseThrow();
        assertThat(reloaded.getCreatedBy()).isNull();
        assertThat(reloaded.getBlockType()).isEqualTo(AvailabilityBlockType.CONFIRMED_BOOKING);
    }

    @Test
    @DisplayName("Security method scoping: unauthenticated POST to public availability returns 401; authenticated POST returns 405")
    void security_publicAvailability_postBlocked() throws Exception {
        mockMvc.perform(post("/api/listings/" + activeListing.getId() + "/availability"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.errorCode").value("METHOD_NOT_ALLOWED"));
    }

    @Test
    @DisplayName("Public GET on draft, suspended, or missing listing with past window returns 404 LISTING_NOT_ACTIVE")
    void publicGet_nonActiveOrMissingWithPastWindow_returns404() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));

        mockMvc.perform(get("/api/listings/" + draftListing.getId() + "/availability")
                        .param("to", today.minusDays(5).toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("LISTING_NOT_ACTIVE"));

        mockMvc.perform(get("/api/listings/" + suspendedListing.getId() + "/availability")
                        .param("to", today.minusDays(5).toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("LISTING_NOT_ACTIVE"));

        mockMvc.perform(get("/api/listings/9999999/availability")
                        .param("to", today.minusDays(5).toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("LISTING_NOT_ACTIVE"));
    }

    @Test
    @DisplayName("Public GET with from > to and past to returns 400 AVAILABILITY_WINDOW_INVALID")
    void publicGet_fromAfterToInPast_returns400() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));

        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", today.plusDays(10).toString())
                        .param("to", today.minusDays(5).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("AVAILABILITY_WINDOW_INVALID"));
    }

    @Test
    @DisplayName("Malformed inputs map to structured 400 VALIDATION_FAILED instead of 500")
    void malformedInputs_return400ValidationFailedNot500() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));

        // 1. Null element inside ranges array
        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, "\"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ranges\":[null]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));

        // 2. Invalid calendar date in JSON body
        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ranges\":[{\"startDate\":\"2026-02-30\",\"endDate\":\"2026-03-01\"}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));

        // 3. Invalid query date param on public GET
        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", "not-a-date"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.from").exists());

        // 4. Non-numeric path variable
        mockMvc.perform(get("/api/listings/not-a-number/availability"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.billboardId").exists());

        // 5. Extreme ISO date overflow on public GET
        mockMvc.perform(get("/api/listings/" + activeListing.getId() + "/availability")
                        .param("from", "+999999999-12-30"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("AVAILABILITY_DATE_OUT_OF_BOUNDS"));

        // 6. Unsupported content-type returns 415 UNSUPPORTED_CONTENT_TYPE, not 500
        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("{\"ranges\":[]}"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.errorCode").value("UNSUPPORTED_CONTENT_TYPE"));

        // 7. Unknown route returns 404 RESOURCE_NOT_FOUND, not 500
        mockMvc.perform(get("/api/owner/listings/" + activeListing.getId() + "/nonexistent")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));

        // 8. Malformed lone-quote If-Match header returns 412, not 500
        BulkSyncRequest validReq = new BulkSyncRequest(List.of(
                new AvailabilityRangeRequest(today.plusDays(2), today.plusDays(4))
        ));
        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, "\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isPreconditionFailed())
                .andExpect(jsonPath("$.errorCode").value("AVAILABILITY_STALE"));
    }

    @Test
    @DisplayName("Suspended listing rejects owner availability PUT with 400 LISTING_SUSPENDED while DRAFT succeeds")
    void lifecycleGuards_suspendedRejected_draftAllowed() throws Exception {
        LocalDate today = LocalDate.now(clock.withZone(IST_ZONE));
        BulkSyncRequest request = new BulkSyncRequest(List.of(
                new AvailabilityRangeRequest(today.plusDays(2), today.plusDays(5))
        ));
        String emptyETag = "\"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\"";

        mockMvc.perform(put("/api/owner/listings/" + suspendedListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, emptyETag)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("LISTING_SUSPENDED"));

        mockMvc.perform(put("/api/owner/listings/" + draftListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, emptyETag)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocks", hasSize(1)));
    }

    @Test
    @DisplayName("Owner GET/PUT/412 return upcoming CONFIRMED_BOOKING and active BOOKING_HOLD without exposing expired holds or PII")
    void ownerVisibility_includesBookingsAndActiveHolds_omitsExpiredAndPii() throws Exception {
        Instant now = clock.instant();
        LocalDate today = now.atZone(IST_ZONE).toLocalDate();

        User buyer = userRepository.save(new User("Ad", "Buyer", "buyer.vis@example.com", "pass", "9876543219", Role.ADVERTISER));

        // 1. Owner block
        blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(1), today.plusDays(3),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));

        // 2. Upcoming confirmed booking (with bookingRefId & buyer createdBy that must NOT leak in DTO)
        BillboardAvailabilityBlock futureBooking = new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(10), today.plusDays(12),
                AvailabilityBlockType.CONFIRMED_BOOKING, buyer.getId());
        futureBooking.setBookingRefId(777L);
        blockRepository.save(futureBooking);

        // 3. Past confirmed booking (should be excluded from upcoming owner visibility)
        BillboardAvailabilityBlock pastBooking = new BillboardAvailabilityBlock(
                activeListing.getId(), today.minusDays(15), today.minusDays(10),
                AvailabilityBlockType.CONFIRMED_BOOKING, buyer.getId());
        pastBooking.setBookingRefId(776L);
        blockRepository.save(pastBooking);

        // 4. Active hold (expires in +10m)
        BillboardAvailabilityBlock activeHold = new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(20), today.plusDays(22),
                AvailabilityBlockType.BOOKING_HOLD, buyer.getId());
        activeHold.setBookingRefId(888L);
        activeHold.setExpiryTs(now.plusSeconds(600));
        blockRepository.save(activeHold);

        // 5. Expired hold (expired 10s ago -> must NOT be shown)
        BillboardAvailabilityBlock expiredHold = new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(25), today.plusDays(27),
                AvailabilityBlockType.BOOKING_HOLD, buyer.getId());
        expiredHold.setBookingRefId(889L);
        expiredHold.setExpiryTs(now.minusSeconds(10));
        blockRepository.save(expiredHold);

        // Verify GET includes OWNER_BLOCKED, upcoming CONFIRMED_BOOKING, active BOOKING_HOLD (3 total), no bookingRefId/createdBy
        MvcResult getRes = mockMvc.perform(get("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocks", hasSize(3)))
                .andExpect(jsonPath("$.blocks[0].blockType").value("OWNER_BLOCKED"))
                .andExpect(jsonPath("$.blocks[1].blockType").value("CONFIRMED_BOOKING"))
                .andExpect(jsonPath("$.blocks[2].blockType").value("BOOKING_HOLD"))
                .andExpect(jsonPath("$.blocks[1].bookingRefId").doesNotExist())
                .andExpect(jsonPath("$.blocks[1].createdBy").doesNotExist())
                .andReturn();
        String initialETag = getRes.getResponse().getHeader(HttpHeaders.ETAG);

        // Verify stale PUT returns 412 with the same 3 blocks (bookings + holds preserved in 412 body)
        BulkSyncRequest syncReq = new BulkSyncRequest(List.of(
                new AvailabilityRangeRequest(today.plusDays(1), today.plusDays(3)),
                new AvailabilityRangeRequest(today.plusDays(8), today.plusDays(15))
        ));
        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, "\"wrong-etag\"")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(syncReq)))
                .andExpect(status().isPreconditionFailed())
                .andExpect(jsonPath("$.currentBlocks", hasSize(3)))
                .andExpect(jsonPath("$.etag").value(initialETag.replace("\"", "")));

        // Verify valid PUT overlapping the CONFIRMED_BOOKING trims around it and STILL returns booking + active hold
        mockMvc.perform(put("/api/owner/listings/" + activeListing.getId() + "/availability")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken)
                        .header(HttpHeaders.IF_MATCH, initialETag)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(syncReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.warnings", hasSize(1)))
                .andExpect(jsonPath("$.blocks[*].blockType", contains("OWNER_BLOCKED", "OWNER_BLOCKED", "CONFIRMED_BOOKING", "OWNER_BLOCKED", "BOOKING_HOLD")));
    }

    @Test
    @DisplayName("Scheduled hold cleanup job deletes only expired BOOKING_HOLD rows and preserves active holds, bookings, and owner blocks")
    void holdCleanupJob_purgesExpiredHoldsOnly() {
        Instant now = clock.instant();
        LocalDate today = now.atZone(IST_ZONE).toLocalDate();

        BillboardAvailabilityBlock ownerBlock = blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(1), today.plusDays(2),
                AvailabilityBlockType.OWNER_BLOCKED, owner.getId()));

        BillboardAvailabilityBlock booking = blockRepository.save(new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(4), today.plusDays(5),
                AvailabilityBlockType.CONFIRMED_BOOKING, owner.getId()));

        BillboardAvailabilityBlock activeHold = new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(7), today.plusDays(8),
                AvailabilityBlockType.BOOKING_HOLD, owner.getId());
        activeHold.setExpiryTs(now.plusSeconds(300));
        activeHold = blockRepository.save(activeHold);

        BillboardAvailabilityBlock expiredHold = new BillboardAvailabilityBlock(
                activeListing.getId(), today.plusDays(10), today.plusDays(11),
                AvailabilityBlockType.BOOKING_HOLD, owner.getId());
        expiredHold.setExpiryTs(now.minusSeconds(1));
        expiredHold = blockRepository.save(expiredHold);

        int deleted = holdCleanupJob.purgeExpiredHolds();

        assertThat(deleted).isEqualTo(1);
        assertThat(blockRepository.findById(expiredHold.getId())).isEmpty();
        assertThat(blockRepository.findById(activeHold.getId())).isPresent();
        assertThat(blockRepository.findById(booking.getId())).isPresent();
        assertThat(blockRepository.findById(ownerBlock.getId())).isPresent();
    }
}

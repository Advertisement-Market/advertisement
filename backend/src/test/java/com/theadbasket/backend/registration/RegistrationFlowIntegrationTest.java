package com.theadbasket.backend.registration;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.advertiser.AdvertiserProfileRepository;
import com.theadbasket.backend.advertiser.CampaignBriefRepository;
import com.theadbasket.backend.agency.AgencyProfileRepository;
import com.theadbasket.backend.availability.AvailabilityBlockType;
import com.theadbasket.backend.availability.BillboardAvailabilityBlock;
import com.theadbasket.backend.availability.BillboardAvailabilityBlockRepository;
import com.theadbasket.backend.config.AuthProviderPolicyProperties;
import com.theadbasket.backend.config.JwtProperties;
import com.theadbasket.backend.notification.Notification;
import com.theadbasket.backend.notification.NotificationCategory;
import com.theadbasket.backend.notification.NotificationRepository;
import com.theadbasket.backend.notification.NotificationTone;
import com.theadbasket.backend.owner.BillboardListing;
import com.theadbasket.backend.owner.BillboardListingRepository;
import com.theadbasket.backend.owner.OwnerProfileRepository;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.AuthProvider;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

/**
 * End-to-end role registration (advertiser/owner/agency) against the full stack
 * on H2.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RegistrationFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private AdvertiserProfileRepository advertiserProfiles;
    @Autowired
    private CampaignBriefRepository campaignBriefs;
    @Autowired
    private OwnerProfileRepository ownerProfiles;
    @Autowired
    private BillboardListingRepository billboardListings;
    @Autowired
    private AgencyProfileRepository agencyProfiles;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private BillboardAvailabilityBlockRepository availabilityBlocks;
    @Autowired
    private AuthProviderPolicyProperties authProviderPolicy;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private JwtProperties jwtProperties;
    @Autowired
    private EntityManager entityManager;

    private static final String OWNER_ONBOARDING = """
            {
              "firstName":"Vikram","lastName":"Kumar","phone":"+91 97654 32109",
              "companyName":"Kumar Billboards","companyPhone":"","companyRegNumber":"",
              "gstNumber":"","addressLine1":"5 CG Road","addressLine2":"","landmark":"","city":"Ahmedabad",
              "state":"Gujarat","pincode":"380001",
              "tradeLicenseNo":"","ownershipType":"Owned","regulatoryApprovals":"",
              "billboard":{"name":"BKC LED Screen Onboard","addressLine1":"BKC","addressLine2":"","landmark":"",
                "city":"Mumbai","state":"Maharashtra","pincode":"400051",
                "type":"LED Digital","widthFt":40,"heightFt":25,"groundHeightFt":15,"facing":"North",
                "trafficType":"City / Urban","audienceType":"Commuters","footfall":"150000","startPrice":580000,
                "minBookingValue":3,"minBookingUnit":"MONTHS","discountNote":""},
              "acceptedTerms":true
            }""";

    private static final String ADVERTISER = """
            {
              "accountEmail":"adv@example.com","password":"Passw0rd!",
              "companyName":"Nimbus Foods","businessType":"FMCG","website":"https://nimbus.in",
              "gstNumber":"","panNumber":"","industries":["FMCG","Retail & Fashion"],
              "firstName":"Rohan","lastName":"Kapoor","contactDesignation":"Marketing Head",
              "contactEmail":"rohan@nimbus.in","contactPhone":"+91 98765 43210",
              "addressLine1":"12 MG Road","addressLine2":"","landmark":"","city":"Mumbai",
              "state":"Maharashtra","pincode":"400001",
              "project":{"title":"Summer Launch","description":"Nationwide summer campaign",
                "targetAudience":"Youth 18-30","targetLocation":"Mumbai & Pune","startDate":"2026-08-01",
                "endDate":"2026-08-01","duration":"3 months","budgetMinValue":500000,"budgetMinUnit":"Lakh","budgetMaxValue":1200000,
                "budgetMaxUnit":"Lakh","flexibleBudget":true,"quotationsRequired":"3-5",
                "agencyPreferences":["Verified only","OOH Specialist"]},
              "acceptedTerms":true
            }""";

    private static final String OWNER = """
            {
              "firstName":"Vikram","lastName":"Kumar","accountEmail":"owner@example.com","phone":"+91 97654 32109",
              "password":"Passw0rd!","companyName":"Kumar Billboards","companyPhone":"","companyRegNumber":"",
              "gstNumber":"","addressLine1":"5 CG Road","addressLine2":"","landmark":"","city":"Ahmedabad",
              "state":"Gujarat","pincode":"380001",
              "tradeLicenseNo":"","ownershipType":"Owned","regulatoryApprovals":"",
              "billboard":{"name":"BKC LED Screen","addressLine1":"BKC","addressLine2":"","landmark":"",
                "city":"Mumbai","state":"Maharashtra","pincode":"400051",
                "type":"LED Digital","widthFt":40,"heightFt":25,"groundHeightFt":15,"facing":"North",
                "trafficType":"City / Urban","audienceType":"Commuters","footfall":"150000","startPrice":580000,
                "minBookingValue":3,"minBookingUnit":"MONTHS","discountNote":""},
              "acceptedTerms":true
            }""";

    private static final String AGENCY = """
            {
              "accountEmail":"agency@example.com","password":"Passw0rd!","agencyName":"Pixel & Print",
              "agencyType":"Full-Service Ad Agency","yearEstablished":2014,"yearsExperience":"10+ years",
              "tagline":"Bold ideas","about":"Full-service OOH agency","website":"https://pp.in","contactNo":"",
              "linkedinUrl":"","addressLine1":"Andheri East","addressLine2":"","landmark":"","city":"Mumbai",
              "state":"Maharashtra","pincode":"400059",
              "firstName":"Priya","lastName":"Mehta","contactDesignation":"Director","contactEmail":"priya@pp.in",
              "contactPhone":"+91 98200 11234","services":["OOH Media Planning","Creative Design"],
              "industries":["FMCG","Real Estate"],"expertiseTags":["Premium"],"languages":["English","Hindi"],
              "campaignsCompleted":"200+","pricingModel":"Monthly Retainer","geoCoverage":"Pan India",
              "minTenderBudget":"5L+","coverageCities":"Mumbai, Delhi","regNumber":"","gstNumber":"","panNumber":"",
              "portfolio":[{"title":"Diwali OOH Blitz","meta":"120 boards · 30 days"}],
              "acceptedTerms":true
            }""";

    @Test
    void advertiserRegistration_createsAccount_profile_andBrief() throws Exception {
        mockMvc.perform(post("/api/auth/register/advertiser")
                .contentType(MediaType.APPLICATION_JSON).content(ADVERTISER))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(cookie().httpOnly("refreshToken", true))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("adv@example.com"))
                .andExpect(jsonPath("$.user.role").value("ADVERTISER"));
        assertThat(advertiserProfiles.count()).isEqualTo(1);
        assertThat(campaignBriefs.count()).isEqualTo(1);
    }

    @Test
    void ownerRegistration_createsAccount_profile_andListing() throws Exception {
        mockMvc.perform(post("/api/auth/register/owner")
                .contentType(MediaType.APPLICATION_JSON).content(OWNER))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(jsonPath("$.user.role").value("OWNER"))
                .andExpect(jsonPath("$.user.email").value("owner@example.com"))
                .andExpect(jsonPath("$.initialListingId").isNumber());
        assertThat(ownerProfiles.count()).isEqualTo(1);
        assertThat(billboardListings.count()).isEqualTo(1);
        BillboardListing createdListing = billboardListings.findAll().get(0);
        assertThat(createdListing.getId()).isNotNull();
        assertThat(notificationRepository.count()).isEqualTo(1);
        Notification notif = notificationRepository.findAll().get(0);
        assertThat(notif.getCategory()).isEqualTo(NotificationCategory.ONBOARDING);
        assertThat(notif.getTone()).isEqualTo(NotificationTone.TEAL);
        assertThat(notif.isRead()).isFalse();
    }

    @Test
    void agencyRegistration_createsAccount_andProfile() throws Exception {
        mockMvc.perform(post("/api/auth/register/agency")
                .contentType(MediaType.APPLICATION_JSON).content(AGENCY))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(jsonPath("$.user.role").value("AGENCY"))
                .andExpect(jsonPath("$.user.email").value("agency@example.com"));
        assertThat(agencyProfiles.count()).isEqualTo(1);
    }

    @Test
    void advertiserRegistration_missingRequiredFields_returns400() throws Exception {
        String bad = """
                {"accountEmail":"x@example.com","password":"Passw0rd!","companyName":"","businessType":"",
                 "industries":[],"firstName":"","contactDesignation":"","contactEmail":"nope",
                 "contactPhone":"123","addressLine1":"","city":"","state":"","pincode":"12","acceptedTerms":false}""";
        mockMvc.perform(post("/api/auth/register/advertiser")
                .contentType(MediaType.APPLICATION_JSON).content(bad))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isNotEmpty());
    }

    @Test
    void ownerRegistration_withBlockedRanges_persistsInitialAvailabilityBlocks() throws Exception {
        LocalDate istToday = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        String start = istToday.plusDays(3).toString();
        String end = istToday.plusDays(6).toString();
        String payload = """
                {
                  "firstName":"Vikram","lastName":"Kumar","accountEmail":"owner.cal@example.com","phone":"+91 97654 32109",
                  "password":"Passw0rd!","companyName":"Kumar Billboards","companyPhone":"","companyRegNumber":"",
                  "gstNumber":"","addressLine1":"5 CG Road","addressLine2":"","landmark":"","city":"Ahmedabad",
                  "state":"Gujarat","pincode":"380001",
                  "tradeLicenseNo":"","ownershipType":"Owned","regulatoryApprovals":"",
                  "billboard":{"name":"BKC LED Screen Cal","addressLine1":"BKC","addressLine2":"","landmark":"",
                    "city":"Mumbai","state":"Maharashtra","pincode":"400051",
                    "type":"LED Digital","widthFt":40,"heightFt":25,"groundHeightFt":15,"facing":"North",
                    "trafficType":"City / Urban","audienceType":"Commuters","footfall":"150000","startPrice":580000,
                    "minBookingValue":3,"minBookingUnit":"MONTHS","discountNote":"",
                    "blockedRanges":[{"startDate":"%s","endDate":"%s"}]},
                  "acceptedTerms":true
                }""".formatted(start, end);

        MvcResult regResult = mockMvc.perform(post("/api/auth/register/owner")
                .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("OWNER"))
                .andReturn();

        JsonNode regJson = new ObjectMapper().readTree(regResult.getResponse().getContentAsString());
        String accessToken = regJson.get("accessToken").asText();

        List<BillboardListing> listings = billboardListings.findAll();
        assertThat(listings).hasSize(1);
        Long listingId = listings.get(0).getId();

        List<BillboardAvailabilityBlock> blocks = availabilityBlocks
                .findByBillboardIdAndBlockTypeOrderByStartDateAsc(
                        listingId, AvailabilityBlockType.OWNER_BLOCKED);
        assertThat(blocks).hasSize(1);
        assertThat(blocks.get(0).getStartDate()).isEqualTo(istToday.plusDays(3));
        assertThat(blocks.get(0).getEndDate()).isEqualTo(istToday.plusDays(6));

        // Verify the exact owner dashboard API flow (GET listings -> GET availability) returns initial blocks
        mockMvc.perform(get("/api/owner/listings")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(listingId))
                .andExpect(jsonPath("$[0].status").value("DRAFT"));

        mockMvc.perform(get("/api/owner/listings/{id}/availability", listingId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.today").value(istToday.toString()))
                .andExpect(jsonPath("$.etag").isNotEmpty())
                .andExpect(jsonPath("$.blocks.length()").value(1))
                .andExpect(jsonPath("$.blocks[0].startDate").value(start))
                .andExpect(jsonPath("$.blocks[0].endDate").value(end))
                .andExpect(jsonPath("$.blocks[0].blockType").value("OWNER_BLOCKED"));
    }

    @Test
    @DirtiesContext
    void advertiserRegistration_whenLocalProviderDisabled_returns400() throws Exception {
        authProviderPolicy.setEnabled(List.of(AuthProvider.GOOGLE));
        try {
            mockMvc.perform(post("/api/auth/register/advertiser")
                    .contentType(MediaType.APPLICATION_JSON).content(ADVERTISER))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Local registration is currently unavailable. Please try again later."));
        } finally {
            authProviderPolicy.setEnabled(List.of(AuthProvider.LOCAL, AuthProvider.GOOGLE));
        }
    }

    @Test
    void ownerOnboarding_promotesExistingMember_rotatesTokens_andPersistsOwnerRoleInDb() throws Exception {
        String memberPayload = """
                {"firstName":"Join","lastName":"Member","email":"join.member@example.com",
                 "phone":"+91 91111 22222","password":"Passw0rd!"}""";
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(memberPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("MEMBER"))
                .andReturn();

        ObjectMapper mapper = new ObjectMapper();
        JsonNode memberJson = mapper.readTree(regResult.getResponse().getContentAsString());
        String memberAccessToken = memberJson.get("accessToken").asText();
        String memberRefreshToken = memberJson.get("refreshToken").asText();
        long userId = memberJson.get("user").get("id").asLong();

        // Promote MEMBER -> OWNER via /api/onboarding/owner
        MvcResult onboardResult = mockMvc.perform(post("/api/onboarding/owner")
                        .header("Authorization", "Bearer " + memberAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(OWNER_ONBOARDING))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(jsonPath("$.user.role").value("OWNER"))
                .andExpect(jsonPath("$.user.email").value("join.member@example.com"))
                .andExpect(jsonPath("$.initialListingId").isNumber())
                .andReturn();

        JsonNode ownerJson = mapper.readTree(onboardResult.getResponse().getContentAsString());
        String ownerAccessToken = ownerJson.get("accessToken").asText();
        String ownerRefreshToken = ownerJson.get("refreshToken").asText();

        // Flush & clear persistence context to prove dirty role mutation was persisted (not lost on revokeAll)
        entityManager.flush();
        entityManager.clear();
        User persisted = userRepository.findById(userId).orElseThrow();
        assertThat(persisted.getRole()).isEqualTo(Role.OWNER);
        // Existing non-blank account phone must NOT be overwritten during promotion
        assertThat(persisted.getPhone()).isEqualTo("+91 91111 22222");

        // /api/auth/me with fresh OWNER token reports OWNER
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + ownerAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("OWNER"));

        // New OWNER token accesses /api/owner/listings cleanly (JWT claim role=OWNER)
        assertThat(jwtService.toPrincipal(ownerAccessToken).role()).isEqualTo(Role.OWNER);
        mockMvc.perform(get("/api/owner/listings")
                        .header("Authorization", "Bearer " + ownerAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // Old MEMBER access token is stateless with ROLE_MEMBER -> 403 on /api/owner/listings
        mockMvc.perform(get("/api/owner/listings")
                        .header("Authorization", "Bearer " + memberAccessToken))
                .andExpect(status().isForbidden());

        // Old MEMBER access token re-hitting /api/onboarding/owner -> 409 ALREADY_REGISTERED
        mockMvc.perform(post("/api/onboarding/owner")
                        .header("Authorization", "Bearer " + memberAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(OWNER_ONBOARDING))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("ALREADY_REGISTERED"));

        // Old MEMBER refresh token was revoked -> 401 TOKEN_REVOKED
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + memberRefreshToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("TOKEN_REVOKED"));

        // New OWNER refresh token works -> 200 OK (proves revokeAllForUser ran BEFORE issueTokensFor)
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + ownerRefreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("OWNER"));
    }

    @Test
    void ownerOnboarding_googleMemberWithBlankPhone_fillsPhoneWithoutTouchingEmailOrPassword() throws Exception {
        User googleMember = new User("Gaurav", "Patel", "gaurav.google@example.com", null, null, Role.MEMBER);
        googleMember.setAuthProvider(AuthProvider.GOOGLE);
        googleMember.setGoogleSubjectId("google-sub-123");
        googleMember.setEmailVerified(true);
        googleMember = userRepository.saveAndFlush(googleMember);
        String token = jwtService.generateAccessToken(googleMember);

        mockMvc.perform(post("/api/onboarding/owner")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(OWNER_ONBOARDING))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("OWNER"))
                .andExpect(jsonPath("$.user.hasPassword").value(false));

        entityManager.flush();
        entityManager.clear();
        User reloaded = userRepository.findById(googleMember.getId()).orElseThrow();
        assertThat(reloaded.getRole()).isEqualTo(Role.OWNER);
        assertThat(reloaded.getPhone()).isEqualTo("+91 97654 32109");
        assertThat(reloaded.hasPassword()).isFalse();
        assertThat(reloaded.getEmail()).isEqualTo("gaurav.google@example.com");
    }

    @Test
    void ownerOnboarding_missingExpiredOrMalformedToken_returns401AuthenticationRequired() throws Exception {
        // 1. Missing Authorization header -> 401 (NOT 403)
        mockMvc.perform(post("/api/onboarding/owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(OWNER_ONBOARDING))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("AUTHENTICATION_REQUIRED"));

        // 2. Expired JWT -> 401 (NOT 403)
        String expiredJwt = Jwts.builder()
                .subject("expired@example.com")
                .claim("uid", 999L)
                .claim("role", "MEMBER")
                .issuedAt(Date.from(Instant.now().minusSeconds(3600)))
                .expiration(Date.from(Instant.now().minusSeconds(60)))
                .signWith(Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8)))
                .compact();
        mockMvc.perform(post("/api/onboarding/owner")
                        .header("Authorization", "Bearer " + expiredJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(OWNER_ONBOARDING))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("AUTHENTICATION_REQUIRED"));

        // 3. Malformed JWT -> 401 (NOT 403)
        mockMvc.perform(post("/api/onboarding/owner")
                        .header("Authorization", "Bearer not-a-valid-jwt")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(OWNER_ONBOARDING))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("AUTHENTICATION_REQUIRED"));

        assertThat(ownerProfiles.count()).isZero();
        assertThat(billboardListings.count()).isZero();
    }

    @Test
    void ownerOnboarding_deletedUserToken_returns401SessionInvalid() throws Exception {
        User ghost = new User("Ghost", "User", "ghost@example.com", "pw", null, Role.MEMBER);
        ghost = userRepository.saveAndFlush(ghost);
        String validToken = jwtService.generateAccessToken(ghost);
        userRepository.delete(ghost);
        userRepository.flush();

        mockMvc.perform(post("/api/onboarding/owner")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(OWNER_ONBOARDING))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("SESSION_INVALID"));

        assertThat(ownerProfiles.count()).isZero();
        assertThat(billboardListings.count()).isZero();
    }

    @Test
    void ownerOnboarding_disabledMember_returns403_andRefreshReturns401AccountDisabled() throws Exception {
        String memberPayload = """
                {"firstName":"Dis","lastName":"Abled","email":"disabled.member@example.com",
                 "phone":"+91 93333 44444","password":"Passw0rd!"}""";
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(memberPayload))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json = new ObjectMapper().readTree(regResult.getResponse().getContentAsString());
        String accessToken = json.get("accessToken").asText();
        String refreshToken = json.get("refreshToken").asText();
        long userId = json.get("user").get("id").asLong();

        User user = userRepository.findById(userId).orElseThrow();
        user.setEnabled(false);
        userRepository.saveAndFlush(user);

        // Onboarding rejected with 403 ACCOUNT_DISABLED
        mockMvc.perform(post("/api/onboarding/owner")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(OWNER_ONBOARDING))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCOUNT_DISABLED"));

        // Refresh rejected with 401 ACCOUNT_DISABLED and revokes the token
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("ACCOUNT_DISABLED"));

        // Subsequent refresh with same token reports TOKEN_REVOKED (proves revocation committed)
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("TOKEN_REVOKED"));

        assertThat(ownerProfiles.count()).isZero();
    }

    @Test
    void ownerOnboarding_alreadyOwnerOrOtherRole_returns409WithDistinctCodes() throws Exception {
        // Already OWNER -> 409 ALREADY_REGISTERED
        User owner = userRepository.saveAndFlush(
                new User("Own", "Er", "existing.owner@example.com", "pw", "+91 94444 55555", Role.OWNER));
        mockMvc.perform(post("/api/onboarding/owner")
                        .header("Authorization", "Bearer " + jwtService.generateAccessToken(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(OWNER_ONBOARDING))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("ALREADY_REGISTERED"));

        // Non-MEMBER role (ADVERTISER) -> 409 ROLE_CONFLICT
        User advertiser = userRepository.saveAndFlush(
                new User("Adv", "User", "existing.adv@example.com", "pw", "+91 95555 66666", Role.ADVERTISER));
        mockMvc.perform(post("/api/onboarding/owner")
                        .header("Authorization", "Bearer " + jwtService.generateAccessToken(advertiser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(OWNER_ONBOARDING))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("ROLE_CONFLICT"));

        assertThat(ownerProfiles.count()).isZero();
        assertThat(billboardListings.count()).isZero();
    }

    @Test
    void anonymousOwnerRegister_uniform409AcrossRoles_andIgnoresStaleBearerHeader() throws Exception {
        // Seed an existing MEMBER with email owner@example.com
        userRepository.saveAndFlush(
                new User("Mem", "Ber", "owner@example.com", "pw", "+91 96666 77777", Role.MEMBER));

        mockMvc.perform(post("/api/auth/register/owner")
                        .contentType(MediaType.APPLICATION_JSON).content(OWNER))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("EMAIL_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.message").value("An account already exists for owner@example.com. Please sign in to continue."));

        // Same response shape/message when existing account is OWNER (no role leakage)
        User existing = userRepository.findByEmailIgnoreCase("owner@example.com").orElseThrow();
        existing.setRole(Role.OWNER);
        userRepository.saveAndFlush(existing);

        mockMvc.perform(post("/api/auth/register/owner")
                        .contentType(MediaType.APPLICATION_JSON).content(OWNER))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("EMAIL_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.message").value("An account already exists for owner@example.com. Please sign in to continue."));

        // Stale/expired Authorization header on public anonymous register with a fresh email -> 201 Created
        String freshOwner = OWNER.replace("owner@example.com", "fresh.owner@example.com");
        mockMvc.perform(post("/api/auth/register/owner")
                        .header("Authorization", "Bearer stale.invalid.token")
                        .contentType(MediaType.APPLICATION_JSON).content(freshOwner))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.email").value("fresh.owner@example.com"))
                .andExpect(jsonPath("$.user.role").value("OWNER"));
    }
}


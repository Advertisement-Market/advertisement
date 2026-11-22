package com.theadbasket.backend.owner;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.address.AddressRepository;
import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.FacingDirection;
import com.theadbasket.backend.lov.TrafficType;
import com.theadbasket.backend.owner.dto.PricingPackageRequest;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OwnerListingPricingPackagesTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private BillboardListingRepository billboardListingRepository;

    @Autowired
    private PricingPackageService pricingPackageService;

    @Autowired
    private JwtService jwtService;

    private User owner;
    private String ownerToken;

    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        billboardListingRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();

        owner = userRepository.save(new User("Ramesh", "Patel", "ramesh.pricing@example.com", "pass", "9811122233", Role.OWNER));
        ownerToken = jwtService.generateAccessToken(owner);
    }

    private BillboardListing createListingWithPackages(String name, BigDecimal startPrice) {
        Address address = Address.of("100 Bandra West", "Hill Road", "Near Station", "Mumbai", "Maharashtra", "400050");
        BillboardListing listing = new BillboardListing();
        listing.setUser(owner);
        listing.setName(name);
        listing.setAddress(address);
        listing.setType(BillboardType.LED_DIGITAL);
        listing.setWidthFt(new BigDecimal("40.00"));
        listing.setHeightFt(new BigDecimal("20.00"));
        listing.setFacing(FacingDirection.NORTH);
        listing.setTrafficType(TrafficType.CITY_URBAN);
        listing.setAudienceType(AudienceType.COMMUTERS);
        listing.setStartPrice(startPrice);
        listing.setMinBookingValue(1);
        listing.setMinBookingUnit(BookingDurationUnit.MONTHS);
        listing.setMinBookingDays(30);

        List<PricingPackageRequest> requests = List.of(
                new PricingPackageRequest(1, "MONTHS", null, "Standard 1 Month", true),
                new PricingPackageRequest(3, "MONTHS", new BigDecimal("85000.00"), "10% off", false)
        );
        List<BillboardPricingPackage> pkgs = pricingPackageService.validateAndBuildPackages(
                requests, listing, startPrice, 1, BookingDurationUnit.MONTHS
        );
        listing.mergePricingPackages(pkgs);
        return billboardListingRepository.save(listing);
    }

    @Test
    @DisplayName("Create listing via POST /api/owner/listings persists pricing packages and auto-calculates base rate")
    void testCreateListingWithPricingPackages() throws Exception {
        String createJson = """
                {
                  "name":"Marine Drive Billboard",
                  "addressLine1":"Marine Drive","addressLine2":null,"landmark":null,
                  "city":"Mumbai","state":"Maharashtra","pincode":"400020",
                  "type":"LED Digital","widthFt":50,"heightFt":25,"groundHeightFt":12,
                  "facing":"West","trafficType":"City / Urban","audienceType":"Commuters",
                  "footfall":"100000","startPrice":1500,"minBookingValue":1,"minBookingUnit":"MONTHS",
                  "discountNote":"Special deal",
                  "pricingPackages":[
                    {"durationValue":1,"durationUnit":"MONTHS","rate":null,"note":"Base monthly","isBase":true},
                    {"durationValue":6,"durationUnit":"MONTHS","rate":250000.00,"note":"Half-yearly special","isBase":false}
                  ]
                }""";

        MvcResult result = mockMvc.perform(post("/api/owner/listings")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pricingPackages").isArray())
                .andExpect(jsonPath("$.pricingPackages.length()").value(2))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode pkgs = root.get("pricingPackages");

        // Base package rate = startPrice (1500) * days (30) = 45000
        assertThat(pkgs.get(0).get("isBase").asBoolean()).isTrue();
        assertThat(pkgs.get(0).get("durationDays").asInt()).isEqualTo(30);
        assertThat(pkgs.get(0).get("rate").asDouble()).isEqualTo(45000.00);

        assertThat(pkgs.get(1).get("isBase").asBoolean()).isFalse();
        assertThat(pkgs.get(1).get("durationDays").asInt()).isEqualTo(180);
        assertThat(pkgs.get(1).get("rate").asDouble()).isEqualTo(250000.00);
    }

    @Test
    @DisplayName("Swapping base package in single PATCH request (A.isBase=false, B.isBase=true) succeeds")
    void testSwapBasePackageInPatchRequest() throws Exception {
        BillboardListing listing = createListingWithPackages("Base Swap Board", new BigDecimal("1000.00"));
        Long id = listing.getId();

        // Swap base from 1 month to 3 months
        String patchJson = """
                {
                  "pricingPackages":[
                    {"durationValue":1,"durationUnit":"MONTHS","rate":32000.00,"note":"No longer base","isBase":false},
                    {"durationValue":3,"durationUnit":"MONTHS","rate":null,"note":"Now base tier","isBase":true}
                  ]
                }""";

        mockMvc.perform(patch("/api/owner/listings/" + id)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(patchJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pricingPackages[0].isBase").value(false))
                .andExpect(jsonPath("$.pricingPackages[0].rate").value(32000.00))
                .andExpect(jsonPath("$.pricingPackages[1].isBase").value(true))
                .andExpect(jsonPath("$.pricingPackages[1].rate").value(90000.00)); // 1000 * 90 days = 90000
    }

    @Test
    @DisplayName("Update with new startPrice and base rate: null resolves rate using request startPrice")
    void testUpdateStartPriceWithBaseRateNullUsesNewStartPrice() throws Exception {
        BillboardListing listing = createListingWithPackages("StartPrice Recalc Board", new BigDecimal("1000.00"));
        Long id = listing.getId();

        // Change startPrice from 1000 to 2500, with base rate null -> should become 2500 * 30 = 75000
        String patchJson = """
                {
                  "startPrice":2500.00,
                  "pricingPackages":[
                    {"durationValue":1,"durationUnit":"MONTHS","rate":null,"note":"Recalculated base","isBase":true}
                  ]
                }""";

        mockMvc.perform(patch("/api/owner/listings/" + id)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(patchJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.startPrice").value(2500.00))
                .andExpect(jsonPath("$.pricingPackages[0].rate").value(75000.00));
    }

    @Test
    @DisplayName("Update with pricingPackages: null preserves existing packages")
    void testUpdateWithPricingPackagesNullPreservesExisting() throws Exception {
        BillboardListing listing = createListingWithPackages("Preserve Packages Board", new BigDecimal("1000.00"));
        Long id = listing.getId();

        String patchJson = """
                {
                  "name":"Updated Name Only"
                }""";

        mockMvc.perform(patch("/api/owner/listings/" + id)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(patchJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name Only"))
                .andExpect(jsonPath("$.pricingPackages.length()").value(2));
    }

    @Test
    @DisplayName("Update with empty array pricingPackages: [] returns 400 Bad Request")
    void testUpdateWithEmptyPricingPackagesArrayReturns400() throws Exception {
        BillboardListing listing = createListingWithPackages("Empty Packages Board", new BigDecimal("1000.00"));
        Long id = listing.getId();

        String patchJson = """
                {
                  "pricingPackages":[]
                }""";

        mockMvc.perform(patch("/api/owner/listings/" + id)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(patchJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("GET /api/owner/listings returns all listings with pricingPackages populated without lazy loading errors")
    void testGetListingsPopulatesPricingPackages() throws Exception {
        createListingWithPackages("Listing 1", new BigDecimal("1000.00"));
        createListingWithPackages("Listing 2", new BigDecimal("2000.00"));

        mockMvc.perform(get("/api/owner/listings")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].pricingPackages").isArray())
                .andExpect(jsonPath("$[1].pricingPackages").isArray());
    }
}

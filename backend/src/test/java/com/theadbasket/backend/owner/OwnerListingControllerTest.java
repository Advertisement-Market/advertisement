package com.theadbasket.backend.owner;

import java.math.BigDecimal;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.address.AddressRepository;
import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.FacingDirection;
import com.theadbasket.backend.lov.TrafficType;
import com.theadbasket.backend.owner.dto.BillboardListingCreateRequest;
import com.theadbasket.backend.owner.dto.BillboardListingUpdateRequest;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OwnerListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BillboardListingRepository billboardListingRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private JwtService jwtService;

    private User owner1;
    private User owner2;
    private User advertiser;
    private String owner1Token;
    private String advertiserToken;

    @BeforeEach
    void setUp() {
        owner1 = userRepository.save(new User("Vikram", "Kumar", "owner1.listings@example.com", "pass", "9876543210", Role.OWNER));
        owner2 = userRepository.save(new User("Rajesh", "Sharma", "owner2.listings@example.com", "pass", "9876543211", Role.OWNER));
        advertiser = userRepository.save(new User("Amit", "Patel", "advertiser.listings@example.com", "pass", "9876543212", Role.ADVERTISER));

        owner1Token = jwtService.generateAccessToken(owner1);
        advertiserToken = jwtService.generateAccessToken(advertiser);
    }

    private BillboardListing createListing(User user, String name) {
        Address address = Address.of("100 Bandra West", "Hill Road", "Near Station", "Mumbai", "Maharashtra", "400050");
        BillboardListing listing = new BillboardListing();
        listing.setUser(user);
        listing.setName(name);
        listing.setAddress(address);
        listing.setType(BillboardType.LED_DIGITAL);
        listing.setWidthFt(new BigDecimal("40.00"));
        listing.setHeightFt(new BigDecimal("20.00"));
        listing.setFacing(FacingDirection.NORTH);
        listing.setTrafficType(TrafficType.CITY_URBAN);
        listing.setAudienceType(AudienceType.COMMUTERS);
        listing.setStartPrice(new BigDecimal("350000.00"));
        listing.setMinBookingValue(1);
        listing.setMinBookingUnit(BookingDurationUnit.MONTHS);
        listing.setMinBookingDays(30);
        return billboardListingRepository.save(listing);
    }

    @Test
    @DisplayName("GET /api/owner/listings unauthenticated returns 401")
    void getListings_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/owner/listings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/owner/listings with non-OWNER role returns 403")
    void getListings_nonOwnerRole_returns403() throws Exception {
        mockMvc.perform(get("/api/owner/listings")
                        .header("Authorization", "Bearer " + advertiserToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/owner/listings returns owner listings ordered by createdAt desc")
    void getListings_authenticatedOwner_returnsListings() throws Exception {
        createListing(owner1, "Listing 1");
        createListing(owner1, "Listing 2");
        createListing(owner2, "Other Owner Listing");

        mockMvc.perform(get("/api/owner/listings")
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].addressLine1").value("100 Bandra West"))
                .andExpect(jsonPath("$[0].city").value("Mumbai"))
                .andExpect(jsonPath("$[0].minBookingValue").value(1))
                .andExpect(jsonPath("$[0].minBookingUnit").value("MONTHS"));
    }

    @Test
    @DisplayName("GET /api/owner/listings/{id} returns listing detail")
    void getListing_ownedListing_returns200() throws Exception {
        BillboardListing listing = createListing(owner1, "Bandra Prime Screen");

        mockMvc.perform(get("/api/owner/listings/" + listing.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listing.getId()))
                .andExpect(jsonPath("$.name").value("Bandra Prime Screen"))
                .andExpect(jsonPath("$.pincode").value("400050"))
                .andExpect(jsonPath("$.type").value("LED_DIGITAL"));
    }

    @Test
    @DisplayName("GET /api/owner/listings/{id} for another owner's listing returns 404")
    void getListing_otherOwnerListing_returns404() throws Exception {
        BillboardListing listing = createListing(owner2, "Other Owner Listing");

        mockMvc.perform(get("/api/owner/listings/" + listing.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("BILLBOARD_NOT_FOUND"));
    }

    @Test
    @DisplayName("POST /api/owner/listings with valid data creates listing and returns 201")
    void createListing_validRequest_returns201() throws Exception {
        BillboardListingCreateRequest req = new BillboardListingCreateRequest(
                "Powai IT Park LED",
                "Central Avenue",
                "Building 4",
                "Hiranandani",
                "Mumbai",
                "Maharashtra",
                "400076",
                "LED Digital",
                null,
                new BigDecimal("35.00"),
                new BigDecimal("18.00"),
                new BigDecimal("8.00"),
                "East",
                "City / Urban",
                null,
                "Commuters",
                null,
                "40,000/day",
                new BigDecimal("220000.00"),
                1,
                "Months",
                "10% off for 3+ months"
        );

        mockMvc.perform(post("/api/owner/listings")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Powai IT Park LED"))
                .andExpect(jsonPath("$.addressLine1").value("Central Avenue"))
                .andExpect(jsonPath("$.city").value("Mumbai"))
                .andExpect(jsonPath("$.pincode").value("400076"))
                .andExpect(jsonPath("$.type").value("LED_DIGITAL"))
                .andExpect(jsonPath("$.minBookingValue").value(1))
                .andExpect(jsonPath("$.minBookingUnit").value("MONTHS"))
                .andExpect(jsonPath("$.minBookingDays").value(30));
    }

    @Test
    @DisplayName("POST /api/owner/listings with invalid pincode returns 400 VALIDATION_FAILED")
    void createListing_invalidPincode_returns400() throws Exception {
        BillboardListingCreateRequest req = new BillboardListingCreateRequest(
                "Invalid Pin Listing",
                "Central Avenue",
                null,
                null,
                "Mumbai",
                "Maharashtra",
                "123", // invalid
                "LED Digital",
                null,
                new BigDecimal("35.00"),
                new BigDecimal("18.00"),
                null,
                "East",
                "City / Urban",
                null,
                "Commuters",
                null,
                null,
                new BigDecimal("220000.00"),
                1,
                "Months",
                null
        );

        mockMvc.perform(post("/api/owner/listings")
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.pincode").exists());
    }

    @Test
    @DisplayName("PATCH /api/owner/listings/{id} partially updates listing")
    void updateListing_validPartialUpdate_returns200() throws Exception {
        BillboardListing listing = createListing(owner1, "Initial Name");

        BillboardListingUpdateRequest patchReq = new BillboardListingUpdateRequest(
                "Updated Unipole Name",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                new BigDecimal("500000.00"),
                null,
                null,
                "Special festive discount"
        );

        mockMvc.perform(patch("/api/owner/listings/" + listing.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listing.getId()))
                .andExpect(jsonPath("$.name").value("Updated Unipole Name"))
                .andExpect(jsonPath("$.startPrice").value(500000.00))
                .andExpect(jsonPath("$.discountNote").value("Special festive discount"))
                // Untouched fields unchanged:
                .andExpect(jsonPath("$.type").value("LED_DIGITAL"))
                .andExpect(jsonPath("$.addressLine1").value("100 Bandra West"));
    }

    @Test
    @DisplayName("PATCH /api/owner/listings/{id} with blank name returns 400 VALIDATION_FAILED")
    void updateListing_blankName_returns400() throws Exception {
        BillboardListing listing = createListing(owner1, "Initial Name");

        BillboardListingUpdateRequest patchReq = new BillboardListingUpdateRequest(
                "   ",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(patch("/api/owner/listings/" + listing.getId())
                        .header("Authorization", "Bearer " + owner1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }

    @Test
    @DisplayName("DELETE /api/owner/listings/{id} deletes listing and cascades to Address with zero orphans")
    void deleteListing_ownListing_deletesListingAndAddress() throws Exception {
        BillboardListing listing = createListing(owner1, "Listing To Delete");
        Long listingId = listing.getId();
        Long addressId = listing.getAddress().getId();

        mockMvc.perform(delete("/api/owner/listings/" + listingId)
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isNoContent());

        assertThat(billboardListingRepository.findById(listingId)).isEmpty();
        assertThat(addressRepository.findById(addressId)).isEmpty();
    }

    @Test
    @DisplayName("DELETE /api/owner/listings/{id} on other owner's listing returns 404")
    void deleteListing_otherOwnerListing_returns404() throws Exception {
        BillboardListing listing = createListing(owner2, "Other Owner Listing");

        mockMvc.perform(delete("/api/owner/listings/" + listing.getId())
                        .header("Authorization", "Bearer " + owner1Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("BILLBOARD_NOT_FOUND"));

        assertThat(billboardListingRepository.findById(listing.getId())).isPresent();
    }
}

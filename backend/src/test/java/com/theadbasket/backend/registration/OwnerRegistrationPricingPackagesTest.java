package com.theadbasket.backend.registration;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.theadbasket.backend.common.address.AddressRepository;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.owner.BillboardListing;
import com.theadbasket.backend.owner.BillboardListingRepository;
import com.theadbasket.backend.owner.BillboardPricingPackage;
import com.theadbasket.backend.owner.OwnerProfileRepository;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OwnerRegistrationPricingPackagesTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BillboardListingRepository billboardListingRepository;

    @Autowired
    private OwnerProfileRepository ownerProfileRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        billboardListingRepository.deleteAll();
        ownerProfileRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String createOwnerPayload(String email, String pricingPackagesJson) {
        String pkgsField = pricingPackagesJson != null ? ",\"pricingPackages\":" + pricingPackagesJson : "";
        return """
                {
                  "firstName":"Aarav","lastName":"Shah","accountEmail":"%s","phone":"+91 98222 11111",
                  "password":"Passw0rd!","companyName":"Shah Media","companyPhone":"","companyRegNumber":"",
                  "gstNumber":"","addressLine1":"10 Ashram Road","addressLine2":"","landmark":"","city":"Ahmedabad",
                  "state":"Gujarat","pincode":"380009",
                  "tradeLicenseNo":"","ownershipType":"Owned","regulatoryApprovals":"",
                  "billboard":{
                    "name":"SG Highway Unipole","addressLine1":"SG Road","addressLine2":"","landmark":"",
                    "city":"Ahmedabad","state":"Gujarat","pincode":"380015",
                    "type":"Unipole","widthFt":40,"heightFt":20,"groundHeightFt":10,"facing":"North",
                    "trafficType":"City / Urban","audienceType":"Commuters","footfall":"60000","startPrice":1000,
                    "minBookingValue":1,"minBookingUnit":"MONTHS","discountNote":""%s
                  },
                  "acceptedTerms":true
                }""".formatted(email, pkgsField);
    }

    @Test
    @DisplayName("Owner registration persists custom pricing packages to database")
    void testRegisterOwnerWithCustomPricingPackages() throws Exception {
        String pkgsJson = """
                [
                  {"durationValue":1,"durationUnit":"MONTHS","rate":null,"note":"Base monthly","isBase":true},
                  {"durationValue":3,"durationUnit":"MONTHS","rate":85000.00,"note":"10% discount","isBase":false},
                  {"durationValue":1,"durationUnit":"YEARS","rate":320000.00,"note":"Annual discount","isBase":false}
                ]""";

        mockMvc.perform(post("/api/auth/register/owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createOwnerPayload("custom.pkg@example.com", pkgsJson)))
                .andExpect(status().isCreated());

        transactionTemplate.executeWithoutResult(txStatus -> {
            User user = userRepository.findByEmailIgnoreCase("custom.pkg@example.com")
                    .orElseThrow(() -> new IllegalStateException("User not found"));
            List<BillboardListing> listings = billboardListingRepository.findByUserId(user.getId());
            assertThat(listings).hasSize(1);
            BillboardListing listing = listings.get(0);

            List<BillboardPricingPackage> savedPackages = listing.getPricingPackages();
            assertThat(savedPackages).hasSize(3);

            // Tier 1: Base package auto-calculated rate (1000 * 30 days = 30000)
            BillboardPricingPackage base = savedPackages.get(0);
            assertThat(base.isBase()).isTrue();
            assertThat(base.getDurationValue()).isEqualTo(1);
            assertThat(base.getDurationUnit()).isEqualTo(BookingDurationUnit.MONTHS);
            assertThat(base.getDurationDays()).isEqualTo(30);
            assertThat(base.getRate()).isEqualByComparingTo(new BigDecimal("30000.00"));
            assertThat(base.getNote()).isEqualTo("Base monthly");

            // Tier 2: 3 Months
            BillboardPricingPackage tier2 = savedPackages.get(1);
            assertThat(tier2.isBase()).isFalse();
            assertThat(tier2.getDurationDays()).isEqualTo(90);
            assertThat(tier2.getRate()).isEqualByComparingTo(new BigDecimal("85000.00"));

            // Tier 3: 1 Years
            BillboardPricingPackage tier3 = savedPackages.get(2);
            assertThat(tier3.isBase()).isFalse();
            assertThat(tier3.getDurationDays()).isEqualTo(365);
            assertThat(tier3.getRate()).isEqualByComparingTo(new BigDecimal("320000.00"));
        });
    }

    @Test
    @DisplayName("Owner registration synthesizes default base package when pricingPackages is omitted")
    void testRegisterOwnerWithOmittedPricingPackages() throws Exception {
        mockMvc.perform(post("/api/auth/register/owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createOwnerPayload("omitted.pkg@example.com", null)))
                .andExpect(status().isCreated());

        transactionTemplate.executeWithoutResult(txStatus -> {
            User user = userRepository.findByEmailIgnoreCase("omitted.pkg@example.com")
                    .orElseThrow(() -> new IllegalStateException("User not found"));
            List<BillboardListing> listings = billboardListingRepository.findByUserId(user.getId());
            assertThat(listings).hasSize(1);
            BillboardListing listing = listings.get(0);

            assertThat(listing.getPricingPackages()).hasSize(1);
            BillboardPricingPackage pkg = listing.getPricingPackages().get(0);
            assertThat(pkg.isBase()).isTrue();
            assertThat(pkg.getDurationDays()).isEqualTo(30);
            assertThat(pkg.getRate()).isEqualByComparingTo(new BigDecimal("30000.00"));
        });
    }

    @Test
    @DisplayName("Owner registration rejects duplicate normalized duration days (e.g. 7 DAYS and 1 WEEKS)")
    void testRegisterOwnerRejectsDuplicateDurations() throws Exception {
        String pkgsJson = """
                [
                  {"durationValue":7,"durationUnit":"DAYS","rate":7000.00,"note":"Base 7 days","isBase":true},
                  {"durationValue":1,"durationUnit":"WEEKS","rate":6500.00,"note":"1 week special","isBase":false}
                ]""";

        mockMvc.perform(post("/api/auth/register/owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createOwnerPayload("duplicate.pkg@example.com", pkgsJson)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("Owner registration rejects request without exactly one base package")
    void testRegisterOwnerRejectsZeroOrMultipleBases() throws Exception {
        // Zero base packages
        String zeroBaseJson = """
                [
                  {"durationValue":1,"durationUnit":"MONTHS","rate":30000.00,"note":"No base","isBase":false}
                ]""";
        mockMvc.perform(post("/api/auth/register/owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createOwnerPayload("nobase.pkg@example.com", zeroBaseJson)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));

        // Multiple base packages
        String multipleBaseJson = """
                [
                  {"durationValue":1,"durationUnit":"MONTHS","rate":30000.00,"note":"Base 1","isBase":true},
                  {"durationValue":3,"durationUnit":"MONTHS","rate":85000.00,"note":"Base 2","isBase":true}
                ]""";
        mockMvc.perform(post("/api/auth/register/owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createOwnerPayload("multibase.pkg@example.com", multipleBaseJson)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    @DisplayName("Owner registration rejects minBookingValue exceeding per-unit cap")
    void testRegisterOwnerRejectsExceededUnitCap() throws Exception {
        String badUnitPayload = """
                {
                  "firstName":"Aarav","lastName":"Shah","accountEmail":"overcap@example.com","phone":"+91 98222 11111",
                  "password":"Passw0rd!","companyName":"Shah Media","companyPhone":"","companyRegNumber":"",
                  "gstNumber":"","addressLine1":"10 Ashram Road","addressLine2":"","landmark":"","city":"Ahmedabad",
                  "state":"Gujarat","pincode":"380009",
                  "tradeLicenseNo":"","ownershipType":"Owned","regulatoryApprovals":"",
                  "billboard":{
                    "name":"Over Cap Board","addressLine1":"SG Road","addressLine2":"","landmark":"",
                    "city":"Ahmedabad","state":"Gujarat","pincode":"380015",
                    "type":"Unipole","widthFt":40,"heightFt":20,"groundHeightFt":10,"facing":"North",
                    "trafficType":"City / Urban","audienceType":"Commuters","footfall":"60000","startPrice":1000,
                    "minBookingValue":1001,"minBookingUnit":"WEEKS","discountNote":""
                  },
                  "acceptedTerms":true
                }""";

        mockMvc.perform(post("/api/auth/register/owner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badUnitPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors['billboard.minBookingValue']").exists());
    }

    @AfterEach
    @SuppressWarnings("unused")
    void tearDown() {
        billboardListingRepository.deleteAll();
        ownerProfileRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();
    }
}

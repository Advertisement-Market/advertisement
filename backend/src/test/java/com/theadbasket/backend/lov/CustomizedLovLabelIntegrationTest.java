package com.theadbasket.backend.lov;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.owner.BillboardListing;
import com.theadbasket.backend.owner.BillboardListingRepository;

/**
 * Isolated integration tests verifying that when a LOV label is customized in config
 * (e.g. {@code lov.audienceType.OTHER=Other (please specify)}), both {@code RequiredOtherTextValidator}
 * and the service layer resolve the label consistently via {@link LovService#parse}.
 *
 * <p>Uses {@link TestPropertySource} to override {@code spring.messages.basename} in this test context
 * only, avoiding any fixture leakage into the global test profile.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "spring.messages.basename=messages-custom,messages")
@Transactional
class CustomizedLovLabelIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BillboardListingRepository billboardListings;

    private static String ownerPayload(String audienceType, String audienceTypeOther) {
        return """
                {
                  "firstName":"Vikram","lastName":"Kumar","accountEmail":"custom-lov-owner@example.com",
                  "phone":"+91 97654 32109","password":"Passw0rd!","companyName":"Kumar Billboards",
                  "companyPhone":"","companyRegNumber":"","gstNumber":"","addressLine1":"5 CG Road",
                  "addressLine2":"","landmark":"","city":"Ahmedabad","state":"Gujarat","pincode":"380001",
                  "tradeLicenseNo":"","ownershipType":"Owned","regulatoryApprovals":"",
                  "billboard":{"name":"BKC LED Screen","addressLine1":"BKC","addressLine2":"","landmark":"",
                    "city":"Mumbai","state":"Maharashtra","pincode":"400051",
                    "type":"LED Digital","widthFt":40,"heightFt":25,"groundHeightFt":15,"facing":"North",
                    "trafficType":"City / Urban","audienceType":"%s","audienceTypeOther":"%s",
                    "footfall":"150000","startPrice":580000,"minBookingValue":3,"minBookingUnit":"MONTHS","discountNote":""},
                  "acceptedTerms":true
                }""".formatted(audienceType, audienceTypeOther);
    }

    @Test
    void ownerRegistration_rejectsCustomizedOtherLabelWithoutCompanionText() throws Exception {
        mockMvc.perform(post("/api/auth/register/owner")
                .contentType(MediaType.APPLICATION_JSON)
                .content(ownerPayload("Other (please specify)", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors['billboard.audienceTypeOther']").exists());
        assertThat(billboardListings.count()).isZero();
    }

    @Test
    void ownerRegistration_acceptsCustomizedOtherLabelWithCompanionText() throws Exception {
        mockMvc.perform(post("/api/auth/register/owner")
                .contentType(MediaType.APPLICATION_JSON)
                .content(ownerPayload("Other (please specify)", "Airport VIP Lounges")))
                .andExpect(status().isCreated());

        BillboardListing listing = billboardListings.findAll().get(0);
        assertThat(listing.getAudienceType()).isEqualTo(AudienceType.OTHER);
        assertThat(listing.getAudienceTypeOther()).isEqualTo("Airport VIP Lounges");
    }

    @Test
    void ownerRegistration_rejectsUnknownAudienceValue_with400_neverSlippingThrough() throws Exception {
        // When a value matches neither code nor current custom label, the validator returns true
        // (deferring), and LovService in the service layer rejects it with INVALID_AUDIENCE_TYPE.
        mockMvc.perform(post("/api/auth/register/owner")
                .contentType(MediaType.APPLICATION_JSON)
                .content(ownerPayload("NonExistentAudience", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_AUDIENCE_TYPE"));
        assertThat(billboardListings.count()).isZero();
    }

    @Test
    void ownerRegistration_stillAcceptsCodeOTHER_withCustomizedLabel() throws Exception {
        mockMvc.perform(post("/api/auth/register/owner")
                .contentType(MediaType.APPLICATION_JSON)
                .content(ownerPayload("OTHER", "Executive Transit")))
                .andExpect(status().isCreated());

        BillboardListing listing = billboardListings.findAll().get(0);
        assertThat(listing.getAudienceType()).isEqualTo(AudienceType.OTHER);
        assertThat(listing.getAudienceTypeOther()).isEqualTo("Executive Transit");
    }
}

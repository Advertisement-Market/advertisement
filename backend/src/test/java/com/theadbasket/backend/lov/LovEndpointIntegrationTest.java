package com.theadbasket.backend.lov;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.owner.BillboardListing;
import com.theadbasket.backend.owner.BillboardListingRepository;

/**
 * End-to-end coverage for the config-driven billboard LOVs: the public lookup endpoint, strict
 * validation on registration, and the OTHER + companion-text path.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LovEndpointIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private BillboardListingRepository billboardListings;

    private static String ownerPayload(String audienceType, String audienceTypeOther) {
        return """
                {
                  "firstName":"Vikram","lastName":"Kumar","accountEmail":"lov-owner@example.com",
                  "phone":"+91 97654 32109","password":"Passw0rd!","companyName":"Kumar Billboards",
                  "companyPhone":"","companyRegNumber":"","gstNumber":"","addressLine1":"5 CG Road",
                  "addressLine2":"","landmark":"","city":"Ahmedabad","state":"Gujarat","pincode":"380001",
                  "tradeLicenseNo":"","ownershipType":"Owned","regulatoryApprovals":"",
                  "billboard":{"name":"BKC LED Screen","addressLine1":"BKC","addressLine2":"","landmark":"",
                    "city":"Mumbai","state":"Maharashtra","pincode":"400051",
                    "type":"LED Digital","widthFt":40,"heightFt":25,"groundHeightFt":15,"facing":"North",
                    "trafficType":"City / Urban","audienceType":"%s","audienceTypeOther":"%s",
                    "footfall":"150000","startPrice":580000,"minBooking":"3 Months","discountNote":""},
                  "acceptedTerms":true
                }""".formatted(audienceType, audienceTypeOther);
    }

    @Test
    void billboardTypesEndpoint_isPublic_andReturnsCodeLabelPairs() throws Exception {
        mockMvc.perform(get("/api/lov/billboard-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("STATIC_HOARDING"))
                .andExpect(jsonPath("$[0].label").value("Static Hoarding"));
    }

    @Test
    void ownerRegistration_rejectsUnknownAudienceType() throws Exception {
        mockMvc.perform(post("/api/auth/register/owner")
                .contentType(MediaType.APPLICATION_JSON).content(ownerPayload("Corporate", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_AUDIENCE_TYPE"));
        assertThat(billboardListings.count()).isZero();
    }

    @Test
    void ownerRegistration_storesFreeTextForOther() throws Exception {
        mockMvc.perform(post("/api/auth/register/owner")
                .contentType(MediaType.APPLICATION_JSON).content(ownerPayload("OTHER", "Airport lounges")))
                .andExpect(status().isCreated());

        BillboardListing listing = billboardListings.findAll().get(0);
        assertThat(listing.getAudienceType()).isEqualTo(AudienceType.OTHER);
        assertThat(listing.getAudienceTypeOther()).isEqualTo("Airport lounges");
        // Non-OTHER selections must not persist stray free text.
        assertThat(listing.getTrafficType()).isEqualTo(TrafficType.CITY_URBAN);
        assertThat(listing.getTrafficTypeOther()).isNull();
    }
}

package com.theadbasket.backend.registration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.theadbasket.backend.advertiser.AdvertiserProfileRepository;
import com.theadbasket.backend.advertiser.CampaignBriefRepository;
import com.theadbasket.backend.agency.AgencyProfileRepository;
import com.theadbasket.backend.owner.BillboardListingRepository;
import com.theadbasket.backend.owner.OwnerProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** End-to-end role registration (advertiser/owner/agency) against the full stack on H2. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RegistrationFlowIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private AdvertiserProfileRepository advertiserProfiles;
    @Autowired private CampaignBriefRepository campaignBriefs;
    @Autowired private OwnerProfileRepository ownerProfiles;
    @Autowired private BillboardListingRepository billboardListings;
    @Autowired private AgencyProfileRepository agencyProfiles;

    private static final String ADVERTISER = """
            {
              "loginEmail":"adv@example.com","password":"Passw0rd!",
              "companyName":"Nimbus Foods","businessType":"FMCG","website":"https://nimbus.in",
              "gstNumber":"","panNumber":"","industries":["FMCG","Retail & Fashion"],
              "contactName":"Rohan Kapoor","contactDesignation":"Marketing Head",
              "contactEmail":"rohan@nimbus.in","contactPhone":"+91 98765 43210",
              "officeAddress":"12 MG Road, Mumbai","pincode":"400001",
              "project":{"title":"Summer Launch","description":"Nationwide summer campaign",
                "targetAudience":"Youth 18-30","targetLocation":"Mumbai & Pune","startDate":"2026-08-01",
                "duration":"3 months","budgetMinValue":500000,"budgetMinUnit":"Lakh","budgetMaxValue":1200000,
                "budgetMaxUnit":"Lakh","flexibleBudget":true,"quotationsRequired":"3-5",
                "agencyPreferences":["Verified only","OOH Specialist"]},
              "acceptedTerms":true
            }""";

    private static final String OWNER = """
            {
              "firstName":"Vikram","lastName":"Kumar","email":"owner@example.com","phone":"+91 97654 32109",
              "password":"Passw0rd!","companyName":"Kumar Billboards","companyPhone":"","companyRegNumber":"",
              "gstNumber":"","businessAddressLine1":"5 CG Road","businessAddressLine2":"","businessPincode":"380001",
              "tradeLicenseNo":"","ownershipType":"Owned","regulatoryApprovals":"",
              "billboard":{"name":"BKC LED Screen","pincode":"400051","address":"BKC, Mumbai","landmark":"",
                "type":"LED Digital","widthFt":40,"heightFt":25,"groundHeightFt":15,"facing":"North",
                "trafficType":"City / Urban","audienceType":"Corporate","footfall":"150000","startPrice":580000,
                "minBooking":"3 Months","discountNote":""},
              "acceptedTerms":true
            }""";

    private static final String AGENCY = """
            {
              "loginEmail":"agency@example.com","password":"Passw0rd!","agencyName":"Pixel & Print",
              "agencyType":"Full-Service Ad Agency","yearEstablished":2014,"yearsExperience":"10+ years",
              "tagline":"Bold ideas","about":"Full-service OOH agency","website":"https://pp.in","landline":"",
              "linkedinUrl":"","headquartersPincode":"400059","officeAddress":"Andheri East, Mumbai",
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
                .andExpect(jsonPath("$.user.role").value("OWNER"))
                .andExpect(jsonPath("$.user.email").value("owner@example.com"));
        assertThat(ownerProfiles.count()).isEqualTo(1);
        assertThat(billboardListings.count()).isEqualTo(1);
    }

    @Test
    void agencyRegistration_createsAccount_andProfile() throws Exception {
        mockMvc.perform(post("/api/auth/register/agency")
                        .contentType(MediaType.APPLICATION_JSON).content(AGENCY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("AGENCY"))
                .andExpect(jsonPath("$.user.email").value("agency@example.com"));
        assertThat(agencyProfiles.count()).isEqualTo(1);
    }

    @Test
    void advertiserRegistration_missingRequiredFields_returns400() throws Exception {
        String bad = """
                {"loginEmail":"x@example.com","password":"Passw0rd!","companyName":"","businessType":"",
                 "industries":[],"contactName":"","contactDesignation":"","contactEmail":"nope",
                 "contactPhone":"123","officeAddress":"","pincode":"12","acceptedTerms":false}""";
        mockMvc.perform(post("/api/auth/register/advertiser")
                        .contentType(MediaType.APPLICATION_JSON).content(bad))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isNotEmpty());
    }
}

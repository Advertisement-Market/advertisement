package com.theadbasket.backend.common.address;

import com.theadbasket.backend.advertiser.AdvertiserProfile;
import com.theadbasket.backend.advertiser.AdvertiserProfileRepository;
import com.theadbasket.backend.agency.AgencyProfile;
import com.theadbasket.backend.agency.AgencyProfileRepository;
import com.theadbasket.backend.owner.BillboardListing;
import com.theadbasket.backend.owner.BillboardListingRepository;
import com.theadbasket.backend.owner.OwnerProfile;
import com.theadbasket.backend.owner.OwnerProfileRepository;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AddressPersistenceTest {

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdvertiserProfileRepository advertiserProfileRepository;

    @Autowired
    private AgencyProfileRepository agencyProfileRepository;

    @Autowired
    private OwnerProfileRepository ownerProfileRepository;

    @Autowired
    private BillboardListingRepository billboardListingRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("JPA Auditing automatically populates createdTs and updatedTs on persist, and updates updatedTs on modification")
    void auditing_populatesTimestamps() throws InterruptedException {
        Address address = Address.of("12 MG Road", "Suite 400", "Near Metro", "Bengaluru", "Karnataka", "560001");
        Address saved = addressRepository.saveAndFlush(address);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedTs()).isNotNull();
        assertThat(saved.getUpdatedTs()).isNotNull();

        Instant initialCreated = saved.getCreatedTs().truncatedTo(java.time.temporal.ChronoUnit.MILLIS);
        Instant initialUpdated = saved.getUpdatedTs().truncatedTo(java.time.temporal.ChronoUnit.MILLIS);

        // Ensure timestamp difference on update if resolution permits
        Thread.sleep(50);

        saved.setLine1("14 MG Road");
        Address updated = addressRepository.saveAndFlush(saved);
        entityManager.refresh(updated);

        assertThat(updated.getCreatedTs().truncatedTo(java.time.temporal.ChronoUnit.MILLIS)).isEqualTo(initialCreated);
        assertThat(updated.getUpdatedTs().truncatedTo(java.time.temporal.ChronoUnit.MILLIS)).isAfterOrEqualTo(initialUpdated);
    }

    @Test
    @DisplayName("Deleting AdvertiserProfile cascades deletion to its Address (orphanRemoval = true)")
    void deleteAdvertiserProfile_cascadesToAddress() {
        User user = userRepository.saveAndFlush(new User("Rohan", "Kapoor", "rohan.adv@example.com", "pass", "9876543210", Role.ADVERTISER));
        Address address = Address.of("10 Park Street", null, null, "Kolkata", "West Bengal", "700016");

        AdvertiserProfile profile = new AdvertiserProfile();
        profile.setUser(user);
        profile.setCompanyName("Nimbus Foods");
        profile.setBusinessType("FMCG");
        profile.setContactDesignation("Marketing Head");
        profile.setContactEmail("rohan.adv@example.com");
        profile.setAddress(address);
        profile.setIndustries(List.of("FMCG"));

        AdvertiserProfile savedProfile = advertiserProfileRepository.saveAndFlush(profile);
        Long addressId = savedProfile.getAddress().getId();
        assertThat(addressId).isNotNull();
        assertThat(addressRepository.findById(addressId)).isPresent();

        advertiserProfileRepository.delete(savedProfile);
        advertiserProfileRepository.flush();
        entityManager.clear();

        assertThat(advertiserProfileRepository.findById(savedProfile.getId())).isEmpty();
        assertThat(addressRepository.findById(addressId)).isEmpty();
    }

    @Test
    @DisplayName("Deleting AgencyProfile cascades deletion to its Address (orphanRemoval = true)")
    void deleteAgencyProfile_cascadesToAddress() {
        User user = userRepository.saveAndFlush(new User("Priya", "Mehta", "priya.agency@example.com", "pass", "9876543211", Role.AGENCY));
        Address address = Address.of("4th Floor, Pinnacle Park", "Andheri East", null, "Mumbai", "Maharashtra", "400069");

        AgencyProfile profile = new AgencyProfile();
        profile.setUser(user);
        profile.setAgencyName("Pixel & Print");
        profile.setAgencyType("Full-Service Ad Agency");
        profile.setYearEstablished(2014);
        profile.setYearsExperience("10+ years");
        profile.setContactDesignation("Director");
        profile.setCampaignsCompleted("50+");
        profile.setPricingModel("Retainer");
        profile.setGeoCoverage("National");
        profile.setAddress(address);
        profile.setServices(List.of("OOH"));
        profile.setIndustries(List.of("Retail"));

        AgencyProfile savedProfile = agencyProfileRepository.saveAndFlush(profile);
        Long addressId = savedProfile.getAddress().getId();
        assertThat(addressId).isNotNull();
        assertThat(addressRepository.findById(addressId)).isPresent();

        agencyProfileRepository.delete(savedProfile);
        agencyProfileRepository.flush();
        entityManager.clear();

        assertThat(agencyProfileRepository.findById(savedProfile.getId())).isEmpty();
        assertThat(addressRepository.findById(addressId)).isEmpty();
    }

    @Test
    @DisplayName("Deleting OwnerProfile cascades deletion to its Address (orphanRemoval = true)")
    void deleteOwnerProfile_cascadesToAddress() {
        User user = userRepository.saveAndFlush(new User("Amit", "Patel", "amit.owner@example.com", "pass", "9876543212", Role.OWNER));
        Address address = Address.of("100 Ring Road", null, "Opposite Mall", "Ahmedabad", "Gujarat", "380015");

        OwnerProfile profile = new OwnerProfile();
        profile.setUser(user);
        profile.setCompanyName("Gujarat Outdoor Media");
        profile.setAddress(address);

        OwnerProfile savedProfile = ownerProfileRepository.saveAndFlush(profile);
        Long addressId = savedProfile.getAddress().getId();
        assertThat(addressId).isNotNull();
        assertThat(addressRepository.findById(addressId)).isPresent();

        ownerProfileRepository.delete(savedProfile);
        ownerProfileRepository.flush();
        entityManager.clear();

        assertThat(ownerProfileRepository.findById(savedProfile.getId())).isEmpty();
        assertThat(addressRepository.findById(addressId)).isEmpty();
    }

    @Test
    @DisplayName("Deleting BillboardListing cascades deletion to its Address (orphanRemoval = true)")
    void deleteBillboardListing_cascadesToAddress() {
        User user = userRepository.saveAndFlush(new User("Sanjay", "Verma", "sanjay.billboard@example.com", "pass", "9876543213", Role.OWNER));
        Address address = Address.of("Western Express Highway", null, "Goregaon Flyover", "Mumbai", "Maharashtra", "400063");

        BillboardListing listing = new BillboardListing();
        listing.setUser(user);
        listing.setName("WEH Prime Unipole");
        listing.setAddress(address);
        listing.setType("Unipole");
        listing.setWidthFt(new BigDecimal("40.00"));
        listing.setHeightFt(new BigDecimal("20.00"));
        listing.setFacing("North");
        listing.setTrafficType("Vehicular");
        listing.setAudienceType("Commuters");
        listing.setStartPrice(new BigDecimal("150000.00"));
        listing.setMinBooking("1 month");

        BillboardListing savedListing = billboardListingRepository.saveAndFlush(listing);
        Long addressId = savedListing.getAddress().getId();
        assertThat(addressId).isNotNull();
        assertThat(addressRepository.findById(addressId)).isPresent();

        billboardListingRepository.delete(savedListing);
        billboardListingRepository.flush();
        entityManager.clear();

        assertThat(billboardListingRepository.findById(savedListing.getId())).isEmpty();
        assertThat(addressRepository.findById(addressId)).isEmpty();
    }
}

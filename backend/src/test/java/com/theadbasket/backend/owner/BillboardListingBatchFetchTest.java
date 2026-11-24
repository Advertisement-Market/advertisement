package com.theadbasket.backend.owner;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.FacingDirection;
import com.theadbasket.backend.lov.TrafficType;
import com.theadbasket.backend.owner.dto.BillboardListingDto;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

import jakarta.persistence.EntityManager;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BillboardListingBatchFetchTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BillboardListingRepository billboardListingRepository;

    @Autowired
    private OwnerListingService ownerListingService;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("getOwnerListings avoids N+1 query loop when loading listings with pricing packages due to @BatchSize(25)")
    void testBatchFetchingAvoidsNPlusOne() {
        User user = userRepository.saveAndFlush(
                new User("Batch", "Owner", "batch.owner@example.com", "hash", "9876543299", Role.OWNER)
        );

        // Seed 10 listings, each with 2 pricing packages (1 base, 1 promotional)
        for (int i = 1; i <= 10; i++) {
            Address address = Address.of("Highway " + i, null, "Junction " + i, "Mumbai", "Maharashtra", "400001");
            BillboardListing listing = new BillboardListing();
            listing.setUser(user);
            listing.setName("Listing " + i);
            listing.setAddress(address);
            listing.setType(BillboardType.UNIPOLE);
            listing.setWidthFt(new BigDecimal("40.00"));
            listing.setHeightFt(new BigDecimal("20.00"));
            listing.setFacing(FacingDirection.NORTH);
            listing.setTrafficType(TrafficType.HIGHWAY);
            listing.setAudienceType(AudienceType.COMMUTERS);
            listing.setStartPrice(new BigDecimal("1000.00"));
            listing.setMinBookingValue(1);
            listing.setMinBookingUnit(BookingDurationUnit.MONTHS);
            listing.setMinBookingDays(30);

            BillboardPricingPackage basePkg = new BillboardPricingPackage(
                    listing, 1, BookingDurationUnit.MONTHS, 30, new BigDecimal("30000.00"), "Base tier", true
            );
            BillboardPricingPackage promoPkg = new BillboardPricingPackage(
                    listing, 3, BookingDurationUnit.MONTHS, 90, new BigDecimal("81000.00"), "10% off", false
            );
            listing.getPricingPackages().add(basePkg);
            listing.getPricingPackages().add(promoPkg);

            billboardListingRepository.save(listing);
        }

        billboardListingRepository.flush();
        entityManager.clear();

        SessionFactory sessionFactory = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class);
        Statistics stats = sessionFactory.getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();

        // Load all 10 listings via service (which maps each listing to DTO, triggering pricingPackages access)
        List<BillboardListingDto> dtos = ownerListingService.getOwnerListings(user.getId());

        assertThat(dtos).hasSize(10);
        for (BillboardListingDto dto : dtos) {
            assertThat(dto.pricingPackages()).hasSize(2);
        }

        // Without @BatchSize, loading 10 listings and their lazy pricing packages would require 1 + 10 = 11 queries.
        // With @BatchSize(size = 25), Hibernate batches the collection fetch using WHERE billboard_id IN (?, ?, ..., ?).
        // Total queries should be bounded to at most 2 queries (1 for listings + 1 batch fetch for packages).
        long statementCount = stats.getPrepareStatementCount();
        assertThat(statementCount)
                .as("Query count must be bounded by batch size (<= 4 queries), proving N+1 query loop is prevented")
                .isLessThanOrEqualTo(4);
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        billboardListingRepository.deleteAll();
        userRepository.deleteAll();
    }
}

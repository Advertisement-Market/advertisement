package com.theadbasket.backend.owner;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.owner.dto.BillboardListingCreateRequest;
import com.theadbasket.backend.owner.dto.BillboardListingDto;
import com.theadbasket.backend.owner.dto.BillboardListingUpdateRequest;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class OwnerListingServiceTest {

    @Mock
    private BillboardListingRepository billboardListingRepository;

    @Mock
    private UserRepository userRepository;

    private OwnerListingService ownerListingService;

    private User owner;

    @BeforeEach
    void setUp() {
        ownerListingService = new OwnerListingService(billboardListingRepository, userRepository);
        owner = new User("Vikram", "Kumar", "owner@example.com", "hash", "9876543210", Role.OWNER);
    }

    private BillboardListing createSampleListing(Long id, String name, User user) {
        Address address = Address.of("100 Bandra West", "Hill Road", "Near Station", "Mumbai", "Maharashtra", "400050");
        BillboardListing listing = new BillboardListing();
        listing.setUser(user);
        listing.setName(name);
        listing.setAddress(address);
        listing.setType("LED Digital");
        listing.setWidthFt(new BigDecimal("40.00"));
        listing.setHeightFt(new BigDecimal("20.00"));
        listing.setFacing("North");
        listing.setTrafficType("Vehicular");
        listing.setAudienceType("Commuters");
        listing.setStartPrice(new BigDecimal("350000.00"));
        listing.setMinBooking("1 month");
        return listing;
    }

    @Test
    @DisplayName("getOwnerListings returns list of owner listings mapped to DTO")
    void getOwnerListings_returnsMappedListings() {
        BillboardListing l1 = createSampleListing(1L, "Bandra Station LED", owner);
        BillboardListing l2 = createSampleListing(2L, "Worli Sea Face Hoarding", owner);

        when(billboardListingRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(l1, l2));

        List<BillboardListingDto> result = ownerListingService.getOwnerListings(1L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).name()).isEqualTo("Bandra Station LED");
        assertThat(result.get(0).city()).isEqualTo("Mumbai");
        assertThat(result.get(0).pincode()).isEqualTo("400050");
        assertThat(result.get(1).name()).isEqualTo("Worli Sea Face Hoarding");
    }

    @Test
    @DisplayName("getListingById returns DTO when listing belongs to owner")
    void getListingById_whenListingExists_returnsDto() {
        BillboardListing listing = createSampleListing(10L, "Andheri Flyover", owner);
        when(billboardListingRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(listing));

        BillboardListingDto dto = ownerListingService.getListingById(10L, 1L);

        assertThat(dto.name()).isEqualTo("Andheri Flyover");
        assertThat(dto.startPrice()).isEqualByComparingTo(new BigDecimal("350000.00"));
    }

    @Test
    @DisplayName("getListingById throws ResourceNotFoundException with BILLBOARD_NOT_FOUND when not owned")
    void getListingById_whenNotOwned_throwsResourceNotFoundException() {
        when(billboardListingRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ownerListingService.getListingById(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .satisfies(ex -> assertThat(((ResourceNotFoundException) ex).getErrorCode()).isEqualTo(ErrorCode.BILLBOARD_NOT_FOUND));
    }

    @Test
    @DisplayName("createListing sanitizes address and persists new billboard listing")
    void createListing_sanitizesAddressAndPersists() {
        BillboardListingCreateRequest req = new BillboardListingCreateRequest(
                "  Powai Prime Screen  ",
                "  12 Hiranandani Gardens  ",
                "  Phase 2  ",
                "  Opposite Galleria  ",
                "  Mumbai  ",
                "  Maharashtra  ",
                "400076",
                "LED Digital",
                new BigDecimal("30.00"),
                new BigDecimal("15.00"),
                new BigDecimal("10.00"),
                "West",
                "Pedestrian & Vehicular",
                "Tech Professionals",
                "50,000/day",
                new BigDecimal("250000.00"),
                "3 months",
                "  5% discount on 6-month booking  "
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(billboardListingRepository.save(any(BillboardListing.class))).thenAnswer(inv -> inv.getArgument(0));

        BillboardListingDto result = ownerListingService.createListing(1L, req);

        assertThat(result.name()).isEqualTo("Powai Prime Screen");
        assertThat(result.addressLine1()).isEqualTo("12 Hiranandani Gardens");
        assertThat(result.addressLine2()).isEqualTo("Phase 2");
        assertThat(result.landmark()).isEqualTo("Opposite Galleria");
        assertThat(result.city()).isEqualTo("Mumbai");
        assertThat(result.state()).isEqualTo("Maharashtra");
        assertThat(result.pincode()).isEqualTo("400076");
        assertThat(result.discountNote()).isEqualTo("5% discount on 6-month booking");

        ArgumentCaptor<BillboardListing> captor = ArgumentCaptor.forClass(BillboardListing.class);
        verify(billboardListingRepository).save(captor.capture());
        BillboardListing saved = captor.getValue();
        assertThat(saved.getUser()).isEqualTo(owner);
        assertThat(saved.getName()).isEqualTo("Powai Prime Screen");
    }

    @Test
    @DisplayName("updateListing merges only non-null fields and persists changes")
    void updateListing_mergesNonNullFields() {
        BillboardListing existing = createSampleListing(10L, "Old Name", owner);
        when(billboardListingRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(billboardListingRepository.save(any(BillboardListing.class))).thenAnswer(inv -> inv.getArgument(0));

        BillboardListingUpdateRequest updateReq = new BillboardListingUpdateRequest(
                "New Prime Unipole",
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
                new BigDecimal("450000.00"),
                null,
                "New discount note"
        );

        BillboardListingDto updated = ownerListingService.updateListing(10L, 1L, updateReq);

        assertThat(updated.name()).isEqualTo("New Prime Unipole");
        assertThat(updated.startPrice()).isEqualByComparingTo(new BigDecimal("450000.00"));
        assertThat(updated.discountNote()).isEqualTo("New discount note");
        // Untouched fields preserved:
        assertThat(updated.type()).isEqualTo("LED Digital");
        assertThat(updated.city()).isEqualTo("Mumbai");
        assertThat(updated.pincode()).isEqualTo("400050");
    }

    @Test
    @DisplayName("deleteListing deletes entity when owned by caller")
    void deleteListing_whenOwned_deletesListing() {
        BillboardListing listing = createSampleListing(15L, "Delete Me", owner);
        when(billboardListingRepository.findByIdAndUserId(15L, 1L)).thenReturn(Optional.of(listing));

        ownerListingService.deleteListing(15L, 1L);

        verify(billboardListingRepository).delete(listing);
    }

    @Test
    @DisplayName("deleteListing throws ResourceNotFoundException and does not delete when not owned")
    void deleteListing_whenNotOwned_throwsException() {
        when(billboardListingRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> ownerListingService.deleteListing(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .satisfies(ex -> assertThat(((ResourceNotFoundException) ex).getErrorCode()).isEqualTo(ErrorCode.BILLBOARD_NOT_FOUND));

        verify(billboardListingRepository, never()).delete(any());
    }
}

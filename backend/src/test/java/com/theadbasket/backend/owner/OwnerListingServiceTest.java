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
import org.springframework.context.support.ResourceBundleMessageSource;

import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.common.validation.RequiredOtherText;
import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.FacingDirection;
import com.theadbasket.backend.lov.LovService;
import com.theadbasket.backend.lov.TrafficType;
import com.theadbasket.backend.notification.NotificationCategory;
import com.theadbasket.backend.notification.NotificationService;
import com.theadbasket.backend.notification.NotificationTone;
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

    @Mock
    private NotificationService notificationService;

    private LovService lovService;
    private OwnerListingService ownerListingService;

    private User owner;

    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        ResourceBundleMessageSource messages = new ResourceBundleMessageSource();
        messages.setBasename("messages");
        messages.setDefaultEncoding("UTF-8");
        messages.setUseCodeAsDefaultMessage(true);
        lovService = new LovService(messages);

        ownerListingService = new OwnerListingService(billboardListingRepository, userRepository, notificationService, lovService);
        owner = new User("Vikram", "Kumar", "owner@example.com", "hash", "9876543210", Role.OWNER);
    }

    private BillboardListing createSampleListing(String name, User user) {
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
        return listing;
    }

    @Test
    @DisplayName("getOwnerListings returns list of owner listings mapped to DTO")
    void getOwnerListings_returnsMappedListings() {
        BillboardListing l1 = createSampleListing("Bandra Station LED", owner);
        BillboardListing l2 = createSampleListing("Worli Sea Face Hoarding", owner);

        when(billboardListingRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(l1, l2));

        List<BillboardListingDto> result = ownerListingService.getOwnerListings(1L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).name()).isEqualTo("Bandra Station LED");
        assertThat(result.get(0).city()).isEqualTo("Mumbai");
        assertThat(result.get(0).pincode()).isEqualTo("400050");
        assertThat(result.get(0).type()).isEqualTo("LED_DIGITAL");
        assertThat(result.get(0).minBookingValue()).isEqualTo(1);
        assertThat(result.get(0).minBookingUnit()).isEqualTo("MONTHS");
        assertThat(result.get(1).name()).isEqualTo("Worli Sea Face Hoarding");
    }

    @Test
    @DisplayName("getListingById returns DTO when listing belongs to owner")
    void getListingById_whenListingExists_returnsDto() {
        BillboardListing listing = createSampleListing("Andheri Flyover", owner);
        when(billboardListingRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(listing));

        BillboardListingDto dto = ownerListingService.getListingById(10L, 1L);

        assertThat(dto.name()).isEqualTo("Andheri Flyover");
        assertThat(dto.startPrice()).isEqualByComparingTo(new BigDecimal("350000.00"));
        assertThat(dto.type()).isEqualTo("LED_DIGITAL");
        assertThat(dto.facing()).isEqualTo("NORTH");
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
                null,
                new BigDecimal("30.00"),
                new BigDecimal("15.00"),
                new BigDecimal("10.00"),
                "West",
                "City / Urban",
                null,
                "Commuters",
                null,
                "50,000/day",
                new BigDecimal("250000.00"),
                3,
                "Months",
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
        assertThat(result.type()).isEqualTo("LED_DIGITAL");
        assertThat(result.facing()).isEqualTo("WEST");
        assertThat(result.trafficType()).isEqualTo("CITY_URBAN");
        assertThat(result.audienceType()).isEqualTo("COMMUTERS");
        assertThat(result.minBookingValue()).isEqualTo(3);
        assertThat(result.minBookingUnit()).isEqualTo("MONTHS");
        assertThat(result.minBookingDays()).isEqualTo(90);
        assertThat(result.discountNote()).isEqualTo("5% discount on 6-month booking");

        ArgumentCaptor<BillboardListing> captor = ArgumentCaptor.forClass(BillboardListing.class);
        verify(billboardListingRepository).save(captor.capture());
        BillboardListing saved = captor.getValue();
        assertThat(saved.getUser()).isEqualTo(owner);
        assertThat(saved.getName()).isEqualTo("Powai Prime Screen");
        assertThat(saved.getType()).isEqualTo(BillboardType.LED_DIGITAL);
        assertThat(saved.getFacing()).isEqualTo(FacingDirection.WEST);
        assertThat(saved.getMinBookingDays()).isEqualTo(90);

        verify(notificationService).createNotification(
                owner,
                "New Billboard Listed",
                "Your listing \"Powai Prime Screen\" has been created and submitted for verification.",
                NotificationCategory.ONBOARDING,
                NotificationTone.TEAL,
                "/owners/dashboard?tab=listings"
        );
    }

    @Test
    @DisplayName("updateListing merges only non-null fields and persists changes")
    void updateListing_mergesNonNullFields() {
        BillboardListing existing = createSampleListing("Old Name", owner);
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
                null,
                null,
                null,
                new BigDecimal("450000.00"),
                null,
                null,
                "New discount note"
        );

        BillboardListingDto updated = ownerListingService.updateListing(10L, 1L, updateReq);

        assertThat(updated.name()).isEqualTo("New Prime Unipole");
        assertThat(updated.startPrice()).isEqualByComparingTo(new BigDecimal("450000.00"));
        assertThat(updated.discountNote()).isEqualTo("New discount note");
        // Untouched fields preserved:
        assertThat(updated.type()).isEqualTo("LED_DIGITAL");
        assertThat(updated.city()).isEqualTo("Mumbai");
        assertThat(updated.pincode()).isEqualTo("400050");
        assertThat(updated.minBookingValue()).isEqualTo(1);
        assertThat(updated.minBookingUnit()).isEqualTo("MONTHS");
    }

    @Test
    @DisplayName("deleteListing deletes entity when owned by caller")
    void deleteListing_whenOwned_deletesListing() {
        BillboardListing listing = createSampleListing("Delete Me", owner);
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

    @Test
    @DisplayName("BadRequestException varargs constructor binds properly and retains arguments without fieldErrors")
    void badRequestException_varargsOverloadRetainsArgsWithoutFieldErrors() {
        BadRequestException ex = new BadRequestException(ErrorCode.INVALID_BILLBOARD_TYPE, "foo", "bar");
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.INVALID_BILLBOARD_TYPE);
        assertThat(ex.getArgs()).containsExactly("foo", "bar");
        assertThat(ex.getFieldErrors()).isEmpty();
    }

    @Test
    @DisplayName("createListing rejects OTHER type with zero-width space companion text via defense-in-depth")
    void createListing_whenOtherWithZeroWidthSpace_throwsValidationFailedWithFieldError() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        BillboardListingCreateRequest req = new BillboardListingCreateRequest(
                "Name", "Line 1", null, null, "Mumbai", "Maharashtra", "400050",
                "OTHER", "\u200B", new BigDecimal("40.00"), new BigDecimal("20.00"), BigDecimal.ZERO,
                "NORTH", "CITY_URBAN", null, "COMMUTERS", null, "High",
                new BigDecimal("300000.00"), 1, "MONTHS", null
        );

        assertThatThrownBy(() -> ownerListingService.createListing(1L, req))
                .isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED);
                    assertThat(bre.getFieldErrors()).containsEntry("typeOther", RequiredOtherText.DEFAULT_MESSAGE);
                });
    }

    @Test
    @DisplayName("createListing aggregates multiple missing OTHER companion descriptions into ordered fieldErrors")
    void createListing_multipleMissingOtherTexts_aggregatesInFieldErrors() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        BillboardListingCreateRequest req = new BillboardListingCreateRequest(
                "Name", "Line 1", null, null, "Mumbai", "Maharashtra", "400050",
                "OTHER", "   ", new BigDecimal("40.00"), new BigDecimal("20.00"), BigDecimal.ZERO,
                "NORTH", "OTHER", "\u00A0", "OTHER", "\u200B", "High",
                new BigDecimal("300000.00"), 1, "MONTHS", null
        );

        assertThatThrownBy(() -> ownerListingService.createListing(1L, req))
                .isInstanceOf(BadRequestException.class)
                .satisfies(ex -> {
                    BadRequestException bre = (BadRequestException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED);
                    assertThat(bre.getFieldErrors().keySet()).containsExactly("typeOther", "trafficTypeOther", "audienceTypeOther");
                });
    }

    @Test
    @DisplayName("createListing trims companion descriptions for type, traffic, and audience")
    void createListing_trimsCompanionDescriptionsForTypeTrafficAndAudience() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(billboardListingRepository.save(any(BillboardListing.class))).thenAnswer(inv -> inv.getArgument(0));

        BillboardListingCreateRequest req = new BillboardListingCreateRequest(
                "Name", "Line 1", null, null, "Mumbai", "Maharashtra", "400050",
                "OTHER", "  Skywalk  ", new BigDecimal("40.00"), new BigDecimal("20.00"), BigDecimal.ZERO,
                "NORTH", "OTHER", "  Airport Runway  ", "OTHER", "  Tourists  ", "High",
                new BigDecimal("300000.00"), 1, "MONTHS", null
        );

        ownerListingService.createListing(1L, req);

        ArgumentCaptor<BillboardListing> captor = ArgumentCaptor.forClass(BillboardListing.class);
        verify(billboardListingRepository).save(captor.capture());
        BillboardListing saved = captor.getValue();
        assertThat(saved.getTypeOther()).isEqualTo("Skywalk");
        assertThat(saved.getTrafficTypeOther()).isEqualTo("Airport Runway");
        assertThat(saved.getAudienceTypeOther()).isEqualTo("Tourists");
    }

    @Test
    @DisplayName("updateListing with typeOther on a row with null type does not throw NPE and leaves typeOther null")
    void updateListing_whenExistingRowHasNullType_handlesDefensivelyWithoutNpe() {
        BillboardListing existing = createSampleListing("Null Type Listing", owner);
        existing.setType(null);
        when(billboardListingRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(billboardListingRepository.save(any(BillboardListing.class))).thenAnswer(inv -> inv.getArgument(0));

        BillboardListingUpdateRequest patchReq = new BillboardListingUpdateRequest(
                null, null, null, null, null, null, null,
                null, "Some Description",
                null, null, null, null, null, null, null, null, null, null, null, null, null
        );

        BillboardListingDto updated = ownerListingService.updateListing(10L, 1L, patchReq);
        assertThat(updated.type()).isNull();
        assertThat(updated.typeOther()).isNull();
    }
}

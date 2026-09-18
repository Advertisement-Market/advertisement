package com.theadbasket.backend.owner;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.notification.NotificationCategory;
import com.theadbasket.backend.notification.NotificationService;
import com.theadbasket.backend.notification.NotificationTone;
import com.theadbasket.backend.owner.dto.BillboardListingCreateRequest;
import com.theadbasket.backend.owner.dto.BillboardListingDto;
import com.theadbasket.backend.owner.dto.BillboardListingUpdateRequest;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

/**
 * Service managing inventory operations for billboard owners.
 */
@Service
public class OwnerListingService {

    private static final Logger log = LoggerFactory.getLogger(OwnerListingService.class);

    private final BillboardListingRepository billboardListingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public OwnerListingService(BillboardListingRepository billboardListingRepository,
                               UserRepository userRepository,
                               NotificationService notificationService) {
        this.billboardListingRepository = billboardListingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<BillboardListingDto> getOwnerListings(Long userId) {
        return billboardListingRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(BillboardListingDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BillboardListingDto getListingById(Long id, Long userId) {
        return billboardListingRepository.findByIdAndUserId(id, userId)
                .map(BillboardListingDto::from)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));
    }

    @Transactional
    public BillboardListingDto createListing(Long userId, BillboardListingCreateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found"));

        Address address = Address.of(
                req.addressLine1(),
                req.addressLine2(),
                req.landmark(),
                req.city(),
                req.state(),
                req.pincode()
        );

        BillboardListing listing = new BillboardListing();
        listing.setUser(user);
        listing.setName(req.name().trim());
        listing.setAddress(address);
        listing.setType(req.type().trim());
        listing.setWidthFt(req.widthFt());
        listing.setHeightFt(req.heightFt());
        listing.setGroundHeightFt(req.groundHeightFt());
        listing.setFacing(req.facing().trim());
        listing.setTrafficType(req.trafficType().trim());
        listing.setAudienceType(req.audienceType().trim());
        listing.setFootfall(blankToNull(req.footfall()));
        listing.setStartPrice(req.startPrice());
        listing.setMinBooking(req.minBooking().trim());
        listing.setDiscountNote(blankToNull(req.discountNote()));

        BillboardListing saved = billboardListingRepository.save(listing);
        log.info("Created billboard listing id={} for user id={}", saved.getId(), userId);

        notificationService.createNotification(
                user,
                "New Billboard Listed",
                "Your listing \"" + saved.getName() + "\" has been created and submitted for verification.",
                NotificationCategory.ONBOARDING,
                NotificationTone.TEAL,
                "/owners/dashboard?tab=listings"
        );

        return BillboardListingDto.from(saved);
    }

    @Transactional
    public BillboardListingDto updateListing(Long id, Long userId, BillboardListingUpdateRequest req) {
        BillboardListing listing = billboardListingRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (req.name() != null) listing.setName(req.name().trim());
        if (req.type() != null) listing.setType(req.type().trim());
        if (req.widthFt() != null) listing.setWidthFt(req.widthFt());
        if (req.heightFt() != null) listing.setHeightFt(req.heightFt());
        if (req.groundHeightFt() != null) listing.setGroundHeightFt(req.groundHeightFt());
        if (req.facing() != null) listing.setFacing(req.facing().trim());
        if (req.trafficType() != null) listing.setTrafficType(req.trafficType().trim());
        if (req.audienceType() != null) listing.setAudienceType(req.audienceType().trim());
        if (req.footfall() != null) listing.setFootfall(blankToNull(req.footfall()));
        if (req.startPrice() != null) listing.setStartPrice(req.startPrice());
        if (req.minBooking() != null) listing.setMinBooking(req.minBooking().trim());
        if (req.discountNote() != null) listing.setDiscountNote(blankToNull(req.discountNote()));

        Address addr = listing.getAddress();
        if (addr != null) {
            if (req.addressLine1() != null) addr.setLine1(req.addressLine1().trim());
            if (req.addressLine2() != null) addr.setLine2(blankToNull(req.addressLine2()));
            if (req.landmark() != null) addr.setLandmark(blankToNull(req.landmark()));
            if (req.city() != null) addr.setCity(req.city().trim());
            if (req.state() != null) addr.setState(req.state().trim());
            if (req.pincode() != null) addr.setPincode(req.pincode().trim());
        }

        BillboardListing saved = billboardListingRepository.save(listing);
        log.info("Updated billboard listing id={} for user id={}", saved.getId(), userId);
        return BillboardListingDto.from(saved);
    }

    @Transactional
    public void deleteListing(Long id, Long userId) {
        BillboardListing listing = billboardListingRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        billboardListingRepository.delete(listing);
        log.info("Deleted billboard listing id={} for user id={}", id, userId);
    }

    private static String blankToNull(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

package com.theadbasket.backend.owner;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.common.storage.FileStorageService;
import com.theadbasket.backend.common.util.TextUtil;
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
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

/**
 * Service managing inventory operations for billboard owners and marketplace views.
 */
@Service
public class OwnerListingService {

    private static final Logger log = LoggerFactory.getLogger(OwnerListingService.class);
    private static final int MAX_LISTINGS_PER_OWNER = 20;

    private final BillboardListingRepository billboardListingRepository;
    private final BillboardMediaRepository billboardMediaRepository;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final LovService lovService;
    private final boolean moderationRequired;
    private final String mediaBaseUrl;

    public OwnerListingService(
            BillboardListingRepository billboardListingRepository,
            BillboardMediaRepository billboardMediaRepository,
            FileStorageService fileStorageService,
            UserRepository userRepository,
            NotificationService notificationService,
            LovService lovService,
            @Value("${app.listings.moderation-required:true}") boolean moderationRequired,
            @Value("${app.media.base-url:/api/media}") String mediaBaseUrl) {
        this.billboardListingRepository = billboardListingRepository;
        this.billboardMediaRepository = billboardMediaRepository;
        this.fileStorageService = fileStorageService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.lovService = lovService;
        this.moderationRequired = moderationRequired;
        this.mediaBaseUrl = mediaBaseUrl;
    }

    @Transactional(readOnly = true)
    public List<BillboardListingDto> getOwnerListings(Long userId) {
        return billboardListingRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(l -> BillboardListingDto.from(l, mediaBaseUrl))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BillboardListingDto> getActiveListings() {
        return billboardListingRepository.findByStatusOrderByCreatedAtDesc(BillboardStatus.ACTIVE)
                .stream()
                .map(l -> BillboardListingDto.from(l, mediaBaseUrl))
                .toList();
    }

    @Transactional(readOnly = true)
    public BillboardListingDto getListingById(Long id, Long userId) {
        return billboardListingRepository.findByIdAndUserId(id, userId)
                .map(l -> BillboardListingDto.from(l, mediaBaseUrl))
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));
    }

    @Transactional
    public BillboardListingDto createListing(Long userId, BillboardListingCreateRequest req) {
        if (billboardListingRepository.countByUserId(userId) >= MAX_LISTINGS_PER_OWNER) {
            throw new BadRequestException(ErrorCode.LISTING_CAP_EXCEEDED,
                    String.format("You have reached the maximum limit of %d billboard listings", MAX_LISTINGS_PER_OWNER));
        }

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

        BillboardType type = lovService.parse(BillboardType.class, req.type(), ErrorCode.INVALID_BILLBOARD_TYPE);
        TrafficType trafficType = lovService.parse(TrafficType.class, req.trafficType(), ErrorCode.INVALID_TRAFFIC_TYPE);
        AudienceType audienceType = lovService.parse(AudienceType.class, req.audienceType(), ErrorCode.INVALID_AUDIENCE_TYPE);
        FacingDirection facing = lovService.parseFacing(req.facing());
        BookingDurationUnit minBookingUnit = lovService.parseBookingDurationUnit(req.minBookingUnit());

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        if (type != null && type.isOther() && TextUtil.isBlank(req.typeOther())) {
            fieldErrors.put("typeOther", RequiredOtherText.DEFAULT_MESSAGE);
        }
        if (trafficType != null && trafficType.isOther() && TextUtil.isBlank(req.trafficTypeOther())) {
            fieldErrors.put("trafficTypeOther", RequiredOtherText.DEFAULT_MESSAGE);
        }
        if (audienceType != null && audienceType.isOther() && TextUtil.isBlank(req.audienceTypeOther())) {
            fieldErrors.put("audienceTypeOther", RequiredOtherText.DEFAULT_MESSAGE);
        }
        if (!fieldErrors.isEmpty()) {
            throw BadRequestException.forFieldErrors(ErrorCode.VALIDATION_FAILED, fieldErrors);
        }

        BillboardListing listing = new BillboardListing();
        listing.setUser(user);
        listing.setName(req.name().trim());
        listing.setAddress(address);
        listing.setType(type);
        listing.setTypeOther(type != null && type.isOther() ? TextUtil.blankToNull(req.typeOther()) : null);
        listing.setWidthFt(req.widthFt());
        listing.setHeightFt(req.heightFt());
        listing.setGroundHeightFt(req.groundHeightFt());
        listing.setFacing(facing);
        listing.setTrafficType(trafficType);
        listing.setTrafficTypeOther(trafficType != null && trafficType.isOther() ? TextUtil.blankToNull(req.trafficTypeOther()) : null);
        listing.setAudienceType(audienceType);
        listing.setAudienceTypeOther(audienceType != null && audienceType.isOther() ? TextUtil.blankToNull(req.audienceTypeOther()) : null);
        listing.setFootfall(TextUtil.blankToNull(req.footfall()));
        listing.setStartPrice(req.startPrice());
        listing.setMinBookingValue(req.minBookingValue());
        listing.setMinBookingUnit(minBookingUnit);
        listing.setMinBookingDays(minBookingUnit.toDays(req.minBookingValue()));
        listing.setDiscountNote(TextUtil.blankToNull(req.discountNote()));
        listing.setStatus(BillboardStatus.DRAFT);

        BillboardListing saved = billboardListingRepository.save(listing);
        log.info("Created billboard listing id={} in DRAFT status for user id={}", saved.getId(), userId);

        notificationService.createNotification(
                user,
                "New Billboard Listed",
                "Your listing \"" + saved.getName() + "\" has been created and submitted for verification.",
                NotificationCategory.ONBOARDING,
                NotificationTone.TEAL,
                "/owners/dashboard?tab=listings"
        );

        return BillboardListingDto.from(saved, mediaBaseUrl);
    }

    @Transactional
    public BillboardListingDto submitListing(Long listingId, Long userId) {
        BillboardListing listing = billboardListingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (!listing.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found");
        }

        // Idempotent: if already PENDING_APPROVAL or ACTIVE, return current state
        if (listing.getStatus() == BillboardStatus.PENDING_APPROVAL || listing.getStatus() == BillboardStatus.ACTIVE) {
            return BillboardListingDto.from(listing, mediaBaseUrl);
        }

        if (listing.getStatus() != BillboardStatus.DRAFT && listing.getStatus() != BillboardStatus.REJECTED) {
            throw new BadRequestException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Cannot submit listing from status " + listing.getStatus());
        }

        // Validate media requirements: at least 2 day photos
        long dayPhotos = billboardMediaRepository.countByBillboardIdAndCategory(listingId, MediaCategory.DAY_PHOTO);
        if (dayPhotos < MediaCategory.DAY_PHOTO.getMinCount()) {
            throw new BadRequestException(ErrorCode.MINIMUM_DAY_PHOTOS_REQUIRED,
                    "At least 2 day photos are required to submit a billboard listing");
        }

        // Ensure a cover photo exists; if not, auto-promote first day photo
        boolean hasCover = billboardMediaRepository.findCoverByBillboardId(listingId).isPresent();
        if (!hasCover) {
            billboardMediaRepository.findFirstByBillboardIdAndCategoryOrderByDisplayOrderAsc(listingId, MediaCategory.DAY_PHOTO)
                    .ifPresent(m -> {
                        m.setIsCover(Boolean.TRUE);
                        billboardMediaRepository.save(m);
                    });
        }

        listing.setRejectionReason(null);
        BillboardStatus nextStatus = moderationRequired ? BillboardStatus.PENDING_APPROVAL : BillboardStatus.ACTIVE;
        listing.setStatus(nextStatus);
        BillboardListing saved = billboardListingRepository.save(listing);

        log.info("Submitted billboard listing id={} by user id={}, new status={}", listingId, userId, nextStatus);

        notificationService.createNotification(
                listing.getUser(),
                "Listing Submitted for Review",
                "Your listing \"" + saved.getName() + "\" has been submitted for verification.",
                NotificationCategory.ONBOARDING,
                NotificationTone.TEAL,
                "/owners/dashboard?tab=listings"
        );

        return BillboardListingDto.from(saved, mediaBaseUrl);
    }

    @Transactional
    public BillboardListingDto updateListing(Long id, Long userId, BillboardListingUpdateRequest req) {
        BillboardListing listing = billboardListingRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (listing.getStatus() == BillboardStatus.SUSPENDED) {
            throw new BadRequestException(ErrorCode.LISTING_SUSPENDED, "Listing is suspended and cannot be modified");
        }

        BillboardType type = req.type() != null ? lovService.parse(BillboardType.class, req.type(), ErrorCode.INVALID_BILLBOARD_TYPE) : listing.getType();
        TrafficType trafficType = req.trafficType() != null ? lovService.parse(TrafficType.class, req.trafficType(), ErrorCode.INVALID_TRAFFIC_TYPE) : listing.getTrafficType();
        AudienceType audienceType = req.audienceType() != null ? lovService.parse(AudienceType.class, req.audienceType(), ErrorCode.INVALID_AUDIENCE_TYPE) : listing.getAudienceType();
        FacingDirection facing = req.facing() != null ? lovService.parseFacing(req.facing()) : listing.getFacing();

        Integer minBookingValue = req.minBookingValue() != null ? req.minBookingValue() : listing.getMinBookingValue();
        BookingDurationUnit minBookingUnit = req.minBookingUnit() != null ? lovService.parseBookingDurationUnit(req.minBookingUnit()) : listing.getMinBookingUnit();

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        boolean typeTouched = req.type() != null || req.typeOther() != null;
        if (typeTouched && type != null && type.isOther()) {
            String other = req.typeOther() != null ? req.typeOther() : listing.getTypeOther();
            if (TextUtil.isBlank(other)) {
                fieldErrors.put("typeOther", RequiredOtherText.DEFAULT_MESSAGE);
            }
        }
        boolean trafficTypeTouched = req.trafficType() != null || req.trafficTypeOther() != null;
        if (trafficTypeTouched && trafficType != null && trafficType.isOther()) {
            String other = req.trafficTypeOther() != null ? req.trafficTypeOther() : listing.getTrafficTypeOther();
            if (TextUtil.isBlank(other)) {
                fieldErrors.put("trafficTypeOther", RequiredOtherText.DEFAULT_MESSAGE);
            }
        }
        boolean audienceTypeTouched = req.audienceType() != null || req.audienceTypeOther() != null;
        if (audienceTypeTouched && audienceType != null && audienceType.isOther()) {
            String other = req.audienceTypeOther() != null ? req.audienceTypeOther() : listing.getAudienceTypeOther();
            if (TextUtil.isBlank(other)) {
                fieldErrors.put("audienceTypeOther", RequiredOtherText.DEFAULT_MESSAGE);
            }
        }
        if (!fieldErrors.isEmpty()) {
            throw BadRequestException.forFieldErrors(ErrorCode.VALIDATION_FAILED, fieldErrors);
        }

        if (req.name() != null) listing.setName(req.name().strip());
        if (req.type() != null) listing.setType(type);
        if (req.typeOther() != null) {
            listing.setTypeOther(type != null && type.isOther() ? TextUtil.blankToNull(req.typeOther()) : null);
        } else if (req.type() != null && (type == null || !type.isOther())) {
            listing.setTypeOther(null);
        }
        if (req.widthFt() != null) listing.setWidthFt(req.widthFt());
        if (req.heightFt() != null) listing.setHeightFt(req.heightFt());
        if (req.groundHeightFt() != null) listing.setGroundHeightFt(req.groundHeightFt());
        if (req.facing() != null) listing.setFacing(facing);
        if (req.trafficType() != null) listing.setTrafficType(trafficType);
        if (req.trafficTypeOther() != null) {
            listing.setTrafficTypeOther(trafficType != null && trafficType.isOther() ? TextUtil.blankToNull(req.trafficTypeOther()) : null);
        } else if (req.trafficType() != null && (trafficType == null || !trafficType.isOther())) {
            listing.setTrafficTypeOther(null);
        }
        if (req.audienceType() != null) listing.setAudienceType(audienceType);
        if (req.audienceTypeOther() != null) {
            listing.setAudienceTypeOther(audienceType != null && audienceType.isOther() ? TextUtil.blankToNull(req.audienceTypeOther()) : null);
        } else if (req.audienceType() != null && (audienceType == null || !audienceType.isOther())) {
            listing.setAudienceTypeOther(null);
        }
        if (req.footfall() != null) listing.setFootfall(TextUtil.blankToNull(req.footfall()));
        if (req.startPrice() != null) listing.setStartPrice(req.startPrice());

        if (req.minBookingValue() != null || req.minBookingUnit() != null) {
            listing.setMinBookingValue(minBookingValue);
            listing.setMinBookingUnit(minBookingUnit);
            listing.setMinBookingDays(minBookingUnit != null && minBookingValue != null ? minBookingUnit.toDays(minBookingValue) : null);
        }

        if (req.discountNote() != null) listing.setDiscountNote(TextUtil.blankToNull(req.discountNote()));

        Address addr = listing.getAddress();
        if (addr == null && (req.addressLine1() != null || req.city() != null || req.state() != null || req.pincode() != null)) {
            addr = new Address();
            listing.setAddress(addr);
        }
        if (addr != null) {
            if (req.addressLine1() != null) addr.setLine1(req.addressLine1().strip());
            if (req.addressLine2() != null) addr.setLine2(TextUtil.blankToNull(req.addressLine2()));
            if (req.landmark() != null) addr.setLandmark(TextUtil.blankToNull(req.landmark()));
            if (req.city() != null) addr.setCity(req.city().strip());
            if (req.state() != null) addr.setState(req.state().strip());
            if (req.pincode() != null) addr.setPincode(req.pincode().strip());
        }

        // If listing was REJECTED, move it to DRAFT upon successful edit so owner can continue fixing
        if (listing.getStatus() == BillboardStatus.REJECTED) {
            listing.setStatus(BillboardStatus.DRAFT);
            listing.setRejectionReason(null);
        }

        BillboardListing saved = billboardListingRepository.save(listing);
        log.info("Updated billboard listing id={} for user id={}", saved.getId(), userId);
        return BillboardListingDto.from(saved, mediaBaseUrl);
    }

    @Transactional
    public void deleteListing(Long id, Long userId) {
        BillboardListing listing = billboardListingRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        billboardListingRepository.delete(listing);
        fileStorageService.deleteDirectory("billboards/" + id);
        log.info("Deleted billboard listing id={} and cleaned disk files for user id={}", id, userId);
    }

    // ── Admin Actions ──

    @Transactional
    public BillboardListingDto approveListing(Long id) {
        BillboardListing listing = billboardListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (listing.getStatus() != BillboardStatus.PENDING_APPROVAL) {
            throw new BadRequestException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Only listings in PENDING_APPROVAL status can be approved. Current status: " + listing.getStatus());
        }

        // Re-verify min 2 day photos
        long dayPhotos = billboardMediaRepository.countByBillboardIdAndCategory(id, MediaCategory.DAY_PHOTO);
        if (dayPhotos < MediaCategory.DAY_PHOTO.getMinCount()) {
            throw new BadRequestException(ErrorCode.MINIMUM_DAY_PHOTOS_REQUIRED,
                    "Listing does not have the minimum required 2 day photos");
        }

        listing.setStatus(BillboardStatus.ACTIVE);
        listing.setRejectionReason(null);
        BillboardListing saved = billboardListingRepository.save(listing);
        log.info("Admin approved billboard listing id={}", id);

        notificationService.createNotification(
                saved.getUser(),
                "Billboard Listing Approved!",
                "Your listing \"" + saved.getName() + "\" is now live on the marketplace.",
                NotificationCategory.ONBOARDING,
                NotificationTone.TEAL,
                "/owners/dashboard?tab=listings"
        );

        return BillboardListingDto.from(saved, mediaBaseUrl);
    }

    @Transactional
    public BillboardListingDto rejectListing(Long id, String reason) {
        BillboardListing listing = billboardListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (listing.getStatus() != BillboardStatus.PENDING_APPROVAL) {
            throw new BadRequestException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Only listings in PENDING_APPROVAL status can be rejected. Current status: " + listing.getStatus());
        }

        String cleanReason = reason != null ? reason.trim() : "";
        if (cleanReason.isBlank()) {
            throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "A rejection reason is required");
        }

        listing.setStatus(BillboardStatus.REJECTED);
        listing.setRejectionReason(cleanReason);
        BillboardListing saved = billboardListingRepository.save(listing);
        log.info("Admin rejected billboard listing id={}, reason: {}", id, cleanReason);

        notificationService.createNotification(
                saved.getUser(),
                "Listing Review Update",
                "Your listing \"" + saved.getName() + "\" requires updates before it can be published.",
                NotificationCategory.ONBOARDING,
                NotificationTone.GOLD,
                "/owners/dashboard?tab=listings"
        );

        return BillboardListingDto.from(saved, mediaBaseUrl);
    }

    @Transactional
    public BillboardListingDto suspendListing(Long id, String reason) {
        BillboardListing listing = billboardListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (listing.getStatus() != BillboardStatus.ACTIVE && listing.getStatus() != BillboardStatus.PENDING_APPROVAL) {
            throw new BadRequestException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Cannot suspend listing in status: " + listing.getStatus());
        }

        String cleanReason = reason != null ? reason.trim() : "";
        if (cleanReason.isBlank()) {
            throw new BadRequestException(ErrorCode.VALIDATION_FAILED, "A suspension reason is required");
        }

        listing.setStatus(BillboardStatus.SUSPENDED);
        listing.setSuspensionReason(cleanReason);
        BillboardListing saved = billboardListingRepository.save(listing);
        log.info("Admin suspended billboard listing id={}, reason: {}", id, cleanReason);

        notificationService.createNotification(
                saved.getUser(),
                "Listing Suspended",
                "Your listing \"" + saved.getName() + "\" has been suspended. Reason: " + cleanReason,
                NotificationCategory.SYSTEM,
                NotificationTone.GOLD,
                "/owners/dashboard?tab=listings"
        );

        return BillboardListingDto.from(saved, mediaBaseUrl);
    }

    @Transactional
    public BillboardListingDto unsuspendListing(Long id) {
        BillboardListing listing = billboardListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (listing.getStatus() != BillboardStatus.SUSPENDED) {
            throw new BadRequestException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "Cannot unsuspend listing in status: " + listing.getStatus());
        }

        listing.setStatus(BillboardStatus.DRAFT);
        listing.setSuspensionReason(null);
        BillboardListing saved = billboardListingRepository.save(listing);
        log.info("Admin unsuspended billboard listing id={}, set to DRAFT", id);

        return BillboardListingDto.from(saved, mediaBaseUrl);
    }
}

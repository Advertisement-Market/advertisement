package com.theadbasket.backend.owner;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
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
 * Service managing inventory operations for billboard owners.
 */
@Service
public class OwnerListingService {

    private static final Logger log = LoggerFactory.getLogger(OwnerListingService.class);

    private final BillboardListingRepository billboardListingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final LovService lovService;

    public OwnerListingService(BillboardListingRepository billboardListingRepository,
                               UserRepository userRepository,
                               NotificationService notificationService,
                               LovService lovService) {
        this.billboardListingRepository = billboardListingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.lovService = lovService;
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

        BillboardType type = lovService.parse(BillboardType.class, req.type(), ErrorCode.INVALID_BILLBOARD_TYPE);
        TrafficType trafficType = lovService.parse(TrafficType.class, req.trafficType(), ErrorCode.INVALID_TRAFFIC_TYPE);
        AudienceType audienceType = lovService.parse(AudienceType.class, req.audienceType(), ErrorCode.INVALID_AUDIENCE_TYPE);
        FacingDirection facing = lovService.parseFacing(req.facing());
        BookingDurationUnit minBookingUnit = lovService.parseBookingDurationUnit(req.minBookingUnit());

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        if (type == BillboardType.OTHER && TextUtil.isBlank(req.typeOther())) {
            fieldErrors.put("typeOther", RequiredOtherText.DEFAULT_MESSAGE);
        }
        if (trafficType == TrafficType.OTHER && TextUtil.isBlank(req.trafficTypeOther())) {
            fieldErrors.put("trafficTypeOther", RequiredOtherText.DEFAULT_MESSAGE);
        }
        if (audienceType == AudienceType.OTHER && TextUtil.isBlank(req.audienceTypeOther())) {
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
        listing.setTypeOther(type == BillboardType.OTHER ? TextUtil.blankToNull(req.typeOther()) : null);
        listing.setWidthFt(req.widthFt());
        listing.setHeightFt(req.heightFt());
        listing.setGroundHeightFt(req.groundHeightFt());
        listing.setFacing(facing);
        listing.setTrafficType(trafficType);
        listing.setTrafficTypeOther(trafficType == TrafficType.OTHER ? TextUtil.blankToNull(req.trafficTypeOther()) : null);
        listing.setAudienceType(audienceType);
        listing.setAudienceTypeOther(audienceType == AudienceType.OTHER ? TextUtil.blankToNull(req.audienceTypeOther()) : null);
        listing.setFootfall(TextUtil.blankToNull(req.footfall()));
        listing.setStartPrice(req.startPrice());
        listing.setMinBookingValue(req.minBookingValue());
        listing.setMinBookingUnit(minBookingUnit);
        listing.setMinBookingDays(minBookingUnit.toDays(req.minBookingValue()));
        listing.setDiscountNote(TextUtil.blankToNull(req.discountNote()));

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

        FacingDirection facing = req.facing() != null ? lovService.parseFacing(req.facing()) : null;

        Integer minBookingValue = req.minBookingValue() != null ? req.minBookingValue() : listing.getMinBookingValue();
        BookingDurationUnit minBookingUnit = req.minBookingUnit() != null ? lovService.parseBookingDurationUnit(req.minBookingUnit()) : listing.getMinBookingUnit();

        Map<String, String> fieldErrors = new LinkedHashMap<>();

        boolean typeTouched = req.type() != null || req.typeOther() != null;
        BillboardType effType = listing.getType();
        String effTypeOther = listing.getTypeOther();
        if (typeTouched) {
            effType = req.type() != null
                    ? lovService.parse(BillboardType.class, req.type(), ErrorCode.INVALID_BILLBOARD_TYPE)
                    : listing.getType();
            effTypeOther = req.typeOther() != null
                    ? req.typeOther()
                    : (effType == listing.getType() ? listing.getTypeOther() : null);
            if (effType == BillboardType.OTHER && TextUtil.isBlank(effTypeOther)) {
                fieldErrors.put("typeOther", RequiredOtherText.DEFAULT_MESSAGE);
            }
        }

        boolean trafficTypeTouched = req.trafficType() != null || req.trafficTypeOther() != null;
        TrafficType effTrafficType = listing.getTrafficType();
        String effTrafficTypeOther = listing.getTrafficTypeOther();
        if (trafficTypeTouched) {
            effTrafficType = req.trafficType() != null
                    ? lovService.parse(TrafficType.class, req.trafficType(), ErrorCode.INVALID_TRAFFIC_TYPE)
                    : listing.getTrafficType();
            effTrafficTypeOther = req.trafficTypeOther() != null
                    ? req.trafficTypeOther()
                    : (effTrafficType == listing.getTrafficType() ? listing.getTrafficTypeOther() : null);
            if (effTrafficType == TrafficType.OTHER && TextUtil.isBlank(effTrafficTypeOther)) {
                fieldErrors.put("trafficTypeOther", RequiredOtherText.DEFAULT_MESSAGE);
            }
        }

        boolean audienceTypeTouched = req.audienceType() != null || req.audienceTypeOther() != null;
        AudienceType effAudienceType = listing.getAudienceType();
        String effAudienceTypeOther = listing.getAudienceTypeOther();
        if (audienceTypeTouched) {
            effAudienceType = req.audienceType() != null
                    ? lovService.parse(AudienceType.class, req.audienceType(), ErrorCode.INVALID_AUDIENCE_TYPE)
                    : listing.getAudienceType();
            effAudienceTypeOther = req.audienceTypeOther() != null
                    ? req.audienceTypeOther()
                    : (effAudienceType == listing.getAudienceType() ? listing.getAudienceTypeOther() : null);
            if (effAudienceType == AudienceType.OTHER && TextUtil.isBlank(effAudienceTypeOther)) {
                fieldErrors.put("audienceTypeOther", RequiredOtherText.DEFAULT_MESSAGE);
            }
        }

        if (!fieldErrors.isEmpty()) {
            throw BadRequestException.forFieldErrors(ErrorCode.VALIDATION_FAILED, fieldErrors);
        }

        if (req.name() != null) listing.setName(req.name().trim());
        if (typeTouched) {
            listing.setType(effType);
            listing.setTypeOther(effType == BillboardType.OTHER ? TextUtil.blankToNull(effTypeOther) : null);
        }
        if (req.widthFt() != null) listing.setWidthFt(req.widthFt());
        if (req.heightFt() != null) listing.setHeightFt(req.heightFt());
        if (req.groundHeightFt() != null) listing.setGroundHeightFt(req.groundHeightFt());
        if (facing != null) listing.setFacing(facing);

        if (trafficTypeTouched) {
            listing.setTrafficType(effTrafficType);
            listing.setTrafficTypeOther(effTrafficType == TrafficType.OTHER ? TextUtil.blankToNull(effTrafficTypeOther) : null);
        }

        if (audienceTypeTouched) {
            listing.setAudienceType(effAudienceType);
            listing.setAudienceTypeOther(effAudienceType == AudienceType.OTHER ? TextUtil.blankToNull(effAudienceTypeOther) : null);
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
            if (req.addressLine1() != null) addr.setLine1(req.addressLine1().trim());
            if (req.addressLine2() != null) addr.setLine2(TextUtil.blankToNull(req.addressLine2()));
            if (req.landmark() != null) addr.setLandmark(TextUtil.blankToNull(req.landmark()));
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
}

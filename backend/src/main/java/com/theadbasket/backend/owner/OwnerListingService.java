package com.theadbasket.backend.owner;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.ResourceNotFoundException;
import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.FacingDirection;
import com.theadbasket.backend.lov.LovService;
import com.theadbasket.backend.lov.TrafficType;
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
    private final LovService lovService;

    public OwnerListingService(BillboardListingRepository billboardListingRepository,
                               UserRepository userRepository,
                               LovService lovService) {
        this.billboardListingRepository = billboardListingRepository;
        this.userRepository = userRepository;
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

        BillboardListing listing = new BillboardListing();
        listing.setUser(user);
        listing.setName(req.name().trim());
        listing.setAddress(address);
        listing.setType(type);
        listing.setTypeOther(type == BillboardType.OTHER ? blankToNull(req.typeOther()) : null);
        listing.setWidthFt(req.widthFt());
        listing.setHeightFt(req.heightFt());
        listing.setGroundHeightFt(req.groundHeightFt());
        listing.setFacing(facing);
        listing.setTrafficType(trafficType);
        listing.setTrafficTypeOther(trafficType == TrafficType.OTHER ? blankToNull(req.trafficTypeOther()) : null);
        listing.setAudienceType(audienceType);
        listing.setAudienceTypeOther(audienceType == AudienceType.OTHER ? blankToNull(req.audienceTypeOther()) : null);
        listing.setFootfall(blankToNull(req.footfall()));
        listing.setStartPrice(req.startPrice());
        listing.setMinBookingValue(req.minBookingValue());
        listing.setMinBookingUnit(minBookingUnit);
        listing.setMinBookingDays(minBookingUnit.toDays(req.minBookingValue()));
        listing.setDiscountNote(blankToNull(req.discountNote()));

        BillboardListing saved = billboardListingRepository.save(listing);
        log.info("Created billboard listing id={} for user id={}", saved.getId(), userId);
        return BillboardListingDto.from(saved);
    }

    @Transactional
    public BillboardListingDto updateListing(Long id, Long userId, BillboardListingUpdateRequest req) {
        BillboardListing listing = billboardListingRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BILLBOARD_NOT_FOUND, "Billboard listing not found"));

        if (req.name() != null) listing.setName(req.name().trim());
        if (req.type() != null) {
            BillboardType type = lovService.parse(BillboardType.class, req.type(), ErrorCode.INVALID_BILLBOARD_TYPE);
            listing.setType(type);
            listing.setTypeOther(type == BillboardType.OTHER ? blankToNull(req.typeOther()) : null);
        } else if (req.typeOther() != null && listing.getType() == BillboardType.OTHER) {
            listing.setTypeOther(blankToNull(req.typeOther()));
        }

        if (req.widthFt() != null) listing.setWidthFt(req.widthFt());
        if (req.heightFt() != null) listing.setHeightFt(req.heightFt());
        if (req.groundHeightFt() != null) listing.setGroundHeightFt(req.groundHeightFt());

        if (req.facing() != null) {
            listing.setFacing(lovService.parseFacing(req.facing()));
        }

        if (req.trafficType() != null) {
            TrafficType trafficType = lovService.parse(TrafficType.class, req.trafficType(), ErrorCode.INVALID_TRAFFIC_TYPE);
            listing.setTrafficType(trafficType);
            listing.setTrafficTypeOther(trafficType == TrafficType.OTHER ? blankToNull(req.trafficTypeOther()) : null);
        } else if (req.trafficTypeOther() != null && listing.getTrafficType() == TrafficType.OTHER) {
            listing.setTrafficTypeOther(blankToNull(req.trafficTypeOther()));
        }

        if (req.audienceType() != null) {
            AudienceType audienceType = lovService.parse(AudienceType.class, req.audienceType(), ErrorCode.INVALID_AUDIENCE_TYPE);
            listing.setAudienceType(audienceType);
            listing.setAudienceTypeOther(audienceType == AudienceType.OTHER ? blankToNull(req.audienceTypeOther()) : null);
        } else if (req.audienceTypeOther() != null && listing.getAudienceType() == AudienceType.OTHER) {
            listing.setAudienceTypeOther(blankToNull(req.audienceTypeOther()));
        }

        if (req.footfall() != null) listing.setFootfall(blankToNull(req.footfall()));
        if (req.startPrice() != null) listing.setStartPrice(req.startPrice());

        if (req.minBookingValue() != null || req.minBookingUnit() != null) {
            Integer value = req.minBookingValue() != null ? req.minBookingValue() : listing.getMinBookingValue();
            BookingDurationUnit unit = req.minBookingUnit() != null ? lovService.parseBookingDurationUnit(req.minBookingUnit()) : listing.getMinBookingUnit();
            listing.setMinBookingValue(value);
            listing.setMinBookingUnit(unit);
            listing.setMinBookingDays(unit != null && value != null ? unit.toDays(value) : null);
        }

        if (req.discountNote() != null) listing.setDiscountNote(blankToNull(req.discountNote()));

        Address addr = listing.getAddress();
        if (addr == null && (req.addressLine1() != null || req.city() != null || req.state() != null || req.pincode() != null)) {
            addr = new Address();
            listing.setAddress(addr);
        }
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

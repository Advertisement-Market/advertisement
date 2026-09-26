package com.theadbasket.backend.registration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.auth.AuthService;
import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.config.RolePolicyProperties;
import com.theadbasket.backend.lov.AudienceType;
import com.theadbasket.backend.lov.BillboardType;
import com.theadbasket.backend.lov.BookingDurationUnit;
import com.theadbasket.backend.lov.FacingDirection;
import com.theadbasket.backend.lov.LovService;
import com.theadbasket.backend.lov.TrafficType;
import com.theadbasket.backend.notification.NotificationCategory;
import com.theadbasket.backend.notification.NotificationService;
import com.theadbasket.backend.notification.NotificationTone;
import com.theadbasket.backend.owner.BillboardListing;
import com.theadbasket.backend.owner.BillboardListingRepository;
import com.theadbasket.backend.owner.OwnerProfile;
import com.theadbasket.backend.owner.OwnerProfileRepository;
import static com.theadbasket.backend.registration.AccountRegistrar.blankToNull;
import com.theadbasket.backend.registration.dto.BillboardListingRequest;
import com.theadbasket.backend.registration.dto.OwnerRegistrationRequest;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;

/**
 * Owner onboarding: account (attach/create) + owner profile + first billboard
 * listing.
 */
@Service
public class OwnerRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(OwnerRegistrationService.class);

    private final AccountRegistrar accountRegistrar;
    private final AuthService authService;
    private final OwnerProfileRepository ownerProfileRepository;
    private final BillboardListingRepository billboardListingRepository;
    private final RolePolicyProperties rolePolicyProperties;
    private final NotificationService notificationService;
    private final LovService lovService;

    public OwnerRegistrationService(AccountRegistrar accountRegistrar,
            AuthService authService,
            OwnerProfileRepository ownerProfileRepository,
            BillboardListingRepository billboardListingRepository,
            RolePolicyProperties rolePolicyProperties,
            NotificationService notificationService,
            LovService lovService) {
        this.accountRegistrar = accountRegistrar;
        this.authService = authService;
        this.ownerProfileRepository = ownerProfileRepository;
        this.billboardListingRepository = billboardListingRepository;
        this.rolePolicyProperties = rolePolicyProperties;
        this.notificationService = notificationService;
        this.lovService = lovService;
    }

    @Transactional
    public AuthResponse register(OwnerRegistrationRequest request, Long currentUserId) {
        if (!rolePolicyProperties.isEnabled(Role.OWNER)) {
            throw new BadRequestException(ErrorCode.OWNER_REGISTRATION_UNAVAILABLE);
        }

        User user = accountRegistrar.attachOrCreate(currentUserId, request.firstName().trim(),
                request.lastName().trim(), request.accountEmail(), request.password(), request.phone(),
                Role.OWNER);
        Address address = Address.of(
                request.addressLine1(),
                request.addressLine2(),
                request.landmark(),
                request.city(),
                request.state(),
                request.pincode()
        );

        OwnerProfile profile = new OwnerProfile();
        profile.setUser(user);
        profile.setCompanyName(request.companyName().trim());
        profile.setCompanyPhone(blankToNull(request.companyPhone()));
        profile.setCompanyRegNumber(blankToNull(request.companyRegNumber()));
        profile.setGstNumber(blankToNull(request.gstNumber()));
        profile.setAddress(address);
        profile.setTradeLicenseNo(blankToNull(request.tradeLicenseNo()));
        profile.setOwnershipType(blankToNull(request.ownershipType()));
        profile.setRegulatoryApprovals(blankToNull(request.regulatoryApprovals()));
        ownerProfileRepository.save(profile);

        BillboardListing listing = toListing(request.billboard(), user);
        billboardListingRepository.save(listing);

        notificationService.createNotification(
                user,
                "Welcome to The AdBasket!",
                "Your account is registered. Your listing \"" + listing.getName() + "\" is under review and will be active shortly.",
                NotificationCategory.ONBOARDING,
                NotificationTone.TEAL,
                "/owners/dashboard"
        );

        log.info("Owner registration complete for user id={}", user.getId());
        return authService.issueTokensFor(user);
    }

    private BillboardListing toListing(BillboardListingRequest req, User user) {
        Address address = Address.of(
                req.addressLine1(),
                req.addressLine2(),
                req.landmark(),
                req.city(),
                req.state(),
                req.pincode()
        );

        // Config-driven LOVs: reject unknown values, keep the free text only for OTHER.
        BillboardType type = lovService.parse(BillboardType.class, req.type(), ErrorCode.INVALID_BILLBOARD_TYPE);
        TrafficType trafficType = lovService.parse(TrafficType.class, req.trafficType(), ErrorCode.INVALID_TRAFFIC_TYPE);
        AudienceType audienceType = lovService.parse(AudienceType.class, req.audienceType(), ErrorCode.INVALID_AUDIENCE_TYPE);
        // Static LOV: facing must be one of the eight compass directions.
        FacingDirection facing = lovService.parseFacing(req.facing());
        // Minimum booking: keep what the owner picked (value + unit) and the normalized day count.
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
        return listing;
    }
}

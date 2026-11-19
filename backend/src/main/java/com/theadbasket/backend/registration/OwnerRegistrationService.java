package com.theadbasket.backend.registration;

import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.auth.AuthService;
import com.theadbasket.backend.auth.RefreshTokenService;
import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.availability.AvailabilityService;
import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.ConflictException;
import com.theadbasket.backend.common.exception.ForbiddenException;
import com.theadbasket.backend.common.exception.UnauthorizedException;
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
import com.theadbasket.backend.registration.dto.OwnerOnboardingRequest;
import com.theadbasket.backend.registration.dto.OwnerRegistrationRequest;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;

/**
 * Owner registration & authenticated promotion:
 * <ul>
 *   <li>{@link #registerAnonymous(OwnerRegistrationRequest)}: strictly anonymous sign-up creating a
 *       new {@code OWNER} account, profile, and initial listing.</li>
 *   <li>{@link #onboardMember(Long, OwnerOnboardingRequest)}: strictly authenticated
 *       {@code MEMBER -> OWNER} promotion under a pessimistic row lock with full refresh-token
 *       rotation.</li>
 * </ul>
 */
@Service
public class OwnerRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(OwnerRegistrationService.class);

    private final AccountRegistrar accountRegistrar;
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final BillboardListingRepository billboardListingRepository;
    private final RolePolicyProperties rolePolicyProperties;
    private final NotificationService notificationService;
    private final LovService lovService;
    private final AvailabilityService availabilityService;

    public OwnerRegistrationService(AccountRegistrar accountRegistrar,
            AuthService authService,
            RefreshTokenService refreshTokenService,
            UserRepository userRepository,
            OwnerProfileRepository ownerProfileRepository,
            BillboardListingRepository billboardListingRepository,
            RolePolicyProperties rolePolicyProperties,
            NotificationService notificationService,
            LovService lovService,
            AvailabilityService availabilityService) {
        this.accountRegistrar = accountRegistrar;
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
        this.ownerProfileRepository = ownerProfileRepository;
        this.billboardListingRepository = billboardListingRepository;
        this.rolePolicyProperties = rolePolicyProperties;
        this.notificationService = notificationService;
        this.lovService = lovService;
        this.availabilityService = availabilityService;
    }

    /**
     * Strictly anonymous owner registration ({@code POST /api/auth/register/owner}).
     */
    @Transactional
    public AuthResponse registerAnonymous(OwnerRegistrationRequest request) {
        if (!rolePolicyProperties.isEnabled(Role.OWNER)) {
            throw new BadRequestException(ErrorCode.OWNER_REGISTRATION_UNAVAILABLE);
        }

        User user = accountRegistrar.createAnonymous(
                request.firstName().trim(),
                request.lastName().trim(),
                request.accountEmail(),
                request.password(),
                request.phone(),
                Role.OWNER);

        Address address = Address.of(
                request.addressLine1(),
                request.addressLine2(),
                request.landmark(),
                request.city(),
                request.state(),
                request.pincode());

        BillboardListing savedListing = persistOwnerArtifacts(
                user,
                request.companyName(),
                request.companyPhone(),
                request.companyRegNumber(),
                request.gstNumber(),
                address,
                request.tradeLicenseNo(),
                request.ownershipType(),
                request.regulatoryApprovals(),
                request.billboard());

        log.info("Anonymous owner registration complete for user id={}", user.getId());
        return authService.issueTokensFor(user, savedListing.getId());
    }

    /**
     * Strictly authenticated {@code MEMBER -> OWNER} promotion ({@code POST /api/onboarding/owner}).
     * Acquires a pessimistic write lock on the user row, enforces role and account-status guards,
     * persists the owner profile and initial listing, revokes all prior refresh tokens, and mints a
     * fresh {@code OWNER} token pair.
     */
    @Transactional
    public AuthResponse onboardMember(Long userId, OwnerOnboardingRequest request) {
        if (!rolePolicyProperties.isEnabled(Role.OWNER)) {
            throw new BadRequestException(ErrorCode.OWNER_REGISTRATION_UNAVAILABLE);
        }

        // First DB query in this transaction (OSIV is off): lock row so concurrent retries serialize.
        User user = userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.SESSION_INVALID));

        if (!user.isEnabled()) {
            throw new ForbiddenException(ErrorCode.ACCOUNT_DISABLED);
        }

        if (user.getRole() == Role.OWNER) {
            throw new ConflictException(ErrorCode.ALREADY_REGISTERED, "owner");
        }
        if (user.getRole() != Role.MEMBER) {
            String roleName = user.getRole() == null
                    ? "another role"
                    : user.getRole().name().toLowerCase(Locale.ROOT);
            throw new ConflictException(ErrorCode.ROLE_CONFLICT, roleName);
        }

        // Safe profile sync: never touch email, emailVerified, or password; only fill blank phone.
        String trimmedFirst = request.firstName().trim();
        if (!trimmedFirst.isEmpty()) {
            user.setFirstName(trimmedFirst);
        }
        String trimmedLast = request.lastName().trim();
        if (!trimmedLast.isEmpty()) {
            user.setLastName(trimmedLast);
        }
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            String incomingPhone = blankToNull(request.phone());
            if (incomingPhone != null) {
                user.setPhone(incomingPhone);
            }
        }

        user.setRole(Role.OWNER);
        user = userRepository.saveAndFlush(user);

        Address address = Address.of(
                request.addressLine1(),
                request.addressLine2(),
                request.landmark(),
                request.city(),
                request.state(),
                request.pincode());

        BillboardListing savedListing = persistOwnerArtifacts(
                user,
                request.companyName(),
                request.companyPhone(),
                request.companyRegNumber(),
                request.gstNumber(),
                address,
                request.tradeLicenseNo(),
                request.ownershipType(),
                request.regulatoryApprovals(),
                request.billboard());

        // Strict order: revoke all existing MEMBER refresh tokens BEFORE issuing the new OWNER pair.
        refreshTokenService.revokeAllForUser(user.getId());

        log.info("Authenticated owner onboarding complete for user id={}", user.getId());
        return authService.issueTokensFor(user, savedListing.getId());
    }

    private BillboardListing persistOwnerArtifacts(
            User user,
            String companyName,
            String companyPhone,
            String companyRegNumber,
            String gstNumber,
            Address businessAddress,
            String tradeLicenseNo,
            String ownershipType,
            String regulatoryApprovals,
            BillboardListingRequest billboardRequest) {

        OwnerProfile profile = new OwnerProfile();
        profile.setUser(user);
        profile.setCompanyName(companyName.trim());
        profile.setCompanyPhone(blankToNull(companyPhone));
        profile.setCompanyRegNumber(blankToNull(companyRegNumber));
        profile.setGstNumber(blankToNull(gstNumber));
        profile.setAddress(businessAddress);
        profile.setTradeLicenseNo(blankToNull(tradeLicenseNo));
        profile.setOwnershipType(blankToNull(ownershipType));
        profile.setRegulatoryApprovals(blankToNull(regulatoryApprovals));
        ownerProfileRepository.save(profile);

        BillboardListing listing = toListing(billboardRequest, user);
        BillboardListing savedListing = billboardListingRepository.save(listing);

        availabilityService.createInitialOwnerBlocks(
                savedListing.getId(), user.getId(), billboardRequest.blockedRanges());

        notificationService.createNotification(
                user,
                "Welcome to The AdBasket!",
                "Your account is registered. Your listing \"" + savedListing.getName() + "\" is under review and will be active shortly.",
                NotificationCategory.ONBOARDING,
                NotificationTone.TEAL,
                "/owners/dashboard"
        );

        return savedListing;
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

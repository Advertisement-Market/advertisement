package com.theadbasket.backend.registration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.auth.AuthService;
import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.config.RolePolicyProperties;
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

    public OwnerRegistrationService(AccountRegistrar accountRegistrar,
            AuthService authService,
            OwnerProfileRepository ownerProfileRepository,
            BillboardListingRepository billboardListingRepository,
            RolePolicyProperties rolePolicyProperties) {
        this.accountRegistrar = accountRegistrar;
        this.authService = authService;
        this.ownerProfileRepository = ownerProfileRepository;
        this.billboardListingRepository = billboardListingRepository;
        this.rolePolicyProperties = rolePolicyProperties;
    }

    @Transactional
    public AuthResponse register(OwnerRegistrationRequest request, Long currentUserId) {
        if (!rolePolicyProperties.isEnabled(Role.OWNER)) {
            throw new BadRequestException("Owner registration is currently unavailable. Please try again later.");
        }

        User user = accountRegistrar.attachOrCreate(currentUserId, request.firstName().trim(),
                request.lastName().trim(), request.accountEmail(), request.password(), request.phone(),
                Role.OWNER);
        Address address = new Address();
        address.setLine1(request.addressLine1().trim());
        address.setLine2(blankToNull(request.addressLine2()));
        address.setLandmark(blankToNull(request.landmark()));
        address.setCity(request.city().trim());
        address.setState(request.state().trim());
        address.setPincode(request.pincode().trim());

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

        billboardListingRepository.save(toListing(request.billboard(), user));
        log.info("Owner registration complete for user id={}", user.getId());
        return authService.issueTokensFor(user);
    }

    private BillboardListing toListing(BillboardListingRequest req, User user) {
        Address address = new Address();
        address.setLine1(req.addressLine1().trim());
        address.setLine2(blankToNull(req.addressLine2()));
        address.setLandmark(blankToNull(req.landmark()));
        address.setCity(req.city().trim());
        address.setState(req.state().trim());
        address.setPincode(req.pincode().trim());

        BillboardListing listing = new BillboardListing();
        listing.setUser(user);
        listing.setName(req.name().trim());
        listing.setAddress(address);
        listing.setType(req.type());
        listing.setWidthFt(req.widthFt());
        listing.setHeightFt(req.heightFt());
        listing.setGroundHeightFt(req.groundHeightFt());
        listing.setFacing(req.facing());
        listing.setTrafficType(req.trafficType());
        listing.setAudienceType(req.audienceType());
        listing.setFootfall(blankToNull(req.footfall()));
        listing.setStartPrice(req.startPrice());
        listing.setMinBooking(req.minBooking());
        listing.setDiscountNote(blankToNull(req.discountNote()));
        return listing;
    }
}

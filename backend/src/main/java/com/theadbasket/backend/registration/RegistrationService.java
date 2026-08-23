package com.theadbasket.backend.registration;

import com.theadbasket.backend.advertiser.AdvertiserProfile;
import com.theadbasket.backend.advertiser.AdvertiserProfileRepository;
import com.theadbasket.backend.advertiser.CampaignBrief;
import com.theadbasket.backend.advertiser.CampaignBriefRepository;
import com.theadbasket.backend.agency.AgencyProfile;
import com.theadbasket.backend.agency.AgencyProfileRepository;
import com.theadbasket.backend.agency.PortfolioItem;
import com.theadbasket.backend.auth.AuthService;
import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.EmailAlreadyExistsException;
import com.theadbasket.backend.owner.BillboardListing;
import com.theadbasket.backend.owner.BillboardListingRepository;
import com.theadbasket.backend.owner.OwnerProfile;
import com.theadbasket.backend.owner.OwnerProfileRepository;
import com.theadbasket.backend.registration.dto.AdvertiserRegistrationRequest;
import com.theadbasket.backend.registration.dto.AgencyRegistrationRequest;
import com.theadbasket.backend.registration.dto.BillboardListingRequest;
import com.theadbasket.backend.registration.dto.CampaignBriefRequest;
import com.theadbasket.backend.registration.dto.OwnerRegistrationRequest;
import com.theadbasket.backend.registration.dto.PortfolioItemRequest;
import com.theadbasket.backend.user.AuthProvider;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Completes a role registration from the onboarding wizards. When the caller is already signed in
 * the role + profile are attached to that existing account (promoting it from MEMBER); otherwise a
 * brand-new account is created. Either way a role profile + first onboarding object are saved and
 * fresh auth tokens are issued — all in one transaction.
 */
@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final AdvertiserProfileRepository advertiserProfileRepository;
    private final CampaignBriefRepository campaignBriefRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final BillboardListingRepository billboardListingRepository;
    private final AgencyProfileRepository agencyProfileRepository;

    public RegistrationService(UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               AuthService authService,
                               AdvertiserProfileRepository advertiserProfileRepository,
                               CampaignBriefRepository campaignBriefRepository,
                               OwnerProfileRepository ownerProfileRepository,
                               BillboardListingRepository billboardListingRepository,
                               AgencyProfileRepository agencyProfileRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.advertiserProfileRepository = advertiserProfileRepository;
        this.campaignBriefRepository = campaignBriefRepository;
        this.ownerProfileRepository = ownerProfileRepository;
        this.billboardListingRepository = billboardListingRepository;
        this.agencyProfileRepository = agencyProfileRepository;
    }

    @Transactional
    public AuthResponse registerAdvertiser(AdvertiserRegistrationRequest request, User currentUser) {
        User user = attachOrCreate(currentUser, request.contactName().trim(), null, request.loginEmail(),
                request.password(), request.contactPhone(), Role.ADVERTISER);

        AdvertiserProfile profile = new AdvertiserProfile();
        profile.setUser(user);
        profile.setCompanyName(request.companyName().trim());
        profile.setBusinessType(request.businessType());
        profile.setWebsite(blankToNull(request.website()));
        profile.setGstNumber(blankToNull(request.gstNumber()));
        profile.setPanNumber(blankToNull(request.panNumber()));
        profile.setContactDesignation(request.contactDesignation());
        profile.setContactEmail(request.contactEmail().trim().toLowerCase());
        profile.setOfficeAddress(request.officeAddress());
        profile.setPincode(request.pincode());
        profile.setIndustries(new ArrayList<>(request.industries()));
        advertiserProfileRepository.save(profile);

        campaignBriefRepository.save(toBrief(request.project(), user));
        return authService.issueTokensFor(user);
    }

    @Transactional
    public AuthResponse registerOwner(OwnerRegistrationRequest request, User currentUser) {
        User user = attachOrCreate(currentUser, request.firstName().trim(), request.lastName().trim(),
                request.email(), request.password(), request.phone(), Role.OWNER);

        OwnerProfile profile = new OwnerProfile();
        profile.setUser(user);
        profile.setCompanyName(request.companyName().trim());
        profile.setCompanyPhone(blankToNull(request.companyPhone()));
        profile.setCompanyRegNumber(blankToNull(request.companyRegNumber()));
        profile.setGstNumber(blankToNull(request.gstNumber()));
        profile.setBusinessAddressLine1(request.businessAddressLine1());
        profile.setBusinessAddressLine2(blankToNull(request.businessAddressLine2()));
        profile.setBusinessPincode(request.businessPincode());
        profile.setTradeLicenseNo(blankToNull(request.tradeLicenseNo()));
        profile.setOwnershipType(blankToNull(request.ownershipType()));
        profile.setRegulatoryApprovals(blankToNull(request.regulatoryApprovals()));
        ownerProfileRepository.save(profile);

        billboardListingRepository.save(toListing(request.billboard(), user));
        return authService.issueTokensFor(user);
    }

    @Transactional
    public AuthResponse registerAgency(AgencyRegistrationRequest request, User currentUser) {
        User user = attachOrCreate(currentUser, request.firstName().trim(), request.lastName().trim(),
                request.loginEmail(), request.password(), request.contactPhone(), Role.AGENCY);

        AgencyProfile profile = new AgencyProfile();
        profile.setUser(user);
        profile.setAgencyName(request.agencyName().trim());
        profile.setAgencyType(request.agencyType());
        profile.setYearEstablished(request.yearEstablished());
        profile.setYearsExperience(request.yearsExperience());
        profile.setTagline(blankToNull(request.tagline()));
        profile.setAbout(blankToNull(request.about()));
        profile.setWebsite(blankToNull(request.website()));
        profile.setLandline(blankToNull(request.landline()));
        profile.setLinkedinUrl(blankToNull(request.linkedinUrl()));
        profile.setHeadquartersPincode(request.headquartersPincode());
        profile.setOfficeAddress(request.officeAddress());
        profile.setContactDesignation(request.contactDesignation());
        profile.setCampaignsCompleted(request.campaignsCompleted());
        profile.setPricingModel(request.pricingModel());
        profile.setGeoCoverage(request.geoCoverage());
        profile.setMinTenderBudget(blankToNull(request.minTenderBudget()));
        profile.setCoverageCities(blankToNull(request.coverageCities()));
        profile.setRegNumber(blankToNull(request.regNumber()));
        profile.setGstNumber(blankToNull(request.gstNumber()));
        profile.setPanNumber(blankToNull(request.panNumber()));
        profile.setKeyClients(blankToNull(request.keyClients()));
        profile.setServices(new ArrayList<>(request.services()));
        profile.setIndustries(new ArrayList<>(request.industries()));
        profile.setExpertiseTags(new ArrayList<>(nullToEmpty(request.expertiseTags())));
        profile.setLanguages(new ArrayList<>(nullToEmpty(request.languages())));
        profile.setPortfolio(toPortfolio(request.portfolio()));
        agencyProfileRepository.save(profile);

        return authService.issueTokensFor(user);
    }

    // ── helpers ──

    /**
     * Attaches the target role to the signed-in account, or creates a new account when anonymous.
     *
     * <ul>
     *   <li><b>Signed in:</b> promotes a {@code MEMBER} to {@code role}. If the account has no
     *       password yet (Google) and one was supplied, it is validated and set; otherwise the
     *       password fields are ignored. An already-onboarded account is rejected (single role).</li>
     *   <li><b>Anonymous:</b> requires email + password (length-checked) and creates a LOCAL account.</li>
     * </ul>
     */
    private User attachOrCreate(User current, String firstName, String lastName, String rawEmail,
                                String rawPassword, String phone, Role role) {
        if (current != null) {
            User user = userRepository.findById(current.getId())
                    .orElseThrow(() -> new BadRequestException("Your session is no longer valid. Please sign in again."));
            if (user.getRole() != null && user.getRole().isOnboarded()) {
                throw new BadRequestException(
                        "This account is already registered as " + user.getRole().name().toLowerCase() + ".");
            }
            user.setRole(role);
            if (!user.hasPassword() && rawPassword != null && !rawPassword.isBlank()) {
                authService.validateNewPassword(rawPassword);
                user.setPasswordHash(passwordEncoder.encode(rawPassword));
            }
            return userRepository.save(user);
        }

        if (rawEmail == null || rawEmail.isBlank()) {
            throw new BadRequestException("Login email is required to create an account.");
        }
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new BadRequestException("Password is required to create an account.");
        }
        authService.validateNewPassword(rawPassword);
        String email = rawEmail.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException(email);
        }
        User user = new User(firstName, blankToNull(lastName), email,
                passwordEncoder.encode(rawPassword), blankToNull(phone), role);
        user.setAuthProvider(AuthProvider.LOCAL);
        return userRepository.save(user);
    }

    private CampaignBrief toBrief(CampaignBriefRequest req, User user) {
        CampaignBrief brief = new CampaignBrief();
        brief.setUser(user);
        brief.setTitle(req.title().trim());
        brief.setDescription(req.description());
        brief.setTargetAudience(req.targetAudience());
        brief.setTargetLocation(req.targetLocation());
        brief.setStartDate(req.startDate());
        brief.setDuration(req.duration());
        brief.setBudgetMinValue(req.budgetMinValue());
        brief.setBudgetMinUnit(blankToNull(req.budgetMinUnit()));
        brief.setBudgetMaxValue(req.budgetMaxValue());
        brief.setBudgetMaxUnit(blankToNull(req.budgetMaxUnit()));
        brief.setFlexibleBudget(req.flexibleBudget());
        brief.setQuotationsRequired(req.quotationsRequired());
        brief.setAgencyPreferences(new ArrayList<>(req.agencyPreferences()));
        return brief;
    }

    private BillboardListing toListing(BillboardListingRequest req, User user) {
        BillboardListing listing = new BillboardListing();
        listing.setUser(user);
        listing.setName(req.name().trim());
        listing.setPincode(req.pincode());
        listing.setAddress(req.address());
        listing.setLandmark(blankToNull(req.landmark()));
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

    private List<PortfolioItem> toPortfolio(List<PortfolioItemRequest> items) {
        List<PortfolioItem> result = new ArrayList<>();
        for (PortfolioItemRequest item : nullToEmpty(items)) {
            result.add(new PortfolioItem(item.title().trim(), blankToNull(item.meta())));
        }
        return result;
    }

    private static <T> List<T> nullToEmpty(List<T> list) {
        return list == null ? List.of() : list;
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}

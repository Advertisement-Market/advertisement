package com.theadbasket.backend.registration;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.theadbasket.backend.agency.AgencyProfile;
import com.theadbasket.backend.agency.AgencyProfileRepository;
import com.theadbasket.backend.agency.PortfolioItem;
import com.theadbasket.backend.auth.AuthService;
import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.common.address.Address;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.config.RolePolicyProperties;
import static com.theadbasket.backend.registration.AccountRegistrar.blankToNull;
import static com.theadbasket.backend.registration.AccountRegistrar.nullToEmpty;
import com.theadbasket.backend.registration.dto.AgencyRegistrationRequest;
import com.theadbasket.backend.registration.dto.PortfolioItemRequest;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;

/**
 * Agency onboarding: account (attach/create) + agency profile with services,
 * industries & portfolio.
 */
@Service
public class AgencyRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(AgencyRegistrationService.class);

    private final AccountRegistrar accountRegistrar;
    private final AuthService authService;
    private final AgencyProfileRepository agencyProfileRepository;
    private final RolePolicyProperties rolePolicyProperties;

    public AgencyRegistrationService(AccountRegistrar accountRegistrar,
            AuthService authService,
            AgencyProfileRepository agencyProfileRepository,
            RolePolicyProperties rolePolicyProperties) {
        this.accountRegistrar = accountRegistrar;
        this.authService = authService;
        this.agencyProfileRepository = agencyProfileRepository;
        this.rolePolicyProperties = rolePolicyProperties;
    }

    @Transactional
    public AuthResponse register(AgencyRegistrationRequest request, Long currentUserId) {
        if (!rolePolicyProperties.isEnabled(Role.AGENCY)) {
            throw new BadRequestException("Agency registration is currently unavailable. Please try again later.");
        }

        User user = accountRegistrar.attachOrCreate(currentUserId, request.firstName().trim(),
                request.lastName().trim(), request.accountEmail(), request.password(), request.contactPhone(),
                Role.AGENCY);
        Address address = new Address();
        address.setLine1(request.addressLine1().trim());
        address.setLine2(blankToNull(request.addressLine2()));
        address.setLandmark(blankToNull(request.landmark()));
        address.setCity(request.city().trim());
        address.setState(request.state().trim());
        address.setPincode(request.pincode().trim());

        AgencyProfile profile = new AgencyProfile();
        profile.setUser(user);
        profile.setAgencyName(request.agencyName().trim());
        profile.setAgencyType(request.agencyType());
        profile.setYearEstablished(request.yearEstablished());
        profile.setYearsExperience(request.yearsExperience());
        profile.setTagline(blankToNull(request.tagline()));
        profile.setAbout(blankToNull(request.about()));
        profile.setWebsite(blankToNull(request.website()));
        profile.setContactNo(blankToNull(request.contactNo()));
        profile.setLinkedinUrl(blankToNull(request.linkedinUrl()));
        profile.setAddress(address);
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

        log.info("Agency registration complete for user id={}", user.getId());
        return authService.issueTokensFor(user);
    }

    private List<PortfolioItem> toPortfolio(List<PortfolioItemRequest> items) {
        List<PortfolioItem> result = new ArrayList<>();
        for (PortfolioItemRequest item : nullToEmpty(items)) {
            result.add(new PortfolioItem(item.title().trim(), blankToNull(item.meta())));
        }
        return result;
    }
}

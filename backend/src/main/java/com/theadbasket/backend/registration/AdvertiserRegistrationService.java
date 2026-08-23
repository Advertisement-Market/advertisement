package com.theadbasket.backend.registration;

import static com.theadbasket.backend.registration.AccountRegistrar.blankToNull;

import com.theadbasket.backend.advertiser.AdvertiserProfile;
import com.theadbasket.backend.advertiser.AdvertiserProfileRepository;
import com.theadbasket.backend.advertiser.CampaignBrief;
import com.theadbasket.backend.advertiser.CampaignBriefRepository;
import com.theadbasket.backend.auth.AuthService;
import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.registration.dto.AdvertiserRegistrationRequest;
import com.theadbasket.backend.registration.dto.CampaignBriefRequest;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import java.util.ArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Advertiser onboarding: account (attach/create) + advertiser profile + first campaign brief. */
@Service
public class AdvertiserRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(AdvertiserRegistrationService.class);

    private final AccountRegistrar accountRegistrar;
    private final AuthService authService;
    private final AdvertiserProfileRepository advertiserProfileRepository;
    private final CampaignBriefRepository campaignBriefRepository;

    public AdvertiserRegistrationService(AccountRegistrar accountRegistrar,
                                         AuthService authService,
                                         AdvertiserProfileRepository advertiserProfileRepository,
                                         CampaignBriefRepository campaignBriefRepository) {
        this.accountRegistrar = accountRegistrar;
        this.authService = authService;
        this.advertiserProfileRepository = advertiserProfileRepository;
        this.campaignBriefRepository = campaignBriefRepository;
    }

    @Transactional
    public AuthResponse register(AdvertiserRegistrationRequest request, Long currentUserId) {
        User user = accountRegistrar.attachOrCreate(currentUserId, request.firstName().trim(),
                request.lastName(), request.accountEmail(), request.password(), request.contactPhone(),
                Role.ADVERTISER);

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
        log.info("Advertiser registration complete for user id={}", user.getId());
        return authService.issueTokensFor(user);
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
}

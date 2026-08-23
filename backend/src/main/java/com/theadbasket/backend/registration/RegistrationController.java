package com.theadbasket.backend.registration;

import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.registration.dto.AdvertiserRegistrationRequest;
import com.theadbasket.backend.registration.dto.AgencyRegistrationRequest;
import com.theadbasket.backend.registration.dto.OwnerRegistrationRequest;
import com.theadbasket.backend.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Role-specific registration endpoints backing the onboarding wizards. When a bearer token is
 * present the role is attached to that signed-in account; otherwise a new account is created.
 * Either way the response contains fresh tokens + the (now onboarded) user. Each role is handled
 * by its own focused service.
 */
@RestController
@RequestMapping("/api/auth/register")
public class RegistrationController {

    private final AdvertiserRegistrationService advertiserRegistrationService;
    private final OwnerRegistrationService ownerRegistrationService;
    private final AgencyRegistrationService agencyRegistrationService;

    public RegistrationController(AdvertiserRegistrationService advertiserRegistrationService,
                                  OwnerRegistrationService ownerRegistrationService,
                                  AgencyRegistrationService agencyRegistrationService) {
        this.advertiserRegistrationService = advertiserRegistrationService;
        this.ownerRegistrationService = ownerRegistrationService;
        this.agencyRegistrationService = agencyRegistrationService;
    }

    @PostMapping("/advertiser")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerAdvertiser(@Valid @RequestBody AdvertiserRegistrationRequest request,
                                           @AuthenticationPrincipal AuthenticatedUser principal) {
        return advertiserRegistrationService.register(request, currentUserId(principal));
    }

    @PostMapping("/owner")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerOwner(@Valid @RequestBody OwnerRegistrationRequest request,
                                      @AuthenticationPrincipal AuthenticatedUser principal) {
        return ownerRegistrationService.register(request, currentUserId(principal));
    }

    @PostMapping("/agency")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerAgency(@Valid @RequestBody AgencyRegistrationRequest request,
                                       @AuthenticationPrincipal AuthenticatedUser principal) {
        return agencyRegistrationService.register(request, currentUserId(principal));
    }

    /** The signed-in user's id, or {@code null} for an anonymous (new-account) registration. */
    private static Long currentUserId(AuthenticatedUser principal) {
        return principal != null ? principal.id() : null;
    }
}

package com.theadbasket.backend.registration;

import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.registration.dto.AdvertiserRegistrationRequest;
import com.theadbasket.backend.registration.dto.AgencyRegistrationRequest;
import com.theadbasket.backend.registration.dto.OwnerRegistrationRequest;
import com.theadbasket.backend.security.SecurityUser;
import com.theadbasket.backend.user.User;
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
 * Either way the response contains fresh tokens + the (now onboarded) user.
 */
@RestController
@RequestMapping("/api/auth/register")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/advertiser")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerAdvertiser(@Valid @RequestBody AdvertiserRegistrationRequest request,
                                           @AuthenticationPrincipal SecurityUser principal) {
        return registrationService.registerAdvertiser(request, currentUser(principal));
    }

    @PostMapping("/owner")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerOwner(@Valid @RequestBody OwnerRegistrationRequest request,
                                      @AuthenticationPrincipal SecurityUser principal) {
        return registrationService.registerOwner(request, currentUser(principal));
    }

    @PostMapping("/agency")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerAgency(@Valid @RequestBody AgencyRegistrationRequest request,
                                       @AuthenticationPrincipal SecurityUser principal) {
        return registrationService.registerAgency(request, currentUser(principal));
    }

    /** The signed-in domain user, or {@code null} for an anonymous (new-account) registration. */
    private static User currentUser(SecurityUser principal) {
        return principal != null ? principal.getDomainUser() : null;
    }
}

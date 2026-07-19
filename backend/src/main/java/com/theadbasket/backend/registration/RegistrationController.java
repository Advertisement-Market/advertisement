package com.theadbasket.backend.registration;

import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.registration.dto.AdvertiserRegistrationRequest;
import com.theadbasket.backend.registration.dto.AgencyRegistrationRequest;
import com.theadbasket.backend.registration.dto.OwnerRegistrationRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Role-specific registration endpoints backing the frontend onboarding wizards.
 * Each creates the account + role profile + first onboarding object and returns auth tokens.
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
    public AuthResponse registerAdvertiser(@Valid @RequestBody AdvertiserRegistrationRequest request) {
        return registrationService.registerAdvertiser(request);
    }

    @PostMapping("/owner")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerOwner(@Valid @RequestBody OwnerRegistrationRequest request) {
        return registrationService.registerOwner(request);
    }

    @PostMapping("/agency")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerAgency(@Valid @RequestBody AgencyRegistrationRequest request) {
        return registrationService.registerAgency(request);
    }
}

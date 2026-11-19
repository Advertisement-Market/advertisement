package com.theadbasket.backend.registration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.theadbasket.backend.auth.AuthCookieService;
import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.registration.dto.OwnerOnboardingRequest;
import com.theadbasket.backend.security.AuthenticatedUser;

import jakarta.validation.Valid;

/**
 * Authenticated role-promotion endpoints for signed-in {@code MEMBER} accounts onboarding into a
 * marketplace role. Protected by {@code SecurityConfig} ({@code /api/onboarding/**} requires
 * authentication), so missing or expired access tokens return HTTP 401 by construction and trigger
 * automatic client refresh.
 */
@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private final OwnerRegistrationService ownerRegistrationService;
    private final AuthCookieService cookieService;

    public OnboardingController(OwnerRegistrationService ownerRegistrationService,
                                AuthCookieService cookieService) {
        this.ownerRegistrationService = ownerRegistrationService;
        this.cookieService = cookieService;
    }

    @PostMapping("/owner")
    public ResponseEntity<AuthResponse> onboardOwner(@Valid @RequestBody OwnerOnboardingRequest request,
                                                     @AuthenticationPrincipal AuthenticatedUser principal) {
        AuthResponse response = ownerRegistrationService.onboardMember(principal.id(), request);
        ResponseCookie cookie = cookieService.createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }
}

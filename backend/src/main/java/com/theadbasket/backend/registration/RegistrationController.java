package com.theadbasket.backend.registration;

import com.theadbasket.backend.auth.AuthCookieService;
import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.registration.dto.AdvertiserRegistrationRequest;
import com.theadbasket.backend.registration.dto.AgencyRegistrationRequest;
import com.theadbasket.backend.registration.dto.OwnerRegistrationRequest;
import com.theadbasket.backend.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
    private final AuthCookieService cookieService;

    public RegistrationController(AdvertiserRegistrationService advertiserRegistrationService,
                                  OwnerRegistrationService ownerRegistrationService,
                                  AgencyRegistrationService agencyRegistrationService,
                                  AuthCookieService cookieService) {
        this.advertiserRegistrationService = advertiserRegistrationService;
        this.ownerRegistrationService = ownerRegistrationService;
        this.agencyRegistrationService = agencyRegistrationService;
        this.cookieService = cookieService;
    }

    @PostMapping("/advertiser")
    public ResponseEntity<AuthResponse> registerAdvertiser(@Valid @RequestBody AdvertiserRegistrationRequest request,
                                                           @AuthenticationPrincipal AuthenticatedUser principal) {
        AuthResponse response = advertiserRegistrationService.register(request, currentUserId(principal));
        ResponseCookie cookie = cookieService.createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/owner")
    public ResponseEntity<AuthResponse> registerOwner(@Valid @RequestBody OwnerRegistrationRequest request,
                                                      @AuthenticationPrincipal AuthenticatedUser principal) {
        AuthResponse response = ownerRegistrationService.register(request, currentUserId(principal));
        ResponseCookie cookie = cookieService.createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/agency")
    public ResponseEntity<AuthResponse> registerAgency(@Valid @RequestBody AgencyRegistrationRequest request,
                                                       @AuthenticationPrincipal AuthenticatedUser principal) {
        AuthResponse response = agencyRegistrationService.register(request, currentUserId(principal));
        ResponseCookie cookie = cookieService.createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    /** The signed-in user's id, or {@code null} for an anonymous (new-account) registration. */
    private static Long currentUserId(AuthenticatedUser principal) {
        return principal != null ? principal.id() : null;
    }
}

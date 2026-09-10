package com.theadbasket.backend.auth;

import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.auth.dto.GoogleLoginRequest;
import com.theadbasket.backend.auth.dto.LoginRequest;
import com.theadbasket.backend.auth.dto.RefreshRequest;
import com.theadbasket.backend.auth.dto.RegisterRequest;
import com.theadbasket.backend.auth.dto.UserResponse;
import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.TokenRefreshException;
import com.theadbasket.backend.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Authentication endpoints: register, login, refresh, logout, and current user. */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService cookieService;

    public AuthController(AuthService authService, AuthCookieService cookieService) {
        this.authService = authService;
        this.cookieService = cookieService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        ResponseCookie cookie = cookieService.createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        ResponseCookie cookie = cookieService.createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> google(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = authService.loginWithGoogle(request.idToken());
        ResponseCookie cookie = cookieService.createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = "refreshToken", required = false) String cookieToken,
            @RequestBody(required = false) RefreshRequest request) {
        String token = resolveToken(cookieToken, request);
        AuthResponse response = authService.refresh(token);
        ResponseCookie cookie = cookieService.createRefreshTokenCookie(response.refreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "refreshToken", required = false) String cookieToken,
            @RequestBody(required = false) RefreshRequest request) {
        String token = (cookieToken != null && !cookieToken.isBlank())
                ? cookieToken
                : (request != null ? request.refreshToken() : null);
        if (token != null && !token.isBlank()) {
            authService.logout(token);
        }
        ResponseCookie deletionCookie = cookieService.createDeletionCookie();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, deletionCookie.toString())
                .build();
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return authService.currentUser(principal.id());
    }

    private static String resolveToken(String cookieToken, RefreshRequest request) {
        if (cookieToken != null && !cookieToken.isBlank()) {
            return cookieToken;
        }
        if (request != null && request.refreshToken() != null && !request.refreshToken().isBlank()) {
            return request.refreshToken();
        }
        throw new TokenRefreshException(ErrorCode.TOKEN_INVALID);
    }
}

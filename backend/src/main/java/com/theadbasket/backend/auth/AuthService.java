package com.theadbasket.backend.auth;

import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.auth.dto.GoogleTokenInfo;
import com.theadbasket.backend.auth.dto.LoginRequest;
import com.theadbasket.backend.auth.dto.RegisterRequest;
import com.theadbasket.backend.auth.dto.UserResponse;
import com.theadbasket.backend.common.exception.BadRequestException;
import com.theadbasket.backend.common.exception.EmailAlreadyExistsException;
import com.theadbasket.backend.common.exception.InvalidCredentialsException;
import com.theadbasket.backend.config.AuthPolicyProperties;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.AuthProvider;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Registration, login (local + Google), and token refresh/rotation. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final AuthPolicyProperties policy;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService,
                       GoogleTokenVerifier googleTokenVerifier,
                       AuthPolicyProperties policy) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.policy = policy;
    }

    /** Basic (identity-only) sign-up. Role defaults to the configured default (MEMBER) when absent. */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException(email);
        }
        validateNewPassword(request.password());
        User user = new User(
                request.firstName().trim(),
                blankToNull(request.lastName()),
                email,
                passwordEncoder.encode(request.password()),
                normalizePhone(request.phone()),
                request.role() != null ? request.role() : policy.defaultRole());
        user.setAuthProvider(AuthProvider.LOCAL);
        user = userRepository.save(user);
        return issueTokensFor(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (AuthenticationException ex) {
            throw new InvalidCredentialsException();
        }
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(InvalidCredentialsException::new);
        return issueTokensFor(user);
    }

    /** Verifies a Google ID token, then signs in (linking) or creates a basic account. */
    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
        GoogleTokenInfo info = googleTokenVerifier.verify(idToken);
        String email = info.email().trim().toLowerCase();

        User user = userRepository.findByGoogleSub(info.sub())
                .or(() -> userRepository.findByEmailIgnoreCase(email))
                .orElse(null);

        if (user == null) {
            user = new User(firstNameFrom(info, email), blankToNull(info.familyName()),
                    email, null, null, policy.defaultRole());
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setGoogleSub(info.sub());
            user.setEmailVerified(info.isEmailVerified());
            user = userRepository.save(user);
        } else if (user.getGoogleSub() == null) {
            // Link Google to an existing (local) account with the same email.
            user.setGoogleSub(info.sub());
            if (info.isEmailVerified()) {
                user.setEmailVerified(true);
            }
            user = userRepository.save(user);
        }
        return issueTokensFor(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        RefreshToken current = refreshTokenService.verify(refreshToken);
        User user = current.getUser();
        // Rotate: the presented token is single-use.
        refreshTokenService.revoke(refreshToken);
        return issueTokensFor(user);
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    /** Issues a fresh access + refresh token pair for the given user (reused by registration). */
    public AuthResponse issueTokensFor(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.create(user);
        return AuthResponse.bearer(
                accessToken,
                refreshToken.getToken(),
                jwtService.getAccessTokenExpiresInSeconds(),
                UserResponse.from(user));
    }

    /** Validates a new/updated password against the configured policy (length bounds). */
    public void validateNewPassword(String raw) {
        int len = raw == null ? 0 : raw.length();
        if (len < policy.passwordMinLength() || len > policy.passwordMaxLength()) {
            throw new BadRequestException("Password must be " + policy.passwordMinLength()
                    + "-" + policy.passwordMaxLength() + " characters.");
        }
    }

    private String firstNameFrom(GoogleTokenInfo info, String email) {
        if (info.givenName() != null && !info.givenName().isBlank()) {
            return info.givenName().trim();
        }
        if (info.name() != null && !info.name().isBlank()) {
            return info.name().trim();
        }
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    private String normalizePhone(String phone) {
        return (phone == null || phone.isBlank()) ? null : phone.trim();
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}

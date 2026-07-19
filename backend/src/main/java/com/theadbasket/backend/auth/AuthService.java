package com.theadbasket.backend.auth;

import com.theadbasket.backend.auth.dto.AuthResponse;
import com.theadbasket.backend.auth.dto.LoginRequest;
import com.theadbasket.backend.auth.dto.RegisterRequest;
import com.theadbasket.backend.auth.dto.UserResponse;
import com.theadbasket.backend.common.exception.EmailAlreadyExistsException;
import com.theadbasket.backend.common.exception.InvalidCredentialsException;
import com.theadbasket.backend.security.JwtService;
import com.theadbasket.backend.user.User;
import com.theadbasket.backend.user.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Registration, login, and token refresh/rotation. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException(email);
        }
        User user = new User(
                request.firstName().trim(),
                request.lastName().trim(),
                email,
                passwordEncoder.encode(request.password()),
                normalizePhone(request.phone()),
                request.role());
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

    private String normalizePhone(String phone) {
        return (phone == null || phone.isBlank()) ? null : phone.trim();
    }
}

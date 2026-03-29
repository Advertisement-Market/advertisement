package com.billboard.marketplace.service;

import com.billboard.marketplace.dto.request.LoginRequest;
import com.billboard.marketplace.dto.request.RegisterRequest;
import com.billboard.marketplace.dto.response.LoginResponse;
import com.billboard.marketplace.dto.response.RegisterResponse;
import com.billboard.marketplace.entity.Company;
import com.billboard.marketplace.entity.RefreshToken;
import com.billboard.marketplace.entity.User;
import com.billboard.marketplace.exception.EmailAlreadyExistsException;
import com.billboard.marketplace.exception.InvalidCredentialsException;
import com.billboard.marketplace.exception.ResourceNotFoundException;
import com.billboard.marketplace.exception.UserNotFoundException;
import com.billboard.marketplace.repository.CompanyRepository;
import com.billboard.marketplace.repository.RefreshTokenRepository;
import com.billboard.marketplace.repository.UserRepository;
import com.billboard.marketplace.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletResponse httpResponse) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(UserNotFoundException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        issueRefreshTokenCookie(user, httpResponse);

        log.info("User {} logged in successfully", user.getEmail());
        return LoginResponse.builder()
                .accessToken(accessToken)
                .role(user.getRole())
                .build();
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request, HttpServletResponse httpResponse) {
        // Validate passwords match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        // Validate role — only BILLBOARD_OWNER and BUSINESS allowed via registration
        if (request.getRole() == User.Role.ADMIN) {
            throw new IllegalArgumentException("Cannot register as ADMIN");
        }

        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        // Create user
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .isVerified(false)
                .build();
        userRepository.save(user);

        // Create company profile (same transaction)
        Company company = Company.builder()
                .user(user)
                .companyName(request.getCompanyName().trim())
                .companyAddress(request.getCompanyAddress().trim())
                .gstNumber(request.getGstNumber())
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .phone(request.getPhone().trim())
                .type(request.getRole())
                .isVerified(false)
                .build();
        companyRepository.save(company);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        issueRefreshTokenCookie(user, httpResponse);

        log.info("New user registered: {} with role {}", email, user.getRole());
        return RegisterResponse.builder()
                .accessToken(accessToken)
                .role(user.getRole())
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public LoginResponse refresh(String rawRefreshToken, HttpServletResponse httpResponse) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidCredentialsException();
        }

        String tokenHash = jwtUtil.hashToken(rawRefreshToken);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(InvalidCredentialsException::new);

        if (storedToken.isRevoked()) {
            throw new InvalidCredentialsException();
        }
        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidCredentialsException();
        }

        User user = storedToken.getUser();

        // Rotate refresh token: revoke old, issue new
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);
        issueRefreshTokenCookie(user, httpResponse);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        return LoginResponse.builder()
                .accessToken(accessToken)
                .role(user.getRole())
                .build();
    }

    @Transactional
    public void logout(String userId, HttpServletResponse httpResponse) {
        refreshTokenRepository.revokeAllByUserId(userId);
        clearRefreshTokenCookie(httpResponse);
        log.info("User {} logged out, all refresh tokens revoked", userId);
    }

    // ---------- helpers ----------

    private void issueRefreshTokenCookie(User user, HttpServletResponse httpResponse) {
        String rawToken = jwtUtil.generateRawRefreshToken();
        String tokenHash = jwtUtil.hashToken(rawToken);

        java.util.Date expiryDate = jwtUtil.getRefreshTokenExpiry();
        LocalDateTime expiresAt = expiryDate.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .isRevoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        Cookie cookie = new Cookie("refreshToken", rawToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // set true in production (HTTPS)
        cookie.setPath("/auth/refresh");
        cookie.setMaxAge((int) (jwtUtil.getRefreshTokenExpiryMs() / 1000));
        httpResponse.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse httpResponse) {
        Cookie cookie = new Cookie("refreshToken", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/auth/refresh");
        cookie.setMaxAge(0);
        httpResponse.addCookie(cookie);
    }
}

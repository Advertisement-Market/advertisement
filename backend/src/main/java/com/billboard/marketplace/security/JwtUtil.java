package com.billboard.marketplace.security;

import com.billboard.marketplace.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    @Value("${app.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        // Ensure key is at least 256 bits for HS256
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters long");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(String userId, String email, User.Role role) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("role", role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiryMs))
                .signWith(getSigningKey())
                .compact();
    }

    // Generates a raw random refresh token string (stored in httpOnly cookie)
    public String generateRawRefreshToken() {
        return UUID.randomUUID().toString() + UUID.randomUUID().toString();
    }

    // SHA-256 hash of the raw token — this is what we store in DB
    public String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public Date getRefreshTokenExpiry() {
        return new Date(System.currentTimeMillis() + refreshTokenExpiryMs);
    }

    public long getRefreshTokenExpiryMs() {
        return refreshTokenExpiryMs;
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractUserId(String token) {
        return parseClaims(token).get("userId", String.class);
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired");
        } catch (MalformedJwtException e) {
            log.warn("JWT token is malformed");
        } catch (UnsupportedJwtException e) {
            log.warn("JWT token is unsupported");
        } catch (IllegalArgumentException e) {
            log.warn("JWT token is empty or null");
        } catch (JwtException e) {
            log.warn("JWT validation failed: {}", e.getMessage());
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

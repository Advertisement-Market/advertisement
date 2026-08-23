package com.theadbasket.backend.security;

import com.theadbasket.backend.config.JwtProperties;
import com.theadbasket.backend.user.Role;
import com.theadbasket.backend.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

/** Issues and validates HS256-signed JWT access tokens. */
@Service
public class JwtService {

    private final SecretKey key;
    private final Duration accessTokenExpiration;

    public JwtService(JwtProperties properties) {
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = properties.accessTokenExpiration();
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenExpiration)))
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        return parse(token).getSubject();
    }

    /** Builds the request principal straight from the token claims — no database lookup. */
    public AuthenticatedUser toPrincipal(String token) {
        Claims claims = parse(token);
        Number uid = claims.get("uid", Number.class);
        String role = claims.get("role", String.class);
        return new AuthenticatedUser(
                uid == null ? null : uid.longValue(),
                claims.getSubject(),
                role == null ? null : Role.valueOf(role));
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public long getAccessTokenExpiresInSeconds() {
        return accessTokenExpiration.toSeconds();
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

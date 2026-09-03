package com.theadbasket.backend.auth;

import com.theadbasket.backend.common.error.ErrorCode;
import com.theadbasket.backend.common.exception.TokenRefreshException;
import com.theadbasket.backend.config.JwtProperties;
import com.theadbasket.backend.user.User;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Creates, verifies, and revokes opaque refresh tokens. */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final JwtProperties jwtProperties;

    public RefreshTokenService(RefreshTokenRepository repository, JwtProperties jwtProperties) {
        this.repository = repository;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public RefreshToken create(User user) {
        RefreshToken token = new RefreshToken(
                user,
                UUID.randomUUID().toString(),
                Instant.now().plus(jwtProperties.refreshTokenExpiration()));
        return repository.save(token);
    }

    @Transactional(readOnly = true)
    public RefreshToken verify(String token) {
        RefreshToken refreshToken = repository.findByToken(token)
                .orElseThrow(() -> new TokenRefreshException(ErrorCode.TOKEN_INVALID));
        if (refreshToken.isRevoked()) {
            throw new TokenRefreshException(ErrorCode.TOKEN_REVOKED);
        }
        if (refreshToken.isExpired()) {
            throw new TokenRefreshException(ErrorCode.TOKEN_EXPIRED);
        }
        return refreshToken;
    }

    @Transactional
    public void revoke(String token) {
        repository.findByToken(token).ifPresent(rt -> {
            rt.setRevoked(true);
            repository.save(rt);
        });
    }
}

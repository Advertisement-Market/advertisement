package com.theadbasket.backend.auth;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

/** Spring Data JPA repository for {@link RefreshToken}. */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    /**
     * Revokes all active refresh tokens for a user (used on role promotion so stale sessions on
     * other devices cannot silently refresh after a privilege change).
     *
     * <p>{@code flushAutomatically = true} flushes pending managed-entity mutations (such as the
     * user's promoted role) before executing the bulk update; {@code clearAutomatically = false}
     * keeps the {@code User} entity managed in the current persistence context for subsequent
     * {@code RefreshToken} creation.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = false)
    @Query("update RefreshToken t set t.revoked = true where t.user.id = :userId and t.revoked = false")
    int revokeAllActiveByUserId(@Param("userId") Long userId);

    /**
     * Deletes refresh tokens created before {@code cutoff}. Old rows are pure housekeeping —
     * expired/rotated tokens are never read again. In production this runs as a scheduled
     * {@code pg_cron} job inside PostgreSQL (see {@code backend/docker/pg_cron}); the JPQL here
     * keeps the delete predicate unit-tested and gives the app a manual-trigger path.
     *
     * <p>The predicate uses the {@code createdAt} entity field, which maps to the {@code created_ts}
     * column after the schema normalization migration.
     *
     * @return the number of rows deleted
     */
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("delete from RefreshToken t where t.createdAt < :cutoff")
    int deleteByCreatedAtBefore(@Param("cutoff") Instant cutoff);
}

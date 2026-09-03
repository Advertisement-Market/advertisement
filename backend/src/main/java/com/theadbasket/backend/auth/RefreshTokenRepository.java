package com.theadbasket.backend.auth;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository for {@link RefreshToken}. */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    /**
     * Deletes refresh tokens created before {@code cutoff}. Old rows are pure housekeeping —
     * expired/rotated tokens are never read again. In production this runs as a scheduled
     * {@code pg_cron} job inside PostgreSQL (see {@code backend/docker/pg_cron}); the JPQL here
     * keeps the delete predicate unit-tested and gives the app a manual-trigger path.
     *
     * @return the number of rows deleted
     */
    @Modifying
    @Query("delete from RefreshToken t where t.createdAt < :cutoff")
    int deleteByCreatedAtBefore(@Param("cutoff") Instant cutoff);
}

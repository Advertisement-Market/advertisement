package com.theadbasket.backend.owner;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.theadbasket.backend.availability.AvailabilityBlockType;
import com.theadbasket.backend.availability.BillboardAvailabilityBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.stereotype.Repository;

@Repository
public interface BillboardListingRepository extends JpaRepository<BillboardListing, Long> {

    List<BillboardListing> findByUserId(Long userId);

    List<BillboardListing> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<BillboardListing> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndStatus(Long id, BillboardStatus status);

    // Note: jakarta.persistence.lock.timeout is kept as a portable JPA hint, but Hibernate's
    // PostgreSQL dialect ignores positive numeric values (Postgres only supports NOWAIT and SKIP LOCKED in SQL).
    // The actual 5-second lock timeout is enforced at the connection level via HikariCP's
    // connection-init-sql ("SET lock_timeout = '5s'") in PostgreSQL profiles (application-prod.yml, application-staging.yml).
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({
            @QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000")
    })
    @Query("SELECT b FROM BillboardListing b WHERE b.id = :id")
    Optional<BillboardListing> findByIdForUpdate(@Param("id") Long id);

    // Note: Connection-level lock timeout ("SET lock_timeout = '5s'") applies here as well.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({
            @QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000")
    })
    @Query("SELECT b FROM BillboardListing b WHERE b.id = :id AND b.user.id = :userId")
    Optional<BillboardListing> findByIdAndUserIdForUpdate(@Param("id") Long id, @Param("userId") Long userId);

    long countByUserId(Long userId);

    List<BillboardListing> findByStatusOrderByCreatedAtDesc(BillboardStatus status);

    @Query("""
        SELECT b FROM BillboardListing b
        WHERE b.status = com.theadbasket.backend.owner.BillboardStatus.ACTIVE
          AND NOT EXISTS (
            SELECT 1 FROM BillboardAvailabilityBlock ab
            WHERE ab.billboardId = b.id
              AND ab.startDate <= :to
              AND ab.endDate >= :from
              AND (
                ab.blockType != com.theadbasket.backend.availability.AvailabilityBlockType.BOOKING_HOLD
                OR (ab.expiryTs IS NOT NULL AND ab.expiryTs > :now)
              )
          )
    """)
    List<BillboardListing> findAvailableListings(
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("now") Instant now
    );
}

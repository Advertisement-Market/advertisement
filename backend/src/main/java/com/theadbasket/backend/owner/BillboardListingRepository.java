package com.theadbasket.backend.owner;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BillboardListingRepository extends JpaRepository<BillboardListing, Long> {

    List<BillboardListing> findByUserId(Long userId);

    List<BillboardListing> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<BillboardListing> findByIdAndUserId(Long id, Long userId);

    // Note: jakarta.persistence.lock.timeout is kept as a portable JPA hint, but Hibernate's
    // PostgreSQL dialect ignores positive numeric values (Postgres only supports NOWAIT and SKIP LOCKED in SQL).
    // The actual 5-second lock timeout is enforced at the connection level via HikariCP's
    // connection-init-sql ("SET lock_timeout = '5s'") in PostgreSQL profiles (application-prod.yml, application-staging.yml).
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.QueryHints({
            @jakarta.persistence.QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000")
    })
    @org.springframework.data.jpa.repository.Query("SELECT b FROM BillboardListing b WHERE b.id = :id")
    Optional<BillboardListing> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    // Note: Connection-level lock timeout ("SET lock_timeout = '5s'") applies here as well.
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.QueryHints({
            @jakarta.persistence.QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000")
    })
    @org.springframework.data.jpa.repository.Query("SELECT b FROM BillboardListing b WHERE b.id = :id AND b.user.id = :userId")
    Optional<BillboardListing> findByIdAndUserIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("userId") Long userId);

    long countByUserId(Long userId);

    List<BillboardListing> findByStatusOrderByCreatedAtDesc(BillboardStatus status);
}

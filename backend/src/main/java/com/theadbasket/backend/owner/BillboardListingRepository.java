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

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT b FROM BillboardListing b WHERE b.id = :id")
    Optional<BillboardListing> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    long countByUserId(Long userId);

    List<BillboardListing> findByStatusOrderByCreatedAtDesc(BillboardStatus status);
}

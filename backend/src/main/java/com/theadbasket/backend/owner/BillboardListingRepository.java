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
}

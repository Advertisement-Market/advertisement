package com.theadbasket.backend.owner;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillboardListingRepository extends JpaRepository<BillboardListing, Long> {

    List<BillboardListing> findByUserId(Long userId);
}

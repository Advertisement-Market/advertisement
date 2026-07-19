package com.theadbasket.backend.advertiser;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdvertiserProfileRepository extends JpaRepository<AdvertiserProfile, Long> {

    Optional<AdvertiserProfile> findByUserId(Long userId);
}

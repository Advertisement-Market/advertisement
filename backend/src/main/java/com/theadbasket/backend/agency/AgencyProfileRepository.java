package com.theadbasket.backend.agency;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgencyProfileRepository extends JpaRepository<AgencyProfile, Long> {

    Optional<AgencyProfile> findByUserId(Long userId);
}

package com.theadbasket.backend.owner;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OwnerProfileRepository extends JpaRepository<OwnerProfile, Long> {

    Optional<OwnerProfile> findByUserId(Long userId);
}
